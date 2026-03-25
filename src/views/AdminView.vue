<template>
  <div class="admin-container">
    <!-- 密码验证对话框 -->
    <PasswordDialog
      v-if="!isAuthenticated"
      v-model:visible="passwordDialogVisible"
      @login-success="handlePasswordVerify"
    />
    
    <!-- 调试信息面板 -->
    <div v-if="debugMode" class="debug-panel">
      <div class="debug-title">调试信息</div>
      <div>isAuthenticated: {{ isAuthenticated }}</div>
      <div>isDataReady: {{ isDataReady }}</div>
      <div>passwordDialogVisible: {{ passwordDialogVisible }}</div>
      <div>pageLoading: {{ pageLoading }}</div>
      <div>isComponentMounted: {{ isComponentMounted }}</div>
      <div>activeTab: {{ activeTab }}</div>
      <div>subjects.length: {{ subjects?.length || 0 }}</div>
      <div>时间线: {{ debugTimeline.join(' → ') }}</div>
    </div>

    <div class="admin-header" v-if="isAuthenticated">
      <h1 class="title">题库管理系统</h1>
      <div class="header-buttons">
        <span class="admin-username">{{ adminUsername }}</span>
        <el-button type="info" @click="refreshPageData" :loading="pageLoading" :disabled="pageLoading">
          <el-icon><Refresh /></el-icon> 刷新数据
        </el-button>
        <el-button type="warning" @click="showChangePasswordDialog">修改密码</el-button>
        <el-button type="primary" @click="backToHome" class="action-btn">🏠 返回首页</el-button>
        <el-button type="danger" @click="logout">退出登录</el-button>
      </div>
    </div>
    
    <!-- 数据加载中提示 -->
    <div v-if="isAuthenticated && !isDataReady" class="loading-container">
      <el-icon class="loading-icon"><i class="el-icon-loading"></i></el-icon>
      <p>正在加载数据，请稍候...</p>
    </div>
    
    <el-tabs v-model="activeTab" v-if="isAuthenticated && isDataReady">
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
            ref="userManagementRef"
            :grades="grades"
            :classes="classes"
            @update-users="updateUserList"
          />
        </div>
      </el-tab-pane>
      
      <!-- 数据库管理 -->
      <el-tab-pane label="数据库管理" name="data-management">
        <div class="data-management">
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
      </el-tab-pane>
      
      <!-- 安全监控 -->
      <el-tab-pane label="安全监控" name="security">
        <SecurityMonitor />
      </el-tab-pane>
    </el-tabs>
    
    <!-- 数据库管理密码验证对话框 - 已禁用
    <el-dialog
      v-if="isAuthenticated"
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
    -->

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

/* 加载中提示样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: white;
  margin: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.loading-container .loading-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 16px;
  animation: spin 1s linear infinite;
}

.loading-container p {
  font-size: 16px;
  color: #606266;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 异步组件加载状态 */
.async-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 40px;
  color: #606266;
}

.async-loading .loading-icon {
  font-size: 32px;
  color: #409eff;
  margin-bottom: 12px;
  animation: spin 1s linear infinite;
}

/* 异步组件错误状态 */
.async-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 40px;
  color: #f56c6c;
}

.async-error .error-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.async-error span {
  margin-bottom: 16px;
}
</style>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent, watch, h, nextTick, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'
import { useQuestionStore, useSettingsStore } from '../stores/questionStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getApiBaseUrl } from '../utils/database'
import { useLoading } from '../composables/useLoading'

// 核心组件 - 同步导入（首屏必需）
import PasswordDialog from '../components/admin/auth/PasswordDialog.vue'
import InterfaceNameSetting from '../components/admin/basic-settings/InterfaceNameSetting.vue'
import AnswerSetting from '../components/admin/basic-settings/AnswerSetting.vue'
import SubjectManagement from '../components/admin/basic-settings/SubjectManagement.vue'
import GradeClassManagement from '../components/admin/basic-settings/GradeClassManagement.vue'
import UserStats from '../components/admin/leaderboard-management/UserStats.vue'
import RecentRecords from '../components/admin/leaderboard-management/RecentRecords.vue'
import { Refresh } from '@element-plus/icons-vue'

// 加载中组件
const LoadingComponent = {
  template: `
    <div class="async-loading">
      <el-icon class="loading-icon"><i class="el-icon-loading"></i></el-icon>
      <span>加载中...</span>
    </div>
  `
}

// 错误组件
const ErrorComponent = {
  template: `
    <div class="async-error">
      <el-icon class="error-icon"><i class="el-icon-warning"></i></el-icon>
      <span>组件加载失败</span>
      <el-button size="small" @click="retry">重试</el-button>
    </div>
  `,
  methods: {
    retry() {
      // 触发页面刷新重新加载
      window.location.reload()
    }
  }
}

// 异步组件配置工厂函数
const createAsyncComponent = (loader) => {
  return defineAsyncComponent({
    loader,
    loadingComponent: LoadingComponent,
    errorComponent: ErrorComponent,
    delay: 200,        // 延迟 200ms 显示 loading
    timeout: 10000     // 10 秒超时
  })
}

// Tab 面板组件 - 异步导入（按需加载）
const QuestionList = createAsyncComponent(() => import('../components/admin/question-management/QuestionList.vue'))
const UserManagement = createAsyncComponent(() => import('../components/admin/user-management/UserManagement.vue'))
const SecurityMonitor = createAsyncComponent(() => import('../components/admin/security/SecurityMonitor.vue'))
const BackupRestore = createAsyncComponent(() => import('../components/admin/data-management/BackupRestore.vue'))
const DataCleanup = createAsyncComponent(() => import('../components/admin/data-management/DataCleanup.vue'))
const AnalysisView = createAsyncComponent(() => import('./AnalysisView.vue'))

// 对话框组件 - 异步导入（交互时才加载）
const QuestionForm = createAsyncComponent(() => import('../components/admin/question-management/QuestionForm.vue'))
const BatchAddQuestion = createAsyncComponent(() => import('../components/admin/question-management/BatchAddQuestion.vue'))
const UserDetailDialog = createAsyncComponent(() => import('../components/admin/common/UserDetailDialog.vue'))
const QuestionDetailDialog = createAsyncComponent(() => import('../components/admin/common/QuestionDetailDialog.vue'))
const SubcategoryDialog = createAsyncComponent(() => import('../components/admin/common/SubcategoryDialog.vue'))

const questionStore = useQuestionStore()
const settingsStore = useSettingsStore()
const router = useRouter()
const { showLoading, hideLoading, withLoading, cleanup: cleanupLoading } = useLoading()

// 状态管理
const activeTab = ref('basic-settings')
const subjects = computed(() => questionStore.subjects)
const userStats = computed(() => questionStore.userStats)
const recentRecords = computed(() => questionStore.recentRecords)
const grades = computed(() => questionStore.grades)
const classes = computed(() => questionStore.classes)
const backupHistory = ref([])

// 组件引用
const userManagementRef = ref(null)

// 全局加载状态
const pageLoading = ref(false)

// 组件挂载状态（用于防止异步操作完成时组件已卸载导致的错误）
let isComponentMounted = true
const timeoutIds = []
const loadErrors = ref([])
const isDataReady = ref(false) // 数据是否加载完成

// 数据加载锁 - 防止重复加载
let isLoadingData = false

// 调试模式（可通过 URL 参数 ?debug=1 开启）
const debugMode = ref(false)
const debugTimeline = ref([])
const addDebugLog = (msg) => {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 12)
  debugTimeline.value.push(`${timestamp} ${msg}`)
  if (debugTimeline.value.length > 20) debugTimeline.value.shift()
  console.log(`[DEBUG] ${msg}`)
}

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
const handlePasswordVerify = (isVerified) => {
  console.log('[AdminView] handlePasswordVerify 被调用', { isVerified, isComponentMounted })
  addDebugLog('handlePasswordVerify 开始')
  if (isVerified && isComponentMounted) {
    console.log('[AdminView] 登录成功')
    addDebugLog('登录成功')
    // 设置用户名
    adminUsername.value = sessionStorage.getItem('adminUsername') || '管理员'
    
    // 先关闭对话框
    passwordDialogVisible.value = false
    
    // 立即设置认证状态 - 使用 setTimeout 确保在下一个事件循环执行
    // 避免阻塞，让 Vue 有时间更新 DOM
    setTimeout(() => {
      if (isComponentMounted) {
        isAuthenticated.value = true
        addDebugLog('isAuthenticated = true (setTimeout)')
        console.log('[AdminView] 认证状态已设置')
      }
    }, 50)
  }
}

// 监听认证状态变化，安全地加载数据
watch(isAuthenticated, (newValue, oldValue) => {
  console.log('[AdminView] watch(isAuthenticated) 触发', { newValue, oldValue, isComponentMounted, isDataReady: isDataReady.value })
  addDebugLog(`watch(isAuth): ${oldValue}→${newValue}`)
  // 只在认证状态从 false 变为 true 且数据未准备好时加载
  if (newValue && !oldValue && !isDataReady.value && isComponentMounted) {
    console.log('[AdminView] 开始加载数据（PasswordDialog 已关闭）')
    addDebugLog('开始 loadPageData')
    
    // 使用 setTimeout 让 Vue 先完成当前渲染周期（销毁 PasswordDialog）
    // 然后再开始数据加载，避免阻塞渲染
    setTimeout(() => {
      if (!isComponentMounted) return
      
      loadPageData().then(() => {
        console.log('[AdminView] loadPageData 完成')
        addDebugLog('loadPageData 完成')
      }).catch(error => {
        console.error('[AdminView] 加载数据失败:', error)
        addDebugLog(`错误: ${error.message}`)
      })
    }, 100)
  }
})

const logout = () => {
  isAuthenticated.value = false
  isDataManagementAuthenticated.value = false
  isDataReady.value = false  // 重置数据就绪状态
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
  if (!isComponentMounted) return
  
  const token = sessionStorage.getItem('adminToken')
  if (!token) {
    if (isComponentMounted) {
      ElMessage.error('请先登录')
    }
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

    if (!isComponentMounted) return
    
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
    if (isComponentMounted) {
      ElMessage.error('验证失败，请重试')
    }
  }
}

const focusDataManagementPasswordInput = () => {
  const timeoutId = setTimeout(() => {
    if (isComponentMounted && dataManagementPasswordInputRef.value && dataManagementPasswordInputRef.value.$el) {
      const inputElement = dataManagementPasswordInputRef.value.$el.querySelector('input')
      if (inputElement) {
        inputElement.focus()
      }
    }
  }, 100)
  timeoutIds.push(timeoutId)
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
  if (!isComponentMounted) return
  
  const { oldPassword, newPassword, confirmPassword } = changePasswordForm.value

  if (!oldPassword || !newPassword || !confirmPassword) {
    if (isComponentMounted) {
      ElMessage.warning('请填写所有字段')
    }
    return
  }

  if (newPassword.length < 6) {
    if (isComponentMounted) {
      ElMessage.warning('新密码长度不能少于6位')
    }
    return
  }

  if (newPassword !== confirmPassword) {
    if (isComponentMounted) {
      ElMessage.warning('两次输入的新密码不一致')
    }
    return
  }

  const token = sessionStorage.getItem('adminToken')
  if (!token) {
    if (isComponentMounted) {
      ElMessage.error('请重新登录')
      logout()
    }
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

    if (!isComponentMounted) return
    
    if (response.ok && data.success) {
      ElMessage.success('密码修改成功')
      changePasswordDialogVisible.value = false
    } else {
      ElMessage.error(data.error || '修改失败')
    }
  } catch (error) {
    console.error('修改密码失败:', error)
    if (isComponentMounted) {
      ElMessage.error('修改密码失败')
    }
  } finally {
    if (isComponentMounted) {
      changePasswordLoading.value = false
    }
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
      if (isComponentMounted) {
        ElMessage.success('题目更新成功！')
      }
    } else {
      await questionStore.addQuestion(formData)
      if (isComponentMounted) {
        ElMessage.success('题目添加成功！')
      }
    }

    dialogVisible.value = false
    // 刷新题目列表
    questionListRef.value?.refresh()
  } catch (error) {

    if (isComponentMounted) {
      ElMessage.error('保存题目失败，请稍后重试！')
    }
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
    if (isComponentMounted) {
      ElMessage.success('学科题库添加成功！')
    }
    // 刷新学科数据
    await questionStore.loadData()
  } catch (error) {

    if (isComponentMounted) {
      ElMessage.error('添加学科题库失败，请稍后重试！')
    }
  }
}

// 更新学科题库
const updateSubcategory = async (subjectId, subcategory) => {
  try {
    await questionStore.updateSubcategory(subjectId, subcategory.id, subcategory.name, subcategory.iconIndex, subcategory.difficulty)
    if (isComponentMounted) {
      ElMessage.success('学科题库更新成功！')
    }
    // 刷新学科数据
    await questionStore.loadData()
  } catch (error) {

    if (isComponentMounted) {
      ElMessage.error('更新学科题库失败，请稍后重试！')
    }
  }
}

// 删除学科题库
const deleteSubcategory = async (subjectId, subcategoryId) => {
  try {
    await questionStore.deleteSubcategory(subjectId, subcategoryId)
    if (isComponentMounted) {
      ElMessage.success('学科题库删除成功！')
    }
    // 刷新学科数据和题目列表
    await questionStore.loadData()
    questionListRef.value?.refresh()
  } catch (error) {

    if (isComponentMounted) {
      ElMessage.error('删除学科题库失败，请稍后重试！')
    }
  }
}

const openUserDetailDialog = async (user, source = 'userStats', answerRecordId = null) => {
  if (!isComponentMounted) return
  
  // 确定用户ID，优先使用user_id字段，特别是在从recentRecords点击时
  const userId = user.user_id || user.id
  
  // 加载用户的统计数据
  try {
    const statsResponse = await fetch(`${getApiBaseUrl()}/leaderboard/global?limit=1000&id=${userId}`)
    if (statsResponse.ok) {
      const statsData = await statsResponse.json()
      if (!isComponentMounted) return
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
    if (isComponentMounted) {
      selectedUser.value = user
    }
  }
  
  if (!isComponentMounted) return
  
  dialogSource.value = source
  currentAnswerRecordId.value = answerRecordId
  
  // 加载用户的答题记录和做题记录
  try {
    if (source === 'userStats' && userId) {
      // 加载用户的答题记录
      const recordsResponse = await fetch(`${getApiBaseUrl()}/answer-records/${userId}`)
      if (recordsResponse.ok && isComponentMounted) {
        selectedUserRecords.value = await recordsResponse.json()
      }
    } else if (source === 'recentRecords' && answerRecordId && userId) {
      // 加载用户的做题记录
      // 使用正确的接口路径格式
      const attemptsResponse = await fetch(`${getApiBaseUrl()}/answer-records/question-attempts/${userId}?answerRecordId=${answerRecordId}`)
      if (attemptsResponse.ok && isComponentMounted) {
        const attemptsData = await attemptsResponse.json()
        selectedUserQuestionAttempts.value = attemptsData
      } else if (isComponentMounted) {
        // 尝试使用备用接口获取用户的所有做题记录
        const allAttemptsResponse = await fetch(`${getApiBaseUrl()}/answer-records/question-attempts/${userId}`)
        if (allAttemptsResponse.ok && isComponentMounted) {
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
  
  if (isComponentMounted) {
    userDetailDialogVisible.value = true
  }
}

// 排行榜筛选相关方法
const applyFilters = async () => {
  if (!isComponentMounted) return
  
  await withLoading(async () => {
    if (!isComponentMounted) return
    
    try {
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
      
      if (!isComponentMounted) return
      
      // 更新数据
      questionStore.userStats = Array.isArray(userStatsData.data) ? userStatsData.data : []
      questionStore.recentRecords = Array.isArray(recentRecordsData) ? recentRecordsData : []
      
      // 显示成功消息
      if (isComponentMounted) {
        ElMessage.success('筛选成功')
      }
    } catch (error) {
      console.error('筛选数据失败:', error)
      if (isComponentMounted) {
        ElMessage.error('筛选数据失败，请稍后重试')
      }
    }
  }, '正在筛选数据...')
}

const resetFilters = async () => {
  if (!isComponentMounted) return
  
  await withLoading(async () => {
    if (!isComponentMounted) return
    
    try {
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
      if (isComponentMounted) {
        ElMessage.success('重置筛选成功')
      }
    } catch (error) {
      console.error('重置筛选失败:', error)
      if (isComponentMounted) {
        ElMessage.error('重置筛选失败，请稍后重试')
      }
    }
  }, '正在重置筛选...')
}

// 处理批量添加题目
const handleBatchAddQuestions = async (questions) => {
  if (!isComponentMounted) return
  
  try {
    for (const question of questions) {
      if (!isComponentMounted) return
      await questionStore.addQuestion(question)
    }
    if (isComponentMounted) {
      ElMessage.success(`成功添加 ${questions.length} 道题目`)
      // 刷新题目列表
      questionListRef.value?.refresh()
    }
  } catch (error) {
    console.error('批量添加题目失败:', error)
    if (isComponentMounted) {
      ElMessage.error('批量添加题目失败，请稍后重试')
    }
  }
}

// 更新用户列表
const updateUserList = async () => {
  if (!isComponentMounted) return
  
  try {
    await questionStore.loadUserStats()
    if (isComponentMounted) {
      // 刷新用户管理组件
      userManagementRef.value?.refresh()
      ElMessage.success('用户列表已更新')
    }
  } catch (error) {
    console.error('更新用户列表失败:', error)
    if (isComponentMounted) {
      ElMessage.error('更新用户列表失败，请稍后重试')
    }
  }
}

// 数据管理相关方法
const clearAllData = async () => {
  if (!isComponentMounted) return
  
  try {
    await fetch(`${getApiBaseUrl()}/data/clear-all`, { method: 'POST' })
    // 刷新所有数据（使用 allSettled 确保所有操作都尝试执行）
    const results = await Promise.allSettled([
      questionStore.loadData(),
      questionStore.loadQuestions({ excludeContent: true }),
      questionStore.loadUserStats(),
      questionStore.loadRecentRecords()
    ])
    
    // 检查组件是否仍然挂载
    if (!isComponentMounted) return
    
    // 收集失败的操作
    const failedOperations = results
      .map((r, i) => {
        if (r.status === 'rejected') {
          const names = ['学科数据', '题目数据', '用户统计', '最近记录']
          return `${names[i]}: ${r.reason?.message || '未知错误'}`
        }
        return null
      })
      .filter(Boolean)
    
    questionListRef.value?.refresh()
    userManagementRef.value?.refresh()
    
    if (failedOperations.length > 0) {
      ElMessage.warning(`数据已清空，但部分数据刷新失败: ${failedOperations.join(', ')}`)
    } else {
      ElMessage.success('所有数据已清空')
    }
  } catch (error) {
    console.error('[clearAllData] 清空数据失败:', error)
    if (isComponentMounted) {
      ElMessage.error('清空数据失败，请稍后重试')
    }
  }
}

const clearUserRecords = async () => {
  if (!isComponentMounted) return
  
  try {
    await fetch(`${getApiBaseUrl()}/data/clear-records`, { method: 'POST' })
    // 刷新用户统计数据
    await questionStore.loadUserStats()
    if (isComponentMounted) {
      userManagementRef.value?.refresh()
      ElMessage.success('用户答题记录已清空')
    }
  } catch (error) {
    console.error('清空用户答题记录失败:', error)
    if (isComponentMounted) {
      ElMessage.error('清空用户答题记录失败，请稍后重试')
    }
  }
}

const clearLeaderboard = async () => {
  if (!isComponentMounted) return
  
  try {
    await fetch(`${getApiBaseUrl()}/data/clear-leaderboard`, { method: 'POST' })
    // 刷新排行榜数据
    await questionStore.loadUserStats()
    await questionStore.loadRecentRecords()
    if (isComponentMounted) {
      ElMessage.success('排行榜数据已清空')
    }
  } catch (error) {
    console.error('清空排行榜数据失败:', error)
    if (isComponentMounted) {
      ElMessage.error('清空排行榜数据失败，请稍后重试')
    }
  }
}

const clearGrades = async () => {
  if (!isComponentMounted) return
  
  try {
    await fetch(`${getApiBaseUrl()}/data/clear-grades`, { method: 'POST' })
    await questionStore.loadData()
    if (isComponentMounted) {
      userManagementRef.value?.refresh()
      ElMessage.success('年级数据已清空')
    }
  } catch (error) {
    console.error('清空年级数据失败:', error)
    if (isComponentMounted) {
      ElMessage.error('清空年级数据失败，请稍后重试')
    }
  }
}

const clearClasses = async () => {
  if (!isComponentMounted) return
  
  try {
    await fetch(`${getApiBaseUrl()}/data/clear-classes`, { method: 'POST' })
    await questionStore.loadData()
    if (isComponentMounted) {
      userManagementRef.value?.refresh()
      ElMessage.success('班级数据已清空')
    }
  } catch (error) {
    console.error('清空班级数据失败:', error)
    if (isComponentMounted) {
      ElMessage.error('清空班级数据失败，请稍后重试')
    }
  }
}

const backupData = async (backupParams = {}) => {
  if (!isComponentMounted) return
  
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
    if (isComponentMounted) {
      ElMessage.success('数据备份成功');
    }
  } catch (error) {
    console.error('备份数据失败:', error);
    if (isComponentMounted) {
      ElMessage.error('备份数据失败，请稍后重试');
    }
  }
}

const restoreData = async () => {
  // 恢复数据的逻辑现在由BackupRestore组件处理
}

const exportData = async () => {
  if (!isComponentMounted) return
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/export`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (isComponentMounted) {
      ElMessage.success('数据导出成功');
    }
  } catch (error) {
    console.error('导出数据失败:', error);
    if (isComponentMounted) {
      ElMessage.error('导出数据失败，请稍后重试');
    }
  }
}

const uploadBackup = async (file) => {
  if (!isComponentMounted) return
  
  try {
    const formData = new FormData()
    formData.append('backup', file.raw)
    
    const response = await fetch(`${getApiBaseUrl()}/restore`, {
      method: 'POST',
      body: formData
    })
    
    if (response.ok) {
      // 刷新所有数据（使用 allSettled 确保所有操作都尝试执行）
      const results = await Promise.allSettled([
        questionStore.loadData(),
        questionStore.loadQuestions({ excludeContent: true }),
        questionStore.loadUserStats(),
        questionStore.loadRecentRecords()
      ])
      
      // 检查组件是否仍然挂载
      if (!isComponentMounted) return
      
      // 收集失败的操作
      const failedOperations = results
        .map((r, i) => {
          if (r.status === 'rejected') {
            const names = ['学科数据', '题目数据', '用户统计', '最近记录']
            return `${names[i]}: ${r.reason?.message || '未知错误'}`
          }
          return null
        })
        .filter(Boolean)
      
      // 刷新题目列表
      questionListRef.value?.refresh()
      // 刷新用户管理组件
      userManagementRef.value?.refresh()
      
      if (failedOperations.length > 0) {
        ElMessage.warning(`数据已恢复，但部分数据刷新失败: ${failedOperations.join(', ')}`)
      } else {
        ElMessage.success('数据恢复成功')
      }
    } else {
      throw new Error('恢复数据失败')
    }
  } catch (error) {
    console.error('上传备份文件失败:', error)
    if (isComponentMounted) {
      ElMessage.error('上传备份文件失败，请稍后重试')
    }
  }
}

// 获取备份历史
const getBackupHistory = async () => {
  if (!isComponentMounted) return []
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/backup/history`);
    const history = await response.json();
    // 将历史数据存储到变量中
    if (isComponentMounted) {
      backupHistory.value = history;
    }
    return history;
  } catch (error) {
    console.error('获取备份历史失败:', error);
    if (isComponentMounted) {
      ElMessage.error('获取备份历史失败，请稍后重试');
      backupHistory.value = [];
    }
    return [];
  }
}

// 下载备份
const downloadBackup = async (backupId) => {
  if (!isComponentMounted) return
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/backup/${backupId}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${backupId}.db`;
    a.click();
    URL.revokeObjectURL(url);
    if (isComponentMounted) {
      ElMessage.success('备份文件下载成功');
    }
  } catch (error) {
    console.error('下载备份失败:', error);
    if (isComponentMounted) {
      ElMessage.error('下载备份失败，请稍后重试');
    }
  }
}

// 删除备份
const deleteBackup = async (backupId) => {
  if (!isComponentMounted) return
  
  try {
    await fetch(`${getApiBaseUrl()}/backup/${backupId}`, { method: 'DELETE' });
    if (isComponentMounted) {
      ElMessage.success('备份文件删除成功');
    }
  } catch (error) {
    console.error('删除备份失败:', error);
    if (isComponentMounted) {
      ElMessage.error('删除备份失败，请稍后重试');
    }
  }
}

// 验证备份文件
const verifyBackup = async (file) => {
  if (!isComponentMounted) return
  
  try {
    const formData = new FormData();
    formData.append('backup', file.raw);
    
    const response = await fetch(`${getApiBaseUrl()}/backup/verify`, {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      if (!isComponentMounted) return
      
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
    if (isComponentMounted) {
      ElMessage.error('验证备份文件失败，请稍后重试');
    }
  }
}



// 加载设置
const loadSettings = async () => {
  if (!isComponentMounted) return
  await settingsStore.loadSettings()
}

// 更新界面名称
const updateInterfaceName = async (value) => {
  if (!isComponentMounted) return
  
  if (value) {
    await settingsStore.updateInterfaceName(value)
    if (isComponentMounted) {
      ElMessage.success('界面名称更新成功！')
    }
  } else {
    if (isComponentMounted) {
      ElMessage.error('请输入界面名称')
    }
  }
}

// 更新答题设置
const updateAnswerSettings = async (settings) => {
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
      ElMessage.success('答题设置更新成功！')
    } else {
      ElMessage.error('答题设置更新失败')
    }
  }
}

// 处理用户管理标签点击
const handleUserManagementTabClick = () => {
  // 组件内部自动加载数据
}

// 监听标签变化
watch(
  () => activeTab.value,
  async (newTab) => {
    // 用户管理标签切换时刷新数据
    if (newTab === 'user-management') {
      userManagementRef.value?.refresh()
    }
  }
)

// 初始化 - 优化加载流程
onMounted(async () => {
  console.log('[AdminView] onMounted 被调用，组件已挂载')
  // 检查sessionStorage中的登录状态
  if (sessionStorage.getItem('adminAuthenticated') === 'true') {
    console.log('[AdminView] 发现已登录状态，恢复会话')
    isAuthenticated.value = true
    passwordDialogVisible.value = false
    // 恢复用户名
    adminUsername.value = sessionStorage.getItem('adminUsername') || '管理员'
    // 检查数据库管理认证状态
    if (sessionStorage.getItem('dataManagementAuthenticated') === 'true') {
      isDataManagementAuthenticated.value = true
    }
    
    // 等待DOM完全更新，避免竞态条件
    console.log('[AdminView] 等待 DOM 更新...')
    await nextTick()
    await nextTick()
    
    // 再次检查组件是否仍然挂载
    if (isComponentMounted) {
      console.log('[AdminView] 开始加载页面数据')
      // 开始加载页面数据
      await loadPageData()
    } else {
      console.warn('[AdminView] 组件已卸载，取消数据加载')
    }
  } else {
    console.log('[AdminView] 未登录，显示登录对话框')
    // 设置密码对话框为可见，确保登录框自动弹出
    passwordDialogVisible.value = true
    isAuthenticated.value = false
  }
})

// 组件卸载时设置标志并清理定时器
onUnmounted(() => {
  console.log('[AdminView] onUnmounted 被调用，组件正在卸载')
  isComponentMounted = false
  cleanupLoading()
  timeoutIds.forEach(id => clearTimeout(id))
  timeoutIds.length = 0
  console.log('[AdminView] 组件卸载完成，已清理所有定时器')
})

// 错误捕获 - 处理子组件渲染竞态错误
onErrorCaptured((err, instance, info) => {
  const errorMessage = err?.message || ''
  const isIgnorableError = 
    errorMessage.includes("Cannot destructure property 'node' of 'undefined'") ||
    errorMessage.includes("Cannot destructure property 'row' of 'undefined'") ||
    errorMessage.includes('emitsOptions') ||
    errorMessage.includes('Cannot read properties of undefined')
  
  if (isIgnorableError) {
    console.warn('[AdminView] 捕获并忽略渲染竞态错误:', errorMessage)
    return false // 阻止错误继续传播
  }
  
  // 其他错误正常抛出
  return true
})

// 手动刷新页面数据
const refreshPageData = async () => {
  if (isComponentMounted) {
    ElMessage.info('正在重新加载数据...')
  }
  
  // 清除缓存,强制重新加载
  localStorage.removeItem('coreData')
  localStorage.removeItem('coreDataExpiry')
  
  // 重新加载
  await loadPageData()
  
  if (loadErrors.value.length === 0 && isComponentMounted) {
    ElMessage.success('数据刷新成功')
  }
}

// 统一加载页面数据 - 串行加载避免状态竞争
const loadPageData = async () => {
  console.log('[AdminView] loadPageData 被调用', { isComponentMounted, isLoadingData })
  
  // 防止重复加载
  if (isLoadingData) {
    console.warn('[AdminView] 数据正在加载中，跳过重复请求')
    return
  }
  
  if (!isComponentMounted) return
  
  isLoadingData = true
  pageLoading.value = true
  loadErrors.value = []
  isDataReady.value = false
  
  const loadSingleData = async (name, loader) => {
    if (!isComponentMounted) throw new Error('组件已卸载')
    try {
      console.log(`[AdminView] 开始加载: ${name}`)
      await loader()
      console.log(`[AdminView] 完成: ${name}`)
      // 每个数据加载后等待 Vue 状态稳定
      await nextTick()
      await new Promise(resolve => {
        const timeoutId = setTimeout(() => {
          if (isComponentMounted) resolve()
        }, 50)
        timeoutIds.push(timeoutId)
      })
    } catch (error) {
      console.error(`[AdminView] 加载失败: ${name}`, error)
      loadErrors.value.push(`${name}: ${error.message}`)
    }
  }
  
  console.log('[AdminView] 开始串行加载数据...')
  try {
    // 1. 先加载核心数据（学科、年级、班级）
    await loadSingleData('核心数据', () => questionStore.loadData())
    if (!isComponentMounted) return
    
    // 2. 加载设置
    await loadSingleData('系统设置', () => loadSettings())
    if (!isComponentMounted) return
    
    // 3. 加载题目列表
    await loadSingleData('题目数据', () => questionStore.loadQuestions({ excludeContent: true }))
    if (!isComponentMounted) return
    
    // 4. 加载用户统计
    await loadSingleData('用户统计', () => questionStore.loadUserStats())
    if (!isComponentMounted) return
    
    // 5. 加载最近记录
    await loadSingleData('最近记录', () => questionStore.loadRecentRecords())
    if (!isComponentMounted) return
    
    // 最终稳定等待
    console.log('[AdminView] 所有数据加载完成，等待最终稳定...')
    await nextTick()
    await new Promise(resolve => {
      const timeoutId = setTimeout(() => {
        if (isComponentMounted) resolve()
      }, 100)
      timeoutIds.push(timeoutId)
    })
    
    if (!isComponentMounted) return
    
    if (loadErrors.value.length > 0 && isComponentMounted) {
      ElMessage.warning(`部分数据加载失败: ${loadErrors.value.length} 项`)
    }
    
    console.log('[AdminView] 设置 isDataReady = true')
    isDataReady.value = true
  } catch (error) {
    console.error('[AdminView] 加载页面数据失败:', error)
    if (isComponentMounted) {
      ElMessage.error('页面数据加载失败,请刷新页面重试')
    }
  } finally {
    console.log('[AdminView] 设置 pageLoading = false, isLoadingData = false')
    pageLoading.value = false
    isLoadingData = false
  }
  console.log('[AdminView] loadPageData 完成')
}
</script>