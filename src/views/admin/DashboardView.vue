<template>
  <div class="dashboard-view">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="data-card">
        <div class="data-card-header">
          <span class="data-card-title">题目总数</span>
          <el-icon class="data-card-icon" :size="24"><Document /></el-icon>
        </div>
        <div class="data-card-value">{{ stats.totalQuestions }}</div>
        <div class="data-card-footer">
          <span class="data-card-trend up" v-if="stats.questionTrend > 0">
            <el-icon><Top /></el-icon>
            较昨日 +{{ stats.questionTrend }}
          </span>
          <span class="data-card-trend" v-else>
            <el-icon><Minus /></el-icon>
            无变化
          </span>
        </div>
      </div>
      
      <div class="data-card">
        <div class="data-card-header">
          <span class="data-card-title">用户总数</span>
          <el-icon class="data-card-icon" :size="24"><UserFilled /></el-icon>
        </div>
        <div class="data-card-value">{{ stats.totalUsers }}</div>
        <div class="data-card-footer">
          <span class="data-card-trend up" v-if="stats.userTrend > 0">
            <el-icon><Top /></el-icon>
            较昨日 +{{ stats.userTrend }}
          </span>
          <span class="data-card-trend" v-else>
            <el-icon><Minus /></el-icon>
            无变化
          </span>
        </div>
      </div>
      
      <div class="data-card">
        <div class="data-card-header">
          <span class="data-card-title">今日答题次数</span>
          <el-icon class="data-card-icon" :size="24"><EditPen /></el-icon>
        </div>
        <div class="data-card-value">{{ stats.todayAttempts }}</div>
        <div class="data-card-footer">
          <span class="data-card-trend up" v-if="stats.attemptTrend > 0">
            <el-icon><Top /></el-icon>
            较昨日 +{{ stats.attemptTrend }}%
          </span>
          <span class="data-card-trend down" v-else-if="stats.attemptTrend < 0">
            <el-icon><Bottom /></el-icon>
            较昨日 {{ stats.attemptTrend }}%
          </span>
          <span class="data-card-trend" v-else>
            <el-icon><Minus /></el-icon>
            无变化
          </span>
        </div>
      </div>
      
      <div class="data-card">
        <div class="data-card-header">
          <span class="data-card-title">平均正确率</span>
          <el-icon class="data-card-icon" :size="24"><TrendCharts /></el-icon>
        </div>
        <div class="data-card-value">{{ stats.avgAccuracy }}%</div>
        <div class="data-card-footer">
          <span class="data-card-trend up" v-if="stats.accuracyTrend > 0">
            <el-icon><Top /></el-icon>
            较昨日 +{{ stats.accuracyTrend }}%
          </span>
          <span class="data-card-trend down" v-else-if="stats.accuracyTrend < 0">
            <el-icon><Bottom /></el-icon>
            较昨日 {{ stats.accuracyTrend }}%
          </span>
          <span class="data-card-trend" v-else>
            <el-icon><Minus /></el-icon>
            无变化
          </span>
        </div>
      </div>
    </div>
    
    <!-- 图表区域 -->
    <div class="charts-container">
      <!-- 答题趋势图 -->
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">答题趋势</span>
            <el-radio-group v-model="trendRange" size="small" @change="loadTrendData">
              <el-radio-button value="7">近7天</el-radio-button>
              <el-radio-button value="30">近30天</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        <div ref="trendChartRef" class="chart" v-loading="trendLoading"></div>
      </el-card>
      
      <!-- 学科分布图 -->
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">学科答题分布</span>
          </div>
        </template>
        <div ref="subjectChartRef" class="chart" v-loading="subjectLoading"></div>
      </el-card>
    </div>
    
    <!-- 最近活动 -->
    <el-card class="activity-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">最近答题记录</span>
          <el-button type="primary" text @click="viewAllRecords">
            查看全部
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </template>
      <el-table :data="recentActivities" stripe v-loading="activityLoading">
        <el-table-column prop="student_name" label="学生" width="120" />
        <el-table-column prop="subject" label="学科" width="100" />
        <el-table-column prop="subcategory" label="题库" min-width="150" />
        <el-table-column label="得分" width="120">
          <template #default="{ row }">
            <span :class="row.score >= 60 ? 'text-success' : 'text-danger'">
              {{ row.score }}分
            </span>
          </template>
        </el-table-column>
        <el-table-column label="正确率" width="100">
          <template #default="{ row }">
            <span :class="row.accuracy >= 60 ? 'text-success' : 'text-danger'">
              {{ row.accuracy }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="时间" width="120" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../utils/api'
import { useLoading } from '../../composables/useLoading'
import { useAdminLayout } from '../../composables/useAdminLayout'
import {
  Document, UserFilled, EditPen, TrendCharts,
  Top, Bottom, Minus, ArrowRight
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const router = useRouter()
const { setActiveMenu } = useAdminLayout()
const { withLoading, cleanup } = useLoading()

// 统计数据
const stats = ref({
  totalQuestions: 0,
  totalUsers: 0,
  todayAttempts: 0,
  avgAccuracy: 0,
  questionTrend: 0,
  userTrend: 0,
  attemptTrend: 0,
  accuracyTrend: 0
})

// 图表相关
const trendChartRef = ref(null)
const subjectChartRef = ref(null)
let trendChart = null
let subjectChart = null

const trendRange = ref('7')
const trendLoading = ref(false)
const subjectLoading = ref(false)
const activityLoading = ref(false)

// 最近活动
const recentActivities = ref([])

// 加载统计数据
const loadStats = async () => {
  try {
    const data = await api.get('/dashboard/stats')
    stats.value = {
      totalQuestions: data.totalQuestions || 0,
      totalUsers: data.totalUsers || 0,
      todayAttempts: data.todayAttempts || 0,
      avgAccuracy: data.avgAccuracy || 0,
      questionTrend: data.questionTrend || 0,
      userTrend: data.userTrend || 0,
      attemptTrend: data.attemptTrend || 0,
      accuracyTrend: data.accuracyTrend || 0
    }
  } catch (error) {
    console.error('[Dashboard] 加载统计数据失败:', error)
  }
}

// 加载趋势数据
const loadTrendData = async () => {
  trendLoading.value = true
  try {
    const data = await api.get('/dashboard/trend', { days: trendRange.value })
    renderTrendChart(data || [])
  } catch (error) {
    console.error('[Dashboard] 加载趋势数据失败:', error)
    renderTrendChart([])
  } finally {
    trendLoading.value = false
  }
}

// 加载学科分布数据
const loadSubjectData = async () => {
  subjectLoading.value = true
  try {
    const data = await api.get('/dashboard/subject-distribution')
    renderSubjectChart(data || [])
  } catch (error) {
    console.error('[Dashboard] 加载学科分布数据失败:', error)
    renderSubjectChart([])
  } finally {
    subjectLoading.value = false
  }
}

// 加载最近活动
const loadRecentActivities = async () => {
  activityLoading.value = true
  try {
    const data = await api.get('/dashboard/recent-activities', { limit: 10 })
    recentActivities.value = data || []
  } catch (error) {
    console.error('[Dashboard] 加载最近活动失败:', error)
    recentActivities.value = []
  } finally {
    activityLoading.value = false
  }
}

// 渲染趋势图表
const renderTrendChart = (data) => {
  if (!trendChartRef.value) return
  
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['答题次数', '正确率']
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
      data: data.map(item => item.date)
    },
    yAxis: [
      {
        type: 'value',
        name: '答题次数',
        position: 'left'
      },
      {
        type: 'value',
        name: '正确率 (%)',
        position: 'right',
        min: 0,
        max: 100
      }
    ],
    series: [
      {
        name: '答题次数',
        type: 'line',
        smooth: true,
        data: data.map(item => item.attempts),
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        }
      },
      {
        name: '正确率',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: data.map(item => item.accuracy),
        itemStyle: {
          color: '#67C23A'
        }
      }
    ]
  }
  
  trendChart.setOption(option)
}

// 渲染学科分布图表
const renderSubjectChart = (data) => {
  if (!subjectChartRef.value) return
  
  if (!subjectChart) {
    subjectChart = echarts.init(subjectChartRef.value)
  }
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center'
    },
    series: [
      {
        name: '答题分布',
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
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data.map(item => ({
          value: item.count,
          name: item.name
        }))
      }
    ]
  }
  
  subjectChart.setOption(option)
}

// 查看全部记录
const viewAllRecords = () => {
  setActiveMenu('user-data')
  router.push('/admin')
}

// 窗口大小变化时重绘图表
const handleResize = () => {
  trendChart?.resize()
  subjectChart?.resize()
}

// 初始化
onMounted(async () => {
  await withLoading(async () => {
    await Promise.all([
      loadStats(),
      loadTrendData(),
      loadSubjectData(),
      loadRecentActivities()
    ])
    
    // 等待 DOM 更新后初始化图表
    await nextTick()
    window.addEventListener('resize', handleResize)
  }, '正在加载数据概览...')
})

// 清理
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  subjectChart?.dispose()
  cleanup()
})
</script>

<style scoped>
@import '../../styles/common.css';

.dashboard-view {
  padding: 0;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.data-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.data-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.data-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.data-card-title {
  font-size: 14px;
  color: #909399;
}

.data-card-icon {
  color: #409EFF;
}

.data-card-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.data-card-footer {
  font-size: 12px;
}

.data-card-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
}

.data-card-trend.up {
  color: #67C23A;
}

.data-card-trend.down {
  color: #F56C6C;
}

/* 图表区域 */
.charts-container {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 20px;
}

.chart-card {
  border-radius: 12px;
}

.chart-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.chart-card :deep(.el-card__body) {
  padding: 20px;
}

.chart {
  width: 100%;
  height: 300px;
}

/* 活动卡片 */
.activity-card {
  border-radius: 12px;
}

.activity-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

/* 响应式 */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .charts-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .data-card {
    padding: 16px;
  }
  
  .data-card-value {
    font-size: 24px;
  }
  
  .chart {
    height: 250px;
  }
}
</style>
