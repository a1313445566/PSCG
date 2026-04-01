#!/bin/bash
# ====================================
# PSCG 生产环境部署脚本
# 用途：从 master 更新到 AItest 分支
# 版本：v1.0
# 日期：2026-04-01
# ====================================

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 分隔线
separator() {
    echo "========================================"
}

# ====================================
# 步骤 0: 环境检查
# ====================================
separator
log_info "开始部署 PSCG 系统"
separator

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    log_error "请在项目根目录执行此脚本"
    exit 1
fi

# 检查 Git 状态
if [ -n "$(git status --porcelain)" ]; then
    log_warning "发现未提交的更改："
    git status --short
    log_warning "建议先提交或暂存更改"
    read -p "是否继续部署？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# ====================================
# 步骤 1: 备份当前版本
# ====================================
separator
log_info "步骤 1/7: 备份当前版本"
separator

BACKUP_DIR="backups/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 备份 dist 目录
if [ -d "dist" ]; then
    cp -r dist "$BACKUP_DIR/"
    log_success "已备份 dist 目录到 $BACKUP_DIR/dist"
fi

# 备份 .env 文件
if [ -f ".env" ]; then
    cp .env "$BACKUP_DIR/"
    log_success "已备份 .env 文件"
fi

# 备份数据库
if command -v mysqldump &> /dev/null; then
    read -p "是否备份 MySQL 数据库？(y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "请输入数据库用户名: " DB_USER
        read -s -p "请输入数据库密码: " DB_PASS
        echo
        read -p "请输入数据库名 (默认 pscg_db): " DB_NAME
        DB_NAME=${DB_NAME:-pscg_db}
        
        mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_DIR/database_backup.sql"
        log_success "已备份数据库到 $BACKUP_DIR/database_backup.sql"
    fi
fi

# ====================================
# 步骤 2: 拉取最新代码
# ====================================
separator
log_info "步骤 2/7: 拉取最新代码"
separator

# 获取当前分支
CURRENT_BRANCH=$(git branch --show-current)
log_info "当前分支: $CURRENT_BRANCH"

# 切换到 AItest 分支
if [ "$CURRENT_BRANCH" != "AItest" ]; then
    log_info "切换到 AItest 分支..."
    git fetch origin
    git checkout AItest
fi

# 拉取最新代码
log_info "拉取远程更新..."
git pull origin AItest

log_success "代码已更新到最新版本"

# ====================================
# 步骤 3: 安装依赖
# ====================================
separator
log_info "步骤 3/7: 安装依赖"
separator

# 检查 package.json 是否有变化
if git diff --name-only HEAD@{1} HEAD | grep -q "package.json"; then
    log_warning "检测到 package.json 有变化，执行 npm install"
    npm install
else
    log_info "package.json 无变化，跳过 npm install"
fi

log_success "依赖安装完成"

# ====================================
# 步骤 4: 构建前端
# ====================================
separator
log_info "步骤 4/7: 构建前端"
separator

log_info "开始构建生产版本..."
npm run build

if [ $? -eq 0 ]; then
    log_success "前端构建成功"
else
    log_error "前端构建失败，请检查错误信息"
    exit 1
fi

# ====================================
# 步骤 5: 停止旧服务
# ====================================
separator
log_info "步骤 5/7: 重启服务"
separator

# 检查 PM2 是否安装
if ! command -v pm2 &> /dev/null; then
    log_error "PM2 未安装，请先安装 PM2: npm install -g pm2"
    exit 1
fi

# 检查服务是否在运行
if pm2 describe pscg-server &> /dev/null; then
    log_info "检测到 PM2 服务 pscg-server 正在运行"
    log_info "执行零停机重载..."
    pm2 reload pscg-server
else
    log_warning "PM2 服务未启动，正在启动..."
    pm2 start server.cjs --name "pscg-server"
    pm2 save
fi

log_success "服务重启完成"

# ====================================
# 步骤 6: 验证部署
# ====================================
separator
log_info "步骤 6/7: 验证部署"
separator

# 等待服务启动
sleep 3

# 检查服务状态
if pm2 describe pscg-server | grep -q "online"; then
    log_success "PM2 服务状态: 在线"
else
    log_error "PM2 服务状态异常"
    pm2 logs pscg-server --lines 20
    exit 1
fi

# 检查端口监听
if netstat -tlnp 2>/dev/null | grep -q ":3001"; then
    log_success "端口 3001 正在监听"
else
    log_warning "未检测到端口 3001 监听，请检查服务状态"
fi

# 测试 API 接口
log_info "测试 API 接口..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health | grep -q "200"; then
    log_success "API 接口测试成功"
else
    log_warning "API 接口测试失败，请检查日志"
fi

# ====================================
# 步骤 7: 清理和总结
# ====================================
separator
log_info "步骤 7/7: 部署完成"
separator

log_success "✅ 部署成功完成！"
echo ""
log_info "部署摘要:"
echo "  - 分支: AItest"
echo "  - 提交: $(git log -1 --oneline)"
echo "  - 时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "  - 备份: $BACKUP_DIR"
echo ""

log_info "常用命令:"
echo "  查看服务状态: pm2 status"
echo "  查看实时日志: pm2 logs pscg-server"
echo "  重启服务:     pm2 restart pscg-server"
echo "  回滚版本:     恢复 $BACKUP_DIR 目录"
echo ""

log_info "下一步建议:"
echo "  1. 访问网站测试功能"
echo "  2. 检查浏览器控制台是否有错误"
echo "  3. 测试图表响应式功能"
echo "  4. 测试富文本编辑器"
echo ""

separator
