require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

// 添加响应时间监控中间件
const responseTime = require('./middleware/responseTime');

// 添加限流中间件
const { globalLimiter, apiLimiter, submitLimiter } = require('./middleware/rateLimit');

// 添加签名缓存
const signatureCache = require('./middleware/signatureCache');

// 添加管理员权限验证
const adminAuth = require('./middleware/adminAuth');

// CSRF 防护中间件
const { csrfTokenMiddleware, csrfVerifyMiddleware } = require('./middleware/csrf');

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 根据文件类型选择存储目录
    if (file.mimetype.startsWith('audio/')) {
      cb(null, './audio');
    } else {
      cb(null, './images');
    }
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名：字段名-时间戳-随机数.扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    // 根据文件类型使用不同的前缀
    const prefix = file.mimetype.startsWith('audio/') ? 'audio' : 'image';
    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  }
});

// 文件过滤
const fileFilter = function (req, file, cb) {
  // 允许的图片类型
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  }
  // 允许的音频类型
  else if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  }
  // 其他类型拒绝
  else {
    cb(new Error('不支持的文件类型'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 最大 10MB
  }
});

const dataRoutes = require('./routes/data');
const settingsRoutes = require('./routes/settings');
const subjectsRoutes = require('./routes/subjects');
const questionsRoutes = require('./routes/questions');
const gradesClassesRoutes = require('./routes/grades-classes');
const usersRoutes = require('./routes/users');
const leaderboardRoutes = require('./routes/leaderboard');
const answerRecordsRoutes = require('./routes/answer-records');
const quizRoutes = require('./routes/quiz');
const analysisRoutes = require('./routes/analysis');
const difficultyRoutes = require('./routes/difficulty');
const backupRoutes = require('./routes/backup');
const errorCollectionRoutes = require('./routes/error-collection');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');

const db = require('./services/database');
const cacheService = require('./services/cache');

// 导入数据库性能监控
const dbPerformanceMonitor = require('./middleware/dbPerformance');

const app = express();
const port = process.env.SERVER_PORT || 3001;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(compression());
app.use(express.json({ encoding: 'utf-8', limit: '10mb' }));
app.use(express.urlencoded({ extended: true, encoding: 'utf-8', limit: '10mb' }));
app.use(responseTime); // 添加响应时间监控

// 【防护】全局限流 - 对所有 API 请求生效
app.use('/api', apiLimiter.middleware());

// 【防护】签名缓存中间件
app.use('/api/quiz', signatureCache.middleware());

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  next();
});

app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  immutable: false
}));

app.use('/assets', express.static(path.join(__dirname, 'dist', 'assets'), {
  maxAge: '30d',
  etag: true,
  lastModified: false,
  immutable: true
}));

app.use('/audio', express.static(path.join(__dirname, 'audio'), {
  maxAge: '30d',
  etag: true,
  lastModified: true
}));

app.use('/images', express.static(path.join(__dirname, 'images'), {
  maxAge: '30d',
  etag: true,
  lastModified: true
}));

// 安全：目录遍历防护中间件
const createPathTraversalGuard = (baseDir) => {
  return (req, res, next) => {
    // 解码 URL（处理 %2e%2e%2f 等编码形式）
    let decodedPath;
    try {
      decodedPath = decodeURIComponent(req.path);
    } catch (e) {
      return res.status(400).send('Invalid path encoding');
    }
    
    // 规范化路径，解析 .. 和 .
    const normalizedPath = path.normalize(decodedPath);
    
    // 获取绝对路径
    const resolvedPath = path.resolve(baseDir, normalizedPath);
    
    // 检查解析后的路径是否仍在目标目录内
    if (!resolvedPath.startsWith(baseDir)) {
      console.warn(`[Security] Path traversal attempt blocked: ${req.path} -> ${resolvedPath}`);
      return res.status(403).send('Forbidden');
    }
    
    next();
  };
};

// 应用目录遍历防护
app.use('/images', createPathTraversalGuard(path.join(__dirname, 'images')));
app.use('/audio', createPathTraversalGuard(path.join(__dirname, 'audio')));

app.use('/fonts', express.static(path.join(__dirname, 'fonts'), {
  maxAge: '30d',
  etag: true,
  immutable: true
}));

app.use('/api/data', dataRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api', gradesClassesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/answer-records', answerRecordsRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/difficulty', difficultyRoutes);
app.use('/api', backupRoutes);
app.use('/api/error-collection', errorCollectionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// CSRF Token 接口
app.get('/api/csrf-token', csrfTokenMiddleware, (req, res) => {
  res.json({ success: true, csrfToken: res.locals.csrfToken });
});

// 缓存管理API
app.get('/api/cache/stats', (req, res) => {
  const stats = cacheService.getStats();
  res.json(stats);
});

app.post('/api/cache/clear', (req, res) => {
  cacheService.clear();
  res.json({ success: true, message: '缓存已清空' });
});

// 【防护】限流状态监控 API - 需要管理员权限
app.get('/api/security/rate-limit', adminAuth, (req, res) => {
  res.json({
    global: globalLimiter.getStats(),
    api: apiLimiter.getStats(),
    submit: submitLimiter.getStats()
  });
});

// 【防护】签名缓存状态监控 API - 需要管理员权限
app.get('/api/security/signature-cache', adminAuth, (req, res) => {
  res.json(signatureCache.getStats());
});

// 【防护】手动封禁 IP - 需要管理员权限
app.post('/api/security/block-ip', adminAuth, (req, res) => {
  const { ip, duration } = req.body;
  if (!ip) {
    return res.status(400).json({ error: '缺少 IP 参数' });
  }
  globalLimiter.manualBlock(ip, duration || 3600000);
  res.json({ success: true, message: `IP ${ip} 已被封禁` });
});

// 【防护】手动解封 IP - 需要管理员权限
app.post('/api/security/unblock-ip', adminAuth, (req, res) => {
  const { ip } = req.body;
  if (!ip) {
    return res.status(400).json({ error: '缺少 IP 参数' });
  }
  globalLimiter.unblock(ip);
  apiLimiter.unblock(ip);
  submitLimiter.unblock(ip);
  res.json({ success: true, message: `IP ${ip} 已解除封禁` });
});

// 【防护】解除所有封禁 - 需要管理员权限
app.post('/api/security/unblock-all', adminAuth, (req, res) => {
  // 使用限流器标准方法清空数据
  const globalResult = globalLimiter.unblockAll();
  const apiResult = apiLimiter.unblockAll();
  const submitResult = submitLimiter.unblockAll();
  
  // 记录操作日志（包含操作者信息）
  const operator = req.admin?.username || 'unknown';
  console.log(`🟢 [安全] 管理员 "${operator}" 已解除所有 IP 封禁`, {
    global: globalResult,
    api: apiResult,
    submit: submitResult,
    operator,
    timestamp: new Date().toISOString()
  });
  
  res.json({ 
    success: true, 
    message: '所有 IP 封禁已解除',
    details: {
      global: globalResult,
      api: apiResult,
      submit: submitResult
    }
  });
});

process.on('uncaughtException', (err) => {
  console.error(`未捕获异常:`, err.message);
  if (err.message.includes('SQLITE_CANTOPEN') || err.message.includes('database is locked')) {
    console.log('数据库错误，尝试重新连接...');
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`未处理 Promise 拒绝:`, reason);
});

async function startServer() {
  try {
    await db.connect();

    // 启用数据库性能监控
    dbPerformanceMonitor.monitorQuery(db);
    
    // 添加性能监控API端点
    dbPerformanceMonitor.createPerformanceEndpoint(app);
    
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`服务器已启动，监听端口 ${port}`);
      console.log(`📊 性能监控已启用: http://localhost:${port}/api/performance/db`);
      console.log(`🩺 健康检查: http://localhost:${port}/api/performance/health`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`端口 ${port} 被占用`);
      } else {
        console.error('服务器错误:', err);
      }
    });

    server.timeout = 30000;
    server.keepAliveTimeout = 55000;
    server.headersTimeout = 56000;
    
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();
