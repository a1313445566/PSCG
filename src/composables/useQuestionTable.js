import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useQuestionStore } from '../stores/questionStore'
import { usePagination } from '../composables/usePagination'
import { formatDate } from '../utils/dateUtils'
import { api } from '../utils/api'

export function useQuestionTable(props) {
  const questionStore = useQuestionStore()

  // 加载状态
  const loading = ref(false)

  // 服务端数据
  const serverQuestions = ref([])
  const paginationTotal = ref(0)

  // 使用分页 Hook（服务端分页）
  const {
    currentPage: paginationPage,
    pageSize: paginationLimit,
    handleSizeChange,
    handleCurrentChange,
    reset: resetPagination
  } = usePagination(50, paginationTotal)

  // 行内编辑
  const editingId = ref(null)
  const editingContent = ref('')
  const inlineEditInput = ref(null)

  // 删除撤销相关
  const pendingDeletes = ref(new Map())

  // 加载题目
  const loadQuestions = async (resetPage = false, options = {}) => {
    try {
      loading.value = true
      if (resetPage) {
        resetPagination()
      }

      const result = await questionStore.loadQuestions({
        subjectId: options.filterSubjectId || null,
        subcategoryId: options.filterSubcategoryId || null,
        type: options.filterType || null,
        keyword: options.searchKeyword || null,
        page: paginationPage.value,
        limit: paginationLimit.value,
        excludeContent: true
      })

      serverQuestions.value = formatQuestions(result?.data || [])
      paginationTotal.value = result?.total || 0
    } catch (error) {
      console.error('加载题目失败:', error)
      ElMessage.error('加载题目失败')
    } finally {
      loading.value = false
    }
  }

  // 格式化题目数据
  const formatQuestions = questions => {
    return questions.map(question => {
      const subjectId = question.subjectId || question.subject_id
      const subject = props.subjects.find(s => String(s.id) === String(subjectId))
      const subjectName = subject ? subject.name : ''

      let subcategoryName = ''
      const subcategoryId = question.subcategoryId || question.subcategory_id
      if (subject && subcategoryId) {
        const subcategory = subject.subcategories?.find(
          sc => String(sc.id) === String(subcategoryId)
        )
        subcategoryName = subcategory ? subcategory.name : ''
      }

      const typeName = getTypeName(question.type)
      const createdAt = question.createdAt || question.created_at || '未知'
      const formattedCreatedAt =
        typeof createdAt === 'string' && createdAt !== '未知' ? formatDate(createdAt) : createdAt

      let content = question.content
      if (typeof content === 'object' && content?.ops) {
        const tempElement = document.createElement('div')
        content.ops.forEach(op => {
          if (typeof op.insert === 'string') {
            tempElement.innerHTML += op.insert
          } else if (op.insert?.image) {
            tempElement.innerHTML += `<img src="${op.insert.image}" alt="图片" style="max-width: 100%;">`
          }
        })
        content = tempElement.innerHTML
      } else if (typeof content !== 'string') {
        content = String(content || '')
      }

      return {
        ...question,
        content,
        subjectName,
        subcategoryName,
        typeName,
        createdAt: formattedCreatedAt,
        image: question.image || question.image_url || ''
      }
    })
  }

  // 行内编辑
  const startInlineEdit = row => {
    if (isRichText(row.content)) {
      ElMessage.warning('该题目包含富文本格式，请使用"编辑"按钮进行完整编辑')
      return
    }

    editingId.value = row.id
    editingContent.value = row.content
    nextTick(() => {
      inlineEditInput.value?.focus()
    })
  }

  const saveInlineEdit = async row => {
    if (editingContent.value === row.content) {
      editingId.value = null
      return
    }

    try {
      const fullQuestion = await api.get(`/questions/${row.id}`)

      await api.put(`/questions/${row.id}`, {
        ...fullQuestion,
        content: editingContent.value
      })

      ElMessage.success('修改成功')
      const index = serverQuestions.value.findIndex(q => q.id === row.id)
      if (index !== -1) {
        serverQuestions.value[index].content = editingContent.value
      }
    } catch (error) {
      console.error('保存失败:', error)
      ElMessage.error('保存失败')
    } finally {
      editingId.value = null
    }
  }

  const cancelInlineEdit = () => {
    editingId.value = null
  }

  // 删除撤销功能
  const deleteQuestionWithUndo = row => {
    const index = serverQuestions.value.findIndex(q => q.id === row.id)
    const removed = { ...serverQuestions.value[index] }
    serverQuestions.value.splice(index, 1)
    paginationTotal.value -= 1

    pendingDeletes.value.set(row.id, {
      data: removed,
      index,
      timer: null
    })

    ElMessage({
      message: `已删除题目 #${row.id}`,
      type: 'warning',
      duration: 3000,
      showClose: true,
      action: {
        text: '撤销',
        handler: () => {
          undoDelete(row.id)
        }
      },
      onClose: () => {
        executeRealDelete(row.id)
      }
    })
  }

  const undoDelete = questionId => {
    const pending = pendingDeletes.value.get(questionId)
    if (pending) {
      serverQuestions.value.splice(pending.index, 0, pending.data)
      paginationTotal.value += 1
      pendingDeletes.value.delete(questionId)
      ElMessage.success('已撤销删除')
    }
  }

  const executeRealDelete = async questionId => {
    const pending = pendingDeletes.value.get(questionId)
    if (!pending) return

    try {
      await api.delete(`/questions/${questionId}`)
      pendingDeletes.value.delete(questionId)
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  // 辅助方法
  const hasValidImage = row => {
    if (row.image) return true
    if (row.image_url) return true
    return typeof row.content === 'string' && row.content.includes('<img')
  }

  const isRichText = content => {
    if (!content || typeof content !== 'string') return false
    const richTextPattern = /<(?!br\s*\/?>)[a-zA-Z][^>]*>/i
    return richTextPattern.test(content)
  }

  const canInlineEdit = row => {
    return !isRichText(row.content)
  }

  const extractImageUrl = row => {
    if (row.image) return row.image
    if (row.image_url) return row.image_url
    if (typeof row.content !== 'string') return ''
    const match = row.content.match(/<img[^>]+src="([^"]+)"/)
    return match ? match[1] : ''
  }

  const stripImages = content => {
    if (typeof content !== 'string') return ''
    return content.replace(/<img[^>]+>/g, '')
  }

  const truncate = (html, length) => {
    if (!html) return ''
    const text = html.replace(/<[^>]+>/g, '')
    return text.length > length ? text.substring(0, length) + '...' : html
  }

  const getTypeName = type => {
    const typeMap = {
      single: '单选题',
      multiple: '多选题',
      judgment: '判断题',
      listening: '听力题',
      reading: '阅读题',
      image: '看图题'
    }
    return typeMap[type] || (typeof type === 'string' ? type : '未知')
  }

  const getTypeTagType = type => {
    const typeMap = {
      single: 'primary',
      multiple: 'success',
      judgment: 'warning'
    }
    return typeMap[type] || 'info'
  }

  const isReadingOptions = options => {
    if (!Array.isArray(options) || options.length === 0) return false
    const first = options[0]
    return typeof first === 'object' && first !== null && 'order' in first
  }

  const getRowClassName = ({ row }) => {
    return hasValidImage(row) || row.audio ? 'has-media' : ''
  }

  return {
    loading,
    serverQuestions,
    paginationTotal,
    loadQuestions,
    formatQuestions,
    editingId,
    editingContent,
    inlineEditInput,
    startInlineEdit,
    saveInlineEdit,
    cancelInlineEdit,
    pendingDeletes,
    deleteQuestionWithUndo,
    undoDelete,
    executeRealDelete,
    hasValidImage,
    isRichText,
    canInlineEdit,
    extractImageUrl,
    stripImages,
    truncate,
    getTypeName,
    getTypeTagType,
    isReadingOptions,
    getRowClassName,
    paginationPage,
    paginationLimit,
    handleSizeChange,
    handleCurrentChange,
    resetPagination
  }
}
