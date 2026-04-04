﻿﻿﻿<template>
  <header class="app-header">
    <!-- 装饰元素 -->
    <span class="decor-element decor-star decor-star--left">⭐</span>
    <span class="decor-element decor-heart">💖</span>
    <span class="decor-element decor-star decor-star--right">🌟</span>
    <span class="decor-element decor-star decor-star--top-left">✨</span>
    <span class="decor-element decor-star decor-star--top-right">✨</span>
    <span class="decor-element decor-star decor-star--bottom-left">🌟</span>
    <span class="decor-element decor-star decor-star--bottom-right">⭐</span>

    <div class="header-content">
      <h1 class="header-title">🎊 {{ interfaceName }} 🎊</h1>
      <p class="header-subtitle">快乐学习 · 智慧闯关 · 勇敢挑战 · 争做小达人</p>
    </div>
  </header>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useSettingsStore } from '../../stores/questionStore'

const settingsStore = useSettingsStore()

// 界面名称
const interfaceName = computed(() => settingsStore.interfaceName)

// 组件挂载时加载设置
onMounted(async () => {
  await settingsStore.loadSettings()
})
</script>

<style scoped lang="scss">
/* CSS 变量已在 src/styles/scss/abstracts/_variables.scss 中统一定义 */

/* 动画效果 */
@keyframes header-float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-10px) rotate(5deg);
  }
}

@keyframes header-twinkle {
  0%,
  100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@keyframes header-pulse {
  0%,
  100% {
    transform: translateX(-50%) scale(1);
  }
  50% {
    transform: translateX(-50%) scale(1.2);
  }
}

/* 3. Header 核心样式（精简+语义化） */
.app-header {
  background: var(--header-gradient);
  padding: 35px 20px;
  text-align: center;
  border-radius: 0 0 30px 30px;
  box-shadow: var(--el-shadow-light);
  position: relative;
  overflow: hidden;
  border-bottom: 8px dashed var(--header-border-color);
  margin: 0;
  width: 100%;
}

/* 4. 装饰元素 */
.decor-element {
  position: absolute;
  font-size: 24px;
  z-index: 10;
}

/* 星星装饰 */
.decor-star {
  animation: header-twinkle 2s ease-in-out infinite;
}

.decor-star--left {
  left: 40px;
  bottom: 20px;
  color: var(--el-color-white);
  animation-delay: 0s;
}

.decor-star--right {
  right: 40px;
  bottom: 20px;
  color: var(--accent-color);
  text-shadow: 0 0 2px var(--el-color-black);
  animation-delay: 0.5s;
}

.decor-star--top-left {
  left: 60px;
  top: 20px;
  color: var(--el-color-white);
  animation-delay: 1s;
}

.decor-star--top-right {
  right: 60px;
  top: 20px;
  color: var(--accent-color);
  text-shadow: 0 0 2px var(--el-color-black);
  animation-delay: 1.5s;
}

.decor-star--bottom-left {
  left: 80px;
  bottom: 10px;
  color: var(--el-color-white);
  animation-delay: 2s;
}

.decor-star--bottom-right {
  right: 80px;
  bottom: 10px;
  color: var(--accent-color);
  text-shadow: 0 0 2px var(--el-color-black);
  animation-delay: 2.5s;
}

/* 爱心装饰 */
.decor-heart {
  left: 50%;
  top: 15px;
  transform: translateX(-50%);
  color: #ff6b6b;
  animation: header-pulse 2s ease-in-out infinite;
}

/* 5. 内容区域 */
.header-content {
  position: relative;
  z-index: 5;
}

.header-title {
  font-size: 40px;
  font-weight: bold;
  color: #ff6b6b;
  margin-bottom: 15px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-family: 'Microsoft YaHei', 微软雅黑, sans-serif;
}

.header-subtitle {
  font-size: 18px;
  color: var(--el-color-white);
  line-height: 1.6;
  letter-spacing: 1px;
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 20px;
  border-radius: var(--el-border-radius-round);
  display: inline-block;
  font-family: 'Microsoft YaHei', 微软雅黑, sans-serif;
}

/* 6. 响应式适配（媒体查询精简） */
@media (max-width: 768px) {
  .app-header {
    padding: 25px 15px;
  }
  .header-title {
    font-size: 28px;
  }
  .header-subtitle {
    font-size: 14px;
    padding: 6px 15px;
  }
  .decor-element {
    font-size: 20px;
  }
}
</style>
