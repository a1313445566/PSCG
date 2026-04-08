import { ref } from 'vue'
import api from '@/utils/api'
import { showMessage } from '@/utils/message'

export function useProductCards() {
  const loading = ref(false)
  const error = ref(null)

  const fetchVisibleCards = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await api.get('/product-cards')

      if (response.success) {
        return Array.isArray(response.data) ? response.data : []
      }

      console.error('[useProductCards] 获取可见卡片失败：success=false')
      return []
    } catch (err) {
      error.value = err
      console.error('[useProductCards] 获取可见卡片失败:', err)
      showMessage('加载产品卡片失败', 'error')
      return []
    } finally {
      loading.value = false
    }
  }

  const fetchAllCards = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await api.get('/admin/product-cards')

      if (response.success) {
        return Array.isArray(response.data) ? response.data : []
      }

      return []
    } catch (err) {
      error.value = err
      console.error('[useProductCards] 获取卡片列表失败:', err)
      showMessage('获取卡片列表失败', 'error')
      return []
    } finally {
      loading.value = false
    }
  }

  const createCard = async cardData => {
    loading.value = true
    error.value = null

    try {
      const response = await api.post('/admin/product-cards', cardData)

      if (response.success) {
        showMessage('卡片创建成功', 'success')
        return response.data
      }

      throw new Error(response.error || '创建失败')
    } catch (err) {
      error.value = err
      console.error('[useProductCards] 创建卡片失败:', err)
      showMessage(err.message || '创建卡片失败', 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateCard = async (id, cardData) => {
    loading.value = true
    error.value = null

    try {
      const response = await api.put(`/admin/product-cards/${id}`, cardData)

      if (response.success) {
        showMessage('卡片更新成功', 'success')
        return response.data
      }

      throw new Error(response.error || '更新失败')
    } catch (err) {
      error.value = err
      console.error('[useProductCards] 更新卡片失败:', err)
      showMessage(err.message || '更新卡片失败', 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteCard = async id => {
    loading.value = true
    error.value = null

    try {
      const response = await api.delete(`/admin/product-cards/${id}`)

      if (response.success) {
        showMessage('卡片删除成功', 'success')
        return
      }

      throw new Error(response.error || '删除失败')
    } catch (err) {
      error.value = err
      console.error('[useProductCards] 删除卡片失败:', err)
      showMessage(err.message || '删除卡片失败', 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  const uploadIcon = async file => {
    loading.value = true
    error.value = null

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post('/admin/product-cards/upload-icon', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (response.success) {
        showMessage('图标上传成功', 'success')
        return response.data
      }

      throw new Error(response.error || '上传失败')
    } catch (err) {
      error.value = err
      console.error('[useProductCards] 上传图标失败:', err)
      showMessage(err.message || '图标上传失败', 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchVisibleCards,
    fetchAllCards,
    createCard,
    updateCard,
    deleteCard,
    uploadIcon
  }
}
