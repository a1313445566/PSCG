<template>
  <div class="data-cleanup-container">
    <div class="cleanup-section">
      <div class="section-header">
        <div class="header-icon file">
          <el-icon><FolderOpened /></el-icon>
        </div>
        <div class="header-content">
          <h3>文件清理</h3>
          <p>清理系统中未使用的孤儿文件，释放存储空间</p>
        </div>
      </div>
      <div class="section-body">
        <div class="cleanup-card">
          <div class="cleanup-info">
            <div class="info-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="info-content">
              <div class="info-title">孤儿文件</div>
              <div class="info-desc">
                孤儿文件是指已上传但未被任何题目引用的图片或音频文件（如编辑题目时上传后未保存的情况）
              </div>
              <div v-if="orphanStats" class="info-stats">
                <el-tag type="warning" effect="dark">
                  预计可清理 {{ orphanStats.count }} 个文件，释放 {{ formatSize(orphanStats.size) }}
                </el-tag>
              </div>
            </div>
          </div>
          <el-button
            type="warning"
            size="large"
            :loading="cleanupLoading"
            @click="cleanupOrphanFiles"
          >
            <el-icon><Delete /></el-icon>
            <span>清理孤儿文件</span>
          </el-button>
        </div>
      </div>
    </div>

    <div class="cleanup-section danger-zone">
      <div class="section-header">
        <div class="header-icon danger">
          <el-icon><WarningFilled /></el-icon>
        </div>
        <div class="header-content">
          <h3>数据清理</h3>
          <p>清理系统数据，此操作不可恢复，请谨慎操作</p>
        </div>
      </div>
      <div class="section-body">
        <div class="warning-banner">
          <el-icon><WarningFilled /></el-icon>
          <div class="warning-content">
            <div class="warning-title">危险操作区域</div>
            <div class="warning-text">以下操作将永久删除相应的数据，建议在清理前先备份数据</div>
          </div>
        </div>

        <div class="cleanup-grid">
          <div class="cleanup-item">
            <div class="item-header">
              <el-icon class="item-icon danger"><DeleteFilled /></el-icon>
              <div class="item-title">清空所有数据</div>
            </div>
            <div class="item-desc">删除系统中的所有数据，包括题目、用户、记录等</div>
            <el-button type="danger" size="large" @click="confirmClearAllData">
              <el-icon><Delete /></el-icon>
              <span>清空所有数据</span>
            </el-button>
          </div>

          <div class="cleanup-item">
            <div class="item-header">
              <el-icon class="item-icon warning"><DocumentRemove /></el-icon>
              <div class="item-title">清空用户答题记录</div>
            </div>
            <div class="item-desc">删除所有用户的答题历史记录和错题本数据</div>
            <el-button type="warning" size="large" @click="confirmClearUserRecords">
              <el-icon><Delete /></el-icon>
              <span>清空答题记录</span>
            </el-button>
          </div>

          <div class="cleanup-item">
            <div class="item-header">
              <el-icon class="item-icon info"><TrendCharts /></el-icon>
              <div class="item-title">清空排行榜数据</div>
            </div>
            <div class="item-desc">删除排行榜相关的所有统计数据</div>
            <el-button type="info" size="large" @click="confirmClearLeaderboard">
              <el-icon><Delete /></el-icon>
              <span>清空排行榜</span>
            </el-button>
          </div>

          <div class="cleanup-item">
            <div class="item-header">
              <el-icon class="item-icon danger"><School /></el-icon>
              <div class="item-title">清空年级数据</div>
            </div>
            <div class="item-desc">删除所有年级信息及关联的班级数据</div>
            <el-button type="danger" size="large" @click="clearGrades">
              <el-icon><Delete /></el-icon>
              <span>清空年级数据</span>
            </el-button>
          </div>

          <div class="cleanup-item">
            <div class="item-header">
              <el-icon class="item-icon danger"><Collection /></el-icon>
              <div class="item-title">清空班级数据</div>
            </div>
            <div class="item-desc">删除所有班级信息，保留年级数据</div>
            <el-button type="danger" size="large" @click="clearClasses">
              <el-icon><Delete /></el-icon>
              <span>清空班级数据</span>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 算术题验证对话框 -->
    <el-dialog
      v-model="verifyDialogVisible"
      :title="dialogTitle"
      width="420px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      class="verify-dialog"
    >
      <div class="verify-content">
        <p class="verify-message">{{ dialogMessage }}</p>

        <div class="math-verify-section">
          <p class="math-title">请完成算术题验证：</p>
          <div class="math-problem-display">{{ mathProblem }}</div>
          <el-input
            v-model="mathAnswer"
            type="number"
            placeholder="请输入答案"
            size="large"
            @keyup.enter="handleVerify"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="verifyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="verifyLoading" @click="handleVerify">
          验证并执行
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/utils/api'
import {
  FolderOpened,
  Document,
  Delete,
  WarningFilled,
  DeleteFilled,
  DocumentRemove,
  TrendCharts,
  School,
  Collection
} from '@element-plus/icons-vue'

const emit = defineEmits([
  'clear-all-data',
  'clear-user-records',
  'clear-leaderboard',
  'clear-grades',
  'clear-classes'
])

const cleanupLoading = ref(false)
const orphanStats = ref(null)

// 算术题验证相关
const verifyDialogVisible = ref(false)
const dialogTitle = ref('')
const dialogMessage = ref('')
const mathProblem = ref('')
const mathAnswer = ref('')
const correctAnswer = ref(0)
const verifyLoading = ref(false)
const currentCallback = ref(null)

// 生成简单算术题
const generateMathProblem = () => {
  const num1 = Math.floor(Math.random() * 20) + 1
  const num2 = Math.floor(Math.random() * 20) + 1
  const operators = ['+', '-']
  const operator = operators[Math.floor(Math.random() * operators.length)]

  mathProblem.value = `${num1} ${operator} ${num2} = ?`

  if (operator === '+') {
    correctAnswer.value = num1 + num2
  } else {
    // 确保结果不为负数
    const max = Math.max(num1, num2)
    const min = Math.min(num1, num2)
    correctAnswer.value = max - min
    mathProblem.value = `${max} - ${min} = ?`
  }

  mathAnswer.value = ''
}

// 显示验证对话框
const showVerifyDialog = (title, message, callback) => {
  dialogTitle.value = title
  dialogMessage.value = message
  currentCallback.value = callback
  generateMathProblem()
  verifyDialogVisible.value = true
}

// 处理验证
const handleVerify = () => {
  verifyLoading.value = true

  setTimeout(() => {
    const userAnswer = parseInt(mathAnswer.value)

    if (userAnswer === correctAnswer.value) {
      ElMessage.success('验证通过！')
      verifyDialogVisible.value = false

      // 执行对应的操作
      if (currentCallback.value) {
        currentCallback.value()
      }
    } else {
      ElMessage.error('答案错误，请重新计算')
      generateMathProblem()
    }

    verifyLoading.value = false
  }, 300)
}

const formatSize = sizeKB => {
  if (sizeKB < 1024) return `${sizeKB} KB`
  return `${(sizeKB / 1024).toFixed(2)} MB`
}

const _getOrphanStats = async () => {
  try {
    const result = await api.get('/upload/orphan-stats')
    if (result.success) {
      orphanStats.value = result
    }
  } catch (error) {
    console.error('获取孤儿文件统计失败:', error)
  }
}

const cleanupOrphanFiles = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清理孤儿文件吗？此操作将删除未被任何题目引用的图片和音频文件，不可恢复！',
      '清理孤儿文件',
      {
        confirmButtonText: '确定清理',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    cleanupLoading.value = true
    const result = await api.post('/upload/cleanup-orphans', { days: 0 })

    if (result.success) {
      ElMessage.success(
        `清理完成！删除了 ${result.deletedCount} 个文件，释放 ${formatSize(result.deletedSize)}`
      )
      orphanStats.value = null
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清理失败: ' + (error.message || '未知错误'))
    }
  } finally {
    cleanupLoading.value = false
  }
}

// 处理确认对话框
const confirmClearAllData = () => {
  ElMessageBox.confirm('确定要清空所有数据吗？此操作不可恢复，请谨慎操作！', '危险', {
    confirmButtonText: '进入验证',
    cancelButtonText: '取消',
    type: 'danger',
    distinguishCancelAndClose: true
  })
    .then(() => {
      showVerifyDialog('危险', '确定要清空所有数据吗？此操作不可恢复，请谨慎操作！', () => {
        emit('clear-all-data')
        ElMessage.success('所有数据已清空')
      })
    })
    .catch(() => {})
}

const confirmClearUserRecords = () => {
  ElMessageBox.confirm('确定要清空用户答题记录吗？此操作不可恢复，请谨慎操作！', '警告', {
    confirmButtonText: '进入验证',
    cancelButtonText: '取消',
    type: 'warning',
    distinguishCancelAndClose: true
  })
    .then(() => {
      showVerifyDialog('警告', '确定要清空用户答题记录吗？此操作不可恢复，请谨慎操作！', () => {
        emit('clear-user-records')
        ElMessage.success('用户答题记录已清空')
      })
    })
    .catch(() => {})
}

const confirmClearLeaderboard = () => {
  ElMessageBox.confirm('确定要清空排行榜数据吗？此操作不可恢复，请谨慎操作！', '警告', {
    confirmButtonText: '进入验证',
    cancelButtonText: '取消',
    type: 'warning',
    distinguishCancelAndClose: true
  })
    .then(() => {
      showVerifyDialog('警告', '确定要清空排行榜数据吗？此操作不可恢复，请谨慎操作！', () => {
        emit('clear-leaderboard')
        ElMessage.success('排行榜数据已清空')
      })
    })
    .catch(() => {})
}

const clearGrades = () => {
  ElMessageBox.confirm('确定要清空年级数据吗？此操作不可恢复，请谨慎操作！', '警告', {
    confirmButtonText: '进入验证',
    cancelButtonText: '取消',
    type: 'warning',
    distinguishCancelAndClose: true
  })
    .then(() => {
      showVerifyDialog('警告', '确定要清空年级数据吗？此操作不可恢复，请谨慎操作！', () => {
        emit('clear-grades')
        ElMessage.success('年级数据已清空')
      })
    })
    .catch(() => {})
}

const clearClasses = () => {
  ElMessageBox.confirm('确定要清空班级数据吗？此操作不可恢复，请谨慎操作！', '警告', {
    confirmButtonText: '进入验证',
    cancelButtonText: '取消',
    type: 'warning',
    distinguishCancelAndClose: true
  })
    .then(() => {
      showVerifyDialog('警告', '确定要清空班级数据吗？此操作不可恢复，请谨慎操作！', () => {
        emit('clear-classes')
        ElMessage.success('班级数据已清空')
      })
    })
    .catch(() => {})
}

onMounted(() => {})
</script>

<style scoped lang="scss">
.data-cleanup-container {
  padding: 24px;
  padding-top: 0;
  background: #f5f7fa;
}

.cleanup-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;

  &.danger-zone {
    border: 2px solid #fde2e2;
  }
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

    &.file {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    &.danger {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
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

.cleanup-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px;
  background: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 8px;

  .cleanup-info {
    display: flex;
    gap: 16px;
    flex: 1;

    .info-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #409eff;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
    }

    .info-content {
      flex: 1;

      .info-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 8px;
      }

      .info-desc {
        font-size: 13px;
        color: #606266;
        line-height: 1.6;
        margin-bottom: 12px;
      }

      .info-stats {
        .el-tag {
          font-size: 13px;
        }
      }
    }
  }
}

.warning-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 8px;
  margin-bottom: 24px;

  .el-icon {
    font-size: 24px;
    color: #f56c6c;
    flex-shrink: 0;
  }

  .warning-content {
    flex: 1;

    .warning-title {
      font-size: 15px;
      font-weight: 600;
      color: #f56c6c;
      margin-bottom: 4px;
    }

    .warning-text {
      font-size: 13px;
      color: #f56c6c;
    }
  }
}

.cleanup-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  align-items: stretch;
}

.cleanup-item {
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;

  &:hover {
    border-color: #409eff;
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .item-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .item-icon {
      font-size: 24px;

      &.danger {
        color: #f56c6c;
      }

      &.warning {
        color: #e6a23c;
      }

      &.info {
        color: #409eff;
      }
    }

    .item-title {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }
  }

  .item-desc {
    font-size: 13px;
    color: #909399;
    line-height: 1.6;
    margin-bottom: 16px;
    flex: 1;
  }

  .el-button {
    width: 100%;
    margin-top: auto;
  }
}

/* 验证对话框样式 */
.verify-dialog {
  .verify-content {
    .verify-message {
      margin: 0 0 16px 0;
      font-size: 14px;
      line-height: 1.6;
      color: #303133;
    }

    .math-verify-section {
      padding: 20px;
      background: #f5f7fa;
      border-radius: 6px;

      .math-title {
        font-weight: 600;
        color: #303133;
        margin: 0 0 12px 0;
        font-size: 14px;
      }

      .math-problem-display {
        font-size: 20px;
        font-weight: 600;
        color: #409eff;
        font-family: monospace;
        padding: 10px 16px;
        background: white;
        border-radius: 4px;
        display: inline-block;
        margin-bottom: 12px;
        border: 1px solid #e4e7ed;
      }

      .el-input {
        width: 100%;
      }
    }
  }
}

@media screen and (max-width: 768px) {
  .data-cleanup-container {
    padding: 16px;
  }

  .cleanup-card {
    flex-direction: column;
    align-items: stretch;

    .el-button {
      width: 100%;
    }
  }

  .cleanup-grid {
    grid-template-columns: 1fr;
  }
}
</style>
