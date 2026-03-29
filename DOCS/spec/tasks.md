# 删除AI功能任务清单

## 任务列表

### 阶段一：前端文件删除（6个任务）

#### T1-1: 删除 AI 视图文件
- **文件**: `src/views/AIAnalysisView.vue`
- **操作**: 删除文件
- **验证**: 文件不存在

#### T1-2: 删除 AI 组件目录
- **目录**: `src/components/admin/ai/`
- **包含文件**:
  - `AIAnalysisPanel.vue`
  - `AIHistoryList.vue`
  - `BatchAnalysis.vue`
- **操作**: 删除整个目录
- **验证**: 目录不存在

#### T1-3: 删除 AI 配置组件
- **文件**: `src/components/admin/basic-settings/AIConfigSetting.vue`
- **操作**: 删除文件
- **验证**: 文件不存在

#### T1-4: 删除题目语义分析组件
- **文件**: `src/components/admin/question/QuestionSemanticAnalysis.vue`
- **操作**: 删除文件
- **验证**: 文件不存在

#### T1-5: 删除学习风格组件
- **文件**: `src/components/admin/learning/UserLearningStyle.vue`
- **操作**: 删除文件
- **验证**: 文件不存在

#### T1-6: 删除 AI 测试脚本
- **文件**: `scripts/test-ai-extended-context.sh`
- **操作**: 删除文件
- **验证**: 文件不存在

---

### 阶段二：前端配置修改（2个任务）

#### T2-1: 修改侧边栏菜单
- **文件**: `src/components/admin/layout/AdminSidebar.vue`
- **修改内容**:
  1. 删除 `topLevelNodes` 中的 AI 菜单项：
     - `{ key: 'ai-analysis', label: 'AI 智能分析', icon: 'ChatDotRound' }`
     - `{ key: 'learning-style', label: '学习风格', icon: 'MagicStick' }`
     - `{ key: 'semantic-analysis', label: '语义分析', icon: 'DataAnalysis' }`
  2. 删除 `menuTreeData` 中的 AI 菜单项
  3. 删除图标导入：`ChatDotRound, MagicStick, DataAnalysis`

#### T2-2: 修改管理后台主视图
- **文件**: `src/views/AdminView.vue`
- **修改内容**:
  1. 删除组件导入：
     - `import AIConfigSetting from '../components/admin/basic-settings/AIConfigSetting.vue'`
     - `const AIAnalysisView = ...`
     - `const UserLearningStyle = ...`
     - `const QuestionSemanticAnalysis = ...`
  2. 删除模板中的 `<AIConfigSetting />`
  3. 删除模板中的 AI 相关条件渲染块

---

### 阶段三：后端文件删除（6个任务）

#### T3-1: 删除 AI 路由
- **文件**: `routes/ai.js`
- **操作**: 删除文件
- **验证**: 文件不存在

#### T3-2: 删除 AI 服务
- **文件**: `services/aiService.js`
- **操作**: 删除文件
- **验证**: 文件不存在

#### T3-3: 删除 AI 队列服务
- **文件**: `services/aiQueueService.js`
- **操作**: 删除文件
- **验证**: 文件不存在

#### T3-4: 删除 AI 输入验证中间件
- **文件**: `middleware/aiInputValidation.js`
- **操作**: 删除文件
- **验证**: 文件不存在

#### T3-5: 删除 AI 性能监控
- **文件**: `utils/aiPerformanceMonitor.js`
- **操作**: 删除文件
- **验证**: 文件不存在

#### T3-6: 删除题目语义分析路由
- **文件**: `routes/question-semantic.js`
- **操作**: 删除文件
- **验证**: 文件不存在

---

### 阶段四：后端配置修改（2个任务）

#### T4-1: 修改服务器入口文件
- **文件**: `server.cjs`
- **修改内容**:
  1. 删除路由引用（约第83-84行）：
     ```javascript
     const aiRoutes = require('./routes/ai')
     const questionSemanticRoutes = require('./routes/question-semantic')
     ```
  2. 删除路由挂载（约第216-217行）：
     ```javascript
     app.use('/api/ai', aiRoutes)
     app.use('/api/question-semantic', questionSemanticRoutes)
     ```
  3. 删除表创建函数（约第445-517行）：
     - `createAICacheTable()`
     - `createAIHistoryTable()`
     - `createAIBatchAnalysisTable()`
  4. 删除表创建调用（约第653-659行）

#### T4-2: 修改答题行为路由
- **文件**: `routes/answer-behavior.js`
- **修改内容**:
  1. 删除 AI 服务引用（第14-15行）
  2. 删除 AI 验证中间件引用（第8-12行部分）
  3. 修改 `/user-style/:userId` 接口，移除 AI 相关逻辑
  4. 修改 `/analyze-style` 接口，返回"功能已移除"提示
  5. 修改 `/analyze-error` 接口，移除 AI 队列调用
  6. 删除 `getQueuePosition` 函数

---

### 阶段五：数据库清理（1个任务）

#### T5-1: 清理 AI 相关数据表和设置
- **操作**: 执行 SQL 清理
- **SQL 脚本**:
  ```sql
  -- 删除 AI 相关数据表
  DROP TABLE IF EXISTS ai_analysis_cache;
  DROP TABLE IF EXISTS ai_analysis_history;
  DROP TABLE IF EXISTS ai_batch_analysis;
  DROP TABLE IF EXISTS ai_analysis_queue;
  DROP TABLE IF EXISTS question_semantic_analysis;
  DROP TABLE IF EXISTS question_tags;
  DROP TABLE IF EXISTS question_tag_relations;
  DROP TABLE IF EXISTS user_learning_style;
  DROP TABLE IF EXISTS error_patterns;
  
  -- 删除 AI 相关设置
  DELETE FROM settings WHERE setting_key LIKE 'ai%';
  ```

---

### 阶段六：验证测试（4个任务）

#### T6-1: 前端编译验证
- **操作**: 运行 `npm run build`
- **验证**: 编译成功，无错误

#### T6-2: 后端启动验证
- **操作**: 运行 `npm run server`
- **验证**: 服务启动成功，无 AI 相关错误

#### T6-3: 功能验证
- **验证项目**:
  - [ ] 学生登录正常
  - [ ] 答题功能正常
  - [ ] 题目管理正常
  - [ ] 用户管理正常
  - [ ] 数据分析正常
  - [ ] 管理后台菜单无 AI 入口

#### T6-4: 代码检查
- **操作**: 运行 `npm run lint`
- **验证**: 无 AI 相关引用错误

---

## 任务依赖关系

```
T1-1 ~ T1-6 (并行) → T2-1, T2-2 (并行)
T3-1 ~ T3-6 (并行) → T4-1, T4-2 (并行)
T2-* → T6-1
T4-* → T6-2
T5-1 → T6-3
T6-1, T6-2 → T6-3, T6-4
```

---

## 预计时间

| 阶段 | 预计时间 |
|-----|---------|
| 阶段一 | 5 分钟 |
| 阶段二 | 10 分钟 |
| 阶段三 | 5 分钟 |
| 阶段四 | 15 分钟 |
| 阶段五 | 5 分钟 |
| 阶段六 | 10 分钟 |
| **总计** | **50 分钟** |
