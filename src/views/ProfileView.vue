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
  background: $bg-gradient-page;
  padding-bottom: $spacing-xl;
}

.profile-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: $spacing-xl;
}

/* 个人信息卡片 */
.profile-card {
  background: $card-background;
  border-radius: $border-radius-lg;
  padding: $spacing-section;
  margin-bottom: $spacing-xl;
  box-shadow: $shadow-lg;
  border: $border-width-lg solid $border-color;
  animation: fadeIn 0.6s ease;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-comfortable;
  flex-wrap: wrap;
  gap: $spacing-comfortable;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: $font-size-3xl;
  font-weight: bold;
  color: $text-primary;
  margin: 0 0 $spacing-xs 0;
}

.user-class {
  font-size: $font-size-md;
  color: $text-secondary;
  margin: 0;
}

.profile-stats {
  display: flex;
  gap: $spacing-comfortable;
  flex-wrap: wrap;
}

.stat-item {
  flex: 1;
  min-width: 120px;
  text-align: center;
  padding: $spacing-lg;
  background: $stat-item-gradient;
  border-radius: $border-radius-lg;
  border: $border-width-md solid $border-color;
  transition: transform 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-3px);
}

.stat-label {
  display: block;
  font-family: $game-font;
  font-size: 0.9rem;
  color: $text-secondary;
  margin-bottom: $spacing-xs;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-value {
  display: block;
  font-family: $game-font;
  font-size: 2rem;
  font-weight: 900;
  color: $primary-color;
}

/* 统计数据 */
.stats-section {
  background: $card-background;
  border-radius: $border-radius-lg;
  padding: $spacing-section;
  margin-bottom: $spacing-xl;
  box-shadow: $shadow-lg;
}

.section-title {
  font-size: $font-size-xl;
  font-weight: bold;
  color: $text-primary;
  margin: 0 0 $spacing-comfortable 0;
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-lg;
}

.stat-card {
  text-align: center;
  padding: $spacing-lg;
  background: $bg-gradient-page;
  border-radius: $border-radius-lg;
  border: $border-width-lg solid $border-color;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-3px);
}

.stat-number {
  display: block;
  font-family: $game-font;
  font-size: $font-size-2xl;
  font-weight: 900;
  color: $primary-color;
  margin-bottom: $spacing-xs;
}

.stat-desc {
  display: block;
  font-family: $game-font;
  font-size: 0.9rem;
  color: $text-secondary;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* 快速入口 */
.quick-entry-section {
  background: $card-background;
  border-radius: $border-radius-lg;
  padding: $spacing-section;
  box-shadow: $shadow-lg;
}

.quick-entry-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-lg;
}

.entry-card {
  background: $bg-gradient-page;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  border: $border-width-lg solid $border-color;
  position: relative;
}

.entry-card:hover {
  transform: translateY(-3px);
  box-shadow: $shadow-md;
}

.entry-icon {
  font-size: 2.5rem;
  margin-bottom: $spacing-sm;
}

.entry-content {
  position: relative;
}

.entry-label {
  display: block;
  font-family: $game-font;
  font-size: $font-size-md;
  font-weight: 900;
  color: $text-primary;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.entry-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: $primary-color;
  color: $text-white;
  padding: 0.25rem 0.5rem;
  border-radius: $border-radius-sm;
  font-size: 0.75rem;
  font-weight: 900;
  min-width: 1.5rem;
  font-family: $game-font;
}

/* 响应式 */
@media (max-width: $breakpoint-md) {
  .stats-grid,
  .quick-entry-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .profile-stats {
    flex-direction: column;
  }

  .stat-item {
    width: 100%;
  }

  .user-name {
    font-size: $font-size-2xl;
  }

  .stat-number {
    font-size: $font-size-2xl;
  }

  .entry-icon {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .stats-grid,
  .quick-entry-grid {
    grid-template-columns: 1fr;
  }

  .profile-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .profile-stats {
    width: 100%;
  }
}
</style>
