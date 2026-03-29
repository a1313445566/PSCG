# TRAE 项目核心规则
适用：AI助手全栈开发 | 大数据场景 | 可交付生产项目
版本：v1.0 | 最后更新：2026-03-29

## 1. 技术栈强制规范
✅ 前端：Vue3 + <script setup> + Element Plus + Pinia + Vite
✅ 后端：Express + MySQL2 + JWT + Multer + Sharp
✅ 构建：Vite | 数据库：MySQL（禁止SQLite语法）
✅ 图表：@visactor/vchart、vmind | 富文本：Quill
✅ 安全：JWT认证、CSRF、XSS过滤、请求限流

## 2. 项目结构强制遵守
src/：前端源码 | routes/：后端路由 | services/：业务逻辑
middleware/：中间件 | config/：配置 | utils/：通用工具
所有文件命名严格遵循项目手册，禁止自定义结构

## 3. 大数据/高并发基础规则
- 所有列表接口必加分页（usePagination）
- 数据库查询禁止SELECT *，必须指定字段
- AI任务必须走队列（aiQueueService），禁止同步阻塞
- 接口添加防抖、重试、超时，统一用api.js封装