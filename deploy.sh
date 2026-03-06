#!/bin/bash

# 一键部署脚本 - 小学刷题闯关系统

echo "===================================="
echo "开始部署小学刷题闯关系统"
echo "===================================="

# 检查Node.js版本
echo "检查Node.js版本..."
node -v
if [ $? -ne 0 ]; then
    echo "错误：未安装Node.js，请先在宝塔面板中安装Node.js"
    exit 1
fi

# 检查npm版本
echo "检查npm版本..."
npm -v
if [ $? -ne 0 ]; then
    echo "错误：未安装npm，请先在宝塔面板中安装Node.js"
    exit 1
fi

# 安装依赖
echo "安装项目依赖..."
npm install
if [ $? -ne 0 ]; then
    echo "错误：安装依赖失败"
    exit 1
fi

# 构建前端
echo "构建前端项目..."
npm run build
if [ $? -ne 0 ]; then
    echo "错误：构建前端失败"
    exit 1
fi

# 创建必要的目录
echo "创建必要的目录..."
mkdir -p audio images
chmod 755 audio images

# 检查PM2是否安装
echo "检查PM2是否安装..."
pm2 --version > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "安装PM2..."
npm install -g pm2
    if [ $? -ne 0 ]; then
        echo "错误：安装PM2失败"
        exit 1
    fi
fi

# 停止旧的进程
echo "停止旧的进程..."
pm2 stop server.cjs > /dev/null 2>&1

# 启动服务
echo "启动服务..."
pm2 start server.cjs --name "quiz-app"
if [ $? -ne 0 ]; then
    echo "错误：启动服务失败"
    exit 1
fi

# 查看服务状态
echo "查看服务状态..."
pm2 status

echo "===================================="
echo "部署完成！"
echo "===================================="
echo "访问地址：http://您的域名"
echo "后台地址：http://您的域名/admin"
echo "管理密码：xgsy8188"
echo "===================================="
