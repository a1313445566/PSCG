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
import * as echarts from 'echarts'
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
  
  if (!subjectChart) {
    subjectChart = echarts.init(subjectChartRef.value)
  }
  
  const data = props.analysisData.subjectAnalysisList || []
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params) => {
        const item = params[0]
        return `${item.name}<br/>正确率: ${formatPercent(item.value)}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.subject),
      axisLabel: {
        interval: 0,
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [{
      name: '正确率',
      type: 'bar',
      data: data.map(item => item.accuracy),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#83bff6' },
          { offset: 0.5, color: '#188df0' },
          { offset: 1, color: '#188df0' }
        ])
      },
      emphasis: {
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#2378f7' },
            { offset: 0.7, color: '#2378f7' },
            { offset: 1, color: '#83bff6' }
          ])
        }
      }
    }]
  }
  
  subjectChart.setOption(option)
}

// 初始化年级图表
const initGradeChart = () => {
  if (!gradeChartRef.value) return
  
  if (!gradeChart) {
    gradeChart = echarts.init(gradeChartRef.value)
  }
  
  const data = props.analysisData.gradeAnalysisList || []
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['用户数', '答题次数', '正确率']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => `${item.grade}年级`)
    },
    yAxis: [
      {
        type: 'value',
        name: '数量',
        position: 'left'
      },
      {
        type: 'value',
        name: '正确率',
        position: 'right',
        max: 100,
        axisLabel: {
          formatter: '{value}%'
        }
      }
    ],
    series: [
      {
        name: '用户数',
        type: 'bar',
        data: data.map(item => item.users)
      },
      {
        name: '答题次数',
        type: 'bar',
        data: data.map(item => item.sessions)
      },
      {
        name: '正确率',
        type: 'line',
        yAxisIndex: 1,
        data: data.map(item => item.accuracy),
        smooth: true
      }
    ]
  }
  
  gradeChart.setOption(option)
}

// 初始化时间趋势图表
const initTimeChart = () => {
  if (!timeChartRef.value) return
  
  if (!timeChart) {
    timeChart = echarts.init(timeChartRef.value)
  }
  
  const data = props.analysisData.timeAnalysisList || []
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const item = params[0]
        return `${item.name}<br/>正确率: ${formatPercent(item.value)}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(item => {
        // 格式化日期显示
        if (item.date && typeof item.date === 'string') {
          // 提取 YYYY-MM-DD 部分
          return item.date.split('T')[0].split(' ')[0]
        }
        return item.date
      })
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [{
      name: '正确率',
      type: 'line',
      data: data.map(item => item.accuracy),
      smooth: true,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
        ])
      },
      lineStyle: {
        color: '#409EFF',
        width: 2
      },
      itemStyle: {
        color: '#409EFF'
      }
    }]
  }
  
  timeChart.setOption(option)
}

// 初始化班级图表
const initClassChart = () => {
  if (!classChartRef.value) return
  
  if (!classChart) {
    classChart = echarts.init(classChartRef.value)
  }
  
  const data = props.analysisData.classAnalysisList || []
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => `${item.class_num}班`),
      axisLabel: {
        interval: 0,
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [{
      name: '正确率',
      type: 'bar',
      data: data.map(item => item.accuracy),
      itemStyle: {
        color: '#67C23A'
      }
    }]
  }
  
  classChart.setOption(option)
}

// 初始化答题时长分布图表
const initTimeSpentChart = () => {
  if (!timeSpentChartRef.value) return
  
  if (!timeSpentChart) {
    timeSpentChart = echarts.init(timeSpentChartRef.value)
  }
  
  const data = props.analysisData.timeSpentAnalysisList || []
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center'
    },
    series: [
      {
        name: '答题时长',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '20',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data.map(item => ({
          value: item.count,
          name: item.time_range
        }))
      }
    ]
  }
  
  timeSpentChart.setOption(option)
}

// 初始化知识点图表
const initSubcategoryChart = () => {
  if (!subcategoryChartRef.value) return
  
  if (!subcategoryChart) {
    subcategoryChart = echarts.init(subcategoryChartRef.value)
  }
  
  const data = props.analysisData.subcategoryAnalysisList || []
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params) => {
        const item = params[0]
        return `${item.name}<br/>正确率: ${formatPercent(item.value)}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    yAxis: {
      type: 'category',
      data: data.map(item => item.subcategory ? `${item.subject} - ${item.subcategory}` : '未分类').reverse(),
      axisLabel: {
        interval: 0
      }
    },
    series: [{
      name: '正确率',
      type: 'bar',
      data: data.map(item => item.accuracy).reverse(),
      itemStyle: {
        color: '#E6A23C'
      }
    }]
  }
  
  subcategoryChart.setOption(option)
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
  subjectChart?.dispose()
  gradeChart?.dispose()
  timeChart?.dispose()
  classChart?.dispose()
  timeSpentChart?.dispose()
  subcategoryChart?.dispose()
  
  subjectChart = null
  gradeChart = null
  timeChart = null
  classChart = null
  timeSpentChart = null
  subcategoryChart = null
}

// 监听数据变化
watch(() => props.analysisData, () => {
  nextTick(() => {
    initAllCharts()
  })
}, { deep: true })

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
