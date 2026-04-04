import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../utils/api'

export function useQuestionPreview(props, options = {}) {
  const { editQuestion, currentSubjectName, currentSubcategoryName, getTypeName } = options

  // 预览
  const previewVisible = ref(false)
  const previewData = ref(null)
  const previewLoading = ref(false)
  const previewCache = new Map()

  // 预览题目
  const previewQuestion = async row => {
    // 检查缓存
    if (previewCache.has(row.id)) {
      previewData.value = previewCache.get(row.id)
      previewVisible.value = true
      return
    }

    previewLoading.value = true
    previewVisible.value = true
    previewData.value = null

    try {
      const data = await api.get(`/questions/${row.id}`)

      const previewInfo = {
        ...data,
        subjectName:
          currentSubjectName?.value || props.subjects.find(s => s.id == data.subjectId)?.name || '',
        subcategoryName:
          currentSubcategoryName?.value ||
          props.subjects
            .find(s => s.id == data.subjectId)
            ?.subcategories?.find(sc => sc.id == data.subcategoryId)?.name ||
          '',
        typeName: getTypeName(data.type)
      }

      // 缓存预览数据（最多缓存50条）
      if (previewCache.size >= 50) {
        const firstKey = previewCache.keys().next().value
        previewCache.delete(firstKey)
      }
      previewCache.set(row.id, previewInfo)

      previewData.value = previewInfo
    } catch (error) {
      previewVisible.value = false
      ElMessage.error('获取题目详情失败')
    } finally {
      previewLoading.value = false
    }
  }

  // 显示图片预览
  const showImagePreview = row => {
    const url = extractImageUrl(row)
    if (url) {
      window.open(url, '_blank')
    }
  }

  // 从预览编辑
  const handleEditFromPreview = () => {
    editQuestion(previewData.value)
    previewVisible.value = false
  }

  // 辅助方法
  const extractImageUrl = row => {
    if (row.image) return row.image
    if (row.image_url) return row.image_url
    if (typeof row.content !== 'string') return ''
    const match = row.content.match(/<img[^>]+src="([^"]+)"/)
    return match ? match[1] : ''
  }

  // 清理预览缓存
  const clearPreviewCache = () => {
    previewCache.clear()
  }

  return {
    // 状态
    previewVisible,
    previewData,
    previewLoading,
    previewCache,

    // 方法
    previewQuestion,
    handleEditFromPreview,
    showImagePreview,
    clearPreviewCache
  }
}
