#!/bin/bash

# AItest 分支一键部署脚本 (Ubuntu Server)
# 用途：在服务器上自动执行部署流程
# 使用方法：sudo bash deploy-aitest.sh

set -e  # 遇到错误立即退出

# ==================== 配置区 ====================

# 项目配置
PROJECT_DIR="/var/www/PSCG"          # 项目目录（修改为你的实际路径）
PROJECT_NAME="PSCG"                   # PM2 应用名称
DB_NAME="pscg_db"                     # 数据库名称
BACKUP_DIR="$HOME/backups"            # 备份目录

# Git 配置
TARGET_BRANCH="AItest"                # 目标分支
CURRENT_BRANCH="master"               # 当前分支

# ==================== 颜色输出 ====================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}👉 $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ==================== 错误处理 ====================

trap 'error_handler $LINENO' ERR

error_handler() {
    log_error "部署失败！错误发生在第 $1 行"
    log_error "请检查上方错误信息"
    log_warning "建议执行回滚操作: bash rollback-to-master.sh"
    exit 1
}

# ==================== 备份函数 ====================

backup_database() {
    log_step "1. 备份数据库"
    
    mkdir -p "$BACKUP_DIR"
    
    local TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    local BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"
    
    log_info "正在备份数据库到: $BACKUP_FILE"
    
    mysqldump -u root --single-transaction --routines --triggers "$DB_NAME" > "$BACKUP_FILE"
    gzip "$BACKUP_FILE"
    
    local BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    log_success "数据库备份完成 ($BACKUP_SIZE)"
    
    # 记录备份文件路径
    echo "${BACKUP_FILE}.gz" > "$BACKUP_DIR/latest_db_backup.txt"
}

backup_code() {
    log_step "2. 备份代码和配置"
    
    local TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    local CODE_BACKUP_DIR="$BACKUP_DIR/code_${TIMESTAMP}"
    
    mkdir -p "$CODE_BACKUP_DIR"
    
    log_info "正在备份关键文件..."
    
    cd "$PROJECT_DIR"
    
    # 备份关键目录
    cp -r dist "$CODE_BACKUP_DIR/" 2>/dev/null || log_warning "dist 目录不存在"
    cp -r images "$CODE_BACKUP_DIR/" 2>/dev/null || true
    cp -r audio "$CODE_BACKUP_DIR/" 2>/dev/null || true
    
    # 备份配置文件
    cp .env "$CODE_BACKUP_DIR/" 2>/dev/null || true
    cp package.json "$CODE_BACKUP_DIR/"
    
    # 记录 Git 状态
    git log -1 > "$CODE_BACKUP_DIR/git_log.txt"
    git status > "$CODE_BACKUP_DIR/git_status.txt"
    git branch --show-current > "$CODE_BACKUP_DIR/git_branch.txt"
    
    log_success "代码备份完成: $CODE_BACKUP_DIR"
    
    # 记录备份目录
    echo "$CODE_BACKUP_DIR" > "$BACKUP_DIR/latest_code_backup.txt"
}

# ==================== 部署函数 ====================

stop_service() {
    log_step "3. 停止服务"
    
    cd "$PROJECT_DIR"
    
    log_info "正在停止 PM2 服务..."
    pm2 stop "$PROJECT_NAME" 2>/dev/null || log_warning "服务未运行"
    
    sleep 3
    
    log_success "服务已停止"
}

pull_code() {
    log_step "4. 拉取 AItest 分支代码"
    
    cd "$PROJECT_DIR"
    
    log_info "保存当前分支信息..."
    git branch --show-current > "$BACKUP_DIR/current_branch.txt"
    git rev-parse HEAD > "$BACKUP_DIR/current_commit.txt"
    
    log_info "切换到 AItest 分支..."
    git fetch --all
    git checkout "$TARGET_BRANCH"
    git pull origin "$TARGET_BRANCH"
    
    log_info "最新提交: $(git log -1 --pretty=format:'%h - %s (%ar)')"
    
    log_success "代码拉取完成"
}

install_dependencies() {
    log_step "5. 安装依赖"
    
    cd "$PROJECT_DIR"
    
    log_info "正在安装生产依赖..."
    npm install --production
    
    log_success "依赖安装完成"
}

build_frontend() {
    log_step "6. 构建前端"
    
    cd "$PROJECT_DIR"
    
    log_info "正在构建前端（可能需要 1-2 分钟）..."
    npm run build
    
    local DIST_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
    log_success "前端构建完成 (大小: $DIST_SIZE)"
}

migrate_database() {
    log_step "7. 数据库迁移"
    
    cd "$PROJECT_DIR"
    
    if [ -f "migrations/migrate_to_aittest.sql" ]; then
        log_warning "检测到数据库迁移脚本"
        log_info "正在执行数据库迁移..."
        
        mysql -u root "$DB_NAME" < migrations/migrate_to_aittest.sql
        
        log_success "数据库迁移完成"
    else
        log_info "无数据库迁移脚本，跳过"
    fi
}

start_service() {
    log_step "8. 启动服务"
    
    cd "$PROJECT_DIR"
    
    log_info "正在启动服务..."
    pm2 start "$PROJECT_NAME"
    
    sleep 5
    
    log_info "检查服务状态..."
    pm2 list
    
    log_success "服务已启动"
}

verify_deployment() {
    log_step "9. 验证部署"
    
    log_info "检查服务健康状态..."
    
    sleep 3
    
    # 健康检查
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        log_success "健康检查通过"
    else
        log_error "健康检查失败！"
        log_warning "请检查服务日志: pm2 logs $PROJECT_NAME"
        return 1
    fi
    
    # 端口检查
    if netstat -tlnp 2>/dev/null | grep -q ":3001"; then
        log_success "端口 3001 监听正常"
    else
        log_error "端口 3001 未监听！"
        return 1
    fi
    
    # 日志检查
    log_info "最近的日志:"
    pm2 logs "$PROJECT_NAME" --lines 20 --nostream
    
    log_success "部署验证完成"
}

# ==================== 主函数 ====================

main() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}   AItest 分支自动部署脚本${NC}"
    echo -e "${CYAN}   开始时间: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # 检查是否在项目目录
    if [ ! -d "$PROJECT_DIR" ]; then
        log_error "项目目录不存在: $PROJECT_DIR"
        log_info "请修改脚本中的 PROJECT_DIR 变量"
        exit 1
    fi
    
    # 确认部署
    echo -e "\n${YELLOW}⚠️  即将部署 AItest 分支到生产环境${NC}"
    echo -e "${YELLOW}   当前分支: $(cd $PROJECT_DIR && git branch --show-current)${NC}"
    echo -e "${YELLOW}   项目目录: $PROJECT_DIR${NC}"
    echo -e "${YELLOW}   数据库: $DB_NAME${NC}"
    echo -e "${YELLOW}   预计停机时间: 5-10 分钟${NC}\n"
    
    read -p "确认部署? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log_warning "部署已取消"
        exit 0
    fi
    
    # 执行部署流程
    backup_database
    backup_code
    stop_service
    pull_code
    install_dependencies
    build_frontend
    migrate_database
    start_service
    verify_deployment
    
    # 部署成功
    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ 部署成功！${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    echo -e "\n${CYAN}📊 部署信息:${NC}"
    echo -e "  分支: ${GREEN}$TARGET_BRANCH${NC}"
    echo -e "  提交: $(cd $PROJECT_DIR && git log -1 --pretty=format:'%h - %s')"
    echo -e "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
    
    echo -e "\n${CYAN}📁 备份位置:${NC}"
    echo -e "  数据库: $(cat $BACKUP_DIR/latest_db_backup.txt)"
    echo -e "  代码: $(cat $BACKUP_DIR/latest_code_backup.txt)"
    
    echo -e "\n${CYAN}🔍 监控命令:${NC}"
    echo -e "  实时日志: ${GREEN}pm2 logs $PROJECT_NAME${NC}"
    echo -e "  性能监控: ${GREEN}pm2 monit${NC}"
    echo -e "  健康检查: ${GREEN}curl http://localhost:3001/api/health${NC}"
    
    echo -e "\n${YELLOW}⚠️  如果发现问题，请立即执行回滚:${NC}"
    echo -e "  ${GREEN}bash rollback-to-master.sh${NC}\n"
}

# 执行主函数
main