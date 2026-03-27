#!/bin/bash

# AI 自然语言分析扩展上下文测试脚本
# 测试 AI 是否能够使用新增的高级表

echo "========================================="
echo "AI 自然语言分析扩展上下文测试"
echo "========================================="
echo ""

API_URL="http://localhost:3001/api/ai/smart-analyze"

# 测试 1: 题目语义搜索（使用 question_semantic_analysis 表）
echo "📝 测试 1: 题目语义搜索"
echo "问题: 找出所有关于分数的题目"
echo "---"
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"question": "找出所有关于分数的题目"}' | jq -r '.result' | head -c 500
echo ""
echo ""
echo "✅ 如果看到题目分析结果，说明 question_semantic_analysis 表已生效"
echo ""
echo "按回车继续下一个测试..."
read

# 测试 2: 学习风格查询（使用 user_learning_style 表）
echo ""
echo "📝 测试 2: 学习风格查询"
echo "问题: 张三的学习风格是什么？"
echo "---"
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"question": "张三的学习风格是什么？"}' | jq -r '.result' | head -c 500
echo ""
echo ""
echo "✅ 如果看到学习风格分析，说明 user_learning_style 表已生效"
echo ""
echo "按回车继续下一个测试..."
read

# 测试 3: 答题行为分析（使用 answer_behavior 表）
echo ""
echo "📝 测试 3: 答题行为分析"
echo "问题: 哪些学生喜欢做难题？"
echo "---"
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"question": "哪些学生喜欢做难题？"}' | jq -r '.result' | head -c 500
echo ""
echo ""
echo "✅ 如果看到答题行为分析，说明 answer_behavior 表已生效"
echo ""
echo "按回车继续下一个测试..."
read

# 测试 4: 学习进度查询（使用 learning_progress 表）
echo ""
echo "📝 测试 4: 学习进度查询"
echo "问题: 李四对分数加法的掌握情况如何？"
echo "---"
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"question": "李四对分数加法的掌握情况如何？"}' | jq -r '.result' | head -c 500
echo ""
echo ""
echo "✅ 如果看到学习进度分析，说明 learning_progress 表已生效"
echo ""

echo ""
echo "========================================="
echo "测试完成！"
echo "========================================="
echo ""
echo "📊 预期结果："
echo "- 测试 1: 应该能找到关于'分数'的题目"
echo "- 测试 2: 应该能分析张三的学习风格（如果数据存在）"
echo "- 测试 3: 应该能分析学生的答题行为偏好（如果数据存在）"
echo "- 测试 4: 应该能查询学习进度（如果数据存在）"
echo ""
echo "⚠️  注意："
echo "- 如果某些表没有数据，AI 会智能降级到基础表查询"
echo "- 这是正常现象，不影响功能使用"
echo "- 随着数据的积累，AI 的分析会越来越全面"
echo ""
