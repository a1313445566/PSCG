<template>
  <el-card class="setting-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span class="card-title">界面名称设置</span>
      </div>
    </template>
    <div class="setting-content">
      <el-input v-model="localInterfaceName" placeholder="输入界面名称" style="width: 300px;" />
      <el-button type="primary" @click="updateInterfaceName">更新界面名称</el-button>
      <span class="hint-text">修改后需要刷新页面才能看到效果</span>
    </div>
  </el-card>
</template>

<script setup>
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  interfaceName: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update-interface-name']);

const localInterfaceName = ref(props.interfaceName);

watch(() => props.interfaceName, (newValue) => {
  localInterfaceName.value = newValue;
});

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
  border-radius: 12px !important;
}

.card-header {
  display: flex;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.setting-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.hint-text {
  color: #909399;
  font-size: 13px;
}
</style>
