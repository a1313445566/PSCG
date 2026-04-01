/**
 * 模型管理 Composable
 * 文件: src/components/admin/models/composables/useModel.js
 * 功能: 模型 CRUD、测试连接
 */

import { ref } from 'vue'
import { api } from '@/utils/api'
import message from '@/utils/message'

export function useModel() {
  const models = ref([])
  const stats = ref({})
  const loading = ref(false)

  /**
   * 获取模型列表
   */
  async function fetchModels(page = 1, limit = 12) {
    try {
      loading.value = true
      const result = await api.get('/chat/models', { page, limit })

      if (result.success) {
        models.value = result.data.list
        return result.data
      }
    } catch (error) {
      message.error('获取模型列表失败: ' + error.message)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 保存模型（添加/更新）
   */
  async function saveModel(modelData) {
    try {
      loading.value = true
      const result = await api.post('/chat/models', modelData)

      if (result.success) {
        message.success(modelData.id ? '模型更新成功' : '模型添加成功')
        await fetchModels()
        await fetchStats()
        return result.data
      }
    } catch (error) {
      message.error('保存模型失败: ' + error.message)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除模型
   */
  async function deleteModel(modelId) {
    try {
      loading.value = true
      await api.delete(`/chat/models/${modelId}`)

      message.success('模型已删除')
      await fetchModels()
      await fetchStats()
    } catch (error) {
      message.error('删除模型失败: ' + error.message)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 测试模型连接
   */
  async function testModel(modelId) {
    try {
      const result = await api.post(`/chat/models/${modelId}/test`, {})

      if (result.success) {
        if (result.data.success) {
          message.success(result.data.message)
        } else {
          message.error(result.data.message)
        }
        return result.data
      }
    } catch (error) {
      message.error('测试连接失败: ' + error.message)
      throw error
    }
  }

  /**
   * 设为默认模型
   */
  async function setDefaultModel(modelId) {
    try {
      loading.value = true
      await api.put(`/chat/models/${modelId}/default`)

      message.success('已设为默认模型')
      await fetchModels()
      await fetchStats()
    } catch (error) {
      message.error('设置默认模型失败: ' + error.message)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取统计信息
   */
  async function fetchStats() {
    try {
      const result = await api.get('/chat/models/stats')

      if (result.success) {
        stats.value = result.data
        return result.data
      }
    } catch (error) {
      console.error('获取统计失败:', error)
    }
  }

  /**
   * 清理资源
   */
  function cleanup() {
    models.value = []
    stats.value = {}
  }

  return {
    models,
    stats,
    loading,
    fetchModels,
    saveModel,
    deleteModel,
    testModel,
    setDefaultModel,
    fetchStats,
    cleanup
  }
}
