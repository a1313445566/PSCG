#!/bin/bash
# 选项打乱功能快速测试脚本
# 使用方法: bash scripts/quick-test.sh

echo "================================"
echo "选项打乱功能快速测试"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 检查后端服务
echo -e "${YELLOW}1. 检查后端服务状态...${NC}"
if pm2 status | grep -q "online"; then
    echo -e "${GREEN}✅ 后端服务运行正常${NC}"
    pm2 status | grep "PSCG"
else
    echo -e "${RED}❌ 后端服务未运行${NC}"
    echo "请运行: pm2 start server.cjs --name PSCG"
    exit 1
fi
echo ""

# 2. 运行单元测试
echo -e "${YELLOW}2. 运行单元测试...${NC}"
node scripts/test-shuffle-options.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 单元测试全部通过${NC}"
else
    echo -e "${RED}❌ 单元测试失败${NC}"
    exit 1
fi
echo ""

# 3. 检查前端文件
echo -e "${YELLOW}3. 检查前端文件...${NC}"
if [ -f "dist/index.html" ]; then
    echo -e "${GREEN}✅ 前端文件已构建${NC}"
    ls -lh dist/ | head -5
else
    echo -e "${YELLOW}⚠️  前端文件未构建${NC}"
    echo "请运行: npm run build"
fi
echo ""

# 4. 检查数据库连接
echo -e "${YELLOW}4. 检查关键文件...${NC}"
files=(
    "src/utils/shuffleOptions.js"
    "src/views/QuizView.vue"
    "routes/quiz.js"
    "src/components/admin/basic-settings/AnswerSetting.vue"
)

all_files_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file 不存在${NC}"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = true ]; then
    echo -e "${GREEN}✅ 所有关键文件存在${NC}"
else
    echo -e "${RED}❌ 部分文件缺失${NC}"
    exit 1
fi
echo ""

# 5. 检查文档
echo -e "${YELLOW}5. 检查文档...${NC}"
docs=(
    "DOCS/选项打乱功能实现说明.md"
    "DOCS/选项打乱功能控制说明.md"
    "DOCS/选项打乱功能测试指南.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✅ $doc${NC}"
    else
        echo -e "${YELLOW}⚠️  $doc 不存在${NC}"
    fi
done
echo ""

# 6. 总结
echo "================================"
echo -e "${GREEN}✅ 快速测试完成！${NC}"
echo "================================"
echo ""
echo "📋 下一步操作："
echo ""
echo "1. 构建前端（如果未构建）："
echo "   npm run build"
echo ""
echo "2. 重启服务："
echo "   pm2 restart 0"
echo ""
echo "3. 进行功能测试："
echo "   - 后台登录：设置 → 答题设置 → 答案随机排序"
echo "   - 前端登录：开始答题 → 观察选项顺序"
echo ""
echo "4. 查看详细测试指南："
echo "   cat DOCS/选项打乱功能测试指南.md"
echo ""
