<template>
  <div class="app">
    <!-- 加载指示器 -->
    <div v-if="isLoading" class="loading-indicator"></div>

    <router-view v-slot="{ Component }">
      <component :is="Component" :key="route.fullPath" />
    </router-view>

    <!-- 页脚组件（后台管理页面和登录页面不显示） -->
    <AppFooter v-if="!isAdminPage && !isLoginPage" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import AppFooter from './components/common/AppFooter.vue'
import { useQuestionStore, setAppMountedState } from './stores/questionStore'
import { getCSRFToken } from './utils/csrf'

const route = useRoute()
const isLoading = ref(false)
const questionStore = useQuestionStore()

// 判断是否为后台管理页面或登录页面
const isAdminPage = computed(() => route.path === '/admin')
const isLoginPage = computed(() => route.path === '/login' || route.path === '/admin-login')

// 应用初始化：预加载 CSRF Token
onMounted(async () => {
  try {
    await getCSRFToken()
    console.log('✅ CSRF Token 已初始化')
  } catch (error) {
    console.warn('⚠️ CSRF Token 初始化失败:', error.message)
  }
})

// 监听路由变化，显示/隐藏加载指示器
watch(
  () => route.path,
  async (newPath, oldPath) => {
    if (newPath !== oldPath) {
      isLoading.value = true

      // 如果从admin页面导航到任何其他页面，重新加载数据
      if (oldPath === '/admin' && newPath !== '/admin') {
        await questionStore.loadData()
      }

      isLoading.value = false
    }
  }
)

// 组件卸载时设置全局挂载状态
onUnmounted(() => {
  setAppMountedState(false)
})
</script>

<style scoped lang="scss">
.app {
  min-height: 100vh;
  position: relative;
  background-color: rgb(255, 255, 255);
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
