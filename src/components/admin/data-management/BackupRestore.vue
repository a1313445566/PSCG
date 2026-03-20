<template>
  <div class="data-management-container">
    <!-- 主标题 -->
    <div class="section-header">
      <h3 class="section-title">数据管理中心</h3>
      <p class="section-description">管理系统数据的备份、恢复和导出功能</p>
    </div>

    <!-- 备份设置卡片 -->
    <el-card class="data-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon class="card-icon"><i class="el-icon-document-copy"></i></el-icon>
          <span class="card-title">备份设置</span>
        </div>
      </template>
      <div class="backup-settings">
        <div class="setting-row">
          <div class="setting-item">
            <label class="setting-label">备份类型</label>
            <el-radio-group v-model="backupType" class="setting-control">
              <el-radio label="full">完整备份</el-radio>
              <el-radio label="incremental">增量备份</el-radio>
            </el-radio-group>
          </div>
          <div class="setting-item">
            <label class="setting-label">文件格式</label>
            <el-radio-group v-model="backupFormat" class="setting-control">
              <el-radio label="db">DB</el-radio>
            </el-radio-group>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-item full-width">
            <label class="setting-label">备份内容</label>
            <el-checkbox-group v-model="selectedDataTypes" class="setting-control">
              <el-checkbox label="questions">题目</el-checkbox>
              <el-checkbox label="users">用户</el-checkbox>
              <el-checkbox label="answers">答题记录</el-checkbox>
              <el-checkbox label="settings">系统设置</el-checkbox>
            </el-checkbox-group>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 操作按钮区域 -->
    <div class="action-grid">
      <!-- 备份操作 -->
      <el-card class="action-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon class="card-icon"><i class="el-icon-download"></i></el-icon>
            <span class="card-title">备份操作</span>
          </div>
        </template>
        <div class="action-buttons">
          <el-button type="primary" icon="el-icon-document-copy" @click="backupData" class="action-btn primary">
            备份数据
          </el-button>
          <el-button type="warning" icon="el-icon-upload2" @click="exportData" class="action-btn warning">
            导出数据
          </el-button>
          <el-button type="info" icon="el-icon-time" @click="showBackupHistory" class="action-btn info">
            备份历史
          </el-button>
        </div>
      </el-card>

      <!-- 恢复操作 -->
      <el-card class="action-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon class="card-icon"><i class="el-icon-upload"></i></el-icon>
            <span class="card-title">恢复操作</span>
          </div>
        </template>
        <div class="action-buttons">
          <el-button type="success" icon="el-icon-refresh" @click="restoreData" class="action-btn success">
            恢复数据
          </el-button>
          <el-upload
            class="upload-btn"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            accept=".db"
            :limit="1"
          >
            <el-button type="info" icon="el-icon-folder-opened">上传备份文件</el-button>
          </el-upload>
          <el-upload
            class="upload-btn"
            action="#"
            :auto-upload="false"
            :on-change="handleVerifyFileChange"
            accept=".db"
            :limit="1"
          >
            <el-button type="info" icon="el-icon-check">验证备份文件</el-button>
          </el-upload>
        </div>
      </el-card>

      <!-- 数据库操作 -->
      <el-card class="action-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon class="card-icon"><i class="el-icon-database"></i></el-icon>
            <span class="card-title">数据库操作</span>
          </div>
        </template>
        <div class="action-buttons">
          <el-button type="info" icon="el-icon-data-line" @click="checkDatabaseHealth" class="action-btn info">
            健康检查
          </el-button>
          <el-button type="info" icon="el-icon-view" @click="checkDatabaseStatus" class="action-btn info">
            数据库状态
          </el-button>
          <el-button type="info" icon="el-icon-s-grid" @click="importLocalData" class="action-btn info">
            导入本地数据
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 备份进度显示 -->
    <div v-if="isBackuping" class="backup-progress">
      <el-card shadow="hover">
        <div class="progress-content">
          <h4 class="progress-title">备份进度</h4>
          <el-progress :percentage="backupProgress" :status="backupStatus" :stroke-width="15"></el-progress>
          <p class="progress-message">{{ backupMessage }}</p>
        </div>
      </el-card>
    </div>

    <!-- 操作提示 -->
    <div class="operation-tips">
      <el-alert
        title="操作提示"
        type="info"
        :closable="false"
        show-icon
      >
        <div class="tips-content">
          <p>• 备份数据：保存当前系统的所有数据，包括题目、用户、答题记录等</p>
          <p>• 恢复数据：将覆盖当前系统的数据，请谨慎操作</p>
          <p>• 导出数据：导出系统数据为JSON文件，用于数据迁移或备份</p>
          <p>• 上传备份：通过备份文件恢复系统数据</p>
        </div>
      </el-alert>
    </div>

    <!-- 备份历史对话框 -->
    <el-dialog
      v-model="backupHistoryVisible"
      title="备份历史"
      width="800px"
      custom-class="backup-history-dialog"
    >
      <div v-if="props.backupHistory.length > 0">
        <el-table :data="props.backupHistory" stripe style="width: 100%">
          <el-table-column prop="id" label="ID" width="80"></el-table-column>
          <el-table-column prop="filename" label="文件名" min-width="200"></el-table-column>
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.type === 'full' ? 'primary' : 'success'">{{ row.type === 'full' ? '完整' : '增量' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="size" label="大小" width="100"></el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="200"></el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="downloadBackup(row.id)">下载</el-button>
              <el-button type="danger" size="small" @click="deleteBackup(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else style="text-align: center; padding: 40px;">
        <el-empty description="暂无备份历史"></el-empty>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, defineProps } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { healthCheck, importLocalData as importLocalDataApi } from '../../../utils/database';

// 定义props
const props = defineProps({
  backupHistory: {
    type: Array,
    default: () => []
  }
});

// 定义事件
const emit = defineEmits(['backup-data', 'restore-data', 'export-data', 'upload-backup', 'download-backup', 'delete-backup', 'get-backup-history', 'verify-backup']);

// 备份设置
const backupType = ref('full'); // full 或 incremental
const backupFormat = ref('json'); // json 或 compressed
const selectedDataTypes = ref(['questions', 'users', 'answers', 'settings']);

// 备份进度
const isBackuping = ref(false);
const backupProgress = ref(0);
const backupStatus = ref('');
const backupMessage = ref('');

// 备份历史
const backupHistoryVisible = ref(false);

// 上传的文件
const uploadedFile = ref(null);

// 备份数据
const backupData = () => {
  ElMessageBox.confirm('确定要备份数据吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    // 开始备份
    isBackuping.value = true;
    backupProgress.value = 0;
    backupStatus.value = '';
    backupMessage.value = '正在准备备份...';
    
    // 模拟备份进度
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      backupProgress.value = progress;
      
      if (progress < 30) {
        backupMessage.value = '正在收集数据...';
      } else if (progress < 60) {
        backupMessage.value = '正在处理数据...';
      } else if (progress < 90) {
        backupMessage.value = '正在生成备份文件...';
      } else {
        backupMessage.value = '备份完成，正在下载...';
      }
      
      if (progress >= 100) {
        clearInterval(interval);
        backupStatus.value = 'success';
        
        // 触发备份事件，传递备份参数
        emit('backup-data', {
          type: backupType.value
        });
        
        // 延迟关闭进度显示
        setTimeout(() => {
          isBackuping.value = false;
        }, 1000);
      }
    }, 300);
  }).catch(() => {
    // 取消备份
  });
};

// 恢复数据
const restoreData = () => {
  if (!uploadedFile.value) {
    ElMessage.error('请先上传备份文件');
    return;
  }
  
  ElMessageBox.confirm('确定要使用上传的文件恢复数据吗？这将覆盖当前系统的所有数据，请谨慎操作！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 显示恢复进度
    isBackuping.value = true;
    backupProgress.value = 0;
    backupStatus.value = '';
    backupMessage.value = '正在准备恢复...';
    
    // 模拟恢复进度
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      backupProgress.value = progress;
      
      if (progress < 30) {
        backupMessage.value = '正在上传备份文件...';
      } else if (progress < 60) {
        backupMessage.value = '正在恢复数据...';
      } else if (progress < 90) {
        backupMessage.value = '正在验证数据...';
      } else {
        backupMessage.value = '恢复完成...';
      }
      
      if (progress >= 100) {
        clearInterval(interval);
        backupStatus.value = 'success';
      }
    }, 300);
    
    // 触发恢复事件
    emit('upload-backup', uploadedFile.value);
    
    // 延迟关闭进度显示
    setTimeout(() => {
      isBackuping.value = false;
    }, 1500);
  }).catch(() => {
    // 取消恢复
  });
};

// 导出数据
const exportData = () => {
  emit('export-data');
};

// 处理文件上传
const handleFileChange = (file) => {
  // 检查文件扩展名
  if (!file.name.endsWith('.db')) {
    ElMessage.error('请上传.db格式的备份文件');
    return;
  }
  
  // 存储上传的文件
  uploadedFile.value = file;
  ElMessage.success('备份文件上传成功，请点击"恢复数据"按钮执行恢复操作');
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

// 显示备份历史
const showBackupHistory = async () => {
  try {
    // 触发获取备份历史事件，更新父组件中的备份历史数据
    await emit('get-backup-history');
  } catch (error) {
    console.error('获取备份历史失败:', error);
  }
  // 直接使用props中的备份历史数据
  backupHistoryVisible.value = true;
};

// 下载备份
const downloadBackup = (backupId) => {
  emit('download-backup', backupId);
};

// 删除备份
const deleteBackup = (backupId) => {
  ElMessageBox.confirm('确定要删除此备份文件吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    emit('delete-backup', backupId);
    // 重新获取备份历史数据
    await emit('get-backup-history');
  }).catch(() => {
    // 取消删除
  });
};

// 处理备份文件验证
const handleVerifyFileChange = (file) => {
  ElMessageBox.confirm('确定要验证此备份文件吗？', '验证确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    emit('verify-backup', file);
  }).catch(() => {
    // 取消验证
  });
};
</script>

<style scoped>
.data-management-container {
  padding: 20px;
}

/* 头部样式 */
.section-header {
  margin-bottom: 30px;
  text-align: center;
}

.section-title {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.section-description {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

/* 卡片样式 */
.data-card {
  margin-bottom: 25px;
  border-radius: 10px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-icon {
  font-size: 18px;
  color: #409eff;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

/* 备份设置样式 */
.backup-settings {
  padding: 10px 0;
}

.setting-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 15px;
}

.setting-item {
  flex: 1;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item.full-width {
  flex: 100%;
  min-width: 100%;
}

.setting-label {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.setting-control {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

/* 操作网格 */
.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.action-card {
  border-radius: 10px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px 0;
}

.action-btn {
  width: 100%;
  justify-content: center;
  padding: 12px;
  font-size: 14px;
}

.upload-btn {
  width: 100%;
}

/* 进度条样式 */
.backup-progress {
  margin-bottom: 30px;
}

.progress-content {
  text-align: center;
  padding: 20px;
}

.progress-title {
  margin-bottom: 20px;
  color: #303133;
  font-size: 16px;
  font-weight: bold;
}

.progress-message {
  margin-top: 15px;
  color: #606266;
  font-size: 14px;
}

/* 操作提示 */
.operation-tips {
  margin-bottom: 20px;
}

.tips-content {
  text-align: left;
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
}

.tips-content p {
  margin: 5px 0;
}

/* 对话框样式 */
.backup-history-dialog {
  border-radius: 10px;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .data-management-container {
    padding: 10px;
  }
  
  .action-grid {
    grid-template-columns: 1fr;
  }
  
  .setting-item {
    min-width: 100%;
  }
  
  .setting-control {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>