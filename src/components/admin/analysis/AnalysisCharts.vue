<template>
  <div class="analysis-charts">
    <el-row :gutter="20">
      <!-- 学科分析 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>学科正确率分析</span>
            </div>
          </template>
          <div ref="subjectChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 年级分析 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>年级答题情况</span>
            </div>
          </template>
          <div ref="gradeChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 时间趋势 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>正确率时间趋势</span>
            </div>
          </template>
          <div ref="timeChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 班级分析 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>班级答题情况</span>
            </div>
          </template>
          <div ref="classChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 答题时间分布 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>答题时长分布</span>
            </div>
          </template>
          <div ref="timeSpentChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 知识点分析 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>知识点掌握情况</span>
            </div>
          </template>
          <div ref="subcategoryChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import VChart from '@visactor/vchart'
import { formatPercent } from '../../../utils/format'

const props = defineProps({
  analysisData: {
    type: Object,
    default: () => ({})
  }
})

// 图表 DOM 引用
const subjectChartRef = ref(null)
const gradeChartRef = ref(null)
const timeChartRef = ref(null)
const classChartRef = ref(null)
const timeSpentChartRef = ref(null)
const subcategoryChartRef = ref(null)

// 图表实例
let subjectChart = null
let gradeChart = null
let timeChart = null
let classChart = null
let timeSpentChart = null
let subcategoryChart = null

// 初始化学科图表
const initSubjectChart = () => {
  if (!subjectChartRef.value) return

  // 先销毁旧图表
  if (subjectChart) {
    subjectChart.release()
    subjectChart = null
  }

  const data = props.analysisData.subjectAnalysisList || []
  if (data.length === 0) return

  const spec = {
    type: 'bar',
    data: [
      {
        id: 'data',
        values: data.map(item => ({
          subject: item.subject,
          accuracy: item.accuracy || 0
        }))
      }
    ],
    xField: 'subject',
    yField: 'accuracy',
    axes: [
      { orient: 'bottom', label: { autoRotate: true, autoHide: false } },
      { orient: 'left', max: 100, label: { formatMethod: val => `${val}%` } }
    ],
    bar: {
      style: {
        fill: '#409EFF'
      }
    },
    tooltip: {
      visible: true,
      mark: {
        title: d => d.subject,
        content: [{ key: '正确率', value: d => formatPercent(d.accuracy) }]
      }
    }
  }

  subjectChart = new VChart(spec, {
    dom: subjectChartRef.value,
    mode: 'desktop-browser'
  })
  subjectChart.renderAsync()
}

// 初始化年级图表
const initGradeChart = () => {
  if (!gradeChartRef.value) return

  // 先销毁旧图表
  if (gradeChart) {
    gradeChart.release()
    gradeChart = null
  }

  const data = props.analysisData.gradeAnalysisList || []
  if (data.length === 0) return

  // 将数据转换为长格式
  const values = []
  data.forEach(item => {
    values.push({
      grade: `${item.grade}年级`,
      type: '用户数',
      value: item.users || 0
    })
    values.push({
      grade: `${item.grade}年级`,
      type: '答题次数',
      value: item.sessions || 0
    })
  })

  const spec = {
    type: 'bar',
    data: [{ id: 'data', values }],
    xField: 'grade',
    yField: 'value',
    seriesField: 'type',
    color: ['#5470c6', '#91cc75'],
    bar: {
      style: {
        cornerRadius: [4, 4, 0, 0]
      }
    },
    axes: [
      { orient: 'bottom', label: { autoRotate: true } },
      { orient: 'left', title: { visible: true, text: '数量' } }
    ],
    legends: { visible: true },
    tooltip: { visible: true }
  }

  gradeChart = new VChart(spec, {
    dom: gradeChartRef.value,
    mode: 'desktop-browser'
  })
  gradeChart.renderAsync()
}

// 初始化时间趋势图表
const initTimeChart = () => {
  if (!timeChartRef.value) return

  // 先销毁旧图表
  if (timeChart) {
    timeChart.release()
    timeChart = null
  }

  const data = props.analysisData.timeAnalysisList || []
  if (data.length === 0) return

  const spec = {
    type: 'line',
    data: [
      {
        id: 'data',
        values: data.map(item => ({
          date:
            item.date && typeof item.date === 'string'
              ? item.date.split('T')[0].split(' ')[0]
              : item.date,
          accuracy: item.accuracy || 0
        }))
      }
    ],
    xField: 'date',
    yField: 'accuracy',
    axes: [
      { orient: 'bottom' },
      { orient: 'left', max: 100, label: { formatMethod: val => `${val}%` } }
    ],
    line: {
      style: {
        stroke: '#409EFF',
        lineWidth: 2
      }
    },
    point: {
      style: {
        fill: '#409EFF'
      }
    },
    area: {
      style: {
        fill: 'rgba(64, 158, 255, 0.2)'
      }
    },
    smooth: true,
    tooltip: {
      visible: true,
      mark: {
        title: d => d.date,
        content: [{ key: '正确率', value: d => formatPercent(d.accuracy) }]
      }
    }
  }

  timeChart = new VChart(spec, {
    dom: timeChartRef.value,
    mode: 'desktop-browser'
  })
  timeChart.renderAsync()
}

// 初始化班级图表
const initClassChart = () => {
  if (!classChartRef.value) return

  // 先销毁旧图表
  if (classChart) {
    classChart.release()
    classChart = null
  }

  const data = props.analysisData.classAnalysisList || []
  if (data.length === 0) return

  const spec = {
    type: 'bar',
    data: [
      {
        id: 'data',
        values: data.map(item => ({
          classNum: item.class_name || (item.class_num ? `${item.class_num}班` : '未知'),
          accuracy: item.accuracy || 0
        }))
      }
    ],
    xField: 'classNum',
    yField: 'accuracy',
    axes: [
      { orient: 'bottom', label: { autoRotate: true } },
      { orient: 'left', max: 100, label: { formatMethod: val => `${val}%` } }
    ],
    bar: {
      style: {
        fill: '#67C23A'
      }
    },
    tooltip: { visible: true }
  }

  classChart = new VChart(spec, {
    dom: classChartRef.value,
    mode: 'desktop-browser'
  })
  classChart.renderAsync()
}

// 初始化答题时长分布图表
const initTimeSpentChart = () => {
  if (!timeSpentChartRef.value) return

  // 先销毁旧图表
  if (timeSpentChart) {
    timeSpentChart.release()
    timeSpentChart = null
  }

  const data = props.analysisData.timeSpentAnalysisList || []
  if (data.length === 0) return

  const spec = {
    type: 'pie',
    data: [
      {
        id: 'data',
        values: data.map(item => ({
          timeRange: item.time_range || '未知',
          count: item.sessions || item.count || 0
        }))
      }
    ],
    valueField: 'count',
    categoryField: 'timeRange',
    outerRadius: 0.7,
    innerRadius: 0.4,
    pie: {
      style: {
        cornerRadius: 10,
        stroke: '#fff',
        lineWidth: 2
      }
    },
    legends: {
      visible: true,
      orient: 'left'
    },
    label: { visible: false },
    tooltip: { visible: true }
  }

  timeSpentChart = new VChart(spec, {
    dom: timeSpentChartRef.value,
    mode: 'desktop-browser'
  })
  timeSpentChart.renderAsync()
}

// 初始化知识点图表
const initSubcategoryChart = () => {
  if (!subcategoryChartRef.value) return

  // 先销毁旧图表
  if (subcategoryChart) {
    subcategoryChart.release()
    subcategoryChart = null
  }

  const data = props.analysisData.subcategoryAnalysisList || []
  if (data.length === 0) return

  const spec = {
    type: 'bar',
    data: [
      {
        id: 'data',
        values: data
          .map(item => ({
            name: item.subcategory
              ? `${item.subject} - ${item.subcategory}`
              : item.subject || '未分类',
            accuracy: item.accuracy || 0
          }))
          .reverse()
      }
    ],
    xField: 'accuracy',
    yField: 'name',
    direction: 'horizontal',
    axes: [
      { orient: 'left', label: { autoHide: false } },
      { orient: 'bottom', max: 100, label: { formatMethod: val => `${val}%` } }
    ],
    bar: {
      style: {
        fill: '#E6A23C'
      }
    },
    tooltip: {
      visible: true,
      mark: {
        title: d => d.name,
        content: [{ key: '正确率', value: d => formatPercent(d.accuracy) }]
      }
    }
  }

  subcategoryChart = new VChart(spec, {
    dom: subcategoryChartRef.value,
    mode: 'desktop-browser'
  })
  subcategoryChart.renderAsync()
}

// 初始化所有图表
const initAllCharts = () => {
  initSubjectChart()
  initGradeChart()
  initTimeChart()
  initClassChart()
  initTimeSpentChart()
  initSubcategoryChart()
}

// 调整图表大小
const resizeCharts = () => {
  subjectChart?.resize()
  gradeChart?.resize()
  timeChart?.resize()
  classChart?.resize()
  timeSpentChart?.resize()
  subcategoryChart?.resize()
}

// 销毁所有图表
const disposeCharts = () => {
  subjectChart?.release()
  gradeChart?.release()
  timeChart?.release()
  classChart?.release()
  timeSpentChart?.release()
  subcategoryChart?.release()

  subjectChart = null
  gradeChart = null
  timeChart = null
  classChart = null
  timeSpentChart = null
  subcategoryChart = null
}

// 监听数据变化
watch(
  () => props.analysisData,
  () => {
    nextTick(() => {
      initAllCharts()
    })
  },
  { deep: true }
)

// 生命周期
onMounted(() => {
  initAllCharts()
  window.addEventListener('resize', resizeCharts)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCharts)
  disposeCharts()
})
</script>

<style scoped>
.analysis-charts {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.card-header {
  font-weight: bold;
  font-size: 16px;
}

.chart-container {
  width: 100%;
  height: 300px;
}

/* 响应式 */
@media (max-width: 768px) {
  .chart-container {
    height: 250px;
  }
}
</style>
