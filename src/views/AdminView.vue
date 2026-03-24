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
        <span class="admin-username">{{ adminUsername }}</span>
        <el-button type="warning" @click="showChangePasswordDialog">修改密码</el-button>
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
            :randomize-error-collection-answers="randomizeErrorCollectionAnswers"
            :fixed-question-count="fixedQuestionCount"
            :min-question-count="minQuestionCount"
            :max-question-count="maxQuestionCount"
            :fixed-question-count-value="fixedQuestionCountValue"
            :subjects="subjects"
            :subject-question-counts="subjectQuestionCounts"
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
            ref="questionListRef"
            :subjects="subjects"
            @edit-question="editQuestion"
            @delete-question="deleteQuestion"
            @show-add-dialog="showAddQuestionDialog"
            @show-batch-add-dialog="batchAddDialogVisible = true"
          />
        </div>
      </el-tab-pane> 
      
      <!-- 用户做题数据 -->
      <el-tab-pane label="用户做题数据" name="leaderboard">
        <div class="leaderboard-management">
          <!-- 筛选区域 -->
          <el-card class="filter-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>筛选条件</span>
              </div>
            </template>
            <div class="filter-section">
              <div class="filter-row">
                <div class="filter-item">
                  <label class="filter-label">学号</label>
                  <el-input v-model="filterStudentId" placeholder="输入学号" @input="filterStudentId = (filterStudentId || '').replace(/[^0-9]/g, '')"></el-input>
                </div>
                <div class="filter-item">
                  <label class="filter-label">年级</label>
                  <el-select v-model="filterGrade" placeholder="选择年级">
                    <el-option label="全部" value=""></el-option>
                    <el-option v-for="grade in grades" :key="grade.id || grade" :label="grade.name || grade" :value="grade.name || grade"></el-option>
                  </el-select>
                </div>
                <div class="filter-item">
                  <label class="filter-label">班级</label>
                  <el-select v-model="filterClass" placeholder="选择班级">
                    <el-option label="全部" value=""></el-option>
                    <el-option v-for="classNum in classes" :key="classNum.id || classNum" :label="classNum.name || classNum" :value="classNum.name || classNum"></el-option>
                  </el-select>
                </div>
                <div class="filter-item">
                  <label class="filter-label">学科</label>
                  <el-select v-model="filterSubject" placeholder="选择学科">
                    <el-option label="全部" value=""></el-option>
                    <el-option v-for="subject in subjects" :key="subject.id" :label="subject.name" :value="subject.id"></el-option>
                  </el-select>
                </div>
                <div class="filter-item">
                  <label class="filter-label">时间范围</label>
                  <el-select v-model="filterTimeRange" placeholder="选择时间">
                    <el-option label="全部" value=""></el-option>
                    <el-option label="今日" value="today"></el-option>
                    <el-option label="近一周" value="week"></el-option>
                    <el-option label="近一月" value="month"></el-option>
                  </el-select>
                </div>
              </div>
              <div class="filter-actions">
                <el-button type="primary" @click="applyFilters">应用筛选</el-button>
                <el-button @click="resetFilters">重置</el-button>
              </div>
            </div>
          </el-card>
          
          <!-- 数据展示区域 -->
          <div class="data-display">
            <el-card class="data-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>用户答题统计</span>
                </div>
              </template>
              <UserStats 
                :user-stats="userStats"
                @open-user-detail="openUserDetailDialog"
              />
            </el-card>
            
            <el-card class="data-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>最近答题记录</span>
                </div>
              </template>
              <RecentRecords 
                :recent-records="recentRecords"
                @open-user-detail="openUserDetailDialog"
              />
            </el-card>
          </div>
        </div>
      </el-tab-pane>
      
      <!-- 数据分析 -->
      <el-tab-pane label="数据分析" name="analysis">
        <AnalysisView />
      </el-tab-pane>
      
      <!-- 用户管理 -->
      <el-tab-pane label="用户管理" name="user-management" @tab-click="handleUserManagementTabClick">
        <div class="user-management-tab">
          <UserManagement 
            :users="allUsers"
            :grades="grades"
            :classes="classes"
            @update-users="updateUserList"
          />
        </div>
      </el-tab-pane>
      
      <!-- 数据库管理 -->
      <el-tab-pane label="数据库管理" name="data-management" @click="handleDataManagementClick">
        <div v-if="isDataManagementAuthenticated" class="data-management">
          <BackupRestore 
            :backup-history="backupHistory"
            @backup-data="backupData"
            @restore-data="restoreData"
            @export-data="exportData"
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
        <div v-else class="data-management-locked">
          <el-icon class="lock-icon"><i class="el-icon-lock"></i></el-icon>
          <h3>数据库管理功能已锁定</h3>
          <p>请输入管理员密码解锁数据库管理功能</p>
          <el-button type="primary" @click="showDataManagementPasswordDialog">解锁数据库管理</el-button>
        </div>
      </el-tab-pane>
      
      <!-- 安全监控 -->
      <el-tab-pane label="安全监控" name="security">
        <SecurityMonitor />
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
      v-model:dialogVisible="questionDetailDialogVisible"
      :selectedQuestionDetail="selectedQuestionDetail"
    />

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="changePasswordDialogVisible"
      title="修改密码"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="changePasswordForm" label-width="100px" @submit.prevent="handleChangePassword">
        <el-form-item label="旧密码">
          <el-input 
            v-model="changePasswordForm.oldPassword" 
            type="password" 
            placeholder="请输入旧密码" 
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input 
            v-model="changePasswordForm.newPassword" 
            type="password" 
            placeholder="请输入新密码（至少6位）" 
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input 
            v-model="changePasswordForm.confirmPassword" 
            type="password" 
            placeholder="请再次输入新密码" 
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="changePasswordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleChangePassword" :loading="changePasswordLoading">确认修改</el-button>
      </template>
    </el-dialog>

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
    v-model:dialogVisible="userDetailDialogVisible"
    :selectedUser="selectedUser"
    :currentAnswerRecordId="currentAnswerRecordId"
    :dialogSource="dialogSource"
    :selectedUserRecords="selectedUserRecords"
    :selectedUserQuestionAttempts="selectedUserQuestionAttempts"
    @show-question-detail="showQuestionDetail"
  />
</template>

<style scoped>
/* 基础样式 */
.admin-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #F8F9FA 0%, #E3F2FD 100%);
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23F7FFF7"/><circle cx="20" cy="20" r="2" fill="%23FF6B6B" opacity="0.3"/><circle cx="80" cy="40" r="2" fill="%234ECDC4" opacity="0.3"/><circle cx="40" cy="80" r="2" fill="%23FFD166" opacity="0.3"/><circle cx="60" cy="60" r="2" fill="%2306D6A0" opacity="0.3"/></svg>');
  background-repeat: repeat;
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

.admin-username {
  color: #409eff;
  font-weight: 500;
  margin-right: 16px;
  padding: 0 12px;
  border-right: 1px solid #dcdfe6;
}

.el-tabs {
  padding: 20px;
  background-color: #fff;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Tab 面板高度限制 */
:deep(.el-tabs__content) {
  flex: 1;
  overflow: auto;
  min-height: 0;
}

:deep(.el-tab-pane) {
  height: 100%;
}

/* 题目管理容器 */
.question-management {
  height: 100%;
  display: flex;
  flex-direction: column;
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
  margin-bottom: 0 !important;
  padding: 0 !important;
  background-color: transparent !important;
  box-shadow: none !important;
}

/* 筛选卡片 */
.filter-card {
  margin-bottom: 24px !important;
  border-radius: 12px !important;
  overflow: hidden !important;
}

/* 卡片头部 */
.card-header {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  color: #303133 !important;
}

/* 筛选行 */
.filter-row {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 16px !important;
  margin-bottom: 16px !important;
}

/* 筛选项 */
.filter-item {
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
  min-width: 150px !important;
  flex: 1 !important;
  max-width: 220px !important;
}

/* 筛选标签 */
.filter-label {
  font-weight: 500 !important;
  color: #606266 !important;
  font-size: 14px !important;
}

/* 筛选操作 */
.filter-actions {
  display: flex !important;
  gap: 10px !important;
  justify-content: flex-end !important;
  padding-top: 16px !important;
  border-top: 1px solid #ebeef5 !important;
}

/* 数据展示区域 */
.data-display {
  display: flex !important;
  flex-direction: column !important;
  gap: 24px !important;
}

/* 数据卡片 */
.data-card {
  border-radius: 12px !important;
  overflow: hidden !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
}

/* 数据卡片头部 */
.data-card .card-header {
  padding: 16px 20px !important;
  border-bottom: 1px solid #ebeef5 !important;
  background-color: #f5f7fa !important;
}

/* 数据卡片内容 */
.data-card .el-card__body {
  padding: 20px !important;
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
import { ref, computed, onMounted, defineAsyncComponent, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuestionStore, useSettingsStore } from '../stores/questionStore'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
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
import UserManagement from '../components/admin/user-management/UserManagement.vue'
import SecurityMonitor from '../components/admin/security/SecurityMonitor.vue'

// 动态导入AnalysisView，减少初始加载体积
const AnalysisView = defineAsyncComponent(() => import('./AnalysisView.vue'))

const questionStore = useQuestionStore()
const settingsStore = useSettingsStore()
const router = useRouter()

// 状态管理
const activeTab = ref('basic-settings')
const subjects = computed(() => questionStore.subjects)
const userStats = computed(() => questionStore.userStats)
const recentRecords = computed(() => questionStore.recentRecords)
const grades = computed(() => questionStore.grades)
const classes = computed(() => questionStore.classes)
const backupHistory = ref([])
const allUsers = ref([])

// 排行榜筛选相关
const filterStudentId = ref('')
const filterGrade = ref('')
const filterClass = ref('')
const filterSubject = ref('')
const filterTimeRange = ref('')

// 界面名称设置
const interfaceName = computed({
  get: () => settingsStore.interfaceName,
  set: () => {}
})

// 答题设置
const randomizeAnswers = computed({
  get: () => settingsStore.settings.randomizeAnswers,
  set: (value) => { settingsStore.settings.randomizeAnswers = value }
})
const randomizeErrorCollectionAnswers = computed({
  get: () => settingsStore.settings.randomizeErrorCollectionAnswers,
  set: (value) => { settingsStore.settings.randomizeErrorCollectionAnswers = value }
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
const subjectQuestionCounts = computed({
  get: () => settingsStore.settings.subjectQuestionCounts,
  set: (value) => { settingsStore.settings.subjectQuestionCounts = value }
})

// 题目管理相关
const dialogVisible = ref(false)
const isEditing = ref(false)
const batchAddDialogVisible = ref(false)
const selectedQuestion = ref(null)
const questionListRef = ref(null)

// 子分类管理相关
const subcategoryDialogVisible = ref(false)
const currentSubjectForSubcategory = ref(null)

// 密码验证相关
const isAuthenticated = ref(false)
const passwordDialogVisible = ref(true)
const adminUsername = ref('')

// 修改密码相关
const changePasswordDialogVisible = ref(false)
const changePasswordLoading = ref(false)
const changePasswordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

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
const selectedUserRecords = ref([])
const selectedUserQuestionAttempts = ref([])
const questionDetailDialogVisible = ref(false)
const selectedQuestionDetail = ref(null)

// 方法
const handlePasswordVerify = async (isVerified) => {
  if (isVerified) {
    isAuthenticated.value = true
    passwordDialogVisible.value = false
    // 获取用户名
    adminUsername.value = sessionStorage.getItem('adminUsername') || '管理员'
    // 使用sessionStorage存储状态
    sessionStorage.setItem('adminAuthenticated', 'true')
    // 加载设置
    await loadSettings()
    // 加载题目和学科数据
    await questionStore.loadData()
    // 加载所有题目数据
    await questionStore.loadQuestions({ excludeContent: true })
  }
}

const logout = () => {
  isAuthenticated.value = false
  isDataManagementAuthenticated.value = false
  passwordDialogVisible.value = true
  adminUsername.value = ''
  sessionStorage.removeItem('adminAuthenticated')
  sessionStorage.removeItem('adminToken')
  sessionStorage.removeItem('adminUsername')
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

// 显示题目详情
const showQuestionDetail = (row) => {
  selectedQuestionDetail.value = row
  questionDetailDialogVisible.value = true
}

const verifyDataManagementPassword = async () => {
  const token = sessionStorage.getItem('adminToken')
  if (!token) {
    ElMessage.error('请先登录')
    return
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/admin/verify-data-management`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        password: dataManagementPasswordForm.value.password
      })
    })

    const data = await response.json()

    if (response.ok && data.valid) {
      isDataManagementAuthenticated.value = true
      dataManagementPasswordDialogVisible.value = false
      sessionStorage.setItem('dataManagementAuthenticated', 'true')
      ElMessage.success('数据库管理功能已解锁！')
      dataManagementPasswordForm.value.password = ''
    } else {
      ElMessage.error(data.error || '密码错误')
      dataManagementPasswordForm.value.password = ''
    }
  } catch (error) {
    console.error('验证失败:', error)
    ElMessage.error('验证失败，请重试')
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

// 显示修改密码对话框
const showChangePasswordDialog = () => {
  changePasswordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  changePasswordDialogVisible.value = true
}

// 修改密码
const handleChangePassword = async () => {
  const { oldPassword, newPassword, confirmPassword } = changePasswordForm.value

  if (!oldPassword || !newPassword || !confirmPassword) {
    ElMessage.warning('请填写所有字段')
    return
  }

  if (newPassword.length < 6) {
    ElMessage.warning('新密码长度不能少于6位')
    return
  }

  if (newPassword !== confirmPassword) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }

  const token = sessionStorage.getItem('adminToken')
  if (!token) {
    ElMessage.error('请重新登录')
    logout()
    return
  }

  changePasswordLoading.value = true

  try {
    const response = await fetch(`${getApiBaseUrl()}/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ oldPassword, newPassword })
    })

    const data = await response.json()

    if (response.ok && data.success) {
      ElMessage.success('密码修改成功')
      changePasswordDialogVisible.value = false
    } else {
      ElMessage.error(data.error || '修改失败')
    }
  } catch (error) {
    console.error('修改密码失败:', error)
    ElMessage.error('修改密码失败')
  } finally {
    changePasswordLoading.value = false
  }
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
  // 刷新题目列表
  questionListRef.value?.refresh()
}

const saveQuestion = async (formData) => {
  try {
    if (isEditing.value) {
      await questionStore.updateQuestion(formData)
      ElMessage.success('题目更新成功！')
    } else {
      await questionStore.addQuestion(formData)
      ElMessage.success('题目添加成功！')
    }

    dialogVisible.value = false
    // 刷新题目列表
    questionListRef.value?.refresh()
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
    await questionStore.addSubcategory(subjectId, subcategory.name, subcategory.iconIndex, subcategory.difficulty)
    ElMessage.success('学科题库添加成功！')
  } catch (error) {

    ElMessage.error('添加学科题库失败，请稍后重试！')
  }
}

// 更新学科题库
const updateSubcategory = async (subjectId, subcategory) => {
  try {
    await questionStore.updateSubcategory(subjectId, subcategory.id, subcategory.name, subcategory.iconIndex, subcategory.difficulty)
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

const openUserDetailDialog = async (user, source = 'userStats', answerRecordId = null) => {
  // 确定用户ID，优先使用user_id字段，特别是在从recentRecords点击时
  const userId = user.user_id || user.id
  
  // 加载用户的统计数据
  try {
    const statsResponse = await fetch(`${getApiBaseUrl()}/leaderboard/global?limit=1000&id=${userId}`)
    if (statsResponse.ok) {
      const statsData = await statsResponse.json()
      if (statsData && statsData.length > 0) {
        selectedUser.value = statsData[0]
      } else {
        // 如果没有统计数据，使用传入的用户对象
        selectedUser.value = user
      }
    } else {
      // 如果获取统计数据失败，使用传入的用户对象
      selectedUser.value = user
    }
  } catch (error) {
    console.error('加载用户统计数据失败:', error)
    selectedUser.value = user
  }
  
  dialogSource.value = source
  currentAnswerRecordId.value = answerRecordId
  
  // 加载用户的答题记录和做题记录
  try {
    if (source === 'userStats' && userId) {
      // 加载用户的答题记录
      const recordsResponse = await fetch(`${getApiBaseUrl()}/answer-records/${userId}`)
      if (recordsResponse.ok) {
        selectedUserRecords.value = await recordsResponse.json()
      }
    } else if (source === 'recentRecords' && answerRecordId && userId) {
      // 加载用户的做题记录
      // 使用正确的接口路径格式
      const attemptsResponse = await fetch(`${getApiBaseUrl()}/answer-records/question-attempts/${userId}?answerRecordId=${answerRecordId}`)
      if (attemptsResponse.ok) {
        const attemptsData = await attemptsResponse.json()
        selectedUserQuestionAttempts.value = attemptsData
      } else {
        // 尝试使用备用接口获取用户的所有做题记录
        const allAttemptsResponse = await fetch(`${getApiBaseUrl()}/answer-records/question-attempts/${userId}`)
        if (allAttemptsResponse.ok) {
          const allAttemptsData = await allAttemptsResponse.json()
          // 过滤出与当前answerRecordId相关的记录，确保类型一致
          selectedUserQuestionAttempts.value = allAttemptsData.filter(attempt => {
            return String(attempt.answer_record_id) === String(answerRecordId)
          })
        }
      }
    }
  } catch (error) {
    console.error('加载用户记录失败:', error)
  }
  
  userDetailDialogVisible.value = true
}

// 排行榜筛选相关方法
const applyFilters = async () => {
  try {
    // 显示加载状态
    ElLoading.service({
      lock: true,
      text: '正在筛选数据...',
      background: 'rgba(0, 0, 0, 0.7)'
    })
    
    // 构建筛选参数
    const userStatsParams = new URLSearchParams()
    const recentRecordsParams = new URLSearchParams()
    
    // 处理学号筛选
    if (filterStudentId.value) {
      userStatsParams.append('student_id', filterStudentId.value)
      recentRecordsParams.append('student_id', filterStudentId.value)
    }
    
    // 处理年级筛选
    if (filterGrade.value) {
      userStatsParams.append('grade', filterGrade.value)
      recentRecordsParams.append('grade', filterGrade.value)
    }
    
    // 处理班级筛选
    if (filterClass.value) {
      userStatsParams.append('class', filterClass.value)
      recentRecordsParams.append('class', filterClass.value)
    }
    
    // 处理学科筛选
    if (filterSubject.value) {
      userStatsParams.append('subjectId', filterSubject.value)
      recentRecordsParams.append('subjectId', filterSubject.value)
    }
    
    // 处理时间范围筛选
    if (filterTimeRange.value) {
      const now = new Date()
      let startDate, endDate
      
      switch (filterTimeRange.value) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          endDate = new Date()
          break
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          endDate = new Date()
          break
        default:
          startDate = null
          endDate = null
      }
      
      if (startDate && endDate) {
        recentRecordsParams.append('startDate', startDate.toISOString())
        recentRecordsParams.append('endDate', endDate.toISOString())
      }
    }
    
    // 加载筛选后的数据
    const [userStatsData, recentRecordsData] = await Promise.all([
      // 获取用户统计数据
      fetch(`${getApiBaseUrl()}/leaderboard/global?limit=0${userStatsParams.toString() ? '&' + userStatsParams.toString() : ''}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`)
          }
          return res.json()
        })
        .catch(error => {
          console.error('获取用户统计数据失败:', error)
          return { data: [] }
        }),
      // 获取最近答题记录
      fetch(`${getApiBaseUrl()}/answer-records/all?limit=0${recentRecordsParams.toString() ? '&' + recentRecordsParams.toString() : ''}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`)
          }
          return res.json()
        })
        .catch(error => {
          console.error('获取最近答题记录失败:', error)
          return []
        })
    ])
    
    // 更新数据
    questionStore.userStats = Array.isArray(userStatsData.data) ? userStatsData.data : []
    questionStore.recentRecords = Array.isArray(recentRecordsData) ? recentRecordsData : []
    
    // 显示成功消息
    ElMessage.success('筛选成功')
  } catch (error) {
    console.error('筛选数据失败:', error)
    ElMessage.error('筛选数据失败，请稍后重试')
  } finally {
    // 关闭加载状态
    ElLoading.service().close()
  }
}

const resetFilters = async () => {
  try {
    // 显示加载状态
    ElLoading.service({
      lock: true,
      text: '正在重置筛选...',
      background: 'rgba(0, 0, 0, 0.7)'
    })
    
    // 重置筛选条件
    filterStudentId.value = ''
    filterGrade.value = ''
    filterClass.value = ''
    filterSubject.value = ''
    filterTimeRange.value = ''
    
    // 重新加载所有数据
    await Promise.all([
      questionStore.loadUserStats(),
      questionStore.loadRecentRecords()
    ])
    
    // 显示成功消息
    ElMessage.success('重置筛选成功')
  } catch (error) {
    console.error('重置筛选失败:', error)
    ElMessage.error('重置筛选失败，请稍后重试')
  } finally {
    // 关闭加载状态
    ElLoading.service().close()
  }
}

// 处理批量添加题目
const handleBatchAddQuestions = async (questions) => {
  try {
    for (const question of questions) {
      await questionStore.addQuestion(question)
    }
    ElMessage.success(`成功添加 ${questions.length} 道题目`)
    // 刷新题目列表
    questionListRef.value?.refresh()
  } catch (error) {

    ElMessage.error('批量添加题目失败，请稍后重试')
  }
}

// 加载所有用户数据
const loadAllUsers = async () => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/users?limit=0&withStats=true`)
    if (response.ok) {
      const users = await response.json()
      
      // 按学号数字排序
      users.sort((a, b) => {
        const studentIdA = parseInt(a.student_id) || 0
        const studentIdB = parseInt(b.student_id) || 0
        return studentIdA - studentIdB
      })
      
      allUsers.value = users
    }
  } catch (error) {
    console.error('加载所有用户失败:', error)
  }
}

// 更新用户列表
const updateUserList = async () => {
  try {
    await questionStore.loadUserStats()
    await loadAllUsers()
    ElMessage.success('用户列表已更新')
  } catch (error) {
    console.error('更新用户列表失败:', error)
    ElMessage.error('更新用户列表失败，请稍后重试')
  }
}

// 数据管理相关方法
const clearAllData = async () => {
  try {
    await fetch(`${getApiBaseUrl()}/data/clear-all`, { method: 'POST' })
    await questionStore.loadData()
    ElMessage.success('所有数据已清空')
  } catch (error) {
    console.error('清空数据失败:', error)
    ElMessage.error('清空数据失败，请稍后重试')
  }
}

const clearUserRecords = async () => {
  try {
    await fetch(`${getApiBaseUrl()}/data/clear-records`, { method: 'POST' })
    ElMessage.success('用户答题记录已清空')
  } catch (error) {
    console.error('清空用户答题记录失败:', error)
    ElMessage.error('清空用户答题记录失败，请稍后重试')
  }
}

const clearLeaderboard = async () => {
  try {
    await fetch(`${getApiBaseUrl()}/data/clear-leaderboard`, { method: 'POST' })
    ElMessage.success('排行榜数据已清空')
  } catch (error) {
    console.error('清空排行榜数据失败:', error)
    ElMessage.error('清空排行榜数据失败，请稍后重试')
  }
}

const clearGrades = async () => {
  try {
    await fetch(`${getApiBaseUrl()}/data/clear-grades`, { method: 'POST' })
    await questionStore.loadData()
    ElMessage.success('年级数据已清空')
  } catch (error) {
    console.error('清空年级数据失败:', error)
    ElMessage.error('清空年级数据失败，请稍后重试')
  }
}

const clearClasses = async () => {
  try {
    await fetch(`${getApiBaseUrl()}/data/clear-classes`, { method: 'POST' })
    await questionStore.loadData()
    ElMessage.success('班级数据已清空')
  } catch (error) {
    console.error('清空班级数据失败:', error)
    ElMessage.error('清空班级数据失败，请稍后重试')
  }
}

const backupData = async (backupParams = {}) => {
  try {
    // 构建API请求URL
    const baseUrl = `${getApiBaseUrl()}/backup`;
    const params = new URLSearchParams();
    params.append('type', backupParams.type || 'full');
    params.append('format', backupParams.format || 'json');
    if (backupParams.dataTypes && backupParams.dataTypes.length > 0) {
      params.append('dataTypes', backupParams.dataTypes.join(','));
    }
    
    const url = `${baseUrl}?${params.toString()}`;
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    
    // 根据格式设置下载文件名
    const format = backupParams.format || 'json';
    const extension = format === 'json' ? 'json' : 'db';
    a.download = `backup-${new Date().toISOString().slice(0, 10)}-${backupParams.type || 'full'}.${extension}`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
    ElMessage.success('数据备份成功');
  } catch (error) {
    console.error('备份数据失败:', error);
    ElMessage.error('备份数据失败，请稍后重试');
  }
}

const restoreData = async () => {
  // 恢复数据的逻辑现在由BackupRestore组件处理
}

const exportData = async () => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/export`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    ElMessage.success('数据导出成功');
  } catch (error) {
    console.error('导出数据失败:', error);
    ElMessage.error('导出数据失败，请稍后重试');
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

// 获取备份历史
const getBackupHistory = async () => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/backup/history`);
    const history = await response.json();
    // 将历史数据存储到变量中
    backupHistory.value = history;
    return history;
  } catch (error) {
    console.error('获取备份历史失败:', error);
    ElMessage.error('获取备份历史失败，请稍后重试');
    backupHistory.value = [];
    return [];
  }
}

// 下载备份
const downloadBackup = async (backupId) => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/backup/${backupId}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${backupId}.db`;
    a.click();
    URL.revokeObjectURL(url);
    ElMessage.success('备份文件下载成功');
  } catch (error) {
    console.error('下载备份失败:', error);
    ElMessage.error('下载备份失败，请稍后重试');
  }
}

// 删除备份
const deleteBackup = async (backupId) => {
  try {
    await fetch(`${getApiBaseUrl()}/backup/${backupId}`, { method: 'DELETE' });
    ElMessage.success('备份文件删除成功');
  } catch (error) {
    console.error('删除备份失败:', error);
    ElMessage.error('删除备份失败，请稍后重试');
  }
}

// 验证备份文件
const verifyBackup = async (file) => {
  try {
    const formData = new FormData();
    formData.append('backup', file.raw);
    
    const response = await fetch(`${getApiBaseUrl()}/backup/verify`, {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.valid) {
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
        );
      } else {
        ElMessage.error(`备份文件验证失败: ${result.message}`);
      }
    } else {
      throw new Error('验证失败');
    }
  } catch (error) {
    console.error('验证备份文件失败:', error);
    ElMessage.error('验证备份文件失败，请稍后重试');
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
    randomizeErrorCollectionAnswers: settings.randomizeErrorCollectionAnswers.toString(),
    fixedQuestionCount: settings.fixedQuestionCount.toString(),
    minQuestionCount: settings.minQuestionCount.toString(),
    maxQuestionCount: settings.maxQuestionCount.toString(),
    fixedQuestionCountValue: settings.fixedQuestionCountValue.toString(),
    subjectQuestionCounts: settings.subjectQuestionCounts
  })
  if (success) {
    ElMessage.success('答题设置更新成功！')
  } else {
    ElMessage.error('答题设置更新失败')
  }
}

// 处理用户管理标签点击
const handleUserManagementTabClick = async () => {
  // 重新加载用户数据
  await loadAllUsers()
}

// 监听标签变化，确保用户管理标签切换时加载数据
watch(
  () => activeTab.value,
  async (newTab) => {
    if (newTab === 'user-management') {
      await loadAllUsers()
    }
  }
)

// 初始化
onMounted(async () => {
  // 检查sessionStorage中的登录状态
  if (sessionStorage.getItem('adminAuthenticated') === 'true') {
    isAuthenticated.value = true
    passwordDialogVisible.value = false
    // 恢复用户名
    adminUsername.value = sessionStorage.getItem('adminUsername') || '管理员'
    // 检查数据库管理认证状态
    if (sessionStorage.getItem('dataManagementAuthenticated') === 'true') {
      isDataManagementAuthenticated.value = true
    }
    // 加载设置
    await loadSettings()
    // 加载题目和学科数据
    await questionStore.loadData()
    // 加载所有题目数据
    await questionStore.loadQuestions({ excludeContent: true })
    // 加载排行榜数据
    await questionStore.loadUserStats()
    await questionStore.loadRecentRecords()
    // 加载所有用户数据
    await loadAllUsers()
  } else {
    // 设置密码对话框为可见，确保登录框自动弹出
    passwordDialogVisible.value = true
    isAuthenticated.value = false
  }
  

})
</script>