<template>
  <el-dialog
    :model-value="dialogVisible"
    title="题目详情"
    width="700px"
    :destroy-on-close="true"
    @update:model-value="value => emit('update:dialogVisible', value)"
  >
    <div v-if="question" class="question-detail">
      <!-- 基本信息 -->
      <div class="info-section">
        <el-tag type="info" size="small">{{ question.subject_name || '未知学科' }}</el-tag>
        <el-tag type="info" size="small" style="margin-left: 8px">
          {{ question.subcategory_name || '未知题库' }}
        </el-tag>
        <el-tag :type="getTypeTagType(question.type)" size="small" style="margin-left: 8px">
          {{ getTypeLabel(question.type) }}
        </el-tag>
        <el-tag
          :type="getDifficultyTagType(question.difficulty)"
          size="small"
          style="margin-left: 8px"
        >
          难度: {{ question.difficulty || 1 }}
        </el-tag>
      </div>

      <!-- 题目内容 -->
      <div class="content-section">
        <h3>题目内容</h3>
        <div class="content-html rich-text-content size-xlarge" v-html="question.content"></div>
      </div>

      <!-- 选项 -->
      <div v-if="question.options && question.options.length > 0" class="options-section">
        <h3>答案选项</h3>
        <div class="options-list">
          <div
            v-for="(option, index) in question.options"
            :key="index"
            class="option-item"
            :class="{
              'is-correct': isCorrectOption(index),
              'is-wrong': isWrongOption(index)
            }"
          >
            <span class="option-letter">{{ String.fromCharCode(65 + index) }}.</span>
            <span
              class="option-text rich-text-content size-medium"
              v-html="formatOption(option)"
            ></span>
            <el-tag
              v-if="isCorrectOption(index)"
              type="success"
              size="small"
              style="margin-left: auto"
            >
              正确答案
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 调试信息（开发环境） -->
      <div
        v-if="isDev"
        class="debug-info"
        style="
          margin-top: 20px;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 4px;
          font-size: 12px;
        "
      >
        <details>
          <summary style="cursor: pointer; font-weight: bold">调试信息</summary>
          <pre style="margin-top: 10px; overflow: auto">{{ debugInfo }}</pre>
        </details>
      </div>

      <!-- 用户答案和正确答案 -->
      <div class="answer-section">
        <div class="answer-row">
          <span class="answer-label">用户答案:</span>
          <span :class="['answer-value', { correct: isUserCorrect, wrong: !isUserCorrect }]">
            {{ formatAnswer(question.userAnswer || question.user_answer) }}
          </span>
          <el-tag :type="isUserCorrect ? 'success' : 'danger'" size="small">
            {{ isUserCorrect ? '正确' : '错误' }}
          </el-tag>
        </div>
        <div class="answer-row">
          <span class="answer-label">正确答案:</span>
          <span class="answer-value correct">
            {{ formatAnswer(question.correctAnswer || question.correct_answer) }}
          </span>
        </div>
      </div>

      <!-- 解析 -->
      <div v-if="question.explanation" class="explanation-section">
        <h3>答案解析</h3>
        <div class="explanation-content" v-html="question.explanation"></div>
      </div>
    </div>

    <div v-else class="empty-state">
      <el-empty description="暂无题目数据" />
    </div>

    <template #footer>
      <el-button @click="emit('update:dialogVisible', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  dialogVisible: {
    type: Boolean,
    default: false
  },
  question: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:dialogVisible'])

// 开发环境标志
const isDev = import.meta.env.DEV

// 调试信息
const debugInfo = computed(() => {
  if (!props.question) return '无题目数据'
  return JSON.stringify(
    {
      id: props.question.id,
      type: props.question.type,
      options: props.question.options,
      optionsType: typeof props.question.options,
      optionsLength: props.question.options?.length,
      correctAnswer: props.question.correctAnswer || props.question.correct_answer,
      userAnswer: props.question.userAnswer || props.question.user_answer,
      isCorrect: props.question.isCorrect || props.question.is_correct
    },
    null,
    2
  )
})

// 获取题目类型标签
const getTypeLabel = type => {
  const typeMap = {
    single: '单选题',
    multiple: '多选题',
    judgment: '判断题',
    listening: '听力题',
    reading: '阅读题',
    image: '看图题'
  }
  return typeMap[type] || '未知类型'
}

const getTypeTagType = type => {
  const typeColorMap = {
    single: 'primary',
    multiple: 'success',
    judgment: 'warning',
    listening: 'info',
    reading: 'info',
    image: 'info'
  }
  return typeColorMap[type] || 'info'
}

const getDifficultyTagType = difficulty => {
  const diff = difficulty || 1
  if (diff <= 2) return 'success'
  if (diff === 3) return 'warning'
  return 'danger'
}

// 格式化答案
const formatAnswer = answer => {
  if (!answer) return '-'
  if (Array.isArray(answer)) {
    return answer.join(', ')
  }
  return String(answer)
}

// 格式化选项内容（支持富文本）
const formatOption = option => {
  if (!option) return ''

  // 如果已经是 HTML 字符串，直接返回
  if (typeof option === 'string') {
    // 检查是否包含 HTML 标签
    if (/<[^>]+>/.test(option)) {
      return option
    }
    // 否则转义 HTML 特殊字符
    return option
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  // 如果是其他类型，转为字符串
  return String(option)
}

// 判断是否是正确选项
const isCorrectOption = index => {
  const letter = String.fromCharCode(65 + index)
  const correctAnswer = props.question?.correctAnswer || props.question?.correct_answer
  if (Array.isArray(correctAnswer)) {
    return correctAnswer.includes(letter)
  }
  return String(correctAnswer) === letter
}

// 判断是否是错误选项（用户选错）
const isWrongOption = index => {
  const letter = String.fromCharCode(65 + index)
  const userAnswer = props.question?.userAnswer || props.question?.user_answer

  // 用户选了这个选项，但这不是正确答案
  const isSelected = Array.isArray(userAnswer)
    ? userAnswer.includes(letter)
    : String(userAnswer) === letter
  const isCorrect = isCorrectOption(index)

  return isSelected && !isCorrect
}

// 判断用户是否答对
const isUserCorrect = computed(() => {
  return props.question?.isCorrect || props.question?.is_correct || false
})
</script>

<style scoped>
@import '@/styles/rich-text.css';

.question-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.info-section {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.content-section,
.options-section,
.answer-section,
.explanation-section {
  margin-bottom: 20px;
}

.content-section h3,
.options-section h3,
.explanation-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.content-html {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.option-item.is-correct {
  background-color: #f0f9ff;
  border-color: #67c23a;
}

.option-item.is-wrong {
  background-color: #fef0f0;
  border-color: #f56c6c;
}

.option-letter {
  font-weight: 600;
  color: #606266;
  margin-right: 8px;
  min-width: 24px;
}

.option-text {
  flex: 1;
}

.answer-section {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.answer-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.answer-row:last-child {
  margin-bottom: 0;
}

.answer-label {
  font-weight: 600;
  color: #606266;
  min-width: 80px;
}

.answer-value {
  font-weight: 600;
  margin-right: 10px;
}

.answer-value.correct {
  color: #67c23a;
}

.answer-value.wrong {
  color: #f56c6c;
}

.explanation-content {
  padding: 15px;
  background-color: #fff9e6;
  border-left: 4px solid #e6a23c;
  border-radius: 4px;
  line-height: 1.8;
}

.empty-state {
  padding: 40px;
  text-align: center;
}
</style>
