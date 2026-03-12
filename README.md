# 小学刷题闯关系统

## 项目简介

小学刷题闯关系统是一款专为小学生设计的在线学习平台，通过多样化的题目类型和直观的界面，帮助学生巩固知识、提高学习兴趣。系统支持多种题目类型，包括单选题、多选题、判断题、听力题、阅读题和看图题，满足不同学科的教学需求。

## 技术栈

- **前端**：Vue 3 + Composition API、Element Plus、Vue Quill (富文本编辑器)、ECharts (数据可视化)
- **后端**：Node.js、Express、SQLite
- **构建工具**：Vite
- **进程管理**：PM2

## 核心功能

### 1. 后台管理系统
- **学科与子分类管理**：支持添加、编辑、删除学科和子分类，支持图标选择
- **题目管理**：支持添加、编辑、删除题目
- **批量添加题目**：支持从文本批量导入题目，自动解析题目内容、选项和答案
- **富文本编辑器**：支持文本格式化、图片插入等功能
- **音频管理**：支持音频文件上传、播放和删除
- **图片管理**：支持图片上传和显示
- **题目列表**：直观显示题目信息，包括图片和音频指示器
- **数据库管理**：支持数据备份、恢复和导出
- **错误率分析**：展示错误率较高的题目，支持分页和筛选

### 2. 学生答题系统
- **题目展示**：清晰展示题目内容、选项和多媒体资源
- **音频播放**：支持听力题音频播放
- **图片显示**：支持题目和答案中的图片显示
- **答题功能**：支持多种题型的答题操作
- **错题回顾**：答题完成后显示错题并提供解析

### 3. 排行榜系统
- **个人成绩**：展示学生个人答题记录和成绩
- **班级排行榜**：按班级展示学生成绩排名
- **学科排行榜**：按学科展示学生成绩排名
- **筛选功能**：支持按年级、班级、学科进行筛选

## 环境变量配置

项目使用环境变量来管理API地址，方便在不同环境间切换：

### 开发环境 (`env.development`)
```
VITE_API_URL=http://localhost:3001/api
```

### 生产环境 (`env.production`)
```
VITE_API_URL=http://您的域名:3001/api
```

## 安装与运行

### 开发环境

1. **克隆仓库**
   ```bash
   git clone <仓库地址>
   cd web2.0
   ```

2. **安装项目依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   - 前端：`npm run dev`
   - 后端：`npm run server`

4. **数据库说明**
   - 数据库文件 `quiz.db` 已包含在项目中
   - 首次运行时会自动创建必要的表结构
   - 已添加外键约束，确保数据一致性

5. **访问项目**
   - 前端：`http://localhost:5173`
   - 后端：`http://localhost:3001`
   - 后台管理：`http://localhost:5173/admin`
   - 排行榜页面：`http://localhost:5173/leaderboard`

### 生产环境部署

1. **上传项目文件**
   - 将项目文件上传到服务器
   - 确保 `audio/` 和 `images/` 目录存在且有写入权限

2. **安装项目依赖**
   ```bash
   cd /www/wwwroot/您的域名
   npm install
   ```

3. **构建前端**
   ```bash
   npm run build
   ```

4. **启动服务**
   ```bash
   # 使用PM2启动服务
   pm2 start server.cjs --name "quiz-app"
   
   # 保存PM2配置
   pm2 save
   
   # 设置PM2自启动
   pm2 startup
   ```

5. **配置 Nginx 反向代理**
   - 目标 URL：`http://127.0.0.1:3001`

6. **访问项目**
   - 前端：`http://您的域名`
   - 后台：`http://您的域名/admin`
   - 排行榜：`http://您的域名/leaderboard`

## 项目结构

```
web2.0/
├── src/                # 前端源码
│   ├── views/          # 页面组件
│   │   ├── AdminView.vue     # 后台管理页面
│   │   ├── StudentView.vue   # 学生答题页面
│   │   └── LeaderboardView.vue # 排行榜页面
│   ├── stores/         # 状态管理
│   │   └── questionStore.js  # 题目状态管理
│   ├── utils/          # 工具函数
│   │   └── database.js        # API 调用工具
│   ├── router/         # 路由配置
│   │   └── index.js           # 路由定义
│   ├── assets/         # 静态资源
│   ├── App.vue         # 根组件
│   ├── main.js         # 入口文件
│   └── style.css       # 全局样式
├── public/             # 静态资源
├── server.cjs          # 后端服务器
├── package.json        # 项目配置
├── .env.development    # 开发环境配置
├── .env.production     # 生产环境配置
├── vite.config.js      # Vite 配置
└── quiz.db             # SQLite 数据库
```

## 批量添加题目格式

批量添加题目支持以下格式：

```
1. 题目内容(A)
A. 选项1
B. 选项2
C. 选项3
D. 选项4

2. 题目内容(B)
A. 选项1
B. 选项2
C. 选项3
D. 选项4
```

- 支持带编号的题目（如：1. 题目内容(A)）
- 支持无编号的题目（如：题目内容(A)）
- 支持多行题目内容
- 支持中英文答案格式（如：(A) 或 (a)）

## API文档

### 1. 数据管理相关

#### 1.1 数据备份
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

#### 1.2 数据恢复
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

#### 1.3 数据导出
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

#### 1.4 清空所有数据
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

#### 1.5 清空用户答题记录
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

### 2. 设置相关

#### 2.1 获取设置
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

#### 2.2 更新设置
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

### 3. 学科管理

#### 3.1 获取所有学科
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

#### 3.2 获取学科的子分类
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

### 4. 题目管理

#### 4.1 获取题目列表
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

### 5. 年级管理

#### 5.1 获取年级列表
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

#### 5.2 添加年级
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

#### 5.3 更新年级
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

#### 5.4 删除年级
- **请求方法**：DELETE
- **API路径**：`/api/grades/:id`
- **功能**：删除年级
- **响应**：
  ```json
  {
    "success": true
  }
  ```

#### 5.5 初始化年级数据
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

#### 5.6 清空年级数据
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

### 6. 班级管理

#### 6.1 获取班级列表
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

#### 6.2 添加班级
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

#### 6.3 更新班级
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

#### 6.4 删除班级
- **请求方法**：DELETE
- **API路径**：`/api/classes/:id`
- **功能**：删除班级
- **响应**：
  ```json
  {
    "success": true
  }
  ```

#### 6.5 初始化班级数据
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

#### 6.6 清空班级数据
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

### 7. 排行榜相关

#### 7.1 获取全局排行榜
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

#### 7.2 获取学科排行榜
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

#### 7.3 清空排行榜数据
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

### 8. 答题记录相关

#### 8.1 获取所有答题记录
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

#### 8.2 获取用户答题记录
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

### 9. 题目尝试记录相关

#### 9.1 获取用户题目尝试记录
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

### 10. 错误率分析相关

#### 10.1 获取错误率较高的题目
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

### 11. 数据分析相关

#### 11.1 获取数据分析数据
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

### 12. 用户统计相关

#### 12.1 获取用户统计数据
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

### 13. 文件上传相关

#### 13.1 上传音频文件
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

#### 13.2 上传图片文件
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

#### 13.3 上传DataURL
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

## 注意事项

- 确保服务器端口 3001 未被占用
- 检查防火墙设置，确保端口 3001 可以访问
- 定期备份 `quiz.db` 数据库文件
- 如遇到问题，可查看 PM2 日志排查错误：`pm2 logs quiz-app`
- 如需更改API地址，只需修改对应环境的 `.env` 文件

## 常见问题

### 1. 前端无法连接到后端
- 检查API地址配置是否正确
- 确保后端服务正在运行
- 检查防火墙设置

### 2. 图片上传失败
- 确保 `images/` 目录存在且有写入权限
- 检查服务器磁盘空间
- 检查文件类型是否符合要求（支持JPEG、PNG、GIF、WebP）

### 3. 音频播放失败
- 确保 `audio/` 目录存在且有写入权限
- 检查音频文件格式是否正确（支持MP3、WAV、OGG）

### 4. 批量添加题目解析失败
- 检查题目格式是否正确
- 确保题目内容、选项和答案格式符合要求

### 5. 排行榜数据不显示
- 确保学生已完成答题
- 检查数据库中是否有答题记录

## 安全配置

- **文件上传**：已添加文件类型白名单和大小限制（最大10MB）
- **数据库**：已添加外键约束，确保数据一致性
- **CORS**：已配置CORS中间件，支持跨域请求

## 许可证

MIT