/**
 * AI Chat 错误码定义
 * 文件: utils/chatErrors.js
 * 功能: 统一的 AI 对话系统错误码
 */

const ErrorCodes = {
  // 1xxx - 客户端错误
  INVALID_QUERY: { code: 1001, message: '无效的查询内容' },
  QUERY_TOO_LONG: { code: 1002, message: '查询内容过长（最多2000字）' },
  SESSION_NOT_FOUND: { code: 1003, message: '会话不存在' },
  MODEL_NOT_FOUND: { code: 1004, message: '模型不存在' },
  RATE_LIMIT_EXCEEDED: { code: 1005, message: '请求过于频繁，请稍后再试' },

  // 2xxx - AI 模型错误
  MODEL_UNAVAILABLE: { code: 2001, message: 'AI模型不可用' },
  MODEL_TIMEOUT: { code: 2002, message: 'AI响应超时' },
  MODEL_RATE_LIMIT: { code: 2003, message: 'AI服务繁忙' },
  MODEL_CONFIG_ERROR: { code: 2004, message: '模型配置错误' },
  MODEL_CONNECTION_FAILED: { code: 2005, message: '模型连接失败' },

  // 3xxx - 工具执行错误
  TOOL_NOT_FOUND: { code: 3001, message: '工具不存在' },
  TOOL_EXECUTION_ERROR: { code: 3002, message: '工具执行失败' },
  TOOL_PARAM_ERROR: { code: 3003, message: '工具参数错误' },

  // 5xxx - 系统错误
  DATABASE_ERROR: { code: 5001, message: '数据库查询失败' },
  CACHE_ERROR: { code: 5002, message: '缓存服务异常' },
  INTERNAL_ERROR: { code: 5003, message: '内部服务错误' }
}

/**
 * 创建 Chat 错误
 */
class ChatError extends Error {
  constructor(errorCode, details = {}) {
    const { code, message } = errorCode
    super(message)
    this.code = code
    this.details = details
    this.name = 'ChatError'
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      details: this.details
    }
  }
}

/**
 * 错误处理辅助函数
 */
function handleChatError(error, res) {
  console.error('[Chat Error]', error)

  if (error instanceof ChatError) {
    return res.status(400).json(error.toJSON())
  }

  // 未知错误
  return res.status(500).json({
    error: '服务内部错误',
    code: 5003
  })
}

module.exports = {
  ErrorCodes,
  ChatError,
  handleChatError
}
