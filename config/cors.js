/**
 * CORS 配置模块
 * 支持环境变量白名单 + 动态域名 + 内网 IP
 */

const corsOriginWhitelist = process.env.CORS_ORIGIN_WHITELIST
  ? process.env.CORS_ORIGIN_WHITELIST.split(',').map(origin => origin.trim())
  : [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ]

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true)
    }

    if (corsOriginWhitelist.includes(origin)) {
      return callback(null, true)
    }

    if (origin.endsWith('.trycloudflare.com')) {
      return callback(null, true)
    }

    if (origin.match(/^http:\/\/10\.78\.\d{1,3}\.\d{1,3}:\d+$/)) {
      return callback(null, true)
    }

    if (origin.match(/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) {
      return callback(null, true)
    }

    console.warn(`[CORS] 拒绝未授权的来源: ${origin}`)
    callback(new Error('未授权的 CORS 请求'))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
  maxAge: 86400
}

module.exports = corsOptions
