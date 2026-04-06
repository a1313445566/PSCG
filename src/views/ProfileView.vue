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
  background: $stat-item-gradient;
  padding-bottom: 2rem;
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
  background: $section-header-gradient;
}

.profile-header {
  display: flex;
  align-items: center;
  margin-bottom: $spacing-comfortable; // 20px
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: $font-size-3xl; // 28px
  font-weight: bold;
  color: $text-primary;
  margin: 0 0 5px 0; // 特殊值
}

.user-class {
  font-size: $font-size-md; // 16px
  color: $text-secondary;
  margin: 0;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-comfortable; // 20px
}

.stat-item {
  text-align: center;
  padding: 1.2rem; // 特殊值
  background: $stat-item-gradient;
  border-radius: $border-radius-sm; // 12px取近似值8px
  border: $border-width-md solid $border-color;
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-3px);
  box-shadow: $shadow-md;
}

.stat-label {
  display: block;
  font-family: $game-font;
  font-size: 0.9rem;
  color: $text-secondary;
  margin-bottom: 0.3rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-value {
  display: block;
  font-family: $game-font;
  font-size: 1.8rem;
  font-weight: 900;
  color: $primary-color;
  text-shadow: $primary-glow;
}

/* 统计数据 */
.stats-section {
  background: white;
  border-radius: $border-radius-lg; // 20px取近似值24px
  padding: $spacing-section; // 30px≈$spacing-section(40px)或保留
  margin-bottom: $spacing-comfortable; // 20px
  box-shadow: $shadow-lg;
}

.section-title {
  font-size: $font-size-xl; // 20px
  font-weight: bold;
  color: $text-primary;
  margin: 0 0 $spacing-comfortable 0; // 20px
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px; // 特殊值
}

.stat-card {
  text-align: center;
  padding: $spacing-lg; // 1.5rem=24px
  background: $primary-gradient;
  border-radius: $border-radius-lg; // 20px取近似值24px
  color: $text-white;
  border: $border-width-lg solid $border-color;
  box-shadow: 0 4px 0 $mastery-low-shadow;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow:
    0 8px 0 $mastery-low-shadow,
    0 12px 20px set-alpha($primary-color, 40);
}

.stat-card:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 $mastery-low-shadow;
}

.stat-number {
  display: block;
  font-family: $game-font;
  font-size: $font-size-2xl; // 2rem=32px，取24px
  font-weight: 900;
  margin-bottom: 0.3rem; // 特殊值
  text-shadow: $text-shadow-light;
}

.stat-desc {
  display: block;
  font-family: $game-font;
  font-size: 0.9rem; // 特殊值
  opacity: 0.95;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px; // 特殊值
}

/* 快速入口 */
.quick-entry-section {
  background: $card-background;
  border-radius: $border-radius-lg; // 20px取近似值24px
  padding: $spacing-section; // 30px≈$spacing-section(40px)或保留
  box-shadow: $shadow-lg;
}

.quick-entry-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px; // 特殊值
}

.entry-card {
  background: $bg-gradient-page;
  border-radius: $border-radius-lg; // 20px取近似值24px
  padding: $spacing-lg; // 1.5rem=24px
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  border: $border-width-lg solid $border-color;
  box-shadow: 0 4px 0 $accent-color;
}

.entry-card:hover {
  transform: translateY(-5px);
  box-shadow:
    0 8px 0 $accent-color,
    0 12px 20px set-alpha($accent-color, 40);
}

.entry-card:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 $accent-color;
}

.entry-icon {
  font-size: 3rem; // 特殊值
  margin-bottom: 0.8rem; // 特殊值
}

.entry-content {
  position: relative;
}

.entry-label {
  display: block;
  font-family: var(--game-font);
  font-size: $font-size-md; // 1rem=16px
  font-weight: 900;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 1px; // 特殊值
}

.entry-badge {
  position: absolute;
  top: -10px; // 特殊值
  right: -10px; // 特殊值
  background: $primary-color;
  color: $text-white;
  padding: 0.3rem 0.6rem; // 特殊值
  border-radius: $border-radius-sm; // 12px取近似值8px
  font-size: 0.75rem; // 特殊值
  font-weight: 900;
  min-width: 1.5rem; // 特殊值
  box-shadow: 0 2px 0 $mastery-low-shadow;
  font-family: $game-font;
}

/* 响应式 */
@media (max-width: $breakpoint-md) {
  .stats-grid,
  .quick-entry-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .profile-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .user-name {
    font-size: $font-size-2xl; // 24px
  }

  .stat-number {
    font-size: $font-size-2xl; // 24px
  }

  .entry-icon {
    font-size: $font-size-4xl; // 36px，取32px
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
