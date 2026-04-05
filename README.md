<p align="center">
  <h1 align="center">📚 PSCG - 智能题库系统</h1>
  <p align="center">
    <strong>Primary School Comprehensive Quiz System</strong>
  </p>
  <p align="center">
    <em>面向小学教育的智能题库系统，提供学生答题、错题管理、学习分析等功能</em><br/>
    <em>An intelligent quiz system for primary education with student quiz, error tracking, and learning analytics</em>
  </p>

<p align="center">
  <a href="#-简介">中文</a> •
  <a href="#-introduction">English</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue.svg" alt="Version" />
  <img src="https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg" alt="License: CC BY-NC 4.0" />
  <img src="https://img.shields.io/badge/Node.js-16%2B-green.svg" alt="Node.js" />
  <img src="https://img.shields.io/badge/Vue-3.x-42b883.svg" alt="Vue 3" />
  <img src="https://img.shields.io/badge/MySQL-8.0%2B-4479a1.svg" alt="MySQL" />
</p>
</p>

---

## 📖 简介 | Introduction

### 🇨🇳 中文

**PSCG** (Primary School Comprehensive Quiz) 是一个面向**小学教育**的智能题库系统，旨在通过科技手段提升学生的学习效率和教师的教学质量。

#### ✨ 核心特性

| 学生端功能 | 管理端功能 |
|------------|-----------|
| 🔐 安全登录认证 | 📝 题目管理与批量导入 |
| 🎯 智能随机抽题 | 📊 学习数据可视化分析 |
| ⏱️ 答题计时与选项乱序 | 👥 用户与班级管理 |
| 📈 错题自动收集与巩固 | 🤖 AI 智能助手集成 |
| 🏆 实时排行榜竞争 | ⚙️ 系统参数配置 |

### 🇺🇸 English

**PSCG** (Primary School Comprehensive Quiz) is an **intelligent quiz system** designed for primary education, leveraging technology to enhance student learning efficiency and teaching quality.

#### ✨ Key Features

| Student Features | Admin Features |
|------------------|-----------------|
| 🔐 Secure Login Authentication | 📝 Question Management & Batch Import |
| 🎯 Smart Random Question Selection | 📊 Learning Data Visualization & Analytics |
| ⏱️ Timed Quizzes with Shuffled Options | 👥 User & Class Management |
| 📈 Automatic Error Collection & Review | 🤖 AI Assistant Integration |
| 🏆 Real-time Leaderboard Rankings | ⚙️ System Configuration |

---

## 🛠️ 技术栈 | Tech Stack

### 前端 Frontend

| 技术 Technology | 版本 Version | 用途 Purpose |
|-----------------|--------------|--------------|
| ![Vue](https://img.shields.io/badge/-Vue.js-42b883?style=flat-square&logo=vue.js) | 3.x | 渐进式 JavaScript 框架 |
| ![Element Plus](https://img.shields.io/badge/-Element%20Plus-409eff?style=flat-square) | Latest | UI 组件库 |
| ![Pinia](https://img.shields.io/badge/-Pinia-yellow?style=flat-square) | Latest | 状态管理 |
| ![Vite](https://img.shields.io/badge/-Vite-646cff?style=flat-square) | 5.x | 构建工具 |
| ![VChart](https://img.shields.io/badge/-VChart-1890ff?style=flat-square) | Latest | 数据可视化图表 |

### 后端 Backend

| 技术 Technology | 版本 Version | 用途 Purpose |
|-----------------|--------------|--------------|
| ![Node.js](https://img.shields.io/badge/-Node.js-339933?style=flat-square&logo=node.js) | 16+ | JavaScript 运行时 |
| ![Express](https://img.shields.io/badge/-Express-000000?style=flat-square) | 4.x | Web 应用框架 |
| ![MySQL](https://img.shields.io/badge/-MySQL-4479a1?style=flat-square&logo=mysql) | 8.0+ | 关系型数据库 |
| ![JWT](https://img.shields.io/badge/-JWT-000000?style=flat-square) | - | 身份认证 |
| ![Multer](https://img.shields.io/badge/-Multer-007acc?style=flat-square) | - | 文件上传处理 |

---

## 📁 项目结构 | Project Structure

```
PSCG/
├── src/                              # 前端源码 / Frontend Source
│   ├── views/                        # 页面视图 / Page Views
│   │   ├── LoginView.vue             # 登录页 / Login Page
│   │   ├── HomeView.vue              # 首页 / Home Page
│   │   ├── QuizView.vue              # 答题页 / Quiz Page
│   │   ├── ResultView.vue            # 结果页 / Result Page
│   │   ├── AdminView.vue             # 管理后台 / Admin Dashboard
│   │   ├── LeaderboardView.vue       # 排行榜 / Leaderboard
│   │   └── ErrorBookView.vue         # 错题本 / Error Book
│   ├── components/                   # 组件 / Components
│   │   ├── admin/                    # 管理端组件 / Admin Components
│   │   ├── quiz/                     # 答题组件 / Quiz Components
│   │   └── common/                   # 通用组件 / Common Components
│   ├── router/                       # 路由配置 / Router Config
│   ├── stores/                       # Pinia 状态管理 / State Management
│   ├── utils/                        # 工具函数 / Utilities
│   └── styles/                       # 样式文件 / Stylesheets
├── routes/                           # 后端路由 / Backend Routes
├── services/                         # 后端服务 / Backend Services
├── middleware/                       # 中间件 / Middleware
├── config/                           # 配置文件 / Configuration
├── migrations/                       # 数据库迁移 / DB Migrations
├── scripts/                          # 脚本文件 / Scripts
├── server.cjs                        # 服务器入口 / Server Entry
└── package.json                      # 项目配置 / Project Config
```

---

## 🚀 快速开始 | Quick Start

### 🇨🇳 环境要求 / Requirements

- **Node.js** >= 16.x
- **MySQL** >= 8.0
- **Git** (可选 / Optional)

### 📦 安装步骤 / Installation

```bash
# 克隆项目 / Clone the repository
git clone https://github.com/a1313445566/PSCG.git
cd PSCG

# 安装依赖 / Install dependencies
npm install

# 配置数据库 / Configure database
mysql -u root -p < scripts/db-migration.sql

# 创建环境变量文件 / Create .env file
cp .env.example .env
# 编辑 .env 文件填入您的配置 / Edit .env with your configuration
```

### ⚙️ 环境变量配置 / Environment Variables

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pscg_db
SERVER_PORT=3001
JWT_SECRET=your_jwt_secret
```

### 🏃 运行项目 / Run the Project

```bash
# 启动前端开发服务器 / Start frontend dev server
npm run dev
# 访问 http://localhost:5173

# 启动后端服务器 / Start backend server
npm run server
# API 地址 http://localhost:3001
```

### 🌿 生产部署 / Production Deployment

```bash
# 构建前端 / Build frontend
npm run build

# 启动生产服务 / Start production server
npm run server
```

---

## 🗄️ 数据库设计 | Database Schema

### 核心表结构 / Core Tables

| 表名 Table Name | 描述 Description |
|-----------------|------------------|
| `users` | 用户表（学生信息）/ User table (student info) |
| `admin_credentials` | 管理员表 / Administrator table |
| `subjects` | 学科表 / Subject table |
| `subcategories` | 子分类表 / Subcategory table |
| `questions` | 题目表 / Question table |
| `quiz_sessions` | 答题会话表 / Quiz session table |
| `quiz_attempts` | 答题记录表 / Quiz attempt records |
| `error_collection` | 错题收集表 / Error collection table |
| `chat_sessions` | AI 聊天会话表 / AI chat session table |
| `chat_messages` | AI 聊天消息表 / AI chat message table |

---

## 🔌 API 接口 | API Endpoints

### 主要接口 / Main Endpoints

| 方法 Method | 路径 Path | 描述 Description |
|-------------|-----------|------------------|
| `GET` | `/api/subjects` | 获取学科列表 / Get subjects list |
| `GET` | `/api/questions` | 获取题目列表 / Get questions list |
| `POST` | `/api/quiz/start` | 开始答题 / Start a quiz |
| `POST` | `/api/quiz/submit` | 提交答案 / Submit answers |
| `GET` | `/api/users` | 获取用户列表 / Get users list |
| `POST` | `/api/chat` | AI 聊天 / AI chat |

> 💡 详细 API 文档请参考 `DOCS/API文档/` 目录<br/>See `DOCS/API文档/` for detailed API documentation

---

## 📋 批量导入题目 | Batch Import Questions

支持通过文本文件批量导入题目 / Support batch import via text file:

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

---

## 📂 项目文档 | Documentation

详细文档请参考 `DOCS/` 目录 / Detailed docs in `DOCS/`:

| 文档 Document | 说明 Description |
|---------------|-------------------|
| 📘 **API文档** | RESTful API 接口文档 / RESTful API documentation |
| 📗 **技术文档** | 技术架构说明 / Technical architecture |
| 📙 **使用指南** | 用户操作指南 / User guide |
| 📕 **开发文档** | 开发环境搭建和编码规范 / Dev environment & coding standards |
| 📗 **部署文档** | 系统部署指南 / Deployment guide |

---

## 📜 许可证 | License

<p align="center">
  <a href="https://creativecommons.org/licenses/by-nc/4.0/">
    <img src="https://licensebuttons.net/l/by-nc/4.0/88x31.png" alt="CC BY-NC 4.0" />
  </a>
</p>

本项目采用 **[CC BY-NC 4.0](LICENSE)** (署名-非商业性使用 4.0 国际) 许可证发布。

This project is licensed under the **[CC BY-NC 4.0](LICENSE)** (Attribution-NonCommercial 4.0 International) License.

### 使用须知 / Usage Terms

#### ✅ 允许 Allowed (Non-commercial Use Only)

- **个人学习** / Personal Learning - 自由学习、研究代码 / Free to learn and study code
- **学术研究** / Academic Research - 论文、课程项目、毕业设计 / Papers, course projects, thesis
- **开源集成** / Open Source Integration - 集成到其他开源项目 / Integrate into other open source projects
- **自由修改** / Free Modification - 修改、改进、定制功能 / Modify, improve, customize features
- **自由分享** / Free Sharing - 在非商业前提下分享给他人 / Share with others non-commercially

#### ❌ 禁止 Prohibited

- **❌ 商业使用** / Commercial Use - 任何以盈利为目的的活动 / Any profit-oriented activities
- **❌ 移除声明** / Remove Notices - 移除版权声明或许可证文本 / Remove copyright or license notices
- **❌ 隐瞒来源** / Hide Source - 不标注原作者和来源 / Not attributing original author
- **❌ 商业转售** / Commercial Resale - 任何形式的商业分发或转售 / Any form of commercial distribution or resale

### 商业授权 / Commercial License

如需将本项目用于**商业目的**，请联系作者获取**商业授权**。

For **commercial use**, please contact the author for a **commercial license**.

📧 **Email:** [a1313445566@example.com](mailto:a1313445566@example.com)

---

## 🤝 参与贡献 | Contributing

我们欢迎各种形式的贡献！/ We welcome all forms of contribution!

请阅读 [贡献指南](CONTRIBUTING.md) 了解详细信息。/ Please read the [Contributing Guide](CONTRIBUTING.md) for details.

<a href="https://github.com/a1313445566/PSCG/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=a1313445566/PSCG" alt="Contributors" />
</a>

---

## 📞 联系方式 | Contact

<p align="center">

| 平台 Platform | 链接 Link |
|---------------|-----------|
| 🐙 **GitHub** | [a1313445566/PSCG](https://github.com/a1313445566/PSCG) |
| 🐧 **Gitee** | [a1313445566_admin/PSCG](https://gitee.com/a1313445566_admin/PSCG) |
| 📧 **Email** | [a1313445566@example.com](mailto:a1313445566@example.com) |
| 💬 **Issues** | [提交问题 / Submit Issues](https://github.com/a1313445566/PSCG/issues) |

</p>

---

## 🙏 致谢 | Acknowledgments

- 感谢所有为这个项目做出贡献的开发者！/ Thanks to all developers who contributed!
- 感谢开源社区提供的优秀工具和框架！/ Thanks to the open-source community for excellent tools and frameworks!

---

<p align="center">
  Made with ❤️ by <strong>a1313445566</strong>
</p>

<p align="center">
  <sub>⭐ 如果这个项目对您有帮助，请给一个 Star 支持一下！</sub><br/>
  <sub>If this project helps you, please give it a Star! ⭐</sub>
</p>
