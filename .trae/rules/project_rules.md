# TRAE 项目规则（Project Rules）

> 适用范围：Vue3 + Element Plus + Express + MySQL 全栈学习系统
> 版本：v3.0 | 最后更新：2026-04-07
> 优先级：**高于个人规则**
> 参考标准：飞书 TRAE Rules 最佳实践 + 行业提示词工程规范
>
> **v3.0 更新说明**：
> - ✅ 样式规范全面升级：新增 SCSS 变量体系强制要求
> - ✅ 新增完整的样式变量使用规范（颜色/间距/字号/圆角/边框宽度）
> - ✅ 新增 color.adjust() 函数使用指南
> - ✅ 新增硬编码禁止清单和样式抽离规范

---

## 一、技术栈规范（强制）

### 1.1 前端技术栈
| 层级 | 技术 | 版本要求 | 备注 |
|------|------|----------|------|
| 框架 | Vue 3 | ^3.5.x | 必须使用 `<script setup>` |
| UI 库 | Element Plus | ^2.13.x | 图标需显式导入 |
| 状态管理 | Pinia | ^3.0.x | 禁用 Vuex |
| 构建工具 | Vite | ^5.2.x | - |
| 图表 | @visactor/vchart | ^2.0.x | 禁用 ECharts |
| 富文本 | Quill | 2.0.2 | - |

### 1.2 后端技术栈
| 层级 | 技术 | 版本要求 | 备注 |
|------|------|----------|------|
| 框架 | Express | ^4.18.x | - |
| 数据库 | MySQL2 | ^3.20.x | 禁止 SQLite 语法 |
| 认证 | JWT | ^9.0.x | - |
| 文件上传 | Multer + Sharp | 最新稳定版 | 图片压缩必用 Sharp |
| 参数校验 | Zod | ^3.23.x | 新增接口必须使用 |

### 1.3 禁用项
- ❌ 原生 `fetch` / `axios`（必须使用 `src/utils/api.js`）
- ❌ 直接使用 `ElMessage`（必须使用 `@/utils/message`）
- ❌ SQLite 语法（`INTEGER PRIMARY KEY` 等）
- ❌ `var` 声明（强制 `const`/`let`）

---

## 二、项目结构规范（强制）

### 2.1 目录结构
```
e:\PSCG/
├── src/                    # 前端源码
│   ├── components/         # 组件（按功能模块分组）
│   ├── views/              # 页面视图
│   ├── stores/             # Pinia 状态管理
│   ├── composables/        # 组合式函数（useXxx 命名）
│   ├── utils/              # 工具函数
│   ├── config/             # 配置文件
│   └── styles/             # 样式文件
├── routes/                 # 后端路由
├── services/               # 业务逻辑层
├── middleware/             # 中间件
├── config/                 # 配置文件
├── utils/                  # 后端工具
└── DOCS/                   # 项目文档
```

### 2.2 禁止操作
- ❌ 新增顶层目录
- ❌ 修改现有目录结构
- ❌ 在错误位置创建文件

---

## 三、代码规范（强制）

### 3.1 Vue 组件规范
```vue
<!-- ✅ 正确示例 -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const localValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<template>
  <el-input v-model="localValue" :disabled="disabled" />
</template>

<style scoped>
/* 组件样式 */
</style>
```

### 3.2 命名规范
| 类型 | 规范 | 示例 |
|------|------|------|
| 组件/页面 | PascalCase | `QuestionCard.vue` |
| 变量/方法 | camelCase | `questionList` |
| 常量 | UPPER_SNAKE_CASE | `API_BASE_URL` |
| 组合式函数 | useXxx | `usePagination.js` |
| CSS 类名 | kebab-case | `.question-card` |

### 3.3 样式规范（v3.0 重大更新）

> ⚠️ **2026-04-07 重要更新**：项目已完成样式变量化改造，所有新代码必须遵守以下规范

#### 3.3.0 核心原则（强制）

1. **禁止硬编码**：颜色、间距、字号、圆角、边框宽度必须使用 SCSS 变量
2. **变量优先级**：SCSS 变量 > CSS 变量 > 硬编码（仅允许透明黑等极少数例外）
3. **函数替代**：使用 `color.adjust()` 替代已弃用的 `lighten()/darken()`
4. **样式抽离**：`.vue` 文件中 `<style>` 超过 200 行且占比 > 30% 时，必须抽离为独立 `.scss` 文件
5. **全局注入**：Vite 已配置 `additionalData`，无需手动导入 `_variables.scss`

#### 3.3.1 必须使用 SCSS 变量

- ✅ 颜色值使用变量（`_variables.scss`）
- ✅ 禁止内联样式，必须使用 SCSS 变量和函数
- ✅ 禁止使用硬编码的 RGB 值，必须使用 SCSS 变量和函数
- ✅ 大于100 行的样式代码需要抽离到独立的 SCSS 文件中

**常用变量速查**：

| 类型 | 示例 | 说明 |
|------|------|------|
| 颜色 | `$primary-color`, `$text-primary`, `$admin-bg` | 禁止 `#ff6b6b` 等 |
| 间距 | `$spacing-md`(16px), `$spacing-lg`(24px) | 禁止 `padding: 16px` |
| 字号 | `$font-size-base`(14px), `$font-size-lg`(18px) | 禁止 `font-size: 14px` |
| 圆角 | `$border-radius-sm`(8px), `$border-radius-lg`(24px) | 禁止 `border-radius: 8px` |
| 边框宽度 | `$border-width`(1px), `$border-width-md`(2px) | 禁止 `border: 1px solid` |
| 渐变 | `$bg-gradient-page`, `$header-gradient` | 禁止手写 `linear-gradient(...)` |
| 阴影 | `$shadow-md`, `$shadow-btn-primary` | 禁止手写 `box-shadow: ...` |

#### 3.3.2 color.adjust() 函数（强制）

```scss
@use 'sass:color';

// ❌ 已弃用
background: lighten($color, 10%);
border-color: darken($color, 10%);

// ✅ 推荐使用
background: color.adjust($color, $lightness: 10%);
border-color: color.adjust($color, $lightness: -10%);
```

#### 3.3.3 样式文件抽离规则

当满足以下条件时，**必须**将 `<style>` 抽离为独立 `.scss`：
- `<style>` 行数 > 200 行 且 样式占比 > 30%
- 或文件总行数 > 600 行

#### 3.3.4 允许的例外（需注释说明）

```scss
// ✅ 允许：透明纯黑（过于通用）
background: rgba(0, 0, 0, 0.5);  // 通用遮罩层

// ✅ 允许：SVG 图形颜色数据
.icon { fill: #2d3748; }  // SVG 内联色

// ✅ 允许：Element Plus 深度覆盖
:deep(.el-button) { --el-button-bg-color: #409eff; }
```

#### 3.3.5 详细文档

完整的变量列表和使用示例，请参阅：
- [样式变量使用指南](../DOCS/开发规范/样式变量使用指南.md)
- [编码规范 - CSS/SCSS 章节](../DOCS/开发文档/编码规范.md#三-css--scss-规范)
### 3.4 注释规范
```javascript
// ✅ 关键逻辑必须加中文注释
const handleQuestionSubmit = async (answer) => {
  // 验证答案格式
  if (!validateAnswer(answer)) {
    showMessage('答案格式错误', 'error')
    return
  }
  
  // 提交答案到后端
  const result = await submitAnswer(answer)
  return result
}
```

---

## 四、API 规范（强制）

### 4.1 前端 API 调用
```javascript
// ✅ 正确：使用封装的 api.js
import api from '@/utils/api'

const fetchQuestions = async (params) => {
  try {
    const res = await api.get('/api/questions', { params })
    return res.data
  } catch (error) {
    showMessage('获取题目失败', 'error')
    throw error
  }
}
```

### 4.2 后端接口规范
```javascript
// ✅ 正确：统一响应格式
router.get('/questions', async (req, res) => {
  try {
    const questions = await getQuestions(req.query)
    res.json({
      code: 200,
      msg: '获取成功',
      data: questions
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      msg: error.message,
      data: null
    })
  }
})
```

### 4.3 参数校验（新增接口必用）
```javascript
// ✅ 使用 Zod 进行参数校验
const { z } = require('zod')

const questionSchema = z.object({
  title: z.string().min(1).max(500),
  type: z.enum(['single', 'multiple', 'judgment', 'reading']),
  options: z.array(z.string()).min(2).max(6),
  answer: z.string().min(1)
})
```

---

## 五、数据库规范（强制）

### 5.1 查询规范
- ❌ 禁止 `SELECT *`，必须指定字段
- ✅ 分页查询必须加 `LIMIT`
- ✅ 高频查询字段必须加索引

### 5.2 MySQL 语法规范
```sql
-- ✅ 正确：MySQL 语法
CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ❌ 错误：SQLite 语法
CREATE TABLE questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ...
);
```

---

## 六、安全规范（强制）

### 6.1 认证授权
- 管理员接口：必须通过 `middleware/adminAuth.js` 验证
- 用户接口：必须验证 JWT Token
- 敏感操作：必须二次验证

### 6.2 输入安全
- 所有入参必须校验（Zod）
- 防 SQL 注入：使用参数化查询
- 防 XSS：使用 `xss-filter.js` 过滤

### 6.3 敏感信息
- ❌ 禁止上传 Git：`.env`、密钥、密码
- ✅ 使用环境变量：`process.env.DB_PASSWORD`

---

## 七、性能规范（强制）

### 7.1 前端性能
| 场景 | 要求 |
|------|------|
| 组件加载 | 按需导入，路由懒加载 |
| 大列表 | 虚拟滚动（> 100 条） |
| 图片 | 懒加载 + 压缩 |
| 防抖节流 | 搜索、滚动等高频操作 |

### 7.2 后端性能
| 场景 | 要求 |
|------|------|
| 分页 | 所有列表接口必须分页 |
| 批量操作 | 每批 ≤ 1000 条 |
| 连接池 | 复用数据库连接 |
| 缓存 | 高频数据使用 Redis/内存缓存 |

### 7.3 响应时间标准
- 普通接口：< 500ms
- 复杂查询：< 1000ms
- AI 接口：< 30s（流式响应）

---

## 八、工具使用规范（强制）

### 8.1 必用工具
| 工具 | 用途 | 文件位置 |
|------|------|----------|
| `useLoading` | 加载状态管理 | `src/composables/useLoading.js` |
| `usePagination` | 分页逻辑 | `src/composables/usePagination.js` |
| `showMessage` | 消息提示 | `src/utils/message.js` |
| `api` | HTTP 请求 | `src/utils/api.js` |

### 8.2 Element Plus 图标
```javascript
// ✅ 正确：显式导入图标
import { Edit, Delete, Search } from '@element-plus/icons-vue'

// ❌ 错误：全局注册图标
app.use(ElementPlus, { locale: zhCn })
```

---

## 九、防幻觉验证规范（强制）

### 9.1 核心原则
> **禁止基于假设行动**：任何功能、API、字段必须验证存在后才能使用

### 9.2 验证流程
```
1. 读取文件 → 2. 搜索代码 → 3. 验证 API → 4. 检查数据库 → 5. 基于实施
```

### 9.3 验证工具
| 工具 | 用途 |
|------|------|
| `Read` | 读取文件内容 |
| `Grep` | 搜索代码片段 |
| `Glob` | 查找文件路径 |
| `SearchCodebase` | 语义化搜索 |

### 9.4 典型陷阱规避
| 陷阱 | 错误做法 | 正确做法 |
|------|----------|----------|
| 先入为主 | 假设"注册=账号+密码" | 验证实际登录方式 |
| 过度推断 | 没读文件就重构 | 先读取再修改 |
| 缺乏验证 | 假设 API 存在 | 搜索验证后再使用 |

---

## 十、提交规范（强制）

### 10.1 提交前检查
```bash
# 必须执行
npm run lint
npm run format
```

### 10.2 提交信息格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型（type）**：
- `feat`: 新功能
- `fix`: 修复 Bug
- `refactor`: 重构
- `docs`: 文档更新
- `style`: 代码格式
- `test`: 测试
- `chore`: 构建/工具

**示例**：
```
feat(questions): 添加判断题类型支持

- 新增判断题选项固定为 ["对", "错"]
- 前端不打乱判断题选项
- 后端验证判断题答案格式

Closes #123
```

---

## 十一、质量检查清单

### 11.1 代码提交前必查
- [ ] ESLint 无错误
- [ ] Prettier 格式化完成
- [ ] 无 `console.log` 调试代码
- [ ] 无硬编码配置
- [ ] 异步操作有错误处理

### 11.2 功能开发后必查
- [ ] 接口有参数校验
- [ ] 数据库查询有索引
- [ ] 大数据场景测试通过
- [ ] 安全漏洞检查通过

---

## 十二、版本历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| v3.0 | 2026-04-07 | **重大更新：样式规范全面升级，新增 SCSS 变量体系强制要求、color.adjust() 函数、硬编码禁止清单、样式抽离规范** |
| v2.0 | 2026-04-05 | 重构规则结构，增加表格、示例、检查清单 |
| v1.0 | 2026-03-29 | 初始版本 |
