<template>
  <div class="leaderboard-table">
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
</template>

<script setup>
const props = defineProps({
  leaderboardData: {
    type: Array,
    default: () => []
  }
})

// 当前学生ID
const currentStudentId = localStorage.getItem('studentId')

// 获取排名样式类
const getRankClass = (index) => {
  if (index === 0) return 'rank-1'
  if (index === 1) return 'rank-2'
  if (index === 2) return 'rank-3'
  return ''
}
</script>

<style scoped>
.leaderboard-table {
  background-color: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  margin: 1rem 0;
}

.leaderboard-header {
  display: grid;
  grid-template-columns: 70px 100px 90px 70px 70px 100px 100px;
  background: linear-gradient(90deg, #7DD3F8 0%, #A8E6CF 50%, #FFD88B 100%);
  color: white;
  font-weight: bold;
  padding: 1rem;
  text-align: center;
}

.leaderboard-body {
  /* 移除滚动条，让排行榜完全显示 */
  max-height: none;
  overflow-y: visible;
}

.leaderboard-row {
  display: grid;
  grid-template-columns: 70px 100px 90px 70px 70px 100px 100px;
  padding: 1rem;
  text-align: center;
  border-bottom: 1px solid #F0F0F0;
  transition: all 0.3s ease;
}

.leaderboard-row:hover {
  background-color: #F5F9FF;
}

.leaderboard-row.current-user {
  background-color: #E3F2FD;
  border-left: 4px solid #4A90E2;
}

.rank-number {
  display: inline-block;
  width: 32px;
  height: 32px;
  line-height: 32px;
  border-radius: 50%;
  background: linear-gradient(90deg, #7DD3F8 0%, #A8E6CF 50%, #FFD88B 100%);
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
  background: linear-gradient(135deg, #FFD700, #FFA500);
  box-shadow: 0 4px 8px rgba(255, 215, 0, 0.5);
  animation: glow 2s infinite;
  color: #333 !important;
}

.rank-number.rank-2 {
  width: 36px;
  height: 36px;
  line-height: 36px;
  font-size: 1.3rem;
  background: linear-gradient(135deg, #C0C0C0, #A9A9A9);
  box-shadow: 0 4px 8px rgba(192, 192, 192, 0.5);
  animation: glow 2s infinite 0.3s;
  color: #333 !important;
}

.rank-number.rank-3 {
  width: 34px;
  height: 34px;
  line-height: 34px;
  font-size: 1.2rem;
  background: linear-gradient(135deg, #CD7F32, #B87333);
  box-shadow: 0 4px 8px rgba(205, 127, 50, 0.5);
  animation: glow 2s infinite 0.6s;
  color: #333 !important;
}

/* Top 10 特殊样式 */
.leaderboard-row:nth-child(-n+3) {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 255, 255, 0.8));
  border: 2px solid rgba(255, 215, 0, 0.3);
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.leaderboard-row:nth-child(-n+3):hover {
  transform: scale(1.04);
  box-shadow: 0 6px 16px rgba(255, 215, 0, 0.5);
}

.leaderboard-row:nth-child(-n+10) {
  background: linear-gradient(135deg, rgba(106, 17, 203, 0.05), rgba(255, 255, 255, 0.9));
  border: 1px solid rgba(106, 17, 203, 0.2);
  transition: all 0.4s ease;
}

.leaderboard-row:nth-child(-n+10):hover {
  transform: scale(1.01);
  box-shadow: 0 4px 10px rgba(106, 17, 203, 0.3);
}

/* 发光动画 */
@keyframes glow {
  0%, 100% {
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
@media (max-width: 1024px) {
  .leaderboard-header,
  .leaderboard-row {
    grid-template-columns: 70px 100px 90px 70px 70px 100px 90px;
  }
  
  .leaderboard-header,
  .leaderboard-row {
    padding: 0.8rem;
  }
}

@media (max-width: 768px) {
  .leaderboard-header,
  .leaderboard-row {
    grid-template-columns: 60px 90px 80px 60px 60px 90px 80px;
    font-size: 14px;
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

@media (max-width: 480px) {
  .leaderboard-header,
  .leaderboard-row {
    grid-template-columns: 50px 80px 70px 50px 50px 80px 70px;
    font-size: 12px;
  }
  
  .leaderboard-header,
  .leaderboard-row {
    padding: 0.6rem;
  }
  
  .rank-number {
    width: 20px;
    height: 20px;
    line-height: 20px;
    font-size: 10px;
  }
  
  .rank-number.rank-1 {
    width: 24px;
    height: 24px;
    line-height: 24px;
    font-size: 1rem;
  }
  
  .rank-number.rank-2 {
    width: 22px;
    height: 22px;
    line-height: 22px;
    font-size: 0.9rem;
  }
  
  .rank-number.rank-3 {
    width: 21px;
    height: 21px;
    line-height: 21px;
    font-size: 0.8rem;
  }
}
</style>