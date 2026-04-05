<template>
  <div class="database-management">
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon backup-icon">
          <el-icon><DocumentCopy /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">备份类型</div>
          <div class="stat-value">{{ backupType === 'full' ? '完整备份' : '增量备份' }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon format-icon">
          <el-icon><Files /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">文件格式</div>
          <div class="stat-value">{{ backupFormat.toUpperCase() }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon history-icon">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">历史备份</div>
          <div class="stat-value">{{ props.backupHistory.length }} 个</div>
        </div>
      </div>
    </div>

    <div class="main-actions">
      <div class="action-section">
        <div class="section-header">
          <div class="header-icon backup">
            <el-icon><Download /></el-icon>
          </div>
          <div class="header-content">
            <h3>数据备份</h3>
            <p>创建数据库备份文件，保护您的数据安全</p>
          </div>
        </div>
        <div class="section-body">
          <div class="backup-options">
            <div class="option-group">
              <label>备份类型</label>
              <el-radio-group v-model="backupType" size="large">
                <el-radio-button value="full">完整备份</el-radio-button>
              </el-radio-group>
            </div>
            <div class="option-group">
              <label>文件格式</label>
              <el-radio-group v-model="backupFormat" size="large" disabled>
                <el-radio-button value="db">DB 格式</el-radio-button>
              </el-radio-group>
            </div>
          </div>
          <div class="action-buttons-row">
            <el-button type="primary" size="large" :loading="isBackuping" @click="backupData">
              <el-icon><DocumentCopy /></el-icon>
              <span>立即备份</span>
            </el-button>
            <el-button size="large" @click="showBackupHistory">
              <el-icon><Clock /></el-icon>
              <span>查看历史</span>
            </el-button>
          </div>
          <div class="info-box">
            <el-icon><InfoFilled /></el-icon>
            <span>DB 格式将完整导出数据库所有表数据，包括题目、用户、答题记录等</span>
          </div>
        </div>
      </div>

      <div class="action-section">
        <div class="section-header">
          <div class="header-icon restore">
            <el-icon><Upload /></el-icon>
          </div>
          <div class="header-content">
            <h3>数据恢复</h3>
            <p>从备份文件恢复数据，覆盖当前系统数据</p>
          </div>
        </div>
        <div class="section-body">
          <div v-if="!uploadedFile" class="upload-area">
            <el-upload
              action="#"
              :auto-upload="false"
              :on-change="handleFileChange"
              accept=".db"
              :limit="1"
              drag
            >
              <el-icon class="upload-icon"><UploadFilled /></el-icon>
              <div class="upload-text">
                <p>
                  拖拽文件到此处或
                  <em>点击上传</em>
                </p>
                <p class="upload-hint">仅支持 .db 格式的备份文件</p>
              </div>
            </el-upload>
          </div>
          <div v-else class="uploaded-file">
            <div class="file-info">
              <el-icon class="file-icon"><Document /></el-icon>
              <div class="file-details">
                <div class="file-name">{{ uploadedFile.name }}</div>
                <div class="file-size">{{ formatFileSize(uploadedFile.size) }}</div>
              </div>
              <el-button type="danger" size="small" circle @click="uploadedFile = null">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <div class="action-buttons-row">
              <el-button type="success" size="large" @click="restoreData">
                <el-icon><Refresh /></el-icon>
                <span>开始恢复</span>
              </el-button>
              <el-upload
                action="#"
                :auto-upload="false"
                :on-change="handleVerifyFileChange"
                accept=".db"
                :limit="1"
              >
                <el-button size="large">
                  <el-icon><Check /></el-icon>
                  <span>验证文件</span>
                </el-button>
              </el-upload>
            </div>
          </div>
          <div class="warning-box">
            <el-icon><WarningFilled /></el-icon>
            <span>恢复操作将覆盖当前系统数据，请谨慎操作</span>
          </div>
        </div>
      </div>
    </div>

    <div class="tools-section">
      <div class="section-header-simple">
        <h3>数据库工具</h3>
        <p>数据库健康检查和维护工具</p>
      </div>
      <div class="tools-grid">
        <div class="tool-card" @click="checkDatabaseHealth">
          <div class="tool-icon">
            <el-icon><DataLine /></el-icon>
          </div>
          <div class="tool-name">健康检查</div>
          <div class="tool-desc">检查数据库连接和性能</div>
        </div>
        <div class="tool-card" @click="checkDatabaseStatus">
          <div class="tool-icon">
            <el-icon><View /></el-icon>
          </div>
          <div class="tool-name">状态查看</div>
          <div class="tool-desc">查看数据库运行状态</div>
        </div>
        <div class="tool-card" @click="importLocalData">
          <div class="tool-icon">
            <el-icon><Grid /></el-icon>
          </div>
          <div class="tool-name">导入数据</div>
          <div class="tool-desc">从本地存储导入数据</div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="isBackuping"
      title="备份进度"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="progress-dialog">
        <el-progress
          :percentage="backupProgress"
          :status="backupStatus"
          :stroke-width="20"
          :text-inside="true"
        />
        <p class="progress-message">{{ backupMessage }}</p>
      </div>
    </el-dialog>

    <el-dialog
      v-model="backupHistoryVisible"
      title="备份历史"
      width="900px"
      custom-class="backup-history-dialog"
    >
      <div v-if="props.backupHistory.length > 0" class="history-table">
        <el-table :data="props.backupHistory" stripe>
          <el-table-column prop="id" label="ID" width="80" align="center" />
          <el-table-column prop="filename" label="文件名" min-width="200" show-overflow-tooltip />
          <el-table-column prop="type" label="类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row" :type="row.type === 'full' ? 'primary' : 'success'" effect="dark">
                {{ row.type === 'full' ? '完整' : '增量' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="size" label="大小" width="120" align="center" />
          <el-table-column prop="createdAt" label="创建时间" width="180" align="center" />
          <el-table-column label="操作" width="180" align="center" fixed="right">
            <template #default="{ row }">
              <template v-if="row">
                <el-button type="primary" size="small" link @click="downloadBackup(row.id)">
                  <el-icon><Download /></el-icon>
                  下载
                </el-button>
                <el-button type="danger" size="small" link @click="deleteBackup(row.id)">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-empty v-else description="暂无备份历史" :image-size="120" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { healthCheck, importLocalData as importLocalDataApi } from '../../../utils/database'
import {
  DocumentCopy,
  Upload,
  Clock,
  Refresh,
  Check,
  DataLine,
  View,
  Grid,
  Download,
  Files,
  InfoFilled,
  WarningFilled,
  UploadFilled,
  Document,
  Close,
  Delete
} from '@element-plus/icons-vue'

const props = defineProps({
  backupHistory: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'backup-data',
  'restore-data',
  'upload-backup',
  'download-backup',
  'delete-backup',
  'get-backup-history',
  'verify-backup'
])

const backupType = ref('full')
const backupFormat = ref('db')

const isBackuping = ref(false)
const backupProgress = ref(0)
const backupStatus = ref('')
const backupMessage = ref('')

const backupHistoryVisible = ref(false)

const uploadedFile = ref(null)

const formatFileSize = bytes => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const backupData = () => {
  ElMessageBox.confirm('确定要备份数据吗？', '备份确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  })
    .then(() => {
      isBackuping.value = true
      backupProgress.value = 0
      backupStatus.value = ''
      backupMessage.value = '正在准备备份...'

      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        backupProgress.value = progress

        if (progress < 30) {
          backupMessage.value = '正在导出数据库...'
        } else if (progress < 60) {
          backupMessage.value = '正在生成备份文件...'
        } else if (progress < 90) {
          backupMessage.value = '正在压缩数据...'
        } else {
          backupMessage.value = '备份完成，正在下载...'
        }

        if (progress >= 100) {
          clearInterval(interval)
          backupStatus.value = 'success'

          emit('backup-data', {
            type: backupType.value,
            format: backupFormat.value
          })

          setTimeout(() => {
            isBackuping.value = false
          }, 1000)
        }
      }, 300)
    })
    .catch(() => {})
}

const restoreData = () => {
  if (!uploadedFile.value) {
    ElMessage.error('请先上传备份文件')
    return
  }

  ElMessageBox.confirm(
    '确定要使用上传的文件恢复数据吗？这将覆盖当前系统的所有数据，请谨慎操作！',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      isBackuping.value = true
      backupProgress.value = 0
      backupStatus.value = ''
      backupMessage.value = '正在准备恢复...'

      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        backupProgress.value = progress

        if (progress < 30) {
          backupMessage.value = '正在上传备份文件...'
        } else if (progress < 60) {
          backupMessage.value = '正在恢复数据...'
        } else if (progress < 90) {
          backupMessage.value = '正在验证数据...'
        } else {
          backupMessage.value = '恢复完成...'
        }

        if (progress >= 100) {
          clearInterval(interval)
          backupStatus.value = 'success'
        }
      }, 300)

      emit('upload-backup', uploadedFile.value)

      setTimeout(() => {
        isBackuping.value = false
      }, 1500)
    })
    .catch(() => {})
}

const handleFileChange = file => {
  if (!file.name.endsWith('.db')) {
    ElMessage.error('请上传.db格式的备份文件')
    return
  }

  uploadedFile.value = file
  ElMessage.success('备份文件上传成功，请点击"开始恢复"按钮执行恢复操作')
}

const checkDatabaseHealth = async () => {
  try {
    const result = await healthCheck()
    if (result.status === 'healthy') {
      ElMessage.success('数据库连接正常')
    } else {
      ElMessage.error(`数据库健康检查失败: ${result.message}`)
    }
  } catch (error) {
    ElMessage.error('健康检查失败，请稍后重试')
  }
}

const importLocalData = () => {
  ElMessageBox.confirm(
    '确定要从本地存储导入数据吗？这将覆盖当前系统的所有数据，请谨慎操作！',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        const result = await importLocalDataApi()
        if (result.success) {
          ElMessage.success('本地数据导入成功')
        } else {
          ElMessage.error(`导入失败: ${result.error}`)
        }
      } catch (error) {
        ElMessage.error('导入失败，请稍后重试')
      }
    })
    .catch(() => {})
}

const checkDatabaseStatus = async () => {
  try {
    const result = await healthCheck()
    ElMessageBox.alert(
      `<div style="text-align: left;">
        <p><strong>数据库状态:</strong> ${result.status === 'healthy' ? '正常' : '异常'}</p>
        <p><strong>时间戳:</strong> ${new Date(result.timestamp).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
        ${result.message ? `<p><strong>消息:</strong> ${result.message}</p>` : ''}
      </div>`,
      '数据库状态',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确定'
      }
    )
  } catch (error) {
    ElMessage.error('获取数据库状态失败')
  }
}

const showBackupHistory = async () => {
  try {
    await emit('get-backup-history')
  } catch (error) {
    console.error('获取备份历史失败:', error)
  }
  backupHistoryVisible.value = true
}

const downloadBackup = backupId => {
  emit('download-backup', backupId)
}

const deleteBackup = backupId => {
  ElMessageBox.confirm('确定要删除此备份文件吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      emit('delete-backup', backupId)
      await emit('get-backup-history')
    })
    .catch(() => {})
}

const handleVerifyFileChange = file => {
  ElMessageBox.confirm('确定要验证此备份文件吗？', '验证确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  })
    .then(() => {
      emit('verify-backup', file)
    })
    .catch(() => {})
}
</script>

<style scoped lang="scss">
.database-management {
  padding: 24px;
  background: #f5f7fa;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;

  &.backup-icon {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  &.format-icon {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
  }

  &.history-icon {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
  }
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.main-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.action-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  border-bottom: 1px solid #ebeef5;

  .header-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;

    &.backup {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    &.restore {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }
  }

  .header-content {
    flex: 1;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }

    p {
      margin: 4px 0 0;
      font-size: 13px;
      color: #909399;
    }
  }
}

.section-body {
  padding: 24px;
}

.backup-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}

.option-group {
  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #606266;
    margin-bottom: 12px;
  }
}

.action-buttons-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;

  .el-button {
    flex: 1;
  }
}

.info-box,
.warning-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;

  .el-icon {
    font-size: 16px;
    flex-shrink: 0;
  }
}

.info-box {
  background: #ecf5ff;
  color: #409eff;
  border: 1px solid #d9ecff;
}

.warning-box {
  background: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #faecd8;
}

.upload-area {
  margin-bottom: 16px;

  :deep(.el-upload-dragger) {
    border: 2px dashed #d9d9d9;
    border-radius: 8px;
    background: #fafafa;
    transition: all 0.3s ease;

    &:hover {
      border-color: #409eff;
      background: #ecf5ff;
    }
  }

  .upload-icon {
    font-size: 48px;
    color: #c0c4cc;
    margin-bottom: 16px;
  }

  .upload-text {
    p {
      margin: 0;
      color: #606266;
      font-size: 14px;

      em {
        color: #409eff;
        font-style: normal;
      }
    }

    .upload-hint {
      margin-top: 8px !important;
      font-size: 12px !important;
      color: #909399 !important;
    }
  }
}

.uploaded-file {
  .file-info {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #f0f9ff;
    border: 1px solid #b3d8ff;
    border-radius: 8px;
    margin-bottom: 16px;

    .file-icon {
      font-size: 32px;
      color: #409eff;
    }

    .file-details {
      flex: 1;

      .file-name {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 4px;
      }

      .file-size {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

.tools-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-header-simple {
  margin-bottom: 20px;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }

  p {
    margin: 4px 0 0;
    font-size: 13px;
    color: #909399;
  }
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.tool-card {
  padding: 24px 20px;
  min-height: 140px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;

  &:hover {
    border-color: #409eff;
    background: #ecf5ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);

    .tool-icon {
      background: #409eff;
      color: white;
    }
  }

  .tool-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 12px;
    border-radius: 12px;
    background: #f5f7fa;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: #606266;
    transition: all 0.3s ease;
  }

  .tool-name {
    font-size: 15px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 4px;
  }

  .tool-desc {
    font-size: 12px;
    color: #909399;
  }
}

.progress-dialog {
  padding: 20px 0;
  text-align: center;

  .progress-message {
    margin-top: 16px;
    font-size: 14px;
    color: #606266;
  }
}

.history-table {
  :deep(.el-table) {
    border-radius: 8px;
    overflow: hidden;
  }
}

@media screen and (max-width: 768px) {
  .database-management {
    padding: 16px;
  }

  .main-actions {
    grid-template-columns: 1fr;
  }

  .stats-overview {
    grid-template-columns: 1fr;
  }

  .action-buttons-row {
    flex-direction: column;
  }
}
</style>
