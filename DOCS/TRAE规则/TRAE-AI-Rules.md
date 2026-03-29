# TRAE AI功能开发规则
## 1. 架构强制
- AI逻辑：services/aiService.js
- AI任务：必须走 aiQueueService 队列
- AI路由：routes/ai.js 统一管理

## 2. 前端AI组件
- 分析面板：AIAnalysisPanel.vue
- 历史记录：AIHistoryList.vue
- 批量分析：BatchAnalysis.vue
- 语义分析：QuestionSemanticAnalysis.vue

## 3. 大数据兼容
- 禁止前端直接请求大模型，全部走后端队列
- 批量分析自动分片，防止内存溢出
- 分析结果自动缓存，减少重复计算