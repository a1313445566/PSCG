# AI 辅助开发指南

**文档用途**: 为 AI 助手提供项目技术栈、规范和常见错误参考\
**适用对象**: AI 开发助手\
**版本**: v1.2\
**最后更新**: 2026-03-29

***

## 📚 文档索引

### 核心文档

| 文档         | 路径                  | 用途        | 何时使用      |
| ---------- | ------------------- | --------- | --------- |
| **技术栈清单**  | `DOCS/技术栈清单.md`     | 项目技术栈完整参考 | 生成需求文档前必读 |
| **需求文档模板** | `DOCS/模板/需求文档模板.md` | 标准化需求文档模板 | 创建新需求时使用  |
| **常见错误示例** | `DOCS/常见错误示例.md`    | 避免重复犯错    | 编写代码示例前必读 |

### 项目文档

| 文档         | 路径               | 用途        |
| ---------- | ---------------- | --------- |
| **项目规则**   | 根目录 `/rules`     | 项目编码规范和约定 |
| **目录结构**   | `DOCS/目录结构说明.md` | 项目目录结构说明  |
| **环境配置**   | `DOCS/环境配置说明.md` | 环境配置说明    |
| **API 文档** | `DOCS/API文档/`    | API 接口文档  |

***

## 🚀 AI 工作流程

### 第一步：项目现状检查

在生成需求文档前，必须先完成以下检查：

```powershell
# 1. 检查数据库类型
Get-Content package.json | Select-String -Pattern "mysql2|sqlite3|postgres"

# 2. 检查现有工具
Get-ChildItem -Path "src/utils" -Force
Get-ChildItem -Path "src/composables" -Force

# 3. 检查现有中间件
Get-ChildItem -Path "middleware" -Force

# 4. 检查现有组件
Get-ChildItem -Path "src/components" -Force

# 5. 检查现有 API
Get-Content server.cjs | Select-String -Pattern "app\.(get|post|put|delete)"
```

***

### 第二步：阅读技术栈清单

阅读 `DOCS/技术栈清单.md`，了解：

- 数据库类型和语法规范
- 后端技术栈和中间件
- 前端技术栈和工具封装
- Composables 使用规范
- 安全措施和编码规范

***

### 第三步：使用需求文档模板

使用 `DOCS/模板/需求文档模板.md` 创建需求文档：

1. 复制模板内容
2. 填写具体需求
3. 确保包含所有必要的技术约束

***

### 第四步：编写代码示例

编写代码示例前，阅读 `DOCS/常见错误示例.md`，避免：

- 数据库语法错误
- Composables 使用错误
- 图标导入遗漏
- API/消息封装遗漏
- 权限验证遗漏
- 错误处理遗漏

***

### 第五步：代码示例完整性检查

使用"代码示例完整性检查清单"进行审查：

#### 前端代码

- [ ] 所有导入语句已包含
- [ ] 所有图标已导入
- [ ] 所有工具函数已导入
- [ ] 所有 Composables 使用正确
- [ ] 所有响应式数据定义正确
- [ ] 所有方法定义完整
- [ ] 生命周期钩子正确使用
- [ ] 资源清理已完成

#### 后端代码

- [ ] 所有 require 语句已包含
- [ ] 所有中间件正确使用
- [ ] 数据库操作使用正确实例
- [ ] 错误处理完整
- [ ] SQL 语法符合项目数据库类型

***

## ⚠️ 最重要的规则

### 数据库

- ✅ MySQL 语法: `AUTO_INCREMENT`, `VARCHAR`, `INT`
- ❌ SQLite 语法: `AUTOINCREMENT`, `TEXT`, `INTEGER`

### API 调用

- ✅ 使用 `api` 封装: `api.get/post/delete`
- ❌ 原生 fetch: `fetch('/api/...')`

### 消息提示

- ✅ 使用 `message` 封装: `message.success/error`
- ❌ Element Plus: `ElMessage.success`

### usePagination

- ✅ 正确: `total` 作为参数传入
- ❌ 错误: `pagination.total.value`

### 图标导入

- ✅ 导入: `import { Delete } from '@element-plus/icons-vue'`
- ❌ 遗漏: 模板中使用但未导入

***

## 📝 快速参考

### 数据库操作

```javascript
const db = require('./services/database');

// 查询单条
const row = await db.get('SELECT * FROM table WHERE id = ?', [id]);

// 查询多条
const rows = await db.query('SELECT * FROM table LIMIT ?', [limit]);

// 执行更新
await db.run('INSERT INTO table SET ?', data);

// 关闭连接
await db.close();
```

### API 调用

```javascript
import { api } from '@/utils/api'

// GET
const result = await api.get('/api/resource', { page: 1 })

// POST
const result = await api.post('/api/resource', { name: '张三' })

// PUT
const result = await api.put('/api/resource/1', { name: '李四' })

// DELETE
const result = await api.delete('/api/resource/1')

// 带配置的请求
const result = await api.get('/api/resource', {}, {
  retries: 3,        // 重试次数
  showError: false,  // 是否显示错误
  debounce: true,    // 是否防抖
  timeout: 30000     // 超时时间
})
```

### 消息提示

```javascript
import message from '@/utils/message'

// 基础提示
message.success('操作成功')
message.error('操作失败')
message.warning('警告信息')
message.info('提示信息')

// 确认对话框
const confirmed = await message.confirm('确定要删除吗？', '删除确认')
if (confirmed) {
  // 用户点击了确定
}

// 删除确认
const confirmed = await message.confirmDelete('此用户')

// 批量操作确认
const confirmed = await message.confirmBatch(10, '删除')

// 操作结果提示
message.actionSuccess('保存')
message.actionFailed('保存', '网络错误')
```

### useLoading

```javascript
import { useLoading } from '@/composables/useLoading'
import { onUnmounted } from 'vue'

const { showLoading, hideLoading, withLoading, cleanup } = useLoading()

// 方式1：手动控制
showLoading('加载中...')
await fetchData()
hideLoading()

// 方式2：自动包装（推荐）
await withLoading(async () => {
  await fetchData()
}, '加载中...')

// 组件卸载时清理
onUnmounted(cleanup)
```

### usePagination

```javascript
import { usePagination } from '@/composables/usePagination'
import { ref } from 'vue'

// ✅ 正确的使用方式
const total = ref(0)  // 先创建 total ref
const pagination = usePagination(20, total)  // 传入 total ref

// 使用分页参数
const params = pagination.getServerParams()  // { page: 1, limit: 20 }

// 更新总数
total.value = result.total  // 直接修改 total ref

// 事件处理
const handleSizeChange = (size) => {
  pagination.handleSizeChange(size)
  loadData()
}

const handleCurrentChange = (page) => {
  pagination.handleCurrentChange(page)
  loadData()
}

// 重置分页
pagination.reset()
```

### 图标导入

```vue
<script setup>
import { Delete, Edit, View } from '@element-plus/icons-vue'
</script>

<template>
  <el-icon><Delete /></el-icon>
</template>
```

***

## 🔗 相关文档

- [技术栈清单](./技术栈清单.md)
- [需求文档模板](./模板/需求文档模板.md)
- [常见错误示例](./常见错误示例.md)
- [项目规则](../rules)
- [目录结构说明](./目录结构说明.md)
- [环境配置说明](./环境配置说明.md)

***

**维护说明**:

- 本文档应随项目发展持续更新
- 发现新的最佳实践时，及时添加
- 每次遇到问题后，更新相关文档

***

**最后更新**: 2026-03-29
