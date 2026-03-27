# AI 数据增强 API 文档

## 概述

AI 数据增强功能提供题目语义分析和用户学习风格分析能力，通过 AI 技术深入挖掘题库数据和用户行为数据的价值。

## 基础信息

- **Base URL**: `/api`
- **认证**: 部分接口需要管理员权限
- **内容类型**: `application/json`

---

## 一、题目语义分析 API

### 1.1 分析单个题目

**接口**: `POST /question-semantic/analyze`

**描述**: 对单个题目进行语义分析，提取关键词、标签、知识点等信息。

**请求参数**:

```json
{
  "questionId": 123
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| questionId | number | 是 | 题目ID |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "questionId": 123,
    "keywords": ["分数", "加减法", "通分"],
    "autoTags": [
      {"name": "计算题", "category": "题型"},
      {"name": "中等难度", "category": "难度"}
    ],
    "knowledgePoints": ["分数运算", "通分", "异分母加减"],
    "difficultyFactors": {
      "计算量": "中",
      "概念复杂度": "低"
    },
    "contentQualityScore": 85.5,
    "aiAnalysis": "该题目考查学生对分数加减法的掌握程度..."
  }
}
```

---

### 1.2 批量分析题目

**接口**: `POST /question-semantic/batch-analyze`

**描述**: 批量对多个题目进行语义分析。

**请求参数**:

```json
{
  "questionIds": [1, 2, 3, 4, 5],
  "priority": 5
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| questionIds | number[] | 是 | 题目ID数组（最多50个） |
| priority | number | 否 | 优先级（1-10，默认5） |

**响应示例**:

```json
{
  "success": true,
  "message": "已提交5个题目进行分析",
  "taskId": "batch-20260327-001"
}
```

---

### 1.3 查找相似题目

**接口**: `GET /question-semantic/similar/:questionId`

**描述**: 根据语义相似度查找相似题目。

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| questionId | number | 是 | 题目ID |

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | number | 否 | 返回数量限制（默认10） |

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "id": 45,
      "similarity": 0.92,
      "question": {
        "content": "计算 2/3 + 1/6",
        "type": "single",
        "difficulty": 2
      }
    }
  ]
}
```

---

## 二、答题行为分析 API

### 2.1 批量提交行为数据

**接口**: `POST /answer-behavior/batch`

**描述**: 批量提交答题行为数据，用于分析学习风格。

**请求参数**:

```json
{
  "behaviors": [
    {
      "userId": 1,
      "questionId": 123,
      "answerTime": 30,
      "selectedAnswer": "A",
      "finalAnswer": "B",
      "isCorrect": false,
      "hesitationTime": 5,
      "modifications": 2,
      "sessionId": "session-123"
    }
  ]
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| behaviors | array | 是 | 行为数组（最多100条） |
| behaviors[].userId | number | 是 | 用户ID |
| behaviors[].questionId | number | 是 | 题目ID |
| behaviors[].answerTime | number | 是 | 答题时间（秒） |
| behaviors[].selectedAnswer | string | 否 | 首次选择的答案 |
| behaviors[].finalAnswer | string | 否 | 最终答案 |
| behaviors[].isCorrect | boolean | 是 | 是否正确 |
| behaviors[].hesitationTime | number | 否 | 犹豫时间（秒） |
| behaviors[].modifications | number | 否 | 修改次数 |
| behaviors[].sessionId | string | 否 | 会话ID |

**响应示例**:

```json
{
  "success": true,
  "message": "已接收10条行为数据",
  "analyzed": 10
}
```

---

### 2.2 获取用户学习风格

**接口**: `GET /answer-behavior/user-style/:userId`

**描述**: 获取用户的学习风格分析结果。

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | number | 是 | 用户ID |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "userId": 1,
    "avgAnswerTime": 25.5,
    "answerTimeStability": 8.2,
    "avgModifications": 1.3,
    "skipRate": 0.05,
    "preferredDifficulty": 3,
    "preferredTimeSlot": "晚上",
    "errorPatterns": {
      "concept_error": 5,
      "careless_error": 3,
      "calculation_error": 2
    },
    "learningStyleTags": ["谨慎型", "思考型", "细致型"],
    "aiSuggestion": "您在答题时表现出谨慎的特点，建议可以适当提高答题速度，同时保持细致的态度...",
    "totalAnalyzedSessions": 42
  }
}
```

---

### 2.3 重新分析学习风格

**接口**: `POST /answer-behavior/analyze-style`

**描述**: 触发重新分析用户学习风格。

**请求参数**:

```json
{
  "userId": 1,
  "forceRefresh": false
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | number | 是 | 用户ID |
| forceRefresh | boolean | 否 | 是否强制刷新（忽略缓存） |

**响应示例**:

```json
{
  "success": true,
  "message": "学习风格分析任务已提交",
  "taskId": "style-analysis-001"
}
```

---

## 三、AI 配置管理 API

### 3.1 获取 AI 配置

**接口**: `GET /settings/ai-config`

**权限**: 需要管理员权限

**响应示例**:

```json
{
  "success": true,
  "data": {
    "apiKey": "***...***",
    "apiUrl": "https://ark.cn-beijing.volces.com/api/v3",
    "model": "ep-20260322185832-88nhz",
    "enabled": true,
    "cacheEnabled": true,
    "timeout": 120,
    "maxConcurrent": 5,
    "retryAttempts": 3,
    "retryDelay": 1000,
    "rateLimitWait": 2000,
    "cacheTTL": 3600
  }
}
```

---

### 3.2 更新 AI 配置

**接口**: `POST /settings/ai-config`

**权限**: 需要管理员权限

**请求参数**:

```json
{
  "apiKey": "your-api-key",
  "apiUrl": "https://ark.cn-beijing.volces.com/api/v3",
  "model": "ep-20260322185832-88nhz",
  "enabled": true,
  "cacheEnabled": true,
  "timeout": 120,
  "maxConcurrent": 5,
  "retryAttempts": 3,
  "retryDelay": 1000,
  "rateLimitWait": 2000,
  "cacheTTL": 3600
}
```

**响应示例**:

```json
{
  "success": true,
  "message": "AI配置更新成功"
}
```

---

## 四、错误处理

### 错误响应格式

```json
{
  "success": false,
  "error": "错误描述",
  "code": "ERROR_CODE"
}
```

### 常见错误码

| 错误码 | 说明 | HTTP状态码 |
|--------|------|-----------|
| INVALID_QUESTION_ID | 无效的题目ID | 400 |
| INVALID_USER_ID | 无效的用户ID | 400 |
| AI_SERVICE_ERROR | AI服务错误 | 500 |
| RATE_LIMIT_EXCEEDED | 请求频率超限 | 429 |
| UNAUTHORIZED | 未授权访问 | 401 |
| FORBIDDEN | 权限不足 | 403 |

---

## 五、性能与限制

### 请求限制

- 单次批量分析最多 50 个题目
- 单次提交行为数据最多 100 条
- API 请求频率限制：100次/分钟

### 响应时间

- 单题目分析：3-5秒
- 批量分析：根据数量，最长30秒
- 相似题目查找：< 1秒
- 学习风格分析：5-10秒

### 缓存策略

- 语义分析结果缓存：1小时（可配置）
- 学习风格分析缓存：1天
- 相似题目结果缓存：30分钟

---

## 六、最佳实践

### 1. 批量操作

优先使用批量接口减少请求次数：

```javascript
// ❌ 不推荐：循环调用单个接口
for (const id of questionIds) {
  await analyzeQuestion(id)
}

// ✅ 推荐：使用批量接口
await batchAnalyzeQuestions(questionIds)
```

### 2. 错误处理

实现重试机制处理临时错误：

```javascript
try {
  const result = await analyzeQuestion(questionId)
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // 等待后重试
    await sleep(2000)
    return analyzeQuestion(questionId)
  }
  throw error
}
```

### 3. 缓存利用

利用缓存减少 API 调用：

```javascript
// 检查缓存
const cached = await getCachedAnalysis(questionId)
if (cached && !isExpired(cached)) {
  return cached
}

// 缓存未命中，调用 API
const result = await analyzeQuestion(questionId)
await cacheResult(questionId, result)
return result
```

---

## 七、更新日志

### v1.0.0 (2026-03-27)

- ✨ 新增题目语义分析 API
- ✨ 新增用户学习风格分析 API
- ✨ 新增批量操作支持
- ✨ 新增缓存机制
- 🔒 新增输入验证和安全防护
- 📊 新增性能监控

---

## 八、联系方式

如有问题或建议，请联系技术支持。

**文档版本**: v1.0.0  
**最后更新**: 2026-03-27
