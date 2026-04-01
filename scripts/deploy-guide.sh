#!/bin/bash
# PSCG 生产环境部署指南脚本
# 用途：更新线上服务器代码
# 使用：bash scripts/deploy-guide.sh

set -e

echo "🚀 PSCG 生产环境部署流程"
echo "=========================="
echo ""

echo "📋 部署前检查清单："
echo "  1. 本地代码已提交并推送到远程仓库"
echo "  2. 确认 .env 和 .env.production 配置正确"
echo "  3. 数据库已备份"
echo ""

# 检查当前分支
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 当前分支: $CURRENT_BRANCH"
echo ""

echo "========================================="
echo "方式 1️⃣ ：完整部署（首次或大更新）"
echo "========================================="
echo ""
echo "# 步骤 1: 本地推送代码"
echo "git add ."
echo "git commit -m \"feat: 新功能描述\""
echo "git push origin $CURRENT_BRANCH"
echo ""

echo "# 步骤 2: 登录服务器"
echo "ssh user@your-server-ip"
echo ""

echo "# 步骤 3: 备份当前版本（重要！）"
echo "cd /var/www/pscg"
echo "sudo cp -r dist dist.backup.\$(date +%Y%m%d_%H%M%S)"
echo "mysqldump -u pscg_user -p pscg_db > /tmp/pscg_db_backup.sql"
echo ""

echo "# 步骤 4: 拉取最新代码"
echo "git pull origin $CURRENT_BRANCH"
echo ""

echo "# 步骤 5: 安装/更新依赖"
echo "npm install"
echo ""

echo "# 步骤 6: 构建前端"
echo "npm run build"
echo ""

echo "# 步骤 7: 重启服务（零停机）"
echo "pm2 reload pscg-server"
echo ""

echo "# 步骤 8: 检查状态"
echo "pm2 status"
echo "pm2 logs pscg-server --lines 50"
echo ""

echo "========================================="
echo "方式 2️⃣ ：快速更新（小改动）"
echo "========================================="
echo ""
echo "# 在服务器上执行（一行命令）"
echo "cd /var/www/pscg && git pull && npm install && npm run build && pm2 reload pscg-server"
echo ""

echo "========================================="
echo "验证部署成功"
echo "========================================="
echo ""
echo "1. 检查服务状态"
echo "   pm2 status"
echo ""
echo "2. 查看实时日志"
echo "   pm2 logs pscg-server"
echo ""
echo "3. 检查端口监听"
echo "   sudo netstat -tlnp | grep 3001"
echo ""
echo "4. 访问网站测试"
echo "   curl -I https://your-domain.com"
echo ""
echo "5. 测试 API 接口"
echo "   curl https://your-domain.com/api/health"
echo ""

echo "========================================="
echo "常见问题处理"
echo "========================================="
echo ""
echo "❌ 如果 502 Bad Gateway："
echo "   pm2 restart pscg-server"
echo "   sudo systemctl restart nginx"
echo "   pm2 logs pscg-server"
echo ""
echo "❌ 如果数据库连接失败："
echo "   sudo systemctl status mysql"
echo "   cat .env | grep DB_"
echo ""
echo "❌ 如果需要回滚："
echo "   pm2 stop pscg-server"
echo "   sudo rm -rf dist"
echo "   sudo mv dist.backup.YYYYMMDD_HHMMSS dist"
echo "   pm2 start pscg-server"
echo ""

echo "✅ 部署完成！"