<template>
  <div class="subject-card" @click="selectSubject" :class="`subject-${subject.iconIndex + 1}`">
    <div class="subject-icon">
      {{ subjectIcons[subject.iconIndex || 0] }}
    </div>
    <div class="subject-name">{{ subject.name }}</div>
    <div class="subject-info">
      <span class="question-count">{{ getQuestionCount(subject.id) }} 题</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  subject: {
    type: Object,
    required: true
  },
  questions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select'])

// 学科图标
const subjectIcons = ['📚', '🔢', '🔬', '🎨', '🎵', '⚽', '🌍', '🖥️', '📝', '🌟']

// 计算该学科的题目数量
const getQuestionCount = (subjectId) => {
  return props.questions.filter(q => {
    const qSubjectId = q.subjectId || q.subject_id
    return qSubjectId === subjectId
  }).length
}

// 选择学科
const selectSubject = () => {
  emit('select', props.subject.id)
}
</script>

<style scoped>
.subject-card {
  background: white;
  border-radius: 24px;
  padding: 2.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 3px solid var(--border-color);
  position: relative;
  overflow: hidden;
}

.subject-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: linear-gradient(90deg, #7DD3F8 0%, #A8E6CF 50%, #FFD88B 100%);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.subject-card:hover {
  transform: translateY(-15px) scale(1.05) rotate(2deg);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
  border-color: var(--primary-color);
  animation: cardHover 0.5s ease-in-out;
}

.subject-card:hover::before {
  transform: scaleX(1);
}

.subject-card:active {
  transform: scale(0.95);
}

.subject-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
  animation: pulse 2s infinite;
}

.subject-card:hover .subject-icon {
  transform: rotate(20deg) scale(1.2);
  animation: bounce 1s ease-in-out;
}

.subject-name {
  font-family: var(--game-font);
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--text-primary);
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.subject-info {
  font-size: 1rem;
  color: var(--text-secondary);
}

.question-count {
  background-color: var(--accent-color);
  color: var(--text-primary);
  padding: 0.5rem 1.2rem;
  border-radius: 25px;
  font-weight: 900;
  font-size: 1.1rem;
  border: 2px solid var(--accent-color);
  box-shadow: 0 4px 0 #E6BF50;
}

/* 学科颜色 */
.subject-1 .subject-icon {
  color: var(--primary-color);
  text-shadow: 3px 3px 6px rgba(255, 107, 107, 0.3);
}

.subject-2 .subject-icon {
  color: var(--secondary-color);
  text-shadow: 3px 3px 6px rgba(78, 205, 196, 0.3);
}

.subject-3 .subject-icon {
  color: var(--accent-color);
  text-shadow: 3px 3px 6px rgba(255, 209, 102, 0.3);
}

.subject-4 .subject-icon {
  color: var(--success-color);
  text-shadow: 3px 3px 6px rgba(6, 214, 160, 0.3);
}

.subject-5 .subject-icon {
  color: #9C27B0;
  text-shadow: 3px 3px 6px rgba(156, 39, 176, 0.3);
}

.subject-6 .subject-icon {
  color: #4CAF50;
  text-shadow: 3px 3px 6px rgba(76, 175, 80, 0.3);
}

.subject-7 .subject-icon {
  color: #2196F3;
  text-shadow: 3px 3px 6px rgba(33, 150, 243, 0.3);
}

.subject-8 .subject-icon {
  color: #F44336;
  text-shadow: 3px 3px 6px rgba(244, 67, 54, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .subject-card {
    padding: 2rem;
  }
  
  .subject-icon {
    font-size: 4rem;
  }
  
  .subject-name {
    font-size: 1.3rem;
  }
}

@media (max-width: 480px) {
  .subject-card {
    padding: 1.5rem;
  }
  
  .subject-icon {
    font-size: 3rem;
  }
  
  .subject-name {
    font-size: 1.1rem;
  }
  
  .question-count {
    font-size: 0.9rem;
    padding: 0.4rem 1rem;
  }
}
</style>