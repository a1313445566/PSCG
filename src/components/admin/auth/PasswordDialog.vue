<template>
  <!-- 密码验证对话框 -->
  <div v-if="visible">
    <el-dialog
      v-model="dialogVisible"
      title="🔐 后台管理登录"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
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
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getApiBaseUrl } from '../../../utils/database';

// 定义属性
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

// 定义事件
const emit = defineEmits(['update:visible', 'login-success']);

// 本地对话框可见性状态
const dialogVisible = ref(props.visible);

// 监听 props.visible 的变化
watch(() => props.visible, (newValue) => {
  dialogVisible.value = newValue;
  if (newValue) {
    checkInitStatus();
  }
});

// 监听本地 dialogVisible 的变化
watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue);
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
    const response = await fetch(`${getApiBaseUrl()}/admin/status`);
    const data = await response.json();
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
  setTimeout(() => {
    try {
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
};

// 处理键盘事件
const handleKeyUp = (event) => {
  if (event.key === 'Enter') {
    handleLogin();
  }
};

// 处理对话框关闭
const handleClose = () => {
  emit('update:visible', false);
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
    const response = await fetch(`${getApiBaseUrl()}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      // 存储 Token 到 sessionStorage
      sessionStorage.setItem('adminToken', data.token);
      sessionStorage.setItem('adminUsername', data.username);
      sessionStorage.setItem('adminAuthenticated', 'true');
      
      ElMessage.success('登录成功');
      emit('login-success', true);
      emit('update:visible', false);
      
      // 清空密码
      loginForm.value.password = '';
    } else {
      ElMessage.error(data.error || '登录失败');
    }
  } catch (error) {
    console.error('登录失败:', error);
    ElMessage.error('登录失败，请检查网络连接');
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
</script>

<style scoped>
.dialog-footer {
  text-align: center;
}
</style>
