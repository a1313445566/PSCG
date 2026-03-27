<template>
  <div class="ai-analysis-panel">
    <!-- 输入区域 -->
    <div class="input-section">
      <el-input
        v-model="questionInput"
        type="textarea"
        :rows="3"
        placeholder="请输入自然语言问题，例如：三年级数学错误率最高的知识点是什么？"
        :maxlength="500"
        show-word-limit
        @keydown.ctrl.enter="handleAnalyze"
      />
      
      <div class="input-actions">
        <el-button 
          type="primary" 
          :loading="analyzing"
          :disabled="!questionInput.trim()"
          @click="handleAnalyze"
        >
          <el-icon v-if="!analyzing"><QuestionFilled /></el-icon>
          {{ analyzing ? '分析中...' : '开始分析' }}
        </el-button>
        
        <el-button @click="handleClear">
          <el-icon><Close /></el-icon>
          清空
        </el-button>
      </div>
    </div>

    <!-- 示例问题 -->
    <div class="example-section" v-if="!analysisResult">
      <div class="example-header">
        <div class="example-title">💡 试试这些问题：</div>
        <el-button 
          link 
          type="primary" 
          size="small"
          @click="displayExamples = getRandomExamples()"
        >
          <el-icon><RefreshRight /></el-icon>
          换一批
        </el-button>
      </div>
      <div class="example-list">
        <div 
          v-for="(item, index) in displayExamples" 
          :key="index"
          class="example-item"
          @click="questionInput = item.question"
        >
          <span class="example-category">{{ item.category }}</span>
          <span class="example-question">{{ item.question }}</span>
        </div>
      </div>
    </div>

    <!-- 分析结果 -->
    <div class="result-section" v-if="analysisResult">
      <div class="result-header">
        <h4>
          <el-icon><DocumentChecked /></el-icon>
          分析结果
        </h4>
        <div class="result-actions">
          <el-button size="small" @click="handleCopy">
            <el-icon><CopyDocument /></el-icon>
            复制
          </el-button>
          <el-button size="small" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </div>
      </div>
      
      <el-card class="result-card" shadow="hover">
        <div ref="resultContainer" class="markdown-body" v-html="renderedResult"></div>
        <div class="result-meta">
          <el-tag size="small" type="info">{{ analysisTime }}</el-tag>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { api } from '@/utils/api'
import message from '@/utils/message'
import { useLoading } from '@/composables/useLoading'
import { useChartRenderer } from '@/composables/useChartRenderer'
import { renderMarkdown } from '@/utils/markdown'
import '@/styles/markdown.css'
import { 
  QuestionFilled, DocumentChecked, CopyDocument, Download, Close, RefreshRight
} from '@element-plus/icons-vue'

const props = defineProps({
  filters: { type: Object, default: () => ({}) }
})

const { withLoading, cleanup } = useLoading()
const { renderCharts, clearCharts, resizeCharts } = useChartRenderer()

const questionInput = ref('')
const analysisResult = ref('')
const analyzing = ref(false)
const analysisTime = ref('')
const resultContainer = ref(null)

// 示例问题
const exampleCategories = ref([
  { category: '📊 趋势分析', examples: ['最近一周学生答题正确率趋势如何？', '近7天答题数量变化情况', '本月用户活跃度变化趋势'] },
  { category: '🎯 错误诊断', examples: ['三年级数学错误率最高的知识点是什么？', '哪些题目错误率最高？', '高频错题有哪些共性？'] },
  { category: '🏫 班级对比', examples: ['哪些班级需要重点关注？', '各年级正确率对比分析', '班级答题活跃度排名'] },
  { category: '📚 学科分析', examples: ['语文学科的主要薄弱点在哪里？', '各学科题目分布情况', '学科难度分布统计'] },
  { category: '👥 用户行为', examples: ['用户答题频次分布情况', '答题时间分布分析', '最活跃的学生有哪些？'] }
])

const getRandomExamples = () => {
  const allExamples = exampleCategories.value.flatMap(cat => 
    cat.examples.map(ex => ({ category: cat.category, question: ex }))
  )
  return [...allExamples].sort(() => Math.random() - 0.5).slice(0, 5)
}

const displayExamples = ref(getRandomExamples())
const renderedResult = computed(() => renderMarkdown(analysisResult.value))

// 分析处理
const handleAnalyze = async () => {
  if (!questionInput.value.trim()) {
    message.warning('请输入分析问题')
    return
  }

  try {
    analyzing.value = true
    clearCharts()
    
    const result = await api.post('/ai/analyze', {
      question: questionInput.value,
      filters: props.filters
    }, { timeout: 90000 })

    analysisResult.value = result.analysis
    analysisTime.value = new Date().toLocaleString('zh-CN')
    
    // 渲染图表
    await nextTick()
    setTimeout(() => {
      if (resultContainer.value) {
        renderCharts(resultContainer.value, result.analysis)
      }
    }, 100)
    
    message.success('AI 分析完成')
    
    // 保存历史
    api.post('/ai/history', {
      question: questionInput.value,
      result: result.analysis,
      filters: props.filters
    }).catch(e => console.error('[AI历史] 保存失败:', e))
    
  } catch (error) {
    console.error('[AI分析] 失败:', error)
  } finally {
    analyzing.value = false
  }
}

const handleClear = () => {
  questionInput.value = ''
  analysisResult.value = ''
  analysisTime.value = ''
  clearCharts()
}

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(analysisResult.value)
    message.success('已复制到剪贴板')
  } catch (error) {
    message.error('复制失败')
  }
}

const handleExport = () => {
  const content = `PSCG AI 分析报告\n\n问题: ${questionInput.value}\n\n分析结果:\n${analysisResult.value}\n\n生成时间: ${analysisTime.value}`
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `AI分析报告_${new Date().toISOString().slice(0, 10)}.txt`
  link.click()
  URL.revokeObjectURL(url)
  message.success('报告导出成功')
}

onMounted(() => {
  window.addEventListener('resize', resizeCharts)
  cleanup(() => window.removeEventListener('resize', resizeCharts))
})
</script>

<style scoped>
.ai-analysis-panel { padding: 20px; background: #fff; border-radius: 8px; }
.input-section { margin-bottom: 20px; }
.input-actions { display: flex; gap: 10px; margin-top: 15px; justify-content: flex-end; }
.example-section { padding: 20px; background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%); border-radius: 12px; margin-bottom: 20px; }
.example-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.example-title { font-size: 15px; font-weight: 600; color: #303133; }
.example-list { display: flex; flex-direction: column; gap: 10px; }
.example-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: white; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; border: 1px solid transparent; }
.example-item:hover { background: #ecf5ff; border-color: #409eff; transform: translateX(4px); }
.example-category { flex-shrink: 0; padding: 2px 8px; background: #f0f2f5; border-radius: 4px; font-size: 12px; color: #606266; font-weight: 500; }
.example-item:hover .example-category { background: #409eff; color: white; }
.example-question { font-size: 14px; color: #303133; flex: 1; }
.example-item:hover .example-question { color: #409eff; }
.result-section { margin-top: 20px; }
.result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.result-header h4 { margin: 0; font-size: 16px; font-weight: bold; display: flex; align-items: center; gap: 8px; }
.result-actions { display: flex; gap: 10px; }
.result-card { border: 1px solid #e6e6e6; }
.result-meta { margin-top: 15px; padding-top: 15px; border-top: 1px solid #e6e6e6; text-align: right; }
</style>
