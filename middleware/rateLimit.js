/**
 * IP 限流中间件
 * 防止恶意高频请求
 */

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 时间窗口（默认1分钟）
    this.maxRequests = options.maxRequests || 100; // 窗口内最大请求数
    this.blockDuration = options.blockDuration || 300000; // 封禁时长（默认5分钟）
    this.whitelist = options.whitelist || ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
    
    // 存储结构：Map<IP, { count, firstRequestTime, blocked }>
    this.requests = new Map();
    this.blockedIPs = new Map();
    
    // 定期清理过期数据
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  // 获取客户端真实 IP
  getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           'unknown';
  }

  // 检查是否在白名单
  isWhitelisted(ip) {
    return this.whitelist.includes(ip);
  }

  // 检查是否被封禁
  isBlocked(ip) {
    const blockInfo = this.blockedIPs.get(ip);
    if (!blockInfo) return false;
    
    if (Date.now() > blockInfo.expiresAt) {
      this.blockedIPs.delete(ip);
      return false;
    }
    
    return true;
  }

  // 记录请求
  recordRequest(ip) {
    const now = Date.now();
    let info = this.requests.get(ip);
    
    if (!info || now - info.firstRequestTime > this.windowMs) {
      // 新窗口
      info = {
        count: 1,
        firstRequestTime: now
      };
    } else {
      // 累加请求
      info.count++;
    }
    
    this.requests.set(ip, info);
    
    // 检查是否超出限制
    if (info.count > this.maxRequests) {
      this.blockIP(ip);
      return { allowed: false, reason: 'rate_limit_exceeded', retryAfter: this.blockDuration };
    }
    
    return { 
      allowed: true, 
      remaining: this.maxRequests - info.count,
      resetTime: info.firstRequestTime + this.windowMs
    };
  }

  // 封禁 IP
  blockIP(ip) {
    this.blockedIPs.set(ip, {
      expiresAt: Date.now() + this.blockDuration,
      reason: 'rate_limit_exceeded'
    });
    
    console.warn(`🚫 [限流] IP ${ip} 已被封禁 ${this.blockDuration / 1000} 秒`);
  }

  // 手动封禁 IP
  manualBlock(ip, duration = 3600000) {
    this.blockedIPs.set(ip, {
      expiresAt: Date.now() + duration,
      reason: 'manual_block'
    });
  }

  // 解除封禁
  unblock(ip) {
    this.blockedIPs.delete(ip);
    this.requests.delete(ip);
  }

  // 解除所有封禁（标准方法）
  unblockAll() {
    const blockedCount = this.blockedIPs.size;
    const requestCount = this.requests.size;
    
    this.blockedIPs.clear();
    this.requests.clear();
    
    return {
      blockedCount,
      requestCount,
      clearedAt: new Date().toISOString()
    };
  }

  // 清理过期数据
  cleanup() {
    const now = Date.now();
    
    // 清理过期请求记录
    for (const [ip, info] of this.requests.entries()) {
      if (now - info.firstRequestTime > this.windowMs) {
        this.requests.delete(ip);
      }
    }
    
    // 清理过期封禁
    for (const [ip, info] of this.blockedIPs.entries()) {
      if (now > info.expiresAt) {
        this.blockedIPs.delete(ip);
      }
    }
  }

  // 获取统计信息
  getStats() {
    return {
      activeIPs: this.requests.size,
      blockedIPs: this.blockedIPs.size,
      blockedList: Array.from(this.blockedIPs.entries()).map(([ip, info]) => ({
        ip,
        reason: info.reason,
        remainingTime: Math.max(0, info.expiresAt - Date.now())
      }))
    };
  }

  // Express 中间件
  middleware() {
    return (req, res, next) => {
      const ip = this.getClientIP(req);
      
      // 白名单放行
      if (this.isWhitelisted(ip)) {
        return next();
      }
      
      // 检查是否被封禁
      if (this.isBlocked(ip)) {
        const blockInfo = this.blockedIPs.get(ip);
        const remainingTime = Math.ceil((blockInfo.expiresAt - Date.now()) / 1000);
        
        res.setHeader('Retry-After', remainingTime);
        return res.status(429).json({
          error: '请求过于频繁，请稍后再试',
          retryAfter: remainingTime
        });
      }
      
      // 记录请求
      const result = this.recordRequest(ip);
      
      if (!result.allowed) {
        res.setHeader('Retry-After', this.blockDuration / 1000);
        return res.status(429).json({
          error: '请求过于频繁，请稍后再试',
          retryAfter: this.blockDuration / 1000
        });
      }
      
      // 设置响应头
      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.resetTime);
      
      next();
    };
  }
}

// 创建全局限流器实例
const globalLimiter = new RateLimiter({
  windowMs: 60000,      // 1分钟
  maxRequests: 300,     // 每分钟最多 300 次请求
  blockDuration: 60000  // 超限后封禁 1 分钟
});

// 创建 API 限流器实例（普通使用）
const apiLimiter = new RateLimiter({
  windowMs: 60000,      // 1分钟
  maxRequests: 200,     // 每分钟最多 200 次请求（后台加载需要并发）
  blockDuration: 60000  // 超限后封禁 1 分钟
});

// 创建提交限流器实例（最严格 - 防刷分）
const submitLimiter = new RateLimiter({
  windowMs: 60000,      // 1分钟
  maxRequests: 10,      // 每分钟最多 10 次提交
  blockDuration: 300000 // 超限后封禁 5 分钟
});

module.exports = {
  RateLimiter,
  globalLimiter,
  apiLimiter,
  submitLimiter
};
