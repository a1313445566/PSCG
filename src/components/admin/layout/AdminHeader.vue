<template>
  <div class="admin-header">
    <!-- 左侧：标题和折叠按钮 -->
    <div class="header-left">
      <!-- 移动端菜单按钮 -->
      <el-button
        v-if="isMobile"
        type="primary"
        :icon="Menu"
        circle
        @click="handleMobileMenuClick"
      />
      <h1 class="system-title">{{ systemTitle }}</h1>
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
          <span class="user-name">管理员</span>
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
import { Refresh, House, SwitchButton, User, Lock, ArrowDown, Menu } from '@element-plus/icons-vue'

const props = defineProps({
  systemTitle: {
    type: String,
    default: '题库管理系统'
  }
})

const emit = defineEmits(['refresh', 'logout', 'mobile-menu-click'])

const router = useRouter()
const { breadcrumb } = useAdminLayout()

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

/* 响应式 */
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
