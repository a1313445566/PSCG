<template>
  <div class="recent-records">
    <el-table :data="paginatedRecentRecords" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="60" align="center"></el-table-column>
      <el-table-column label="学号" width="80" align="center">
        <template #default="{ row }">
          {{ row.student_id || row.user_id || '未设置' }}
        </template>
      </el-table-column>
      <el-table-column prop="user_name" label="姓名" width="80" align="center">
        <template #default="{ row }">
          {{ row.user_name || '未设置' }}
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
      <el-table-column prop="subject_name" label="学科" width="100" align="center"></el-table-column>
      <el-table-column prop="subcategory_name" label="学科题库" width="180" align="center">
        <template #default="{ row }">
          {{ row.subcategory_name || '全部' }}
        </template>
      </el-table-column>
      <el-table-column label="成绩" width="80" align="center">
        <template #default="{ row }">
          {{ row.correct_count }} / {{ row.total_questions }}
        </template>
      </el-table-column>
      <el-table-column label="正确率" width="80" align="center">
        <template #default="{ row }">
          {{ Math.round(row.correct_count / row.total_questions * 100) }}%
        </template>
      </el-table-column>
      <el-table-column label="用时(秒)" width="80" align="center">
        <template #default="{ row }">
          {{ row.time_spent || 0 }}
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="时间" width="140" align="center">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" align="center">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="openUserDetailDialog(row)">查看记录</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 数据分析分页 -->
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
import { formatDate } from '../../../utils/dateUtils';

// 定义属性和事件
const props = defineProps({
  recentRecords: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['open-user-detail']);

// 分页
const currentPage = ref(1);
const pageSize = ref(10);

// 计算总数
const total = computed(() => props.recentRecords.length);

// 计算分页后的最近记录
const paginatedRecentRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return props.recentRecords.slice(start, end);
});

// 打开用户详情对话框
const openUserDetailDialog = (row) => {
  emit('open-user-detail', row, 'recentRecords', row.id);
};

// 格式化日期


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
.recent-records {
  margin-top: 30px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>