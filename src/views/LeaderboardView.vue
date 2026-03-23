<template>
  <div class="leaderboard-view">
    <AppHeader />
    <div class="leaderboard-content">
      <div class="leaderboard-section">
        <div class="leaderboard-header-container">
          <h2 class="section-title">🏆 排行榜</h2>
          <div class="header-buttons">
            <router-link to="/home" class="back-home-btn">
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
            <div v-if="globalLeaderboard.length > 0" class="leaderboard-table">
              <div class="leaderboard-header">
                <div class="rank-col">排名</div>
                <div class="student-col">学号</div>
                <div class="name-col">姓名</div>
                <div class="grade-col">年级</div>
                <div class="class-col">班级</div>
                <div class="score-col">正确率</div>
                <div class="correct-col">正确数</div>
                <div class="questions-col">答题数</div>
                <div class="sessions-col">答题次数</div>
                <div class="points-col">积分</div>
              </div>
              <div v-for="(item, index) in globalLeaderboard" :key="item.user_id || index" class="leaderboard-row" :class="{ 'current-user': item.student_id === currentStudentId, 'top-3': index < 3, 'top-10': index < 10 }" @click="openUserDetailDialog(item)" style="cursor: pointer;">
                <div class="rank-col">
                  <span v-if="index === 0" class="rank-number rank-1">🥇</span>
                  <span v-else-if="index === 1" class="rank-number rank-2">🥈</span>
                  <span v-else-if="index === 2" class="rank-number rank-3">🥉</span>
                  <span v-else class="rank-number">{{ index + 1 }}</span>
                </div>
                <div class="student-col">{{ item.student_id || '未知' }}</div>
                <div class="name-col">{{ item.name || '未知' }}</div>
                <div class="grade-col">{{ item.grade || '-' }}年级</div>
                <div class="class-col">{{ item.class || '-' }}班</div>
                <div class="score-col">{{ Math.round(item.avg_accuracy || 0) }}%</div>
                <div class="correct-col">{{ item.correct_count || 0 }}</div>
                <div class="questions-col">{{ item.total_questions || 0 }}</div>
                <div class="sessions-col">{{ item.total_sessions || 0 }}</div>
                <div class="points-col">{{ item.points || 0 }}</div>
              </div>
            </div>
            <div v-else class="leaderboard-empty">
              <p>暂无排行数据</p>
              <p>全局排行榜数据长度: {{ globalLeaderboard.length }}</p>
            </div>
            
            <!-- 全局排行榜分页 -->
            <div class="pagination" style="margin-top: 20px; text-align: right;">
              <el-pagination
                v-model:current-page="globalCurrentPage"
                v-model:page-size="globalPageSize"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="globalTotal"
                @size-change="handleGlobalSizeChange"
                @current-change="handleGlobalPageChange"
              />
            </div>
            
            <div class="leaderboard-content-row">
              <div class="leaderboard-rules">
                <h3 class="rules-title">🏆 排行榜规则</h3>
                <ul class="rules-list">
                  <li>📝 排名根据用户的答题正确率、答题数和积分综合计算</li>
                  <li>🏅 TOP 3 玩家将获得特殊标识和动画效果</li>
                  <li>🎖️ TOP 10 玩家将获得特殊背景和边框效果</li>
                  <li>📊 积分规则：答对一题得1分，答错一题扣1分，全对积分翻倍</li>
                  <li>🔄 排行榜数据每日更新，确保公平公正</li>
                </ul>
              </div>

            </div>
          </el-tab-pane>
          <el-tab-pane label="学科排行榜" name="subject">
            <div class="filter-section">
              <el-select v-model="selectedSubjectId" placeholder="选择学科" @change="async (value) => { await loadSubcategories(value); loadSubjectLeaderboard(); }">
                <el-option 
                  v-for="subject in subjects" 
                  :key="subject.id"
                  :label="subject.name" 
                  :value="subject.id"
                ></el-option>
              </el-select>
              <el-select v-model="selectedSubcategoryId" placeholder="选择题库" @change="loadSubjectLeaderboard" :disabled="!selectedSubjectId">
                <el-option label="全部题库" :value="null"></el-option>
                <el-option 
                  v-for="subcategory in subcategories" 
                  :key="subcategory.id"
                  :label="subcategory.name" 
                  :value="subcategory.id"
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
            <div v-if="subjectLeaderboard.length > 0 && selectedSubjectId" class="leaderboard-table">
              <div class="leaderboard-header">
                <div class="rank-col">排名</div>
                <div class="student-col">学号</div>
                <div class="name-col">姓名</div>
                <div class="grade-col">年级</div>
                <div class="class-col">班级</div>
                <div class="score-col">正确率</div>
                <div class="correct-col">正确数</div>
                <div class="questions-col">答题数</div>
                <div class="sessions-col">答题次数</div>
                <div class="points-col">积分</div>
              </div>
              <div v-for="(item, index) in subjectLeaderboard" :key="item.user_id || index" class="leaderboard-row" :class="{ 'current-user': item.student_id === currentStudentId, 'top-3': index < 3, 'top-10': index < 10 }" @click="openUserDetailDialog(item)" style="cursor: pointer;">
                <div class="rank-col">
                  <span v-if="index === 0" class="rank-number rank-1">🥇</span>
                  <span v-else-if="index === 1" class="rank-number rank-2">🥈</span>
                  <span v-else-if="index === 2" class="rank-number rank-3">🥉</span>
                  <span v-else class="rank-number">{{ index + 1 }}</span>
                </div>
                <div class="student-col">{{ item.student_id || '未知' }}</div>
                <div class="name-col">{{ item.name || '未知' }}</div>
                <div class="grade-col">{{ item.grade || '-' }}年级</div>
                <div class="class-col">{{ item.class || '-' }}班</div>
                <div class="score-col">{{ Math.round(item.avg_accuracy || 0) }}%</div>
                <div class="correct-col">{{ item.correct_count || 0 }}</div>
                <div class="questions-col">{{ item.total_questions || 0 }}</div>
                <div class="sessions-col">{{ item.total_sessions || 0 }}</div>
                <div class="points-col">{{ item.points || 0 }}</div>
              </div>
            </div>
            <div v-else class="leaderboard-empty">
              <p>{{ selectedSubjectId ? '暂无排行数据' : '请选择一个学科查看排行榜' }}</p>
              <p v-if="selectedSubjectId">学科排行榜数据长度: {{ subjectLeaderboard.length }}</p>
            </div>
            
            <!-- 学科排行榜分页 -->
            <div class="pagination" style="margin-top: 20px; text-align: right;">
              <el-pagination
                v-model:current-page="subjectCurrentPage"
                v-model:page-size="subjectPageSize"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="subjectTotal"
                @size-change="handleSubjectSizeChange"
                @current-change="handleSubjectPageChange"
              />
            </div>
            
            <div class="leaderboard-content-row">
              <div class="leaderboard-rules">
                <h3 class="rules-title">🏆 排行榜规则</h3>
                <ul class="rules-list">
                  <li>📝 排名根据用户的答题正确率、答题数和积分综合计算</li>
                  <li>🏅 TOP 3 玩家将获得特殊标识和动画效果</li>
                  <li>🎖️ TOP 10 玩家将获得特殊背景和边框效果</li>
                  <li>📊 积分规则：答对一题得1分，答错一题扣1分，全对积分翻倍</li>
                  <li>🔄 排行榜数据每日更新，确保公平公正</li>
                </ul>
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
                    <div class="grade-col">年级</div>
                    <div class="class-col">班级</div>
                    <div class="subject-col">学科</div>
                    <div class="subcategory-col">学科题库</div>
                    <div class="score-col">成绩</div>
                    <div class="accuracy-col">正确率</div>
                    <div class="time-col">时间</div>
                  </div>
                  <div v-for="(item, index) in recentRecords" :key="item.id" class="leaderboard-row" @click="openAnswerDetailDialog(item)" style="cursor: pointer;">
                    <div class="grade-col">{{ item.grade || '-' }}</div>
                    <div class="class-col">{{ item.class || '-' }}</div>
                    <div class="subject-col">{{ item.subject_name || '未知' }}</div>
                    <div class="subcategory-col">{{ item.subcategory_name || '全部' }}</div>
                    <div class="score-col">{{ item.correct_count }} / {{ item.total_questions }}</div>
                    <div class="accuracy-col">{{ Math.round((item.correct_count / item.total_questions) * 100) }}%</div>
                    <div class="time-col">{{ formatDate(item.created_at, '未知时间') }}</div>
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
          <div class="subcategory-col">学科题库</div>
          <div class="score-col">成绩</div>
          <div class="accuracy-col">正确率</div>
          <div class="time-col">时间</div>
        </div>
        <div v-for="(item, index) in selectedUserRecords" :key="item.id" class="leaderboard-row">
          <div class="subject-col">{{ item.subject_name || '未知' }}</div>
          <div class="subcategory-col">{{ item.subcategory_name || '全部' }}</div>
          <div class="score-col">{{ item.correct_count }} / {{ item.total_questions }}</div>
          <div class="accuracy-col">{{ Math.round((item.correct_count / item.total_questions) * 100) }}%</div>
          <div class="time-col">{{ formatDate(item.created_at, '未知时间') }}</div>
        </div>
      </div>
    </div>
    <div v-else class="leaderboard-empty" style="text-align: center; padding: 40px;">
      <p>暂无答题记录</p>
    </div>
  </el-dialog>
  
  <!-- 答题详情对话框 -->
  <el-dialog
    v-model="answerDetailDialogVisible"
    :title="`${selectedAnswerRecord?.subject_name || '未知'} - ${selectedAnswerRecord?.subcategory_name || '全部'} 的答题详情`"
    width="800px"
  >
    <div v-if="selectedAnswerRecord" class="answer-detail-info" style="margin-bottom: 20px; padding: 15px; background-color: #f5f7fa; border-radius: 8px;">
      <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <div><strong>年级:</strong> {{ selectedAnswerRecord.grade || '-' }}</div>
        <div><strong>班级:</strong> {{ selectedAnswerRecord.class || '-' }}</div>
        <div><strong>学科:</strong> {{ selectedAnswerRecord.subject_name || '未知' }}</div>
        <div><strong>题库:</strong> {{ selectedAnswerRecord.subcategory_name || '全部' }}</div>
        <div><strong>成绩:</strong> {{ selectedAnswerRecord.correct_count }} / {{ selectedAnswerRecord.total_questions }}</div>
        <div><strong>正确率:</strong> {{ Math.round((selectedAnswerRecord.correct_count / selectedAnswerRecord.total_questions) * 100) }}%</div>
        <div><strong>时间:</strong> {{ formatDate(selectedAnswerRecord.created_at, '未知时间') }}</div>
      </div>
    </div>
    
    <div class="answer-questions" v-if="selectedAnswerQuestions.length > 0">
      <h3 style="margin-bottom: 15px; color: #6a11cb;">答题情况</h3>
      <div class="question-cards">
        <div v-for="(item, index) in selectedAnswerQuestions" :key="item.id" class="question-card">
          <div class="question-card-header">
            <div class="question-number">第 {{ index + 1 }} 题</div>
            <div class="question-result" :class="{ 'correct': item.is_correct, 'incorrect': !item.is_correct }">
              <span v-if="item.is_correct" style="color: green; font-weight: bold;">✓ 正确</span>
              <span v-else style="color: red; font-weight: bold;">✗ 错误</span>
            </div>
          </div>
          <div class="question-content" v-html="item.content"></div>
          <div class="question-options" v-if="item.options && item.options.length > 0">
            <div v-for="(option, optIndex) in item.options" :key="optIndex" class="option-item">
              <span class="option-letter">{{ String.fromCharCode(65 + optIndex) }}.</span>
              <span class="option-text" v-html="option"></span>
            </div>
          </div>
          <div class="question-answers">
            <div class="answer-item">
              <span class="answer-label">用户答案:</span>
              <span class="answer-value">{{ item.user_answer }}</span>
            </div>
            <div class="answer-item">
              <span class="answer-label">正确答案:</span>
              <span class="answer-value">{{ item.correct_answer }}</span>
            </div>
          </div>
          <div class="question-explanation" v-if="item.explanation">
            <div class="explanation-label">解析:</div>
            <div class="explanation-content" v-html="item.explanation"></div>
          </div>
          <div class="question-explanation" v-else>
            <div class="explanation-label">解析:</div>
            <div class="explanation-content">暂无解析</div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="leaderboard-empty" style="text-align: center; padding: 40px;">
      <p>暂无答题详情</p>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElButton, ElTabs, ElTabPane, ElSelect, ElOption, ElDialog } from 'element-plus'
import 'element-plus/dist/index.css'
import { getApiBaseUrl } from '../utils/database'
import { formatDate } from '../utils/dateUtils'
import AppHeader from '../components/common/AppHeader.vue'

const activeTab = ref('global')
const subjects = ref([])
const selectedSubjectId = ref(null)
const subcategories = ref([])
const selectedSubcategoryId = ref(null)
const globalLeaderboard = ref([])
const subjectLeaderboard = ref([])
const currentUserId = ref(localStorage.getItem('userId'))
const currentStudentId = ref(localStorage.getItem('studentId'))
const userStats = ref({})
const recentRecords = ref([])

const grades = ref([])
const classes = ref([])
const selectedGrade = ref(null)
const selectedClass = ref(null)

// 用户详情和答题记录对话框
const userDetailDialogVisible = ref(false)
const selectedUser = ref(null)
const selectedUserRecords = ref([])

// 答题详情对话框
const answerDetailDialogVisible = ref(false)
const selectedAnswerRecord = ref(null)
const selectedAnswerQuestions = ref([])

const loadGradesAndClasses = async () => {
  try {
    const gradesResponse = await fetch(`${getApiBaseUrl()}/grades`)
    if (gradesResponse.ok) {
      const serverGrades = await gradesResponse.json()
      if (Array.isArray(serverGrades) && serverGrades.length > 0) {
        grades.value = serverGrades.map(grade => {
          if (typeof grade === 'object' && grade.name) {
            const gradeNum = parseInt(grade.name.match(/\d+/)?.[0] || '')
            return isNaN(gradeNum) ? parseInt(grade.id) || 1 : gradeNum
          } else if (typeof grade === 'number') {
            return grade
          } else {
            return 1
          }
        }).filter((value, index, self) => self.indexOf(value) === index).sort((a, b) => a - b)
      } else {
        grades.value = []
      }
    } else {
      grades.value = []
    }
    
    const classesResponse = await fetch(`${getApiBaseUrl()}/classes`)
    if (classesResponse.ok) {
      const serverClasses = await classesResponse.json()
      if (Array.isArray(serverClasses) && serverClasses.length > 0) {
        classes.value = serverClasses.map(classItem => {
          if (typeof classItem === 'object' && classItem.name) {
            const classNum = parseInt(classItem.name.match(/\d+/)?.[0] || '')
            return isNaN(classNum) ? parseInt(classItem.id) || 1 : classNum
          } else if (typeof classItem === 'number') {
            return classItem
          } else {
            return 1
          }
        }).filter((value, index, self) => self.indexOf(value) === index).sort((a, b) => a - b)
      } else {
        classes.value = []
      }
    } else {
      classes.value = []
    }
  } catch (error) {
    // console.error('加载年级和班级数据失败:', error)
    grades.value = []
    classes.value = []
  }
}

const handleGradeChange = async () => {
  try {
    const classesResponse = await fetch(`${getApiBaseUrl()}/classes?grade=${selectedGrade.value}`)
    if (classesResponse.ok) {
      const serverClasses = await classesResponse.json()
      if (Array.isArray(serverClasses) && serverClasses.length > 0) {
        classes.value = serverClasses.map(classItem => {
          if (typeof classItem === 'object' && classItem.name) {
            const classNum = parseInt(classItem.name.match(/\d+/)?.[0] || '')
            return isNaN(classNum) ? parseInt(classItem.id) || 1 : classNum
          } else if (typeof classItem === 'number') {
            return classItem
          } else {
            return 1
          }
        }).filter((value, index, self) => self.indexOf(value) === index).sort((a, b) => a - b)
      } else {
        classes.value = []
      }
    } else {
      classes.value = []
    }
    selectedClass.value = null
    if (activeTab.value === 'global') {
      await loadGlobalLeaderboard()
    } else if (activeTab.value === 'subject' && selectedSubjectId.value) {
      await loadSubjectLeaderboard()
    }
  } catch (error) {
    // console.error('加载班级数据失败:', error)
    classes.value = []
  }
}



const loadSubjects = async () => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/subjects`)
    if (response.ok) {
      subjects.value = await response.json()
    }
  } catch (error) {
    // console.error('加载学科失败:', error)
  }
}

// 加载子分类（题库）数据
const loadSubcategories = async (subjectId) => {
  try {
    if (!subjectId) {
      subcategories.value = []
      selectedSubcategoryId.value = null
      return
    }
    const response = await fetch(`${getApiBaseUrl()}/subjects/${subjectId}/subcategories`)
    if (response.ok) {
      subcategories.value = await response.json()
    } else {
      subcategories.value = []
    }
    selectedSubcategoryId.value = null
  } catch (error) {
    // console.error('加载子分类失败:', error)
    subcategories.value = []
    selectedSubcategoryId.value = null
  }
}

// 分页参数
const globalCurrentPage = ref(1)
const globalPageSize = ref(20)
const globalTotal = ref(0)

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
    
    // 添加分页参数
    params.append('limit', globalPageSize.value)
    params.append('page', globalCurrentPage.value)
    
    if (params.toString()) {
      url += '?' + params.toString()
    }
    
    const response = await fetch(url)
    if (response.ok) {
      const data = await response.json()
      globalLeaderboard.value = data.data || data
      // 假设后端返回total字段，否则根据实际情况调整
      globalTotal.value = data.total || data.length
    }
  } catch (error) {
    // console.error('加载全局排行榜失败:', error)
  }
}

// 处理全局排行榜分页
const handleGlobalPageChange = (current) => {
  globalCurrentPage.value = current
  loadGlobalLeaderboard()
}

const handleGlobalSizeChange = (size) => {
  globalPageSize.value = size
  globalCurrentPage.value = 1
  loadGlobalLeaderboard()
}

// 学科排行榜分页参数
const subjectCurrentPage = ref(1)
const subjectPageSize = ref(20)
const subjectTotal = ref(0)

const loadSubjectLeaderboard = async () => {
  if (!selectedSubjectId.value) {
    subjectLeaderboard.value = []
    return
  }
  
  try {
    let url = `${getApiBaseUrl()}/leaderboard/subject/${selectedSubjectId.value}`
    const params = new URLSearchParams()
    
    if (selectedSubcategoryId.value) {
      params.append('subcategoryId', selectedSubcategoryId.value)
    }
    
    if (selectedGrade.value) {
      params.append('grade', selectedGrade.value)
    }
    
    if (selectedClass.value) {
      params.append('class', selectedClass.value)
    }
    
    // 添加分页参数
    params.append('limit', subjectPageSize.value)
    params.append('page', subjectCurrentPage.value)
    
    if (params.toString()) {
      url += '?' + params.toString()
    }
    
    const response = await fetch(url)
    if (response.ok) {
      const data = await response.json()
      subjectLeaderboard.value = data.data || data
      // 假设后端返回total字段，否则根据实际情况调整
      subjectTotal.value = data.total || data.length
    }
  } catch (error) {
    // console.error('加载学科排行榜失败:', error)
  }
}

// 处理学科排行榜分页
const handleSubjectPageChange = (current) => {
  subjectCurrentPage.value = current
  loadSubjectLeaderboard()
}

const handleSubjectSizeChange = (size) => {
  subjectPageSize.value = size
  subjectCurrentPage.value = 1
  loadSubjectLeaderboard()
}

const loadUserStats = async () => {
  if (!currentUserId.value) return
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/users/stats/${currentUserId.value}`)
    if (response.ok) {
      userStats.value = await response.json()
    }
  } catch (error) {
    // console.error('加载用户统计失败:', error)
  }
}

const loadRecentRecords = async () => {
  if (!currentUserId.value) {
    recentRecords.value = []
    return
  }
  
  try {
    let url = `${getApiBaseUrl()}/answer-records/all`
    const params = new URLSearchParams()
    
    // 添加用户ID筛选
    params.append('userId', currentUserId.value)
    
    // 添加年级和班级筛选
    if (selectedGrade.value) {
      params.append('grade', selectedGrade.value)
    }
    if (selectedClass.value) {
      params.append('class', selectedClass.value)
    }
    
    if (params.toString().length > 0) {
      url += `?${params.toString()}`
    }
    
    const response = await fetch(url)
    
    if (response.ok) {
      const data = await response.json()
      recentRecords.value = data
    } else {
      // console.error('加载答题记录失败，响应状态:', response.status)
      recentRecords.value = []
    }
  } catch (error) {
    // console.error('加载答题记录失败:', error)
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
      // console.error('加载用户答题记录失败，响应状态:', response.status)
      selectedUserRecords.value = []
    }
  } catch (error) {
    // console.error('加载用户答题记录失败:', error)
    selectedUserRecords.value = []
  }
}

// 打开用户详情对话框
const openUserDetailDialog = async (user) => {
  selectedUser.value = user
  // 确保使用正确的用户ID字段
  const userId = user.id || user.user_id
  await loadUserRecords(userId)
  userDetailDialogVisible.value = true
}

// 加载答题详情
const loadAnswerQuestions = async (recordId) => {
  try {
    const url = `${getApiBaseUrl()}/answer-records/question-attempts/${currentUserId.value}?answerRecordId=${recordId}`
    const response = await fetch(url)
    
    if (response.ok) {
      const data = await response.json()

      // 解析题目数据
      const parsedData = data.map(item => {
        // 解析题目内容
        let content = item.content
        try {
          const parsedContent = JSON.parse(item.content)
          if (typeof parsedContent === 'string') {
            content = parsedContent
          }
        } catch (e) {
          // 解析失败，使用原始值
        }
        
        // 解析用户答案
        let userAnswer = item.user_answer
        try {
          const parsedAnswer = JSON.parse(item.user_answer)
          if (Array.isArray(parsedAnswer)) {
            userAnswer = parsedAnswer.join(', ')
          } else if (typeof parsedAnswer === 'string') {
            userAnswer = parsedAnswer
          }
        } catch (e) {
          // 解析失败，使用原始值
        }
        
        // 解析正确答案
        let correctAnswer = item.correct_answer
        try {
          const parsedAnswer = JSON.parse(item.correct_answer)
          if (Array.isArray(parsedAnswer)) {
            correctAnswer = parsedAnswer.join(', ')
          } else if (typeof parsedAnswer === 'string') {
            correctAnswer = parsedAnswer
          }
        } catch (e) {
          // 解析失败，使用原始值
        }
        
        // 解析选项
        let options = []
        try {
          if (item.shuffled_options) {
            const parsedOptions = JSON.parse(item.shuffled_options)
            if (Array.isArray(parsedOptions)) {
              options = parsedOptions
            }
          } else if (item.options) {
            const parsedOptions = JSON.parse(item.options)
            if (Array.isArray(parsedOptions)) {
              options = parsedOptions
            }
          }
        } catch (e) {
          // 解析失败，使用空数组
        }
        
        // 解析题目解析
        let explanation = item.explanation
        try {
          if (item.explanation) {
            // 直接使用原始值，因为后端已经返回了正确的解析字符串
            explanation = String(item.explanation)
          } else {
            explanation = ''
          }
        } catch (e) {
          // 解析失败，使用空字符串
          explanation = ''
        }
        
        // 确保explanation是字符串类型
        if (explanation === null || explanation === undefined) {
          explanation = ''
        } else if (typeof explanation !== 'string') {
          explanation = String(explanation)
        }
        

        
        return {
          ...item,
          content,
          user_answer: userAnswer,
          correct_answer: correctAnswer,
          options,
          explanation
        }
      })
      selectedAnswerQuestions.value = parsedData
    } else {
      // console.error('加载答题详情失败，响应状态:', response.status)
      selectedAnswerQuestions.value = []
    }
  } catch (error) {
    // console.error('加载答题详情失败:', error)
    selectedAnswerQuestions.value = []
  }
}

// 打开答题详情对话框
const openAnswerDetailDialog = async (record) => {
  selectedAnswerRecord.value = record
  await loadAnswerQuestions(record.id)
  answerDetailDialogVisible.value = true
}

onMounted(async () => {
  await loadSubjects()
  await loadGradesAndClasses()
  loadGlobalLeaderboard()
  if (currentUserId.value) {
    loadUserStats()
    loadRecentRecords()
  }
})

watch(activeTab, (newTab) => {
  if (newTab === 'global') {
    loadGlobalLeaderboard()
  } else if (newTab === 'subject' && selectedSubjectId.value) {
    loadSubjectLeaderboard()
  }
})
</script>

<style scoped>
.leaderboard-view {
  min-height: 100vh;
  background: var(--header-gradient);
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23F7FFF7"/><circle cx="20" cy="20" r="2" fill="%23FF6B6B" opacity="0.3"/><circle cx="80" cy="40" r="2" fill="%234ECDC4" opacity="0.3"/><circle cx="40" cy="80" r="2" fill="%23FFD166" opacity="0.3"/><circle cx="60" cy="60" r="2" fill="%2306D6A0" opacity="0.3"/></svg>');
  background-repeat: repeat;
  padding-bottom: 2rem;
}

.leaderboard-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.section-title {
  font-family: 'Fredoka One', 'Comic Sans MS', cursive;
  font-size: 2rem;
  font-weight: 900;
  color: var(--accent-color);
  margin-bottom: 2rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 2px 2px 4px rgba(255, 209, 102, 0.3);
  animation: pulse 2s infinite;
}

.leaderboard-section {
  margin-top: 2rem;
  background: white;
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 3px solid var(--border-color);
  position: relative;
  overflow: hidden;
  animation: fadeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.leaderboard-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: var(--header-gradient);
}

.leaderboard-header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.leaderboard-header-container .section-title {
  margin-bottom: 0;
  font-size: 1.8rem;
}

.leaderboard-tabs {
  border-radius: 12px;
  padding: 0;
  box-shadow: none;
  background: transparent;
  margin-top: 1.5rem;
}

.filter-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: center;
  padding: 1.5rem;
  background: var(--header-gradient);
  border-radius: 16px;
  border: 3px solid var(--border-color);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--primary-color) #f1f1f1;
}

.filter-section::-webkit-scrollbar {
  height: 6px;
}

.filter-section::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.filter-section::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: 10px;
}

.filter-section::-webkit-scrollbar-thumb:hover {
  background: var(--secondary-color);
}

.filter-section .el-select {
  min-width: 180px;
  border-radius: 16px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 3px solid var(--border-color);
  background: white;
  overflow: hidden;
  position: relative;
  z-index: 10;
}

.filter-section .el-select:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
  border-color: var(--primary-color);
}

.filter-section .el-select:focus-within {
  box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.2);
  border-color: var(--primary-color);
}

.filter-section .el-select .el-input__wrapper {
  border-radius: 14px;
  border: none;
  box-shadow: none;
}

.filter-section .el-select .el-input__inner {
  border-radius: 14px;
  font-family: var(--game-font);
  font-size: 1.1rem;
  color: var(--text-primary);
  padding: 1rem 1.5rem;
  border: none;
  transition: all 0.3s ease;
}

.filter-section .el-select .el-input__inner:focus {
  border-color: var(--primary-color);
  box-shadow: none;
  color: var(--primary-color);
  font-weight: bold;
}

.filter-section .el-select .el-input__suffix {
  color: var(--accent-color);
  transition: all 0.3s ease;
}

.filter-section .el-select:hover .el-input__suffix {
  color: var(--primary-color);
  transform: rotate(180deg);
}

.filter-section .el-option {
  font-family: var(--game-font);
  font-size: 1rem;
  padding: 0.8rem 1.2rem;
  transition: all 0.2s ease;
  border-radius: 8px;
  margin: 0.2rem 0.5rem;
}

.filter-section .el-option:hover {
  background-color: rgba(255, 107, 107, 0.1);
  color: var(--primary-color);
  transform: translateX(5px);
}

.filter-section .el-option.is-selected {
  background-color: var(--primary-color);
  color: white;
  font-weight: bold;
}

.filter-section .el-select-dropdown {
  border-radius: 12px;
  border: 2px solid var(--border-color);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  margin-top: 8px;
}

.filter-section .el-select-dropdown__wrap {
  padding: 0.5rem 0;
}

.filter-section .el-select-dropdown__item {
  padding: 0.8rem 1.5rem;
  margin: 0 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.filter-section .el-select-dropdown__item:hover {
  background-color: rgba(255, 107, 107, 0.1);
  color: var(--primary-color);
  transform: translateX(5px);
}

.filter-section .el-select-dropdown__item.selected {
  background-color: var(--primary-color);
  color: white;
  font-weight: bold;
}

.back-home-btn .el-button {
  border-radius: 25px;
  font-weight: 900;
  padding: 0.8rem 1.8rem;
  background: var(--header-gradient);
  border: 3px solid var(--border-color);
  color: white;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  font-family: var(--game-font);
  text-transform: uppercase;
  letter-spacing: 1px;
  animation: fadeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.back-home-btn .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
  border-color: var(--primary-color);
}

.back-home-btn .el-button:active {
  transform: translateY(0);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.leaderboard-content-row {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: flex-start;
}

.leaderboard-rules {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  border: 3px solid var(--border-color);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  flex: 1;
  min-width: 300px;
}

/* 第一名卡片样式 */
.first-place-content {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--border-color);
  animation: fadeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  min-width: 300px;
  min-height: 210px;
  flex: 1;
  max-width: 440px;
}

.first-place-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.first-place-title {
  font-family: 'Fredoka One', 'Comic Sans MS', cursive;
  font-size: 1.5rem;
  font-weight: 900;
  color: #FFD700;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.first-place-badge {
  font-size: 2.5rem;
  animation: bounce 2s infinite;
}

.first-place-info {
  margin-bottom: 1.5rem;
}

.first-place-user {
  text-align: center;
  margin-bottom: 1.5rem;
}

.user-name {
  font-family: var(--game-font);
  font-size: 1.8rem;
  font-weight: 900;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.user-class {
  font-size: 1.1rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.first-place-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.first-place-stats .stat-item {
  text-align: center;
  padding: 1rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%);
  border-radius: 12px;
  border: 2px solid var(--border-color);
}

.first-place-stats .stat-label {
  display: block;
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.first-place-stats .stat-value {
  display: block;
  font-size: 1.3rem;
  font-weight: 900;
  color: var(--primary-color);
  font-family: var(--game-font);
}

.first-place-message {
  text-align: center;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 255, 255, 0.8) 100%);
  border-radius: 12px;
  border: 2px solid rgba(255, 215, 0, 0.3);
}

.first-place-message p {
  margin: 0.5rem 0;
  font-family: var(--game-font);
  color: var(--text-primary);
  font-weight: 600;
}

.first-place-message p:first-child {
  color: #FFD700;
  font-size: 1.1rem;
  font-weight: 900;
}

.rules-title {
  font-family: 'Fredoka One', 'Comic Sans MS', cursive;
  font-size: 1.2rem;
  font-weight: 900;
  color: var(--primary-color);
  margin-bottom: 1rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 2px 2px 4px rgba(255, 107, 107, 0.3);
}

.rules-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rules-list li {
  color: var(--text-primary);
  font-family: var(--game-font);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
  position: relative;
  line-height: 1.4;
}

.rules-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  top: 0.2rem;
  color: var(--primary-color);
  font-weight: bold;
  font-size: 1rem;
  width: 1rem;
  height: 1rem;
  text-align: center;
  font-size: 0.8rem;
}

.leaderboard-table {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--border-color);
  margin-top: 1.5rem;
}

.leaderboard-header {
  display: grid;
  grid-template-columns: 80px 100px 90px 60px 60px 100px 80px 80px 80px 80px;
  background: var(--header-gradient);
  color: white;
  font-weight: bold;
  padding: 1rem;
  text-align: center;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  font-family: var(--game-font);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.leaderboard-row {
  display: grid;
  grid-template-columns: 80px 100px 90px 60px 60px 100px 80px 80px 80px 80px;
  padding: 1rem;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  font-family: var(--game-font);
}

.leaderboard-row:hover {
  background-color: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.leaderboard-row.current-user {
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
  border-radius: 0 8px 8px 0;
}

.rank-number {
  display: inline-block;
  width: 32px;
  height: 32px;
  line-height: 32px;
  border-radius: 50%;
  background: var(--header-gradient);
  color: white;
  font-weight: bold;
  font-size: 1rem;
  transition: all 0.3s ease;
  font-family: var(--game-font);
}

/* Top 3 特殊样式 */
.rank-number.rank-1 {
  width: 40px;
  height: 40px;
  line-height: 40px;
  font-size: 1.5rem;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  box-shadow: 0 4px 8px rgba(255, 215, 0, 0.5);
  animation: glow 2s infinite;
}

.rank-number.rank-2 {
  width: 36px;
  height: 36px;
  line-height: 36px;
  font-size: 1.3rem;
  background: linear-gradient(135deg, #C0C0C0, #A9A9A9);
  box-shadow: 0 4px 8px rgba(192, 192, 192, 0.5);
  animation: glow 2s infinite 0.3s;
}

.rank-number.rank-3 {
  width: 34px;
  height: 34px;
  line-height: 34px;
  font-size: 1.2rem;
  background: linear-gradient(135deg, #CD7F32, #B87333);
  box-shadow: 0 4px 8px rgba(205, 127, 50, 0.5);
  animation: glow 2s infinite 0.6s;
}

/* Top 10 特殊样式 */
.leaderboard-row.top-3 {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 255, 255, 0.8));
  border: 2px solid rgba(255, 215, 0, 0.3);
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.leaderboard-row.top-3:hover {
  transform: scale(1.04);
  box-shadow: 0 6px 16px rgba(255, 215, 0, 0.5);
}

.leaderboard-row.top-10 {
  background: linear-gradient(135deg, rgba(106, 17, 203, 0.05), rgba(255, 255, 255, 0.9));
  border: 1px solid rgba(106, 17, 203, 0.2);
  transition: all 0.4s ease;
}

.leaderboard-row.top-10:hover {
  transform: scale(1.01);
  box-shadow: 0 4px 10px rgba(106, 17, 203, 0.3);
}

/* 发光动画 */
@keyframes glow {
  0%, 100% {
    box-shadow: 0 4px 8px rgba(255, 215, 0, 0.5);
  }
  50% {
    box-shadow: 0 6px 16px rgba(255, 215, 0, 0.8);
  }
}

.leaderboard-empty {
  text-align: center;
  padding: 4rem;
  color: #999;
  background-color: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--border-color);
  margin-top: 1.5rem;
  font-family: var(--game-font);
  font-size: 1.2rem;
}



.personal-stats {
  padding: 1.5rem;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--header-gradient);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  color: white;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  border: 3px solid var(--border-color);
  position: relative;
  overflow: hidden;
  animation: fadeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
}

.stat-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: bounce 2s infinite;
  position: relative;
  z-index: 1;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 900;
  margin-bottom: 0.5rem;
  font-family: var(--game-font);
  position: relative;
  z-index: 1;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.stat-label {
  font-size: 1rem;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  z-index: 1;
  font-family: var(--game-font);
}

.subject-stats,
.recent-records {
  margin-top: 2rem;
}

.recent-records .leaderboard-header {
  grid-template-columns: 80px 80px 120px 1fr 100px 100px 180px;
  white-space: nowrap;
}

.recent-records .leaderboard-row {
  grid-template-columns: 80px 80px 120px 1fr 100px 100px 180px;
  white-space: nowrap;
}

/* 用户详情对话框样式 */
.user-records {
  overflow-x: auto;
  margin-top: 1.5rem;
}

.user-records .leaderboard-header {
  grid-template-columns: 120px 1fr 100px 100px 180px;
  white-space: nowrap;
}

.user-records .leaderboard-row {
  grid-template-columns: 120px 1fr 100px 100px 180px;
  white-space: nowrap;
}

.user-records .subcategory-col {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-detail-info {
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: var(--header-gradient);
  border-radius: 12px;
  border: 2px solid var(--border-color);
  font-family: var(--game-font);
}

.user-detail-info div {
  font-size: 1rem;
  font-weight: bold;
  color: white;
}

.answer-detail-info {
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: var(--header-gradient);
  border-radius: 12px;
  border: 2px solid var(--border-color);
  font-family: var(--game-font);
}

.answer-detail-info div {
  font-size: 1rem;
  font-weight: bold;
  color: white;
}

.question-cards {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--border-color);
  transition: all 0.3s ease;
}

.question-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.question-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.question-number {
  font-weight: bold;
  font-size: 1.1rem;
  color: var(--primary-color);
  font-family: var(--game-font);
}

.question-result {
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 16px;
}

.question-result.correct {
  background: rgba(0, 255, 0, 0.1);
}

.question-result.incorrect {
  background: rgba(255, 0, 0, 0.1);
}

.question-content {
  margin-bottom: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  line-height: 1.5;
  font-size: 1rem;
}

.question-options {
  margin-bottom: 15px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.option-item:hover {
  background: #f0f0f0;
}

.option-letter {
  font-weight: bold;
  margin-right: 10px;
  min-width: 20px;
  color: var(--primary-color);
}

.option-text {
  flex: 1;
  line-height: 1.4;
  font-size: 0.95rem;
}

.question-answers {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.answer-item {
  display: flex;
  align-items: center;
}

.answer-label {
  font-weight: bold;
  margin-right: 8px;
  color: var(--text-secondary);
}

.answer-value {
  font-weight: bold;
  color: var(--primary-color);
}

.question-explanation {
  padding: 12px;
  background: linear-gradient(135deg, #f0f4ff 0%, #e6efff 100%);
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
}

.explanation-label {
  font-weight: bold;
  margin-bottom: 8px;
  color: var(--primary-color);
  font-size: 0.9rem;
}

.explanation-content {
  line-height: 1.5;
  font-size: 0.95rem;
  color: var(--text-primary);
}

.user-answer-col,
.correct-answer-col,
.result-col {
  text-align: center;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-15px);
  }
  60% {
    transform: translateY(-7px);
  }
}

/* 分页组件样式 */
.pagination {
  margin-top: 20px;
  margin-bottom: 20px;
  text-align: right;
  padding: 1rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--border-color);
  animation: fadeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pagination .el-pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--game-font);
}

.pagination .el-pagination__total {
  color: var(--text-primary);
  font-weight: 600;
  margin-right: 1rem;
}

.pagination .el-pagination__sizes {
  margin-right: 1rem;
}

.pagination .el-select {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--border-color);
  background: white;
  transition: all 0.3s ease;
}

.pagination .el-select:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  border-color: var(--primary-color);
  transform: translateY(-1px);
}

.pagination .el-select .el-input__inner {
  border-radius: 10px;
  font-family: var(--game-font);
  font-size: 0.9rem;
  color: var(--text-primary);
  padding: 0.5rem 1rem;
  border: none;
  transition: all 0.3s ease;
}

.pagination .el-select .el-input__inner:focus {
  border-color: var(--primary-color);
  box-shadow: none;
  color: var(--primary-color);
  font-weight: bold;
}

.pagination .el-pagination__jump {
  color: var(--text-primary);
  font-weight: 600;
}

.pagination .el-pagination__editor {
  margin: 0 0.5rem;
}

.pagination .el-pagination__editor .el-input {
  width: 60px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--border-color);
  transition: all 0.3s ease;
}

.pagination .el-pagination__editor .el-input:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  border-color: var(--primary-color);
}

.pagination .el-pagination__editor .el-input__inner {
  border-radius: 10px;
  font-family: var(--game-font);
  font-size: 0.9rem;
  color: var(--text-primary);
  padding: 0.5rem;
  text-align: center;
  border: none;
  transition: all 0.3s ease;
}

.pagination .el-pagination__editor .el-input__inner:focus {
  border-color: var(--primary-color);
  box-shadow: none;
  color: var(--primary-color);
  font-weight: bold;
}

.pagination .el-pagination__button {
  border-radius: 12px;
  padding: 0.5rem 1rem;
  background: white;
  border: 2px solid var(--border-color);
  color: var(--text-primary);
  font-family: var(--game-font);
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.pagination .el-pagination__button:hover:not(:disabled) {
  background: var(--header-gradient);
  color: white;
  border-color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.pagination .el-pagination__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination .el-pagination__number {
  border-radius: 12px;
  padding: 0.5rem 0.8rem;
  background: white;
  border: 2px solid var(--border-color);
  color: var(--text-primary);
  font-family: var(--game-font);
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin: 0 0.25rem;
}

.pagination .el-pagination__number:hover:not(.is-active) {
  background: var(--header-gradient);
  color: white;
  border-color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.pagination .el-pagination__number.is-active {
  background: var(--header-gradient);
  color: white;
  border-color: var(--primary-color);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .filter-section {
    gap: 0.8rem;
    padding: 1.2rem;
  }
  
  .filter-section .el-select {
    min-width: 160px;
  }
  
  .filter-section .el-select .el-input__inner {
    font-size: 1rem;
    padding: 0.8rem 1.2rem;
  }
  
  /* 第一名卡片响应式调整 */
  .first-place-content {
    min-width: 350px;
    max-width: 380px;
  }
}

@media (max-width: 768px) {
  .leaderboard-content {
    padding: 1.5rem;
  }
  
  .leaderboard-section {
    padding: 2rem;
  }
  
  .filter-section {
    flex-wrap: wrap;
    gap: 0.8rem;
    padding: 1rem;
  }
  
  .filter-section .el-select {
    min-width: 140px;
    flex: 1;
    min-width: calc(50% - 0.4rem);
  }
  
  .filter-section .el-select .el-input__inner {
    font-size: 0.9rem;
    padding: 0.7rem 1rem;
  }
  
  /* 第一名卡片响应式调整 */
  .leaderboard-content-row {
    gap: 1.5rem;
  }
  
  .first-place-content {
    min-width: 100%;
    max-width: 100%;
  }
  
  .first-place-title {
    font-size: 1.3rem;
  }
  
  .first-place-badge {
    font-size: 2.2rem;
  }
  
  .user-name {
    font-size: 1.6rem;
  }
  
  .first-place-stats {
    gap: 0.9rem;
  }
}

@media (max-width: 480px) {
  .leaderboard-content {
    padding: 1rem;
  }
  
  .leaderboard-section {
    padding: 1.5rem;
  }
  
  .filter-section {
    flex-direction: column;
    align-items: stretch;
    gap: 0.6rem;
    padding: 0.8rem;
  }
  
  .filter-section .el-select {
    width: 100%;
    min-width: 100%;
  }
  
  .filter-section .el-select .el-input__inner {
    font-size: 0.8rem;
    padding: 0.6rem 0.9rem;
  }
  
  /* 第一名卡片响应式调整 */
  .leaderboard-content-row {
    gap: 1rem;
  }
  
  .first-place-content {
    min-width: 100%;
    max-width: 100%;
    padding: 1rem;
  }
  
  .first-place-title {
    font-size: 1.2rem;
  }
  
  .first-place-badge {
    font-size: 2rem;
  }
  
  .user-name {
    font-size: 1.5rem;
  }
  
  .user-class {
    font-size: 1rem;
  }
  
  .first-place-stats {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.8rem;
  }
  
  .first-place-stats .stat-item {
    padding: 0.8rem;
  }
  
  .first-place-stats .stat-value {
    font-size: 1.1rem;
  }
  
  .first-place-stats .stat-label {
    font-size: 0.8rem;
  }
  
  .first-place-message p {
    font-size: 0.9rem;
  }
  
  .first-place-message p:first-child {
    font-size: 1rem;
  }
}
</style>