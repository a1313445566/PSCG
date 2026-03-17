<template>
  <div class="admin-container">
    <!-- 密码验证对话框 -->
    <PasswordDialog
      v-model:visible="passwordDialogVisible"
      @login-success="handlePasswordVerify"
    />

    <div class="admin-header" v-if="isAuthenticated">
      <h1 class="title">题库管理系统</h1>
      <div class="header-buttons">
        <el-button type="primary" @click="backToHome" class="action-btn">🏠 返回首页</el-button>
        <el-button type="danger" @click="logout">退出登录</el-button>
      </div>
    </div>
    
    <el-tabs v-model="activeTab" v-if="isAuthenticated">
      <!-- 基础设置 -->
      <el-tab-pane label="基础设置" name="basic-settings">
        <div class="basic-settings">
          <!-- 界面名称设置 -->
          <InterfaceNameSetting 
            :interface-name="interfaceName"
            @update-interface-name="updateInterfaceName"
          />
          
          <!-- 答题设置 -->
          <AnswerSetting 
            :randomize-answers="randomizeAnswers"
            :fixed-question-count="fixedQuestionCount"
            :min-question-count="minQuestionCount"
            :max-question-count="maxQuestionCount"
            :fixed-question-count-value="fixedQuestionCountValue"
            @update-settings="updateAnswerSettings"
          />
          
          <!-- 学科管理 -->
          <SubjectManagement 
            @manage-subcategories="manageSubcategories"
          />
          
          <!-- 年级班级管理 -->
          <GradeClassManagement />
        </div>
      </el-tab-pane>
      
      <!-- 题目管理 -->
      <el-tab-pane label="题目管理" name="questions">
        <div class="question-management">
          <QuestionList 
            :questions="questions"
            :subjects="subjects"
            @edit-question="editQuestion"
            @delete-question="deleteQuestion"
            @batch-delete-questions="batchDeleteQuestions"
            @show-add-dialog="showAddQuestionDialog"
            @show-batch-add-dialog="batchAddDialogVisible = true"
          />
        </div>
      </el-tab-pane> 
      
      <!-- 排行榜管理 -->
      <el-tab-pane label="排行榜管理" name="leaderboard">
        <div class="leaderboard-management">
          <UserStats 
            :user-stats="userStats"
            @open-user-detail="openUserDetailDialog"
          />
          <RecentRecords 
            :recent-records="recentRecords"
            @open-user-detail="openUserDetailDialog"
          />
        </div>
      </el-tab-pane>
      
      <!-- 数据分析 -->
      <el-tab-pane label="数据分析" name="analysis">
        <AnalysisView />
      </el-tab-pane>
      
      <!-- 数据库管理 -->
      <el-tab-pane label="数据库管理" name="data-management" @click="handleDataManagementClick">
        <div v-if="isDataManagementAuthenticated" class="data-management">
          <BackupRestore />
          <DataCleanup />
        </div>
        <div v-else class="data-management-locked">
          <el-icon class="lock-icon"><i class="el-icon-lock"></i></el-icon>
          <h3>数据库管理功能已锁定</h3>
          <p>请输入管理员密码解锁数据库管理功能</p>
          <el-button type="primary" @click="showDataManagementPasswordDialog">解锁数据库管理</el-button>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <!-- 数据库管理密码验证对话框 -->
    <el-dialog
      v-model="dataManagementPasswordDialogVisible"
      title="🔐 数据库管理验证"
      width="480px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @open="focusDataManagementPasswordInput"
      custom-class="database-management-dialog"
    >
      <div class="dialog-content">
        <div class="dialog-icon">
          <el-icon class="lock-icon"><i class="el-icon-lock"></i></el-icon>
        </div>
        <h3 class="dialog-title">数据库管理验证</h3>
        <p class="dialog-description">为了保护系统安全，请输入管理员密码解锁数据库管理功能</p>
        <el-form :model="dataManagementPasswordForm" label-width="100px" @submit.prevent="verifyDataManagementPassword" class="password-form">
          <el-form-item label="管理员密码" class="password-input-item">
            <el-input 
              ref="dataManagementPasswordInputRef" 
              v-model="dataManagementPasswordForm.password" 
              type="password" 
              placeholder="请输入管理员密码" 
              show-password 
              @keyup="handleDataManagementKeyUp"
              class="password-input"
            ></el-input>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button class="cancel-button" @click="dataManagementPasswordDialogVisible = false">取消</el-button>
          <el-button type="primary" class="verify-button" @click="verifyDataManagementPassword">验证</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 题目详情对话框 -->
    <QuestionDetailDialog
      v-model:visible="questionDetailDialogVisible"
      :question="selectedQuestionDetail"
    />

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
    
    <!-- 添加/编辑题目对话框 -->
    <QuestionForm
      v-model:visible="dialogVisible"
      :question="selectedQuestion"
      :subjects="subjects"
      @save-question="saveQuestion"
    />
  </div>
  
  <!-- 用户详情对话框 -->
  <UserDetailDialog
    v-model:visible="userDetailDialogVisible"
    :user="selectedUser"
    :answer-record-id="currentAnswerRecordId"
    :dialog-source="dialogSource"
  />
</template>

<style scoped>
/* 基础样式 */
.admin-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.admin-header .title {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.admin-header .action-btn {
  margin-right: 10px;
}

.el-tabs {
  padding: 20px;
  background-color: #fff;
  flex: 1;
}

.correct-answer {
  color: #67c23a;
  font-weight: bold;
}

.incorrect-answer {
  color: #f56c6c;
  font-weight: bold;
}

/* 基础设置样式 */
.basic-settings {
  padding: 20px;
}

.setting-card {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.setting-title {
  background-color: #f5f7fa;
  padding: 15px 20px;
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
}

.sub-setting-title {
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 15px;
  margin-top: 0;
}

/* 表格样式 */
.table-container {
  margin-top: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 24px;
  overflow: hidden;
}

/* 筛选区域 */
.filter-section {
  margin-bottom: 20px !important;
  padding: 16px !important;
  background-color: #f8f9fa !important;
  border-radius: 8px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
}

/* 按钮样式 */
.el-button {
  border-radius: 6px !important;
  transition: all 0.3s ease !important;
}

.el-button:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

/* 输入框和选择器 */
.el-input,
.el-select {
  border-radius: 6px !important;
  transition: all 0.3s ease !important;
}

.el-input:focus-within,
.el-select:focus-within {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2) !important;
}

/* 分页 */
.pagination {
  margin-top: 24px !important;
  text-align: right !important;
}

/* 响应式设计 */
@media screen and (max-width: 1200px) {
  .table-container {
    padding: 16px !important;
  }
  
  .el-table__cell {
    padding: 12px 8px !important;
  }
}

@media screen and (max-width: 768px) {
  .table-container {
    padding: 12px !important;
  }
  
  .el-table__cell {
    padding: 8px 4px !important;
  }
}

/* 数据管理锁定状态 */
.data-management-locked {
  padding: 60px;
  text-align: center;
}

.lock-icon {
  font-size: 48px;
  color: #909399;
  margin-bottom: 20px;
}

.data-management-locked h3 {
  margin-bottom: 10px;
  color: #606266;
}

.data-management-locked p {
  color: #909399;
  margin-bottom: 30px;
}
</style>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuestionStore, useSettingsStore } from '../stores/questionStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getApiBaseUrl } from '../utils/database'

// 导入模块化组件
import PasswordDialog from '../components/admin/auth/PasswordDialog.vue'
import InterfaceNameSetting from '../components/admin/basic-settings/InterfaceNameSetting.vue'
import AnswerSetting from '../components/admin/basic-settings/AnswerSetting.vue'
import SubjectManagement from '../components/admin/basic-settings/SubjectManagement.vue'
import GradeClassManagement from '../components/admin/basic-settings/GradeClassManagement.vue'
import QuestionList from '../components/admin/question-management/QuestionList.vue'
import QuestionForm from '../components/admin/question-management/QuestionForm.vue'
import BatchAddQuestion from '../components/admin/question-management/BatchAddQuestion.vue'
import UserStats from '../components/admin/leaderboard-management/UserStats.vue'
import RecentRecords from '../components/admin/leaderboard-management/RecentRecords.vue'
import BackupRestore from '../components/admin/data-management/BackupRestore.vue'
import DataCleanup from '../components/admin/data-management/DataCleanup.vue'
import UserDetailDialog from '../components/admin/common/UserDetailDialog.vue'
import QuestionDetailDialog from '../components/admin/common/QuestionDetailDialog.vue'
import SubcategoryDialog from '../components/admin/common/SubcategoryDialog.vue'

import AnalysisView from './AnalysisView.vue'

const questionStore = useQuestionStore()
const settingsStore = useSettingsStore()
const router = useRouter()

// 状态管理
const activeTab = ref('basic-settings')
const subjects = computed(() => questionStore.subjects)
const questions = computed(() => questionStore.questions)
const userStats = computed(() => questionStore.userStats)
const recentRecords = computed(() => questionStore.recentRecords)

// 界面名称设置
const interfaceName = computed({
  get: () => settingsStore.interfaceName,
  set: (value) => {}
})

// 答题设置
const randomizeAnswers = computed({
  get: () => settingsStore.settings.randomizeAnswers,
  set: (value) => { settingsStore.settings.randomizeAnswers = value }
})
const fixedQuestionCount = computed({
  get: () => settingsStore.settings.fixedQuestionCount,
  set: (value) => { settingsStore.settings.fixedQuestionCount = value }
})
const minQuestionCount = computed({
  get: () => settingsStore.settings.minQuestionCount,
  set: (value) => { settingsStore.settings.minQuestionCount = value }
})
const maxQuestionCount = computed({
  get: () => settingsStore.settings.maxQuestionCount,
  set: (value) => { settingsStore.settings.maxQuestionCount = value }
})
const fixedQuestionCountValue = computed({
  get: () => settingsStore.settings.fixedQuestionCountValue,
  set: (value) => { settingsStore.settings.fixedQuestionCountValue = value }
})

// 题目管理相关
const isCategoryView = ref(false)
const selectedQuestions = ref([])
const dialogVisible = ref(false)
const isEditing = ref(false)
const batchAddDialogVisible = ref(false)
const selectedQuestion = ref(null)

// 子分类管理相关
const subcategoryDialogVisible = ref(false)
const currentSubjectForSubcategory = ref(null)

// 密码验证相关
const isAuthenticated = ref(false)
const passwordDialogVisible = ref(true)
const passwordInputRef = ref(null)

// 数据库管理验证相关
const isDataManagementAuthenticated = ref(false)
const dataManagementPasswordDialogVisible = ref(false)
const dataManagementPasswordForm = ref({
  password: ''
})
const dataManagementPasswordInputRef = ref(null)

// 用户详情相关
const userDetailDialogVisible = ref(false)
const selectedUser = ref(null)
const dialogSource = ref('')
const currentAnswerRecordId = ref(null)
const questionDetailDialogVisible = ref(false)
const selectedQuestionDetail = ref(null)

// 表单数据
const form = ref({
  id: null,
  subjectId: '',
  subcategoryId: '',
  type: 'single',
  content: '<p>请输入题目内容</p>',
  options: ['', '', '', ''],
  answer: '',
  selectedAnswers: [],
  explanation: ''
})

// 方法
const handlePasswordVerify = async (isVerified) => {
  if (isVerified) {
    isAuthenticated.value = true
    passwordDialogVisible.value = false
    // 使用sessionStorage存储状态
    sessionStorage.setItem('adminAuthenticated', 'true')
    // 加载设置
    await loadSettings()
    // 加载题目和学科数据
    await questionStore.loadData()
  }
}

const focusPasswordInput = () => {
  setTimeout(() => {
    if (passwordInputRef.value && passwordInputRef.value.$el) {
      const inputElement = passwordInputRef.value.$el.querySelector('input')
      if (inputElement) {
        inputElement.focus()
      }
    }
  }, 100)
}

const logout = () => {
  isAuthenticated.value = false
  isDataManagementAuthenticated.value = false
  passwordDialogVisible.value = true
  sessionStorage.removeItem('adminAuthenticated')
  sessionStorage.removeItem('dataManagementAuthenticated')
}

const backToHome = () => {
  router.push('/')
}

const handleDataManagementClick = () => {
  // 检查sessionStorage中的数据库管理认证状态
  if (sessionStorage.getItem('dataManagementAuthenticated') === 'true') {
    isDataManagementAuthenticated.value = true
  } else {
    showDataManagementPasswordDialog()
  }
}

const showDataManagementPasswordDialog = () => {
  dataManagementPasswordDialogVisible.value = true
}

const verifyDataManagementPassword = () => {
  // 正确密码
  const correctPassword = 'xgsy8188'
  
  if (dataManagementPasswordForm.value.password === correctPassword) {
    isDataManagementAuthenticated.value = true
    dataManagementPasswordDialogVisible.value = false
    // 使用sessionStorage存储状态
    sessionStorage.setItem('dataManagementAuthenticated', 'true')
    ElMessage.success('数据库管理功能已解锁！')
  } else {
    ElMessage.error('密码错误，请重新输入！')
    dataManagementPasswordForm.value.password = ''
  }
}

const focusDataManagementPasswordInput = () => {
  setTimeout(() => {
    if (dataManagementPasswordInputRef.value && dataManagementPasswordInputRef.value.$el) {
      const inputElement = dataManagementPasswordInputRef.value.$el.querySelector('input')
      if (inputElement) {
        inputElement.focus()
      }
    }
  }, 100)
}

const handleDataManagementKeyUp = (event) => {
  if (event.key === 'Enter' || event.keyCode === 13) {
    verifyDataManagementPassword()
  }
}

const toggleViewMode = () => {
  isCategoryView.value = !isCategoryView.value
}

const handleSelectionChange = (selection) => {
  selectedQuestions.value = selection
}

const batchDeleteQuestions = (questionIds) => {
  if (!questionIds || questionIds.length === 0) return
  
  ElMessageBox.confirm(`确定要删除选中的 ${questionIds.length} 道题目吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
  .then(() => {
    questionIds.forEach(id => {
      questionStore.deleteQuestion(id)
    })
    ElMessage.success('题目批量删除成功')
  })
  .catch(() => {
    // 取消删除
  })
}

const showAddQuestionDialog = () => {
  isEditing.value = false
  selectedQuestion.value = null
  dialogVisible.value = true
}

const editQuestion = (question) => {
  isEditing.value = true
  
  // 直接设置selectedQuestion，让QuestionForm组件处理数据转换
  selectedQuestion.value = question
  
  dialogVisible.value = true
}

// 删除题目
const deleteQuestion = (questionId) => {
  questionStore.deleteQuestion(questionId)
}

const saveQuestion = async (formData) => {
  try {
    let savedQuestion;
    if (isEditing.value) {
      savedQuestion = await questionStore.updateQuestion(formData)
      ElMessage.success('题目更新成功！')
    } else {
      savedQuestion = await questionStore.addQuestion(formData)
      ElMessage.success('题目添加成功！')
    }
    
    // 添加调试信息，显示保存后的题目数据

    
    // 如果有题目ID，从数据库获取完整数据
    if (savedQuestion && savedQuestion.id) {
      try {
        const response = await fetch(`/api/questions/${savedQuestion.id}`);
        if (response.ok) {
          const questionFromDb = await response.json();

        }
      } catch (error) {

      }
    }
    
    dialogVisible.value = false
  } catch (error) {

    ElMessage.error('保存题目失败，请稍后重试！')
  }
}

const manageSubcategories = (subject) => {
  currentSubjectForSubcategory.value = subject
  subcategoryDialogVisible.value = true
}

// 添加学科题库
const addSubcategory = async (subjectId, subcategory) => {
  try {
    await questionStore.addSubcategory(subjectId, subcategory.name, subcategory.iconIndex)
    ElMessage.success('学科题库添加成功！')
  } catch (error) {

    ElMessage.error('添加学科题库失败，请稍后重试！')
  }
}

// 更新学科题库
const updateSubcategory = async (subjectId, subcategory) => {
  try {
    await questionStore.updateSubcategory(subjectId, subcategory.id, subcategory.name, subcategory.iconIndex)
    ElMessage.success('学科题库更新成功！')
  } catch (error) {

    ElMessage.error('更新学科题库失败，请稍后重试！')
  }
}

// 删除学科题库
const deleteSubcategory = async (subjectId, subcategoryId) => {
  try {
    await questionStore.deleteSubcategory(subjectId, subcategoryId)
    ElMessage.success('学科题库删除成功！')
  } catch (error) {

    ElMessage.error('删除学科题库失败，请稍后重试！')
  }
}

const openUserDetailDialog = (user, source = 'userStats', answerRecordId = null) => {
  selectedUser.value = user
  dialogSource.value = source
  currentAnswerRecordId.value = answerRecordId
  userDetailDialogVisible.value = true
}

// 处理批量添加题目
const handleBatchAddQuestions = async (questions) => {
  try {
    for (const question of questions) {
      await questionStore.addQuestion(question)
    }
    ElMessage.success(`成功添加 ${questions.length} 道题目`)
  } catch (error) {

    ElMessage.error('批量添加题目失败，请稍后重试')
  }
}

// 数据管理相关方法
const clearAllData = async () => {
  try {
    await fetch(`${getApiBaseUrl()}/data`, { method: 'DELETE' })
    await questionStore.loadData()
    ElMessage.success('所有数据已清空')
  } catch (error) {

    ElMessage.error('清空数据失败，请稍后重试')
  }
}

const clearUserRecords = async () => {
  try {
    await fetch(`${getApiBaseUrl()}/user-records`, { method: 'DELETE' })
    ElMessage.success('用户答题记录已清空')
  } catch (error) {

    ElMessage.error('清空用户答题记录失败，请稍后重试')
  }
}

const clearLeaderboard = async () => {
  try {
    await fetch(`${getApiBaseUrl()}/leaderboard`, { method: 'DELETE' })
    ElMessage.success('排行榜数据已清空')
  } catch (error) {

    ElMessage.error('清空排行榜数据失败，请稍后重试')
  }
}

const clearGrades = async () => {
  try {
    await fetch(`${getApiBaseUrl()}/grades`, { method: 'DELETE' })
    await questionStore.loadData()
    ElMessage.success('年级数据已清空')
  } catch (error) {

    ElMessage.error('清空年级数据失败，请稍后重试')
  }
}

const clearClasses = async () => {
  try {
    await fetch(`${getApiBaseUrl()}/classes`, { method: 'DELETE' })
    await questionStore.loadData()
    ElMessage.success('班级数据已清空')
  } catch (error) {

    ElMessage.error('清空班级数据失败，请稍后重试')
  }
}

const backupData = async () => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/backup`)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('数据备份成功')
  } catch (error) {

    ElMessage.error('备份数据失败，请稍后重试')
  }
}

const restoreData = async () => {
  try {
    // 这里应该打开文件选择对话框，让用户选择备份文件
    // 然后上传文件到服务器
    ElMessage.info('请使用上传备份文件功能恢复数据')
  } catch (error) {

    ElMessage.error('恢复数据失败，请稍后重试')
  }
}

const exportData = async () => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/export`)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('数据导出成功')
  } catch (error) {

    ElMessage.error('导出数据失败，请稍后重试')
  }
}

const uploadBackup = async (file) => {
  try {
    const formData = new FormData()
    formData.append('backup', file.raw)
    
    const response = await fetch(`${getApiBaseUrl()}/restore`, {
      method: 'POST',
      body: formData
    })
    
    if (response.ok) {
      await questionStore.loadData()
      ElMessage.success('数据恢复成功')
    } else {
      throw new Error('恢复数据失败')
    }
  } catch (error) {

    ElMessage.error('上传备份文件失败，请稍后重试')
  }
}



// 加载设置
const loadSettings = async () => {
  await settingsStore.loadSettings()
}

// 更新界面名称
const updateInterfaceName = async (value) => {
  if (value) {
    await settingsStore.updateInterfaceName(value)
    ElMessage.success('界面名称更新成功！')
  } else {
    ElMessage.error('请输入界面名称')
  }
}

// 更新答题设置
const updateAnswerSettings = async (settings) => {
  const success = await settingsStore.updateSettings({
    randomizeAnswers: settings.randomizeAnswers.toString(),
    fixedQuestionCount: settings.fixedQuestionCount.toString(),
    minQuestionCount: settings.minQuestionCount.toString(),
    maxQuestionCount: settings.maxQuestionCount.toString(),
    fixedQuestionCountValue: settings.fixedQuestionCountValue.toString()
  })
  if (success) {
    ElMessage.success('答题设置更新成功！')
  } else {
    ElMessage.error('答题设置更新失败')
  }
}

// 初始化
onMounted(async () => {
  // 检查sessionStorage中的登录状态
  if (sessionStorage.getItem('adminAuthenticated') === 'true') {
    isAuthenticated.value = true
    passwordDialogVisible.value = false
    // 检查数据库管理认证状态
    if (sessionStorage.getItem('dataManagementAuthenticated') === 'true') {
      isDataManagementAuthenticated.value = true
    }
    // 加载设置
    await loadSettings()
  } else {
    // 设置密码对话框为可见，确保登录框自动弹出
    passwordDialogVisible.value = true
    isAuthenticated.value = false
  }
  

})
</script>