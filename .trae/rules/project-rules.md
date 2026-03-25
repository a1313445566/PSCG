# PSCG 项目规矩

## 📦 核心技术栈

### 前端
- **框架**: Vue 3.5.25 + Composition API
- **构建工具**: Vite 5.x
- **状态管理**: Pinia 3.0.4
- **路由**: Vue Router 4.6.4
- **UI 组件库**: Element Plus 2.13.3
- **图表库**: ECharts 5.4.3
- **富文本编辑器**: Quill 2.0.3
- **HTTP 客户端**: Axios 1.13.6

### 后端
- **运行时**: Node.js 16+
- **框架**: Express 4.18.2
- **数据库**: MySQL 8.0+ (mysql2 3.20.0)
- **认证**: JSON Web Token 9.0.3
- **文件上传**: Multer 2.1.1
- **缓存**: Memory Cache 0.2.0
- **环境变量**: Dotenv 17.3.1
- **其他**: Compression 1.8.1, CORS 2.8.5

## 📁 项目结构

### 前端目录
```
src/
├── components/        # 可复用组件
│   ├── admin/         # 后台管理组件
│   ├── common/        # 通用组件
│   ├── quiz/          # 答题相关组件
│   └── ...            # 其他功能组件
├── views/             # 页面组件
├── stores/            # Pinia 状态管理
├── router/            # 路由配置
├── utils/             # 工具函数
├── composables/       # 自定义 Hook
├── styles/            # 样式文件
├── App.vue            # 根组件
└── main.js            # 入口文件
```

### 后端目录
```
routes/                # 后端路由
├── admin.js          # 管理员相关
├── users.js          # 用户管理
├── questions.js      # 题目管理
├── quiz.js           # 答题相关
├── subjects.js       # 学科管理
└── ...               # 其他路由

services/              # 后端服务
├── database.js       # 数据库服务
└── ...               # 其他服务

middleware/            # 中间件
├── adminAuth.js      # 管理员权限验证
├── rateLimit.js      # IP/用户限流
└── ...               # 其他中间件
```

### 文档目录
```
DOCS/
├── 技术文档/          # 技术实现和架构文档
├── API文档/           # API接口文档
├── 使用指南/          # 用户使用指南
├── 需求文档/          # 项目需求和功能规划
├── 部署文档/          # 部署和运维文档
└── 开发文档/          # 开发相关文档
```

## 🎨 编码规范

### 前端规范

#### 文件命名
- **Vue组件**: PascalCase，如 `UserManagement.vue`
- **JavaScript文件**: camelCase，如 `dateUtils.js`
- **CSS文件**: kebab-case，如 `global.css`

#### 代码风格
- **缩进**: 2个空格
- **引号**: 单引号
- **分号**: 始终使用
- **变量命名**: camelCase
- **常量命名**: UPPER_SNAKE_CASE
- **组件命名**: PascalCase

#### Vue组件结构
```vue
<template>
  <div class="component-name">
    <!-- 组件内容 -->
  </div>
</template>

<script setup>
// 导入依赖
import { ref, computed } from 'vue'
import { api } from '@/utils/api'
import message from '@/utils/message'

// 响应式数据
const data = ref([])

// 计算属性
const total = computed(() => data.value.length)

// 方法
const handleClick = async () => {
  try {
    // 业务逻辑
  } catch (error) {
    // 错误处理
  }
}
</script>

<style scoped>
.component-name {
  /* 样式 */
}
</style>
```

### 后端规范

#### 文件命名
- **路由文件**: 小写字母和连字符，如 `users.js`
- **服务文件**: camelCase，如 `database.js`

#### 代码风格
- **缩进**: 2个空格
- **引号**: 单引号
- **分号**: 始终使用
- **变量命名**: camelCase
- **常量命名**: UPPER_SNAKE_CASE

#### 路由结构
```javascript
const express = require('express')
const router = express.Router()
const adminAuth = require('../middleware/adminAuth')

router.get('/users', adminAuth, async (req, res) => {
  try {
    // 业务逻辑
    res.json({ success: true, data: [...] })
  } catch (error) {
    console.error('[用户管理] 获取列表失败:', error)
    res.status(500).json({ error: '获取列表失败，请稍后重试' })
  }
})

module.exports = router
```

## 🔧 最佳实践

### 前端最佳实践

#### 组件设计
- **单一职责**: 每个组件只做一件事
- **可复用性**: 设计可复用的组件
- **组合优于继承**: 使用组合式API
- **Props向下，Events向上**: 单向数据流

#### 状态管理
- 使用Pinia进行状态管理
- 合理使用computed和watch
- 避免过度使用全局状态

#### 性能优化
- 组件懒加载
- 合理使用虚拟滚动
- 图片优化
- 减少不必要的重渲染

### 后端最佳实践

#### 路由设计
- RESTful API设计
- 合理的路由分层
- 统一的错误处理

#### 数据库操作
- 使用参数化查询防止SQL注入
- 合理使用事务
- 数据库连接池管理
- 适当的索引设计

#### 安全措施
- JWT认证
- 权限控制
- 输入验证
- XSS防护
- CSRF防护

## 🚀 构建与部署

### 构建
- 使用 `npm run build` 构建生产版本
- 构建产物优化

### 部署
- 静态文件部署: dist 目录
- 后端服务: 使用 PM2 管理
- 环境配置: 使用 .env 文件

## 🌿 开发流程

### 分支管理
- **主分支**: main
- **开发分支**: develop
- **特性分支**: feature/*
- **修复分支**: fix/*

### 提交规范
- 提交信息清晰明了
- 关联 issue
- 代码审查通过后合并

### 代码审查
- 代码风格检查
- 语法错误检查
- 逻辑错误检查
- 安全性检查

## 📝 注意事项

1. **依赖管理**: 优先使用项目已有的依赖，新增依赖需评估必要性
2. **安全规范**: 严格遵守安全最佳实践，特别是数据库操作和用户输入处理
3. **性能监控**: 关注系统性能，及时优化瓶颈
4. **文档更新**: 代码变更后及时更新相关文档
5. **错误处理**: 所有异步操作必须使用 try-catch
6. **资源清理**: 定时器、事件监听、网络请求必须在组件卸载时清理

## 🤖 AI 辅助开发指南

### AI 工作流程

1. **项目现状检查**
   - 检查数据库类型
   - 检查现有工具和组件
   - 检查现有中间件和 API

2. **阅读技术栈清单**
   - 了解数据库类型和语法规范
   - 了解后端技术栈和中间件
   - 了解前端技术栈和工具封装

3. **使用需求文档模板**
   - 复制模板内容
   - 填写具体需求
   - 确保包含所有必要的技术约束

4. **编写代码示例**
   - 避免数据库语法错误
   - 避免 Composables 使用错误
   - 避免图标导入遗漏
   - 避免 API/消息封装遗漏
   - 避免权限验证遗漏
   - 避免错误处理遗漏

5. **代码示例完整性检查**
   - 前端代码：导入语句、图标、工具函数、Composables、响应式数据、方法定义、生命周期钩子、资源清理
   - 后端代码：require 语句、中间件、数据库操作、错误处理、SQL 语法

### 最重要的规则

#### 数据库
- ✅ MySQL 语法: `AUTO_INCREMENT`, `VARCHAR`, `INT`
- ❌ SQLite 语法: `AUTOINCREMENT`, `TEXT`, `INTEGER`

#### API 调用
- ✅ 使用 `api` 封装: `api.get/post/delete`
- ❌ 原生 fetch: `fetch('/api/...')`

#### 消息提示
- ✅ 使用 `message` 封装: `message.success/error`
- ❌ Element Plus: `ElMessage.success`

#### usePagination
- ✅ 正确: `total` 作为参数传入
- ❌ 错误: `pagination.total.value`

#### 图标导入
- ✅ 导入: `import { Delete } from '@element-plus/icons-vue'`
- ❌ 遗漏: 模板中使用但未导入

### 快速参考

#### 数据库操作
```javascript
const db = require('./services/database');

// 查询单条
const row = await db.get('SELECT * FROM table WHERE id = ?', [id]);

// 查询多条
const rows = await db.query('SELECT * FROM table LIMIT ?', [limit]);

// 执行更新
await db.run('INSERT INTO table SET ?', data);
```

#### API 调用
```javascript
import { api } from '@/utils/api'

// GET
const result = await api.get('/api/resource', { page: 1 })

// POST
const result = await api.post('/api/resource', { name: '张三' })

// DELETE
const result = await api.delete('/api/resource/1')
```

#### 消息提示
```javascript
import message from '@/utils/message'

message.success('操作成功')
message.error('操作失败')

const confirmed = await message.confirm('确定删除吗？')
```

#### useLoading
```javascript
import { useLoading } from '@/composables/useLoading'
import { onUnmounted } from 'vue'

const { withLoading, cleanup } = useLoading()

await withLoading(async () => {
  await fetchData()
}, '加载中...')

onUnmounted(cleanup)
```

#### usePagination
```javascript
import { usePagination } from '@/composables/usePagination'
import { ref } from 'vue'

const total = ref(0)  // 先创建
const pagination = usePagination(20, total)  // 传入

// 更新总数
total.value = result.total  // 直接修改
```

#### 图标导入
```vue
<script setup>
import { Delete, Edit, View } from '@element-plus/icons-vue'
</script>

<template>
  <el-icon><Delete /></el-icon>
</template>
```

## 📚 参考资料

- **Vue 3 文档**: https://cn.vuejs.org/
- **Element Plus 文档**: https://element-plus.org/
- **Express 文档**: https://expressjs.com/
- **MySQL 文档**: https://dev.mysql.com/doc/
- **项目文档**: `DOCS/` 目录

---

**最后更新**: 2026年3月26日
**版本**: v1.0.0