import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../utils/api'

export function useBatchOperations(selectedQuestionsRef, loadQuestionsRef, subjectsRef) {
  const batchDifficultyVisible = ref(false)
  const batchDifficulty = ref(1)
  const batchTypeVisible = ref(false)
  const batchType = ref('')
  const batchMoveVisible = ref(false)
  const batchMoveSubjectId = ref('')
  const batchMoveSubcategoryId = ref('')

  const batchMoveSubcategories = computed(() => {
    if (!batchMoveSubjectId.value) return []
    const subject = subjectsRef.value.find(s => s.id == batchMoveSubjectId.value)
    return subject ? subject.subcategories || [] : []
  })

  const handleBatchCommand = command => {
    if (selectedQuestionsRef.value.length === 0) {
      ElMessage.warning('请先选择题目')
      return
    }

    switch (command) {
      case 'delete':
        batchDeleteQuestions()
        break
      case 'updateDifficulty':
        batchDifficulty.value = 1
        batchDifficultyVisible.value = true
        break
      case 'updateType':
        batchType.value = ''
        batchTypeVisible.value = true
        break
      case 'move':
        batchMoveSubjectId.value = ''
        batchMoveSubcategoryId.value = ''
        batchMoveVisible.value = true
        break
    }
  }

  const batchDeleteQuestions = async () => {
    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${selectedQuestionsRef.value.length} 道题目吗？`,
        '批量删除确认',
        { type: 'warning' }
      )

      const ids = selectedQuestionsRef.value.map(q => q.id)
      await api.post('/questions/batch', { action: 'delete', ids })
      ElMessage.success(`成功删除 ${ids.length} 道题目`)
      selectedQuestionsRef.value = []
      loadQuestionsRef.value()
    } catch (e) {
      if (e !== 'cancel') {
        ElMessage.error('删除失败')
      }
    }
  }

  const executeBatchDifficulty = async () => {
    const ids = selectedQuestionsRef.value.map(q => q.id)
    try {
      await api.post('/questions/batch', {
        action: 'updateDifficulty',
        ids,
        data: { difficulty: batchDifficulty.value }
      })
      ElMessage.success(`成功修改 ${ids.length} 道题目的难度`)
      batchDifficultyVisible.value = false
      selectedQuestionsRef.value = []
      loadQuestionsRef.value()
    } catch (error) {
      ElMessage.error('修改失败')
    }
  }

  const executeBatchType = async () => {
    if (!batchType.value) {
      ElMessage.warning('请选择目标类型')
      return
    }

    const ids = selectedQuestionsRef.value.map(q => q.id)
    try {
      await api.post('/questions/batch', {
        action: 'updateType',
        ids,
        data: { type: batchType.value }
      })
      ElMessage.success(`成功修改 ${ids.length} 道题目的类型`)
      batchTypeVisible.value = false
      selectedQuestionsRef.value = []
      loadQuestionsRef.value()
    } catch (error) {
      ElMessage.error('修改失败')
    }
  }

  const handleBatchMoveSubjectChange = () => {
    batchMoveSubcategoryId.value = ''
  }

  const executeBatchMove = async () => {
    const ids = selectedQuestionsRef.value.map(q => q.id)
    try {
      await api.post('/questions/batch', {
        action: 'move',
        ids,
        data: {
          subjectId: batchMoveSubjectId.value,
          subcategoryId: batchMoveSubcategoryId.value || null
        }
      })
      ElMessage.success(`成功移动 ${ids.length} 道题目`)
      batchMoveVisible.value = false
      selectedQuestionsRef.value = []
      loadQuestionsRef.value()
    } catch (error) {
      ElMessage.error('移动失败')
    }
  }

  return {
    batchDifficultyVisible,
    batchDifficulty,
    batchTypeVisible,
    batchType,
    batchMoveVisible,
    batchMoveSubjectId,
    batchMoveSubcategoryId,
    batchMoveSubcategories,
    handleBatchCommand,
    batchDeleteQuestions,
    executeBatchDifficulty,
    executeBatchType,
    handleBatchMoveSubjectChange,
    executeBatchMove
  }
}
