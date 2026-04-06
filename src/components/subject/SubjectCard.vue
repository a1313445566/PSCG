<template>
  <div class="subject-card" :class="`subject-${subject.iconIndex + 1}`" @click="selectSubject">
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
// import { computed } from 'vue' // eslint-disable-line no-unused-vars -- 暂未使用

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

// 导入共享图标配置
import { subjectIcons } from '../../config/iconConfig'

// 计算该学科的题目数量
const getQuestionCount = subjectId => {
  // 优先使用后端返回的 questionCount 字段（首页场景）
  if (props.subject.questionCount !== undefined) {
    return props.subject.questionCount
  }
  // 如果没有 questionCount，从 questions 数组计算（管理页面场景）
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

<style scoped lang="scss">
.subject-card {
  background: white;
  border-radius: $border-radius-lg;
  padding: $spacing-section;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: $shadow-lg;
  border: $border-width-lg solid var(--border-color);
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
  background: $header-gradient;
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.subject-card:hover {
  transform: translateY(-15px) scale(1.05) rotate(2deg);
  box-shadow: $shadow-xl;
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
  font-size: 5rem; // 超大图标特殊值
  margin-bottom: $spacing-lg;
  transition: all 0.3s ease;
  animation: pulse 2s infinite;
}

.subject-card:hover .subject-icon {
  transform: rotate(20deg) scale(1.2);
  animation: bounce 1s ease-in-out;
}

.subject-name {
  font-family: var(--game-font);
  font-size: $font-size-2xl;
  font-weight: 900;
  color: var(--text-primary);
  margin-bottom: $spacing-md;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: $text-shadow-base;
}

.subject-info {
  font-size: $font-size-md;
  color: var(--text-secondary);
}

.question-count {
  background-color: var(--accent-color);
  color: var(--text-primary);
  padding: $spacing-sm $spacing-compact;
  border-radius: $border-radius-lg;
  font-weight: 900;
  font-size: $font-size-md; // 约17.6px，取近似值16px
  border: $border-width-md solid var(--accent-color);
  box-shadow: $shadow-btn-accent;
}

/* 学科颜色 */
.subject-1 .subject-icon {
  color: var(--primary-color);
  text-shadow: $text-shadow-primary;
}

.subject-2 .subject-icon {
  color: var(--secondary-color);
  text-shadow: 3px 3px 6px set-alpha($secondary-color, 30);
}

.subject-3 .subject-icon {
  color: var(--accent-color);
  text-shadow: 3px 3px 6px set-alpha($accent-color, 30);
}

.subject-4 .subject-icon {
  color: var(--success-color);
  text-shadow: 3px 3px 6px set-alpha($success-color, 30);
}

.subject-5 .subject-icon {
  color: #9c27b0;
  text-shadow: 3px 3px 6px set-alpha(#9c27b0, 30);
}

.subject-6 .subject-icon {
  color: #4caf50;
  text-shadow: 3px 3px 6px set-alpha(#4caf50, 30);
}

.subject-7 .subject-icon {
  color: #2196f3;
  text-shadow: 3px 3px 6px set-alpha(#2196f3, 30);
}

.subject-8 .subject-icon {
  color: #f44336;
  text-shadow: 3px 3px 6px set-alpha(#f44336, 30);
}

/* 响应式设计 */
@media (max-width: $breakpoint-md) {
  .subject-card {
    padding: $spacing-xl;
  }

  .subject-icon {
    font-size: 4rem; // 移动端特殊值
  }

  .subject-name {
    font-size: $font-size-xl; // 约20.8px，取近似值20px
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
