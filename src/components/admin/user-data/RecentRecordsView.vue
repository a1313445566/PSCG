<template>
  <div class="recent-records-view scroll-self-managed">
    <!-- 筛选区域 -->
    <AdminFilter
      v-model="filters"
      :filter-items="filterItems"
      :show-tags="true"
      @search="applyFilters"
      @reset="resetFilters"
    />

    <!-- 数据表格 -->
    <div class="table-wrapper">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        :header-cell-style="{ backgroundColor: '#f5f7fa', color: '#606266', fontWeight: '600' }"
        @sort-change="handleSortChange"
      >
        <el-table-column
          label="学号"
          width="100"
          align="center"
          prop="student_id"
          sortable="custom"
        >
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
        <el-table-column label="学科" width="100" align="center">
          <template #default="{ row }">
            {{ row.subject_name || '未知' }}
          </template>
        </el-table-column>
        <el-table-column
          label="答题数"
          width="80"
          align="center"
          prop="total_questions"
          sortable="custom"
        >
          <template #default="{ row }">
            {{ row.total_questions || 0 }}
          </template>
        </el-table-column>
        <el-table-column
          label="正确数"
          width="80"
          align="center"
          prop="correct_count"
          sortable="custom"
        >
          <template #default="{ row }">
            {{ row.correct_count || 0 }}
          </template>
        </el-table-column>
        <el-table-column
          label="正确率"
          min-width="120"
          align="center"
          prop="accuracy"
          sortable="custom"
        >
          <template #default="{ row }">
            <el-progress
              :percentage="getAccuracy(row)"
              :color="getProgressColor(getAccuracy(row))"
            />
          </template>
        </el-table-column>
        <el-table-column
          label="答题时间"
          width="160"
          align="center"
          prop="created_at"
          sortable="custom"
        >
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
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
      v-model:dialog-visible="dialogVisible"
      :selected-user="selectedUser"
      :current-answer-record-id="selectedAnswerRecordId"
      dialog-source="recentRecords"
      :selected-user-records="[]"
      :selected-user-question-attempts="selectedUserQuestionAttempts"
      @show-question-detail="showQuestionDetail"
    />

    <!-- 题目详情对话框 -->
    <QuestionDetailDialog
      v-model:dialog-visible="questionDetailVisible"
      :question="selectedQuestion"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, watch } from 'vue'
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
  },
  {
    key: 'timeRange',
    label: '时间范围',
    type: 'select',
    placeholder: '选择时间',
    width: '120px',
    options: [
      { label: '全部', value: '' },
      { label: '今日', value: 'today' },
      { label: '近一周', value: 'week' },
      { label: '近一月', value: 'month' }
    ]
  }
])

// 筛选值
const filters = ref({
  studentId: '',
  grade: '',
  class: '',
  subject: '',
  timeRange: ''
})

// 数据状态
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

// 使用分页 Hook（服务端分页）
const {
  currentPage,
  pageSize,
  getServerParams,
  handleSizeChange,
  handleCurrentChange,
  reset: resetPagination
} = usePagination(20, total)

// 排序状态
const sortProp = ref('')
const sortOrder = ref('')

// 用户详情对话框
const dialogVisible = ref(false)
const selectedUser = ref(null)
const selectedAnswerRecordId = ref(null)
const selectedUserQuestionAttempts = ref([])

// 题目详情对话框
const questionDetailVisible = ref(false)
const selectedQuestion = ref(null)

// 计算正确率
const getAccuracy = row => {
  const total = row.total_questions || 0
  const correct = row.correct_count || 0
  if (total === 0) return 0
  return Math.round((correct / total) * 100)
}

// 获取进度条颜色
const getProgressColor = accuracy => {
  if (accuracy >= 80) return '#67c23a'
  if (accuracy >= 60) return '#e6a23c'
  return '#f56c6c'
}

// 格式化时间
const formatTime = time => {
  if (!time) return '未知'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 加载数据（服务端分页）
const loadData = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    const { page, limit } = getServerParams()

    params.append('page', page)
    params.append('limit', limit)

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

    // 时间范围处理
    if (filters.value.timeRange) {
      const now = new Date()
      let startDate, endDate

      switch (filters.value.timeRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          endDate = new Date()
          break
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          endDate = new Date()
          break
      }

      if (startDate && endDate) {
        params.append('startDate', startDate.toISOString().slice(0, 10))
        params.append('endDate', endDate.toISOString().slice(0, 10))
      }
    }

    // 排序参数
    if (sortProp.value) {
      params.append('sortBy', sortProp.value)
      params.append('sortOrder', sortOrder.value || 'DESC')
    }

    const response = await api.get(`/answer-records/all?${params.toString()}`)
    tableData.value = response.data || []
    total.value = response.total || 0
  } catch (error) {
    console.error('加载答题记录失败:', error)
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 监听分页变化重新加载
watch([currentPage, pageSize], () => {
  loadData()
})

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
    subject: '',
    timeRange: ''
  }
  sortProp.value = ''
  sortOrder.value = ''
  resetPagination()
  loadData()
}

// 排序变化
const handleSortChange = ({ prop, order }) => {
  sortProp.value = prop
  sortOrder.value = order === 'ascending' ? 'ASC' : order === 'descending' ? 'DESC' : ''
  loadData()
}

// 打开用户详情
const openUserDetail = async row => {
  const userId = row.user_id || row.id

  try {
    // 加载用户统计数据
    const statsData = await api.get(`/leaderboard/global?limit=1000&id=${userId}`)
    if (statsData && statsData.data && statsData.data.length > 0) {
      selectedUser.value = statsData.data[0]
    } else {
      selectedUser.value = {
        id: row.user_id,
        student_id: row.student_id,
        name: row.name,
        grade: row.grade,
        class: row.class
      }
    }

    selectedAnswerRecordId.value = row.id

    // 加载做题记录
    const attemptsData = await api.get(
      `/answer-records/question-attempts/${userId}?answerRecordId=${row.id}`
    )
    if (attemptsData) {
      selectedUserQuestionAttempts.value = Array.isArray(attemptsData) ? attemptsData : []
    } else {
      // 尝试加载所有做题记录然后筛选
      const allAttemptsData = await api.get(`/answer-records/question-attempts/${userId}`)
      if (allAttemptsData) {
        selectedUserQuestionAttempts.value = (
          Array.isArray(allAttemptsData) ? allAttemptsData : []
        ).filter(attempt => {
          return String(attempt.answer_record_id) === String(row.id)
        })
      }
    }

    dialogVisible.value = true
  } catch (error) {
    console.error('加载用户数据失败:', error)
    selectedUser.value = {
      id: row.user_id,
      student_id: row.student_id,
      name: row.name,
      grade: row.grade,
      class: row.class
    }
    selectedUserQuestionAttempts.value = []
    dialogVisible.value = true
  }
}

// 显示题目详情
const showQuestionDetail = async row => {
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

<style scoped lang="scss">
.recent-records-view {
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
  overflow: auto;
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
