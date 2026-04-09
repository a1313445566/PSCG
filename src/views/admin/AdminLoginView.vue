<template>
  <div class="admin-login">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-icon">
          <el-icon :size="32"><Setting /></el-icon>
        </div>
        <div class="logo-text">
          <h1 class="logo-title">后台管理</h1>
          <p class="logo-subtitle">System Administration</p>
        </div>
      </div>

      <div class="login-form-wrapper">
        <h2 class="form-title">管理员登录</h2>
        <p class="form-subtitle">请输入凭据以访问管理系统</p>

        <el-form
          ref="loginFormRef"
          :model="formData"
          :rules="formRules"
          class="login-form"
          label-position="top"
          @submit.prevent="handleLogin"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="formData.username"
              placeholder="请输入管理员用户名"
              :prefix-icon="User"
              size="large"
              clearable
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="formData.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              size="large"
              clearable
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              native-type="submit"
              :loading="isLoading"
              size="large"
              class="login-btn"
            >
              {{ isLoading ? '登录中...' : '登录' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="login-footer">
        <p class="footer-text">© 2026 PSCG 智能学习系统</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Setting } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { api } from '@/utils/api'

const router = useRouter()
const loginFormRef = ref(null)

const formData = reactive({
  username: '',
  password: ''
})

const formRules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 30, message: '用户名长度在 2 到 30 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 1, max: 30, message: '密码长度在 1 到 30 个字符', trigger: 'blur' }
  ]
})

const isLoading = ref(false)

onMounted(() => {
  if (sessionStorage.getItem('adminAuthenticated') === 'true') {
    router.push('/admin')
  }
})

const handleLogin = async () => {
  try {
    await loginFormRef.value?.validate()
  } catch (error) {
    return
  }

  isLoading.value = true

  try {
    const data = await api.post('/admin/login', {
      username: formData.username,
      password: formData.password
    })

    if (data.success) {
      sessionStorage.setItem('adminToken', data.token)
      sessionStorage.setItem('adminUsername', data.username)
      sessionStorage.setItem('adminAuthenticated', 'true')

      formData.password = ''

      ElMessage.success('登录成功')

      setTimeout(() => {
        router.push('/admin')
      }, 300)
    } else {
      ElMessage.error(data.error || '登录失败')
    }
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error(error.message || '登录失败，请检查网络连接')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.admin-login {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  padding: 16px;
  overflow: hidden;
}

.login-card {
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  animation: cardEnter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.login-header {
  padding: 32px 32px 24px;
  text-align: center;
  background: #ffffff;
}

.logo-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 12px;
  background: #000000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.logo-text {
  text-align: center;
}

.logo-title {
  margin: 0;
  font-size: 22px;
  font-weight: 540;
  color: #000000;
  letter-spacing: -0.22px;
}

.logo-subtitle {
  margin: 4px 0 0;
  font-size: 11px;
  font-weight: 400;
  color: #000000;
  letter-spacing: 0.55px;
  text-transform: uppercase;
}

.login-form-wrapper {
  padding: 24px 32px;
}

.form-title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 540;
  color: #000000;
  letter-spacing: -0.22px;
}

.form-subtitle {
  margin: 0 0 24px;
  font-size: 14px;
  font-weight: 330;
  color: #000000;
  line-height: 1.4;
  letter-spacing: -0.14px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.login-form :deep(.el-form-item__label) {
  font-size: 13px;
  font-weight: 450;
  color: #000000;
  padding-bottom: 6px;
  letter-spacing: -0.13px;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  border: 1px solid #000000;
  box-shadow: none;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: none;
  }

  &.is-focus {
    box-shadow: none;
  }
}

.login-form :deep(.el-input__wrapper.is-focus) {
  outline: dashed 2px #000000;
  outline-offset: 2px;
}

.login-btn {
  width: 100%;
  height: 46px;
  font-size: 15px;
  font-weight: 400;
  background: #000000;
  color: #ffffff;
  border-radius: 50px;
  border: none;
  box-shadow: none;
  transition: all 0.2s ease;
  letter-spacing: -0.15px;

  &:hover {
    transform: none;
    box-shadow: none;
    opacity: 0.8;
  }

  &:active {
    transform: none;
    opacity: 0.9;
  }

  &:focus {
    outline: dashed 2px #000000;
    outline-offset: 2px;
  }
}

.login-footer {
  padding: 16px;
  text-align: center;
  border-top: 1px solid #000000;
}

.footer-text {
  margin: 0;
  font-size: 11px;
  font-weight: 400;
  color: #000000;
  letter-spacing: 0.55px;
}

@media (max-width: 480px) {
  .admin-login {
    padding: 12px;
  }

  .login-card {
    border-radius: 8px;
  }

  .login-header {
    padding: 24px 20px 18px;
  }

  .logo-icon {
    width: 48px;
    height: 48px;
  }

  .logo-title {
    font-size: 20px;
  }

  .login-form-wrapper {
    padding: 18px 20px;
  }

  .form-title {
    font-size: 20px;
  }

  .form-subtitle {
    font-size: 13px;
    margin-bottom: 18px;
  }
}
</style>
