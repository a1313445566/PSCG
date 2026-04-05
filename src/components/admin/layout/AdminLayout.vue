<template>
  <div class="admin-layout">
    <!-- 密码验证对话框 -->
    <PasswordDialog
      v-if="!isAuthenticated"
      :visible="passwordDialogVisible"
      @close="passwordDialogVisible = false"
      @login-success="handlePasswordVerify"
    />

    <!-- 主布局 -->
    <template v-if="isAuthenticated">
      <!-- 顶部栏 -->
      <AdminHeader
        :system-title="systemTitle"
        @refresh="handleRefresh"
        @logout="handleLogout"
        @mobile-menu-click="handleMobileMenuClick"
      />

      <!-- 主体区域 -->
      <div class="layout-main">
        <!-- 侧边栏 -->
        <AdminSidebar
          ref="sidebarRef"
          @menu-select="handleMenuSelect"
          @mobile-state-change="handleMobileStateChange"
        />

        <!-- 移动端遮罩层 -->
        <div v-if="showSidebarOverlay" class="sidebar-overlay" @click="handleOverlayClick" />

        <!-- 内容区域 -->
        <div class="layout-content">
          <!-- 数据加载中提示 -->
          <div v-if="!isDataReady" class="loading-container">
            <el-icon class="loading-icon"><i class="el-icon-loading"></i></el-icon>
            <p>正在加载数据，请稍候...</p>
          </div>

          <!-- 内容插槽 -->
          <slot v-else></slot>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
  onErrorCaptured,
  provide
} from 'vue'
import { useQuestionStore, useSettingsStore } from '../../../stores/questionStore'
import message from '../../../utils/message'
import { useLoading } from '../../../composables/useLoading'
import AdminSidebar from './AdminSidebar.vue'
import AdminHeader from './AdminHeader.vue'
import PasswordDialog from '../auth/PasswordDialog.vue'

const questionStore = useQuestionStore()
const settingsStore = useSettingsStore()
const { cleanup: cleanupLoading } = useLoading()

// 侧边栏 ref
const sidebarRef = ref(null)

// Props
const props = defineProps({
  systemTitle: {
    type: String,
    default: '题库管理系统'
  },
  subjects: {
    type: Array,
    default: () => []
  }
})

// 提供subjects给子组件
provide(
  'subjects',
  computed(() => props.subjects)
)

// Emits
const emit = defineEmits(['menu-change', 'authenticated'])

// 认证状态
const isAuthenticated = ref(false)
const passwordDialogVisible = ref(true)
const adminUsername = ref('')

// 数据就绪状态
const isDataReady = ref(false)

// 组件挂载状态
let isComponentMounted = true
const timeoutIds = []
const loadErrors = ref([])

// 数据加载锁
let isLoadingData = false

// 密码验证成功
const handlePasswordVerify = isVerified => {
  if (isVerified && isComponentMounted) {
    adminUsername.value = sessionStorage.getItem('adminUsername') || '管理员'
    isAuthenticated.value = true
    passwordDialogVisible.value = false

    // 刷新页面以确保状态正确
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }
}

// 监听认证状态
watch(isAuthenticated, (newValue, oldValue) => {
  if (newValue && !oldValue && !isDataReady.value && isComponentMounted) {
    setTimeout(() => {
      if (!isComponentMounted) return
      loadPageData().catch(error => {
        console.error('[AdminLayout] 加载数据失败:', error)
      })
    }, 100)
  }
})

// 退出登录
const handleLogout = () => {
  isAuthenticated.value = false
  isDataReady.value = false
  passwordDialogVisible.value = true
  adminUsername.value = ''
  sessionStorage.removeItem('adminAuthenticated')
  sessionStorage.removeItem('adminToken')
  sessionStorage.removeItem('adminUsername')
  sessionStorage.removeItem('dataManagementAuthenticated')
}

// 菜单选择
const handleMenuSelect = key => {
  emit('menu-change', key)
  // 移动端点击菜单后自动关闭侧边栏
  if (window.innerWidth <= 992) {
    showSidebarOverlay.value = false
  }
}

// 移动端侧边栏状态
const showSidebarOverlay = ref(false)

// 处理移动端侧边栏状态变化
const handleMobileStateChange = isOpen => {
  showSidebarOverlay.value = isOpen
}

// 关闭移动端侧边栏
const closeMobileSidebar = () => {
  showSidebarOverlay.value = false
  // 调用侧边栏的关闭方法
  if (sidebarRef.value) {
    sidebarRef.value.closeMobileSidebar()
  }
}

// 处理遮罩层点击
const handleOverlayClick = () => {
  closeMobileSidebar()
}

// 处理移动端菜单按钮点击
const handleMobileMenuClick = () => {
  showSidebarOverlay.value = true
  // 调用侧边栏的打开方法
  if (sidebarRef.value) {
    sidebarRef.value.openMobileSidebar()
  }
}

// 刷新数据
const handleRefresh = () => {
  message.info('正在重新加载数据...')
  localStorage.removeItem('coreData')
  localStorage.removeItem('coreDataExpiry')
  loadPageData()
}

// 加载设置
const loadSettings = async () => {
  if (!isComponentMounted) return
  await settingsStore.loadSettings()
}

// 加载页面数据
const loadPageData = async () => {
  if (isLoadingData) return
  if (!isComponentMounted) return

  isLoadingData = true
  loadErrors.value = []
  isDataReady.value = false

  const loadSingleData = async (name, loader) => {
    if (!isComponentMounted) throw new Error('组件已卸载')
    try {
      await loader()
      await nextTick()
      await new Promise(resolve => {
        const timeoutId = setTimeout(() => {
          if (isComponentMounted) resolve()
        }, 50)
        timeoutIds.push(timeoutId)
      })
    } catch (error) {
      loadErrors.value.push(`${name}: ${error.message}`)
    }
  }

  try {
    await loadSingleData('核心数据', () => questionStore.loadData())
    if (!isComponentMounted) return

    await loadSingleData('系统设置', () => loadSettings())
    if (!isComponentMounted) return

    await loadSingleData('题目数据', () => questionStore.loadQuestions({ excludeContent: true }))
    if (!isComponentMounted) return

    await nextTick()
    await new Promise(resolve => {
      const timeoutId = setTimeout(() => {
        if (isComponentMounted) resolve()
      }, 100)
      timeoutIds.push(timeoutId)
    })

    if (!isComponentMounted) return

    if (loadErrors.value.length > 0 && isComponentMounted) {
      message.warning(`部分数据加载失败: ${loadErrors.value.length} 项`)
    }

    isDataReady.value = true
    emit('authenticated', true)
  } catch (error) {
    if (isComponentMounted) {
      message.error('页面数据加载失败,请刷新页面重试')
    }
  } finally {
    isLoadingData = false
  }
}

// 初始化
onMounted(async () => {
  if (sessionStorage.getItem('adminAuthenticated') === 'true') {
    isAuthenticated.value = true
    passwordDialogVisible.value = false
    adminUsername.value = sessionStorage.getItem('adminUsername') || '管理员'

    await nextTick()
    await nextTick()

    if (isComponentMounted) {
      await loadPageData()
    }
  } else {
    passwordDialogVisible.value = true
    isAuthenticated.value = false
  }
})

// 清理
onUnmounted(() => {
  isComponentMounted = false
  cleanupLoading()
  timeoutIds.forEach(id => clearTimeout(id))
  timeoutIds.length = 0
})

// 错误捕获
onErrorCaptured(err => {
  const errorMessage = err?.message || ''
  const isIgnorableError =
    errorMessage.includes("Cannot destructure property 'node' of 'undefined'") ||
    errorMessage.includes("Cannot destructure property 'row' of 'undefined'") ||
    errorMessage.includes("Cannot destructure property 'bum' of") ||
    errorMessage.includes('emitsOptions') ||
    errorMessage.includes('Cannot read properties of undefined') ||
    errorMessage.includes('Cannot destructure property') ||
    errorMessage.includes('is null')

  // 忽略这些错误，不阻止渲染
  if (isIgnorableError) {
    // 静默忽略，不输出日志
    return false
  }

  // 其他错误正常抛出
  console.error('[AdminLayout] 未捕获的错误:', err)
  return true
})
</script>

<style scoped lang="scss">
.admin-layout {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%);
  overflow: hidden;
}

.layout-main {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: calc(100vh - 50px);
}

.layout-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
  background-color: #f5f7fa;
  min-width: 0;
}

/* 需要自己管理滚动的组件使用此类 */
.layout-content :deep(.scroll-self-managed) {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: white;
  margin: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.loading-container .loading-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 16px;
  animation: spin 1s linear infinite;
}

.loading-container p {
  font-size: 16px;
  color: #606266;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .layout-content {
    padding: 12px;
  }
}

/* 侧边栏遮罩层 */
.sidebar-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;

  @media (max-width: 992px) {
    display: block;
  }
}
</style>
