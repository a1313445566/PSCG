# 服务器和数据库配置规则

## 服务器配置
- 服务器框架: Express
- 运行端口: 3001（可通过环境变量 SERVER_PORT 修改）
- 监听地址: 0.0.0.0
- 启动文件: server.cjs
- 静态文件目录: dist
- 上传文件目录: images, audio
- 环境变量:
  - SERVER_PORT: 服务器端口（默认: 3001）

## 数据库连接
- 数据库类型: MySQL
- 配置方式: 环境变量
- 环境变量:
  - DB_HOST: 数据库主机（默认: 127.0.0.1）
  - DB_PORT: 数据库端口（默认: 3306）
  - DB_USER: 数据库用户名（默认: PSCG）
  - DB_PASSWORD: 数据库密码（默认: xgsy@8188）
  - DB_NAME: 数据库名（默认: pscg）
- 字符集: utf8mb4
- 连接池大小: 20
- 队列限制: 100
