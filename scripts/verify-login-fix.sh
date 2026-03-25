#!/bin/bash

# 登录修复验证脚本
# 用于验证 PasswordDialog 组件的修复是否成功

echo "========================================"
echo "  PSCG 登录功能修复验证脚本"
echo "========================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数器
total_tests=0
passed_tests=0
failed_tests=0

# 测试函数
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    total_tests=$((total_tests + 1))
    echo -n "测试 $total_tests: $test_name ... "
    
    if eval "$test_command"; then
        echo -e "${GREEN}✓ 通过${NC}"
        passed_tests=$((passed_tests + 1))
        return 0
    else
        echo -e "${RED}✗ 失败${NC}"
        failed_tests=$((failed_tests + 1))
        return 1
    fi
}

# 1. 检查构建文件是否存在
echo "1. 检查构建文件"
echo "-------------------"
run_test "构建目录存在" "[ -d '/www/wwwroot/PSCG/dist' ]"
run_test "index.html 存在" "[ -f '/www/wwwroot/PSCG/dist/index.html' ]"
run_test "AdminView JS 存在" "ls /www/wwwroot/PSCG/dist/assets/AdminView-*.js >/dev/null 2>&1"
echo ""

# 2. 检查源代码修改
echo "2. 检查源代码修改"
echo "-------------------"
run_test "PasswordDialog 包含 isComponentMounted" \
    "grep -q 'isComponentMounted' /www/wwwroot/PSCG/src/components/admin/auth/PasswordDialog.vue"

run_test "PasswordDialog 使用 v-show" \
    "grep -q 'v-show=\"visible\"' /www/wwwroot/PSCG/src/components/admin/auth/PasswordDialog.vue"

run_test "PasswordDialog 包含 onUnmounted" \
    "grep -q 'onUnmounted' /www/wwwroot/PSCG/src/components/admin/auth/PasswordDialog.vue"
echo ""

# 3. 检查 PM2 进程状态
echo "3. 检查服务器状态"
echo "-------------------"
run_test "PM2 进程运行中" "pm2 list | grep -q 'PSCG.*online'"
run_test "服务器端口 3001 监听" "netstat -tuln | grep -q ':3001'"
echo ""

# 4. 测试 API 端点
echo "4. 测试 API 端点"
echo "-------------------"
run_test "健康检查端点" "curl -s http://localhost:3001/api/health | grep -q 'ok\|success'"
run_test "管理员状态端点" "curl -s http://localhost:3001/api/admin/status | grep -q 'initialized'"
echo ""

# 5. 检查日志中的错误
echo "5. 检查最近的错误日志"
echo "-------------------"
error_count=$(pm2 logs pscg-app --lines 50 --nostream 2>&1 | grep -i "emitsOptions\|TypeError" | wc -l)
if [ "$error_count" -eq 0 ]; then
    echo -e "${GREEN}✓ 未发现 emitsOptions 相关错误${NC}"
    passed_tests=$((passed_tests + 1))
else
    echo -e "${RED}✗ 发现 $error_count 个错误${NC}"
    failed_tests=$((failed_tests + 1))
fi
total_tests=$((total_tests + 1))
echo ""

# 6. 浏览器测试提示
echo "6. 浏览器手动测试步骤"
echo "-------------------"
echo -e "${YELLOW}请在浏览器中执行以下测试：${NC}"
echo "1. 打开浏览器开发者工具 (F12)"
echo "2. 访问 http://your-domain/admin"
echo "3. 清除浏览器缓存 (Ctrl+Shift+Delete)"
echo "4. 刷新页面 (Ctrl+F5)"
echo "5. 输入用户名和密码登录"
echo "6. 检查控制台是否出现 'emitsOptions' 错误"
echo "7. 验证登录成功后是否正常跳转"
echo ""

# 7. 检查构建产物中的修复
echo "7. 检查构建产物"
echo "-------------------"
admin_view_js=$(ls /www/wwwroot/PSCG/dist/assets/AdminView-*.js | head -1)
if [ -f "$admin_view_js" ]; then
    # 检查是否包含最新的构建时间戳（通过文件修改时间判断）
    build_time=$(stat -c %Y "$admin_view_js" 2>/dev/null || stat -f %m "$admin_view_js" 2>/dev/null)
    current_time=$(date +%s)
    time_diff=$((current_time - build_time))
    
    if [ "$time_diff" -lt 300 ]; then  # 5分钟内
        echo -e "${GREEN}✓ 构建文件是最新的 (构建于 $time_diff 秒前)${NC}"
        passed_tests=$((passed_tests + 1))
    else
        echo -e "${YELLOW}⚠ 构建文件可能不是最新的 (构建于 $time_diff 秒前)${NC}"
        echo "  建议运行: npm run build && pm2 restart 0"
    fi
    total_tests=$((total_tests + 1))
else
    echo -e "${RED}✗ 未找到 AdminView 构建文件${NC}"
    failed_tests=$((failed_tests + 1))
    total_tests=$((total_tests + 1))
fi
echo ""

# 8. 输出测试摘要
echo "========================================"
echo "  测试摘要"
echo "========================================"
echo -e "总测试数: $total_tests"
echo -e "${GREEN}通过: $passed_tests${NC}"
echo -e "${RED}失败: $failed_tests${NC}"
echo ""

if [ "$failed_tests" -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过！修复验证成功！${NC}"
    echo ""
    echo "下一步：请在浏览器中进行手动测试"
    exit 0
else
    echo -e "${RED}✗ 有 $failed_tests 个测试失败${NC}"
    echo ""
    echo "建议操作："
    echo "1. 检查构建: npm run build"
    echo "2. 重启服务: pm2 restart 0"
    echo "3. 清除浏览器缓存并刷新"
    exit 1
fi
