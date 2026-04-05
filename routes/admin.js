/**
 * 管理员认证路由
 * 登录、登出、修改密码
 */

const express = require('express')
const router = express.Router()
const db = require('../services/database')
const { hashPassword, verifyPassword } = require('../services/passwordHash')
const jwt = require('jsonwebtoken')

// JWT 密钥（从环境变量获取，禁止硬编码）
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

if (!JWT_SECRET) {
  console.error('❌ 错误：JWT_SECRET 环境变量未设置')
  console.error('请在 .env 文件中配置：JWT_SECRET=your_secret_key_at_least_32_chars')
  process.exit(1)
}

/**
 * 初始化管理员表
 */
let retryCount = 0
const MAX_RETRIES = 10

async function initAdminTable() {
  try {
    // 等待数据库连接
    if (!db.pool) {
      if (retryCount < MAX_RETRIES) {
        retryCount++
        console.log(`⏳ 等待数据库连接后再初始化管理员表... (${retryCount}/${MAX_RETRIES})`)
        setTimeout(initAdminTable, 500)
        return
      } else {
        console.error('❌ 数据库连接重试次数超限，无法初始化管理员表')
        return
      }
    }

    // 检查表是否存在
    const tableExists = await db.get(
      `SELECT TABLE_NAME FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_credentials'`
    )

    if (!tableExists) {
      // 创建管理员凭证表
      await db.run(`
        CREATE TABLE admin_credentials (
          id INT PRIMARY KEY AUTO_INCREMENT,
          username VARCHAR(50) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      console.log('✅ 管理员凭证表创建成功')
    }
  } catch (error) {
    console.error('初始化管理员表失败:', error)
  }
}

// 延迟初始化表（等待数据库连接）
setTimeout(initAdminTable, 1000)

/**
 * 检查是否已初始化管理员
 */
router.get('/status', async (req, res) => {
  try {
    const admin = await db.get('SELECT id, username, created_at FROM admin_credentials LIMIT 1')
    res.json({
      initialized: !!admin,
      username: admin?.username || null
    })
  } catch (error) {
    res.status(500).json({ error: '检查状态失败' })
  }
})

/**
 * 首次初始化管理员
 */
router.post('/init', async (req, res) => {
  try {
    // 检查是否已存在管理员
    const existing = await db.get('SELECT id FROM admin_credentials LIMIT 1')
    if (existing) {
      return res.status(400).json({ error: '管理员已存在，无法重复初始化' })
    }

    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度不能少于6位' })
    }

    // 哈希密码
    const passwordHash = await hashPassword(password)

    // 插入管理员
    await db.run('INSERT INTO admin_credentials (username, password_hash) VALUES (?, ?)', [
      username,
      passwordHash
    ])

    console.log(`✅ 管理员 "${username}" 初始化成功`)
    res.json({ success: true, message: '管理员初始化成功' })
  } catch (error) {
    console.error('初始化管理员失败:', error)
    res.status(500).json({ error: '初始化失败' })
  }
})

/**
 * 管理员登录
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    // 查询管理员
    const admin = await db.get(
      'SELECT id, username, password_hash FROM admin_credentials WHERE username = ?',
      [username]
    )

    if (!admin) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    // 验证密码
    const isValid = await verifyPassword(password, admin.password_hash)
    if (!isValid) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    // 生成 JWT
    const token = jwt.sign({ id: admin.id, username: admin.username, isAdmin: true }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    })

    console.log(`✅ 管理员 "${username}" 登录成功`)
    res.json({
      success: true,
      token,
      username: admin.username,
      expiresIn: JWT_EXPIRES_IN
    })
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({ error: '登录失败' })
  }
})

/**
 * 修改密码
 */
router.post('/change-password', async (req, res) => {
  try {
    // 验证 Token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未登录' })
    }

    const token = authHeader.substring(7)
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      return res.status(401).json({ error: '登录已过期，请重新登录' })
    }

    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '旧密码和新密码不能为空' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码长度不能少于6位' })
    }

    // 查询管理员
    const admin = await db.get('SELECT id, password_hash FROM admin_credentials WHERE id = ?', [
      decoded.id
    ])

    if (!admin) {
      return res.status(404).json({ error: '管理员不存在' })
    }

    // 验证旧密码
    const isValid = await verifyPassword(oldPassword, admin.password_hash)
    if (!isValid) {
      return res.status(400).json({ error: '旧密码错误' })
    }

    // 哈希新密码
    const newPasswordHash = await hashPassword(newPassword)

    // 更新密码
    await db.run('UPDATE admin_credentials SET password_hash = ? WHERE id = ?', [
      newPasswordHash,
      decoded.id
    ])

    console.log(`✅ 管理员 "${decoded.username}" 密码修改成功`)
    res.json({ success: true, message: '密码修改成功' })
  } catch (error) {
    console.error('修改密码失败:', error)
    res.status(500).json({ error: '修改密码失败' })
  }
})

/**
 * 验证 Token（用于前端检查登录状态）
 */
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false, error: '未登录' })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET)

    res.json({
      valid: true,
      username: decoded.username,
      isAdmin: decoded.isAdmin
    })
  } catch (err) {
    res.status(401).json({ valid: false, error: '登录已过期' })
  }
})

/**
 * 验证数据库管理权限（二次验证）
 */
router.post('/verify-data-management', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false, error: '未登录' })
    }

    const token = authHeader.substring(7)
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      return res.status(401).json({ valid: false, error: '登录已过期' })
    }

    const { password } = req.body
    if (!password) {
      return res.status(400).json({ valid: false, error: '请输入密码' })
    }

    // 查询管理员
    const admin = await db.get('SELECT id, password_hash FROM admin_credentials WHERE id = ?', [
      decoded.id
    ])

    if (!admin) {
      return res.status(404).json({ valid: false, error: '管理员不存在' })
    }

    // 验证密码
    const isValid = await verifyPassword(password, admin.password_hash)
    if (!isValid) {
      return res.status(400).json({ valid: false, error: '密码错误' })
    }

    res.json({ valid: true, message: '验证成功' })
  } catch (error) {
    console.error('数据库管理验证失败:', error)
    res.status(500).json({ valid: false, error: '验证失败' })
  }
})

module.exports = router
