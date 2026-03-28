<template>
  <div class="game-page">
    <AppHeader />

    <div class="game-content">
      <!-- 返回按钮 -->
      <div class="back-section">
        <button class="back-btn" @click="goBack">← 返回个人中心</button>
      </div>

      <!-- 标题 -->
      <div class="page-header">
        <h1 class="page-title">📈 学习报告</h1>
        <p class="page-desc">全面分析学习情况，助力进步成长</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loader"></div>
        <p>加载中...</p>
      </div>

      <!-- 学习报告内容 -->
      <div v-else>
        <!-- 核心数据区：概况 + 雷达图 -->
        <div class="core-stats-row">
          <div class="game-card compact">
            <h2 class="section-title">📊 总体概况</h2>
            <div class="stats-grid-mini">
              <div class="stat-item-mini">
                <span class="stat-value">{{ report.totalSessions || 0 }}</span>
                <span class="stat-label">答题次数</span>
              </div>
              <div class="stat-item-mini">
                <span class="stat-value">{{ report.totalQuestions || 0 }}</span>
                <span class="stat-label">总答题数</span>
              </div>
              <div class="stat-item-mini">
                <span class="stat-value">{{ Math.round(report.avgAccuracy || 0) }}%</span>
                <span class="stat-label">正确率</span>
              </div>
              <div class="stat-item-mini">
                <span class="stat-value">{{ formatDuration(report.totalTime || 0) }}</span>
                <span class="stat-label">学习时长</span>
              </div>
            </div>
          </div>
          <div v-if="radarData.length > 0" class="game-card compact chart-card">
            <h2 class="section-title">🎯 能力分布</h2>
            <div ref="radarChartRef" class="chart-container-mini"></div>
          </div>
        </div>

        <!-- 学科表现（紧凑版） -->
        <div class="game-card">
          <h2 class="section-title">📚 学科表现</h2>
          <div class="subject-list-compact">
            <div v-for="subject in subjectPerformance" :key="subject.id" class="subject-row">
              <span class="subject-icon">{{ subject.icon }}</span>
              <span class="subject-name">{{ subject.name }}</span>
              <div class="progress-bar-mini">
                <div class="progress-fill" :style="{ width: `${subject.accuracy || 0}%` }"></div>
              </div>
              <span class="subject-accuracy">{{ Math.round(subject.accuracy || 0) }}%</span>
              <span class="subject-count">{{ subject.totalQuestions || 0 }}题</span>
            </div>
          </div>
        </div>

        <!-- 学习风格 + 建议（合并卡片） -->
        <div v-if="learningStyle" class="game-card">
          <h2 class="section-title">💡 学习分析与建议</h2>
          <div class="style-summary">
            <div class="style-badge">{{ learningStyle.name }}</div>
            <div class="style-details-compact">
              <span>活跃: {{ timePreferenceText }}</span>
              <span>偏好: {{ subjectPreferenceText }}</span>
            </div>
          </div>
          <div class="tips-compact">
            <div
              v-for="suggestion in suggestions.slice(0, 3)"
              :key="suggestion.id"
              class="tip-inline"
            >
              <span class="tip-icon">{{ suggestion.icon }}</span>
              <span>{{ suggestion.text }}</span>
            </div>
          </div>
        </div>

        <!-- 趋势图 -->
        <div v-if="behaviorTrend.length > 0" class="game-card">
          <div class="section-header" @click="toggleTrend">
            <h2 class="section-title">📈 答题趋势</h2>
            <span class="toggle-icon">{{ showTrend ? '▼' : '▶' }}</span>
          </div>
          <div v-show="showTrend" ref="trendChartRef" class="chart-container"></div>
        </div>

        <!-- 最近记录（可折叠） -->
        <div class="game-card">
          <div class="section-header" @click="toggleRecent">
            <h2 class="section-title">📋 最近记录</h2>
            <span class="toggle-icon">{{ showRecent ? '▼' : '▶' }}</span>
          </div>
          <div v-show="showRecent" class="trend-list-compact">
            <div
              v-for="(record, index) in recentRecords.slice(0, 5)"
              :key="index"
              class="trend-row"
            >
              <span class="trend-date">{{ formatDate(record.created_at) }}</span>
              <span class="trend-subject">{{ record.subject_name }}</span>
              <span class="trend-score">
                {{ record.correct_count }}/{{ record.total_questions }}
              </span>
              <span class="trend-accuracy">
                {{ Math.round((record.correct_count / record.total_questions) * 100) }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/common/AppHeader.vue'
import { api } from '@/utils/api'
import { useLoading } from '@/composables/useLoading'
import { error } from '@/utils/message'

const router = useRouter()
const { loading, withLoading } = useLoading()

const userId = ref(null)
const report = ref({})
const subjectPerformance = ref([])
const recentRecords = ref([])

// 新增：学习风格和行为数据
const learningStyle = ref(null)
const timePreference = ref([])
const subjectPreference = ref([])
const errorTendency = ref([])
const radarData = ref([])
const behaviorTrend = ref([])

// 图表引用
const radarChartRef = ref(null)
const trendChartRef = ref(null)
let radarChartInstance = null
let trendChartInstance = null

// 折叠状态
const showTrend = ref(false)
const showRecent = ref(false)

const toggleTrend = () => {
  showTrend.value = !showTrend.value
  if (showTrend.value) {
    setTimeout(() => renderTrendChart(), 50)
  }
}

const toggleRecent = () => {
  showRecent.value = !showRecent.value
}

// 学习建议
const suggestions = computed(() => {
  const items = []

  if (report.value.avgAccuracy < 60) {
    items.push({
      id: 1,
      icon: '📚',
      text: '建议多复习基础知识，打牢基础再进行练习'
    })
  }

  if (report.value.avgAccuracy >= 60 && report.value.avgAccuracy < 80) {
    items.push({
      id: 2,
      icon: '💪',
      text: '表现不错！建议针对错题进行重点复习'
    })
  }

  if (report.value.avgAccuracy >= 80) {
    items.push({
      id: 3,
      icon: '🌟',
      text: '表现优秀！继续保持，挑战更高难度题目'
    })
  }

  items.push({
    id: 4,
    icon: '🎯',
    text: '建议每天坚持练习，保持学习状态'
  })

  items.push({
    id: 5,
    icon: '📝',
    text: '定期复习错题本，避免重复犯错'
  })

  return items
})

// 获取用户信息
const getUserInfo = () => {
  userId.value = localStorage.getItem('userId')
}

// 获取学习报告
const fetchReport = async () => {
  try {
    // 获取统计数据
    const stats = await api.get(`/users/stats/${userId.value}`)
    report.value = stats

    // 获取学科表现
    const subjects = await api.get('/subjects')
    const performance = await Promise.all(
      subjects.map(async subject => {
        try {
          const records = await api.get(`/answer-records/${userId.value}`)
          const subjectRecords = records.filter(r => r.subject_id === subject.id)

          const totalQuestions = subjectRecords.reduce((sum, r) => sum + r.total_questions, 0)
          const correctCount = subjectRecords.reduce((sum, r) => sum + r.correct_count, 0)
          const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0

          return {
            id: subject.id,
            name: subject.name,
            icon: getSubjectIcon(subject.id),
            totalQuestions,
            correctCount,
            accuracy
          }
        } catch (err) {
          return {
            id: subject.id,
            name: subject.name,
            icon: getSubjectIcon(subject.id),
            totalQuestions: 0,
            correctCount: 0,
            accuracy: 0
          }
        }
      })
    )

    subjectPerformance.value = performance.filter(s => s.totalQuestions > 0)

    // 获取最近记录
    const allRecords = await api.get(`/answer-records/${userId.value}`)
    recentRecords.value = allRecords.slice(0, 10)

    // 获取学习风格分析
    const styleData = await api.get(`/user-stats/learning-style/${userId.value}`)
    learningStyle.value = styleData.learningStyle
    timePreference.value = styleData.timePreference || []
    subjectPreference.value = styleData.subjectPreference || []
    errorTendency.value = styleData.errorTendency || []

    // 获取学科能力雷达图
    const radarRes = await api.get(`/user-stats/subject-radar/${userId.value}`)
    radarData.value = radarRes.radarData || []

    // 获取答题行为趋势
    const behaviorRes = await api.get(`/user-stats/behavior/${userId.value}`, {
      params: { days: 30 }
    })
    behaviorTrend.value = behaviorRes.accuracyTrend || []
  } catch (err) {
    error('获取学习报告失败')
    console.error(err)
  }
}

// 获取学科图标
const getSubjectIcon = subjectId => {
  const icons = {
    1: '📖',
    2: '🔢',
    3: '🔤',
    4: '🔬',
    5: '🎨',
    6: '🎵'
  }
  return icons[subjectId] || '📚'
}

// 格式化时长
const formatDuration = seconds => {
  if (!seconds || seconds === 0) return '0分钟'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  return `${minutes}分钟`
}

// 计算文本描述
const timePreferenceText = computed(() => {
  if (timePreference.value.length === 0) return '数据不足'
  const top = timePreference.value[0]
  return `${top.label}（${top.sessions}次）`
})

const subjectPreferenceText = computed(() => {
  if (subjectPreference.value.length === 0) return '数据不足'
  return subjectPreference.value.map(s => s.name).join('、')
})

const errorTendencyText = computed(() => {
  if (errorTendency.value.length === 0) return '暂无明显薄弱点'
  return errorTendency.value.map(e => `${e.subject_name}（${e.error_count}题）`).join('、')
})

// 渲染雷达图
const renderRadarChart = () => {
  if (!radarChartRef.value || radarData.value.length === 0) return

  import('@visactor/vchart').then(({ default: VChart }) => {
    const spec = {
      type: 'radar',
      data: [
        {
          id: 'radarData',
          values: radarData.value.map(d => ({
            subject: String(d.subject || ''),
            value: Number(d.ability || 0)
          }))
        }
      ],
      categoryField: 'subject',
      valueField: 'value',
      seriesField: 'subject',
      radar: {
        style: {
          fillOpacity: 0.3,
          stroke: '#6b6b6b'
        },
        axis: {
          grid: {
            style: {
              stroke: '#e0e0e0'
            }
          },
          label: {
            style: {
              fill: '#666'
            }
          }
        }
      },
      radarAxis: {
        grid: {
          style: {
            stroke: '#e0e0e0'
          }
        }
      },
      legends: {
        visible: false
      },
      axes: [
        {
          orient: 'radius',
          min: 0,
          max: 100
        }
      ],
      point: {
        style: {
          size: 6,
          fill: '#ff6b6b',
          stroke: '#fff',
          lineWidth: 2
        }
      },
      line: {
        style: {
          stroke: '#ff6b6b',
          lineWidth: 2
        }
      },
      area: {
        style: {
          fill: 'rgba(255, 107, 107, 0.2)'
        }
      }
    }

    radarChartInstance = new VChart(spec, {
      dom: radarChartRef.value,
      mode: 'desktop-browser'
    })
    radarChartInstance.renderAsync()
  })
}

// 渲染趋势图
const renderTrendChart = () => {
  if (!trendChartRef.value || behaviorTrend.value.length === 0) return

  import('@visactor/vchart').then(({ default: VChart }) => {
    const spec = {
      type: 'line',
      data: [
        {
          id: 'trendData',
          values: behaviorTrend.value.map(d => ({
            date: String(d.date || '').substring(0, 10),
            accuracy: Number(d.avgAccuracy || 0)
          }))
        }
      ],
      xField: 'date',
      yField: 'accuracy',
      point: {
        style: {
          size: 4,
          fill: '#ff6b6b'
        }
      },
      line: {
        style: {
          stroke: '#ff6b6b',
          lineWidth: 2
        }
      },
      axes: [
        {
          orient: 'bottom',
          label: {
            style: {
              fill: '#666'
            },
            autoHide: true
          }
        },
        {
          orient: 'left',
          min: 0,
          max: 100,
          label: {
            style: {
              fill: '#666'
            },
            formatMethod: val => `${val}%`
          }
        }
      ],
      crosshair: {
        xField: {
          visible: true,
          line: {
            style: {
              stroke: '#999',
              lineDash: [4, 4]
            }
          }
        }
      },
      tooltip: {
        visible: true,
        mark: {
          visible: true
        },
        dimension: {
          visible: true
        }
      }
    }

    trendChartInstance = new VChart(spec, {
      dom: trendChartRef.value,
      mode: 'desktop-browser'
    })
    trendChartInstance.renderAsync()
  })
}

// 格式化日期
const formatDate = dateString => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 返回个人中心
const goBack = () => {
  router.push('/profile')
}

onMounted(async () => {
  getUserInfo()
  await withLoading(fetchReport)

  // 延迟渲染图表，确保 DOM 已挂载
  setTimeout(() => {
    renderRadarChart()
    renderTrendChart()
  }, 100)
})
</script>

<style scoped>
@import '@/styles/game-common.css';

.back-section {
  margin-bottom: 1.5rem;
}

/* 核心数据区：双列布局 */
.core-stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.game-card.compact {
  margin-bottom: 0;
}

.chart-card {
  display: flex;
  flex-direction: column;
}

/* 紧凑型统计网格 */
.stats-grid-mini {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stat-item-mini {
  text-align: center;
  padding: 1rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%);
  border-radius: 12px;
  border: 2px solid var(--border-color);
}

.stat-item-mini .stat-value {
  display: block;
  font-family: var(--game-font);
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--primary-color);
}

.stat-item-mini .stat-label {
  display: block;
  font-family: var(--game-font);
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
  font-weight: 600;
}

/* 小型图表容器 */
.chart-container-mini {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  background: #fafafa;
}

/* 紧凑型学科列表 */
.subject-list-compact {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.subject-row {
  display: grid;
  grid-template-columns: 30px 80px 1fr 50px 50px;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 1rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 10px;
  border: 2px solid var(--border-color);
}

.subject-icon {
  font-size: 1.2rem;
}

.subject-name {
  font-family: var(--game-font);
  font-weight: 700;
  font-size: 0.9rem;
}

.progress-bar-mini {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-mini .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.subject-accuracy {
  font-family: var(--game-font);
  font-weight: 900;
  font-size: 0.9rem;
  color: var(--primary-color);
  text-align: right;
}

.subject-count {
  font-family: var(--game-font);
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-align: right;
}

/* 学习风格摘要 */
.style-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.style-badge {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-family: var(--game-font);
  font-weight: 900;
  font-size: 1rem;
}

.style-details-compact {
  display: flex;
  gap: 1.5rem;
  font-size: 0.85rem;
}

/* 紧凑型建议 */
.tips-compact {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tip-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 0.9rem;
}

.tip-inline .tip-icon {
  font-size: 1rem;
}

/* 折叠区域 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.section-header:hover {
  opacity: 0.8;
}

.toggle-icon {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* 紧凑型记录列表 */
.trend-list-compact {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.trend-row {
  display: grid;
  grid-template-columns: 60px 1fr 50px 50px;
  align-items: center;
  gap: 0.8rem;
  padding: 0.6rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  font-family: var(--game-font);
  font-size: 0.85rem;
}

.trend-date {
  color: var(--text-secondary);
}

.trend-subject {
  font-weight: 600;
}

.trend-score {
  text-align: center;
  color: var(--text-primary);
}

.trend-accuracy {
  text-align: right;
  font-weight: 900;
  color: var(--primary-color);
}

/* 图表容器 */
.chart-container {
  width: 100%;
  height: 300px;
  border-radius: 12px;
  background: #fafafa;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .core-stats-row {
    grid-template-columns: 1fr;
  }

  .subject-row {
    grid-template-columns: 30px 1fr 60px;
  }

  .progress-bar-mini,
  .subject-count {
    display: none;
  }

  .trend-row {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
