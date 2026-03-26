<template>
  <div class="data-analysis">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>数据分析</h2>
      <div class="header-actions">
        <el-button type="primary" @click="loadData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button type="success" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出报告
        </el-button>
      </div>
    </div>

    <!-- 筛选组件 - 复用 AdminFilter -->
    <AdminFilter
      :filter-items="filterItems"
      v-model="filters"
      :show-tags="true"
      @search="applyFilters"
      @reset="resetFilters"
    />

    <!-- 数据概览 -->
    <AnalysisOverview :analysis-data="analysisData" />

    <!-- 图表分析 -->
    <AnalysisCharts :analysis-data="analysisData" />

    <!-- 错题分析 -->
    <ErrorAnalysis :analysis-data="analysisData" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { Refresh, Download } from '@element-plus/icons-vue'
import AdminFilter from '../common/AdminFilter.vue'
import AnalysisOverview from './AnalysisOverview.vue'
import AnalysisCharts from './AnalysisCharts.vue'
import ErrorAnalysis from './ErrorAnalysis.vue'
import api from '../../../utils/api'
import message from '../../../utils/message'
import { useLoading } from '../../../composables/useLoading'

// 从父组件注入数据
const grades = inject('grades', ref([]))
const classes = inject('classes', ref([]))
const subjects = inject('subjects', ref([]))

// Hook
const { withLoading, cleanup } = useLoading()

// 子分类数据
const subcategories = ref([])

// 筛选配置 - 传递给 AdminFilter
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
    key: 'subjectId',
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
    key: 'subcategoryIds',
    label: '知识点',
    type: 'select',
    placeholder: '选择知识点',
    width: '200px',
    multiple: true,
    options: [
      { label: '全部', value: '' },
      ...subcategories.value.map(s => ({ label: s.name, value: s.id }))
    ]
  },
  {
    key: 'dateRange',
    label: '时间范围',
    type: 'daterange',
    width: '260px'
  }
])

// 筛选值
const filters = ref({
  studentId: '',
  grade: '',
  class: '',
  subjectId: '',
  subcategoryIds: [],
  dateRange: []
})

// 响应式数据
const analysisData = ref({})

// 加载子分类数据（从学科数据中提取）
const loadSubcategories = async () => {
  try {
    // 获取所有学科（包含子分类）
    const subjectsData = await api.get('/subjects')
    
    // 提取所有子分类
    if (Array.isArray(subjectsData)) {
      const allSubcategories = subjectsData.flatMap(subject => 
        (subject.subcategories || []).map(sub => ({
          id: sub.id,
          name: `${subject.name} - ${sub.name}`,
          subjectId: sub.subjectId,
          subjectName: subject.name
        }))
      )
      subcategories.value = allSubcategories
    }
  } catch (error) {
    console.error('[数据分析] 加载子分类失败:', error)
  }
}

// 加载数据
const loadData = async () => {
  try {
    await withLoading(async () => {
      // 构建查询参数
      const params = {}
      
      if (filters.value.studentId) {
        params.studentId = filters.value.studentId
      }
      if (filters.value.grade) {
        params.grade = filters.value.grade
      }
      if (filters.value.class) {
        params.class = filters.value.class
      }
      if (filters.value.subjectId) {
        params.subjectId = filters.value.subjectId
      }
      if (filters.value.subcategoryIds?.length > 0) {
        params.subcategoryIds = filters.value.subcategoryIds.join(',')
      }
      if (filters.value.dateRange?.length === 2) {
        params.startDate = filters.value.dateRange[0]
        params.endDate = filters.value.dateRange[1]
      }
      
      const result = await api.get('/analysis', params)
      analysisData.value = result
    }, '正在加载分析数据...')
  } catch (error) {
    console.error('[数据分析] 加载失败:', error)
  }
}

// 应用筛选
const applyFilters = () => {
  loadData()
}

// 重置筛选
const resetFilters = () => {
  filters.value = {
    studentId: '',
    grade: '',
    class: '',
    subjectId: '',
    subcategoryIds: [],
    dateRange: []
  }
  loadData()
}

// 导出报告
const handleExport = async () => {
  try {
    const confirmed = await message.confirm(
      '确定要导出当前筛选条件的分析报告吗？',
      '导出确认'
    )
    
    if (!confirmed) return
    
    // 构建查询参数
    const params = new URLSearchParams()
    
    if (filters.value.studentId) {
      params.append('studentId', filters.value.studentId)
    }
    if (filters.value.grade) {
      params.append('grade', filters.value.grade)
    }
    if (filters.value.class) {
      params.append('class', filters.value.class)
    }
    if (filters.value.subjectId) {
      params.append('subjectId', filters.value.subjectId)
    }
    if (filters.value.subcategoryIds?.length > 0) {
      filters.value.subcategoryIds.forEach(id => {
        params.append('subcategoryIds', id)
      })
    }
    if (filters.value.dateRange?.length === 2) {
      params.append('startDate', filters.value.dateRange[0])
      params.append('endDate', filters.value.dateRange[1])
    }
    
    // 打开下载链接
    window.open(`/api/analysis/download?${params.toString()}`)
    
    message.success('报告导出成功')
  } catch (error) {
    // 用户取消确认，无需处理
  }
}

// 生命周期
onMounted(() => {
  loadSubcategories()
  loadData()
})

onUnmounted(cleanup)
</script>

<style scoped>
.data-analysis {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    margin-top: 10px;
  }
}
</style>
