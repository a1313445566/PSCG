<template>
  <div class="setting-card" style="margin-bottom: 30px">
    <h3 class="setting-title">数据清理</h3>
    <div style="padding: 20px">
      <div style="display: flex; gap: 20px; margin-bottom: 30px">
        <el-button type="danger" @click="confirmClearAllData">清空所有数据</el-button>
        <el-button type="warning" @click="confirmClearUserRecords">清空用户答题记录</el-button>
        <el-button type="info" @click="confirmClearLeaderboard">清空排行榜数据</el-button>
        <el-button type="danger" @click="clearGrades">清空年级数据</el-button>
        <el-button type="danger" @click="clearClasses">清空班级数据</el-button>
      </div>
      <p style="color: #666">
        数据清理操作将永久删除相应的数据，请谨慎操作。建议在清理前先备份数据。
      </p>
    </div>
  </div>
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'

// 定义事件
const emit = defineEmits([
  'clear-all-data',
  'clear-user-records',
  'clear-leaderboard',
  'clear-grades',
  'clear-classes'
])

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
