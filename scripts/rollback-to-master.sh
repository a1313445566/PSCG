#!/bin/bash

# 紧急回滚脚本 (Ubuntu Server)
# 用途：快速回滚到 master 分支
# 使用方法：sudo bash rollback-to-master.sh

set -e

# ==================== 配置区 ====================

PROJECT_DIR="/var/www/PSCG"          # 项目目录
PROJECT_NAME="PSCG"                   # PM2 应用名称
DB_NAME="pscg_db"                     # 数据库名称
BACKUP_DIR="$HOME/backups"            # 备份目录

# ==================== 颜色输出 ====================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${CYAN}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_step() { echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n${YELLOW}👉 $1${NC}\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

# ==================== 主函数 ====================

main() {
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}   紧急回滚脚本${NC}"
    echo -e "${RED}   时间: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    cd "$PROJECT_DIR"
    
    # 显示当前状态
    echo -e "\n${YELLOW}当前状态:${NC}"
    echo -e "  当前分支: $(git branch --show-current)"
    echo -e "  当前提交: $(git log -1 --pretty=format:'%h - %s')"
    
    # 确认回滚
    echo -e "\n${RED}⚠️  警告：即将回滚到 master 分支${NC}"
    echo -e "${YELLOW}   这将停止服务并切换到 master 分支${NC}\n"
    
    read -p "确认回滚? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log_warning "回滚已取消"
        exit 0
    fi
    
    # 1. 停止服务
    log_step "1. 停止服务"
    pm2 stop "$PROJECT_NAME" 2>/dev/null || true
    sleep 3
    log_success "服务已停止"
    
    # 2. 回滚代码
    log_step "2. 回滚到 master 分支"
    git fetch --all
    git checkout master
    git pull origin master
    log_info "当前提交: $(git log -1 --pretty=format:'%h - %s')"
    log_success "代码回滚完成"
    
    # 3. 回滚数据库（如果有备份）
    log_step "3. 数据库处理"
    
    if [ -f "$BACKUP_DIR/latest_db_backup.txt" ]; then
        LATEST_DB_BACKUP=$(cat "$BACKUP_DIR/latest_db_backup.txt")
        
        if [ -f "$LATEST_DB_BACKUP" ]; then
            echo -e "${YELLOW}发现数据库备份: $LATEST_DB_BACKUP${NC}"
            read -p "是否恢复数据库? (yes/no): " restore_db
            
            if [ "$restore_db" == "yes" ]; then
                log_info "正在恢复数据库..."
                
                gunzip -c "$LATEST_DB_BACKUP" > /tmp/temp_backup.sql
                mysql -u root "$DB_NAME" < /tmp/temp_backup.sql
                rm /tmp/temp_backup.sql
                
                log_success "数据库恢复完成"
            else
                log_info "跳过数据库恢复"
            fi
        else
            log_warning "数据库备份文件不存在: $LATEST_DB_BACKUP"
        fi
    else
        log_info "无数据库备份记录"
    fi
    
    # 4. 安装依赖
    log_step "4. 安装依赖"
    npm install --production
    log_success "依赖安装完成"
    
    # 5. 构建前端
    log_step "5. 构建前端"
    npm run build
    log_success "前端构建完成"
    
    # 6. 启动服务
    log_step "6. 启动服务"
    pm2 start "$PROJECT_NAME"
    sleep 5
    log_success "服务已启动"
    
    # 7. 验证
    log_step "7. 验证回滚"
    
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        log_success "健康检查通过"
    else
        log_error "健康检查失败！请检查服务日志"
        pm2 logs "$PROJECT_NAME" --lines 50 --nostream
        exit 1
    fi
    
    # 成功信息
    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ 回滚成功！${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    echo -e "\n${CYAN}📊 当前状态:${NC}"
    echo -e "  分支: ${GREEN}master${NC}"
    echo -e "  提交: $(git log -1 --pretty=format:'%h - %s')"
    echo -e "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
    
    echo -e "\n${CYAN}🔍 监控命令:${NC}"
    echo -e "  查看日志: ${GREEN}pm2 logs $PROJECT_NAME${NC}"
    echo -e "  查看状态: ${GREEN}pm2 list${NC}\n"
}

# 执行主函数
main