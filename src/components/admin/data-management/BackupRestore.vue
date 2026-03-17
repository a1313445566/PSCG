<template>
  <div class="setting-card" style="margin-bottom: 30px;">
    <h3 class="setting-title">数据备份与恢复</h3>
    <div style="padding: 20px;">
      <div style="display: flex; gap: 20px; margin-bottom: 30px;">
        <el-button type="primary" @click="backupData">备份数据</el-button>
        <el-button type="success" @click="restoreData">恢复数据</el-button>
        <el-button type="warning" @click="exportData">导出数据</el-button>
        <el-upload
          class="upload-restore"
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          accept=".json,.backup"
          :limit="1"
        >
          <el-button type="info">上传备份文件</el-button>
        </el-upload>
      </div>
      <p style="color: #666;">备份数据将保存当前系统的所有数据，包括题目、用户、答题记录等。恢复数据将覆盖当前系统的数据，请谨慎操作。</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 定义事件
const emit = defineEmits(['backup-data', 'restore-data', 'export-data', 'upload-backup']);

// 备份数据
const backupData = () => {
  ElMessageBox.confirm('确定要备份数据吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    emit('backup-data');
    ElMessage.success('数据备份成功');
  }).catch(() => {
    // 取消备份
  });
};

// 恢复数据
const restoreData = () => {
  ElMessageBox.confirm('确定要恢复数据吗？这将覆盖当前系统的所有数据，请谨慎操作！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    emit('restore-data');
    ElMessage.success('数据恢复成功');
  }).catch(() => {
    // 取消恢复
  });
};

// 导出数据
const exportData = () => {
  emit('export-data');
  ElMessage.success('数据导出成功');
};

// 处理文件上传
const handleFileChange = (file) => {
  ElMessageBox.confirm('确定要使用此文件恢复数据吗？这将覆盖当前系统的所有数据，请谨慎操作！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    emit('upload-backup', file);
    ElMessage.success('数据恢复成功');
  }).catch(() => {
    // 取消上传
  });
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