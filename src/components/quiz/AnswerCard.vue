<template>
  <div class="answer-card">
    <div class="answer-card-header">
      <h3 class="answer-card-title">📋 答题卡</h3>
    </div>

    <div class="answer-card-stats">
      <span class="stat-item">
        <span class="stat-label">全部</span>
        <span class="stat-value">{{ totalQuestions }}</span>
      </span>
      <span class="stat-divider">|</span>
      <span class="stat-item stat-answered">
        <span class="stat-label">已答</span>
        <span class="stat-value">{{ answeredCount }}</span>
      </span>
      <span class="stat-divider">|</span>
      <span class="stat-item stat-unanswered">
        <span class="stat-label">未答</span>
        <span class="stat-value">{{ unansweredCount }}</span>
      </span>
    </div>

    <div class="answer-card-grid">
      <button
        v-for="(question, index) in questions"
        :key="question.id"
        :class="[
          'question-number-btn',
          {
            'is-answered': isQuestionAnswered(question.id),
            'is-current': currentQuestionId === question.id,
            'is-reading': question.type === 'reading'
          }
        ]"
        @click="handleQuestionClick(index)"
        :title="`第 ${index + 1} 题${question.type === 'reading' ? ' (阅读理解)' : ''}`"
      >
        {{ index + 1 }}
      </button>
    </div>

    <div class="answer-card-legend" v-if="hasReadingQuestions">
      <div class="legend-item">
        <span class="legend-dot legend-reading"></span>
        <span class="legend-text">阅读理解</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  questions: {
    type: Array,
    required: true,
    default: () => []
  },
  userAnswers: {
    type: Object,
    required: true,
    default: () => ({})
  },
  readingAnswers: {
    type: Object,
    default: () => ({})
  },
  currentQuestionId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['question-click'])

const totalQuestions = computed(() => props.questions.length)

const answeredCount = computed(() => {
  let count = 0
  props.questions.forEach(question => {
    if (isQuestionAnswered(question.id)) {
      count++
    }
  })
  return count
})

const unansweredCount = computed(() => totalQuestions.value - answeredCount.value)

const hasReadingQuestions = computed(() => {
  return props.questions.some(q => q.type === 'reading')
})

const isQuestionAnswered = questionId => {
  const answer = props.userAnswers[questionId]
  if (answer === undefined || answer === null || answer === '') {
    return false
  }

  // 检查是否是对象（阅读理解题答案）
  if (typeof answer === 'object' && !Array.isArray(answer)) {
    return Object.keys(answer).length > 0
  }

  // 检查数组（多选题）
  if (Array.isArray(answer)) {
    return answer.length > 0
  }

  return true
}

const handleQuestionClick = index => {
  emit('question-click', index)
}
</script>

<style scoped lang="scss">
@use 'sass:color';
.answer-card {
  background: $card-background;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  border: $border-width solid $border-color-lighter;
  max-height: calc(100vh - 100px);
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: $bg-gray-1;
    border-radius: $border-radius-xs;
  }

  &::-webkit-scrollbar-thumb {
    background: $border-gray-light;
    border-radius: $border-radius-xs;

    &:hover {
      background: $text-tertiary;
    }
  }
}

.answer-card-header {
  margin-bottom: $spacing-md;
  padding-bottom: $spacing-md;
  border-bottom: $border-width solid $border-color-lighter;
}

.answer-card-title {
  font-size: $font-size-lg;
  font-weight: bold;
  color: $primary-color;
  margin: 0;
  font-family: 'Microsoft YaHei', 微软雅黑, sans-serif;
}

.answer-card-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-lg;
  padding: $spacing-sm $spacing-md;
  background: $bg-slate-50;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  color: $text-secondary;
}

.stat-label {
  font-weight: 500;
}

.stat-value {
  font-weight: bold;
  color: $text-primary;
}

.stat-answered .stat-value {
  color: $success-color;
}

.stat-unanswered .stat-value {
  color: $text-tertiary;
}

.stat-divider {
  color: $border-color-lighter;
  font-weight: 300;
}

.answer-card-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
}

.question-number-btn {
  width: 100%;
  aspect-ratio: 1;
  border: $border-width solid $border-color-lighter;
  border-radius: $border-radius-sm;
  background: $card-background;
  color: $text-primary;
  font-size: $font-size-base;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  font-family: 'Microsoft YaHei', 微软雅黑, sans-serif;

  &:hover:not(.is-current) {
    transform: translateY(-2px);
    box-shadow: $shadow-sm;
    border-color: $el-blue-light-2;
    background: $el-blue-light-1;
  }

  &:active {
    transform: translateY(0);
  }

  &.is-answered {
    background: linear-gradient(
      135deg,
      #{color.adjust($success-color, $lightness: 15%)} 0%,
      #{$success-color} 100%
    );
    color: $text-white;
    border-color: $success-color;
    box-shadow: 0 2px 8px set-alpha($success-color, 30);

    &:hover {
      background: linear-gradient(
        135deg,
        #{$success-color} 0%,
        #{color.adjust($success-color, $lightness: -10%)} 100%
      );
    }
  }

  &.is-current {
    border: $border-width-md solid $primary-color;
    background: $primary-light;
    color: $primary-color;
    box-shadow: 0 0 0 3px set-alpha($primary-color, 20);
    animation: pulse-border 2s ease-in-out infinite;
  }

  &.is-reading {
    &::after {
      content: '';
      position: absolute;
      top: 2px;
      right: 2px;
      width: 6px;
      height: 6px;
      background: $info-color;
      border-radius: 50%;
      border: 1px solid $card-background;
    }
  }

  &.is-answered.is-current {
    border: $border-width-md solid $primary-color;
    box-shadow:
      0 0 0 3px set-alpha($primary-color, 20),
      0 2px 8px set-alpha($success-color, 30);
  }
}

@keyframes pulse-border {
  0%,
  100% {
    box-shadow: 0 0 0 3px set-alpha($primary-color, 20);
  }

  50% {
    box-shadow: 0 0 0 5px set-alpha($primary-color, 15);
  }
}

.answer-card-legend {
  display: flex;
  justify-content: center;
  gap: $spacing-lg;
  padding-top: $spacing-md;
  border-top: $border-width solid $border-color-lighter;
  font-size: $font-size-xs;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  color: $text-secondary;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: $border-radius-xs;
  border: $border-width solid $border-color-lighter;
}

.legend-reading {
  background: $card-background;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 1px;
    right: 1px;
    width: 5px;
    height: 5px;
    background: $info-color;
    border-radius: 50%;
    border: 1px solid $card-background;
  }
}

.legend-text {
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: $breakpoint-lg) {
  .answer-card-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

@media (max-width: $breakpoint-md) {
  .answer-card {
    max-height: none;
    overflow-y: visible;
  }

  .answer-card-grid {
    grid-template-columns: repeat(8, 1fr);
  }
}

@media (max-width: 480px) {
  .answer-card-grid {
    grid-template-columns: repeat(10, 1fr);
  }

  .question-number-btn {
    font-size: $font-size-xs;
  }
}
</style>
