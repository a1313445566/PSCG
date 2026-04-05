<template>
  <div class="setting-card" style="margin-bottom: 30px">
    <h3 class="setting-title">数据清理</h3>
    <div style="padding: 20px">
      <!-- 文件清理区域 -->
      <div class="cleanup-section">
        <h4 class="section-title">文件清理</h4>
        <div style="display: flex; gap: 20px; margin-bottom: 15px; align-items: center">
          <el-button type="warning" :loading="cleanupLoading" @click="cleanupOrphanFiles">
            清理孤儿文件
          </el-button>
          <span v-if="orphanStats" class="cleanup-info">
            预计可清理 {{ orphanStats.count }} 个文件，释放 {{ formatSize(orphanStats.size) }}
          </span>
        </div>
        <p class="section-desc">
          孤儿文件是指已上传但未被任何题目引用的图片或音频文件（如编辑题目时上传后未保存的情况）。
        </p>
      </div>

      <el-divider />

      <!-- 数据清理区域 -->
      <div class="cleanup-section">
        <h4 class="section-title">数据清理</h4>
        <div style="display: flex; gap: 20px; margin-bottom: 15px">
          <el-button type="danger" @click="confirmClearAllData">清空所有数据</el-button>
          <el-button type="warning" @click="confirmClearUserRecords">清空用户答题记录</el-button>
          <el-button type="info" @click="confirmClearLeaderboard">清空排行榜数据</el-button>
          <el-button type="danger" @click="clearGrades">清空年级数据</el-button>
          <el-button type="danger" @click="clearClasses">清空班级数据</el-button>
        </div>
        <p class="section-desc">
          数据清理操作将永久删除相应的数据，请谨慎操作。建议在清理前先备份数据。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/utils/api'

// 定义事件
const emit = defineEmits([
  'clear-all-data',
  'clear-user-records',
  'clear-leaderboard',
  'clear-grades',
  'clear-classes'
])

const cleanupLoading = ref(false)
const orphanStats = ref(null)

// 格式化文件大小
const formatSize = sizeKB => {
  if (sizeKB < 1024) return `${sizeKB} KB`
  return `${(sizeKB / 1024).toFixed(2)} MB`
}

// 获取孤儿文件统计（供将来使用）
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

// 清理孤儿文件
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

// 确认清空所有数据
const confirmClearAllData = () => {
  ElMessageBox.confirm('确定要清空所有数据吗？此操作不可恢复，请谨慎操作！', '危险', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'danger'
  })
    .then(() => {
      emit('clear-all-data')
      ElMessage.success('所有数据已清空')
    })
    .catch(() => {
      // 取消清空
    })
}

// 确认清空用户答题记录
const confirmClearUserRecords = () => {
  ElMessageBox.confirm('确定要清空用户答题记录吗？此操作不可恢复，请谨慎操作！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      emit('clear-user-records')
      ElMessage.success('用户答题记录已清空')
    })
    .catch(() => {
      // 取消清空
    })
}

// 确认清空排行榜数据
const confirmClearLeaderboard = () => {
  ElMessageBox.confirm('确定要清空排行榜数据吗？此操作不可恢复，请谨慎操作！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      emit('clear-leaderboard')
      ElMessage.success('排行榜数据已清空')
    })
    .catch(() => {
      // 取消清空
    })
}

// 清空年级数据
const clearGrades = () => {
  ElMessageBox.confirm('确定要清空年级数据吗？此操作不可恢复，请谨慎操作！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      emit('clear-grades')
      ElMessage.success('年级数据已清空')
    })
    .catch(() => {
      // 取消清空
    })
}

// 清空班级数据
const clearClasses = () => {
  ElMessageBox.confirm('确定要清空班级数据吗？此操作不可恢复，请谨慎操作！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      emit('clear-classes')
      ElMessage.success('班级数据已清空')
    })
    .catch(() => {
      // 取消清空
    })
}

onMounted(() => {
  // 可选：页面加载时获取孤儿文件统计
  // getOrphanStats()
})
</script>

<style scoped lang="scss">
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

.cleanup-section {
  margin-bottom: 10px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.section-desc {
  color: #909399;
  font-size: 13px;
  margin: 0;
  line-height: 1.6;
}

.cleanup-info {
  color: #e6a23c;
  font-size: 13px;
}
</style>
