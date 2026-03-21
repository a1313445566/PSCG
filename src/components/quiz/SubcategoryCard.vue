<template>
  <div class="subcategory-card" @click="selectSubcategory">
    <div class="subcategory-icon">{{ subjectIcons[subcategory.iconIndex || 0] }}</div>
    <div class="subcategory-name">{{ subcategory.name }}</div>
    <div class="subcategory-info">
      <span class="question-count">{{ getQuestionCount(subcategory.id) }} 题</span>
      <div class="difficulty-wrapper">
        <span class="difficulty" :class="getDifficultyClass(subcategory.id)">
          {{ getDifficultyLevel(subcategory.id) }}
        </span>
        <div class="difficulty-tooltip">
          <div class="tooltip-title">难度说明</div>
          <div class="tooltip-content">
            <div><strong>简单</strong>：适合初学者，题目较为基础</div>
            <div><strong>中等</strong>：适合有一定基础的学生</div>
            <div><strong>困难</strong>：适合挑战自我，题目较为复杂</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  subcategory: {
    type: Object,
    required: true
  },
  subjectId: {
    type: Number,
    required: true
  },
  questions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select'])

// 导入共享图标配置
import { subjectIcons } from '../../config/iconConfig';

// 计算该题库的题目数量
const getQuestionCount = (subcategoryId) => {
  return props.questions.filter(q => {
    const qSubjectId = q.subjectId || q.subject_id
    const qSubcategoryId = q.subcategoryId || q.subcategory_id
    return qSubjectId === props.subjectId && qSubcategoryId === subcategoryId
  }).length
}

// 获取难度等级
const getDifficultyLevel = (subcategoryId) => {
  const subcategoryQuestions = props.questions.filter(q => {
    const qSubcategoryId = q.subcategoryId || q.subcategory_id
    return qSubcategoryId === subcategoryId
  })
  
  if (subcategoryQuestions.length === 0) return '简单'
  
  // 简单的难度计算逻辑
  const avgDifficulty = subcategoryQuestions.reduce((sum, q) => {
    return sum + (q.difficulty || 1)
  }, 0) / subcategoryQuestions.length
  
  if (avgDifficulty < 2) return '简单'
  if (avgDifficulty < 3) return '中等'
  return '困难'
}

// 获取难度样式类
const getDifficultyClass = (subcategoryId) => {
  const level = getDifficultyLevel(subcategoryId)
  switch (level) {
    case '简单': return 'difficulty-easy'
    case '中等': return 'difficulty-medium'
    case '困难': return 'difficulty-hard'
    default: return 'difficulty-easy'
  }
}

// 选择题库
const selectSubcategory = () => {
  emit('select', props.subcategory.id)
}
</script>

<style scoped>
.subcategory-card {
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.subcategory-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #F5A623, #FFD166);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.subcategory-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  border-color: #F5A623;
}

.subcategory-card:hover::before {
  transform: scaleX(1);
}

.subcategory-card:active {
  transform: scale(0.98);
}

.subcategory-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #F5A623;
  transition: all 0.3s ease;
}

.subcategory-card:hover .subcategory-icon {
  transform: rotate(15deg) scale(1.1);
}

.subcategory-name {
  font-family: 'Fredoka One', 'Comic Sans MS', cursive;
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.8rem;
}

.subcategory-info {
  display: flex;
  justify-content: center;
  gap: 0.8rem;
  align-items: center;
}

.question-count {
  background-color: #F0F4F8;
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  color: #666;
}

.difficulty {
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.difficulty-easy {
  background-color: #E8F5E9;
  color: #2E7D32;
}

.difficulty-medium {
  background-color: #FFF8E1;
  color: #EF6C00;
}

.difficulty-hard {
  background-color: #FFEBEE;
  color: #C62828;
}

/* 难度提示样式 */
.difficulty-wrapper {
  position: relative;
  display: inline-block;
}

.difficulty-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: white;
  padding: 10px;
  border-radius: 8px;
  font-size: 0.75rem;
  white-space: nowrap;
  z-index: 1000;
  margin-bottom: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  width: 180px;
  white-space: normal;
  text-align: left;
}

.difficulty-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: #333 transparent transparent transparent;
}

.difficulty-wrapper:hover .difficulty-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(-5px);
}

.tooltip-title {
  font-weight: bold;
  margin-bottom: 5px;
  color: #FFD166;
}

.tooltip-content div {
  margin-bottom: 3px;
  font-size: 0.7rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .subcategory-card {
    padding: 1.2rem;
  }
  
  .subcategory-icon {
    font-size: 2.5rem;
  }
  
  .subcategory-name {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .subcategory-card {
    padding: 1rem;
  }
  
  .subcategory-icon {
    font-size: 2rem;
  }
  
  .subcategory-name {
    font-size: 0.9rem;
  }
  
  .question-count,
  .difficulty {
    font-size: 0.7rem;
    padding: 0.2rem 0.4rem;
  }
}
</style>