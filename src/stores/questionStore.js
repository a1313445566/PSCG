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

export const useQuestionStore = defineStore('question', {
  state: () => ({
    subjects: [],
    questions: [],
    selectedSubjectId: null,
    currentQuestions: [],
    userAnswers: {},
    score: null,
    correctQuestions: [] // 存储已经做对的题目ID
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
    }
  },
  actions: {
    // 初始化数据
    async initialize() {
      await initDatabase()
      await this.loadData()
    },
    
    // 加载数据
    async loadData() {
      this.subjects = await getSubjects()
      this.questions = await getQuestions()
    },
    
    selectSubject(subjectId) {
      this.selectedSubjectId = subjectId
    },
    
    generateQuestions(subjectId, count = 3) {
      const subjectQuestions = this.getQuestionsBySubject(subjectId)
      const shuffled = subjectQuestions.sort(() => 0.5 - Math.random())
      // 对每个题目的选项进行随机排序，但保持选项标签（A、B、C、D）固定
      this.currentQuestions = shuffled.slice(0, count).map(question => {
        // 提取选项内容（去掉A、B、C、D标签）
        const optionContents = question.options.map(option => option.substring(2))
        // 随机排序选项内容
        const shuffledContents = optionContents.sort(() => 0.5 - Math.random())
        // 重新添加标签
        const shuffledOptions = shuffledContents.map((content, index) => {
          const label = String.fromCharCode(65 + index) // A, B, C, D...
          return `${label}. ${content}`
        })
        return {
          ...question,
          shuffledOptions
        }
      })
      this.userAnswers = {}
      this.score = null
    },
    
    generateQuestionsBySubcategory(subjectId, subcategoryId, count = 3, randomizeAnswers = true) {
      // 过滤出该子分类的题目
      const allSubjectQuestions = this.questions.filter(q => {
        const qSubjectId = q.subjectId || q.subject_id
        const qSubcategoryId = q.subcategoryId || q.subcategory_id
        return qSubjectId === subjectId && qSubcategoryId === subcategoryId
      })
      
      // 过滤出未做对的题目
      const subjectQuestions = allSubjectQuestions.filter(q => !this.correctQuestions.includes(q.id))
      
      // 确定使用哪些题目
      let availableQuestions = subjectQuestions
      // 如果未做对的题目数量不足，使用所有题目（包括已做对的）
      if (subjectQuestions.length < count) {
        availableQuestions = allSubjectQuestions
      }
      
      // 确保至少有一个题目
      if (availableQuestions.length === 0) {
        this.currentQuestions = []
        this.userAnswers = {}
        this.score = null
        return 0
      }
      
      const shuffled = availableQuestions.sort(() => 0.5 - Math.random())
      // 确保不超过实际题目数量，但至少生成一个题目
      const actualCount = Math.max(1, Math.min(count, availableQuestions.length))
      // 对每个题目的选项进行排序
      this.currentQuestions = shuffled.slice(0, actualCount).map(question => {
        // 提取选项内容（处理有或没有A、B、C、D标签的情况）
        const optionContents = question.options.map(option => {
          // 检查选项是否以字母加小数点开头
          if (/^[A-Z]\.\s/.test(option)) {
            return option.substring(2)
          }
          return option
        })
        
        // 保存原始选项索引和内容的映射关系
        const originalOptions = optionContents.map((content, index) => ({
          content,
          index
        }))
        
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
        
        // 创建新的题目对象，确保答案与选项匹配
        const newQuestion = {
          ...question,
          shuffledOptions
        }
        
        // 获取正确答案，支持两种命名格式
        const answer = question.answer || question.correct_answer || ''
        
        // 只有在随机排序时才更新答案标签
        if (randomizeAnswers && answer) {
          // 计算原始答案的索引
          const originalAnswerIndex = answer.charCodeAt(0) - 65
          if (originalAnswerIndex >= 0 && originalAnswerIndex < optionContents.length) {
            const originalAnswerContent = optionContents[originalAnswerIndex]
            // 找到新的选项顺序中对应的标签
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
      // 返回实际生成的题目数量
      return actualCount
    },
    
    submitAnswer(questionId, answer) {
      this.userAnswers[questionId] = answer
    },
    
    calculateScore() {
      let correctCount = 0
      this.currentQuestions.forEach(question => {
        if (this.userAnswers[question.id] === question.answer) {
          correctCount++
          // 将做对的题目ID添加到correctQuestions数组中
          if (!this.correctQuestions.includes(question.id)) {
            this.correctQuestions.push(question.id)
          }
        }
      })
      this.score = correctCount
      return correctCount
    },
    
    async addQuestion(questionData) {
      const newQuestion = await addQuestion(questionData)
      if (newQuestion) {
        // 重新加载题目数据，确保列表更新
        await this.loadData()
        return newQuestion
      } else {
        throw new Error('添加题目失败')
      }
    },
    
    async updateQuestion(questionData) {
      const result = await updateQuestion(questionData)
      if (result) {
        // 重新加载题目数据，确保列表更新
        await this.loadData()
        return result
      } else {
        throw new Error('更新题目失败')
      }
    },
    
    async deleteQuestion(id) {
      const result = await deleteQuestion(id)
      if (result) {
        // 重新加载题目数据，确保列表更新
        await this.loadData()
      }
    },
    
    async addSubject(subjectName, iconIndex = 0) {
      const newSubject = await addSubject(subjectName, iconIndex)
      if (newSubject) {
        this.subjects.push(newSubject)
      }
    },
    
    async updateSubject(subjectId, subjectName, iconIndex = 0) {
      const result = await updateSubjectApi(subjectId, subjectName, iconIndex)
      if (result) {
        const index = this.subjects.findIndex(s => s.id === subjectId)
        if (index !== -1) {
          this.subjects[index] = result
        }
      }
    },
    
    async deleteSubject(id) {
      const result = await deleteSubject(id)
      if (result) {
        this.subjects = this.subjects.filter(s => s.id !== id)
        this.questions = this.questions.filter(q => q.subjectId !== id)
      }
    },
    
    async addSubcategory(subjectId, name, iconIndex = 0) {
      const newSubcategory = await addSubcategory(subjectId, name, iconIndex)
      if (newSubcategory) {
        const subject = this.subjects.find(s => s.id === subjectId)
        if (subject) {
          subject.subcategories.push(newSubcategory)
        }
      }
    },
    
    async updateSubcategory(subjectId, subcategoryId, name, iconIndex = 0) {
      const result = await updateSubcategoryApi(subcategoryId, name, iconIndex)
      if (result) {
        const subject = this.subjects.find(s => s.id === subjectId)
        if (subject) {
          const index = subject.subcategories.findIndex(sc => sc.id === subcategoryId)
          if (index !== -1) {
            subject.subcategories[index] = result
          }
        }
      }
    },
    
    async deleteSubcategory(subjectId, id) {
      const result = await deleteSubcategory(id)
      if (result) {
        const subject = this.subjects.find(s => s.id === subjectId)
        if (subject) {
          subject.subcategories = subject.subcategories.filter(s => s.id !== id)
        }
        this.questions = this.questions.filter(q => q.subcategoryId !== id)
      }
    },
    
    // 导入本地数据到SQL数据库
    async importLocalData() {
      const result = await importLocalData()
      if (result.success) {
        // 重新加载数据
        await this.loadData()
      }
      return result
    }
  }
})
