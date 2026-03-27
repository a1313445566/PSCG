<template>
  <div class="batch-analysis">
    <!-- 选择题目区域 -->
    <div class="select-section">
      <div class="section-header">
        <h4>
          <el-icon><Document /></el-icon>
          选择题目
        </h4>
        <div class="header-actions">
          <!-- 分析类型选择 -->
          <el-radio-group v-model="analysisType" size="small" style="margin-right: 12px;">
            <el-radio-button value="deep">
              <el-tooltip content="包含答题数据统计、错误分析、教学建议" placement="top">
                <span>📊 深度分析</span>
              </el-tooltip>
            </el-radio-button>
            <el-radio-button value="simple">
              <el-tooltip content="仅生成题目解析" placement="top">
                <span>📝 简单解析</span>
              </el-tooltip>
            </el-radio-button>
          </el-radio-group>
          
          <el-button 
            type="primary" 
            :disabled="selectedQuestions.length === 0 || processing"
            :loading="processing"
            @click="handleBatchAnalyze"
          >
            <el-icon v-if="!processing"><Check /></el-icon>
            开始分析 ({{ selectedQuestions.length }}题)
          </el-button>
        </div>
      </div>
      
      <!-- 分析类型说明 -->
      <el-alert
        v-if="analysisType === 'deep'"
        type="info"
        :closable="false"
        style="margin-bottom: 15px;"
      >
        <template #title>
          <span style="font-weight: 500;">深度分析将包含：</span>
        </template>
        <div style="margin-top: 5px; font-size: 13px;">
          • 题目答题统计（正确率、错误选项分布）<br>
          • 学生常见错误分析<br>
          • 知识点薄弱环节诊断<br>
          • 针对性教学改进建议
        </div>
      </el-alert>
      
      <!-- 筛选组件 -->
      <AdminFilter
        :filter-items="filterItems"
        v-model="filters"
        :show-tags="true"
        @search="handleSearch"
        @reset="handleReset"
      />
      
      <!-- 题目列表 -->
      <el-table 
        ref="tableRef"
        :data="questionList"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        max-height="400"
        stripe
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="content" label="题目内容" min-width="300">
          <template #default="{ row }">
            <div class="question-content">
              <div class="question-title">{{ getQuestionPreview(row.content, 80) }}</div>
              <!-- 显示选项预览 -->
              <div class="options-preview" v-if="getOptionsPreview(row.options)">
                <span class="options-label">选项:</span>
                <span class="options-text">{{ getOptionsPreview(row.options) }}</span>
              </div>
            </div>
            <div class="question-meta">
              <el-tag size="small" v-if="row.subjectName">{{ row.subjectName }}</el-tag>
              <el-tag size="small" type="warning" v-if="row.difficulty">
                {{ getDifficultyLabel(row.difficulty) }}
              </el-tag>
              <el-tag size="small" type="info" v-if="row.id">ID:{{ row.id }}</el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="subcategoryName" label="题库/知识点" width="150">
          <template #default="{ row }">
            <div class="subcategory-cell">
              <div class="subcategory-name">{{ row.subcategoryName || '-' }}</div>
              <div class="question-type">{{ getQuestionTypeLabel(row.type) }}</div>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @current-change="loadQuestions"
          @size-change="loadQuestions"
        />
      </div>
    </div>

    <!-- 批量分析结果 -->
    <div class="result-section" v-if="batchResults.length > 0">
      <div class="section-header">
        <h4>
          <el-icon><DocumentChecked /></el-icon>
          分析结果
        </h4>
        <el-button @click="handleExportAll">
          <el-icon><Download /></el-icon>
          导出全部
        </el-button>
      </div>
      
      <!-- 汇总统计卡片 -->
      <el-card v-if="summaryStats" class="summary-card" shadow="hover">
        <template #header>
          <div class="summary-header">
            <span>📊 整体数据概览</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-value">{{ summaryStats.totalQuestions }}</div>
              <div class="stat-label">分析题目数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-value">{{ summaryStats.totalAttempts }}</div>
              <div class="stat-label">总答题次数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-value">{{ Number(summaryStats.avgAccuracy || 0).toFixed(1) }}%</div>
              <div class="stat-label">平均正确率</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-value">{{ batchResults.filter(r => !r.error && !r.isSummary).length }}</div>
              <div class="stat-label">成功分析</div>
            </div>
          </el-col>
        </el-row>
      </el-card>
      
      <el-collapse v-model="activeResult">
        <el-collapse-item 
          v-for="(result, index) in batchResults" 
          :key="index"
          :name="index"
          :class="{ 'summary-item': result.isSummary }"
        >
          <template #title>
            <div class="result-title">
              <div class="result-main">
                <span class="result-name">
                  <el-icon v-if="result.isSummary" style="color: #409EFF;"><DataAnalysis /></el-icon>
                  {{ result.isSummary ? '' : `${index + 1}. ` }}{{ result.questionTitle }}
                </span>
                <!-- 显示选项预览 -->
                <div class="result-options" v-if="!result.isSummary && result.options && getOptionsPreview(result.options)">
                  <span class="options-label">选项:</span>
                  <span class="options-text">{{ getOptionsPreview(result.options) }}</span>
                  <el-tag v-if="result.correctAnswer" size="small" type="success" style="margin-left: 8px;">
                    答案: {{ result.correctAnswer }}
                  </el-tag>
                </div>
              </div>
              <div class="result-tags">
                <el-tag 
                  v-if="result.subject"
                  size="small"
                  style="margin-left: 10px"
                >
                  {{ result.subject }}
                </el-tag>
                <el-tag 
                  v-if="result.accuracy !== undefined"
                  :type="getAccuracyTagType(result.accuracy)"
                  size="small"
                  style="margin-left: 5px"
                >
                  正确率 {{ Number(result.accuracy || 0).toFixed(1) }}%
                </el-tag>
                <el-tag 
                  v-if="result.attempts !== undefined"
                  type="info"
                  size="small"
                  style="margin-left: 5px"
                >
                  {{ result.attempts }}次答题
                </el-tag>
                <el-tag 
                  v-if="result.error"
                  type="danger"
                  size="small"
                  style="margin-left: 10px"
                >
                  失败
                </el-tag>
              </div>
            </div>
          </template>
          
          <div v-if="result.error" class="error-message">
            {{ result.error }}
          </div>
          
          <div v-else :ref="el => setResultRef(el, index)" class="markdown-body" v-html="renderMarkdown(result.analysis)"></div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, nextTick, watch } from 'vue'
import { api } from '@/utils/api'
import message from '@/utils/message'
import { renderMarkdown } from '@/utils/markdown'
import { usePagination } from '@/composables/usePagination'
import { useChartRenderer } from '@/composables/useChartRenderer'
import AdminFilter from '../common/AdminFilter.vue'
import '@/styles/markdown.css'
import { Document, Check, DocumentChecked, Download, DataAnalysis } from '@element-plus/icons-vue'

// 从父组件注入数据
const grades = inject('grades', ref([]))
const subjects = inject('subjects', ref([]))

// 图表渲染
const { renderCharts, clearCharts } = useChartRenderer()
const resultRefs = ref(new Map())

// 设置结果容器的 ref
const setResultRef = (el, index) => {
  if (el) resultRefs.value.set(index, el)
}

// 响应式数据
const questionList = ref([])
const selectedQuestions = ref([])
const loading = ref(false)
const processing = ref(false)
const batchResults = ref([])
const activeResult = ref(0)
const tableRef = ref(null)
const subcategories = ref([])
const analysisType = ref('deep')
const summaryStats = ref(null)

// 分页 Hook
const total = ref(0)
const { currentPage, pageSize, getServerParams, reset: resetPagination } = usePagination(20, total)

// 筛选值
const filters = ref({
  subjectId: '',
  subcategoryId: '',
  difficulty: '',
  keyword: ''
})

// 筛选配置
const filterItems = computed(() => [
  { key: 'subjectId', label: '学科', type: 'select', placeholder: '选择学科', width: '140px',
    options: [{ label: '全部', value: '' }, ...subjects.value.map(s => ({ label: s.name, value: s.id }))] },
  { key: 'subcategoryId', label: '题库', type: 'select', placeholder: '选择题库', width: '140px',
    options: [{ label: '全部', value: '' }, ...subcategories.value.map(s => ({ label: s.name, value: s.id }))] },
  { key: 'difficulty', label: '难度', type: 'select', placeholder: '选择难度', width: '120px',
    options: [{ label: '全部', value: '' }, { label: '简单', value: '1' }, { label: '中等', value: '2' }, { label: '困难', value: '3' }] },
  { key: 'keyword', label: '关键词', type: 'input', placeholder: '搜索题目', width: '200px' }
])

const loadSubcategories = async () => {
  try {
    subcategories.value = await api.get('/questions/subcategories') || []
  } catch (error) {
    console.error('[批量分析] 加载题库失败:', error)
  }
}

const loadQuestions = async () => {
  loading.value = true
  try {
    const params = { ...getServerParams() }
    if (filters.value.subjectId) params.subjectId = filters.value.subjectId
    if (filters.value.subcategoryId) params.subcategoryId = filters.value.subcategoryId
    if (filters.value.difficulty) params.difficulty = filters.value.difficulty
    if (filters.value.keyword) params.keyword = filters.value.keyword
    
    const data = await api.get('/questions', params)
    questionList.value = data.data || []
    total.value = data.total || 0
  } catch (error) {
    console.error('[批量分析] 加载题目失败:', error)
    message.error('加载题目失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { resetPagination(); loadQuestions() }
const handleReset = () => { filters.value = { subjectId: '', subcategoryId: '', difficulty: '', keyword: '' }; resetPagination(); loadQuestions() }
const handleSelectionChange = (selection) => { selectedQuestions.value = selection }

// 批量分析
const handleBatchAnalyze = async () => {
  if (selectedQuestions.value.length === 0) return message.warning('请选择要分析的题目')
  if (selectedQuestions.value.length > 50) return message.warning('单次最多分析50道题目')
  
  processing.value = true
  batchResults.value = []
  summaryStats.value = null
  clearCharts()
  resultRefs.value.clear()
  
  try {
    const questionIds = selectedQuestions.value.map(q => q.id)
    const result = await api.post('/ai/batch', {
      questionIds,
      title: `${analysisType.value === 'deep' ? '深度分析' : '简单解析'} - ${selectedQuestions.value.length} 道题目`,
      analysisType: analysisType.value
    })
    
    message.success('批量分析任务已创建，正在处理中...')
    await pollBatchResult(result.batchId)
  } catch (error) {
    console.error('[批量分析] 创建失败:', error)
    message.error('创建批量分析失败')
  } finally {
    processing.value = false
  }
}

// 轮询获取批量分析结果
const pollBatchResult = async (batchId) => {
  const maxPolls = 120
  let pollCount = 0
  
  const poll = async () => {
    try {
      const batch = await api.get(`/ai/batch/${batchId}`)
      
      if (batch.status === 'completed') {
        batchResults.value = batch.results || []
        const summaryResult = batchResults.value.find(r => r.isSummary)
        if (summaryResult?.summaryStats) summaryStats.value = summaryResult.summaryStats
        activeResult.value = 0
        message.success(`批量分析完成，共 ${batchResults.value.length} 条结果`)
        
        // 保存批量分析结果到历史记录
        const batchAnalysisResult = batchResults.value.map(r => r.analysis).join('\n\n' + '='.repeat(50) + '\n\n')
        api.post('/ai/history', {
          question: `${analysisType.value === 'deep' ? '深度分析' : '简单解析'} - ${selectedQuestions.value.length} 道题目`,
          result: batchAnalysisResult,
          filters: filters.value
        }).catch(e => console.error('[AI历史] 批量分析保存失败:', e))
        
        // 渲染图表
        nextTick(() => setTimeout(renderAllCharts, 100))
        return
      } else if (batch.status === 'failed') {
        return message.error('批量分析失败')
      } else if (pollCount < maxPolls) {
        pollCount++
        setTimeout(poll, 10000)
      } else {
        message.warning('批量分析超时，请稍后查看结果')
      }
    } catch (error) {
      console.error('[批量分析] 轮询失败:', error)
    }
  }
  
  await poll()
}

// 渲染所有结果的图表
const renderAllCharts = () => {
  batchResults.value.forEach((result, index) => {
    if (result.error || !result.analysis) return
    const container = resultRefs.value.get(index)
    if (container) renderCharts(container, result.analysis)
  })
}

// 监听展开变化，渲染当前展开项的图表
watch(activeResult, () => {
  nextTick(() => setTimeout(renderAllCharts, 50))
})

const getAccuracyTagType = (accuracy) => {
  if (accuracy >= 80) return 'success'
  if (accuracy >= 60) return 'warning'
  return 'danger'
}

const handleExportAll = () => {
  const content = batchResults.value.map((result, index) => 
    `${index + 1}. ${result.questionTitle}\n\n${result.analysis}\n\n${'='.repeat(50)}\n`
  ).join('\n')
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `批量分析报告_${new Date().toISOString().slice(0, 10)}.txt`
  link.click()
  URL.revokeObjectURL(url)
  message.success('报告导出成功')
}

const getQuestionPreview = (content, maxLength = 50) => {
  if (!content) return ''
  const text = content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const getOptionsPreview = (options) => {
  if (!options) return ''
  let opts = options
  if (typeof options === 'string') {
    try { opts = JSON.parse(options) } catch (e) { return '' }
  }
  if (!Array.isArray(opts) || opts.length === 0) return ''
  return opts.slice(0, 4).map((opt, index) => {
    const label = String.fromCharCode(65 + index)
    const text = (typeof opt === 'string' ? opt : (opt.text || opt.content || '')).replace(/<[^>]+>/g, '').substring(0, 15)
    return `${label}.${text}${text.length >= 15 ? '...' : ''}`
  }).join('  ')
}

const getQuestionTypeLabel = (type) => {
  const labels = { single: '单选题', multiple: '多选题', true_false: '判断题', fill: '填空题', short: '简答题' }
  return labels[type] || '其他'
}

const getDifficultyLabel = (difficulty) => {
  const labels = { 1: '简单', 2: '中等', 3: '困难' }
  return labels[difficulty] || '未知'
}

onMounted(() => {
  loadSubcategories()
  loadQuestions()
})
</script>

<style scoped>
.batch-analysis {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.select-section,
.result-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions {
  display: flex;
  align-items: center;
}

.question-content {
  margin-bottom: 8px;
}

.question-title {
  font-weight: 500;
  margin-bottom: 6px;
  line-height: 1.5;
  color: #303133;
}

.options-preview {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 6px 10px;
  border-radius: 4px;
  line-height: 1.6;
}

.options-label {
  font-weight: 500;
  color: #606266;
  margin-right: 6px;
}

.options-text {
  font-family: monospace;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #909399;
}

.subcategory-cell {
  text-align: center;
}

.subcategory-name {
  font-weight: 500;
  color: #303133;
}

.question-type {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.pagination-wrapper {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

/* 汇总统计卡片 */
.summary-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
}

.summary-header {
  font-weight: 600;
  font-size: 15px;
}

.stat-item {
  text-align: center;
  padding: 10px 0;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 5px;
}

/* 结果标题 */
.result-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex: 1;
  flex-direction: column;
  gap: 6px;
}

.result-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.result-name {
  font-weight: 500;
}

.result-options {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.result-options .options-label {
  font-weight: 500;
  color: #606266;
}

.result-options .options-text {
  font-family: monospace;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
}

.result-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

/* 汇总结果项高亮 */
.summary-item :deep(.el-collapse-item__header) {
  background: #ecf5ff;
  border-left: 4px solid #409EFF;
  padding-left: 16px;
}

.summary-item :deep(.el-collapse-item__header:hover) {
  background: #d9ecff;
}

.error-message {
  color: #F56C6C;
  padding: 10px;
  background: #fef0f0;
  border-radius: 4px;
}

/* 响应式 */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
