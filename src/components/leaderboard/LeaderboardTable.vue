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

const props = defineProps({
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

<style scoped lang="scss">
.leaderboard-table {
  background-color: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  margin: 1rem 0;
}

/* 表格布局 */
.table-layout {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 1rem;
}

.table-layout::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

.table-layout::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
  margin: 0 10px;
}

.table-layout::-webkit-scrollbar-thumb {
  background: #4a90e2;
  border-radius: 10px;
  transition: background 0.3s ease;
}

.table-layout::-webkit-scrollbar-thumb:hover {
  background: #357abd;
}

/* 确保表格内容不会溢出容器 */
.table-layout table {
  width: 100%;
  border-collapse: collapse;
}

/* 优化表格布局，确保内容对齐 */
.leaderboard-header,
.leaderboard-row {
  min-width: 600px;
  box-sizing: border-box;
}

.leaderboard-header {
  display: grid;
  grid-template-columns: 70px 100px 90px 70px 70px 100px 100px;
  background: linear-gradient(90deg, #7dd3f8 0%, #a8e6cf 50%, #ffd88b 100%);
  color: white;
  font-weight: bold;
  padding: 1rem;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 10;
}

.leaderboard-body {
  max-height: none;
  overflow-y: visible;
}

.leaderboard-row {
  display: grid;
  grid-template-columns: 70px 100px 90px 70px 70px 100px 100px;
  padding: 1rem;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.leaderboard-row:hover {
  background-color: #f5f9ff;
}

.leaderboard-row.current-user {
  background-color: #e3f2fd;
  border-left: 4px solid #4a90e2;
}

/* 卡片布局 */
.card-layout {
  display: none;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.leaderboard-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 248, 255, 0.8));
  border-radius: 12px;
  padding: 1.2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e3f2fd;
  transition: all 0.3s ease;
}

.leaderboard-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.leaderboard-card.current-user {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border: 2px solid #4a90e2;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.rank-badge {
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  text-align: left;
}

.student-id {
  font-size: 0.9rem;
  color: #666;
  font-weight: 600;
}

.user-name {
  font-size: 1.2rem;
  font-weight: 900;
  color: var(--primary-color);
  font-family: var(--game-font);
  margin: 0.2rem 0;
}

.user-class {
  font-size: 0.9rem;
  color: #888;
}

.card-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 0.8rem;
}

.stat-item {
  text-align: center;
  padding: 0.8rem;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(74, 144, 226, 0.2);
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 600;
  margin-bottom: 0.3rem;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 900;
  color: var(--primary-color);
  font-family: var(--game-font);
}

/* 排名样式 */
.rank-number {
  display: inline-block;
  width: 32px;
  height: 32px;
  line-height: 32px;
  border-radius: 50%;
  background: linear-gradient(90deg, #7dd3f8 0%, #a8e6cf 50%, #ffd88b 100%);
  color: white;
  font-weight: bold;
  font-size: 1rem;
  transition: all 0.3s ease;
  font-family: var(--game-font);
}

/* Top 3 特殊样式 */
.rank-number.rank-1 {
  width: 40px;
  height: 40px;
  line-height: 40px;
  font-size: 1.5rem;
  background: linear-gradient(135deg, #ffd700, #ffa500);
  box-shadow: 0 4px 8px rgba(255, 215, 0, 0.5);
  animation: glow 2s infinite;
  color: #333 !important;
}

.rank-number.rank-2 {
  width: 36px;
  height: 36px;
  line-height: 36px;
  font-size: 1.3rem;
  background: linear-gradient(135deg, #c0c0c0, #a9a9a9);
  box-shadow: 0 4px 8px rgba(192, 192, 192, 0.5);
  animation: glow 2s infinite 0.3s;
  color: #333 !important;
}

.rank-number.rank-3 {
  width: 34px;
  height: 34px;
  line-height: 34px;
  font-size: 1.2rem;
  background: linear-gradient(135deg, #cd7f32, #b87333);
  box-shadow: 0 4px 8px rgba(205, 127, 50, 0.5);
  animation: glow 2s infinite 0.6s;
  color: #333 !important;
}

/* Top 10 特殊样式 */
.leaderboard-row:nth-child(-n + 3) {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 255, 255, 0.8));
  border: 2px solid rgba(255, 215, 0, 0.3);
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.leaderboard-row:nth-child(-n + 3):hover {
  transform: scale(1.04);
  box-shadow: 0 6px 16px rgba(255, 215, 0, 0.5);
}

.leaderboard-row:nth-child(-n + 10) {
  background: linear-gradient(135deg, rgba(106, 17, 203, 0.05), rgba(255, 255, 255, 0.9));
  border: 1px solid rgba(106, 17, 203, 0.2);
  transition: all 0.4s ease;
}

.leaderboard-row:nth-child(-n + 10):hover {
  transform: scale(1.01);
  box-shadow: 0 4px 10px rgba(106, 17, 203, 0.3);
}

/* Top 10 卡片特殊样式 */
.leaderboard-card:nth-child(-n + 3) {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 255, 255, 0.9));
  border: 2px solid rgba(255, 215, 0, 0.4);
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.leaderboard-card:nth-child(-n + 3):hover {
  transform: scale(1.04);
  box-shadow: 0 6px 16px rgba(255, 215, 0, 0.5);
}

.leaderboard-card:nth-child(-n + 10) {
  background: linear-gradient(135deg, rgba(106, 17, 203, 0.05), rgba(255, 255, 255, 0.9));
  border: 1px solid rgba(106, 17, 203, 0.2);
  transition: all 0.4s ease;
}

.leaderboard-card:nth-child(-n + 10):hover {
  transform: scale(1.02);
  box-shadow: 0 4px 10px rgba(106, 17, 203, 0.3);
}

/* 发光动画 */
@keyframes glow {
  0%,
  100% {
    box-shadow: 0 4px 8px rgba(255, 215, 0, 0.5);
  }
  50% {
    box-shadow: 0 6px 16px rgba(255, 215, 0, 0.8);
  }
}

.leaderboard-empty {
  text-align: center;
  padding: 3rem;
  color: #999;
}

/* 响应式设计 */
/* 大屏（>768px）：完整表格布局 */
@media (min-width: 769px) {
  .table-layout {
    display: block;
  }
  .card-layout {
    display: none;
  }
}

/* 中屏（480px~768px）：横向滚动表格 */
@media (max-width: 768px) {
  .table-layout {
    display: block;
  }
  .card-layout {
    display: none;
  }

  .leaderboard-header,
  .leaderboard-row {
    grid-template-columns: 60px 90px 80px 60px 60px 90px 80px;
    font-size: 14px;
  }

  .leaderboard-header,
  .leaderboard-row {
    padding: 0.8rem;
  }

  .rank-number {
    width: 24px;
    height: 24px;
    line-height: 24px;
    font-size: 12px;
  }

  .rank-number.rank-1 {
    width: 30px;
    height: 30px;
    line-height: 30px;
    font-size: 1.2rem;
  }

  .rank-number.rank-2 {
    width: 28px;
    height: 28px;
    line-height: 28px;
    font-size: 1.1rem;
  }

  .rank-number.rank-3 {
    width: 26px;
    height: 26px;
    line-height: 26px;
    font-size: 1rem;
  }
}

/* 小屏（<480px）：堆叠卡片布局 */
@media (max-width: 480px) {
  .table-layout {
    display: none;
  }
  .card-layout {
    display: flex;
  }

  .leaderboard-card {
    padding: 1rem;
  }

  .card-header {
    gap: 0.8rem;
  }

  .user-name {
    font-size: 1.1rem;
  }

  .card-stats {
    gap: 0.8rem;
  }

  .stat-item {
    padding: 0.6rem;
  }

  .stat-value {
    font-size: 1.2rem;
  }

  .rank-number {
    width: 28px;
    height: 28px;
    line-height: 28px;
    font-size: 1rem;
  }

  .rank-number.rank-1 {
    width: 32px;
    height: 32px;
    line-height: 32px;
    font-size: 1.3rem;
  }

  .rank-number.rank-2 {
    width: 30px;
    height: 30px;
    line-height: 30px;
    font-size: 1.2rem;
  }

  .rank-number.rank-3 {
    width: 29px;
    height: 29px;
    line-height: 29px;
    font-size: 1.1rem;
  }
}
</style>
