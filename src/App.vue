<template>
  <div class="app">
    <!-- 加载指示器 -->
    <div v-if="isLoading" class="loading-indicator"></div>
    
    <router-view v-slot="{ Component }">
      <component :is="Component" :key="route.fullPath" />
    </router-view>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isLoading = ref(false)

// 监听路由变化，显示/隐藏加载指示器
watch(() => route.path, (newPath, oldPath) => {
  if (newPath !== oldPath) {
    isLoading.value = true
    // 模拟加载时间
    setTimeout(() => {
      isLoading.value = false
    }, 300)
  }
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  background-color: #f5f7fa;
  position: relative;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>