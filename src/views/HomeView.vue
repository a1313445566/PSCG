<template>
  <div class="home-view">
    <AppHeader />

    <div class="home-content">
      <div class="welcome-section">
        <div class="welcome-header">
          <h2 class="welcome-title">
            欢迎回来，{{ currentUserGrade }}年级{{ currentUserClass }}班的
            {{ currentUserName || currentStudentId + '学号' }}同学！
          </h2>
          <div class="header-actions">
            <button class="profile-btn" @click="goToProfile">👤 个人中心</button>
            <button class="logout-btn" @click="logout">退出登录</button>
          </div>
        </div>
        <div v-if="userStats" class="user-stats">
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
        <div v-else class="user-stats-skeleton">
          <div v-for="i in 5" :key="i" class="stat-item">
            <SkeletonLoader type="text" width="80px" height="16px" style="margin-bottom: 8px" />
            <SkeletonLoader type="text" width="60px" height="20px" />
          </div>
        </div>
        <p class="welcome-message">选择一个学科开始学习之旅吧！</p>
      </div>

      <div class="subject-section">
        <h3 class="section-title">📚 基础闯关</h3>
        <div v-if="normalSubjects.length > 0" class="subject-grid">
          <SubjectCard
            v-for="subject in normalSubjects"
            :key="subject.id"
            :subject="subject"
            :questions="questions"
            @select="selectSubject"
          />
        </div>
        <div v-else-if="subjects.length === 0" class="subject-grid skeleton-grid">
          <SkeletonLoader v-for="i in 4" :key="i" type="subject-card" />
        </div>
        <div v-else class="empty-tip">
          <p>所有学科都已设置为历史机测</p>
        </div>
      </div>

      <!-- 高级闯关卡片 -->
      <div v-if="historyQuizSubjects.length > 0" class="subject-section">
        <h3 class="section-title">📖 高级闯关</h3>
        <div class="subject-grid">
          <SubjectCard
            v-for="subject in historyQuizSubjects"
            :key="subject.id"
            :subject="subject"
            :questions="questions"
            @select="selectSubject"
          />
        </div>
      </div>

      <div class="leaderboard-preview">
        <div class="leaderboard-header-section">
          <h3 class="leaderboard-title">🏆 排行榜 Top 10</h3>
          <div v-if="countdown" class="reset-countdown">
            <span class="countdown-label">重置倒计时：</span>
            <span class="countdown-time">{{ countdown }}</span>
          </div>
        </div>
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
                  <div class="user-name">
                    {{ leaderboardData[0].name || leaderboardData[0].student_id + '学号' }}
                  </div>
                  <div class="user-class">
                    {{ leaderboardData[0].grade || '-' }}年级{{ leaderboardData[0].class || '-' }}班
                  </div>
                </div>
                <div class="first-place-stats">
                  <div class="stat-item">
                    <span class="stat-label">正确率</span>
                    <span class="stat-value">
                      {{ Math.round(leaderboardData[0].avg_accuracy || 0) }}%
                    </span>
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
            <div v-else class="first-place-skeleton">
              <SkeletonLoader type="text" width="150px" height="24px" style="margin-bottom: 16px" />
              <SkeletonLoader
                type="circle"
                width="60px"
                height="60px"
                style="margin-bottom: 16px"
              />
              <SkeletonLoader type="text" width="80%" height="20px" style="margin-bottom: 8px" />
              <SkeletonLoader type="text" width="60%" height="16px" style="margin-bottom: 16px" />
              <div class="skeleton-stats">
                <SkeletonLoader
                  type="rect"
                  width="80px"
                  height="60px"
                  style="margin-right: 12px; border-radius: 8px"
                />
                <SkeletonLoader
                  type="rect"
                  width="80px"
                  height="60px"
                  style="margin-right: 12px; border-radius: 8px"
                />
                <SkeletonLoader type="rect" width="80px" height="60px" style="border-radius: 8px" />
              </div>
            </div>
            <!-- 排行榜规则和查看完整排行榜按钮 -->
            <div class="leaderboard-info">
              <div class="leaderboard-rules">
                <h4 class="rules-title">📝 排行榜规则</h4>
                <ul class="rules-list">
                  <li>排序规则：</li>
                  <li>1. 第一优先级：积分（降序）</li>
                  <li>2. 第二优先级：正确率（降序）</li>
                  <li>3. 第三优先级：答题数（降序）</li>
                  <li>进入条件：每周答题数≥20题</li>
                  <li>TOP 3 玩家将获得特殊标识和动画效果</li>
                  <li>积分规则：答对一题得1分，答错一题扣1分，全对积分翻倍</li>
                  <li>统计周期：每周一 00:00 至周日 23:59</li>
                  <li>排行榜每周一 00:00 自动重置</li>
                </ul>
              </div>
              <router-link to="/leaderboard" class="view-full-link">查看完整排行榜</router-link>
            </div>
          </div>
          <!-- 右侧分栏：排行榜表格 -->
          <div class="leaderboard-table-container">
            <LeaderboardTable
              v-if="leaderboardData.length > 0"
              :leaderboard-data="leaderboardData"
            />
            <div v-else class="leaderboard-skeleton">
              <SkeletonLoader v-for="i in 5" :key="i" type="leaderboard" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/common/AppHeader.vue'
import SubjectCard from '../components/subject/SubjectCard.vue'
import LeaderboardTable from '../components/leaderboard/LeaderboardTable.vue'
import SkeletonLoader from '../components/common/SkeletonLoader.vue'
import { useQuestionStore } from '../stores/questionStore'
import { api } from '../utils/api'

const router = useRouter()
const questionStore = useQuestionStore()

// 学科和题目数据
const subjects = computed(() => {
  // 直接使用从数据库获取的排序（已在后端按sort_order排序）
  return questionStore.subjects
})
const questions = computed(() => questionStore.questions)

// 普通学科（未设置显示在历史机测）
const normalSubjects = computed(() => {
  return subjects.value.filter(subject => subject.showInHistoryQuiz !== true)
})

// 历史机测学科（筛选出设置了 showInHistoryQuiz 的学科）
const historyQuizSubjects = computed(() => {
  return subjects.value.filter(subject => subject.showInHistoryQuiz === true)
})

// 用户信息
const currentStudentId = computed(() => localStorage.getItem('studentId'))
const currentUserName = computed(() => localStorage.getItem('userName'))
const currentUserGrade = computed(() => localStorage.getItem('userGrade'))
const currentUserClass = computed(() => localStorage.getItem('userClass'))

// 排行榜数据
const leaderboardData = ref([])
// 用户统计数据
const userStats = ref(null)
// 倒计时
const countdown = ref('')
let countdownInterval = null
// 排行榜自动刷新定时器
let leaderboardRefreshInterval = null

// 调试：监控 subjects 数据变化
watch(
  () => questionStore.subjects,
  () => {}, // eslint-disable-line @typescript-eslint/no-empty-function -- 仅用于触发响应式更新
  { deep: true, immediate: true }
)

// 监控 questions 数据变化，确保新添加的题目能显示
watch(
  () => questionStore.questions,
  () => {}, // eslint-disable-line @typescript-eslint/no-empty-function -- 仅用于触发响应式更新
  { deep: true }
)

// 获取排行榜数据
const fetchLeaderboardData = async () => {
  try {
    const data = await api.get('/leaderboard/top10')
    leaderboardData.value = data
  } catch (error) {
    // 静默处理错误，避免影响用户体验
  }
}

// 计算到下周一00:00的时间差
const calculateTimeLeft = () => {
  const now = new Date()
  const dayOfWeek = now.getDay()
  // 计算到下周一的天数：周日(0)→1天，周一(1)→0天，周二(2)→6天，以此类推
  const daysUntilMonday = dayOfWeek === 1 ? 7 : (8 - dayOfWeek) % 7
  const nextMonday = new Date(now)
  nextMonday.setDate(now.getDate() + daysUntilMonday)
  nextMonday.setHours(0, 0, 0, 0)
  const timeLeft = Math.floor((nextMonday - now) / 1000)
  // 确保时间差不为负数
  return Math.max(0, timeLeft)
}

// 格式化倒计时
const formatTimeLeft = seconds => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${days.toString().padStart(2, '0')}天 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 启动倒计时
const startCountdown = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }

  const updateCountdown = () => {
    const timeLeft = calculateTimeLeft()
    countdown.value = formatTimeLeft(timeLeft)

    // 如果倒计时结束，重新加载排行榜
    if (timeLeft <= 0) {
      fetchLeaderboardData()
    }
  }

  updateCountdown()
  countdownInterval = setInterval(updateCountdown, 1000)
}

// 停止倒计时
const stopCountdown = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
}

// 启动排行榜自动刷新（每30秒刷新一次）
const startLeaderboardAutoRefresh = () => {
  if (leaderboardRefreshInterval) {
    clearInterval(leaderboardRefreshInterval)
  }

  leaderboardRefreshInterval = setInterval(() => {
    fetchLeaderboardData()
  }, 30000) // 30秒刷新一次
}

// 停止排行榜自动刷新
const stopLeaderboardAutoRefresh = () => {
  if (leaderboardRefreshInterval) {
    clearInterval(leaderboardRefreshInterval)
    leaderboardRefreshInterval = null
  }
}

// 获取用户统计数据
const fetchUserStats = async () => {
  try {
    const userId = localStorage.getItem('userId')
    if (userId) {
      const data = await api.get(`/users/stats/${userId}`)
      // 获取用户积分
      const userData = await api.get(`/users/${userId}`)
      data.points = userData.points || 0
      userStats.value = data
    }
  } catch (error) {
    // 静默处理错误
  }
}

// 选择学科
const selectSubject = subjectId => {
  router.push(`/subcategory/${subjectId}`)
}

// 跳转到个人中心
const goToProfile = () => {
  router.push('/profile')
}

// 退出登录
const logout = () => {
  localStorage.clear()
  sessionStorage.clear()
  router.push('/login')
}

onMounted(() => {
  // 检查是否已登录
  if (!currentStudentId.value) {
    router.push('/login')
    return
  }

  // 后台加载数据，不阻塞渲染
  questionStore
    .initialize()
    .then(() => {
      // 数据加载完成后再加载排行榜和用户统计
      fetchLeaderboardData()
      startCountdown()
      startLeaderboardAutoRefresh() // 启动排行榜自动刷新
      fetchUserStats()
    })
    .catch(error => {
      console.error('加载数据失败:', error)
    })
})

onUnmounted(() => {
  // 停止倒计时，防止内存泄漏
  stopCountdown()
  // 停止排行榜自动刷新，防止内存泄漏
  stopLeaderboardAutoRefresh()
})
</script>

<style scoped lang="scss" src="./styles/HomeView.scss"></style>
