---
description: PSCG 智能题库系统性能监控和日志规范
alwaysApply: false
enabled: true
updatedAt: 2026-03-28T00:00:00.000Z
provider:
---

# 性能监控和日志规范

## 1. 概述

性能监控和日志记录是确保 PSCG 系统稳定运行的重要组成部分。本规范旨在定义系统的性能监控指标、日志记录标准、数据库性能优化策略以及系统资源使用监控方法，以提高系统的可靠性和可维护性。

## 2. 性能监控指标

### 2.1 前端性能指标

**核心指标**：

- **首屏加载时间**：目标 < 2 秒
- **首次内容绘制 (FCP)**：目标 < 1 秒
- **最大内容绘制 (LCP)**：目标 < 2.5 秒
- **累积布局偏移 (CLS)**：目标 < 0.1
- **首次输入延迟 (FID)**：目标 < 100ms
- **交互到下一次绘制 (TTI)**：目标 < 3.8 秒

**监控工具**：

- Vue DevTools Performance 面板
- Chrome DevTools Performance 面板
- Lighthouse

### 2.2 后端性能指标

**核心指标**：

- **API 响应时间**：目标 < 500ms
- **数据库查询时间**：目标 < 100ms
- **请求处理时间**：目标 < 200ms
- **并发处理能力**：目标 > 100 QPS
- **错误率**：目标 < 0.1%

**监控工具**：

- Express 中间件 `responseTime.js`
- 数据库性能监控 `dbPerformance.js`
- 应用性能监控工具

### 2.3 系统资源指标

**核心指标**：

- **CPU 使用率**：目标 < 70%
- **内存使用率**：目标 < 80%
- **磁盘使用率**：目标 < 75%
- **网络带宽**：根据实际需求

**监控工具**：

- PM2 进程监控
- 系统监控工具（如 top、htop）
- 云服务监控（如阿里云监控）

## 3. 日志记录规范

### 3.1 日志级别

**日志级别定义**：

- **DEBUG**：调试信息，仅在开发环境使用
- **INFO**：正常操作信息，如用户登录、API 调用等
- **WARN**：警告信息，如参数错误、边界情况等
- **ERROR**：错误信息，如 API 调用失败、数据库错误等
- **FATAL**：致命错误，如系统崩溃、服务不可用等

### 3.2 日志格式

**统一日志格式**：

```
[YYYY-MM-DD HH:mm:ss] [LEVEL] [MODULE] - MESSAGE
```

**示例**：

```
[2026-03-28 10:00:00] [INFO] [UserController] - User 123 logged in
[2026-03-28 10:00:01] [ERROR] [QuestionService] - Failed to load questions: Database connection error
```

### 3.3 日志存储

**存储策略**：

- **开发环境**：控制台输出
- **测试环境**：文件存储 + 控制台输出
- **生产环境**：文件存储 + 日志服务

**文件轮转**：

- 按日期轮转（每天一个文件）
- 文件大小限制（最大 100MB）
- 保留期限（默认 30 天）

### 3.4 日志内容规范

**必须包含的信息**：

- 时间戳
- 日志级别
- 模块名称
- 操作类型
- 操作结果
- 错误信息（如有）

**示例**：

```javascript
// 正确：完整的日志记录
console.log(
  `[${new Date().toISOString()}] [INFO] [QuizController] - Quiz completed by user ${userId}, score: ${score}`
)

// 错误：缺少必要信息
console.log('Quiz completed')
```

## 4. 数据库性能优化

### 4.1 查询优化

**优化策略**：

- **使用索引**：为频繁查询的字段创建索引
- **避免 SELECT \***：只查询需要的字段
- **使用 LIMIT**：限制返回结果数量
- **合理使用 JOIN**：避免复杂的多表关联
- **使用参数化查询**：防止 SQL 注入，提高性能

**示例**：

```javascript
// 正确：使用索引和 LIMIT
const users = await db.query('SELECT id, name FROM users WHERE active = ? LIMIT ?', [1, 10])

// 错误：全表扫描
const users = await db.query('SELECT * FROM users WHERE active = 1')
```

### 4.2 连接池管理

**连接池配置**：

- **最小连接数**：5
- **最大连接数**：20
- **连接超时**：30 秒
- **空闲超时**：60 秒

**配置示例**：

```javascript
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0
})
```

### 4.3 缓存策略

**缓存级别**：

- **应用级缓存**：使用 memory-cache
- **数据库缓存**：MySQL 查询缓存
- **浏览器缓存**：静态资源缓存

**缓存配置**：

```javascript
// 前端缓存配置
const CACHE_TTL = {
  ADMIN: 5 * 60 * 1000, // 后台：5分钟
  FRONTEND: 24 * 60 * 60 * 1000 // 前台：24小时
}

// 后端缓存配置
const cache = require('memory-cache')
```

## 5. API 性能优化

### 5.1 响应时间监控

**监控实现**：

- 使用 `responseTime` 中间件
- 记录每个 API 请求的响应时间
- 设置响应时间阈值（如 > 1 秒为警告）

**实现示例**：

```javascript
// middleware/responseTime.js
const responseTime = (req, res, next) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`[API] ${req.method} ${req.path} - ${duration}ms`)

    if (duration > 1000) {
      console.warn(`[PERFORMANCE] Slow API: ${req.path} - ${duration}ms`)
    }
  })

  next()
}
```

### 5.2 限流策略

**限流配置**：

- **全局限流**：500 次/分钟（每用户）
- **API 限流**：150 次/分钟（每用户）
- **提交限流**：20 次/分钟（每用户）

**实现示例**：

```javascript
// middleware/rateLimit.js
const rateLimit = require('express-rate-limit')

const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 500, // 每用户限制
  message: { error: '请求过于频繁，请稍后再试' }
})

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 150, // 每用户限制
  message: { error: 'API 请求过于频繁，请稍后再试' }
})
```

### 5.3 响应压缩

**压缩配置**：

- 使用 `compression` 中间件
- 压缩类型：gzip, deflate
- 最小压缩大小：1KB

**实现示例**：

```javascript
const compression = require('compression')
app.use(
  compression({
    threshold: 1024, // 1KB
    level: 6 // 压缩级别
  })
)
```

## 6. 前端性能优化

### 6.1 资源优化

**优化策略**：

- **代码分割**：使用动态导入
- **资源压缩**：JS、CSS、图片压缩
- **缓存策略**：合理设置缓存头
- **按需加载**：组件和路由懒加载

**实现示例**：

```javascript
// 路由懒加载
const AdminView = () => import('@/views/AdminView.vue')

// 组件按需加载
const HeavyComponent = defineAsyncComponent(() => import('@/components/HeavyComponent.vue'))
```

### 6.2 渲染优化

**优化策略**：

- **虚拟滚动**：大数据列表
- **计算属性缓存**：避免重复计算
- **合理使用 v-if 和 v-show**：根据场景选择
- **key 使用**：列表渲染使用唯一 key

**实现示例**：

```vue
<!-- 正确：使用唯一 key -->
<div v-for="item in list" :key="item.id">
  {{ item.name }}
</div>

<!-- 错误：使用索引作为 key -->
<div v-for="(item, index) in list" :key="index">
  {{ item.name }}
</div>
```

### 6.3 网络优化

**优化策略**：

- **HTTP/2**：启用 HTTP/2
- **CDN**：使用内容分发网络
- **预加载**：关键资源预加载
- **HTTP 缓存**：合理设置缓存策略

## 7. 监控工具集成

### 7.1 应用监控

**推荐工具**：

- **PM2**：进程管理和监控
- **New Relic**：应用性能监控
- **Datadog**：全面的监控解决方案

**PM2 配置**：

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'pscg-app',
      script: 'server.cjs',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'production'
      },
      log_file: 'logs/app.log',
      out_file: 'logs/out.log',
      error_file: 'logs/error.log'
    }
  ]
}
```

### 7.2 数据库监控

**监控内容**：

- 查询执行时间
- 连接池状态
- 索引使用情况
- 慢查询日志

**实现示例**：

```javascript
// middleware/dbPerformance.js
const dbPerformance = async (req, res, next) => {
  const start = Date.now()

  // 监听数据库查询
  const originalQuery = db.query
  db.query = function (...args) {
    const queryStart = Date.now()
    const result = originalQuery.apply(this, args)
    if (result && result.then) {
      result.then(() => {
        const queryTime = Date.now() - queryStart
        if (queryTime > 100) {
          console.warn(`[DB] Slow query: ${args[0]} - ${queryTime}ms`)
        }
      })
    }
    return result
  }

  next()
}
```

## 8. 性能测试

### 8.1 负载测试

**测试工具**：

- **Apache JMeter**
- **LoadRunner**
- **k6**

**测试场景**：

- 并发用户测试
- 长时间运行测试
- 峰值负载测试

### 8.2 基准测试

**测试内容**：

- API 响应时间
- 数据库查询性能
- 前端渲染性能

**测试频率**：

- 代码变更后
- 版本发布前
- 定期（每月）

## 9. 性能优化流程

### 9.1 识别瓶颈

**步骤**：

1. 收集性能数据
2. 分析监控指标
3. 定位性能瓶颈
4. 制定优化方案

### 9.2 实施优化

**优化策略**：

- **优先级**：从影响最大的瓶颈开始
- **测试**：每次优化后进行测试
- **监控**：持续监控优化效果

### 9.3 验证效果

**验证方法**：

- 性能测试对比
- 用户体验评估
- 系统资源使用情况

## 10. 最佳实践

### 10.1 代码示例

**数据库查询优化**：

```javascript
// 正确：使用索引和参数化查询
const users = await db.query(
  'SELECT id, name FROM users WHERE active = ? AND created_at > ? LIMIT ?',
  [1, '2026-01-01', 10]
)

// 错误：全表扫描和字符串拼接
const users = await db.query(`SELECT * FROM users WHERE active = 1 AND created_at > '2026-01-01'`)
```

**前端性能优化**：

```javascript
// 正确：使用计算属性缓存
const filteredList = computed(() => {
  return list.value.filter(item => item.active)
})

// 错误：在模板中使用方法
const filterList = (list) => {
  return list.filter(item => item.active)
}

// 模板中
<template v-for="item in filterList(list)">
```

### 10.2 注意事项

- 定期进行性能测试和监控
- 关注用户体验指标
- 优化数据库查询和索引
- 合理使用缓存策略
- 监控系统资源使用情况
- 及时处理性能告警

## 11. 故障处理

### 11.1 性能问题诊断

**诊断流程**：

1. 检查监控指标
2. 分析日志
3. 定位问题源头
4. 制定解决方案

### 11.2 常见性能问题

| 问题           | 可能原因       | 解决方案                 |
| -------------- | -------------- | ------------------------ |
| API 响应慢     | 数据库查询慢   | 优化查询，添加索引       |
| 前端加载慢     | 资源过大       | 压缩资源，代码分割       |
| 系统负载高     | 并发请求过多   | 增加服务器资源，优化代码 |
| 数据库连接失败 | 连接池配置不当 | 调整连接池参数           |

## 12. 文档参考

- 响应时间监控：`middleware/responseTime.js`
- 数据库性能监控：`middleware/dbPerformance.js`
- 限流配置：`middleware/rateLimit.js`
- PM2 配置：`ecosystem.config.js`
- 性能测试报告：`DOCS/测试报告/`
