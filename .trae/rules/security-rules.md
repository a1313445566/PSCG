---
description: PSCG 智能题库系统安全开发规范
alwaysApply: false
enabled: true
updatedAt: 2026-03-28T00:00:00.000Z
provider:
---

# 安全开发规范

## 1. 概述

安全开发是 PSCG 系统的重要组成部分，本规范旨在确保系统在开发、测试和部署过程中遵循安全最佳实践，保护用户数据和系统资源，防止安全漏洞和攻击。

## 2. 前端安全

### 2.1 XSS 防护

**实现方式**：

- 使用 `xss-filter.js` 工具函数过滤用户输入
- 对富文本内容进行安全处理
- 使用 Vue 的内置 HTML 转义

**代码示例**：

```javascript
import xssFilter from '@/utils/xss-filter'

// 过滤用户输入
const safeContent = xssFilter.sanitize(userInput)

// 模板中使用 v-html 时的安全处理
<div v-html="safeContent"></div>
```

### 2.2 CSRF 防护

**实现方式**：

- 使用 `csrf.js` 工具函数获取和管理 CSRF Token
- `api.js` 自动添加 CSRF Token 到请求头
- 后端使用 `csrf.js` 中间件验证

**代码示例**：

```javascript
// api.js 自动处理
import { api } from '@/utils/api'

// 自动添加 CSRF Token
await api.post('/questions', data)
```

### 2.3 输入验证

**验证规则**：

- 客户端表单验证
- 数据类型检查
- 长度限制
- 格式验证

**代码示例**：

```javascript
// 表单验证
const validateForm = form => {
  if (!form.title || form.title.length < 2) {
    return { valid: false, message: '标题至少2个字符' }
  }
  return { valid: true }
}
```

### 2.4 敏感信息保护

**保护措施**：

- 不在前端存储敏感信息
- 密码等敏感数据不本地存储
- 使用 HTTPS 传输
- 敏感信息加密存储

## 3. 后端安全

### 3.1 SQL 注入防护

**实现方式**：

- 使用参数化查询
- 避免字符串拼接 SQL
- 使用 ORM 框架（如 Sequelize）

**代码示例**：

```javascript
// 正确：使用参数化查询
await db.query('SELECT * FROM users WHERE id = ?', [userId])

// 错误：字符串拼接
await db.query(`SELECT * FROM users WHERE id = ${userId}`)
```

### 3.2 认证和授权

**实现方式**：

- 使用 JWT 进行身份认证
- 基于角色的访问控制 (RBAC)
- 权限验证中间件

**代码示例**：

```javascript
// 管理员认证中间件
const adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ error: '未授权' })
  }
  // 验证 token
  // ...
  next()
}
```

### 3.3 输入验证

**实现方式**：

- 使用 `validationService.js` 进行输入验证
- 请求参数验证
- 数据格式检查
- 边界值检查

**代码示例**：

```javascript
const { validateSubjectId } = require('../services/validationService')

if (!validateSubjectId(subjectId)) {
  return res.status(400).json({ error: '学科ID格式错误' })
}
```

### 3.4 错误处理

**处理方式**：

- 统一错误响应格式
- 不暴露详细错误信息给客户端
- 详细错误信息记录到日志

**代码示例**：

```javascript
try {
  const result = await db.query(sql, params)
  res.json(result)
} catch (error) {
  console.error('操作失败:', error)
  res.status(500).json({ error: '操作失败' })
}
```

## 4. 数据安全

### 4.1 数据加密

**加密策略**：

- 密码使用 bcrypt 加密
- 敏感数据传输加密
- 数据库敏感字段加密

**代码示例**：

```javascript
const bcrypt = require('bcrypt')

// 密码加密
const hashedPassword = await bcrypt.hash(password, 10)

// 密码验证
const isMatch = await bcrypt.compare(password, hashedPassword)
```

### 4.2 数据访问控制

**访问控制**：

- 基于角色的权限控制
- 数据所有权验证
- 敏感操作日志记录

**代码示例**：

```javascript
// 检查数据所有权
const question = await db.query('SELECT * FROM questions WHERE id = ?', [questionId])
if (question.userId !== req.user.id && !req.user.isAdmin) {
  return res.status(403).json({ error: '无权限操作' })
}
```

### 4.3 数据备份

**备份策略**：

- 定期数据库备份
- 备份文件加密存储
- 备份恢复测试

**实现示例**：

```javascript
// 备份 API
app.get('/api/backup', async (req, res) => {
  try {
    const backup = await dbService.createBackup()
    res.json({ success: true, backupFile: backup })
  } catch (error) {
    res.status(500).json({ error: '备份失败' })
  }
})
```

## 5. 文件上传安全

### 5.1 文件验证

**验证规则**：

- 文件类型检查
- 文件大小限制
- 文件名安全处理
- 病毒扫描

**代码示例**：

```javascript
// 图片上传验证
const upload = multer({
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的文件类型'))
    }
  }
})
```

### 5.2 文件存储

**存储策略**：

- 随机文件名
- 分离存储和访问路径
- 权限控制
- 定期清理

**实现示例**：

```javascript
// 生成随机文件名
const generateRandomName = originalName => {
  const ext = path.extname(originalName)
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`
}
```

## 6. API 安全

### 6.1 限流措施

**限流配置**：

- 全局限流：500 次/分钟（每用户）
- API 限流：150 次/分钟（每用户）
- 提交限流：20 次/分钟（每用户）

**实现示例**：

```javascript
const rateLimit = require('express-rate-limit')

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 150, // 每用户限制
  message: { error: 'API 请求过于频繁，请稍后再试' }
})

app.use('/api', apiLimiter)
```

### 6.2 API 版本控制

**版本策略**：

- API 路径包含版本号
- 向后兼容性保证
- 版本迁移策略

**实现示例**：

```javascript
// API 路由
app.use('/api/v1', v1Routes)
app.use('/api/v2', v2Routes)
```

### 6.3 安全头部

**头部配置**：

- Content-Security-Policy
- X-Content-Type-Options
- X-Frame-Options
- Strict-Transport-Security

**实现示例**：

```javascript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  next()
})
```

## 7. 安全审计

### 7.1 日志记录

**日志内容**：

- 认证事件
- 授权事件
- 敏感操作
- 错误事件
- 异常行为

**实现示例**：

```javascript
// 登录日志
console.log(`[${new Date().toISOString()}] [INFO] [Auth] - User ${userId} logged in from ${req.ip}`)

// 敏感操作日志
console.log(
  `[${new Date().toISOString()}] [WARN] [Admin] - User ${userId} modified system settings`
)
```

### 7.2 安全扫描

**扫描策略**：

- 定期代码安全扫描
- 依赖包安全检查
- 渗透测试
- 漏洞扫描

**工具推荐**：

- OWASP ZAP
- npm audit
- SonarQube
- Snyk

## 8. 安全最佳实践

### 8.1 代码示例

**密码处理**：

```javascript
// 正确：使用 bcrypt 加密
const bcrypt = require('bcrypt')

const hashPassword = async password => {
  return await bcrypt.hash(password, 10)
}

const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword)
}
```

**SQL 注入防护**：

```javascript
// 正确：使用参数化查询
const getUser = async userId => {
  return await db.query('SELECT id, name, email FROM users WHERE id = ?', [userId])
}

// 错误：字符串拼接
const getUser = async userId => {
  return await db.query(`SELECT * FROM users WHERE id = ${userId}`) // 危险！
}
```

**输入验证**：

```javascript
// 正确：使用验证服务
const { validateEmail, validatePassword } = require('../services/validationService')

const register = async (req, res) => {
  const { email, password } = req.body

  if (!validateEmail(email)) {
    return res.status(400).json({ error: '邮箱格式错误' })
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ error: '密码强度不足' })
  }

  // 继续处理...
}
```

### 8.2 注意事项

- 定期更新依赖包，修复安全漏洞
- 使用 HTTPS 协议
- 实现合理的密码策略
- 定期进行安全培训
- 建立安全事件响应机制
- 遵循最小权限原则
- 定期进行安全评估

## 9. 安全事件处理

### 9.1 事件响应

**响应流程**：

1. 检测安全事件
2. 评估事件影响
3. 隔离受影响系统
4. 消除安全威胁
5. 恢复系统正常运行
6. 分析事件原因
7. 实施防护措施

### 9.2 常见安全问题

| 问题         | 可能原因          | 解决方案                           |
| ------------ | ----------------- | ---------------------------------- |
| SQL 注入     | 未使用参数化查询  | 使用参数化查询，避免字符串拼接     |
| XSS 攻击     | 未过滤用户输入    | 使用 xss-filter 过滤，Vue 内置转义 |
| CSRF 攻击    | 未验证 CSRF Token | 使用 CSRF 防护中间件               |
| 密码泄露     | 密码明文存储      | 使用 bcrypt 加密存储               |
| 权限绕过     | 未正确验证权限    | 实现完整的权限验证                 |
| 文件上传漏洞 | 未验证文件类型    | 严格文件类型和大小检查             |

## 10. 文档参考

- XSS 防护：`src/utils/xss-filter.js`
- CSRF 防护：`middleware/csrf.js` 和 `src/utils/csrf.js`
- 密码加密：`services/passwordHash.js`
- 输入验证：`services/validationService.js`
- 限流配置：`middleware/rateLimit.js`
- 安全扫描报告：`DOCS/安全报告/`
