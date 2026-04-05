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
          <span v-if="stats.questionTrend > 0" class="data-card-trend up">
            <el-icon><Top /></el-icon>
            较昨日 +{{ stats.questionTrend }}
          </span>
          <span v-else class="data-card-trend">
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
          <span v-if="stats.userTrend > 0" class="data-card-trend up">
            <el-icon><Top /></el-icon>
            较昨日 +{{ stats.userTrend }}
          </span>
          <span v-else class="data-card-trend">
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
          <span v-if="stats.attemptTrend > 0" class="data-card-trend up">
            <el-icon><Top /></el-icon>
            较昨日 +{{ stats.attemptTrend }}%
          </span>
          <span v-else-if="stats.attemptTrend < 0" class="data-card-trend down">
            <el-icon><Bottom /></el-icon>
            较昨日 {{ stats.attemptTrend }}%
          </span>
          <span v-else class="data-card-trend">
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
          <span v-if="stats.accuracyTrend > 0" class="data-card-trend up">
            <el-icon><Top /></el-icon>
            较昨日 +{{ stats.accuracyTrend }}%
          </span>
          <span v-else-if="stats.accuracyTrend < 0" class="data-card-trend down">
            <el-icon><Bottom /></el-icon>
            较昨日 {{ stats.accuracyTrend }}%
          </span>
          <span v-else class="data-card-trend">
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
        <div ref="trendChartRef" v-loading="trendLoading" class="chart"></div>
      </el-card>

      <!-- 学科分布图 -->
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">学科答题分布</span>
          </div>
        </template>
        <div ref="subjectChartRef" v-loading="subjectLoading" class="chart"></div>
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
      <el-table v-loading="activityLoading" :data="recentActivities" stripe>
        <el-table-column prop="student_name" label="学生" width="120" />
        <el-table-column prop="subject" label="学科" width="100" />
        <el-table-column prop="subcategory" label="题库" min-width="150" />
        <el-table-column label="得分" width="120">
          <template #default="{ row }">
            <span :class="row.score >= 60 ? 'text-success' : 'text-danger'">{{ row.score }}分</span>
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
  Document,
  UserFilled,
  EditPen,
  TrendCharts,
  Top,
  Bottom,
  Minus,
  ArrowRight
} from '@element-plus/icons-vue'
import VChart from '@visactor/vchart'

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
const renderTrendChart = data => {
  if (!trendChartRef.value) return

  // 先释放旧图表
  if (trendChart) {
    trendChart.release()
    trendChart = null
  }

  // 转换数据为 VChart 需要的格式
  const attemptsData = data.map(item => ({
    date: String(item.date || '').substring(0, 10),
    type: '答题次数',
    value: Number(item.attempts || 0)
  }))

  const accuracyData = data.map(item => ({
    date: String(item.date || '').substring(0, 10),
    type: '正确率 (%)',
    value: Number(item.accuracy || 0)
  }))

  const spec = {
    type: 'line',
    data: [
      {
        id: 'data',
        values: [...attemptsData, ...accuracyData]
      }
    ],
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    axes: [
      {
        orient: 'left',
        title: { visible: true, text: '答题次数 / 正确率' }
      }
    ],
    line: {
      style: {
        lineWidth: 2
      }
    },
    point: {
      style: {
        size: 6
      }
    },
    color: ['#409EFF', '#67C23A'],
    smooth: true,
    legends: {
      visible: true,
      orient: 'top'
    },
    tooltip: {
      visible: true,
      mark: {
        content: [{ key: d => d.type, value: d => d.value }]
      }
    }
  }

  // ✅ 添加 autoFit 到 spec 中
  spec.autoFit = true

  // ✅ 调试：检查容器尺寸
  console.log(
    '[Dashboard] 渲染趋势图，容器尺寸:',
    trendChartRef.value?.offsetWidth,
    'x',
    trendChartRef.value?.offsetHeight
  )

  trendChart = new VChart(spec, {
    dom: trendChartRef.value,
    mode: 'desktop-browser'
  })
  trendChart.renderAsync()
}

// 渲染学科分布图表
const renderSubjectChart = data => {
  if (!subjectChartRef.value) return

  // 先释放旧图表
  if (subjectChart) {
    subjectChart.release()
    subjectChart = null
  }

  // 过滤掉没有数据的学科
  const validData = data.filter(item => item.count > 0)

  const spec = {
    type: 'pie',
    data: [
      {
        id: 'data',
        values: validData.map(item => ({
          name: String(item.name || ''),
          value: Number(item.count || 0)
        }))
      }
    ],
    valueField: 'value',
    categoryField: 'name',
    outerRadius: 0.75,
    innerRadius: 0.5,
    pie: {
      style: {
        cornerRadius: 4,
        stroke: '#fff',
        lineWidth: 2
      }
    },
    legends: {
      visible: true,
      orient: 'right',
      position: 'middle'
    },
    label: {
      visible: true,
      position: 'outside',
      style: {
        fontSize: 12
      },
      formatMethod: (text, datum) => {
        const total = validData.reduce((sum, item) => sum + item.count, 0)
        const percent = total > 0 ? ((datum.value / total) * 100).toFixed(1) : 0
        return `${datum.name}\n${percent}%`
      }
    },
    tooltip: {
      visible: true,
      mark: {
        content: [
          { key: '学科', value: d => d.name },
          { key: '答题次数', value: d => d.value }
        ]
      }
    }
  }

  // ✅ 添加 autoFit 到 spec 中
  spec.autoFit = true

  subjectChart = new VChart(spec, {
    dom: subjectChartRef.value,
    mode: 'desktop-browser'
  })
  subjectChart.renderAsync()
}

// 查看全部记录
const viewAllRecords = () => {
  setActiveMenu('user-data')
  router.push('/admin')
}

// 释放图表实例
const releaseCharts = () => {
  trendChart?.release()
  subjectChart?.release()
  trendChart = null
  subjectChart = null
}

// 初始化
onMounted(async () => {
  await withLoading(async () => {
    await Promise.all([loadStats(), loadTrendData(), loadSubjectData(), loadRecentActivities()])

    // 等待 DOM 更新后初始化图表
    await nextTick()

    // ✅ 注册到全局自适应管理器
    const { registerChart, observeContainer } = await import('../../utils/chartResize')
    if (trendChart) {
      registerChart('dashboard-trend', trendChart, trendChartRef.value)
      // ✅ 同时监听图表容器和其父元素（el-card__body）
      observeContainer(trendChartRef.value)
      const parentEl = trendChartRef.value?.closest('.el-card__body')
      if (parentEl) observeContainer(parentEl)
    }
    if (subjectChart) {
      registerChart('dashboard-subject', subjectChart, subjectChartRef.value)
      observeContainer(subjectChartRef.value)
      const parentEl = subjectChartRef.value?.closest('.el-card__body')
      if (parentEl) observeContainer(parentEl)
    }
  }, '正在加载数据概览...')
})

// 清理
onUnmounted(async () => {
  // ✅ 从全局管理器注销
  const { unregisterChart, unobserveContainer } = await import('../../utils/chartResize')
  unregisterChart('dashboard-trend')
  unregisterChart('dashboard-subject')
  unobserveContainer(trendChartRef.value)
  unobserveContainer(subjectChartRef.value)

  releaseCharts()
  cleanup()
})
</script>

<style scoped lang="scss">
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
  color: #409eff;
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
  color: #67c23a;
}

.data-card-trend.down {
  color: #f56c6c;
}

/* 图表区域 */
.charts-container {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 20px;
  width: 100%; /* ✅ 确保容器宽度跟随父元素 */
}

.chart-card {
  border-radius: 12px;
  width: 100%; /* ✅ 确保卡片宽度填满 */
  overflow: hidden; /* ✅ 防止内容溢出 */
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
  margin-top: 24px;
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
