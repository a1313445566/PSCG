<template>
  <div class="result-card">
    <div class="result-header">
      <h2 class="result-title">{{ isErrorCollection ? '错题巩固结果' : '答题结果' }}</h2>
      <div class="result-icon">{{ resultIcon }}</div>
    </div>

    <div class="score-main">
      <div class="score-number">{{ score }}</div>
      <div class="score-divider">/</div>
      <div class="score-total">{{ totalQuestions }}</div>
    </div>

    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-label">正确率</div>
        <div class="stat-value">{{ Math.round((score / totalQuestions) * 100) }}%</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">用时</div>
        <div class="stat-value">{{ formatTime(timeSpent) }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">积分</div>
        <div class="stat-value">{{ points }} 分</div>
      </div>
    </div>

    <div v-if="isErrorCollection" class="error-collection-summary">
      <div class="summary-item">
        <span class="summary-label">巩固完成数：</span>
        <span class="summary-value">{{ completedCount }} 题</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">整体进度：</span>
        <span class="summary-value">{{ overallProgress }}%</span>
      </div>
    </div>

    <div class="encouragement">
      {{ getEncouragement() }}
    </div>

    <div class="action-buttons">
      <button class="action-btn primary" @click="generateNewQuestions">
        {{ isErrorCollection ? '🔄 继续巩固' : '🔄 重新闯关' }}
      </button>
      <button class="action-btn secondary" @click="backToSubjects">🏠 返回首页</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { MAX_CORRECT_COUNT, getProgressColor } from '../../utils/errorCollectionUtils'

const props = defineProps({
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0
  },
  isErrorCollection: {
    type: Boolean,
    default: false
  },
  errorCollectionProgress: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['generate-new', 'back-to-subjects'])

// 结果图标
const resultIcon = computed(() => {
  if (props.score === 0) return '😞'
  const rate = props.score / props.totalQuestions
  if (rate === 1) return '🎉'
  if (rate >= 0.7) return '😊'
  if (rate >= 0.5) return '🙂'
  return '😐'
})

// 巩固完成数
const completedCount = computed(() => {
  if (
    !props.isErrorCollection ||
    !props.errorCollectionProgress ||
    !props.errorCollectionProgress.length
  ) {
    return 0
  }
  return props.errorCollectionProgress.filter(item => item.correctCount >= MAX_CORRECT_COUNT).length
})

// 整体进度
const overallProgress = computed(() => {
  if (
    !props.isErrorCollection ||
    !props.errorCollectionProgress ||
    !props.errorCollectionProgress.length
  ) {
    return 0
  }
  const totalProgress = props.errorCollectionProgress.reduce(
    (sum, item) => sum + item.correctCount,
    0
  )
  const maxProgress = props.errorCollectionProgress.length * MAX_CORRECT_COUNT
  return maxProgress > 0 ? Math.round((totalProgress / maxProgress) * 100) : 0
})

// 鼓励信息
const getEncouragement = () => {
  if (props.isErrorCollection) {
    const rate = props.score / props.totalQuestions
    if (rate === 1) {
      return '太棒了！全部答对，巩固效果显著！'
    } else if (rate >= 0.7) {
      return '做得很好！继续巩固，你会越来越棒！'
    } else if (rate >= 0.5) {
      return '不错，再接再厉，错题会越来越少！'
    } else {
      return '加油，坚持巩固，你一定能攻克这些错题！'
    }
  } else {
    const rate = props.score / props.totalQuestions
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
}

// 格式化时间
const formatTime = seconds => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}分${remainingSeconds}秒`
}

// 重新生成题目
const generateNewQuestions = () => {
  emit('generate-new')
}

// 返回学科首页
const backToSubjects = () => {
  emit('back-to-subjects')
}
</script>

<style scoped lang="scss">
.result-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.result-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.result-icon {
  font-size: 48px;
}

.score-main {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin: 30px 0;
}

.score-number {
  font-size: 64px;
  font-weight: 700;
  color: #409eff;
  margin-right: 10px;
}

.score-divider {
  font-size: 32px;
  color: #909399;
  margin-right: 10px;
}

.score-total {
  font-size: 32px;
  color: #909399;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin: 30px 0;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

/* 错题巩固摘要样式 */
.error-collection-summary {
  background: #f0f9eb;
  border: 1px solid #e1f5cb;
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
}

.summary-item {
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.summary-label {
  color: #67c23a;
  font-weight: 500;
}

.summary-value {
  color: #303133;
  font-weight: 600;
}

.encouragement {
  text-align: center;
  font-size: 16px;
  color: #606266;
  margin: 20px 0;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
}

.action-btn {
  padding: 12px 30px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn.primary {
  background: #409eff;
  color: white;
}

.action-btn.primary:hover {
  background: #66b1ff;
}

.action-btn.secondary {
  background: #909399;
  color: white;
}

.action-btn.secondary:hover {
  background: #a6a9ad;
}

@media (max-width: 768px) {
  .result-card {
    padding: 20px;
  }

  .score-number {
    font-size: 48px;
  }

  .score-divider {
    font-size: 24px;
  }

  .score-total {
    font-size: 24px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }
}
</style>
