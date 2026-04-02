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
import {
  registerChart,
  unregisterChart,
  observeContainer,
  unobserveContainer,
  cleanup
} from '../../../utils/chartResize'

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

// ✅ 图表实例数组（用于批量处理）
const chartInstanceList = []

// ✅ 窗口大小调整处理函数（带防抖）
let resizeTimeout = null
const handleResize = () => {
  if (resizeTimeout) clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    chartInstanceList.forEach(chart => {
      try {
        chart?.resize()
      } catch (e) {
        // 忽略错误
      }
    })
  }, 150)
}

// 初始化学科图表
const initSubjectChart = () => {
  if (!subjectChartRef.value) return

  // 先销毁旧图表
  if (subjectChart) {
    try {
      subjectChart.release()
    } catch (e) {}
    subjectChart = null
  }

  const data = props.analysisData.subjectAnalysisList || []
  if (data.length === 0) return

  const spec = {
    type: 'bar',
    autoFit: true, // ✅ 在 spec 中启用自动适应（关键！）
    data: [
      {
        id: 'data',
        values: data.map(item => ({
          subject: String(item.subject || ''),
          accuracy: Number(item.accuracy || 0)
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

  // ✅ 添加到图表实例列表
  if (!chartInstanceList.includes(subjectChart)) {
    chartInstanceList.push(subjectChart)
  }
}

// 初始化年级图表
const initGradeChart = () => {
  if (!gradeChartRef.value) return

  // 先销毁旧图表
  if (gradeChart) {
    try {
      gradeChart.release()
    } catch (e) {}
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
    autoFit: true, // ✅ 在 spec 中启用自动适应
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

  // ✅ 添加到图表实例列表
  if (!chartInstanceList.includes(gradeChart)) {
    chartInstanceList.push(gradeChart)
  }
}

// 初始化时间趋势图表
const initTimeChart = () => {
  if (!timeChartRef.value) return

  // 先销毁旧图表
  if (timeChart) {
    try {
      timeChart.release()
    } catch (e) {}
    timeChart = null
  }

  const data = props.analysisData.timeAnalysisList || []
  if (data.length === 0) return

  const spec = {
    type: 'line',
    autoFit: true, // ✅ 在 spec 中启用自动适应
    data: [
      {
        id: 'data',
        values: data.map(item => ({
          date: String(item.date || '').substring(0, 10),
          accuracy: Number(item.accuracy || 0)
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

  // ✅ 添加到图表实例列表
  if (!chartInstanceList.includes(timeChart)) {
    chartInstanceList.push(timeChart)
  }
}

// 初始化班级图表
const initClassChart = () => {
  if (!classChartRef.value) return

  // 先销毁旧图表
  if (classChart) {
    try {
      classChart.release()
    } catch (e) {}
    classChart = null
  }

  const data = props.analysisData.classAnalysisList || []
  if (data.length === 0) return

  const spec = {
    type: 'bar',
    autoFit: true, // ✅ 在 spec 中启用自动适应
    data: [
      {
        id: 'data',
        values: data.map(item => ({
          classNum: String(item.class_name || (item.class_num ? `${item.class_num}班` : '未知')),
          accuracy: Number(item.accuracy || 0)
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

  // ✅ 添加到图表实例列表
  if (!chartInstanceList.includes(classChart)) {
    chartInstanceList.push(classChart)
  }
}

// 初始化答题时长分布图表
const initTimeSpentChart = () => {
  if (!timeSpentChartRef.value) return

  // 先销毁旧图表
  if (timeSpentChart) {
    try {
      timeSpentChart.release()
    } catch (e) {}
    timeSpentChart = null
  }

  const data = props.analysisData.timeSpentAnalysisList || []
  if (data.length === 0) return

  const spec = {
    type: 'pie',
    autoFit: true, // ✅ 在 spec 中启用自动适应
    data: [
      {
        id: 'data',
        values: data.map(item => ({
          timeRange: String(item.time_range || '未知'),
          count: Number(item.sessions || item.count || 0)
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

  // ✅ 添加到图表实例列表
  if (!chartInstanceList.includes(timeSpentChart)) {
    chartInstanceList.push(timeSpentChart)
  }
}

// 初始化知识点图表
const initSubcategoryChart = () => {
  if (!subcategoryChartRef.value) return

  // 先销毁旧图表
  if (subcategoryChart) {
    try {
      subcategoryChart.release()
    } catch (e) {}
    subcategoryChart = null
  }

  const data = props.analysisData.subcategoryAnalysisList || []
  if (data.length === 0) return

  const spec = {
    type: 'bar',
    autoFit: true, // ✅ 在 spec 中启用自动适应（关键！）
    data: [
      {
        id: 'data',
        values: data
          .map(item => ({
            name: String(
              item.subcategory ? `${item.subject} - ${item.subcategory}` : item.subject || '未分类'
            ),
            accuracy: Number(item.accuracy || 0)
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

  // ✅ 注册到全局自适应管理器
  registerChart('subcategory', subcategoryChart, subcategoryChartRef.value)
  observeContainer(subcategoryChartRef.value)
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
  // ✅ 使用防抖
  if (resizeTimeout) clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    chartInstanceList.forEach(chart => {
      try {
        chart?.resize()
      } catch (e) {
        // 忽略错误
      }
    })
  }, 150)
}

// 销毁所有图表
const disposeCharts = () => {
  // ✅ 从实例列表销毁
  chartInstanceList.forEach(chart => {
    try {
      chart?.release()
    } catch (e) {
      // 忽略错误
    }
  })
  chartInstanceList.length = 0 // 清空数组

  // 清空引用
  subjectChart = null
  gradeChart = null
  timeChart = null
  classChart = null
  timeSpentChart = null
  subcategoryChart = null

  // 清理定时器
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
    resizeTimeout = null
  }
}

// ✅ 启动容器尺寸监听（使用 ResizeObserver）
const startContainerObserver = () => {
  if (!window.ResizeObserver) return

  // 监听所有图表容器
  const containers = [
    subjectChartRef.value,
    gradeChartRef.value,
    timeChartRef.value,
    classChartRef.value,
    timeSpentChartRef.value,
    subcategoryChartRef.value
  ].filter(Boolean)

  if (containers.length === 0) return

  resizeObserver = new ResizeObserver(() => {
    handleResize()
  })

  containers.forEach(container => {
    resizeObserver.observe(container)
  })
}

// ✅ 停止容器尺寸监听
const stopContainerObserver = () => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
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
})

onUnmounted(() => {
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
