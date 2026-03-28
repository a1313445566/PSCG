/**
 * 管理员权限验证中间件
 * 使用 JWT Token 验证
 */

const jwt = require('jsonwebtoken')

// JWT 密钥（与 routes/admin.js 保持一致）
const JWT_SECRET = process.env.JWT_SECRET || 'pscg-admin-secret-key-change-in-production'

/**
 * 验证管理员权限
 * 通过检查 Authorization 请求头中的 JWT Token
 */
function adminAuth(req, res, next) {
  // 方式1：通过 Authorization header (Bearer token)
  const authHeader = req.headers.authorization

  // 方式2：通过自定义 header (X-Admin-Token)
  const adminToken = req.headers['x-admin-token']

  let token = null

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else if (adminToken) {
    token = adminToken
  }

  if (!token) {
    return res.status(401).json({ error: '未登录，请先登录管理后台' })
  }

  try {
    // 验证 JWT
    const decoded = jwt.verify(token, JWT_SECRET)

    // 检查是否是管理员
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: '权限不足' })
    }

    // 将用户信息附加到请求对象
    req.admin = {
      id: decoded.id,
      username: decoded.username
    }

    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '登录已过期，请重新登录' })
    }
    return res.status(401).json({ error: '无效的登录凭证' })
  }
}

module.exports = adminAuth
