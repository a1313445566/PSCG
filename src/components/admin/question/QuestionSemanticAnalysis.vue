<template>
  <el-card class="semantic-analysis-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>
          <el-icon><Document /></el-icon>
          题目语义分析
        </span>
      </div>
    </template>

    <!-- 题目选择器 -->
    <div class="question-selector">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="题目ID">
          <el-input
            v-model="searchForm.questionId"
            placeholder="输入题目ID"
            style="width: 150px"
            clearable
          />
        </el-form-item>
        <el-form-item label="学科">
          <el-select
            v-model="searchForm.subjectId"
            placeholder="选择学科"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="subject in subjects"
              :key="subject.id"
              :label="subject.name"
              :value="subject.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="searching" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索题目
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 题目列表 -->
    <div v-if="questionList.length > 0" class="question-list">
      <el-table
        :data="questionList"
        style="width: 100%"
        highlight-current-row
        @row-click="handleSelectQuestion"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="subject" label="学科" width="100" />
        <el-table-column prop="content" label="题目内容" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ row.type === 'single' ? '单选' : '多选' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="difficulty" label="难度" width="80" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :loading="analyzingId === row.id"
              @click.stop="handleAnalyzeQuestion(row.id)"
            >
              {{ getAnalysisStatus(row.id) }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <el-empty v-else-if="!searching" description="请搜索题目进行分析" />

    <!-- 分析结果对话框 -->
    <el-dialog
      v-model="showAnalysisDialog"
      title="题目语义分析结果"
      width="80%"
      @close="closeDialog"
    >
      <div v-if="currentAnalysis" v-loading="loadingAnalysis" class="analysis-content">
        <!-- 内容质量评分 -->
        <div class="quality-score">
          <div class="score-label">内容质量评分</div>
          <div class="score-value">
            <el-progress
              :percentage="currentAnalysis.content_quality_score || 0"
              :color="getScoreColor(currentAnalysis.content_quality_score)"
              :stroke-width="20"
            />
          </div>
        </div>

        <!-- 关键词 -->
        <div v-if="parsedKeywords.length > 0" class="keywords-section">
          <div class="section-title">
            <el-icon><Key /></el-icon>
            关键词
          </div>
          <div class="keywords-container">
            <el-tag
              v-for="(keyword, index) in parsedKeywords"
              :key="index"
              class="keyword-tag"
              type="info"
            >
              {{ keyword }}
            </el-tag>
          </div>
        </div>

        <!-- 自动标签 -->
        <div v-if="parsedAutoTags.length > 0" class="tags-section">
          <div class="section-title">
            <el-icon><CollectionTag /></el-icon>
            自动标签
          </div>
          <div class="tags-container">
            <el-tag
              v-for="(tag, index) in parsedAutoTags"
              :key="index"
              class="auto-tag"
              :type="getTagType(tag)"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>

        <!-- 知识点 -->
        <div v-if="parsedKnowledgePoints.length > 0" class="knowledge-section">
          <div class="section-title">
            <el-icon><Reading /></el-icon>
            知识点
          </div>
          <div class="knowledge-container">
            <div
              v-for="(point, index) in parsedKnowledgePoints"
              :key="index"
              class="knowledge-item"
            >
              <el-icon><Connection /></el-icon>
              {{ point }}
            </div>
          </div>
        </div>

        <!-- 难度因素 -->
        <div v-if="parsedDifficultyFactors" class="difficulty-section">
          <div class="section-title">
            <el-icon><DataAnalysis /></el-icon>
            难度因素分析
          </div>
          <div class="difficulty-grid">
            <div class="difficulty-item">
              <span class="difficulty-label">计算量：</span>
              <el-tag :type="getDifficultyType(parsedDifficultyFactors.calculation_amount)">
                {{ parsedDifficultyFactors.calculation_amount || '未知' }}
              </el-tag>
            </div>
            <div class="difficulty-item">
              <span class="difficulty-label">概念复杂度：</span>
              <el-tag :type="getDifficultyType(parsedDifficultyFactors.concept_complexity)">
                {{ parsedDifficultyFactors.concept_complexity || '未知' }}
              </el-tag>
            </div>
            <div class="difficulty-item">
              <span class="difficulty-label">解题步骤：</span>
              <el-tag :type="getDifficultyType(parsedDifficultyFactors.solution_steps)">
                {{ parsedDifficultyFactors.solution_steps || '未知' }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- AI 建议 -->
        <div v-if="currentAnalysis.ai_suggestion" class="suggestion-section">
          <div class="section-title">
            <el-icon><ChatDotRound /></el-icon>
            AI 建议
          </div>
          <el-alert
            :title="currentAnalysis.ai_suggestion"
            type="info"
            :closable="false"
            show-icon
          />
        </div>

        <!-- 相似题目 -->
        <div v-if="similarQuestions.length > 0" class="similar-section">
          <div class="section-title">
            <el-icon><Connection /></el-icon>
            相似题目推荐
            <el-button
              type="text"
              size="small"
              :loading="loadingSimilar"
              style="margin-left: auto"
              @click="loadSimilarQuestions"
            >
              查找相似题目
            </el-button>
          </div>

          <div class="similar-list">
            <div v-for="question in similarQuestions" :key="question.id" class="similar-item">
              <div class="similar-id">ID: {{ question.id }}</div>
              <div class="similar-content">{{ truncateText(question.content, 100) }}</div>
              <div class="similar-meta">
                <el-tag size="small">{{ question.subject }}</el-tag>
                <el-tag size="small" type="info">
                  {{ question.type === 'single' ? '单选' : '多选' }}
                </el-tag>
                <el-tag size="small" :type="getDifficultyType(question.difficulty)">
                  难度: {{ question.difficulty }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 分析信息 -->
        <div class="analysis-info">
          <el-text type="info" size="small">
            分析版本: {{ currentAnalysis.analysis_version || '1.0' }}
          </el-text>
          <el-text v-if="currentAnalysis.last_analyzed_at" type="info" size="small">
            · 上次分析: {{ formatDate(currentAnalysis.last_analyzed_at) }}
          </el-text>
        </div>
      </div>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/utils/api'
import message from '@/utils/message'
import {
  Document,
  MagicStick,
  Key,
  CollectionTag,
  Reading,
  DataAnalysis,
  ChatDotRound,
  Connection,
  Search
} from '@element-plus/icons-vue'

// 响应式数据
const searching = ref(false)
const analyzingId = ref(null)
const loadingAnalysis = ref(false)
const loadingSimilar = ref(false)
const showAnalysisDialog = ref(false)
const questionList = ref([])
const subjects = ref([])
const currentAnalysis = ref(null)
const similarQuestions = ref([])
const analyzedQuestions = ref(new Set())

// 搜索表单
const searchForm = ref({
  questionId: '',
  subjectId: null
})

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 计算属性：解析关键词
const parsedKeywords = computed(() => {
  if (!currentAnalysis.value?.keywords) return []

  try {
    if (typeof currentAnalysis.value.keywords === 'string') {
      return JSON.parse(currentAnalysis.value.keywords)
    }
    return currentAnalysis.value.keywords
  } catch (error) {
    console.error('[解析关键词失败]', error)
    return []
  }
})

// 计算属性：解析自动标签
const parsedAutoTags = computed(() => {
  if (!currentAnalysis.value?.auto_tags) return []

  try {
    if (typeof currentAnalysis.value.auto_tags === 'string') {
      return JSON.parse(currentAnalysis.value.auto_tags)
    }
    return currentAnalysis.value.auto_tags
  } catch (error) {
    console.error('[解析自动标签失败]', error)
    return []
  }
})

// 计算属性：解析知识点
const parsedKnowledgePoints = computed(() => {
  if (!currentAnalysis.value?.knowledge_points) return []

  try {
    if (typeof currentAnalysis.value.knowledge_points === 'string') {
      return JSON.parse(currentAnalysis.value.knowledge_points)
    }
    return currentAnalysis.value.knowledge_points
  } catch (error) {
    console.error('[解析知识点失败]', error)
    return []
  }
})

// 计算属性：解析难度因素
const parsedDifficultyFactors = computed(() => {
  if (!currentAnalysis.value?.difficulty_factors) return null

  try {
    if (typeof currentAnalysis.value.difficulty_factors === 'string') {
      return JSON.parse(currentAnalysis.value.difficulty_factors)
    }
    return currentAnalysis.value.difficulty_factors
  } catch (error) {
    console.error('[解析难度因素失败]', error)
    return null
  }
})

// 加载学科列表
const loadSubjects = async () => {
  try {
    const result = await api.get('/subjects')
    // API 直接返回数组
    if (Array.isArray(result)) {
      subjects.value = result
    } else if (result.success) {
      subjects.value = result.subjects || []
    }
  } catch (error) {
    console.error('[加载学科失败]', error)
  }
}

// 搜索题目
const handleSearch = async () => {
  searching.value = true

  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }

    if (searchForm.value.questionId) {
      params.id = searchForm.value.questionId
    }
    if (searchForm.value.subjectId) {
      params.subjectId = searchForm.value.subjectId
    }

    const result = await api.get('/questions', params)

    // API 返回格式兼容：{data: [], total, page, limit} 或 {success: true, questions: [], total: 0}
    if (result.data && Array.isArray(result.data)) {
      questionList.value = result.data.map(q => ({
        ...q,
        subject: q.subjectName,
        type: q.type
      }))
      total.value = result.total || 0
    } else if (Array.isArray(result)) {
      questionList.value = result.map(q => ({
        ...q,
        subject: q.subjectName || q.subject
      }))
      total.value = result.length
    } else if (result.success) {
      questionList.value = result.questions || []
      total.value = result.total || 0
    }
  } catch (error) {
    console.error('[搜索题目失败]', error)
    message.error('搜索题目失败')
  } finally {
    searching.value = false
  }
}

// 选择题目
const handleSelectQuestion = row => {
  handleAnalyzeQuestion(row.id)
}

// 分析题目
const handleAnalyzeQuestion = async questionId => {
  analyzingId.value = questionId

  try {
    // 先尝试加载已有的分析结果
    let loadResult
    try {
      loadResult = await api.get(`/question-semantic/analysis/${questionId}`)
    } catch (error) {
      // 404表示没有分析结果，继续进行新的分析
      if (!error.message.includes('404') && !error.message.includes('不存在')) {
        throw error
      }
      loadResult = null
    }

    if (loadResult && loadResult.success && loadResult.analysis) {
      // 已有分析结果
      currentAnalysis.value = loadResult.analysis
      analyzedQuestions.value.add(questionId)
      showAnalysisDialog.value = true
    } else {
      // 开始新的分析
      const analyzeResult = await api.post('/question-semantic/analyze', { questionId })

      if (analyzeResult.success) {
        if (analyzeResult.analysis) {
          // 同步返回结果
          currentAnalysis.value = analyzeResult.analysis
          analyzedQuestions.value.add(questionId)
          showAnalysisDialog.value = true
          message.success('分析完成')
        } else if (analyzeResult.taskId) {
          // 异步任务
          message.info('分析任务已添加到队列，请稍后查看结果')
          analyzedQuestions.value.add(questionId)
        }
      } else {
        message.error(analyzeResult.error || '分析失败')
      }
    }
  } catch (error) {
    console.error('[分析题目失败]', error)
    message.error('分析题目失败')
  } finally {
    analyzingId.value = null
  }
}

// 获取分析状态
const getAnalysisStatus = questionId => {
  return analyzedQuestions.value.has(questionId) ? '查看分析' : '分析'
}

// 加载相似题目
const loadSimilarQuestions = async () => {
  if (!currentAnalysis.value?.question_id) return

  loadingSimilar.value = true

  try {
    const result = await api.get(`/question-semantic/similar/${currentAnalysis.value.question_id}`)

    if (result.success) {
      similarQuestions.value = result.similarQuestions || []
    }
  } catch (error) {
    console.error('[加载相似题目失败]', error)
    message.error('加载相似题目失败')
  } finally {
    loadingSimilar.value = false
  }
}

// 关闭对话框
const closeDialog = () => {
  currentAnalysis.value = null
  similarQuestions.value = []
}

// 工具函数
const getScoreColor = score => {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

const getTagType = tag => {
  if (tag.includes('简单') || tag.includes('基础')) return 'success'
  if (tag.includes('中等') || tag.includes('进阶')) return 'warning'
  if (tag.includes('困难') || tag.includes('挑战')) return 'danger'
  return ''
}

const getDifficultyType = value => {
  if (value === '大' || value === '高' || value === '多') return 'danger'
  if (value === '中') return 'warning'
  return 'success'
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const formatDate = dateStr => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

const handleSizeChange = () => {
  currentPage.value = 1
  handleSearch()
}

const handlePageChange = () => {
  handleSearch()
}

// 初始化
onMounted(() => {
  loadSubjects()
})
</script>

<style scoped>
.semantic-analysis-card {
  margin: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.question-selector {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.search-form {
  margin-bottom: 0;
}

.question-list {
  margin-top: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.analysis-content {
  padding: 10px;
}

.quality-score {
  margin-bottom: 25px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.score-label {
  font-size: 14px;
  margin-bottom: 10px;
}

.score-value {
  font-size: 24px;
  font-weight: bold;
}

.keywords-section,
.tags-section,
.knowledge-section,
.difficulty-section,
.suggestion-section,
.similar-section {
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #303133;
}

.keywords-container,
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-tag,
.auto-tag {
  margin: 0;
}

.knowledge-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.knowledge-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f4f4f5;
  border-radius: 4px;
}

.difficulty-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.difficulty-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background: #f9f9f9;
  border-radius: 4px;
}

.difficulty-label {
  font-weight: 500;
}

.similar-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.similar-item {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 4px;
  border-left: 3px solid #409eff;
  cursor: pointer;
  transition: all 0.3s;
}

.similar-item:hover {
  background: #ecf5ff;
}

.similar-id {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.similar-content {
  margin-bottom: 8px;
  line-height: 1.5;
}

.similar-meta {
  display: flex;
  gap: 8px;
}

.analysis-info {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px dashed #e4e7ed;
  display: flex;
  gap: 10px;
}
</style>
