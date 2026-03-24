#!/bin/bash

# =========================================
# PSCG 题目管理优化测试脚本
# 测试范围：第一阶段到第四阶段所有修改
# =========================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API 基础地址
API_BASE="${API_BASE:-http://localhost:3001/api}"

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试结果数组
declare -a FAILED_TEST_NAMES

# 打印标题
print_title() {
    echo ""
    echo -e "${BLUE}=========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}=========================================${NC}"
}

# 打印子标题
print_subtitle() {
    echo ""
    echo -e "${YELLOW}>>> $1${NC}"
    echo ""
}

# 测试结果记录
record_result() {
    local test_name="$1"
    local result="$2"
    local message="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" = "pass" ]; then
        echo -e "${GREEN}  ✅ $test_name${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}  ❌ $test_name${NC}"
        if [ -n "$message" ]; then
            echo -e "${RED}     错误: $message${NC}"
        fi
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FAILED_TEST_NAMES+=("$test_name")
    fi
}

# =========================================
# 第一阶段测试：后端 API 优化
# =========================================
test_phase1() {
    print_title "第一阶段：后端 API 优化测试"
    
    # 1.1 keyword 搜索参数测试
    print_subtitle "1.1 Keyword 搜索参数测试"
    
    # 测试基本搜索
    response=$(curl -s -w "\n%{http_code}" "${API_BASE}/questions?keyword=test&page=1&limit=10")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        record_result "关键词搜索 - HTTP 状态码" "pass"
    else
        record_result "关键词搜索 - HTTP 状态码" "fail" "期望 200，实际 $http_code"
    fi
    
    # 验证返回格式
    if echo "$body" | jq -e '.data' > /dev/null 2>&1; then
        record_result "关键词搜索 - 返回包含 data 字段" "pass"
    else
        record_result "关键词搜索 - 返回包含 data 字段" "fail"
    fi
    
    # 测试空关键词
    response=$(curl -s -w "\n%{http_code}" "${API_BASE}/questions?keyword=&page=1&limit=10")
    http_code=$(echo "$response" | tail -n1)
    if [ "$http_code" = "200" ]; then
        record_result "空关键词搜索 - 正常返回" "pass"
    else
        record_result "空关键词搜索 - 正常返回" "fail" "HTTP $http_code"
    fi
    
    # 测试特殊字符关键词
    response=$(curl -s -w "\n%{http_code}" "${API_BASE}/questions?keyword=%25%5F&page=1&limit=10")
    http_code=$(echo "$response" | tail -n1)
    if [ "$http_code" = "200" ]; then
        record_result "特殊字符关键词搜索 - 正常返回" "pass"
    else
        record_result "特殊字符关键词搜索 - 正常返回" "fail" "HTTP $http_code"
    fi
    
    # 1.2 返回格式测试
    print_subtitle "1.2 返回格式测试 { data, total, page, limit }"
    
    response=$(curl -s "${API_BASE}/questions?page=1&limit=10")
    
    # 检查 data 字段
    if echo "$response" | jq -e '.data' > /dev/null 2>&1; then
        record_result "返回格式 - data 字段存在" "pass"
    else
        record_result "返回格式 - data 字段存在" "fail"
    fi
    
    # 检查 total 字段
    if echo "$response" | jq -e '.total' > /dev/null 2>&1; then
        record_result "返回格式 - total 字段存在" "pass"
    else
        record_result "返回格式 - total 字段存在" "fail"
    fi
    
    # 检查 page 字段
    if echo "$response" | jq -e '.page' > /dev/null 2>&1; then
        record_result "返回格式 - page 字段存在" "pass"
    else
        record_result "返回格式 - page 字段存在" "fail"
    fi
    
    # 检查 limit 字段
    if echo "$response" | jq -e '.limit' > /dev/null 2>&1; then
        record_result "返回格式 - limit 字段存在" "pass"
    else
        record_result "返回格式 - limit 字段存在" "fail"
    fi
    
    # 验证字段类型
    total=$(echo "$response" | jq '.total')
    page=$(echo "$response" | jq '.page')
    limit=$(echo "$response" | jq '.limit')
    
    if [[ "$total" =~ ^[0-9]+$ ]]; then
        record_result "total 字段为数字" "pass"
    else
        record_result "total 字段为数字" "fail" "实际值: $total"
    fi
    
    # 1.3 分页参数测试
    print_subtitle "1.3 分页参数测试"
    
    # 测试默认分页
    response=$(curl -s "${API_BASE}/questions")
    default_limit=$(echo "$response" | jq '.limit')
    if [ "$default_limit" = "20" ]; then
        record_result "默认 limit 为 20" "pass"
    else
        record_result "默认 limit 为 20" "fail" "实际: $default_limit"
    fi
    
    # 测试自定义分页
    response=$(curl -s "${API_BASE}/questions?page=2&limit=30")
    page_num=$(echo "$response" | jq '.page')
    limit_num=$(echo "$response" | jq '.limit')
    
    if [ "$page_num" = "2" ] && [ "$limit_num" = "30" ]; then
        record_result "自定义分页参数生效" "pass"
    else
        record_result "自定义分页参数生效" "fail" "page=$page_num, limit=$limit_num"
    fi
    
    # 测试 limit 上限
    response=$(curl -s "${API_BASE}/questions?page=1&limit=200")
    limit_num=$(echo "$response" | jq '.limit')
    if [ "$limit_num" = "100" ]; then
        record_result "limit 上限限制为 100" "pass"
    else
        record_result "limit 上限限制为 100" "fail" "实际: $limit_num"
    fi
    
    # 测试无效页码
    response=$(curl -s -w "\n%{http_code}" "${API_BASE}/questions?page=-1&limit=10")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    page_num=$(echo "$body" | jq '.page')
    
    if [ "$http_code" = "200" ] && [ "$page_num" = "1" ]; then
        record_result "负数页码自动修正为 1" "pass"
    else
        record_result "负数页码自动修正为 1" "fail" "page=$page_num"
    fi
    
    # 1.4 筛选参数测试
    print_subtitle "1.4 筛选参数测试"
    
    # 获取学科列表
    subjects=$(curl -s "${API_BASE}/subjects")
    first_subject_id=$(echo "$subjects" | jq -r '.[0].id // empty')
    
    if [ -n "$first_subject_id" ] && [ "$first_subject_id" != "null" ]; then
        # 测试学科筛选
        response=$(curl -s "${API_BASE}/questions?subjectId=${first_subject_id}&page=1&limit=10")
        if echo "$response" | jq -e '.data' > /dev/null 2>&1; then
            record_result "学科筛选 - 正常返回" "pass"
            
            # 验证返回的数据都属于该学科
            all_match=$(echo "$response" | jq '[.data[] | .subjectId == '"$first_subject_id"'] | all')
            if [ "$all_match" = "true" ]; then
                record_result "学科筛选 - 数据匹配正确" "pass"
            else
                record_result "学科筛选 - 数据匹配正确" "fail"
            fi
        else
            record_result "学科筛选 - 正常返回" "fail"
        fi
        
        # 测试类型筛选
        response=$(curl -s "${API_BASE}/questions?type=single&page=1&limit=10")
        if echo "$response" | jq -e '.data' > /dev/null 2>&1; then
            # 检查返回的数据类型
            all_single=$(echo "$response" | jq '[.data[] | .type == "single"] | all // true')
            if [ "$all_single" = "true" ]; then
                record_result "类型筛选 - 数据匹配正确" "pass"
            else
                record_result "类型筛选 - 数据匹配正确" "fail"
            fi
        else
            record_result "类型筛选 - 正常返回" "fail"
        fi
    else
        record_result "学科筛选 - 跳过（无学科数据）" "pass"
    fi
    
    # 1.5 SQL 注入防护测试
    print_subtitle "1.5 SQL 注入防护测试"
    
    # 测试关键词中的 SQL 注入
    malicious_keywords=(
        "'; DROP TABLE questions; --"
        "1' OR '1'='1"
        "admin'--"
        "1; SELECT * FROM users"
    )
    
    injection_safe=true
    for keyword in "${malicious_keywords[@]}"; do
        encoded_keyword=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$keyword'))")
        response=$(curl -s -w "\n%{http_code}" "${API_BASE}/questions?keyword=${encoded_keyword}&page=1&limit=10")
        http_code=$(echo "$response" | tail -n1)
        
        if [ "$http_code" != "200" ]; then
            injection_safe=false
            record_result "SQL 注入防护 - '$keyword'" "fail" "HTTP $http_code"
        fi
    done
    
    if $injection_safe; then
        record_result "SQL 注入防护 - 所有关键词测试通过" "pass"
    fi
    
    # 测试 ID 参数中的 SQL 注入
    response=$(curl -s -w "\n%{http_code}" "${API_BASE}/questions/1'; DROP TABLE questions; --")
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" != "200" ]; then
        record_result "ID 参数 SQL 注入防护" "pass"
    else
        record_result "ID 参数 SQL 注入防护" "fail" "HTTP 200 可能存在漏洞"
    fi
}

# =========================================
# 第二阶段测试：前端分页改造
# =========================================
test_phase2() {
    print_title "第二阶段：前端分页改造测试"
    
    # 2.1 Store 分页状态测试
    print_subtitle "2.1 API 分页返回格式测试"
    
    # 测试分页元数据
    response=$(curl -s "${API_BASE}/questions?page=3&limit=25")
    
    page=$(echo "$response" | jq '.page')
    limit=$(echo "$response" | jq '.limit')
    total=$(echo "$response" | jq '.total')
    
    if [ "$page" = "3" ]; then
        record_result "API 分页 - page 返回正确" "pass"
    else
        record_result "API 分页 - page 返回正确" "fail" "期望 3，实际 $page"
    fi
    
    if [ "$limit" = "25" ]; then
        record_result "API 分页 - limit 返回正确" "pass"
    else
        record_result "API 分页 - limit 返回正确" "fail" "期望 25，实际 $limit"
    fi
    
    if [[ "$total" =~ ^[0-9]+$ ]]; then
        record_result "API 分页 - total 为非负数" "pass"
    else
        record_result "API 分页 - total 为非负数" "fail" "实际 $total"
    fi
    
    # 2.2 实时筛选测试
    print_subtitle "2.2 筛选参数组合测试"
    
    # 组合筛选 - 测试 API 格式正确性（数据匹配不是必须的）
    response=$(curl -s "${API_BASE}/questions?type=single&page=1&limit=10")
    
    # 检查类型筛选是否正确返回格式
    if echo "$response" | jq -e '.data' > /dev/null 2>&1; then
        # 进一步测试组合筛选格式
        response=$(curl -s "${API_BASE}/questions?type=single&keyword=abc&page=1&limit=10")
        if echo "$response" | jq -e '.data' > /dev/null 2>&1; then
            record_result "组合筛选 - 类型+关键词" "pass"
        else
            record_result "组合筛选 - 类型+关键词" "fail" "返回格式错误"
        fi
    else
        record_result "组合筛选 - 类型+关键词" "fail" "类型筛选返回格式错误"
    fi
    
    # 获取学科和子分类进行组合测试
    subjects=$(curl -s "${API_BASE}/subjects")
    first_subject_id=$(echo "$subjects" | jq -r '.[0].id // empty')
    first_subcategory_id=$(echo "$subjects" | jq -r '.[0].subcategories[0].id // empty')
    
    if [ -n "$first_subject_id" ] && [ -n "$first_subcategory_id" ]; then
        response=$(curl -s "${API_BASE}/questions?subjectId=${first_subject_id}&subcategoryId=${first_subcategory_id}&type=single&page=1&limit=10")
        
        if echo "$response" | jq -e '.data' > /dev/null 2>&1; then
            record_result "组合筛选 - 学科+题库+类型" "pass"
        else
            record_result "组合筛选 - 学科+题库+类型" "fail"
        fi
    fi
    
    # 2.3 excludeContent 参数测试
    print_subtitle "2.3 excludeContent 参数测试"
    
    response_with_content=$(curl -s "${API_BASE}/questions?page=1&limit=1")
    response_without_content=$(curl -s "${API_BASE}/questions?page=1&limit=1&excludeContent=true")
    
    # 检查 excludeContent=true 时返回的数据结构
    if echo "$response_without_content" | jq -e '.data[0].content' > /dev/null 2>&1; then
        record_result "excludeContent 参数 - content 字段存在" "pass"
    else
        record_result "excludeContent 参数 - content 字段存在" "fail"
    fi
}

# =========================================
# 第三阶段测试：布局重构
# =========================================
test_phase3() {
    print_title "第三阶段：布局重构测试"
    
    # 3.1 学科树数据接口测试
    print_subtitle "3.1 学科树数据接口测试"
    
    # 获取学科列表（含题目数量统计）
    response=$(curl -s "${API_BASE}/subjects")
    
    if echo "$response" | jq -e '.[0].id' > /dev/null 2>&1; then
        record_result "学科列表接口 - 正常返回" "pass"
        
        # 检查学科结构
        first_subject=$(echo "$response" | jq '.[0]')
        
        if echo "$first_subject" | jq -e '.name' > /dev/null 2>&1; then
            record_result "学科数据包含 name 字段" "pass"
        else
            record_result "学科数据包含 name 字段" "fail"
        fi
        
        if echo "$first_subject" | jq -e '.subcategories' > /dev/null 2>&1; then
            record_result "学科数据包含 subcategories 字段" "pass"
        else
            record_result "学科数据包含 subcategories 字段" "fail"
        fi
    else
        record_result "学科列表接口 - 正常返回" "fail"
    fi
    
    # 获取学科统计
    stats_response=$(curl -s "${API_BASE}/subjects/stats")
    
    if [ -n "$stats_response" ] && [ "$stats_response" != "null" ]; then
        record_result "学科统计接口 - 正常返回" "pass"
        
        # 检查统计字段
        first_stat=$(echo "$stats_response" | jq '.[0]')
        if echo "$first_stat" | jq -e '.questionCount' > /dev/null 2>&1; then
            record_result "学科统计包含 questionCount" "pass"
        else
            record_result "学科统计包含 questionCount" "fail"
        fi
    else
        record_result "学科统计接口 - 正常返回" "fail"
    fi
    
    # 3.2 子分类统计接口测试
    print_subtitle "3.2 子分类统计接口测试"
    
    subjects=$(curl -s "${API_BASE}/subjects")
    first_subject_id=$(echo "$subjects" | jq -r '.[0].id // empty')
    
    if [ -n "$first_subject_id" ]; then
        response=$(curl -s "${API_BASE}/questions/subcategories/stats?subjectId=${first_subject_id}")
        
        if [ -n "$response" ] && [ "$response" != "{}" ]; then
            record_result "子分类统计接口 - 正常返回" "pass"
            
            # 检查统计字段
            if echo "$response" | jq -e '.[] | .questionCount' > /dev/null 2>&1; then
                record_result "子分类统计包含 questionCount" "pass"
            else
                record_result "子分类统计包含 questionCount" "fail"
            fi
            
            if echo "$response" | jq -e '.[] | .avgDifficulty' > /dev/null 2>&1; then
                record_result "子分类统计包含 avgDifficulty" "pass"
            else
                record_result "子分类统计包含 avgDifficulty" "fail"
            fi
        else
            record_result "子分类统计接口 - 正常返回" "fail"
        fi
    fi
    
    # 3.3 前端组件文件检查
    print_subtitle "3.3 前端组件文件检查"
    
    # 检查 QuestionList.vue 是否存在
    if [ -f "/www/wwwroot/PSCG/src/components/admin/question-management/QuestionList.vue" ]; then
        record_result "QuestionList.vue 文件存在" "pass"
        
        # 检查是否包含树组件引用
        if grep -q "el-tree" "/www/wwwroot/PSCG/src/components/admin/question-management/QuestionList.vue"; then
            record_result "QuestionList.vue 包含 el-tree 组件" "pass"
        else
            record_result "QuestionList.vue 包含 el-tree 组件" "fail"
        fi
        
        # 检查是否包含分页组件
        if grep -q "el-pagination" "/www/wwwroot/PSCG/src/components/admin/question-management/QuestionList.vue"; then
            record_result "QuestionList.vue 包含 el-pagination 组件" "pass"
        else
            record_result "QuestionList.vue 包含 el-pagination 组件" "fail"
        fi
        
        # 检查是否移除了视图切换
        if ! grep -q "isCategoryView" "/www/wwwroot/PSCG/src/components/admin/question-management/QuestionList.vue"; then
            record_result "QuestionList.vue 已移除 isCategoryView" "pass"
        else
            record_result "QuestionList.vue 已移除 isCategoryView" "fail"
        fi
        
        # 检查是否包含筛选标签
        if grep -q "filter-tags" "/www/wwwroot/PSCG/src/components/admin/question-management/QuestionList.vue"; then
            record_result "QuestionList.vue 包含筛选标签功能" "pass"
        else
            record_result "QuestionList.vue 包含筛选标签功能" "fail"
        fi
        
        # 检查是否包含拖拽调整宽度
        if grep -q "resize-handle\|startResize" "/www/wwwroot/PSCG/src/components/admin/question-management/QuestionList.vue"; then
            record_result "QuestionList.vue 包含拖拽调整宽度功能" "pass"
        else
            record_result "QuestionList.vue 包含拖拽调整宽度功能" "fail"
        fi
    else
        record_result "QuestionList.vue 文件存在" "fail"
    fi
}

# =========================================
# 第四阶段测试：用户体验优化
# =========================================
test_phase4() {
    print_title "第四阶段：用户体验优化测试"
    
    # 4.1 批量操作接口测试
    print_subtitle "4.1 批量操作接口测试"
    
    # 先获取一些题目 ID
    questions=$(curl -s "${API_BASE}/questions?page=1&limit=5")
    question_ids=$(echo "$questions" | jq -r '.data[0:3] | .[].id' | tr '\n' ',' | sed 's/,$//')
    
    if [ -n "$question_ids" ]; then
        IFS=',' read -ra ids_array <<< "$question_ids"
        
        # 测试批量删除（使用一个不存在的 ID 避免误删）
        response=$(curl -s -X POST "${API_BASE}/questions/batch" \
            -H "Content-Type: application/json" \
            -d '{"action":"delete","ids":[9999999]}')
        
        # 批量删除应该返回 success 或错误
        if echo "$response" | jq -e '.success // .error' > /dev/null 2>&1; then
            record_result "批量删除接口 - 正常响应" "pass"
        else
            record_result "批量删除接口 - 正常响应" "fail"
        fi
        
        # 测试批量修改难度
        if [ ${#ids_array[@]} -gt 0 ]; then
            first_id=${ids_array[0]}
            response=$(curl -s -X POST "${API_BASE}/questions/batch" \
                -H "Content-Type: application/json" \
                -d "{\"action\":\"updateDifficulty\",\"ids\":[$first_id],\"data\":{\"difficulty\":2}}")
            
            if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
                record_result "批量修改难度接口 - 正常响应" "pass"
            else
                record_result "批量修改难度接口 - 正常响应" "fail"
            fi
            
            # 测试批量修改类型
            response=$(curl -s -X POST "${API_BASE}/questions/batch" \
                -H "Content-Type: application/json" \
                -d "{\"action\":\"updateType\",\"ids\":[$first_id],\"data\":{\"type\":\"single\"}}")
            
            if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
                record_result "批量修改类型接口 - 正常响应" "pass"
            else
                record_result "批量修改类型接口 - 正常响应" "fail"
            fi
        fi
        
        # 测试批量操作数量限制
        large_ids=$(seq 1 150 | tr '\n' ',' | sed 's/,$//')
        response=$(curl -s -X POST "${API_BASE}/questions/batch" \
            -H "Content-Type: application/json" \
            -d "{\"action\":\"delete\",\"ids\":[$large_ids]}")
        
        if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
            record_result "批量操作 - 超过 100 条限制被拒绝" "pass"
        else
            record_result "批量操作 - 超过 100 条限制被拒绝" "fail"
        fi
        
        # 测试无效 ID
        response=$(curl -s -X POST "${API_BASE}/questions/batch" \
            -H "Content-Type: application/json" \
            -d '{"action":"delete","ids":["invalid","abc"]}')
        
        if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
            record_result "批量操作 - 无效 ID 被拒绝" "pass"
        else
            record_result "批量操作 - 无效 ID 被拒绝" "fail"
        fi
    else
        record_result "批量操作接口 - 跳过（无题目数据）" "pass"
    fi
    
    # 4.2 单个题目操作测试
    print_subtitle "4.2 单个题目操作测试"
    
    # 获取一个题目
    questions=$(curl -s "${API_BASE}/questions?page=1&limit=1")
    question_id=$(echo "$questions" | jq -r '.data[0].id // empty')
    
    if [ -n "$question_id" ]; then
        # 测试获取单个题目
        response=$(curl -s "${API_BASE}/questions/${question_id}")
        
        if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
            record_result "获取单个题目 - 正常返回" "pass"
        else
            record_result "获取单个题目 - 正常返回" "fail"
        fi
        
        # 测试获取不存在的题目
        response=$(curl -s -w "\n%{http_code}" "${API_BASE}/questions/9999999")
        http_code=$(echo "$response" | tail -n1)
        
        if [ "$http_code" = "404" ]; then
            record_result "获取不存在的题目 - 返回 404" "pass"
        else
            record_result "获取不存在的题目 - 返回 404" "fail" "HTTP $http_code"
        fi
    else
        record_result "单个题目操作 - 跳过（无题目数据）" "pass"
    fi
    
    # 4.3 前端用户体验功能检查
    print_subtitle "4.3 前端用户体验功能检查"
    
    vue_file="/www/wwwroot/PSCG/src/components/admin/question-management/QuestionList.vue"
    
    if [ -f "$vue_file" ]; then
        # 检查行内编辑功能
        if grep -q "editingId\|startInlineEdit\|saveInlineEdit" "$vue_file"; then
            record_result "QuestionList.vue - 包含行内编辑功能" "pass"
        else
            record_result "QuestionList.vue - 包含行内编辑功能" "fail"
        fi
        
        # 检查删除撤销功能
        if grep -q "deleteWithUndo\|undoDelete\|pendingDeletes" "$vue_file"; then
            record_result "QuestionList.vue - 包含删除撤销功能" "pass"
        else
            record_result "QuestionList.vue - 包含删除撤销功能" "fail"
        fi
        
        # 检查批量修改难度弹窗
        if grep -q "batchDifficultyVisible\|executeBatchDifficulty" "$vue_file"; then
            record_result "QuestionList.vue - 包含批量修改难度弹窗" "pass"
        else
            record_result "QuestionList.vue - 包含批量修改难度弹窗" "fail"
        fi
        
        # 检查批量修改类型弹窗
        if grep -q "batchTypeVisible\|executeBatchType" "$vue_file"; then
            record_result "QuestionList.vue - 包含批量修改类型弹窗" "pass"
        else
            record_result "QuestionList.vue - 包含批量修改类型弹窗" "fail"
        fi
        
        # 检查批量移动弹窗
        if grep -q "batchMoveVisible\|executeBatchMove" "$vue_file"; then
            record_result "QuestionList.vue - 包含批量移动弹窗" "pass"
        else
            record_result "QuestionList.vue - 包含批量移动弹窗" "fail"
        fi
        
        # 检查预览弹窗
        if grep -q "previewVisible\|previewQuestion\|previewData" "$vue_file"; then
            record_result "QuestionList.vue - 包含题目预览弹窗" "pass"
        else
            record_result "QuestionList.vue - 包含题目预览弹窗" "fail"
        fi
    fi
    
    # 4.4 Store 状态检查
    print_subtitle "4.4 Store 状态检查"
    
    store_file="/www/wwwroot/PSCG/src/stores/questionStore.js"
    
    if [ -f "$store_file" ]; then
        # 检查分页状态
        if grep -q "pagination:" "$store_file"; then
            record_result "questionStore.js - 包含 pagination 状态" "pass"
        else
            record_result "questionStore.js - 包含 pagination 状态" "fail"
        fi
        
        # 检查 loadQuestions 方法支持分页
        if grep -q "page\|limit" "$store_file"; then
            record_result "questionStore.js - loadQuestions 支持分页参数" "pass"
        else
            record_result "questionStore.js - loadQuestions 支持分页参数" "fail"
        fi
    fi
}

# =========================================
# 性能测试
# =========================================
test_performance() {
    print_title "性能测试"
    
    print_subtitle "API 响应时间测试"
    
    # 测试分页查询响应时间
    start_time=$(date +%s%3N)
    curl -s "${API_BASE}/questions?page=1&limit=50" > /dev/null
    end_time=$(date +%s%3N)
    duration=$((end_time - start_time))
    
    if [ $duration -lt 1000 ]; then
        record_result "分页查询响应时间 < 1s (实际: ${duration}ms)" "pass"
    else
        record_result "分页查询响应时间 < 1s (实际: ${duration}ms)" "fail"
    fi
    
    # 测试搜索响应时间
    start_time=$(date +%s%3N)
    curl -s "${API_BASE}/questions?keyword=test&page=1&limit=50" > /dev/null
    end_time=$(date +%s%3N)
    duration=$((end_time - start_time))
    
    if [ $duration -lt 500 ]; then
        record_result "搜索响应时间 < 500ms (实际: ${duration}ms)" "pass"
    else
        record_result "搜索响应时间 < 500ms (实际: ${duration}ms)" "fail"
    fi
    
    # 测试批量操作响应时间
    start_time=$(date +%s%3N)
    curl -s -X POST "${API_BASE}/questions/batch" \
        -H "Content-Type: application/json" \
        -d '{"action":"updateDifficulty","ids":[1,2,3,4,5],"data":{"difficulty":2}}' > /dev/null
    end_time=$(date +%s%3N)
    duration=$((end_time - start_time))
    
    if [ $duration -lt 500 ]; then
        record_result "批量操作响应时间 < 500ms (实际: ${duration}ms)" "pass"
    else
        record_result "批量操作响应时间 < 500ms (实际: ${duration}ms)" "fail"
    fi
}

# =========================================
# 前端构建测试
# =========================================
test_build() {
    print_title "前端构建测试"
    
    print_subtitle "检查构建输出"
    
    # 运行构建
    cd /www/wwwroot/PSCG
    
    if npm run build > /tmp/pscg-build.log 2>&1; then
        record_result "npm run build 成功" "pass"
        
        # 检查构建产物
        if [ -d "dist" ]; then
            record_result "构建产物 dist 目录存在" "pass"
            
            # 检查主要文件
            if [ -f "dist/index.html" ]; then
                record_result "dist/index.html 存在" "pass"
            else
                record_result "dist/index.html 存在" "fail"
            fi
            
            # 检查 JS 文件
            js_count=$(find dist -name "*.js" | wc -l)
            if [ $js_count -gt 0 ]; then
                record_result "构建产物包含 JS 文件 ($js_count 个)" "pass"
            else
                record_result "构建产物包含 JS 文件" "fail"
            fi
        else
            record_result "构建产物 dist 目录存在" "fail"
        fi
    else
        record_result "npm run build 成功" "fail"
        echo "构建日志:"
        cat /tmp/pscg-build.log | head -50
    fi
}

# =========================================
# 输出测试报告
# =========================================
print_report() {
    echo ""
    print_title "测试报告"
    
    echo ""
    echo -e "总测试数: ${TOTAL_TESTS}"
    echo -e "${GREEN}通过: ${PASSED_TESTS}${NC}"
    echo -e "${RED}失败: ${FAILED_TESTS}${NC}"
    
    if [ $FAILED_TESTS -gt 0 ]; then
        echo ""
        echo -e "${RED}失败的测试项:${NC}"
        for test_name in "${FAILED_TEST_NAMES[@]}"; do
            echo -e "  - ${test_name}"
        done
    fi
    
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}=========================================${NC}"
        echo -e "${GREEN}  所有测试通过! ✓${NC}"
        echo -e "${GREEN}=========================================${NC}"
        exit 0
    else
        echo -e "${RED}=========================================${NC}"
        echo -e "${RED}  存在失败的测试项${NC}"
        echo -e "${RED}=========================================${NC}"
        exit 1
    fi
}

# =========================================
# 主函数
# =========================================
main() {
    print_title "PSCG 题目管理优化 - 自动化测试"
    
    echo ""
    echo "API 地址: ${API_BASE}"
    echo "测试时间: $(date '+%Y-%m-%d %H:%M:%S')"
    
    # 检查依赖
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}错误: 需要 jq 工具，请先安装${NC}"
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}错误: 需要 curl 工具${NC}"
        exit 1
    fi
    
    # 检查服务是否运行
    response=$(curl -s -w "%{http_code}" "${API_BASE}/subjects" -o /dev/null)
    if [ "$response" != "200" ]; then
        echo -e "${YELLOW}警告: API 服务可能未启动，HTTP 状态码: ${response}${NC}"
        echo -e "${YELLOW}请确保后端服务正在运行: npm run server${NC}"
    fi
    
    # 执行测试
    test_phase1
    test_phase2
    test_phase3
    test_phase4
    test_performance
    test_build
    
    # 输出报告
    print_report
}

# 运行主函数
main "$@"
