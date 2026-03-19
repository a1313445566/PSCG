<template>
  <div class="home-view">
    <AppHeader />
    
    <div class="home-content">
      <div class="welcome-section">
        <div class="welcome-header">
          <h2 class="welcome-title">欢迎回来，{{ currentUserGrade }}年级{{ currentUserClass }}班的 {{ currentUserName || (currentStudentId + '学号') }}同学！</h2>
          <button class="logout-btn" @click="logout">退出登录</button>
        </div>
        <div class="user-stats" v-if="userStats">
          <div class="stat-item">
            <span class="stat-label">答题次数:</span>
            <span class="stat-value">{{ userStats.totalSessions || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">答题总数:</span>
            <span class="stat-value">{{ userStats.totalQuestions || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">正确数:</span>
            <span class="stat-value">{{ userStats.totalCorrect || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">正确率:</span>
            <span class="stat-value">{{ Math.round(userStats.avgAccuracy || 0) }}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">积分:</span>
            <span class="stat-value">{{ userStats.points || 0 }}</span>
          </div>
        </div>
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
        <h3 class="leaderboard-title">🏆 排行榜 Top 10</h3>
        <div class="leaderboard-header">
          <!-- 左侧分栏：第一名卡片和排行榜规则 -->
          <div class="left-column">
            <!-- 第一名卡片 -->
            <div v-if="leaderboardData.length > 0" class="first-place-content">
              <div class="first-place-header">
                <h3 class="first-place-title">🏆 状元宝座</h3>
                <div class="first-place-badge">🥇</div>
              </div>
              <div class="first-place-info">
                <div class="first-place-user">
                <div class="user-name">{{ leaderboardData[0].name || (leaderboardData[0].student_id + '学号') }}</div>
                <div class="user-class">{{ leaderboardData[0].grade || '-' }}年级{{ leaderboardData[0].class || '-' }}班</div>
              </div>
                <div class="first-place-stats">
                  <div class="stat-item">
                    <span class="stat-label">正确率</span>
                    <span class="stat-value">{{ Math.round(leaderboardData[0].avg_accuracy || 0) }}%</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">答题数</span>
                    <span class="stat-value">{{ leaderboardData[0].total_questions || 0 }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">积分</span>
                    <span class="stat-value">{{ leaderboardData[0].points || 0 }}</span>
                  </div>
                </div>
              </div>
              <div class="first-place-message">
                <p>🎉 恭喜 {{ leaderboardData[0].name || '这位同学' }} 荣登榜首！</p>
                <p>你的努力和智慧为你赢得了这份荣誉，继续保持，加油！</p>
              </div>
            </div>
            <!-- 排行榜规则和查看完整排行榜按钮 -->
            <div class="leaderboard-info">
              <div class="leaderboard-rules">
                <h4 class="rules-title">📝 排行榜规则</h4>
                <ul class="rules-list">
                  <li>排名根据用户的答题正确率、答题数和积分综合计算</li>
                  <li>TOP 3 玩家将获得特殊标识和动画效果</li>
                  <li>积分规则：答对一题得1分，答错一题扣1分，全对积分翻倍</li>
                </ul>
              </div>
              <router-link to="/leaderboard" class="view-full-link">查看完整排行榜</router-link>
            </div>
          </div>
          <!-- 右侧分栏：排行榜表格 -->
          <div class="leaderboard-table-container">
            <LeaderboardTable :leaderboardData="leaderboardData" />
          </div>
        </div>
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
// 用户统计数据
const userStats = ref(null)

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

// 获取用户统计数据
const fetchUserStats = async () => {
  try {
    const userId = localStorage.getItem('userId')
    if (userId) {
      const response = await fetch(`${getApiBaseUrl()}/users/stats/${userId}`)
      if (response.ok) {
        const data = await response.json()
        // 获取用户积分
        const userResponse = await fetch(`${getApiBaseUrl()}/users/${userId}`)
        if (userResponse.ok) {
          const userData = await userResponse.json()
          data.points = userData.points || 0
        }
        userStats.value = data
      }
    }
  } catch (error) {

  }
}

// 选择学科
const selectSubject = (subjectId) => {
  router.push(`/subcategory/${subjectId}`)
}

// 退出登录
const logout = () => {
  localStorage.clear()
  sessionStorage.clear()
  router.push('/login')
}

onMounted(async () => {
  // 初始化数据
  await questionStore.initialize()
  // 获取排行榜数据
  await fetchLeaderboardData()
  // 获取用户统计数据
  await fetchUserStats()
  
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

.welcome-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.welcome-title {
  font-family: var(--game-font);
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--primary-color);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 2px 2px 4px rgba(255, 107, 107, 0.3);
}

.logout-btn {
  background-color: var(--primary-color);
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 25px;
  border: none;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 0 #D9534F;
}

.logout-btn:hover {
  background-color: var(--primary-color);
  transform: translateY(-3px);
  box-shadow: 0 7px 0 #D9534F, 0 10px 15px rgba(255, 107, 107, 0.4);
}

.logout-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #D9534F;
}

.user-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 1.5rem 0;
  flex-wrap: wrap;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%);
  border-radius: 16px;
  border: 2px solid var(--border-color);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  font-size: 1rem;
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--primary-color);
  font-family: var(--game-font);
  text-shadow: 2px 2px 4px rgba(255, 107, 107, 0.3);
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
  display: flex;
  flex-direction: column;
  align-items: center;
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
  align-items: flex-start;
  width: 100%;
  gap: 2rem;
}

.left-column {
  flex: 1;
  min-width: 400px;
  max-width: 400px;
  display: flex;
  flex-direction: column;
}

.leaderboard-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-top: 0;
}

.leaderboard-rules {
  background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%);
  border-radius: 20px;
  padding: 1.2rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--border-color);
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.8rem;
}

@media (max-width: 1400px) {
  .leaderboard-header {
    flex-wrap: wrap;
  }
  
  .left-column,
  .leaderboard-table-container {
    flex: 1 1 100%;
    min-width: 100%;
  }
  
  .left-column {
    max-width: 100%;
  }
}

.leaderboard-table-container {
  flex: 2;
  min-width: 600px;
  width: 100%;
}

.leaderboard-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-top: 2rem;
}

.leaderboard-rules {
  background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--border-color);
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  font-size: 1rem;
  margin-top: 0.5rem;
  width: fit-content;
}

.leaderboard-title {
  margin: 0 0 2rem 0;
  white-space: nowrap;
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--primary-color);
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  font-family: var(--game-font);
  text-transform: uppercase;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.leaderboard-title::before,
.leaderboard-title::after {
  content: '🏆';
  font-size: 1.6rem;
  animation: bounce 2s infinite;
}

.leaderboard-rules {
  background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--border-color);
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}

.rules-title {
  font-family: 'Fredoka One', 'Comic Sans MS', cursive;
  font-size: 2rem;
  font-weight: 900;
  color: var(--primary-color);
  margin-bottom: -0.2rem;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 2px 2px 4px rgba(255, 107, 107, 0.3);
  align-self: flex-start;
  width: 100%;
}

.rules-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rules-list li {
  color: var(--text-primary);
  font-family: var(--game-font);
  font-size: 1rem;
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
  position: relative;
  line-height: 1.4;
}

.rules-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  top: 0.2rem;
  color: var(--primary-color);
  font-weight: bold;
  font-size: 1rem;
  width: 1rem;
  height: 1rem;
  text-align: center;
  font-size: 0.8rem;
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
  font-size: 1rem;
  align-self: flex-start;
  margin-top: 0.5rem;
  width: 100%;
  text-align: center;
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



/* 第一名卡片样式 */
.first-place-content {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.15);
  border: 3px solid var(--border-color);
  animation: fadeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  min-width: 400px;
  min-height: 210px;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  margin-top: 1rem;
}

.first-place-content .leaderboard-info {
  margin-top: 0;
}

.first-place-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.first-place-title {
  font-family: var(--game-font);
  font-size: 1.8rem;
  font-weight: 900;
  color: #FFD700;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.first-place-badge {
  font-size: 2.5rem;
  animation: bounce 2s infinite;
}

.first-place-info {
  margin-bottom: 1rem;
  flex: 1;
}

.first-place-user {
  text-align: center;
  margin-bottom: 1rem;
}

.user-name {
  font-family: var(--game-font);
  font-size: 2rem;
  font-weight: 900;
  color: var(--primary-color);
  margin-bottom: 0.3rem;
  line-height: 1.2;
}

.user-class {
  font-size: 1.2rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.first-place-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.first-place-stats .stat-item {
  text-align: center;
  padding: 0.8rem;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 12px;
  border: 2px solid var(--border-color);
  transition: all 0.3s ease;
}

.first-place-stats .stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.first-place-stats .stat-label {
  display: block;
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 0.3rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.first-place-stats .stat-value {
  display: block;
  font-size: 1.6rem;
  font-weight: 900;
  color: var(--primary-color);
  font-family: var(--game-font);
}

.first-place-message {
  text-align: center;
  padding: 0.8rem;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 255, 255, 0.9) 100%);
  border-radius: 12px;
  border: 2px solid rgba(255, 215, 0, 0.4);
}

.first-place-message p {
  margin: 0.3rem 0;
  font-family: var(--game-font);
  color: var(--text-primary);
  font-weight: 700;
  font-size: 1.1rem;
  line-height: 1.3;
}

.first-place-message p:first-child {
  color: #FFD700;
  font-size: 1.3rem;
  font-weight: 900;
}

.leaderboard-rules {
  background: white;
  border-radius: 16px;
  padding: 1.2rem;
  border: 2px solid var(--border-color);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.rules-title {
  font-family: var(--game-font);
  font-size: 2rem;
  font-weight: 900;
  color: var(--primary-color);
  margin-bottom: -0.2rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 2px 2px 4px rgba(255, 107, 107, 0.3);
}

.rules-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rules-list li {
  color: var(--text-primary);
  font-family: var(--game-font);
  font-size: 1rem;
  margin-bottom: 0.4rem;
  padding-left: 1.2rem;
  position: relative;
  line-height: 1.3;
}

.rules-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  top: 0.2rem;
  color: var(--primary-color);
  font-weight: bold;
  font-size: 1rem;
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
  
  .welcome-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .user-stats {
    gap: 1rem;
    padding: 1rem;
  }
  
  .stat-item {
    gap: 0.3rem;
  }
  
  .stat-label {
    font-size: 0.9rem;
  }
  
  .stat-value {
    font-size: 1.2rem;
  }
  
  .welcome-title {
    font-size: 1.8rem;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
  
  .leaderboard-title {
    font-size: 1.8rem;
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
  
  .leaderboard-title {
    font-size: 1.5rem;
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