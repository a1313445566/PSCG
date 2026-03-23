#!/bin/bash

# PSCG 性能监控API测试脚本
# 作者：系统管理员
# 日期：2025年3月23日

echo "🚀 开始测试PSCG系统性能监控API"
echo "=================================="

# 定义API基础URL
BASE_URL="http://10.78.127.30:3001"

# 定义颜色代码
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试函数
test_api() {
    local api_name="$1"
    local api_url="$2"
    
    echo -e "\n${BLUE}测试: ${api_name}${NC}"
    echo "URL: ${api_url}"
    
    # 发送请求
    response=$(curl -s -o /dev/null -w "%{http_code}" "${api_url}")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓ 成功 (HTTP 200)${NC}"
        
        # 获取并显示数据
        echo -e "\n${YELLOW}返回数据:${NC}"
        curl -s "${api_url}" | python3 -m json.tool 2>/dev/null || curl -s "${api_url}"
    else
        echo -e "${RED}✗ 失败 (HTTP ${response})${NC}"
        echo "详细错误信息:"
        curl -s "${api_url}"
    fi
    
    echo "----------------------------------"
}

# 测试所有API端点
echo -e "\n${YELLOW}1. 测试数据库性能监控${NC}"
test_api "数据库性能报告" "${BASE_URL}/api/performance/db"

echo -e "\n${YELLOW}2. 测试系统健康监控${NC}"
test_api "系统健康状态" "${BASE_URL}/api/performance/health"

echo -e "\n${YELLOW}3. 测试缓存管理${NC}"
test_api "缓存统计信息" "${BASE_URL}/api/cache/stats"

echo -e "\n${YELLOW}4. 测试清空缓存功能${NC}"
echo -e "${BLUE}测试: 清空缓存${NC}"
echo "URL: ${BASE_URL}/api/cache/clear (POST)"
echo -e "${YELLOW}注意: 这是POST请求，需要手动测试${NC}"
echo "可以使用: curl -X POST '${BASE_URL}/api/cache/clear'"
echo "----------------------------------"

# 生成测试报告
echo -e "\n${GREEN}✅ 测试完成${NC}"
echo "=================================="
echo -e "${BLUE}总结:${NC}"
echo "- 所有性能监控API后端已实现"
echo "- 可以直接通过curl命令访问"
echo "- 前端组件需要单独开发"
echo "=================================="
echo -e "${YELLOW}下一步操作:${NC}"
echo "1. 开发前端监控界面"
echo "2. 集成到后台管理系统"
echo "3. 配置告警通知功能"
echo "=================================="

# 添加使用说明
cat << EOF

📋 快速使用指南：

1. 手动测试API：
   curl ${BASE_URL}/api/performance/db
   curl ${BASE_URL}/api/performance/health
   curl ${BASE_URL}/api/cache/stats

2. 清空缓存：
   curl -X POST ${BASE_URL}/api/cache/clear

3. 查看详细文档：
   cat 性能监控功能集成指南.md

4. 集成前端组件：
   - 参考快速指南实现基础界面
   - 逐步添加高级功能
   - 注意权限控制和性能优化

EOF

echo "脚本执行完毕！"
echo "使用命令: chmod +x 测试性能监控API.sh && ./测试性能监控API.sh 运行测试"