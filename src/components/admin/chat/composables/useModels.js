/**
 * AI 模型管理 Composable
 * 文件: src/components/admin/chat/composables/useModels.js
 * 功能: 获取模型列表、切换模型
 */

import { ref } from 'vue'
import { api } from '@/utils/api'
import message from '@/utils/message'

export function useModels() {
  const models = ref([])
  const defaultModel = ref(null)
  const loading = ref(false)

  /**
   * 获取模型列表
   */
  async function fetchModels() {
    try {
      loading.value = true
      const result = await api.get('/chat/models')

      if (result.success) {
        models.value = result.data.list
        // 找到默认模型
        defaultModel.value = models.value.find(m => m.is_default) || models.value[0]
        return result.data.list
      }
    } catch (error) {
      console.error('获取模型列表失败:', error)
      // 不显示错误提示，因为可能还没配置模型
    } finally {
      loading.value = false
    }
  }

  /**
   * 根据ID获取模型
   */
  function getModelById(modelId) {
    if (!modelId) return defaultModel.value
    return models.value.find(m => m.id === modelId) || defaultModel.value
  }

  return {
    models,
    defaultModel,
    loading,
    fetchModels,
    getModelById
  }
}
