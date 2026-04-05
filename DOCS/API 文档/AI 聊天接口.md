# AI 聊天接口文档

> 涉及模块：chat.js, tools.js, admin.js(模型管理)
> 最后更新：2026-04-05

---

## 一、对话接口 (chat.js)

### 1.1 发送消息（流式 SSE）

- **方法**: POST
- **路径**: `/api/chat/send`
- **认证**: 管理员 JWT
- **说明**: 发送消息给 AI，返回 Server-Sent Events (SSE) 流式响应。支持多轮对话、工具调用、模型选择。

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| message | string | 是 | 用户消息内容 |
| conversationId | string/number | 否 | 会话 ID（首次对话可不传） |
| modelId | number | 否 | 模型 ID（默认使用系统默认模型） |
| tools | array | 否 | 允许使用的工具列表（默认全部可用） |

**请求示例**:
```json
{
  "message": "帮我分析一下3年级2班的数学成绩",
  "conversationId": "conv_abc123",
  "modelId": 1,
  "tools": ["query_data", "analyze_data"]
}
```

**SSE 响应格式**:

```
event: message
data: {"type":"content","content":"根据数据分析..."}

event: tool_call
data: {"type":"tool_call","name":"query_data","args":{"sql":"SELECT..."}}

event: tool_result
data: {"type":"tool_result","name":"query_data","result":[...]}

event: done
data: {"type":"done","conversationId":"conv_abc123","messageId":"msg_xyz789"}
```

**SSE 事件类型说明**:

| 事件类型 | 说明 | 触发时机 |
|----------|------|----------|
| `message` | AI 文本内容片段 | 流式输出过程中 |
| `tool_call` | AI 调用工具请求 | 需要获取数据时 |
| `tool_result` | 工具执行结果 | 工具执行完成后 |
| `error` | 错误信息 | 出现异常时 |
| `done` | 完成标记 | 对话结束 |

**错误事件示例**:
```
event: error
data: {"error":"API 密钥未配置","code":"NO_API_KEY"}
```

---

### 1.2 获取历史会话列表

- **方法**: GET
- **路径**: `/api/chat/conversations`
- **认证**: 管理员 JWT
- **说明**: 获取当前管理员的所有历史会话列表，按更新时间倒序排列

**请求参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 20 | 每页数量 |

**响应示例** (200):
```json
{
  "success": true,
  "conversations": [
    {
      "id": "conv_abc123",
      "title": "数学成绩分析",
      "modelId": 1,
      "modelName": "GPT-4o",
      "messageCount": 15,
      "lastMessageAt": "2026-04-05T09:30:00.000Z",
      "createdAt": "2026-04-05T08:00:00.000Z"
    },
    {
      "id": "conv_def456",
      "title": "学生行为分析讨论",
      "modelId": 2,
      "modelName": "Claude-3.5",
      "messageCount": 8,
      "lastMessageAt": "2026-04-04T16:20:00.000Z",
      "createdAt": "2026-04-04T14:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "totalPages": 2
  }
}
```

---

### 1.3 获取单个会话详情

- **方法**: GET
- **路径**: `/api/chat/conversations/:conversationId`
- **认证**: 管理员 JWT
- **说明**: 获取指定会话的完整消息记录

**路径参数**:

| 参数名 | 类型 | 说明 |
|--------|------|------|
| conversationId | string | 会话 ID |

**响应示例** (200):
```json
{
  "success": true,
  "conversation": {
    "id": "conv_abc123",
    "title": "数学成绩分析",
    "modelId": 1,
    "modelName": "GPT-4o",
    "createdAt": "2026-04-05T08:00:00.000Z",
    "updatedAt": "2026-04-05T09:30:00.000Z",
    "messages": [
      {
        "id": "msg_001",
        "role": "user",
        "content": "帮我分析一下3年级2班的数学成绩",
        "timestamp": "2026-04-05T08:00:01.000Z"
      },
      {
        "id": "msg_002",
        "role": "assistant",
        "content": "好的，我来为您分析...",
        "toolCalls": [
          {
            "name": "query_data",
            "arguments": { "sql": "SELECT ..." },
            "result": [...]
          }
        ],
        "timestamp": "2026-04-05T08:00:03.000Z"
      },
      {
        "id": "msg_003",
        "role": "user",
        "content": "能详细说说错题分布吗？",
        "timestamp": "2026-04-05T09:29:55.000Z"
      }
    ]
  }
}
```

---

### 1.4 删除会话

- **方法**: DELETE
- **路径**: `/api/chat/conversations/:conversationId`
- **认证**: 管理员 JWT
- **说明**: 删除指定会话及其所有消息记录

**路径参数**:

| 参数名 | 类型 | 说明 |
|--------|------|------|
| conversationId | string | 会话 ID |

**响应示例** (200):
```json
{ "success": true, "message": "会话已删除" }
```

---

### 1.5 清空所有会话

- **方法**: DELETE
- **路径**: `/api/chat/conversations`
- **认证**: 管理员 JWT
- **说明**: 删除当前管理员的所有会话和消息

**响应示例** (200):
```json
{
  "success": true,
  "deletedCount": 25,
  "message": "已清空所有会话"
}
```

---

### 1.6 重命名会话标题

- **方法**: PUT
- **路径**: `/api/chat/conversations/:conversationId/title`
- **认证**: 管理员 JWT
- **说明**: 修改会话的显示标题

**路径参数**:

| 参数名 | 类型 | 说明 |
|--------|------|------|
| conversationId | string | 会话 ID |

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| title | string | 是 | 新标题（最大100字符） |

**响应示例** (200):
```json
{ "success": true, "title": "新的会话标题" }
```

---

## 二、AI 模型管理 (admin.js)

### 2.1 获取所有 AI 模型配置

- **方法**: GET
- **路径**: `/api/admin/models`
- **认证**: 管理员 JWT
- **说明**: 获取系统中配置的所有 AI 模型列表及其状态

**响应示例** (200):
```json
{
  "success": true,
  "models": [
    {
      "id": 1,
      "name": "GPT-4o",
      "provider": "openai",
      "apiKey": "sk-****...****",   // 脱敏显示
      "baseUrl": "https://api.openai.com/v1",
      "model": "gpt-4o",
      "isActive": true,
      "isDefault": true,
      "maxTokens": 4096,
      "temperature": 0.7,
      "systemPrompt": "你是一个教育系统的智能助手...",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-04-01T10:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Claude-3.5-Sonnet",
      "provider": "anthropic",
      "apiKey": "sk-ant-****...****",
      "baseUrl": "https://api.anthropic.com/v1",
      "model": "claude-3-5-sonnet-20241022",
      "isActive": true,
      "isDefault": false,
      "maxTokens": 8192,
      "temperature": 0.7,
      "systemPrompt": null,
      "createdAt": "2026-02-15T00:00:00.000Z",
      "updatedAt": "2026-03-20T08:00:00.000Z"
    }
  ],
  "defaultModelId": 1
}
```

---

### 2.2 添加新模型配置

- **方法**: POST
- **路径**: `/api/admin/models`
- **认证**: 管理员 JWT
- **说明**: 添加新的 AI 模型配置

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | 模型显示名称 |
| provider | string | 是 | 提供商：openai/anthropic/custom |
| apiKey | string | 是 | API 密钥 |
| baseUrl | string | 是 | API 基础 URL |
| model | string | 是 | 模型标识符 |
| maxTokens | number | 否 | 最大 Token 数（默认4096） |
| temperature | number | 否 | 温度参数（默认0.7） |
| systemPrompt | string | 否 | 系统提示词 |
| isActive | boolean | 否 | 是否启用（默认true） |
| isDefault | boolean | 否 | 是否设为默认（默认false） |

**请求示例**:
```json
{
  "name": "DeepSeek-V3",
  "provider": "custom",
  "apiKey": "sk-your-api-key",
  "baseUrl": "https://api.deepseek.com/v1",
  "model": "deepseek-chat",
  "maxTokens": 8192,
  "temperature": 0.7,
  "systemPrompt": "你是教育数据分析专家",
  "isActive": true,
  "isDefault": false
}
```

**响应示例** (201):
```json
{
  "success": true,
  "model": { ... },  // 新创建的模型对象（不含明文密钥）
  "message": "模型添加成功"
}
```

**错误响应**:
```json
{ "error": "缺少必填字段" }                    // 400
{ "error": "API Key 已存在" }                   // 400
{ "error": "添加模型失败" }                      // 500
```

---

### 2.3 更新模型配置

- **方法**: PUT
- **路径**: `/api/admin/models/:id`
- **认证**: 管理员 JWT
- **说明**: 更新已有模型的配置信息

**路径参数**:

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | number | 模型 ID |

**请求参数**: 同 2.2（所有字段均为可选，仅更新传入的字段）

**特殊处理**:
- 如果传入 `isDefault: true`，自动将其他模型的 `isDefault` 设为 false
- 如果修改了 `apiKey`，需要重新验证有效性

**响应示例** (200): 返回更新后的模型对象

---

### 2.4 删除模型配置

- **方法**: DELETE
- **路径**: `/api/admin/models/:id`
- **认证**: 管理员 JWT
- **说明**: 删除指定的 AI 模型配置。不可删除当前正在使用或唯一的模型。

**路径参数**:

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | number | 模型 ID |

**响应示例** (200):
```json
{ "success": true, "message": "模型已删除" }
```

**错误响应**:
```json
{ "error": "无法删除默认模型，请先设置其他模型为默认" }   // 400
{ "error": "模型不存在" }                                   // 404
```

---

### 2.5 设置默认模型

- **方法**: POST
- **路径**: `/api/admin/models/:id/set-default`
- **认证**: 管理员 JWT
- **说明**: 将指定模型设置为系统默认模型

**路径参数**:

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | number | 模型 ID |

**响应示例** (200):
```json
{ "success": true, "message": "已将 GPT-4o 设为默认模型" }
```

---

### 2.6 测试模型连接

- **方法**: POST
- **路径**: `/api/admin/models/:id/test`
- **认证**: 管理员 JWT
- **说明**: 测试指定模型的 API 连接是否正常，发送简单的测试请求验证密钥有效性

**路径参数**:

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | number | 模型 ID |

**响应示例** (200):
```json
{
  "success": true,
  "status": "connected",
  "responseTime": 520,     // 毫秒
  "testMessage": "Hello! I'm working correctly.",
  "message": "模型连接测试成功"
}
```

**错误响应**:
```json
{ "success": false, "status": "failed", "error": "API Key 无效或已过期" }
{ "success": false, "status": "timeout", "error": "连接超时" }
```

---

## 三、工具元数据 (tools.js)

### 3.1 获取所有可用工具列表

- **方法**: GET
- **路径**: `/api/tools`
- **认证**: 无需
- **说明**: 获取 AI 可调用的所有工具定义列表，用于 Function Calling 功能

**响应示例** (200):
```json
{
  "success": true,
  "tools": [
    {
      "name": "query_data",
      "description": "执行 SQL 查询获取教育系统数据",
      "parameters": {
        "type": "object",
        "properties": {
          "sql": {
            "type": "string",
            "description": "要执行的 SQL 查询语句"
          }
        },
        "required": ["sql"]
      },
      "category": "数据查询",
      "riskLevel": "high",           // high/medium/low
      "requiresConfirmation": true   // 高风险操作需确认
    },
    {
      "name": "analyze_data",
      "description": "对查询结果进行统计分析",
      "parameters": {
        "type": "object",
        "properties": {
          "data": { "type": "array", "description": "待分析的数据" },
          "analysisType": {
            "type": "string",
            "enum": ["statistical", "trend", "comparison", "distribution"],
            "description": "分析类型"
          }
        },
        "required": ["data", "analysisType"]
      },
      "category": "数据分析",
      "riskLevel": "low",
      "requiresConfirmation": false
    }
  ]
}
```

---

### 3.2 获取工具分类列表

- **方法**: GET
- **路径**: `/api/tools/categories`
- **认证**: 无需
- **说明**: 获取工具的分类信息及各分类下的工具数量

**响应示例** (200):
```json
{
  "success": true,
  "categories": [
    {
      "name": "数据查询",
      "count": 3,
      "tools": ["query_data", "get_user_stats", "get_class_stats"],
      "icon": "database"
    },
    {
      "name": "数据分析",
      "count": 4,
      "tools": ["analyze_data", "generate_chart", "export_report", "compare_data"],
      "icon": "chart"
    },
    {
      "name": "系统管理",
      "count": 2,
      "tools": ["update_settings", "send_notification"],
      "icon": "settings"
    }
  ]
}
```

---

### 3.3 获取单个工具详情

- **方法**: GET
- **路径**: `/api/tools/:toolName`
- **认证**: 无需
- **说明**: 获取指定工具的完整定义和说明文档

**路径参数**:

| 参数名 | 类型 | 说明 |
|--------|------|------|
| toolName | string | 工具名称 |

**响应示例** (200):
```json
{
  "success": true,
  "tool": {
    "name": "query_data",
    "displayName": "数据查询",
    "description": "执行 SQL 查询获取教育系统数据",
    "category": "数据查询",
    "riskLevel": "high",
    "requiresConfirmation": true,
    "parameters": { ... },
    "examples": [
      {
        "description": "查询班级平均分",
        "input": { "sql": "SELECT grade, class, AVG(score) FROM answer_records GROUP BY grade, class" },
        "output": [{ "grade": "3年级", "class": "2班", "AVG(score)": 85.5 }]
      }
    ],
    "limitations": [
      "仅支持 SELECT 查询",
      "禁止修改操作（INSERT/UPDATE/DELETE）",
      "单次查询限制返回1000条记录"
    ],
    "version": "1.0.0",
    "lastUpdated": "2026-04-01T00:00:00.000Z"
  }
}
```

---

## 四、SSE 流式协议详解

### 4.1 连接建立

前端使用 EventSource 或 fetch + ReadableStream 建立 SSE 连接：

```javascript
// 使用 fetch 方式（推荐，支持 POST）
const response = await fetch('/api/chat/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ message: '你好' })
})

const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  
  const text = decoder.decode(value)
  // 解析 SSE 格式: event: xxx\ndata: {...}\n\n
}
```

### 4.2 心跳机制

服务端每 15 秒发送一次心跳包保持连接：

```
event: heartbeat
data: {"type":"heartbeat","timestamp":1712304000000}
```

### 4.3 错误恢复

| 错误码 | 含义 | 处理建议 |
|--------|------|----------|
| NO_API_KEY | 未配置 API Key | 提示管理员配置 |
| RATE_LIMITED | 触发速率限制 | 等待后重试 |
| CONTEXT_TOO_LONG | 上下文超出限制 | 建议新建会话 |
| MODEL_ERROR | 模型调用失败 | 切换模型或检查配置 |
| TIMEOUT | 响应超时 | 重试或简化问题 |

---

## 五、安全与权限

### 5.1 工具调用权限控制

| 风险等级 | 权限要求 | 示例工具 |
|----------|----------|----------|
| low | 所有用户可用 | analyze_data, get_user_stats |
| medium | 需管理员确认 | export_report, generate_chart |
| high | 需管理员确认+审计日志 | query_data, update_settings |

### 5.2 内容安全过滤

- 输入过滤：检测恶意 prompt 注入攻击
- 输出过滤：检测敏感信息泄露
- SQL 防护：工具调用仅允许 SELECT 语句
- 频率限制：单用户每分钟最多 10 次请求

### 5.3 审计日志

所有 AI 对话和工具调用均记录审计日志：

```
时间 | 管理员ID | 操作类型 | 详情 | IP地址
2026-04-05 09:30:01 | admin_1 | chat_send | 发送消息 | 192.168.1.100
2026-04-05 09:30:02 | admin_1 | tool_call | query_data | 192.168.1.100
```
