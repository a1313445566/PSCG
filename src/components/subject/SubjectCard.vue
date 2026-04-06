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
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
  border-radius: $border-radius;
  padding: $spacing-xl;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 4px 16px rgba(78, 205, 196, 0.08);
  border: none;
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
  transform: translateY(-8px) scale(1.03);
  box-shadow:
    0 8px 20px rgba(78, 205, 196, 0.2),
    0 12px 32px rgba(0, 0, 0, 0.1);
}

.subject-card:hover::before {
  transform: scaleX(1);
}

.subject-card:active {
  transform: scale(0.95);
}

.subject-icon {
  font-size: 4rem;
  margin-bottom: $spacing-lg;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.subject-card:hover .subject-icon {
  transform: scale(1.15) rotate(-5deg);
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
  background: linear-gradient(135deg, $accent-color 0%, #ffb84d 100%);
  color: $text-primary;
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius-full;
  font-weight: 900;
  font-size: $font-size-base;
  border: none;
  box-shadow:
    0 2px 6px rgba(255, 209, 102, 0.3),
    0 3px 10px rgba(0, 0, 0, 0.08);
  display: inline-block;
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
