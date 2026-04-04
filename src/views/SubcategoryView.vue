<template>
  <div class="subcategory-view">
    <AppHeader />

    <div class="subcategory-content">
      <div class="page-header">
        <h2 class="page-title">{{ currentSubject.name }}</h2>
        <button class="back-btn" @click="backToHome">🔙 返回学科选择</button>
      </div>

      <!-- 错题巩固题库 -->
      <ErrorCollectionCard :subject-id="currentSubject.id" :subject-name="currentSubject.name" />

      <div class="subcategory-section">
        <h3 class="section-title">🎯 选择题库</h3>
        <div class="subcategory-grid">
          <SubcategoryCard
            v-for="subcategory in currentSubject.subcategories"
            :key="subcategory.id"
            :subcategory="subcategory"
            :subject-id="currentSubject.id"
            :questions="questions"
            :subcategory-stats="subcategoryStats"
            @select="selectSubcategory"
          />
        </div>
      </div>

      <div class="difficulty-rules-section">
        <div class="rules-header" @click="toggleRules">
          <h3 class="section-title">📊 难度调整规则</h3>
          <div class="toggle-icon" :class="{ rotated: rulesExpanded }">
            {{ rulesExpanded ? '▼' : '▼' }}
          </div>
        </div>
        <div v-show="rulesExpanded" class="difficulty-rules-content">
          <div class="rule-item">
            <h4>自动难度调整</h4>
            <p>系统会根据学生的答题情况自动调整题目难度：</p>
            <ul>
              <li>错误率 > 80%：大幅提升难度（+2级）</li>
              <li>错误率 > 70%：小幅提升难度（+1级）</li>
              <li>错误率 < 20%：大幅降低难度（-2级）</li>
              <li>错误率 < 30%：小幅降低难度（-1级）</li>
            </ul>
          </div>
          <div class="rule-item">
            <h4>难度等级说明</h4>
            <ul>
              <li>
                <span class="difficulty-badge easy">简单</span>
                ：适合初学者，题目较为基础
              </li>
              <li>
                <span class="difficulty-badge medium">中等</span>
                ：适合有一定基础的学生
              </li>
              <li>
                <span class="difficulty-badge hard">困难</span>
                ：适合挑战自我，题目较为复杂
              </li>
            </ul>
          </div>
          <div class="rule-item">
            <h4>调整机制</h4>
            <p>系统会考虑以下因素进行难度调整：</p>
            <ul>
              <li>最近7天的答题记录权重更高</li>
              <li>至少需要10次尝试才会进行调整</li>
              <li>多选题的难度阈值会适当提高</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onMounted as onMountedRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppHeader from '../components/common/AppHeader.vue'
import SubcategoryCard from '../components/quiz/SubcategoryCard.vue'
import ErrorCollectionCard from '../components/quiz/ErrorCollectionCard.vue'
import { useQuestionStore } from '../stores/questionStore'

// 难度规则展开状态
const rulesExpanded = ref(true)

const router = useRouter()
const route = useRoute()
const questionStore = useQuestionStore()

// 获取学科ID
const subjectId = computed(() => parseInt(route.params.subjectId))

// 当前学科
const currentSubject = computed(() => {
  // 直接使用从数据库获取的排序（已在后端按sort_order排序）
  return (
    questionStore.subjects.find(s => s.id === subjectId.value) || {
      name: '未知学科',
      subcategories: []
    }
  )
})

// 题目数据（用于兼容，但不再预加载所有题目）
const questions = computed(() => questionStore.questions)

// 子分类统计数据
const subcategoryStats = computed(() => questionStore.subcategoryStats)

// 选择题库
const selectSubcategory = subcategoryId => {
  router.push(`/quiz/${subjectId.value}/${subcategoryId}`)
}

// 返回首页
const backToHome = () => {
  router.push('/')
}

// 切换难度规则展开/折叠
const toggleRules = () => {
  rulesExpanded.value = !rulesExpanded.value
}

onMounted(async () => {
  // 初始化数据
  await questionStore.initialize()

  // 加载当前学科的子分类统计数据（不再加载所有题目）
  if (subjectId.value) {
    await questionStore.loadSubcategoryStats(subjectId.value)
  }

  // 检查是否已登录
  if (!localStorage.getItem('studentId')) {
    router.push('/login')
  }

  // 确保 subjects 加载完成后，加载错题巩固题库
  if (currentSubject.value.id) {
    await questionStore.loadErrorCollection(currentSubject.value.id)
  }

  // 在小屏幕上默认折叠难度规则
  if (window.innerWidth <= 768) {
    rulesExpanded.value = false
  }

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
      rulesExpanded.value = false
    } else {
      rulesExpanded.value = true
    }
  })
})
</script>

<style scoped lang="scss">
.subcategory-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%);
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23F7FFF7"/><circle cx="20" cy="20" r="2" fill="%23FF6B6B" opacity="0.3"/><circle cx="80" cy="40" r="2" fill="%234ECDC4" opacity="0.3"/><circle cx="40" cy="80" r="2" fill="%23FFD166" opacity="0.3"/><circle cx="60" cy="60" r="2" fill="%2306D6A0" opacity="0.3"/></svg>');
  background-repeat: repeat;
  padding-bottom: 2rem;
}

.subcategory-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-family: 'Fredoka One', 'Comic Sans MS', cursive;
  font-size: 1.8rem;
  font-weight: bold;
  color: #4a90e2;
  margin: 0;
}

.back-btn {
  background-color: #f0f4f8;
  color: #333;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.back-btn:hover {
  background-color: #e3eaf6;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.difficulty-rules-section {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.rules-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  margin-bottom: 1.5rem;
}

.toggle-icon {
  font-size: 1rem;
  color: #4a90e2;
  transition: transform 0.3s ease;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.difficulty-rules-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.rule-item {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 4px solid #4a90e2;
}

.rule-item h4 {
  font-family: 'Fredoka One', 'Comic Sans MS', cursive;
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rule-item p {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.rule-item ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rule-item li {
  color: #555;
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
  position: relative;
  line-height: 1.4;
}

.rule-item li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #4a90e2;
  font-weight: bold;
}

.difficulty-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  margin-right: 0.5rem;
}

.difficulty-badge.easy {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.difficulty-badge.medium {
  background-color: #fff8e1;
  color: #ef6c00;
}

.difficulty-badge.hard {
  background-color: #ffebee;
  color: #c62828;
}

.subcategory-section {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.section-title {
  font-family: 'Fredoka One', 'Comic Sans MS', cursive;
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 1.5rem;
  text-align: center;
}

.subcategory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.2rem;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .subcategory-content {
    padding: 1.5rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.2rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .section-title {
    font-size: 1.3rem;
  }

  .subcategory-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .subcategory-section {
    padding: 1.5rem;
  }

  .difficulty-rules-section {
    padding: 1.5rem;
  }

  .difficulty-rules-content {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .subcategory-content {
    padding: 1rem;
  }

  .page-header {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.3rem;
  }

  .section-title {
    font-size: 1.2rem;
  }

  .subcategory-grid {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }

  .subcategory-section {
    padding: 1.2rem;
  }

  .difficulty-rules-section {
    padding: 1.2rem;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 0.8rem;
  }

  .page-title {
    font-size: 1.2rem;
  }

  .section-title {
    font-size: 1.1rem;
  }

  .subcategory-grid {
    grid-template-columns: 1fr;
    gap: 0.6rem;
  }

  .subcategory-section {
    padding: 1rem;
  }

  .difficulty-rules-section {
    padding: 1rem;
  }

  .difficulty-rules-content {
    gap: 0.8rem;
  }

  .rule-item {
    padding: 1rem;
  }

  .rule-item h4 {
    font-size: 1rem;
  }

  .rule-item li {
    font-size: 0.9rem;
  }
}
</style>
