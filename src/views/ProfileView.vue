<template>
  <div class="profile-view">
    <AppHeader />

    <div class="profile-content">
      <!-- 个人信息卡片 -->
      <div class="profile-card">
        <div class="profile-header">
          <div class="user-info">
            <h2 class="user-name">{{ userName || studentId + '学号' }}</h2>
            <p class="user-class">{{ grade }}年级{{ className }}班</p>
          </div>
        </div>
        <div class="profile-stats">
          <div class="stat-item">
            <span class="stat-label">积分</span>
            <span class="stat-value">{{ userStats.points || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">排名</span>
            <span class="stat-value">
              {{ userRank.rank || '-' }}/{{ userRank.totalStudents || 0 }}
            </span>
          </div>
          <div class="stat-item">
            <span class="stat-label">百分位</span>
            <span class="stat-value">{{ userRank.percentile || 0 }}%</span>
          </div>
        </div>
      </div>

      <!-- 统计数据 -->
      <div class="stats-section">
        <h3 class="section-title">📊 学习统计</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-number">{{ userStats.totalSessions || 0 }}</span>
            <span class="stat-desc">答题次数</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">{{ userStats.totalQuestions || 0 }}</span>
            <span class="stat-desc">答题总数</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">{{ userStats.totalCorrect || 0 }}</span>
            <span class="stat-desc">正确数</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">{{ Math.round(userStats.avgAccuracy || 0) }}%</span>
            <span class="stat-desc">正确率</span>
          </div>
        </div>
      </div>

      <!-- 快速入口 -->
      <div class="quick-entry-section">
        <h3 class="section-title">🚀 快速入口</h3>
        <div class="quick-entry-grid">
          <div class="entry-card" @click="goTo('/error-book')">
            <div class="entry-icon">📝</div>
            <div class="entry-content">
              <span class="entry-label">错题本</span>
              <span v-if="errorStats.total > 0" class="entry-badge">{{ errorStats.total }}</span>
            </div>
          </div>
          <div class="entry-card" @click="goTo('/learning-progress')">
            <div class="entry-icon">📊</div>
            <div class="entry-content">
              <span class="entry-label">学习进度</span>
            </div>
          </div>
          <div class="entry-card" @click="goTo('/learning-report')">
            <div class="entry-icon">📈</div>
            <div class="entry-content">
              <span class="entry-label">学习报告</span>
            </div>
          </div>
          <div class="entry-card" @click="goTo('/answer-history')">
            <div class="entry-icon">📜</div>
            <div class="entry-content">
              <span class="entry-label">答题历史</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api } from '@/utils/api'
import AppHeader from '@/components/common/AppHeader.vue'
import { useLoading } from '@/composables/useLoading'

const router = useRouter()
const { withLoading } = useLoading()

// 用户信息
const userId = ref(localStorage.getItem('userId'))
const studentId = ref(localStorage.getItem('studentId'))
const userName = ref(localStorage.getItem('userName'))
const grade = ref(localStorage.getItem('userGrade'))
const className = ref(localStorage.getItem('userClass'))

// 统计数据
const userStats = ref({})
const userRank = ref({})
const errorStats = ref({ total: 0 })

// 获取用户统计数据
const fetchUserStats = async () => {
  try {
    const stats = await api.get(`/users/stats/${userId.value}`)
    userStats.value = stats

    // 获取积分（从用户信息中）
    const userInfo = await api.get(`/users/${userId.value}`)
    userStats.value.points = userInfo.points || 0
  } catch (error) {
    console.error('获取用户统计失败:', error)
    ElMessage.error('获取统计数据失败')
  }
}

// 获取用户排名
const fetchUserRank = async () => {
  try {
    const rank = await api.get(`/users/${userId.value}/rank`)
    userRank.value = rank
  } catch (error) {
    console.error('获取用户排名失败:', error)
  }
}

// 获取错题统计
const fetchErrorStats = async () => {
  try {
    const stats = await api.get(`/error-collection/stats/${userId.value}`)
    errorStats.value = stats
  } catch (error) {
    console.error('获取错题统计失败:', error)
  }
}

// 跳转页面
const goTo = path => {
  router.push(path)
}

onMounted(async () => {
  await withLoading(async () => {
    await Promise.all([fetchUserStats(), fetchUserRank(), fetchErrorStats()])
  })
})
</script>

<style scoped lang="scss">
.profile-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%);
  padding-bottom: 2rem;
}

.profile-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* 个人信息卡片 */
.profile-card {
  background: white;
  border-radius: 24px;
  padding: 2.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 3px solid var(--border-color);
  position: relative;
  overflow: hidden;
  animation: fadeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.profile-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: linear-gradient(90deg, #7dd3f8 0%, #a8e6cf 50%, #ffd88b 100%);
}

.profile-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin: 0 0 5px 0;
}

.user-class {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 1.2rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%);
  border-radius: 12px;
  border: 2px solid var(--border-color);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

.stat-label {
  display: block;
  font-family: var(--game-font);
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0.3rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-value {
  display: block;
  font-family: var(--game-font);
  font-size: 1.8rem;
  font-weight: 900;
  color: var(--primary-color);
  text-shadow: 2px 2px 4px rgba(255, 107, 107, 0.3);
}

/* 统计数据 */
.stats-section {
  background: white;
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin: 0 0 20px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.stat-card {
  text-align: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, var(--primary-color) 0%, #ff8787 100%);
  border-radius: 20px;
  color: white;
  border: 3px solid var(--border-color);
  box-shadow: 0 4px 0 #e85555;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow:
    0 8px 0 #e85555,
    0 12px 20px rgba(255, 107, 107, 0.4);
}

.stat-card:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #e85555;
}

.stat-number {
  display: block;
  font-family: var(--game-font);
  font-size: 2rem;
  font-weight: 900;
  margin-bottom: 0.3rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.stat-desc {
  display: block;
  font-family: var(--game-font);
  font-size: 0.9rem;
  opacity: 0.95;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* 快速入口 */
.quick-entry-section {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.quick-entry-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.entry-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 20px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  border: 3px solid var(--border-color);
  box-shadow: 0 4px 0 var(--accent-color);
}

.entry-card:hover {
  transform: translateY(-5px);
  box-shadow:
    0 8px 0 var(--accent-color),
    0 12px 20px rgba(255, 209, 102, 0.4);
}

.entry-card:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 var(--accent-color);
}

.entry-icon {
  font-size: 3rem;
  margin-bottom: 0.8rem;
}

.entry-content {
  position: relative;
}

.entry-label {
  display: block;
  font-family: var(--game-font);
  font-size: 1rem;
  font-weight: 900;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.entry-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  background: var(--primary-color);
  color: white;
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 900;
  min-width: 1.5rem;
  box-shadow: 0 2px 0 #e85555;
  font-family: var(--game-font);
}

/* 响应式 */
@media (max-width: 768px) {
  .stats-grid,
  .quick-entry-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .profile-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .user-name {
    font-size: 24px;
  }

  .stat-number {
    font-size: 24px;
  }

  .entry-icon {
    font-size: 36px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .quick-entry-grid {
    grid-template-columns: 1fr;
  }

  .profile-stats {
    grid-template-columns: 1fr;
  }
}
</style>
