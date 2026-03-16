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
  updateSubcategory as updateSubcategoryApi
} from '../utils/database'
import { getApiBaseUrl } from '../utils/database'
import { apiCache } from '../utils/apiCache'

// 主题和题目数据 store
export const useQuestionStore = defineStore('question', {
  state: () => ({
    subjects: [],
    questions: [],
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
    }
  },
  actions: {
    // 初始化数据
    async initialize() {
      try {
        this.isLoading = true
        this.error = null
        await initDatabase()
        await this.loadData()
      } catch (error) {
        this.error = error.message
        console.error('初始化数据失败:', error)
      } finally {
        this.isLoading = false
      }
    },
    
    // 加载数据
    async loadData() {
      try {
        this.isLoading = true
        this.error = null
        
        // 清除API缓存，确保获取最新数据
        console.log('Clearing API cache...');
        apiCache.clear();
        console.log('API cache cleared');
        
        // 直接使用fetch而不是apiCache，确保每次都从服务器获取最新数据
        console.log('Fetching subjects from server...');
        const subjectsResponse = await fetch(`${getApiBaseUrl()}/subjects`);
        const subjectsData = await subjectsResponse.json();
        console.log('Subjects fetched:', subjectsData);
        
        console.log('Fetching questions from server...');
        const questionsResponse = await fetch(`${getApiBaseUrl()}/questions?limit=1000`);
        const questionsData = await questionsResponse.json();
        console.log('Questions fetched:', questionsData.length);
        
        this.subjects = subjectsData
        this.questions = questionsData
        console.log('Data loaded successfully');
      } catch (error) {
        this.error = error.message
        console.error('加载数据失败:', error)
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
          // 重新加载题目数据，确保列表更新
          await this.loadData()
          return newQuestion
        } else {
          throw new Error('添加题目失败')
        }
      } catch (error) {
        this.error = error.message
        console.error('添加题目失败:', error)
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
        const result = await updateQuestion(questionData)
        if (result) {
          // 重新加载题目数据，确保列表更新
          await this.loadData()
          return result
        } else {
          throw new Error('更新题目失败')
        }
      } catch (error) {
        this.error = error.message
        console.error('更新题目失败:', error)
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
          // 重新加载题目数据，确保列表更新
          await this.loadData()
        }
      } catch (error) {
        this.error = error.message
        console.error('删除题目失败:', error)
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
        if (newSubject) {
          // 重新加载数据，确保与服务器保持一致
          await this.loadData()
        }
      } catch (error) {
        this.error = error.message
        console.error('添加学科失败:', error)
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
        if (result) {
          // 重新加载数据，确保与服务器保持一致
          await this.loadData()
        }
      } catch (error) {
        this.error = error.message
        console.error('更新学科失败:', error)
      } finally {
        this.isLoading = false
      }
    },
    
    // 删除学科
    async deleteSubject(id) {
      try {
        this.isLoading = true
        this.error = null
        const result = await deleteSubject(id)
        if (result) {
          // 重新加载数据，确保与服务器保持一致
          await this.loadData()
        }
      } catch (error) {
        this.error = error.message
        console.error('删除学科失败:', error)
      } finally {
        this.isLoading = false
      }
    },
    
    // 添加子分类
    async addSubcategory(subjectId, name, iconIndex = 0) {
      try {
        this.isLoading = true
        this.error = null
        const newSubcategory = await addSubcategory(subjectId, name, iconIndex)
        if (newSubcategory) {
          // 重新加载数据，确保与服务器保持一致
          await this.loadData()
        }
      } catch (error) {
        this.error = error.message
        console.error('添加子分类失败:', error)
      } finally {
        this.isLoading = false
      }
    },
    
    // 更新子分类
    async updateSubcategory(subjectId, subcategoryId, name, iconIndex = 0) {
      try {
        this.isLoading = true
        this.error = null
        const result = await updateSubcategoryApi(subcategoryId, name, iconIndex)
        if (result) {
          // 重新加载数据，确保与服务器保持一致
          await this.loadData()
        }
      } catch (error) {
        this.error = error.message
        console.error('更新子分类失败:', error)
      } finally {
        this.isLoading = false
      }
    },
    
    // 删除子分类
    async deleteSubcategory(subjectId, id) {
      try {
        this.isLoading = true
        this.error = null
        const result = await deleteSubcategory(id)
        if (result) {
          // 重新加载数据，确保与服务器保持一致
          await this.loadData()
        }
      } catch (error) {
        this.error = error.message
        console.error('删除子分类失败:', error)
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
        console.error('导入数据失败:', error)
        return { success: false, error: error.message }
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
        
        // 重新添加标签
        const shuffledOptions = shuffledContents.map((content, index) => {
          const label = String.fromCharCode(65 + index) // A, B, C, D...
          return `${label}. ${content}`
        })
        
        const newQuestion = {
          ...question,
          shuffledOptions,
          type: question.type || 'single' // 确保type字段存在，默认为single
        }
        
        // 获取正确答案
        const answer = question.answer || question.correct_answer || ''
        
        // 只有在随机排序时才更新答案标签
        if (randomizeAnswers && answer) {
          const originalAnswerIndex = answer.charCodeAt(0) - 65
          if (originalAnswerIndex >= 0 && originalAnswerIndex < optionContents.length) {
            const originalAnswerContent = optionContents[originalAnswerIndex]
            const newIndex = shuffledContents.indexOf(originalAnswerContent)
            if (newIndex !== -1) {
              newQuestion.answer = String.fromCharCode(65 + newIndex)
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
        
        // 重新添加标签
        const shuffledOptions = shuffledContents.map((content, index) => {
          const label = String.fromCharCode(65 + index)
          return `${label}. ${content}`
        })
        
        const newQuestion = {
          ...question,
          shuffledOptions,
          type: question.type || 'single' // 确保type字段存在，默认为single
        }
        
        // 获取正确答案
        const answer = question.answer || question.correct_answer || ''
        
        // 只有在随机排序时才更新答案标签
        if (randomizeAnswers && answer) {
          const originalAnswerIndex = answer.charCodeAt(0) - 65
          if (originalAnswerIndex >= 0 && originalAnswerIndex < optionContents.length) {
            const originalAnswerContent = optionContents[originalAnswerIndex]
            const newIndex = shuffledContents.indexOf(originalAnswerContent)
            if (newIndex !== -1) {
              newQuestion.answer = String.fromCharCode(65 + newIndex)
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
          isCorrect = userAnswer === correctAnswer
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
        console.error('加载设置失败:', error)
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
        console.error('更新设置失败:', error)
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
        console.error('保存界面名称到数据库失败:', error)
      } finally {
        this.isLoading = false
      }
    }
  }
})
