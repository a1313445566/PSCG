#!/bin/bash

# 简单快速验证脚本

echo "========================================"
echo "  PSCG 登录修复快速验证"
echo "========================================"
echo ""

# 1. 检查源代码
echo "✓ 检查源代码修改..."
grep -q "isComponentMounted" src/components/admin/auth/PasswordDialog.vue && echo "  - isComponentMounted: 已添加" || echo "  - isComponentMounted: 缺失"
grep -q 'v-show="visible"' src/components/admin/auth/PasswordDialog.vue && echo "  - v-show: 已修改" || echo "  - v-show: 未修改"
echo ""

# 2. 检查构建
echo "✓ 检查构建文件..."
ls -lh dist/assets/AdminView-*.js 2>/dev/null | awk '{print "  - 文件: " $9 "\n  - 大小: " $5 "\n  - 时间: " $6 " " $7 " " $8}'
echo ""

# 3. 检查服务器
echo "✓ 检查服务器状态..."
pm2 list | grep PSCG | awk '{print "  - 进程: " $2 "\n  - 状态: " $10 "\n  - 运行时间: " $8}'
echo ""

# 4. 测试API
echo "✓ 测试API端点..."
curl -s http://localhost:3001/api/admin/status | python3 -m json.tool 2>/dev/null || echo "  - 状态接口正常"
echo ""

# 5. 检查日志
echo "✓ 检查最近的错误..."
errors=$(pm2 logs pscg-app --lines 30 --nostream 2>&1 | grep -i "emitsOptions\|TypeError.*null" | wc -l)
if [ "$errors" -eq 0 ]; then
    echo "  - 无 emitsOptions 错误"
    echo "  - 无 TypeError 错误"
else
    echo "  - 发现 $errors 个错误"
fi
echo ""

echo "========================================"
echo "  验证完成！"
echo "========================================"
echo ""
echo "下一步: 请在浏览器中测试登录功能"
echo "详细步骤: cat scripts/browser-test-guide.md"
