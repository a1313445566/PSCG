# PSCG - 智能题库系统

## 项目简介

PSCG (Primary School Comprehensive Quiz) 是一个面向小学教育的智能题库系统，提供学生答题、错题管理、学习分析等功能，同时支持管理员进行题目管理、数据分析等操作。

## 开源仓库

- **GitHub**: https://github.com/a1313445566/PSCG
- **Gitee**: https://gitee.com/a1313445566_admin/PSCG

## 技术栈

### 前端
- Vue 3 + Composition API
- Element Plus UI 组件库
- Pinia 状态管理
- Vue Router 路由管理
- Vite 构建工具
- VisActor (VChart) 数据可视化

### 后端
- Node.js + Express.js
- MySQL 数据库
- JWT 认证
- Multer 文件上传

## 核心功能

### 学生端
- **用户登录**: 支持学号、年级、班级登录
- **学科选择**: 多学科支持，包含子分类
- **智能答题**: 随机抽题、选项乱序、答题计时
- **错题巩固**: 自动收集错题，支持错题复习
- **学习报告**: 个人学习数据统计和分析
- **排行榜**: 查看班级和全局排名

### 管理端
- **题目管理**: 添加、编辑、删除、批量导入题目
- **学科管理**: 管理学科和子分类
- **用户管理**: 管理学生信息
- **数据分析**: 查看学习统计数据
- **AI 助手**: 集成 AI 聊天功能，支持智能分析
- **系统设置**: 配置系统参数

## 项目结构

```
PSCG/
├── src/                          # 前端源码
│   ├── views/                    # 页面视图
│   │   ├── LoginView.vue         # 登录页
│   │   ├── HomeView.vue          # 首页
│   │   ├── QuizView.vue          # 答题页
│   │   ├── ResultView.vue        # 结果页
│   │   ├── AdminView.vue         # 管理后台
│   │   ├── LeaderboardView.vue   # 排行榜
│   │   ├── ErrorBookView.vue     # 错题本
│   │   ├── LearningProgressView.vue  # 学习进度
│   │   └── ...
│   ├── components/               # 组件
│   │   ├── admin/                # 管理端组件
│   │   ├── quiz/                 # 答题组件
│   │   ├── common/               # 通用组件
│   │   └── ...
│   ├── router/                   # 路由配置
│   ├── stores/                   # Pinia 状态管理
│   ├── utils/                    # 工具函数
│   ├── composables/              # 组合式函数
│   └── styles/                   # 样式文件
├── routes/                       # 后端路由
│   ├── questions.js              # 题目路由
│   ├── users.js                  # 用户路由
│   ├── quiz.js                   # 答题路由
│   ├── subjects.js               # 学科路由
│   ├── chat.js                   # AI 聊天路由
│   └── ...
├── services/                     # 后端服务
│   ├── database.js               # 数据库服务
│   ├── chat/                     # AI 聊天服务
│   └── ...
├── middleware/                   # 中间件
│   ├── adminAuth.js              # 管理员认证
│   ├── rateLimit.js              # 速率限制
│   └── ...
├── config/                       # 配置文件
├── migrations/                   # 数据库迁移
├── scripts/                      # 脚本文件
├── server.cjs                    # 服务器入口
└── package.json                  # 项目配置
```

## 快速开始

### 环境要求
- Node.js 16+
- MySQL 8.0+

### 安装依赖
```bash
npm install
```

### 配置数据库
1. 创建 MySQL 数据库
2. 执行数据库迁移脚本
```bash
mysql -u root -p < scripts/db-migration.sql
```

### 配置环境变量
创建 `.env` 文件：
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pscg_db
SERVER_PORT=3001
JWT_SECRET=your_jwt_secret
```

### 启动开发服务器
```bash
# 启动前端
npm run dev

# 启动后端
npm run server
```

访问地址:
- 前端: http://localhost:5173
- 后端: http://localhost:3001

### 生产部署
```bash
# 构建前端
npm run build

# 启动生产服务
npm run server
```

## 数据库表结构

### 核心表
- **users** - 用户表（学生信息）
- **admin_credentials** - 管理员表
- **subjects** - 学科表
- **subcategories** - 子分类表
- **questions** - 题目表
- **quiz_sessions** - 答题会话表
- **quiz_attempts** - 答题记录表
- **error_collection** - 错题收集表
- **chat_sessions** - AI 聊天会话表
- **chat_messages** - AI 聊天消息表

## API 接口

### 主要接口
- `GET /api/subjects` - 获取学科列表
- `GET /api/questions` - 获取题目列表
- `POST /api/quiz/start` - 开始答题
- `POST /api/quiz/submit` - 提交答案
- `GET /api/users` - 获取用户列表
- `POST /api/chat` - AI 聊天

详细 API 文档请参考 `DOCS/API文档/` 目录。

## 批量导入题目

支持通过文本文件批量导入题目，格式如下：

```
1. 题目内容(A)
A. 选项1
B. 选项2
C. 选项3
D. 选项4

【多选】多选题(ABC)
A. 选项1
B. 选项2
C. 选项3
D. 选项4
```

## 项目文档

详细文档请参考 `DOCS/` 目录：
- **API文档** - RESTful API 接口文档
- **技术文档** - 技术架构说明
- **使用指南** - 用户操作指南
- **开发文档** - 开发环境搭建和编码规范
- **部署文档** - 系统部署指南

## 开发规范

- 前端使用 Vue 3 Composition API + `<script setup>` 语法
- 代码风格遵循 ESLint + Prettier 配置
- 提交前运行 `npm run lint` 和 `npm run format`

## 许可证

MIT
