# 数据库连接问题诊断与修复

## 问题现象

前端访问 `/api/chat/models` 时返回 500 错误：
```
Error: Cannot read properties of null (reading 'execute')
```

## 根本原因

1. **数据库连接未初始化**：`database.js` 的 `pool` 为 `null`
2. **多进程问题**：有 25 个 Node 进程同时运行，连接池耗尽
3. **环境变量未加载**：单独测试时 `dotenv.config()` 未执行

## 已实施的修复

### 1. 数据库自动重连机制

```javascript
// services/database.js - query() 方法
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

### 2. 清理多余进程

```powershell
# 停止所有 Node 进程
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

# 启动单个服务实例
cd e:\PSCG
node server.cjs
```

## 启动流程优化

### 正确的启动方式

```bash
# 方式 1：使用 npm script（推荐）
npm run server

# 方式 2：直接运行（确保在项目根目录）
node server.cjs
```

**关键**：必须在项目根目录执行，确保 `.env` 文件被加载

### 错误的启动方式

```bash
# ❌ 错误：在其他目录执行
cd C:\
node e:\PSCG\server.cjs  # dotenv 无法找到 .env

# ❌ 错误：启动多个实例
node server.cjs &
node server.cjs &  # 连接池冲突
```

## 验证步骤

### 1. 检查进程数量

```powershell
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Measure-Object
```

**正常**：1-2 个进程
**异常**：> 5 个进程（需要清理）

### 2. 测试数据库连接

```bash
cd e:\PSCG
node -e "require('dotenv').config(); const db = require('./services/database.js'); db.connect().then(() => console.log('✅ 数据库连接成功')).catch(e => console.error('❌ 错误:', e.message))"
```

### 3. 测试 API 接口

```bash
# 启动服务
npm run server

# 测试模型列表（需要替换 TOKEN）
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/chat/models
```

## 前端错误处理优化

### 当前问题

前端显示：
```
GET http://localhost:5173/api/chat/models 500 (Internal Server Error)
```

### 前端优化建议

```javascript
// src/composables/useModel.js
async function fetchModels() {
  try {
    const response = await api.get('/chat/models')
    return response.data
  } catch (error) {
    // ✅ 区分错误类型
    if (error.code === 5003) {
      message.error('数据库连接失败，请稍后重试')
    } else if (error.code === 1004) {
      message.error('模型配置错误，请联系管理员')
    } else {
      message.error('获取模型列表失败，请刷新页面重试')
    }
    throw error
  }
}
```

## 长期优化方案

### 1. 数据库连接池监控

```javascript
// services/database.js
getPoolStatus() {
  return {
    totalConnections: this.pool.pool._allConnections.length,
    freeConnections: this.pool.pool._freeConnections.length,
    waitingRequests: this.pool.pool._connectionQueue.length
  }
}
```

### 2. 健康检查接口

```javascript
// routes/health.js
router.get('/health', async (req, res) => {
  const dbStatus = await db.ping()
  res.json({
    status: dbStatus ? 'ok' : 'error',
    database: dbStatus ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  })
})
```

### 3. PM2 进程管理

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'pscg-server',
    script: 'server.cjs',
    instances: 1,  // 单实例
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

## 总结

**问题根源**：数据库连接未初始化 + 多进程冲突
**修复方案**：自动重连机制 + 进程清理
**预防措施**：PM2 管理 + 健康检查

**修复时间**：2026-03-31
**修复人员**：AI 助手