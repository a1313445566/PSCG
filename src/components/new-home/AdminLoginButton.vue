<template>
  <div class="admin-login-button">
    <el-button type="primary" @click="handleLogin">
      <el-icon><User /></el-icon>
      <span>管理员登录</span>
    </el-button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { User } from '@element-plus/icons-vue'

const router = useRouter()

const handleLogin = () => {
  router.push('/admin-login')
}
</script>

<style scoped lang="scss">
.admin-login-button {
  position: fixed;
  top: $spacing-lg;
  right: $spacing-lg;
  z-index: 1000;

  :deep(.el-button) {
    background: $new-primary;
    border-color: $new-primary;
    border-radius: $new-card-radius-sm;
    padding: $spacing-sm $spacing-lg;
    font-size: $font-size-base;
    font-weight: 500;
    box-shadow: $new-shadow-md;
    transition: all 0.3s ease;

    &:hover {
      background: $new-primary-hover;
      border-color: $new-primary-hover;
      box-shadow: $new-shadow-lg;
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }

    .el-icon {
      margin-right: $spacing-xs;
      font-size: $font-size-md;
    }
  }
}

@media (max-width: $breakpoint-md) {
  .admin-login-button {
    top: $spacing-md;
    right: $spacing-md;

    :deep(.el-button) {
      padding: $spacing-xs $spacing-md;
      font-size: $font-size-sm;

      span:not(.el-icon) {
        display: none;
      }

      .el-icon {
        margin-right: 0;
      }
    }
  }
}
</style>
