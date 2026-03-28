# PSCG API 使用手册

**项目**：PSCG 智能题库系统  
**版本**：v3.1（Auto sync with `/routes` 代码）  
**最后更新**：2026-03-28

> 文档结构：先列出全局约定，再按模块梳理所有接口。每个接口包含：方法 + 路径、权限要求、主要参数、请求示例、响应示例与备注。示例中的字段与返回结构均来自当前仓库实现，可直接对照 `/routes/*.js`。

---

## 0. 全局约定

| 项 | 说明 |
| --- | --- |
| 域名 | 开发：`http://localhost:3001`；生产：`https://your-domain.com` |
| API 网关 | 所有业务接口挂载在 `/api` 前缀（如 `/api/users`） |
| Content-Type | `application/json`，除文件上传外 |
| 身份认证 | Header `Authorization: Bearer <JWT>`，学生 Token 来源 `/api/users/login`，Admin Token 来源 `/api/admin/login` |
| CSRF | `GET /api/csrf-token`，`src/utils/api.js` 自动附带 `X-CSRF-Token` |
| 字段命名 | 响应多为 snake_case，自前端接收时再转 camelCase |
| 错误返回 | `{ "error": "错误信息" }` 或 `{ success:false, message }` |

---

## 1. 认证 / 安全

### 1.1 学生登录
```
POST /api/users/login
权限：公开
```
**请求体**
```json
{
  "studentId": "01",
  "name": "张三",     // 可选
  "grade": "1",
  "class": "1"
}
```
**响应**
```json
{
  "userId": 12,
  "studentId": "01",
  "name": "张三",
  "grade": "1",
  "class": "1",
  "token": "jwt-token",
  "expiresIn": "24h"
}
```
> 学号需为 2 位数字；若用户不存在则自动创建。

### 1.2 管理员初始化 / 登录 / 校验
```
GET  /api/admin/status          // 是否已创建管理员
POST /api/admin/init            // 首次初始化
POST /api/admin/login           // 登录
POST /api/admin/change-password // 修改密码，需要 Admin Token
GET  /api/admin/verify          // 校验 Token
POST /api/admin/verify-data-management // 危险操作二次验证
```
**登录示例**
```json
// Request Body
{ "username": "admin", "password": "123456" }

// Response
{
  "success": true,
  "token": "admin-jwt",
  "username": "admin",
  "expiresIn": "24h"
}
```

### 1.3 安全监控（需 Admin Token）
```
GET  /api/security/rate-limit
GET  /api/security/signature-cache
POST /api/security/block-ip      // { ip, duration?, reason? }
POST /api/security/unblock-ip    // { ip, reason? }
POST /api/security/unblock-all
```
**示例**
```json
// Response /api/security/rate-limit
{
  "global": { "remainingPoints": 480, ... },
  "api": { ... },
  "submit": { ... }
}
```

### 1.4 CSRF Token
```
GET /api/csrf-token
```
**响应**
```json
{ "success": true, "csrfToken": "xxxx" }
```

---

## 2. 年级 / 班级（Admin）
路径前缀：`/api`

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/grades` | 获取年级列表 |
| POST | `/grades` | 创建年级 |
| PUT | `/grades/:id` | 更新 |
| DELETE | `/grades/:id` | 删除 |
| POST | `/grades/init` | 初始化样例数据 |
| POST | `/grades/clear` | 清空 |
| GET | `/classes` | 班级列表 |
| POST | `/classes` | 创建班级 |
| PUT | `/classes/:id` | 更新 |
| DELETE | `/classes/:id` | 删除 |
| POST | `/classes/init` / `/classes/clear` | 初始化或清空 |

**创建班级示例**
```http
POST /api/classes
Authorization: Bearer <admin>
Content-Type: application/json

{
  "gradeId": 1,
  "name": "1班",
  "teacher": "李老师"
}
```
**响应**
```json
{ "success": true, "id": 10 }
```

---

## 3. 学科 / 子分类 / 题库

### 3.1 Subjects API
```
GET  /api/subjects
GET  /api/subjects/stats
GET  /api/subjects/:id/subcategories
POST /api/subjects
PUT  /api/subjects/sort
PUT  /api/subjects/:id
DELETE /api/subjects/:id
POST /api/subjects/:subjectId/subcategories
PUT  /api/subjects/subcategories/:id
DELETE /api/subjects/subcategories/:id
PUT  /api/subjects/:subjectId/subcategories/sort
```
**获取学科**
```http
GET /api/subjects
```
```json
[
  {
    "id": 1,
    "name": "语文",
    "iconIndex": 0,
    "showInHistoryQuiz": true,
    "subcategories": [ { "id": 3, "subjectId": 1, "name": "字词", "iconIndex": 1 } ]
  }
]
```

### 3.2 Questions API
```
GET    /api/questions/subcategories
GET    /api/questions/subcategories/stats
GET    /api/questions
GET    /api/questions/:id
POST   /api/questions
PUT    /api/questions/:id
DELETE /api/questions/:id
POST   /api/questions/batch
```
**列表示例**
```
GET /api/questions?subjectId=1&subcategoryId=2&page=1&limit=20&keyword=春天
```
```json
{
  "data": [
    {
      "id": 101,
      "subjectId": 1,
      "subcategoryId": 2,
      "content": "春天的特点是？",
      "type": "single",
      "answer": "A",
      "difficulty": 2,
      "image": null,
      "audio": null,
      "createdAt": "2026-03-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 230
  }
}
```
**创建题目**
```json
POST /api/questions
{
  "subjectId": 1,
  "subcategoryId": 2,
  "content": "春天又称？",
  "type": "single",
  "options": ["阳春", "隆冬"],
  "answer": "A",
  "difficulty": 1,
  "explanation": "春天又称阳春"
}
```

### 3.3 Settings
```
GET /api/settings
POST /api/settings
```
配置示例：积分、缓存时长等。

---

## 4. 文件上传
```
POST /api/upload/image
POST /api/upload/audio
POST /api/upload/cancel-upload
GET  /api/upload/orphan-stats
POST /api/upload/cleanup-orphans
```
**上传图片**
```
POST /api/upload/image
Content-Type: multipart/form-data
FormData: image=<file>
```
**响应**
```json
{
  "success": true,
  "url": "/images/image-123.png",
  "filename": "image-123.png",
  "size": 23456,
  "deduplicated": false
}
```
> 2MB 限制；后端使用 Sharp 压缩并记录 `file_hashes`。

---

## 5. 备份 / 数据维护（Admin）

### 5.1 Backup
```
GET    /api/backup                // 触发备份，可 format=db/json
GET    /api/backup/history
GET    /api/backup/:id
DELETE /api/backup/:id
POST   /api/backup/verify
GET    /api/backup/export
POST   /api/backup/restore        // form-data 上传
```
**示例**
```
GET /api/backup?format=json&dataTypes=questions,users
```
```json
{
  "timestamp": "2026/03/28 13:20:11",
  "data": {
    "questions": [...],
    "users": [...]
  }
}
```

### 5.2 Data Ops (`/api/data`)
`POST /backup`, `/restore`, `/clear-all`, `/clear-records`, `/import-local-data`, `/clear-leaderboard`, `/clear-grades`, `/clear-classes`，以及 `GET /export`, `GET /health`。均需 Admin Token。

---

## 6. 用户 / 排行 / 学习表现

### 6.1 Users（参考第 1 节登录外的接口）
- `GET /api/users`（带 `withStats` 可追加作答统计）
- `GET /api/users/:id`
- `POST /api/users`
- `POST /api/users/batch`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
- `POST /api/users/batch-delete`
- `GET /api/users/stats/:userId`
- `GET /api/users/:id/rank`

**列表响应示例**
```json
{
  "data": [
    {
      "id": 12,
      "student_id": "01",
      "name": "张三",
      "grade": "1",
      "class": "1",
      "total_sessions": 5,
      "avg_accuracy": 86.5
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 34 }
}
```

### 6.2 Leaderboard
```
GET /api/leaderboard/global?grade=1&class=1&limit=20&page=1
GET /api/leaderboard/subject/:subjectId
GET /api/leaderboard/top10
POST /api/leaderboard/clear
```
```json
// /global 响应
{
  "total": 45,
  "page": 1,
  "pageSize": 20,
  "data": [
    {
      "id": 12,
      "student_id": "01",
      "name": "张三",
      "grade": "1",
      "class": "1",
      "points": 120,
      "total_sessions": 30,
      "avg_accuracy": 92.3
    }
  ]
}
```

### 6.3 Learning Progress
```
GET /api/learning-progress/user/:userId?subjectId=1
GET /api/learning-progress/summary/:userId
```
```json
{
  "success": true,
  "progress": [
    {
      "subject_id": 1,
      "subcategory_id": 2,
      "mastery_level": 75,
      "total_attempts": 40,
      "correct_attempts": 30,
      "ai_suggestion": "强化错题练习"
    }
  ]
}
```

### 6.4 User Stats（学习风格 / 行为）
```
GET /api/user-stats/learning-style/:userId
GET /api/user-stats/behavior/:userId?days=30
GET /api/user-stats/subject-radar/:userId
```
```json
{
  "success": true,
  "learningStyle": {
    "type": "consistent",
    "name": "稳健型",
    "description": "学习规律性强..."
  },
  "timePreference": [ { "hour": 19, "label": "19:00-20:00", "sessions": 5 } ]
}
```

---

## 7. 答题流程

### 7.1 Quiz
```
POST /api/quiz/start
POST /api/quiz/submit
GET  /api/quiz/history
POST /api/quiz/cleanup
```
**开始答题**
```json
{
  "subjectId": 1,
  "subcategoryId": 2,
  "questionCount": 10,
  "studentId": "01",
  "grade": "1",
  "class": "1"
}
```
**响应**
```json
{
  "quizId": "9fc1...",
  "questions": [
    {
      "id": 101,
      "content": "题干",
      "type": "single",
      "options": ["A","B"],
      "difficulty": 2
    }
  ],
  "expiresAt": "2026-03-28T06:30:00.000Z",
  "stats": { "101": { "correctCount": 1 } } // 错题巩固时包含
}
```
**提交答案**
```json
{
  "quizId": "9fc1...",
  "answers": { "101": "A" },
  "shuffleMappings": { "101": { "0": 2, "1": 0 } },
  "timestamp": 1711612800000,
  "signature": "hmac",
  "timeSpent": 120
}
```

### 7.2 Answer Records
```
GET  /api/answer-records/all?grade=1&class=1&page=1&limit=20
GET  /api/answer-records/:userId
GET  /api/answer-records/question-attempts/:userId
GET  /api/answer-records/error-prone-questions
POST /api/answer-records
POST /api/answer-records/question-attempts
GET  /api/answer-records/user-subcategory-stats/:userId/:subcategoryId
```
**列表响应**
```json
{
  "data": [
    {
      "id": 1001,
      "user_id": 12,
      "subject_id": 1,
      "subcategory_id": 2,
      "total_questions": 10,
      "correct_count": 8,
      "time_spent": 300,
      "created_at": "2026-03-20T08:00:00Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 145 }
}
```

### 7.3 Error Collection
```
GET  /api/error-collection/:subjectId
POST /api/error-collection/update
POST /api/error-collection/reset
GET  /api/error-collection/stats/:userId
```
```json
// GET /api/error-collection/1
[
  { "question_id": 101, "correct_count": 0, "last_wrong_at": "2026-03-20" }
]
```

---

## 8. 分析 / 可视化

### 8.1 Dashboard
```
GET /api/dashboard/stats
GET /api/dashboard/trend
GET /api/dashboard/subject-distribution
GET /api/dashboard/recent-activities
```
```json
{
  "totalUsers": 320,
  "totalQuestions": 860,
  "todaySessions": 45,
  "avgAccuracy": 86.3
}
```

### 8.2 Analysis
```
GET /api/analysis?grade=1&class=1&subjectId=1&startDate=2026-03-01&endDate=2026-03-31
GET /api/analysis/download
```
响应包含 `overview`, `gradeStats`, `classStats`, `subjectStats`, `timeTrend`, `subcategoryStats`, `timeSpentAnalysis` 等字段。

---

## 9. AI / 智能模块（需 Admin Token）

### 9.1 AI Core (`/api/ai`)

| Method | Path | 作用 |
| --- | --- | --- |
| POST | `/analyze` | 智能自然语言分析 |
| POST | `/analyze-legacy` | 旧版分析 |
| POST | `/error-analysis` | 错题原因分析任务 |
| POST | `/explanation` | 自动生成题解 |
| POST | `/test-connection` | 测试与第三方 AI 连接 |
| DELETE | `/cache` | 清空缓存 |
| POST | `/reload-config` | 重载配置 |
| POST | `/history` | 新增 AI 操作记录 |
| GET | `/history` | 查看历史 |
| DELETE | `/history/:id` | 删除单条 |
| DELETE | `/history` | 清空历史 |
| POST | `/batch` | 提交批量任务 |
| GET | `/batch/:id` | 查询批量任务状态 |
| GET | `/batch` | 列出批量任务 |
| POST | `/error-analysis-user` | 针对用户的错题分析 |
| POST | `/question-quality` | 题目质量评估 |

**示例：POST /api/ai/analyze**
```json
{
  "question": "近一周一年级的平均正确率？",
  "filters": {
    "grade": "1",
    "startDate": "2026-03-21",
    "endDate": "2026-03-28"
  }
}
```
```json
{
  "success": true,
  "analysis": {
    "summary": "一年级近一周平均正确率 86.5%",
    "details": [ ... ]
  },
  "timestamp": "2026-03-28T05:00:00.000Z"
}
```

### 9.2 Question Semantic
```
POST /api/question-semantic/analyze
POST /api/question-semantic/batch-analyze
GET  /api/question-semantic/batch-status
GET  /api/question-semantic/similar/:questionId
GET  /api/question-semantic/tags
GET  /api/question-semantic/analysis/:questionId
```
```json
// POST /analyze
{
  "questionIds": [101, 102],
  "priority": "high"
}

// Response
{
  "taskId": "semantic-123",
  "status": "queued"
}
```

### 9.3 Answer Behavior
```
POST /api/answer-behavior/batch
GET  /api/answer-behavior/user-style/:userId
POST /api/answer-behavior/analyze-style
POST /api/answer-behavior/analyze-error
GET  /api/answer-behavior/error-analysis/:errorId
GET  /api/answer-behavior/statistics/:userId
```
```json
// POST /analyze-error
{
  "userId": 12,
  "records": [1001, 1002],
  "priority": "normal"
}
```

---

## 10. 难度调整
```
POST /api/difficulty/question/:questionId       // 自动
POST /api/difficulty/batch                      // 批量自动题目
PUT  /api/difficulty/question/:questionId       // 手动题目
POST /api/difficulty/subcategory/batch          // 批量题库
PUT  /api/difficulty/subcategory/:subcategoryId // 手动题库
POST /api/difficulty/subcategory/:subcategoryId // 自动题库
GET  /api/difficulty/distribution               // 难度分布
```
```json
// PUT /api/difficulty/question/101
{ "difficulty": 3 }
```
```json
{ "success": true, "newDifficulty": 3 }
```

---

## 11. 上传 / 缓存 / 其他系统工具

| Endpoint | 说明 |
| --- | --- |
| `GET /api/cache/stats` | 查看缓存命中、占用情况 |
| `POST /api/cache/clear` | 清空缓存 |
| 静态资源 | `/images/*`, `/audio/*`, `/assets/*` 直接访问 |

---

## 12. 错误码（参考实现）
- `400`：参数缺失、格式错误、批量数量超限、签名时间戳超范围等。  
- `401`：未携带/过期 JWT、签名校验失败。  
- `403`：无权限、CSRF 校验失败、限流封禁。  
- `404`：资源不存在（题目/用户/题库/会话）。  
- `429`：触发限流或重复提交。  
- `500`：服务器错误，查看 PM2/Nginx/应用日志。

---

## 13. 开发注意事项
1. 前端必须使用 `src/utils/api.js` 调用接口；上传文件由 `imageUpload.js` 管理。  
2. 题目内容、选项在入库前使用 `xss-filter`，避免 XSS。  
3. 文件上传会写入 `file_hashes` 与 `fileReferenceService`，删除题目时自动维护引用。  
4. Quiz 提交需带签名与时间戳，`signatureCache` 会拒绝重放。  
5. 管理员敏感操作需二次验证（`/api/admin/verify-data-management`）。  
6. 部署：`npm run build` + `pm2 restart 0`，详见部署文档。

> 本文档覆盖 `routes/` 目录全部接口，如需新增接口请同步修改文档并注明示例。
