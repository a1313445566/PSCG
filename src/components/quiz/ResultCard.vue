<template>
  <div class="result-card">
    <div class="result-header">
      <h2 class="result-title">答题结果</h2>
      <div class="result-icon">{{ resultIcon }}</div>
    </div>
    
    <div class="score-section">
      <div class="score-circle">
        <div class="score-number">{{ score }}</div>
        <div class="score-total">/{{ totalQuestions }}</div>
      </div>
      <div class="score-info">
        <div class="accuracy">正确率: {{ Math.round((score / totalQuestions) * 100) }}%</div>
        <div class="time-spent">用时: {{ formatTime(timeSpent) }}</div>
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
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.8s ease;
  position: relative;
  overflow: hidden;
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
  height: 4px;
  background: linear-gradient(90deg, #4A90E2, #50E3C2);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.result-title {
  font-family: 'Fredoka One', 'Comic Sans MS', cursive;
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.result-icon {
  font-size: 3rem;
  animation: pulse 2s infinite;
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

.score-section {
  margin-bottom: 2rem;
}

.score-circle {
  display: inline-flex;
  align-items: baseline;
  margin-bottom: 1rem;
}

.score-number {
  font-size: 5rem;
  font-weight: bold;
  color: #4A90E2;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  animation: bounce 1s ease-in-out;
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

.score-total {
  font-size: 2rem;
  color: #666;
  margin-left: 0.5rem;
}

.score-info {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 1rem;
}

.accuracy,
.time-spent {
  background-color: #F0F4F8;
  padding: 0.5rem 1rem;
  border-radius: 15px;
  font-weight: bold;
  color: #666;
}

.encouragement {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #F8F9FA;
  border-radius: 10px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn.primary {
  background: linear-gradient(135deg, #4A90E2 0%, #50E3C2 100%);
  color: white;
}

.action-btn.secondary {
  background-color: #F0F4F8;
  color: #333;
  border: 2px solid #E8E8E8;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
}

.action-btn:active {
  transform: scale(0.98);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .result-card {
    padding: 1.5rem;
  }
  
  .result-title {
    font-size: 1.5rem;
  }
  
  .result-icon {
    font-size: 2.5rem;
  }
  
  .score-number {
    font-size: 4rem;
  }
  
  .score-total {
    font-size: 1.5rem;
  }
  
  .score-info {
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
  }
  
  .encouragement {
    font-size: 1.1rem;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .action-btn {
    width: 100%;
    max-width: 200px;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .result-card {
    padding: 1.2rem;
  }
  
  .result-title {
    font-size: 1.3rem;
  }
  
  .result-icon {
    font-size: 2rem;
  }
  
  .score-number {
    font-size: 3rem;
  }
  
  .score-total {
    font-size: 1.2rem;
  }
  
  .encouragement {
    font-size: 1rem;
  }
  
  .action-btn {
    padding: 0.8rem 1.5rem;
    font-size: 0.9rem;
  }
}
</style>