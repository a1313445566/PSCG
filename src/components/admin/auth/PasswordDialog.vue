<template>
  <!-- 密码验证对话框 -->
  <el-dialog
    v-model="dialogVisible"
    title="🔐 后台管理登录"
    width="400px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    :destroy-on-close="true"
    @open="focusPasswordInput"
    @close="handleClose"
  >
      <el-form :model="loginForm" label-width="80px" @submit.prevent="handleLogin">
        <el-form-item label="用户名">
          <el-input 
            ref="usernameInputRef" 
            v-model="loginForm.username" 
            placeholder="请输入用户名"
            @keyup="handleKeyUp"
          ></el-input>
        </el-form-item>
        <el-form-item label="密码">
          <el-input 
            ref="passwordInputRef" 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码" 
            show-password 
            @keyup="handleKeyUp"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="handleLogin" :loading="loading">登录</el-button>
        </span>
      </template>
    </el-dialog>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { api } from '../../../utils/api';

// 定义属性
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

// 定义事件
const emit = defineEmits(['close', 'login-success']);

// 本地对话框可见性状态
const dialogVisible = ref(props.visible);

// 组件挂载状态（用于防止异步操作完成时组件已卸载）
let isComponentMounted = true;
// 存储定时器ID，用于组件卸载时清理
let timeoutIds = [];

// 监听 props.visible 的变化
watch(() => props.visible, (newValue) => {
  dialogVisible.value = newValue;
  if (newValue) {
    checkInitStatus();
  }
});

// 监听本地 dialogVisible 的变化
watch(dialogVisible, (newValue) => {
  if (!newValue) {
    emit('close');
  }
});

// 登录表单
const loginForm = ref({
  username: '',
  password: ''
});

// 加载状态
const loading = ref(false);

// 是否已初始化
const isInitialized = ref(false);

// 输入框引用
const usernameInputRef = ref(null);
const passwordInputRef = ref(null);

// 检查初始化状态
const checkInitStatus = async () => {
  try {
    const data = await api.get('/admin/status');
    isInitialized.value = data.initialized;
    
    if (data.username) {
      loginForm.value.username = data.username;
    }
  } catch (error) {
    console.error('检查状态失败:', error);
  }
};

// 聚焦密码输入框
const focusPasswordInput = () => {
  const timeoutId = setTimeout(() => {
    try {
      // 检查组件是否仍然挂载
      if (!isComponentMounted) return;
      // 如果有用户名，聚焦密码框；否则聚焦用户名框
      const inputRef = loginForm.value.username ? passwordInputRef : usernameInputRef;
      if (inputRef.value && inputRef.value.$el) {
        const inputElement = inputRef.value.$el.querySelector('input');
        if (inputElement) {
          inputElement.focus();
        }
      }
    } catch (error) {
      // 忽略错误
    }
  }, 300);
  timeoutIds.push(timeoutId);
};

// 处理键盘事件
const handleKeyUp = (event) => {
  if (event.key === 'Enter') {
    handleLogin();
  }
};

// 处理对话框关闭
const handleClose = () => {
  dialogVisible.value = false;
};

// 登录处理
const handleLogin = async () => {
  const { username, password } = loginForm.value;

  if (!username || !password) {
    ElMessage.warning('请输入用户名和密码');
    return;
  }

  loading.value = true;

  try {
    const data = await api.post('/admin/login', { username, password });

    if (data.success) {
      // 存储 Token 到 sessionStorage
      sessionStorage.setItem('adminToken', data.token);
      sessionStorage.setItem('adminUsername', data.username);
      sessionStorage.setItem('adminAuthenticated', 'true');

      // 清空密码
      loginForm.value.password = '';

      if (isComponentMounted) {
        ElMessage.success('登录成功');
        // 触发登录成功事件，让父组件设置认证状态
        emit('login-success', true);
        // 直接关闭对话框
        dialogVisible.value = false;
      }
    } else {
      if (isComponentMounted) {
        ElMessage.error(data.error || '登录失败');
      }
    }
  } catch (error) {
    console.error('[PasswordDialog] 登录失败:', error);
    if (isComponentMounted) {
      ElMessage.error(error.message || '登录失败，请检查网络连接');
    }
  } finally {
    loading.value = false;
  }
};

// 组件挂载时检查状态
onMounted(() => {
  if (props.visible) {
    checkInitStatus();
  }
});

// 组件卸载时设置标志并清理定时器
onUnmounted(() => {
  isComponentMounted = false;
  // 清理所有定时器
  timeoutIds.forEach(id => clearTimeout(id));
  timeoutIds = [];
});
</script>

<style scoped>
.dialog-footer {
  text-align: center;
}
</style>
