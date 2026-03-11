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
          <el-form @submit.prevent="saveStudentId" class="login-form">
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
                <el-button type="primary" @click="saveStudentId">登录</el-button>
              </el-form-item>
            </div>
          </el-form>
        </div>
      </div>
    </div>
    
    <!-- 学科选择 -->
    <div v-if="!selectedSubjectId" class="subject-selection">
      <h2 class="section-title">🚀 请选择学科</h2>
      <div class="subject-list">
        <div 
          v-for="subject in subjects" 
          :key="subject.id"
          class="subject-card"
          @click="selectSubject(subject.id)"
        >
          <div class="subject-icon" :class="'subject-' + (subject.iconIndex + 1)">
            {{ subjectIcons[subject.iconIndex || 0] }}
          </div>
          <div class="subject-name">{{ subject.name }}</div>
        </div>
      </div>
      
      <!-- 排行榜展示 -->
      <div class="leaderboard-section">
        <div class="leaderboard-header-container">
          <h2 class="section-title">🏆 排行榜 Top 10</h2>
          <div class="leaderboard-link-full-container">
            <router-link to="/leaderboard" class="leaderboard-link-full">查看完整排行榜</router-link>
          </div>
        </div>
        <div class="leaderboard-list">
          <div v-if="leaderboardData.length > 0" class="leaderboard-table">
            <div class="leaderboard-header">
              <div class="rank-col">排名</div>
              <div class="student-col">学号</div>
              <div class="name-col">姓名</div>
              <div class="grade-col">年级</div>
              <div class="class-col">班级</div>
              <div class="score-col">正确率</div>
              <div class="questions-col">答题数</div>
            </div>
            <div v-for="(item, index) in leaderboardData" :key="item.user_id" class="leaderboard-row" :class="{ 'current-user': item.student_id === currentStudentId }">
              <div class="rank-col">
                <span class="rank-number">{{ index + 1 }}</span>
              </div>
              <div class="student-col">{{ item.student_id }}</div>
              <div class="name-col">{{ item.name || '未知' }}</div>
              <div class="grade-col">{{ item.grade || '-' }}年级</div>
              <div class="class-col">{{ item.class || '-' }}班</div>
              <div class="score-col">{{ Math.round(item.avg_accuracy) }}%</div>
              <div class="questions-col">{{ item.total_questions }}</div>
            </div>
          </div>
          <div v-else class="leaderboard-empty">
            <p>暂无排行数据</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 子分类选择 -->
    <div v-else-if="!selectedSubcategoryId" class="subcategory-selection">
      <h2 class="section-title">🎯 请选择子分类</h2>
      <div class="subcategory-list">
        <div 
          v-for="subcategory in currentSubject.subcategories" 
          :key="subcategory.id"
          class="subcategory-card"
          @click="selectSubcategory(subcategory.id)"
        >
          <div class="subcategory-icon">📚</div>
          <div class="subcategory-name">{{ subcategory.name }}</div>
        </div>
      </div>
      <div class="action-buttons">
        <el-button type="primary" @click="backToSubjects" class="back-btn">🔙 返回学科选择</el-button>
      </div>
    </div>
    
    <!-- 结果展示 -->
    <div v-else-if="score !== null" class="result-container">
      <div class="result-header">
        <h2 class="section-title">🎉 答题结果</h2>
        <div class="result-icon">{{ resultIcon }}</div>
      </div>
      <div class="score-card">
        <div class="score-circle">
          <div class="score-number">{{ score }}</div>
          <div class="score-total">/{{ totalQuestions }}</div>
        </div>
        <div class="encouragement">{{ getEncouragement() }}</div>
      </div>
      
      <div v-if="wrongQuestions.length > 0" class="wrong-questions">
        <h3 class="section-title">📝 错题回顾</h3>
        <div v-for="question in wrongQuestions" :key="question.id" class="wrong-item">
          <div class="question-header-row">
            <div class="question-meta">
              <div class="question-type-tag">{{ getQuestionTypeName(question.type) }}</div>
            </div>
            <div class="question-content-main">
              <div v-html="question.content"></div>
              <!-- 音频播放器 -->
              <div v-if="question.audio" class="question-audio">
                <audio controls :src="`/audio/${question.audio}`">
                  您的浏览器不支持音频播放。
                </audio>
              </div>
              <!-- 看图题图片 -->
              <div v-if="question.type === 'image' && question.image" class="question-image">
                <img :src="question.image" alt="题目图片" style="max-width: 100%; max-height: 300px; margin-top: 10px;">
              </div>
            </div>
          </div>
          <div class="options">
            <div 
              v-for="(option, index) in question.shuffledOptions || question.options" 
              :key="index"
              class="option-item"
              :class="{
                'correct': option.charAt(0) === question.answer,
                'wrong': userAnswers[question.id] === option.charAt(0) && option.charAt(0) !== question.answer
              }"
            >
              <span v-html="option"></span>
            </div>
          </div>
          <div class="explanation">{{ question.explanation }}</div>
        </div>
      </div>
      
      <div class="action-buttons">
        <el-button type="primary" @click="generateNewQuestions" class="action-btn">🔄 重新闯关</el-button>
        <el-button type="primary" @click="backToSubjects" class="action-btn">🏠 返回首页</el-button>
      </div>
    </div>
    
    <!-- 题目展示 -->
    <div v-else-if="selectedSubcategoryId && currentQuestions.length > 0" class="question-container">
      <div class="question-header">
        <h2 class="section-title">{{ getSubjectName(selectedSubjectId) }} - {{ getSubcategoryName(selectedSubjectId, selectedSubcategoryId) }}</h2>
        <div class="question-count">📋 共 {{ totalQuestions }} 题</div>
      </div>
      
      <div v-for="(question, index) in currentQuestions" :key="question.id" class="question-item">
        <div class="question-header-row">
          <div class="question-meta">
            <div class="question-number">
              <span class="number-circle">{{ index + 1 }}</span>
            </div>
            <div class="question-type-tag">{{ getQuestionTypeName(question.type) }}</div>
          </div>
          <div class="question-content-main">
            <div v-html="question.content"></div>
            <!-- 音频播放器 -->
            <div v-if="question.audio" class="question-audio">
              <audio controls :src="`/audio/${question.audio}`">
                您的浏览器不支持音频播放。
              </audio>
            </div>
            <!-- 看图题图片 -->
            <div v-if="question.type === 'image' && question.image" class="question-image">
              <img :src="question.image" alt="题目图片" style="max-width: 100%; max-height: 300px; margin-top: 10px;">
            </div>
          </div>
        </div>
        
        <div class="options">
          <div 
            v-for="(option, index) in question.shuffledOptions" 
            :key="index"
            class="option-item"
            :class="{ 'selected': userAnswers[question.id] === option.charAt(0) }"
            @click="selectOption(question.id, option.charAt(0))"
          >
            <span class="option-letter">{{ option.charAt(0) }}</span>
            <span class="option-text" v-html="option.substring(2)"></span>
          </div>
        </div>
      </div>
      
      <div class="action-buttons">
        <el-button type="primary" @click="submitAnswers" class="submit-btn">🚩 提交答案</el-button>
      </div>
    </div>
  
    <!-- 页面底部 -->
    <div class="footer">
      <div class="footer-content">
        <div class="footer-info">
          <p>© 2026 小学刷题闯关系统</p>
          <p>让学习更有趣，让进步更明显</p>
        </div>
        <div class="footer-links">
          <router-link to="/admin" class="admin-link">🔐 后台管理</router-link>
        </div>
      </div>
    </div>
    

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuestionStore } from '../stores/questionStore'
import { ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElMessage, ElSelect, ElOption } from 'element-plus'
import 'element-plus/dist/index.css'
import { getApiBaseUrl } from '../utils/database'

const store = useQuestionStore()

// 界面名称
const interfaceName = ref(localStorage.getItem('interfaceName') || '小学刷题闯关')

const selectedSubjectId = ref(null)
const selectedSubcategoryId = ref(null)
const subjects = computed(() => store.subjects)
const currentSubject = computed(() => {
  return subjects.value.find(s => s.id === selectedSubjectId.value) || {}
})
const currentQuestions = computed(() => store.currentQuestions)
const userAnswers = computed(() => store.userAnswers)
const score = computed(() => store.score)

// 学号输入相关
const inputStudentId = ref('')
const inputName = ref('')
const inputGrade = ref(null)
const inputClass = ref(null)
const currentUserId = ref(localStorage.getItem('userId'))
const currentStudentId = ref(localStorage.getItem('studentId'))
const currentUserName = ref(localStorage.getItem('userName'))
const currentUserGrade = ref(localStorage.getItem('userGrade'))
const currentUserClass = ref(localStorage.getItem('userClass'))
const startTime = ref(null)

// 年级和班级数据
const grades = ref([])
const classes = ref([])

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

// 排行榜数据
const leaderboardData = ref([])

const getSubjectName = (subjectId) => {
  const subject = subjects.value.find(s => s.id === subjectId)
  return subject ? subject.name : ''
}

// 获取子分类名称
const getSubcategoryName = (subjectId, subcategoryId) => {
  const subject = subjects.value.find(s => s.id === subjectId)
  if (subject && subject.subcategories) {
    const subcategory = subject.subcategories.find(sc => sc.id === subcategoryId)
    return subcategory ? subcategory.name : ''
  }
  return ''
}

const totalQuestions = computed(() => currentQuestions.value.length)
const wrongQuestions = ref([])

// 学科图标
const subjectIcons = ['📚', '🔢', '🌍', '🔬', '🎨', '🎵', '⚽', '⚖️']
// 学科图标对应的学科名称
const subjectIconNames = ['语文', '数学', '英语', '科学', '美术', '音乐', '体育', '道德与法治']

// 结果图标
const resultIcon = computed(() => {
  if (!score.value) return '😞'
  const rate = score.value / totalQuestions.value
  if (rate === 1) return '🎉'
  if (rate >= 0.7) return '😊'
  if (rate >= 0.5) return '🙂'
  return '😐'
})

const selectSubject = (subjectId) => {
  // 检查是否已登录
  if (!currentUserId.value) {
    // 提示用户在首页的登录表单中登录
    ElMessage.warning('请先在首页的登录表单中登录')
    return
  }
  
  selectedSubjectId.value = subjectId
  selectedSubcategoryId.value = null
}

const selectSubcategory = async (subcategoryId) => {
  // 检查是否已有学号
  if (!currentUserId.value) {
    // 提示用户在首页的登录表单中登录
    ElMessage.warning('请先在首页的登录表单中登录')
    return
  }
  
  // 读取设置
  let randomizeAnswers = true
  let fixedQuestionCount = false
  let minCount = 3
  let maxCount = 5
  let fixedCount = 3
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/settings`)
    if (response.ok) {
      const settings = await response.json()
      randomizeAnswers = settings.randomizeAnswers !== 'false'
      fixedQuestionCount = settings.fixedQuestionCount === 'true'
      // 处理带引号的字符串格式
      minCount = parseInt(settings.minQuestionCount?.replace(/'/g, '')) || 3
      maxCount = parseInt(settings.maxQuestionCount?.replace(/'/g, '')) || 5
      fixedCount = parseInt(settings.fixedQuestionCountValue?.replace(/'/g, '')) || 3
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
  
  console.log('答案随机排序设置:', randomizeAnswers)
  
  // 确定题目数量
  let questionCount
  if (fixedQuestionCount) {
    questionCount = fixedCount
  } else {
    questionCount = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount
  }
  // 生成题目，传递随机排序设置
  store.generateQuestionsBySubcategory(selectedSubjectId.value, subcategoryId, questionCount, randomizeAnswers)
  selectedSubcategoryId.value = subcategoryId
  // 记录开始时间
  startTime.value = Date.now()
  // 检查生成的题目
  setTimeout(() => {
    console.log('Generated questions:', store.currentQuestions)
  }, 100)
}



const selectOption = (questionId, option) => {
  store.submitAnswer(questionId, option)
}

const submitAnswers = async () => {
  // 验证是否所有题目都已作答
  const allAnswered = currentQuestions.value.every(question => userAnswers.value[question.id] !== undefined)
  if (!allAnswered) {
    alert('请回答所有题目后再提交！')
    return
  }
  
  store.calculateScore()
  wrongQuestions.value = currentQuestions.value.filter(q => userAnswers.value[q.id] !== q.answer)
  
  // 保存答题记录
  console.log('开始保存答题记录，currentUserId:', currentUserId.value, 'startTime:', startTime.value)
  console.log('selectedSubjectId:', selectedSubjectId.value, 'selectedSubcategoryId:', selectedSubcategoryId.value)
  console.log('totalQuestions:', totalQuestions.value, 'score:', score.value)
  
  if (currentUserId.value && startTime.value) {
    const timeSpent = Math.round((Date.now() - startTime.value) / 1000) // 秒
    console.log('开始保存整体答题记录，timeSpent:', timeSpent)
    try {
      // 保存整体答题记录
      const apiUrl = `${getApiBaseUrl()}/answer-records`
      console.log('保存答题记录API URL:', apiUrl)
      const answerRecordResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUserId.value,
          subjectId: selectedSubjectId.value,
          subcategoryId: selectedSubcategoryId.value,
          totalQuestions: totalQuestions.value,
          correctCount: score.value,
          timeSpent: timeSpent
        })
      })
      console.log('整体答题记录保存响应:', answerRecordResponse.status)
      
      // 检查响应状态
      if (!answerRecordResponse.ok) {
        const errorData = await answerRecordResponse.json()
        console.error('保存答题记录失败:', errorData)
      } else {
        const successData = await answerRecordResponse.json()
        console.log('保存答题记录成功:', successData)
        
        // 保存每道题的答题记录
        console.log('开始保存每道题的答题记录，题目数量:', currentQuestions.value.length)
        for (const question of currentQuestions.value) {
          const userAnswer = userAnswers.value[question.id]
          const isCorrect = userAnswer === question.answer
          console.log('保存题目:', question.id, '答案:', userAnswer, '是否正确:', isCorrect)
          
          // 保存用户选择的选项内容，而不是标签
          let selectedOptionContent = ''
          if (question.shuffledOptions) {
            for (const option of question.shuffledOptions) {
              if (option.charAt(0) === userAnswer) {
                selectedOptionContent = option.substring(2).trim()
                break
              }
            }
          }
          
          // 保存正确答案的选项内容
          let correctOptionContent = ''
          if (question.shuffledOptions) {
            for (const option of question.shuffledOptions) {
              if (option.charAt(0) === question.answer) {
                correctOptionContent = option.substring(2).trim()
                break
              }
            }
          }
          
          const questionAttemptResponse = await fetch(`${getApiBaseUrl()}/question-attempts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userId: currentUserId.value,
              questionId: question.id,
              subjectId: selectedSubjectId.value,
              subcategoryId: selectedSubcategoryId.value,
              userAnswer: userAnswer,
              userAnswerContent: selectedOptionContent,
              correctAnswer: question.answer,
              correctAnswerContent: correctOptionContent,
              isCorrect: userAnswer === question.answer,
              answerRecordId: successData.recordId // 传递答题记录ID
            })
          })
          console.log('题目答题记录保存响应:', questionAttemptResponse.status)
        }
      }
      
      console.log('答题记录已保存')
      // 重新获取排行榜数据
      await fetchLeaderboardData()
    } catch (error) {
      console.error('保存答题记录失败:', error)
      ElMessage.error('保存答题记录失败，请检查网络连接')
    }
  } else {
    // 如果没有用户ID，提示用户输入学号
    console.log('没有用户ID或startTime，无法保存答题记录')
    ElMessage.warning('请先输入学号以保存答题记录')
    showStudentIdDialog.value = true
  }
}

const getEncouragement = () => {
  const rate = score.value / totalQuestions.value
  if (rate === 1) {
    return '太棒了！你全部答对了，继续保持！'
  } else if (rate >= 0.7) {
    return '做得很好！继续努力！'
  } else if (rate >= 0.5) {
    return '不错，再接再厉！'
  } else {
    return '加油，你可以做得更好！'
  }
}

// 获取题目类型名称
const getQuestionTypeName = (type) => {
  const typeMap = {
    'single': '单选题',
    'multiple': '多选题',
    'judgment': '判断题',
    'listening': '听力题',
    'reading': '阅读题',
    'image': '看图题'
  }
  return typeMap[type] || '未知类型'
}

const backToSubjects = () => {
  selectedSubjectId.value = null
  selectedSubcategoryId.value = null
  store.currentQuestions = []
  store.userAnswers = {}
  store.score = null
  wrongQuestions.value = []
}

const generateNewQuestions = async () => {
  // 读取设置
  let randomizeAnswers = true
  let fixedQuestionCount = false
  let minCount = 3
  let maxCount = 5
  let fixedCount = 3
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/settings`)
    if (response.ok) {
      const settings = await response.json()
      randomizeAnswers = settings.randomizeAnswers !== 'false'
      fixedQuestionCount = settings.fixedQuestionCount === 'true'
      // 处理带引号的字符串格式
      minCount = parseInt(settings.minQuestionCount?.replace(/'/g, '')) || 3
      maxCount = parseInt(settings.maxQuestionCount?.replace(/'/g, '')) || 5
      fixedCount = parseInt(settings.fixedQuestionCountValue?.replace(/'/g, '')) || 3
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
  
  console.log('答案随机排序设置:', randomizeAnswers)
  
  // 确定题目数量
  let questionCount
  if (fixedQuestionCount) {
    questionCount = fixedCount
  } else {
    questionCount = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount
  }
  // 生成新的题目，传递随机排序设置
  store.generateQuestionsBySubcategory(selectedSubjectId.value, selectedSubcategoryId.value, questionCount, randomizeAnswers)
  // 重置答题状态
  store.userAnswers = {}
  store.score = null
  wrongQuestions.value = []
  // 记录开始时间
  startTime.value = Date.now()
}

const saveStudentId = async () => {
  if (!inputStudentId.value.trim()) {
    ElMessage.error('请输入学号')
    return
  }
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/users/login`, {
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
    
    if (response.ok) {
        const data = await response.json()
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
        ElMessage.success('登录成功')
        
        // 重新获取排行榜数据
        await fetchLeaderboardData()
        
        // 检查是否有临时保存的学科ID
        const tempSubjectId = localStorage.getItem('tempSubjectId')
        if (tempSubjectId) {
          // 选择学科
          selectedSubjectId.value = parseInt(tempSubjectId)
          selectedSubcategoryId.value = null
          // 清除临时保存的学科ID
          localStorage.removeItem('tempSubjectId')
        } else {
          // 检查是否有临时保存的子分类ID
          const tempSubcategoryId = localStorage.getItem('tempSubcategoryId')
          if (tempSubcategoryId && selectedSubjectId.value) {
            // 继续生成题目
            const randomCount = Math.floor(Math.random() * 3) + 3
            store.generateQuestionsBySubcategory(selectedSubjectId.value, parseInt(tempSubcategoryId), randomCount)
            selectedSubcategoryId.value = parseInt(tempSubcategoryId)
            startTime.value = Date.now()
            // 清除临时保存的子分类ID
            localStorage.removeItem('tempSubcategoryId')
          }
        }
      } else {
      ElMessage.error('登录失败')
    }
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error('登录失败')
  }
}



// 退出登录
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
  // 重置其他状态
  backToSubjects()
  ElMessage.success('已退出登录')
}

// 获取排行榜数据
const fetchLeaderboardData = async () => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/leaderboard/global?limit=10`)
    if (response.ok) {
      const data = await response.json()
      leaderboardData.value = data
    }
  } catch (error) {
    console.error('获取排行榜数据失败:', error)
  }
}

onMounted(async () => {
  // 初始化数据
  await store.initialize()
  console.log('Data loaded:', store.questions)
  
  // 加载年级和班级数据
  await loadGradesAndClasses()
  
  // 获取排行榜数据
  await fetchLeaderboardData()
  
  // 不再自动弹出登录框，改为在选择学科时检查
})
</script>

<style scoped>
/* 全局样式 */
.student-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Comic Sans MS', 'Arial', sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  border-radius: 20px;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.student-container::before {
  content: '';
  position: absolute;
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  background: rgba(106, 17, 203, 0.1);
  border-radius: 50%;
  z-index: 0;
}

.student-container::after {
  content: '';
  position: absolute;
  bottom: -50px;
  left: -50px;
  width: 150px;
  height: 150px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 50%;
  z-index: 0;
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

/* 用户信息和排行榜区域 */
.user-leaderboard-section {
  margin-top: 20px;
  margin-bottom: 20px;
  background: transparent;
  border-radius: 15px;
  padding: 0;
  box-shadow: none;
  backdrop-filter: none;
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
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 20px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  width: 100%;
  flex-wrap: wrap;
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
  padding: 30px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 20px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
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

.form-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
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

/* 确保样式能够正确应用到表单标签 */
.login-form .el-form-item .el-form-item__label {
  font-family: 'Comic Sans MS', 'Arial', sans-serif !important;
  font-weight: bold !important;
  color: #6a11cb !important;
  font-size: 18px !important;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2) !important;
  padding-right: 10px !important;
  margin-right: 5px !important;
  border-right: 2px solid rgba(106, 17, 203, 0.3) !important;
  transition: all 0.3s ease !important;
  width: auto !important;
  min-width: 60px !important;
  line-height: 40px !important;
  height: 40px !important;
}

.login-form .el-form-item .el-form-item__label:hover {
  color: #2575fc !important;
  text-shadow: 2px 2px 6px rgba(37, 117, 252, 0.4) !important;
  border-right-color: rgba(37, 117, 252, 0.5) !important;
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

.leaderboard-link-bottom {
  display: flex;
  align-items: center;
}

.leaderboard-link-full {
  display: inline-block;
  padding: 10px 20px;
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: white;
  text-decoration: none;
  border-radius: 25px;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.leaderboard-link-full:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(255, 152, 0, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-leaderboard-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .user-info-bottom {
    justify-content: center;
  }
  
  .leaderboard-link-bottom {
    justify-content: center;
  }
}

.game-logo {
  position: relative;
  font-size: 48px;
  animation: bounce 2s infinite;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
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

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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

/* 学科选择 */
.subject-selection {
  margin-top: 0;
  margin-bottom: 40px;
}

.subject-list {
  display: flex;
  justify-content: center;
  gap: 30px;
  flex-wrap: wrap;
}

.subject-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  min-width: 180px;
  border: 2px solid transparent;
}

.subject-card:hover {
  transform: translateY(-12px) scale(1.05);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
  border-color: #6a11cb;
}

.subject-icon {
  font-size: 64px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.subject-card:hover .subject-icon {
  transform: rotate(15deg) scale(1.1);
  filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.2));
}

.subject-1 {
  color: #ff6b6b;
}

.subject-2 {
  color: #4ecdc4;
}

.subject-3 {
  color: #45b7d1;
}

.subject-4 {
  color: #ff9800;
}

.subject-5 {
  color: #9c27b0;
}

.subject-6 {
  color: #4caf50;
}

.subject-7 {
  color: #2196f3;
}

.subject-8 {
  color: #f44336;
}

.subject-name {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin: 0;
  padding: 12px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

/* 排行榜样式 */
.leaderboard-section {
  margin-top: 60px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
}

.leaderboard-header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.leaderboard-header-container .section-title {
  margin-bottom: 0;
}

.leaderboard-link-full-container {
  display: flex;
  align-items: center;
}

.leaderboard-table {
  background-color: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.leaderboard-header {
  display: grid;
  grid-template-columns: 80px 1fr 100px 80px 80px 120px 100px;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
  font-weight: bold;
  padding: 15px;
  text-align: center;
}

.leaderboard-row {
  display: grid;
  grid-template-columns: 80px 1fr 100px 80px 80px 120px 100px;
  padding: 15px;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.leaderboard-row:hover {
  background-color: #f8f5ff;
}

.leaderboard-row.current-user {
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
}

.rank-number {
  display: inline-block;
  width: 30px;
  height: 30px;
  line-height: 30px;
  border-radius: 50%;
  background-color: #6a11cb;
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.leaderboard-row:nth-child(2) .rank-number {
  background-color: #ffd700;
}

.leaderboard-row:nth-child(3) .rank-number {
  background-color: #c0c0c0;
}

.leaderboard-row:nth-child(4) .rank-number {
  background-color: #cd7f32;
}

.leaderboard-empty {
  text-align: center;
  padding: 40px;
  color: #999;
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .leaderboard-header,
  .leaderboard-row {
    grid-template-columns: 60px 1fr 80px 60px 60px 100px 80px;
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
  .leaderboard-header,
  .leaderboard-row {
    grid-template-columns: 50px 1fr 70px 50px 50px 80px 70px;
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
}

/* 子分类选择 */
.subcategory-selection {
  margin-bottom: 40px;
}

.subcategory-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.subcategory-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 20px;
  padding: 30px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
}

.subcategory-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%);
  border-color: #6a11cb;
}

.subcategory-icon {
  font-size: 48px;
  margin-bottom: 15px;
  color: #6a11cb;
  transition: all 0.3s ease;
}

.subcategory-card:hover .subcategory-icon {
  transform: rotate(15deg) scale(1.1);
}

.subcategory-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

/* 题目容器 */
.question-container {
  margin-bottom: 40px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px 25px;
  background: linear-gradient(135deg, #f0e6ff 0%, #e1bee7 100%);
  border-radius: 15px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  border: 2px solid #e1bee7;
  transition: all 0.3s ease;
}

.question-header:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.question-count {
  font-size: 16px;
  color: #6a11cb;
  font-weight: bold;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 5px;
}

.question-item {
  background-color: #fff;
  padding: 25px;
  border-radius: 15px;
  margin-bottom: 25px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  border: 2px solid #f0e6ff;
}

.question-item:hover {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transform: translateY(-3px);
  border-color: #e1bee7;
}

.question-number {
  display: inline-block;
  margin-bottom: 15px;
}

.number-circle {
  display: inline-block;
  width: 30px;
  height: 30px;
  background-color: #6a11cb;
  color: #fff;
  border-radius: 50%;
  text-align: center;
  line-height: 30px;
  font-weight: bold;
  margin-right: 10px;
}

.question-header-row {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f5ff;
  border-radius: 10px;
}

.question-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.question-number {
  display: flex;
  align-items: center;
  justify-content: center;
}

.number-circle {
  width: 28px;
  height: 28px;
  background-color: #6a11cb;
  color: #fff;
  border-radius: 50%;
  font-weight: bold;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.question-type-tag {
  background-color: #6a11cb;
  color: white;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  box-shadow: 0 2px 5px rgba(106, 17, 203, 0.3);
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  box-sizing: border-box;
}

.question-content-main {
  flex: 1;
  font-size: 18px;
  line-height: 1.6;
  color: #333;
  padding-left: 10px;
  border-left: 2px solid #e1bee7;
}

/* 选项 */
.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 25px;
  z-index: 1;
  position: relative;
}

.wrong-item .options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.option-item {
  padding: 18px 24px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 3px solid #e9ecef;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 160px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.option-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s ease;
}

.option-item:hover::before {
  left: 100%;
}

.option-item:hover {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-color: #90caf9;
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 25px rgba(144, 202, 249, 0.4);
}

.option-item.selected {
  background: linear-gradient(135deg, #e1bee7 0%, #ce93d8 100%);
  border-color: #6a11cb;
  box-shadow: 0 8px 25px rgba(106, 17, 203, 0.4);
  transform: translateY(-2px);
}

.option-item.correct {
  background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
  border-color: #4caf50;
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.4);
}

.option-item.wrong {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  border-color: #f44336;
  box-shadow: 0 8px 25px rgba(244, 67, 54, 0.4);
}

.option-letter {
  font-weight: bold;
  margin-right: 12px;
  font-size: 20px;
  min-width: 25px;
  color: #6a11cb;
  font-family: 'Arial', sans-serif;
}

.option-item.selected .option-letter {
  color: white;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
}

.option-item.correct .option-letter {
  color: #4caf50;
}

.option-item.wrong .option-letter {
  color: #f44336;
}

.option-text {
  flex: 1;
  font-size: 16px;
  line-height: 1.4;
}

.debug-info {
  margin-top: 10px;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
  font-size: 12px;
  color: #666;
  border-left: 3px solid #409eff;
}

/* 结果容器 */
.result-container {
  margin-bottom: 40px;
  z-index: 1;
  position: relative;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #f0e6ff 0%, #e1bee7 100%);
  border-radius: 15px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.result-icon {
  font-size: 48px;
  animation: pulse 2s infinite;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.score-card {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  border-radius: 25px;
  padding: 50px;
  text-align: center;
  margin-bottom: 40px;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.8s ease;
  position: relative;
  overflow: hidden;
}

.score-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: rotate 20s linear infinite;
}

@keyframes slideIn {
  from {
    transform: translateY(-30px) scale(0.8);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.score-circle {
  display: inline-flex;
  align-items: baseline;
  margin-bottom: 25px;
  position: relative;
  z-index: 1;
}

.score-number {
  font-size: 72px;
  font-weight: bold;
  color: white;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3);
  animation: bounce 1s ease-in-out;
}

.score-total {
  font-size: 36px;
  color: rgba(255, 255, 255, 0.8);
  margin-left: 15px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.encouragement {
  font-size: 28px;
  font-weight: bold;
  color: white;
  margin-top: 25px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
  animation: fadeIn 1.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 错题回顾 */
.wrong-questions {
  margin-top: 50px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  z-index: 1;
  position: relative;
}

.wrong-item {
  background: linear-gradient(135deg, #fff3f3 0%, #ffebee 100%);
  padding: 30px;
  border-radius: 15px;
  margin-bottom: 25px;
  border-left: 8px solid #f44336;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.wrong-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(244, 67, 54, 0.2);
}

.wrong-item::before {
  content: '❌';
  position: absolute;
  top: 15px;
  right: 15px;
  font-size: 24px;
  opacity: 0.3;
}

.explanation {
  margin-top: 25px;
  font-size: 16px;
  color: #666;
  padding: 20px;
  background: linear-gradient(135deg, #fff9c4 0%, #fff3e0 100%);
  border-radius: 12px;
  border-left: 6px solid #ff9800;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
}

.explanation::before {
  content: '💡 解析';
  position: absolute;
  top: -12px;
  left: 20px;
  background-color: #ff9800;
  color: white;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: center;
  margin-top: 50px;
  gap: 20px;
  z-index: 1;
  position: relative;
}

.submit-btn,
.back-btn,
.action-btn {
  padding: 18px 36px;
  font-size: 20px;
  font-weight: bold;
  border-radius: 50px;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
  border: none;
  cursor: pointer;
  font-family: 'Comic Sans MS', 'Arial', sans-serif;
}

.submit-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
}

.back-btn {
  background: linear-gradient(135deg, #4ecdc4 0%, #45b7d1 100%);
  color: white;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
}

.action-btn {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
}

.submit-btn::before,
.back-btn::before,
.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s ease;
}

.submit-btn:hover::before,
.back-btn:hover::before,
.action-btn:hover::before {
  left: 100%;
}

.submit-btn:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 12px 35px rgba(255, 107, 107, 0.4);
  animation: pulse 1s infinite;
}

.back-btn:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 12px 35px rgba(78, 205, 196, 0.4);
  animation: pulse 1s infinite;
}

.action-btn:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 12px 35px rgba(106, 17, 203, 0.4);
  animation: pulse 1s infinite;
}

/* 页面底部 */
.footer {
  margin-top: 60px;
  padding: 30px 0;
  background-color: #fff;
  border-radius: 15px;
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.1);
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.footer-info {
  text-align: left;
  color: #666;
  font-size: 14px;
}

.footer-info p {
  margin: 5px 0;
}

.footer-links {
  text-align: right;
}

.admin-link {
  display: inline-block;
  padding: 10px 20px;
  background-color: #6a11cb;
  color: white;
  text-decoration: none;
  border-radius: 25px;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(106, 17, 203, 0.3);
}

.admin-link:hover {
  background-color: #7c27ce;
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(106, 17, 203, 0.4);
}

.leaderboard-link {
  display: inline-block;
  padding: 10px 20px;
  background-color: #ff9800;
  color: white;
  text-decoration: none;
  border-radius: 25px;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);
  margin-right: 10px;
}

.leaderboard-link:hover {
  background-color: #ffad33;
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(255, 152, 0, 0.4);
}

/* 响应式设计 */
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
  
  .subject-card {
    padding: 20px;
    min-width: 120px;
  }
  
  .subject-icon {
    font-size: 40px;
  }
  
  .options {
    flex-direction: column;
  }
  
  .option-item {
    min-width: 100%;
  }
  
  .score-number {
    font-size: 40px;
  }
  
  .score-total {
    font-size: 20px;
  }
  
  .encouragement {
    font-size: 20px;
  }
  
  .footer-content {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .footer-info {
    text-align: center;
  }
  
  .footer-links {
    text-align: center;
  }
}
</style>