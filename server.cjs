const express = require('express');
const compression = require('compression');
const cors = require('cors');
const path = require('path');

const dataRoutes = require('./routes/data');
const settingsRoutes = require('./routes/settings');
const subjectsRoutes = require('./routes/subjects');
const questionsRoutes = require('./routes/questions');
const gradesClassesRoutes = require('./routes/grades-classes');
const usersRoutes = require('./routes/users');
const leaderboardRoutes = require('./routes/leaderboard');
const answerRecordsRoutes = require('./routes/answer-records');
const analysisRoutes = require('./routes/analysis');

const db = require('./services/database');

const app = express();
const port = 3001;

app.use(cors());
app.use(compression());
app.use(express.json({ encoding: 'utf-8', limit: '10mb' }));
app.use(express.urlencoded({ extended: true, encoding: 'utf-8', limit: '10mb' }));

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
  maxAge: '7d',
  etag: true
}));

app.use('/images', express.static(path.join(__dirname, 'images'), {
  maxAge: '7d',
  etag: true
}));

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
app.use('/api/analysis', analysisRoutes);

process.on('uncaughtException', (err) => {
  // console.error(`未捕获异常:`, err.message);
  if (err.message.includes('SQLITE_CANTOPEN') || err.message.includes('database is locked')) {
    // console.log('数据库错误，尝试重新连接...');
  }
});

process.on('unhandledRejection', (reason, promise) => {
  // console.error(`未处理 Promise 拒绝:`, reason);
});

async function startServer() {
  try {
    await db.connect();

    
    const server = app.listen(port, '0.0.0.0', () => {

    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // console.error(`端口 ${port} 被占用`);
      } else {
        // console.error('服务器错误:', err);
      }
    });

    server.timeout = 60000;
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
    
  } catch (error) {
    // console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();
