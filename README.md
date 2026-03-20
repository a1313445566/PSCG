# PSCG - 智能题库系统

## 项目简介

PSCG (Primary School Comprehensive Quiz) 是一个基于现代Web技术构建的智能题库系统，旨在为学生提供个性化的学习体验，为教师提供高效的教学管理工具。系统支持多学科题库管理、智能难度调整、答题统计分析和排行榜功能，帮助用户高效学习和提高成绩。

## 技术栈

### 前端技术
- **框架**：Vue 3 + Composition API
- **状态管理**：Pinia
- **路由**：Vue Router
- **UI 组件库**：Element Plus
- **富文本编辑器**：Vue Quill
- **数据可视化**：ECharts
- **构建工具**：Vite

### 后端技术
- **运行环境**：Node.js 16+
- **框架**：Express.js 4.x
- **数据库**：MySQL 8.0
- **文件上传**：Multer
- **响应压缩**：compression
- **跨域支持**：cors
- **进程管理**：PM2

## 核心功能

### 1. 后台管理系统
- **学科与题库管理**：支持添加、编辑、删除学科和题库，支持图标选择
- **题目管理**：支持添加、编辑、删除题目，支持多种题型
- **批量导入**：支持从文本批量导入题目，自动解析题目内容、选项和答案
- **多媒体支持**：支持图片和音频上传、管理和播放
- **数据管理**：支持数据备份、恢复和导出
- **错误率分析**：展示错误率较高的题目，支持分页和筛选

### 2. 学生答题系统
- **智能出题**：根据难度自动筛选题目
- **选项随机**：答题时选项随机排序，防止作弊
- **多媒体展示**：支持图片和音频题目的展示和播放
- **实时反馈**：答题过程中实时反馈答题状态
- **错题回顾**：答题完成后显示错题并提供解析

### 3. 智能难度调整
- **自动调整**：基于错误率自动调整题目难度
- **时间加权**：最近答题记录权重更高
- **批量调整**：支持批量调整题目和题库难度
- **手动设置**：支持手动设置题目和题库难度

### 4. 排行榜系统
- **全局排行榜**：展示所有学生的排名
- **个人排名**：显示个人在排行榜中的位置
- **积分系统**：基于答题正确率和数量计算积分
- **筛选功能**：支持按年级、班级、学科进行筛选

### 5. 数据分析系统
- **个人统计**：展示个人答题统计和学习进度
- **学科分析**：分析各学科的学习情况
- **难度分布**：展示题目难度分布情况
- **趋势分析**：分析学习成绩的变化趋势

## 环境配置

### 开发环境 (`.env.development`)
```
VITE_API_URL=http://localhost:3001/api
```

### 生产环境 (`.env.production`)
```
VITE_API_URL=http://您的域名:3001/api
```

## 安装与运行

### 开发环境

1. **克隆仓库**
   ```bash
   git clone <仓库地址>
   cd PSCG
   ```

2. **安装项目依赖**
   ```bash
   npm install
   ```

3. **创建必要的目录**
   ```bash
   mkdir -p audio images
   ```

4. **启动开发服务器**
   - 前端：`npm run dev`
   - 后端：`npm run server`

5. **访问项目**
   - 前端：`http://localhost:5173`
   - 后端：`http://localhost:3001`
   - 后台管理：`http://localhost:5173/admin`
   - 排行榜：`http://localhost:5173/leaderboard`

### 生产环境部署

1. **上传项目文件**
   - 将项目文件上传到服务器
   - 确保 `audio/` 和 `images/` 目录存在且有写入权限

2. **安装项目依赖**
   ```bash
   cd /www/wwwroot/PSCG
   npm install
   ```

3. **构建前端**
   ```bash
   npm run build
   ```

4. **启动服务**
   ```bash
   # 使用PM2启动服务
   pm2 start server.cjs --name "pscg-app"
   
   # 保存PM2配置
   pm2 save
   
   # 设置PM2自启动
   pm2 startup
   ```

5. **配置 Nginx 反向代理**
   ```nginx
   server {
     listen 80;
     server_name 您的域名;
     
     location / {
       proxy_pass http://127.0.0.1:3001;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

6. **访问项目**
   - 前端：`http://您的域名`
   - 后台：`http://您的域名/admin`
   - 排行榜：`http://您的域名/leaderboard`

## 项目结构

```
PSCG/
├── src/                # 前端源码
│   ├── views/          # 页面组件
│   │   ├── AdminView.vue     # 后台管理页面
│   │   ├── HomeView.vue      # 首页
│   │   ├── LoginView.vue     # 登录页面
│   │   ├── QuizView.vue      # 答题页面
│   │   ├── ResultView.vue    # 结果页面
│   │   ├── SubcategoryView.vue # 题库选择页面
│   │   └── LeaderboardView.vue # 排行榜页面
│   ├── components/      # 组件
│   │   ├── admin/       # 后台组件
│   │   ├── common/      # 通用组件
│   │   ├── leaderboard/ # 排行榜组件
│   │   ├── quiz/        # 答题组件
│   │   └── subject/     # 学科组件
│   ├── stores/         # 状态管理
│   │   └── questionStore.js  # 题目和数据管理
│   ├── utils/          # 工具函数
│   │   └── database.js        # API 调用工具
│   ├── router/         # 路由配置
│   │   └── index.js           # 路由定义
│   ├── styles/         # 样式文件
│   │   ├── global.css         # 全局样式
│   │   └── loading.css        # 加载动画样式
│   ├── App.vue         # 根组件
│   └── main.js         # 入口文件
├── routes/             # 后端路由
│   ├── answer-records.js # 答题记录路由
│   ├── analysis.js     # 数据分析路由
│   ├── backup.js       # 数据备份路由
│   ├── data.js         # 数据管理路由
│   ├── difficulty.js   # 难度调整路由
│   ├── grades-classes.js # 年级班级路由
│   ├── leaderboard.js  # 排行榜路由
│   ├── questions.js    # 题目管理路由
│   ├── settings.js     # 设置路由
│   ├── subjects.js     # 学科管理路由
│   └── users.js        # 用户管理路由
├── services/           # 后端服务
│   ├── database.js     # 数据库服务
│   └── difficultyService.js # 难度调整服务
├── server.cjs          # 后端服务器
├── public/             # 静态资源
├── audio/              # 音频文件目录
├── images/             # 图片文件目录
├── package.json        # 项目配置
├── vite.config.js      # Vite 配置
├── .env.development    # 开发环境配置
├── .env.production     # 生产环境配置
├── API.md              # API 文档
└── TECHNICAL_DOCUMENT.md # 技术文档
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
- 支持多选题答案（如：(BCD)、(ABCD)等）
- 支持【多选】标记

## 安全配置

- **文件上传**：已添加文件类型白名单和大小限制（最大10MB）
- **数据库**：已添加外键约束，确保数据一致性
- **CORS**：已配置CORS中间件，支持跨域请求
- **会话管理**：实现了30分钟无活动自动登出

## 性能优化

- **前端**：
  - 路由懒加载
  - 组件按需加载
  - 图片和资源优化
  - 首屏快速加载（应用立即挂载，数据后台加载）

- **后端**：
  - 数据库连接池
  - 响应压缩
  - 静态资源缓存
  - SQL 查询优化

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

### 6. 白屏问题
- 检查静态资源路径是否正确
- 确保前端构建成功
- 检查浏览器控制台是否有错误信息

## 注意事项

- 确保服务器端口 3001 未被占用
- 检查防火墙设置，确保端口 3001 可以访问
- 定期备份数据库文件
- 如遇到问题，可查看 PM2 日志排查错误：`pm2 logs pscg-app`
- 如需更改API地址，只需修改对应环境的 `.env` 文件

## 技术文档

详细的技术实现文档请查看 `TECHNICAL_DOCUMENT.md` 文件。

## API文档

API 文档请查看 `API.md` 文件。

## 许可证

MIT