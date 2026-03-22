<template>
  <div class="user-stats">
    <el-table :data="paginatedUserStats" stripe style="width: 100%">
      <el-table-column label="学号" width="80" align="center">
        <template #default="{ row }">
          {{ row.student_id || row.user_id || '未设置' }}
        </template>
      </el-table-column>
      <el-table-column prop="name" label="姓名" width="80" align="center">
        <template #default="{ row }">
          {{ row.name || '未设置' }}
        </template>
      </el-table-column>
      <el-table-column prop="grade" label="年级" width="80" align="center">
        <template #default="{ row }">
          {{ row.grade || '未设置' }}
        </template>
      </el-table-column>
      <el-table-column prop="class" label="班级" width="80" align="center">
        <template #default="{ row }">
          {{ row.class || '未设置' }}
        </template>
      </el-table-column>
      <el-table-column label="答题次数" width="80" align="center">
        <template #default="{ row }">
          {{ row.total_sessions || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="答题总数" width="80" align="center">
        <template #default="{ row }">
          {{ row.total_questions || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="正确数" width="80" align="center">
        <template #default="{ row }">
          {{ row.correct_count || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="积分" width="80" align="center">
        <template #default="{ row }">
          {{ row.points || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="正确率" width="120" align="center">
        <template #default="{ row }">
          <el-progress 
            :percentage="Math.round(row.avg_accuracy || 0)" 
            :color="getProgressColor(row.avg_accuracy)"
          ></el-progress>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" align="center">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="openUserDetailDialog(row)">查看记录</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 排行榜管理分页 -->
    <div class="pagination" style="margin-top: 20px; text-align: right;">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// 定义属性和事件
const props = defineProps({
  userStats: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['open-user-detail']);

// 分页
const currentPage = ref(1);
const pageSize = ref(10);

// 计算总数
const total = computed(() => props.userStats.length);

// 计算分页后的用户统计
const paginatedUserStats = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return props.userStats.slice(start, end);
});

// 打开用户详情对话框
const openUserDetailDialog = (row) => {
  emit('open-user-detail', row, 'userStats');
};

// 获取进度条颜色
const getProgressColor = (accuracy) => {
  if (accuracy >= 80) return '#67c23a';
  if (accuracy >= 60) return '#e6a23c';
  return '#f56c6c';
};

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleCurrentChange = (current) => {
  currentPage.value = current;
};
</script>

<style scoped>
.user-stats {
  margin-bottom: 30px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>