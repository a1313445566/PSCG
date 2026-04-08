/**
 * 管理员权限验证中间件
 * 使用 JWT Token 验证
 */

const jwt = require('jsonwebtoken')
const db = require('../services/database')

// JWT 密钥（从环境变量获取）
const JWT_SECRET = process.env.JWT_SECRET

/**
 * 验证管理员权限
 * 通过检查 Authorization 请求头中的 JWT Token
 */
async function adminAuth(req, res, next) {
  try {
    // 检查 JWT_SECRET 是否配置
    if (!JWT_SECRET) {
      console.error('❌ 错误：JWT_SECRET 环境变量未设置')
      return res.status(500).json({ error: '服务器配置错误，请联系管理员' })
    }

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

    // 验证 JWT
    const decoded = jwt.verify(token, JWT_SECRET)

    // 检查是否是管理员
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: '权限不足' })
    }

    // 验证管理员 ID 有效性（防止 SQL 注入）
    if (!decoded.id || isNaN(decoded.id) || !Number.isInteger(decoded.id)) {
      console.error('❌ 无效的管理员 ID:', decoded.id)
      return res.status(401).json({ error: '无效的管理员 ID' })
    }

    // 从数据库获取管理员权限信息
    let adminRows
    try {
      ;[adminRows] = await db.pool.execute(
        `SELECT a.id, a.username, a.role_id, r.name as role_name, r.is_preset, r.permissions
         FROM admin_credentials a
         LEFT JOIN admin_roles r ON a.role_id = r.id
         WHERE a.id = ? AND a.status = 'active'`,
        [decoded.id]
      )
    } catch (dbError) {
      console.error('[adminAuth] 数据库查询失败:', dbError)
      return res.status(500).json({ error: '数据库查询失败，请稍后重试' })
    }

    if (!adminRows || adminRows.length === 0) {
      return res.status(401).json({ error: '管理员账户不存在或已禁用' })
    }

    const admin = adminRows[0]

    // 基于角色名称和预设标记判断是否为超级管理员（而非硬编码ID）
    // 超级管理员特征：预设角色 + 角色名称为"超级管理员"
    const isSuper = admin.is_preset === 1 && admin.role_name === '超级管理员'

    let permissions = {}
    if (admin.permissions) {
      try {
        permissions =
          typeof admin.permissions === 'string' ? JSON.parse(admin.permissions) : admin.permissions
      } catch (parseError) {
        console.error('[adminAuth] 解析权限数据失败:', parseError)
        permissions = {} // 解析失败时使用空权限
      }
    }

    // 超级管理员权限硬编码
    if (isSuper) {
      const allModules = [
        'dashboard',
        'questions',
        'subjects',
        'grades-classes',
        'user-stats',
        'recent-records',
        'user-management',
        'data-analysis',
        'ai-chat',
        'ai-models',
        'basic-settings',
        'database',
        'security',
        'admin-users',
        'admin-roles'
      ]
      permissions = {}
      allModules.forEach(module => {
        permissions[module] = {
          view: true,
          create: true,
          edit: true,
          delete: true,
          batch: true,
          backup: true,
          restore: true,
          cleanup: true,
          'block-ip': true,
          'unblock-ip': true
        }
      })
    }

    // 将用户信息附加到请求对象
    req.admin = {
      id: admin.id,
      username: admin.username,
      roleId: admin.role_id,
      isSuper,
      permissions
    }

    next()
  } catch (err) {
    console.error('[adminAuth] 权限验证失败:', err)

    // 区分不同类型的错误
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '登录已过期，请重新登录' })
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '无效的登录凭证' })
    }

    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      console.error('[adminAuth] 数据库连接失败:', err.code)
      return res.status(503).json({ error: '服务暂时不可用，请稍后重试' })
    }

    // 其他未知错误
    return res.status(500).json({ error: '权限验证失败，请稍后重试' })
  }
}

module.exports = adminAuth
