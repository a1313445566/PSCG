# AI 聊天 API 文档

## 基础信息

- **基础路径**: `/api/chat`
- **认证方式**: 管理员 JWT Token
- **响应格式**: JSON
- **特性**: 支持流式响应、工具调用、缓存

---

## API 接口列表

### 1. 创建聊天会话

**请求**
```
POST /api/chat/sessions
```

**认证**: 需要管理员 Token

**请求体**
```json
{
  "title": "新会话",
  "modelName": "gpt-4",
  "systemPrompt": "你是一个教学助手"
}
```

**响应示例**
```json
{
  "success": true,
  "data": {
    "sessionId": "chat-session-123",
    "title": "新会话",
    "modelName": "gpt-4",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### 2. 发送消息

**请求**
```
POST /api/chat/sessions/:sessionId/messages
```

**认证**: 需要管理员 Token

**路径参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sessionId | string | 是 | 会话 ID |

**请求体**
```json
{
  "content": "帮我生成 10 道数学选择题",
  "tools": ["query_questions", "query_database"],
  "stream": true
}
```

**响应示例（非流式）**
```json
{
  "success": true,
  "data": {
    "messageId": 1,
    "role": "assistant",
    "content": "好的，我为您生成 10 道数学选择题...",
    "tokens": {
      "input": 50,
      "output": 200,
      "total": 250
    },
    "cost": 0.002,
    "cached": false,
    "toolsUsed": [
      {
        "name": "query_questions",
        "result": "查询到 50 道题目"
      }
    ]
  }
}
```

**流式响应**
```
data: {"content": "好的"}
data: {"content": "，我"}
data: {"content": "为您"}
...
data: [DONE]
```

### 3. 获取会话列表

**请求**
```
GET /api/chat/sessions
```

**认证**: 需要管理员 Token

**查询参数**
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| status | string | 否 | active | 状态 (active/archived) |
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 20 | 每页数量 |

**响应示例**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "sessionId": "chat-session-123",
        "title": "数学题目生成",
        "modelName": "gpt-4",
        "messageCount": 10,
        "totalTokens": 5000,
        "totalCost": 0.05,
        "status": "active",
        "createdAt": "2024-01-01T12:00:00.000Z",
        "lastMessageAt": "2024-01-01T14:00:00.000Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### 4. 获取会话详情

**请求**
```
GET /api/chat/sessions/:sessionId
```

**认证**: 需要管理员 Token

**响应示例**
```json
{
  "success": true,
  "data": {
    "sessionId": "chat-session-123",
    "title": "数学题目生成",
    "modelName": "gpt-4",
    "status": "active",
    "messageCount": 10,
    "totalTokens": 5000,
    "totalCost": 0.05,
    "messages": [
      {
        "id": 1,
        "role": "user",
        "content": "帮我生成 10 道数学选择题",
        "tokens": 20,
        "createdAt": "2024-01-01T12:00:00.000Z"
      },
      {
        "id": 2,
        "role": "assistant",
        "content": "好的，我为您生成...",
        "tokens": 200,
        "toolsUsed": ["query_questions"],
        "createdAt": "2024-01-01T12:01:00.000Z"
      }
    ]
  }
}
```

### 5. 更新会话

**请求**
```
PUT /api/chat/sessions/:sessionId
```

**认证**: 需要管理员 Token

**请求体**
```json
{
  "title": "更新后的标题",
  "status": "archived"
}
```

**响应示例**
```json
{
  "success": true,
  "message": "会话更新成功"
}
```

### 6. 删除会话

**请求**
```
DELETE /api/chat/sessions/:sessionId
```

**认证**: 需要管理员 Token

**响应示例**
```json
{
  "success": true,
  "message": "会话已删除"
}
```

### 7. 获取 Token 使用统计

**请求**
```
GET /api/chat/stats
```

**认证**: 需要管理员 Token

**查询参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |
| modelName | string | 否 | 模型名称 |

**响应示例**
```json
{
  "success": true,
  "data": {
    "totalTokens": 100000,
    "totalCost": 1.5,
    "totalSessions": 50,
    "totalMessages": 500,
    "byModel": [
      {
        "modelName": "gpt-4",
        "tokens": 80000,
        "cost": 1.2
      },
      {
        "modelName": "gpt-3.5-turbo",
        "tokens": 20000,
        "cost": 0.3
      }
    ],
    "cacheHits": 100,
    "cacheHitRate": 20
  }
}
```

### 8. 获取 AI 模型列表

**请求**
```
GET /api/chat/models
```

**认证**: 需要管理员 Token

**响应示例**
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": 1,
        "name": "GPT-4",
        "provider": "OpenAI",
        "modelId": "gpt-4",
        "isEnabled": true,
        "isPrimary": true,
        "priority": 1,
        "maxTokens": 8192,
        "costPer1kInput": 0.03,
        "costPer1kOutput": 0.06
      }
    ]
  }
}
```

---

## 工具调用

### 内置工具

#### 1. query_questions - 查询题目
```json
{
  "name": "query_questions",
  "description": "查询题目数据库",
  "parameters": {
    "subjectId": 1,
    "type": "single",
    "difficulty": 2,
    "limit": 10
  }
}
```

#### 2. query_database - 通用数据库查询
```json
{
  "name": "query_database",
  "description": "执行数据库查询",
  "parameters": {
    "table": "users",
    "conditions": {
      "grade": "六年级"
    }
  }
}
```

---

## 缓存机制

### 缓存命中
- 相同的查询会命中缓存
- 缓存永久有效
- 缓存命中率可在统计中查看

### 缓存示例
```json
{
  "cached": true,
  "cacheHitCount": 5,
  "tokensSaved": 1000
}
```

---

## 错误响应

### 400 Bad Request
```json
{
  "error": "请求参数错误"
}
```

### 401 Unauthorized
```json
{
  "error": "未授权访问"
}
```

### 404 Not Found
```json
{
  "error": "会话不存在"
}
```

### 500 Internal Server Error
```json
{
  "error": "服务器内部错误"
}
```

---

## 使用示例

### 前端调用示例
```javascript
// 创建会话
const createSession = async (title, modelName) => {
  const response = await fetch('/api/chat/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title, modelName })
  })
  const data = await response.json()
  return data.data
}

// 发送消息（非流式）
const sendMessage = async (sessionId, content) => {
  const response = await fetch(
    `/api/chat/sessions/${sessionId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    }
  )
  const data = await response.json()
  return data.data
}

// 发送消息（流式）
const sendStreamMessage = async (sessionId, content) => {
  const response = await fetch(
    `/api/chat/sessions/${sessionId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content, stream: true })
    }
  )
  
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    
    const text = decoder.decode(value)
    const lines = text.split('\n')
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6))
        console.log('收到:', data.content)
      }
    }
  }
}
```

---

## 注意事项

1. **Token 限制**: 每个模型有最大 Token 限制
2. **速率限制**: AI 接口有速率限制，避免频繁请求
3. **成本控制**: 注意 Token 使用成本
4. **会话过期**: 长时间不活动的会话可能过期
5. **工具调用**: 工具调用会增加响应时间
6. **缓存优化**: 相同查询会命中缓存，节省 Token
