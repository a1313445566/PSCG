/**
 * SSE 流式对话 Composable
 * 文件: src/components/admin/chat/composables/useStream.js
 * 功能: 处理 SSE 流式响应
 */

import { ref } from 'vue'
import { api } from '@/utils/api'
import message from '@/utils/message'

export function useStream() {
  const isStreaming = ref(false)
  let abortController = null

  /**
   * 发送消息并接收流式响应
   */
  async function sendMessage(sessionId, content, callbacks = {}) {
    isStreaming.value = true

    // 创建 AbortController
    abortController = new AbortController()

    try {
      await api.stream(
        `/chat/sessions/${sessionId}/messages`,
        { content },
        event => {
          switch (event.type) {
            case 'thinking':
              callbacks.onThinking?.(event.message)
              break

            case 'tool_call':
              callbacks.onToolCall?.(event.tool, event.params, event.result)
              break

            case 'tool_result':
              callbacks.onToolResult?.(event.summary)
              break

            case 'content':
              callbacks.onContent?.(event.content)
              break

            case 'done':
              callbacks.onDone?.(event.tokens)
              break

            case 'error':
              callbacks.onError?.(event)
              message.error(event.message || 'AI 响应失败')
              break
          }
        },
        { signal: abortController.signal, timeout: 120000 } // 增加到 120 秒
      )
    } catch (error) {
      message.error(error.message || '连接失败')
      callbacks.onError?.({ message: error.message })
    } finally {
      isStreaming.value = false
      abortController = null
    }
  }

  /**
   * 中断流式响应
   */
  function abort() {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    isStreaming.value = false
  }

  return {
    sendMessage,
    abort,
    isStreaming
  }
}
