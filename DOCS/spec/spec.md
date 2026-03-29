# 删除AI功能规格文档

## 一、概述

### 1.1 目标
从 PSCG 教育系统中删除所有 AI 相关功能，确保其他功能正常运行不受影响。

### 1.2 背景
项目当前集成了豆包 AI 服务，提供自然语言分析、题目语义分析、学习风格分析等功能。根据需求，需要完全移除这些 AI 功能。

### 1.3 影响范围
- 后端：5 个路由文件、4 个服务文件、1 个中间件文件、1 个工具文件
- 前端：1 个视图文件、7 个组件文件
- 数据库：9 张 AI 相关数据表
- 配置：服务器入口文件、路由配置、菜单配置

---

## 二、需要删除的文件清单

### 2.1 后端文件（完全删除）

| 文件路径 | 说明 | 删除原因 |
|---------|------|---------|
| `routes/ai.js` | AI 分析 API 路由 | 纯 AI 功能 |
| `services/aiService.js` | AI 服务核心 | 纯 AI 功能 |
| `services/aiQueueService.js` | AI 任务队列服务 | 纯 AI 功能 |
| `middleware/aiInputValidation.js` | AI 输入验证中间件 | 纯 AI 功能 |
| `utils/aiPerformanceMonitor.js` | AI 性能监控工具 | 纯 AI 功能 |
| `routes/question-semantic.js` | 题目语义分析 API | 完全依赖 AI |

### 2.2 前端文件（完全删除）

| 文件路径 | 说明 | 删除原因 |
|---------|------|---------|
| `src/views/AIAnalysisView.vue` | AI 分析视图 | 纯 AI 功能 |
| `src/components/admin/ai/` | AI 组件目录（整个目录） | 纯 AI 功能 |
| `src/components/admin/question/QuestionSemanticAnalysis.vue` | 题目语义分析组件 | 完全依赖 AI |
| `src/components/admin/learning/UserLearningStyle.vue` | 用户学习风格组件 | 完全依赖 AI |
| `src/components/admin/basic-settings/AIConfigSetting.vue` | AI 配置设置组件 | 纯 AI 功能 |

### 2.3 测试脚本（完全删除）

| 文件路径 | 说明 |
|---------|------|
| `scripts/test-ai-extended-context.sh` | AI 测试脚本 |

---

## 三、需要修改的文件清单

### 3.1 后端文件修改

#### 3.1.1 `server.cjs`
**修改内容：**
- 删除 AI 路由引用：`const aiRoutes = require('./routes/ai')`
- 删除语义分析路由引用：`const questionSemanticRoutes = require('./routes/question-semantic')`
- 删除路由挂载：`app.use('/api/ai', aiRoutes)` 和 `app.use('/api/question-semantic', questionSemanticRoutes)`
- 删除 AI 相关表创建函数：
  - `createAICacheTable()`
  - `createAIHistoryTable()`
  - `createAIBatchAnalysisTable()`
- 删除表创建调用

#### 3.1.2 `routes/answer-behavior.js`
**修改内容：**
- 删除 AI 服务引用：`const aiService = require('../services/aiService')`
- 删除队列服务引用：`const queueService = require('../services/aiQueueService')`
- 删除 AI 输入验证引用：`require('../middleware/aiInputValidation')`
- 修改 `/user-style/:userId` 接口：移除 AI 缓存和队列调用，仅返回基础统计数据
- 修改 `/analyze-style` 接口：移除 AI 分析功能
- 修改 `/analyze-error` 接口：移除 AI 错误分析功能
- 删除 `getQueuePosition` 辅助函数

### 3.2 前端文件修改

#### 3.2.1 `src/router/index.js`
**修改内容：**
- 无需修改（路由中未直接定义 AI 分析路由）

#### 3.2.2 `src/components/admin/layout/AdminSidebar.vue`
**修改内容：**
- 删除菜单项：`{ key: 'ai-analysis', label: 'AI 智能分析', icon: 'ChatDotRound' }`
- 删除菜单项：`{ key: 'learning-style', label: '学习风格', icon: 'MagicStick' }`
- 删除菜单项：`{ key: 'semantic-analysis', label: '语义分析', icon: 'DataAnalysis' }`
- 删除图标导入：`ChatDotRound, MagicStick, DataAnalysis`

#### 3.2.3 `src/views/AdminView.vue`
**修改内容：**
- 删除组件导入：
  - `import AIConfigSetting from '../components/admin/basic-settings/AIConfigSetting.vue'`
  - `const AIAnalysisView = defineAsyncComponent(() => import('./AIAnalysisView.vue'))`
  - `const UserLearningStyle = defineAsyncComponent(...)`
  - `const QuestionSemanticAnalysis = defineAsyncComponent(...)`
- 删除模板中的 AI 相关区块：
  - `<AIConfigSetting />`
  - `<AIAnalysisView v-else-if="activeMenu === 'ai-analysis'" />`
  - `<UserLearningStyle v-else-if="activeMenu === 'learning-style'" />`
  - `<QuestionSemanticAnalysis v-else-if="activeMenu === 'semantic-analysis'" />`

---

## 四、数据库表处理

### 4.1 需要删除的数据表

| 表名 | 说明 | SQL |
|-----|------|-----|
| `ai_analysis_cache` | AI 分析缓存 | `DROP TABLE IF EXISTS ai_analysis_cache;` |
| `ai_analysis_history` | AI 分析历史 | `DROP TABLE IF EXISTS ai_analysis_history;` |
| `ai_batch_analysis` | AI 批量分析 | `DROP TABLE IF EXISTS ai_batch_analysis;` |
| `ai_analysis_queue` | AI 任务队列 | `DROP TABLE IF EXISTS ai_analysis_queue;` |
| `question_semantic_analysis` | 题目语义分析 | `DROP TABLE IF EXISTS question_semantic_analysis;` |
| `question_tags` | 题目标签 | `DROP TABLE IF EXISTS question_tags;` |
| `question_tag_relations` | 题目标签关联 | `DROP TABLE IF EXISTS question_tag_relations;` |
| `user_learning_style` | 用户学习风格 | `DROP TABLE IF EXISTS user_learning_style;` |
| `error_patterns` | 错误模式 | `DROP TABLE IF EXISTS error_patterns;` |

### 4.2 需要清理的设置项

| 设置键 | 说明 |
|-------|------|
| `aiApiKey` | AI API Key |
| `aiApiUrl` | AI API 地址 |
| `aiModel` | AI 模型 ID |
| `aiEnabled` | AI 启用状态 |
| `aiCacheEnabled` | AI 缓存启用 |
| `aiTimeout` | AI 超时时间 |
| `aiMaxConcurrent` | AI 最大并发 |
| `aiRetryAttempts` | AI 重试次数 |
| `aiRetryDelay` | AI 重试延迟 |
| `aiRateLimitWait` | AI 速率限制等待 |
| `aiCacheTTL` | AI 缓存有效期 |

**清理 SQL：**
```sql
DELETE FROM settings WHERE setting_key LIKE 'ai%';
```

---

## 五、保留的功能

### 5.1 答题行为追踪
- `answer_behavior` 表保留
- 批量提交答题行为接口保留（`POST /api/answer-behavior/batch`）
- 用户答题行为统计接口保留（`GET /api/answer-behavior/statistics/:userId`）

### 5.2 学习进度追踪
- `learning_progress` 表保留
- 学习进度相关接口保留

### 5.3 数据分析
- `DataAnalysis.vue` 组件保留（非 AI 分析）
- 基础数据统计功能保留

---

## 六、风险评估

### 6.1 低风险
- AI 功能是独立模块，删除不会影响核心答题功能
- 前端菜单删除后，用户将无法访问 AI 功能入口

### 6.2 需要注意
- `answer_behavior` 表被 AI 学习风格分析使用，但也被答题统计使用，需保留
- 删除前建议备份数据库

---

## 七、实施顺序

1. **第一步**：删除前端组件和视图文件
2. **第二步**：修改前端菜单和路由配置
3. **第三步**：删除后端路由和服务文件
4. **第四步**：修改 server.cjs 入口文件
5. **第五步**：修改 answer-behavior.js 路由
6. **第六步**：清理数据库表和设置项
7. **第七步**：测试验证

---

## 八、验证清单

- [ ] 前端编译无错误
- [ ] 后端启动无错误
- [ ] 管理后台菜单无 AI 相关入口
- [ ] 学生答题功能正常
- [ ] 题目管理功能正常
- [ ] 用户管理功能正常
- [ ] 数据分析功能正常（非 AI 部分）
- [ ] 数据库无 AI 相关表
