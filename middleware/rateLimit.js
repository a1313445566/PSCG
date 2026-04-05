/**
 * IP/用户限流中间件
 * 防止恶意高频请求
 *
 * 支持：
 * - 用户 ID 限流（登录用户独立配额，适配学校 NAT 环境）
 * - IP 限流（未登录用户，防止匿名攻击）
 * - IP 白名单
 * - JWT Token 验证（优先从 token 解析用户 ID）
 * - 封禁持久化（数据库存储，服务重启后恢复）
 */

const jwt = require('jsonwebtoken')

// JWT 密钥（从环境变量获取，可选）
const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  console.warn('⚠️ [限流] JWT_SECRET 未设置，将跳过 JWT 验证，使用降级方案（仅基于 IP 限流）')
}

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000 // 时间窗口（默认1分钟）
    this.maxRequests = options.maxRequests || 100 // 用户最大请求数
    this.maxRequestsForIP = options.maxRequestsForIP || options.maxRequests || 100 // IP 最大请求数（支持 NAT）
    this.blockDuration = options.blockDuration || 300000 // 封禁时长（默认5分钟）
    this.whitelist = options.whitelist || ['127.0.0.1', '::1', '::ffff:127.0.0.1']
    this.keyGenerator = options.keyGenerator || null // 自定义 key 生成器
    this.db = null // 数据库实例（用于持久化）

    // 存储结构：Map<key, { count, firstRequestTime, blocked, type }>
    this.requests = new Map()
    this.blockedKeys = new Map()

    // 定期清理过期数据
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
  }

  // 设置数据库实例
  setDatabase(db) {
    this.db = db
  }

  // 从数据库加载封禁数据（服务启动时调用）
  async loadBlocksFromDB() {
    if (!this.db) return

    try {
      // 先检查表是否存在
      const tables = await this.db.query("SHOW TABLES LIKE 'ip_blocks'")
      if (!tables || tables.length === 0) {
        console.log('[限流] ip_blocks 表不存在，跳过加载')
        return
      }

      const now = Date.now()
      // 只加载未过期的封禁
      const blocks = await this.db.query(
        'SELECT ip, expires_at, reason FROM ip_blocks WHERE expires_at > ?',
        [now]
      )

      if (blocks && blocks.length > 0) {
        for (const block of blocks) {
          const key = `ip:${block.ip}`
          this.blockedKeys.set(key, {
            expiresAt: block.expires_at,
            reason: block.reason || 'manual_block',
            type: 'ip'
          })
        }
        console.log(`✅ [限流] 从数据库恢复了 ${blocks.length} 个封禁记录`)
      }

      // 清理已过期的封禁记录
      await this.db.run('DELETE FROM ip_blocks WHERE expires_at <= ?', [now])
    } catch (error) {
      console.error('[限流] 加载封禁数据失败:', error)
    }
  }

  // 销毁实例，清理定时器（防止内存泄漏）
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    // 清空存储
    this.requests.clear()
    this.blockedKeys.clear()
  }

  // 获取客户端真实 IP
  getClientIP(req) {
    return (
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      'unknown'
    )
  }

  // 获取用户 ID（优先从 JWT token 解析，确保安全性）
  getUserId(req) {
    // 1. 优先从 JWT token 解析（需要 JWT_SECRET）
    if (JWT_SECRET) {
      const authHeader = req.headers['authorization']
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7)
          const decoded = jwt.verify(token, JWT_SECRET)
          if (decoded && decoded.userId) {
            return `user:${decoded.userId}`
          }
        } catch (err) {
          // token 无效或过期，继续尝试其他方式
        }
      }
    }

    // 2. 从请求体获取（仅作为后备，存在安全风险）
    // 注意：请求体中的 student_id 可被篡改，仅用于限流目的
    if (req.body?.student_id) {
      return `user:student:${req.body.student_id}`
    }

    // 3. 从请求头获取（仅作为后备）
    if (req.headers['x-student-id']) {
      return `user:student:${req.headers['x-student-id']}`
    }

    // 4. 从 URL 参数获取（支持 GET 请求）
    if (req.query?.studentId || req.query?.student_id) {
      return `user:student:${req.query.studentId || req.query.student_id}`
    }

    // 5. 从 URL 路径获取（如 /users/stats/:userId）
    if (req.params?.userId) {
      return `user:${req.params.userId}`
    }

    return null
  }

  // 获取限流 key
  getRateLimitKey(req) {
    // 如果有自定义 key 生成器，使用它
    if (this.keyGenerator) {
      return this.keyGenerator(req)
    }

    // 优先使用用户 ID（登录用户独立配额）
    const userId = this.getUserId(req)
    if (userId) {
      return userId
    }

    // 未登录用户使用 IP
    const ip = this.getClientIP(req)
    return `ip:${ip}`
  }

  // 检查 IP 是否在白名单
  isWhitelisted(req) {
    const ip = this.getClientIP(req)
    return this.whitelist.includes(ip)
  }

  // 检查是否被封禁
  isBlocked(key) {
    const blockInfo = this.blockedKeys.get(key)
    if (!blockInfo) return false

    if (Date.now() > blockInfo.expiresAt) {
      this.blockedKeys.delete(key)
      return false
    }

    return true
  }

  // 记录请求
  recordRequest(key) {
    const now = Date.now()
    let info = this.requests.get(key)

    if (!info || now - info.firstRequestTime > this.windowMs) {
      // 新窗口
      info = {
        count: 1,
        firstRequestTime: now,
        type: key.startsWith('user:') ? 'user' : 'ip'
      }
    } else {
      // 累加请求
      info.count++
    }

    this.requests.set(key, info)

    // 根据类型使用不同的限制
    const maxLimit = key.startsWith('user:') ? this.maxRequests : this.maxRequestsForIP

    // 检查是否超出限制
    if (info.count > maxLimit) {
      this.blockKey(key)
      return { allowed: false, reason: 'rate_limit_exceeded', retryAfter: this.blockDuration }
    }

    return {
      allowed: true,
      remaining: maxLimit - info.count,
      resetTime: info.firstRequestTime + this.windowMs
    }
  }

  // 封禁 key
  blockKey(key) {
    this.blockedKeys.set(key, {
      expiresAt: Date.now() + this.blockDuration,
      reason: 'rate_limit_exceeded',
      type: key.startsWith('user:') ? 'user' : 'ip'
    })

    const type = key.startsWith('user:') ? '用户' : 'IP'
    console.warn(`🚫 [限流] ${type} ${key} 已被封禁 ${this.blockDuration / 1000} 秒`)
  }

  // 手动封禁 IP（支持持久化）
  async manualBlock(ip, duration = 3600000) {
    const key = `ip:${ip}`
    const expiresAt = Date.now() + duration

    // 内存存储
    this.blockedKeys.set(key, {
      expiresAt,
      reason: 'manual_block',
      type: 'ip'
    })

    // 数据库持久化
    if (this.db) {
      try {
        await this.db.run(
          `INSERT INTO ip_blocks (ip, expires_at, reason)
           VALUES (?, ?, 'manual_block')
           ON DUPLICATE KEY UPDATE expires_at = ?, reason = 'manual_block'`,
          [ip, expiresAt, expiresAt]
        )
      } catch (error) {
        console.error('[限流] 持久化封禁失败:', error)
      }
    }
  }

  // 解除封禁（支持持久化）
  async unblock(ip) {
    const key = `ip:${ip}`

    // 内存删除
    this.blockedKeys.delete(key)
    this.requests.delete(key)

    // 数据库删除
    if (this.db) {
      try {
        await this.db.run('DELETE FROM ip_blocks WHERE ip = ?', [ip])
      } catch (error) {
        console.error('[限流] 删除封禁记录失败:', error)
      }
    }
  }

  // 解除所有封禁（标准方法，支持持久化）
  async unblockAll() {
    const blockedCount = this.blockedKeys.size
    const requestCount = this.requests.size

    // 内存清空
    this.blockedKeys.clear()
    this.requests.clear()

    // 数据库清空
    if (this.db) {
      try {
        await this.db.run('DELETE FROM ip_blocks')
      } catch (error) {
        console.error('[限流] 清空封禁记录失败:', error)
      }
    }

    return {
      blockedCount,
      requestCount,
      clearedAt: new Date().toISOString()
    }
  }

  // 清理过期数据
  cleanup() {
    const now = Date.now()

    // 清理过期请求记录
    for (const [key, info] of this.requests.entries()) {
      if (now - info.firstRequestTime > this.windowMs) {
        this.requests.delete(key)
      }
    }

    // 清理过期封禁
    for (const [key, info] of this.blockedKeys.entries()) {
      if (now > info.expiresAt) {
        this.blockedKeys.delete(key)
      }
    }
  }

  // 获取统计信息
  getStats() {
    // 统计用户和 IP 数量
    let userCount = 0
    let ipCount = 0

    for (const [key] of this.requests.entries()) {
      if (key.startsWith('user:')) {
        userCount++
      } else {
        ipCount++
      }
    }

    return {
      activeIPs: ipCount,
      activeUsers: userCount,
      activeKeys: this.requests.size,
      blockedIPs: this.blockedKeys.size,
      blockedList: Array.from(this.blockedKeys.entries()).map(([key, info]) => ({
        ip: key.startsWith('ip:') ? key.substring(3) : key,
        key: key,
        reason: info.reason,
        type: info.type,
        remainingTime: Math.max(0, info.expiresAt - Date.now())
      }))
    }
  }

  // Express 中间件
  middleware() {
    return (req, res, next) => {
      // IP 白名单放行
      if (this.isWhitelisted(req)) {
        return next()
      }

      // 获取限流 key
      const key = this.getRateLimitKey(req)

      // 调试日志（仅首次请求时打印，避免日志过多）
      const ip = this.getClientIP(req)
      if (!this.requests.has(key)) {
        const userId = this.getUserId(req)
        console.log(
          `📍 [限流] 新请求 - IP: ${ip}, Key: ${key}, userId来源: ${userId ? '已识别' : '未识别'}`
        )
      }

      // 检查是否被封禁
      if (this.isBlocked(key)) {
        const blockInfo = this.blockedKeys.get(key)
        const remainingTime = Math.ceil((blockInfo.expiresAt - Date.now()) / 1000)

        res.setHeader('Retry-After', remainingTime)
        return res.status(429).json({
          error: '请求过于频繁，请稍后再试',
          retryAfter: remainingTime,
          limitedBy: key.startsWith('user:') ? 'user' : 'ip'
        })
      }

      // 记录请求
      const result = this.recordRequest(key)

      if (!result.allowed) {
        res.setHeader('Retry-After', this.blockDuration / 1000)
        return res.status(429).json({
          error: '请求过于频繁，请稍后再试',
          retryAfter: this.blockDuration / 1000,
          limitedBy: key.startsWith('user:') ? 'user' : 'ip'
        })
      }

      // 设置响应头（根据类型显示不同的限制）
      const maxLimit = key.startsWith('user:') ? this.maxRequests : this.maxRequestsForIP
      res.setHeader('X-RateLimit-Limit', maxLimit)
      res.setHeader('X-RateLimit-Remaining', result.remaining)
      res.setHeader('X-RateLimit-Reset', result.resetTime)
      res.setHeader('X-RateLimit-Type', key.startsWith('user:') ? 'user' : 'ip')

      next()
    }
  }
}

// 创建全局限流器实例
const globalLimiter = new RateLimiter({
  windowMs: 60000, // 1分钟
  maxRequests: 500, // 用户最多 500 次/分钟
  maxRequestsForIP: 1000, // IP 最多 1000 次/分钟（支持 NAT 多用户）
  blockDuration: 60000 // 超限后封禁 1 分钟
})

// 创建 API 限流器实例（学校环境适配）
// 每个登录用户独立配额，不会因 NAT 共享 IP 而互相影响
const apiLimiter = new RateLimiter({
  windowMs: 60000, // 1分钟
  maxRequests: 150, // 每个用户最多 150 次/分钟
  maxRequestsForIP: 1000, // IP 最多 1000 次/分钟（支持 50 人 NAT 环境，每人 20 次公共请求）
  blockDuration: 60000 // 超限后封禁 1 分钟
})

// 创建提交限流器实例（防刷分）
const submitLimiter = new RateLimiter({
  windowMs: 60000, // 1分钟
  maxRequests: 20, // 每个用户每分钟最多 20 次提交（每3秒可提交一次）
  maxRequestsForIP: 500, // IP 最多 500 次/分钟（防御匿名攻击）
  blockDuration: 60000 // 超限后封禁 1 分钟
})

module.exports = {
  RateLimiter,
  globalLimiter,
  apiLimiter,
  submitLimiter
}
