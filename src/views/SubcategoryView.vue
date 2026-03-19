<template>
  <div class="subcategory-view">
    <AppHeader />
    
    <div class="subcategory-content">
      <div class="page-header">
        <h2 class="page-title">{{ currentSubject.name }}</h2>
        <button class="back-btn" @click="backToHome">🔙 返回学科选择</button>
      </div>
      
      <div class="difficulty-rules-section">
        <h3 class="section-title">📊 难度调整规则</h3>
        <div class="difficulty-rules-content">
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
              <li><span class="difficulty-badge easy">简单</span>：适合初学者，题目较为基础</li>
              <li><span class="difficulty-badge medium">中等</span>：适合有一定基础的学生</li>
              <li><span class="difficulty-badge hard">困难</span>：适合挑战自我，题目较为复杂</li>
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

      <div class="subcategory-section">
        <h3 class="section-title">🎯 选择题库</h3>
        <div class="subcategory-grid">
          <SubcategoryCard 
            v-for="subcategory in currentSubject.subcategories" 
            :key="subcategory.id"
            :subcategory="subcategory"
            :subjectId="currentSubject.id"
            :questions="questions"
            @select="selectSubcategory"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppHeader from '../components/common/AppHeader.vue'
import SubcategoryCard from '../components/quiz/SubcategoryCard.vue'
import { useQuestionStore } from '../stores/questionStore'

const router = useRouter()
const route = useRoute()
const questionStore = useQuestionStore()

// 获取学科ID
const subjectId = computed(() => parseInt(route.params.subjectId))

// 当前学科
const currentSubject = computed(() => {
  return questionStore.subjects.find(s => s.id === subjectId.value) || { name: '未知学科', subcategories: [] }
})

// 题目数据
const questions = computed(() => questionStore.questions)

// 选择题库
const selectSubcategory = (subcategoryId) => {
  router.push(`/quiz/${subjectId.value}/${subcategoryId}`)
}

// 返回首页
const backToHome = () => {
  router.push('/')
}

onMounted(async () => {
  // 初始化数据
  await questionStore.initialize()
  
  // 检查是否已登录
  if (!localStorage.getItem('studentId')) {
    router.push('/login')
  }
})
</script>

<style scoped>
.subcategory-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #F8F9FA 0%, #E3F2FD 100%);
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
  color: #4A90E2;
  margin: 0;
}

.back-btn {
  background-color: #F0F4F8;
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
  background-color: #E3EAF6;
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

.difficulty-rules-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.rule-item {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 4px solid #4A90E2;
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
  color: #4A90E2;
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
  background-color: #E8F5E9;
  color: #2E7D32;
}

.difficulty-badge.medium {
  background-color: #FFF8E1;
  color: #EF6C00;
}

.difficulty-badge.hard {
  background-color: #FFEBEE;
  color: #C62828;
}

.subcategory-section {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
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
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .subcategory-content {
    padding: 1rem;
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
}

@media (max-width: 480px) {
  .page-header {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 1.3rem;
  }
  
  .subcategory-grid {
    grid-template-columns: 1fr;
  }
  
  .subcategory-section {
    padding: 1.2rem;
  }
}
</style>