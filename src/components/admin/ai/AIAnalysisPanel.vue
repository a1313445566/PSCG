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

    <!-- 图表展示区 -->
    <div v-if="showChart && chartSpec" class="chart-section">
      <div class="chart-header">
        <h4>📊 数据可视化</h4>
        <el-radio-group v-model="chartType" size="small" @change="handleChartTypeChange">
          <el-radio-button value="auto">AI 智能推荐</el-radio-button>
          <el-radio-button value="bar">柱状图</el-radio-button>
          <el-radio-button value="pie">饼图</el-radio-button>
          <el-radio-button value="line">折线图</el-radio-button>
        </el-radio-group>
      </div>
      <div ref="chartContainer" class="chart-container"></div>
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
        <!-- Markdown 渲染 -->
        <div class="markdown-body" v-html="renderedResult"></div>
        
        <div class="result-meta">
          <el-tag size="small" type="info">
            {{ analysisTime }}
          </el-tag>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { api } from '@/utils/api'
import message from '@/utils/message'
import { useLoading } from '@/composables/useLoading'
import { renderMarkdown } from '@/utils/markdown'
import { extractChartConfig, VChart } from '@/utils/chartGenerator'
import '@/styles/markdown.css'
import { 
  QuestionFilled, 
  DocumentChecked, 
  CopyDocument, 
  Download,
  Close,
  RefreshRight
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  filters: {
    type: Object,
    default: () => ({})
  }
})

// Hook
const { withLoading, cleanup } = useLoading()

// 响应式数据
const questionInput = ref('')
const analysisResult = ref('')
const analyzing = ref(false)
const analysisTime = ref('')
const chartType = ref('auto')
const chartSpec = ref(null)
const originalChartSpec = ref(null)
const showChart = ref(false)
const chartContainer = ref(null)
let vchartInstance = null

// 示例问题分类
const exampleCategories = ref([
  {
    category: '📊 趋势分析',
    examples: [
      '最近一周学生答题正确率趋势如何？',
      '近7天答题数量变化情况',
      '本月用户活跃度变化趋势'
    ]
  },
  {
    category: '🎯 错误诊断',
    examples: [
      '三年级数学错误率最高的知识点是什么？',
      '哪些题目错误率最高？',
      '高频错题有哪些共性？'
    ]
  },
  {
    category: '🏫 班级对比',
    examples: [
      '哪些班级需要重点关注？',
      '各年级正确率对比分析',
      '班级答题活跃度排名'
    ]
  },
  {
    category: '📚 学科分析',
    examples: [
      '语文学科的主要薄弱点在哪里？',
      '各学科题目分布情况',
      '学科难度分布统计'
    ]
  },
  {
    category: '👥 用户行为',
    examples: [
      '用户答题频次分布情况',
      '答题时间分布分析',
      '最活跃的学生有哪些？'
    ]
  }
])

// 随机选择展示的示例（每次显示5个）
const getRandomExamples = () => {
  const allExamples = exampleCategories.value.flatMap(cat => 
    cat.examples.map(ex => ({ category: cat.category, question: ex }))
  )
  const shuffled = [...allExamples].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 5)
}

const displayExamples = ref(getRandomExamples())

// 渲染 Markdown 结果
const renderedResult = computed(() => {
  return renderMarkdown(analysisResult.value)
})

// 渲染图表
const renderChart = async () => {
  if (!chartContainer.value || !chartSpec.value) {
    console.error('[图表] 容器或配置不存在', {
      container: !!chartContainer.value,
      spec: !!chartSpec.value
    })
    return
  }
  
  console.log('[图表] 开始渲染, 容器尺寸:', {
    width: chartContainer.value.offsetWidth,
    height: chartContainer.value.offsetHeight
  })
  
  try {
    // 销毁旧实例
    if (vchartInstance) {
      console.log('[图表] 销毁旧实例')
      vchartInstance.release()
      vchartInstance = null
    }
    
    // 清空容器
    chartContainer.value.innerHTML = ''
    
    // 验证图表配置
    const spec = chartSpec.value
    console.log('[图表] 原始配置:', JSON.stringify(spec, null, 2))
    
    // 确保 data 格式正确
    if (!spec.data || !Array.isArray(spec.data) || spec.data.length === 0) {
      throw new Error('图表数据格式错误：data 必须是非空数组')
    }
    
    // 确保 values 存在且非空
    if (!spec.data[0].values || !Array.isArray(spec.data[0].values) || spec.data[0].values.length === 0) {
      throw new Error('图表数据格式错误：values 必须是非空数组')
    }
    
    // 确保必要的字段存在
    if (!spec.type) {
      throw new Error('图表配置错误：缺少 type 字段')
    }
    
    console.log('[图表] 数据验证通过, 数据点数量:', spec.data[0].values.length)
    
    // 创建新实例
    vchartInstance = new VChart(spec, {
      dom: chartContainer.value,
      mode: 'desktop-browser',
      animation: true,
      theme: 'light'
    })
    
    await vchartInstance.renderAsync()
    console.log('[图表] 渲染完成')
    
  } catch (error) {
    console.error('[图表] 渲染失败:', error)
    throw error
  }
}

// 处理图表类型切换（让用户选择后请求 AI 重新生成）
const handleChartTypeChange = async (type) => {
  if (!originalChartSpec.value) return
  
  if (type === 'auto') {
    chartSpec.value = { ...originalChartSpec.value }
  } else {
    // 让 AI 基于原数据重新生成指定类型的图表
    const newSpec = { ...originalChartSpec.value, type }
    chartSpec.value = newSpec
  }
  
  if (chartSpec.value) {
    await renderChart()
  }
}

// 分析处理
const handleAnalyze = async () => {
  if (!questionInput.value.trim()) {
    message.warning('请输入分析问题')
    return
  }

  try {
    analyzing.value = true
    
    const result = await api.post('/ai/analyze', {
      question: questionInput.value,
      filters: props.filters
    }, {
      timeout: 90000 // AI分析超时90秒
    })

    analysisResult.value = result.analysis
    analysisTime.value = new Date().toLocaleString('zh-CN')
    
    // 提取 AI 生成的图表配置
    console.log('[AI分析] 原始返回内容:', result.analysis.substring(0, 500))
    const chartConfig = extractChartConfig(result.analysis)
    console.log('[AI分析] 提取的图表配置:', chartConfig)
    
    if (chartConfig) {
      showChart.value = true
      originalChartSpec.value = chartConfig  // 保存原始配置
      chartSpec.value = chartConfig
      chartType.value = 'auto'  // 重置为自动（使用 AI 配置）
      
      // 等待 DOM 更新后再渲染图表
      await nextTick()
      
      // 增加延迟确保容器完全渲染
      setTimeout(async () => {
        console.log('[AI分析] 准备渲染图表, chartContainer:', !!chartContainer.value, 'chartSpec:', !!chartSpec.value)
        console.log('[AI分析] 图表容器尺寸:', chartContainer.value?.offsetWidth, 'x', chartContainer.value?.offsetHeight)
        
        if (chartContainer.value && chartSpec.value) {
          try {
            await renderChart()
            console.log('[AI分析] 图表渲染成功')
          } catch (error) {
            console.error('[AI分析] 图表渲染失败:', error)
            message.error('图表渲染失败: ' + error.message)
          }
        } else {
          console.error('[AI分析] 图表容器或配置不存在')
        }
      }, 100)
    } else {
      console.log('[AI分析] 未提取到图表配置')
      showChart.value = false
    }
    
    message.success('AI 分析完成')
    
    // 保存历史记录
    try {
      await api.post('/ai/history', {
        question: questionInput.value,
        result: result.analysis,
        filters: props.filters
      })
    } catch (error) {
      console.error('[AI历史] 保存失败:', error)
      // 不显示错误，静默失败
    }
  } catch (error) {
    console.error('[AI分析] 失败:', error)
    // api 已自动显示错误
  } finally {
    analyzing.value = false
  }
}

// 清空
const handleClear = () => {
  questionInput.value = ''
  analysisResult.value = ''
  analysisTime.value = ''
  chartSpec.value = null
  originalChartSpec.value = null
  showChart.value = false
}

// 复制结果
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(analysisResult.value)
    message.success('已复制到剪贴板')
  } catch (error) {
    message.error('复制失败')
  }
}

// 导出结果
const handleExport = () => {
  const content = `PSCG AI 分析报告

问题: ${questionInput.value}

分析结果:
${analysisResult.value}

生成时间: ${analysisTime.value}`
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `AI分析报告_${new Date().toISOString().slice(0, 10)}.txt`
  link.click()
  URL.revokeObjectURL(url)
  
  message.success('报告导出成功')
}

// 窗口大小变化时重绘图表
const handleResize = () => {
  vchartInstance?.resize()
}

// 监听图表数据变化
watch(chartSpec, async (newSpec) => {
  if (newSpec && chartContainer.value) {
    await nextTick()
    await renderChart()
  }
})

// 生命周期
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  vchartInstance?.release()
  cleanup()
})
</script>

<style scoped>
.ai-analysis-panel {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.input-section {
  margin-bottom: 20px;
}

.input-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  justify-content: flex-end;
}

.example-section {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%);
  border-radius: 12px;
  margin-bottom: 20px;
}

.example-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.example-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.example-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.example-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.example-item:hover {
  background: #ecf5ff;
  border-color: #409eff;
  transform: translateX(4px);
}

.example-category {
  flex-shrink: 0;
  padding: 2px 8px;
  background: #f0f2f5;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.example-item:hover .example-category {
  background: #409eff;
  color: white;
}

.example-question {
  font-size: 14px;
  color: #303133;
  flex: 1;
}

.example-item:hover .example-question {
  color: #409eff;
}

.chart-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.chart-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  width: 100%;
  height: 400px;
  background: white;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

/* 确保 VChart 渲染的元素正确显示 */
.chart-container :deep(canvas) {
  display: block !important;
}

.chart-container :deep(svg) {
  display: block !important;
}

.result-section {
  margin-top: 20px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.result-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-actions {
  display: flex;
  gap: 10px;
}

.result-card {
  border: 1px solid #e6e6e6;
}

.result-meta {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e6e6e6;
  text-align: right;
}
</style>
