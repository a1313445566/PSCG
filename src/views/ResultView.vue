<template>
  <div class="result-view">
    <AppHeader />
    
    <div class="result-content">
      <ResultCard 
        :score="score" 
        :totalQuestions="totalQuestions"
        :timeSpent="timeSpent"
        :points="calculatePoints"
        @generate-new="generateNewQuestions"
        @back-to-subjects="backToSubcategory"
      />
      
      <div v-if="wrongQuestions.length > 0" class="wrong-questions-section">
        <h3 class="section-title">📝 错题回顾</h3>
        <QuestionCard 
          v-for="(question, index) in wrongQuestions" 
          :key="question.id"
          :question="question"
          :question-number="index + 1"
          :user-answer="formatUserAnswer(question.id, question.type)"
          :show-result="true"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppHeader from '../components/common/AppHeader.vue'
import ResultCard from '../components/quiz/ResultCard.vue'
import QuestionCard from '../components/quiz/QuestionCard.vue'
import { useQuestionStore } from '../stores/questionStore'

const router = useRouter()
const route = useRoute()
const questionStore = useQuestionStore()

// 获取学科和题库ID
const subjectId = computed(() => parseInt(route.params.subjectId))
const subcategoryId = computed(() => route.params.subcategoryId === 'error-collection' ? 'error-collection' : parseInt(route.params.subcategoryId))

// 答题数据
const quizData = ref(null)
const score = computed(() => quizData.value?.score || 0)
const currentQuestions = computed(() => quizData.value?.currentQuestions || [])
const userAnswers = computed(() => quizData.value?.userAnswers || {})

// 计算总题目数
const totalQuestions = computed(() => currentQuestions.value.length)

// 计算用时（从localStorage中读取）
const timeSpent = computed(() => {
  // 从localStorage中读取用时数据
  const timeSpentData = localStorage.getItem('timeSpent')
  return timeSpentData ? parseInt(timeSpentData) : 0
})

// 计算获得的积分
const calculatePoints = computed(() => {
  const correctCount = score.value
  const wrongCount = totalQuestions.value - correctCount
  
  // 基础积分：答对一题得1分，答错一题扣1分
  let points = correctCount - wrongCount
  
  // 全对积分翻倍
  if (correctCount === totalQuestions.value && totalQuestions.value > 0) {
    points *= 2
  }
  
  return points
})

// 错题列表
const wrongQuestions = computed(() => {
  return currentQuestions.value.filter(q => {
    const userAnswer = userAnswers.value[q.id]
    const correctAnswer = q.answer
    
    if (q.type === 'multiple') {
      if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
        const sortedUserAnswer = userAnswer.sort()
        const sortedCorrectAnswer = correctAnswer.sort()
        return JSON.stringify(sortedUserAnswer) !== JSON.stringify(sortedCorrectAnswer)
      } else if (typeof correctAnswer === 'string') {
        if (Array.isArray(userAnswer)) {
          const sortedUserAnswer = userAnswer.sort().join('')
          return sortedUserAnswer !== correctAnswer
        }
        return true
      }
      return true
    } else {
      return userAnswer !== correctAnswer
    }
  })
})

// 重新生成题目
const generateNewQuestions = () => {
  // 清除旧的答题数据
  localStorage.removeItem('quizData')
  router.push(`/quiz/${subjectId.value}/${subcategoryId.value}`)
}

// 格式化用户答案
const formatUserAnswer = (questionId, questionType) => {
  const userAnswer = userAnswers.value[questionId]
  
  if (questionType === 'multiple') {
    // 如果是字符串格式，转换为数组
    if (typeof userAnswer === 'string' && userAnswer.length > 0) {
      return userAnswer.split('')
    }
    // 如果已经是数组，直接返回
    if (Array.isArray(userAnswer)) {
      return userAnswer
    }
    // 其他情况返回空数组
    return []
  } else {
    // 单选题直接返回
    return userAnswer
  }
}

// 返回首页
const backToSubcategory = () => {
  // 清除旧的答题数据
  localStorage.removeItem('quizData')
  router.push('/home')
}

onMounted(async () => {
  // 初始化数据
  await questionStore.initialize()
  
  // 从localStorage中读取答题数据
  const storedData = localStorage.getItem('quizData')
  if (storedData) {
    try {
      quizData.value = JSON.parse(storedData)
    } catch (error) {

      // 如果解析失败，重定向到题库选择页面
      router.push(`/subcategory/${subjectId.value}`)
    }
  } else {
    // 如果没有答题数据，重定向到题库选择页面
    router.push(`/subcategory/${subjectId.value}`)
  }
})
</script>

<style scoped>
.result-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #F8F9FA 0%, #E3F2FD 100%);
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23F7FFF7"/><circle cx="20" cy="20" r="2" fill="%23FF6B6B" opacity="0.3"/><circle cx="80" cy="40" r="2" fill="%234ECDC4" opacity="0.3"/><circle cx="40" cy="80" r="2" fill="%23FFD166" opacity="0.3"/><circle cx="60" cy="60" r="2" fill="%2306D6A0" opacity="0.3"/></svg>');
  background-repeat: repeat;
  padding-bottom: 2rem;
}

.result-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.wrong-questions-section {
  margin-top: 3rem;
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-family: 'Fredoka One', 'Comic Sans MS', cursive;
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 1.5rem;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .result-content {
    padding: 1rem;
  }
  
  .wrong-questions-section {
    padding: 1.5rem;
  }
  
  .section-title {
    font-size: 1.3rem;
  }
}

@media (max-width: 480px) {
  .wrong-questions-section {
    padding: 1.2rem;
  }
}
</style>