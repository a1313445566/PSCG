<template>
  <div class="setting-card">
    <h3 class="setting-title">界面名称设置</h3>
    <div class="interface-name-setting" style="display: flex; align-items: center; justify-content: flex-start; gap: 15px; padding: 20px;">
      <el-input v-model="localInterfaceName" placeholder="输入界面名称" style="width: 300px;"></el-input>
      <el-button type="primary" @click="updateInterfaceName">更新界面名称</el-button>
      <p style="color: #666; margin: 0;">修改后需要刷新页面才能看到效果</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';

// 定义属性
const props = defineProps({
  interfaceName: {
    type: String,
    default: ''
  }
});

// 定义事件
const emit = defineEmits(['update-interface-name']);

// 本地界面名称
const localInterfaceName = ref(props.interfaceName);

// 监听 props.interfaceName 的变化
watch(() => props.interfaceName, (newValue) => {
  localInterfaceName.value = newValue;
});

// 更新界面名称
const updateInterfaceName = () => {
  if (!localInterfaceName.value.trim()) {
    ElMessage.warning('请输入界面名称');
    return;
  }
  
  emit('update-interface-name', localInterfaceName.value);
};
</script>

<style scoped>
.setting-card {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.setting-title {
  background-color: #f5f7fa;
  padding: 15px 20px;
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
}
</style>