# TRAE 项目规则（Project Rules）

> 适用范围：Vue3 + Element Plus + Express + MySQL 全栈学习系统  
> 版本：v2.0 | 最后更新：2026-04-05  
> 优先级：**高于个人规则**  
> 参考标准：飞书 TRAE Rules 最佳实践 + 行业提示词工程规范

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

### 3.3 样式规范
- 必须使用 `scoped` 作用域
- 缩进：2 空格
- 支持 SCSS 语法
- 颜色值使用变量（`_variables.scss`）

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
| v2.0 | 2026-04-05 | 重构规则结构，增加表格、示例、检查清单 |
| v1.0 | 2026-03-29 | 初始版本 |
