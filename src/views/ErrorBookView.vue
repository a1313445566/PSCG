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
        <h1 class="page-title">📝 错题本</h1>
        <p class="page-desc">巩固薄弱知识点，提升学习效果</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loader"></div>
        <p>加载中...</p>
      </div>

      <!-- 错题统计 -->
      <div v-else-if="errorSubjects.length > 0" class="game-card">
        <h2 class="section-title">学科错题统计</h2>

        <!-- 筛选和排序 -->
        <div class="filter-section">
          <div class="filter-left">
            <select v-model="sortBy" class="game-select" @change="sortSubjects">
              <option value="count">按错题数量</option>
              <option value="name">按学科名称</option>
              <option value="mastered">按掌握进度</option>
            </select>
            <button class="order-btn" @click="toggleOrder">
              {{ sortOrder === 'desc' ? '↓ 降序' : '↑ 升序' }}
            </button>
          </div>
          <div class="filter-right">
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索学科..."
              class="search-input"
              @input="filterSubjects"
            />
          </div>
        </div>

        <!-- 学科列表 -->
        <div class="game-grid">
          <div
            v-for="subject in paginatedSubjects"
            :key="subject.id"
            class="list-item-card"
            @click="goToErrorPractice(subject)"
          >
            <div class="subject-icon">{{ subject.icon }}</div>
            <div class="subject-info">
              <h3 class="subject-name">{{ subject.name }}</h3>
              <div class="subject-stats">
                <span class="error-count">{{ subject.errorCount }} 道错题</span>
                <span v-if="subject.masteredCount > 0" class="mastered-count">
                  已掌握 {{ subject.masteredCount }} 道
                </span>
              </div>
              <div v-if="subject.errorCount > 0" class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{
                    width: `${(subject.masteredCount / subject.errorCount) * 100}%`
                  }"
                ></div>
              </div>
            </div>
            <div class="subject-arrow">→</div>
          </div>
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
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">🎉</div>
        <h3 style="color: var(--success-color)">太棒了！暂无错题</h3>
        <p>继续保持，努力学习吧！</p>
        <button class="game-btn game-btn-success" @click="goToHome">开始答题</button>
      </div>

      <!-- 学习提示 -->
      <div class="game-card">
        <h2 class="section-title">💡 学习提示</h2>
        <div class="tips-card">
          <div class="tip-item">
            <span class="tip-icon">✅</span>
            <span class="tip-text">连续答对 3 次即可从错题本移除</span>
          </div>
          <div class="tip-item">
            <span class="tip-icon">🎯</span>
            <span class="tip-text">建议每天复习错题，加深记忆</span>
          </div>
          <div class="tip-item">
            <span class="tip-icon">📊</span>
            <span class="tip-text">错题巩固有助于提升学习成绩</span>
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

const errorSubjects = ref([])
const filteredSubjects = ref([])
const userId = ref(null)
const userInfo = ref({})

// 筛选和排序
const sortBy = ref('count')
const sortOrder = ref('desc')
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = 6

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(filteredSubjects.value.length / pageSize)
})

// 分页后的学科列表
const paginatedSubjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredSubjects.value.slice(start, end)
})

// 获取用户信息
const getUserInfo = async () => {
  // 从 localStorage 获取 userId
  const storedUserId = localStorage.getItem('userId')
  if (!storedUserId) {
    router.push('/home')
    return
  }

  userId.value = storedUserId

  // 从 API 获取完整用户信息
  try {
    const user = await api.get(`/users/${userId.value}`)
    userInfo.value = user
  } catch (err) {
    error('获取用户信息失败')
    console.error(err)
    router.push('/home')
  }
}

// 获取错题统计
const fetchErrorStats = async () => {
  try {
    const subjects = await api.get('/subjects')

    const subjectsWithErrors = await Promise.all(
      subjects.map(async subject => {
        try {
          const data = await api.get(`/error-collection/${subject.id}`, {
            studentId: userInfo.value.student_id,
            grade: userInfo.value.grade,
            class: userInfo.value.class
          })

          const errorCount = data.questions ? data.questions.length : 0
          const masteredCount = data.questions
            ? data.questions.filter(q => q.correct_count >= 2).length
            : 0

          return {
            id: subject.id,
            name: subject.name,
            icon: getSubjectIcon(subject.id),
            errorCount,
            masteredCount
          }
        } catch (err) {
          return {
            id: subject.id,
            name: subject.name,
            icon: getSubjectIcon(subject.id),
            errorCount: 0,
            masteredCount: 0
          }
        }
      })
    )

    errorSubjects.value = subjectsWithErrors.filter(s => s.errorCount > 0)
    filteredSubjects.value = [...errorSubjects.value]
    sortSubjects()
  } catch (err) {
    error('获取错题统计失败')
    console.error(err)
  }
}

// 排序学科
const sortSubjects = () => {
  const sorted = [...filteredSubjects.value]

  sorted.sort((a, b) => {
    let valueA, valueB

    if (sortBy.value === 'count') {
      valueA = a.errorCount
      valueB = b.errorCount
    } else if (sortBy.value === 'name') {
      valueA = a.name
      valueB = b.name
      return sortOrder.value === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
    } else if (sortBy.value === 'mastered') {
      const rateA = a.errorCount > 0 ? a.masteredCount / a.errorCount : 0
      const rateB = b.errorCount > 0 ? b.masteredCount / b.errorCount : 0
      valueA = rateA
      valueB = rateB
    }

    return sortOrder.value === 'desc' ? valueB - valueA : valueA - valueB
  })

  filteredSubjects.value = sorted
}

// 切换排序顺序
const toggleOrder = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  sortSubjects()
}

// 筛选学科
const filterSubjects = () => {
  const keyword = searchKeyword.value.toLowerCase().trim()

  if (!keyword) {
    filteredSubjects.value = [...errorSubjects.value]
  } else {
    filteredSubjects.value = errorSubjects.value.filter(s => s.name.toLowerCase().includes(keyword))
  }

  sortSubjects()
  currentPage.value = 1
}

// 切换页码
const changePage = page => {
  currentPage.value = page
}

// 获取学科图标
const getSubjectIcon = subjectId => {
  const icons = {
    1: '📖', // 语文
    2: '🔢', // 数学
    3: '🔤', // 英语
    4: '🔬', // 科学
    5: '🎨', // 美术
    6: '🎵' // 音乐
  }
  return icons[subjectId] || '📚'
}

// 跳转到错题练习
const goToErrorPractice = subject => {
  router.push({
    path: `/quiz/${subject.id}/error-collection`,
    query: {
      mode: 'error-collection',
      title: `${subject.name} - 错题巩固`
    }
  })
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
  await getUserInfo()
  if (userId.value) {
    await withLoading(fetchErrorStats)
  }
})
</script>

<style scoped lang="scss">
.back-section {
  margin-bottom: 1.5rem;
}

.subject-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.subject-info {
  flex: 1;
}

.subject-name {
  font-family: var(--game-font);
  font-size: 1.3rem;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.subject-stats {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.error-count {
  font-family: var(--game-font);
  font-size: 1rem;
  color: var(--primary-color);
  font-weight: 700;
}

.mastered-count {
  font-family: var(--game-font);
  font-size: 0.85rem;
  color: var(--success-color);
  font-weight: 600;
}

.subject-arrow {
  font-size: 1.5rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.list-item-card {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* 筛选和排序 */
.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-left {
  display: flex;
  gap: 0.8rem;
}

.filter-right {
  flex: 1;
  max-width: 250px;
}

.game-select {
  padding: 0.6rem 1rem;
  border-radius: 12px;
  border: 2px solid var(--border-color);
  font-family: var(--game-font);
  font-weight: 600;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
}

.order-btn {
  padding: 0.6rem 1.2rem;
  border-radius: 12px;
  border: 2px solid var(--border-color);
  background: white;
  font-family: var(--game-font);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.order-btn:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.search-input {
  width: 100%;
  padding: 0.6rem 1rem;
  border-radius: 12px;
  border: 2px solid var(--border-color);
  font-family: var(--game-font);
  font-size: 0.9rem;
  outline: none;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
}

/* 分页 */
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
  .filter-section {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-left,
  .filter-right {
    max-width: 100%;
  }

  .pagination-section {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
