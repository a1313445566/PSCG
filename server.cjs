/**
 * 服务器主入口文件（重构版）
 * 职责：中间件配置、路由挂载、服务启动
 */

require('dotenv').config()
const express = require('express')
const compression = require('compression')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')

const responseTime = require('./middleware/responseTime')
const { globalLimiter, apiLimiter, submitLimiter } = require('./middleware/rateLimit')
const signatureCache = require('./middleware/signatureCache')
const adminAuth = require('./middleware/adminAuth')
const { csrfTokenMiddleware, csrfVerifyMiddleware } = require('./middleware/csrf')
const { createPathTraversalGuard } = require('./middleware/pathTraversal')
const dbPerformanceMonitor = require('./middleware/dbPerformance')

const corsOptions = require('./config/cors')
const routes = require('./routes')
const db = require('./services/database')
const cacheService = require('./services/cache')
const {
  createSecurityLogsTable,
  logSecurityOperation,
  isValidIP,
  getSecurityLogs
} = require('./services/securityMonitor')
const { setupErrorHandlers } = require('./utils/errorHandler')

const app = express()
const port = process.env.SERVER_PORT || 3001

setupErrorHandlers()

app.use(cors(corsOptions))
app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  })
)
app.use(compression())
app.use(express.json({ encoding: 'utf-8', limit: '10mb' }))
app.use(express.urlencoded({ extended: true, encoding: 'utf-8', limit: '10mb' }))
app.use(responseTime)

app.use('/api', apiLimiter.middleware())
app.use('/api/quiz', signatureCache.middleware())

app.get('/api/csrf-token', csrfTokenMiddleware, (req, res) => {
  res.json({ success: true, csrfToken: res.locals.csrfToken })
})

app.use('/api', csrfVerifyMiddleware)

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
  }
  next()
})

app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
  }
  next()
})

app.use(
  express.static(path.join(__dirname, 'dist'), {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    immutable: false
  })
)

app.use(
  '/assets',
  express.static(path.join(__dirname, 'dist', 'assets'), {
    maxAge: '30d',
    etag: true,
    lastModified: false,
    immutable: true
  })
)

const staticDirs = ['audio', 'images', 'fonts']
staticDirs.forEach(dir => {
  app.use(
    `/${dir}`,
    createPathTraversalGuard(path.join(__dirname, dir)),
    express.static(path.join(__dirname, dir), {
      maxAge: '30d',
      etag: true,
      lastModified: true,
      immutable: dir === 'fonts'
    })
  )
})

app.use('/api', routes)

app.get('/api/cache/stats', (req, res) => {
  const stats = cacheService.getStats()
  res.json(stats)
})

app.post('/api/cache/clear', (req, res) => {
  cacheService.clear()
  res.json({ success: true, message: '缓存已清空' })
})

app.get('/api/security/rate-limit', adminAuth, (req, res) => {
  res.json({
    global: globalLimiter.getStats(),
    api: apiLimiter.getStats(),
    submit: submitLimiter.getStats()
  })
})

app.get('/api/security/signature-cache', adminAuth, (req, res) => {
  res.json(signatureCache.getStats())
})

app.post('/api/security/block-ip', adminAuth, async (req, res) => {
  try {
    const { ip, duration, reason } = req.body

    if (!ip) {
      return res.status(400).json({ error: '缺少 IP 参数' })
    }
    if (!isValidIP(ip)) {
      return res.status(400).json({ error: 'IP 地址格式不正确' })
    }

    await globalLimiter.manualBlock(ip, duration || 3600000)

    await logSecurityOperation({
      type: 'block',
      ip,
      duration: duration || 3600000,
      reason: reason || '未填写',
      operator: req.admin.username
    })

    res.json({ success: true, message: `IP ${ip} 已被封禁` })
  } catch (error) {
    console.error('[安全监控] 封禁 IP 失败:', error)
    res.status(500).json({ error: '封禁失败，请稍后重试' })
  }
})

app.post('/api/security/unblock-ip', adminAuth, async (req, res) => {
  try {
    const { ip, reason } = req.body

    if (!ip) {
      return res.status(400).json({ error: '缺少 IP 参数' })
    }

    await globalLimiter.unblock(ip)
    await apiLimiter.unblock(ip)
    await submitLimiter.unblock(ip)

    await logSecurityOperation({
      type: 'unblock',
      ip,
      reason: reason || '手动解封',
      operator: req.admin.username
    })

    res.json({ success: true, message: `IP ${ip} 已解除封禁` })
  } catch (error) {
    console.error('[安全监控] 解封 IP 失败:', error)
    res.status(500).json({ error: '解封失败，请稍后重试' })
  }
})

app.post('/api/security/unblock-all', adminAuth, async (req, res) => {
  try {
    const globalResult = await globalLimiter.unblockAll()
    const apiResult = await apiLimiter.unblockAll()
    const submitResult = await submitLimiter.unblockAll()

    const operator = req.admin?.username || 'unknown'
    await logSecurityOperation({
      type: 'unblock_all',
      ip: 'ALL',
      reason: '批量解封',
      operator,
      metadata: {
        global: globalResult,
        api: apiResult,
        submit: submitResult
      }
    })

    console.log(`🟢 [安全] 管理员 "${operator}" 已解除所有 IP 封禁`, {
      global: globalResult,
      api: apiResult,
      submit: submitResult,
      operator,
      timestamp: new Date().toISOString()
    })

    res.json({
      success: true,
      message: '已解除所有封禁',
      details: {
        global: globalResult,
        api: apiResult,
        submit: submitResult
      }
    })
  } catch (error) {
    console.error('[安全监控] 解除所有封禁失败:', error)
    res.status(500).json({ error: '解除所有封禁失败' })
  }
})

app.get('/api/security/logs', adminAuth, async (req, res) => {
  try {
    const { page, limit, type, ip, operator } = req.query
    const result = await getSecurityLogs(page, limit, { type, ip, operator })
    res.json(result)
  } catch (error) {
    console.error('[安全监控] 获取操作日志失败:', error)
    res.status(500).json({ error: '获取操作日志失败' })
  }
})

app.post('/api/security/batch-block', adminAuth, async (req, res) => {
  try {
    const { ips, duration, reason } = req.body

    if (!Array.isArray(ips) || ips.length === 0) {
      return res.status(400).json({ error: 'IP 列表不能为空' })
    }
    if (ips.length > 100) {
      return res.status(400).json({ error: '单次最多封禁 100 个 IP' })
    }
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: '封禁原因不能为空' })
    }

    const invalidIPs = ips.filter(ip => !isValidIP(ip))
    if (invalidIPs.length > 0) {
      return res.status(400).json({
        error: `以下 IP 格式不正确: ${invalidIPs.join(', ')}`
      })
    }

    let successCount = 0
    for (const ip of ips) {
      try {
        await globalLimiter.manualBlock(ip, duration)
        successCount++
      } catch (e) {
        console.error(`[安全监控] 封禁 IP ${ip} 失败:`, e)
      }
    }

    await logSecurityOperation({
      type: 'batch_block',
      ip: ips.join(','),
      duration,
      reason,
      operator: req.admin.username,
      metadata: {
        total: ips.length,
        success: successCount
      }
    })

    res.json({
      success: true,
      message: `成功封禁 ${successCount}/${ips.length} 个 IP`,
      successCount,
      totalCount: ips.length
    })
  } catch (error) {
    console.error('[安全监控] 批量封禁失败:', error)
    res.status(500).json({ error: '批量封禁失败，请稍后重试' })
  }
})

async function startServer() {
  try {
    await db.connect()

    await createSecurityLogsTable()

    globalLimiter.setDatabase(db)
    apiLimiter.setDatabase(db)
    submitLimiter.setDatabase(db)
    await Promise.all([
      globalLimiter.loadBlocksFromDB(),
      apiLimiter.loadBlocksFromDB(),
      submitLimiter.loadBlocksFromDB()
    ])

    dbPerformanceMonitor.monitorQuery(db)
    dbPerformanceMonitor.createPerformanceEndpoint(app)

    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`服务器已启动，监听端口 ${port}`)
      console.log(`📊 性能监控已启用: http://localhost:${port}/api/performance/db`)
      console.log(`🩺 健康检查: http://localhost:${port}/api/performance/health`)
    })

    server.on('error', err => {
      if (err.code === 'EADDRINUSE') {
        console.error(`端口 ${port} 被占用`)
      } else {
        console.error('服务器错误:', err)
      }
    })

    server.timeout = 120000
    server.keepAliveTimeout = 125000
    server.headersTimeout = 126000
  } catch (error) {
    console.error('服务器启动失败:', error)
    process.exit(1)
  }
}

startServer()
