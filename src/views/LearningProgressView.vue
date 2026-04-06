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


<style scoped lang="scss" src="./styles/LearningProgressView.scss"></style>
