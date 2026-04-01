/**
 * AI 错误处理器
 * 文件: services/chat/errorHandler.js
 * 功能: 统一错误处理、重试机制、降级策略
 */

/**
 * 错误类型定义
 */
const ErrorTypes = {
  TOOL_EXECUTION: 'TOOL_EXECUTION_ERROR',
  API_TIMEOUT: 'API_TIMEOUT_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  INVALID_INPUT: 'INVALID_INPUT_ERROR',
  DATABASE: 'DATABASE_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
}

/**
 * 自定义错误类
 */
class AgentError extends Error {
  constructor(type, message, details = {}) {
    super(message)
    this.type = type
    this.details = details
    this.timestamp = new Date().toISOString()
  }
}

/**
 * 重试装饰器（指数退避）
 */
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // 不重试的错误类型
      if (error.type === ErrorTypes.INVALID_INPUT) {
        throw error
      }

      // 最后一次不等待
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i)
        console.log(`[ErrorHandler] 重试 ${i + 1}/${maxRetries}，等待 ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

/**
 * 工具执行错误处理
 */
function handleToolError(error, toolName) {
  console.error(`[ErrorHandler] 工具 ${toolName} 执行失败:`, error)

  // 数据库错误
  if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === 'ECONNREFUSED') {
    return {
      error: '数据库连接失败，请稍后重试',
      type: ErrorTypes.DATABASE
    }
  }

  // 超时错误
  if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
    return {
      error: '查询超时，请稍后重试',
      type: ErrorTypes.API_TIMEOUT
    }
  }

  // 参数验证错误
  if (error.message.includes('validation') || error.message.includes('invalid')) {
    return {
      error: '参数格式错误，请检查输入',
      type: ErrorTypes.INVALID_INPUT
    }
  }

  // 默认错误
  return {
    error: '系统错误，请稍后重试',
    type: ErrorTypes.UNKNOWN
  }
}

/**
 * API 调用错误处理
 */
function handleAPIError(error) {
  console.error('[ErrorHandler] API 调用失败:', error)

  // OpenAI 限流
  if (error.status === 429) {
    return {
      error: '请求过于频繁，请稍后重试',
      type: ErrorTypes.RATE_LIMIT,
      retryable: true
    }
  }

  // OpenAI 超时
  if (error.status === 504 || error.code === 'ETIMEDOUT') {
    return {
      error: 'AI 响应超时，请稍后重试',
      type: ErrorTypes.API_TIMEOUT,
      retryable: true
    }
  }

  // 模型错误
  if (error.status === 400 && error.message.includes('max_tokens')) {
    return {
      error: '回答内容过长，请简化问题',
      type: ErrorTypes.INVALID_INPUT,
      retryable: false
    }
  }

  return {
    error: 'AI 服务异常，请稍后重试',
    type: ErrorTypes.UNKNOWN,
    retryable: false
  }
}

/**
 * 降级策略：返回简化的响应
 */
function fallbackResponse(originalQuery) {
  return {
    content: `抱歉，系统暂时无法处理您的请求。请稍后重试或联系管理员。`,
    error: true,
    originalQuery
  }
}

module.exports = {
  ErrorTypes,
  AgentError,
  retryWithBackoff,
  handleToolError,
  handleAPIError,
  fallbackResponse
}
