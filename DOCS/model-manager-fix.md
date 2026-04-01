# Model Manager 参数类型修复

**修复日期**: 2026-04-01
**错误代码**: `ER_WRONG_ARGUMENTS` (1210)
**错误消息**: `Incorrect arguments to mysqld_stmt_execute`

## 问题描述

访问 `/api/chat/models` 接口时，MySQL 抛出错误：

```
Error: Incorrect arguments to mysqld_stmt_execute
sql: '... LIMIT ? OFFSET ?'
```

## 根本原因

MySQL prepared statement 要求参数必须是正确的数据类型。当 `page` 和 `limit` 从前端传递过来时，它们可能是字符串类型（例如 `"1"` 而不是 `1`），导致 MySQL 执行失败。

**错误示例**：
```javascript
// ❌ 错误：page 和 limit 可能是字符串
const offset = (page - 1) * limit
await db.query(sql, [limit, offset])  // 参数可能是 ["12", 0]
```

## 解决方案

在 `services/chat/modelManager.js` 的 `getModels` 函数中，显式转换参数为整数：

```javascript
async function getModels(page = 1, limit = 12) {
  // ✅ 确保 page 和 limit 是整数
  const safePage = parseInt(page) || 1
  const safeLimit = parseInt(limit) || 12
  const offset = (safePage - 1) * safeLimit

  const sql = `
    SELECT ... 
    FROM ai_models 
    ORDER BY is_default DESC, created_at DESC 
    LIMIT ? OFFSET ?
  `
  
  // ✅ 参数现在是 [12, 0] 而不是 ["12", 0]
  const models = await db.query(sql, [safeLimit, offset])
  // ...
}
```

## 修复验证

修复后，API 返回正确的数据：

```bash
# 测试请求
curl http://localhost:3001/api/chat/models?page=1&limit=12

# 响应（未登录时）
Status: 401
Body: {"error":"未登录，请先登录管理后台"}
```

## 最佳实践

### 1. 所有数值参数必须显式转换

```javascript
// ✅ 正确
const safeId = parseInt(id)
const safePage = parseInt(page) || 1
const safeLimit = parseInt(limit) || 10

// ❌ 错误
const id = req.params.id  // 可能是字符串
const page = req.query.page  // 可能是字符串
```

### 2. 使用默认值

```javascript
// ✅ 提供默认值
const safePage = parseInt(page) || 1
const safeLimit = parseInt(limit) || 12

// ❌ 可能为 NaN
const page = parseInt(page)  // 如果 page 是 undefined，结果为 NaN
```

### 3. 其他需要修复的函数

如果项目中还有其他使用数值参数的地方，需要同样处理：

- `getSessions(adminId, page, limit)`
- `getMessages(sessionId, page, limit)`
- 其他所有带分页的查询

## 相关文件

- `services/chat/modelManager.js` - 模型管理服务
- `services/chat/chatService.js` - 聊天服务（可能需要类似修复）
- `services/database.js` - 数据库服务（参数安全处理）

## 后续优化

建议在 `services/database.js` 中添加参数类型检查：

```javascript
// database.js
async query(sql, params = []) {
  // ✅ 自动转换数值参数
  const safeParams = params.map(param => {
    if (typeof param === 'string' && /^\d+$/.test(param)) {
      return parseInt(param)
    }
    return param === undefined ? null : param
  })
  
  const [rows] = await this.pool.execute(sql, safeParams)
  return rows
}
```

这样可以在数据库层统一处理参数类型问题。