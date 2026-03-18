<template>
  <div class="setting-card" style="margin-bottom: 30px;">
    <h3 class="setting-title">数据备份与恢复</h3>
    <div style="padding: 20px;">
      <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 30px;">
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
        <el-button type="info" @click="checkDatabaseHealth">健康检查</el-button>
        <el-button type="info" @click="importLocalData">导入本地数据</el-button>
        <el-button type="info" @click="checkDatabaseStatus">数据库状态</el-button>
      </div>
      <p style="color: #666;">备份数据将保存当前系统的所有数据，包括题目、用户、答题记录等。恢复数据将覆盖当前系统的数据，请谨慎操作。</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { healthCheck, importLocalData as importLocalDataApi } from '../../../utils/database';

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

// 健康检查
const checkDatabaseHealth = async () => {
  try {
    const result = await healthCheck();
    if (result.status === 'ok') {
      ElMessage.success('数据库健康状态良好');
    } else {
      ElMessage.error(`数据库健康检查失败: ${result.message}`);
    }
  } catch (error) {
    ElMessage.error('健康检查失败，请稍后重试');
  }
};

// 导入本地数据
const importLocalData = () => {
  ElMessageBox.confirm('确定要从本地存储导入数据吗？这将覆盖当前系统的所有数据，请谨慎操作！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const result = await importLocalDataApi();
      if (result.success) {
        ElMessage.success('本地数据导入成功');
      } else {
        ElMessage.error(`导入失败: ${result.error}`);
      }
    } catch (error) {
      ElMessage.error('导入失败，请稍后重试');
    }
  }).catch(() => {
    // 取消导入
  });
};

// 检查数据库状态
const checkDatabaseStatus = async () => {
  try {
    const result = await healthCheck();
    ElMessageBox.alert(
      `<div style="text-align: left;">
        <p><strong>数据库状态:</strong> ${result.status === 'ok' ? '正常' : '异常'}</p>
        <p><strong>时间戳:</strong> ${new Date(result.timestamp).toLocaleString()}</p>
        ${result.message ? `<p><strong>消息:</strong> ${result.message}</p>` : ''}
      </div>`,
      '数据库状态',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确定'
      }
    );
  } catch (error) {
    ElMessage.error('获取数据库状态失败');
  }
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