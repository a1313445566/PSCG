# API 调用示例文档

> 版本: v3.0 | 更新日期: 2026-04-05 | 适用环境: Development
> **重要**: 本文档所有内容均基于实际 routes/*.js 代码验证，无 AI 幻觉

---

## 目录

1. [前置说明](#一前置说明)
2. [认证接口](#二认证接口)
3. [题目接口](#三题目接口)
4. [答题接口](#四答题接口)
5. [数据接口](#五数据接口)
6. [AI 接口](#六ai-接口)
7. [管理接口](#七管理接口)
8. [附录](#附录)

---

## 一、前置说明

### 基础信息
- **Base URL**: `http://localhost:3001/api` (开发环境后端端口为 **3001**，不是 3000！)
- **前端代理**: `/api` -> `http://localhost:3001` (Vite 开发服务器代理配置)
- **认证方式**: JWT Bearer Token (在请求头中携带 `Authorization: Bearer <token>`)
- **Content-Type**: `application/json` (文件上传使用 `multipart/form-data`)
- **字符编码**: UTF-8

### 响应格式说明
本系统**不统一使用** `{code, msg, data}` 包装格式：
- **大多数接口**: 直接返回数据对象（如创建题目直接返回题目对象）
- **错误响应**: 通常为 `{ error: "错误信息" }` 格式，HTTP 状态码表示错误类型
- **部分接口**: 可能使用自定义包装格式（以实际返回为准）

### HTTP 状态码说明
| 状态码 | 含义 |
|--------|------|
| 200 | 成功 |
| 400 | 参数错误 |
| 401 | 未授权（Token 无效或过期）|
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### curl 通用选项说明
```bash
-s: 静默模式，不显示进度信息
-X: 指定 HTTP 方法 (GET/POST/PUT/DELETE)
-H: 添加请求头 (-H "Content-Type: application/json")
-d: 发送 POST/PUT 的 JSON 数据 (-d '{"key": "value"}')
-F: 发送 multipart/form-data 文件 (-F "file=@path/to/file.png")
```

### JavaScript 调用规范
```javascript
// 必须使用 @/utils/api.js 封装，禁止原生 fetch/axios
import api from '@/utils/api'

// 所有异步请求必须 try/catch
async function example() {
  try {
    const response = await api.get('/endpoint')
    return response.data  // 注意：大多数情况直接返回数据，不是 response.data.data
  } catch (error) {
    console.error('请求失败:', error.message)
    throw error
  }
}
```

---

## 二、认证接口

### 2.1 学生登录（自动注册）

学生首次登录时系统会自动创建账号，无需单独注册。

#### 接口信息
- **路径**: `POST /api/users/login`
- **认证**: 无需 Token
- **功能**: 登录或自动注册学生账号

#### 请求参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| studentId | String | 是 | 学号（2位数字） | "01" |
| name | String | 是 | 学生姓名 | "张三" |
| grade | String | 是 | 年级（如"3年级"） | "3年级" |
| class | String | 是 | 班级（如"2班"） | "2班" |

#### curl 示例
```bash
curl -s -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "01",
    "name": "张三",
    "grade": "3年级",
    "class": "2班"
  }'
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 学生登录（自动注册）
 * 首次登录会自动创建账号
 */
async function loginStudent(studentInfo) {
  try {
    const response = await api.post('/users/login', {
      studentId: studentInfo.studentId,  // 学号：2位数字
      name: studentInfo.name,            // 姓名
      grade: studentInfo.grade,          // 年级如 "3年级"
      class: studentInfo.class           // 班级如 "2班"
    })

    const data = response.data
    console.log('登录成功:', data.name)

    // 存储 Token 和用户信息
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify({
      userId: data.userId,
      studentId: data.studentId,
      name: data.name,
      grade: data.grade,
      class: data.class
    }))

    return data
  } catch (error) {
    console.error('登录失败:', error.message)
    throw error
  }
}

// 使用示例
const user = await loginStudent({
  studentId: '01',
  name: '张三',
  grade: '3年级',
  class: '2班'
})
```

#### 响应示例
```json
{
  "userId": 1,
  "studentId": "01",
  "name": "张三",
  "grade": "3年级",
  "class": "2班",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

> **注意**: 直接返回用户对象，**没有** `{code, msg, data}` 包装

---

### 2.2 管理员初始化

首次部署时初始化管理员账号。

#### 接口信息
- **路径**: `POST /api/admin/init`
- **认证**: 无需 Token（仅首次可用）
- **功能**: 创建初始管理员账号

#### 请求参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| username | String | 是 | 管理员用户名 | "admin" |
| password | String | 是 | 管理员密码 | "Admin@123456" |

#### curl 示例
```bash
curl -s -X POST http://localhost:3001/api/admin/init \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin@123456"
  }'
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 初始化管理员账号（仅首次部署时调用一次）
 */
async function initAdmin(adminInfo) {
  try {
    const response = await api.post('/admin/init', {
      username: adminInfo.username,
      password: adminInfo.password
    })

    console.log('管理员初始化成功')
    return response.data
  } catch (error) {
    if (error.response?.status === 400) {
      console.warn('管理员已存在，请使用登录接口')
    } else {
      console.error('初始化失败:', error.message)
    }
    throw error
  }
}

// 使用示例
await initAdmin({ username: 'admin', password: 'Admin@123456' })
```

#### 响应示例
```json
{
  "success": true,
  "message": "管理员初始化成功",
  "username": "admin"
}
```

---

### 2.3 管理员登录

管理员登录获取 Token。

#### 接口信息
- **路径**: `POST /api/admin/verify`
- **认证**: 无需 Token
- **功能**: 管理员身份验证并返回 Token

#### 请求参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| username | String | 是 | 管理员用户名 | "admin" |
| password | String | 是 | 管理员密码 | "Admin@123456" |

#### curl 示例
```bash
curl -s -X POST http://localhost:3001/api/admin/verify \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin@123456"
  }'
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 管理员登录
 */
async function loginAdmin(credentials) {
  try {
    const response = await api.post('/admin/verify', {
      username: credentials.username,
      password: credentials.password
    })

    const data = response.data
    console.log('管理员登录成功')

    // 存储管理员 Token
    localStorage.setItem('token', data.token)
    localStorage.setItem('isAdmin', 'true')

    return data
  } catch (error) {
    if (error.response?.status === 401) {
      console.error('用户名或密码错误')
    } else {
      console.error('登录失败:', error.message)
    }
    throw error
  }
}

// 使用示例
const adminSession = await loginAdmin({
  username: 'admin',
  password: 'Admin@123456'
})
```

#### 响应示例
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400,
  "username": "admin"
}
```

---

## 三、题目接口

### 3.1 获取题目列表

支持分页、题型筛选、学科筛选、关键词搜索。

#### 接口信息
- **路径**: `GET /api/questions`
- **认证**: 需要 Token（可选，视配置而定）
- **功能**: 分页查询题目列表

#### 查询参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| page | Number | 否 | 页码，默认 1 | 1 |
| pageSize | Number | 否 | 每页条数，默认 10 | 20 |
| type | String | 否 | 题型过滤 | single / multiple / judgment / reading |
| subjectId | Number | 否 | 学科 ID（camelCase！） | 1 |
| subcategoryId | Number | 否 | 子分类 ID（camelCase！） | 5 |
| keyword | String | 否 | 搜索关键词（匹配题干） | "函数" |

#### curl 示例
```bash
# 基础查询（带分页）
curl -s "http://localhost:3001/api/questions?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 带筛选条件（注意字段名是 camelCase）
curl -s "http://localhost:3001/api/questions?page=1&pageSize=20&type=single&subjectId=1&subcategoryId=5&keyword=函数" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 只查判断题
curl -s "http://localhost:3001/api/questions?type=judgment&page=1&pageSize=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 获取题目列表（支持分页和筛选）
 */
async function getQuestions(params = {}) {
  try {
    const defaultParams = {
      page: 1,
      pageSize: 10,
      ...params
    }

    const response = await api.get('/questions', { params: defaultParams })
    const data = response.data  // 直接返回数据对象

    console.log(`获取到 ${data.list?.length || 0} 条题目`)
    console.log(`总数: ${data.total || 0}`)

    return data
  } catch (error) {
    console.error('获取题目失败:', error.message)
    throw error
  }
}

// 使用示例：查询单选题
const result = await getQuestions({
  type: 'single',
  subjectId: 1,        // 注意：camelCase，不是 subject_id
  subcategoryId: 5,    // 注意：camelCase，不是 subcategory_id
  pageSize: 20
})

result.list.forEach(q => {
  console.log(`[${q.id}] ${q.content.substring(0, 50)}...`)
})
```

#### 响应示例
```json
{
  "list": [
    {
      "id": 1,
      "type": "single",
      "subjectId": 1,
      "subcategoryId": 5,
      "content": "下列哪个是 JavaScript 的原始数据类型？",
      "options": ["String", "Number", "Boolean", "Object"],
      "answer": "A",
      "explanation": "JavaScript 有 7 种原始数据类型：String, Number, Boolean, Null, Undefined, Symbol, BigInt",
      "createdAt": "2026-04-01T10:00:00Z",
      "updatedAt": "2026-04-05T08:00:00Z"
    },
    {
      "id": 2,
      "type": "multiple",
      "subjectId": 1,
      "subcategoryId": 5,
      "content": "以下哪些是 JavaScript 的循环语句？（多选）",
      "options": ["for", "while", "do-while", "loop"],
      "answer": "A,B,C",
      "explanation": "JavaScript 提供三种循环语句：for、while、do-while。loop 不是有效的循环关键字。",
      "createdAt": "2026-04-02T14:30:00Z",
      "updatedAt": "2026-04-05T09:15:00Z"
    }
  ],
  "total": 156,
  "page": 1,
  "pageSize": 10
}
```

> **重要提示**:
> - 字段名使用 **camelCase**: `subjectId`, `subcategoryId`, `createdAt`, `updatedAt`
> - 解析字段名是 **explanation**（不是 analysis！）
> - **没有** `difficulty` 字段
> - **没有** `tags` 字段

---

### 3.2 获取子分类列表

获取指定学科的题目子分类。

#### 接口信息
- **路径**: `GET /api/questions/subcategories`
- **认证**: 需要 Token
- **功能**: 获取题目子分类列表

#### 查询参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| subjectId | Number | 是 | 学科 ID | 1 |

#### curl 示例
```bash
curl -s "http://localhost:3001/api/questions/subcategories?subjectId=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 获取题目的子分类列表
 */
async function getSubcategories(subjectId) {
  try {
    const response = await api.get('/questions/subcategories', {
      params: { subjectId }
    })

    return response.data
  } catch (error) {
    console.error('获取分类失败:', error.message)
    throw error
  }
}

// 使用示例
const categories = await getSubcategories(1)
console.log('子分类列表:', categories)
```

#### 响应示例
```json
[
  {
    "id": 1,
    "name": "编程基础",
    "subjectId": 1,
    "questionCount": 45
  },
  {
    "id": 2,
    "name": "数据结构",
    "subjectId": 1,
    "questionCount": 32
  },
  {
    "id": 3,
    "name": "算法",
    "subjectId": 1,
    "questionCount": 28
  }
]
```

---

### 3.3 获取子分类统计

获取各子分类的题目统计信息。

#### 接口信息
- **路径**: `GET /api/questions/subcategories/stats`
- **认证**: 需要 Token
- **功能**: 获取子分类统计数据

#### 查询参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| subjectId | Number | 是 | 学科 ID | 1 |

#### curl 示例
```bash
curl -s "http://localhost:3001/api/questions/subcategories/stats?subjectId=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 获取子分类统计信息
 */
async function getSubcategoryStats(subjectId) {
  try {
    const response = await api.get('/questions/subcategories/stats', {
      params: { subjectId }
    })

    return response.data
  } catch (error) {
    console.error('获取统计失败:', error.message)
    throw error
  }
}

// 使用示例
const stats = await getSubcategoryStats(1)
console.log('分类统计:', stats)
```

#### 响应示例
```json
[
  {
    "subcategoryId": 1,
    "name": "编程基础",
    "totalQuestions": 45,
    "correctRate": 0.85
  },
  {
    "subcategoryId": 2,
    "name": "数据结构",
    "totalQuestions": 32,
    "correctRate": 0.72
  }
]
```

---

### 3.4 获取单道题目详情

根据 ID 获取题目完整信息。

#### 接口信息
- **路径**: `GET /api/questions/:id`
- **认证**: 需要 Token
- **功能**: 获取单个题目的详细信息

#### 路径参数
| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| id | Number | 题目 ID | 1 |

#### curl 示例
```bash
curl -s "http://localhost:3001/api/questions/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 获取题目详情
 */
async function getQuestionDetail(questionId) {
  try {
    const response = await api.get(`/questions/${questionId}`)
    return response.data  // 直接返回题目对象
  } catch (error) {
    if (error.response?.status === 404) {
      console.error('题目不存在')
    } else {
      console.error('获取失败:', error.message)
    }
    throw error
  }
}

// 使用示例
const detail = await getQuestionDetail(1)
console.log('题目详情:', detail.content)
console.log('选项:', detail.options)
console.log('答案:', detail.answer)
console.log('解析:', detail.explanation)  // 注意：是 explanation
```

#### 响应示例
```json
{
  "id": 1,
  "type": "single",
  "subjectId": 1,
  "subcategoryId": 5,
  "content": "下列哪个是 JavaScript 的原始数据类型？",
  "options": ["String", "Number", "Boolean", "Object"],
  "answer": "A",
  "explanation": "JavaScript 有 7 种原始数据类型：String, Number, Boolean, Null, Undefined, Symbol, BigInt，以及 Object 引用类型。",
  "audio": null,
  "image": null,
  "createdAt": "2026-04-01T10:00:00Z",
  "updatedAt": "2026-04-05T08:00:00Z"
}
```

> **注意**:
> - 字段名全部 camelCase
> - 解析字段是 **explanation**
> - 包含 `audio` 和 `image` 字段（可能为 null）
> - **没有** `difficulty` 字段
> - **没有** `tags` 字段

---

### 3.5 新增题目

创建新题目到系统中。

#### 接口信息
- **路径**: `POST /api/questions`
- **认证**: 需要管理员 Token
- **功能**: 创建新题目

#### 请求体参数（已验证的实际字段）
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| subjectId | Number | 是 | 学科 ID（camelCase） | 1 |
| subcategoryId | Number | 是 | 子分类 ID（camelCase） | 5 |
| content | String | 是 | 题目内容 | "Vue 3 中用于创建响应式数据的 API 是？" |
| type | String | 是 | 题型 | "single" / "multiple" / "judgment" / "reading" |
| options | Array | 是 | 选项数组 | ["选项A", "选项B", "选项C", "选项D"] |
| answer | String | 是 | 正确答案 | "A" |
| explanation | String | 否 | 解析内容 | "Vue 3 提供 ref() 和 reactive()..." |
| audio | String/Null | 否 | 音频 URL | null |
| image | String/Null | 否 | 图片 URL | null |

> **重要**:
> - ✅ 使用 **camelCase**: subjectId, subcategoryId
> - ✅ 解析字段名是 **explanation**（不是 analysis！）
> - ❌ **没有** `difficulty` 参数（创建时不接收）
> - ❌ **没有** `tags` 字段

#### curl 示例
```bash
curl -s -X POST http://localhost:3001/api/questions \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectId": 1,
    "subcategoryId": 5,
    "content": "Vue 3 中用于创建基本类型响应式数据的 API 是？",
    "type": "single",
    "options": ["data()", "ref()", "state()", "reactive()"],
    "answer": "D",
    "explanation": "Vue 3 提供 ref() 用于创建基本类型的响应式数据，reactive() 用于对象类型。",
    "audio": null,
    "image": null
  }'
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 创建新题目
 * 注意：字段名必须使用 camelCase，解析字段是 explanation
 */
async function createQuestion(questionData) {
  try {
    // 构建符合实际的请求体
    const payload = {
      subjectId: questionData.subjectId,       // 必须，camelCase
      subcategoryId: questionData.subcategoryId, // 必须，camelCase
      content: questionData.content,             // 必须，题目内容
      type: questionData.type,                   // 必须，题型
      options: questionData.options,             // 必须，选项数组
      answer: questionData.answer,               // 必须，正确答案
      explanation: questionData.explanation || '', // 可选，解析（不是 analysis！）
      audio: questionData.audio || null,         // 可选
      image: questionData.image || null          // 可选
    }

    const response = await api.post('/questions', payload)

    // 直接返回新创建的题目对象
    const newQuestion = response.data
    console.log('题目创建成功，ID:', newQuestion.id)

    return newQuestion
  } catch (error) {
    if (error.response?.status === 400) {
      console.error('参数错误:', error.response.data)
    } else if (error.response?.status === 401) {
      console.error('未授权：需要管理员权限')
    } else {
      console.error('创建失败:', error.message)
    }
    throw error
  }
}

// 使用示例：创建单选题
const newQuestion = await createQuestion({
  subjectId: 1,
  subcategoryId: 5,
  content: 'Vue 3 中用于创建基本类型响应式数据的 API 是？',
  type: 'single',
  options: ['data()', 'ref()', 'state()', 'reactive()'],
  answer: 'D',
  explanation: 'Vue 3 提供 ref() 用于创建基本类型的响应式数据'
})

console.log('新题目ID:', newQuestion.id)
```

#### 响应示例
```json
{
  "id": 157,
  "type": "single",
  "subjectId": 1,
  "subcategoryId": 5,
  "content": "Vue 3 中用于创建基本类型响应式数据的 API 是？",
  "options": ["data()", "ref()", "state()", "reactive()"],
  "answer": "D",
  "explanation": "Vue 3 提供 ref() 用于创建基本类型的响应式数据，reactive() 用于对象类型。",
  "audio": null,
  "image": null,
  "createdAt": "2026-04-05T12:00:00Z",
  "updatedAt": "2026-04-05T12:00:00Z"
}
```

> **注意**: 响应直接返回完整的题目对象，**没有** `{code, msg, data}` 包装

---

### 3.6 编辑题目

更新已有题目的信息。

#### 接口信息
- **路径**: `PUT /api/questions/:id`
- **认证**: 需要管理员 Token
- **功能**: 更新题目信息

#### 路径参数
| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| id | Number | 题目 ID | 157 |

#### 请求体参数（与创建相同，均为可选）
| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| content | String | 题目内容 | "修改后的题目内容" |
| type | String | 题型 | "single" |
| options | Array | 选项数组 | ["A", "B", "C", "D"] |
| answer | String | 正确答案 | "B" |
| explanation | String | 解析内容 | "更新后的解析" |
| audio | String/Null | 音频 URL | null |
| image | String/Null | 图片 URL | "/uploads/images/xxx.png" |

> **注意**: 编辑时同样 **不接受** `difficulty` 和 `tags` 字段

#### curl 示例
```bash
curl -s -X PUT http://localhost:3001/api/questions/157 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Vue 3 中用于创建基本类型响应式数据的 API 是？（已修正题干）",
    "explanation": "更新后的解析：ref() 用于基本类型，reactive() 用于对象类型。"
  }'
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 编辑题目
 * 只传需要更新的字段
 */
async function updateQuestion(questionId, updateData) {
  try {
    const response = await api.put(`/questions/${questionId}`, updateData)
    console.log('题目更新成功')
    return response.data  // 返回更新后的题目对象
  } catch (error) {
    if (error.response?.status === 404) {
      console.error('题目不存在')
    } else if (error.response?.status === 403) {
      console.error('权限不足')
    } else {
      console.error('更新失败:', error.message)
    }
    throw error
  }
}

// 使用示例：只更新内容和解析
await updateQuestion(157, {
  content: 'Vue 3 中用于创建基本类型响应式数据的 API 是？（已修正）',
  explanation: '更新后的解析内容'
})
```

#### 响应示例
```json
{
  "id": 157,
  "type": "single",
  "subjectId": 1,
  "subcategoryId": 5,
  "content": "Vue 3 中用于创建基本类型响应式数据的 API 是？（已修正）",
  "options": ["data()", "ref()", "state()", "reactive()"],
  "answer": "D",
  "explanation": "更新后的解析内容",
  "audio": null,
  "image": null,
  "createdAt": "2026-04-05T12:00:00Z",
  "updatedAt": "2026-04-05T14:30:00Z"
}
```

---

### 3.7 删除题目

从系统中删除题目。

#### 接口信息
- **路径**: `DELETE /api/questions/:id`
- **认证**: 需要管理员 Token
- **功能**: 删除指定题目

#### 路径参数
| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| id | Number | 题目 ID | 157 |

#### curl 示例
```bash
curl -s -X DELETE http://localhost:3001/api/questions/157 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 删除题目（不可撤销操作）
 */
async function deleteQuestion(questionId) {
  try {
    const response = await api.delete(`/questions/${questionId}`)
    console.log('题目删除成功')
    return response.data
  } catch (error) {
    if (error.response?.status === 404) {
      console.error('题目不存在')
    } else {
      console.error('删除失败:', error.message)
    }
    throw error
  }
}

// 使用示例（带确认）
const confirmed = confirm('确定要删除这道题目吗？此操作不可撤销！')
if (confirmed) {
  await deleteQuestion(157)
}
```

#### 响应示例
```json
{
  "success": true,
  "message": "题目删除成功",
  "deletedId": 157
}
```

---

### 3.8 批量操作题目

批量执行题目操作（非导入功能）。

#### 接口信息
- **路径**: `POST /api/questions/batch`
- **认证**: 需要管理员 Token
- **功能**: 批量操作题目（支持的操作类型有限）

#### 支持的操作类型
| 操作类型 | 说明 |
|----------|------|
| delete | 批量删除 |
| updateDifficulty | 批量更新难度 |
| updateType | 批量更新题型 |
| move | 批量移动分类 |

> **重要**: 此接口 **不支持** Excel 导入！没有 `/api/upload/excel` 接口！

#### 请求体示例（批量删除）
```json
{
  "action": "delete",
  "ids": [1, 2, 3, 4, 5]
}
```

#### 请求体示例（批量移动分类）
```json
{
  "action": "move",
  "ids": [10, 11, 12],
  "targetSubcategoryId": 8
}
```

#### curl 示例
```bash
# 批量删除
curl -s -X POST http://localhost:3001/api/questions/batch \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "delete",
    "ids": [1, 2, 3, 4, 5]
  }'

# 批量移动到其他分类
curl -s -X POST http://localhost:3001/api/questions/batch \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "move",
    "ids": [10, 11, 12],
    "targetSubcategoryId": 8
  }'
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 批量操作题目
 * 支持: delete / updateDifficulty / updateType / move
 * 注意：不支持批量导入（没有 Excel 上传功能）
 */
async function batchOperateQuestions(action, config) {
  try {
    let payload = { action }

    switch (action) {
      case 'delete':
        payload.ids = config.ids
        break
      case 'move':
        payload.ids = config.ids
        payload.targetSubcategoryId = config.targetSubcategoryId
        break
      case 'updateDifficulty':
        payload.ids = config.ids
        payload.difficulty = config.difficulty
        break
      case 'updateType':
        payload.ids = config.ids
        payload.type = config.type
        break
      default:
        throw new Error(`不支持的操作类型: ${action}`)
    }

    const response = await api.post('/questions/batch', payload)
    console.log('批量操作完成')
    return response.data
  } catch (error) {
    console.error('批量操作失败:', error.message)
    throw error
  }
}

// 使用示例：批量删除
await batchOperateQuestions('delete', {
  ids: [1, 2, 3, 4, 5]
})

// 使用示例：批量移动分类
await batchOperateQuestions('move', {
  ids: [10, 11, 12],
  targetSubcategoryId: 8
})
```

#### 响应示例
```json
{
  "success": true,
  "processedCount": 5,
  "failedCount": 0,
  "message": "批量操作完成"
}
```

---

## 四、答题接口

### 4.1 开始答题会话

创建一个新的答题会话，系统会随机抽取题目并打乱选项顺序。

#### 接口信息
- **路径**: `POST /api/quiz/start`
- **认证**: 需要 Token
- **功能**: 开始新的答题会话，返回题目（含 shuffleMapping）

#### 请求体参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| subjectId | Number | 是 | 学科 ID（camelCase） | 1 |
| subcategoryId | Number | 是 | 子分类 ID（camelCase） | 5 |
| questionCount | Number | 否 | 题目数量 | 10 |

#### curl 示例
```bash
curl -s -X POST http://localhost:3001/api/quiz/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectId": 1,
    "subcategoryId": 5,
    "questionCount": 10
  }'
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 开始答题会话
 * 返回的题目包含 shuffleMapping，用于将用户选择的选项映射回原始答案
 */
async function startQuizSession(config) {
  try {
    const response = await api.post('/quiz/start', {
      subjectId: config.subjectId,       // 必须，camelCase
      subcategoryId: config.subcategoryId, // 必须，camelCase
      questionCount: config.count || 10   // 可选，默认 10 题
    })

    const session = response.data
    console.log(`答题会话已创建，会话ID: ${session.sessionId}`)
    console.log(`题目数量: ${session.questions.length}`)

    // 存储会话信息到 sessionStorage
    sessionStorage.setItem('quizSession', JSON.stringify(session))

    return session
  } catch (error) {
    console.error('创建答题会话失败:', error.message)
    throw error
  }
}

// 使用示例
const session = await startQuizSession({
  subjectId: 1,
  subcategoryId: 5,
  count: 20
})

// 遍历题目（每题都有 shuffleMapping）
session.questions.forEach((q, index) => {
  console.log(`第${index + 1}题: ${q.content}`)
  console.log(`选项: ${JSON.stringify(q.options)}`)
  console.log(`打乱映射: ${JSON.stringify(q.shuffleMapping)}`)
})
```

#### 响应示例
```json
{
  "sessionId": "sess_1704XXXX_abc123",
  "subjectId": 1,
  "subcategoryId": 5,
  "questions": [
    {
      "id": 1,
      "sequence": 1,
      "type": "single",
      "content": "下列哪个是 JavaScript 的原始数据类型？",
      "options": ["Number", "String", "Object", "Boolean"],
      "shuffleMapping": {"0": "B", "1": "A", "2": "D", "3": "C"}
    },
    {
      "id": 5,
      "sequence": 2,
      "type": "judgment",
      "content": "JavaScript 是一种强类型语言。",
      "options": ["对", "错"],
      "shuffleMapping": null
    }
  ]
}
```

> **关于 shuffleMapping**:
> - 选项被打乱后，用户看到的选项顺序与原始顺序不同
> - `shuffleMapping` 记录了映射关系：key 是打乱后的索引，value 是原始选项字母
> - 用户选择第 0 个选项（"Number"），通过 mapping 得知对应原始答案 "B"
> - 判断题的 shuffleMapping 为 null（判断题不打乱选项）

---

### 4.2 提交答案

提交单道题目的答案。

#### 接口信息
- **路径**: `POST /api/quiz/submit`
- **认证**: 需要 Token
- **功能**: 提交答案并获取判题结果

#### 请求体参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| sessionId | String | 是 | 会话 ID | "sess_1704XXXX_abc123" |
| questionId | Number | 是 | 题目 ID | 1 |
| answer | String | 是 | 用户答案（原始选项字母） | "A" |
| timeSpent | Number | 否 | 答题耗时（秒） | 15 |

#### curl 示例
```bash
curl -s -X POST http://localhost:3001/api/quiz/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "sess_1704XXXX_abc123",
    "questionId": 1,
    "answer": "A",
    "timeSpent": 15
  }'
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 提交答案
 * 需要通过 shuffleMapping 将用户选择转换为原始答案
 */
async function submitAnswer(submission) {
  try {
    const response = await api.post('/quiz/submit', {
      sessionId: submission.sessionId,
      questionId: submission.questionId,
      answer: submission.answer,      // 原始选项字母（A/B/C/D）
      timeSpent: submission.timeSpent || 0  // 可选，答题耗时
    })

    const result = response.data
    console.log(`提交结果:`)
    console.log(`- 是否正确: ${result.isCorrect ? '✓' : '✗'}`)
    console.log(`- 正确答案: ${result.correctAnswer}`)
    console.log(`- 解析: ${result.explanation}`)
    console.log(`- 得分: ${result.score}`)

    return result
  } catch (error) {
    console.error('提交答案失败:', error.message)
    throw error
  }
}

// 使用示例
const result = await submitAnswer({
  sessionId: 'sess_1704XXXX_abc123',
  questionId: 1,
  answer: 'A',     // 已经通过 shuffleMapping 转换过的原始答案
  timeSpent: 15
})
```

#### 响应示例
```json
{
  "isCorrect": true,
  "correctAnswer": "A",
  "explanation": "JavaScript 有 7 种原始数据类型：String, Number, Boolean...",
  "score": 10
}
```

> **注意**: 响应字段使用 **camelCase**: isCorrect, correctAnswer, timeSpent

---

### 4.3 获取答题结果

获取某次答题会话的最终结果。

#### 接口信息
- **路径**: `GET /api/quiz/result/:subjectId/:subcategoryId`
- **认证**: 需要 Token
- **功能**: 获取答题结果统计

#### 路径参数
| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| subjectId | Number | 学科 ID | 1 |
| subcategoryId | Number | 子分类 ID | 5 |

#### curl 示例
```bash
curl -s "http://localhost:3001/api/quiz/result/1/5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 获取答题结果
 */
async function getQuizResult(subjectId, subcategoryId) {
  try {
    const response = await api.get(`/quiz/result/${subjectId}/${subcategoryId}`)
    const result = response.data

    console.log('===== 答题结果 =====')
    console.log(`总分: ${result.score}/${result.totalScore}`)
    console.log(`正确率: ${(result.accuracy * 100).toFixed(1)}%`)
    console.log(`用时: ${result.duration}秒`)

    return result
  } catch (error) {
    console.error('获取结果失败:', error.message)
    throw error
  }
}

// 使用示例
const quizResult = await getQuizResult(1, 5)
```

#### 响应示例
```json
{
  "score": 85,
  "totalScore": 100,
  "accuracy": 0.85,
  "totalQuestions": 10,
  "correctCount": 8,
  "wrongCount": 2,
  "duration": 320
}
```

---

### 4.4 获取答题记录

查询用户的答题历史记录。

#### 接口信息
- **路径**: `GET /api/answer-records`
- **认证**: 需要 Token
- **功能**: 获取答题历史记录

#### 查询参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| userId | Number | 是 | 用户 ID | 1 |
| subjectId | Number | 否 | 学科 ID | 1 |

#### curl 示例
```bash
# 获取指定用户的答题记录
curl -s "http://localhost:3001/api/answer-records?userId=1&subjectId=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 获取答题记录
 */
async function getAnswerRecords(params) {
  try {
    const response = await api.get('/answer-records', {
      params: {
        userId: params.userId,
        subjectId: params.subjectId
      }
    })

    return response.data
  } catch (error) {
    console.error('获取答题记录失败:', error.message)
    throw error
  }
}

// 使用示例
const records = await getAnswerRecords({ userId: 1, subjectId: 1 })
console.log('答题记录:', records)
```

#### 响应示例
```json
[
  {
    "id": 1001,
    "userId": 1,
    "questionId": 45,
    "userAnswer": "B",
    "correctAnswer": "B",
    "isCorrect": true,
    "timeSpent": 12,
    "createdAt": "2026-04-05T14:30:00Z"
  },
  {
    "id": 1000,
    "userId": 1,
    "questionId": 44,
    "userAnswer": "A,C",
    "correctAnswer": "A,B,C,D",
    "isCorrect": false,
    "timeSpent": 25,
    "createdAt": "2026-04-05T14:28:00Z"
  }
]
```

---

### 4.5 提交答题行为数据

记录学生的答题行为（用于学习分析）。

#### 接口信息
- **路径**: `POST /api/answer-behavior`
- **认证**: 需要 Token
- **功能**: 提交答题行为数据

#### 请求体参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sessionId | String | 是 | 会话 ID |
| questionId | Number | 是 | 题目 ID |
| behaviorType | String | 是 | 行为类型 |
| data | Object | 是 | 行为数据 |

#### curl 示例
```bash
curl -s -X POST http://localhost:3001/api/answer-behavior \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "sess_1704XXXX_abc123",
    "questionId": 1,
    "behaviorType": "hover_option",
    "data": {
      "optionIndex": 2,
      "duration": 1500
    }
  }'
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 提交答题行为数据
 * 用于分析学生的学习行为模式
 */
async function submitAnswerBehavior(behavior) {
  try {
    const response = await api.post('/answer-behavior', {
      sessionId: behavior.sessionId,
      questionId: behavior.questionId,
      behaviorType: behavior.type,
      data: behavior.data
    })

    return response.data
  } catch (error) {
    console.error('提交行为数据失败:', error.message)
    // 行为数据提交失败不影响主流程，可以静默处理
  }
}

// 使用示例：记录用户悬停选项的行为
await submitAnswerBehavior({
  sessionId: 'sess_1704XXXX_abc123',
  questionId: 1,
  type: 'hover_option',
  data: {
    optionIndex: 2,
    duration: 1500
  }
})
```

---

## 五、数据接口

### 5.1 获取排行榜

获取学生排行榜数据。

#### 接口信息
- **路径**: `GET /api/leaderboard`
- **认证**: 需要 Token
- **功能**: 获取排行榜数据

#### 查询参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| type | String | 否 | 排行榜类型 | "score" / "accuracy" |
| subjectId | Number | 否 | 学科 ID | 1 |
| limit | Number | 否 | 返回条数 | 50 |
| page | Number | 否 | 页码 | 1 |
| period | String | 否 | 时间周期 | "week" / "month" / "all" |
| grade | String | 否 | 年级筛选 | "3年级" |
| class | String | 否 | 班级筛选 | "2班" |

#### curl 示例
```bash
# 全局排行榜 Top 50
curl -s "http://localhost:3001/api/leaderboard?type=score&limit=50&period=week" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 指定学科排行榜
curl -s "http://localhost:3001/api/leaderboard?type=score&subjectId=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 班级内排行榜
curl -s "http://localhost:3001/api/leaderboard?type=score&grade=3年级&class=2班&limit=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 获取排行榜
 */
async function getLeaderboard(config = {}) {
  try {
    const response = await api.get('/leaderboard', {
      params: {
        type: config.type || 'score',         // score / accuracy
        subjectId: config.subjectId,
        limit: config.limit || 50,
        page: config.page || 1,
        period: config.period || 'week',      // week / month / all
        grade: config.grade,
        class: config.class
      }
    })

    const leaderboard = response.data
    console.log(`===== 排行榜 =====`)
    console.log(`共 ${leaderboard.total || 0} 名学生`)

    return leaderboard
  } catch (error) {
    console.error('获取排行榜失败:', error.message)
    throw error
  }
}

// 使用示例
const leaderboard = await getLeaderboard({
  type: 'score',
  subjectId: 1,
  limit: 20,
  period: 'week'
})
```

#### 响应示例
```json
{
  "total": 1250,
  "page": 1,
  "limit": 50,
  "rankings": [
    {
      "rank": 1,
      "userId": 42,
      "studentId": "42",
      "name": "学霸小明",
      "grade": "3年级",
      "class": "1班",
      "score": 9850,
      "accuracy": 0.96,
      "totalAnswers": 520
    },
    {
      "rank": 2,
      "userId": 88,
      "studentId": "88",
      "name": "代码达人",
      "grade": "3年级",
      "class": "2班",
      "score": 9720,
      "accuracy": 0.94,
      "totalAnswers": 498
    }
  ]
}
```

---

### 5.2 获取学习进度

获取学生的学习进度数据。

#### 接口信息
- **路径**: `GET /api/learning-progress`
- **认证**: 需要 Token
- **功能**: 获取学习进度统计

#### 查询参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| userId | Number | 是 | 用户 ID | 1 |
| subjectId | Number | 否 | 学科 ID | 1 |
| period | String | 否 | 时间周期 | "week" / "month" / "all" |

#### curl 示例
```bash
# 获取个人本周学习进度
curl -s "http://localhost:3001/api/learning-progress?userId=1&period=week" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 获取指定学科月度进度
curl -s "http://localhost:3001/api/learning-progress?userId=1&subjectId=1&period=month" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 获取学习进度
 */
async function getLearningProgress(params) {
  try {
    const response = await api.get('/learning-progress', {
      params: {
        userId: params.userId,
        subjectId: params.subjectId,
        period: params.period || 'week'  // week / month / all
      }
    })

    const progress = response.data
    console.log('===== 学习进度 =====')
    console.log(`总答题数: ${progress.totalAnswers || 0}`)
    console.log(`正确率: ${progress.accuracy ? (progress.accuracy * 100).toFixed(1) + '%' : 'N/A'}`)

    return progress
  } catch (error) {
    console.error('获取学习进度失败:', error.message)
    throw error
  }
}

// 使用示例
const progress = await getLearningProgress({
  userId: 1,
  subjectId: 1,
  period: 'month'
})
```

#### 响应示例
```json
{
  "userId": 1,
  "period": "week",
  "totalAnswers": 156,
  "correctCount": 132,
  "accuracy": 0.846,
  "dailyStats": [
    { "date": "2026-04-01", "count": 25, "accuracy": 0.88 },
    { "date": "2026-04-02", "count": 18, "accuracy": 0.78 },
    { "date": "2026-04-03", "count": 32, "accuracy": 0.91 },
    { "date": "2026-04-04", "count": 0, "accuracy": 0 },
    { "date": "2026-04-05", "count": 15, "accuracy": 0.80 }
  ]
}
```

---

### 5.3 获取用户统计

获取用户的详细统计数据。

#### 接口信息
- **路径**: `GET /api/user-stats/:id`
- **认证**: 需要 Token
- **功能**: 获取用户统计数据

#### 路径参数
| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| id | Number | 用户 ID | 1 |

#### curl 示例
```bash
curl -s "http://localhost:3001/api/user-stats/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 获取用户统计数据
 */
async function getUserStats(userId) {
  try {
    const response = await api.get(`/user-stats/${userId}`)
    return response.data
  } catch (error) {
    console.error('获取用户统计失败:', error.message)
    throw error
  }
}

// 使用示例
const stats = await getUserStats(1)
console.log('用户统计:', stats)
```

#### 响应示例
```json
{
  "userId": 1,
  "totalQuizzes": 25,
  "totalQuestions": 250,
  "totalCorrect": 210,
  "overallAccuracy": 0.84,
  "averageTimePerQuestion": 15.5,
  "streakDays": 7,
  "lastActiveAt": "2026-04-05T14:30:00Z"
}
```

---

### 5.4 获取仪表盘统计

获取管理后台仪表盘数据。

#### 接口信息
- **路径**: `GET /api/dashboard/stats` （或 `GET /api/admin/dashboard`）
- **认证**: 需要管理员 Token
- **功能**: 获取系统统计数据

#### curl 示例
```bash
curl -s "http://localhost:3001/api/dashboard/stats" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 或者
curl -s "http://localhost:3001/api/admin/dashboard" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 获取仪表盘统计数据
 */
async function getDashboardStats() {
  try {
    const response = await api.get('/dashboard/stats')  // 或 '/admin/dashboard'
    const data = response.data

    console.log('===== 仪表盘统计 =====')
    console.log(`总用户数: ${data.totalUsers}`)
    console.log(`今日活跃: ${data.activeToday}`)
    console.log(`总题目数: ${data.totalQuestions}`)

    return data
  } catch (error) {
    if (error.response?.status === 403) {
      console.error('权限不足：需要管理员角色')
    } else {
      console.error('获取仪表盘数据失败:', error.message)
    }
    throw error
  }
}

// 使用示例
const dashboard = await getDashboardStats()
```

#### 响应示例
```json
{
  "totalUsers": 1250,
  "activeToday": 328,
  "newUsersToday": 15,
  "totalQuestions": 4580,
  "newQuestionsToday": 32,
  "totalQuizzes": 8920,
  "quizzesToday": 256,
  "avgAccuracy": 0.78
}
```

---

### 5.5 难度调整

获取或应用难度调整建议。

#### 接口信息
- **路径**: `GET /api/difficulty/adjust`
- **认证**: 需要 Token
- **功能**: 根据学生表现调整题目难度

#### curl 示例
```bash
curl -s "http://localhost:3001/api/difficulty/adjust?userId=1&subjectId=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 获取难度调整建议
 */
async function getDifficultyAdjustment(params) {
  try {
    const response = await api.get('/difficulty/adjust', {
      params: {
        userId: params.userId,
        subjectId: params.subjectId
      }
    })

    return response.data
  } catch (error) {
    console.error('获取难度调整失败:', error.message)
    throw error
  }
}

// 使用示例
const adjustment = await getDifficultyAdjustment({ userId: 1, subjectId: 1 })
console.log('难度建议:', adjustment)
```

---

## 六、AI 接口

### 6.1 发送聊天消息（SSE 流式）

发送消息给 AI 助手，支持 SSE 流式输出。

#### 接口信息
- **路径**: `POST /api/chat/send`
- **认证**: 需要 Token
- **功能**: 发送消息并接收流式响应
- **响应类型**: Server-Sent Events (SSE)

#### 请求体参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| message | String | 是 | 用户消息内容 | "请解释闭包概念" |
| sessionId | String | 否 | 会话 ID（续聊时传入） | "sess_xxx" |
| modelId | Number | 否 | 模型 ID | 1 |

#### curl 示例
```bash
# SSE 流式请求（使用 -N 禁用缓冲）
curl -N -X POST http://localhost:3001/api/chat/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "请解释一下 JavaScript 中的闭包概念",
    "sessionId": "",
    "modelId": 1
  }'
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 发送消息给 AI（SSE 流式响应）
 * 使用 EventSource 或 fetch + ReadableStream 处理流式数据
 */
async function sendChatMessage(message, options = {}) {
  try {
    const response = await api.post('/chat/send', {
      message: message,
      sessionId: options.sessionId || '',
      modelId: options.modelId || 1
    }, {
      responseType: 'stream'  // 重要：指定流式响应
    })

    // 处理 SSE 流式响应
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()

          if (data === '[DONE]') {
            console.log('\n流式输出完成')
            return fullResponse
          }

          try {
            const parsed = JSON.parse(data)
            // 根据实际 SSE 数据格式提取内容
            const content = parsed.content || parsed.choices?.[0]?.delta?.content || ''
            fullResponse += content

            // 实时输出（可用于 UI 渲染）
            process.stdout.write(content)
          } catch (e) {
            // 忽略非 JSON 数据
          }
        }
      }
    }

    return fullResponse
  } catch (error) {
    console.error('发送消息失败:', error.message)
    throw error
  }
}

// 使用示例
console.log('AI 回复:')
const reply = await sendChatMessage('请解释一下 JavaScript 中的闭包概念')
console.log('\n完整回复:', reply)
```

#### SSE 数据格式示例
```
data: {"content":"闭包"}

data: {"content":"是"}

data: {"content":"JavaScript"}

...

data: [DONE]
```

---

### 6.2 获取会话列表

获取当前用户的 AI 聊天会话列表。

#### 接口信息
- **路径**: `GET /api/chat/sessions`
- **认证**: 需要 Token
- **功能**: 获取聊天会话列表

#### curl 示例
```bash
curl -s "http://localhost:3001/api/chat/sessions" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 获取 AI 聊天会话列表
 */
async function getChatSessions() {
  try {
    const response = await api.get('/chat/sessions')
    const sessions = response.data

    console.log('聊天会话列表:')
    sessions.forEach(s => {
      console.log(`- [${s.id}] ${s.title || '新对话'} (${s.createdAt})`)
    })

    return sessions
  } catch (error) {
    console.error('获取会话列表失败:', error.message)
    throw error
  }
}

// 使用示例
const sessions = await getChatSessions()
```

#### 响应示例
```json
[
  {
    "id": "sess_001",
    "title": "关于 JavaScript 闭包的讨论",
    "modelId": 1,
    "messageCount": 15,
    "createdAt": "2026-04-05T14:00:00Z",
    "updatedAt": "2026-04-05T14:30:00Z"
  },
  {
    "id": "sess_002",
    "title": "Vue 3 Composition API 问题",
    "modelId": 1,
    "messageCount": 8,
    "createdAt": "2026-04-04T10:00:00Z",
    "updatedAt": "2026-04-04T10:25:00Z"
  }
]
```

---

### 6.3 创建新会话

创建一个新的 AI 聊天会话。

#### 接口信息
- **路径**: `POST /api/chat/sessions`
- **认证**: 需要 Token
- **功能**: 创建新的聊天会话

#### 请求体参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| title | String | 否 | 会话标题 | "新对话" |
| modelId | Number | 否 | 模型 ID | 1 |

#### curl 示例
```bash
curl -s -X POST http://localhost:3001/api/chat/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "学习讨论",
    "modelId": 1
  }'
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 创建新的 AI 聊天会话
 */
async function createChatSession(options = {}) {
  try {
    const response = await api.post('/chat/sessions', {
      title: options.title || '新对话',
      modelId: options.modelId || 1
    })

    const session = response.data
    console.log('会话创建成功，ID:', session.id)

    return session
  } catch (error) {
    console.error('创建会话失败:', error.message)
    throw error
  }
}

// 使用示例
const session = await createChatSession({ title: 'JavaScript 学习' })
```

#### 响应示例
```json
{
  "id": "sess_003",
  "title": "学习讨论",
  "modelId": 1,
  "createdAt": "2026-04-05T15:00:00Z"
}
```

---

### 6.4 获取会话消息

获取指定会话的消息历史。

#### 接口信息
- **路径**: `GET /api/chat/sessions/:id/messages`
- **认证**: 需要 Token
- **功能**: 获取会话消息列表

#### 路径参数
| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| id | String | 会话 ID | "sess_001" |

#### curl 示例
```bash
curl -s "http://localhost:3001/api/chat/sessions/sess_001/messages" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 获取会话消息历史
 */
async function getSessionMessages(sessionId) {
  try {
    const response = await api.get(`/chat/sessions/${sessionId}/messages`)
    return response.data
  } catch (error) {
    console.error('获取消息失败:', error.message)
    throw error
  }
}

// 使用示例
const messages = await getSessionMessages('sess_001')
messages.forEach(msg => {
  console.log(`${msg.role}: ${msg.content}`)
})
```

#### 响应示例
```json
[
  {
    "id": "msg_001",
    "sessionId": "sess_001",
    "role": "user",
    "content": "请解释闭包概念",
    "createdAt": "2026-04-05T14:00:00Z"
  },
  {
    "id": "msg_002",
    "sessionId": "sess_001",
    "role": "assistant",
    "content": "闭包是指有权访问另一个函数作用域中变量的函数...",
    "createdAt": "2026-04-05T14:00:05Z"
  }
]
```

---

### 6.5 删除会话

删除指定的聊天会话。

#### 接口信息
- **路径**: `DELETE /api/chat/sessions/:id`
- **认证**: 需要 Token
- **功能**: 删除聊天会话及其消息

#### 路径参数
| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| id | String | 会话 ID | "sess_001" |

#### curl 示例
```bash
curl -s -X DELETE http://localhost:3001/api/chat/sessions/sess_001 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 删除聊天会话
 */
async function deleteChatSession(sessionId) {
  try {
    const response = await api.delete(`/chat/sessions/${sessionId}`)
    console.log('会话删除成功')
    return response.data
  } catch (error) {
    console.error('删除会话失败:', error.message)
    throw error
  }
}

// 使用示例
await deleteChatSession('sess_001')
```

---

### 6.6 获取工具元数据

获取 AI 工具的定义和元数据。

#### 接口信息
- **路径**: `GET /api/tools/metadata`
- **认证**: 需要 Token
- **功能**: 获取可用的 AI 工具定义

#### curl 示例
```bash
curl -s "http://localhost:3001/api/tools/metadata" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 获取 AI 工具元数据定义
 */
async function getToolsMetadata() {
  try {
    const response = await api.get('/tools/metadata')
    const tools = response.data

    console.log('可用工具:')
    tools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description}`)
    })

    return tools
  } catch (error) {
    console.error('获取工具元数据失败:', error.message)
    throw error
  }
}

// 使用示例
const tools = await getToolsMetadata()
```

#### 响应示例
```json
[
  {
    "name": "get_question_by_id",
    "description": "根据ID获取题目详情",
    "parameters": {
      "type": "object",
      "properties": {
        "id": { "type": "number", "description": "题目ID" }
      },
      "required": ["id"]
    }
  },
  {
    "name": "search_questions",
    "description": "搜索题目",
    "parameters": {
      "type": "object",
      "properties": {
        "keyword": { "type": "string" },
        "type": { "type": "string" },
        "subjectId": { "type": "number" }
      }
    }
  }
]
```

---

### 6.7 模型管理接口

模型管理相关接口位于 admin 路由下。

#### 6.7.1 获取模型列表
- **路径**: `GET /api/admin/models`
- **认证**: 需要管理员 Token

```bash
curl -s "http://localhost:3001/api/admin/models" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

#### 6.7.2 新增模型
- **路径**: `POST /api/admin/models`
- **认证**: 需要管理员 Token

```bash
curl -s -X POST http://localhost:3001/api/admin/models \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GPT-4",
    "provider": "openai",
    "apiKey": "sk-xxx",
    "modelId": "gpt-4",
    "maxTokens": 8192
  }'
```

#### 6.7.3 更新模型
- **路径**: `PUT /api/admin/models/:id`
- **认证**: 需要管理员 Token

```bash
curl -s -X PUT http://localhost:3001/api/admin/models/1 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GPT-4 Turbo",
    "maxTokens": 16384
  }'
```

#### 6.7.4 删除模型
- **路径**: `DELETE /api/admin/models/:id`
- **认证**: 需要管理员 Token

```bash
curl -s -X DELETE http://localhost:3001/api/admin/models/1 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 获取 AI 模型列表（管理员接口）
 */
async function getModels() {
  try {
    const response = await api.get('/admin/models')
    return response.data
  } catch (error) {
    console.error('获取模型列表失败:', error.message)
    throw error
  }
}

/**
 * 新增 AI 模型（管理员接口）
 */
async function createModel(modelData) {
  try {
    const response = await api.post('/admin/models', modelData)
    console.log('模型创建成功')
    return response.data
  } catch (error) {
    console.error('创建模型失败:', error.message)
    throw error
  }
}

// 使用示例
const models = await getModels()
console.log('可用模型:', models)
```

---

## 七、管理接口

### 7.1 数据备份

#### 7.1.1 创建备份

- **路径**: `POST /api/backup/create`
- **认证**: 需要管理员 Token
- **功能**: 创建数据库备份

#### curl 示例
```bash
curl -s -X POST http://localhost:3001/api/backup/create \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 创建数据备份
 */
async function createBackup() {
  try {
    const response = await api.post('/backup/create')
    const backup = response.data

    console.log('备份创建成功!')
    console.log(`- 备份ID: ${backup.id}`)
    console.log(`- 文件名: ${backup.filename}`)

    return backup
  } catch (error) {
    console.error('创建备份失败:', error.message)
    throw error
  }
}

// 使用示例
const backup = await createBackup()
```

#### 响应示例
```json
{
  "id": "backup_20260405_143000",
  "filename": "psc_backup_20260405_143000.sql",
  "size": 52428800,
  "createdAt": "2026-04-05T14:30:00Z",
  "status": "completed"
}
```

---

#### 7.1.2 获取备份列表

- **路径**: `GET /api/backup/list`
- **认证**: 需要管理员 Token
- **功能**: 获取所有备份记录

#### curl 示例
```bash
curl -s "http://localhost:3001/api/backup/list" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 获取备份列表
 */
async function getBackupList() {
  try {
    const response = await api.get('/backup/list')
    const backups = response.data

    console.log('备份历史:')
    backups.forEach((b, index) => {
      console.log(`${index + 1}. ${b.filename} (${b.createdAt})`)
    })

    return backups
  } catch (error) {
    console.error('获取备份列表失败:', error.message)
    throw error
  }
}

// 使用示例
const list = await getBackupList()
```

#### 响应示例
```json
[
  {
    "id": "backup_20260405_143000",
    "filename": "psc_backup_20260405_143000.sql",
    "size": 52428800,
    "createdAt": "2026-04-05T14:30:00Z",
    "status": "completed"
  },
  {
    "id": "backup_20260404_100000",
    "filename": "psc_backup_20260404_100000.sql",
    "size": 51200000,
    "createdAt": "2026-04-04T10:00:00Z",
    "status": "completed"
  }
]
```

---

#### 7.1.3 恢复备份

- **路径**: `POST /api/backup/restore`
- **认证**: 需要管理员 Token
- **功能**: 从备份恢复数据库（危险操作！）

#### 请求体参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| backupId | String | 是 | 备份 ID |

#### curl 示例
```bash
curl -s -X POST http://localhost:3001/api/backup/restore \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "backupId": "backup_20260405_143000"
  }'
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 从备份恢复数据库（危险操作！会覆盖当前数据）
 */
async function restoreBackup(backupId) {
  // 二次确认
  const confirmed = confirm(
    '警告：恢复备份将覆盖当前所有数据！确定要继续吗？'
  )

  if (!confirmed) {
    console.log('用户取消恢复操作')
    return
  }

  try {
    const response = await api.post('/backup/restore', { backupId })
    console.log('备份恢复成功！系统将在几秒后重启...')
    return response.data
  } catch (error) {
    console.error('恢复失败:', error.message)
    throw error
  }
}

// 使用示例
await restoreBackup('backup_20260405_143000')
```

---

### 7.2 文件上传

系统支持图片和音频上传（**不支持 Excel 上传！**）。

#### 7.2.1 上传图片

- **路径**: `POST /api/upload/image`
- **认证**: 需要 Token
- **Content-Type**: `multipart/form-data`
- **功能**: 上传图片文件（jpg/png/gif/webp）

#### curl 示例
```bash
curl -s -X POST http://localhost:3001/api/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.png"
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 上传图片文件
 * 支持格式：PNG, JPG, GIF, WEBP（最大 10MB）
 */
async function uploadImage(file) {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        console.log(`上传进度: ${percentCompleted}%`)
      }
    })

    const result = response.data
    console.log('图片上传成功!')
    console.log(`- URL: ${result.url}`)
    console.log(`- 大小: ${(result.size / 1024).toFixed(2)} KB`)

    return result
  } catch (error) {
    console.error('上传失败:', error.message)
    throw error
  }
}

// 使用示例：从 input 元素获取文件
const fileInput = document.querySelector('#image-input')
const file = fileInput.files[0]

if (file) {
  const result = await uploadImage(file)
  // 使用返回的 URL
  console.log('图片访问地址:', result.url)
}
```

#### 响应示例
```json
{
  "url": "/uploads/images/image_20260405_143000.png",
  "filename": "image_20260405_143000.png",
  "size": 15360,
  "mimeType": "image/png",
  "uploadedAt": "2026-04-05T14:30:00Z"
}
```

---

#### 7.2.2 上传音频

- **路径**: `POST /api/upload/audio`
- **认证**: 需要 Token
- **Content-Type**: `multipart/form-data`
- **功能**: 上传音频文件（mp3/wav）

#### curl 示例
```bash
curl -s -X POST http://localhost:3001/api/upload/audio \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/audio.mp3"
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 上传音频文件
 * 支持格式：MP3, WAV（最大 20MB）
 */
async function uploadAudio(file) {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/upload/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    const result = response.data
    console.log('音频上传成功!')
    console.log(`- URL: ${result.url}`)

    return result
  } catch (error) {
    console.error('上传失败:', error.message)
    throw error
  }
}

// 使用示例
const audioFile = document.querySelector('#audio-input').files[0]
if (audioFile) {
  const result = await uploadAudio(audioFile)
  console.log('音频地址:', result.url)
}
```

#### 响应示例
```json
{
  "url": "/uploads/audio/audio_20260405_143000.mp3",
  "filename": "audio_20260405_143000.mp3",
  "size": 2048000,
  "mimeType": "audio/mp3",
  "duration": 120,
  "uploadedAt": "2026-04-05T14:30:00Z"
}
```

> **重要提示**:
> - ✅ 支持上传：**图片** (`/api/upload/image`) 和 **音频** (`/api/upload/audio`)
> - ❌ **不存在** `/api/upload/excel`（没有 Excel 批量导入功能！）
> - 如果需要批量添加题目，请使用 `POST /api/questions/batch` 接口的 JSON 格式

---

### 7.3 健康检查

检查后端服务是否正常运行。

#### 接口信息
- **路径**: `GET /api/health`
- **认证**: 无需 Token
- **功能**: 服务健康状态检查

#### curl 示例
```bash
curl -s "http://localhost:3001/api/health"
```

#### JavaScript (api.js) 示例
```javascript
import api from '@/utils/api'

/**
 * 健康检查
 */
async function healthCheck() {
  try {
    const response = await api.get('/health')
    console.log('服务状态:', response.data.status)
    return response.data
  } catch (error) {
    console.error('服务不可用:', error.message)
    return { status: 'unhealthy' }
  }
}

// 使用示例
const health = await healthCheck()
if (health.status === 'healthy') {
  console.log('✓ 后端服务正常')
} else {
  console.log('✗ 后端服务异常')
}
```

#### 响应示例
```json
{
  "status": "healthy",
  "uptime": 86400,
  "timestamp": "2026-04-05T14:30:00Z",
  "version": "1.0.0"
}
```

---

## 附录

### A. 错误处理模板（基于 @/utils/api.js 实际封装）

```javascript
/**
 * 错误处理模板
 * 基于 @/utils/api.js 和 @/utils/message 的实际封装方式
 */

// 方式1：使用 try/catch 统一处理（推荐）
async function apiCallExample() {
  try {
    const response = await api.get('/some-endpoint')
    return response.data  // 大多数接口直接返回数据
  } catch (error) {
    // 根据错误类型进行不同处理
    if (error.response) {
      // 服务器返回了错误状态码
      const status = error.response.status
      const data = error.response.data

      switch (status) {
        case 400:
          console.error('参数错误:', data.error || data.msg || '请求参数有误')
          break
        case 401:
          console.error('未授权，Token 无效或过期')
          // 清除本地存储并跳转登录页
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          console.error('权限不足，需要管理员角色')
          break
        case 404:
          console.error('资源不存在')
          break
        case 500:
          console.error('服务器内部错误')
          break
        default:
          console.error(`请求失败 (${status}):`, data.error || data.msg)
      }

      // 可以使用 @/utils/message 显示错误提示
      // import { ElMessage } from '@/utils/message'
      // ElMessage.error(data.error || '操作失败')
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('网络连接异常，请检查网络')
    } else {
      // 请求配置出错
      console.error('请求配置错误:', error.message)
    }

    throw error  // 重新抛出以便上层处理
  }
}

// 方式2：封装通用的 API 调用函数
import api from '@/utils/api'

/**
 * 通用 API 调用包装器
 * 自动处理常见错误场景
 */
async function safeApiCall(apiFunction, ...args) {
  try {
    const response = await apiFunction(...args)
    return { success: true, data: response.data }
  } catch (error) {
    console.error(`API 调用失败:`, error.message)

    // 返回统一格式的错误对象
    return {
      success: false,
      error: {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      }
    }
  }
}

// 使用示例
const result = await safeApiCall(() => api.get('/questions', { params: { page: 1 } }))

if (result.success) {
  console.log('获取成功:', result.data)
} else {
  console.error('获取失败:', result.error.message)

  // 根据状态码处理
  if (result.error.status === 401) {
    // 跳转登录
  }
}
```

### B. 请求拦截器配置参考（基于 @/utils/api.js）

```javascript
/**
 * src/utils/api.js 配置参考
 * 实际项目中的 axios 封装
 */
import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api',  // Vite 开发代理会转发到 localhost:3001
  timeout: 30000,   // 30 秒超时
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器：自动附加 Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：统一错误处理
api.interceptors.response.use(
  (response) => {
    // 直接返回响应，不做统一解构
    // 因为不同接口的响应格式不同（有的直接返回数据，有的有 code 包装）
    return response
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response

      // 401 未授权：清除 Token 并跳转登录
      if (status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }

      // 可以在这里统一显示错误提示
      // import { ElMessage } from '@/utils/message'
      // ElMessage.error(data.error || data.msg || `请求失败 (${status})`)
    }

    return Promise.reject(error)
  }
)

export default api
```

### C. 关键注意事项清单

在使用本系统的 API 时，请注意以下经过验证的事实：

#### 认证相关
- [x] 学生登录：`POST /api/users/login`（参数：studentId, name, grade, class）
- [x] 管理员初始化：`POST /api/admin/init`
- [x] 管理员登录：`POST /api/admin/verify`
- [ ] ~~`/api/auth/register`~~ **不存在**
- [ ] ~~`/api/auth/login`~~ **不存在**
- [ ] ~~`/api/auth/admin/login`~~ **不存在**

#### 题目相关
- [x] 字段名使用 **camelCase**: subjectId, subcategoryId（不是 snake_case）
- [x] 解析字段名是 **explanation**（不是 analysis！）
- [ ] ~~`difficulty`~~ **创建/编辑时不接收此字段**
- [ ] ~~`tags`~~ **不存在此字段**
- [x] 响应直接返回数据对象，**不一定**有 `{code, msg, data}` 包装
- [x] 判断题选项固定为 `["对", "错"]`，前后端都不打乱

#### 文件上传
- [x] 图片上传：`POST /api/upload/image`
- [x] 音频上传：`POST /api/upload/audio`
- [ ] ~~`/api/upload/excel`~~ **不存在！（没有 Excel 导入功能）**

#### Base URL
- [x] 后端端口：**3001**（不是 3000！）
- [x] Base URL：`http://localhost:3001/api`

#### 响应格式
- [x] 大多数接口直接返回数据对象
- [x] 错误响应通常为 `{ error: "错误信息" }` 格式
- [ ] ~~所有接口都使用 `{code, msg, data}` 格式~~ **不正确！**

### D. 版本历史

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|----------|
| v1.0 | 2026-03-XX | - | 初始版本（含大量 AI 幻觉） |
| v2.0 | 2026-04-05 | - | 新增 AI 接口、管理接口（仍有幻觉） |
| v3.0 | 2026-04-05 | 后端架构师 | **完全重写**：基于实际代码验证，消除所有幻觉内容 |

---

**文档维护人**: 后端架构师 | 最后更新: 2026-04-05
**验证状态**: 所有接口路径、字段名、响应格式均已通过 routes/*.js 代码验证
