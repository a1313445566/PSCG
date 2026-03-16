<template>
  <div class="quiz-view">
    <AppHeader />
    
    <div class="quiz-content">
      <div class="quiz-header">
        <div class="quiz-info">
          <h2 class="quiz-title">{{ currentSubject.name }} - {{ currentSubcategory.name }}</h2>
          <div class="quiz-stats">
            <span class="question-count">共 {{ totalQuestions }} 题</span>
            <span class="time-spent">用时: {{ formatTime(timeSpent) }}</span>
          </div>
        </div>
        <div class="progress-section">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          <div class="progress-text">{{ answeredQuestions }}/{{ totalQuestions }} 已答</div>
        </div>
      </div>
      
      <div class="questions-section">
        <QuestionCard 
          v-for="(question, index) in currentQuestions" 
          :key="question.id"
          :question="question"
          :question-number="index + 1"
          :user-answer="userAnswers[question.id]"
          :show-result="false"
          @select-option="(option) => selectOption(question.id, option, question.type)"
        />
      </div>
      
      <div class="action-buttons">
        <button class="submit-btn" @click="submitAnswers" :disabled="!hasAnsweredAll">
          🚩 提交答案
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppHeader from '../components/common/AppHeader.vue'
import QuestionCard from '../components/quiz/QuestionCard.vue'
import { useQuestionStore, useQuizStore, useSettingsStore } from '../stores/questionStore'
import { getApiBaseUrl } from '../utils/database'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const questionStore = useQuestionStore()
const quizStore = useQuizStore()
const settingsStore = useSettingsStore()

// 获取学科和题库ID
const subjectId = computed(() => parseInt(route.params.subjectId))
const subcategoryId = computed(() => parseInt(route.params.subcategoryId))

// 当前学科和题库
const currentSubject = computed(() => {
  return questionStore.subjects.find(s => s.id === subjectId.value) || { name: '未知学科' }
})

const currentSubcategory = computed(() => {
  if (currentSubject.value.subcategories) {
    return currentSubject.value.subcategories.find(sc => sc.id === subcategoryId.value) || { name: '未知题库' }
  }
  return { name: '未知题库' }
})

// 题目数据
const currentQuestions = computed(() => quizStore.currentQuestions)
const userAnswers = computed(() => quizStore.userAnswers)
const score = computed(() => quizStore.score)

// 答题统计
const totalQuestions = computed(() => currentQuestions.value.length)
const answeredQuestions = computed(() => {
  return Object.keys(userAnswers.value).length
})

const progressPercentage = computed(() => {
  if (totalQuestions.value === 0) return 0
  return (answeredQuestions.value / totalQuestions.value) * 100
})

const hasAnsweredAll = computed(() => {
  return currentQuestions.value.every(question => {
    const answer = userAnswers.value[question.id]
    if (question.type === 'multiple') {
      return Array.isArray(answer) && answer.length > 0
    } else {
      return answer !== undefined
    }
  })
})

// 计时
const startTime = ref(Date.now())
const timeSpent = ref(0)
let timerInterval = null

// 格式化时间
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}分${remainingSeconds}秒`
}

// 选择选项
const selectOption = (questionId, option, questionType = 'single') => {
  quizStore.submitAnswer(questionId, option, questionType)
}

// 提交答案
const submitAnswers = async () => {
  console.log('提交答案按钮点击')
  console.log('hasAnsweredAll:', hasAnsweredAll.value)
  console.log('currentQuestions:', currentQuestions.value)
  console.log('userAnswers:', userAnswers.value)
  
  if (!hasAnsweredAll.value) {
    ElMessage.warning('请回答所有题目后再提交！')
    console.log('未回答所有题目')
    return
  }
  
  console.log('开始计算分数')
  // 计算分数
  quizStore.calculateScore()
  
  // 保存答题记录
  const timeSpentSeconds = Math.round((Date.now() - startTime.value) / 1000)
  
  try {
    // 保存整体答题记录
    const apiUrl = `${getApiBaseUrl()}/answer-records`
    const answerRecordResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: localStorage.getItem('userId'),
        subjectId: subjectId.value,
        subcategoryId: subcategoryId.value,
        totalQuestions: totalQuestions.value,
        correctCount: score.value,
        timeSpent: timeSpentSeconds
      })
    })
    
    if (answerRecordResponse.ok) {
      const successData = await answerRecordResponse.json()
      
      // 保存每道题的答题记录
      for (const question of currentQuestions.value) {
        const userAnswer = userAnswers.value[question.id]
        
        // 计算是否正确
        let isCorrect = false
        if (question.type === 'multiple') {
          const correctAnswers = Array.isArray(question.answer) ? question.answer : question.answer.split('')
          if (Array.isArray(userAnswer)) {
            const sortedUserAnswer = userAnswer.sort()
            const sortedCorrectAnswer = correctAnswers.sort()
            isCorrect = JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer)
          }
        } else {
          isCorrect = userAnswer === question.answer
        }
        
        // 处理答案格式
        const formattedUserAnswer = question.type === 'multiple' && Array.isArray(userAnswer) ? userAnswer.join('') : userAnswer
        const formattedCorrectAnswer = question.type === 'multiple' && Array.isArray(question.answer) ? question.answer.join('') : question.answer
        
        await fetch(`${getApiBaseUrl()}/answer-records/question-attempts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: localStorage.getItem('userId'),
            questionId: question.id,
            subjectId: subjectId.value,
            subcategoryId: subcategoryId.value,
            userAnswer: formattedUserAnswer,
            correctAnswer: formattedCorrectAnswer,
            isCorrect: isCorrect,
            answerRecordId: successData.recordId
          })
        })
      }
    }
  } catch (error) {
    console.error('保存答题记录失败:', error)
    ElMessage.error('保存答题记录失败，请检查网络连接')
  }
  
  // 存储答题数据到localStorage
  localStorage.setItem('quizData', JSON.stringify({
    currentQuestions: currentQuestions.value,
    userAnswers: userAnswers.value,
    score: score.value
  }))
  
  // 跳转到结果页面
  router.push(`/result/${subjectId.value}/${subcategoryId.value}`)
}

// 开始计时
const startTimer = () => {
  timerInterval = setInterval(() => {
    timeSpent.value = Math.round((Date.now() - startTime.value) / 1000)
  }, 1000)
}

// 停止计时
const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

onMounted(async () => {
  // 初始化数据
  await questionStore.initialize()
  await settingsStore.loadSettings()
  
  // 检查是否已登录
  if (!localStorage.getItem('studentId')) {
    router.push('/login')
    return
  }
  
  // 生成题目
  const { randomizeAnswers, fixedQuestionCount, minQuestionCount, maxQuestionCount, fixedQuestionCountValue } = settingsStore.settings
  
  let questionCount
  if (fixedQuestionCount) {
    questionCount = fixedQuestionCountValue
  } else {
    questionCount = Math.floor(Math.random() * (maxQuestionCount - minQuestionCount + 1)) + minQuestionCount
  }
  
  // 确保数据已加载
  if (questionStore.questions.length === 0) {
    await questionStore.loadData()
  }
  
  // 生成题目
  quizStore.generateQuestionsBySubcategory(parseInt(subjectId.value), parseInt(subcategoryId.value), questionCount, randomizeAnswers)
  
  // 开始计时
  startTime.value = Date.now()
  startTimer()
})

onUnmounted(() => {
  // 停止计时
  stopTimer()
})
</script>

<style scoped>
.quiz-view {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--background-color) 0%, #E8F5E9 100%);
  padding-bottom: 2rem;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23F7FFF7"/><circle cx="20" cy="20" r="2" fill="%23FF6B6B" opacity="0.3"/><circle cx="80" cy="40" r="2" fill="%234ECDC4" opacity="0.3"/><circle cx="40" cy="80" r="2" fill="%23FFD166" opacity="0.3"/><circle cx="60" cy="60" r="2" fill="%2306D6A0" opacity="0.3"/></svg>');
  background-repeat: repeat;
}

.quiz-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.quiz-header {
  background: white;
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 3px solid var(--border-color);
  overflow: hidden;
  margin-bottom: 2rem;
  position: relative;
}

.quiz-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color), var(--accent-color));
}

.quiz-info {
  margin-bottom: 2rem;
}

.quiz-title {
  font-family: var(--game-font);
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--primary-color);
  margin: 0 0 1.5rem 0;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 2px 2px 4px rgba(255, 107, 107, 0.3);
}

.quiz-stats {
  display: flex;
  gap: 2rem;
  align-items: center;
  flex-wrap: wrap;
}

.question-count,
.time-spent {
  background-color: var(--accent-color);
  color: var(--text-primary);
  padding: 0.8rem 1.5rem;
  border-radius: 25px;
  font-weight: 900;
  font-size: 1.1rem;
  border: 2px solid var(--accent-color);
  box-shadow: 0 4px 0 #E6BF50;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-section {
  margin-top: 2rem;
}

.progress-bar {
  width: 100%;
  height: 15px;
  background-color: #E8E8E8;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 1rem;
  border: 2px solid var(--border-color);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color), var(--accent-color));
  border-radius: 8px;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
}

.progress-text {
  font-size: 1.1rem;
  color: var(--text-secondary);
  text-align: right;
  font-weight: 700;
}

.questions-section {
  margin-bottom: 2.5rem;
}

.action-buttons {
  display: flex;
  justify-content: center;
}

.submit-btn {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: white;
  border: 3px solid var(--primary-color);
  padding: 1.2rem 3rem;
  border-radius: 50px;
  font-size: 1.3rem;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  box-shadow: 0 6px 0 #D9534F;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: 0 10px 0 #D9534F, 0 15px 20px rgba(255, 107, 107, 0.4);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #D9534F;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .quiz-content {
    padding: 1rem;
  }
  
  .quiz-header {
    padding: 2rem;
    top: 90px;
  }
  
  .quiz-title {
    font-size: 1.8rem;
  }
  
  .quiz-stats {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .submit-btn {
    padding: 1rem 2.5rem;
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .quiz-header {
    padding: 1.5rem;
    top: 80px;
  }
  
  .quiz-title {
    font-size: 1.5rem;
  }
  
  .submit-btn {
    padding: 0.9rem 2rem;
    font-size: 1rem;
  }
}
</style>