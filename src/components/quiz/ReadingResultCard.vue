<template>
  <div class="reading-result-card">
    <!-- 阅读材料 -->
    <div class="passage-section">
      <div class="passage-header">
        <span class="header-icon">📖</span>
        <span class="header-text">阅读材料</span>
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
          v-for="sqResult in result.subQuestionResults"
          :key="sqResult.order"
          class="sub-question-result"
          :class="{ 'is-correct': sqResult.isCorrect }"
        >
          <div class="sub-question-header">
            <span class="sub-question-number">第 {{ sqResult.order }} 题</span>
            <el-tag :type="sqResult.isCorrect ? 'success' : 'danger'" size="small">
              {{ sqResult.isCorrect ? '正确' : '错误' }}
            </el-tag>
          </div>
          <div class="sub-question-answer">
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
</script>

<style scoped lang="scss">
.reading-result-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.reading-result-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  border-color: #667eea;
}

/* 阅读材料区域 */
.passage-section {
  margin-bottom: 24px;
}

.passage-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
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

/* 小题结果区域 */
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

/* 富文本内容样式 */
:deep(.passage-content img) {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  margin: 8px 0;
}

:deep(.passage-content p) {
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .reading-result-card {
    padding: 16px;
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
