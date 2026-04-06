<template>
  <div class="options" :class="optionLayout">
    <div
      v-for="(option, index) in options"
      :key="index"
      class="option-item"
      :class="{
        selected: isSelected(String.fromCharCode(65 + index)),
        correct: showResult && isCorrect(String.fromCharCode(65 + index)),
        wrong: showResult && isWrong(String.fromCharCode(65 + index))
      }"
      @click="handleSelect(String.fromCharCode(65 + index))"
    >
      <div class="option-content">
        <div class="option-label">{{ String.fromCharCode(65 + index) }}</div>
        <div
          class="option-text rich-text-content size-medium"
          @click="$emit('image-click', $event)"
          v-html="option"
        ></div>
      </div>
      <div v-if="showResult" class="option-feedback">
        <span v-if="isSelected(String.fromCharCode(65 + index))" class="feedback-selected">
          你的选择
        </span>
        <span v-if="isCorrect(String.fromCharCode(65 + index))" class="feedback-correct">
          正确答案
        </span>
        <span v-else-if="isWrong(String.fromCharCode(65 + index))" class="feedback-wrong">
          错误选择
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import xssFilter from '@/utils/xss-filter'

const props = defineProps({
  question: {
    type: Object,
    required: true
  },
  userAnswer: {
    type: [String, Array],
    default: null
  },
  showResult: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select-option', 'image-click'])

const options = computed(() => {
  const question = props.question

  if (!question) return []

  let rawOptions = question.shuffledOptions || question.options

  if (typeof rawOptions === 'string') {
    try {
      rawOptions = JSON.parse(rawOptions)
    } catch (e) {
      console.error('解析选项失败:', e)
      return []
    }
  }

  if (Array.isArray(rawOptions)) {
    return rawOptions.map(opt => {
      if (opt === null || opt === undefined) return ''
      if (typeof opt === 'string') return xssFilter.deepSanitize(opt)
      if (typeof opt === 'object') {
        return Object.keys(opt).reduce((acc, key) => {
          acc[key] = typeof opt[key] === 'string' ? xssFilter.deepSanitize(opt[key]) : opt[key]
          return acc
        }, {})
      }
      return xssFilter.deepSanitize(String(opt))
    })
  }

  return []
})

const optionLayout = computed(() => {
  const optionCount = options.value.length

  if (props.question?.type === 'judgment') {
    return 'judgment-layout'
  }

  const hasImageOption = options.value.some(opt => opt.includes('<img'))
  if (hasImageOption) return 'grid-1'

  if (optionCount === 4) {
    const maxLength = Math.max(...options.value.map(opt => opt.replace(/<[^>]*>/g, '').length))

    if (maxLength <= 15) return 'grid-4'
    if (maxLength <= 30) return 'grid-2'
    return 'grid-1'
  }

  return 'vertical'
})

const parsedUserAnswer = computed(() => {
  let answer = props.userAnswer || props.question?.user_answer
  if (typeof answer === 'string') {
    try {
      answer = JSON.parse(answer)
    } catch (e) {
      /* 使用原始值 */
    }
  }
  return answer
})

const parsedCorrectAnswer = computed(() => {
  let answer = props.question?.correct_answer || props.question?.answer
  if (typeof answer === 'string') {
    try {
      answer = JSON.parse(answer)
    } catch (e) {
      /* 使用原始值 */
    }
  }
  return answer
})

const isSelected = option => {
  const userAnswer = parsedUserAnswer.value
  if (!userAnswer) return false

  if (props.question?.type === 'multiple') {
    if (Array.isArray(userAnswer)) return userAnswer.includes(option)
    if (typeof userAnswer === 'string') return userAnswer.includes(option)
    return false
  }

  return userAnswer === option
}

const isCorrect = option => {
  const correctAnswer = parsedCorrectAnswer.value

  if (props.question?.type === 'multiple') {
    const answers = Array.isArray(correctAnswer)
      ? correctAnswer
      : typeof correctAnswer === 'string'
        ? correctAnswer.split('')
        : []
    return answers.includes(option)
  }

  return option === correctAnswer
}

const isWrong = option => isSelected(option) && !isCorrect(option)

const handleSelect = option => {
  if (!props.showResult) {
    emit('select-option', option)
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/rich-text.css';

.options {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.options.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.8rem;
}

.options.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.8rem;
}

.options.grid-1 {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.options.vertical {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.option-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem;
  border: 2px solid $border-color-lighter;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  background: $card-background;
  min-height: 80px;
  box-sizing: border-box;
  flex-wrap: wrap;

  &:hover:not(.correct):not(.wrong) {
    border-color: $secondary-color;
    background-color: $bg-slate-50;
    transform: translateX(5px);
    box-shadow: 0 2px 8px set-alpha($secondary-color, 30);
  }

  &.selected {
    border-color: $secondary-color;
    background-color: $bg-slate-100;
    box-shadow: 0 0 0 2px set-alpha($secondary-color, 30);
  }

  &.correct {
    border-color: $success-color;
    background-color: $mastery-high-gradient;
    box-shadow: 0 0 0 2px set-alpha($success-color, 30);
  }

  &.wrong {
    border-color: $danger-color;
    background-color: $mastery-low-gradient;
    box-shadow: 0 0 0 2px set-alpha($danger-color, 30);
  }
}

.option-content {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  flex: 1;
  min-width: 0;
}

.option-label {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: $border-color-lighter;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.option-item.selected .option-label {
  background: $section-header-gradient;
  color: $text-white;
  box-shadow: 0 2px 4px set-alpha($secondary-color, 40);
}

.option-item.correct .option-label {
  background: $success-gradient;
  color: $text-white;
  box-shadow: 0 2px 4px set-alpha($success-color, 40);
}

.option-item.wrong .option-label {
  background: $danger-gradient;
  color: $text-white;
  box-shadow: 0 2px 4px set-alpha($danger-color, 40);
}

.option-text {
  flex: 1;
  font-size: 1rem;
  color: #333;
  font-family: 'Microsoft YaHei', 微软雅黑, sans-serif;
  min-width: 0;
}

.option-feedback {
  margin-top: 0.2rem;
  margin-left: 38px;
  width: calc(100% - 38px);
}

.feedback-selected {
  color: $info-color;
  font-weight: 600;
}

.feedback-correct {
  color: $success-color;
  font-weight: 600;
}

.feedback-wrong {
  color: $danger-color;
  font-weight: 600;
}

/* 判断题选项样式 */
.options.judgment-layout {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: 0.8rem !important;
  flex-direction: unset !important;
}

.options.judgment-layout .option-item {
  min-height: 60px !important;
  gap: 1rem !important;
}

.options.judgment-layout .option-content {
  justify-content: flex-start !important;
  align-items: flex-start !important;
  text-align: left !important;
  flex-direction: row !important;
  gap: 0.8rem !important;
}

.options.judgment-layout .option-label {
  width: 30px !important;
  height: 30px !important;
  font-size: 1rem !important;
  margin-bottom: 0 !important;
}

.options.judgment-layout .option-text {
  font-size: 1rem !important;
  font-weight: normal !important;
}

@media (max-width: 768px) {
  .options.judgment-layout {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 480px) {
  .options.judgment-layout {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 0.6rem !important;
  }

  .options.judgment-layout .option-item {
    padding: 0.8rem !important;
  }
}
</style>
