/**
 * 签名缓存中间件
 * 防止签名重放攻击
 */

class SignatureCache {
  constructor(options = {}) {
    this.maxAge = options.maxAge || 300000 // 签名有效期（默认5分钟）
    this.maxSize = options.maxSize || 100000 // 最大缓存数量

    // 存储已使用的签名：Map<signatureHash, { usedAt, quizId, userId }>
    this.usedSignatures = new Map()

    // 定期清理过期数据
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
  }

  // 生成签名唯一标识（避免存储完整签名）
  hashSignature(signature, quizId, userId) {
    const crypto = require('crypto')
    return crypto
      .createHash('sha256')
      .update(`${signature}:${quizId}:${userId}`)
      .digest('hex')
      .substring(0, 32)
  }

  // 检查签名是否已使用
  isUsed(signature, quizId, userId) {
    const hash = this.hashSignature(signature, quizId, userId)
    const record = this.usedSignatures.get(hash)

    if (!record) return false

    // 检查是否过期（虽然签名本身有时间限制，但这里也检查）
    if (Date.now() - record.usedAt > this.maxAge) {
      this.usedSignatures.delete(hash)
      return false
    }

    return true
  }

  // 标记签名为已使用
  markAsUsed(signature, quizId, userId) {
    // 如果缓存已满，清理最旧的记录
    if (this.usedSignatures.size >= this.maxSize) {
      this.cleanupOldest()
    }

    const hash = this.hashSignature(signature, quizId, userId)
    this.usedSignatures.set(hash, {
      usedAt: Date.now(),
      quizId,
      userId
    })
  }

  // 清理过期数据
  cleanup() {
    const now = Date.now()
    let cleaned = 0

    for (const [hash, record] of this.usedSignatures.entries()) {
      if (now - record.usedAt > this.maxAge) {
        this.usedSignatures.delete(hash)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 [签名缓存] 清理了 ${cleaned} 条过期记录`)
    }
  }

  // 清理最旧的记录
  cleanupOldest() {
    const entries = Array.from(this.usedSignatures.entries())
    // 按使用时间排序，删除最旧的 10%
    const toDelete = entries
      .sort((a, b) => a[1].usedAt - b[1].usedAt)
      .slice(0, Math.floor(this.maxSize * 0.1))

    for (const [hash] of toDelete) {
      this.usedSignatures.delete(hash)
    }
  }

  // 获取统计信息
  getStats() {
    return {
      usedSignatures: this.usedSignatures.size,
      maxSize: this.maxSize,
      maxAge: this.maxAge
    }
  }

  // Express 中间件 - 检查签名是否已使用
  middleware() {
    return (req, res, next) => {
      const { quizId, signature } = req.body

      // 如果没有签名参数，跳过检查
      if (!signature || !quizId) {
        return next()
      }

      // 获取 userId（需要在验证后才能获取，所以这里只做标记）
      // 实际检查在路由处理中进行

      // 将签名缓存实例附加到请求对象
      req.signatureCache = this

      next()
    }
  }
}

// 创建全局实例
const signatureCache = new SignatureCache({
  maxAge: 300000, // 5 分钟
  maxSize: 100000 // 最多缓存 10 万条
})

module.exports = signatureCache
