/**
 * AI Chat 会话管理 Composable
 * 文件: src/components/admin/chat/composables/useChat.js
 * 功能: 会话 CRUD、消息管理
 */

import { ref } from 'vue'
import { api } from '@/utils/api'
import message from '@/utils/message'

export function useChat() {
  const sessions = ref([])
  const currentSession = ref(null)
  const messages = ref([])
  const loading = ref(false)

  /**
   * 创建新会话
   */
  async function createSession(modelId = null, title = '新对话') {
    try {
      loading.value = true
      const result = await api.post('/chat/sessions', { modelId, title })

      if (result.success) {
        sessions.value.unshift(result.data.session)
        currentSession.value = result.data.session
        messages.value = []
        return result.data.session
      }
    } catch (error) {
      message.error('创建会话失败: ' + error.message)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取会话列表
   */
  async function fetchSessions(page = 1, limit = 20) {
    try {
      loading.value = true
      const result = await api.get('/chat/sessions', { page, limit })

      if (result.success) {
        sessions.value = result.data.list
        return result.data
      }
    } catch (error) {
      message.error('获取会话列表失败: ' + error.message)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 选择会话并加载消息
   */
  async function selectSession(sessionId) {
    try {
      loading.value = true

      // 获取会话消息
      const result = await api.get(`/chat/sessions/${sessionId}/messages`)

      if (result.success) {
        currentSession.value = sessions.value.find(s => s.id === sessionId)
        messages.value = result.data.list
      }
    } catch (error) {
      message.error('加载会话失败: ' + error.message)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除会话
   */
  async function deleteSession(sessionId) {
    try {
      loading.value = true
      await api.delete(`/chat/sessions/${sessionId}`)

      sessions.value = sessions.value.filter(s => s.id !== sessionId)

      if (currentSession.value?.id === sessionId) {
        currentSession.value = null
        messages.value = []
      }

      message.success('会话已删除')
    } catch (error) {
      message.error('删除会话失败: ' + error.message)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 添加消息到列表
   */
  function addMessage(message) {
    messages.value.push({
      id: Date.now(),
      role: message.role,
      content: message.content,
      created_at: new Date()
    })
  }

  /**
   * 更新最后一条消息
   */
  function updateLastMessage(content) {
    if (messages.value.length > 0) {
      messages.value[messages.value.length - 1].content += content
    }
  }

  /**
   * 清理资源
   */
  function cleanup() {
    sessions.value = []
    currentSession.value = null
    messages.value = []
  }

  return {
    sessions,
    currentSession,
    messages,
    loading,
    createSession,
    fetchSessions,
    selectSession,
    deleteSession,
    addMessage,
    updateLastMessage,
    cleanup
  }
}
