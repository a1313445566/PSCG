import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../utils/api'

export function useSplitEdit(props, options = {}) {
  const { loadQuestions, serverQuestions } = options

  // 分屏编辑相关
  const splitEditMode = ref(false)
  const editMode = ref('edit') // 'add' 或 'edit'
  const editingQuestionId = ref(null)
  const splitEditData = ref(null)
  const splitEditSaving = ref(false)
  const editPanelHeight = ref(800)
  const activeReadingSubQuestion = ref(0) // 当前展开的阅读理解小题

  // 分屏编辑的子分类列表
  const splitEditSubcategories = computed(() => {
    if (!splitEditData.value?.subjectId) return []

    // 统一转换为字符串比较，避免类型不匹配导致的联动失效
    const targetId = String(splitEditData.value.subjectId)
    const subject = props.subjects.find(s => String(s.id) === targetId)

    return subject ? subject.subcategories || [] : []
  })

  // 监听题目类型变化，判断题自动设置固定选项
  watch(
    () => splitEditData.value?.type,
    newType => {
      if (newType === 'judgment' && splitEditData.value) {
        splitEditData.value.options = ['对', '错']
        splitEditData.value.selectedAnswers = ['A']
      }
    }
  )

  // 打开添加面板
  const openAddPanel = () => {
    editMode.value = 'add'
    editingQuestionId.value = null
    splitEditMode.value = true

    // 初始化空表单
    const defaultSubjectId = props.subjects.length > 0 ? props.subjects[0].id : null
    const defaultSubcategoryId =
      defaultSubjectId && props.subjects[0]?.subcategories?.length > 0
        ? props.subjects[0].subcategories[0].id
        : null

    splitEditData.value = {
      subjectId: defaultSubjectId,
      subcategoryId: defaultSubcategoryId,
      type: 'single',
      difficulty: 1,
      content: '',
      options: ['', '', '', ''],
      selectedAnswers: [],
      explanation: '',
      audio: null,
      // 阅读理解题专用字段
      readingSubQuestions: [
        {
          content: '',
          options: ['', '', '', ''],
          answer: 'A',
          explanation: ''
        }
      ]
    }
  }

  // 开启分屏编辑
  const openSplitEdit = async row => {
    editMode.value = 'edit'
    // 先显示面板和加载状态
    splitEditMode.value = true
    splitEditData.value = null
    editingQuestionId.value = row.id

    try {
      // 获取完整题目数据
      const data = await api.get(`/questions/${row.id}`)

      let options = data.options || []
      if (typeof options === 'string') {
        try {
          options = JSON.parse(options)
        } catch (e) {
          options = []
        }
      }

      // 解析答案
      let selectedAnswers = []
      const answer = data.answer || data.correct_answer
      if (answer) {
        if (data.type === 'multiple') {
          selectedAnswers = String(answer).split('')
        } else {
          selectedAnswers = [String(answer)]
        }
      }

      // 阅读理解题：解析小题数据
      let readingSubQuestions = []
      if (data.type === 'reading') {
        // options 是小题数组
        if (Array.isArray(options) && options.length > 0) {
          readingSubQuestions = options.map((sq, _idx) => ({
            content: sq.content || '',
            options: Array.isArray(sq.options) ? sq.options : ['', '', '', ''],
            answer: sq.answer || 'A',
            explanation: sq.explanation || ''
          }))
        }
        // 解析答案对象 { "1": "A", "2": "B" }
        if (typeof answer === 'string') {
          try {
            const answerObj = JSON.parse(answer)
            if (typeof answerObj === 'object') {
              readingSubQuestions.forEach((sq, idx) => {
                sq.answer = answerObj[String(idx + 1)] || 'A'
              })
            }
          } catch (e) {
            // 答案不是 JSON，忽略
          }
        }
      }

      // 设置数据（统一转换为数字，确保与props.subjects中的ID类型一致）
      splitEditData.value = {
        subjectId: data.subjectId || data.subject_id ? Number(data.subjectId || data.subject_id) : null,
        subcategoryId: data.subcategoryId || data.subcategory_id
          ? Number(data.subcategoryId || data.subcategory_id)
          : null,
        type: data.type,
        difficulty: data.difficulty || 1,
        content: data.content || '',
        options: data.type === 'reading' ? [] : options,
        selectedAnswers: selectedAnswers,
        explanation: data.explanation || '',
        audio: data.audio_url || data.audio || null,
        // 阅读理解题专用字段
        readingSubQuestions:
          readingSubQuestions.length > 0
            ? readingSubQuestions
            : [
                {
                  content: '',
                  options: ['', '', '', ''],
                  answer: 'A',
                  explanation: ''
                }
              ]
      }
    } catch (error) {
      console.error('获取题目详情失败:', error)
      ElMessage.error('获取题目详情失败')
      closeSplitEdit()
    }
  }

  // 关闭分屏编辑
  const closeSplitEdit = () => {
    splitEditMode.value = false
    editMode.value = 'edit'
    editingQuestionId.value = null
    splitEditData.value = null
  }

  // 保存分屏编辑
  const saveSplitEdit = async () => {
    if (!splitEditData.value) return

    // 验证
    if (!splitEditData.value.subjectId) {
      ElMessage.warning('请选择学科')
      return
    }
    if (!splitEditData.value.subcategoryId) {
      ElMessage.warning('请选择题库')
      return
    }
    if (!splitEditData.value.content) {
      ElMessage.warning('请输入题目内容')
      return
    }

    // 阅读理解题验证
    if (splitEditData.value.type === 'reading') {
      if (
        !splitEditData.value.readingSubQuestions ||
        splitEditData.value.readingSubQuestions.length === 0
      ) {
        ElMessage.warning('请添加至少一个小题')
        return
      }
      // 验证每个小题
      for (let i = 0; i < splitEditData.value.readingSubQuestions.length; i++) {
        const sq = splitEditData.value.readingSubQuestions[i]
        if (!sq.content || !sq.content.trim()) {
          ElMessage.warning(`请输入第 ${i + 1} 小题内容`)
          return
        }
        if (sq.options.some(opt => !opt || (typeof opt === 'string' && !opt.trim()))) {
          ElMessage.warning(`请填写第 ${i + 1} 小题的所有选项`)
          return
        }
      }
    } else {
      // 普通题目验证
      if (splitEditData.value.selectedAnswers.length === 0) {
        ElMessage.warning('请选择正确答案')
        return
      }
      // 判断题跳过选项内容验证
      if (splitEditData.value.type !== 'judgment') {
        // 验证选项内容
        if (
          splitEditData.value.options.some(opt => !opt || (typeof opt === 'string' && !opt.trim()))
        ) {
          ElMessage.warning('请填写所有选项内容')
          return
        }
      }
    }

    splitEditSaving.value = true

    try {
      let answer, options

      if (splitEditData.value.type === 'reading') {
        // 阅读理解题：构造小题数据和答案对象
        options = splitEditData.value.readingSubQuestions.map((sq, idx) => ({
          order: idx + 1,
          content: sq.content,
          options: sq.options,
          answer: sq.answer,
          explanation: sq.explanation || ''
        }))
        // 答案格式: { "1": "A", "2": "B" }
        const answerObj = {}
        splitEditData.value.readingSubQuestions.forEach((sq, idx) => {
          answerObj[String(idx + 1)] = sq.answer
        })
        answer = JSON.stringify(answerObj)
      } else {
        // 普通题目
        answer =
          splitEditData.value.type === 'multiple'
            ? splitEditData.value.selectedAnswers.join('')
            : splitEditData.value.selectedAnswers[0]
        // 判断题固定选项
        if (splitEditData.value.type === 'judgment') {
          options = ['对', '错']
        } else {
          options = splitEditData.value.options
        }
      }

      const requestBody = {
        subjectId: splitEditData.value.subjectId,
        subcategoryId: splitEditData.value.subcategoryId || null,
        type: splitEditData.value.type,
        difficulty: splitEditData.value.difficulty,
        content: splitEditData.value.content,
        options: options,
        answer: answer,
        explanation: splitEditData.value.explanation,
        audio: splitEditData.value.audio || null
      }

      if (editMode.value === 'add') {
        // 添加新题目
        await api.post('/questions', requestBody)
      } else {
        // 编辑现有题目
        await api.put(`/questions/${editingQuestionId.value}`, requestBody)
      }

      ElMessage.success(editMode.value === 'add' ? '添加成功' : '保存成功')
      // 刷新列表
      if (loadQuestions) loadQuestions()
      // 添加成功后关闭面板
      if (editMode.value === 'add') {
        closeSplitEdit()
      }
    } catch (error) {
      console.error('保存失败:', error)
      ElMessage.error(error.message || '保存失败')
    } finally {
      splitEditSaving.value = false
    }
  }

  // 保存并下一个
  const saveAndNext = async () => {
    await saveSplitEdit()

    if (!splitEditMode.value) return // 保存失败则不继续

    // 找到当前题目的索引
    const currentIndex = serverQuestions?.value?.findIndex(q => q.id === editingQuestionId.value)

    if (
      currentIndex !== undefined &&
      currentIndex !== -1 &&
      serverQuestions?.value &&
      currentIndex < serverQuestions.value.length - 1
    ) {
      // 打开下一个题目
      const nextQuestion = serverQuestions.value[currentIndex + 1]
      openSplitEdit(nextQuestion)
    } else {
      ElMessage.info('已是最后一题')
      closeSplitEdit()
    }
  }

  // 分屏编辑学科变化（同步更新splitEditData，修复级联联动BUG）
  const onSplitEditSubjectChange = newSubjectId => {
    if (splitEditData.value && newSubjectId !== undefined) {
      splitEditData.value.subjectId = newSubjectId
    }
    splitEditData.value.subcategoryId = null
  }

  // 添加选项
  const addSplitEditOption = () => {
    if (!splitEditData.value) return
    if (splitEditData.value.options.length >= 6) {
      ElMessage.warning('最多添加6个选项')
      return
    }
    splitEditData.value.options.push('')
  }

  // 删除选项
  const removeSplitEditOption = index => {
    if (!splitEditData.value) return
    const letter = String.fromCharCode(65 + index)
    // 移除选项
    splitEditData.value.options.splice(index, 1)
    // 移除答案中的该选项
    splitEditData.value.selectedAnswers = splitEditData.value.selectedAnswers.filter(
      a => a !== letter
    )
  }

  // ========== 阅读理解题辅助函数 ==========
  // 添加阅读理解小题
  const addReadingSubQuestion = () => {
    if (!splitEditData.value) return
    if (splitEditData.value.readingSubQuestions.length >= 10) {
      ElMessage.warning('最多添加10个小题')
      return
    }
    splitEditData.value.readingSubQuestions.push({
      content: '',
      options: ['', '', '', ''],
      answer: 'A',
      explanation: ''
    })
  }

  // 删除阅读理解小题
  const removeReadingSubQuestion = index => {
    if (!splitEditData.value) return
    if (splitEditData.value.readingSubQuestions.length <= 1) {
      ElMessage.warning('至少保留一个小题')
      return
    }
    splitEditData.value.readingSubQuestions.splice(index, 1)
  }

  // 添加阅读理解小题选项
  const addReadingSubOption = sqIndex => {
    if (!splitEditData.value) return
    const subQ = splitEditData.value.readingSubQuestions[sqIndex]
    if (!subQ) return
    if (subQ.options.length >= 6) {
      ElMessage.warning('每个小题最多6个选项')
      return
    }
    subQ.options.push('')
  }

  // 删除阅读理解小题选项
  const removeReadingSubOption = (sqIndex, optIndex) => {
    if (!splitEditData.value) return
    const subQ = splitEditData.value.readingSubQuestions[sqIndex]
    if (!subQ) return
    if (subQ.options.length <= 2) {
      ElMessage.warning('每个小题至少2个选项')
      return
    }
    subQ.options.splice(optIndex, 1)
    // 如果删除的选项是当前答案，重置答案为第一个选项
    const removedLetter = String.fromCharCode(65 + optIndex)
    if (subQ.answer === removedLetter) {
      subQ.answer = 'A'
    }
  }

  // 移动阅读理解小题
  const moveReadingSubQuestion = (index, direction) => {
    if (!splitEditData.value) return
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= splitEditData.value.readingSubQuestions.length) return

    // 交换位置
    const temp = splitEditData.value.readingSubQuestions[index]
    splitEditData.value.readingSubQuestions[index] =
      splitEditData.value.readingSubQuestions[newIndex]
    splitEditData.value.readingSubQuestions[newIndex] = temp

    // 更新展开的小题索引
    activeReadingSubQuestion.value = newIndex
  }

  return {
    // 状态
    splitEditMode,
    editMode,
    editingQuestionId,
    splitEditData,
    splitEditSaving,
    editPanelHeight,
    activeReadingSubQuestion,
    splitEditSubcategories,

    // 方法
    openAddPanel,
    openSplitEdit,
    closeSplitEdit,
    saveSplitEdit,
    saveAndNext,
    onSplitEditSubjectChange,
    addSplitEditOption,
    removeSplitEditOption,
    addReadingSubQuestion,
    removeReadingSubQuestion,
    addReadingSubOption,
    removeReadingSubOption,
    moveReadingSubQuestion
  }
}
