# PSCG API 文档

## 1. 概述

本文档详细描述了 PSCG 智能题库系统的所有 API 端点，包括请求方法、路径、参数、响应格式等信息。系统采用 RESTful API 设计风格，使用 JSON 格式进行数据交换。

## 2. 基础信息

### 2.1 API 基础路径
- 开发环境：`http://localhost:3001/api`
- 生产环境：`http://您的域名:3001/api`

### 2.2 响应格式
- 成功响应：
  ```json
  {
    "success": true,
    "data": {...}
  }
  ```

- 错误响应：
  ```json
  {
    "success": false,
    "message": "错误信息"
  }
  ```

## 3. 数据管理 API

### 3.1 数据备份
- **请求方法**：POST
- **API路径**：`/api/data/backup`
- **功能**：备份所有数据到JSON文件，包括音频和图片文件
- **响应**：
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

### 3.2 数据恢复
- **请求方法**：POST
- **API路径**：`/api/data/restore`
- **请求体**：
  ```json
  {
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
- **功能**：从JSON文件恢复数据，包括音频和图片文件
- **响应**：
  ```json
  {
    "success": true,
    "message": "数据恢复成功"
  }
  ```

### 3.3 数据导出
- **请求方法**：GET
- **API路径**：`/api/data/export`
- **功能**：导出所有数据为JSON文件
- **响应**：
  ```json
  {
    "success": true,
    "data": {"subjects": [...], "subcategories": [...], "questions": [...], "users": [...], "answer_records": [...], "question_attempts": [...]}
  }
  ```

### 3.4 清空所有数据
- **请求方法**：POST
- **API路径**：`/api/data/clear-all`
- **功能**：清空所有数据
- **响应**：
  ```json
  {
    "success": true,
    "message": "所有数据清空成功"
  }
  ```

### 3.5 清空用户答题记录
- **请求方法**：POST
- **API路径**：`/api/data/clear-records`
- **功能**：清空用户答题记录
- **响应**：
  ```json
  {
    "success": true,
    "message": "用户答题记录清空成功"
  }
  ```

## 4. 设置 API

### 4.1 获取设置
- **请求方法**：GET
- **API路径**：`/api/settings`
- **功能**：获取系统设置
- **响应**：
  ```json
  {
    "randomizeAnswers": "true",
    "fixedQuestionCount": "false",
    "minQuestionCount": "3",
    "maxQuestionCount": "5",
    "fixedQuestionCountValue": "3"
  }
  ```

### 4.2 更新设置
- **请求方法**：POST
- **API路径**：`/api/settings`
- **请求体**：
  ```json
  {
    "randomizeAnswers": "true",
    "fixedQuestionCount": "false",
    "minQuestionCount": "3",
    "maxQuestionCount": "5",
    "fixedQuestionCountValue": "3"
  }
  ```
- **功能**：更新系统设置
- **响应**：
  ```json
  {
    "success": true,
    "message": "设置保存成功"
  }
  ```

## 5. 学科管理 API

### 5.1 获取所有学科
- **请求方法**：GET
- **API路径**：`/api/subjects`
- **功能**：获取所有学科及其子分类
- **响应**：
  ```json
  [
    {
      "id": 1,
      "name": "语文",
      "iconIndex": 0,
      "subcategories": [...]
    },
    ...
  ]
  ```

### 5.2 获取学科的子分类
- **请求方法**：GET
- **API路径**：`/api/subjects/:id/subcategories`
- **功能**：获取指定学科的子分类
- **响应**：
  ```json
  [
    {
      "id": 1,
      "name": "基础知识",
      "iconIndex": 0
    },
    ...
  ]
  ```

### 5.3 添加学科
- **请求方法**：POST
- **API路径**：`/api/subjects`
- **请求体**：
  ```json
  {
    "name": "数学",
    "iconIndex": 1
  }
  ```
- **功能**：添加新学科
- **响应**：
  ```json
  {
    "id": 1,
    "name": "数学",
    "iconIndex": 1
  }
  ```

### 5.4 更新学科
- **请求方法**：PUT
- **API路径**：`/api/subjects/:id`
- **请求体**：
  ```json
  {
    "name": "数学",
    "iconIndex": 2
  }
  ```
- **功能**：更新学科信息
- **响应**：
  ```json
  {
    "success": true,
    "message": "学科更新成功"
  }
  ```

### 5.5 删除学科
- **请求方法**：DELETE
- **API路径**：`/api/subjects/:id`
- **功能**：删除学科
- **响应**：
  ```json
  {
    "success": true,
    "message": "学科删除成功"
  }
  ```

## 6. 题库管理 API

### 6.1 添加题库
- **请求方法**：POST
- **API路径**：`/api/subcategories`
- **请求体**：
  ```json
  {
    "subjectId": 1,
    "name": "基础知识",
    "iconIndex": 0,
    "difficulty": 1
  }
  ```
- **功能**：添加新题库
- **响应**：
  ```json
  {
    "id": 1,
    "subjectId": 1,
    "name": "基础知识",
    "iconIndex": 0,
    "difficulty": 1
  }
  ```

### 6.2 更新题库
- **请求方法**：PUT
- **API路径**：`/api/subcategories/:id`
- **请求体**：
  ```json
  {
    "name": "基础知识",
    "iconIndex": 1,
    "difficulty": 2
  }
  ```
- **功能**：更新题库信息
- **响应**：
  ```json
  {
    "success": true,
    "message": "题库更新成功"
  }
  ```

### 6.3 删除题库
- **请求方法**：DELETE
- **API路径**：`/api/subcategories/:id`
- **功能**：删除题库
- **响应**：
  ```json
  {
    "success": true,
    "message": "题库删除成功"
  }
  ```

## 7. 题目管理 API

### 7.1 获取题目列表
- **请求方法**：GET
- **API路径**：`/api/questions`
- **查询参数**：
  - `subjectId`：学科ID
  - `subcategoryId`：题库ID
  - `type`：题目类型
  - `page`：页码
  - `limit`：每页数量
  - `difficulty`：难度等级
- **功能**：获取题目列表
- **响应**：
  ```json
  [
    {
      "id": 1,
      "subjectId": 1,
      "subcategoryId": 1,
      "type": "single",
      "content": "题目内容",
      "options": ["选项1", "选项2", "选项3", "选项4"],
      "answer": "A",
      "explanation": "解析",
      "audio": "audio/file.mp3",
      "image": "images/file.jpg",
      "difficulty": 1,
      "createdAt": "2023-10-01 10:00:00"
    },
    ...
  ]
  ```

### 7.2 添加题目
- **请求方法**：POST
- **API路径**：`/api/questions`
- **请求体**：
  ```json
  {
    "subjectId": 1,
    "subcategoryId": 1,
    "type": "single",
    "content": "题目内容",
    "options": ["选项1", "选项2", "选项3", "选项4"],
    "answer": "A",
    "explanation": "解析",
    "audio": "audio/file.mp3",
    "image": "images/file.jpg",
    "difficulty": 1
  }
  ```
- **功能**：添加新题目
- **响应**：
  ```json
  {
    "id": 1,
    "subjectId": 1,
    "subcategoryId": 1,
    "type": "single",
    "content": "题目内容",
    "options": ["选项1", "选项2", "选项3", "选项4"],
    "answer": "A",
    "explanation": "解析",
    "audio": "audio/file.mp3",
    "image": "images/file.jpg",
    "difficulty": 1,
    "createdAt": "2023-10-01 10:00:00"
  }
  ```

### 7.3 更新题目
- **请求方法**：PUT
- **API路径**：`/api/questions/:id`
- **请求体**：
  ```json
  {
    "subjectId": 1,
    "subcategoryId": 1,
    "type": "single",
    "content": "题目内容",
    "options": ["选项1", "选项2", "选项3", "选项4"],
    "answer": "A",
    "explanation": "解析",
    "audio": "audio/file.mp3",
    "image": "images/file.jpg",
    "difficulty": 2
  }
  ```
- **功能**：更新题目信息
- **响应**：
  ```json
  {
    "id": 1,
    "subjectId": 1,
    "subcategoryId": 1,
    "type": "single",
    "content": "题目内容",
    "options": ["选项1", "选项2", "选项3", "选项4"],
    "answer": "A",
    "explanation": "解析",
    "audio": "audio/file.mp3",
    "image": "images/file.jpg",
    "difficulty": 2,
    "createdAt": "2023-10-01 10:00:00"
  }
  ```

### 7.4 删除题目
- **请求方法**：DELETE
- **API路径**：`/api/questions/:id`
- **功能**：删除题目
- **响应**：
  ```json
  {
    "success": true,
    "message": "题目删除成功"
  }
  ```

### 7.5 批量导入题目
- **请求方法**：POST
- **API路径**：`/api/questions/import`
- **请求体**：
  ```json
  {
    "subjectId": 1,
    "subcategoryId": 1,
    "content": "1. 题目内容(A)\nA. 选项1\nB. 选项2\nC. 选项3\nD. 选项4"
  }
  ```
- **功能**：批量导入题目
- **响应**：
  ```json
  {
    "success": true,
    "message": "导入成功，共导入10题",
    "importedCount": 10
  }
  ```

## 8. 年级管理 API

### 8.1 获取年级列表
- **请求方法**：GET
- **API路径**：`/api/grades`
- **功能**：获取所有年级
- **响应**：
  ```json
  [
    {"id": 1, "name": "1年级"},
    {"id": 2, "name": "2年级"},
    ...
  ]
  ```

### 8.2 添加年级
- **请求方法**：POST
- **API路径**：`/api/grades`
- **请求体**：
  ```json
  {"name": "3年级"}
  ```
- **功能**：添加新年级
- **响应**：
  ```json
  {"id": 3, "name": "3年级"}
  ```

### 8.3 更新年级
- **请求方法**：PUT
- **API路径**：`/api/grades/:id`
- **请求体**：
  ```json
  {"name": "三年级"}
  ```
- **功能**：更新年级信息
- **响应**：
  ```json
  {
    "success": true,
    "message": "年级更新成功"
  }
  ```

### 8.4 删除年级
- **请求方法**：DELETE
- **API路径**：`/api/grades/:id`
- **功能**：删除年级
- **响应**：
  ```json
  {
    "success": true,
    "message": "年级删除成功"
  }
  ```

### 8.5 初始化年级数据
- **请求方法**：POST
- **API路径**：`/api/grades/init`
- **功能**：初始化默认年级数据
- **响应**：
  ```json
  {
    "success": true,
    "message": "年级数据初始化成功"
  }
  ```

### 8.6 清空年级数据
- **请求方法**：POST
- **API路径**：`/api/grades/clear`
- **功能**：清空所有年级数据
- **响应**：
  ```json
  {
    "success": true,
    "message": "年级数据清空成功"
  }
  ```

## 9. 班级管理 API

### 9.1 获取班级列表
- **请求方法**：GET
- **API路径**：`/api/classes`
- **功能**：获取所有班级
- **响应**：
  ```json
  [
    {"id": 1, "name": "1班"},
    {"id": 2, "name": "2班"},
    ...
  ]
  ```

### 9.2 添加班级
- **请求方法**：POST
- **API路径**：`/api/classes`
- **请求体**：
  ```json
  {"name": "3班"}
  ```
- **功能**：添加新班级
- **响应**：
  ```json
  {"id": 3, "name": "3班"}
  ```

### 9.3 更新班级
- **请求方法**：PUT
- **API路径**：`/api/classes/:id`
- **请求体**：
  ```json
  {"name": "三班"}
  ```
- **功能**：更新班级信息
- **响应**：
  ```json
  {
    "success": true,
    "message": "班级更新成功"
  }
  ```

### 9.4 删除班级
- **请求方法**：DELETE
- **API路径**：`/api/classes/:id`
- **功能**：删除班级
- **响应**：
  ```json
  {
    "success": true,
    "message": "班级删除成功"
  }
  ```

### 9.5 初始化班级数据
- **请求方法**：POST
- **API路径**：`/api/classes/init`
- **功能**：初始化默认班级数据
- **响应**：
  ```json
  {
    "success": true,
    "message": "班级数据初始化成功"
  }
  ```

### 9.6 清空班级数据
- **请求方法**：POST
- **API路径**：`/api/classes/clear`
- **功能**：清空所有班级数据
- **响应**：
  ```json
  {
    "success": true,
    "message": "班级数据清空成功"
  }
  ```

## 10. 用户管理 API

### 10.1 获取用户列表
- **请求方法**：GET
- **API路径**：`/api/users`
- **查询参数**：
  - `grade`：年级
  - `class`：班级
- **功能**：获取用户列表
- **响应**：
  ```json
  [
    {
      "id": 1,
      "student_id": "123",
      "name": "张三",
      "grade": "1",
      "class": "1"
    },
    ...
  ]
  ```

### 10.2 添加用户
- **请求方法**：POST
- **API路径**：`/api/users`
- **请求体**：
  ```json
  {
    "student_id": "123",
    "name": "张三",
    "grade": "1",
    "class": "1"
  }
  ```
- **功能**：添加新用户
- **响应**：
  ```json
  {
    "id": 1,
    "student_id": "123",
    "name": "张三",
    "grade": "1",
    "class": "1"
  }
  ```

### 10.3 更新用户
- **请求方法**：PUT
- **API路径**：`/api/users/:id`
- **请求体**：
  ```json
  {
    "name": "张三",
    "grade": "2",
    "class": "1"
  }
  ```
- **功能**：更新用户信息
- **响应**：
  ```json
  {
    "success": true,
    "message": "用户更新成功"
  }
  ```

### 10.4 删除用户
- **请求方法**：DELETE
- **API路径**：`/api/users/:id`
- **功能**：删除用户
- **响应**：
  ```json
  {
    "success": true,
    "message": "用户删除成功"
  }
  ```

### 10.5 获取用户统计
- **请求方法**：GET
- **API路径**：`/api/users/stats/:id`
- **功能**：获取用户统计数据
- **响应**：
  ```json
  {
    "totalSessions": 10,
    "totalQuestions": 50,
    "totalCorrect": 45,
    "avgAccuracy": 90,
    "points": 100,
    "subjectStats": [
      {
        "subject_id": 1,
        "subject_name": "语文",
        "total_sessions": 5,
        "total_questions": 25,
        "correct_count": 20,
        "avg_accuracy": 80
      },
      ...
    ]
  }
  ```

## 11. 答题记录 API

### 11.1 获取所有答题记录
- **请求方法**：GET
- **API路径**：`/api/answer-records/all`
- **查询参数**：
  - `grade`：年级
  - `class`：班级
  - `subjectId`：学科ID
  - `startDate`：开始日期
  - `endDate`：结束日期
  - `limit`：数量限制
- **功能**：获取所有答题记录
- **响应**：
  ```json
  [
    {
      "id": 1,
      "user_id": 1,
      "student_id": "123",
      "name": "张三",
      "grade": "1",
      "class": "1",
      "subject_id": 1,
      "subject_name": "语文",
      "subcategory_id": 1,
      "subcategory_name": "基础知识",
      "total_questions": 10,
      "correct_count": 8,
      "time_spent": 60,
      "created_at": "2023-10-01 10:00:00"
    },
    ...
  ]
  ```

### 11.2 获取用户答题记录
- **请求方法**：GET
- **API路径**：`/api/answer-records/:userId`
- **功能**：获取指定用户的答题记录
- **响应**：
  ```json
  [
    {
      "id": 1,
      "user_id": 1,
      "subject_id": 1,
      "subject_name": "语文",
      "subcategory_id": 1,
      "subcategory_name": "基础知识",
      "total_questions": 10,
      "correct_count": 8,
      "time_spent": 60,
      "created_at": "2023-10-01 10:00:00"
    },
    ...
  ]
  ```

### 11.3 获取用户题目尝试记录
- **请求方法**：GET
- **API路径**：`/api/answer-records/question-attempts/:userId`
- **查询参数**：
  - `answerRecordId`：答题记录ID
- **功能**：获取指定用户的题目尝试记录
- **响应**：
  ```json
  [
    {
      "id": 1,
      "user_id": 1,
      "question_id": 1,
      "content": "题目内容",
      "correct_answer": "B",
      "user_answer": "A",
      "is_correct": 0,
      "subject_name": "语文",
      "subcategory_name": "基础知识",
      "created_at": "2023-10-01 10:00:00"
    },
    ...
  ]
  ```

### 11.4 添加答题记录
- **请求方法**：POST
- **API路径**：`/api/answer-records`
- **请求体**：
  ```json
  {
    "userId": 1,
    "subjectId": 1,
    "subcategoryId": 1,
    "totalQuestions": 10,
    "correctCount": 8,
    "timeSpent": 60,
    "questionAttempts": [
      {
        "questionId": 1,
        "userAnswer": "A",
        "correctAnswer": "B",
        "isCorrect": 0,
        "shuffledOptions": ["选项2", "选项1", "选项4", "选项3"]
      },
      ...
    ]
  }
  ```
- **功能**：添加答题记录
- **响应**：
  ```json
  {
    "success": true,
    "recordId": 1,
    "message": "答题记录保存成功"
  }
  ```

## 12. 难度调整 API

### 12.1 调整题目难度
- **请求方法**：POST
- **API路径**：`/api/difficulty/question/:questionId`
- **功能**：根据错误率自动调整题目难度
- **响应**：
  ```json
  {
    "success": true,
    "message": "难度调整成功",
    "oldDifficulty": 1,
    "newDifficulty": 2,
    "errorRate": 0.75,
    "totalAttempts": 20,
    "questionType": "single"
  }
  ```

### 12.2 批量调整题目难度
- **请求方法**：POST
- **API路径**：`/api/difficulty/batch`
- **功能**：批量调整所有题目的难度
- **响应**：
  ```json
  {
    "success": true,
    "results": [
      {
        "questionId": 1,
        "success": true,
        "message": "难度调整成功",
        "oldDifficulty": 1,
        "newDifficulty": 2
      },
      ...
    ]
  }
  ```

### 12.3 手动设置题目难度
- **请求方法**：PUT
- **API路径**：`/api/difficulty/question/:questionId`
- **请求体**：
  ```json
  {
    "difficulty": 3
  }
  ```
- **功能**：手动设置题目难度
- **响应**：
  ```json
  {
    "success": true,
    "message": "难度设置成功",
    "difficulty": 3
  }
  ```

### 12.4 调整题库难度
- **请求方法**：POST
- **API路径**：`/api/difficulty/subcategory/:subcategoryId`
- **功能**：根据平均错误率自动调整题库难度
- **响应**：
  ```json
  {
    "success": true,
    "message": "题库难度调整成功",
    "subcategoryId": 1,
    "subcategoryName": "基础知识",
    "newDifficulty": 3,
    "avgErrorRate": 0.6
  }
  ```

### 12.5 批量调整题库难度
- **请求方法**：POST
- **API路径**：`/api/difficulty/subcategory/batch`
- **功能**：批量调整所有题库的难度
- **响应**：
  ```json
  {
    "success": true,
    "message": "批量调整题库难度成功",
    "results": [
      {
        "subcategoryId": 1,
        "success": true,
        "message": "题库难度调整成功"
      },
      ...
    ]
  }
  ```

### 12.6 手动设置题库难度
- **请求方法**：PUT
- **API路径**：`/api/difficulty/subcategory/:subcategoryId`
- **请求体**：
  ```json
  {
    "difficulty": 4
  }
  ```
- **功能**：手动设置题库难度
- **响应**：
  ```json
  {
    "success": true,
    "message": "难度设置成功",
    "difficulty": 4
  }
  ```

### 12.7 获取难度分布
- **请求方法**：GET
- **API路径**：`/api/difficulty/distribution`
- **功能**：获取题目难度分布
- **响应**：
  ```json
  {
    "success": true,
    "distribution": [
      {"difficulty": 1, "count": 100},
      {"difficulty": 2, "count": 150},
      {"difficulty": 3, "count": 200},
      {"difficulty": 4, "count": 120},
      {"difficulty": 5, "count": 80}
    ]
  }
  ```

## 13. 排行榜 API

### 13.1 获取全局排行榜
- **请求方法**：GET
- **API路径**：`/api/leaderboard/global`
- **查询参数**：
  - `grade`：年级
  - `class`：班级
  - `limit`：数量限制
- **功能**：获取全局排行榜
- **响应**：
  ```json
  [
    {
      "id": 1,
      "student_id": "123",
      "name": "张三",
      "grade": "1",
      "class": "1",
      "total_sessions": 10,
      "total_questions": 50,
      "correct_count": 45,
      "avg_accuracy": 90,
      "points": 100
    },
    ...
  ]
  ```

### 13.2 获取学科排行榜
- **请求方法**：GET
- **API路径**：`/api/leaderboard/subject/:subjectId`
- **查询参数**：
  - `grade`：年级
  - `class`：班级
- **功能**：获取指定学科的排行榜
- **响应**：
  ```json
  [
    {
      "id": 1,
      "student_id": "123",
      "name": "张三",
      "grade": "1",
      "class": "1",
      "total_sessions": 5,
      "total_questions": 25,
      "correct_count": 20,
      "avg_accuracy": 80,
      "points": 50
    },
    ...
  ]
  ```

### 13.3 清空排行榜数据
- **请求方法**：POST
- **API路径**：`/api/leaderboard/clear`
- **功能**：清空排行榜数据
- **响应**：
  ```json
  {
    "success": true,
    "message": "排行榜数据清空成功"
  }
  ```

## 14. 数据分析 API

### 14.1 获取用户分析
- **请求方法**：GET
- **API路径**：`/api/analysis/user/:id`
- **功能**：获取用户的学习分析数据
- **响应**：
  ```json
  {
    "userId": 1,
    "name": "张三",
    "grade": "1",
    "class": "1",
    "totalSessions": 10,
    "totalQuestions": 50,
    "totalCorrect": 45,
    "avgAccuracy": 90,
    "subjectStats": [
      {
        "subjectId": 1,
        "subjectName": "语文",
        "totalSessions": 5,
        "totalQuestions": 25,
        "correctCount": 20,
        "avgAccuracy": 80
      },
      ...
    ],
    "trendStats": [
      {
        "date": "2023-10-01",
        "accuracy": 80
      },
      ...
    ]
  }
  ```

### 14.2 获取学科分析
- **请求方法**：GET
- **API路径**：`/api/analysis/subject/:id`
- **查询参数**：
  - `grade`：年级
  - `class`：班级
- **功能**：获取学科的分析数据
- **响应**：
  ```json
  {
    "subjectId": 1,
    "subjectName": "语文",
    "totalSessions": 50,
    "totalQuestions": 250,
    "totalCorrect": 200,
    "avgAccuracy": 80,
    "gradeStats": [
      {
        "grade": "1",
        "avgAccuracy": 75
      },
      ...
    ],
    "classStats": [
      {
        "class": "1",
        "avgAccuracy": 85
      },
      ...
    ]
  }
  ```

### 14.3 获取题目分析
- **请求方法**：GET
- **API路径**：`/api/analysis/questions`
- **查询参数**：
  - `subjectId`：学科ID
  - `subcategoryId`：题库ID
- **功能**：获取题目分析数据
- **响应**：
  ```json
  {
    "totalQuestions": 100,
    "difficultyDistribution": [
      {"difficulty": 1, "count": 20},
      ...
    ],
    "errorRateDistribution": [
      {"range": "0-20%", "count": 10},
      ...
    ]
  }
  ```

## 15. 文件上传 API

### 15.1 上传图片文件
- **请求方法**：POST
- **API路径**：`/api/upload/image`
- **请求体**：FormData，包含图片文件
- **功能**：上传图片文件到images目录
- **响应**：
  ```json
  {
    "success": true,
    "url": "images/file.jpg"
  }
  ```

### 15.2 上传音频文件
- **请求方法**：POST
- **API路径**：`/api/upload/audio`
- **请求体**：FormData，包含音频文件
- **功能**：上传音频文件到audio目录
- **响应**：
  ```json
  {
    "success": true,
    "url": "audio/file.mp3"
  }
  ```

## 16. 错误码说明

| 错误码 | 描述 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
| 503 | 服务不可用 |

## 17. 注意事项

1. **请求格式**：所有 POST 和 PUT 请求的请求体必须是 JSON 格式
2. **文件上传**：文件上传使用 FormData 格式
3. **分页参数**：大部分列表接口支持 page 和 limit 参数
4. **时间格式**：日期参数使用 YYYY-MM-DD 格式
5. **编码**：所有响应使用 UTF-8 编码
6. **速率限制**：API 请求频率限制为每分钟 60 次

## 18. 示例请求

### 示例 1：获取所有学科
```bash
curl -X GET "http://localhost:3001/api/subjects"
```

### 示例 2：添加题目
```bash
curl -X POST "http://localhost:3001/api/questions" \
  -H "Content-Type: application/json" \
  -d '{"subjectId": 1, "subcategoryId": 1, "type": "single", "content": "1+1=?", "options": ["1", "2", "3", "4"], "answer": "B", "explanation": "1+1=2"}'
```

### 示例 3：调整题目难度
```bash
curl -X POST "http://localhost:3001/api/difficulty/question/1"
```