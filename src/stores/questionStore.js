import { defineStore } from 'pinia'
import { 
  initDatabase, 
  getSubjects, 
  getQuestions, 
  addSubject, 
  deleteSubject, 
  addSubcategory, 
  deleteSubcategory, 
  addQuestion, 
  updateQuestion, 
  deleteQuestion,
  importLocalData,
  updateSubject as updateSubjectApi,
  updateSubcategory as updateSubcategoryApi,
  getGrades,
  getClasses,
  addGrade,
  updateGrade,
  deleteGrade,
  addClass,
  updateClass,
  deleteClass
} from '../utils/database'
import { getApiBaseUrl } from '../utils/database'
import { apiCache } from '../utils/apiCache'

// 主题和题目数据 store
export const useQuestionStore = defineStore('question', {
  state: () => ({
    subjects: [],
    questions: [],
    grades: [],
    classes: [],
    userStats: [],
    recentRecords: [],
    errorCollections: {}, // 错题巩固题库，格式: { subjectId: [questions] }
    errorCollectionStats: {}, // 错题巩固统计，格式: { questionId: { correctCount: number } }
    isLoading: false,
    error: null
  }),
  getters: {
    getQuestionsBySubject: (state) => (subjectId) => {
      return state.questions.filter(q => {
        const qSubjectId = q.subjectId || q.subject_id
        return qSubjectId === subjectId
      })
    },
    getSubjectName: (state) => (subjectId) => {
      const subject = state.subjects.find(s => s.id === subjectId)
      return subject ? subject.name : ''
    },
    getSubjectById: (state) => (subjectId) => {
      return state.subjects.find(s => s.id === subjectId) || null
    },
    // 获取错题巩固题库
    getErrorCollection: (state) => (subjectId) => {
      return state.errorCollections[subjectId] || []
    },
    // 获取错题的正确次数
    getErrorQuestionCorrectCount: (state) => (questionId) => {
      return state.errorCollectionStats[questionId]?.correctCount || 0
    }
  },
  actions: {
    // 初始化数据
    async initialize() {
      try {
        this.isLoading = true
        this.error = null
        await initDatabase()
        await this.loadCoreData()
      } catch (error) {
        this.error = error.message

      } finally {
        this.isLoading = false
      }
    },
    
    // 加载核心数据（学科、年级、班级、题目数量统计）
    async loadCoreData() {
      try {
        this.isLoading = true
        this.error = null
        
        // 检查缓存
        const cachedData = localStorage.getItem('coreData')
        const cacheExpiry = localStorage.getItem('coreDataExpiry')
        
        if (cachedData && cacheExpiry && Date.now() < parseInt(cacheExpiry)) {
          const data = JSON.parse(cachedData)
          this.subjects = data.subjects
          this.grades = data.grades
          this.classes = data.classes
          return
        }
        
        // 并行请求核心数据
        const [subjectsData, gradesData, classesData, subjectStatsData] = await Promise.all([
          fetch(`${getApiBaseUrl()}/subjects`)
            .then(res => res.json())
            .catch(error => {
              console.error('获取学科数据失败:', error);
              return [];
            }),
          fetch(`${getApiBaseUrl()}/grades`)
            .then(res => res.json())
            .catch(error => {
              console.error('获取年级数据失败:', error);
              return [];
            }),
          fetch(`${getApiBaseUrl()}/classes`)
            .then(res => res.json())
            .catch(error => {
              console.error('获取班级数据失败:', error);
              return [];
            }),
          fetch(`${getApiBaseUrl()}/subjects/stats`)
            .then(res => res.json())
            .catch(error => {
              console.error('获取学科统计数据失败:', error);
              return [];
            })
        ])
        
        // 合并题目数量统计
        this.subjects = subjectsData.map(subject => {
          const stat = subjectStatsData.find(s => s.id === subject.id)
          return {
            ...subject,
            questionCount: stat ? stat.questionCount : 0
          }
        })
        this.grades = gradesData
        this.classes = classesData
        
        // 缓存数据
        const coreData = {
          subjects: this.subjects,
          grades: this.grades,
          classes: this.classes
        }
        localStorage.setItem('coreData', JSON.stringify(coreData))
        localStorage.setItem('coreDataExpiry', Date.now() + 24 * 60 * 60 * 1000) // 24小时过期
        
      } catch (error) {
        this.error = error.message
        console.error('加载核心数据失败:', error)

      } finally {
        this.isLoading = false
      }
    },
    
    // 加载题目数据（按需加载）
    async loadQuestions(subjectId = null, subcategoryId = null) {
      try {
        this.isLoading = true
        this.error = null
        
        let url = `${getApiBaseUrl()}/questions`
        const params = []
        
        if (subjectId) {
          params.push(`subjectId=${subjectId}`)
        }
        if (subcategoryId) {
          params.push(`subcategoryId=${subcategoryId}`)
        }
        // 添加较大的limit参数，确保获取所有题目
        params.push('limit=1000')
        
        if (params.length > 0) {
          url += `?${params.join('&')}`
        }
        
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          this.questions = data.questions || data // 兼容旧API
        }
      } catch (error) {
        this.error = error.message
        console.error('加载题目数据失败:', error)

      } finally {
        this.isLoading = false
      }
    },
    
    // 加载数据（保留旧方法）
    async loadData() {
      try {
        this.isLoading = true
        this.error = null
        
        // 并行加载所有数据，提高性能，但每个请求独立处理，一个失败不影响其他
        const subjectsPromise = fetch(`${getApiBaseUrl()}/subjects`).then(res => res.json()).catch(error => {
          console.error('获取学科数据失败:', error);
          return [];
        });
        const questionsPromise = fetch(`${getApiBaseUrl()}/questions?limit=10000`).then(res => res.json()).catch(error => {
          console.error('获取题目数据失败:', error);
          return [];
        });
        const gradesPromise = fetch(`${getApiBaseUrl()}/grades`).then(res => res.json()).catch(error => {
          console.error('获取年级数据失败:', error);
          return [];
        });
        const classesPromise = fetch(`${getApiBaseUrl()}/classes`).then(res => res.json()).catch(error => {
          console.error('获取班级数据失败:', error);
          return [];
        });
        const userStatsPromise = fetch(`${getApiBaseUrl()}/leaderboard/global?limit=0`).then(res => res.json()).catch(error => {
          console.error('获取用户统计数据失败:', error);
          return [];
        });
        const recentRecordsPromise = fetch(`${getApiBaseUrl()}/answer-records/all?limit=0`).then(res => res.json()).catch(error => {
          console.error('获取最近答题记录失败:', error);
          return [];
        });
        
        const [subjectsData, questionsData, gradesData, classesData, userStatsData, recentRecordsData] = await Promise.all([
          subjectsPromise,
          questionsPromise,
          gradesPromise,
          classesPromise,
          userStatsPromise,
          recentRecordsPromise
        ]);
        
        this.subjects = subjectsData
        this.questions = questionsData
        this.grades = gradesData
        this.classes = classesData
        this.userStats = userStatsData
        this.recentRecords = recentRecordsData
      } catch (error) {
        this.error = error.message
        console.error('加载数据失败:', error)

      } finally {
        this.isLoading = false
      }
    },
    
    // 加载用户统计数据
    async loadUserStats() {
      try {
        this.isLoading = true
        this.error = null
        const userStatsData = await fetch(`${getApiBaseUrl()}/leaderboard/global?limit=0`).then(res => res.json())
        this.userStats = userStatsData
      } catch (error) {
        this.error = error.message
        console.error('加载用户统计数据失败:', error)

      } finally {
        this.isLoading = false
      }
    },
    
    // 加载最近答题记录
    async loadRecentRecords() {
      try {
        this.isLoading = true
        this.error = null
        // 获取所有用户的最近答题记录
        const response = await fetch(`${getApiBaseUrl()}/answer-records/all?limit=0`)
        if (response.ok) {
          const recentRecordsData = await response.json()
          this.recentRecords = recentRecordsData
        } else {
          // 如果没有专门的all端点，尝试获取所有用户的记录
          // 这里可以根据实际情况调整
          this.recentRecords = []
        }
      } catch (error) {
        this.error = error.message
        this.recentRecords = []
        console.error('加载最近答题记录失败:', error)

      } finally {
        this.isLoading = false
      }
    },
    
    // 添加题目
    async addQuestion(questionData) {
      try {
        this.isLoading = true
        this.error = null
        const newQuestion = await addQuestion(questionData)
        if (newQuestion) {
          // 使用展开运算符创建新数组，确保响应式更新
          this.questions = [...this.questions, newQuestion]
          return newQuestion
        } else {
          throw new Error('添加题目失败')
        }
      } catch (error) {
        this.error = error.message

        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 更新题目
    async updateQuestion(questionData) {
      try {
        this.isLoading = true
        this.error = null
        const updatedQuestion = await updateQuestion(questionData)
        if (updatedQuestion) {
          // 使用展开运算符创建新数组，确保响应式更新
          this.questions = this.questions.map(q => 
            q.id === questionData.id ? updatedQuestion : q
          )
          return updatedQuestion
        } else {
          throw new Error('更新题目失败')
        }
      } catch (error) {
        this.error = error.message

        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 删除题目
    async deleteQuestion(id) {
      try {
        this.isLoading = true
        this.error = null
        const result = await deleteQuestion(id)
        if (result) {
          // 使用filter创建新数组，确保响应式更新
          this.questions = this.questions.filter(q => q.id !== id)
        }
      } catch (error) {
        this.error = error.message

      } finally {
        this.isLoading = false
      }
    },
    
    // 添加学科
    async addSubject(subjectName, iconIndex = 0) {
      try {
        this.isLoading = true
        this.error = null
        const newSubject = await addSubject(subjectName, iconIndex)
        if (!newSubject) {
          throw new Error('添加学科失败')
        }
        // 直接添加到本地状态，避免重新加载所有数据
        this.subjects.push(newSubject)
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 更新学科
    async updateSubject(subjectId, subjectName, iconIndex = 0) {
      try {
        this.isLoading = true
        this.error = null
        const result = await updateSubjectApi(subjectId, subjectName, iconIndex)
        if (!result) {
          throw new Error('更新学科失败')
        }
        // 直接更新本地状态，避免重新加载所有数据
        const index = this.subjects.findIndex(s => s.id === subjectId)
        if (index !== -1) {
          this.subjects[index] = { ...this.subjects[index], name: subjectName, iconIndex }
        }
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 删除学科
    async deleteSubject(id) {
      try {
        this.isLoading = true
        this.error = null
        
        // 先删除该学科下的所有题目
        const subjectQuestions = this.questions.filter(q => {
          const qSubjectId = q.subjectId || q.subject_id
          return qSubjectId === id
        })
        
        for (const question of subjectQuestions) {
          await this.deleteQuestion(question.id)
        }
        
        // 然后删除该学科下的所有题库（子分类）
        const subject = this.subjects.find(s => s.id === id)
        if (subject && subject.subcategories) {
          for (const subcategory of subject.subcategories) {
            await this.deleteSubcategory(id, subcategory.id)
          }
        }
        
        // 最后删除学科本身
        const result = await deleteSubject(id)
        if (!result) {
          throw new Error('删除学科失败')
        }
        // 直接从本地状态中删除，避免重新加载所有数据
        this.subjects = this.subjects.filter(s => s.id !== id)
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 添加子分类
    async addSubcategory(subjectId, name, iconIndex = 0, difficulty = 1) {
      try {
        this.isLoading = true
        this.error = null
        const newSubcategory = await addSubcategory(subjectId, name, iconIndex, difficulty)
        if (!newSubcategory) {
          throw new Error('添加子分类失败')
        }
        // 直接添加到本地状态，避免重新加载所有数据
        const subjectIndex = this.subjects.findIndex(s => s.id === subjectId)
        if (subjectIndex !== -1) {
          if (!this.subjects[subjectIndex].subcategories) {
            this.subjects[subjectIndex].subcategories = []
          }
          this.subjects[subjectIndex].subcategories.push(newSubcategory)
        }
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 更新子分类
    async updateSubcategory(subjectId, subcategoryId, name, iconIndex = 0, difficulty = 1) {
      try {
        this.isLoading = true
        this.error = null
        const result = await updateSubcategoryApi(subcategoryId, name, iconIndex, difficulty)
        if (!result) {
          throw new Error('更新子分类失败')
        }
        // 直接更新本地状态，避免重新加载所有数据
        const subjectIndex = this.subjects.findIndex(s => s.id === subjectId)
        if (subjectIndex !== -1 && this.subjects[subjectIndex].subcategories) {
          const subcategoryIndex = this.subjects[subjectIndex].subcategories.findIndex(sc => sc.id === subcategoryId)
          if (subcategoryIndex !== -1) {
            this.subjects[subjectIndex].subcategories[subcategoryIndex] = {
              ...this.subjects[subjectIndex].subcategories[subcategoryIndex],
              name,
              iconIndex,
              difficulty
            }
          }
        }
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 删除子分类
    async deleteSubcategory(subjectId, id) {
      try {
        this.isLoading = true
        this.error = null
        
        // 先删除该子分类下的所有题目
        const subcategoryQuestions = this.questions.filter(q => {
          const qSubcategoryId = q.subcategoryId || q.subcategory_id
          return qSubcategoryId === id
        })
        
        for (const question of subcategoryQuestions) {
          await this.deleteQuestion(question.id)
        }
        
        // 然后删除子分类本身
        const result = await deleteSubcategory(id)
        if (!result) {
          throw new Error('删除子分类失败')
        }
        // 直接从本地状态中删除，避免重新加载所有数据
        const subjectIndex = this.subjects.findIndex(s => s.id === subjectId)
        if (subjectIndex !== -1 && this.subjects[subjectIndex].subcategories) {
          this.subjects[subjectIndex].subcategories = this.subjects[subjectIndex].subcategories.filter(sc => sc.id !== id)
        }
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 更新学科列表
    async updateSubjects(updatedSubjects) {
      try {
        this.isLoading = true
        this.error = null
        // 重新加载数据，确保与服务器保持一致
        await this.loadData()
      } catch (error) {
        this.error = error.message

      } finally {
        this.isLoading = false
      }
    },
    
    // 导入本地数据到SQL数据库
    async importLocalData() {
      try {
        this.isLoading = true
        this.error = null
        const result = await importLocalData()
        if (result.success) {
          // 重新加载数据
          await this.loadData()
        }
        return result
      } catch (error) {
        this.error = error.message

        return { success: false, error: error.message }
      } finally {
        this.isLoading = false
      }
    },
    
    // 添加年级
    async addGrade(gradeName) {
      try {
        this.isLoading = true
        this.error = null
        const newGrade = await addGrade(gradeName)
        if (newGrade) {
          // 直接添加到本地状态，避免重新加载所有数据
          this.grades.push(newGrade)
        }
      } catch (error) {
        this.error = error.message

      } finally {
        this.isLoading = false
      }
    },
    
    // 更新年级
    async updateGrade(gradeId, gradeName) {
      try {
        this.isLoading = true
        this.error = null
        const result = await updateGrade(gradeId, gradeName)
        if (result) {
          // 直接更新本地状态，避免重新加载所有数据
          const index = this.grades.findIndex(g => g.id === gradeId)
          if (index !== -1) {
            this.grades[index] = { ...this.grades[index], name: gradeName }
          }
        }
      } catch (error) {
        this.error = error.message

      } finally {
        this.isLoading = false
      }
    },
    
    // 删除年级
    async deleteGrade(gradeId) {
      try {
        this.isLoading = true
        this.error = null
        const result = await deleteGrade(gradeId)
        if (result) {
          // 直接从本地状态中删除，避免重新加载所有数据
          this.grades = this.grades.filter(g => g.id !== gradeId)
        }
      } catch (error) {
        this.error = error.message

      } finally {
        this.isLoading = false
      }
    },
    
    // 添加班级
    async addClass(className) {
      try {
        this.isLoading = true
        this.error = null
        const newClass = await addClass(className)
        if (newClass) {
          // 直接添加到本地状态，避免重新加载所有数据
          this.classes.push(newClass)
        }
      } catch (error) {
        this.error = error.message

      } finally {
        this.isLoading = false
      }
    },
    
    // 更新班级
    async updateClass(classId, className) {
      try {
        this.isLoading = true
        this.error = null
        const result = await updateClass(classId, className)
        if (result) {
          // 直接更新本地状态，避免重新加载所有数据
          const index = this.classes.findIndex(c => c.id === classId)
          if (index !== -1) {
            this.classes[index] = { ...this.classes[index], name: className }
          }
        }
      } catch (error) {
        this.error = error.message

      } finally {
        this.isLoading = false
      }
    },
    
    // 删除班级
    async deleteClass(classId) {
      try {
        this.isLoading = true
        this.error = null
        const result = await deleteClass(classId)
        if (result) {
          // 直接从本地状态中删除，避免重新加载所有数据
          this.classes = this.classes.filter(c => c.id !== classId)
        }
      } catch (error) {
        this.error = error.message

      } finally {
        this.isLoading = false
      }
    },
    
    // 加载错题巩固题库
    async loadErrorCollection(subjectId) {
      try {
        // 确保subjectId存在
        if (!subjectId) {
          return
        }
        
        this.isLoading = true
        this.error = null
        const studentId = localStorage.getItem('studentId')
        if (!studentId) {
          this.errorCollections[subjectId] = []
          return
        }
        
        // 这里需要调用后端API获取错题巩固题库
        // 暂时使用模拟数据
        const response = await fetch(`${getApiBaseUrl()}/error-collection/${subjectId}?studentId=${studentId}`)
        if (response.ok) {
          const data = await response.json()
          this.errorCollections[subjectId] = data.questions || []
          // 加载错题统计
          if (data.stats) {
            this.errorCollectionStats = { ...this.errorCollectionStats, ...data.stats }
          }
        } else {
          // 如果API返回错误，显示空数据
          this.errorCollections[subjectId] = []
        }
      } catch (error) {
        this.error = error.message
        console.error('加载错题巩固题库失败:', error)
        // 发生错误时显示空数据
        if (subjectId) {
          this.errorCollections[subjectId] = []
        }
      } finally {
        this.isLoading = false
      }
    },
    
    // 更新错题的正确次数
    async updateErrorQuestionCorrectCount(questionId) {
      try {
        this.isLoading = true
        this.error = null
        const studentId = localStorage.getItem('studentId')
        if (!studentId) {
          return
        }
        
        // 增加正确次数
        const currentCount = this.errorCollectionStats[questionId]?.correctCount || 0
        const newCount = currentCount + 1
        this.errorCollectionStats[questionId] = { correctCount: newCount }
        
        // 调用后端API更新正确次数
        await fetch(`${getApiBaseUrl()}/error-collection/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ studentId, questionId, correctCount: newCount })
        })
        
        // 检查是否达到3次正确，若是则从所有错题巩固题库中移除
        if (newCount >= 3) {
          for (const subjectId in this.errorCollections) {
            this.errorCollections[subjectId] = this.errorCollections[subjectId].filter(q => q.id !== questionId)
          }
        }
      } catch (error) {
        this.error = error.message
        console.error('更新错题正确次数失败:', error)
      } finally {
        this.isLoading = false
      }
    },
    
    // 重置错题的正确次数（当用户再次做错时）
    async resetErrorQuestionCorrectCount(questionId) {
      try {
        this.isLoading = true
        this.error = null
        const studentId = localStorage.getItem('studentId')
        if (!studentId) {
          return
        }
        
        // 重置正确次数为0
        this.errorCollectionStats[questionId] = { correctCount: 0 }
        
        // 调用后端API重置正确次数
        await fetch(`${getApiBaseUrl()}/error-collection/reset`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ studentId, questionId })
        })
      } catch (error) {
        this.error = error.message
        console.error('重置错题正确次数失败:', error)
      } finally {
        this.isLoading = false
      }
    }
  }
})

// 答题相关 store
export const useQuizStore = defineStore('quiz', {
  state: () => ({
    selectedSubjectId: null,
    selectedSubcategoryId: null,
    currentQuestions: [],
    userAnswers: {},
    score: null,
    correctQuestions: [], // 存储已经做对的题目ID
    startTime: null
  }),
  
  // 持久化存储
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'quiz-store',
        storage: localStorage,
        paths: ['currentQuestions', 'userAnswers', 'score', 'correctQuestions']
      }
    ]
  },
  getters: {
    isQuizActive: (state) => state.currentQuestions.length > 0,
    hasAnsweredAll: (state) => {
      if (state.currentQuestions.length === 0) return false
      return state.currentQuestions.every(question => {
        const answer = state.userAnswers[question.id]
        if (question.type === 'multiple') {
          return Array.isArray(answer) && answer.length > 0
        } else {
          return answer !== undefined
        }
      })
    }
  },
  actions: {
    selectSubject(subjectId) {
      this.selectedSubjectId = subjectId
      this.selectedSubcategoryId = null
      this.resetQuizState()
    },
    
    selectSubcategory(subcategoryId) {
      this.selectedSubcategoryId = subcategoryId
    },
    
    resetQuizState() {
      this.currentQuestions = []
      this.userAnswers = {}
      this.score = null
      this.startTime = null
    },
    
    generateQuestions(subjectId, count = 3, randomizeAnswers = true) {
      const questionStore = useQuestionStore()
      const subjectQuestions = questionStore.getQuestionsBySubject(subjectId)
      const shuffled = subjectQuestions.sort(() => 0.5 - Math.random())
      
      // 对每个题目的选项进行随机排序
      this.currentQuestions = shuffled.slice(0, count).map(question => {
        // 提取选项内容（去掉A、B、C、D标签）
        const optionContents = question.options.map(option => {
          if (/^[A-Z]\.\s/.test(option)) {
            return option.substring(2)
          }
          return option
        })
        
        // 根据设置决定是否随机排序选项内容
        let shuffledContents = optionContents
        if (randomizeAnswers) {
          shuffledContents = [...optionContents].sort(() => 0.5 - Math.random())
        }
        
        // 不添加标签，标签由组件负责显示
        const shuffledOptions = shuffledContents
        
        const newQuestion = {
          ...question,
          shuffledOptions,
          type: question.type || 'single' // 确保type字段存在，默认为single
        }
        
        // 获取正确答案
        const answer = question.answer || question.correct_answer || ''
        
        // 只有在随机排序时才更新答案标签
        if (randomizeAnswers && answer) {
          if (question.type === 'multiple') {
            // 处理多选题答案
            const originalAnswerChars = Array.isArray(answer) ? answer : answer.split('')
            const newAnswerChars = originalAnswerChars.map(originalAnswerChar => {
              const originalAnswerIndex = originalAnswerChar.charCodeAt(0) - 65
              if (originalAnswerIndex >= 0 && originalAnswerIndex < optionContents.length) {
                const originalAnswerContent = optionContents[originalAnswerIndex]
                const newIndex = shuffledContents.indexOf(originalAnswerContent)
                if (newIndex !== -1) {
                  return String.fromCharCode(65 + newIndex)
                }
              }
              return originalAnswerChar
            }).filter(char => char !== undefined)
            newQuestion.answer = newAnswerChars
          } else {
            // 处理单选题答案
            const originalAnswerIndex = answer.charCodeAt(0) - 65
            if (originalAnswerIndex >= 0 && originalAnswerIndex < optionContents.length) {
              const originalAnswerContent = optionContents[originalAnswerIndex]
              const newIndex = shuffledContents.indexOf(originalAnswerContent)
              if (newIndex !== -1) {
                newQuestion.answer = String.fromCharCode(65 + newIndex)
              }
            }
          }
        }
        
        return newQuestion
      })
      
      this.userAnswers = {}
      this.score = null
      this.startTime = Date.now()
    },
    
    generateQuestionsBySubcategory(subjectId, subcategoryId, count = 3, randomizeAnswers = true) {
      const questionStore = useQuestionStore()
      
      // 过滤出该子分类的题目
      const allSubjectQuestions = questionStore.questions.filter(q => {
        const qSubjectId = q.subjectId || q.subject_id
        const qSubcategoryId = q.subcategoryId || q.subcategory_id
        return qSubjectId === subjectId && qSubcategoryId === subcategoryId
      })
      
      // 过滤出未做对的题目
      const subjectQuestions = allSubjectQuestions.filter(q => !this.correctQuestions.includes(q.id))
      
      // 确定使用哪些题目
      let availableQuestions = subjectQuestions.length > 0 ? subjectQuestions : allSubjectQuestions
      
      // 确保至少有一个题目
      if (availableQuestions.length === 0) {
        this.resetQuizState()
        return 0
      }
      
      const shuffled = availableQuestions.sort(() => 0.5 - Math.random())
      const actualCount = Math.max(1, Math.min(count, availableQuestions.length))
      
      // 对每个题目的选项进行排序
      this.currentQuestions = shuffled.slice(0, actualCount).map(question => {
        // 提取选项内容
        const optionContents = question.options.map(option => {
          if (/^[A-Z]\.\s/.test(option)) {
            return option.substring(2)
          }
          return option
        })
        
        // 根据设置决定是否随机排序选项内容
        let shuffledContents = optionContents
        if (randomizeAnswers) {
          shuffledContents = [...optionContents].sort(() => 0.5 - Math.random())
        }
        
        // 不添加标签，标签由组件负责显示
        const shuffledOptions = shuffledContents
        
        const newQuestion = {
          ...question,
          shuffledOptions,
          type: question.type || 'single' // 确保type字段存在，默认为single
        }
        
        // 获取正确答案
        const answer = question.answer || question.correct_answer || ''
        
        // 只有在随机排序时才更新答案标签
        if (randomizeAnswers && answer) {
          if (question.type === 'multiple') {
            // 处理多选题答案
            const originalAnswerChars = Array.isArray(answer) ? answer : answer.split('')
            const newAnswerChars = originalAnswerChars.map(originalAnswerChar => {
              const originalAnswerIndex = originalAnswerChar.charCodeAt(0) - 65
              if (originalAnswerIndex >= 0 && originalAnswerIndex < optionContents.length) {
                const originalAnswerContent = optionContents[originalAnswerIndex]
                const newIndex = shuffledContents.indexOf(originalAnswerContent)
                if (newIndex !== -1) {
                  return String.fromCharCode(65 + newIndex)
                }
              }
              return originalAnswerChar
            }).filter(char => char !== undefined)
            newQuestion.answer = newAnswerChars
          } else {
            // 处理单选题答案
            const originalAnswerIndex = answer.charCodeAt(0) - 65
            if (originalAnswerIndex >= 0 && originalAnswerIndex < optionContents.length) {
              const originalAnswerContent = optionContents[originalAnswerIndex]
              const newIndex = shuffledContents.indexOf(originalAnswerContent)
              if (newIndex !== -1) {
                newQuestion.answer = String.fromCharCode(65 + newIndex)
              }
            }
          }
        }
        
        return newQuestion
      })
      
      this.userAnswers = {}
      this.score = null
      this.startTime = Date.now()
      
      // 返回实际生成的题目数量
      return actualCount
    },
    
    submitAnswer(questionId, answer, questionType = 'single') {
      if (questionType === 'multiple') {
        // 对于多选题，使用数组存储多个答案
        if (!this.userAnswers[questionId]) {
          this.userAnswers[questionId] = []
        }
        // 切换选项的选中状态
        const index = this.userAnswers[questionId].indexOf(answer)
        if (index === -1) {
          // 如果选项未选中，则添加
          this.userAnswers[questionId].push(answer)
        } else {
          // 如果选项已选中，则移除
          this.userAnswers[questionId].splice(index, 1)
        }
      } else {
        // 对于单选题，直接存储单个答案
        this.userAnswers[questionId] = answer
      }
    },
    
    calculateScore() {
      let correctCount = 0
      
      this.currentQuestions.forEach(question => {
        const userAnswer = this.userAnswers[question.id]
        const correctAnswer = question.answer
        
        let isCorrect = false
        
        if (question.type === 'multiple') {
          // 对于多选题，比较答案数组
          if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
            // 排序后比较是否完全一致
            const sortedUserAnswer = userAnswer.sort()
            const sortedCorrectAnswer = correctAnswer.sort()
            isCorrect = JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer)
          } else if (typeof correctAnswer === 'string') {
            // 处理正确答案为字符串的情况（如 "AB"）
            if (Array.isArray(userAnswer)) {
              const sortedUserAnswer = userAnswer.sort().join('')
              isCorrect = sortedUserAnswer === correctAnswer
            }
          }
        } else {
          // 对于单选题，直接比较
          if (Array.isArray(userAnswer)) {
            // 如果用户答案是数组，取第一个元素
            isCorrect = userAnswer[0] === correctAnswer
          } else {
            isCorrect = userAnswer === correctAnswer
          }
        }
        
        if (isCorrect) {
          correctCount++
          // 将做对的题目ID添加到correctQuestions数组中
          if (!this.correctQuestions.includes(question.id)) {
            this.correctQuestions.push(question.id)
          }
        }
      })
      
      this.score = correctCount
      return correctCount
    }
  }
})

// 设置 store
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    interfaceName: '',
    settings: {
      randomizeAnswers: false,
      fixedQuestionCount: false,
      minQuestionCount: 1,
      maxQuestionCount: 10,
      fixedQuestionCountValue: 5
    },
    isLoading: false,
    error: null
  }),
  getters: {
    getRandomizeAnswers: (state) => state.settings.randomizeAnswers,
    getFixedQuestionCount: (state) => state.settings.fixedQuestionCount,
    getQuestionCount: (state) => {
      if (state.settings.fixedQuestionCount) {
        return state.settings.fixedQuestionCountValue
      }
      return Math.floor(Math.random() * (state.settings.maxQuestionCount - state.settings.minQuestionCount + 1)) + state.settings.minQuestionCount
    }
  },
  actions: {
    // 加载设置
    async loadSettings() {
      try {
        this.isLoading = true
        this.error = null
        const response = await fetch(`${getApiBaseUrl()}/settings`)
        if (response.ok) {
          const settings = await response.json()
          this.settings.randomizeAnswers = settings.randomizeAnswers !== 'false'
          this.settings.fixedQuestionCount = settings.fixedQuestionCount === 'true'
          this.settings.minQuestionCount = parseInt(settings.minQuestionCount?.replace(/'/g, '')) || 3
          this.settings.maxQuestionCount = parseInt(settings.maxQuestionCount?.replace(/'/g, '')) || 5
          this.settings.fixedQuestionCountValue = parseInt(settings.fixedQuestionCountValue?.replace(/'/g, '')) || 3
          // 加载界面名称
          if (settings.interfaceName) {
            this.interfaceName = settings.interfaceName
          }
        }
      } catch (error) {
        this.error = error.message

      } finally {
        this.isLoading = false
      }
    },
    
    // 更新设置
    async updateSettings(newSettings) {
      try {
        this.isLoading = true
        this.error = null
        const response = await fetch(`${getApiBaseUrl()}/settings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newSettings)
        })
        if (response.ok) {
          // 更新本地状态
          this.settings.randomizeAnswers = newSettings.randomizeAnswers !== 'false'
          this.settings.fixedQuestionCount = newSettings.fixedQuestionCount === 'true'
          this.settings.minQuestionCount = parseInt(newSettings.minQuestionCount?.replace(/'/g, '')) || 3
          this.settings.maxQuestionCount = parseInt(newSettings.maxQuestionCount?.replace(/'/g, '')) || 5
          this.settings.fixedQuestionCountValue = parseInt(newSettings.fixedQuestionCountValue?.replace(/'/g, '')) || 3
          return true
        }
        return false
      } catch (error) {
        this.error = error.message

        return false
      } finally {
        this.isLoading = false
      }
    },
    
    // 更新界面名称
    async updateInterfaceName(newName) {
      try {
        this.isLoading = true
        this.error = null
        this.interfaceName = newName
        // 保存到数据库
        await fetch(`${getApiBaseUrl()}/settings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ interfaceName: newName })
        })
      } catch (error) {
        this.error = error.message

      } finally {
        this.isLoading = false
      }
    }
  }
})
