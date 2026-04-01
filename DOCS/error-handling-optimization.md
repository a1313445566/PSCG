# 错误处理优化方案

## 问题诊断

前端报错：
```
GET http://localhost:5173/api/chat/models 500 (Internal Server Error)
Error: 服务内部错误
```

重复出现两次：
1. `GET /api/chat/models` - 获取模型列表失败
2. `GET /api/chat/models/stats` - 获取统计失败

## 根本原因

### 1. 数据库连接未初始化
- **现象**：`Cannot read properties of null (reading 'execute')`
- **原因**：`database.js` 的 `pool` 为 `null` 时直接调用查询方法
- **影响**：所有依赖数据库的接口返回 500 错误

### 2. 多进程冲突
- **现象**：有 25 个 Node 进程同时运行
- **原因**：重复启动服务器，未清理旧进程
- **影响**：数据库连接池耗尽，端口占用

### 3. 环境变量未加载
- **现象**：`Access denied for user 'PSCG'@'localhost' (using password: NO)`
- **原因**：单独测试时 `dotenv.config()` 未执行
- **影响**：数据库密码未读取，连接失败

---

## 已实施的修复

### 1. 数据库自动重连机制 ✅

**修改文件**：`services/database.js`

```javascript
// query() 方法添加自动重连
async query(sql, params = []) {
  try {
    // ✅ 检查连接状态
    if (!this.pool) {
      console.log('⚠️ 数据库未连接，尝试重新连接...')
      await this.connect()
    }

    // 执行查询
    const [rows] = await this.pool.execute(sql, safeParams)
    return rows
  } catch (error) {
    // ✅ 连接错误自动重连
    if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNREFUSED') {
      console.log('🔄 数据库连接丢失，尝试重连...')
      await this.connect()
      const [rows] = await this.pool.execute(sql, safeParams)
      return rows
    }
    throw error
  }
}
```

**同时应用到**：`get()`, `all()`, `run()` 方法

**优势**：
- ✅ 自动检测连接状态
- ✅ 连接失败自动重试
- ✅ 提升系统稳定性

### 2. 健康检查接口 ✅

**新增文件**：`routes/health.js`

```javascript
// 基础健康检查
GET /api/health
{
  "status": "ok",
  "uptime": 123.45,
  "memory": {"used": 50, "total": 100}
}

// 数据库连接检查
GET /api/health/database
{
  "status": "ok",
  "database": "connected"
}

// 详细健康检查
GET /api/health/detailed
{
  "status": "ok",
  "checks": {
    "server": {"status": "ok"},
    "database": {"status": "ok"},
    "memory": {"status": "ok"}
  }
}
```

**用途**：
- 监控服务器状态
- 验证数据库连接
- 启动脚本健康检查

### 3. 启动脚本优化 ✅

**新增文件**：
- `scripts/start-server.ps1` (Windows)
- `scripts/start-server.sh` (Linux/Mac)

**功能**：
1. 清理旧进程
2. 检查端口占用
3. 验证 `.env` 文件
4. 启动服务器
5. 健康检查

**使用方式**：
```powershell
# Windows
cd e:\PSCG
.\scripts\start-server.ps1

# Linux/Mac
cd e:\PSCG
bash scripts/start-server.sh
```

---

## 前端错误处理优化建议

### 当前问题

前端只显示 "服务内部错误"，没有区分错误类型：

```javascript
// ❌ 当前实现（不友好）
catch (error) {
  message.error('服务内部错误')
}
```

### 优化方案

```javascript
// ✅ 优化实现（友好提示）
// src/composables/useModel.js
async function fetchModels() {
  try {
    const response = await api.get('/chat/models')
    return response.data
  } catch (error) {
    // 根据错误码显示不同提示
    if (error.code === 5003) {
      message.error('数据库连接失败，请稍后重试')
    } else if (error.code === 5001) {
      message.error('数据库查询失败，请联系管理员')
    } else if (error.code === 1004) {
      message.error('模型配置错误，请检查模型设置')
    } else if (error.code === 'ECONNREFUSED') {
      message.error('服务器未启动，请检查后端服务')
    } else {
      message.error('获取模型列表失败，请刷新页面重试')
    }
    
    // 记录详细错误（用于调试）
    console.error('[Model API Error]', {
      code: error.code,
      message: error.message,
      url: '/api/chat/models'
    })
    
    throw error
  }
}
```

### 重试机制优化

```javascript
// src/utils/api.js
async _doRequest(url, options, retries = 2) {
  try {
    const response = await fetch(url, options)
    
    if (!response.ok) {
      // ✅ 5xx 错误自动重试（数据库连接可能恢复）
      if (response.status >= 500 && retries > 0) {
        console.log(`⚠️ 服务器错误，自动重试 (${3 - retries}/2)`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        return this._doRequest(url, options, retries - 1)
      }
      
      const errorData = await response.json()
      throw new Error(errorData.error || '服务内部错误')
    }
    
    return response
  } catch (error) {
    // ✅ 网络错误也重试
    if (error.name === 'TypeError' && retries > 0) {
      console.log(`⚠️ 网络错误，自动重试 (${3 - retries}/2)`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      return this._doRequest(url, options, retries - 1)
    }
    throw error
  }
}
```

---

## 后端错误处理优化建议

### 当前实现

```javascript
// utils/chatErrors.js
function handleChatError(error, res) {
  console.error('[Chat Error]', error)

  if (error instanceof ChatError) {
    return res.status(400).json(error.toJSON())
  }

  // ❌ 所有未知错误都返回 500
  return res.status(500).json({
    error: '服务内部错误',
    code: 5003
  })
}
```

### 优化方案

```javascript
// utils/chatErrors.js
function handleChatError(error, res) {
  console.error('[Chat Error]', error)

  // ✅ 数据库错误特殊处理
  if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(503).json({
      error: '数据库认证失败，请检查配置',
      code: 5004,
      details: 'Database authentication failed'
    })
  }

  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: '数据库连接失败，请稍后重试',
      code: 5005,
      details: 'Database connection refused'
    })
  }

  if (error.code === 'PROTOCOL_CONNECTION_LOST') {
    return res.status(503).json({
      error: '数据库连接中断，正在重连...',
      code: 5006,
      details: 'Connection lost, retrying...'
    })
  }

  // ✅ 其他错误
  if (error instanceof ChatError) {
    return res.status(400).json(error.toJSON())
  }

  return res.status(500).json({
    error: '服务内部错误',
    code: 5003,
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  })
}
```

---

## 监控与告警

### 1. 错误日志记录

```javascript
// services/logger.js
class Logger {
  static error(category, error, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      category,
      message: error.message,
      stack: error.stack,
      code: error.code,
      context
    }

    console.error(JSON.stringify(logEntry, null, 2))

    // TODO: 写入数据库或日志文件
    // await db.query('INSERT INTO error_logs SET ?', logEntry)
  }
}

// 使用
Logger.error('database', error, { sql: 'SELECT * FROM ai_models' })
```

### 2. 前端错误监控

```javascript
// src/utils/errorMonitor.js
class ErrorMonitor {
  static track(error, context) {
    // 发送到后端记录
    fetch('/api/error-collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        url: window.location.href,
        context,
        timestamp: new Date().toISOString()
      })
    })
  }
}

// 使用
ErrorMonitor.track(error, { api: '/api/chat/models' })
```

---

## 测试验证

### 1. 数据库连接测试

```bash
cd e:\PSCG
node -e "require('dotenv').config(); const db = require('./services/database.js'); db.connect().then(() => console.log('✅ 成功')).catch(e => console.error('❌ 失败:', e.message))"
```

### 2. 健康检查测试

```bash
# 基础检查
curl http://localhost:3001/api/health

# 数据库检查
curl http://localhost:3001/api/health/database

# 详细检查
curl http://localhost:3001/api/health/detailed
```

### 3. API 接口测试

```bash
# 获取模型列表（需要替换 TOKEN）
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/chat/models

# 预期结果
{
  "success": true,
  "data": {
    "list": [...],
    "total": 10,
    "page": 1,
    "limit": 12
  }
}
```

---

## 总结

### 修复内容

| 修复项 | 文件 | 效果 |
|--------|------|------|
| 数据库自动重连 | `services/database.js` | ✅ 避免 500 错误 |
| 健康检查接口 | `routes/health.js` | ✅ 监控服务状态 |
| 启动脚本 | `scripts/start-server.*` | ✅ 避免多进程冲突 |
| 错误处理 | `utils/chatErrors.js` | 🔧 待优化 |
| 前端提示 | `src/composables/*.js` | 🔧 待优化 |

### 下一步行动

**短期（立即）**：
1. ✅ 重启服务器（使用启动脚本）
2. ✅ 验证健康检查接口
3. ✅ 测试模型管理功能

**中期（1周内）**：
1. 实现前端错误区分提示
2. 添加错误日志记录
3. 集成前端错误监控

**长期（1月内）**：
1. PM2 进程管理
2. 数据库连接池监控
3. 告警系统（邮件/钉钉）

---

**修复时间**：2026-03-31  
**修复人员**：AI 助手  
**相关文档**：`DOCS/database-connection-fix.md`