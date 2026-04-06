<template>
  <div class="leaderboard-table">
    <!-- 大屏和中屏：表格布局 -->
    <div v-if="!isSmallScreen" class="table-layout">
      <div class="leaderboard-header">
        <div class="rank-col">排名</div>
        <div class="student-col">学号</div>
        <div class="name-col">姓名</div>
        <div class="grade-col">年级</div>
        <div class="class-col">班级</div>
        <div class="score-col">正确率</div>
        <div class="points-col">积分</div>
      </div>

      <div class="leaderboard-body">
        <div
          v-for="(item, index) in leaderboardData"
          :key="item.user_id || index"
          class="leaderboard-row"
          :class="{ 'current-user': item.student_id === currentStudentId }"
        >
          <div class="rank-col">
            <span v-if="index === 0" class="rank-number rank-1">🥇</span>
            <span v-else-if="index === 1" class="rank-number rank-2">🥈</span>
            <span v-else-if="index === 2" class="rank-number rank-3">🥉</span>
            <span v-else class="rank-number">{{ index + 1 }}</span>
          </div>
          <div class="student-col">{{ item.student_id }}</div>
          <div class="name-col">{{ item.name || '未知' }}</div>
          <div class="grade-col">{{ item.grade || '-' }}年级</div>
          <div class="class-col">{{ item.class || '-' }}班</div>
          <div class="score-col">{{ Math.round(item.avg_accuracy) }}%</div>
          <div class="points-col">{{ item.points || 0 }}</div>
        </div>

        <div v-if="leaderboardData.length === 0" class="leaderboard-empty">
          <p>暂无排行数据</p>
        </div>
      </div>
    </div>

    <!-- 小屏：卡片布局 -->
    <div v-else class="card-layout">
      <div
        v-for="(item, index) in leaderboardData"
        :key="item.user_id || index"
        class="leaderboard-card"
        :class="{ 'current-user': item.student_id === currentStudentId }"
      >
        <div class="card-header">
          <div class="rank-badge">
            <span v-if="index === 0" class="rank-number rank-1">🥇</span>
            <span v-else-if="index === 1" class="rank-number rank-2">🥈</span>
            <span v-else-if="index === 2" class="rank-number rank-3">🥉</span>
            <span v-else class="rank-number">{{ index + 1 }}</span>
          </div>
          <div class="user-info">
            <div class="student-id">{{ item.student_id }}</div>
            <div class="user-name">{{ item.name || '未知' }}</div>
            <div class="user-class">{{ item.grade || '-' }}年级 {{ item.class || '-' }}班</div>
          </div>
        </div>
        <div class="card-stats">
          <div class="stat-item">
            <div class="stat-label">正确率</div>
            <div class="stat-value">{{ Math.round(item.avg_accuracy) }}%</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">积分</div>
            <div class="stat-value">{{ item.points || 0 }}</div>
          </div>
        </div>
      </div>

      <div v-if="leaderboardData.length === 0" class="leaderboard-empty">
        <p>暂无排行数据</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- props 保留用于未来扩展
const _props = defineProps({
  leaderboardData: {
    type: Array,
    default: () => []
  }
})

// 当前学生ID
const currentStudentId = localStorage.getItem('studentId')

// 屏幕尺寸检测
const isSmallScreen = ref(false)

// 检测屏幕尺寸
const checkScreenSize = () => {
  isSmallScreen.value = window.innerWidth < 480
}

// 监听屏幕尺寸变化
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})
</script>


<style scoped lang="scss" src="./styles/LeaderboardTable.scss"></style>
