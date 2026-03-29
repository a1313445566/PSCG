# 删除AI功能检查清单

## 一、文件删除检查

### 1.1 前端文件删除

| 序号 | 文件路径 | 状态 | 备注 |
|-----|---------|------|-----|
| 1 | `src/views/AIAnalysisView.vue` | ⬜ 待删除 | AI 分析视图 |
| 2 | `src/components/admin/ai/AIAnalysisPanel.vue` | ⬜ 待删除 | AI 分析面板 |
| 3 | `src/components/admin/ai/AIHistoryList.vue` | ⬜ 待删除 | AI 历史列表 |
| 4 | `src/components/admin/ai/BatchAnalysis.vue` | ⬜ 待删除 | 批量分析组件 |
| 5 | `src/components/admin/basic-settings/AIConfigSetting.vue` | ⬜ 待删除 | AI 配置设置 |
| 6 | `src/components/admin/question/QuestionSemanticAnalysis.vue` | ⬜ 待删除 | 题目语义分析 |
| 7 | `src/components/admin/learning/UserLearningStyle.vue` | ⬜ 待删除 | 用户学习风格 |
| 8 | `scripts/test-ai-extended-context.sh` | ⬜ 待删除 | AI 测试脚本 |

### 1.2 后端文件删除

| 序号 | 文件路径 | 状态 | 备注 |
|-----|---------|------|-----|
| 1 | `routes/ai.js` | ⬜ 待删除 | AI 路由 |
| 2 | `services/aiService.js` | ⬜ 待删除 | AI 服务 |
| 3 | `services/aiQueueService.js` | ⬜ 待删除 | AI 队列服务 |
| 4 | `middleware/aiInputValidation.js` | ⬜ 待删除 | AI 输入验证 |
| 5 | `utils/aiPerformanceMonitor.js` | ⬜ 待删除 | AI 性能监控 |
| 6 | `routes/question-semantic.js` | ⬜ 待删除 | 题目语义分析路由 |

---

## 二、代码修改检查

### 2.1 前端代码修改

| 序号 | 文件 | 修改项 | 状态 |
|-----|------|-------|------|
| 1 | `src/components/admin/layout/AdminSidebar.vue` | 删除 AI 菜单项 | ⬜ 待修改 |
| 2 | `src/components/admin/layout/AdminSidebar.vue` | 删除 AI 图标导入 | ⬜ 待修改 |
| 3 | `src/views/AdminView.vue` | 删除 AI 组件导入 | ⬜ 待修改 |
| 4 | `src/views/AdminView.vue` | 删除 AI 配置组件 | ⬜ 待修改 |
| 5 | `src/views/AdminView.vue` | 删除 AI 条件渲染块 | ⬜ 待修改 |

### 2.2 后端代码修改

| 序号 | 文件 | 修改项 | 状态 |
|-----|------|-------|------|
| 1 | `server.cjs` | 删除 AI 路由引用 | ⬜ 待修改 |
| 2 | `server.cjs` | 删除语义分析路由引用 | ⬜ 待修改 |
| 3 | `server.cjs` | 删除路由挂载 | ⬜ 待修改 |
| 4 | `server.cjs` | 删除表创建函数 | ⬜ 待修改 |
| 5 | `server.cjs` | 删除表创建调用 | ⬜ 待修改 |
| 6 | `routes/answer-behavior.js` | 删除 AI 服务引用 | ⬜ 待修改 |
| 7 | `routes/answer-behavior.js` | 修改用户风格接口 | ⬜ 待修改 |
| 8 | `routes/answer-behavior.js` | 修改分析接口 | ⬜ 待修改 |

---

## 三、数据库清理检查

### 3.1 数据表删除

| 序号 | 表名 | 状态 | 备注 |
|-----|------|------|-----|
| 1 | `ai_analysis_cache` | ⬜ 待删除 | AI 分析缓存 |
| 2 | `ai_analysis_history` | ⬜ 待删除 | AI 分析历史 |
| 3 | `ai_batch_analysis` | ⬜ 待删除 | AI 批量分析 |
| 4 | `ai_analysis_queue` | ⬜ 待删除 | AI 任务队列 |
| 5 | `question_semantic_analysis` | ⬜ 待删除 | 题目语义分析 |
| 6 | `question_tags` | ⬜ 待删除 | 题目标签 |
| 7 | `question_tag_relations` | ⬜ 待删除 | 题目标签关联 |
| 8 | `user_learning_style` | ⬜ 待删除 | 用户学习风格 |
| 9 | `error_patterns` | ⬜ 待删除 | 错误模式 |

### 3.2 设置项清理

| 序号 | 设置键 | 状态 |
|-----|-------|------|
| 1 | `aiApiKey` | ⬜ 待删除 |
| 2 | `aiApiUrl` | ⬜ 待删除 |
| 3 | `aiModel` | ⬜ 待删除 |
| 4 | `aiEnabled` | ⬜ 待删除 |
| 5 | `aiCacheEnabled` | ⬜ 待删除 |
| 6 | `aiTimeout` | ⬜ 待删除 |
| 7 | `aiMaxConcurrent` | ⬜ 待删除 |
| 8 | `aiRetryAttempts` | ⬜ 待删除 |
| 9 | `aiRetryDelay` | ⬜ 待删除 |
| 10 | `aiRateLimitWait` | ⬜ 待删除 |
| 11 | `aiCacheTTL` | ⬜ 待删除 |

---

## 四、功能验证检查

### 4.1 编译验证

| 序号 | 验证项 | 状态 | 结果 |
|-----|-------|------|-----|
| 1 | 前端编译 `npm run build` | ⬜ 待验证 | |
| 2 | 后端启动 `npm run server` | ⬜ 待验证 | |
| 3 | 代码检查 `npm run lint` | ⬜ 待验证 | |

### 4.2 核心功能验证

| 序号 | 功能模块 | 状态 | 结果 |
|-----|---------|------|-----|
| 1 | 学生登录 | ⬜ 待验证 | |
| 2 | 答题功能 | ⬜ 待验证 | |
| 3 | 题目管理 | ⬜ 待验证 | |
| 4 | 用户管理 | ⬜ 待验证 | |
| 5 | 数据分析（非AI） | ⬜ 待验证 | |
| 6 | 排行榜 | ⬜ 待验证 | |
| 7 | 错题本 | ⬜ 待验证 | |
| 8 | 学习进度 | ⬜ 待验证 | |

### 4.3 管理后台验证

| 序号 | 验证项 | 状态 | 结果 |
|-----|-------|------|-----|
| 1 | 管理员登录 | ⬜ 待验证 | |
| 2 | 侧边栏菜单无AI入口 | ⬜ 待验证 | |
| 3 | 基础设置页面正常 | ⬜ 待验证 | |
| 4 | 数据库管理正常 | ⬜ 待验证 | |
| 5 | 安全中心正常 | ⬜ 待验证 | |

---

## 五、残留代码检查

### 5.1 AI 关键词搜索

| 序号 | 搜索关键词 | 状态 | 结果 |
|-----|----------|------|-----|
| 1 | `aiService` | ⬜ 待检查 | |
| 2 | `aiQueueService` | ⬜ 待检查 | |
| 3 | `aiPerformanceMonitor` | ⬜ 待检查 | |
| 4 | `aiInputValidation` | ⬜ 待检查 | |
| 5 | `AIAnalysisView` | ⬜ 待检查 | |
| 6 | `AIConfigSetting` | ⬜ 待检查 | |
| 7 | `UserLearningStyle` | ⬜ 待检查 | |
| 8 | `QuestionSemanticAnalysis` | ⬜ 待检查 | |
| 9 | `openai` | ⬜ 待检查 | |
| 10 | `doubao` | ⬜ 待检查 | |

---

## 六、完成确认

| 序号 | 确认项 | 状态 | 签名 | 日期 |
|-----|-------|------|-----|-----|
| 1 | 所有文件已删除 | ⬜ | | |
| 2 | 所有代码已修改 | ⬜ | | |
| 3 | 数据库已清理 | ⬜ | | |
| 4 | 编译无错误 | ⬜ | | |
| 5 | 核心功能正常 | ⬜ | | |
| 6 | 无残留代码 | ⬜ | | |

---

## 状态说明

- ⬜ 待处理
- ✅ 已完成
- ❌ 有问题
- ⚠️ 需注意
