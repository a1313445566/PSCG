# PSCG 服务器启动脚本 (Windows PowerShell)
# 功能：清理旧进程、检查端口、启动新服务

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "PSCG 服务器启动脚本" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. 清理旧进程
Write-Host "🔍 检查正在运行的 Node 进程..." -ForegroundColor Yellow
$nodeProcesses = Get-Process | Where-Object {$_.ProcessName -eq "node"}
$nodeCount = $nodeProcesses.Count

if ($nodeCount -gt 0) {
    Write-Host "⚠️  发现 $nodeCount 个 Node 进程，正在清理..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "✅ 旧进程已清理" -ForegroundColor Green
} else {
    Write-Host "✅ 没有旧进程" -ForegroundColor Green
}

# 2. 检查端口占用
$port = 3001
Write-Host "🔍 检查端口 $port 是否被占用..." -ForegroundColor Yellow
$portInUse = netstat -ano | findstr ":$port" | findstr "LISTENING"

if ($portInUse) {
    Write-Host "⚠️  端口 $port 已被占用，正在释放..." -ForegroundColor Yellow
    $pid = ($portInUse -split '\s+')[-1]
    Stop-Process -Id $pid -Force
    Start-Sleep -Seconds 1
    Write-Host "✅ 端口已释放" -ForegroundColor Green
} else {
    Write-Host "✅ 端口 $port 可用" -ForegroundColor Green
}

# 3. 检查 .env 文件
Write-Host "🔍 检查环境变量文件..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ .env 文件存在" -ForegroundColor Green
} else {
    Write-Host "❌ .env 文件不存在！请创建 .env 文件" -ForegroundColor Red
    exit 1
}

# 4. 启动服务器
Write-Host "🚀 启动服务器..." -ForegroundColor Yellow
$serverProcess = Start-Process node -ArgumentList "server.cjs" -PassThru -NoNewWindow

Write-Host "✅ 服务器已启动 (PID: $($serverProcess.Id))" -ForegroundColor Green
Write-Host "📍 API 地址: http://localhost:$port" -ForegroundColor Cyan
Write-Host "📍 文档地址: http://localhost:$port/api/docs" -ForegroundColor Cyan
Write-Host ""

# 5. 等待启动完成
Write-Host "⏳ 等待服务器启动完成..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 6. 健康检查
Write-Host "🔍 执行健康检查..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$port/api/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ 服务器启动成功！" -ForegroundColor Green
    Write-Host "📊 健康状态: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  服务器可能未完全启动，请检查日志" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "启动完成！按 Ctrl+C 停止服务器" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 保持脚本运行
while ($true) {
    Start-Sleep -Seconds 1
    if ($serverProcess.HasExited) {
        Write-Host "❌ 服务器进程已退出" -ForegroundColor Red
        exit 1
    }
}
