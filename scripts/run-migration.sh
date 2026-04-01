#!/bin/bash

# 数据库迁移脚本执行器

# 设置数据库连接信息
DB_USER="PSCG"
DB_PASSWORD="xgsy@8188"
DB_NAME="pscg"
DB_HOST="127.0.0.1"

# 迁移脚本路径
MIGRATION_SCRIPT="$(dirname "$0")/db-migration.sql"

# 检查脚本文件是否存在
if [ ! -f "$MIGRATION_SCRIPT" ]; then
    echo "错误: 迁移脚本文件不存在: $MIGRATION_SCRIPT"
    exit 1
fi

# 使用环境变量传递密码，避免明文暴露
export MYSQL_PWD="$DB_PASSWORD"

# 执行迁移脚本
echo "正在执行数据库迁移脚本..."
mysql -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" < "$MIGRATION_SCRIPT"

# 检查执行结果
if [ $? -eq 0 ]; then
    echo "数据库迁移执行成功!"
else
    echo "数据库迁移执行失败!"
    exit 1
fi

# 清理环境变量
unset MYSQL_PWD
