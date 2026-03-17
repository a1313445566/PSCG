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
      <el-form :model="passwordForm" label-width="80px" @submit.prevent="verifyPassword">
        <el-form-item label="密码">
          <el-input ref="passwordInputRef" v-model="passwordForm.password" type="password" placeholder="请输入管理密码" show-password @keyup="handleKeyUp"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="verifyPassword">登录</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue';
import { ElMessage } from 'element-plus';

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
});

// 监听本地 dialogVisible 的变化
watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue);
});

// 密码表单
const passwordForm = ref({
  password: ''
});

// 密码输入框引用
const passwordInputRef = ref(null);

// 聚焦密码输入框
const focusPasswordInput = () => {
  setTimeout(() => {
    try {
      if (passwordInputRef.value && passwordInputRef.value.$el) {
        const inputElement = passwordInputRef.value.$el.querySelector('input');
        if (inputElement) {
          inputElement.focus();
        }
      }
    } catch (error) {

    }
  }, 300);
};

// 处理键盘事件
const handleKeyUp = (event) => {
  if (event.key === 'Enter') {
    verifyPassword();
  }
};

// 处理对话框关闭
const handleClose = () => {
  emit('update:visible', false);
};

// 验证密码
const verifyPassword = () => {
  const password = passwordForm.value.password;
  
  // 简单的密码验证，实际项目中应该使用更安全的方式
  if (password === 'admin123') {
    emit('login-success', true);
    emit('update:visible', false);
    passwordForm.value.password = '';
  } else {
    ElMessage.error('密码错误，请重试');
  }
};
</script>

<style scoped>
.dialog-footer {
  text-align: center;
}
</style>