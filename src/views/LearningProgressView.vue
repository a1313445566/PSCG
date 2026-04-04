<template>
  <div class="learning-progress-view">
    <AppHeader />

    <div class="progress-content">
      <!-- 返回按钮 -->
      <div class="back-section">
        <button class="back-btn" @click="goBack">← 返回个人中心</button>
      </div>

      <!-- 标题 -->
      <div class="header-section">
        <h2 class="page-title">📊 学习进度</h2>
        <p class="page-desc">查看你的学习进度和掌握情况</p>
      </div>

      <!-- 整体进度概览 -->
      <div v-if="overallProgress" class="overview-section">
        <h3 class="section-title">整体进度</h3>
        <div class="overview-cards">
          <div class="overview-card">
            <div class="card-icon">📚</div>
            <div class="card-content">
              <span class="card-label">已学习知识点</span>
              <span class="card-value">{{ overallProgress.total_subcategories || 0 }}</span>
            </div>
          </div>
          <div class="overview-card mastered">
            <div class="card-icon">✅</div>
            <div class="card-content">
              <span class="card-label">已掌握</span>
              <span class="card-value">{{ overallProgress.mastered || 0 }}</span>
            </div>
          </div>
          <div class="overview-card learning">
            <div class="card-icon">📖</div>
            <div class="card-content">
              <span class="card-label">学习中</span>
              <span class="card-value">{{ overallProgress.learning || 0 }}</span>
            </div>
          </div>
          <div class="overview-card not-started">
            <div class="card-icon">📝</div>
            <div class="card-content">
              <span class="card-label">未开始</span>
              <span class="card-value">{{ overallProgress.not_started || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- 平均掌握度进度条 -->
        <div class="avg-mastery-section">
          <div class="mastery-header">
            <span class="mastery-label">平均掌握度</span>
            <span class="mastery-value">{{ Math.round(overallProgress.avg_mastery || 0) }}%</span>
          </div>
          <el-progress
            :percentage="Math.round(overallProgress.avg_mastery || 0)"
            :color="masteryColor"
            :stroke-width="20"
          />
        </div>
      </div>

      <!-- 学科进度 -->
      <div v-if="subjectProgress.length > 0" class="subject-progress-section">
        <h3 class="section-title">各学科进度</h3>
        <div class="subject-grid">
          <div
            v-for="subject in subjectProgress"
            :key="subject.id"
            class="subject-card"
            @click="viewSubjectDetail(subject.id)"
          >
            <div class="subject-header">
              <h4 class="subject-name">{{ subject.subject_name }}</h4>
              <span class="subject-mastery">{{ Math.round(subject.avg_mastery) }}%</span>
            </div>
            <el-progress
              :percentage="Math.round(subject.avg_mastery)"
              :color="getProgressColor(subject.avg_mastery)"
              :stroke-width="12"
            />
            <div class="subject-stats">
              <span class="stat">
                已掌握 {{ subject.mastered }}/{{ subject.total_subcategories }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 知识点详细进度 -->
      <div v-if="progressData.length > 0" class="detail-progress-section">
        <h3 class="section-title">知识点详细进度</h3>

        <!-- 学科筛选 -->
        <div class="filter-section">
          <el-select
            v-model="selectedSubject"
            placeholder="选择学科"
            clearable
            @change="filterProgress"
          >
            <el-option
              v-for="subject in subjectProgress"
              :key="subject.id"
              :label="subject.subject_name"
              :value="subject.id"
            />
          </el-select>
        </div>

        <!-- 进度列表 -->
        <div class="progress-list">
          <div v-for="item in filteredProgress" :key="item.id" class="progress-item">
            <div class="item-header">
              <div class="item-info">
                <span class="item-subject">{{ item.subject_name }}</span>
                <span class="item-subcategory">{{ item.subcategory_name }}</span>
              </div>
              <div class="item-mastery">
                <el-tag :type="getMasteryTagType(item.mastery_level)" size="large">
                  {{ getMasteryLabel(item.mastery_level) }}
                </el-tag>
              </div>
            </div>
            <el-progress
              :percentage="item.mastery_level"
              :color="getProgressColor(item.mastery_level)"
              :stroke-width="10"
            />
            <div class="item-details">
              <div v-if="item.last_practiced" class="detail-item">
                <span class="detail-label">最后练习:</span>
                <span class="detail-value">{{ formatDate(item.last_practiced) }}</span>
              </div>
              <div v-if="item.ai_suggestion" class="detail-item">
                <span class="detail-label">AI建议:</span>
                <span class="detail-value">{{ item.ai_suggestion }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && progressData.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>暂无学习进度数据</h3>
        <p>开始答题后,系统会自动记录你的学习进度</p>
        <button class="start-btn" @click="goToHome">开始答题</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api } from '@/utils/api'
import AppHeader from '@/components/common/AppHeader.vue'
import { useLoading } from '@/composables/useLoading'

const router = useRouter()
const { loading, withLoading } = useLoading()

// 用户信息
const userId = ref(localStorage.getItem('userId'))

// 进度数据
const progressData = ref([])
const overallProgress = ref(null)
const subjectProgress = ref([])
const selectedSubject = ref(null)

// 筛选后的进度数据
const filteredProgress = computed(() => {
  if (!selectedSubject.value) {
    return progressData.value
  }
  return progressData.value.filter(item => item.subject_id === selectedSubject.value)
})

// 根据掌握度获取颜色
const getProgressColor = mastery => {
  if (mastery >= 80) return '#67c23a'
  if (mastery >= 60) return '#409eff'
  if (mastery >= 40) return '#e6a23c'
  return '#f56c6c'
}

// 平均掌握度颜色
const masteryColor = computed(() => {
  const mastery = overallProgress.value?.avg_mastery || 0
  return getProgressColor(mastery)
})

// 获取掌握度标签类型
const getMasteryTagType = mastery => {
  if (mastery >= 80) return 'success'
  if (mastery >= 60) return ''
  if (mastery >= 40) return 'warning'
  return 'danger'
}

// 获取掌握度标签文本
const getMasteryLabel = mastery => {
  if (mastery >= 80) return '已掌握'
  if (mastery >= 60) return '良好'
  if (mastery >= 40) return '学习中'
  return '需加强'
}

// 格式化日期
const formatDate = dateString => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取学习进度详情
const fetchProgressData = async () => {
  try {
    const data = await api.get(`/learning-progress/user/${userId.value}`)
    progressData.value = data.progress || []
  } catch (error) {
    console.error('获取学习进度失败:', error)
    ElMessage.error('获取学习进度失败')
  }
}

// 获取学习进度汇总
const fetchSummaryData = async () => {
  try {
    const data = await api.get(`/learning-progress/summary/${userId.value}`)
    overallProgress.value = data.overall
    subjectProgress.value = data.subjectProgress || []
  } catch (error) {
    console.error('获取学习进度汇总失败:', error)
    ElMessage.error('获取学习进度汇总失败')
  }
}

// 筛选进度
const filterProgress = () => {
  // 筛选逻辑已在 computed 中实现
}

// 查看学科详情
const viewSubjectDetail = subjectId => {
  router.push(`/subcategory/${subjectId}`)
}

// 返回个人中心
const goBack = () => {
  router.push('/profile')
}

// 跳转到首页
const goToHome = () => {
  router.push('/home')
}

onMounted(async () => {
  await withLoading(async () => {
    await Promise.all([fetchProgressData(), fetchSummaryData()])
  })
})
</script>

<style scoped lang="scss">
.learning-progress-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%);
  padding-bottom: 2rem;
}

.progress-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* 返回按钮 */
.back-section {
  margin-bottom: 1.5rem;
}

.back-btn {
  background: white;
  color: var(--primary-color);
  border: 3px solid var(--border-color);
  padding: 0.8rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  font-family: var(--game-font);
  font-size: 1rem;
  font-weight: 900;
  transition: all 0.3s ease;
  box-shadow: 0 4px 0 var(--border-color);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.back-btn:hover {
  transform: translateX(-5px);
  box-shadow:
    0 6px 0 var(--border-color),
    0 10px 15px rgba(255, 209, 102, 0.3);
}

.back-btn:active {
  transform: translateX(-2px);
  box-shadow: 0 2px 0 var(--border-color);
}

/* 标题 */
.header-section {
  text-align: center;
  margin-bottom: 2rem;
}

.page-title {
  font-family: var(--game-font);
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--primary-color);
  margin: 0 0 0.5rem 0;
  text-shadow: 2px 2px 4px rgba(255, 107, 107, 0.3);
  text-transform: uppercase;
  letter-spacing: 2px;
}

.page-desc {
  font-family: var(--game-font);
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 600;
}

/* 整体进度概览 */
.overview-section {
  background: white;
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0 0 20px 0;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.overview-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 20px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
  border: 3px solid var(--border-color);
  box-shadow: 0 4px 0 var(--border-color);
}

.overview-card:hover {
  transform: translateY(-5px);
  box-shadow:
    0 8px 0 var(--border-color),
    0 12px 20px rgba(255, 209, 102, 0.4);
}

.overview-card.mastered {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border-color: var(--success-color);
  box-shadow: 0 4px 0 #05b584;
}

.overview-card.learning {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%);
  border-color: var(--accent-color);
}

.overview-card.not-started {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  border-color: var(--primary-color);
  box-shadow: 0 4px 0 #e85555;
}

.card-icon {
  font-size: 2.5rem;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-label {
  font-family: var(--game-font);
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0.3rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.card-value {
  font-family: var(--game-font);
  font-size: 2rem;
  font-weight: 900;
  color: var(--text-primary);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

/* 平均掌握度 */
.avg-mastery-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%);
  border-radius: 20px;
  padding: 1.5rem;
  border: 3px solid var(--border-color);
}

.mastery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.mastery-label {
  font-family: var(--game-font);
  font-size: 1rem;
  font-weight: 900;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.mastery-value {
  font-family: var(--game-font);
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--primary-color);
  text-shadow: 2px 2px 4px rgba(255, 107, 107, 0.3);
}

/* 学科进度 */
.subject-progress-section {
  background: white;
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.subject-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.subject-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 20px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 3px solid var(--border-color);
  box-shadow: 0 4px 0 var(--border-color);
}

.subject-card:hover {
  transform: translateY(-5px);
  box-shadow:
    0 8px 0 var(--border-color),
    0 12px 20px rgba(255, 209, 102, 0.4);
}

.subject-card:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 var(--border-color);
}

.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.subject-name {
  font-family: var(--game-font);
  font-size: 1.2rem;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.subject-mastery {
  font-family: var(--game-font);
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--primary-color);
  text-shadow: 2px 2px 4px rgba(255, 107, 107, 0.3);
}

.subject-stats {
  margin-top: 0.8rem;
  font-family: var(--game-font);
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 700;
}

/* 知识点详细进度 */
.detail-progress-section {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.filter-section {
  margin-bottom: 20px;
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.progress-item {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 15px;
  padding: 20px;
  transition: transform 0.3s ease;
}

.progress-item:hover {
  transform: translateX(5px);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.item-info {
  display: flex;
  gap: 0.8rem;
  align-items: center;
}

.item-subject {
  font-family: var(--game-font);
  font-weight: 900;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.item-subcategory {
  font-family: var(--game-font);
  color: var(--text-secondary);
  font-weight: 600;
}

.item-details {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  gap: 10px;
  font-size: 14px;
}

.detail-label {
  color: #666;
  font-weight: bold;
}

.detail-value {
  color: #333;
}

/* 空状态 */
.empty-state {
  background: white;
  border-radius: 24px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 3px solid var(--border-color);
  animation: fadeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  font-family: var(--game-font);
  font-size: 1.8rem;
  color: var(--primary-color);
  margin: 0 0 0.8rem 0;
  text-shadow: 2px 2px 4px rgba(255, 107, 107, 0.3);
}

.empty-state p {
  font-family: var(--game-font);
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0 0 1.5rem 0;
  font-weight: 600;
}

.start-btn {
  background: linear-gradient(135deg, var(--primary-color) 0%, #ff8787 100%);
  color: white;
  border: 3px solid var(--border-color);
  padding: 1rem 2rem;
  border-radius: 25px;
  font-family: var(--game-font);
  font-size: 1.1rem;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 0 #e85555;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.start-btn:hover {
  transform: translateY(-5px);
  box-shadow:
    0 8px 0 #e85555,
    0 12px 20px rgba(255, 107, 107, 0.4);
}

.start-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #e85555;
}

/* 响应式 */
@media (max-width: 768px) {
  .progress-content {
    padding: 15px;
  }

  .page-title {
    font-size: 24px;
  }

  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .subject-grid {
    grid-template-columns: 1fr;
  }

  .card-icon {
    font-size: 30px;
  }

  .card-value {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .overview-cards {
    grid-template-columns: 1fr;
  }

  .item-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .item-info {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
