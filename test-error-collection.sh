#!/bin/bash

# 测试配置
API_BASE_URL="http://10.78.127.30:3001/api"
TEST_STUDENT_ID="99"
TEST_SUBJECT_ID="1"
TEST_QUESTION_ID="1"

# 测试结果记录
PASS_COUNT=0
TOTAL_COUNT=0

# 测试函数
run_test() {
  local test_name="$1"
  local test_function="$2"
  
  echo "\n=== 运行测试: $test_name ==="
  TOTAL_COUNT=$((TOTAL_COUNT + 1))
  
  if $test_function; then
    echo "✓ $test_name 测试通过"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "✗ $test_name 测试失败"
  fi
}

# 测试 1: 获取错题巩固题库
test_get_error_collection() {
  local response=$(curl -s "$API_BASE_URL/error-collection/$TEST_SUBJECT_ID?studentId=$TEST_STUDENT_ID")
  if echo "$response" | grep -q '"questions"'; then
    return 0
  else
    return 1
  fi
}

# 测试 2: 更新错题正确次数
test_update_correct_count() {
  # 先获取当前正确次数
  local collection=$(curl -s "$API_BASE