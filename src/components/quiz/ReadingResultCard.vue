<template>
  <div class="reading-result-card">
    <!-- 阅读材料 -->
    <div class="passage-section">
      <div class="passage-header">
        <div class="header-left">
          <span class="header-icon">📖</span>
          <span class="header-text">阅读材料</span>
        </div>
        <div class="question-type-badge type-reading">阅读理解</div>
      </div>
      <div class="passage-content" v-html="question.content"></div>
    </div>

    <!-- 小题结果列表 -->
    <div class="sub-questions-section">
      <div class="sub-questions-header">
        <span class="header-icon">📝</span>
        <span class="header-text">
          小题结果（{{ result?.correctCount || 0 }}/{{ result?.totalSubQuestions || 0 }}）
        </span>
        <el-tag :type="isAllCorrect ? 'success' : 'warning'" size="small">
          {{ isAllCorrect ? '全对' : '有错' }}
        </el-tag>
      </div>

      <div v-if="result?.subQuestionResults" class="sub-questions-list">
        <div
          v-for="(sqResult, index) in result.subQuestionResults"
          :key="index"
          class="sub-question-result"
          :class="{ 'is-correct': sqResult?.isCorrect }"
        >
          <div class="sub-question-header">
            <span class="sub-question-number">第 {{ index + 1 }} 题</span>
            <el-tag :type="sqResult?.isCorrect ? 'success' : 'danger'" size="small">
              {{ sqResult?.isCorrect ? '正确' : '错误' }}
            </el-tag>
          </div>

          <!-- 小题内容 -->
          <div v-if="sqResult" class="sub-question-content">
            <div v-html="getSubQuestionContent(index + 1)"></div>
          </div>

          <!-- 选项列表 -->
          <div v-if="sqResult" class="sub-question-options">
            <div
              v-for="(option, optIndex) in getSubQuestionOptions(index + 1)"
              :key="optIndex"
              class="option-item"
              :class="{
                'is-selected': sqResult.userAnswer === getOptionLabel(optIndex),
                'is-correct': sqResult.correctAnswer === getOptionLabel(optIndex)
              }"
            >
              <span class="option-label">{{ getOptionLabel(optIndex) }}.</span>
              <span class="option-text" v-html="option"></span>
            </div>
          </div>

          <!-- 答案对比 -->
          <div v-if="sqResult" class="sub-question-answer">
            <span class="answer-label">你的答案：</span>
            <span class="answer-value" :class="{ 'is-correct': sqResult.isCorrect }">
              {{ sqResult.userAnswer }}
            </span>
            <span v-if="!sqResult.isCorrect" class="correct-answer">
              <span class="answer-label">正确答案：</span>
              <span class="answer-value correct">{{ sqResult.correctAnswer }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

/**
 * 阅读理解题结果展示卡片组件
 * 用于答题结果页面显示阅读理解题的详细结果
 *
 * 注意：后端已经应用了 reverseMapping 生成了打乱后的选项，
 * 所以这里直接使用 question.options，不要再重新应用映射！
 */

// Props 定义
const props = defineProps({
  /** 题目数据 */
  question: {
    type: Object,
    required: true
  },
  /** 题目编号 */
  questionNumber: {
    type: Number,
    default: 1
  },
  /** 阅读理解题结果 */
  result: {
    type: Object,
    default: () => null
  }
})

// 是否全对
const isAllCorrect = computed(() => {
  if (!props.result) return false
  return props.result.correctCount === props.result.totalSubQuestions
})

// 解析小题数据（后端已经处理好了打乱后的选项）
const parseSubQuestions = () => {
  try {
    if (!props.question?.options) return []

    const options =
      typeof props.question.options === 'string'
        ? JSON.parse(props.question.options)
        : props.question.options

    return Array.isArray(options) ? options : []
  } catch (e) {
    console.error('解析小题数据失败:', e)
    return []
  }
}

// 获取小题内容
const getSubQuestionContent = order => {
  const subQuestions = parseSubQuestions()
  const subQuestion = subQuestions[order - 1]
  return subQuestion ? subQuestion.content || '' : ''
}

// 获取小题选项（后端已经返回打乱后的选项）
const getSubQuestionOptions = order => {
  const subQuestions = parseSubQuestions()
  const subQuestion = subQuestions[order - 1]
  // 直接返回后端处理好的选项，不要再应用映射
  return subQuestion ? subQuestion.options || [] : []
}

// 获取选项标签（A, B, C, D）
const getOptionLabel = index => {
  return String.fromCharCode(65 + index)
}
</script>

<style scoped>
.reading-result-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  border: 2px solid #e8e8e8;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.reading-result-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: linear-gradient(90deg, #7dd3f8 0%, #a8e6cf 50%, #ffd88b 100%);
  border-radius: 20px 20px 0 0;
}

.reading-result-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.passage-section {
  margin-bottom: 24px;
}

.passage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 题目类型标签 */
.question-type-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  font-family: 'Microsoft YaHei', 微软雅黑，sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

/* 阅读题专用样式 */
.question-type-badge.type-reading {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.header-icon {
  font-size: 20px;
}

.header-text {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.passage-content {
  padding: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  line-height: 1.8;
  color: #334155;
  font-size: 15px;
}

.sub-questions-section {
  margin-top: 20px;
}

.sub-questions-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.sub-questions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sub-question-result {
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 10px;
  border: 2px solid #e2e8f0;
  transition: all 0.2s ease;
}

.sub-question-result.is-correct {
  background-color: #f0fdf4;
  border-color: #86efac;
}

.sub-question-result:not(.is-correct) {
  background-color: #fef2f2;
  border-color: #fecaca;
}

.sub-question-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.sub-question-number {
  font-weight: 600;
  font-size: 15px;
  color: #1e293b;
}

.sub-question-answer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.answer-label {
  color: #64748b;
}

.answer-value {
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  background-color: #fee2e2;
  color: #ef4444;
}

.answer-value.is-correct {
  background-color: #dcfce7;
  color: #16a34a;
}

.answer-value.correct {
  background-color: #dbeafe;
  color: #3b82f6;
}

.correct-answer {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 16px;
}

/* 小题内容样式 */
.sub-question-content {
  margin-bottom: 12px;
  line-height: 1.6;
  color: #334155;
  font-size: 14px;
}

/* 选项列表样式 */
.sub-question-options {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background-color: #f8fafc;
  transition: all 0.2s ease;
}

.option-item:hover {
  border-color: #cbd5e1;
  background-color: #f1f5f9;
}

.option-item.is-selected {
  border-color: #fca5a5;
  background-color: #fef2f2;
}

.option-item.is-correct {
  border-color: #86efac;
  background-color: #f0fdf4;
}

.option-item.is-selected.is-correct {
  border-color: #86efac;
  background-color: #f0fdf4;
}

.option-label {
  font-weight: 600;
  color: #1e293b;
  min-width: 20px;
  flex-shrink: 0;
}

.option-text {
  flex: 1;
  line-height: 1.5;
  color: #334155;
  font-size: 14px;
}

:deep(.passage-content img) {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  margin: 8px 0;
}

:deep(.passage-content p) {
  margin: 0;
}

@media (max-width: 768px) {
  .reading-result-card {
    padding: 1.2rem;
  }

  .passage-content {
    padding: 12px;
    font-size: 14px;
  }

  .sub-question-result {
    padding: 12px;
  }
}
</style>
