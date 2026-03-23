# 🔌 PSCG API 使用指南

## 📋 概述

本文档详细介绍了PSCG系统的RESTful API接口，包括认证、数据操作、文件上传、性能监控等所有可用接口。

## 🚀 快速开始

### 1. API基础信息

#### 基础URL
- **开发环境**：`http://localhost:3001/api`
- **生产环境**：`https://your-domain.com/api`

#### 响应格式
所有API响应都遵循统一的JSON格式：
```json
{
    "success": true,
    "message": "操作成功",
    "data": {...},
    "timestamp": "2025-03-23T10:00:00Z"
}
```

#### 错误响应
```json
{
    "success": false,
    "message": "错误描述",
    "errorCode": "ERROR_CODE",
    "timestamp": "2025-03-23T10:00:00Z"
}
```

### 2. 认证和授权

#### JWT认证
PSCG使用JWT（JSON Web Token）进行认证。

##### 获取Token
```http
POST /api/auth/login
Content-Type: application/json

{
    "username": "admin",
    "password": "password123"
}
```

**响应示例：**
```json
{
    "success": true,
    "message": "登录成功",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "id": 1,
            "username": "admin",
            "role": "admin"
        }
    }
}
```

##### 使用Token
在请求头中添加Authorization头：
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

##### Token刷新
```http
POST /api/auth/refresh
Authorization: Bearer <current_token>
```

#### 权限控制
- **管理员**：完全访问权限
- **教师**：部分管理权限
- **学生**：仅限个人数据访问

## 📚 API接口详解

### 1. 认证接口

#### 用户登录
```http
POST /api/auth/login
```

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**响应字段：**
- `token`: JWT令牌
- `user`: 用户信息
- `expiresIn`: 过期时间（秒）

#### 用户注册
```http
POST /api/auth/register
```

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |
| email | string | 否 | 邮箱 |
| role | string | 否 | 角色（默认student） |

#### 退出登录
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

#### 获取当前用户
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### 2. 学科管理接口

#### 获取学科列表
```http
GET /api/subjects
```

**查询参数：**
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）
- `search`: 搜索关键词
- `sortBy`: 排序字段
- `sortOrder`: 排序方向（asc/desc）

**响应示例：**
```json
{
    "success": true,
    "data": {
        "subjects": [...],
        "pagination": {
            "total": 100,
            "page": 1,
            "limit": 20,
            "pages": 5
        }
    }
}
```

#### 获取单个学科
```http
GET /api/subjects/{id}
```

#### 创建学科
```http
POST /api/subjects
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "数学",
    "icon": "math",
    "description": "数学学科",
    "sortOrder": 1
}
```

#### 更新学科
```http
PUT /api/subjects/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "数学（更新）",
    "icon": "math-updated",
    "description": "更新后的描述"
}
```

#### 删除学科
```http
DELETE /api/subjects/{id}
Authorization: Bearer <token>
```

#### 学科排序
```http
POST /api/subjects/sort
Authorization: Bearer <token>
Content-Type: application/json

{
    "sortedIds": [3, 1, 2, 4]
}
```

### 3. 题库管理接口

#### 获取题库列表
```http
GET /api/subjects/{subjectId}/subcategories
```

**查询参数：**
- `page`: 页码
- `limit`: 每页数量
- `search`: 搜索关键词

#### 创建题库
```http
POST /api/subjects/{subjectId}/subcategories
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "代数",
    "description": "代数相关题目",
    "sortOrder": 1
}
```

#### 更新题库
```http
PUT /api/subjects/{subjectId}/subcategories/{id}
Authorization: Bearer <token>
```

#### 删除题库
```http
DELETE /api/subjects/{subjectId}/subcategories/{id}
Authorization: Bearer <token>
```

#### 题库排序
```http
POST /api/subjects/{subjectId}/subcategories/sort
Authorization: Bearer <token>
Content-Type: application/json

{
    "sortedIds": [2, 1, 3]
}
```

### 4. 题目管理接口

#### 获取题目列表
```http
GET /api/questions
```

**查询参数：**
| 参数名 | 类型 | 说明 |
|--------|------|------|
| subjectId | number | 学科ID |
| subcategoryId | number | 题库ID |
| difficulty | number | 难度等级（1-5） |
| search | string | 搜索关键词 |
| page | number | 页码 |
| limit | number | 每页数量 |
| sortBy | string | 排序字段 |
| sortOrder | string | 排序方向 |

**响应字段：**
- `questions`: 题目列表
- `pagination`: 分页信息
- `statistics`: 统计信息

#### 获取单个题目
```http
GET /api/questions/{id}
```

#### 创建题目
```http
POST /api/questions
Authorization: Bearer <token>
Content-Type: multipart/form-data

-- 表单字段 --
subjectId: 1
subcategoryId: 1
content: "题目内容"
optionA: "选项A"
optionB: "选项B"
optionC: "选项C"
optionD: "选项D"
correctAnswer: "A"
difficulty: 3
explanation: "题目解析"
image: [文件]
audio: [文件]
```

#### 更新题目
```http
PUT /api/questions/{id}
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

#### 删除题目
```http
DELETE /api/questions/{id}
Authorization: Bearer <token>
```

#### 批量添加题目
```http
POST /api/questions/batch
Authorization: Bearer <token>
Content-Type: application/json

{
    "subjectId": 1,
    "subcategoryId": 1,
    "questions": [
        {
            "content": "1. 题目1(A)",
            "optionA": "选项A",
            "optionB": "选项B",
            "optionC": "选项C",
            "optionD": "选项D",
            "correctAnswer": "A",
            "difficulty": 2
        },
        {
            "content": "2. 题目2(B)",
            "optionA": "选项A",
            "optionB": "选项B",
            "optionC": "选项C",
            "optionD": "选项D",
            "correctAnswer": "B",
            "difficulty": 3
        }
    ]
}
```

### 5. 答题记录接口

#### 提交答题记录
```http
POST /api/answer-records
Authorization: Bearer <token>
Content-Type: application/json

{
    "subjectId": 1,
    "subcategoryId": 1,
    "answers": [
        {
            "questionId": 1,
            "selectedAnswer": "A",
            "isCorrect": true,
            "timeSpent": 15000
        },
        {
            "questionId": 2,
            "selectedAnswer": "B",
            "isCorrect": false,
            "timeSpent": 20000
        }
    ],
    "totalTime": 35000,
    "score": 50
}
```

#### 获取答题记录
```http
GET /api/answer-records
Authorization: Bearer <token>
```

**查询参数：**
- `userId`: 用户ID（管理员可查询其他用户）
- `subjectId`: 学科ID
- `startDate`: 开始日期
- `endDate`: 结束日期
- `page`: 页码
- `limit`: 每页数量

#### 获取个人统计
```http
GET /api/answer-records/stats
Authorization: Bearer <token>
```

**响应示例：**
```json
{
    "success": true,
    "data": {
        "totalQuestions": 150,
        "correctAnswers": 120,
        "accuracy": 80.0,
        "averageTime": 25000,
        "subjectStats": [...],
        "dailyStats": [...]
    }
}
```

### 6. 排行榜接口

#### 获取全局排行榜
```http
GET /api/leaderboard/global
```

**查询参数：**
- `subjectId`: 按学科筛选
- `timeRange`: 时间范围（day/week/month/all）
- `limit`: 返回数量（默认50）

#### 获取个人排名
```http
GET /api/leaderboard/personal
Authorization: Bearer <token>
```

#### 获取近期记录
```http
GET /api/leaderboard/recent
```

### 7. 数据分析接口

#### 学习数据分析
```http
GET /api/analysis/learning
Authorization: Bearer <token>
```

**查询参数：**
- `userId`: 用户ID
- `subjectId`: 学科ID
- `timeRange`: 时间范围

#### 错误率分析
```http
GET /api/analysis/error-rate
Authorization: Bearer <token>
```

**响应示例：**
```json
{
    "success": true,
    "data": {
        "highErrorQuestions": [
            {
                "questionId": 123,
                "errorRate": 65.2,
                "totalAttempts": 120,
                "errorCount": 78,
                "questionContent": "题目内容..."
            }
        ],
        "subjectErrorStats": [...],
        "trendAnalysis": [...]
    }
}
```

#### 难度分析
```http
GET /api/analysis/difficulty
Authorization: Bearer <token>
```

### 8. 用户管理接口

#### 获取用户列表
```http
GET /api/users
Authorization: Bearer <token>
```

**查询参数：**
- `role`: 角色筛选
- `grade`: 年级筛选
- `class`: 班级筛选
- `search`: 搜索关键词
- `page`: 页码
- `limit`: 每页数量

#### 获取用户详情
```http
GET /api/users/{id}
Authorization: Bearer <token>
```

#### 创建用户
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
    "username": "student1",
    "password": "password123",
    "email": "student1@example.com",
    "role": "student",
    "grade": "一年级",
    "class": "一班"
}
```

#### 更新用户
```http
PUT /api/users/{id}
Authorization: Bearer <token>
```

#### 删除用户
```http
DELETE /api/users/{id}
Authorization: Bearer <token>
```

### 9. 文件上传接口

#### 上传图片
```http
POST /api/upload/image
Authorization: Bearer <token>
Content-Type: multipart/form-data

-- 表单字段 --
image: [图片文件]
```

**响应示例：**
```json
{
    "success": true,
    "data": {
        "url": "/images/filename.jpg",
        "filename": "filename.jpg",
        "size": 102400,
        "mimetype": "image/jpeg"
    }
}
```

#### 上传音频
```http
POST /api/upload/audio
Authorization: Bearer <token>
Content-Type: multipart/form-data

-- 表单字段 --
audio: [音频文件]
```

#### 文件限制
- **图片**：JPEG, PNG, GIF, WebP，最大10MB
- **音频**：MP3, WAV, OGG，最大20MB

### 10. 数据管理接口

#### 数据备份
```http
POST /api/backup
Authorization: Bearer <token>
Content-Type: application/json

{
    "type": "full",  // full/incremental
    "description": "定期备份"
}
```

#### 数据恢复
```http
POST /api/restore
Authorization: Bearer <token>
Content-Type: multipart/form-data

-- 表单字段 --
backupFile: [备份文件]
```

#### 数据清理
```http
POST /api/data/cleanup
Authorization: Bearer <token>
Content-Type: application/json

{
    "type": "answerRecords",  // answerRecords/tempFiles/cache
    "olderThan": "30d"       // 30天前
}
```

### 11. 系统设置接口

#### 获取系统设置
```http
GET /api/settings
```

#### 更新系统设置
```http
PUT /api/settings
Authorization: Bearer <token>
Content-Type: application/json

{
    "interfaceName": "PSCG智能题库系统",
    "randomizeAnswers": true,
    "fixedQuestionCount": false,
    "minQuestionCount": 10,
    "maxQuestionCount": 50
}
```

### 12. 性能监控接口

#### 系统健康检查
```http
GET /api/performance/health
```

**响应示例：**
```json
{
    "success": true,
    "data": {
        "status": "ok",
        "uptime": 86400,
        "timestamp": "2025-03-23T10:00:00Z",
        "memoryUsage": {
            "rss": 150241280,
            "heapTotal": 102760448,
            "heapUsed": 75623424,
            "external": 16723256
        }
    }
}
```

#### 数据库性能报告
```http
GET /api/performance/db
```

#### API性能报告
```http
GET /api/performance/api
```

#### 缓存统计
```http
GET /api/cache/stats
```

#### 清理缓存
```http
POST /api/cache/clear
Authorization: Bearer <token>
```

### 13. 错误收集接口

#### 获取错误率高的题目
```http
GET /api/error-collection/high-error
Authorization: Bearer <token>
```

#### 提交错误反馈
```http
POST /api/error-collection/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
    "questionId": 123,
    "errorType": "content_error",
    "description": "题目描述有误",
    "suggestion": "建议修改为..."
}
```

## 🔧 API使用示例

### 1. 使用curl

#### 获取学科列表
```bash
curl -X GET "http://localhost:3001/api/subjects?page=1&limit=20" \
  -H "Content-Type: application/json"
```

#### 创建题目（带认证）
```bash
curl -X POST "http://localhost:3001/api/questions" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: multipart/form-data" \
  -F "subjectId=1" \
  -F "subcategoryId=1" \
  -F "content=题目内容" \
  -F "optionA=选项A" \
  -F "optionB=选项B" \
  -F "optionC=选项C" \
  -F "optionD=选项D" \
  -F "correctAnswer=A" \
  -F "difficulty=3" \
  -F "explanation=题目解析" \
  -F "image=@/path/to/image.jpg"
```

#### 提交答题记录
```bash
curl -X POST "http://localhost:3001/api/answer-records" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectId": 1,
    "subcategoryId": 1,
    "answers": [
      {
        "questionId": 1,
        "selectedAnswer": "A",
        "isCorrect": true,
        "timeSpent": 15000
      }
    ],
    "totalTime": 15000,
    "score": 100
  }'
```

### 2. 使用JavaScript（Fetch API）

#### 登录并获取Token
```javascript
async function login(username, password) {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    if (data.success) {
        localStorage.setItem('token', data.data.token);
        return data.data.user;
    } else {
        throw new Error(data.message);
    }
}
```

#### 获取题目列表（带分页）
```javascript
async function getQuestions(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`/api/questions?${query}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    
    return await response.json();
}

// 使用示例
getQuestions({
    subjectId: 1,
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
}).then(data => {
    console.log('题目列表:', data.data.questions);
});
```

#### 上传文件
```javascript
async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
    });
    
    return await response.json();
}

// 使用示例
const fileInput = document.getElementById('image-upload');
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const result = await uploadImage(file);
    if (result.success) {
        console.log('图片上传成功:', result.data.url);
    }
});
```

### 3. 使用Python（requests库）

#### Python示例代码
```python
import requests
import json

class PSCGClient:
    def __init__(self, base_url, username=None, password=None):
        self.base_url = base_url
        self.token = None
        if username and password:
            self.login(username, password)
    
    def login(self, username, password):
        url = f"{self.base_url}/auth/login"
        payload = {
            "username": username,
            "password": password
        }
        response = requests.post(url, json=payload)
        data = response.json()
        
        if data.get("success"):
            self.token = data["data"]["token"]
            return True
        else:
            raise Exception(f"登录失败: {data.get('message')}")
    
    def get_headers(self):
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers
    
    def get_subjects(self, page=1, limit=20):
        url = f"{self.base_url}/subjects"
        params = {"page": page, "limit": limit}
        response = requests.get(url, params=params, headers=self.get_headers())
        return response.json()
    
    def create_question(self, question_data):
        url = f"{self.base_url}/questions"
        response = requests.post(url, json=question_data, headers=self.get_headers())
        return response.json()

# 使用示例
client = PSCGClient("http://localhost:3001/api", "admin", "password123")

# 获取学科列表
subjects = client.get_subjects()
print("学科列表:", subjects)

# 创建题目
new_question = {
    "subjectId": 1,
    "subcategoryId": 1,
    "content": "Python API测试题目",
    "optionA": "选项A",
    "optionB": "选项B",
    "optionC": "选项C",
    "optionD": "选项D",
    "correctAnswer": "A",
    "difficulty": 2
}

result = client.create_question(new_question)
print("创建结果:", result)
```

## 🛡️ 安全注意事项

### 1. 认证安全
- 永远不要在客户端存储明文密码
- 使用HTTPS传输敏感数据
- 定期更新JWT密钥
- 实施令牌刷新机制

### 2. 请求安全
- 验证所有输入参数
- 防止SQL注入攻击
- 实施请求速率限制
- 检查文件上传类型和大小

### 3. 数据安全
- 敏感数据加密存储
- 实施数据访问权限控制
- 定期备份重要数据
- 监控异常数据访问

### 4. API安全最佳实践
1. **使用HTTPS**：所有API请求都通过HTTPS
2. **实施CORS**：限制跨域请求
3. **输入验证**：验证所有输入参数
4. **输出编码**：防止XSS攻击
5. **错误处理**：不返回敏感错误信息
6. **日志记录**：记录所有API请求
7. **监控告警**：监控异常API调用

## 📊 API性能优化

### 1. 请求优化
- 使用分页减少数据量
- 支持字段选择（fields参数）
- 实施数据缓存
- 启用Gzip压缩

### 2. 响应优化
```http
GET /api/questions?fields=id,content,options&page=1&limit=10
```
```json
{
    "success": true,
    "data": {
        "questions": [
            {
                "id": 1,
                "content": "题目内容",
                "options": ["A", "B", "C", "D"]
            }
        ]
    }
}
```

### 3. 缓存策略
```http
# 缓存头示例
Cache-Control: public, max-age=3600
ETag: "abc123"
Last-Modified: Wed, 23 Mar 2025 10:00:00 GMT
```

## 🚨 错误处理

### 1. 错误码说明

| 错误码 | 说明 | HTTP状态码 |
|--------|------|------------|
| AUTH_001 | 认证失败 | 401 |
| AUTH_002 | 令牌过期 | 401 |
| AUTH_003 | 权限不足 | 403 |
| VALIDATION_001 | 参数验证失败 | 400 |
| VALIDATION_002 | 文件类型不支持 | 400 |
| VALIDATION_003 | 文件大小超限 | 400 |
| DATABASE_001 | 数据库连接失败 | 500 |
| DATABASE_002 | 查询失败 | 500 |
| NOT_FOUND_001 | 资源不存在 | 404 |
| RATE_LIMIT_001 | 请求频率超限 | 429 |

### 2. 错误响应示例
```json
{
    "success": false,
    "message": "用户名或密码错误",
    "errorCode": "AUTH_001",
    "timestamp": "2025-03-23T10:00:00Z",
    "details": {
        "field": "password",
        "reason": "密码不匹配"
    }
}
```

### 3. 错误处理建议
1. **客户端处理**：检查success字段，处理错误情况
2. **重试机制**：对于临时错误实施重试
3. **降级策略**：在API不可用时使用本地缓存
4. **用户提示**：友好地提示用户错误信息

## 🔍 调试和测试

### 1. API调试工具
- **Postman**：API测试和文档生成
- **curl**：命令行测试工具
- **浏览器开发者工具**：网络请求监控

### 2. 测试脚本示例
```bash
#!/bin/bash

# API测试脚本
BASE_URL="http://localhost:3001/api"

echo "🔍 开始测试PSCG API"
echo "========================"

# 测试健康检查
echo "1. 测试健康检查..."
curl -s "$BASE_URL/performance/health" | jq '.data.status'

# 测试获取学科列表
echo "2. 测试获取学科列表..."
curl -s "$BASE_URL/subjects?page=1&limit=5" | jq '.data.subjects | length'

# 测试缓存统计
echo "3. 测试缓存统计..."
curl -s "$BASE_URL/cache/stats" | jq '.data.hitRate'

echo "✅ 测试完成"
```

### 3. 监控API性能
```bash
# 监控API响应时间
curl -w "\n响应时间统计:\n总时间: %{time_total}s\n" \
  -o /dev/null -s "http://localhost:3001/api/performance/health"

# 监控API可用性
while true; do
    curl -s -o /dev/null -w "%{http_code}\n" \
      "http://localhost:3001/api/performance/health"
    sleep 5
done
```

## 📈 API版本管理

### 1. 版本控制策略
- **URL版本控制**：`/api/v1/subjects`
- **头部版本控制**：`Accept: application/vnd.pscg.v1+json`
- **查询参数版本**：`/api/subjects?v=1`

### 2. 向后兼容
- 不删除现有字段
- 新增字段可选
- 弃用字段标记为deprecated
- 提供迁移指南

### 3. 版本发布计划
- **v1.0**：基础功能（当前版本）
- **v1.1**：性能优化和新功能
- **v2.0**：重大架构升级

## 🔮 未来API扩展

### 1. 计划功能
- **WebSocket API**：实时通知和聊天
- **GraphQL API**：灵活的数据查询
- **Webhook**：事件通知
- **OAuth 2.0**：第三方认证

### 2. 第三方集成
- **学习平台集成**：与现有教育平台对接
- **数据分析工具**：集成BI工具
- **消息推送**：集成消息推送服务

### 3. 开发者生态
- **API文档**：自动生成和在线查看
- **SDK开发**：提供多语言SDK
- **开发者门户**：开发者资源和管理

---

**最后更新**：2025年3月23日  
**版本**：v1.0.0  
**API版本**：v1

> 💡 **提示**：建议使用API客户端库进行开发，遵循最佳实践，确保应用的安全性和性能。