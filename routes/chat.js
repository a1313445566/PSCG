/**
 * AI Chat 路由
 * 文件: routes/chat.js
 * 功能: 聊天接口、模型管理接口、SSE 流式对话
 */

const express = require('express')
const router = express.Router()
const adminAuth = require('../middleware/adminAuth')
const chatService = require('../services/chat/chatService')
const modelManager = require('../services/chat/modelManager')
const cacheService = require('../services/chat/cacheService')
const { createChatAgent, streamAgentResponse } = require('../services/chat/agent')
const { compressHistory } = require('../services/chat/contextCompressor')
const { ErrorCodes, ChatError, handleChatError } = require('../utils/chatErrors')

// ==================== 模型管理接口 ====================

/**
 * GET /api/chat/models
 * 获取模型列表（分页）
 */
router.get('/models', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query
    const result = await modelManager.getModels(parseInt(page), parseInt(limit))
    res.json({ success: true, data: result })
  } catch (error) {
    handleChatError(error, res)
  }
})

/**
 * POST /api/chat/models
 * 添加或更新模型
 */
router.post('/models', adminAuth, async (req, res) => {
  try {
    const { id, name, provider, base_url, api_key, model_id, config, is_active } = req.body

    // 输入验证
    if (!name || !provider || !base_url || !model_id) {
      return res.status(400).json({ error: '缺少必填字段' })
    }

    const result = await modelManager.saveModel({
      id,
      name,
      provider,
      base_url,
      api_key,
      model_id,
      config,
      is_active
    })

    res.json({ success: true, data: result })
  } catch (error) {
    handleChatError(error, res)
  }
})

/**
 * DELETE /api/chat/models/:id
 * 删除模型
 */
router.delete('/models/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params
    await modelManager.deleteModel(parseInt(id))
    res.json({ success: true, data: null })
  } catch (error) {
    handleChatError(error, res)
  }
})

/**
 * POST /api/chat/models/:id/test
 * 测试模型连接
 */
router.post('/models/:id/test', adminAuth, async (req, res) => {
  try {
    const { id } = req.params
    const result = await modelManager.testModelConnection(parseInt(id))
    res.json({ success: true, data: result })
  } catch (error) {
    handleChatError(error, res)
  }
})

/**
 * PUT /api/chat/models/:id/default
 * 设为默认模型
 */
router.put('/models/:id/default', adminAuth, async (req, res) => {
  try {
    const { id } = req.params
    await modelManager.setDefaultModel(parseInt(id))
    res.json({ success: true, data: null })
  } catch (error) {
    handleChatError(error, res)
  }
})

/**
 * GET /api/chat/models/stats
 * 获取模型统计信息
 */
router.get('/models/stats', adminAuth, async (req, res) => {
  try {
    const stats = await modelManager.getModelStats()
    res.json({ success: true, data: stats })
  } catch (error) {
    handleChatError(error, res)
  }
})

// ==================== 会话管理接口 ====================

/**
 * POST /api/chat/sessions
 * 创建新会话
 */
router.post('/sessions', adminAuth, async (req, res) => {
  try {
    const { modelId, title } = req.body
    const adminId = req.admin.id

    const session = await chatService.createSession(adminId, modelId, title)
    res.json({ success: true, data: { session } })
  } catch (error) {
    handleChatError(error, res)
  }
})

/**
 * GET /api/chat/sessions
 * 获取会话列表（分页）
 */
router.get('/sessions', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const adminId = req.admin.id

    const result = await chatService.getSessions(adminId, parseInt(page), parseInt(limit))
    res.json({ success: true, data: result })
  } catch (error) {
    handleChatError(error, res)
  }
})

/**
 * DELETE /api/chat/sessions/:id
 * 删除会话
 */
router.delete('/sessions/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params
    const adminId = req.admin.id

    await chatService.deleteSession(id, adminId)
    res.json({ success: true, data: null })
  } catch (error) {
    handleChatError(error, res)
  }
})

/**
 * GET /api/chat/sessions/:id/messages
 * 获取会话历史消息（分页）
 */
router.get('/sessions/:id/messages', adminAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { page = 1, limit = 50 } = req.query
    const adminId = req.admin.id

    const result = await chatService.getMessages(id, adminId, parseInt(page), parseInt(limit))
    res.json({ success: true, data: result })
  } catch (error) {
    handleChatError(error, res)
  }
})

/**
 * POST /api/chat/sessions/:id/messages
 * 发送消息（SSE 流式响应）
 */
router.post('/sessions/:id/messages', adminAuth, async (req, res) => {
  try {
    const { id: sessionId } = req.params
    const { content } = req.body
    const adminId = req.admin.id

    // 调试日志
    console.log('[Chat] 收到消息请求:', {
      sessionId,
      adminId,
      content: content?.substring(0, 50)
    })

    // 输入验证
    if (!content || content.trim().length === 0) {
      throw new ChatError(ErrorCodes.INVALID_QUERY)
    }

    if (content.length > 2000) {
      throw new ChatError(ErrorCodes.QUERY_TOO_LONG)
    }

    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    })

    // 发送 SSE 消息的辅助函数
    const sendEvent = data => {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    try {
      // 1. 检查缓存（开发环境禁用）
      const isDevelopment = process.env.NODE_ENV !== 'production'

      if (!isDevelopment) {
        const cached = await cacheService.getCachedResponse(content)
        if (cached.found) {
          sendEvent({ type: 'thinking', message: '从缓存中找到答案...' })

          // cached.response 可能是字符串或对象
          const cachedResponse =
            typeof cached.response === 'string' ? JSON.parse(cached.response) : cached.response
          sendEvent({ type: 'content', content: cachedResponse.content })

          sendEvent({
            type: 'done',
            tokens: { input: 0, output: 0, cached: true }
          })

          res.write('data: [DONE]\n\n')
          res.end()

          // 记录 Token 使用
          await chatService.recordTokenUsage(adminId, sessionId, null, 0, 0, true)
          return
        }
      }

      // 2. 获取会话和模型配置
      const session = await chatService.getSession(sessionId, adminId)
      const model = session.model_id
        ? await modelManager.getModel(session.model_id)
        : await modelManager.getDefaultModel()

      if (!model) {
        throw new ChatError(ErrorCodes.MODEL_NOT_FOUND)
      }

      // 3. 保存用户消息
      await chatService.saveMessage(sessionId, adminId, model.id, 'user', content)

      // 4. 获取历史消息并压缩
      const historyResult = await chatService.getMessages(sessionId, adminId, 1, 100)
      const compressedHistory = compressHistory(
        historyResult.list.map(m => ({
          role: m.role,
          content: m.content
        }))
      )

      // 5. 创建 Agent
      sendEvent({ type: 'thinking', message: '正在分析您的问题...' })
      const agent = createChatAgent(model)

      // 6. 流式调用 Agent（返回真实 Token 数据）
      let fullResponse = ''
      let tokenUsage = { input: 0, output: 0 }

      const result = await streamAgentResponse(
        agent,
        [...compressedHistory, { role: 'user', content }],
        event => {
          sendEvent(event)

          if (event.type === 'content') {
            fullResponse += event.content
          }

          // 捕获 Token 使用数据
          if (event.type === 'done' && event.tokens) {
            tokenUsage = event.tokens
          }
        }
      )

      // 如果 Agent 返回了 Token 数据，使用真实数据
      if (result && result.tokens) {
        tokenUsage = result.tokens
      }

      // 7. 保存助手消息
      await chatService.saveMessage(sessionId, adminId, model.id, 'assistant', fullResponse)

      // 8. 保存到缓存（开发环境不保存）
      if (!isDevelopment) {
        await cacheService.setCachedResponse(content, JSON.stringify({ content: fullResponse }))
      }

      // 9. 记录真实 Token 使用（来自 OpenAI API）
      await chatService.recordTokenUsage(
        adminId,
        sessionId,
        model.name,
        tokenUsage.input,
        tokenUsage.output
      )

      // 10. 发送完成信号（真实 Token 数据）
      sendEvent({
        type: 'done',
        tokens: tokenUsage
      })

      res.write('data: [DONE]\n\n')
      res.end()
    } catch (error) {
      console.error('[Chat] Agent 调用失败:', error)
      sendEvent({
        type: 'error',
        code: ErrorCodes.MODEL_UNAVAILABLE.code,
        message: error.message || 'AI 模型调用失败',
        suggestion: '请检查模型配置或稍后重试'
      })
      res.end()
    }
  } catch (error) {
    handleChatError(error, res)
  }
})

// ==================== 统计接口 ====================

/**
 * GET /api/chat/token-stats
 * 获取 Token 使用统计
 */
router.get('/token-stats', adminAuth, async (req, res) => {
  try {
    const { period = 'month' } = req.query
    const adminId = req.admin.id

    const stats = await chatService.getTokenStats(adminId, period)
    res.json({ success: true, data: stats })
  } catch (error) {
    handleChatError(error, res)
  }
})

/**
 * GET /api/chat/cache-stats
 * 获取缓存命中统计
 */
router.get('/cache-stats', adminAuth, async (req, res) => {
  try {
    const stats = await cacheService.getCacheStats()
    res.json({ success: true, data: stats })
  } catch (error) {
    handleChatError(error, res)
  }
})

module.exports = router
