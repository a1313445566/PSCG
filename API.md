# API 文档

## 1. 数据管理相关

### 1.1 数据备份
- **请求方法**：POST
- **API路径**：`/api/data/backup`
- **功能**：备份所有数据到JSON文件
- **响应**：
  ```json
  {
    "success": true,
    "data": {"subjects": [...], "subcategories": [...], "questions": [...], "users": [...], "answer_records": [...], "question_attempts": [...]}
  }
  ```

### 1.2 数据恢复
- **请求方法**：POST
- **API路径**：`/api/data/restore`
- **请求体**：
  ```json
  {
    "data": {"subjects": [...], "subcategories": [...], "questions": [...], "users": [...], "answer_records": [...], "question_attempts": [...]}
  }
  ```
- **功能**：从JSON文件恢复数据
- **响应**：
  ```json
  {
    "success": true,
    "message": "数据恢复成功"
  }
  ```

### 1.3 数据导出
- **请求方法**：GET
- **API路径**：`/api/data/export`
- **功能**：导出所有数据为JSON文件
- **响应**：
  ```json
  {
    "success": true,
    "data": {"subjects": [...], "subcategories": [...], "questions": [...], "users": [...], "answer_records": [...]}
  }
  ```

### 1.4 清空所有数据
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

### 1.5 清空用户答题记录
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

## 2. 设置相关

### 2.1 获取设置
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

### 2.2 更新设置
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

## 3. 学科管理

### 3.1 获取所有学科
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

### 3.2 获取学科的子分类
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

## 4. 题目管理

### 4.1 获取题目列表
- **请求方法**：GET
- **API路径**：`/api/questions`
- **查询参数**：
  - `subjectId`：学科ID
  - `subcategoryId`：子分类ID
  - `type`：题目类型
  - `page`：页码
  - `limit`：每页数量
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
      "createdAt": "2023-10-01 10:00:00"
    },
    ...
  ]
  ```

### 4.2 添加题目
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
    "correctAnswer": "A",
    "explanation": "解析",
    "audio": "audio/file.mp3",
    "image": "images/file.jpg"
  }
  ```
- **功能**：添加新题目
- **响应**：
  ```json
  {
    "success": true,
    "id": 1
  }
  ```

### 4.3 更新题目
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
    "correctAnswer": "A",
    "explanation": "解析",
    "audio": "audio/file.mp3",
    "image": "images/file.jpg"
  }
  ```
- **功能**：更新题目信息
- **响应**：
  ```json
  {
    "success": true
  }
  ```

### 4.4 删除题目
- **请求方法**：DELETE
- **API路径**：`/api/questions/:id`
- **功能**：删除题目
- **响应**：
  ```json
  {
    "success": true
  }
  ```

## 5. 年级管理

### 5.1 获取年级列表
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

### 5.2 添加年级
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

### 5.3 更新年级
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
    "success": true
  }
  ```

### 5.4 删除年级
- **请求方法**：DELETE
- **API路径**：`/api/grades/:id`
- **功能**：删除年级
- **响应**：
  ```json
  {
    "success": true
  }
  ```

### 5.5 初始化年级数据
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

### 5.6 清空年级数据
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

## 6. 班级管理

### 6.1 获取班级列表
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

### 6.2 添加班级
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

### 6.3 更新班级
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
    "success": true
  }
  ```

### 6.4 删除班级
- **请求方法**：DELETE
- **API路径**：`/api/classes/:id`
- **功能**：删除班级
- **响应**：
  ```json
  {
    "success": true
  }
  ```

### 6.5 初始化班级数据
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

### 6.6 清空班级数据
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

## 7. 排行榜相关

### 7.1 获取全局排行榜
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
      "avg_accuracy": 90
    },
    ...
  ]
  ```

### 7.2 获取学科排行榜
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
      "avg_accuracy": 80
    },
    ...
  ]
  ```

### 7.3 清空排行榜数据
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

## 8. 答题记录相关

### 8.1 获取所有答题记录
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

### 8.2 获取用户答题记录
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

## 9. 题目尝试记录相关

### 9.1 获取用户题目尝试记录
- **请求方法**：GET
- **API路径**：`/api/question-attempts/:userId`
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

## 10. 错误率分析相关

### 10.1 获取错误率较高的题目
- **请求方法**：GET
- **API路径**：`/api/error-prone-questions`
- **查询参数**：
  - `subjectId`：学科ID
  - `grade`：年级
  - `class`：班级
  - `subcategoryIds`：子分类ID列表
- **功能**：获取错误率较高的题目
- **响应**：
  ```json
  [
    {
      "id": 1,
      "subject_id": 1,
      "content": "题目内容",
      "type": "single",
      "total_attempts": 10,
      "correct_count": 2,
      "subject_name": "语文"
    },
    ...
  ]
  ```

## 11. 数据分析相关

### 11.1 获取数据分析数据
- **请求方法**：GET
- **API路径**：`/api/analysis`
- **查询参数**：
  - `studentId`：学生ID
  - `grade`：年级
  - `class`：班级
  - `subjectId`：学科ID
  - `subcategoryIds`：子分类ID列表
  - `startDate`：开始日期
  - `endDate`：结束日期
- **功能**：获取数据分析数据
- **响应**：
  ```json
  {
    "subjectStats": [...],
    "gradeStats": [...],
    "classStats": [...],
    "trendStats": [...]
  }
  ```

### 11.2 下载分析报告
- **请求方法**：GET
- **API路径**：`/api/analysis/download`
- **查询参数**：
  - 同 `/api/analysis`
- **功能**：下载Excel格式的分析报告
- **响应**：Excel文件

## 12. 用户统计相关

### 12.1 获取用户统计数据
- **请求方法**：GET
- **API路径**：`/api/user-stats/:userId`
- **功能**：获取指定用户的统计数据
- **响应**：
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
      },
      ...
    ]
  }
  ```

## 13. 文件上传相关

### 13.1 上传音频文件
- **请求方法**：POST
- **API路径**：`/api/upload-audio`
- **请求体**：FormData，包含音频文件
- **功能**：上传音频文件
- **响应**：
  ```json
  {
    "filePath": "audio/file.mp3"
  }
  ```

### 13.2 上传图片文件
- **请求方法**：POST
- **API路径**：`/api/upload-image`
- **请求体**：FormData，包含图片文件
- **功能**：上传图片文件
- **响应**：
  ```json
  {
    "filePath": "images/file.jpg"
  }
  ```

### 13.3 上传DataURL
- **请求方法**：POST
- **API路径**：`/api/upload-data-url`
- **请求体**：
  ```json
  {"dataUrl": "data:image/jpeg;base64,..."}
  ```
- **功能**：上传DataURL格式的图片
- **响应**：
  ```json
  {
    "filePath": "images/file.jpg"
  }
  ```