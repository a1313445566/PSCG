<template>
  <div class="result-card">
    <div class="result-header">
      <h2 class="result-title">答题结果</h2>
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
    
    <div class="encouragement">
      {{ getEncouragement() }}
    </div>
    
    <div class="action-buttons">
      <button class="action-btn primary" @click="generateNewQuestions">
        🔄 重新闯关
      </button>
      <button class="action-btn secondary" @click="backToSubjects">
        🏠 返回首页
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

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

// 鼓励信息
const getEncouragement = () => {
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

// 格式化时间
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}分${remainingSeconds}秒`
}

// 重新生成题目
const generateNewQuestions = () => {
  emit('generate-new')
}

// 返回学科选择
const backToSubjects = () => {
  emit('back-to-subjects')
}
</script>

<style scoped>
.result-card {
  background: white;
  border-radius: 24px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.8s ease;
  position: relative;
  overflow: hidden;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.5rem;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: linear-gradient(90deg, #7DD3F8 0%, #A8E6CF 50%, #FFD88B 100%);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-title {
  font-family: "Microsoft YaHei", 微软雅黑, sans-serif;
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.result-icon {
  font-size: 2.5rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

.score-main {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.5rem;
  margin: 0 auto;
}

.score-number {
  font-size: 4rem;
  font-weight: bold;
  color: #7DD3F8;
  text-shadow: 2px 2px 4px rgba(125, 211, 248, 0.3);
  animation: bounce 1s ease-in-out;
  line-height: 1;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
}

.score-divider {
  font-size: 2rem;
  color: #666;
  font-weight: bold;
}

.score-total {
  font-size: 2rem;
  color: #666;
  font-weight: bold;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 0 auto;
  max-width: 80%;
}

.stat-item {
  background: linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%);
  padding: 1rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(125, 211, 248, 0.2);
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.3rem;
  font-family: "Microsoft YaHei", 微软雅黑, sans-serif;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
  font-family: "Microsoft YaHei", 微软雅黑, sans-serif;
}

.encouragement {
  font-size: 1rem;
  font-weight: bold;
  color: #333;
  padding: 1rem;
  background: linear-gradient(135deg, #F0F8FF 0%, #E6F7FF 100%);
  border-radius: 12px;
  font-family: "Microsoft YaHei", 微软雅黑, sans-serif;
  border-left: 4px solid #7DD3F8;
  box-shadow: 0 4px 12px rgba(125, 211, 248, 0.1);
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.8rem 1.8rem;
  border: none;
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: "Microsoft YaHei", 微软雅黑, sans-serif;
  min-width: 120px;
  justify-content: center;
}

.action-btn.primary {
  background: linear-gradient(90deg, #7DD3F8 0%, #A8E6CF 50%, #FFD88B 100%);
  color: white;
  border: 2px solid #7DD3F8;
  box-shadow: 0 4px 0 rgba(125, 211, 248, 0.5);
}

.action-btn.secondary {
  background-color: #F0F4F8;
  color: #333;
  border: 2px solid #E8E8E8;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.05);
}

.action-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(125, 211, 248, 0.4);
}

.action-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 rgba(125, 211, 248, 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .result-card {
    padding: 1.5rem;
    min-height: auto;
    gap: 1.2rem;
  }
  
  .result-title {
    font-size: 1.3rem;
  }
  
  .result-icon {
    font-size: 2rem;
  }
  
  .score-number {
    font-size: 3.5rem;
  }
  
  .score-divider,
  .score-total {
    font-size: 1.5rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.8rem;
    max-width: 100%;
  }
  
  .encouragement {
    font-size: 0.9rem;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .action-btn {
    width: 100%;
    max-width: 200px;
  }
}

@media (max-width: 480px) {
  .result-card {
    padding: 1.2rem;
    min-height: auto;
    gap: 1rem;
  }
  
  .result-title {
    font-size: 1.2rem;
  }
  
  .result-icon {
    font-size: 1.8rem;
  }
  
  .score-number {
    font-size: 3rem;
  }
  
  .score-divider,
  .score-total {
    font-size: 1.2rem;
  }
  
  .encouragement {
    font-size: 0.85rem;
  }
  
  .action-btn {
    padding: 0.7rem 1.5rem;
    font-size: 0.85rem;
    width: 100%;
    max-width: none;
  }
}
</style>