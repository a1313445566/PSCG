<template>
  <div class="student-container">
    <div class="game-header">
      <h1 class="game-title">🏆 小学刷题闯关 🏆</h1>
      <div class="game-logo">🎮</div>
    </div>
    
    <!-- 学科选择 -->
    <div v-if="!selectedSubjectId" class="subject-selection">
      <h2 class="section-title">🚀 请选择学科</h2>
      <div class="subject-list">
        <div 
          v-for="subject in subjects" 
          :key="subject.id"
          class="subject-card"
          @click="selectSubject(subject.id)"
        >
          <div class="subject-icon" :class="'subject-' + subject.id">
            {{ subjectIcons[subject.id - 1] }}
          </div>
          <div class="subject-name">{{ subject.name }}</div>
        </div>
      </div>
    </div>
    
    <!-- 子分类选择 -->
    <div v-else-if="!selectedSubcategoryId" class="subcategory-selection">
      <h2 class="section-title">🎯 请选择子分类</h2>
      <div class="subcategory-list">
        <div 
          v-for="subcategory in currentSubject.subcategories" 
          :key="subcategory.id"
          class="subcategory-card"
          @click="selectSubcategory(subcategory.id)"
        >
          <div class="subcategory-icon">📚</div>
          <div class="subcategory-name">{{ subcategory.name }}</div>
        </div>
      </div>
      <div class="action-buttons">
        <el-button type="primary" @click="backToSubjects" class="back-btn">🔙 返回学科选择</el-button>
      </div>
    </div>
    
    <!-- 结果展示 -->
    <div v-else-if="score !== null" class="result-container">
      <div class="result-header">
        <h2 class="section-title">🎉 答题结果</h2>
        <div class="result-icon">{{ resultIcon }}</div>
      </div>
      <div class="score-card">
        <div class="score-circle">
          <div class="score-number">{{ score }}</div>
          <div class="score-total">/{{ totalQuestions }}</div>
        </div>
        <div class="encouragement">{{ getEncouragement() }}</div>
      </div>
      
      <div v-if="wrongQuestions.length > 0" class="wrong-questions">
        <h3 class="section-title">📝 错题回顾</h3>
        <div v-for="question in wrongQuestions" :key="question.id" class="wrong-item">
          <div class="question-header-row">
            <div class="question-meta">
              <div class="question-type-tag">{{ getQuestionTypeName(question.type) }}</div>
            </div>
            <div class="question-content-main">
              <div v-html="question.content"></div>
              <!-- 音频播放器 -->
              <div v-if="question.audio" class="question-audio">
                <audio controls :src="`http://localhost:3000/${question.audio}`">
                  您的浏览器不支持音频播放。
                </audio>
              </div>
              <!-- 看图题图片 -->
              <div v-if="question.type === 'image' && question.image" class="question-image">
                <img :src="question.image" alt="题目图片" style="max-width: 100%; max-height: 300px; margin-top: 10px;">
              </div>
            </div>
          </div>
          <div class="options">
            <div 
              v-for="(option, index) in question.shuffledOptions || question.options" 
              :key="index"
              class="option-item"
              :class="{
                'correct': option.charAt(0) === question.answer,
                'wrong': userAnswers[question.id] === option.charAt(0) && option.charAt(0) !== question.answer
              }"
            >
              <span v-html="option"></span>
            </div>
          </div>
          <div class="explanation">{{ question.explanation }}</div>
        </div>
      </div>
      
      <div class="action-buttons">
        <el-button type="primary" @click="generateNewQuestions" class="action-btn">🔄 重新闯关</el-button>
        <el-button type="primary" @click="backToSubjects" class="action-btn">🏠 返回首页</el-button>
      </div>
    </div>
    
    <!-- 题目展示 -->
    <div v-else-if="selectedSubcategoryId && currentQuestions.length > 0" class="question-container">
      <div class="question-header">
        <h2 class="section-title">{{ getSubjectName(selectedSubjectId) }} - {{ getSubcategoryName(selectedSubjectId, selectedSubcategoryId) }}</h2>
        <div class="question-count">📋 共 {{ totalQuestions }} 题</div>
      </div>
      
      <div v-for="(question, index) in currentQuestions" :key="question.id" class="question-item">
        <div class="question-header-row">
          <div class="question-meta">
            <div class="question-number">
              <span class="number-circle">{{ index + 1 }}</span>
            </div>
            <div class="question-type-tag">{{ getQuestionTypeName(question.type) }}</div>
          </div>
          <div class="question-content-main">
            <div v-html="question.content"></div>
            <!-- 音频播放器 -->
            <div v-if="question.audio" class="question-audio">
              <audio controls :src="`http://localhost:3000/${question.audio}`">
                您的浏览器不支持音频播放。
              </audio>
            </div>
            <!-- 看图题图片 -->
            <div v-if="question.type === 'image' && question.image" class="question-image">
              <img :src="question.image" alt="题目图片" style="max-width: 100%; max-height: 300px; margin-top: 10px;">
            </div>
          </div>
        </div>
        
        <div class="options">
          <div 
            v-for="(option, index) in question.shuffledOptions" 
            :key="index"
            class="option-item"
            :class="{ 'selected': userAnswers[question.id] === option.charAt(0) }"
            @click="selectOption(question.id, option.charAt(0))"
          >
            <span class="option-letter">{{ option.charAt(0) }}</span>
            <span class="option-text" v-html="option.substring(2)"></span>
          </div>
        </div>
      </div>
      
      <div class="action-buttons">
        <el-button type="primary" @click="submitAnswers" class="submit-btn">🚩 提交答案</el-button>
      </div>
    </div>
  
    <!-- 页面底部 -->
    <div class="footer">
      <div class="footer-content">
        <div class="footer-info">
          <p>© 2026 小学刷题闯关系统</p>
          <p>让学习更有趣，让进步更明显</p>
        </div>
        <div class="footer-links">
          <router-link to="/admin" class="admin-link">🔐 后台管理</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuestionStore } from '../stores/questionStore'
import { ElButton } from 'element-plus'
import 'element-plus/dist/index.css'

const store = useQuestionStore()

const selectedSubjectId = ref(null)
const selectedSubcategoryId = ref(null)
const subjects = computed(() => store.subjects)
const currentSubject = computed(() => {
  return subjects.value.find(s => s.id === selectedSubjectId.value) || {}
})
const currentQuestions = computed(() => store.currentQuestions)
const userAnswers = computed(() => store.userAnswers)
const score = computed(() => store.score)
const getSubjectName = (subjectId) => {
  const subject = subjects.value.find(s => s.id === subjectId)
  return subject ? subject.name : ''
}

// 获取子分类名称
const getSubcategoryName = (subjectId, subcategoryId) => {
  const subject = subjects.value.find(s => s.id === subjectId)
  if (subject && subject.subcategories) {
    const subcategory = subject.subcategories.find(sc => sc.id === subcategoryId)
    return subcategory ? subcategory.name : ''
  }
  return ''
}

const totalQuestions = computed(() => currentQuestions.value.length)
const wrongQuestions = ref([])

// 学科图标
const subjectIcons = ['📚', '🔢', '🌍']

// 结果图标
const resultIcon = computed(() => {
  if (!score.value) return '😞'
  const rate = score.value / totalQuestions.value
  if (rate === 1) return '🎉'
  if (rate >= 0.7) return '😊'
  if (rate >= 0.5) return '🙂'
  return '😐'
})

const selectSubject = (subjectId) => {
  selectedSubjectId.value = subjectId
  selectedSubcategoryId.value = null
}

const selectSubcategory = (subcategoryId) => {
  // 随机生成3到5之间的题目数量
  const randomCount = Math.floor(Math.random() * 3) + 3
  // 生成题目
  store.generateQuestionsBySubcategory(selectedSubjectId.value, subcategoryId, randomCount)
  selectedSubcategoryId.value = subcategoryId
  // 检查生成的题目
  setTimeout(() => {
    console.log('Generated questions:', store.currentQuestions)
  }, 100)
}



const selectOption = (questionId, option) => {
  store.submitAnswer(questionId, option)
}

const submitAnswers = () => {
  // 验证是否所有题目都已作答
  const allAnswered = currentQuestions.value.every(question => userAnswers.value[question.id] !== undefined)
  if (!allAnswered) {
    alert('请回答所有题目后再提交！')
    return
  }
  
  store.calculateScore()
  wrongQuestions.value = currentQuestions.value.filter(q => userAnswers.value[q.id] !== q.answer)
}

const getEncouragement = () => {
  const rate = score.value / totalQuestions.value
  if (rate === 1) {
    return '太棒了！你全部答对了，继续保持！'
  } else if (rate >= 0.7) {
    return '做得很好！继续努力！'
  } else if (rate >= 0.5) {
    return '不错，再接再厉！'
  } else {
    return '加油，你可以做得更好！'
  }
}

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

const backToSubjects = () => {
  selectedSubjectId.value = null
  selectedSubcategoryId.value = null
  store.currentQuestions = []
  store.userAnswers = {}
  store.score = null
  wrongQuestions.value = []
}

const generateNewQuestions = () => {
  // 随机生成3到5之间的题目数量
  const randomCount = Math.floor(Math.random() * 3) + 3
  // 生成新的题目
  store.generateQuestionsBySubcategory(selectedSubjectId.value, selectedSubcategoryId.value, randomCount)
  // 重置答题状态
  store.userAnswers = {}
  store.score = null
  wrongQuestions.value = []
}

onMounted(async () => {
  // 初始化数据
  await store.initialize()
  console.log('Data loaded:', store.questions)
})
</script>

<style scoped>
/* 全局样式 */
.student-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Comic Sans MS', 'Arial', sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  border-radius: 20px;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.student-container::before {
  content: '';
  position: absolute;
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  background: rgba(106, 17, 203, 0.1);
  border-radius: 50%;
  z-index: 0;
}

.student-container::after {
  content: '';
  position: absolute;
  bottom: -50px;
  left: -50px;
  width: 150px;
  height: 150px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 50%;
  z-index: 0;
}

/* 游戏头部 */
.game-header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 40px;
  padding: 25px;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  border-radius: 20px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1;
}

.game-logo {
  position: absolute;
  right: 25px;
  font-size: 48px;
  animation: bounce 2s infinite;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.game-title {
  font-size: 32px;
  font-weight: bold;
  color: white;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 15px;
}

.game-title::before, .game-title::after {
  content: '🏆';
  font-size: 28px;
  animation: rotate 3s linear infinite;
}

.game-logo {
  font-size: 48px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-12px);
  }
  60% {
    transform: translateY(-6px);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 章节标题 */
.section-title {
  font-size: 24px;
  font-weight: bold;
  color: #6a11cb;
  margin-bottom: 30px;
  text-align: center;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

/* 学科选择 */
.subject-selection {
  margin-bottom: 40px;
}

.subject-list {
  display: flex;
  justify-content: center;
  gap: 30px;
  flex-wrap: wrap;
}

.subject-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  min-width: 180px;
  border: 2px solid transparent;
}

.subject-card:hover {
  transform: translateY(-12px) scale(1.05);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
  border-color: #6a11cb;
}

.subject-icon {
  font-size: 64px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.subject-card:hover .subject-icon {
  transform: rotate(15deg) scale(1.1);
  filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.2));
}

.subject-1 {
  color: #ff6b6b;
}

.subject-2 {
  color: #4ecdc4;
}

.subject-3 {
  color: #45b7d1;
}

.subject-name {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin: 0;
  padding: 12px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

/* 子分类选择 */
.subcategory-selection {
  margin-bottom: 40px;
}

.subcategory-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.subcategory-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 20px;
  padding: 30px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
}

.subcategory-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%);
  border-color: #6a11cb;
}

.subcategory-icon {
  font-size: 48px;
  margin-bottom: 15px;
  color: #6a11cb;
  transition: all 0.3s ease;
}

.subcategory-card:hover .subcategory-icon {
  transform: rotate(15deg) scale(1.1);
}

.subcategory-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

/* 题目容器 */
.question-container {
  margin-bottom: 40px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px 25px;
  background: linear-gradient(135deg, #f0e6ff 0%, #e1bee7 100%);
  border-radius: 15px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  border: 2px solid #e1bee7;
  transition: all 0.3s ease;
}

.question-header:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.question-count {
  font-size: 16px;
  color: #6a11cb;
  font-weight: bold;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 5px;
}

.question-item {
  background-color: #fff;
  padding: 25px;
  border-radius: 15px;
  margin-bottom: 25px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  border: 2px solid #f0e6ff;
}

.question-item:hover {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transform: translateY(-3px);
  border-color: #e1bee7;
}

.question-number {
  display: inline-block;
  margin-bottom: 15px;
}

.number-circle {
  display: inline-block;
  width: 30px;
  height: 30px;
  background-color: #6a11cb;
  color: #fff;
  border-radius: 50%;
  text-align: center;
  line-height: 30px;
  font-weight: bold;
  margin-right: 10px;
}

.question-header-row {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f5ff;
  border-radius: 10px;
}

.question-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.question-number {
  display: flex;
  align-items: center;
  justify-content: center;
}

.number-circle {
  width: 28px;
  height: 28px;
  background-color: #6a11cb;
  color: #fff;
  border-radius: 50%;
  font-weight: bold;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.question-type-tag {
  background-color: #6a11cb;
  color: white;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  box-shadow: 0 2px 5px rgba(106, 17, 203, 0.3);
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  box-sizing: border-box;
}

.question-content-main {
  flex: 1;
  font-size: 18px;
  line-height: 1.6;
  color: #333;
  padding-left: 10px;
  border-left: 2px solid #e1bee7;
}

/* 选项 */
.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 25px;
  z-index: 1;
  position: relative;
}

.wrong-item .options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.option-item {
  padding: 18px 24px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 3px solid #e9ecef;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 160px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.option-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s ease;
}

.option-item:hover::before {
  left: 100%;
}

.option-item:hover {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-color: #90caf9;
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 25px rgba(144, 202, 249, 0.4);
}

.option-item.selected {
  background: linear-gradient(135deg, #e1bee7 0%, #ce93d8 100%);
  border-color: #6a11cb;
  box-shadow: 0 8px 25px rgba(106, 17, 203, 0.4);
  transform: translateY(-2px);
}

.option-item.correct {
  background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
  border-color: #4caf50;
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.4);
}

.option-item.wrong {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  border-color: #f44336;
  box-shadow: 0 8px 25px rgba(244, 67, 54, 0.4);
}

.option-letter {
  font-weight: bold;
  margin-right: 12px;
  font-size: 20px;
  min-width: 25px;
  color: #6a11cb;
  font-family: 'Arial', sans-serif;
}

.option-item.selected .option-letter {
  color: white;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
}

.option-item.correct .option-letter {
  color: #4caf50;
}

.option-item.wrong .option-letter {
  color: #f44336;
}

.option-text {
  flex: 1;
  font-size: 16px;
  line-height: 1.4;
}

.debug-info {
  margin-top: 10px;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
  font-size: 12px;
  color: #666;
  border-left: 3px solid #409eff;
}

/* 结果容器 */
.result-container {
  margin-bottom: 40px;
  z-index: 1;
  position: relative;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #f0e6ff 0%, #e1bee7 100%);
  border-radius: 15px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.result-icon {
  font-size: 48px;
  animation: pulse 2s infinite;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.score-card {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  border-radius: 25px;
  padding: 50px;
  text-align: center;
  margin-bottom: 40px;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.8s ease;
  position: relative;
  overflow: hidden;
}

.score-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: rotate 20s linear infinite;
}

@keyframes slideIn {
  from {
    transform: translateY(-30px) scale(0.8);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.score-circle {
  display: inline-flex;
  align-items: baseline;
  margin-bottom: 25px;
  position: relative;
  z-index: 1;
}

.score-number {
  font-size: 72px;
  font-weight: bold;
  color: white;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3);
  animation: bounce 1s ease-in-out;
}

.score-total {
  font-size: 36px;
  color: rgba(255, 255, 255, 0.8);
  margin-left: 15px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.encouragement {
  font-size: 28px;
  font-weight: bold;
  color: white;
  margin-top: 25px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
  animation: fadeIn 1.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 错题回顾 */
.wrong-questions {
  margin-top: 50px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  z-index: 1;
  position: relative;
}

.wrong-item {
  background: linear-gradient(135deg, #fff3f3 0%, #ffebee 100%);
  padding: 30px;
  border-radius: 15px;
  margin-bottom: 25px;
  border-left: 8px solid #f44336;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.wrong-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(244, 67, 54, 0.2);
}

.wrong-item::before {
  content: '❌';
  position: absolute;
  top: 15px;
  right: 15px;
  font-size: 24px;
  opacity: 0.3;
}

.explanation {
  margin-top: 25px;
  font-size: 16px;
  color: #666;
  padding: 20px;
  background: linear-gradient(135deg, #fff9c4 0%, #fff3e0 100%);
  border-radius: 12px;
  border-left: 6px solid #ff9800;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
}

.explanation::before {
  content: '💡 解析';
  position: absolute;
  top: -12px;
  left: 20px;
  background-color: #ff9800;
  color: white;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: center;
  margin-top: 50px;
  gap: 20px;
  z-index: 1;
  position: relative;
}

.submit-btn,
.back-btn,
.action-btn {
  padding: 18px 36px;
  font-size: 20px;
  font-weight: bold;
  border-radius: 50px;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
  border: none;
  cursor: pointer;
  font-family: 'Comic Sans MS', 'Arial', sans-serif;
}

.submit-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
}

.back-btn {
  background: linear-gradient(135deg, #4ecdc4 0%, #45b7d1 100%);
  color: white;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
}

.action-btn {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
}

.submit-btn::before,
.back-btn::before,
.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s ease;
}

.submit-btn:hover::before,
.back-btn:hover::before,
.action-btn:hover::before {
  left: 100%;
}

.submit-btn:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 12px 35px rgba(255, 107, 107, 0.4);
  animation: pulse 1s infinite;
}

.back-btn:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 12px 35px rgba(78, 205, 196, 0.4);
  animation: pulse 1s infinite;
}

.action-btn:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 12px 35px rgba(106, 17, 203, 0.4);
  animation: pulse 1s infinite;
}

/* 页面底部 */
.footer {
  margin-top: 60px;
  padding: 30px 0;
  background-color: #fff;
  border-radius: 15px;
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.1);
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.footer-info {
  text-align: left;
  color: #666;
  font-size: 14px;
}

.footer-info p {
  margin: 5px 0;
}

.footer-links {
  text-align: right;
}

.admin-link {
  display: inline-block;
  padding: 10px 20px;
  background-color: #6a11cb;
  color: white;
  text-decoration: none;
  border-radius: 25px;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(106, 17, 203, 0.3);
}

.admin-link:hover {
  background-color: #7c27ce;
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(106, 17, 203, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .student-container {
    padding: 10px;
    border-radius: 10px;
  }
  
  .game-title {
    font-size: 24px;
  }
  
  .game-logo {
    font-size: 30px;
  }
  
  .section-title {
    font-size: 20px;
  }
  
  .subject-card {
    padding: 20px;
    min-width: 120px;
  }
  
  .subject-icon {
    font-size: 40px;
  }
  
  .options {
    flex-direction: column;
  }
  
  .option-item {
    min-width: 100%;
  }
  
  .score-number {
    font-size: 40px;
  }
  
  .score-total {
    font-size: 20px;
  }
  
  .encouragement {
    font-size: 20px;
  }
  
  .footer-content {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .footer-info {
    text-align: center;
  }
  
  .footer-links {
    text-align: center;
  }
}
</style>