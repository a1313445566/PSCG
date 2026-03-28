# PSCG API 文档

**项目名称**: PSCG 智能题库系统  
**文档版本**: v2.3  
**更新日期**: 2026-03-28  
**API 版本**: v1

## 1. 概述
RESTful JSON API，覆盖题库管理、答题流程、难度调整、分析统计、AI 能力、学习风格/行为、文件上传与安全控制。

## 2. 基础信息
- 开发环境：`http://localhost:3001/api`
- 生产环境：`https://your-domain.com/api`
- 认证：JWT（用户/管理员），部分接口需 Admin Token；答题提交需签名；CSRF 通过 `X-CSRF-Token`；限流与防重放已启用。

### 2.1 通用请求头
| Header | 示例 | 说明 |
| --- | --- | --- |
| `Content-Type` | `application/json` | JSON 请求体 |
| `Authorization` | `Bearer <token>` | 用户或管理员 JWT |
| `X-CSRF-Token` | `<token>` | 从 `/api/csrf-token` 获取 |

### 2.2 通用响应格式
```json
{
  "success": true,
  "data": {}
}
```
错误：`{ "error": "错误信息" }`

### 2.3 签名与时间戳（答题提交）
- 算法：HMAC-SHA256，密钥 `SIGNATURE_SECRET`（前后端一致）。
- 时间戳容忍：±5 分钟（未来 1 分钟容忍）；重复签名将被拒绝（signatureCache 防重放）。

### 2.4 CSRF
- 获取：`GET /api/csrf-token`
- 前端：`api.js` 自动携带 `X-CSRF-Token`

### 2.5 速率限制（示例）
- 提交类接口：每 IP/用户 10 次/分钟，超限自动封禁 5 分钟，可后台解封。

## 3. 认证与安全
- `POST /api/users/login` — 学生登录，返回用户 JWT。
- `POST /api/admin/login` — 管理员登录，返回 Admin JWT。
- `GET /api/admin/verify` — 校验 Admin Token。
- `POST /api/admin/change-password` — 修改管理员密码。
- `POST /api/admin/verify-data-management` — 数据管理二次验证。
- 安全状态/封禁：
  - `GET /api/security/status`
  - `GET /api/security/blocked-ips`
  - `POST /api/security/unblock-ip` `{ ip }`
  - `POST /api/security/unblock-all`

## 4. 用户与基础数据
- 用户：
  - `GET /api/users`（分页/筛选 `grade,class,page,limit,withStats`）
  - `GET /api/users/:id`
  - `POST /api/users`
  - `PUT /api/users/:id`
  - `DELETE /api/users/:id`
  - `POST /api/users/batch`（批量导入）
- 学科/题库：
  - `GET /api/subjects`，`POST /api/subjects`，`PUT/DELETE /api/subjects/:id`
  - `GET /api/subcategories?subjectId=...`（如有实现）；题库 CRUD 由 `questions` 路由内处理
- 题目：
  - `GET /api/questions`（支持学科/题库/难度过滤、分页）
  - `POST /api/questions`
  - `PUT /api/questions/:id`
  - `DELETE /api/questions/:id`
  - `POST /api/questions/import`（导入）

## 5. 答题流程
### 5.1 开始答题
`POST /api/quiz/start`
```json
{
  "subjectId": 1,
  "subcategoryId": 1,          // 错题巩固可传 "error-collection"
  "questionCount": 10,
  "studentId": "01",
  "grade": "1",
  "class": "1"
}
```
响应包含 `quizId`、题目数组（含乱序选项）、过期时间等。

### 5.2 提交答案
`POST /api/quiz/submit`
```json
{
  "quizId": "uuid",
  "answers": { "1": "A", "2": "B" },
  "shuffleMappings": { "1": { "0": 2, "1": 0, "2": 3, "3": 1 } },
  "timestamp": 1711286400000,
  "signature": "hmac-sha256",
  "timeSpent": 120
}
```
返回得分、正确数、解析、积分等。

### 5.3 答题记录
- `GET /api/answer-records`（分页/筛选：用户、学科、时间范围、正确率等）
- 防重复提交、签名校验、题目内容处理均在后端完成。

## 6. 难度调整
- `POST /api/difficulty/question/:questionId` — 自动调整（基于加权错误率）
- `POST /api/difficulty/batch` — 批量自动
- `PUT /api/difficulty/question/:questionId` — 手动设置
- `POST /api/difficulty/subcategory/:subcategoryId` — 调整题库
- `POST /api/difficulty/subcategory/batch` — 批量题库
- `PUT /api/difficulty/subcategory/:subcategoryId` — 题库手动
- `GET /api/difficulty/distribution` — 难度分布

## 7. 分析与统计
### 7.1 综合分析（dashboard/analysis）
`GET /api/analysis`，常用查询参数：
- `userId` / `grade` / `class` / `subjectId` / `subcategoryId`
- `startDate` / `endDate`
- `withTrend=true` — 返回趋势/分布
- 支持 XLSX 导出（具体字段以后端实现为准）

输出示例字段：
- 总览：`totalSessions,totalQuestions,avgAccuracy,avgTimeSpent`
- 分布：`gradeStats, classStats, subjectStats, timeRangeStats`
- 趋势：`dailyAccuracy, dailyCounts`

### 7.2 学习风格与行为（user-stats）
- `GET /api/user-stats/learning-style/:userId`
- `GET /api/user-stats/behavior/:userId`
- `GET /api/user-stats/subject-radar/:userId`
- `GET /api/user-stats/time-buckets/:userId`（时段/强度）
- `GET /api/user-stats/error-tendency/:userId`

## 8. AI 能力
### 8.1 自然语言/学习风格/数据增强
- `POST /api/ai/analyze` — 自然语言分析（智能意图理解）
- `POST /api/ai/learning-style` — 学习风格分析
- `POST /api/ai/data-enhancement` — AI 数据增强
- `GET /api/ai/history` — 历史记录

### 8.2 题目语义分析（队列）
- `POST /api/question-semantic/analyze` — 单题/批量入队
- `GET /api/question-semantic/queue-status` — 队列状态
- `GET /api/question-semantic/similar/:questionId` — 相似题推荐
- `GET /api/question-semantic/tag-stats` — 标签统计

### 8.3 答题行为/错题原因分析（队列）
- `POST /api/answer-behavior/batch` — 批量行为入库
- `POST /api/answer-behavior/error-analysis` — 错题原因分析任务
- 任务参数包含优先级、重试策略，受 `aiQueueService` 管理。

## 9. 上传
- 图片/音频上传路由见 `upload.js`（使用 multer），限制：图片/音频白名单，大小图片 ≤2MB，音频 ≤10MB；引用计数由 `fileReferenceService` 维护，取消编辑需调用清理接口（如有实现）。

## 10. CSRF
- `GET /api/csrf-token` — 获取 Token（2h 过期），前端 `api.js` 自动附带。

## 11. 错误码与常见原因（节选）
- 400 参数错误：字段缺失/格式不符、批量超限、签名时间戳无效。
- 401 未认证或签名校验失败：JWT 缺失/过期，签名不匹配。
- 403 CSRF 校验失败或被限流/封禁。
- 404 资源不存在：题目/学科/题库/会话不存在。
- 429 触发限流或重复提交。
- 500 内部错误：请查 PM2/Nginx/后端日志。

## 12. 安全与性能提示
- 签名密钥前后端一致；服务器时间同步（NTP）。
- 高频接口建议带缓存参数或使用后端内置缓存（analysis/user-stats/leaderboard）。
- 上传文件需走 `upload` 路由；取消编辑记得调用孤儿清理（如有）。
- 提交/AI 队列接口有限流与重试，请关注返回码和提示信息。
