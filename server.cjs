const express = require('express');
const compression = require('compression');
const cors = require('cors');
const path = require('path');

// 导入路由模块
const dataRoutes = require('./routes/data');
const settingsRoutes = require('./routes/settings');
const subjectsRoutes = require('./routes/subjects');
const questionsRoutes = require('./routes/questions');
const gradesClassesRoutes = require('./routes/grades-classes');
const usersRoutes = require('./routes/users');
const leaderboardRoutes = require('./routes/leaderboard');
const answerRecordsRoutes = require('./routes/answer-records');
const analysisRoutes = require('./routes/analysis');

// 导入服务模块
const db = require('./services/database');

const app = express();
const port = 3001;

// 中间件
app.use(cors());
app.use(compression());
app.use(express.json({ encoding: 'utf-8', limit: '10mb' }));
app.use(express.urlencoded({ extended: true, encoding: 'utf-8', limit: '10mb' }));

// 设置响应编码为 UTF-8 - 只对API请求设置JSON类型
app.use((req, res, next) => {
  // 只对实际的API端点设置JSON Content-Type，避免影响静态文件
  if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  next();
});

// 静态文件服务 - 放在API路由之前
// 主静态文件目录
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  immutable: false
}));

// 资产文件目录 - 更长的缓存时间
app.use('/assets', express.static(path.join(__dirname, 'dist', 'assets'), {
  maxAge: '30d',
  etag: true,
  lastModified: false,
  immutable: true
}));

// 音频文件目录
app.use('/audio', express.static(path.join(__dirname, 'audio'), {
  maxAge: '7d',
  etag: true
}));

// 图片文件目录
app.use('/images', express.static(path.join(__dirname, 'images'), {
  maxAge: '7d',
  etag: true
}));

// 字体文件目录
app.use('/fonts', express.static(path.join(__dirname, 'fonts'), {
  maxAge: '30d',
  etag: true,
  immutable: true
}));

// API路由
app.use('/api/data', dataRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api', gradesClassesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/answer-records', answerRecordsRoutes);
app.use('/api/analysis', analysisRoutes);

// 启动数据库连接
async function startServer() {
  try {
    await db.connect();
    console.log('数据库连接成功');
    
    // 启动服务器
    app.listen(port, () => {
      console.log(`服务器运行在 http://localhost:${port}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();