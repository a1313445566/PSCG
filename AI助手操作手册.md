# AI助手操作手册

## 项目概述

本项目是一个基于Vue 3 + Element Plus + Express的全栈学习系统，集成了AI数据分析、学习风格分析等功能。

## 技术栈

### 前端

- **框架**: Vue 3 + Composition API + `<script setup>`
- **UI组件库**: Element Plus
- **路由**: Vue Router 4
- **状态管理**: Pinia
- **构建工具**: Vite
- **图表**: @visactor/vchart、vmind
- **富文本**: Quill
- **表格导出**: xlsx

### 后端

- **框架**: Express
- **数据库**: MySQL 2
- **认证**: JWT
- **文件上传**: Multer
- **图像处理**: Sharp
- **中间件**: CORS、Compression、Rate Limit等

## 项目结构

```
e:\PSCG/
├── .husky/               # Git hooks
├── .trae/                # 项目规则
├── .vscode/              # VS Code配置
├── DOCS/                 # 项目文档
├── config/               # 配置文件
├── middleware/           # 后端中间件
├── public/               # 静态资源
├── routes/               # 后端路由
├── scripts/              # 脚本文件
├── services/             # 后端服务
├── src/                  # 前端代码
│   ├── components/       # 组件
│   ├── composables/      # 组合式函数
│   ├── config/           # 前端配置
│   ├── router/           # 前端路由
│   ├── stores/           # Pinia状态管理
│   ├── styles/           # 样式文件
│   ├── utils/            # 前端工具函数
│   ├── views/            # 页面视图
│   ├── App.vue           # 根组件
│   └── main.js           # 入口文件
├── utils/                # 通用工具函数
├── vite-plugins/         # Vite插件
├── .env.example          # 环境变量示例
├── eslintrc.cjs          # ESLint配置
├── package.json          # 项目依赖
├── server.cjs            # 后端入口
└── vite.config.js        # Vite配置
```

## 常用命令

### 开发环境

- **启动前端开发服务器**: `npm run dev`
- **启动后端服务器**: `npm run server`
- **构建项目**: `npm run build`
- **预览构建结果**: `npm run preview`

### 代码质量

- **代码检查与修复**: `npm run lint`
- **代码格式化**: `npm run format`
- **检查代码规范**: `npm run lint:check`

## 开发流程

### 前端开发

1. **创建组件**: 在 `src/components/` 目录下创建组件，使用 PascalCase 命名
2. **创建页面**: 在 `src/views/` 目录下创建页面，使用 PascalCase 命名
3. **配置路由**: 在 `src/router/index.js` 中添加路由
4. **状态管理**: 在 `src/stores/` 目录下创建 Pinia store
5. **API调用**: 使用 `src/utils/api.js` 中的方法调用后端接口

### 后端开发

1. **创建路由**: 在 `routes/` 目录下创建路由文件
2. **创建服务**: 在 `services/` 目录下创建服务文件
3. **添加中间件**: 在 `middleware/` 目录下创建中间件
4. **配置数据库**: 在 `config/database.js` 中配置数据库连接

## 代码规范

### 命名规范

- **组件文件**: PascalCase (如 `UserManagement.vue`)
- **变量/方法**: camelCase (如 `getUserList`)
- **常量**: UPPER_SNAKE_CASE (如 `API_BASE_URL`)
- **文件名**: 小写 + 中划线 (如 `user-list.vue`)

### Vue文件规范

- 必须使用 `<script setup>` 语法
- 按需引入 Element Plus 组件
- 必须写 props 类型定义
- 事件、逻辑拆分清晰
- 关键逻辑添加中文注释
- 禁止冗余代码，保持简洁

### 样式规范

- 使用 scoped 隔离样式
- 支持 scss
- 缩进使用 2 空格

## CSS管理

### 样式文件结构

- **全局样式**: `src/styles/global.css` - 全局样式和主题变量
- **公共样式**: `src/styles/common.css` - 公共组件样式
- **游戏样式**: `src/styles/game-common.css` - 游戏风格相关样式
- **加载样式**: `src/styles/loading.css` - 加载动画样式
- **Markdown样式**: `src/styles/markdown.css` - Markdown渲染样式
- **富文本样式**: `src/styles/rich-text.css` - 富文本编辑器样式

### 主题变量

- 定义在 `src/styles/global.css` 中的 `:root` 选择器下
- 包含主色调、辅助色、背景色、文本色等变量
- 支持游戏风格和后台管理风格的不同主题

### 响应式设计

- 使用媒体查询实现响应式布局
- 适配不同屏幕尺寸
- 在 `src/styles/global.css` 中定义了响应式断点

### 动画效果

- 定义了多种动画效果，如 `fadeIn`、`pulse`、`slideIn`、`bounce` 等
- 可通过添加对应的类名使用这些动画

## API封装

### API客户端

- **API封装类**: `src/utils/api.js` - 提供统一的API调用接口
- **核心功能**:
  - 自动重试机制（网络错误自动重试2次）
  - 请求防抖（防止重复请求）
  - 请求超时处理（默认30秒）
  - CSRF Token自动添加
  - 统一错误处理
  - 支持取消请求

### 使用方法

```js
import { api } from '@/utils/api'

// GET请求
const users = await api.get('/users', { page: 1, limit: 20 })

// POST请求
const result = await api.post('/questions', { title: '题目内容' })

// PUT请求
const result = await api.put('/questions/123', { title: '更新的题目' })

// DELETE请求
await api.delete('/questions/123')

// 带配置的请求
const result = await api.get(
  '/users',
  {},
  {
    showError: false, // 不显示错误提示
    retries: 3 // 重试3次
  }
)
```

## HOOK（组合式函数）

### 常用HOOK

- **useLoading**: `src/composables/useLoading.js` - Loading状态管理
- **usePagination**: `src/composables/usePagination.js` - 分页功能
- **useAdminLayout**: `src/composables/useAdminLayout.js` - 后台布局管理
- **useChartRenderer**: `src/composables/useChartRenderer.js` - 图表渲染
- **useUserFilters**: `src/composables/useUserFilters.js` - 用户筛选功能

### useLoading示例

```js
import { useLoading } from '@/composables/useLoading'
import { onUnmounted } from 'vue'

const { showLoading, hideLoading, withLoading, cleanup } = useLoading()

// 在组件卸载时调用清理
onUnmounted(cleanup)

// 方式1：手动控制
showLoading('加载中...')
await fetchData()
hideLoading()

// 方式2：自动包装（推荐）
await withLoading(async () => {
  await fetchData()
}, '加载中...')
```

## AI相关功能

### 后端AI服务

- **AI服务**: `services/aiService.js` - 处理AI相关逻辑
- **AI队列服务**: `services/aiQueueService.js` - 处理AI任务队列
- **AI路由**: `routes/ai.js` - AI相关接口

### 前端AI组件

- **AI分析面板**: `src/components/admin/ai/AIAnalysisPanel.vue`
- **AI历史记录**: `src/components/admin/ai/AIHistoryList.vue`
- **批量分析**: `src/components/admin/ai/BatchAnalysis.vue`
- **语义分析**: `src/components/admin/question/QuestionSemanticAnalysis.vue`

## 数据库操作

### 配置

- **数据库配置**: `config/database.js`
- **数据库服务**: `services/database.js`

### 迁移脚本

- **迁移文件**: `scripts/migrations/` 目录下

## 安全规范

### 后端安全

- **CSRF保护**: `middleware/csrf.js`
- **管理员认证**: `middleware/adminAuth.js`
- **输入验证**: `middleware/aiInputValidation.js`
- **速率限制**: `middleware/rateLimit.js`

### 前端安全

- **XSS过滤**: `src/utils/xss-filter.js`
- **API缓存**: `src/utils/apiCache.js`

## 性能优化

### 后端优化

- **数据库性能监控**: `middleware/dbPerformance.js`
- **响应时间监控**: `middleware/responseTime.js`
- **签名缓存**: `middleware/signatureCache.js`
- **AI性能监控**: `utils/aiPerformanceMonitor.js`

### 前端优化

- **懒加载**: `src/utils/lazyLoad.js`
- **缓存配置**: `src/utils/cacheConfig.js`
- **草稿存储**: `src/utils/draftStorage.js`

## 部署配置

### 环境变量

- 复制 `.env.example` 为 `.env` 并配置相应的环境变量

### 部署命令

1. 构建前端: `npm run build`
2. 启动后端: `npm run server`

## 常见问题与解决方案

### 前端问题

- **路由配置错误**: 检查 `src/router/index.js` 中的路由配置
- **组件导入错误**: 确保组件路径正确，使用 PascalCase 命名
- **API调用失败**: 检查 `src/utils/api.js` 中的API配置和后端接口

### 后端问题

- **数据库连接失败**: 检查 `config/database.js` 中的数据库配置
- **路由冲突**: 检查 `routes/` 目录下的路由配置
- **中间件顺序**: 确保中间件的加载顺序正确

### AI功能问题

- **AI分析失败**: 检查 `services/aiService.js` 中的AI服务配置
- **队列处理问题**: 检查 `services/aiQueueService.js` 中的队列配置

## 开发工具推荐

### VS Code插件

- **Vetur**: Vue 3 语法支持
- **ESLint**: 代码规范检查
- **Prettier**: 代码格式化
- **GitLens**: Git 增强
- **MySQL Syntax**: MySQL 语法高亮

### 浏览器扩展

- **Vue DevTools**: Vue 3 开发工具
- **JSON Viewer**: JSON 格式化
- **Postman**: API 测试

## 最佳实践

1. **代码复用**: 提取通用逻辑到 composables 或 utils
2. **错误处理**: 统一错误处理机制
3. **代码注释**: 关键逻辑添加中文注释
4. **测试覆盖**: 重要功能添加测试
5. **文档更新**: 功能变更时更新相关文档

## 版本控制

- 使用 Git 进行版本控制
- 提交前运行 `npm run lint` 和 `npm run format`
- 遵循语义化版本规范

## 联系方式

如有问题，请联系项目维护人员。
