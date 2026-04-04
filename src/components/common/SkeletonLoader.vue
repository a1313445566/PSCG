<template>
  <div class="skeleton-loader" :class="{ 'skeleton--pulse': pulse }">
    <!-- 文本骨架 -->
    <div
      v-if="type === 'text'"
      class="skeleton skeleton--text"
      :style="{ width, height, borderRadius }"
    ></div>

    <!-- 圆形骨架 -->
    <div
      v-else-if="type === 'circle'"
      class="skeleton skeleton--circle"
      :style="{ width, height, borderRadius: '50%' }"
    ></div>

    <!-- 矩形骨架 -->
    <div
      v-else-if="type === 'rect'"
      class="skeleton skeleton--rect"
      :style="{ width, height, borderRadius }"
    ></div>

    <!-- 卡片骨架 -->
    <div v-else-if="type === 'card'" class="skeleton-card">
      <div
        class="skeleton skeleton--circle"
        style="width: 80px; height: 80px; margin-bottom: 16px"
      ></div>
      <div
        class="skeleton skeleton--text"
        style="width: 80%; height: 20px; margin-bottom: 12px"
      ></div>
      <div class="skeleton skeleton--text" style="width: 60%; height: 16px"></div>
    </div>

    <!-- 学科卡片骨架 -->
    <div v-else-if="type === 'subject-card'" class="skeleton-subject-card">
      <div
        class="skeleton skeleton--circle"
        style="width: 80px; height: 80px; margin-bottom: 16px"
      ></div>
      <div
        class="skeleton skeleton--text"
        style="width: 80%; height: 24px; margin-bottom: 16px"
      ></div>
      <div
        class="skeleton skeleton--rect"
        style="width: 60%; height: 32px; border-radius: 20px"
      ></div>
    </div>

    <!-- 题目卡片骨架 -->
    <div v-else-if="type === 'question-card'" class="skeleton-question-card">
      <div
        class="skeleton skeleton--text"
        style="width: 100px; height: 20px; margin-bottom: 16px"
      ></div>
      <div
        class="skeleton skeleton--text"
        style="width: 100%; height: 20px; margin-bottom: 8px"
      ></div>
      <div
        class="skeleton skeleton--text"
        style="width: 90%; height: 20px; margin-bottom: 8px"
      ></div>
      <div
        class="skeleton skeleton--text"
        style="width: 95%; height: 20px; margin-bottom: 16px"
      ></div>
      <div
        class="skeleton skeleton--rect"
        style="width: 100%; height: 120px; margin-bottom: 16px"
      ></div>
      <div class="skeleton-options">
        <div
          v-for="i in 4"
          :key="i"
          class="skeleton skeleton--rect"
          style="width: 100%; height: 40px; margin-bottom: 8px; border-radius: 8px"
        ></div>
      </div>
    </div>

    <!-- 排行榜骨架 -->
    <div v-else-if="type === 'leaderboard'" class="skeleton-leaderboard">
      <div
        class="skeleton skeleton--text"
        style="width: 200px; height: 24px; margin-bottom: 20px"
      ></div>
      <div v-for="i in 5" :key="i" class="skeleton-leaderboard-row">
        <div
          class="skeleton skeleton--rect"
          style="width: 30px; height: 30px; border-radius: 4px; margin-right: 12px"
        ></div>
        <div
          class="skeleton skeleton--text"
          style="width: 150px; height: 16px; margin-right: 12px"
        ></div>
        <div
          class="skeleton skeleton--text"
          style="width: 100px; height: 16px; margin-right: 12px"
        ></div>
        <div class="skeleton skeleton--text" style="width: 80px; height: 16px"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  type: {
    type: String,
    default: 'text',
    validator: value => {
      return [
        'text',
        'circle',
        'rect',
        'card',
        'subject-card',
        'question-card',
        'leaderboard'
      ].includes(value)
    }
  },
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '20px'
  },
  borderRadius: {
    type: String,
    default: '4px'
  },
  pulse: {
    type: Boolean,
    default: true
  }
})
</script>

<style scoped lang="scss">
.skeleton-loader {
  display: inline-block;
}

.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton--pulse .skeleton {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-card,
.skeleton-subject-card,
.skeleton-question-card,
.skeleton-leaderboard {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.skeleton-subject-card {
  text-align: center;
  padding: 32px;
}

.skeleton-leaderboard-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.skeleton-options {
  margin-top: 16px;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
