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
        <!-- eslint-disable-next-line vue/no-v-html -- 后端已通过 xssFilter.deepSanitize() 过滤 -->
        <div class="content-html rich-text-content size-xlarge" v-html="question.content"></div>
      </div>

      <!-- 选项（普通题目） -->
      <div
        v-if="question.type !== 'reading' && question.options && question.options.length > 0"
        class="options-section"
      >
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
            <!-- eslint-disable-line vue/no-v-html -->
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

      <!-- 阅读理解题小题列表 -->
      <div v-if="question.type === 'reading'" class="reading-section">
        <h3>小题列表（共 {{ parseReadingOptions(question.options).length }} 题）</h3>
        <div class="sub-questions-list">
          <div
            v-for="(sq, sqIndex) in parseReadingOptions(question.options)"
            :key="sqIndex"
            class="sub-question-item"
          >
            <div class="sub-question-header">
              <span class="sub-question-number">第 {{ sq.order || sqIndex + 1 }} 题</span>
              <el-tag type="success" size="small">答案: {{ sq.answer }}</el-tag>
            </div>
            <!-- eslint-disable-next-line vue/no-v-html -- 后端已过滤 -->
            <div class="sub-question-content" v-html="sq.content"></div>
            <div class="sub-question-options">
              <div
                v-for="(opt, optIndex) in sq.options"
                :key="optIndex"
                class="sub-option-item"
                :class="{ 'is-correct': sq.answer === String.fromCharCode(65 + optIndex) }"
              >
                <span class="option-letter">{{ String.fromCharCode(65 + optIndex) }}.</span>
                <span class="option-text" v-html="opt"></span>
                <!-- eslint-disable-line vue/no-v-html -->
              </div>
            </div>
            <div v-if="sq.explanation" class="sub-question-explanation">
              <span class="explanation-label">解析：</span>
              <span v-html="sq.explanation"></span>
              <!-- eslint-disable-line vue/no-v-html -->
            </div>
          </div>
        </div>
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
        <!-- eslint-disable-next-line vue/no-v-html -- 后端已通过 xssFilter.sanitize() 过滤 -->
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

  // 处理阅读题答案格式 {"0":"B", "1":"C", "2":"B", "3":"D"}
  if (typeof answer === 'string' && answer.startsWith('{')) {
    try {
      const parsed = JSON.parse(answer)
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        // 格式化为 "第1题:B, 第2题:C, 第3题:B, 第4题:D"
        const entries = Object.entries(parsed)
          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
          .map(([index, value]) => `第${parseInt(index) + 1}题:${value}`)
        return entries.join(', ')
      }
    } catch (e) {
      // 解析失败，返回原始字符串
    }
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

// 解析阅读理解题的小题列表
const parseReadingOptions = options => {
  if (!options) return []
  let parsedOptions = options
  if (typeof options === 'string') {
    try {
      parsedOptions = JSON.parse(options)
    } catch (e) {
      return []
    }
  }
  if (!Array.isArray(parsedOptions)) return []
  // 检查是否是阅读理解题格式（对象数组且包含order字段）
  if (parsedOptions.length > 0 && typeof parsedOptions[0] === 'object') {
    return parsedOptions
  }
  return []
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

<style scoped lang="scss">
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

/* 阅读理解题样式 */
.reading-section {
  margin-bottom: 20px;
}

.reading-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.sub-questions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sub-question-item {
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.sub-question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.sub-question-number {
  font-weight: 600;
  color: #1e293b;
  font-size: 15px;
}

.sub-question-content {
  padding: 12px;
  background-color: white;
  border-radius: 6px;
  margin-bottom: 12px;
  line-height: 1.6;
}

.sub-question-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sub-option-item {
  display: flex;
  align-items: flex-start;
  padding: 8px 12px;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.sub-option-item.is-correct {
  background-color: #f0f9ff;
  border-color: #67c23a;
}

.sub-question-explanation {
  margin-top: 12px;
  padding: 12px;
  background-color: #fff9e6;
  border-left: 3px solid #e6a23c;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.6;
}

.explanation-label {
  font-weight: 600;
  color: #606266;
}

.empty-state {
  padding: 40px;
  text-align: center;
}
</style>
