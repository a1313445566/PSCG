<template>
  <div class="quiz-view">
    <AppHeader />

    <!-- 答题行为追踪组件（无UI，纯逻辑） -->
    <AnswerBehaviorTracker ref="behaviorTracker" />

    <div class="quiz-content">
      <div class="quiz-header">
        <div class="quiz-info">
          <h2 class="quiz-title">{{ currentSubject.name }} - {{ currentSubcategory.name }}</h2>
          <div class="quiz-stats">
            <span class="question-count">共 {{ totalQuestions }} 题</span>
            <span class="time-spent">用时: {{ formatTime(timeSpent) }}</span>
            <span class="shuffle-tag" :class="shouldRandomize ? 'shuffle-on' : 'shuffle-off'">
              {{ shouldRandomize ? '🔀 答案选项随机排序' : '📋 答案选项固定顺序' }}
            </span>
          </div>
        </div>

        <!-- 答题规则及积分规则 -->
        <div class="rules-section">
          <h3 class="rules-title">答题规则</h3>
          <div class="rules-content">
            <template v-if="isErrorCollection">
              <p>每道题累计正确3次后将自动移除，再次做错将重置已累计的正确次数。</p>
              <p class="points-rule">积分规则：每道题目累计答对3次+1分。</p>
            </template>
            <template v-else>
              <p>请回答所有题目后提交，提交后将显示结果。</p>
              <p class="points-rule">积分规则：答对一题得1分，答错一题扣1分，全对积分翻倍。</p>
            </template>
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
        <div v-if="currentQuestions.length > 0">
          <!-- 普通题目渲染 -->
          <template v-for="(question, index) in currentQuestions" :key="question.id">
            <QuestionCard
              v-if="question.type !== 'reading'"
              :question="question"
              :question-number="index + 1"
              :user-answer="userAnswers[question.id]"
              :show-result="false"
              @select-option="option => selectOption(question.id, option, question.type)"
              @mouseenter="handleQuestionHover(question.id, true)"
              @mouseleave="handleQuestionHover(question.id, false)"
            />
            <!-- 阅读理解题渲染 -->
            <ReadingPassageCard
              v-else
              v-model="readingAnswers[question.id]"
              :passage="question.content"
              :sub-questions="parseReadingSubQuestions(question, question.shuffleMapping)"
              :disabled="false"
            />
          </template>
        </div>
        <div v-else class="questions-skeleton">
          <SkeletonLoader v-for="i in 3" :key="i" type="question-card" />
        </div>
      </div>

      <div class="action-buttons">
        <button
          class="submit-btn"
          :disabled="!hasAnsweredAll || !canSubmit || isSubmitting"
          @click="submitAnswers"
        >
          <template v-if="isSubmitting">⏳ 提交中...</template>
          <template v-else-if="!canSubmit">🔒 {{ countdown }}秒后可提交</template>
          <template v-else>🚩 提交答案</template>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppHeader from '../components/common/AppHeader.vue'
import QuestionCard from '../components/quiz/QuestionCard.vue'
import SkeletonLoader from '../components/common/SkeletonLoader.vue'
import AnswerBehaviorTracker from '../components/quiz/AnswerBehaviorTracker.vue'
import ReadingPassageCard from '../components/student/ReadingPassageCard.vue'
import { useQuestionStore, useQuizStore, useSettingsStore } from '../stores/questionStore'
import { getApiBaseUrl } from '../utils/database'
import { ElMessage } from 'element-plus'
import { shuffleOptions } from '../utils/shuffleOptions'

const router = useRouter()
const route = useRoute()
const questionStore = useQuestionStore()
const quizStore = useQuizStore()
const settingsStore = useSettingsStore()

// 答题行为追踪组件引用
const behaviorTracker = ref(null)

// 当前正在答题的题目ID（用于追踪）
const currentTrackingQuestionId = ref(null)

// 获取学科和题库ID
const subjectId = computed(() => parseInt(route.params.subjectId))
const subcategoryId = computed(() => route.params.subcategoryId)

// 检测是否是错题巩固题库
const isErrorCollection = computed(() => subcategoryId.value === 'error-collection')

// 是否开启了选项打乱（根据题库类型使用不同设置）
const shouldRandomize = computed(() => {
  if (isErrorCollection.value) {
    return settingsStore.settings.randomizeErrorCollectionAnswers
  }
  return settingsStore.settings.randomizeAnswers
})

// 当前学科和题库
const currentSubject = computed(() => {
  return questionStore.subjects.find(s => s.id === subjectId.value) || { name: '未知学科' }
})

const currentSubcategory = computed(() => {
  if (isErrorCollection.value) {
    return { name: '错题巩固题库' }
  }
  if (currentSubject.value.subcategories) {
    return (
      currentSubject.value.subcategories.find(sc => sc.id === parseInt(subcategoryId.value)) || {
        name: '未知题库'
      }
    )
  }
  return { name: '未知题库' }
})

// 题目数据
const currentQuestions = computed(() => quizStore.currentQuestions)
const userAnswers = computed(() => quizStore.userAnswers)
const _score = computed(() => quizStore.score)

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
    // 阅读理解题：检查所有小题是否已答
    if (question.type === 'reading') {
      const subQuestions = parseReadingSubQuestions(question, question.shuffleMapping)
      return Object.keys(readingAnswers.value[question.id] || {}).length === subQuestions.length
    }
    // 多选题：检查是否选择了至少一个选项
    if (question.type === 'multiple') {
      return Array.isArray(answer) && answer.length > 0
    }
    // 其他题型：检查是否有答案
    return answer !== undefined
  })
})

// 阅读理解题答案存储：{ 题目ID: { 小题索引: 答案 } }
const readingAnswers = ref({})

// 监听阅读理解题答案变化，自动同步到 userAnswers
watch(
  readingAnswers,
  newVal => {
    Object.keys(newVal).forEach(questionId => {
      const answers = newVal[questionId]
      if (answers && Object.keys(answers).length > 0) {
        userAnswers.value[questionId] = answers
      }
    })
  },
  { deep: true }
)

// 解析阅读理解题的小题列表
const parseReadingSubQuestions = (question, shuffleMapping) => {
  let options = []
  try {
    options = typeof question.options === 'string' ? JSON.parse(question.options) : question.options
  } catch (e) {
    return []
  }

  if (!Array.isArray(options)) return []

  // 注意：前端已经打乱过了，question.options 就是打乱后的选项
  // 这里直接返回，不要再应用映射！
  return options.map((sq, sqIndex) => {
    return {
      order: sq.order || sqIndex + 1,
      content: sq.content || '',
      options: sq.options || [],
      displayOptions: (sq.options || []).map((opt, i) => ({
        content: opt,
        displayLabel: String.fromCharCode(65 + i),
        originalLabel: sq.originalOptions
          ? String.fromCharCode(65 + sq.originalOptions.indexOf(opt))
          : String.fromCharCode(65 + i)
      })),
      answer: sq.answer || '',
      explanation: sq.explanation || ''
    }
  })
}

// 计时
const startTime = ref(Date.now())
const timeSpent = ref(0)
let timerInterval = null

// 提交冷却时间（10秒）
const SUBMIT_COOLDOWN = 20
const countdown = ref(SUBMIT_COOLDOWN)
let countdownInterval = null
const canSubmit = ref(false)
// 提交状态
const isSubmitting = ref(false)
// 上次提交时间戳
const lastSubmitTime = ref(0)

// 格式化时间
const formatTime = seconds => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}分${remainingSeconds}秒`
}

// 选择选项
const selectOption = (questionId, option, questionType = 'single') => {
  // 如果是新题目，开始追踪
  if (currentTrackingQuestionId.value !== questionId) {
    behaviorTracker.value?.startTracking(questionId)
    currentTrackingQuestionId.value = questionId
  }

  // 追踪首次答案
  const currentAnswer = userAnswers.value[questionId]
  if (!currentAnswer || (questionType === 'multiple' && currentAnswer.length === 0)) {
    behaviorTracker.value?.trackFirstAnswer(option)
  } else {
    // 如果已有答案，说明是修改
    behaviorTracker.value?.trackModification()
  }

  quizStore.submitAnswer(questionId, option, questionType)
}

// 处理题目悬停（犹豫追踪）
const handleQuestionHover = (questionId, isEnter) => {
  if (isEnter) {
    behaviorTracker.value?.trackHoverStart()
  } else {
    behaviorTracker.value?.trackHoverEnd()
  }
}

// 判断答案是否正确
const isAnswerCorrect = (question, userAnswer) => {
  if (!userAnswer) return false
  const correctAnswer = question.correct_answer || question.answer
  let isCorrect = false
  if (question.type === 'multiple') {
    const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : correctAnswer.split('')
    if (Array.isArray(userAnswer)) {
      const sortedUserAnswer = [...userAnswer].sort()
      const sortedCorrectAnswer = [...correctAnswers].sort()
      isCorrect = JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer)
    }
  } else {
    if (Array.isArray(userAnswer)) {
      isCorrect = userAnswer[0] === correctAnswer
    } else {
      isCorrect = userAnswer === correctAnswer
    }
  }
  return isCorrect
}

// 生成随机密钥的函数
const generateRandomSecret = () => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// 检查并获取签名密钥
const getSignatureSecret = () => {
  const secret = import.meta.env.VITE_SIGNATURE_SECRET

  // 生产环境必须设置密钥
  if (import.meta.env.PROD && !secret) {
    console.error('Error: VITE_SIGNATURE_SECRET is required in production environment')
    throw new Error('VITE_SIGNATURE_SECRET is required in production environment')
  }

  // 开发环境如果没有设置，使用随机生成的临时密钥
  if (!secret) {
    const randomSecret = generateRandomSecret()
    console.warn(
      'Warning: VITE_SIGNATURE_SECRET not set. Using random temporary secret for development.'
    )
    return randomSecret
  }

  return secret
}

// 安全的签名脱敏函数（只显示前8位和后8位）
const maskSignature = signature => {
  if (!signature || signature.length < 20) {
    return '***invalid***'
  }
  const start = signature.substring(0, 8)
  const end = signature.substring(signature.length - 8)
  return `${start}***${end}`
}

// 安全的日志输出函数（生产环境禁用）
const logSignatureDebug = (message, data = {}) => {
  // 生产环境不输出任何日志
  if (import.meta.env.PROD) {
    return
  }

  // 开发环境输出详细信息（脱敏）
  console.log(`[签名生成] ${message}`, data)
}

// 生成签名（与后端保持一致）
const generateSignature = async (data, timestamp, userId) => {
  logSignatureDebug('开始生成签名', {
    quizId: data.quizId,
    userId,
    answerCount: Object.keys(data.answers).length,
    hasSecret: !!getSignatureSecret()
  })

  const secret = getSignatureSecret()
  // 按照固定顺序构建dataStr
  const dataStr = JSON.stringify(data) + timestamp + userId

  // 检查 Web Crypto API 是否可用（需要安全上下文：HTTPS 或 localhost）
  if (crypto.subtle) {
    try {
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(dataStr)
      const keyBuffer = encoder.encode(secret)

      // 导入密钥
      const key = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'HMAC', hash: { name: 'SHA-256' } },
        false,
        ['sign']
      )

      // 生成签名
      const signatureBuffer = await crypto.subtle.sign('HMAC', key, dataBuffer)

      // 转换为十六进制字符串
      const hex = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      logSignatureDebug('✅ HMAC-SHA256 签名生成成功', {
        method: 'HMAC-SHA256',
        signature: maskSignature(hex),
        length: hex.length
      })

      return hex
    } catch (error) {
      logSignatureDebug('⚠️ HMAC 失败，切换到降级方案', {
        error: error.message
      })
    }
  }

  // 安全降级方案：使用密钥的多轮哈希
  // 注意：这不是标准 HMAC，但提供了足够的安全性用于非 HTTPS 环境
  const combinedStr = secret + dataStr + secret
  let hash = 0

  // 多轮哈希增加安全性
  for (let round = 0; round < 64; round++) {
    const roundStr = combinedStr + round.toString()
    for (let i = 0; i < roundStr.length; i++) {
      const char = roundStr.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
  }

  // 生成更长的签名（16位十六进制）
  let result = Math.abs(hash).toString(16)

  // 补齐到16位
  while (result.length < 16) {
    result = '0' + result
  }

  logSignatureDebug('✅ 降级签名生成成功', {
    method: '降级签名（非HTTPS环境）',
    signature: maskSignature(result),
    length: result.length
  })

  return result
}

// 计算积分范围
const calculatePointsRange = (totalQuestions, correctCount) => {
  const wrongCount = totalQuestions - correctCount

  // 普通题库积分规则：答对1分，答错扣1分，全对积分翻倍
  let expectedMinPoints = -wrongCount // 全错的情况
  let expectedMaxPoints = correctCount // 普通情况

  if (correctCount === totalQuestions && totalQuestions > 0) {
    expectedMaxPoints = correctCount * 2 // 全对翻倍
  }

  // 错题巩固题库积分规则：每道题累计正确3次+1分
  if (isErrorCollection.value) {
    // 错题巩固题库每道题最多+1分
    expectedMaxPoints = totalQuestions
    expectedMinPoints = 0
  }

  return { expectedMinPoints, expectedMaxPoints }
}

// 验证积分数据
const validatePoints = result => {
  const totalQuestions = result.totalQuestions || 0
  const correctCount = result.correctCount || 0

  const { expectedMinPoints, expectedMaxPoints } = calculatePointsRange(
    totalQuestions,
    correctCount
  )

  // 验证积分是否在合理范围内
  if (result.points < expectedMinPoints || result.points > expectedMaxPoints) {
    console.warn('积分数据异常，使用计算值:', {
      received: result.points,
      expectedMin: expectedMinPoints,
      expectedMax: expectedMaxPoints
    })

    // 使用计算的最大可能积分作为替代
    return Math.min(Math.max(result.points || 0, expectedMinPoints), expectedMaxPoints)
  }

  return result.points || 0
}

// 保存答题结果到 localStorage
const saveQuizResult = (result, validatedPoints, timeSpentSeconds) => {
  localStorage.setItem(
    'quizResult',
    JSON.stringify({
      score: result.score,
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
      results: result.results,
      points: validatedPoints
    })
  )

  // 存储用时数据到 localStorage
  localStorage.setItem('timeSpent', timeSpentSeconds.toString())
}

// 更新错题巩固统计数据
const updateErrorCollectionStats = result => {
  if (isErrorCollection.value && result.stats) {
    questionStore.errorCollectionStats = {
      ...questionStore.errorCollectionStats,
      ...result.stats
    }
  }
}

// 跳转到结果页面
const navigateToResult = () => {
  router.push(`/result/${subjectId.value}/${subcategoryId.value}`)
}

// 检查所有题目是否已回答
const checkAllQuestionsAnswered = () => {
  if (!hasAnsweredAll.value) {
    ElMessage.warning('请回答所有题目后再提交！')
    return false
  }
  return true
}

// 检查提交频率
const checkSubmitFrequency = () => {
  if (!canSubmit.value) {
    ElMessage.warning('提交过于频繁，请稍后再试！')
    return false
  }

  const currentTime = Date.now()
  if (currentTime - lastSubmitTime.value < 5000) {
    ElMessage.warning('提交过于频繁，请稍后再试！')
    return false
  }

  return true
}

// 验证提交前置条件
const validateSubmitPreconditions = () => {
  if (isSubmitting.value) {
    return false
  }

  if (!checkAllQuestionsAnswered()) {
    return false
  }

  if (!checkSubmitFrequency()) {
    return false
  }

  return true
}

// 提交答题行为数据
const submitBehaviorData = async () => {
  const userId = localStorage.getItem('userId')
  if (!userId || !behaviorTracker.value) {
    return
  }

  // 为每个题目提交行为数据
  for (const question of currentQuestions.value) {
    const userAnswer = userAnswers.value[question.id]
    if (userAnswer) {
      const isCorrect = isAnswerCorrect(question, userAnswer)
      const finalAnswer = Array.isArray(userAnswer) ? userAnswer.join('') : userAnswer

      await behaviorTracker.value.submitBehavior(
        parseInt(userId),
        question.id,
        finalAnswer,
        isCorrect
      )
    }
  }

  // 刷新缓冲区，确保所有数据已提交
  await behaviorTracker.value.flushBuffer()
}

// 构建打乱映射数据
const buildShuffleMappings = () => {
  const shuffleMappings = {}
  currentQuestions.value.forEach(q => {
    shuffleMappings[q.id] = q.shuffleMapping
  })
  return shuffleMappings
}

// 构建提交数据
const buildSubmitData = (timestamp, signature) => {
  const shuffleMappings = buildShuffleMappings()
  const timeSpentSeconds = Math.round((Date.now() - startTime.value) / 1000)

  return {
    quizId: quizStore.quizId,
    answers: userAnswers.value,
    shuffleMappings,
    timeSpent: timeSpentSeconds,
    timestamp,
    signature
  }
}

// 生成提交签名
const generateSubmitSignature = async (timestamp, userId) => {
  const signatureData = {
    quizId: quizStore.quizId,
    answers: userAnswers.value,
    timestamp
  }

  logSignatureDebug('准备提交答案', {
    quizId: quizStore.quizId,
    userId,
    answerCount: Object.keys(userAnswers.value).length,
    timestamp
  })

  const signature = await generateSignature(signatureData, timestamp, userId)

  logSignatureDebug('签名生成完成，准备发送', {
    signature: maskSignature(signature),
    dataLength: JSON.stringify(signatureData).length
  })

  return signature
}

// 提交答案到后端 API
const submitAnswersToApi = async submitData => {
  const apiUrl = `${getApiBaseUrl()}/quiz/submit`

  logSignatureDebug('发送请求到后端', {
    url: apiUrl,
    method: 'POST'
  })

  // 获取 token 用于身份验证
  const token = localStorage.getItem('token')

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 使用 JWT token 进行身份验证（优先）
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(submitData)
  })

  if (!response.ok) {
    const errorData = await response.json()
    logSignatureDebug('❌ 提交失败', {
      status: response.status,
      error: errorData.error
    })
    ElMessage.error(errorData.error || '提交答案失败')
    return null
  }

  const result = await response.json()

  logSignatureDebug('✅ 提交成功', {
    score: result.score,
    correctCount: result.correctCount,
    totalQuestions: result.totalQuestions,
    points: result.points
  })

  return result
}

// 提交答案
const submitAnswers = async () => {
  // 验证前置条件
  if (!validateSubmitPreconditions()) {
    return
  }

  // 设置提交状态
  const currentTime = Date.now()
  isSubmitting.value = true
  lastSubmitTime.value = currentTime

  try {
    // 提交答题行为数据
    await submitBehaviorData()

    // 生成签名和构建提交数据
    const userId = localStorage.getItem('userId')
    const timestamp = Date.now()
    const signature = await generateSubmitSignature(timestamp, userId)
    const submitData = buildSubmitData(timestamp, signature)

    // 提交答案到后端 API
    const result = await submitAnswersToApi(submitData)

    if (!result) {
      return
    }

    // 验证积分数据
    const validatedPoints = validatePoints(result)

    // 保存答题结果
    saveQuizResult(result, validatedPoints, submitData.timeSpent)

    // 更新错题巩固统计数据
    updateErrorCollectionStats(result)

    // 跳转到结果页面
    navigateToResult()
  } catch (error) {
    console.error('提交答案失败:', error)
    ElMessage.error('提交答案失败，请检查网络连接')
  } finally {
    // 重置提交状态
    isSubmitting.value = false
  }
}

// 开始计时
const startTimer = () => {
  timerInterval = setInterval(() => {
    timeSpent.value = Math.round((Date.now() - startTime.value) / 1000)
  }, 1000)
}

// 启动提交倒计时
const startCountdown = () => {
  // 重置倒计时和canSubmit状态
  countdown.value = SUBMIT_COOLDOWN
  canSubmit.value = false

  countdownInterval = setInterval(() => {
    countdown.value--

    if (countdown.value <= 0) {
      clearInterval(countdownInterval)
      countdownInterval = null
      // 直接设置canSubmit为true，不需要nextTick
      canSubmit.value = true
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
  // 重置 quizStore 状态，避免显示之前的题目
  quizStore.resetQuizState()

  // 初始化数据
  await questionStore.initialize()
  await settingsStore.loadSettings()

  // 检查是否已登录
  if (!localStorage.getItem('studentId')) {
    router.push('/login')
    return
  }

  // 调用后端API开始答题
  try {
    // 使用学科独立配置获取题目数量
    const questionCount = settingsStore.getQuestionCountForSubject(subjectId.value)

    const startData = {
      subjectId: subjectId.value,
      subcategoryId: subcategoryId.value,
      questionCount: questionCount,
      studentId: localStorage.getItem('studentId'),
      grade: parseInt(localStorage.getItem('userGrade')),
      class: parseInt(localStorage.getItem('userClass'))
    }

    const apiUrl = `${getApiBaseUrl()}/quiz/start`

    // 获取 token 用于身份验证
    const token = localStorage.getItem('token')

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 使用 JWT token 进行身份验证（优先）
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(startData)
    })

    if (!response.ok) {
      // 特殊处理错题巩固题库为空的情况
      if (isErrorCollection.value && response.status === 404) {
        ElMessage.success('恭喜！您的错题巩固题库为空，所有错题都已巩固完成！')
        router.push(`/subcategory/${subjectId.value}`)
        return
      }

      try {
        const errorData = await response.json()
        ElMessage.error(errorData.error || '开始答题失败')
      } catch (e) {
        ElMessage.error('开始答题失败')
      }
      router.push(`/subcategory/${subjectId.value}`)
      return
    }

    const data = await response.json()

    // 保存quizId用于后续提交
    quizStore.quizId = data.quizId
    quizStore.expiresAt = data.expiresAt

    // 设置题目数据（后端已返回不含正确答案的题目）
    // 根据设置决定是否对每道题的选项进行打乱
    const questionsWithShuffled = data.questions.map(q => {
      const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options

      // 阅读理解题：为每个小题单独打乱选项
      if (q.type === 'reading') {
        if (!shouldRandomize.value) {
          return {
            ...q,
            options: options,
            shuffleMapping: null,
            type: 'reading'
          }
        }

        // 为每个小题打乱选项
        const shuffleMapping = {}
        const shuffledSubQuestions = options.map((sq, sqIndex) => {
          const sqOptions = sq.options || []
          const { shuffledOptions, reverseMapping } = shuffleOptions(sqOptions)
          shuffleMapping[sqIndex] = reverseMapping

          return {
            ...sq,
            options: shuffledOptions,
            originalOptions: sqOptions
          }
        })

        return {
          ...q,
          options: shuffledSubQuestions,
          originalOptions: options,
          shuffleMapping: shuffleMapping,
          type: 'reading'
        }
      }

      // 判断题：不对选项进行打乱，保持"对/错"原始顺序
      if (q.type === 'judgment') {
        return {
          ...q,
          options: options,
          shuffleMapping: null,
          type: 'judgment'
        }
      }

      // 其他题型：根据设置决定是否对每道题的选项进行打乱
      if (shouldRandomize.value) {
        const { shuffledOptions, reverseMapping } = shuffleOptions(options)

        return {
          ...q,
          options: shuffledOptions,
          originalOptions: options,
          shuffleMapping: reverseMapping,
          type: q.type || 'single'
        }
      } else {
        return {
          ...q,
          options: options,
          shuffleMapping: null,
          type: q.type || 'single'
        }
      }
    })

    quizStore.currentQuestions = questionsWithShuffled
    quizStore.userAnswers = {}
    quizStore.score = null
    quizStore.startTime = Date.now()

    // 如果是错题巩固题库，保存统计数据
    if (isErrorCollection.value && data.stats) {
      questionStore.errorCollectionStats = { ...questionStore.errorCollectionStats, ...data.stats }
    }
  } catch (error) {
    console.error('开始答题失败:', error)
    ElMessage.error('开始答题失败，请检查网络连接')
    router.push(`/subcategory/${subjectId.value}`)
    return
  }

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

<style scoped lang="scss">
/* CSS 变量已在 src/styles/scss/abstracts/_variables.scss 中统一定义 */

.quiz-view {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--background-color) 0%, #e8f5e9 100%);
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
  border: 2px solid #e8e8e8;
  overflow: hidden;
  margin-bottom: 2rem;
  position: relative;
}

.rules-section {
  margin: 2rem 0;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #7dd3f8;
}

.rules-title {
  font-size: 1.3rem;
  font-weight: bold;
  color: #333;
  margin: 0 0 1rem 0;
  font-family: 'Microsoft YaHei', 微软雅黑, sans-serif;
}

.rules-content p {
  color: #555;
  margin: 0.5rem 0;
  line-height: 1.5;
  font-size: 1rem;
}

.points-rule {
  font-weight: bold;
  color: #ff6b6b;
  margin-top: 1rem !important;
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
  font-family: 'Microsoft YaHei', 微软雅黑, sans-serif;
  font-size: 2.2rem;
  font-weight: bold;
  color: #7dd3f8;
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
  border: 2px solid #7dd3f8;
  box-shadow: 0 4px 0 rgba(125, 211, 248, 0.5);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Microsoft YaHei', 微软雅黑, sans-serif;
}

.shuffle-tag {
  background: var(--header-gradient);
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 25px;
  font-weight: bold;
  font-size: 1.1rem;
  border: 2px solid #7dd3f8;
  box-shadow: 0 4px 0 rgba(125, 211, 248, 0.5);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Microsoft YaHei', 微软雅黑, sans-serif;
}

.shuffle-tag.shuffle-on {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  border-color: #ff9a9e;
  box-shadow: 0 4px 0 rgba(255, 154, 158, 0.5);
}

.shuffle-tag.shuffle-off {
  background: var(--header-gradient);
  border-color: #7dd3f8;
  box-shadow: 0 4px 0 rgba(125, 211, 248, 0.5);
}

.progress-section {
  margin-top: 2rem;
}

.progress-bar {
  width: 100%;
  height: 15px;
  background-color: #e8e8e8;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 1rem;
  border: 2px solid #e8e8e8;
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
  font-family: 'Microsoft YaHei', 微软雅黑, sans-serif;
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
  border: 3px solid #7dd3f8;
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
  font-family: 'Microsoft YaHei', 微软雅黑, sans-serif;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow:
    0 10px 0 rgba(125, 211, 248, 0.5),
    0 15px 20px rgba(125, 211, 248, 0.4);
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
