# LangChain 智能对话系统需求文档（修订版）

**项目**：PSCG 小学智能答题系统  
**模块**：AI 智能对话（LangChain Chat）  
**版本**：v2.0（修订版）  
**创建日期**：2026-03-31  
**状态**：需求定义  

---

## 一、需求概述

### 1.1 项目背景

PSCG 是一个**小学智能答题系统**，面向小学1-6年级学生。系统已积累大量教学数据（学生答题记录、题目数据、学习进度等），管理员/教师在查看和分析这些数据时需要手动操作多个功能模块，效率较低。需要一个智能对话入口，让管理员通过自然语言快速查询和分析系统数据。

### 1.2 核心目标

1. **AI 自主分析**：AI 理解管理员意图，直接查询数据库获取信息
2. **多模型管理**：支持多个 LLM 的配置、切换和热更新（复用已有 `ai_models` 表）
3. **Token 优化**：通过缓存、上下文压缩降低消耗
4. **健壮错误处理**：完善的异常捕获、降级策略

### 1.3 适用范围

仅面向**后台管理员/教师**，提供：系统数据概览、班级学情分析、学生个人画像、错题统计、学科教学辅助。

---

## 二、架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────┐
│     后台管理系统 (AdminView.vue - Tab 页集成)     │
│  src/components/admin/chat/                      │
│  ├── ChatContainer.vue    # 聊天容器（Tab 内容）   │
│  ├── MessageList.vue      # 消息列表              │
│  ├── ChatInput.vue        # 输入组件              │
│  ├── SessionList.vue      # 会话列表侧边栏        │
│  └── ModelManager.vue     # 模型管理对话框        │
└─────────────────────────────────────────────────┘
                      │ SSE (text/event-stream)
                      ▼
┌─────────────────────────────────────────────────┐
│                API 网关层 (Express)               │
│  adminAuth → rateLimit → routes/chat.js          │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│            LangChain 服务层                        │
│  createReactAgent + Tools + Memory                │
│  services/chat/                                   │
│  ├── agent.js              # Agent 创建与配置     │
│  ├── tools/                # 8 个数据库查询工具    │
│  ├── chatService.js        # 对话业务逻辑        │
│  ├── cacheService.js       # 缓存服务            │
│  ├── modelManager.js       # 模型管理            │
│  └── contextCompressor.js  # 上下文压缩          │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│              数据层 (MySQL 8.0)                    │
│  复用已有: ai_models / ai_chat_sessions / ai_chat_history │
│  新增: token_usage / cache_hits                   │
└─────────────────────────────────────────────────┘
```

### 2.2 技术选型

| 组件 | 技术方案 | 版本 | 说明 |
|------|----------|------|------|
| LangChain 核心 | `langchain` + `@langchain/langgraph` | ^0.3.x | **使用 langgraph 的 createReactAgent** |
| 模型适配 | `@langchain/openai` | ^0.3.x | 兼容 OpenAI 格式 |
| 工具定义 | `@langchain/core/tools` 中的 `tool` | - | **从 core 导入，非从 langchain 顶层** |
| 参数校验 | `zod` | ^3.23.x | LangChain 工具参数必需 |
| 流式响应 | Server-Sent Events (SSE) | - | 需扩展 api.js 支持 |
| 对话记忆 | MySQL 持久化 | - | 复用已有 ai_chat_history 表 |

### 2.3 关键修正说明

> 以下是相较于原需求文档的关键修正，开发时务必遵守：

| 修正项 | 原需求 | 修正后 |
|--------|--------|--------|
| **LangChain API** | `createAgent` 从 `langchain` 导入（不存在） | 使用 `@langchain/langgraph` 的 `createReactAgent` |
| **tool 导入** | `const { tool } = require('langchain')` | `const { tool } = require('@langchain/core/tools')` |
| **数据库表** | 重新建 3 张新表 | **复用已有 `ai_chat_system.sql`** 的 3 张表 |
| **管理员认证** | `req.user.id` | `req.admin.id`（匹配 `adminAuth.js` 中间件） |
| **前端路由** | 独立 `/admin/chat` 路由 | **AdminView 内新增 Tab** `activeMenu === 'ai-chat'` |
| **响应格式** | `{ code, success, data, message }` | **统一为 `{ success, data }` 或 `{ error }`** |
| **消息提示** | 直接使用 `ElMessage` | **必须使用 `@/utils/message.js`** |
| **XSS 防护** | `v-html` 无过滤 | **必须使用 `@/utils/xss-filter.js`** |
| **SSE 流式** | 假定 api.js 支持 | **需新增 `api.stream()` 方法** |
| **server.cjs** | 未提及超时 | **需将 `server.timeout` 提高至 60000ms** |

---

## 三、数据库设计

### 3.1 复用已有表（`scripts/migrations/ai_chat_system.sql`）

**不修改表结构**，直接使用以下 3 张已有表：

#### `ai_models` — AI 模型配置表

```sql
-- 已有字段
id INT PK AUTO_INCREMENT
name VARCHAR(100)           -- 模型名称
provider VARCHAR(50)        -- 提供商 (scnet/openai/deepseek等)
base_url VARCHAR(255)       -- API 基础地址
api_key VARCHAR(255)        -- API 密钥（加密存储）
model_id VARCHAR(100)       -- 模型标识
is_default TINYINT DEFAULT 0  -- 是否默认模型
is_active TINYINT DEFAULT 1   -- 是否启用
config JSON                 -- 扩展配置 (max_tokens, temperature等)
created_at / updated_at TIMESTAMP
```

#### `ai_chat_sessions` — 对话会话表

```sql
-- 已有字段
id VARCHAR(50) PK           -- 会话ID (用 crypto.randomUUID() 生成)
admin_id INT FK             -- 管理员ID → admin_credentials.id
title VARCHAR(200)           -- 会话标题
model_id INT                -- 使用的模型ID (FK → ai_models.id)
message_count INT DEFAULT 0  -- 消息数量
last_message_at TIMESTAMP   -- 最后消息时间
created_at TIMESTAMP
```

#### `ai_chat_history` — 对话历史表

```sql
-- 已有字段
id INT PK AUTO_INCREMENT
session_id VARCHAR(50) FK   -- → ai_chat_sessions.id
admin_id INT FK             -- → admin_credentials.id
model_id INT                -- 使用的模型ID
role ENUM('user','assistant','system','tool')  -- 消息角色
content TEXT                -- 消息内容
tool_calls JSON             -- 工具调用信息
tool_call_id VARCHAR(100)   -- 工具调用ID
tokens_used INT DEFAULT 0   -- 消耗token数
created_at TIMESTAMP
```

> **注意**：已有表的字段命名与原需求文档不同，后端代码必须使用**已有字段名**，如 `base_url`（不是 `api_url`）、`is_default`（不是 `is_primary`）、`tokens_used`（不是 `tokens`）。

### 3.2 新增表

#### `token_usage` — Token 使用记录表

```sql
CREATE TABLE IF NOT EXISTS token_usage (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT NOT NULL COMMENT '管理员ID',
  session_id VARCHAR(50) NOT NULL COMMENT '会话ID → ai_chat_sessions.id',
  model_id INT COMMENT '关联 ai_models.id',
  input_tokens INT DEFAULT 0 COMMENT '输入 Token 数',
  output_tokens INT DEFAULT 0 COMMENT '输出 Token 数',
  total_tokens INT DEFAULT 0 COMMENT '总 Token 数',
  cost DECIMAL(10,6) DEFAULT 0 COMMENT '成本估算（元）',
  cached TINYINT(1) DEFAULT 0 COMMENT '是否命中缓存',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_admin_id (admin_id),
  INDEX idx_session_id (session_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (admin_id) REFERENCES admin_credentials(id) ON DELETE CASCADE,
  FOREIGN KEY (model_id) REFERENCES ai_models(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Token 使用记录表';
```

#### `cache_hits` — 缓存命中记录表

```sql
CREATE TABLE IF NOT EXISTS cache_hits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  query_hash VARCHAR(32) NOT NULL COMMENT 'MD5前32位，作为缓存键',
  query_text TEXT NOT NULL COMMENT '原始查询文本',
  response_json TEXT NOT NULL COMMENT '缓存的响应JSON',
  hit_count INT DEFAULT 1 COMMENT '命中次数',
  tokens_saved INT DEFAULT 0 COMMENT '累计节省的 Token 数',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '首次缓存时间',
  last_hit_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后命中时间',
  UNIQUE INDEX idx_query_hash (query_hash),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='缓存命中记录表';
```

> **说明**：以上 SQL 应保存为 `scripts/migrations/ai_chat_models_extra.sql`，在开发阶段 1 执行。

---

## 四、核心功能需求

### 4.1 AI Agent + Tools（数据库自主分析）

#### 4.1.1 Agent 创建方式（正确 API）

```javascript
// services/chat/agent.js
const { ChatOpenAI } = require('@langchain/openai')
const { createReactAgent } = require('@langchain/langgraph/prebuilt')
const { tools } = require('./tools')

/**
 * 创建 ReAct Agent
 * @param {object} modelConfig - 从 ai_models 表读取的配置
 */
function createChatAgent(modelConfig) {
  const model = new ChatOpenAI({
    modelName: modelConfig.model_id,
    openAIApiKey: modelConfig.api_key,
    configuration: { baseURL: modelConfig.base_url },
    maxTokens: modelConfig.config?.max_tokens || 4096,
    temperature: modelConfig.config?.temperature || 0.6
  })

  return createReactAgent({
    llm: model,
    tools,
    prompt: `你是 PSCG 小学智能答题系统的数据分析助手。
你可以通过工具查询系统数据，帮助管理员分析学生的学习情况、班级数据、错题统计等。
请用简洁、专业的中文回答问题，数据以表格或列表形式展示。

重要提示：
- users.grade 字段是 VARCHAR 类型（如"1"、"2"），不是数字
- 题目 ID 范围为 2-401
- 学科ID：1=道德与法治, 2=语文, 34=语文机测`
  })
}

module.exports = { createChatAgent }
```

#### 4.1.2 工具集定义

**文件结构**：

```
services/chat/tools/
├── index.js               # 工具注册入口
├── studentStatsTool.js    # 学生统计工具
├── classAnalysisTool.js   # 班级学情分析工具
├── errorAnalysisTool.js   # 错题分析工具
├── subjectProgressTool.js # 学科掌握进度工具
├── questionInfoTool.js    # 题目详情查询工具
├── systemOverviewTool.js  # 系统概览工具
├── timeTrendTool.js       # 时间趋势工具
└── weakPointsTool.js      # 薄弱知识点工具
```

**工具注册入口**（正确导入方式）：

```javascript
// services/chat/tools/index.js
const { tool } = require('@langchain/core/tools')  // ✅ 正确：从 core 导入
const { z } = require('zod')

const studentStatsTool = require('./studentStatsTool')
// ... 其余工具同理

const tools = [
  studentStatsTool,
  // classAnalysisTool,
  // ... 其余 7 个
]

module.exports = { tools }
```

**工具清单**：

| 工具名称 | 用途 | 主要参数 |
|----------|------|----------|
| `query_student_stats` | 学生学习统计 | studentId, subjectId, grade, dateRange |
| `query_class_analysis` | 班级学情分析 | grade(1-6), className, subjectId |
| `query_error_analysis` | 错题分析 | studentId, subjectId, grade |
| `query_subject_progress` | 学科掌握进度 | studentId, subjectId |
| `query_question_info` | 题目详情 | questionId(2-401) |
| `query_system_overview` | 系统概览 | 无 |
| `query_time_trend` | 时间趋势 | startDate, endDate, granularity |
| `query_weak_points` | 薄弱知识点 | studentId, subjectId |

**工具示例**（studentStatsTool）：

```javascript
// services/chat/tools/studentStatsTool.js
const { tool } = require('@langchain/core/tools')
const { z } = require('zod')
const db = require('../../database')

const studentStatsTool = tool(
  async ({ studentId, subjectId, grade, startDate, endDate }) => {
    let sql = `
      SELECT u.id, u.student_id, u.name, u.grade, u.class, u.points,
        COUNT(DISTINCT ar.id) as total_sessions,
        SUM(ar.total_questions) as total_questions,
        SUM(ar.correct_count) as correct_count,
        CASE WHEN SUM(ar.total_questions) > 0
          THEN ROUND(SUM(ar.correct_count) * 100.0 / SUM(ar.total_questions), 2)
          ELSE 0 END as accuracy
      FROM users u
      LEFT JOIN answer_records ar ON u.id = ar.user_id
      WHERE 1=1
    `
    const params = []
    if (studentId) { sql += ' AND u.id = ?'; params.push(studentId) }
    if (subjectId) { sql += ' AND ar.subject_id = ?'; params.push(subjectId) }
    if (grade) { sql += ' AND u.grade = ?'; params.push(grade) }
    if (startDate) { sql += ' AND ar.created_at >= ?'; params.push(startDate) }
    if (endDate) { sql += ' AND ar.created_at <= ?'; params.push(endDate + ' 23:59:59') }
    sql += ' GROUP BY u.id ORDER BY total_sessions DESC LIMIT 100'

    const results = await db.all(sql, params)
    return JSON.stringify({ success: true, data: results, count: results.length })
  },
  {
    name: 'query_student_stats',
    description: '查询学生学习统计数据：答题次数、正确率、积分等。可按年级、学科、时间范围筛选',
    schema: z.object({
      studentId: z.number().int().positive().optional().describe('学生ID'),
      subjectId: z.number().int().positive().optional().describe('学科ID'),
      grade: z.string().regex(/^[1-6]$/).optional().describe('年级(1-6, 字符串)'),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('开始日期 YYYY-MM-DD'),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('结束日期 YYYY-MM-DD')
    })
  }
)

module.exports = studentStatsTool
```

### 4.2 大模型管理（前端页面 + 后端服务）

#### 4.2.1 功能概述

大模型管理是一个**独立的管理页面**，作为 AdminView 的 Tab 页存在（菜单 key: `ai-models`）。管理员可在此页面进行 AI 模型的增删改查、连接测试、默认模型切换等操作。

**入口**：AdminLayout 侧边栏 → 「模型管理」菜单

#### 4.2.2 页面布局

```
┌──────────────────────────────────────────────────────────────┐
│  模型管理                                        [+ 添加模型] │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐    │
│  │  模型卡片列表（el-row + el-col 响应式布局）           │    │
│  │                                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐   │    │
│  │  │ 🟢 DeepSeek   │  │ 🟢 通义千问   │  │ ⚫ GPT-4  │   │    │
│  │  │ 默认模型      │  │              │  │ 已停用    │   │    │
│  │  │ 模型: chat   │  │ 模型: qwen   │  │ 模型: gpt │   │    │
│  │  │ 提供商: scnet│  │ 提供商: dash  │  │ 提供商: op│   │    │
│  │  │ 温度: 0.6    │  │ 温度: 0.7    │  │ 温度: 0.5 │   │    │
│  │  │ Token: 4096  │  │ Token: 8192  │  │ Token:4096│   │    │
│  │  │              │  │              │  │          │   │    │
│  │  │ [测试] [编辑] │  │ [测试] [编辑] │  │ [编辑]   │   │    │
│  │  │ [设为默认]   │  │ [设为默认]   │  │ [删除]   │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────┘   │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  统计概览                                             │    │
│  │  已启用模型: 3/5  │  默认模型: DeepSeek  │  本月Token │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

#### 4.2.3 模型卡片信息展示

每个模型以卡片形式展示以下信息：

| 字段 | 来源（ai_models 表字段） | 展示方式 |
|------|--------------------------|----------|
| 模型名称 | `name` | 卡片标题 |
| 模型标识 | `model_id` | 副标题 |
| 提供商 | `provider` | el-tag 标签（颜色按 provider 区分） |
| 状态 | `is_active` | 左上角圆点：🟢=启用（1），⚫=停用（0） |
| 默认标记 | `is_default` | 启用模型显示「默认模型」徽章 |
| API 地址 | `base_url` | 截断显示，hover 显示完整地址 |
| 参数配置 | `config` JSON | max_tokens、temperature 以标签展示 |
| 创建时间 | `created_at` | 底部小字 |

**提供商标签颜色映射**：

| provider | 标签颜色 |
|----------|----------|
| scnet | primary（蓝） |
| openai | success（绿） |
| deepseek | warning（橙） |
| dashscope | danger（红） |
| 其他 | info（灰） |

#### 4.2.4 模型表单对话框

点击「添加模型」或「编辑」按钮弹出 `el-dialog`，包含 `ModelForm.vue`：

| 表单字段 | 组件 | 校验规则 | 说明 |
|----------|------|----------|------|
| 模型名称 | `el-input` | 必填，2-50 字符 | 展示用名称 |
| 提供商 | `el-select` | 必填 | 下拉选择：scnet/openai/deepseek/dashscope/自定义 |
| 模型标识 | `el-input` | 必填 | 如 `deepseek-chat`、`qwen-plus` |
| API 基础地址 | `el-input` | 必填，URL 格式 | 如 `https://api.deepseek.com/v1` |
| API 密钥 | `el-input show-password` | 必填 | 编辑时显示 `****`，未修改则不更新 |
| 最大 Token | `el-input-number` | 256-32768 | 默认 4096 |
| 温度 | `el-slider` | 0-2，步长 0.1 | 默认 0.6 |
| 启用状态 | `el-switch` | - | 默认开启 |
| 扩展配置 | `el-input type="textarea"` | 可选，JSON 格式 | 高级参数 |

#### 4.2.5 核心交互流程

**添加模型**：
1. 点击「添加模型」→ 弹出空表单对话框
2. 填写信息 → 前端校验（URL 格式、JSON 格式）→ `POST /api/chat/models`
3. 成功后刷新列表，`message.success('模型添加成功')`

**编辑模型**：
1. 点击卡片「编辑」→ 弹出预填表单（API Key 显示 `****`）
2. 修改后提交 `POST /api/chat/models`（带 `id`）
3. 后端判断：API Key 为 `****` 时保留原值，否则更新并重新加密

**删除模型**：
1. 点击「删除」→ `el-popconfirm` 确认
2. 提示：若为默认模型则不允许删除，需先切换默认
3. 确认后 `DELETE /api/chat/models/:id`

**测试连接**：
1. 点击「测试」→ 按钮变为 loading 状态，卡片显示「测试中...」
2. 调用 `POST /api/chat/models/:id/test`
3. 成功：卡片边框短暂变绿，`message.success('连接成功，响应时间: 320ms')`
4. 失败：卡片边框短暂变红，`message.error('连接失败: API Key 无效')`

**设为默认**：
1. 点击「设为默认」→ `PUT /api/chat/models/:id/default`
2. 成功后列表刷新，原默认模型徽章移除，新模型显示徽章

#### 4.2.6 前端组件设计

```
src/components/admin/models/
├── ModelManager.vue        # 模型管理主页面（Tab 内容）  ~250 行
├── ModelCard.vue           # 单个模型卡片               ~120 行
├── ModelForm.vue           # 模型表单对话框             ~200 行
└── composables/
    └── useModel.js         # 模型 CRUD 逻辑             ~120 行
```

**ModelManager.vue** 主页面：
- 顶部标题栏：标题 + 「添加模型」按钮
- 卡片列表：使用 `el-row` + `el-col`（:xs=24 :sm=12 :md=8）响应式布局
- 底部统计栏：已启用数/总数、默认模型名、本月 Token 用量
- 使用 `usePagination`，支持模型数量多时分页（每页 12 个）

**ModelCard.vue** 卡片组件：

```vue
<script setup>
const props = defineProps({
  model: { type: Object, required: true }
})
const emit = defineEmits(['edit', 'delete', 'setDefault', 'test'])

// 状态颜色映射
const providerColor = {
  scnet: 'primary', openai: 'success',
  deepseek: 'warning', dashscope: 'danger'
}
</script>
```

**useModel.js** Composable：
- `fetchModels()` — 获取模型列表（分页）
- `saveModel(data)` — 添加/更新模型
- `deleteModel(id)` — 删除模型
- `setDefault(id)` — 设为默认
- `testConnection(id)` — 测试连接
- 暴露 `cleanup()` 方法

#### 4.2.7 AdminLayout 菜单配置

在 `AdminLayout.vue` 中新增两个菜单项：

| 菜单名称 | key | 图标 | 组件 |
|----------|-----|------|------|
| AI 助手 | `ai-chat` | `ChatDotRound` | `ChatContainer.vue` |
| 模型管理 | `ai-models` | `Cpu` | `ModelManager.vue` |

```javascript
// AdminView.vue 新增
const AIChatView = defineAsyncComponent(
  () => import('../components/admin/chat/ChatContainer.vue')
)
const AIModelView = defineAsyncComponent(
  () => import('../components/admin/models/ModelManager.vue')
)

// template
<AIChatView v-else-if="activeMenu === 'ai-chat'" />
<AIModelView v-else-if="activeMenu === 'ai-models'" />
```

#### 4.2.8 后端服务

**模型管理服务** `services/chat/modelManager.js`：
- 从 `ai_models` 表读取配置（使用 `base_url` 而非 `api_url`）
- 热更新：内存缓存 + 60 秒定时刷新
- API Key 加密/解密使用 AES-256-GCM（密钥从 `ENCRYPTION_KEY` 环境变量读取）
- `getModel(modelId)` 按 `ai_models.id` 获取，`getDefaultModel()` 按 `is_default=1` 获取
- `testModel(modelId)` — 使用配置调用模型 API 发送测试 prompt，验证连通性并返回响应时间
- `toggleDefault(modelId)` — 先将所有模型 `is_default` 设为 0，再将目标设为 1（事务操作）

**模型管理接口**（路由文件：`routes/chat.js` 内）：

| 方法 | 路径 | 说明 | 请求体/参数 |
|------|------|------|-------------|
| GET | `/api/chat/models` | 模型列表（分页） | `?page=1&limit=12` |
| POST | `/api/chat/models` | 添加模型 | `{ name, provider, model_id, base_url, api_key, config, is_active }` |
| POST | `/api/chat/models` | 更新模型 | 同上 + `{ id }` |
| DELETE | `/api/chat/models/:id` | 删除模型 | - |
| POST | `/api/chat/models/:id/test` | 测试连接 | - |
| PUT | `/api/chat/models/:id/default` | 设为默认 | - |

> **注意**：列表接口返回时 `api_key` 字段置空或返回 `****`，禁止明文返回密钥。

#### 4.2.9 权限约束

- 所有模型管理接口必须通过 `adminAuth.js` 中间件验证
- API Key 只能由管理员配置，普通用户无法访问
- 模型列表接口不返回完整 API Key（仅 `****` 或省略）

### 4.3 Token 优化

| 策略 | 说明 | 实现方式 |
|------|------|----------|
| 上下文压缩 | 超过 10 轮对话时摘要历史 | `contextCompressor.js` |
| 智能缓存 | L1 内存 Map + L2 MySQL `cache_hits` | `cacheService.js` |
| 查询结果精简 | 只返回必要字段，SQL 指定列 | 工具内部实现 |
| 流式输出 | SSE 实时输出，支持用户中断 | 前端 `useStream` + 后端 SSE |
| 缓存键 | MD5(normalizedQuery:contextHash) 取前 32 位（非 16 位，避免碰撞） | `cacheService.js` |

### 4.4 错误处理

#### 错误码定义

```javascript
// utils/chatErrors.js
const ErrorCodes = {
  INVALID_QUERY: { code: 1001, message: '无效的查询内容' },
  QUERY_TOO_LONG: { code: 1002, message: '查询内容过长（最多2000字）' },
  SESSION_NOT_FOUND: { code: 1003, message: '会话不存在' },
  RATE_LIMIT_EXCEEDED: { code: 1005, message: '请求过于频繁' },
  MODEL_UNAVAILABLE: { code: 2001, message: 'AI模型不可用' },
  MODEL_TIMEOUT: { code: 2002, message: 'AI响应超时' },
  MODEL_RATE_LIMIT: { code: 2003, message: 'AI服务繁忙' },
  TOOL_EXECUTION_ERROR: { code: 3002, message: '工具执行失败' },
  DATABASE_ERROR: { code: 5002, message: '数据库查询失败' }
}
```

#### 降级策略

模型调用失败时按优先级降级：`is_default=1 的模型` → `其他 is_active=1 的模型` → 返回缓存结果 → 返回友好错误。

#### 超时处理

```
QUICK: 5秒   — 缓存命中、简单查询
NORMAL: 15秒 — 单工具调用
COMPLEX: 30秒 — 多工具调用
MAX: 60秒    — 最大等待（需同步修改 server.cjs 的 server.timeout）
```

---

## 五、API 接口设计

### 5.1 路由挂载

在 `server.cjs` 中挂载：`app.use('/api/chat', require('./routes/chat'))`

> 注意：模型管理接口可复用或合并到 `routes/chat.js`，无需单独文件。

### 5.2 统一响应格式

**与现有项目路由保持一致**：

```javascript
// 成功
{ success: true, data: { ... } }

// 错误
{ error: '错误描述' }

// 分页
{ success: true, data: { list: [...], total: 100, page: 1, limit: 20 } }
```

### 5.3 接口列表

#### 对话接口

| 方法 | 路径 | 说明 | 响应 |
|------|------|------|------|
| POST | `/api/chat/sessions` | 创建会话 | `{ success, data: { session } }` |
| POST | `/api/chat/sessions/:id/messages` | 发送消息（SSE 流式） | `text/event-stream` |
| GET | `/api/chat/sessions/:id/messages` | 获取历史消息（分页） | `{ success, data: { messages, total } }` |
| GET | `/api/chat/sessions` | 获取会话列表（分页） | `{ success, data: { sessions, total } }` |
| DELETE | `/api/chat/sessions/:id` | 删除会话 | `{ success, data: null }` |

#### 模型管理接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/chat/models` | 获取模型列表（不含 api_key） |
| POST | `/api/chat/models` | 添加/更新模型 |
| DELETE | `/api/chat/models/:id` | 删除模型 |
| POST | `/api/chat/models/:id/test` | 测试模型连接 |
| PUT | `/api/chat/models/:id/default` | 设为默认模型 |

#### 统计接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/chat/token-stats` | Token 使用统计 |
| GET | `/api/chat/cache-stats` | 缓存命中率统计 |

### 5.4 SSE 流式消息协议

发送消息 `POST /api/chat/sessions/:id/messages` 时，`Content-Type: text/event-stream`：

```
data: {"type":"thinking","message":"正在分析您的问题..."}

data: {"type":"tool_call","tool":"query_student_stats","params":{"grade":"4"}}

data: {"type":"tool_result","summary":"查询到 28 条数据"}

data: {"type":"content","content":"四年级1班本周..."}  // 可多次

data: {"type":"done","tokens":{"input":150,"output":200}}

data: [DONE]
```

错误时：
```
data: {"type":"error","code":2001,"message":"AI模型不可用","suggestion":"正在切换备用模型..."}
```

### 5.5 限流配置

```javascript
// 在 routes/chat.js 中使用项目已有的 rateLimit 中间件
// chat 专用：每分钟 20 次
keyGenerator: (req) => req.admin.id  // ✅ 正确：使用 req.admin
```

---

## 六、前端设计

### 6.1 集成方式：AdminView Tab 页

在 `AdminView.vue` 中新增两个 Tab 菜单：

```vue
<!-- AdminView.vue 新增 -->
<AIChatView v-else-if="activeMenu === 'ai-chat'" />
<AIModelView v-else-if="activeMenu === 'ai-models'" />
```

```javascript
// 异步导入
const AIChatView = defineAsyncComponent(
  () => import('../components/admin/chat/ChatContainer.vue')
)
const AIModelView = defineAsyncComponent(
  () => import('../components/admin/models/ModelManager.vue')
)
```

在 `AdminLayout.vue` 的菜单配置中新增：

| 菜单名称 | key | 图标 | 说明 |
|----------|-----|------|------|
| AI 助手 | `ai-chat` | `ChatDotRound` | 智能对话页面（详见 4.1） |
| 模型管理 | `ai-models` | `Cpu` | 大模型管理页面（详见 4.2） |

### 6.2 组件结构

```
src/components/admin/
├── chat/                           # AI 对话模块（详见 4.1）
│   ├── ChatContainer.vue           # 聊天容器（主组件，仿豆包风格）
│   ├── MessageList.vue             # 消息列表
│   ├── MessageItem.vue             # 单条消息
│   ├── ChatInput.vue               # 输入框（使用 el-input textarea）
│   ├── SessionList.vue             # 会话列表侧边栏
│   ├── ModelSelector.vue           # 头部模型切换下拉
│   ├── ToolCallDisplay.vue         # 工具调用展示
│   ├── TokenStats.vue              # Token 统计
│   └── composables/
│       ├── useChat.js              # 会话管理、消息收发
│       └── useStream.js            # SSE 流式响应处理
│
└── models/                         # 大模型管理模块（详见 4.2）
    ├── ModelManager.vue            # 模型管理主页面（Tab 内容）
    ├── ModelCard.vue               # 单个模型卡片
    ├── ModelForm.vue               # 模型表单对话框
    └── composables/
        └── useModel.js             # 模型 CRUD 逻辑
```

### 6.3 api.js 扩展（SSE 支持）

现有 `api.js` 的 `_doRequest` 固定调用 `response.json()`，SSE 无法使用。需新增 `stream()` 方法：

```javascript
// src/utils/api.js 中新增方法

/**
 * SSE 流式请求
 * @param {string} endpoint - API 端点
 * @param {Object} data - 请求数据
 * @param {function} onMessage - 消息回调 (event: MessageEvent) => void
 * @param {Object} config - 配置 { timeout, signal }
 * @returns {Promise<void>}
 */
async stream(endpoint, data, onMessage, config = {}) {
  const { timeout = 60000 } = config
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const csrfToken = await getCSRFToken()
  const adminToken = sessionStorage.getItem('adminToken')
  const authToken = adminToken || localStorage.getItem('token')

  try {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify(data),
      signal: controller.signal
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') return
          onMessage(JSON.parse(payload))
        }
      }
    }
  } finally {
    clearTimeout(timeoutId)
  }
}
```

### 6.4 useStream composable

```javascript
// src/components/admin/chat/composables/useStream.js
import { ref } from 'vue'
import { api } from '@/utils/api'
import message from '@/utils/message'

/**
 * SSE 流式对话
 * @returns {{ sendMessage, abort, isStreaming }}
 */
export function useStream() {
  const isStreaming = ref(false)
  let controller = null

  async function sendMessage(sessionId, content, callbacks = {}) {
    isStreaming.value = true
    try {
      await api.stream(
        `/api/chat/sessions/${sessionId}/messages`,
        { content },
        (event) => {
          switch (event.type) {
            case 'thinking': callbacks.onThinking?.(event.message); break
            case 'tool_call': callbacks.onToolCall?.(event.tool, event.params); break
            case 'content': callbacks.onContent?.(event.content); break
            case 'done': callbacks.onDone?.(event.tokens); break
            case 'error': callbacks.onError?.(event); break
          }
        }
      )
    } catch (error) {
      message.error(error.message || '连接失败')
      callbacks.onError?.({ message: error.message })
    } finally {
      isStreaming.value = false
    }
  }

  function abort() {
    // 需要配合后端 req.on('close') 中断
  }

  return { sendMessage, abort, isStreaming }
}
```

### 6.5 前端规范要点

1. **消息提示**：`import message from '@/utils/message'`，禁止直接用 `ElMessage`
2. **XSS 防护**：`MessageItem.vue` 中 `v-html` 渲染前必须经过 `xss-filter.js` 的 `sanitize()`
3. **API 调用**：必须使用 `api.get/post/delete`，SSE 使用 `api.stream()`
4. **样式**：所有 `<style scoped>`，样式参考豆包聊天界面风格（详见 6.8）
5. **图标**：从 `@element-plus/icons-vue` 显式导入
6. **props**：必须定义类型和默认值
7. **ChatInput**：使用 `<el-input type="textarea">` 而非 `contenteditable`（更稳定可靠）

### 6.6 技术约束（强制）

以下约束从项目规则继承，本模块开发时**必须严格遵守**：

#### 6.6.1 API 调用约束

```javascript
// ✅ 正确：使用封装的 API 客户端
import { api } from '@/utils/api'
const data = await api.get('/api/chat/sessions')

// ✅ 正确：SSE 流式请求使用扩展方法
await api.stream('/api/chat/sessions/xxx/messages', { content }, onMessage)

// ❌ 错误：直接使用 fetch（SSE 除外，api.stream 已封装）
const response = await fetch('/api/chat/sessions')  // 禁止
```

#### 6.6.2 响应式数据约束

```javascript
// ❌ 禁止直接修改 props
props.messages.push(newMessage)

// ✅ 正确
const localMessages = ref([...props.messages])
emit('update:messages', localMessages.value)

// ✅ 必须清理资源（定时器、事件监听、SSE 连接）
onUnmounted(() => {
  clearTimeout(timer)
  clearInterval(pollingTimer)
})
```

#### 6.6.3 大数据约束

- **列表必须分页**：会话列表、消息历史均使用 `usePagination` composable
- **数据库查询**：禁止 `SELECT *`，必须指定字段
- **批量操作**：分批执行，每次 ≤ 1000 条

#### 6.6.4 安全约束

```javascript
// XSS 防护（v-html 渲染 AI 回复前必须过滤）
import xssFilter from '@/utils/xss-filter'
const safeContent = xssFilter.sanitize(aiResponse)

// CSRF 防护（api.js 已自动处理，无需手动添加）

// 输入长度限制
if (content.length > 2000) {
  message.warning('消息内容不能超过2000字')
  return
}
```

#### 6.6.5 性能约束

```javascript
// ✅ 组件异步加载（ChatContainer 已通过 AdminView defineAsyncComponent 处理）
const AIChatView = defineAsyncComponent(
  () => import('../components/admin/chat/ChatContainer.vue')
)

// ✅ 列表渲染使用唯一 key
<div v-for="session in sessions" :key="session.id">

// ✅ computed 缓存
const filteredMessages = computed(() => messages.value.filter(...))

// ✅ 限时缓存策略
// 后台管理数据: 5 分钟
// 聊天缓存: 24 小时
```

#### 6.6.6 已有工具强制使用

| 工具 | 导入路径 | 本模块使用场景 |
|------|----------|---------------|
| `api` | `@/utils/api` | 所有 HTTP 请求 + SSE |
| `message` | `@/utils/message` | 消息提示（替代 ElMessage） |
| `usePagination` | `@/composables/usePagination` | 会话列表、消息历史分页 |
| `useLoading` | `@/composables/useLoading` | 异步操作加载状态 |
| `xss-filter` | `@/utils/xss-filter` | AI 回复渲染前 XSS 过滤 |
| `format.js` | `@/utils/format` | Token 数字格式化、百分比显示 |
| `dateUtils.js` | `@/utils/dateUtils` | 会话时间格式化 |

> **禁止**在组件中重新实现以上工具已有的功能（如手写分页逻辑、手写 loading 状态管理）。

#### 6.6.7 Composable 规范

```javascript
// composables/useChat.js
export function useChat() {
  const sessions = ref([])
  const currentSession = ref(null)
  const messages = ref([])
  const loading = ref(false)

  // 暴露 cleanup 方法供组件调用
  function cleanup() {
    sessions.value = []
    currentSession.value = null
    messages.value = []
  }

  return { sessions, currentSession, messages, loading, cleanup }
}
```

**要求**：
- 所有 Composable 必须暴露 `cleanup()` 方法
- 组件在 `onUnmounted` 中调用 cleanup
- Composable 内部如使用定时器，必须在 cleanup 中清除

### 6.7 文件大小约束（强制）

本模块所有新增文件**必须遵守以下行数限制**：

| 文件类型 | 最大行数 | 说明 |
|----------|----------|------|
| Vue 组件 | **400 行** | 超过必须拆分子组件 |
| Composable | **200 行** | 超过必须拆分 |
| 后端路由 | **300 行** | 超过拆分到 service 层 |
| 后端服务 | **500 行** | 超过按功能拆分 |
| 工具文件 | **200 行** | - |
| CSS 样式 | **150 行**（单组件） | 公共样式提取到 common.css |

**各组件预估行数控制**：

**AI 对话模块（chat/）**：

| 文件 | 预估行数 | 拆分策略 |
|------|----------|----------|
| `ChatContainer.vue` | ~300 | 会话列表 + 聊天区域主体 |
| `MessageList.vue` | ~150 | 消息列表 + 欢迎页 |
| `MessageItem.vue` | ~120 | 单条消息（含工具调用展示） |
| `ChatInput.vue` | ~100 | 输入框 + 发送按钮 |
| `SessionList.vue` | ~120 | 会话列表侧边栏 |
| `ModelSelector.vue` | ~80 | 头部模型切换下拉 |
| `ToolCallDisplay.vue` | ~80 | 工具调用折叠展示 |
| `TokenStats.vue` | ~100 | Token 统计卡片 |
| `composables/useChat.js` | ~180 | 会话管理、CRUD |
| `composables/useStream.js` | ~100 | SSE 流式处理 |

**大模型管理模块（models/）**：

| 文件 | 预估行数 | 拆分策略 |
|------|----------|----------|
| `ModelManager.vue` | ~250 | 模型管理主页面（卡片列表 + 统计栏） |
| `ModelCard.vue` | ~120 | 单个模型卡片展示 |
| `ModelForm.vue` | ~200 | 模型表单对话框（表单 + 校验） |
| `composables/useModel.js` | ~120 | 模型 CRUD + 测试连接逻辑 |

### 6.8 CSS 样式管理规范

#### 6.8.1 样式层级

```
优先级从高到低：
1. 组件 <style scoped> — 组件私有样式
2. src/styles/common.css — 后台管理公共样式（可复用）
3. src/styles/global.css — 全局基础样式（不修改）
4. Element Plus 主题 — UI 框架样式
```

#### 6.8.2 公共样式复用

本模块可直接引入 `common.css`，复用以下已定义的样式类：

```css
/* 从 common.css 复用 */
@import '@/styles/common.css';

/* 可用的公共类：
   .pagination        - 分页容器
   .pagination-info   - 分页文本
   .card-header       - 卡片头部
   .card-title        - 卡片标题
   .card-title-icon   - 标题图标
   .empty-state       - 空状态
   .empty-state-icon  - 空状态图标
   .empty-state-text  - 空状态文本
*/
```

> **注意**：后台管理页面会自动添加 `body.admin-page` 类，使用 `global.css` 中的后台样式变量。

#### 6.8.3 聊天组件专用样式

由于聊天界面与后台其他页面风格差异较大（仿豆包风格），需要定义**组件内私有样式**：

```vue
<style scoped>
/* ✅ 正确：scoped 样式 + BEM 命名 */

/* 会话列表 */
.chat-session { ... }
.chat-session--active { ... }
.chat-session__title { ... }
.chat-session__time { ... }

/* 消息 */
.chat-message { ... }
.chat-message--user { ... }
.chat-message--assistant { ... }
.chat-message__bubble { ... }
.chat-message__avatar { ... }
.chat-message__time { ... }

/* 输入框 */
.chat-input { ... }
.chat-input__textarea { ... }
.chat-input__actions { ... }

/* 工具调用展示 */
.tool-call { ... }
.tool-call__name { ... }
.tool-call__params { ... }
</style>
```

#### 6.8.4 样式规范要点

| 规范 | 说明 |
|------|------|
| **禁止内联样式** | 不使用 `:style="{}"`（动态计算的除外） |
| **禁止 `!important`** | 通过提高选择器优先级解决 |
| **CSS 类名** | 使用 BEM 命名法：`block__element--modifier` |
| **颜色值** | 优先使用 CSS 变量或 Element Plus 变量 |
| **响应式** | 聊天界面需适配移动端（`@media (max-width: 768px)`） |
| **滚动条** | 自定义滚动条样式（与 common.css 保持一致） |
| **主题色** | 聊天界面主色调：`#409eff`（用户气泡）、`#fff`（AI 气泡）、`#f5f7fa`（背景） |

#### 6.8.5 动画与过渡

```css
/* 消息出现动画 */
.chat-message {
  animation: messageFadeIn 0.3s ease;
}

@keyframes messageFadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 工具调用展开/折叠 */
.tool-call__detail {
  transition: max-height 0.3s ease;
}
```

### 6.9 禁止事项清单

| 禁止项 | 原因 | 替代方案 |
|--------|------|----------|
| 直接使用 `fetch` | 绕过统一错误处理 | 使用 `api` 实例 |
| 直接使用 `ElMessage` | 分散错误处理逻辑 | 使用 `message.js` |
| 内联样式 `:style` | 难以维护 | 使用 scoped CSS |
| `v-html` 无过滤 | XSS 注入风险 | `xssFilter.sanitize()` |
| `contenteditable` | 兼容性差、难控制 | `<el-input type="textarea">` |
| `SELECT *` | 性能问题 | 指定字段 |
| 字符串拼接 SQL | SQL 注入风险 | 参数化查询 |
| 重复实现已有工具 | 冗余代码 | 使用 usePagination/useLoading 等 |
| 无 cleanup 的 Hook | 内存泄漏 | 必须实现 cleanup |
| 文件超限行数 | 可读性差 | 按功能拆分 |
| 非 scoped 样式 | 样式污染 | 必须 `<style scoped>` |

---

## 七、文件结构总览

### 7.1 后端文件

```
新增文件：
routes/chat.js                      # 聊天路由（含模型管理接口）
services/chat/
  ├── agent.js                      # Agent 创建
  ├── chatService.js                # 对话业务逻辑
  ├── modelManager.js               # 模型管理
  ├── cacheService.js               # 缓存服务
  ├── contextCompressor.js          # 上下文压缩
  ├── tools/
  │   ├── index.js                  # 工具注册
  │   ├── studentStatsTool.js       # 学生统计
  │   ├── classAnalysisTool.js      # 班级分析
  │   ├── errorAnalysisTool.js      # 错题分析
  │   ├── subjectProgressTool.js    # 学科进度
  │   ├── questionInfoTool.js       # 题目详情
  │   ├── systemOverviewTool.js     # 系统概览
  │   ├── timeTrendTool.js          # 时间趋势
  │   └── weakPointsTool.js         # 薄弱点
  └── utils/
      └── batchInsert.js            # 批量插入工具
utils/chatErrors.js                 # 错误码定义
scripts/migrations/ai_chat_models_extra.sql  # 新增表（token_usage、cache_hits）

需修改的现有文件：
server.cjs                          # 挂载 /api/chat 路由 + server.timeout = 60000
```

### 7.2 前端文件

```
新增文件：
src/components/admin/chat/           # AI 对话模块
  ├── ChatContainer.vue             # 聊天容器主组件
  ├── MessageList.vue               # 消息列表
  ├── MessageItem.vue               # 单条消息
  ├── ChatInput.vue                 # 输入框
  ├── SessionList.vue               # 会话列表侧边栏
  ├── ModelSelector.vue             # 头部模型切换下拉
  ├── ToolCallDisplay.vue           # 工具调用展示
  ├── TokenStats.vue                # Token 统计卡片
  └── composables/
      ├── useChat.js                # 会话管理、消息收发
      └── useStream.js              # SSE 流式响应处理

src/components/admin/models/         # 大模型管理模块
  ├── ModelManager.vue             # 模型管理主页面
  ├── ModelCard.vue                # 单个模型卡片
  ├── ModelForm.vue                # 模型表单对话框
  └── composables/
      └── useModel.js              # 模型 CRUD + 测试连接逻辑

需修改的现有文件：
src/utils/api.js                   # 新增 stream() 方法
src/views/AdminView.vue            # 新增 ai-chat 和 ai-models 两个 Tab
src/components/admin/layout/AdminLayout.vue  # 新增两个菜单项
```

---

## 八、新增依赖

```bash
npm install langchain @langchain/langgraph @langchain/openai @langchain/core zod
```

> 注意：不安装 `uuid`，会话 ID 使用 Node.js 内置的 `crypto.randomUUID()`。
> 不安装 `@langchain/classic`，使用最新的 langgraph 方案。

---

## 九、开发计划

| 阶段 | 内容 | 预计工时 |
|------|------|----------|
| 1 | 基础架构：路由、数据库迁移（token_usage、cache_hits）、api.js 扩展 | 1天 |
| 2 | Agent + 8 个 Tools 开发 | 3天 |
| 3 | 后端模型管理服务（modelManager.js）+ 缓存 + 上下文压缩 | 2天 |
| 4 | 后端 SSE 流式对话、错误处理、降级策略 | 2天 |
| 5 | 前端 ChatContainer + 组件（对话模块） | 2.5天 |
| 6 | 前端 ModelManager + 组件（模型管理模块） | 2天 |
| 7 | AdminView 集成（两个 Tab）、联调测试 | 1.5天 |

**总计**：约 14 天

---

## 十、验收标准

### 功能验收

**AI 对话模块**：
- [ ] 管理员可通过自然语言查询系统数据
- [ ] AI 自主选择工具并执行数据库查询
- [ ] 支持多模型切换（聊天界面头部下拉选择器）
- [ ] SSE 流式输出正常（thinking → tool_call → content → done）
- [ ] 工具调用结果折叠展示正常
- [ ] 缓存机制正常，Token 统计准确

**大模型管理模块**：
- [ ] 模型列表卡片展示正常（响应式布局）
- [ ] 添加/编辑模型成功，表单校验完整
- [ ] 删除模型正常，默认模型不可删除
- [ ] 测试连接功能正常，返回响应时间
- [ ] 设为默认功能正常，自动切换其他模型状态
- [ ] 模型列表接口不返回明文 API Key
- [ ] 统计概览数据准确（已启用数、默认模型、本月 Token）
- [ ] 提供商标签颜色映射正确

### 性能验收
- [ ] 首字响应 < 2s（缓存命中时 < 500ms）
- [ ] 缓存命中率 > 30%
- [ ] 错误率 < 1%
- [ ] 模型列表分页加载流畅（>100 个模型时）
- [ ] 模型测试连接响应 < 5s

### 安全验收
- [ ] 所有接口通过 `adminAuth` 验证（使用 `req.admin.id`）
- [ ] 无 SQL 注入漏洞（参数化查询）
- [ ] 无 XSS 漏洞（`xss-filter.js` 渲染 AI 回复）
- [ ] API Key 加密存储（AES-256-GCM）
- [ ] 模型列表接口不返回完整 API Key
- [ ] 输入长度限制生效（消息最多 2000 字）

### 代码质量验收
- [ ] 使用 `api.js`，无直接 fetch（SSE 除外）
- [ ] 使用 `message.js`，无直接 `ElMessage`
- [ ] 所有 Vue 组件 `<script setup>` + `<style scoped>`
- [ ] 所有异步操作 try/catch
- [ ] 数据库查询禁止 `SELECT *`
- [ ] 所有 Composable 暴露 `cleanup()` 方法
- [ ] 组件在 `onUnmounted` 中调用 cleanup
- [ ] 所有新增文件行数符合 6.7 约束

---

## 附录

### A. LangChain.js 正确用法参考

```javascript
// ✅ 正确：从 @langchain/core/tools 导入 tool
const { tool } = require('@langchain/core/tools')

// ✅ 正确：使用 @langchain/langgraph 的 createReactAgent
const { createReactAgent } = require('@langchain/langgraph/prebuilt')

// ✅ 正确：使用 @langchain/openai 的 ChatOpenAI
const { ChatOpenAI } = require('@langchain/openai')

// ✅ 正确：创建 Agent
const agent = createReactAgent({
  llm: new ChatOpenAI({ modelName: 'deepseek-chat', openAIApiKey: 'xxx' }),
  tools: [myTool1, myTool2],
  prompt: '系统提示词...'
})

// ✅ 正确：流式调用
const stream = await agent.stream({ messages: [...] })
for await (const chunk of stream) {
  // 处理 chunk
}

// ❌ 错误：langchain 顶层没有 createAgent
// const { createAgent } = require('langchain')

// ❌ 错误：tool 不能从 langchain 顶层导入
// const { tool } = require('langchain')

// ❌ 错误：LangChain stream chunk 没有 chunk.tokens 属性
// Token 计数需要通过 model 的 callback 或后处理获取
```

### B. 与现有项目文档的关系

| 文档 | 路径 | 关系 |
|------|------|------|
| 项目规则 | `.codebuddy/rules/PSCG项目规则.mdc` | 本需求的强制约束 |
| MySQL 8 查询规范 | `DOCS/技术文档/MySQL8参数化查询注意事项.md` | 后端 SQL 开发必读 |
| 已有数据库迁移 | `scripts/migrations/ai_chat_system.sql` | 3 张表直接复用 |
| API 封装 | `src/utils/api.js` | 需扩展 stream() |
| 管理员认证 | `middleware/adminAuth.js` | 使用 `req.admin` |
