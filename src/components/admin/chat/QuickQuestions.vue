<template>
  <div v-if="questions.length > 0" class="quick-questions">
    <div class="quick-header">
      <el-icon><ChatLineRound /></el-icon>
      <span>快捷提问</span>
    </div>

    <div class="question-list">
      <el-button
        v-for="(question, index) in questions"
        :key="index"
        type="primary"
        size="small"
        plain
        class="question-btn"
        @click="handleQuestionClick(question)"
      >
        <el-icon><QuestionFilled /></el-icon>
        {{ formatQuestion(question) }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ChatLineRound, QuestionFilled } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  tool: {
    type: Object,
    default: null
  },
  entity: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['select'])

// 快捷问题列表
const questions = computed(() => {
  if (!props.tool?.quickQuestions) return []

  // 如果已选实体，优先显示相关快捷问题
  if (props.entity) {
    return props.tool.quickQuestions.slice(0, 5)
  }

  return props.tool.quickQuestions.slice(0, 3)
})

/**
 * 格式化问题（替换占位符）
 */
function formatQuestion(question) {
  if (!props.entity) {
    return question.replace(/\{[^}]+\}/g, '___')
  }

  // 替换占位符
  let formatted = question

  if (props.entity.type === 'student') {
    formatted = formatted.replace(/\{studentName\}/g, props.entity.name)
  }

  if (props.entity.grade) {
    formatted = formatted.replace(/\{grade\}/g, props.entity.grade)
  }

  if (props.entity.class) {
    formatted = formatted.replace(/\{className\}/g, props.entity.class)
  }

  // 清除其他未替换的占位符
  formatted = formatted.replace(/\{[^}]+\}/g, '')

  return formatted
}

/**
 * 点击快捷问题
 */
function handleQuestionClick(question) {
  const formattedQuestion = formatQuestion(question)
  emit('select', formattedQuestion)
}
</script>

<style scoped lang="scss">
.quick-questions {
  margin-top: 12px;
  padding: 12px;
  background: #fff8e6;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
}

.quick-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 14px;
  color: #f39c12;
}

.question-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.question-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  white-space: normal;
  text-align: left;
  max-width: 100%;
}

.question-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.2);
}
</style>
