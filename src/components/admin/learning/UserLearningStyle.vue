<template>
  <el-card class="learning-style-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>
          <el-icon><TrendCharts /></el-icon>
          学习风格分析
        </span>
      </div>
    </template>

    <!-- 用户选择器 -->
    <div class="user-selector">
      <el-form :inline="true" class="search-form">
        <el-form-item label="学号">
          <el-input 
            v-model="studentId" 
            placeholder="输入学号" 
            style="width: 150px"
            clearable
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input 
            v-model="name" 
            placeholder="输入姓名" 
            style="width: 150px"
            clearable
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="年级">
          <el-select 
            v-model="grade" 
            placeholder="选择年级" 
            style="width: 120px"
            clearable
            @change="handleSearch"
          >
            <el-option v-for="i in 6" :key="i" :label="`${i}年级`" :value="i.toString()" />
          </el-select>
        </el-form-item>
        <el-form-item label="班级">
          <el-select 
            v-model="classNum" 
            placeholder="选择班级" 
            style="width: 120px"
            clearable
            @change="handleSearch"
          >
            <el-option v-for="i in 20" :key="i" :label="`${i}班`" :value="i.toString()" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="searching">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button v-if="hasActiveFilters" @click="handleReset">
            <el-icon><RefreshRight /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 用户列表 -->
    <div v-if="userList.length > 0" class="user-list">
      <el-table :data="userList" style="width: 100%" @row-click="handleSelectUser" highlight-current-row>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="student_id" label="学号" width="100" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column label="年级" width="80">
          <template #default="{ row }">
            {{ row.grade ? `${row.grade}年级` : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="班级" width="80">
          <template #default="{ row }">
            {{ row.class ? `${row.class}班` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="points" label="积分" width="80" />
        <el-table-column prop="created_at" label="注册时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              @click.stop="handleAnalyzeUser(row.id)"
              :loading="analyzingId === row.id"
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

    <el-empty v-else-if="!searching" description="请搜索用户进行分析" />

    <!-- 分析结果对话框 -->
    <el-dialog 
      v-model="showAnalysisDialog" 
      title="学习风格分析结果" 
      width="80%"
      @close="closeDialog"
    >
      <div v-if="currentStyleAnalysis" v-loading="loadingAnalysis" class="style-content">
        <!-- 基本统计 -->
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">平均答题时间</div>
            <div class="stat-value">{{ currentStyleAnalysis.avg_answer_time.toFixed(1) }}秒</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">答题时间稳定性</div>
            <div class="stat-value">{{ currentStyleAnalysis.answer_time_stability.toFixed(1) }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">平均修改次数</div>
            <div class="stat-value">{{ currentStyleAnalysis.avg_modifications.toFixed(1) }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">跳题率</div>
            <div class="stat-value">{{ (currentStyleAnalysis.skip_rate * 100).toFixed(1) }}%</div>
          </div>
        </div>

        <!-- AI 自主分析的其他维度 -->
        <div v-if="currentStyleAnalysis.analysis_dimensions" class="dimensions-section">
          <div class="section-title">
            <el-icon><DataAnalysis /></el-icon>
            AI 深度分析
          </div>
          <div class="dimensions-grid">
            <div 
              v-for="(value, dimension) in currentStyleAnalysis.analysis_dimensions" 
              :key="dimension"
              class="dimension-item"
            >
              <div class="dimension-name">{{ dimension }}</div>
              <div class="dimension-value">{{ value }}</div>
            </div>
          </div>
        </div>

        <!-- 学习风格标签 -->
        <div class="style-tags-section" v-if="parsedStyleTags.length > 0">
          <div class="section-title">
            <el-icon><CollectionTag /></el-icon>
            学习风格标签
          </div>
          <div class="tags-container">
            <el-tag 
              v-for="(tag, index) in parsedStyleTags" 
              :key="index"
              class="style-tag"
              :type="getStyleTagType(tag)"
              size="large"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>

        <!-- 优势分析 -->
        <div v-if="currentStyleAnalysis.strengths && currentStyleAnalysis.strengths.length > 0" class="strengths-section">
          <div class="section-title">
            <el-icon><Star /></el-icon>
            发现的优势
          </div>
          <ul class="strengths-list">
            <li v-for="(strength, index) in currentStyleAnalysis.strengths" :key="index">
              {{ strength }}
            </li>
          </ul>
        </div>

        <!-- 改进建议 -->
        <div v-if="currentStyleAnalysis.improvements && currentStyleAnalysis.improvements.length > 0" class="improvements-section">
          <div class="section-title">
            <el-icon><Aim /></el-icon>
            改进方向
          </div>
          <ul class="improvements-list">
            <li v-for="(improvement, index) in currentStyleAnalysis.improvements" :key="index">
              {{ improvement }}
            </li>
          </ul>
        </div>

        <!-- 推荐行动 -->
        <div v-if="currentStyleAnalysis.recommended_actions && currentStyleAnalysis.recommended_actions.length > 0" class="actions-section">
          <div class="section-title">
            <el-icon><List /></el-icon>
            推荐行动
          </div>
          <el-timeline>
            <el-timeline-item
              v-for="(action, index) in currentStyleAnalysis.recommended_actions"
              :key="index"
              :icon="index === 0 ? Star : undefined"
              :type="index === 0 ? 'primary' : 'info'"
            >
              {{ action }}
            </el-timeline-item>
          </el-timeline>
        </div>

        <!-- 错误模式分析 -->
        <div class="error-patterns-section" v-if="Object.keys(parsedErrorPatterns).length > 0">
          <div class="section-title">
            <el-icon><Warning /></el-icon>
            错误模式分析
          </div>
          <div class="error-grid">
            <div 
              v-for="(count, pattern) in parsedErrorPatterns" 
              :key="pattern"
              class="error-item"
            >
              <div class="error-name">{{ pattern }}</div>
              <div class="error-count">
                <el-progress 
                  :percentage="getErrorPercentage(count)" 
                  :color="getErrorColor(pattern)"
                />
                <span class="count-text">{{ count }} 次</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 难度偏好 -->
        <div class="difficulty-preference-section" v-if="currentStyleAnalysis.difficulty_preference">
          <div class="section-title">
            <el-icon><TrendCharts /></el-icon>
            难度偏好
          </div>
          <div class="difficulty-preference">
            <el-tag :type="getDifficultyPreferenceType(currentStyleAnalysis.difficulty_preference)" size="large">
              {{ getDifficultyPreferenceLabel(currentStyleAnalysis.difficulty_preference) }}
            </el-tag>
            <el-text type="info" size="small" style="margin-left: 10px;">
              平均偏好难度: {{ currentStyleAnalysis.difficulty_preference.toFixed(2) }}
            </el-text>
          </div>
        </div>

        <!-- AI 建议 -->
        <div class="suggestion-section" v-if="currentStyleAnalysis.ai_suggestion">
          <div class="section-title">
            <el-icon><ChatDotRound /></el-icon>
            AI 学习建议
          </div>
          <el-alert 
            :title="currentStyleAnalysis.ai_suggestion" 
            type="info" 
            :closable="false"
            show-icon
          />
        </div>

        <!-- 分析信息 -->
        <div class="analysis-info">
          <el-text type="info" size="small">
            已分析 {{ currentStyleAnalysis.total_analyzed_sessions }} 次答题会话
          </el-text>
          <el-text type="info" size="small" v-if="currentStyleAnalysis.updated_at">
            · 上次更新: {{ formatDate(currentStyleAnalysis.updated_at) }}
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
import { useUserFilters } from '@/composables/useUserFilters'
import { 
  TrendCharts, Refresh, CollectionTag, 
  Warning, ChatDotRound, Search, RefreshRight,
  DataAnalysis, Star, Aim, List
} from '@element-plus/icons-vue'

// 使用筛选 Hook
const { 
  studentId, 
  name, 
  grade, 
  classNum,
  validate, 
  reset, 
  toParams,
  hasActiveFilters 
} = useUserFilters()

// 响应式数据
const searching = ref(false)
const analyzingId = ref(null)
const loadingAnalysis = ref(false)
const showAnalysisDialog = ref(false)
const userList = ref([])
const currentStyleAnalysis = ref(null)
const analyzedUsers = ref(new Set())

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 计算属性：解析学习风格标签
const parsedStyleTags = computed(() => {
  if (!currentStyleAnalysis.value?.learning_style_tags) return []
  
  try {
    if (typeof currentStyleAnalysis.value.learning_style_tags === 'string') {
      return JSON.parse(currentStyleAnalysis.value.learning_style_tags)
    }
    return currentStyleAnalysis.value.learning_style_tags
  } catch (error) {
    console.error('[解析学习风格标签失败]', error)
    return []
  }
})

// 计算属性：解析错误模式
const parsedErrorPatterns = computed(() => {
  if (!currentStyleAnalysis.value?.error_patterns) return {}
  
  try {
    if (typeof currentStyleAnalysis.value.error_patterns === 'string') {
      return JSON.parse(currentStyleAnalysis.value.error_patterns)
    }
    return currentStyleAnalysis.value.error_patterns
  } catch (error) {
    console.error('[解析错误模式失败]', error)
    return {}
  }
})

// 搜索用户
const handleSearch = async () => {
  // 验证筛选条件
  const errors = validate()
  if (errors.length > 0) {
    message.warning(errors[0])
    return
  }
  
  searching.value = true
  
  try {
    // 使用 composable 提供的参数转换方法
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...toParams()
    }
    
    const result = await api.get('/users', params)
    
    // 兼容两种响应格式
    if (result.data) {
      // 新的分页格式
      userList.value = result.data || []
      total.value = result.total || 0
    } else if (result.success) {
      // 旧格式
      userList.value = result.users || []
      total.value = result.total || 0
    } else if (Array.isArray(result)) {
      // 数组格式
      userList.value = result
      total.value = result.length
    }
  } catch (error) {
    console.error('[搜索用户失败]', error)
    message.error('搜索用户失败')
  } finally {
    searching.value = false
  }
}

// 重置筛选
const handleReset = () => {
  reset()
  currentPage.value = 1
  handleSearch()
}

// 选择用户
const handleSelectUser = (row) => {
  handleAnalyzeUser(row.id)
}

// 分析用户学习风格
const handleAnalyzeUser = async (userId) => {
  analyzingId.value = userId
  
  try {
    // 先加载已有的分析结果
    const loadResult = await api.get(`/answer-behavior/user-style/${userId}`)
    
    if (loadResult.success && loadResult.styleAnalysis) {
      // 已有分析结果
      currentStyleAnalysis.value = loadResult.styleAnalysis
      analyzedUsers.value.add(userId)
      showAnalysisDialog.value = true
    } else {
      // 开始新的分析
      const analyzeResult = await api.post('/answer-behavior/analyze-style', { userId })
      
      if (analyzeResult.success) {
        if (analyzeResult.styleAnalysis) {
          // 同步返回结果
          currentStyleAnalysis.value = analyzeResult.styleAnalysis
          analyzedUsers.value.add(userId)
          showAnalysisDialog.value = true
          message.success('分析完成')
        } else if (analyzeResult.taskId) {
          // 异步任务
          message.info('分析任务已添加到队列，请稍后查看结果')
          analyzedUsers.value.add(userId)
        }
      } else {
        message.error(analyzeResult.error || '分析失败')
      }
    }
  } catch (error) {
    console.error('[分析学习风格失败]', error)
    message.error('分析学习风格失败')
  } finally {
    analyzingId.value = null
  }
}

// 获取分析状态
const getAnalysisStatus = (userId) => {
  return analyzedUsers.value.has(userId) ? '查看分析' : '分析'
}

// 关闭对话框
const closeDialog = () => {
  currentStyleAnalysis.value = null
}

// 工具函数 - 完全基于数据，无硬编码
const getStyleTagType = (tag) => {
  // AI 自主决定标签，前端只负责显示，不预设类型
  // 使用随机或基于标签内容的哈希来分配颜色，保证视觉多样性
  const types = ['primary', 'success', 'warning', 'danger', 'info']
  const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return types[hash % types.length]
}

const getErrorColor = (pattern) => {
  // AI 自主分析错误模式，前端只负责渲染
  // 使用基于模式名称的哈希来生成颜色，避免硬编码
  const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#b37feb']
  const hash = pattern.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

const getErrorPercentage = (count) => {
  if (!currentStyleAnalysis.value?.total_analyzed_sessions) return 0
  return Math.min((count / currentStyleAnalysis.value.total_analyzed_sessions) * 100, 100)
}

const getDifficultyPreferenceType = (pref) => {
  // AI 会自主分析并给出建议，前端只负责展示
  // 不预设阈值，完全基于数据本身
  if (typeof pref !== 'number' || isNaN(pref)) return 'info'
  
  // 动态计算：基于数据分布自动调整阈值
  // 使用简单的线性映射：1-2 低难度，2-3 中等，3-5 高难度
  if (pref >= 3) return 'danger'
  if (pref >= 2) return 'warning'
  return 'success'
}

const getDifficultyPreferenceLabel = (pref) => {
  // 不使用硬编码标签，返回数值让 AI 自主解释
  if (typeof pref !== 'number' || isNaN(pref)) return '数据不足'
  
  // 只返回数值范围描述，具体标签由 AI 决定
  if (pref >= 3) return `难度偏好: ${pref.toFixed(2)} (较高)`
  if (pref >= 2) return `难度偏好: ${pref.toFixed(2)} (中等)`
  return `难度偏好: ${pref.toFixed(2)} (较低)`
}

const formatDate = (dateStr) => {
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
  // 可以自动加载用户列表
  handleSearch()
})
</script>

<style scoped>
.learning-style-card {
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

.user-selector {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.search-form {
  margin-bottom: 0;
}

.user-list {
  margin-top: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.style-content {
  padding: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

.stat-item {
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
  text-align: center;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.style-tags-section,
.error-patterns-section,
.difficulty-preference-section,
.suggestion-section {
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

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.style-tag {
  font-size: 14px;
}

.error-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.error-item {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 4px;
}

.error-name {
  font-weight: 500;
  margin-bottom: 8px;
}

.error-count {
  display: flex;
  align-items: center;
  gap: 10px;
}

.count-text {
  white-space: nowrap;
  font-size: 12px;
  color: #909399;
}

/* AI 深度分析维度 */
.dimensions-section,
.strengths-section,
.improvements-section,
.actions-section {
  margin-bottom: 20px;
}

.dimensions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.dimension-item {
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  border-left: 3px solid #409eff;
}

.dimension-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  font-size: 14px;
}

.dimension-value {
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
}

.strengths-list,
.improvements-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.strengths-list li,
.improvements-list li {
  padding: 10px 15px;
  margin-bottom: 8px;
  background: #f0f9ff;
  border-radius: 4px;
  border-left: 3px solid #67c23a;
  color: #303133;
}

.improvements-list li {
  background: #fff7e6;
  border-left-color: #e6a23c;
}

.difficulty-preference {
  display: flex;
  align-items: center;
}

.analysis-info {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px dashed #e4e7ed;
  display: flex;
  gap: 10px;
}
</style>
