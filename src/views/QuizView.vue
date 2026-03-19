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
        <button class="submit-btn" @click="submitAnswers" :disabled="!hasAnsweredAll || !canSubmit">
          <template v-if="!canSubmit">
            🔒 {{ countdown }}秒后可提交
          </template>
          <template v-else>
            🚩 提交答案
          </template>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
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

// 提交冷却时间（10秒）
const SUBMIT_COOLDOWN = 10
const countdown = ref(SUBMIT_COOLDOWN)
let countdownInterval = null
const canSubmit = ref(false)

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

  
  if (!hasAnsweredAll.value) {
    ElMessage.warning('请回答所有题目后再提交！')

    return
  }
  

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
        const correctAnswer = question.correct_answer || question.answer
        if (question.type === 'multiple') {
          const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : correctAnswer.split('')
          if (Array.isArray(userAnswer)) {
            const sortedUserAnswer = userAnswer.sort()
            const sortedCorrectAnswer = correctAnswers.sort()
            isCorrect = JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer)
          }
        } else {
          if (Array.isArray(userAnswer)) {
            // 如果用户答案是数组，取第一个元素
            isCorrect = userAnswer[0] === correctAnswer
          } else {
            isCorrect = userAnswer === correctAnswer
          }
        }
        
        // 处理答案格式
        const formattedUserAnswer = question.type === 'multiple' && Array.isArray(userAnswer) ? userAnswer.join('') : userAnswer
        const formattedCorrectAnswer = question.type === 'multiple' && Array.isArray(question.answer) ? question.answer.join('') : question.answer
        
        // 保存随机排序的选项
        const shuffledOptions = question.shuffledOptions ? JSON.stringify(question.shuffledOptions) : null
        
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
            answerRecordId: successData.recordId,
            shuffledOptions: shuffledOptions
          })
        })
      }
    }
  } catch (error) {

    ElMessage.error('保存答题记录失败，请检查网络连接')
  }
  
  // 存储答题数据到localStorage
  localStorage.setItem('quizData', JSON.stringify({
    currentQuestions: currentQuestions.value,
    userAnswers: userAnswers.value,
    score: score.value
  }))
  
  // 存储用时数据到localStorage
  localStorage.setItem('timeSpent', timeSpentSeconds.toString())
  
  // 跳转到结果页面
  router.push(`/result/${subjectId.value}/${subcategoryId.value}`)
}

// 开始计时
const startTimer = () => {
  timerInterval = setInterval(() => {
    timeSpent.value = Math.round((Date.now() - startTime.value) / 1000)
  }, 1000)
}

// 启动提交倒计时
const startCountdown = () => {
  countdownInterval = setInterval(() => {
    countdown.value--

    if (countdown.value <= 0) {
      clearInterval(countdownInterval)
      countdownInterval = null
      // 使用 nextTick 确保响应式更新
      nextTick(() => {
        canSubmit.value = true

      })
      countdown.value = 0
    }
  }, 1000)
}

// 停止计时
const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
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
  startCountdown()
})

onUnmounted(() => {
  // 停止计时
  stopTimer()
})
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

.quiz-view {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--background-color) 0%, #E8F5E9 100%);
  padding-bottom: 2rem;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23F7FFF7"/><circle cx="20" cy="20" r="2" fill="%237DD3F8" opacity="0.3"/><circle cx="80" cy="40" r="2" fill="%23A8E6CF" opacity="0.3"/><circle cx="40" cy="80" r="2" fill="%23FFD88B" opacity="0.3"/><circle cx="60" cy="60" r="2" fill="%23FF9999" opacity="0.3"/></svg>');
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
  box-shadow: var(--el-shadow-light);
  border: 2px solid #E8E8E8;
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
  background: var(--header-gradient);
}

.quiz-info {
  margin-bottom: 2rem;
}

.quiz-title {
  font-family: "Microsoft YaHei", 微软雅黑, sans-serif;
  font-size: 2.2rem;
  font-weight: bold;
  color: #7DD3F8;
  margin: 0 0 1.5rem 0;
  letter-spacing: 2px;
  text-shadow: 2px 2px 4px rgba(125, 211, 248, 0.3);
}

.quiz-stats {
  display: flex;
  gap: 2rem;
  align-items: center;
  flex-wrap: wrap;
}

.question-count,
.time-spent {
  background: var(--header-gradient);
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 25px;
  font-weight: bold;
  font-size: 1.1rem;
  border: 2px solid #7DD3F8;
  box-shadow: 0 4px 0 rgba(125, 211, 248, 0.5);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: "Microsoft YaHei", 微软雅黑, sans-serif;
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
  border: 2px solid #E8E8E8;
}

.progress-fill {
  height: 100%;
  background: var(--header-gradient);
  border-radius: 8px;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(125, 211, 248, 0.5);
}

.progress-text {
  font-size: 1.1rem;
  color: #333;
  text-align: right;
  font-weight: bold;
  font-family: "Microsoft YaHei", 微软雅黑, sans-serif;
}

.questions-section {
  margin-bottom: 2.5rem;
}

.action-buttons {
  display: flex;
  justify-content: center;
}

.submit-btn {
  background: var(--header-gradient);
  color: white;
  border: 3px solid #7DD3F8;
  padding: 1.2rem 3rem;
  border-radius: 50px;
  font-size: 1.3rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
  letter-spacing: 2px;
  box-shadow: 0 6px 0 rgba(125, 211, 248, 0.5);
  font-family: "Microsoft YaHei", 微软雅黑, sans-serif;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: 0 10px 0 rgba(125, 211, 248, 0.5), 0 15px 20px rgba(125, 211, 248, 0.4);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 2px 0 rgba(125, 211, 248, 0.5);
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
