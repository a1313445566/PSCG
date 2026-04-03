# API调用示例

## API基础信息

- **API 基础 URL**: `http://localhost:3001/api`
- **认证方式**: JWT Token
- **请求格式**: JSON
- **响应格式**: JSON

## 认证示例

### 登录获取Token

```bash
# 使用 curl 登录
curl -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "123456"}'

# 响应示例
# {
#   "code": 200,
#   "msg": "success",
#   "data": {
#     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#     "user": {
#       "id": 1,
#       "username": "admin",
#       "role": "admin"
#     }
#   }
# }
```

### 使用Token访问受保护的接口

```bash
# 使用获取到的token访问接口
curl -X GET "http://localhost:3001/api/questions" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 题目管理示例

### 获取题目列表

```bash
# 获取题目列表，支持分页和筛选
curl -X GET "http://localhost:3001/api/questions?page=1&limit=10&subjectId=1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 响应示例
# {
#   "code": 200,
#   "msg": "success",
#   "data": {
#     "list": [
#       {
#         "id": 1,
#         "subjectId": 1,
#         "content": "1+1=?",
#         "options": ["A. 1", "B. 2", "C. 3", "D. 4"],
#         "answer": "B",
#         "difficulty": "easy",
#         "type": "single"
#       }
#     ],
#     "total": 100,
#     "page": 1,
#     "limit": 10
#   }
# }
```

### 创建题目

```bash
# 创建新题目
curl -X POST "http://localhost:3001/api/questions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "subjectId": 1,
    "content": "2+2=?",
    "options": ["A. 2", "B. 3", "C. 4", "D. 5"],
    "answer": "C",
    "difficulty": "easy",
    "type": "single"
  }'

# 响应示例
# {
#   "code": 200,
#   "msg": "创建成功",
#   "data": {
#     "id": 2,
#     "subjectId": 1,
#     "content": "2+2=?",
#     "options": ["A. 2", "B. 3", "C. 4", "D. 5"],
#     "answer": "C",
#     "difficulty": "easy",
#     "type": "single"
#   }
# }
```

### 更新题目

```bash
# 更新题目
curl -X PUT "http://localhost:3001/api/questions/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "content": "1+1=?",
    "answer": "B"
  }'

# 响应示例
# {
#   "code": 200,
#   "msg": "更新成功",
#   "data": {
#     "id": 1,
#     "subjectId": 1,
#     "content": "1+1=?",
#     "options": ["A. 1", "B. 2", "C. 3", "D. 4"],
#     "answer": "B",
#     "difficulty": "easy",
#     "type": "single"
#   }
# }
```

### 删除题目

```bash
# 删除题目
curl -X DELETE "http://localhost:3001/api/questions/1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 响应示例
# {
#   "code": 200,
#   "msg": "删除成功",
#   "data": null
# }
```

## 答题示例

### 开始答题

```bash
# 开始答题
curl -X POST "http://localhost:3001/api/quiz/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "subjectId": 1,
    "difficulty": "easy",
    "count": 10
  }'

# 响应示例
# {
#   "code": 200,
#   "msg": "success",
#   "data": {
#     "quizId": "123456",
#     "questions": [
#       {
#         "id": 1,
#         "content": "1+1=?",
#         "options": ["A. 1", "B. 2", "C. 3", "D. 4"],
#         "difficulty": "easy",
#         "type": "single"
#       }
#     ]
#   }
# }
```

### 提交答案

```bash
# 提交答案
curl -X POST "http://localhost:3001/api/quiz/submit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "quizId": "123456",
    "answers": [
      {
        "questionId": 1,
        "answer": "B",
        "timeSpent": 5
      }
    ]
  }'

# 响应示例
# {
#   "code": 200,
#   "msg": "success",
#   "data": {
#     "score": 100,
#     "correctCount": 1,
#     "wrongCount": 0,
#     "totalCount": 1,
#     "timeSpent": 5,
#     "details": [
#       {
#         "questionId": 1,
#         "userAnswer": "B",
#         "correctAnswer": "B",
#         "isCorrect": true,
#         "timeSpent": 5
#       }
#     ]
#   }
# }
```

## 统计示例

### 获取用户统计

```bash
# 获取用户统计
curl -X GET "http://localhost:3001/api/statistics/user/1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 响应示例
# {
#   "code": 200,
#   "msg": "success",
#   "data": {
#     "userId": 1,
#     "username": "student1",
#     "totalQuizzes": 10,
#     "totalScore": 850,
#     "averageScore": 85,
#     "correctRate": 0.85,
#     "subjectStats": [
#       {
#         "subjectId": 1,
#         "subjectName": "数学",
#         "totalQuizzes": 5,
#         "averageScore": 90,
#         "correctRate": 0.9
#       }
#     ]
#   }
# }
```

### 获取班级统计

```bash
# 获取班级统计
curl -X GET "http://localhost:3001/api/statistics/class/1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 响应示例
# {
#   "code": 200,
#   "msg": "success",
#   "data": {
#     "classId": 1,
#     "className": "一班",
#     "totalStudents": 20,
#     "averageScore": 82,
#     "highestScore": 100,
#     "lowestScore": 60,
#     "studentStats": [
#       {
#         "userId": 1,
#         "username": "student1",
#         "averageScore": 90,
#         "rank": 1
#       }
#     ]
#   }
# }
```

## AI 接口示例

### 智能分析

```bash
# 智能分析
curl -X POST "http://localhost:3001/api/ai/analysis" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "userId": 1,
    "subjectId": 1
  }'

# 响应示例
# {
#   "code": 200,
#   "msg": "success",
#   "data": {
#     "userId": 1,
#     "subjectId": 1,
#     "strengths": ["加法", "减法"],
#     "weaknesses": ["乘法", "除法"],
#     "recommendations": [
#       "建议多练习乘法口诀",
#       "加强除法运算练习"
#     ],
#     "learningPath": [
#       "乘法基础",
#       "除法基础",
#       "混合运算"
#     ]
#   }
# }
```

### AI 聊天

```bash
# AI 聊天
curl -X POST "http://localhost:3001/api/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "message": "如何解决这个数学题：2+3*4=?",
    "context": []
  }'

# 响应示例
# {
#   "code": 200,
#   "msg": "success",
#   "data": {
#     "response": "根据运算顺序，先计算乘法，再计算加法。3*4=12，然后2+12=14，所以答案是14。",
#     "tokens": {
#       "prompt": 20,
#       "completion": 30,
#       "total": 50
#     }
#   }
# }
```

## 前端调用示例

### 使用 axios 调用 API

```javascript
import axios from 'axios';

// 创建 axios 实例
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器，添加 token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 登录
async function login(username, password) {
  try {
    const response = await api.post('/auth/login', {
      username,
      password
    });
    if (response.data.code === 200) {
      localStorage.setItem('token', response.data.data.token);
      return response.data.data;
    }
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
}

// 获取题目列表
async function getQuestions(params) {
  try {
    const response = await api.get('/questions', { params });
    return response.data.data;
  } catch (error) {
    console.error('获取题目失败:', error);
    throw error;
  }
}

// 提交答案
async function submitAnswers(quizId, answers) {
  try {
    const response = await api.post('/quiz/submit', {
      quizId,
      answers
    });
    return response.data.data;
  } catch (error) {
    console.error('提交答案失败:', error);
    throw error;
  }
}
```

## 注意事项

1. **认证**: 所有受保护的接口都需要在请求头中添加 `Authorization` 字段
2. **参数验证**: 确保请求参数格式正确，否则会返回 400 错误
3. **错误处理**: 处理 API 调用可能出现的错误，如网络错误、认证失败等
4. **速率限制**: 注意 API 的速率限制，避免频繁调用
5. **数据格式**: 确保请求和响应的数据格式符合 API 要求

## 调试工具

### 使用 Postman 调试 API

1. **创建请求**: 在 Postman 中创建新的请求
2. **设置 URL**: 输入 API 地址，如 `http://localhost:3001/api/questions`
3. **设置方法**: 选择适当的 HTTP 方法（GET, POST, PUT, DELETE）
4. **设置 headers**: 添加 `Content-Type: application/json` 和 `Authorization: Bearer {token}`
5. **设置 body**: 对于 POST 和 PUT 请求，添加 JSON 格式的请求体
6. **发送请求**: 点击「Send」按钮发送请求
7. **查看响应**: 在响应区域查看 API 返回的结果

### 使用 curl 调试 API

```bash
# 查看 curl 版本
curl --version

# 发送 GET 请求
curl -X GET "http://localhost:3001/api/questions"

# 发送 POST 请求
curl -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "123456"}'

# 发送带认证的请求
curl -X GET "http://localhost:3001/api/questions" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 总结

本示例文档提供了 PSCG 智能题库系统 API 的基本调用方法，包括认证、题目管理、答题、统计和 AI 接口等功能。通过这些示例，您可以快速上手使用系统的 API，开发自己的应用或集成到其他系统中。