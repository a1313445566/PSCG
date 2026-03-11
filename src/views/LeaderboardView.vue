<template>
  <div class="student-container">
    <div class="game-header">
      <div class="game-title-container">
        <h1 class="game-title">{{ interfaceName }}</h1>
      </div>
    </div>
    
    <!-- 用户信息 -->
    <div class="user-leaderboard-section">
      <div class="user-leaderboard-content">
        <div v-if="currentStudentId" class="user-info-bottom">
          <div class="user-info-details">
            <span class="student-id-bottom">学号: {{ currentStudentId }}</span>
            <span v-if="currentUserName" class="user-info-item">姓名: {{ currentUserName }}</span>
            <span v-if="currentUserGrade" class="user-info-item">年级: {{ currentUserGrade }}年级</span>
            <span v-if="currentUserClass" class="user-info-item">班级: {{ currentUserClass }}班</span>
          </div>
          <el-button type="primary" @click="logout" class="logout-btn-bottom">退出登录</el-button>
        </div>
        <div v-else class="login-form-bottom">
          <el-form @submit.prevent="loginUser" class="login-form">
            <div class="form-container">
              <div class="form-row">
                <el-form-item class="form-item">
                  <span style="font-family: 'Comic Sans MS', 'Arial', sans-serif; font-weight: bold; color: #6a11cb; font-size: 18px; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2); padding-right: 10px; margin-right: 5px; transition: all 0.3s ease; cursor: pointer; display: inline-block; width: 60px; text-align: right;" onmouseover="this.style.color='#2575fc'; this.style.textShadow='2px 2px 6px rgba(37, 117, 252, 0.4)';" onmouseout="this.style.color='#6a11cb'; this.style.textShadow='2px 2px 4px rgba(0, 0, 0, 0.2)';">学号</span>
                  <el-input v-model="inputStudentId" placeholder="请输入学号" style="width: 100px;"></el-input>
                </el-form-item>
                <el-form-item class="form-item">
                  <span style="font-family: 'Comic Sans MS', 'Arial', sans-serif; font-weight: bold; color: #6a11cb; font-size: 18px; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2); padding-right: 10px; margin-right: 5px; transition: all 0.3s ease; cursor: pointer; display: inline-block; width: 60px; text-align: right;" onmouseover="this.style.color='#2575fc'; this.style.textShadow='2px 2px 6px rgba(37, 117, 252, 0.4)';" onmouseout="this.style.color='#6a11cb'; this.style.textShadow='2px 2px 4px rgba(0, 0, 0, 0.2)';">姓名</span>
                  <el-input v-model="inputName" placeholder="可选" style="width: 120px;"></el-input>
                </el-form-item>
              </div>
              <div class="form-row">
                <el-form-item class="form-item">
                  <span style="font-family: 'Comic Sans MS', 'Arial', sans-serif; font-weight: bold; color: #6a11cb; font-size: 18px; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2); padding-right: 10px; margin-right: 5px; transition: all 0.3s ease; cursor: pointer; display: inline-block; width: 60px; text-align: right;" onmouseover="this.style.color='#2575fc'; this.style.textShadow='2px 2px 6px rgba(37, 117, 252, 0.4)';" onmouseout="this.style.color='#6a11cb'; this.style.textShadow='2px 2px 4px rgba(0, 0, 0, 0.2)';">年级</span>
                  <el-select v-model="inputGrade" placeholder="选择年级" style="width: 100px;">
                    <el-option v-for="grade in grades" :key="grade" :label="grade + '年级'" :value="grade"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item class="form-item">
                  <span style="font-family: 'Comic Sans MS', 'Arial', sans-serif; font-weight: bold; color: #6a11cb; font-size: 18px; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2); padding-right: 10px; margin-right: 5px; transition: all 0.3s ease; cursor: pointer; display: inline-block; width: 60px; text-align: right;" onmouseover="this.style.color='#2575fc'; this.style.textShadow='2px 2px 6px rgba(37, 117, 252, 0.4)';" onmouseout="this.style.color='#6a11cb'; this.style.textShadow='2px 2px 4px rgba(0, 0, 0, 0.2)';">班级</span>
                  <el-select v-model="inputClass" placeholder="选择班级" style="width: 100px;">
                    <el-option v-for="classNum in classes" :key="classNum" :label="classNum + '班'" :value="classNum"></el-option>
                  </el-select>
                </el-form-item>
              </div>
            </div>
            <div class="submit-container">
              <el-form-item class="form-item submit-item">
                <el-button type="primary" @click="loginUser">登录</el-button>
              </el-form-item>
            </div>
          </el-form>
        </div>
      </div>
    </div>

    <div class="leaderboard-section">
      <div class="leaderboard-header-container">
        <h2 class="section-title">🏆 排行榜</h2>
        <div class="header-buttons">
          <router-link to="/" class="back-home-btn">
            <el-button type="primary">返回首页</el-button>
          </router-link>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="leaderboard-tabs">
        <el-tab-pane label="全局排行榜" name="global">
          <div class="filter-section">
            <el-select v-model="selectedGrade" placeholder="选择年级" @change="handleGradeChange">
              <el-option label="全部年级" :value="null"></el-option>
              <el-option v-for="grade in grades" :key="grade" :label="grade + '年级'" :value="grade"></el-option>
            </el-select>
            <el-select v-model="selectedClass" placeholder="选择班级" @change="loadGlobalLeaderboard">
              <el-option label="全部班级" :value="null"></el-option>
              <el-option v-for="classNum in classes" :key="classNum" :label="classNum + '班'" :value="classNum"></el-option>
            </el-select>
          </div>
          <div class="leaderboard-content">
            <div v-if="globalLeaderboard.length > 0" class="leaderboard-table">
              <div class="leaderboard-header">
                <div class="rank-col">排名</div>
                <div class="student-col">学号</div>
                <div class="name-col">姓名</div>
                <div class="grade-col">年级</div>
                <div class="class-col">班级</div>
                <div class="score-col">正确率</div>
                <div class="questions-col">答题数</div>
                <div class="sessions-col">答题次数</div>
              </div>
              <div v-for="(item, index) in globalLeaderboard" :key="item.user_id || index" class="leaderboard-row" :class="{ 'current-user': item.student_id === currentStudentId }" @click="openUserDetailDialog(item)" style="cursor: pointer;">
                <div class="rank-col">
                  <span class="rank-number">{{ index + 1 }}</span>
                </div>
                <div class="student-col">{{ item.student_id || '未知' }}</div>
                <div class="name-col">{{ item.name || '未知' }}</div>
                <div class="grade-col">{{ item.grade || '-' }}年级</div>
                <div class="class-col">{{ item.class || '-' }}班</div>
                <div class="score-col">{{ Math.round(item.avg_accuracy || 0) }}%</div>
                <div class="questions-col">{{ item.total_questions || 0 }}</div>
                <div class="sessions-col">{{ item.total_sessions || 0 }}</div>
              </div>
            </div>
            <div v-else class="leaderboard-empty">
              <p>暂无排行数据</p>
              <p>全局排行榜数据长度: {{ globalLeaderboard.length }}</p>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="学科排行榜" name="subject">
          <div class="filter-section">
            <el-select v-model="selectedSubjectId" placeholder="选择学科" @change="loadSubjectLeaderboard">
              <el-option 
                v-for="subject in subjects" 
                :key="subject.id" 
                :label="subject.name" 
                :value="subject.id"
              ></el-option>
            </el-select>
            <el-select v-model="selectedGrade" placeholder="选择年级" @change="handleGradeChange">
              <el-option label="全部年级" :value="null"></el-option>
              <el-option v-for="grade in grades" :key="grade" :label="grade + '年级'" :value="grade"></el-option>
            </el-select>
            <el-select v-model="selectedClass" placeholder="选择班级" @change="loadSubjectLeaderboard">
              <el-option label="全部班级" :value="null"></el-option>
              <el-option v-for="classNum in classes" :key="classNum" :label="classNum + '班'" :value="classNum"></el-option>
            </el-select>
          </div>
          <div class="leaderboard-content">
            <div v-if="subjectLeaderboard.length > 0 && selectedSubjectId" class="leaderboard-table">
              <div class="leaderboard-header">
                <div class="rank-col">排名</div>
                <div class="student-col">学号</div>
                <div class="name-col">姓名</div>
                <div class="grade-col">年级</div>
                <div class="class-col">班级</div>
                <div class="score-col">正确率</div>
                <div class="questions-col">答题数</div>
                <div class="sessions-col">答题次数</div>
              </div>
              <div v-for="(item, index) in subjectLeaderboard" :key="item.user_id || index" class="leaderboard-row" :class="{ 'current-user': item.student_id === currentStudentId }" @click="openUserDetailDialog(item)" style="cursor: pointer;">
                <div class="rank-col">
                  <span class="rank-number">{{ index + 1 }}</span>
                </div>
                <div class="student-col">{{ item.student_id || '未知' }}</div>
                <div class="name-col">{{ item.name || '未知' }}</div>
                <div class="grade-col">{{ item.grade || '-' }}年级</div>
                <div class="class-col">{{ item.class || '-' }}班</div>
                <div class="score-col">{{ Math.round(item.avg_accuracy || 0) }}%</div>
                <div class="questions-col">{{ item.total_questions || 0 }}</div>
                <div class="sessions-col">{{ item.total_sessions || 0 }}</div>
              </div>
            </div>
            <div v-else class="leaderboard-empty">
              <p>{{ selectedSubjectId ? '暂无排行数据' : '请选择一个学科查看排行榜' }}</p>
              <p v-if="selectedSubjectId">学科排行榜数据长度: {{ subjectLeaderboard.length }}</p>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="个人成绩" name="personal">
          <div class="personal-stats" v-if="currentUserId">
            <div class="stats-overview">
              <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-value">{{ userStats.totalSessions || 0 }}</div>
                <div class="stat-label">答题次数</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">📝</div>
                <div class="stat-value">{{ userStats.totalQuestions || 0 }}</div>
                <div class="stat-label">答题总数</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">✅</div>
                <div class="stat-value">{{ userStats.totalCorrect || 0 }}</div>
                <div class="stat-label">正确数</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">🎯</div>
                <div class="stat-value">{{ Math.round(userStats.avgAccuracy || 0) }}%</div>
                <div class="stat-label">平均正确率</div>
              </div>
            </div>

            <div class="subject-stats" v-if="userStats.subjectStats && userStats.subjectStats.length > 0">
              <h3 class="section-title">各学科成绩</h3>
              <div class="leaderboard-table">
                <div class="leaderboard-header">
                  <div class="subject-col">学科</div>
                  <div class="questions-col">答题数</div>
                  <div class="correct-col">正确数</div>
                  <div class="score-col">正确率</div>
                </div>
                <div v-for="(item, index) in userStats.subjectStats" :key="item.subject_id" class="leaderboard-row">
                  <div class="subject-col">{{ item.subject_name }}</div>
                  <div class="questions-col">{{ item.total_questions || 0 }}</div>
                  <div class="correct-col">{{ item.correct_count || 0 }}</div>
                  <div class="score-col">{{ Math.round(item.avg_accuracy || 0) }}%</div>
                </div>
              </div>
            </div>

            <div class="recent-records" v-if="recentRecords.length > 0">
              <h3 class="section-title">最近答题记录</h3>
              <div class="leaderboard-table">
                <div class="leaderboard-header">
                  <div class="subject-col">学科</div>
                  <div class="subcategory-col">子分类</div>
                  <div class="score-col">成绩</div>
                  <div class="accuracy-col">正确率</div>
                  <div class="time-col">时间</div>
                </div>
                <div v-for="(item, index) in recentRecords" :key="item.id" class="leaderboard-row">
                  <div class="subject-col">{{ item.subject_name || '未知' }}</div>
                  <div class="subcategory-col">{{ item.subcategory_name || '全部' }}</div>
                  <div class="score-col">{{ item.correct_count }} / {{ item.total_questions }}</div>
                  <div class="accuracy-col">{{ Math.round((item.correct_count / item.total_questions) * 100) }}%</div>
                  <div class="time-col">{{ formatDate(item.created_at) }}</div>
                </div>
              </div>
            </div>
            <div v-else-if="currentUserId" class="leaderboard-empty">
              <p>暂无答题记录</p>
            </div>
          </div>
          <div v-else class="leaderboard-empty">
            <p>请先登录查看个人成绩</p>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
  
  <!-- 用户详情对话框 -->
  <el-dialog
    v-model="userDetailDialogVisible"
    :title="selectedUser?.name ? `${selectedUser.name}的答题记录` : `${selectedUser?.grade || '-'}年级${selectedUser?.class || '-'}班的${selectedUser?.student_id || '未知'}的答题记录`"
    width="800px"
  >
    <div v-if="selectedUser" class="user-detail-info" style="margin-bottom: 20px; padding: 15px; background-color: #f5f7fa; border-radius: 8px;">
      <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <div><strong>学号:</strong> {{ selectedUser.student_id || '未知' }}</div>
        <div><strong>姓名:</strong> {{ selectedUser.name || '未知' }}</div>
        <div><strong>年级:</strong> {{ selectedUser.grade || '-' }}年级</div>
        <div><strong>班级:</strong> {{ selectedUser.class || '-' }}班</div>
        <div><strong>正确率:</strong> {{ Math.round(selectedUser.avg_accuracy || 0) }}%</div>
        <div><strong>答题数:</strong> {{ selectedUser.total_questions || 0 }}</div>
        <div><strong>答题次数:</strong> {{ selectedUser.total_sessions || 0 }}</div>
      </div>
    </div>
    
    <div class="user-records" v-if="selectedUserRecords.length > 0">
      <h3 style="margin-bottom: 15px; color: #6a11cb;">答题记录</h3>
      <div class="leaderboard-table">
        <div class="leaderboard-header">
          <div class="subject-col">学科</div>
          <div class="subcategory-col">子分类</div>
          <div class="score-col">成绩</div>
          <div class="accuracy-col">正确率</div>
          <div class="time-col">时间</div>
        </div>
        <div v-for="(item, index) in selectedUserRecords" :key="item.id" class="leaderboard-row">
          <div class="subject-col">{{ item.subject_name || '未知' }}</div>
          <div class="subcategory-col">{{ item.subcategory_name || '全部' }}</div>
          <div class="score-col">{{ item.correct_count }} / {{ item.total_questions }}</div>
          <div class="accuracy-col">{{ Math.round((item.correct_count / item.total_questions) * 100) }}%</div>
          <div class="time-col">{{ formatDate(item.created_at) }}</div>
        </div>
      </div>
    </div>
    <div v-else class="leaderboard-empty" style="text-align: center; padding: 40px;">
      <p>暂无答题记录</p>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElButton, ElTable, ElTableColumn, ElTabs, ElTabPane, ElSelect, ElOption, ElProgress, ElInput, ElDialog } from 'element-plus'
import 'element-plus/dist/index.css'
import { getApiBaseUrl } from '../utils/database'

// 界面名称
const interfaceName = ref(localStorage.getItem('interfaceName') || '小学刷题闯关')

const activeTab = ref('global')
const subjects = ref([])
const selectedSubjectId = ref(null)
const globalLeaderboard = ref([])
const subjectLeaderboard = ref([])
const currentUserId = ref(localStorage.getItem('userId'))
const currentStudentId = ref(localStorage.getItem('studentId'))
const currentUserName = ref(localStorage.getItem('userName'))
const currentUserGrade = ref(localStorage.getItem('userGrade'))
const currentUserClass = ref(localStorage.getItem('userClass'))
const inputStudentId = ref('')
const inputName = ref('')
const inputGrade = ref(null)
const inputClass = ref(null)
const userStats = ref({})
const recentRecords = ref([])

// 年级和班级数据
const grades = ref([])
const classes = ref([])
const selectedGrade = ref(null)
const selectedClass = ref(null)

// 用户详情和答题记录对话框
const userDetailDialogVisible = ref(false)
const selectedUser = ref(null)
const selectedUserRecords = ref([])

// 加载年级和班级数据
const loadGradesAndClasses = async () => {
  try {
    // 获取年级列表
    const gradesResponse = await fetch(`${getApiBaseUrl()}/grades`)
    if (gradesResponse.ok) {
      const serverGrades = await gradesResponse.json()
      // 使用服务器返回的数据，如果没有数据则显示空数组
      if (Array.isArray(serverGrades) && serverGrades.length > 0) {
        // 提取年级数值
        grades.value = serverGrades.map(grade => {
          if (typeof grade === 'object' && grade.name) {
            // 从年级名称中提取数字，如"1年级" -> 1
            const gradeNum = parseInt(grade.name.match(/\d+/)?.[0] || '')
            return isNaN(gradeNum) ? parseInt(grade.id) || 1 : gradeNum
          } else if (typeof grade === 'number') {
            return grade
          } else {
            return 1
          }
        }).filter((value, index, self) => self.indexOf(value) === index).sort((a, b) => a - b)
      } else {
        // 没有数据时显示空数组
        grades.value = []
      }
    } else {
      // 失败时显示空数组
      grades.value = []
    }
    
    // 获取班级列表
    const classesResponse = await fetch(`${getApiBaseUrl()}/classes`)
    if (classesResponse.ok) {
      const serverClasses = await classesResponse.json()
      // 使用服务器返回的数据，如果没有数据则显示空数组
      if (Array.isArray(serverClasses) && serverClasses.length > 0) {
        // 提取班级数值
        classes.value = serverClasses.map(classItem => {
          if (typeof classItem === 'object' && classItem.name) {
            // 从班级名称中提取数字，如"1班" -> 1
            const classNum = parseInt(classItem.name.match(/\d+/)?.[0] || '')
            return isNaN(classNum) ? parseInt(classItem.id) || 1 : classNum
          } else if (typeof classItem === 'number') {
            return classItem
          } else {
            return 1
          }
        }).filter((value, index, self) => self.indexOf(value) === index).sort((a, b) => a - b)
      } else {
        // 没有数据时显示空数组
        classes.value = []
      }
    } else {
      // 失败时显示空数组
      classes.value = []
    }
  } catch (error) {
    console.error('加载年级和班级数据失败:', error)
    // 失败时显示空数组
    grades.value = []
    classes.value = []
  }
}

// 当年级变化时，重新加载班级列表和排行榜数据
const handleGradeChange = async () => {
  try {
    const classesResponse = await fetch(`${getApiBaseUrl()}/classes?grade=${selectedGrade.value}`)
    if (classesResponse.ok) {
      const serverClasses = await classesResponse.json()
      // 使用服务器返回的数据，如果没有数据则显示空数组
      if (Array.isArray(serverClasses) && serverClasses.length > 0) {
        // 提取班级数值
        classes.value = serverClasses.map(classItem => {
          if (typeof classItem === 'object' && classItem.name) {
            // 从班级名称中提取数字，如"1班" -> 1
            const classNum = parseInt(classItem.name.match(/\d+/)?.[0] || '')
            return isNaN(classNum) ? parseInt(classItem.id) || 1 : classNum
          } else if (typeof classItem === 'number') {
            return classItem
          } else {
            return 1
          }
        }).filter((value, index, self) => self.indexOf(value) === index).sort((a, b) => a - b)
      } else {
        // 没有数据时显示空数组
        classes.value = []
      }
    } else {
      // 失败时显示空数组
      classes.value = []
    }
    // 重置班级选择
    selectedClass.value = null
    // 根据当前标签页重新加载排行榜数据
    if (activeTab.value === 'global') {
      await loadGlobalLeaderboard()
    } else if (activeTab.value === 'subject' && selectedSubjectId.value) {
      await loadSubjectLeaderboard()
    }
  } catch (error) {
    console.error('加载班级数据失败:', error)
    // 失败时显示空数组
    classes.value = []
  }
}

const getProgressColor = (percentage) => {
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 60) return '#e6a23c'
  return '#f56c6c'
}

const formatDate = (dateString) => {
  if (!dateString) return '未知时间'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('日期格式化失败:', error)
    return '未知时间'
  }
}

const loadSubjects = async () => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/subjects`)
    if (response.ok) {
      subjects.value = await response.json()
    }
  } catch (error) {
    console.error('加载学科失败:', error)
  }
}

const loadGlobalLeaderboard = async () => {
  try {
    let url = `${getApiBaseUrl()}/leaderboard/global`
    const params = new URLSearchParams()
    
    if (selectedGrade.value) {
      params.append('grade', selectedGrade.value)
    }
    
    if (selectedClass.value) {
      params.append('class', selectedClass.value)
    }
    
    if (params.toString()) {
      url += '?' + params.toString()
    }
    
    console.log('加载全局排行榜:', url)
    const response = await fetch(url)
    console.log('全局排行榜响应状态:', response.status)
    if (response.ok) {
      const data = await response.json()
      console.log('全局排行榜数据:', data)
      globalLeaderboard.value = data
    }
  } catch (error) {
    console.error('加载全局排行榜失败:', error)
  }
}

const loadSubjectLeaderboard = async () => {
  if (!selectedSubjectId.value) {
    subjectLeaderboard.value = []
    return
  }
  
  try {
    let url = `${getApiBaseUrl()}/leaderboard/subject/${selectedSubjectId.value}`
    const params = new URLSearchParams()
    
    if (selectedGrade.value) {
      params.append('grade', selectedGrade.value)
    }
    
    if (selectedClass.value) {
      params.append('class', selectedClass.value)
    }
    
    if (params.toString()) {
      url += '?' + params.toString()
    }
    
    console.log('加载学科排行榜:', url)
    const response = await fetch(url)
    console.log('学科排行榜响应状态:', response.status)
    if (response.ok) {
      const data = await response.json()
      console.log('学科排行榜数据:', data)
      subjectLeaderboard.value = data
    }
  } catch (error) {
    console.error('加载学科排行榜失败:', error)
  }
}

const loadUserStats = async () => {
  if (!currentUserId.value) return
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/user-stats/${currentUserId.value}`)
    if (response.ok) {
      userStats.value = await response.json()
    }
  } catch (error) {
    console.error('加载用户统计失败:', error)
  }
}

const loadRecentRecords = async () => {
  if (!currentUserId.value) {
    recentRecords.value = []
    return
  }
  
  try {
    const url = `${getApiBaseUrl()}/answer-records/${currentUserId.value}`
    const response = await fetch(url)
    
    if (response.ok) {
      const data = await response.json()
      recentRecords.value = data
    } else {
      console.error('加载答题记录失败，响应状态:', response.status)
      recentRecords.value = []
    }
  } catch (error) {
    console.error('加载答题记录失败:', error)
    recentRecords.value = []
  }
}

// 加载用户的答题记录
const loadUserRecords = async (userId) => {
  try {
    const url = `${getApiBaseUrl()}/answer-records/${userId}`
    const response = await fetch(url)
    
    if (response.ok) {
      const data = await response.json()
      selectedUserRecords.value = data
    } else {
      console.error('加载用户答题记录失败，响应状态:', response.status)
      selectedUserRecords.value = []
    }
  } catch (error) {
    console.error('加载用户答题记录失败:', error)
    selectedUserRecords.value = []
  }
}

// 打开用户详情对话框
const openUserDetailDialog = async (user) => {
  selectedUser.value = user
  await loadUserRecords(user.user_id)
  userDetailDialogVisible.value = true
}

const loginUser = async () => {
  if (!inputStudentId.value.trim()) {
    ElMessage.error('请输入学号')
    return
  }
  
  try {
    const apiUrl = `${getApiBaseUrl()}/users/login`;
    console.log('Login API URL:', apiUrl);
    console.log('Login data:', {
      studentId: inputStudentId.value.trim(),
      name: inputName.value.trim(),
      grade: inputGrade.value,
      class: inputClass.value
    });
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        studentId: inputStudentId.value.trim(),
        name: inputName.value.trim(),
        grade: inputGrade.value,
        class: inputClass.value
      })
    })
    
    console.log('Login response status:', response.status);
    
    if (response.ok) {
      const data = await response.json()
      console.log('Login response data:', data);
      currentUserId.value = data.userId
      currentStudentId.value = data.studentId
      currentUserName.value = inputName.value.trim()
      currentUserGrade.value = inputGrade.value
      currentUserClass.value = inputClass.value
      localStorage.setItem('userId', data.userId)
      localStorage.setItem('studentId', data.studentId)
      localStorage.setItem('userName', inputName.value.trim())
      localStorage.setItem('userGrade', inputGrade.value)
      localStorage.setItem('userClass', inputClass.value)
      console.log('localStorage set, userId:', localStorage.getItem('userId'))
      ElMessage.success('登录成功')
      loadUserStats()
      loadRecentRecords()
    } else {
      console.error('Login failed with status:', response.status);
      ElMessage.error('登录失败')
    }
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error('登录失败')
  }
}

const logout = () => {
  // 清除本地存储
  localStorage.removeItem('userId')
  localStorage.removeItem('studentId')
  localStorage.removeItem('userName')
  localStorage.removeItem('userGrade')
  localStorage.removeItem('userClass')
  // 重置状态
  currentUserId.value = null
  currentStudentId.value = null
  currentUserName.value = null
  currentUserGrade.value = null
  currentUserClass.value = null
  // 清空输入框
  inputStudentId.value = ''
  inputName.value = ''
  inputGrade.value = null
  inputClass.value = null
  // 重置其他状态
  userStats.value = {}
  recentRecords.value = []
  ElMessage.success('已退出登录')
}



onMounted(async () => {
  console.log('onMounted called, currentUserId from localStorage:', currentUserId.value)
  await loadSubjects()
  // 加载年级和班级数据
  await loadGradesAndClasses()
  loadGlobalLeaderboard()
  if (currentUserId.value) {
    console.log('onMounted: currentUserId exists, loading stats and records')
    loadUserStats()
    loadRecentRecords()
  } else {
    console.log('onMounted: no currentUserId, skipping stats and records')
  }
})

// 监听标签页变化，重新加载排行榜数据
watch(activeTab, (newTab) => {
  if (newTab === 'global') {
    loadGlobalLeaderboard()
  } else if (newTab === 'subject' && selectedSubjectId.value) {
    loadSubjectLeaderboard()
  }
})
</script>

<style scoped>
/* 全局样式 */
.student-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Comic Sans MS', 'Arial', sans-serif;
  background: #f8f9fa;
  min-height: 100vh;
  position: relative;
}

/* 背景装饰 */
.student-container::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  height: 300px;
  background: rgba(106, 17, 203, 0.05);
  border-radius: 50%;
  z-index: 0;
  transform: translate(50%, -50%);
}

.student-container::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 200px;
  height: 200px;
  background: rgba(255, 107, 107, 0.05);
  border-radius: 50%;
  z-index: 0;
  transform: translate(-50%, 50%);
}

/* 游戏头部 */
.game-header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 40px;
  padding: 25px 40px;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  border-radius: 25px;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
  overflow: hidden;
  transition: all 0.3s ease;
}

.game-header::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0) 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
  transform: rotate(45deg);
  animation: shimmer 3s infinite linear;
  z-index: -1;
}

.game-title-container {
  display: flex;
  align-items: center;
  gap: 20px;
  justify-content: center;
  flex: 1;
}



.game-title {
  font-size: 36px;
  font-weight: bold;
  color: white;
  text-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  margin: 0;
  font-family: 'Comic Sans MS', 'Arial', sans-serif;
  letter-spacing: 1px;
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) rotate(45deg);
  }
}

@keyframes glow {
  from {
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.5);
  }
  to {
    text-shadow: 0 0 20px rgba(255, 255, 255, 1), 0 0 30px rgba(255, 255, 255, 0.8);
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-12px);
  }
  60% {
    transform: translateY(-6px);
  }
}

/* 用户信息和排行榜区域 */
.user-leaderboard-section {
  margin-top: 20px;
  margin-bottom: 20px;
  padding: 0;
}

.user-leaderboard-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.user-info-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 15px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  width: 100%;
  flex-wrap: wrap;
  border: 1px solid #f0f0f0;
}

.user-info-details {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.student-id-bottom {
  font-family: 'Comic Sans MS', 'Arial', sans-serif;
  font-size: 18px;
  font-weight: bold;
  color: #6a11cb;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  padding-right: 15px;
  margin-right: 10px;
  border-right: 2px solid rgba(106, 17, 203, 0.3);
}

.user-info-item {
  font-family: 'Comic Sans MS', 'Arial', sans-serif;
  font-size: 18px;
  font-weight: bold;
  color: #6a11cb;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  padding-right: 15px;
  margin-right: 10px;
  border-right: 2px solid rgba(106, 17, 203, 0.3);
}

.user-info-item:last-child {
  border-right: none;
  padding-right: 0;
  margin-right: 0;
}

.logout-btn-bottom {
  border-radius: 25px;
  font-weight: bold;
  padding: 10px 25px;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  border: none;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  font-family: 'Comic Sans MS', 'Arial', sans-serif;
  font-size: 16px;
}

.logout-btn-bottom:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 25px rgba(106, 17, 203, 0.4);
}

.login-form-bottom {
  display: flex;
  align-items: center;
  width: 100%;
}

.login-form {
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  border: 1px solid #f0f0f0;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-item {
  margin-bottom: 0 !important;
  display: flex;
  align-items: center;
  gap: 10px;
}

.submit-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.submit-item {
  margin-left: 0 !important;
}

.login-form .el-select {
  min-width: 100px;
  border-radius: 15px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.login-form .el-select:hover {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.login-form .el-select .el-input__inner {
  border-radius: 15px;
  font-family: 'Comic Sans MS', 'Arial', sans-serif;
  font-size: 16px;
  color: #333;
  padding: 10px 15px;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
}

.login-form .el-select .el-input__inner:focus {
  border-color: #6a11cb;
  box-shadow: 0 0 0 2px rgba(106, 17, 203, 0.2);
  color: #6a11cb;
  font-weight: bold;
}

.login-form .el-input {
  border-radius: 15px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.login-form .el-input:hover {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.login-form .el-input__inner {
  font-family: 'Comic Sans MS', 'Arial', sans-serif;
  font-size: 16px;
  color: #333;
  padding: 10px 15px;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
}

.login-form .el-input__inner:focus {
  border-color: #6a11cb;
  box-shadow: 0 0 0 2px rgba(106, 17, 203, 0.2);
  color: #6a11cb;
  font-weight: bold;
}

.login-form .el-button {
  border-radius: 25px;
  font-weight: bold;
  padding: 10px 25px;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  border: none;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  font-family: 'Comic Sans MS', 'Arial', sans-serif;
  font-size: 16px;
}

.login-form .el-button:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 25px rgba(106, 17, 203, 0.4);
}

/* 章节标题 */
.section-title {
  font-size: 24px;
  font-weight: bold;
  color: #6a11cb;
  margin-bottom: 30px;
  text-align: center;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

/* 排行榜样式 */
.leaderboard-section {
  margin-top: 30px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
}

.leaderboard-header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.leaderboard-header-container .section-title {
  margin-bottom: 0;
  font-size: 20px;
}

.leaderboard-tabs {
  border-radius: 8px;
  padding: 0;
  box-shadow: none;
  background: transparent;
}

.leaderboard-content {
  margin-top: 15px;
}

.filter-section {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.filter-section .el-select {
  min-width: 120px;
  border-radius: 8px;
  box-shadow: none;
  transition: all 0.3s ease;
}

.filter-section .el-select:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.leaderboard-table {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: none;
  border: 1px solid #e9ecef;
}

.leaderboard-header {
  display: grid;
  grid-template-columns: 80px 1fr 100px 80px 80px 120px 100px 100px;
  background: #6a11cb;
  color: white;
  font-weight: bold;
  padding: 12px;
  text-align: center;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.leaderboard-row {
  display: grid;
  grid-template-columns: 80px 1fr 100px 80px 80px 120px 100px 100px;
  padding: 12px;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.leaderboard-row:hover {
  background-color: #f8f9fa;
}

.leaderboard-row.current-user {
  background-color: #e3f2fd;
  border-left: 3px solid #2196f3;
}

.rank-number {
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  border-radius: 50%;
  background-color: #6a11cb;
  color: white;
  font-weight: bold;
  font-size: 12px;
  transition: all 0.3s ease;
}

.leaderboard-row:nth-child(2) .rank-number {
  background-color: #ffd700;
  width: 28px;
  height: 28px;
  line-height: 28px;
  font-size: 14px;
}

.leaderboard-row:nth-child(3) .rank-number {
  background-color: #c0c0c0;
  width: 26px;
  height: 26px;
  line-height: 26px;
  font-size: 13px;
}

.leaderboard-row:nth-child(4) .rank-number {
  background-color: #cd7f32;
}

.leaderboard-empty {
  text-align: center;
  padding: 30px;
  color: #999;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: none;
  border: 1px solid #e9ecef;
}

/* 个人成绩样式 */
.personal-stats {
  padding: 15px;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  background: #6a11cb;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid #5a0fb5;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 8px;
  animation: bounce 2s infinite;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
}

.subject-stats,
.recent-records {
  margin-top: 20px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .leaderboard-header,
  .leaderboard-row {
    grid-template-columns: 60px 1fr 80px 60px 60px 100px 80px 80px;
  }
  
  .leaderboard-section {
    padding: 20px;
  }
  
  .leaderboard-header,
  .leaderboard-row {
    padding: 10px;
  }
}

@media (max-width: 768px) {
  .student-container {
    padding: 10px;
    border-radius: 10px;
  }
  
  .game-title {
    font-size: 24px;
  }
  
  .game-logo {
    font-size: 30px;
  }
  
  .section-title {
    font-size: 20px;
  }
  
  .leaderboard-header,
  .leaderboard-row {
    grid-template-columns: 50px 1fr 70px 50px 50px 80px 70px 70px;
    font-size: 14px;
  }
  
  .leaderboard-section {
    padding: 15px;
  }
  
  .leaderboard-header,
  .leaderboard-row {
    padding: 8px;
  }
  
  .rank-number {
    width: 24px;
    height: 24px;
    line-height: 24px;
    font-size: 12px;
  }
  
  .user-info-bottom {
    flex-direction: column;
    align-items: center;
  }
  
  .user-info-details {
    justify-content: center;
  }
  
  .form-row {
    flex-direction: column;
    align-items: center;
  }
  
  .form-item {
    width: 100%;
    justify-content: center;
  }
  
  .submit-item {
    margin-left: 0 !important;
  }
  
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 最近答题记录样式 */
.recent-records .leaderboard-header {
  grid-template-columns: 100px 1fr 80px 80px 150px;
  white-space: nowrap;
}

.recent-records .leaderboard-row {
  grid-template-columns: 100px 1fr 80px 80px 150px;
  white-space: nowrap;
}

/* 用户详情对话框样式 */
.user-records {
  overflow-x: auto;
}

.user-records .leaderboard-header {
  grid-template-columns: 100px 1fr 80px 80px 150px;
  white-space: nowrap;
}

.user-records .leaderboard-row {
  grid-template-columns: 100px 1fr 80px 80px 150px;
  white-space: nowrap;
}

.user-records .subcategory-col {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 868px) {
  .user-records .leaderboard-header,
  .user-records .leaderboard-row {
    grid-template-columns: 80px 1fr 60px 60px 100px;
    font-size: 14px;
  }
}
</style>
