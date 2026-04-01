#!/bin/bash
# PSCG 服务器启动脚本
# 功能：清理旧进程、检查端口、启动新服务

echo "========================================="
echo "PSCG 服务器启动脚本"
echo "========================================="

# 1. 清理旧进程
echo "🔍 检查正在运行的 Node 进程..."
NODE_COUNT=$(ps aux | grep "node.*server.cjs" | grep -v grep | wc -l)

if [ "$NODE_COUNT" -gt 0 ]; then
  echo "⚠️  发现 $NODE_COUNT 个旧进程，正在清理..."
  pkill -f "node.*server.cjs"
  sleep 2
  echo "✅ 旧进程已清理"
else
  echo "✅ 没有旧进程"
fi

# 2. 检查端口占用
PORT=3001
echo "🔍 检查端口 $PORT 是否被占用..."
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "⚠️  端口 $PORT 已被占用，正在释放..."
  lsof -ti:$PORT | xargs kill -9 2>/dev/null
  sleep 1
  echo "✅ 端口已释放"
else
  echo "✅ 端口 $PORT 可用"
fi

# 3. 检查 .env 文件
echo "🔍 检查环境变量文件..."
if [ -f ".env" ]; then
  echo "✅ .env 文件存在"
else
  echo "❌ .env 文件不存在！请创建 .env 文件"
  exit 1
fi

# 4. 启动服务器
echo "🚀 启动服务器..."
node server.cjs &
SERVER_PID=$!

echo "✅ 服务器已启动 (PID: $SERVER_PID)"
echo "📍 API 地址: http://localhost:$PORT"
echo "📍 文档地址: http://localhost:$PORT/api/docs"
echo ""

# 5. 等待启动完成
echo "⏳ 等待服务器启动完成..."
sleep 3

# 6. 健康检查
echo "🔍 执行健康检查..."
if curl -s "http://localhost:$PORT/api/health" > /dev/null 2>&1; then
  echo "✅ 服务器启动成功！"
else
  echo "⚠️  服务器可能未完全启动，请检查日志"
fi

echo ""
echo "========================================="
echo "启动完成！按 Ctrl+C 停止服务器"
echo "========================================="
