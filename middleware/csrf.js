/**
 * CSRF 防护中间件
 * 用于防止跨站请求伪造攻击
 */

const crypto = require('crypto')

class CSRFProtection {
  constructor() {
    this.tokens = new Map() // token -> { expires, used }
    this.tokenExpiry = 2 * 60 * 60 * 1000 // 2小时有效
  }

  // 生成 CSRF Token
  generateToken(sessionId = 'default') {
    const token = crypto.randomBytes(32).toString('hex')
    this.tokens.set(token, {
      sessionId,
      expires: Date.now() + this.tokenExpiry,
      used: false
    })
    return token
  }

  // 验证 CSRF Token
  validateToken(token, sessionId = 'default') {
    if (!token) {
      return { valid: false, reason: '缺少CSRF Token' }
    }

    const record = this.tokens.get(token)

    if (!record) {
      return { valid: false, reason: '无效的Token' }
    }

    if (Date.now() > record.expires) {
      this.tokens.delete(token)
      return { valid: false, reason: 'Token已过期' }
    }

    if (record.sessionId !== sessionId) {
      return { valid: false, reason: 'Token不匹配' }
    }

    return { valid: true }
  }

  // 清理过期 Token
  cleanup() {
    const now = Date.now()
    let cleaned = 0
    for (const [token, record] of this.tokens) {
      if (now > record.expires) {
        this.tokens.delete(token)
        cleaned++
      }
    }
    return cleaned
  }

  // 获取统计信息
  getStats() {
    return {
      total: this.tokens.size,
      valid: Array.from(this.tokens.values()).filter(r => Date.now() <= r.expires).length
    }
  }
}

const csrf = new CSRFProtection()

// 定期清理过期 Token（每小时）
setInterval(
  () => {
    const cleaned = csrf.cleanup()
    if (cleaned > 0) {
      console.log(`[CSRF] 清理了 ${cleaned} 个过期 Token`)
    }
  },
  60 * 60 * 1000
)

// CSRF Token 生成中间件
function csrfTokenMiddleware(req, res, next) {
  // 生成新的 CSRF Token
  const sessionId = req.ip || 'default'
  req.csrfToken = csrf.generateToken(sessionId)
  res.locals.csrfToken = req.csrfToken
  next()
}

// CSRF 验证中间件
function csrfVerifyMiddleware(req, res, next) {
  // GET、HEAD、OPTIONS 请求不需要验证
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }

  // 从请求头或请求体获取 Token
  const token = req.headers['x-csrf-token'] || req.body?._csrf

  const sessionId = req.ip || 'default'
  const validation = csrf.validateToken(token, sessionId)

  if (!validation.valid) {
    console.warn(`[CSRF] 验证失败: ${validation.reason}, IP: ${req.ip}`)
    return res.status(403).json({
      success: false,
      error: validation.reason
    })
  }

  next()
}

// 可选的 CSRF 验证（用于某些接口需要灵活控制）
function optionalCSRFMiddleware(req, res, next) {
  const token = req.headers['x-csrf-token'] || req.body?._csrf

  if (token) {
    const sessionId = req.ip || 'default'
    const validation = csrf.validateToken(token, sessionId)
    req.csrfValid = validation.valid
  } else {
    req.csrfValid = false
  }

  next()
}

module.exports = {
  csrf,
  csrfTokenMiddleware,
  csrfVerifyMiddleware,
  optionalCSRFMiddleware
}
