/**
 * 健康检查路由
 * 文件: routes/health.js
 * 功能: 服务健康状态检查
 */

const express = require('express')
const router = express.Router()
const db = require('../services/database')

/**
 * GET /api/health
 * 基础健康检查
 */
router.get('/', async (req, res) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: process.memoryUsage().heapUsed / 1024 / 1024,
      total: process.memoryUsage().heapTotal / 1024 / 1024
    }
  }

  res.json(healthStatus)
})

/**
 * GET /api/health/database
 * 数据库连接检查
 */
router.get('/database', async (req, res) => {
  try {
    // 测试数据库连接
    await db.query('SELECT 1 as test')

    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * GET /api/health/detailed
 * 详细健康检查
 */
router.get('/detailed', async (req, res) => {
  const checks = {
    server: { status: 'ok', uptime: process.uptime() },
    database: { status: 'unknown' },
    memory: {
      status: 'ok',
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    }
  }

  // 数据库检查
  try {
    await db.query('SELECT 1 as test')
    checks.database.status = 'ok'
  } catch (error) {
    checks.database.status = 'error'
    checks.database.error = error.message
  }

  // 判断总体状态
  const allOk = Object.values(checks).every(check => check.status === 'ok')

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'error',
    checks,
    timestamp: new Date().toISOString()
  })
})

module.exports = router
