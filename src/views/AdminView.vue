<template>
  <AdminLayout
    :system-title="systemTitle"
    :subjects="subjects"
    @menu-change="handleMenuChange"
    @authenticated="handleAuthenticated"
  >
    <!-- 数据概览 -->
    <DashboardView v-if="activeMenu === 'dashboard'" />

    <!-- 题目管理 -->
    <div v-else-if="activeMenu === 'questions'" class="question-management">
      <QuestionList
        ref="questionListRef"
        :subjects="subjects"
        @delete-question="deleteQuestion"
        @show-batch-add-dialog="batchAddDialogVisible = true"
      />
    </div>

    <!-- 学科管理 -->
    <div v-else-if="activeMenu === 'subjects'" class="subject-management">
      <SubjectManagement @manage-subcategories="manageSubcategories" />
    </div>

    <!-- 年级班级 -->
    <div v-else-if="activeMenu === 'grades-classes'" class="grades-classes-management">
      <GradeClassManagement />
    </div>

    <!-- 用户答题统计 -->
    <UserStatsView v-else-if="activeMenu === 'user-stats'" />

    <!-- 最近答题记录 -->
    <RecentRecordsView v-else-if="activeMenu === 'recent-records'" />

    <!-- 用户管理 -->
    <div v-else-if="activeMenu === 'user-management'" class="user-management-view">
      <UserManagement
        ref="userManagementRef"
        :grades="grades"
        :classes="classes"
        @update-users="updateUserList"
      />
    </div>

    <!-- 基础设置 -->
    <div v-else-if="activeMenu === 'basic-settings'" class="basic-settings">
      <InterfaceNameSetting
        :interface-name="interfaceName"
        @update-interface-name="updateInterfaceName"
      />

      <AnswerSetting
        :randomize-answers="randomizeAnswers"
        :randomize-error-collection-answers="randomizeErrorCollectionAnswers"
        :fixed-question-count="fixedQuestionCount"
        :min-question-count="minQuestionCount"
        :max-question-count="maxQuestionCount"
        :fixed-question-count-value="fixedQuestionCountValue"
        :subjects="subjects"
        :subject-question-counts="subjectQuestionCounts"
        @update-settings="updateAnswerSettings"
      />
    </div>

    <!-- 数据库管理 -->
    <div v-else-if="activeMenu === 'database'" class="data-management">
      <BackupRestore
        :backup-history="backupHistory"
        @backup-data="backupData"
        @upload-backup="uploadBackup"
        @download-backup="downloadBackup"
        @delete-backup="deleteBackup"
        @get-backup-history="getBackupHistory"
        @verify-backup="verifyBackup"
      />
      <DataCleanup
        @clear-all-data="clearAllData"
        @clear-user-records="clearUserRecords"
        @clear-leaderboard="clearLeaderboard"
        @clear-grades="clearGrades"
        @clear-classes="clearClasses"
      />
    </div>

    <!-- 安全中心 -->
    <SecurityMonitor v-else-if="activeMenu === 'security'" />

    <!-- 数据分析 -->
    <DataAnalysis v-else-if="activeMenu === 'data-analysis'" />

    <!-- AI 助手 -->
    <ChatContainer v-else-if="activeMenu === 'ai-chat'" />

    <!-- 模型管理 -->
    <ModelManager v-else-if="activeMenu === 'ai-models'" />

    <!-- 默认显示数据概览 -->
    <DashboardView v-else />

    <!-- 学科题库管理对话框 -->
    <SubcategoryDialog
      v-model:visible="subcategoryDialogVisible"
      :subject="currentSubjectForSubcategory"
      @add-subcategory="addSubcategory"
      @update-subcategory="updateSubcategory"
      @delete-subcategory="deleteSubcategory"
    />

    <!-- 批量添加题目对话框 -->
    <BatchAddQuestion
      v-model:visible="batchAddDialogVisible"
      :subjects="subjects"
      @batch-add-questions="handleBatchAddQuestions"
    />
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onUnmounted, defineAsyncComponent, provide } from 'vue'
import { useQuestionStore, useSettingsStore } from '../stores/questionStore'
import { useAdminLayout } from '../composables/useAdminLayout'
import message from '../utils/message'
import { useLoading } from '../composables/useLoading'
import { api } from '../utils/api'
import { getApiBaseUrl } from '../utils/database'

// 布局组件
import AdminLayout from '../components/admin/layout/AdminLayout.vue'

// 核心组件 - 同步导入
import InterfaceNameSetting from '../components/admin/basic-settings/InterfaceNameSetting.vue'
import AnswerSetting from '../components/admin/basic-settings/AnswerSetting.vue'
import SubjectManagement from '../components/admin/basic-settings/SubjectManagement.vue'
import GradeClassManagement from '../components/admin/basic-settings/GradeClassManagement.vue'

// 异步组件
const QuestionList = defineAsyncComponent(
  () => import('../components/admin/question-management/QuestionList.vue')
)
const UserManagement = defineAsyncComponent(
  () => import('../components/admin/user-management/UserManagement.vue')
)
const UserStatsView = defineAsyncComponent(
  () => import('../components/admin/user-data/UserStatsView.vue')
)
const RecentRecordsView = defineAsyncComponent(
  () => import('../components/admin/user-data/RecentRecordsView.vue')
)
const SecurityMonitor = defineAsyncComponent(
  () => import('../components/admin/security/SecurityMonitor.vue')
)
const BackupRestore = defineAsyncComponent(
  () => import('../components/admin/data-management/BackupRestore.vue')
)
const DataCleanup = defineAsyncComponent(
  () => import('../components/admin/data-management/DataCleanup.vue')
)
const DashboardView = defineAsyncComponent(() => import('./admin/DashboardView.vue'))
const BatchAddQuestion = defineAsyncComponent(
  () => import('../components/admin/question-management/BatchAddQuestion.vue')
)
const SubcategoryDialog = defineAsyncComponent(
  () => import('../components/admin/common/SubcategoryDialog.vue')
)
const DataAnalysis = defineAsyncComponent(
  () => import('../components/admin/analysis/DataAnalysis.vue')
)

// AI 对话和模型管理组件
const ChatContainer = defineAsyncComponent(
  () => import('../components/admin/chat/ChatContainer.vue')
)
const ModelManager = defineAsyncComponent(
  () => import('../components/admin/models/ModelManager.vue')
)

const questionStore = useQuestionStore()
const settingsStore = useSettingsStore()
const { activeMenu, setActiveMenu } = useAdminLayout()
const { cleanup: cleanupLoading } = useLoading()

// 系统标题
const systemTitle = computed(() => settingsStore.interfaceName || '题库管理系统')

// Store 数据
const subjects = computed(() => questionStore.subjects)
const grades = computed(() => questionStore.grades)
const classes = computed(() => questionStore.classes)
const backupHistory = ref([])

// 提供数据给子组件
provide('grades', grades)
provide('classes', classes)
provide('subjects', subjects)

// 组件引用
const questionListRef = ref(null)
const userManagementRef = ref(null)

// 菜单变化处理
const handleMenuChange = key => {
  setActiveMenu(key)
}

// 认证成功处理
const handleAuthenticated = () => {
  // 可以在这里做一些认证后的初始化
}

// 组件挂载状态
let isComponentMounted = true

// ==================== 题目管理 ====================
const batchAddDialogVisible = ref(false)

const deleteQuestion = questionId => {
  questionStore.deleteQuestion(questionId)
  questionListRef.value?.refresh()
}

const handleBatchAddQuestions = async questions => {
  if (!isComponentMounted) return

  try {
    for (const question of questions) {
      if (!isComponentMounted) return
      await questionStore.addQuestion(question)
    }
    if (isComponentMounted) {
      message.success(`成功添加 ${questions.length} 道题目`)
      questionListRef.value?.refresh()
    }
  } catch (error) {
    console.error('批量添加题目失败:', error)
    if (isComponentMounted) {
      message.error('批量添加题目失败，请稍后重试')
    }
  }
}

// ==================== 学科管理 ====================
const subcategoryDialogVisible = ref(false)
const currentSubjectForSubcategory = ref(null)

const manageSubcategories = subject => {
  currentSubjectForSubcategory.value = subject
  subcategoryDialogVisible.value = true
}

const addSubcategory = async (subjectId, subcategory) => {
  try {
    await questionStore.addSubcategory(
      subjectId,
      subcategory.name,
      subcategory.iconIndex,
      subcategory.difficulty
    )
    if (isComponentMounted) {
      message.success('学科题库添加成功！')
    }
    await questionStore.loadData()
  } catch (error) {
    if (isComponentMounted) {
      message.error('添加学科题库失败，请稍后重试！')
    }
  }
}

const updateSubcategory = async (subjectId, subcategory) => {
  try {
    await questionStore.updateSubcategory(
      subjectId,
      subcategory.id,
      subcategory.name,
      subcategory.iconIndex,
      subcategory.difficulty
    )
    if (isComponentMounted) {
      message.success('学科题库更新成功！')
    }
    await questionStore.loadData()
  } catch (error) {
    if (isComponentMounted) {
      message.error('更新学科题库失败，请稍后重试！')
    }
  }
}

const deleteSubcategory = async (subjectId, subcategoryId) => {
  try {
    await questionStore.deleteSubcategory(subjectId, subcategoryId)
    if (isComponentMounted) {
      message.success('学科题库删除成功！')
    }
    await questionStore.loadData()
    questionListRef.value?.refresh()
  } catch (error) {
    if (isComponentMounted) {
      message.error('删除学科题库失败，请稍后重试！')
    }
  }
}

// ==================== 用户管理 ====================
const updateUserList = async () => {
  if (!isComponentMounted) return

  if (isComponentMounted) {
    userManagementRef.value?.refresh()
    message.success('用户列表已更新')
  }
}

// ==================== 数据库管理 ====================
const clearAllData = async () => {
  if (!isComponentMounted) return

  try {
    await api.post('/data/clear-all')
    const results = await Promise.allSettled([
      questionStore.loadData(),
      questionStore.loadQuestions({ excludeContent: true })
    ])

    if (!isComponentMounted) return

    const failedOperations = results
      .map((r, i) => {
        if (r.status === 'rejected') {
          const names = ['学科数据', '题目数据']
          return `${names[i]}: ${r.reason?.message || '未知错误'}`
        }
        return null
      })
      .filter(Boolean)

    questionListRef.value?.refresh()
    userManagementRef.value?.refresh()

    if (failedOperations.length > 0) {
      message.warning(`数据已清空，但部分数据刷新失败: ${failedOperations.join(', ')}`)
    } else {
      message.success('所有数据已清空')
    }
  } catch (error) {
    console.error('[clearAllData] 清空数据失败:', error)
    if (isComponentMounted) {
      message.error('清空数据失败，请稍后重试')
    }
  }
}

const clearUserRecords = async () => {
  if (!isComponentMounted) return

  try {
    await api.post('/data/clear-records')
    if (isComponentMounted) {
      userManagementRef.value?.refresh()
      message.success('用户答题记录已清空')
    }
  } catch (error) {
    console.error('清空用户答题记录失败:', error)
    if (isComponentMounted) {
      message.error('清空用户答题记录失败，请稍后重试')
    }
  }
}

const clearLeaderboard = async () => {
  if (!isComponentMounted) return

  try {
    await api.post('/data/clear-leaderboard')
    if (isComponentMounted) {
      message.success('排行榜数据已清空')
    }
  } catch (error) {
    console.error('清空排行榜数据失败:', error)
    if (isComponentMounted) {
      message.error('清空排行榜数据失败，请稍后重试')
    }
  }
}

const clearGrades = async () => {
  if (!isComponentMounted) return

  try {
    await api.post('/data/clear-grades')
    await questionStore.loadData()
    if (isComponentMounted) {
      userManagementRef.value?.refresh()
      message.success('年级数据已清空')
    }
  } catch (error) {
    console.error('清空年级数据失败:', error)
    if (isComponentMounted) {
      message.error('清空年级数据失败，请稍后重试')
    }
  }
}

const clearClasses = async () => {
  if (!isComponentMounted) return

  try {
    await api.post('/data/clear-classes')
    await questionStore.loadData()
    if (isComponentMounted) {
      userManagementRef.value?.refresh()
      message.success('班级数据已清空')
    }
  } catch (error) {
    console.error('清空班级数据失败:', error)
    if (isComponentMounted) {
      message.error('清空班级数据失败，请稍后重试')
    }
  }
}

const backupData = async (backupParams = {}) => {
  if (!isComponentMounted) return

  try {
    const params = new URLSearchParams()
    params.append('type', backupParams.type || 'full')
    params.append('format', backupParams.format || 'json')
    if (backupParams.dataTypes && backupParams.dataTypes.length > 0) {
      params.append('dataTypes', backupParams.dataTypes.join(','))
    }

    const response = await fetch(`${getApiBaseUrl()}/backup?${params.toString()}`)
    const blob = await response.blob()
    const downloadUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    const format = backupParams.format || 'json'
    const extension = format === 'json' ? 'json' : 'db'
    a.download = `backup-${new Date().toISOString().slice(0, 10)}-${backupParams.type || 'full'}.${extension}`
    a.click()
    URL.revokeObjectURL(downloadUrl)
    if (isComponentMounted) {
      message.success('数据备份成功')
    }
  } catch (error) {
    console.error('备份数据失败:', error)
    if (isComponentMounted) {
      message.error('备份数据失败，请稍后重试')
    }
  }
}

const uploadBackup = async file => {
  if (!isComponentMounted) return

  try {
    const formData = new FormData()
    formData.append('backup', file.raw)

    await api.postFormData('/restore', formData)

    if (response.ok) {
      const results = await Promise.allSettled([
        questionStore.loadData(),
        questionStore.loadQuestions({ excludeContent: true })
      ])

      if (!isComponentMounted) return

      const failedOperations = results
        .map((r, i) => {
          if (r.status === 'rejected') {
            const names = ['学科数据', '题目数据']
            return `${names[i]}: ${r.reason?.message || '未知错误'}`
          }
          return null
        })
        .filter(Boolean)

      questionListRef.value?.refresh()
      userManagementRef.value?.refresh()

      if (failedOperations.length > 0) {
        message.warning(`数据已恢复，但部分数据刷新失败: ${failedOperations.join(', ')}`)
      } else {
        message.success('数据恢复成功')
      }
    } else {
      throw new Error('恢复数据失败')
    }
  } catch (error) {
    console.error('上传备份文件失败:', error)
    if (isComponentMounted) {
      message.error('上传备份文件失败，请稍后重试')
    }
  }
}

const getBackupHistory = async () => {
  if (!isComponentMounted) return []

  try {
    const history = await api.get('/backup/history')
    if (isComponentMounted) {
      backupHistory.value = history
    }
    return history
  } catch (error) {
    console.error('获取备份历史失败:', error)
    if (isComponentMounted) {
      message.error('获取备份历史失败，请稍后重试')
      backupHistory.value = []
    }
    return []
  }
}

const downloadBackup = async backupId => {
  if (!isComponentMounted) return

  try {
    const response = await fetch(`${getApiBaseUrl()}/backup/${backupId}`)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup-${backupId}.db`
    a.click()
    URL.revokeObjectURL(url)
    if (isComponentMounted) {
      message.success('备份文件下载成功')
    }
  } catch (error) {
    console.error('下载备份失败:', error)
    if (isComponentMounted) {
      message.error('下载备份失败，请稍后重试')
    }
  }
}

const deleteBackup = async backupId => {
  if (!isComponentMounted) return

  try {
    await api.delete(`/backup/${backupId}`)
    if (isComponentMounted) {
      message.success('备份文件删除成功')
    }
  } catch (error) {
    console.error('删除备份失败:', error)
    if (isComponentMounted) {
      message.error('删除备份失败，请稍后重试')
    }
  }
}

const verifyBackup = async file => {
  if (!isComponentMounted) return

  try {
    const formData = new FormData()
    formData.append('backup', file.raw)

    const response = await fetch(`${getApiBaseUrl()}/backup/verify`, {
      method: 'POST',
      body: formData
    })

    if (response.ok) {
      const result = await response.json()
      if (!isComponentMounted) return

      if (result.valid) {
        const { ElMessageBox } = await import('element-plus')
        ElMessageBox.alert(
          `<div style="text-align: left;">
            <p><strong>验证结果:</strong> 备份文件有效</p>
            <p><strong>备份类型:</strong> ${result.type}</p>
            <p><strong>备份时间:</strong> ${new Date(result.timestamp).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
            <p><strong>数据大小:</strong> ${result.size}</p>
            ${result.dataTypes ? `<p><strong>包含数据:</strong> ${result.dataTypes.join(', ')}</p>` : ''}
          </div>`,
          '备份文件验证成功',
          {
            dangerouslyUseHTMLString: true,
            confirmButtonText: '确定'
          }
        )
      } else {
        message.error(`备份文件验证失败: ${result.message}`)
      }
    } else {
      throw new Error('验证失败')
    }
  } catch (error) {
    console.error('验证备份文件失败:', error)
    if (isComponentMounted) {
      message.error('验证备份文件失败，请稍后重试')
    }
  }
}

// ==================== 基础设置 ====================
const interfaceName = computed({
  get: () => settingsStore.interfaceName,
  set: () => {}
})

const randomizeAnswers = computed({
  get: () => settingsStore.settings.randomizeAnswers,
  set: value => {
    settingsStore.settings.randomizeAnswers = value
  }
})

const randomizeErrorCollectionAnswers = computed({
  get: () => settingsStore.settings.randomizeErrorCollectionAnswers,
  set: value => {
    settingsStore.settings.randomizeErrorCollectionAnswers = value
  }
})

const fixedQuestionCount = computed({
  get: () => settingsStore.settings.fixedQuestionCount,
  set: value => {
    settingsStore.settings.fixedQuestionCount = value
  }
})

const minQuestionCount = computed({
  get: () => settingsStore.settings.minQuestionCount,
  set: value => {
    settingsStore.settings.minQuestionCount = value
  }
})

const maxQuestionCount = computed({
  get: () => settingsStore.settings.maxQuestionCount,
  set: value => {
    settingsStore.settings.maxQuestionCount = value
  }
})

const fixedQuestionCountValue = computed({
  get: () => settingsStore.settings.fixedQuestionCountValue,
  set: value => {
    settingsStore.settings.fixedQuestionCountValue = value
  }
})

const subjectQuestionCounts = computed({
  get: () => settingsStore.settings.subjectQuestionCounts,
  set: value => {
    settingsStore.settings.subjectQuestionCounts = value
  }
})

const updateInterfaceName = async value => {
  if (!isComponentMounted) return

  if (value) {
    await settingsStore.updateInterfaceName(value)
    if (isComponentMounted) {
      message.success('界面名称更新成功！')
    }
  } else {
    if (isComponentMounted) {
      message.error('请输入界面名称')
    }
  }
}

const updateAnswerSettings = async settings => {
  if (!isComponentMounted) return

  const success = await settingsStore.updateSettings({
    randomizeAnswers: settings.randomizeAnswers.toString(),
    randomizeErrorCollectionAnswers: settings.randomizeErrorCollectionAnswers.toString(),
    fixedQuestionCount: settings.fixedQuestionCount.toString(),
    minQuestionCount: settings.minQuestionCount.toString(),
    maxQuestionCount: settings.maxQuestionCount.toString(),
    fixedQuestionCountValue: settings.fixedQuestionCountValue.toString(),
    subjectQuestionCounts: settings.subjectQuestionCounts
  })
  if (isComponentMounted) {
    if (success) {
      message.success('答题设置更新成功！')
    } else {
      message.error('答题设置更新失败')
    }
  }
}

// 清理
onUnmounted(() => {
  isComponentMounted = false
  cleanupLoading()
})
</script>

<style scoped lang="scss">
.question-management,
.subject-management,
.grades-classes-management,
.user-management-view,
.data-management {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.basic-settings {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.basic-settings .setting-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.basic-settings .setting-title {
  background-color: #f5f7fa;
  padding: 16px 20px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
}

/* 筛选卡片 */
.filter-card {
  margin-bottom: 24px !important;
  border-radius: 12px !important;
  overflow: hidden !important;
}

.filter-card :deep(.el-card__header) {
  padding: 16px 20px !important;
  border-bottom: 1px solid #ebeef5 !important;
  background-color: #f5f7fa !important;
}

.filter-card :deep(.el-card__body) {
  padding: 20px !important;
}
</style>
