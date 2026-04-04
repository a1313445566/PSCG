<template>
  <!-- 答题行为跟踪组件（无 UI，纯逻辑组件） -->
  <div class="answer-behavior-tracker" style="display: none"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { api } from '@/utils/api'
import { useLoading } from '@/composables/useLoading'

// 使用 useLoading
const { withLoading, cleanup: cleanupLoading } = useLoading()

// 答题开始时间
const startTime = ref(0)
// 答案修改次数
const modificationCount = ref(0)
// 首次答案
const firstAnswer = ref(null)
// 题目ID
const currentQuestionId = ref(null)
// 犹豫时间跟踪
const hesitationTime = ref(0)
const hoverStartTime = ref(0)
// 是否跳过
const isSkipped = ref(false)
// 会话ID
const sessionId = ref(null)
// 行为缓冲区（批量提交）
const behaviorBuffer = ref([])
// 提交定时器
const submitTimer = ref(null)

// 性能优化参数
const BATCH_SIZE = 10 // 批量提交大小
const SUBMIT_INTERVAL = 30000 // 批量提交间隔（30秒）

onMounted(() => {
  // 生成会话ID
  sessionId.value = generateSessionId()

  // 启动批量提交定时器
  submitTimer.value = setInterval(() => {
    flushBuffer()
  }, SUBMIT_INTERVAL)
})

onUnmounted(() => {
  // 清理定时器
  if (submitTimer.value) {
    clearInterval(submitTimer.value)
  }

  // 清理 useLoading
  cleanupLoading()

  // 提交剩余数据
  flushBuffer()
})

// 开始答题
const startTracking = questionId => {
  currentQuestionId.value = questionId
  startTime.value = Date.now()
  modificationCount.value = 0
  firstAnswer.value = null
  hesitationTime.value = 0
  isSkipped.value = false
}

// 记录答案修改
const trackModification = () => {
  modificationCount.value++
}

// 记录首次答案
const trackFirstAnswer = answer => {
  if (!firstAnswer.value) {
    firstAnswer.value = answer
  }
}

// 记录鼠标悬停（犹豫）
const trackHoverStart = () => {
  if (!hoverStartTime.value) {
    hoverStartTime.value = Date.now()
  }
}

const trackHoverEnd = () => {
  if (hoverStartTime.value > 0) {
    const duration = (Date.now() - hoverStartTime.value) / 1000

    // 只有超过1秒的犹豫才记录
    if (duration > 1) {
      hesitationTime.value += duration
    }

    hoverStartTime.value = 0
  }
}

// 记录跳题
const trackSkip = () => {
  isSkipped.value = true
}

// 记录返回
const trackReturn = () => {
  isSkipped.value = false
}

// 提交答题行为（批量优化）
const submitBehavior = async (userId, questionId, finalAnswer, isCorrect) => {
  const answerTime = Math.round((Date.now() - startTime.value) / 1000)
  const isFirstAnswerCorrect = firstAnswer.value === finalAnswer && isCorrect

  // 添加到缓冲区
  behaviorBuffer.value.push({
    userId,
    questionId,
    answerTime,
    answerModifications: modificationCount.value,
    isFirstAnswerCorrect,
    finalAnswer,
    isCorrect,
    hesitationTime: Math.round(hesitationTime.value),
    skippedAndReturned: isSkipped.value ? 1 : 0,
    sessionId: sessionId.value
  })

  // 如果缓冲区满了，立即提交
  if (behaviorBuffer.value.length >= BATCH_SIZE) {
    await flushBuffer()
  }
}

// 批量提交缓冲区数据
const flushBuffer = async () => {
  if (behaviorBuffer.value.length === 0) {
    return
  }

  const dataToSubmit = [...behaviorBuffer.value]
  behaviorBuffer.value = []

  try {
    // 使用 withLoading 和 api 封装
    await withLoading(async () => {
      await api.post('/answer-behavior/batch', {
        behaviors: dataToSubmit
      })
    })
  } catch (error) {
    // api 会自动显示错误
    // 如果失败，重新添加回缓冲区
    behaviorBuffer.value = [...dataToSubmit, ...behaviorBuffer.value]
  }
}

// 生成会话ID
const generateSessionId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 导出方法
defineExpose({
  startTracking,
  trackModification,
  trackFirstAnswer,
  trackHoverStart,
  trackHoverEnd,
  trackSkip,
  trackReturn,
  submitBehavior,
  flushBuffer
})
</script>
