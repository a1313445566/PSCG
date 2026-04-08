<template>
  <div class="admin-header">
    <!-- 左侧：视图切换 + 标题和折叠按钮 -->
    <div class="header-left">
      <!-- 视图切换按钮 -->
      <div
        class="view-switch-container"
        :class="{ 'is-content-management': isContentManagement }"
        @click="handleViewSwitch"
      >
        <div class="view-item view-current">
          {{ isContentManagement ? '内容管理系统' : '答题系统' }}
        </div>
        <div class="view-item view-next">
          <span>{{ isContentManagement ? '答题系统' : '内容管理系统' }}</span>
          <el-icon><Switch /></el-icon>
        </div>
      </div>

      <!-- 移动端菜单按钮 -->
      <el-button
        v-if="isMobile"
        type="primary"
        :icon="Menu"
        circle
        @click="handleMobileMenuClick"
      />
      <h1 class="system-title">{{ isContentManagement ? '内容管理系统' : systemTitle }}</h1>
    </div>

    <!-- 中间：面包屑导航 -->
    <div class="header-center">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item v-for="crumb in breadcrumb" :key="crumb.key">
          {{ crumb.label }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 右侧：快捷操作 -->
    <div class="header-right">
      <el-tooltip content="刷新数据" placement="bottom">
        <el-button
          type="primary"
          :icon="Refresh"
          :loading="refreshing"
          circle
          @click="handleRefresh"
        />
      </el-tooltip>
      <el-tooltip content="返回首页" placement="bottom">
        <el-button type="info" :icon="House" circle @click="handleBackHome" />
      </el-tooltip>
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" class="user-avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <span class="user-name">{{ adminUsername }}</span>
          <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              个人信息
            </el-dropdown-item>
            <el-dropdown-item command="password">
              <el-icon><Lock /></el-icon>
              修改密码
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="passwordForm" label-width="100px" @submit.prevent="handlePasswordSubmit">
        <el-form-item label="旧密码">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入旧密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码（至少6位）"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="passwordLoading" @click="handlePasswordSubmit">
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminLayout } from '../../../composables/useAdminLayout'
import { api } from '../../../utils/api'
import message from '../../../utils/message'
import {
  Refresh,
  House,
  SwitchButton,
  User,
  Lock,
  ArrowDown,
  Menu,
  Setting,
  Switch
} from '@element-plus/icons-vue'

const props = defineProps({
  systemTitle: {
    type: String,
    default: '题库管理系统'
  },
  adminUsername: {
    type: String,
    default: '管理员'
  }
})

const emit = defineEmits(['refresh', 'logout', 'mobile-menu-click'])

const router = useRouter()
const { breadcrumb, isContentManagement, setCurrentView } = useAdminLayout()

// 移动端状态
const isMobile = ref(false)

// 检测屏幕尺寸
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 992
}

// 移动端菜单按钮点击
const handleMobileMenuClick = () => {
  emit('mobile-menu-click')
}

// 刷新状态
const refreshing = ref(false)

// 视图切换
const handleViewSwitch = () => {
  const newView = isContentManagement.value ? 'default' : 'content-management'
  setCurrentView(newView)
  message.success(isContentManagement.value ? '已返回管理后台' : '已切换到内容管理系统')
}

// 密码对话框
const passwordDialogVisible = ref(false)
const passwordLoading = ref(false)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 刷新数据
const handleRefresh = async () => {
  refreshing.value = true
  emit('refresh')
  // 父组件处理刷新，这里延迟关闭刷新状态
  setTimeout(() => {
    refreshing.value = false
  }, 1000)
}

// 返回首页
const handleBackHome = () => {
  router.push('/')
}

// 下拉菜单命令
const handleCommand = command => {
  switch (command) {
    case 'profile':
      // TODO: 打开个人信息对话框
      message.info('个人信息功能开发中')
      break
    case 'password':
      showPasswordDialog()
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 显示修改密码对话框
const showPasswordDialog = () => {
  passwordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  passwordDialogVisible.value = true
}

// 提交修改密码
const handlePasswordSubmit = async () => {
  const { oldPassword, newPassword, confirmPassword } = passwordForm.value

  if (!oldPassword || !newPassword || !confirmPassword) {
    message.warning('请填写所有字段')
    return
  }

  if (newPassword.length < 6) {
    message.warning('新密码长度不能少于6位')
    return
  }

  if (newPassword !== confirmPassword) {
    message.warning('两次输入的新密码不一致')
    return
  }

  passwordLoading.value = true

  try {
    await api.post('/admin/change-password', {
      oldPassword,
      newPassword
    })

    message.success('密码修改成功')
    passwordDialogVisible.value = false
  } catch (error) {
    message.error(error.message || '修改密码失败')
  } finally {
    passwordLoading.value = false
  }
}

// 退出登录
const handleLogout = () => {
  emit('logout')
}

// 生命周期
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped lang="scss">
.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  padding: 0 20px;
  background-color: #fff;
  border-bottom: 1px solid #ebeef5;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.system-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  white-space: nowrap;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.header-center :deep(.el-breadcrumb) {
  font-size: 14px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-right .el-button.is-circle {
  padding: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-avatar {
  background-color: #409eff;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.dropdown-icon {
  font-size: 12px;
  color: #909399;
  transition: transform 0.3s;
}

.user-info:hover .dropdown-icon {
  transform: rotate(180deg);
}

/* TRAE 风格视图切换按钮 - 左上角版本 */
.view-switch-container {
  display: flex;
  align-items: center;
  height: 34px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 1);
  backdrop-filter: blur(10px);
  position: relative;
}

.view-switch-container::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  border: 1.5px solid transparent;
  transition: border-color 0.3s ease;
}

.view-switch-container:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow:
    0 6px 20px rgba(64, 158, 255, 0.18),
    0 3px 9px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}

.view-switch-container:hover::before {
  border-color: rgba(64, 158, 255, 0.3);
}

.view-switch-container:active {
  transform: translateY(0) scale(0.98);
  transition-duration: 0.15s;
}

.view-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 13px;
  height: 100%;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  position: relative;
  z-index: 1;
}

.view-current {
  background: linear-gradient(135deg, #67c23a 0%, #52c41a 50%, #4db82a 100%);
  color: #fff;
  min-width: 82px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.25),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

.view-current::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 0%, transparent 40%);
  pointer-events: none;
}

.view-next {
  background: linear-gradient(135deg, #2d3748 0%, #1f2937 100%);
  color: #cbd5e0;
  gap: 7px;
  padding-right: 14px;
}

.view-next span {
  opacity: 0.85;
  transition: all 0.3s ease;
}

.view-switch-container:hover .view-next span {
  opacity: 1;
  margin-left: 2px;
}

.view-next .el-icon {
  font-size: 13px;
  opacity: 0.65;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3));
}

.view-switch-container:hover .view-next .el-icon {
  opacity: 1;
  transform: translateX(3px) rotate(90deg);
}

.is-content-management .view-current {
  background: linear-gradient(135deg, #409eff 0%, #337ecc 50%, #2979ff 100%);
}

.is-content-management .view-next {
  background: linear-gradient(135deg, #1a202c 0%, #171923 100%);
  color: #a0aec0;
}

.header-left {
  gap: 16px;
}

@media (max-width: 992px) {
  .view-switch-container {
    height: 32px;
  }

  .view-item {
    padding: 0 10px;
    font-size: 12px;
  }

  .view-current {
    min-width: 70px;
  }

  .view-next span {
    display: none;
  }

  .view-next {
    padding: 0 10px;
  }
}
@media (max-width: 768px) {
  .admin-header {
    padding: 0 12px;
  }

  .header-center {
    display: none;
  }

  .system-title {
    font-size: 16px;
  }
}
</style>
