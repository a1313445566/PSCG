<template>
  <div class="user-stats-view scroll-self-managed">
    <!-- 筛选区域 -->
    <AdminFilter
      :filter-items="filterItems"
      v-model="filters"
      :show-tags="true"
      @search="applyFilters"
      @reset="resetFilters"
    />
    
    <!-- 数据表格 -->
    <div class="table-wrapper">
      <el-table
        :data="paginatedData"
        stripe
        v-loading="loading"
        :header-cell-style="{ backgroundColor: '#f5f7fa', color: '#606266', fontWeight: '600' }"
        @sort-change="handleSortChange"
      >
        <el-table-column label="学号" width="100" align="center" prop="student_id" sortable="custom">
          <template #default="{ row }">
            {{ row.student_id || row.user_id || '未设置' }}
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="100" align="center" sortable="custom">
          <template #default="{ row }">
            {{ row.name || '未设置' }}
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="年级" width="80" align="center" sortable="custom">
          <template #default="{ row }">
            {{ row.grade || '未设置' }}
          </template>
        </el-table-column>
        <el-table-column prop="class" label="班级" width="80" align="center" sortable="custom">
          <template #default="{ row }">
            {{ row.class || '未设置' }}
          </template>
        </el-table-column>
        <el-table-column label="答题次数" width="100" align="center" prop="total_sessions" sortable="custom">
          <template #default="{ row }">
            {{ row.total_sessions || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="答题总数" width="100" align="center" prop="total_questions" sortable="custom">
          <template #default="{ row }">
            {{ row.total_questions || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="正确数" width="100" align="center" prop="correct_count" sortable="custom">
          <template #default="{ row }">
            {{ row.correct_count || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="积分" width="80" align="center" prop="points" sortable="custom">
          <template #default="{ row }">
            {{ row.points || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="正确率" min-width="150" align="center" prop="avg_accuracy" sortable="custom">
          <template #default="{ row }">
            <el-progress 
              :percentage="Math.round(row.avg_accuracy || 0)" 
              :color="getProgressColor(row.avg_accuracy)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openUserDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- 用户详情对话框 -->
    <UserDetailDialog
      v-model:dialogVisible="dialogVisible"
      :selectedUser="selectedUser"
      :currentAnswerRecordId="null"
      dialogSource="userStats"
      :selectedUserRecords="selectedUserRecords"
      :selectedUserQuestionAttempts="[]"
      @show-question-detail="showQuestionDetail"
    />
    
    <!-- 题目详情对话框 -->
    <QuestionDetailDialog
      v-model:dialogVisible="questionDetailVisible"
      :question="selectedQuestion"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import AdminFilter from '../common/AdminFilter.vue'
import UserDetailDialog from '../common/UserDetailDialog.vue'
import QuestionDetailDialog from '../common/QuestionDetailDialog.vue'
import api from '../../../utils/api'
import message from '../../../utils/message'
import { usePagination } from '../../../composables/usePagination'

// 从父组件注入数据
const grades = inject('grades', ref([]))
const classes = inject('classes', ref([]))
const subjects = inject('subjects', ref([]))

// 筛选配置
const filterItems = computed(() => [
  {
    key: 'studentId',
    label: '学号',
    type: 'number',
    placeholder: '输入学号',
    width: '140px'
  },
  {
    key: 'grade',
    label: '年级',
    type: 'select',
    placeholder: '选择年级',
    width: '120px',
    options: [
      { label: '全部', value: '' },
      ...grades.value.map(g => ({ label: `${g.name || g}年级`, value: g.name || g }))
    ]
  },
  {
    key: 'class',
    label: '班级',
    type: 'select',
    placeholder: '选择班级',
    width: '120px',
    options: [
      { label: '全部', value: '' },
      ...classes.value.map(c => ({ label: `${c.name || c}班`, value: c.name || c }))
    ]
  },
  {
    key: 'subject',
    label: '学科',
    type: 'select',
    placeholder: '选择学科',
    width: '140px',
    options: [
      { label: '全部', value: '' },
      ...subjects.value.map(s => ({ label: s.name, value: s.id }))
    ]
  }
])

// 筛选值
const filters = ref({
  studentId: '',
  grade: '',
  class: '',
  subject: ''
})

// 数据状态
const loading = ref(false)
const rawData = ref([])
const total = ref(0)

// 使用分页 Hook（前端分页）
const { currentPage, pageSize, paginate, handleSizeChange, handleCurrentChange, reset: resetPagination } = usePagination(20, total)

// 排序状态
const sortProp = ref('')
const sortOrder = ref('')

// 用户详情对话框
const dialogVisible = ref(false)
const selectedUser = ref(null)
const selectedUserRecords = ref([])

// 题目详情对话框
const questionDetailVisible = ref(false)
const selectedQuestion = ref(null)

// 获取进度条颜色
const getProgressColor = (accuracy) => {
  if (accuracy >= 80) return '#67c23a'
  if (accuracy >= 60) return '#e6a23c'
  return '#f56c6c'
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    
    if (filters.value.studentId) {
      params.append('student_id', filters.value.studentId)
    }
    if (filters.value.grade) {
      params.append('grade', filters.value.grade)
    }
    if (filters.value.class) {
      params.append('class', filters.value.class)
    }
    if (filters.value.subject) {
      params.append('subjectId', filters.value.subject)
    }
    
    const response = await api.get(`/leaderboard/global?${params.toString()}`)
    rawData.value = Array.isArray(response.data) ? response.data : []
    total.value = rawData.value.length
  } catch (error) {
    console.error('加载用户统计数据失败:', error)
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 排序后的数据
const sortedData = computed(() => {
  if (!sortProp.value || !sortOrder.value) {
    return rawData.value
  }
  
  const data = [...rawData.value]
  data.sort((a, b) => {
    const aVal = a[sortProp.value] ?? 0
    const bVal = b[sortProp.value] ?? 0
    
    if (sortOrder.value === 'ascending') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })
  
  return data
})

// 分页后的数据
const paginatedData = computed(() => paginate(sortedData.value))

// 应用筛选
const applyFilters = () => {
  resetPagination()
  loadData()
}

// 重置筛选
const resetFilters = () => {
  filters.value = {
    studentId: '',
    grade: '',
    class: '',
    subject: ''
  }
  resetPagination()
  loadData()
}

// 排序变化
const handleSortChange = ({ prop, order }) => {
  sortProp.value = prop
  sortOrder.value = order
}

// 打开用户详情
const openUserDetail = async (user) => {
  const userId = user.user_id || user.id
  
  try {
    // 加载用户统计数据
    const statsData = await api.get(`/leaderboard/global?limit=1000&id=${userId}`)
    if (statsData && statsData.length > 0) {
      selectedUser.value = statsData[0]
    } else {
      selectedUser.value = user
    }
    
    // 加载用户答题记录
    const recordsData = await api.get(`/answer-records/${userId}`)
    selectedUserRecords.value = Array.isArray(recordsData) ? recordsData : []
    
    dialogVisible.value = true
  } catch (error) {
    console.error('加载用户数据失败:', error)
    selectedUser.value = user
    selectedUserRecords.value = []
    dialogVisible.value = true
  }
}

// 显示题目详情（占位）
const showQuestionDetail = async (row) => {
  console.log('显示题目详情 - 原始数据:', row)
  
  try {
    // 准备题目数据
    let questionData = null
    
    // 如果已经有完整的题目数据
    if (row.content && row.options) {
      questionData = { ...row }
    } else {
      // 否则从数据库加载题目详情
      const questionId = row.question_id || row.questionId || row.id
      if (!questionId) {
        message.error('题目ID不存在')
        return
      }
      
      questionData = await api.get(`/questions/${questionId}`)
      if (!questionData) {
        message.error('加载题目详情失败')
        return
      }
    }
    
    // 解析选项
    let options = []
    if (questionData.options) {
      if (typeof questionData.options === 'string') {
        try {
          options = JSON.parse(questionData.options)
          console.log('解析后的选项:', options)
        } catch (e) {
          console.error('解析选项失败:', e, questionData.options)
          options = [questionData.options] // 如果解析失败，作为单个选项
        }
      } else if (Array.isArray(questionData.options)) {
        options = questionData.options
      }
    }
    
    selectedQuestion.value = {
      ...questionData,
      options,
      // 确保字段名统一
      correctAnswer: questionData.correctAnswer || questionData.correct_answer,
      userAnswer: questionData.userAnswer || questionData.user_answer || row.user_answer,
      isCorrect: questionData.isCorrect || questionData.is_correct || row.is_correct,
      subject_name: questionData.subject_name || row.subject_name,
      subcategory_name: questionData.subcategory_name || row.subcategory_name
    }
    
    console.log('最终题目数据:', selectedQuestion.value)
    questionDetailVisible.value = true
  } catch (error) {
    console.error('加载题目详情失败:', error)
    message.error('加载题目详情失败')
  }
}

// 暴露方法
defineExpose({
  refresh: loadData
})

// 初始化
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.user-stats-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.pagination-container {
  margin-top: 12px;
  display: flex;
  justify-content: center;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  flex-shrink: 0;
}
</style>
