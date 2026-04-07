<template>
  <div class="error-collection-card" :class="{ 'no-errors': errorQuestions.length === 0 }">
    <div class="card-header">
      <h3 class="card-title">📝 {{ subjectName }}错题巩固题库</h3>
      <div class="question-count">
        <span v-if="errorQuestions.length > 0" class="count-number">
          待巩固题目：{{ errorQuestions.length }}道
        </span>
        <span v-else class="no-questions">暂无错题可巩固</span>
      </div>
    </div>
    <div class="card-body">
      <div class="card-description">
        <p>本题库由系统自动整理您本学科的所有错题生成，仅您本人可见。</p>
        <p>每道题累计正确3次后将自动移除，再次做错将重置已累计的正确次数。</p>
        <p>积分规则：每道题目累计答对3次+1分。</p>
      </div>
      <button
        class="start-button"
        :disabled="errorQuestions.length === 0"
        @click="startErrorCollectionQuiz"
      >
        开始巩固练习
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuestionStore } from '../../stores/questionStore'

const props = defineProps({
  subjectId: {
    type: Number,
    required: true
  },
  subjectName: {
    type: String,
    required: true
  }
})

const router = useRouter()
const questionStore = useQuestionStore()

// 计算错题巩固题库的题目
const errorQuestions = computed(() => {
  return questionStore.getErrorCollection(props.subjectId)
})

// 组件挂载时加载错题巩固题库
onMounted(async () => {
  if (props.subjectId) {
    await questionStore.loadErrorCollection(props.subjectId)
  }
})

// 开始错题巩固练习
const startErrorCollectionQuiz = () => {
  router.push(`/quiz/${props.subjectId}/error-collection`)
}
</script>

<style scoped lang="scss">
.error-collection-card {
  background: $mastery-low-gradient;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: $shadow-lg;
  margin-bottom: 2rem;
  border: 2px solid $danger-color;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.card-title {
  font-family: 'Fredoka One', 'Comic Sans MS', cursive;
  font-size: 1.5rem;
  font-weight: bold;
  color: $text-primary;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.question-count {
  display: flex;
  align-items: center;
}

.count-number {
  background-color: $danger-color;
  color: $text-white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
  box-shadow: none;
}

.no-questions {
  color: $text-secondary;
  font-style: italic;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card-description {
  background-color: rgba(255, 255, 255, 0.8);
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 4px solid $danger-color;
}

.card-description p {
  color: $text-secondary;
  margin: 0.5rem 0;
  line-height: 1.4;
  font-size: 0.95rem;
}

.start-button {
  background-color: $danger-color;
  color: $text-white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 15px;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  align-self: flex-start;
}

.start-button:hover:not(:disabled) {
  background-color: $danger-dark;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px set-alpha($danger-color, 30);
}

.start-button:disabled {
  background-color: $border-color-lighter;
  color: $text-tertiary;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 无错题状态的样式 */
.error-collection-card.no-errors {
  background: $mastery-high-gradient;
  border-color: $success-color;
}

.error-collection-card.no-errors .card-title {
  color: $success-dark;
}

.error-collection-card.no-errors .no-questions {
  color: $success-dark;
  font-weight: bold;
  font-size: 1rem;
}

.error-collection-card.no-errors .card-description {
  background-color: rgba(255, 255, 255, 0.9);
  border-left-color: $success-color;
}

.error-collection-card.no-errors .start-button:disabled {
  background-color: $mastery-high-gradient;
  color: $success-color;
  border: 2px solid $success-color;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-collection-card {
    padding: 1.5rem;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .card-title {
    font-size: 1.3rem;
  }

  .start-button {
    align-self: stretch;
    text-align: center;
  }
}
</style>
