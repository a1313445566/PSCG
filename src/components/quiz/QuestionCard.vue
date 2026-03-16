<template>
  <div class="question-card">
    <div class="question-header">
      <div class="question-number">问题 {{ questionNumber }}</div>
      <div class="question-type" :class="`type-${question.type}`">
        {{ getQuestionTypeName(question.type) }}
      </div>
    </div>
    
    <div class="question-content">
      <p class="question-text">{{ question.content }}</p>
      
      <div class="options">
        <div 
          v-for="(option, index) in question.shuffledOptions || question.options" 
          :key="index"
          class="option-item"
          :class="{
            'selected': isOptionSelected(String.fromCharCode(65 + index)),
            'correct': showResult && isOptionCorrect(String.fromCharCode(65 + index)),
            'wrong': showResult && isOptionWrong(String.fromCharCode(65 + index))
          }"
          @click="selectOption(String.fromCharCode(65 + index))"
        >
          <div class="option-label">{{ String.fromCharCode(65 + index) }}</div>
          <div class="option-text" v-html="option"></div>
          <div v-if="showResult" class="option-feedback">
            <span v-if="isOptionCorrect(String.fromCharCode(65 + index))" class="feedback-correct">✓</span>
            <span v-else-if="isOptionWrong(String.fromCharCode(65 + index))" class="feedback-wrong">✗</span>
          </div>
        </div>
      </div>
      
      <!-- 答案解析 -->
      <div v-if="showResult && (question.explanation || question.explanation === '')" class="explanation">
        <h4 class="explanation-title">📝 答案解析</h4>
        <p class="explanation-content">{{ question.explanation || '暂无解析' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  question: {
    type: Object,
    required: true
  },
  questionNumber: {
    type: Number,
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

const emit = defineEmits(['select-option'])

// 获取题目类型名称
const getQuestionTypeName = (type) => {
  const typeMap = {
    'single': '单选题',
    'multiple': '多选题',
    'judgment': '判断题',
    'listening': '听力题',
    'reading': '阅读题',
    'image': '看图题'
  }
  return typeMap[type] || '未知类型'
}

// 检查选项是否被用户选择
const isOptionSelected = (option) => {
  if (!props.userAnswer) return false
  
  if (props.question.type === 'multiple') {
    return Array.isArray(props.userAnswer) && props.userAnswer.includes(option)
  } else {
    return props.userAnswer === option
  }
}

// 检查选项是否是正确答案
const isOptionCorrect = (option) => {
  const correctAnswer = props.question.answer
  
  if (props.question.type === 'multiple') {
    const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : correctAnswer.split('')
    return correctAnswers.includes(option)
  } else {
    return option === correctAnswer
  }
}

// 检查选项是否是用户选择的错误答案
const isOptionWrong = (option) => {
  return isOptionSelected(option) && !isOptionCorrect(option)
}

// 选择选项
const selectOption = (option) => {
  if (!props.showResult) {
    emit('select-option', option)
  }
}
</script>

<style scoped>
.question-card {
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid #E8E8E8;
  transition: all 0.3s ease;
}

.question-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  border-color: #4A90E2;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.8rem;
  border-bottom: 2px solid #F0F0F0;
}

.question-number {
  font-weight: bold;
  color: #4A90E2;
  font-size: 1.1rem;
}

.question-type {
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.type-single {
  background-color: #E3F2FD;
  color: #1976D2;
}

.type-multiple {
  background-color: #E8F5E9;
  color: #2E7D32;
}

.type-judgment {
  background-color: #FFF8E1;
  color: #EF6C00;
}

.type-listening {
  background-color: #F3E5F5;
  color: #7B1FA2;
}

.type-reading {
  background-color: #E0F7FA;
  color: #006064;
}

.type-image {
  background-color: #FFF3E0;
  color: #E65100;
}

.question-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-text {
  font-size: 1.1rem;
  line-height: 1.5;
  color: #333;
  margin: 0;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #E8E8E8;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.option-item:hover:not(.correct):not(.wrong) {
  border-color: #4A90E2;
  background-color: #F5F9FF;
  transform: translateX(5px);
}

.option-item.selected {
  border-color: #4A90E2;
  background-color: #E3F2FD;
}

.option-item.correct {
  border-color: #4CAF50;
  background-color: #E8F5E9;
}

.option-item.wrong {
  border-color: #F44336;
  background-color: #FFEBEE;
}

.option-label {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #E8E8E8;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  flex-shrink: 0;
}

.option-item.selected .option-label {
  background-color: #4A90E2;
  color: white;
}

.option-item.correct .option-label {
  background-color: #4CAF50;
  color: white;
}

.option-item.wrong .option-label {
  background-color: #F44336;
  color: white;
}

.option-text {
  flex: 1;
  font-size: 1rem;
  color: #333;
}

.option-feedback {
  font-size: 1.2rem;
  font-weight: bold;
}

.feedback-correct {
  color: #4CAF50;
}

.feedback-wrong {
  color: #F44336;
}

/* 答案解析样式 */
.explanation {
  margin-top: 1.5rem;
  padding: 1.2rem;
  background-color: #F8F9FA;
  border-left: 4px solid #4A90E2;
  border-radius: 8px;
}

.explanation-title {
  font-size: 1rem;
  font-weight: bold;
  color: #333;
  margin: 0 0 0.8rem 0;
}

.explanation-content {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #555;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .question-card {
    padding: 1.2rem;
  }
  
  .question-text {
    font-size: 1rem;
  }
  
  .option-item {
    padding: 0.8rem;
  }
}

@media (max-width: 480px) {
  .question-card {
    padding: 1rem;
  }
  
  .question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .question-text {
    font-size: 0.9rem;
  }
  
  .option-item {
    padding: 0.7rem;
  }
  
  .option-label {
    width: 24px;
    height: 24px;
    font-size: 0.9rem;
  }
  
  .option-text {
    font-size: 0.9rem;
  }
}
</style>