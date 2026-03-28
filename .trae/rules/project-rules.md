---
description: PSCG 智能题库系统项目开发规范
alwaysApply: true
enabled: true
updatedAt: 2026-03-28T00:00:00.000Z
provider:
---

# PSCG 智能题库系统 - 项目规则

## 项目概述

PSCG (Primary School Comprehensive Quiz) 是一个基于 Vue 3 + Express + MySQL 的智能题库系统，支持多学科题库管理、智能难度调整、答题统计分析和排行榜功能。

## 技术栈

### 前端

- **框架**: Vue 3 + Composition API
- **状态管理**: Pinia (`defineStore`)
- **路由**: Vue Router 4
- **UI组件库**: Element Plus
- **图表**: VisActor (VChart + VMind)
- **富文本**: Quill
- **构建工具**: Vite 5

### 后端

- **运行时**: Node.js 16+
- **框架**: Express 4.x
- **数据库**: MySQL 8.0 (mysql2)
- **文件上传**: Multer
- **进程管理**: PM2

## 目录结构

```
PSCG/
├── src/                    # 前端源码
│   ├── views/              # 页面组件
│   ├── components/         # 通用组件
│   │   ├── admin/          # 后台管理组件
│   │   ├── quiz/           # 答题组件
│   │   └── common/         # 公共组件
│   ├── stores/             # Pinia 状态管理
│   ├── composables/        # 组合式函数
│   ├── utils/              # 工具函数
│   ├── router/             # 路由配置
│   └── styles/             # 全局样式
├── routes/                 # 后端 API 路由
├── services/               # 后端服务层
├── middleware/             # Express 中间件
├── config/                 # 配置文件
├── DOCS/                   # 项目文档
├── audio/                  # 音频资源
├── images/                 # 图片资源
├── server.cjs              # 后端入口
└── vite.config.js          # Vite 配置
```

## 编码规范

### Vue 组件

- 使用 `<script setup>` 语法糖
- 组件命名使用 PascalCase (如 `QuestionCard.vue`)
- Props 定义使用 `defineProps`，Emits 使用 `defineEmits`
- 使用 Composition API 的 `ref`、`reactive`、`computed`

### Pinia Store

- 使用 `defineStore` 创建 store
- Store 命名: `useXxxStore` (如 `useQuestionStore`)
- 结构: `state`、`getters`、`actions`
- 异步操作使用 `async/await`
- 错误向上抛出，让调用者统一处理

### 后端代码

- 使用 CommonJS (`require`/`module.exports`)
- 路由文件放在 `routes/` 目录
- 数据库操作放在 `services/` 目录
- 中间件放在 `middleware/` 目录

### API 规范

- 基础路径: `/api`
- RESTful 风格
- 响应格式: JSON
- 错误处理: `{ error: '错误信息' }`

### 样式规范

- 全局样式: `src/styles/global.css`
- 后台公共样式: `src/styles/common.css`
- 富文本样式: `src/styles/rich-text.css`
- 组件样式使用 `<style scoped>`
- 使用 Element Plus 主题变量

### 文档规范

- **需求文档**: `DOCS/需求文档/`
- **技术文档**: `DOCS/技术文档/`
- **API 文档**: `DOCS/API文档/`
- **命名**: 使用清晰的中文或英文命名
- **避免重复**: 整合相关内容，删除过时文档

## 常用命令

```bash
# 开发
npm run dev          # 启动前端开发服务器 (端口 5173)
npm run server       # 启动后端服务器 (端口 3001)

# 构建
npm run build        # 构建生产版本
npm run preview      # 预览生产构建

# 进程管理
pm2 start server.cjs --name "pscg-app"
pm2 logs pscg-app
pm2 restart pscg-app
pm2 restart 0        # 重启 ID 为 0 的进程
```

## 部署流程

```bash
# 1. 静态构建
npm run build

# 2. 重启服务器
pm2 restart 0
```

## 环境配置

- 开发环境: `.env.development`
- 生产环境: `.env.production`
- API 地址通过 `VITE_API_URL` 配置

## 安全措施

- **XSS 防护**: `src/utils/xss-filter.js`
- **CSRF 防护**: `middleware/csrf.js` + `src/utils/csrf.js`
- **输入验证**: 前后端双重验证
- **SQL 注入防护**: 使用参数化查询

## 注意事项

- 后端文件使用 `.cjs` 扩展名 (CommonJS)
- 前端使用 ES Modules (`import`/`export`)
- 数据库连接使用连接池
- 静态资源缓存已配置
- 文件上传限制 10MB

## 技术约束

### API 调用规范（强制）

**问题**：项目中存在两种 API 调用方式混用：

- ❌ 直接 `fetch()` 调用（存在于 Store 和多个 View 中）
- ✅ 封装的 `api.js` 客户端（推荐）

**强制要求**：

```javascript
// ✅ 正确：使用封装的 API 客户端
import { api } from '@/utils/api'

const data = await api.get('/subjects')
await api.post('/questions', questionData)

// ❌ 错误：直接使用 fetch
const response = await fetch(`${getApiBaseUrl()}/subjects`) // 禁止
```

**理由**：

- `api.js` 提供自动重试、防抖、超时、CSRF Token
- Store 中的直接 `fetch` 无法享受这些功能
- 统一错误处理和日志记录

**例外场景**：

- 文件上传（使用 `imageUpload.js` 的队列上传）
- 特殊流式请求（需明确注释说明）

### Store 设计约束

**问题**：`questionStore.js` 文件过大（960+ 行），承担过多职责。

**拆分建议**：

```
stores/
├── subjectStore.js      // 学科和子分类
├── questionStore.js     // 题目相关
├── gradeClassStore.js   // 年级班级
├── errorStore.js        // 错题管理
├── quizStore.js         // 答题会话（已独立）
└── settingsStore.js     // 系统设置（已独立）
```

**约束规则**：

- 单个 Store 文件不超过 500 行
- 每个 Store 只负责一个核心领域
- Store 间避免循环依赖
- Store 内也必须使用 `api.js` 而非直接 `fetch`

### 响应式数据规范

**禁止直接修改 props**：

```javascript
// ❌ 错误
props.data.push(newItem)

// ✅ 正确
const localData = ref([...props.data])
localData.value.push(newItem)
emit('update', localData.value)
```

**避免内存泄漏**：

```javascript
// ✅ 正确：组件卸载时清理
onUnmounted(() => {
  clearTimeout(timer)
  eventBus.off('event', handler)
})
```

## 代码复用性规则

### Composables 使用规范

**已实现的 Composables 必须优先使用**：

| Composable         | 功能         | 使用场景     |
| ------------------ | ------------ | ------------ |
| `usePagination`    | 分页逻辑     | 所有列表页面 |
| `useLoading`       | 加载状态管理 | 所有异步操作 |
| `useAdminLayout`   | 后台布局状态 | 后台页面共享 |
| `useChartRenderer` | 图表渲染     | 数据分析页面 |
| `useUserFilters`   | 用户筛选     | 用户相关页面 |

**使用示例**：

```javascript
// ✅ 正确：使用 Composable
import { usePagination } from '@/composables/usePagination'

const { currentPage, handlePageChange } = usePagination()

// ❌ 错误：重复实现分页逻辑
const currentPage = ref(1)
const handlePageChange = page => {
  currentPage.value = page
}
```

### 何时新建 Composable

**新建条件**（满足任一即可）：

1. 逻辑在 3+ 个组件中重复出现
2. 复杂度较高（> 50 行代码）
3. 需要管理生命周期（清理定时器、事件监听等）

**命名规范**：

```javascript
// 文件：src/composables/useXxx.js
export function useXxx() {
  // 逻辑实现
  return {
    /* 暴露的 API */
  }
}
```

**示例场景**：

- `useTableFilter` - 表格筛选逻辑（已发现重复）
- `useFormValidation` - 表单验证（多处重复）
- `useApiState` - API 状态管理（loading/error 模式）

### 公共组件封装规则

**何时提取为公共组件**：

1. 在 2+ 个不同页面使用
2. 具有独立功能和 UI
3. 通过 props/emits 通信

**公共组件分类**：

```
src/components/
├── common/              # 全局公共组件
│   ├── AppFooter.vue
│   ├── AppHeader.vue
│   ├── EditableContent.vue    # 可编辑内容
│   ├── QuillEditor.vue        # 富文本编辑器
│   └── SkeletonLoader.vue     # 骨架屏
├── admin/common/        # 后台公共组件
│   ├── AdminFilter.vue        # 筛选表单
│   ├── QuestionDetailDialog.vue
│   └── UserDetailDialog.vue
└── quiz/                # 答题组件
```

### 工具函数封装规则

**何时提取为工具函数**：

1. 纯函数（无副作用）
2. 在 2+ 个文件中使用
3. 功能独立、可测试

**已实现的工具函数**：

| 文件                | 功能           | 主要方法                                                |
| ------------------- | -------------- | ------------------------------------------------------- |
| `api.js`            | API 客户端封装 | `get()`, `post()`, `put()`, `delete()`                  |
| `message.js`        | 消息提示封装   | `success()`, `error()`, `warning()`, `confirm()`        |
| `format.js`         | 数据格式化     | `formatPercent()`, `formatNumber()`, `formatDuration()` |
| `dateUtils.js`      | 日期处理       | `formatDate()`                                          |
| `xss-filter.js`     | XSS 防护       | `sanitize()`                                            |
| `csrf.js`           | CSRF 防护      | `getCSRFToken()`                                        |
| `imageUpload.js`    | 图片上传       | `uploadImage()`, `uploadQueue`                          |
| `markdown.js`       | Markdown 渲染  | `renderMarkdown()`                                      |
| `chartGenerator.js` | 图表生成       | 图表配置生成                                            |
| `shuffleOptions.js` | 选项打乱       | 随机排序                                                |

**使用示例**：

```javascript
// ✅ 正确：使用工具函数
import { formatPercent } from '@/utils/format'
import { success } from '@/utils/message'

const accuracy = formatPercent(85.6) // "86%"
success('操作成功')
```

## 新建文件规则

### 前端文件

**组件文件**：

- 放置位置：根据功能确定（`components/` 或 `views/`）
- 命名规范：PascalCase（如 `QuestionCard.vue`）
- 结构要求：使用 `<script setup>` 语法

**Composable 文件**：

- 放置位置：`src/composables/`
- 命名规范：`useXxx.js`
- 必须包含 JSDoc 注释和使用示例

**工具函数文件**：

- 放置位置：`src/utils/`
- 命名规范：camelCase（如 `dateUtils.js`）
- 必须有明确的单一职责

### 后端文件

**路由文件**：

- 放置位置：`routes/` 目录
- 命名规范：RESTful 风格（如 `questions.js`）
- 使用 `express.Router()`
- 已实现的路由：`admin.js`, `ai.js`, `answer-behavior.js`, `answer-records.js`, `analysis.js`, `backup.js`, `data.js`, `difficulty.js`, `error-collection.js`, `grades-classes.js`, `leaderboard.js`, `learning-progress.js`, `question-semantic.js`, `questions.js`, `quiz.js`, `settings.js`, `subjects.js`, `upload.js`, `users.js`

**服务层文件**：

- 放置位置：`services/`
- 命名规范：camelCase + Service（如 `aiService.js`）
- 数据库操作封装

**中间件文件**：

- 放置位置：`middleware/`
- 命名规范：功能描述（如 `rateLimit.js`）
- 导出中间件函数

### 后端架构规范

**已实现的中间件**：

| 文件                   | 功能               | 使用场景      |
| ---------------------- | ------------------ | ------------- |
| `adminAuth.js`         | 管理员认证（JWT）  | 后台管理接口  |
| `csrf.js`              | CSRF 防护          | 表单提交      |
| `rateLimit.js`         | IP/用户限流        | 全局/API/提交 |
| `dbPerformance.js`     | 数据库性能监控     | 数据库操作    |
| `signatureCache.js`    | 签名缓存（防重放） | 答题提交      |
| `aiInputValidation.js` | AI 输入验证        | AI 相关接口   |
| `responseTime.js`      | 响应时间记录       | 全局          |

**已实现的服务层**：

| 文件                      | 功能             |
| ------------------------- | ---------------- |
| `database.js`             | 数据库连接和操作 |
| `aiService.js`            | AI 功能服务      |
| `aiQueueService.js`       | AI 任务队列      |
| `difficultyService.js`    | 难度计算服务     |
| `fileReferenceService.js` | 文件引用管理     |
| `validationService.js`    | 输入验证服务     |
| `cache.js`                | 缓存服务         |
| `passwordHash.js`         | 密码哈希         |

**路由层职责**：

- 参数验证
- 调用服务层
- 返回响应

**服务层职责**：

- 数据库操作
- 业务逻辑
- 错误处理

**中间件职责**：

- 请求预处理
- 权限验证
- 日志记录

## 文件管理规范

### 文件上传

**图片上传**：

- 使用 `imageUpload.js` 的 `uploadImage()` 函数
- 支持粘贴、拖拽、点击上传
- 自动转换 base64 为文件上传
- 文件大小限制：2MB
- 支持格式：JPG、PNG、GIF、WebP

**音频上传**：

- 文件大小限制：10MB
- 支持格式：MP3、WAV、OGG、M4A

### 文件引用管理

**自动维护引用计数**：

- 保存题目时自动增加文件引用
- 更新题目时对比新旧内容，增减引用
- 删除题目时减少引用计数
- 引用计数归零时自动删除物理文件

**孤儿文件清理**：

- API: `GET /upload/orphan-stats` - 获取统计
- API: `POST /upload/cleanup-orphans` - 执行清理
- 前端入口：后台管理 → 数据清理 → 清理孤儿文件

**取消编辑清理**：

- API: `POST /upload/cancel-upload` - 清理未保存的上传文件
- 前端在取消编辑时自动调用

## 性能优化规范

### 前端性能

**路由懒加载**（已实现）：

```javascript
const AdminView = () => import('@/views/AdminView.vue')
```

**组件懒加载**：

```javascript
const HeavyComponent = defineAsyncComponent(() => import('@/components/HeavyComponent.vue'))
```

**列表渲染优化**：

```vue
<!-- ✅ 正确：使用唯一 key -->
<div v-for="item in list" :key="item.id">

<!-- ❌ 错误：使用索引 -->
<div v-for="(item, index) in list" :key="index">
```

**计算属性缓存**：

```javascript
// ✅ 正确：使用 computed 缓存
const filteredList = computed(() =>
  list.value.filter(item => item.active)
)

// ❌ 错误：在模板中使用方法
<template v-for="item in filterList(list)">
```

### 后端性能

**数据库查询优化**：

- 使用索引（已配置）
- 避免 SELECT \*
- 使用分页（LIMIT）

**缓存策略**：

```javascript
// 前端缓存配置
CACHE_TTL = {
  ADMIN: 5 * 60 * 1000, // 后台：5分钟
  FRONTEND: 24 * 60 * 60 * 1000 // 前台：24小时
}
```

**限流配置**：

```javascript
// 已实现的限流器
globalLimiter: 500 次/分钟（用户）
apiLimiter: 150 次/分钟（用户）
submitLimiter: 20 次/分钟（用户）
```

## 错误处理规范

### 前端错误处理

```javascript
// ✅ 正确：统一错误处理
try {
  loading.value = true
  await api.post('/questions', data)
  success('添加成功')
} catch (error) {
  error(error.message || '操作失败')
  throw error // 如果需要上层处理
} finally {
  loading.value = false
}
```

### 后端错误处理

```javascript
// ✅ 正确：统一响应格式
try {
  const result = await db.query(sql, params)
  res.json(result)
} catch (error) {
  console.error('操作失败:', error)
  res.status(500).json({ error: '操作失败' })
}
```

## 安全规范

### 前端安全

**XSS 防护**：

```javascript
import xssFilter from '@/utils/xss-filter'

// 富文本内容过滤
const safeContent = xssFilter.sanitize(userInput)
```

**CSRF 防护**：

```javascript
// api.js 已自动处理 CSRF Token
import { api } from '@/utils/api'
await api.post('/questions', data) // 自动添加 CSRF Token
```

### 后端安全

**SQL 注入防护**：

```javascript
// ✅ 正确：使用参数化查询
await db.query('SELECT * FROM users WHERE id = ?', [userId])

// ❌ 错误：字符串拼接
await db.query(`SELECT * FROM users WHERE id = ${userId}`)
```

**输入验证**：

```javascript
// 使用 validationService
const { validateSubjectId } = require('../services/validationService')
if (!validateSubjectId(subjectId)) {
  return res.status(400).json({ error: '学科ID格式错误' })
}
```

## 已实现的公共工具

以下工具函数和组件已在项目中实现，可直接使用：

### Composables（组合式函数）

- **usePagination** (`src/composables/usePagination.js`) - 分页逻辑封装
- **useLoading** (`src/composables/useLoading.js`) - 加载状态管理
- **useAdminLayout** (`src/composables/useAdminLayout.js`) - 后台布局工具
- **useChartRenderer** (`src/composables/useChartRenderer.js`) - 图表渲染
- **useUserFilters** (`src/composables/useUserFilters.js`) - 用户筛选

### 工具函数

- **API 封装** (`src/utils/api.js`) - 统一 API 调用，支持重试、防抖、超时
- **消息封装** (`src/utils/message.js`) - Element Plus 消息提示封装
- **格式化工具** (`src/utils/format.js`) - 数据格式化工具（百分比、数字、时间等）
- **日期处理** (`src/utils/dateUtils.js`) - 日期格式化
- **XSS 防护** (`src/utils/xss-filter.js`) - XSS 过滤
- **CSRF 防护** (`src/utils/csrf.js`) - CSRF Token 管理
- **图片上传** (`src/utils/imageUpload.js`) - 图片上传和队列管理
- **Markdown** (`src/utils/markdown.js`) - Markdown 渲染
- **图表生成** (`src/utils/chartGenerator.js`) - 图表配置生成

### 公共样式

- **global.css** (`src/styles/global.css`) - 全局基础样式
- **common.css** (`src/styles/common.css`) - 后台管理公共样式（分页、卡片、表格等）
- **rich-text.css** (`src/styles/rich-text.css`) - 富文本内容样式（对齐、缩进等）
- **markdown.css** (`src/styles/markdown.css`) - Markdown 内容样式
- **loading.css** (`src/styles/loading.css`) - 加载动画样式

## 文档参考

- 项目总体规范: `PSCG项目规则.mdc`
- Vue 组件规范: `vue-component-rules.md`
- 后台优化需求: `DOCS/需求文档/后台页面优化需求.md`
- API 接口文档: `DOCS/API文档/`
