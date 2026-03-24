# PSCG - 智能题库系统

## 项目简介

PSCG (Primary School Comprehensive Quiz) 是一个基于现代Web技术构建的智能题库系统，为学生提供个性化学习体验，为教师提供高效教学管理工具。

## 开源仓库

- **GitHub**: https://github.com/a1313445566/PSCG
- **Gitee**: https://gitee.com/a1313445566_admin/PSCG

## 技术栈

### 前端
- Vue 3 + Composition API
- Element Plus
- Pinia
- Vue Router
- ECharts
- Vite

### 后端
- Node.js 16+
- Express.js 4.x
- MySQL 8.0
- PM2

## 核心功能

- **后台管理**: 学科题库管理、题目管理、批量导入、多媒体支持
- **学生答题**: 智能出题、选项随机、多媒体展示、实时反馈、错题回顾
- **难度调整**: 自动调整、时间加权、批量调整
- **排行榜**: 全局排行、个人排名、积分系统
- **数据分析**: 个人统计、学科分析、难度分布、趋势分析

## 快速开始

### 开发环境

```bash
# 安装依赖
npm install

# 创建必要目录
mkdir -p audio images

# 启动开发服务器
npm run dev    # 前端
npm run server # 后端
```

访问地址:
- 前端: http://localhost:5173
- 后端: http://localhost:3001
- 后台: http://localhost:5173/admin

### 生产环境

```bash
# 安装依赖
npm install

# 构建前端
npm run build

# 启动服务
pm2 start server.cjs --name "pscg-app"
pm2 save
pm2 startup
```

## 项目结构

```
PSCG/
├── src/              # 前端源码
│   ├── views/        # 页面组件
│   ├── components/   # 组件
│   ├── stores/       # 状态管理
│   ├── utils/        # 工具函数
│   └── router/       # 路由配置
├── routes/           # 后端路由
├── services/         # 后端服务
├── server.cjs        # 后端服务器
├── audio/            # 音频文件
├── images/           # 图片文件
└── DOCS/             # 项目文档
```

## 批量添加题目

支持格式示例:

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

详细说明请查看: [批量添加题目指南](DOCS/使用指南/后台管理/批量添加题目指南.md)

## 项目文档

所有项目文档已整理到 `DOCS/` 目录:

- **API文档** - RESTful API 接口文档
- **技术文档** - 技术架构、安全设计、功能实现
- **使用指南** - 用户操作指南（学生端、后台管理）
- **开发文档** - 编码规范、开发环境、测试指南
- **部署文档** - 系统部署、运维配置
- **需求文档** - 功能需求分析

查看文档: [DOCS/README.md](DOCS/README.md)

## 许可证

MIT
