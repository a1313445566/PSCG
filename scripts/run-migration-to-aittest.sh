#!/bin/bash

# 执行migrate_to_aittest.sql脚本

# 设置数据库连接信息
DB_USER="root"
DB_PASSWORD="ZrYE9ms6x9Y2xEZM"
DB_NAME="pscg_db"

# 迁移脚本路径
MIGRATION_SCRIPT="$(dirname "$0")/../migrations/migrate_to_aittest.sql"

# 检查脚本文件是否存在
if [ ! -f "$MIGRATION_SCRIPT" ]; then
    echo "错误: 迁移脚本文件不存在: $MIGRATION_SCRIPT"
    exit 1
fi

# 使用环境变量传递密码，避免明文暴露
export MYSQL_PWD="$DB_PASSWORD"

# 先创建数据库（如果不存在）
echo "正在检查/创建数据库..."
mysql -u "$DB_USER" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"

# 执行迁移脚本
echo "正在执行数据库迁移脚本..."
mysql -u "$DB_USER" "$DB_NAME" < "$MIGRATION_SCRIPT"

# 检查执行结果
if [ $? -eq 0 ]; then
    echo "数据库迁移执行成功!"
else
    echo "数据库迁移执行失败!"
    exit 1
fi

# 清理环境变量
unset MYSQL_PWD
