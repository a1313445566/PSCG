<template>
  <div class="home-view">
    <AppHeader />
    
    <div class="home-content">
      <div class="welcome-section">
        <h2 class="welcome-title">欢迎回来，{{ currentUserGrade }}年级{{ currentUserClass }}班的 {{ currentUserName || (currentStudentId + '学号') }}同学！</h2>
        <p class="welcome-message">选择一个学科开始学习之旅吧！</p>
      </div>
      
      <div class="subject-section">
        <h3 class="section-title">📚 选择学科</h3>
        <div class="subject-grid">
          <SubjectCard 
            v-for="subject in subjects" 
            :key="subject.id"
            :subject="subject"
            :questions="questions"
            @select="selectSubject"
          />
        </div>
      </div>
      
      <div class="leaderboard-preview">
        <div class="leaderboard-header">
          <h3 class="section-title">🏆 排行榜 Top 10</h3>
          <router-link to="/leaderboard" class="view-full-link">查看完整排行榜</router-link>
        </div>
        <LeaderboardTable :leaderboardData="leaderboardData" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/common/AppHeader.vue'
import SubjectCard from '../components/subject/SubjectCard.vue'
import LeaderboardTable from '../components/leaderboard/LeaderboardTable.vue'
import { useQuestionStore } from '../stores/questionStore'
import { getApiBaseUrl } from '../utils/database'

const router = useRouter()
const questionStore = useQuestionStore()

// 学科和题目数据
const subjects = computed(() => questionStore.subjects)
const questions = computed(() => questionStore.questions)

// 用户信息
const currentStudentId = computed(() => localStorage.getItem('studentId'))
const currentUserName = computed(() => localStorage.getItem('userName'))
const currentUserGrade = computed(() => localStorage.getItem('userGrade'))
const currentUserClass = computed(() => localStorage.getItem('userClass'))

// 排行榜数据
const leaderboardData = ref([])

// 调试：监控 subjects 数据变化
watch(() => questionStore.subjects, (newSubjects) => {

}, { deep: true, immediate: true })

// 监控 questions 数据变化，确保新添加的题目能显示
watch(() => questionStore.questions, (newQuestions) => {

}, { deep: true })

// 获取排行榜数据
const fetchLeaderboardData = async () => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/leaderboard/global?limit=10`)
    if (response.ok) {
      const data = await response.json()
      leaderboardData.value = data
    }
  } catch (error) {

  }
}

// 选择学科
const selectSubject = (subjectId) => {
  router.push(`/subcategory/${subjectId}`)
}

onMounted(async () => {
  // 初始化数据
  await questionStore.initialize()
  // 获取排行榜数据
  await fetchLeaderboardData()
  
  // 检查是否已登录
  if (!currentStudentId.value) {
    router.push('/login')
  }
})
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #F8F9FA 0%, #E3F2FD 100%);
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23F7FFF7"/><circle cx="20" cy="20" r="2" fill="%23FF6B6B" opacity="0.3"/><circle cx="80" cy="40" r="2" fill="%234ECDC4" opacity="0.3"/><circle cx="40" cy="80" r="2" fill="%23FFD166" opacity="0.3"/><circle cx="60" cy="60" r="2" fill="%2306D6A0" opacity="0.3"/></svg>');
  background-repeat: repeat;
  padding-bottom: 2rem;
}

.home-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.welcome-section {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2.5rem;
  background: white;
  border-radius: 24px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 3px solid var(--border-color);
  position: relative;
  overflow: hidden;
  animation: fadeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.welcome-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: linear-gradient(90deg, #7DD3F8 0%, #A8E6CF 50%, #FFD88B 100%);
}

.welcome-title {
  font-family: var(--game-font);
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--primary-color);
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 2px 2px 4px rgba(255, 107, 107, 0.3);
}



.welcome-message {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 600;
  letter-spacing: 1px;
}

.subject-section {
  margin-bottom: 3rem;
  background: white;
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 3px solid var(--border-color);
  position: relative;
  overflow: hidden;
  animation: fadeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
}

.subject-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: linear-gradient(90deg, #7DD3F8 0%, #A8E6CF 50%, #FFD88B 100%);
}

.section-title {
  font-family: var(--game-font);
  font-size: 2rem;
  font-weight: 900;
  color: var(--accent-color);
  margin-bottom: 2rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 2px 2px 4px rgba(255, 209, 102, 0.3);
}

.subject-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
}

.leaderboard-preview {
  background: white;
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 3px solid var(--border-color);
  position: relative;
  overflow: hidden;
  animation: fadeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both;
}

.leaderboard-preview::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: linear-gradient(90deg, #7DD3F8 0%, #A8E6CF 50%, #FFD88B 100%);
}

.leaderboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.view-full-link {
  background-color: var(--primary-color);
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 25px;
  text-decoration: none;
  font-weight: 900;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: 2px solid var(--primary-color);
  box-shadow: 0 4px 0 #D9534F;
}

.view-full-link:hover {
  background-color: var(--primary-color);
  transform: translateY(-3px);
  box-shadow: 0 7px 0 #D9534F, 0 10px 15px rgba(255, 107, 107, 0.4);
}

.view-full-link:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #D9534F;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home-content {
    padding: 1rem;
  }
  
  .welcome-section,
  .subject-section,
  .leaderboard-preview {
    padding: 2rem;
  }
  
  .welcome-title {
    font-size: 1.8rem;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
  
  .subject-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
  }
  
  .leaderboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .welcome-section,
  .subject-section,
  .leaderboard-preview {
    padding: 1.5rem;
  }
  
  .welcome-title {
    font-size: 1.5rem;
  }
  
  .welcome-message {
    font-size: 0.9rem;
  }
  
  .section-title {
    font-size: 1.3rem;
  }
  
  .subject-grid {
    grid-template-columns: 1fr;
  }
  
  .view-full-link {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }
}
</style>