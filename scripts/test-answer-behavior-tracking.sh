#!/bin/bash

# 答题行为追踪功能测试脚本

echo "========================================="
echo "答题行为追踪功能测试"
echo "========================================="
echo ""

# 数据库连接信息
DB_USER="PSCG"
DB_PASS="xgsy@8188"
DB_NAME="pscg"

echo "📊 测试前检查数据库表状态..."
echo "---"

# 检查 answer_behavior 表
BEHAVIOR_COUNT=$(mysql -u $DB_USER -p$DB_PASS -D $DB_NAME -se "SELECT COUNT(*) FROM answer_behavior;" 2>/dev/null)
echo "answer_behavior 表当前记录数: $BEHAVIOR_COUNT"

# 检查 user_learning_style 表
STYLE_COUNT=$(mysql -u $DB_USER -p$DB_PASS -D $DB_NAME -se "SELECT COUNT(*) FROM user_learning_style;" 2>/dev/null)
echo "user_learning_style 表当前记录数: $STYLE_COUNT"

echo ""
echo "🧪 测试指南："
echo "---"
echo ""
echo "1. 前端测试："
echo "   - 访问系统并登录"
echo "   - 进入任意题库"
echo "   - 答题（选择选项、修改答案）"
echo "   - 提交答案"
echo ""
echo "2. 检查答题行为数据："
echo "   mysql -u $DB_USER -p$DB_PASS -D $DB_NAME -e \"SELECT COUNT(*) FROM answer_behavior;\""
echo ""
echo "3. 查看最近的行为记录："
echo "   mysql -u $DB_USER -p$DB_PASS -D $DB_NAME -e \"SELECT ab.id, u.name, ab.answer_time, ab.answer_modifications, ab.hesitation_time, ab.is_correct, ab.created_at FROM answer_behavior ab INNER JOIN users u ON ab.user_id = u.id ORDER BY ab.created_at DESC LIMIT 10;\""
echo ""
echo "4. 检查统计数据："
echo "   mysql -u $DB_USER -p$DB_PASS -D $DB_NAME -e \"SELECT COUNT(*) as total, AVG(answer_time) as avg_time, AVG(answer_modifications) as avg_mods, AVG(hesitation_time) as avg_hesitation FROM answer_behavior;\""
echo ""
echo "5. 触发学习风格分析（需要至少 10 条数据）："
echo "   - 访问后台管理"
echo "   - 点击"学习风格"菜单"
echo "   - 选择一个用户"
echo "   - 点击"分析"按钮"
echo ""
echo "6. 查看学习风格分析结果："
echo "   mysql -u $DB_USER -p$DB_PASS -D $DB_NAME -e \"SELECT u.name, uls.learning_style_tags, uls.ai_suggestion FROM user_learning_style uls INNER JOIN users u ON uls.user_id = u.id;\""
echo ""
echo "========================================="
echo ""

# 监控日志
echo "📝 实时监控日志（Ctrl+C 退出）："
echo "---"
echo "pm2 logs 0 --lines 50"
echo ""
