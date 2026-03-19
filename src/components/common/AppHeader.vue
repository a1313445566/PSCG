<template>
  <header class="app-header">
    <!-- 装饰星星：语义化类名 -->
    <span class="decor-star decor-star--left">⭐</span>
    <span class="decor-star decor-star--right">🌟</span>
    
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

<style>
/* 1. CSS 变量抽离（仅保留核心业务变量，通用UI变量按需引用） */
:root {
  /* 业务核心变量 */
  --primary-color: #FF6B6B;
  --accent-color: #FFD166;
  --background-color: #F7FFF7;
  --header-gradient: linear-gradient(90deg, #7DD3F8 0%, #A8E6CF 50%, #FFD88B 100%);
  --header-border-color: #FF9999;
  
  /* 通用UI变量（精简版，仅保留使用到的） */
  --el-color-white: #fff;
  --el-color-black: #000;
  --el-font-size-extra-large: 28px;
  --el-font-size-large: 24px;
  --el-font-size-base: 14px;
  --el-font-size-small: 13px;
  --el-border-radius-round: 20px;
  --el-shadow-light: 0 6px 15px rgba(0, 0, 0, 0.1);
}

/* 3. Header 核心样式（精简+语义化） */
.app-header {
  background: var(--header-gradient) !important;
  padding: 35px 20px !important;
  text-align: center !important;
  border-radius: 0 0 30px 30px !important;
  box-shadow: var(--el-shadow-light) !important;
  position: relative !important;
  overflow: hidden !important;
  border-bottom: 8px dashed var(--header-border-color) !important;
  margin: 0 !important;
  width: 100% !important;
}

/* 4. 装饰元素（星星） */
.decor-star {
  position: absolute !important;
  font-size: 24px !important;
  z-index: 10 !important;
  bottom: 20px !important;
}
.decor-star--left {
  left: 40px !important;
  color: var(--el-color-white) !important;
}
.decor-star--right {
  right: 40px !important;
  color: var(--accent-color) !important;
  text-shadow: 0 0 2px var(--el-color-black) !important;
}

/* 5. 内容区域 */
.header-content {
  position: relative !important;
  z-index: 5 !important;
}
.header-title {
  font-size: var(--el-font-size-extra-large) !important;
  font-weight: bold !important;
  color: var(--el-color-white) !important;
  margin-bottom: 15px !important;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
  font-family: "Microsoft YaHei", 微软雅黑, sans-serif !important;
}
.header-subtitle {
  font-size: var(--el-font-size-base) !important;
  color: var(--el-color-white) !important;
  line-height: 1.6 !important;
  letter-spacing: 1px !important;
  background: rgba(255,255,255,0.2) !important;
  padding: 8px 20px !important;
  border-radius: var(--el-border-radius-round) !important;
  display: inline-block !important;
  font-family: "Microsoft YaHei", 微软雅黑, sans-serif !important;
}

/* 6. 响应式适配（媒体查询精简） */
@media (max-width: 768px) {
  .app-header {
    padding: 25px 15px !important;
  }
  .header-title {
    font-size: var(--el-font-size-large) !important;
  }
  .header-subtitle {
    font-size: var(--el-font-size-small) !important;
    padding: 6px 15px !important;
  }
  .decor-star {
    font-size: 20px !important;
  }
}
</style>