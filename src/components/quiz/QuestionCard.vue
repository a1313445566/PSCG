<template>
  <div class="question-card">
    <div class="question-header">
      <div class="question-number">问题 {{ questionNumber }}</div>
      <div class="question-type" :class="`type-${question.type}`">
        {{ getQuestionTypeName(question.type) }}
      </div>
    </div>
    
    <!-- 题目来源信息 -->
    <div v-if="question.subcategory_name" class="question-source">
      <span class="source-label">来源：</span>
      <span class="source-name">{{ question.subcategory_name }}</span>
    </div>
    
    <div class="question-content">
        <div class="question-text" v-html="question.content"></div>
      
      <div class="options" :class="optionLayout">
        <div 
          v-for="(option, index) in parsedOptions" 
          :key="index"
          class="option-item"
          :class="{
            'selected': isOptionSelected(String.fromCharCode(65 + index)),
            'correct': showResult && isOptionCorrect(String.fromCharCode(65 + index)),
            'wrong': showResult && isOptionWrong(String.fromCharCode(65 + index))
          }"
          @click="selectOption(String.fromCharCode(65 + index))"
        >
          <div class="option-content">
            <div class="option-label">{{ String.fromCharCode(65 + index) }}</div>
            <div class="option-text" v-html="option"></div>
          </div>
          <div v-if="showResult" class="option-feedback">
            <span v-if="isOptionSelected(String.fromCharCode(65 + index))" class="feedback-selected">
              你的选择
            </span>
            <span v-if="isOptionCorrect(String.fromCharCode(65 + index))" class="feedback-correct">
              正确答案
            </span>
            <span v-else-if="isOptionWrong(String.fromCharCode(65 + index))" class="feedback-wrong">
              错误选择
            </span>
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
import { computed } from 'vue';

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

// 解析选项
const parsedOptions = computed(() => {
  const { question } = props;
  
  // 优先使用shuffledOptions（如果有）
  let options = question.shuffledOptions || question.options;
  
  // 解析JSON字符串
  if (typeof options === 'string') {
    try {
      options = JSON.parse(options);
    } catch (e) {
      console.error('解析选项失败:', e);
      options = [];
    }
  }
  
  return Array.isArray(options) ? options : [];
});

// 计算选项排列方式
const optionLayout = computed(() => {
  const options = parsedOptions.value;
  const optionCount = options.length;
  
  // 检查是否有选项包含图片
  const hasImageOption = options.some(opt => opt.includes('<img'));
  
  if (hasImageOption) {
    // 有图片选项，使用垂直布局
    return 'grid-1';
  }
  
  if (optionCount === 4) {
    // 检查选项长度
    const maxLength = Math.max(...options.map(opt => {
      // 移除HTML标签，计算纯文本长度
      const plainText = opt.replace(/<[^>]*>/g, '');
      return plainText.length;
    }));
    
    if (maxLength <= 15) {
      // 短选项，一行4个
      return 'grid-4';
    } else if (maxLength <= 30) {
      // 中等长度选项，2行2个
      return 'grid-2';
    } else {
      // 长选项，4行1个
      return 'grid-1';
    }
  }
  // 其他情况默认垂直排列
  return 'vertical';
});

// 解析用户答案
const parsedUserAnswer = computed(() => {
  let userAnswer = props.userAnswer || props.question.user_answer;
  
  if (typeof userAnswer === 'string') {
    try {
      userAnswer = JSON.parse(userAnswer);
    } catch (e) {
      // 解析失败，使用原始值
    }
  }
  
  return userAnswer;
});

// 解析正确答案
const parsedCorrectAnswer = computed(() => {
  let correctAnswer = props.question.correct_answer || props.question.answer;
  
  if (typeof correctAnswer === 'string') {
    try {
      correctAnswer = JSON.parse(correctAnswer);
    } catch (e) {
      // 解析失败，使用原始值
    }
  }
  
  return correctAnswer;
});

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
  const userAnswer = parsedUserAnswer.value;
  if (!userAnswer) return false
  
  if (props.question.type === 'multiple') {
    if (Array.isArray(userAnswer)) {
      return userAnswer.includes(option);
    } else if (typeof userAnswer === 'string') {
      return userAnswer.includes(option);
    }
    return false;
  } else {
    return userAnswer === option;
  }
}

// 检查选项是否是正确答案
const isOptionCorrect = (option) => {
  const correctAnswer = parsedCorrectAnswer.value;
  
  if (props.question.type === 'multiple') {
    let correctAnswers;
    if (Array.isArray(correctAnswer)) {
      correctAnswers = correctAnswer;
    } else if (typeof correctAnswer === 'string' && correctAnswer.length > 0) {
      correctAnswers = correctAnswer.split('');
    } else {
      correctAnswers = [];
    }
    return correctAnswers.includes(option);
  } else {
    return option === correctAnswer;
  }
}

// 检查选项是否是用户选择的错误答案
const isOptionWrong = (option) => {
  return isOptionSelected(option) && !isOptionCorrect(option);
}

// 选择选项
const selectOption = (option) => {
  if (!props.showResult) {
    emit('select-option', option);
  }
}
</script>

<style scoped>
/* 引入全局CSS变量 */
:root {
  --primary-color: #FF6B6B;
  --accent-color: #FFD166;
  --background-color: #F7FFF7;
  --header-gradient: linear-gradient(90deg, #7DD3F8 0%, #A8E6CF 50%, #FFD88B 100%);
  --header-border-color: #FF9999;
  --el-shadow-light: 0 6px 15px rgba(0, 0, 0, 0.1);
  --el-border-radius-round: 20px;
}

.question-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--el-shadow-light);
  border: 2px solid #E8E8E8;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.question-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: var(--header-gradient);
  border-radius: 20px 20px 0 0;
  z-index: 1;
}

.question-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px dashed #F0F0F0;
}

/* 题目来源信息 */
.question-source {
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  background-color: #F8F9FA;
  border-radius: 10px;
  border-left: 3px solid #7DD3F8;
  font-size: 0.9rem;
  display: inline-block;
}

.source-label {
  font-weight: bold;
  color: #666;
  margin-right: 0.5rem;
}

.source-name {
  color: #4A90E2;
  font-weight: 500;
}

.question-number {
  font-weight: bold;
  color: #7DD3F8;
  font-size: 1.1rem;
  font-family: "Microsoft YaHei", 微软雅黑, sans-serif;
}

.question-type {
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  font-family: "Microsoft YaHei", 微软雅黑, sans-serif;
  background: var(--header-gradient);
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
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
  font-family: "Microsoft YaHei", 微软雅黑, sans-serif;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

/* 一行4个选项 */
.options.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.8rem;
}

/* 2行2个选项 */
.options.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.8rem;
}

/* 4行1个选项（默认垂直排列） */
.options.grid-1 {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

/* 垂直排列（默认） */
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
  border: 2px solid #E8E8E8;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  background: white;
  min-height: 80px;
  box-sizing: border-box;
  flex-wrap: wrap;
}

.option-content {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  flex: 1;
  min-width: 0;
}

.option-text {
  flex: 1;
  font-size: 1rem;
  color: #333;
  font-family: "Microsoft YaHei", 微软雅黑, sans-serif;
  word-wrap: break-word;
  min-width: 0;
  line-height: 1.4;
}

/* 网格布局下的选项项 */
.options.grid-4 .option-item,
.options.grid-2 .option-item {
  flex: 1;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

/* 网格布局下的选项内容 */
.options.grid-4 .option-content,
.options.grid-2 .option-content {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
}

/* 网格布局下的选项反馈 */
.options.grid-4 .option-feedback,
.options.grid-2 .option-feedback {
  margin-top: 0.2rem;
  margin-left: 38px;
  width: calc(100% - 38px);
}

/* 垂直布局下的选项项 */
.options.grid-1 .option-item,
.options.vertical .option-item {
  min-height: 60px;
  gap: 1rem;
}

.option-item:hover:not(.correct):not(.wrong) {
  border-color: #7DD3F8;
  background-color: #F0F9FF;
  transform: translateX(5px);
  box-shadow: 0 2px 8px rgba(125, 211, 248, 0.3);
}

.option-item.selected {
  border-color: #7DD3F8;
  background-color: #E3F2FD;
  box-shadow: 0 0 0 2px rgba(125, 211, 248, 0.3);
}

.option-item.correct {
  border-color: #A8E6CF;
  background-color: #E8F5E9;
  box-shadow: 0 0 0 2px rgba(168, 230, 207, 0.3);
}

.option-item.wrong {
  border-color: #FF6B6B;
  background-color: #FFEBEE;
  box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.3);
}

.option-item.selected.correct {
  border-color: #A8E6CF;
  background-color: #E8F5E9;
  box-shadow: 0 0 0 2px rgba(168, 230, 207, 0.3);
}

.option-item.selected.wrong {
  border-color: #FF6B6B;
  background-color: #FFEBEE;
  box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.3);
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
  transition: all 0.3s ease;
}

/* 垂直布局下的选项标签 */
.options.grid-1 .option-label,
.options.vertical .option-label {
  margin-bottom: 0;
}

/* 网格布局下的选项标签 */
.options.grid-4 .option-label,
.options.grid-2 .option-label {
  margin-bottom: 0;
}

.option-item.selected .option-label {
  background: linear-gradient(135deg, #7DD3F8, #A8E6CF);
  color: white;
  box-shadow: 0 2px 4px rgba(125, 211, 248, 0.4);
}

.option-item.correct .option-label {
  background: linear-gradient(135deg, #A8E6CF, #7DD3F8);
  color: white;
  box-shadow: 0 2px 4px rgba(168, 230, 207, 0.4);
}

.option-item.wrong .option-label {
  background: linear-gradient(135deg, #FF6B6B, #FF9999);
  color: white;
  box-shadow: 0 2px 4px rgba(255, 107, 107, 0.4);
}

.option-item.selected.correct .option-label {
  background: linear-gradient(135deg, #A8E6CF, #7DD3F8);
  color: white;
  box-shadow: 0 2px 4px rgba(168, 230, 207, 0.4);
}

.option-item.selected.wrong .option-label {
  background: linear-gradient(135deg, #FF6B6B, #FF9999);
  color: white;
  box-shadow: 0 2px 4px rgba(255, 107, 107, 0.4);
}

.option-text {
  flex: 1;
  font-size: 1rem;
  color: #333;
  font-family: "Microsoft YaHei", 微软雅黑, sans-serif;
  word-wrap: break-word;
  min-width: 0;
}

.option-feedback {
  font-size: 0.8rem;
  font-weight: bold;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 0.2rem;
  width: 100%;
}

/* 垂直布局下的选项反馈 */
.options.grid-1 .option-feedback,
.options.vertical .option-feedback {
  margin-top: 0;
  margin-left: auto;
}

/* 网格布局下的选项反馈 */
.options.grid-4 .option-feedback,
.options.grid-2 .option-feedback {
  margin-top: 0;
  margin-left: 0;
  width: auto;
  flex: 1;
}

.feedback-selected {
  color: #7DD3F8;
  background-color: rgba(125, 211, 248, 0.1);
  padding: 0.2rem 0.8rem;
  border-radius: 12px;
  border: 1px solid #7DD3F8;
  white-space: nowrap;
  font-family: "Microsoft YaHei", 微软雅黑, sans-serif;
}

.feedback-correct {
  color: #A8E6CF;
  background-color: rgba(168, 230, 207, 0.1);
  padding: 0.2rem 0.8rem;
  border-radius: 12px;
  border: 1px solid #A8E6CF;
  white-space: nowrap;
  font-family: "Microsoft YaHei", 微软雅黑, sans-serif;
}

.feedback-wrong {
  color: #FF6B6B;
  background-color: rgba(255, 107, 107, 0.1);
  padding: 0.2rem 0.8rem;
  border-radius: 12px;
  border: 1px solid #FF6B6B;
  white-space: nowrap;
  font-family: "Microsoft YaHei", 微软雅黑, sans-serif;
}

/* 答案解析样式 */
.explanation {
  margin-top: 1.5rem;
  padding: 1.2rem;
  background-color: #F8F9FA;
  border-left: 4px solid #7DD3F8;
  border-radius: 15px;
  position: relative;
  overflow: hidden;
}

.explanation::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--header-gradient);
}

.explanation-title {
  font-size: 1rem;
  font-weight: bold;
  color: #333;
  margin: 0 0 0.8rem 0;
  font-family: "Microsoft YaHei", 微软雅黑, sans-serif;
}

.explanation-content {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #555;
  margin: 0;
  font-family: "Microsoft YaHei", 微软雅黑, sans-serif;
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
  
  /* 调整网格布局 */
  .options.grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .options.grid-2 {
    grid-template-columns: 1fr;
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
    flex-direction: column;
    align-items: flex-start;
  }
  
  .option-content {
    width: 100%;
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;
  }
  
  .option-feedback {
    width: 100%;
    margin-top: 0.5rem;
    margin-left: 32px;
  }
  
  .option-label {
    width: 24px;
    height: 24px;
    font-size: 0.9rem;
    flex-shrink: 0;
  }
  
  .option-text {
    font-size: 0.9rem;
    flex: 1;
    word-wrap: break-word;
  }
  
  /* 调整网格布局 */
  .options.grid-4,
  .options.grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
