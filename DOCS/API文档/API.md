# PSCG API 文档

## 文档信息

| 项目 | 内容 |
|------|------|
| **项目名称** | PSCG 智能题库系统 |
| **文档版本** | v2.2 |
| **更新日期** | 2026-03-28 |
| **API 版本** | v1 |

---

## 1. 概述

本文档详细描述了 PSCG 智能题库系统的所有 API 端点，包括请求方法、路径、参数、响应格式等信息。系统采用 RESTful API 设计风格，使用 JSON 格式进行数据交换。

---

## 2. 基础信息

### 2.1 API 基础路径
- 开发环境：`http://localhost:3001/api`
- 生产环境：`http://您的域名:3001/api`

### 2.2 响应格式

**成功响应**：
```json
{
  "success": true,
  "data": {...}
}
```

**错误响应**：
```json
{
  "error": "错误信息"
}
```

### 2.3 认证方式

| 类型 | 说明 |
|------|------|
| **JWT Token** | 用户登录后获取，用于用户相关操作 |
| **Admin Token** | 管理员登录后获取，用于后台管理操作 |
| **签名验证** | 答题提交时使用 HMAC-SHA256 签名 |

### 2.4 请求头

| 请求头 | 说明 | 示例 |
|--------|------|------|
| `Content-Type` | 请求体格式 | `application/json` |
| `Authorization` | JWT Token | `Bearer <token>` |
| `X-CSRF-Token` | CSRF 防护 Token | 从 `/api/csrf-token` 获取 |

---

## 3. 用户管理 API

### 3.1 用户登录
- **请求方法**：POST
- **API路径**：`/api/users/login`
- **功能**：用户登录，返回 JWT Token

**请求体**：
```json
{
  "studentId": "01",
  "name": "张三",
  "grade": "1",
  "class": "1"
}
```

**参数说明**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| studentId | string | 是 | 学号（2位数字） |
| name | string | 否 | 姓名（1-4个中文字符） |
| grade | string | 是 | 年级 |
| class | string | 是 | 班级 |

**响应**：
```json
{
  "userId": 1,
  "studentId": "01",
  "name": "张三",
  "grade": "1",
  "class": "1",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h"
}
```

---

### 3.2 获取用户列表
- **请求方法**：GET
- **API路径**：`/api/users`
- **功能**：获取用户列表，支持分页和统计

**查询参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| grade | string | 否 | 年级筛选 |
| class | string | 否 | 班级筛选 |
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 50，0 表示全部 |
| withStats | boolean | 否 | 是否包含统计数据，默认 false |

**响应**：
```json
[
  {
    "id": 1,
    "student_id": "01",
    "name": "张三",
    "grade": "1",
    "class": "1",
    "total_sessions": 10,
    "avg_accuracy": 85.5
  }
]
```

---

### 3.3 获取单个用户
- **请求方法**：GET
- **API路径**：`/api/users/:id`
- **功能**：获取单个用户信息

**响应**：
```json
{
  "id": 1,
  "student_id": "01",
  "name": "张三",
  "grade": "1",
  "class": "1",
  "points": 100
}
```

---

### 3.4 添加用户
- **请求方法**：POST
- **API路径**：`/api/users`
- **功能**：添加新用户

**请求体**：
```json
{
  "student_id": "01",
  "name": "张三",
  "grade": "1",
  "class": "1"
}
```

**响应**：
```json
{
  "id": 1,
  "student_id": "01",
  "name": "张三",
  "grade": "1",
  "class": "1"
}
```

---

### 3.5 批量添加用户
- **请求方法**：POST
- **API路径**：`/api/users/batch`
- **功能**：批量添加用户

**请求体**：
```json
[
  { "student_id": "01", "name": "张三", "grade": "1", "class": "1" },
  { "student_id": "02", "name": "李四", "grade": "1", "class": "1" }
]
```

**响应**：
```json
{
  "success": true,
  "message": "成功添加 2 个用户，失败 0 个"
}
```

---

### 3.6 更新用户
- **请求方法**：PUT
- **API路径**：`/api/users/:id`
- **功能**：更新用户信息

**请求体**：
```json
{
  "name": "张三",
  "grade": "2",
  "class": "1",
  "student_id": "01"
}
```

**响应**：
```json
{
  "success": true
}
```

---

### 3.7 删除用户
- **请求方法**：DELETE
- **API路径**：`/api/users/:id`
- **功能**：删除用户及其所有相关数据

**响应**：
```json
{
  "success": true
}
```

---

### 3.8 批量删除用户
- **请求方法**：POST
- **API路径**：`/api/users/batch-delete`
- **功能**：批量删除用户（单次最多100个）

**请求体**：
```json
{
  "userIds": [1, 2, 3]
}
```

**响应**：
```json
{
  "success": true,
  "message": "成功删除 3 个用户",
  "successCount": 3,
  "failCount": 0
}
```

---

### 3.9 获取用户统计
- **请求方法**：GET
- **API路径**：`/api/users/stats/:userId`
- **功能**：获取用户统计数据

**响应**：
```json
{
  "totalSessions": 10,
  "totalQuestions": 50,
  "totalCorrect": 45,
  "avgAccuracy": 90,
  "subjectStats": [
    {
      "subject_id": 1,
      "subject_name": "语文",
      "total_sessions": 5,
      "total_questions": 25,
      "correct_count": 20,
      "avg_accuracy": 80
    }
  ]
}
```

---

## 4. 答题流程 API

### 4.1 开始答题
- **请求方法**：POST
- **API路径**：`/api/quiz/start`
- **功能**：开始答题会话，获取题目

**请求体**：
```json
{
  "subjectId": 1,
  "subcategoryId": 1,
  "questionCount": 10,
  "studentId": "01",
  "grade": "1",
  "class": "1"
}
```

**参数说明**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| subjectId | number | 是 | 学科ID |
| subcategoryId | number/string | 是 | 题库ID，错题巩固传 `"error-collection"` |
| questionCount | number | 否 | 题目数量，默认10 |
| studentId | string | 是 | 学号 |
| grade | string | 是 | 年级 |
| class | string | 是 | 班级 |

**响应**：
```json
{
  "quizId": "uuid-string",
  "questions": [
    {
      "id": 1,
      "subject_id": 1,
      "subcategory_id": 1,
      "content": "题目内容",
      "type": "single",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "explanation": "解析",
      "audio_url": null,
      "image_url": null,
      "difficulty": 1
    }
  ],
  "expiresAt": "2026-03-25T12:00:00.000Z",
  "stats": {
    "1": { "correctCount": 0 }
  }
}
```

---

### 4.2 提交答案
- **请求方法**：POST
- **API路径**：`/api/quiz/submit`
- **功能**：提交答案并获取结果
- **安全**：需要签名验证，有请求限流

**请求体**：
```json
{
  "quizId": "uuid-string",
  "answers": {
    "1": "A",
    "2": "B"
  },
  "shuffleMappings": {
    "1": { "0": 2, "1": 0, "2": 3, "3": 1 }
  },
  "timestamp": 1711286400000,
  "signature": "signature-string",
  "timeSpent": 120
}
```

**参数说明**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| quizId | string | 是 | 答题会话ID |
| answers | object | 是 | 题目ID -> 用户答案映射 |
| shuffleMappings | object | 否 | 选项打乱映射 |
| timestamp | number | 是 | 时间戳（毫秒） |
| signature | string | 是 | HMAC-SHA256 签名 |
| timeSpent | number | 否 | 答题用时（秒） |

**响应**：
```json
{
  "score": 8,
  "correctCount": 8,
  "totalQuestions": 10,
  "points": 6,
  "results": [
    {
      "questionId": 1,
      "userAnswer": "A",
      "mappedUserAnswer": "B",
      "correctAnswer": "B",
      "isCorrect": true,
      "explanation": "解析内容",
      "content": "题目内容",
      "options": ["选项B", "选项A", "选项D", "选项C"],
      "type": "single",
      "audio_url": null,
      "image_url": null,
      "shuffleMapping": { "0": 2, "1": 0, "2": 3, "3": 1 }
    }
  ],
  "stats": {
    "1": { "correctCount": 1 }
  }
}
```

**积分规则**：
| 场景 | 积分 |
|------|------|
| 普通题库答对1题 | +1分 |
| 普通题库答错1题 | -1分 |
| 普通题库全对 | 积分翻倍 |
| 错题巩固累计正确3次 | +1分 |

---

### 4.3 获取历史答题记录
- **请求方法**：GET
- **API路径**：`/api/quiz/history`
- **功能**：获取用户历史答题记录

**查询参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| studentId | string | 是 | 学号 |
| grade | string | 是 | 年级 |
| class | string | 是 | 班级 |
| limit | number | 否 | 数量限制，默认20 |

**响应**：
```json
[
  {
    "id": 1,
    "subject_id": 1,
    "subcategory_id": 1,
    "total_questions": 10,
    "correct_count": 8,
    "time_spent": 120,
    "created_at": "2026-03-25T10:00:00.000Z",
    "subject_name": "语文",
    "subcategory_name": "基础知识"
  }
]
```

---

### 4.4 清理过期会话
- **请求方法**：POST
- **API路径**：`/api/quiz/cleanup`
- **功能**：清理过期的答题会话（定时任务调用）

**响应**：
```json
{
  "success": true,
  "deletedCount": 5
}
```

---

## 5. 错题巩固 API

### 5.1 获取错题巩固题库
- **请求方法**：GET
- **API路径**：`/api/error-collection/:subjectId`
- **功能**：获取用户在指定学科下的错题（累计正确次数小于3）

**查询参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| studentId | string | 是 | 学号 |
| grade | string | 是 | 年级 |
| class | string | 是 | 班级 |

**响应**：
```json
{
  "questions": [
    {
      "id": 1,
      "subject_id": 1,
      "subcategory_id": 1,
      "content": "题目内容",
      "type": "single",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "answer": "B",
      "explanation": "解析",
      "correct_count": 0,
      "subcategory_name": "基础知识"
    }
  ],
  "stats": {
    "1": { "correctCount": 0 }
  }
}
```

---

### 5.2 更新错题正确次数
- **请求方法**：POST
- **API路径**：`/api/error-collection/update`
- **功能**：更新错题的累计正确次数

**请求体**：
```json
{
  "studentId": "01",
  "grade": "1",
  "class": "1",
  "questionId": 1,
  "correctCount": 2
}
```

**响应**：
```json
{
  "success": true
}
```

---

### 5.3 重置错题正确次数
- **请求方法**：POST
- **API路径**：`/api/error-collection/reset`
- **功能**：重置错题的累计正确次数为0

**请求体**：
```json
{
  "studentId": "01",
  "grade": "1",
  "class": "1",
  "questionId": 1
}
```

**响应**：
```json
{
  "success": true
}
```

---

## 6. 数据管理 API

### 6.1 数据备份
- **请求方法**：POST
- **API路径**：`/api/data/backup`
- **功能**：备份所有数据到JSON文件

**响应**：
```json
{
  "success": true,
  "data": {
    "subjects": [...], 
    "subcategories": [...], 
    "questions": [...], 
    "users": [...], 
    "answer_records": [...], 
    "question_attempts": [...],
    "audioFiles": [...],
    "imageFiles": [...]
  }
}
```

### 6.2 数据恢复
- **请求方法**：POST
- **API路径**：`/api/data/restore`
- **功能**：从JSON文件恢复数据

**请求体**：
```json
{
  "data": {
    "subjects": [...], 
    "subcategories": [...], 
    "questions": [...], 
    "users": [...]
  }
}
```

**响应**：
```json
{
  "success": true,
  "message": "数据恢复成功"
}
```

### 6.3 数据导出
- **请求方法**：GET
- **API路径**：`/api/data/export`
- **功能**：导出所有数据为JSON文件

### 6.4 清空所有数据
- **请求方法**：POST
- **API路径**：`/api/data/clear-all`
- **功能**：清空所有数据

### 6.5 清空用户答题记录
- **请求方法**：POST
- **API路径**：`/api/data/clear-records`
- **功能**：清空用户答题记录

---

## 7. 设置 API

### 7.1 获取设置
- **请求方法**：GET
- **API路径**：`/api/settings`
- **功能**：获取系统设置

**响应**：
```json
{
  "randomizeAnswers": "true",
  "fixedQuestionCount": "false",
  "minQuestionCount": "3",
  "maxQuestionCount": "5",
  "fixedQuestionCountValue": "3"
}
```

### 7.2 更新设置
- **请求方法**：POST
- **API路径**：`/api/settings`
- **功能**：更新系统设置

---

## 8. 学科管理 API

### 8.1 获取所有学科
- **请求方法**：GET
- **API路径**：`/api/subjects`
- **功能**：获取所有学科及其子分类

**响应**：
```json
[
  {
    "id": 1,
    "name": "语文",
    "iconIndex": 0,
    "subcategories": [...]
  }
]
```

### 8.2 获取学科的子分类
- **请求方法**：GET
- **API路径**：`/api/subjects/:id/subcategories`

### 8.3 添加学科
- **请求方法**：POST
- **API路径**：`/api/subjects`

### 8.4 更新学科
- **请求方法**：PUT
- **API路径**：`/api/subjects/:id`

### 8.5 删除学科
- **请求方法**：DELETE
- **API路径**：`/api/subjects/:id`

---

## 9. 题库管理 API

### 9.1 添加题库
- **请求方法**：POST
- **API路径**：`/api/subcategories`

### 9.2 更新题库
- **请求方法**：PUT
- **API路径**：`/api/subcategories/:id`

### 9.3 删除题库
- **请求方法**：DELETE
- **API路径**：`/api/subcategories/:id`

---

## 10. 题目管理 API

### 10.1 获取题目列表
- **请求方法**：GET
- **API路径**：`/api/questions`
- **功能**：获取题目列表，支持分页和筛选

**查询参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| subjectId | number | 否 | 学科ID |
| subcategoryId | number | 否 | 题库ID |
| type | string | 否 | 题目类型 |
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |
| difficulty | number | 否 | 难度等级 |
| excludeContent | boolean | 否 | 是否排除内容字段 |
| keyword | string | 否 | 关键词搜索 |

### 10.2 添加题目
- **请求方法**：POST
- **API路径**：`/api/questions`

### 10.3 更新题目
- **请求方法**：PUT
- **API路径**：`/api/questions/:id`

### 10.4 删除题目
- **请求方法**：DELETE
- **API路径**：`/api/questions/:id`

### 10.5 批量导入题目
- **请求方法**：POST
- **API路径**：`/api/questions/import`

---

## 11. 年级管理 API

### 11.1 获取年级列表
- **请求方法**：GET
- **API路径**：`/api/grades`

### 11.2 添加年级
- **请求方法**：POST
- **API路径**：`/api/grades`

### 11.3 更新年级
- **请求方法**：PUT
- **API路径**：`/api/grades/:id`

### 11.4 删除年级
- **请求方法**：DELETE
- **API路径**：`/api/grades/:id`

### 11.5 初始化年级数据
- **请求方法**：POST
- **API路径**：`/api/grades/init`

### 11.6 清空年级数据
- **请求方法**：POST
- **API路径**：`/api/grades/clear`

---

## 12. 班级管理 API

### 12.1 获取班级列表
- **请求方法**：GET
- **API路径**：`/api/classes`

### 12.2 添加班级
- **请求方法**：POST
- **API路径**：`/api/classes`

### 12.3 更新班级
- **请求方法**：PUT
- **API路径**：`/api/classes/:id`

### 12.4 删除班级
- **请求方法**：DELETE
- **API路径**：`/api/classes/:id`

### 12.5 初始化班级数据
- **请求方法**：POST
- **API路径**：`/api/classes/init`

### 12.6 清空班级数据
- **请求方法**：POST
- **API路径**：`/api/classes/clear`

---

## 13. 答题记录 API

### 13.1 获取所有答题记录
- **请求方法**：GET
- **API路径**：`/api/answer-records/all`
- **功能**：获取所有答题记录，支持多条件筛选

**查询参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| student_id | string | 否 | 学号 |
| userId | number | 否 | 用户ID |
| grade | string | 否 | 年级 |
| class | string | 否 | 班级 |
| subjectId | number | 否 | 学科ID |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |
| limit | number | 否 | 数量限制 |

### 13.2 获取用户答题记录
- **请求方法**：GET
- **API路径**：`/api/answer-records/:userId`

### 13.3 获取用户题目尝试记录
- **请求方法**：GET
- **API路径**：`/api/answer-records/question-attempts/:userId`

**查询参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| answerRecordId | number | 否 | 答题记录ID |

### 13.4 添加答题记录
- **请求方法**：POST
- **API路径**：`/api/answer-records`

---

## 14. 难度调整 API

### 14.1 调整题目难度
- **请求方法**：POST
- **API路径**：`/api/difficulty/question/:questionId`
- **功能**：根据错误率自动调整题目难度

### 14.2 批量调整题目难度
- **请求方法**：POST
- **API路径**：`/api/difficulty/batch`

### 14.3 手动设置题目难度
- **请求方法**：PUT
- **API路径**：`/api/difficulty/question/:questionId`

### 14.4 调整题库难度
- **请求方法**：POST
- **API路径**：`/api/difficulty/subcategory/:subcategoryId`

### 14.5 批量调整题库难度
- **请求方法**：POST
- **API路径**：`/api/difficulty/subcategory/batch`

### 14.6 手动设置题库难度
- **请求方法**：PUT
- **API路径**：`/api/difficulty/subcategory/:subcategoryId`

### 14.7 获取难度分布
- **请求方法**：GET
- **API路径**：`/api/difficulty/distribution`

---

## 15. 排行榜 API

### 15.1 获取全局排行榜
- **请求方法**：GET
- **API路径**：`/api/leaderboard/global`

**查询参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 否 | 用户ID |
| student_id | string | 否 | 学号 |
| grade | string | 否 | 年级 |
| class | string | 否 | 班级 |
| subjectId | number | 否 | 学科ID |
| limit | number | 否 | 数量限制 |

### 15.2 获取学科排行榜
- **请求方法**：GET
- **API路径**：`/api/leaderboard/subject/:subjectId`

### 15.3 清空排行榜数据
- **请求方法**：POST
- **API路径**：`/api/leaderboard/clear`

---

## 16. 数据分析 API

### 16.1 获取用户分析
- **请求方法**：GET
- **API路径**：`/api/analysis/user/:id`

### 16.2 获取学科分析
- **请求方法**：GET
- **API路径**：`/api/analysis/subject/:id`

### 16.3 获取题目分析
- **请求方法**：GET
- **API路径**：`/api/analysis/questions`

---

## 17. 文件上传 API

### 17.1 上传图片文件
- **请求方法**：POST
- **API路径**：`/api/upload/image`
- **请求体**：FormData，包含图片文件
- **功能**：上传图片文件到images目录

**响应**：
```json
{
  "success": true,
  "url": "images/file.jpg"
}
```

### 17.2 上传音频文件
- **请求方法**：POST
- **API路径**：`/api/upload/audio`
- **请求体**：FormData，包含音频文件
- **功能**：上传音频文件到audio目录

**响应**：
```json
{
  "success": true,
  "url": "audio/file.mp3"
}
```

---

## 18. 管理员认证 API

### 18.1 管理员登录
- **请求方法**：POST
- **API路径**：`/api/admin/login`

**请求体**：
```json
{
  "username": "admin",
  "password": "your_password"
}
```

**响应**：
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "admin"
}
```

### 18.2 验证 Token
- **请求方法**：GET
- **API路径**：`/api/admin/verify`
- **请求头**：`Authorization: Bearer <token>`

### 18.3 修改密码
- **请求方法**：POST
- **API路径**：`/api/admin/change-password`
- **请求头**：`Authorization: Bearer <token>`

**请求体**：
```json
{
  "oldPassword": "current_password",
  "newPassword": "new_password"
}
```

### 18.4 数据管理二次验证
- **请求方法**：POST
- **API路径**：`/api/admin/verify-data-management`
- **请求头**：`Authorization: Bearer <token>`

---

## 19. 安全监控 API

### 19.1 获取安全状态
- **请求方法**：GET
- **API路径**：`/api/security/status`
- **请求头**：`Authorization: Bearer <token>`

**响应**：
```json
{
  "totalRequests": 1000,
  "blockedIPs": ["192.168.1.100"],
  "blockedList": [
    {
      "ip": "192.168.1.100",
      "blockedAt": "2024-03-24T10:00:00Z",
      "reason": "请求过于频繁"
    }
  ]
}
```

### 19.2 获取封禁 IP 列表
- **请求方法**：GET
- **API路径**：`/api/security/blocked-ips`

### 19.3 解封指定 IP
- **请求方法**：POST
- **API路径**：`/api/security/unblock-ip`

### 19.4 解封所有 IP
- **请求方法**：POST
- **API路径**：`/api/security/unblock-all`

---

## 20. CSRF 防护 API

### 20.1 获取 CSRF Token
- **请求方法**：GET
- **API路径**：`/api/csrf-token`
- **功能**：获取 CSRF Token，用于 POST/PUT/DELETE 请求

**响应**：
```json
{
  "token": "csrf-token-string"
}
```

---

## 21. 错误码说明

| 错误码 | 描述 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权/Token过期/签名验证失败 |
| 403 | 禁止访问/IP被封禁 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |
| 503 | 服务不可用 |

---

## 22. 限流说明

| API | 限流策略 |
|-----|----------|
| `/api/quiz/submit` | 每IP每分钟最多10次 |
| 普通API | 每分钟最多60次 |
| 登录API | 每IP每分钟最多10次 |

---

## 23. 注意事项

1. **请求格式**：所有 POST 和 PUT 请求的请求体必须是 JSON 格式
2. **文件上传**：文件上传使用 FormData 格式
3. **分页参数**：大部分列表接口支持 page 和 limit 参数
4. **时间格式**：日期参数使用 YYYY-MM-DD 格式
5. **编码**：所有响应使用 UTF-8 编码
6. **签名验证**：答题提交需要使用 HMAC-SHA256 签名
7. **会话过期**：答题会话30分钟过期

---

## 24. 示例请求

### 示例 1：用户登录
```bash
curl -X POST "http://localhost:3001/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{"studentId": "01", "name": "张三", "grade": "1", "class": "1"}'
```

### 示例 2：开始答题
```bash
curl -X POST "http://localhost:3001/api/quiz/start" \
  -H "Content-Type: application/json" \
  -d '{"subjectId": 1, "subcategoryId": 1, "questionCount": 10, "studentId": "01", "grade": "1", "class": "1"}'
```

### 示例 3：获取错题巩固题库
```bash
curl -X GET "http://localhost:3001/api/error-collection/1?studentId=01&grade=1&class=1"
```

---

## 25. AI 功能 API

### 25.1 自然语言数据分析
- **请求方法**：POST
- **API路径**：`/api/ai/analyze`
- **功能**：使用 AI 进行自然语言数据分析
- **认证**：需要管理员 Token

**请求体**：
```json
{
  "question": "分析一下最近一周的学生答题情况",
  "filters": {
    "grade": "1",
    "class": "1",
    "subjectId": 1
  }
}
```

**响应**：
```json
{
  "success": true,
  "analysis": "AI 分析结果...",
  "timestamp": "2026-03-28T10:00:00.000Z"
}
```

---

### 25.2 错题智能分析
- **请求方法**：POST
- **API路径**：`/api/ai/error-analysis`
- **功能**：对指定题目进行 AI 错题分析

**请求体**：
```json
{
  "questionIds": [1, 2, 3]
}
```

---

### 25.3 生成题目解析
- **请求方法**：POST
- **API路径**：`/api/ai/explanation`
- **功能**：使用 AI 生成题目解析

**请求体**：
```json
{
  "questionId": 1
}
```

---

### 25.4 批量分析任务
- **请求方法**：POST
- **API路径**：`/api/ai/batch`
- **功能**：创建批量分析任务

**请求体**：
```json
{
  "questionIds": [1, 2, 3, 4, 5],
  "title": "批量题目分析",
  "analysisType": "deep"
}
```

---

### 25.5 AI 分析历史
- **请求方法**：GET
- **API路径**：`/api/ai/history`
- **功能**：获取 AI 分析历史列表（分页）

**查询参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 20 |

---

### 25.6 题目质量评估
- **请求方法**：POST
- **API路径**：`/api/ai/question-quality`
- **功能**：评估题目质量（支持图片答案）

**请求体**：
```json
{
  "questionId": 1,
  "includeStats": true
}
```

---

## 26. 答题行为 API

### 26.1 批量提交答题行为
- **请求方法**：POST
- **API路径**：`/api/answer-behavior/batch`
- **功能**：批量提交答题行为数据（优化性能）

**请求体**：
```json
{
  "behaviors": [
    {
      "userId": 1,
      "questionId": 1,
      "answerTime": 30,
      "answerModifications": 2,
      "isFirstAnswerCorrect": false,
      "finalAnswer": "B",
      "isCorrect": true,
      "hesitationTime": 5,
      "skippedAndReturned": false,
      "sessionId": "uuid-string"
    }
  ]
}
```

**响应**：
```json
{
  "success": true,
  "insertedCount": 1,
  "skippedCount": 0
}
```

---

### 26.2 获取用户学习风格分析
- **请求方法**：GET
- **API路径**：`/api/answer-behavior/user-style/:userId`
- **功能**：获取用户学习风格分析结果

---

### 26.3 重新分析学习风格
- **请求方法**：POST
- **API路径**：`/api/answer-behavior/analyze-style`
- **功能**：将学习风格分析任务添加到队列

**请求体**：
```json
{
  "userId": 1,
  "priority": 5
}
```

---

### 26.4 获取用户答题行为统计
- **请求方法**：GET
- **API路径**：`/api/answer-behavior/statistics/:userId`
- **功能**：获取用户答题行为统计数据

**查询参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| days | number | 否 | 统计天数，默认 30 |

---

## 27. 题目语义分析 API

### 27.1 分析单个题目
- **请求方法**：POST
- **API路径**：`/api/question-semantic/analyze`
- **功能**：将题目添加到语义分析队列

**请求体**：
```json
{
  "questionId": 1
}
```

---

### 27.2 批量分析题目
- **请求方法**：POST
- **API路径**：`/api/question-semantic/batch-analyze`
- **功能**：批量添加题目到语义分析队列

**请求体**：
```json
{
  "questionIds": [1, 2, 3],
  "priority": 5
}
```

---

### 27.3 查找相似题目
- **请求方法**：GET
- **API路径**：`/api/question-semantic/similar/:questionId`
- **功能**：根据语义分析结果查找相似题目

**查询参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | number | 否 | 返回数量，默认 5 |

---

### 27.4 获取题目标签统计
- **请求方法**：GET
- **API路径**：`/api/question-semantic/tags`
- **功能**：获取题目标签使用统计

---

## 28. Dashboard API

### 28.1 获取统计数据
- **请求方法**：GET
- **API路径**：`/api/dashboard/stats`
- **功能**：获取后台仪表盘统计数据
- **认证**：需要管理员 Token

**响应**：
```json
{
  "totalQuestions": 1000,
  "totalUsers": 50,
  "todayAttempts": 120,
  "avgAccuracy": 85,
  "questionTrend": 10,
  "userTrend": 2,
  "attemptTrend": 15,
  "accuracyTrend": 3
}
```

---

### 28.2 获取答题趋势数据
- **请求方法**：GET
- **API路径**：`/api/dashboard/trend`
- **功能**：获取答题趋势数据

**查询参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| days | number | 否 | 天数，默认 7 |

---

### 28.3 获取学科答题分布
- **请求方法**：GET
- **API路径**：`/api/dashboard/subject-distribution`
- **功能**：获取各学科答题次数分布

---

### 28.4 获取最近答题记录
- **请求方法**：GET
- **API路径**：`/api/dashboard/recent-activities`
- **功能**：获取最近答题活动记录

**查询参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | number | 否 | 数量限制，默认 10，最大 100 |

---

## 29. 文件管理 API

### 29.1 获取孤儿文件统计
- **请求方法**：GET
- **API路径**：`/api/upload/orphan-stats`
- **功能**：获取未被引用的文件统计

---

### 29.2 清理孤儿文件
- **请求方法**：POST
- **API路径**：`/api/upload/cleanup-orphans`
- **功能**：清理未被引用的文件

---

### 29.3 取消上传清理
- **请求方法**：POST
- **API路径**：`/api/upload/cancel-upload`
- **功能**：清理未保存的上传文件

---

**文档结束**
