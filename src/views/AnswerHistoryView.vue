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
        <h1 class="page-title">📜 答题历史</h1>
        <p class="page-desc">回顾学习历程，总结经验教训</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loader"></div>
        <p>加载中...</p>
      </div>

      <!-- 答题历史内容 -->
      <div v-else>
        <!-- 筛选器 -->
        <div class="game-card">
          <div class="game-filter">
            <select v-model="selectedSubject" class="game-select">
              <option value="">全部学科</option>
              <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                {{ subject.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- 历史记录列表 -->
        <div class="game-card">
          <h2 class="section-title">📋 答题记录</h2>
          <div v-if="filteredRecords.length > 0" class="history-list">
            <div
              v-for="record in filteredRecords"
              :key="record.id"
              class="history-item"
              @click="viewDetail(record)"
            >
              <div class="history-header">
                <span class="history-subject">
                  {{ getSubjectIcon(record.subject_id) }} {{ record.subject_name }}
                </span>
                <span class="history-date">{{ formatDateTime(record.created_at) }}</span>
              </div>
              <div class="history-body">
                <div class="history-info">
                  <span class="history-category">{{ record.subcategory_name }}</span>
                  <span class="history-score">
                    {{ record.correct_count }}/{{ record.total_questions }}
                  </span>
                </div>
                <div class="history-stats">
                  <span class="accuracy-badge" :class="getAccuracyClass(record)">
                    {{ Math.round((record.correct_count / record.total_questions) * 100) }}%
                  </span>
                  <span class="time-badge">⏱️ {{ formatTime(record.time_spent) }}</span>
                </div>
              </div>
              <div class="history-arrow">→</div>
            </div>
          </div>
          <div v-else class="empty-message">暂无答题记录</div>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="pagination-section">
          <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          >
            ← 上一页
          </button>
          <span class="page-info">第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
          <button
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="changePage(currentPage + 1)"
          >
            下一页 →
          </button>
        </div>

        <!-- 学习数据统计图表 -->
        <div v-if="hourlyDistribution.length > 0" class="game-card">
          <h2 class="section-title">⏰ 答题时段分布</h2>
          <div ref="hourlyChartRef" class="chart-container"></div>
        </div>

        <div v-if="dailyTime.length > 0" class="game-card">
          <h2 class="section-title">📅 每日学习时长</h2>
          <div ref="dailyChartRef" class="chart-container"></div>
        </div>

        <div v-if="radarData.length > 0" class="game-card">
          <h2 class="section-title">📊 学科能力分布</h2>
          <div ref="radarChartRef" class="chart-container"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/common/AppHeader.vue'
import { api } from '@/utils/api'
import { useLoading } from '@/composables/useLoading'
import { error } from '@/utils/message'

const router = useRouter()
const { loading, withLoading } = useLoading()

const userId = ref(null)
const subjects = ref([])
const selectedSubject = ref('')
const records = ref([])
const currentPage = ref(1)
const pageSize = 20

// 新增：统计数据
const hourlyDistribution = ref([])
const dailyTime = ref([])
const radarData = ref([])

// 图表引用
const hourlyChartRef = ref(null)
const dailyChartRef = ref(null)
const radarChartRef = ref(null)
let hourlyChartInstance = null
let dailyChartInstance = null
let radarChartInstance = null

// 筛选后的记录
const filteredRecords = computed(() => {
  let filtered = records.value
  if (selectedSubject.value) {
    filtered = filtered.filter(r => r.subject_id === parseInt(selectedSubject.value))
  }
  return filtered
})

// 总页数
const totalPages = computed(() => {
  return Math.ceil(filteredRecords.value.length / pageSize)
})

// 获取用户信息
const getUserInfo = () => {
  userId.value = localStorage.getItem('userId')
}

// 获取学科列表
const fetchSubjects = async () => {
  try {
    subjects.value = await api.get('/subjects')
  } catch (err) {
    console.error('获取学科列表失败:', err)
  }
}

// 获取答题历史
const fetchRecords = async () => {
  try {
    const data = await api.get(`/answer-records/${userId.value}`)
    records.value = data
  } catch (err) {
    error('获取答题历史失败')
    console.error(err)
  }
}

// 获取统计数据
const fetchStatistics = async () => {
  try {
    // 获取答题行为数据
    const behaviorData = await api.get(`/user-stats/behavior/${userId.value}`, {
      params: { days: 30 }
    })
    hourlyDistribution.value = behaviorData.hourlyDistribution || []
    dailyTime.value = behaviorData.dailyTime || []

    // 获取学科雷达图
    const radarRes = await api.get(`/user-stats/subject-radar/${userId.value}`)
    radarData.value = radarRes.radarData || []
  } catch (err) {
    console.error('获取统计数据失败:', err)
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

// 格式化日期时间
const formatDateTime = dateString => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 格式化时间
const formatTime = seconds => {
  if (!seconds || seconds === 0) return '0秒'
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes > 0) {
    return `${minutes}分${secs}秒`
  }
  return `${secs}秒`
}

// 获取正确率样式类
const getAccuracyClass = record => {
  const accuracy = (record.correct_count / record.total_questions) * 100
  if (accuracy >= 80) return 'high'
  if (accuracy >= 60) return 'medium'
  return 'low'
}

// 查看详情
const viewDetail = record => {
  router.push({
    path: `/result/${record.subject_id}/${record.subcategory_id}`,
    query: { recordId: record.id }
  })
}

// 切换页码
const changePage = page => {
  currentPage.value = page
}

// 筛选变化时重置页码
watch(selectedSubject, () => {
  currentPage.value = 1
})

// 返回个人中心
const goBack = () => {
  router.push('/profile')
}

// 渲染时段分布图
const renderHourlyChart = () => {
  if (!hourlyChartRef.value || hourlyDistribution.value.length === 0) return

  import('@visactor/vchart').then(({ default: VChart }) => {
    const spec = {
      type: 'bar',
      data: [
        {
          id: 'hourlyData',
          values: hourlyDistribution.value.map(d => ({
            hour: String(d.label || ''),
            sessions: Number(d.sessions || 0),
            accuracy: Number(d.accuracy || 0)
          }))
        }
      ],
      xField: 'hour',
      yField: 'sessions',
      bar: {
        style: {
          fill: '#4facfe',
          cornerRadius: [4, 4, 0, 0]
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
          label: {
            style: {
              fill: '#666'
            }
          }
        }
      ],
      tooltip: {
        visible: true,
        mark: {
          visible: true
        }
      }
    }

    // ✅ 添加 autoFit 到 spec 中
    spec.autoFit = true

    hourlyChartInstance = new VChart(spec, {
      dom: hourlyChartRef.value,
      mode: 'desktop-browser'
    })
    hourlyChartInstance.renderAsync()
  })
}

// 渲染每日时长图
const renderDailyChart = () => {
  if (!dailyChartRef.value || dailyTime.value.length === 0) return

  import('@visactor/vchart').then(({ default: VChart }) => {
    const spec = {
      type: 'line',
      data: [
        {
          id: 'dailyData',
          values: dailyTime.value.map(d => ({
            date: String(d.date || '').substring(0, 10),
            time: Math.round((d.totalTime || 0) / 60) // 转换为分钟
          }))
        }
      ],
      xField: 'date',
      yField: 'time',
      point: {
        style: {
          size: 4,
          fill: '#43e97b'
        }
      },
      line: {
        style: {
          stroke: '#43e97b',
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
          label: {
            style: {
              fill: '#666'
            },
            formatMethod: val => `${val}分钟`
          }
        }
      ],
      tooltip: {
        visible: true
      }
    }

    // ✅ 添加 autoFit 到 spec 中
    spec.autoFit = true

    dailyChartInstance = new VChart(spec, {
      dom: dailyChartRef.value,
      mode: 'desktop-browser'
    })
    dailyChartInstance.renderAsync()
  })
}

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
      point: {
        style: {
          size: 6,
          fill: '#ff6b6b'
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
      },
      axes: [
        {
          orient: 'radius',
          min: 0,
          max: 100
        }
      ]
    }

    // ✅ 添加 autoFit 到 spec 中
    spec.autoFit = true

    radarChartInstance = new VChart(spec, {
      dom: radarChartRef.value,
      mode: 'desktop-browser'
    })
    radarChartInstance.renderAsync()
  })
}

onMounted(async () => {
  getUserInfo()
  await withLoading(async () => {
    await fetchSubjects()
    await fetchRecords()
    await fetchStatistics()
  })

  // 延迟渲染图表
  setTimeout(async () => {
    renderHourlyChart()
    renderDailyChart()
    renderRadarChart()

    // ✅ 注册到全局自适应管理器
    const { registerChart, observeContainer } = await import('@/utils/chartResize')
    if (hourlyChartInstance) {
      registerChart('answer-hourly', hourlyChartInstance, hourlyChartRef.value)
      observeContainer(hourlyChartRef.value)
    }
    if (dailyChartInstance) {
      registerChart('answer-daily', dailyChartInstance, dailyChartRef.value)
      observeContainer(dailyChartRef.value)
    }
    if (radarChartInstance) {
      registerChart('answer-radar', radarChartInstance, radarChartRef.value)
      observeContainer(radarChartRef.value)
    }
  }, 150)
})
</script>

<style scoped>
.back-section {
  margin-bottom: 1.5rem;
}

.game-filter {
  margin-bottom: 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 16px;
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.history-item:hover {
  transform: translateX(5px);
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.2);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.history-subject {
  font-family: var(--game-font);
  font-size: 1.1rem;
  font-weight: 900;
  color: var(--text-primary);
}

.history-date {
  font-family: var(--game-font);
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.history-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-info {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.history-category {
  font-family: var(--game-font);
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.history-score {
  font-family: var(--game-font);
  font-size: 1.1rem;
  font-weight: 900;
  color: var(--primary-color);
}

.history-stats {
  display: flex;
  gap: 0.8rem;
  align-items: center;
}

.accuracy-badge,
.time-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 12px;
  font-family: var(--game-font);
  font-size: 0.9rem;
  font-weight: 700;
}

.accuracy-badge.high {
  background: var(--success-color);
  color: white;
}

.accuracy-badge.medium {
  background: var(--accent-color);
  color: var(--text-primary);
}

.accuracy-badge.low {
  background: var(--danger-color);
  color: white;
}

.time-badge {
  background: #f0f0f0;
  color: var(--text-primary);
}

.history-arrow {
  position: absolute;
  right: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.5rem;
  color: var(--text-secondary);
}

.empty-message {
  text-align: center;
  padding: 2rem;
  font-family: var(--game-font);
  color: var(--text-secondary);
  font-weight: 600;
}

.pagination-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  margin-top: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 24px;
  border: 3px solid var(--border-color);
}

.page-btn {
  background: white;
  color: var(--primary-color);
  border: 3px solid var(--border-color);
  padding: 0.8rem 1.5rem;
  border-radius: 25px;
  font-family: var(--game-font);
  font-size: 1rem;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 0 var(--border-color);
}

.page-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow:
    0 6px 0 var(--border-color),
    0 10px 15px rgba(255, 209, 102, 0.3);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-family: var(--game-font);
  font-size: 1rem;
  color: var(--text-primary);
  font-weight: 700;
}

@media (max-width: 768px) {
  .history-body {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.8rem;
  }

  .history-arrow {
    display: none;
  }

  .pagination-section {
    flex-direction: column;
    gap: 1rem;
  }
}

/* 图表容器 */
.chart-container {
  width: 100%;
  height: 350px;
  border-radius: 12px;
  background: #fafafa;
  padding: 1rem;
}
</style>
