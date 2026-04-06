<template>
  <div class="leaderboard-view">
    <AppHeader />
    <div class="leaderboard-content">
      <div class="leaderboard-section">
        <div class="leaderboard-header-container">
          <h2 class="section-title">🏆 排行榜</h2>
          <div class="header-buttons">
            <button class="back-btn" @click="goBack">
              <el-icon><ArrowLeft /></el-icon>
              <span>返回首页</span>
            </button>
          </div>
        </div>
        <el-tabs v-model="activeTab" class="leaderboard-tabs">
          <el-tab-pane label="全局排行榜" name="global">
            <div class="filter-section">
              <el-select v-model="selectedGrade" placeholder="选择年级" @change="handleGradeChange">
                <el-option label="全部年级" :value="null"></el-option>
                <el-option
                  v-for="grade in grades"
                  :key="grade"
                  :label="grade + '年级'"
                  :value="grade"
                ></el-option>
              </el-select>
              <el-select
                v-model="selectedClass"
                placeholder="选择班级"
                @change="handleGlobalClassChange"
              >
                <el-option label="全部班级" :value="null"></el-option>
                <el-option
                  v-for="classNum in classes"
                  :key="classNum"
                  :label="classNum + '班'"
                  :value="classNum"
                ></el-option>
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
              <div
                v-for="(item, index) in globalLeaderboard"
                :key="item.user_id || index"
                class="leaderboard-row"
                :class="{
                  'current-user': item.student_id === currentStudentId,
                  'top-3': index < 3,
                  'top-10': index < 10
                }"
                style="cursor: pointer"
                @click="openUserDetailDialog(item)"
              >
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
            <div class="pagination" style="margin-top: 20px; text-align: right">
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
              <el-select
                v-model="selectedSubjectId"
                placeholder="选择学科"
                @change="handleSubjectChange"
              >
                <el-option
                  v-for="subject in subjects"
                  :key="subject.id"
                  :label="subject.name"
                  :value="subject.id"
                ></el-option>
              </el-select>
              <el-select
                v-model="selectedSubcategoryId"
                placeholder="选择题库"
                :disabled="!selectedSubjectId"
                @change="handleSubcategoryChange"
              >
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
                <el-option
                  v-for="grade in grades"
                  :key="grade"
                  :label="grade + '年级'"
                  :value="grade"
                ></el-option>
              </el-select>
              <el-select
                v-model="selectedClass"
                placeholder="选择班级"
                @change="handleSubjectClassChange"
              >
                <el-option label="全部班级" :value="null"></el-option>
                <el-option
                  v-for="classNum in classes"
                  :key="classNum"
                  :label="classNum + '班'"
                  :value="classNum"
                ></el-option>
              </el-select>
            </div>
            <div
              v-if="subjectLeaderboard.length > 0 && selectedSubjectId"
              class="leaderboard-table"
            >
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
              <div
                v-for="(item, index) in subjectLeaderboard"
                :key="item.user_id || index"
                class="leaderboard-row"
                :class="{
                  'current-user': item.student_id === currentStudentId,
                  'top-3': index < 3,
                  'top-10': index < 10
                }"
                style="cursor: pointer"
                @click="openUserDetailDialog(item)"
              >
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
            <div class="pagination" style="margin-top: 20px; text-align: right">
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
            <div v-if="currentUserId" class="personal-stats">
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
              <div
                v-if="userStats.subjectStats && userStats.subjectStats.length > 0"
                class="subject-stats"
              >
                <h3 class="section-title">各学科成绩</h3>
                <div class="leaderboard-table">
                  <div class="leaderboard-header">
                    <div class="subject-col">学科</div>
                    <div class="questions-col">答题数</div>
                    <div class="correct-col">正确数</div>
                    <div class="score-col">正确率</div>
                  </div>
                  <div
                    v-for="item in userStats.subjectStats"
                    :key="item.subject_id"
                    class="leaderboard-row"
                  >
                    <div class="subject-col">{{ item.subject_name }}</div>
                    <div class="questions-col">{{ item.total_questions || 0 }}</div>
                    <div class="correct-col">{{ item.correct_count || 0 }}</div>
                    <div class="score-col">{{ Math.round(item.avg_accuracy || 0) }}%</div>
                  </div>
                </div>
              </div>
              <div v-if="recentRecords.length > 0" class="recent-records">
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
                  <div
                    v-for="item in recentRecords"
                    :key="item.id"
                    class="leaderboard-row"
                    style="cursor: pointer"
                    @click="openAnswerDetailDialog(item)"
                  >
                    <div class="grade-col">{{ item.grade || '-' }}</div>
                    <div class="class-col">{{ item.class || '-' }}</div>
                    <div class="subject-col">{{ item.subject_name || '未知' }}</div>
                    <div class="subcategory-col">{{ item.subcategory_name || '全部' }}</div>
                    <div class="score-col">
                      {{ item.correct_count }} / {{ item.total_questions }}
                    </div>
                    <div class="accuracy-col">
                      {{ Math.round((item.correct_count / item.total_questions) * 100) }}%
                    </div>
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
    :title="
      selectedUser?.name
        ? `${selectedUser.name}的答题记录`
        : `${selectedUser?.grade || '-'}年级${selectedUser?.class || '-'}班的${selectedUser?.student_id || '未知'}的答题记录`
    "
    width="800px"
  >
    <div
      v-if="selectedUser"
      class="user-detail-info"
      style="margin-bottom: $spacing-comfortable; padding: 15px; background-color: var(--bg-gray-2); border-radius: $border-radius-sm"
    >
      <div style="display: flex; gap: $spacing-comfortable; flex-wrap: wrap">
        <div>
          <strong>学号:</strong>
          {{ selectedUser.student_id || '未知' }}
        </div>
        <div>
          <strong>姓名:</strong>
          {{ selectedUser.name || '未知' }}
        </div>
        <div>
          <strong>年级:</strong>
          {{ selectedUser.grade || '-' }}年级
        </div>
        <div>
          <strong>班级:</strong>
          {{ selectedUser.class || '-' }}班
        </div>
        <div>
          <strong>正确率:</strong>
          {{ Math.round(selectedUser.avg_accuracy || 0) }}%
        </div>
        <div>
          <strong>答题数:</strong>
          {{ selectedUser.total_questions || 0 }}
        </div>
        <div>
          <strong>答题次数:</strong>
          {{ selectedUser.total_sessions || 0 }}
        </div>
      </div>
    </div>

    <div v-if="selectedUserRecords.length > 0" class="user-records">
      <h3 style="margin-bottom: 15px; color: var(--gradient-purple-start)">答题记录</h3>
      <div class="leaderboard-table">
        <div class="leaderboard-header">
          <div class="subject-col">学科</div>
          <div class="subcategory-col">学科题库</div>
          <div class="score-col">成绩</div>
          <div class="accuracy-col">正确率</div>
          <div class="time-col">时间</div>
        </div>
        <div v-for="item in selectedUserRecords" :key="item.id" class="leaderboard-row">
          <div class="subject-col">{{ item.subject_name || '未知' }}</div>
          <div class="subcategory-col">{{ item.subcategory_name || '全部' }}</div>
          <div class="score-col">{{ item.correct_count }} / {{ item.total_questions }}</div>
          <div class="accuracy-col">
            {{ Math.round((item.correct_count / item.total_questions) * 100) }}%
          </div>
          <div class="time-col">{{ formatDate(item.created_at, '未知时间') }}</div>
        </div>
      </div>
    </div>
    <div v-else class="leaderboard-empty" style="text-align: center; padding: $spacing-section">
      <p>暂无答题记录</p>
    </div>
  </el-dialog>

  <!-- 答题详情对话框 -->
  <el-dialog
    v-model="answerDetailDialogVisible"
    :title="`${selectedAnswerRecord?.subject_name || '未知'} - ${selectedAnswerRecord?.subcategory_name || '全部'} 的答题详情`"
    width="800px"
  >
    <div
      v-if="selectedAnswerRecord"
      class="answer-detail-info"
      style="margin-bottom: $spacing-comfortable; padding: 15px; background-color: var(--bg-gray-2); border-radius: $border-radius-sm"
    >
      <div style="display: flex; gap: $spacing-comfortable; flex-wrap: wrap">
        <div>
          <strong>年级:</strong>
          {{ selectedAnswerRecord.grade || '-' }}
        </div>
        <div>
          <strong>班级:</strong>
          {{ selectedAnswerRecord.class || '-' }}
        </div>
        <div>
          <strong>学科:</strong>
          {{ selectedAnswerRecord.subject_name || '未知' }}
        </div>
        <div>
          <strong>题库:</strong>
          {{ selectedAnswerRecord.subcategory_name || '全部' }}
        </div>
        <div>
          <strong>成绩:</strong>
          {{ selectedAnswerRecord.correct_count }} / {{ selectedAnswerRecord.total_questions }}
        </div>
        <div>
          <strong>正确率:</strong>
          {{
            Math.round(
              (selectedAnswerRecord.correct_count / selectedAnswerRecord.total_questions) * 100
            )
          }}%
        </div>
        <div>
          <strong>时间:</strong>
          {{ formatDate(selectedAnswerRecord.created_at, '未知时间') }}
        </div>
      </div>
    </div>

    <div v-if="selectedAnswerQuestions.length > 0" class="answer-questions">
      <h3 style="margin-bottom: 15px; color: var(--gradient-purple-start)">答题情况</h3>
      <div class="question-cards">
        <div v-for="(item, index) in selectedAnswerQuestions" :key="item.id" class="question-card">
          <div class="question-card-header">
            <div class="question-number">第 {{ index + 1 }} 题</div>
            <div
              class="question-result"
              :class="{ correct: item.is_correct, incorrect: !item.is_correct }"
            >
              <span v-if="item.is_correct" style="color: green; font-weight: bold">✓ 正确</span>
              <span v-else style="color: red; font-weight: bold">✗ 错误</span>
            </div>
          </div>
          <!-- eslint-disable-next-line vue/no-v-html -- 数据已在后端通过 xssFilter 过滤 -->
          <div class="question-content rich-text-content size-medium" v-html="item.content"></div>
          <div v-if="item.options && item.options.length > 0" class="question-options">
            <div v-for="(option, optIndex) in item.options" :key="optIndex" class="option-item">
              <span class="option-letter">{{ String.fromCharCode(65 + optIndex) }}.</span>
              <span class="option-text rich-text-content size-medium" v-html="option"></span>
              <!-- eslint-disable-line vue/no-v-html -->
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
          <div v-if="item.explanation" class="question-explanation">
            <div class="explanation-label">解析:</div>
            <!-- eslint-disable-next-line vue/no-v-html -- 后端已过滤 -->
            <div class="explanation-content" v-html="item.explanation"></div>
          </div>
          <div v-else class="question-explanation">
            <div class="explanation-label">解析:</div>
            <div class="explanation-content">暂无解析</div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="leaderboard-empty" style="text-align: center; padding: $spacing-section">
      <p>暂无答题详情</p>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElButton, ElTabs, ElTabPane, ElSelect, ElOption, ElDialog } from 'element-plus'
import 'element-plus/dist/index.css'
import { api } from '../utils/api'
import { formatDate } from '../utils/dateUtils'
import AppHeader from '../components/common/AppHeader.vue'

const activeTab = ref('global')
const subjects = ref([])
const selectedSubjectId = ref(null)
const subcategories = ref([])
const selectedSubcategoryId = ref(null)

const router = useRouter()

// 返回首页
function goBack() {
  router.push('/home')
}
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
    const serverGrades = await api.get('/grades')
    if (Array.isArray(serverGrades) && serverGrades.length > 0) {
      grades.value = serverGrades
        .map(grade => {
          if (typeof grade === 'object' && grade.name) {
            const gradeNum = parseInt(grade.name.match(/\d+/)?.[0] || '')
            return isNaN(gradeNum) ? parseInt(grade.id) || 1 : gradeNum
          } else if (typeof grade === 'number') {
            return grade
          } else {
            return 1
          }
        })
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort((a, b) => a - b)
    } else {
      grades.value = []
    }

    const serverClasses = await api.get('/classes')
    if (Array.isArray(serverClasses) && serverClasses.length > 0) {
      classes.value = serverClasses
        .map(classItem => {
          if (typeof classItem === 'object' && classItem.name) {
            const classNum = parseInt(classItem.name.match(/\d+/)?.[0] || '')
            return isNaN(classNum) ? parseInt(classItem.id) || 1 : classNum
          } else if (typeof classItem === 'number') {
            return classItem
          } else {
            return 1
          }
        })
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort((a, b) => a - b)
    } else {
      classes.value = []
    }
  } catch (error) {
    grades.value = []
    classes.value = []
  }
}

const handleGradeChange = async () => {
  try {
    const data = await api.get(`/classes?grade=${selectedGrade.value}`)
    if (Array.isArray(data) && data.length > 0) {
      classes.value = data
        .map(classItem => {
          if (typeof classItem === 'object' && classItem.name) {
            const classNum = parseInt(classItem.name.match(/\d+/)?.[0] || '')
            return isNaN(classNum) ? parseInt(classItem.id) || 1 : classNum
          } else if (typeof classItem === 'number') {
            return classItem
          } else {
            return 1
          }
        })
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort((a, b) => a - b)
    } else {
      classes.value = []
    }
    selectedClass.value = null
    // 重置页码
    globalCurrentPage.value = 1
    subjectCurrentPage.value = 1
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

// 处理全局排行榜的班级筛选变化
const handleGlobalClassChange = () => {
  globalCurrentPage.value = 1
  loadGlobalLeaderboard()
}

const loadSubjects = async () => {
  try {
    subjects.value = await api.get('/subjects')
  } catch (error) {
    // 静默处理错误
  }
}

// 加载子分类（题库）数据
const loadSubcategories = async subjectId => {
  try {
    if (!subjectId) {
      subcategories.value = []
      selectedSubcategoryId.value = null
      return
    }
    subcategories.value = await api.get(`/subjects/${subjectId}/subcategories`)
    selectedSubcategoryId.value = null
  } catch (error) {
    subcategories.value = []
    selectedSubcategoryId.value = null
  }
}

// 分页参数
const globalCurrentPage = ref(1)
const globalPageSize = ref(20)
const globalTotal = ref(0)

const loadGlobalLeaderboard = async (
  page = globalCurrentPage.value,
  size = globalPageSize.value
) => {
  try {
    const params = {
      grade: selectedGrade.value || undefined,
      class: selectedClass.value || undefined,
      limit: size,
      page: page
    }

    const data = await api.get('/leaderboard/global', params)
    globalLeaderboard.value = data.data || data
    globalTotal.value = data.total || data.length
  } catch (error) {
    console.error('加载全局排行榜失败:', error)
  }
}

// 处理全局排行榜分页
const handleGlobalPageChange = current => {
  loadGlobalLeaderboard(current, globalPageSize.value)
}

const handleGlobalSizeChange = size => {
  globalCurrentPage.value = 1
  loadGlobalLeaderboard(1, size)
}

// 学科排行榜分页参数
const subjectCurrentPage = ref(1)
const subjectPageSize = ref(20)
const subjectTotal = ref(0)

const loadSubjectLeaderboard = async (
  page = subjectCurrentPage.value,
  size = subjectPageSize.value
) => {
  if (!selectedSubjectId.value) {
    subjectLeaderboard.value = []
    return
  }

  try {
    const params = {
      subcategoryId: selectedSubcategoryId.value || undefined,
      grade: selectedGrade.value || undefined,
      class: selectedClass.value || undefined,
      limit: size,
      page: page
    }

    const data = await api.get(`/leaderboard/subject/${selectedSubjectId.value}`, params)
    subjectLeaderboard.value = data.data || data
    subjectTotal.value = data.total || data.length
  } catch (error) {
    console.error('加载学科排行榜失败:', error)
  }
}

// 处理学科排行榜分页
const handleSubjectPageChange = current => {
  console.log('学科分页变化:', current) // 调试日志
  loadSubjectLeaderboard(current, subjectPageSize.value)
}

const handleSubjectSizeChange = size => {
  subjectCurrentPage.value = 1
  loadSubjectLeaderboard(1, size)
}

// 处理子分类变化
const handleSubcategoryChange = () => {
  subjectCurrentPage.value = 1
  loadSubjectLeaderboard(1, subjectPageSize.value)
}

// 处理学科变化
const handleSubjectChange = async value => {
  await loadSubcategories(value)
  subjectCurrentPage.value = 1
  loadSubjectLeaderboard(1, subjectPageSize.value)
}

// 处理学科排行榜的班级筛选变化
const handleSubjectClassChange = () => {
  subjectCurrentPage.value = 1
  loadSubjectLeaderboard(1, subjectPageSize.value)
}

const loadUserStats = async () => {
  if (!currentUserId.value) return

  try {
    userStats.value = await api.get(`/users/stats/${currentUserId.value}`)
  } catch (error) {
    // 静默处理错误
  }
}

const loadRecentRecords = async () => {
  if (!currentUserId.value) {
    recentRecords.value = []
    return
  }

  try {
    const params = {
      userId: currentUserId.value,
      grade: selectedGrade.value || undefined,
      class: selectedClass.value || undefined
    }

    const data = await api.get('/answer-records/all', params)
    recentRecords.value = data.data || data
  } catch (error) {
    console.error('加载答题记录失败:', error)
    recentRecords.value = []
  }
}

// 加载用户的答题记录
const loadUserRecords = async userId => {
  try {
    const data = await api.get(`/answer-records/${userId}`)
    selectedUserRecords.value = data.data || data
  } catch (error) {
    console.error('加载用户答题记录失败:', error)
    selectedUserRecords.value = []
  }
}

// 打开用户详情对话框
const openUserDetailDialog = async user => {
  selectedUser.value = user
  // 确保使用正确的用户ID字段
  const userId = user.id || user.user_id
  await loadUserRecords(userId)
  userDetailDialogVisible.value = true
}

// 加载答题详情
const loadAnswerQuestions = async recordId => {
  try {
    const data = await api.get(`/answer-records/question-attempts/${currentUserId.value}`, {
      answerRecordId: recordId
    })

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
        } else if (typeof parsedAnswer === 'object') {
          // 处理阅读题答案格式 {"0":"B", "1":"C", "2":"B", "3":"D"}
          const entries = Object.entries(parsedAnswer)
            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
            .map(([index, value]) => `第${parseInt(index) + 1}题:${value}`)
          userAnswer = entries.join(', ')
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
        } else if (typeof parsedAnswer === 'object') {
          // 处理阅读题答案格式 {"0":"B", "1":"C", "2":"B", "3":"D"}
          const entries = Object.entries(parsedAnswer)
            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
            .map(([index, value]) => `第${parseInt(index) + 1}题:${value}`)
          correctAnswer = entries.join(', ')
        }
      } catch (e) {
        // 解析失败，使用原始值
      }

      // 解析选项 - 使用原始选项，因为 user_answer 和 correct_answer 都保存的是原始位置
      let options = []
      try {
        if (item.options) {
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
  } catch (error) {
    selectedAnswerQuestions.value = []
  }
}

// 打开答题详情对话框
const openAnswerDetailDialog = async record => {
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

watch(activeTab, newTab => {
  if (newTab === 'global') {
    loadGlobalLeaderboard()
  } else if (newTab === 'subject' && selectedSubjectId.value) {
    loadSubjectLeaderboard()
  }
})
</script>


<style scoped lang="scss" src="./styles/LeaderboardView.scss"></style>
