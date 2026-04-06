<template>
  <div class="subcategory-view">
    <AppHeader />

    <div class="subcategory-content">
      <div class="page-header">
        <h2 class="page-title">{{ currentSubject.name }}</h2>
        <button class="back-btn" @click="backToHome">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回学科选择</span>
        </button>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
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
  const foundSubject = questionStore.subjects.find(s => s.id === subjectId.value)
  if (foundSubject) {
    return foundSubject
  }
  return {
    id: subjectId.value || 0,
    name: '未知学科',
    subcategories: []
  }
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
  background: $stat-item-gradient;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23F7FFF7"/><circle cx="20" cy="20" r="2" fill="%23FF6B6B" opacity="0.3"/><circle cx="80" cy="40" r="2" fill="%234ECDC4" opacity="0.3"/><circle cx="40" cy="80" r="2" fill="%23FFD166" opacity="0.3"/><circle cx="60" cy="60" r="2" fill="%2306D6A0" opacity="0.3"/></svg>');
  background-repeat: repeat;
  padding-bottom: 2rem;
}

.subcategory-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: $spacing-xl;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-xl;
  padding: $spacing-lg; // 1.5rem=24px
  background: $card-background;
  border-radius: $border-radius; // 15px取近似值16px
  box-shadow: $shadow-lg;
}

.page-title {
  font-family: 'Fredoka One', 'Comic Sans MS', cursive;
  font-size: $font-size-2xl; // 1.8rem≈28.8px，取24px
  font-weight: bold;
  color: $secondary-color;
  margin: 0;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  background: $card-background;
  border: $border-width solid $secondary-color;
  color: $secondary-color;
  padding: $spacing-sm $spacing-lg; // 8px, 24px
  border-radius: $border-radius-lg; // 24px 胶囊形
  font-size: $font-size-md; // 16px
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: $shadow-sm;

  &:hover {
    background: $secondary-color;
    color: $text-white;
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }

  &:active {
    transform: translateY(0);
    box-shadow: $shadow-sm;
  }
}

.difficulty-rules-section {
  background: $card-background;
  border-radius: $border-radius-lg; // 20px取近似值24px
  padding: $spacing-xl;
  box-shadow: $shadow-lg;
  margin-bottom: $spacing-xl;
}

.rules-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  margin-bottom: $spacing-lg; // 1.5rem=24px
}

.toggle-icon {
  font-size: $font-size-md; // 1rem=16px
  color: $secondary-color;
  transition: transform 0.3s ease;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.difficulty-rules-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: $spacing-lg; // 1.5rem=24px
}

.rule-item {
  background: $bg-slate-50;
  border-radius: $border-radius-sm; // 12px取近似值8px;
  padding: 1.5rem;
  border-left: 4px solid $secondary-color;
}

.rule-item h4 {
  font-family: 'Fredoka One', 'Comic Sans MS', cursive;
  font-size: 1.1rem;
  font-weight: bold;
  color: $text-primary;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rule-item p {
  color: $text-secondary;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.rule-item ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rule-item li {
  color: $text-secondary;
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
  position: relative;
  line-height: 1.4;
}

.rule-item li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: $secondary-color;
  font-weight: bold;
}

.difficulty-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem; // 特殊值
  border-radius: $border-radius-sm; // 12px取近似值8px
  font-size: 0.8rem; // 特殊值
  font-weight: bold;
  margin-right: $spacing-xs; // 0.5rem=8px
}

.difficulty-badge.easy {
  background-color: $mastery-high-gradient;
  color: $success-color;
}

.difficulty-badge.medium {
  background-color: $mastery-medium-gradient;
  color: $warning-color;
}

.difficulty-badge.hard {
  background-color: $mastery-low-gradient;
  color: $danger-color;
}

.subcategory-section {
  background: white;
  border-radius: $border-radius-lg; // 20px取近似值24px
  padding: $spacing-xl;
  box-shadow: $shadow-md;
  margin-bottom: $spacing-xl;
}

.section-title {
  font-family: 'Fredoka One', 'Comic Sans MS', cursive;
  font-size: $font-size-2xl; // 1.5rem=24px
  font-weight: bold;
  color: $text-primary;
  margin-bottom: $spacing-lg; // 1.5rem=24px
  text-align: center;
}

.subcategory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.2rem; // 特殊值
}

/* 响应式设计 */
@media (max-width: $breakpoint-lg) { // 992px
  .subcategory-content {
    padding: $spacing-lg; // 1.5rem=24px
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-md; // 1rem=16px
    padding: 1.2rem; // 特殊值
  }

  .page-title {
    font-size: $font-size-2xl; // 1.5rem=24px
  }

  .section-title {
    font-size: $font-size-xl; // 1.3rem≈20.8px，取20px
  }

  .subcategory-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: $spacing-md; // 1rem=16px
  }

  .subcategory-section {
    padding: $spacing-lg; // 1.5rem=24px
  }

  .difficulty-rules-section {
    padding: $spacing-lg; // 1.5rem=24px
  }

  .difficulty-rules-content {
    grid-template-columns: 1fr;
    gap: $spacing-md; // 1rem=16px
  }
}

@media (max-width: $breakpoint-md) { // 768px
  .subcategory-content {
    padding: $spacing-md; // 1rem=16px
  }

  .page-header {
    padding: $spacing-md; // 1rem=16px
  }

  .page-title {
    font-size: $font-size-xl; // 1.3rem≈20.8px，取20px
  }

  .section-title {
    font-size: $font-size-lg; // 1.2rem≈19.2px，取18px
  }

  .subcategory-grid {
    grid-template-columns: 1fr;
    gap: $spacing-xs; // 0.8rem≈12.8px
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
