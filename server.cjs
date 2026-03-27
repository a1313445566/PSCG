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
const dashboardRoutes = require('./routes/dashboard');
const aiRoutes = require('./routes/ai');
const questionSemanticRoutes = require('./routes/question-semantic');
const answerBehaviorRoutes = require('./routes/answer-behavior');

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
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/question-semantic', questionSemanticRoutes);
app.use('/api/answer-behavior', answerBehaviorRoutes);

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
app.post('/api/security/block-ip', adminAuth, async (req, res) => {
  try {
    const { ip, duration, reason } = req.body;
    
    // 输入验证
    if (!ip) {
      return res.status(400).json({ error: '缺少 IP 参数' });
    }
    if (!isValidIP(ip)) {
      return res.status(400).json({ error: 'IP 地址格式不正确' });
    }
    
    // 执行封禁
    await globalLimiter.manualBlock(ip, duration || 3600000);
    
    // 记录操作日志
    await logSecurityOperation({
      type: 'block',
      ip,
      duration: duration || 3600000,
      reason: reason || '未填写',
      operator: req.admin.username
    });
    
    res.json({ success: true, message: `IP ${ip} 已被封禁` });
  } catch (error) {
    console.error('[安全监控] 封禁 IP 失败:', error);
    res.status(500).json({ error: '封禁失败，请稍后重试' });
  }
});

// 【防护】手动解封 IP - 需要管理员权限
app.post('/api/security/unblock-ip', adminAuth, async (req, res) => {
  try {
    const { ip, reason } = req.body;
    
    if (!ip) {
      return res.status(400).json({ error: '缺少 IP 参数' });
    }
    
    // 执行解封
    await globalLimiter.unblock(ip);
    await apiLimiter.unblock(ip);
    await submitLimiter.unblock(ip);
    
    // 记录操作日志
    await logSecurityOperation({
      type: 'unblock',
      ip,
      reason: reason || '手动解封',
      operator: req.admin.username
    });
    
    res.json({ success: true, message: `IP ${ip} 已解除封禁` });
  } catch (error) {
    console.error('[安全监控] 解封 IP 失败:', error);
    res.status(500).json({ error: '解封失败，请稍后重试' });
  }
});

// 【防护】解除所有封禁 - 需要管理员权限
app.post('/api/security/unblock-all', adminAuth, async (req, res) => {
  try {
    // 使用限流器标准方法清空数据
    const globalResult = await globalLimiter.unblockAll();
    const apiResult = await apiLimiter.unblockAll();
    const submitResult = await submitLimiter.unblockAll();
    
    // 记录操作日志
    const operator = req.admin?.username || 'unknown';
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
    });
    
    console.log(`🟢 [安全] 管理员 "${operator}" 已解除所有 IP 封禁`, {
      global: globalResult,
      api: apiResult,
      submit: submitResult,
      operator,
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      message: '已解除所有封禁',
      details: {
        global: globalResult,
        api: apiResult,
        submit: submitResult
      }
    });
  } catch (error) {
    console.error('[安全监控] 解除所有封禁失败:', error);
    res.status(500).json({ error: '解除所有封禁失败' });
  }
});

// ==================== 安全监控增强功能 ====================

/**
 * 创建安全监控操作日志表
 */
const createSecurityLogsTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS security_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(50) NOT NULL COMMENT '操作类型: block, unblock, batch_block, unblock_all',
      ip VARCHAR(100) NOT NULL COMMENT 'IP 地址',
      duration INT COMMENT '封禁时长（毫秒）',
      reason TEXT COMMENT '封禁/解封原因',
      operator VARCHAR(100) NOT NULL COMMENT '操作人（管理员用户名）',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
      metadata TEXT COMMENT '其他元数据（JSON 格式）',
      INDEX idx_timestamp (timestamp),
      INDEX idx_ip (ip),
      INDEX idx_operator (operator),
      INDEX idx_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='安全监控操作日志'
  `;
  
  try {
    await db.run(createTableSQL);
    console.log('✅ 安全监控操作日志表已准备就绪');
  } catch (error) {
    console.error('❌ 创建安全监控操作日志表失败:', error);
  }
};

/**
 * 记录安全监控操作日志
 * @param {Object} logData - 日志数据
 * @returns {Promise<void>}
 */
const logSecurityOperation = async (logData) => {
  const { type, ip, duration, reason, operator, metadata } = logData;
  
  const sql = `
    INSERT INTO security_logs (type, ip, duration, reason, operator, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  try {
    await db.run(sql, [
      type,
      ip,
      duration || null,
      reason || null,
      operator,
      metadata ? JSON.stringify(metadata) : null
    ]);
  } catch (error) {
    console.error('[安全监控] 记录操作日志失败:', error);
  }
};

/**
 * IP 地址格式验证
 * @param {string} ip - IP 地址
 * @returns {boolean} 是否有效
 */
const isValidIP = (ip) => {
  if (!ip || typeof ip !== 'string') return false;

  // IPv4 验证 - 检查格式并验证每个数字在 0-255 范围内
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipv4Match = ip.match(ipv4Regex);
  if (ipv4Match) {
    const nums = ipv4Match.slice(1, 5).map(Number);
    return nums.every(n => n >= 0 && n <= 255);
  }

  // IPv6 验证 - 支持完整格式和简写格式
  // 完整格式: 8组4位十六进制
  // 简写格式: :: 压缩连续的零组
  const ipv6FullRegex = /^[0-9a-fA-F]{1,4}(:[0-9a-fA-F]{1,4}){7}$/;
  const ipv6CompressedRegex = /^(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?::(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?$/;

  return ipv6FullRegex.test(ip) || ipv6CompressedRegex.test(ip);
};

/**
 * 创建 AI 分析缓存表
 */
const createAICacheTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ai_analysis_cache (
      id INT AUTO_INCREMENT PRIMARY KEY,
      query_hash VARCHAR(64) NOT NULL COMMENT '查询哈希',
      query_text TEXT NOT NULL COMMENT '查询原文',
      result_text TEXT NOT NULL COMMENT 'AI分析结果',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      expires_at DATETIME DEFAULT (DATE_ADD(NOW(), INTERVAL 1 HOUR)) COMMENT '过期时间',
      INDEX idx_hash (query_hash),
      INDEX idx_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI分析结果缓存'
  `;
  
  try {
    await db.run(createTableSQL);
    console.log('✅ AI分析缓存表已准备就绪');
  } catch (error) {
    console.error('❌ 创建AI分析缓存表失败:', error);
  }
};

/**
 * 创建 AI 分析历史记录表
 */
const createAIHistoryTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ai_analysis_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL COMMENT '用户ID',
      question TEXT NOT NULL COMMENT '问题内容',
      result TEXT NOT NULL COMMENT 'AI分析结果',
      filters JSON COMMENT '筛选条件',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      INDEX idx_user_id (user_id),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI分析历史记录'
  `;
  
  try {
    await db.run(createTableSQL);
    console.log('✅ AI分析历史记录表已准备就绪');
  } catch (error) {
    console.error('❌ 创建AI分析历史记录表失败:', error);
  }
};

/**
 * 创建 AI 批量分析表
 */
const createAIBatchAnalysisTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ai_batch_analysis (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL COMMENT '用户ID',
      title VARCHAR(255) COMMENT '批量分析标题',
      question_ids JSON COMMENT '题目ID列表',
      results JSON COMMENT '批量分析结果',
      status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending' COMMENT '状态',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      completed_at DATETIME COMMENT '完成时间',
      INDEX idx_user_id (user_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI批量分析记录'
  `;
  
  try {
    await db.run(createTableSQL);
    console.log('✅ AI批量分析表已准备就绪');
  } catch (error) {
    console.error('❌ 创建AI批量分析表失败:', error);
  }
};

/**
 * 获取操作日志（分页）
 * GET /api/security/logs
 */
app.get('/api/security/logs', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, ip, operator } = req.query;
    
    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }
    if (ip) {
      whereClause += ' AND ip LIKE ?';
      params.push(`%${ip}%`);
    }
    if (operator) {
      whereClause += ' AND operator LIKE ?';
      params.push(`%${operator}%`);
    }
    
    // 查询总数
    const countSQL = `SELECT COUNT(*) as total FROM security_logs ${whereClause}`;
    const countResult = await db.get(countSQL, params);
    
    // 分页查询
    const limitNum = Number(limit);
    const offsetNum = (Number(page) - 1) * limitNum;
    const logsSQL = `
      SELECT * FROM security_logs 
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;
    const logs = await db.query(logsSQL, params);
    
    res.json({
      logs: logs || [],
      total: countResult.total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('[安全监控] 获取操作日志失败:', error);
    res.status(500).json({ error: '获取操作日志失败' });
  }
});

/**
 * 批量封禁 IP
 * POST /api/security/batch-block
 */
app.post('/api/security/batch-block', adminAuth, async (req, res) => {
  try {
    const { ips, duration, reason } = req.body;
    
    // 输入验证
    if (!Array.isArray(ips) || ips.length === 0) {
      return res.status(400).json({ error: 'IP 列表不能为空' });
    }
    if (ips.length > 100) {
      return res.status(400).json({ error: '单次最多封禁 100 个 IP' });
    }
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: '封禁原因不能为空' });
    }
    
    // 验证每个 IP 格式
    const invalidIPs = ips.filter(ip => !isValidIP(ip));
    if (invalidIPs.length > 0) {
      return res.status(400).json({ 
        error: `以下 IP 格式不正确: ${invalidIPs.join(', ')}` 
      });
    }
    
    // 批量封禁
    let successCount = 0;
    for (const ip of ips) {
      try {
        await globalLimiter.manualBlock(ip, duration);
        successCount++;
      } catch (e) {
        console.error(`[安全监控] 封禁 IP ${ip} 失败:`, e);
      }
    }
    
    // 记录操作日志
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
    });
    
    res.json({ 
      success: true, 
      message: `成功封禁 ${successCount}/${ips.length} 个 IP`,
      successCount,
      totalCount: ips.length
    });
  } catch (error) {
    console.error('[安全监控] 批量封禁失败:', error);
    res.status(500).json({ error: '批量封禁失败，请稍后重试' });
  }
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

    // 创建安全监控操作日志表
    await createSecurityLogsTable();

    // 创建 AI 分析缓存表
    await createAICacheTable();

    // 创建 AI 分析历史记录表
    await createAIHistoryTable();

    // 创建 AI 批量分析表
    await createAIBatchAnalysisTable();

    // 初始化限流器（设置数据库实例并加载持久化数据）
    globalLimiter.setDatabase(db);
    apiLimiter.setDatabase(db);
    submitLimiter.setDatabase(db);
    await Promise.all([
      globalLimiter.loadBlocksFromDB(),
      apiLimiter.loadBlocksFromDB(),
      submitLimiter.loadBlocksFromDB()
    ]);

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
