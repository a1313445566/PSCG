# TRAE 项目规则（Project Rules）
适用：Vue3 + Element Plus + Express + MySQL 全栈学习系统
版本：v1.0 | 最后更新：2026-03-29
优先级：高于个人规则

## 一、技术栈强制规范
1. 前端：Vue3 + <script setup> + Element Plus + Pinia + Vite
2. 后端：Express + MySQL2 + JWT + Multer + Sharp
3. 数据库：严格使用 MySQL 语法（AUTO_INCREMENT、VARCHAR、INT），禁止 SQLite 写法
4. 图表：@visactor/vchart、VMind；富文本：Quill
5. API 封装：必须使用 `src/utils/api.js`，禁止原生 fetch/axios
6. 消息提示：必须使用 `@/utils/message`，禁止直接使用 ElMessage

## 二、项目结构强制遵守
1. 前端：src/components、src/views、src/stores、src/composables
2. 后端：routes → middleware → services → database
3. 配置：config/；工具：utils/；中间件：middleware/
4. 禁止新增顶层目录，禁止修改现有目录结构

## 三、代码规范（强制）
1. Vue 文件：必须使用 <script setup>，props 必须定义类型
2. 命名：组件/页面 PascalCase；变量/方法 camelCase；常量 UPPER_SNAKE_CASE
3. 样式：必须 scoped，缩进 2 空格，支持 SCSS
4. 注释：关键逻辑必须加中文注释，禁止冗余代码

## 四、大数据/高并发约束
1. 所有列表接口必须分页（使用 usePagination）
2. 数据库查询禁止 SELECT *，必须指定字段
3. 接口默认防抖、30 秒超时、自动重试 2 次
4. 批量操作分批执行，每次 ≤ 1000 条

## 五、安全规范
1. 管理员接口必须通过 `middleware/adminAuth.js` 验证
2. 所有入参必须校验，防 SQL 注入、XSS
3. AI 接口启用速率限制（rateLimit）
4. 敏感信息不上传 Git，使用环境变量

## 六、工具使用强制
1. 加载状态：必须使用 useLoading，组件卸载执行 cleanup
2. 分页：必须使用 usePagination，传入 total ref
3. Element Plus 图标：必须显式导入 `@element-plus/icons-vue`
4. 错误处理：所有异步请求必须 try/catch，统一错误提示

## 七、防幻觉验证规范（强制）
1. **禁止基于假设行动**：任何功能、API、字段必须验证存在后才能使用
2. **强制验证流程**：读取文件 → 搜索代码 → 验证API → 检查数据库 → 基于实施
3. **文档重构必查**：必须调用 `anti-hallucination-validator` Skill，完成检查清单
4. **数据驱动验证**：不要基于"常见模式"假设，要基于"实际代码"验证
5. **对比检查**：修改前后必须对比，确认无幻觉内容
6. **典型陷阱规避**：
   - 先入为主：不要假设"注册=账号+密码"，要验证实际登录方式
   - 过度推断：不要没读文件就重构，要先读取再修改
   - 缺乏验证：不要假设API存在，要搜索验证
7. **验证工具使用**：
   - Read/Grep/Glob：验证代码实现
   - 检查 routes/*.js：验证API存在
   - 检查数据库schema：验证字段存在
8. **质量标准**：所有内容必须有代码依据、API支持、数据验证
