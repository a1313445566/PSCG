/**
 * 上下文压缩服务
 * 文件: services/chat/contextCompressor.js
 * 功能: 压缩对话历史，减少 Token 消耗
 */

/**
 * 压缩策略：
 * 1. 保留最近 5 轮对话
 * 2. 早期对话摘要压缩
 * 3. 工具调用结果简化
 */

const MAX_HISTORY_LENGTH = 10
const KEEP_RECENT_TURNS = 5

/**
 * 压缩对话历史
 * @param {Array} messages - 对话历史
 * @returns {Array} 压缩后的消息
 */
function compressHistory(messages) {
  if (!messages || messages.length <= MAX_HISTORY_LENGTH) {
    return messages
  }

  // 分割：保留最近对话 + 压缩早期对话
  const recentMessages = messages.slice(-KEEP_RECENT_TURNS * 2) // 保留最近5轮(用户+助手)
  const oldMessages = messages.slice(0, -KEEP_RECENT_TURNS * 2)

  // 压缩早期对话
  const compressedSummary = compressMessages(oldMessages)

  // 组合：系统消息 + 压缩摘要 + 最近对话
  const result = []

  // 保留系统消息
  if (messages[0]?.role === 'system') {
    result.push(messages[0])
  }

  // 添加压缩摘要
  if (compressedSummary) {
    result.push({
      role: 'system',
      content: `【历史对话摘要】\n${compressedSummary}`
    })
  }

  // 添加最近对话
  result.push(...recentMessages)

  return result
}

/**
 * 压缩消息列表为摘要
 */
function compressMessages(messages) {
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content)
  const assistantMessages = messages.filter(m => m.role === 'assistant').map(m => m.content)

  // 提取关键信息
  const topics = extractTopics(userMessages)
  const keyResults = extractKeyResults(assistantMessages)

  // 生成摘要
  let summary = ''

  if (topics.length > 0) {
    summary += `讨论主题: ${topics.join(', ')}。`
  }

  if (keyResults.length > 0) {
    summary += `关键结论: ${keyResults.join('; ')}。`
  }

  return summary
}

/**
 * 提取讨论主题
 */
function extractTopics(messages) {
  const keywords = []
  const topicPatterns = [
    /查询(\S+)/g,
    /分析(\S+)/g,
    /统计(\S+)/g,
    /(\d+)年级/g,
    /(\S+)班/g,
    /学科(\d+)/g
  ]

  for (const msg of messages) {
    for (const pattern of topicPatterns) {
      const matches = msg.match(pattern)
      if (matches) {
        keywords.push(...matches)
      }
    }
  }

  // 去重并限制数量
  return [...new Set(keywords)].slice(0, 5)
}

/**
 * 提取关键结果
 */
function extractKeyResults(messages) {
  const results = []

  for (const msg of messages) {
    // 提取数字统计结果
    const numberPattern = /(\d+\.?\d*)\s*(人|次|题|%|分)/g
    const matches = msg.match(numberPattern)
    if (matches) {
      results.push(...matches.slice(0, 3)) // 每条消息最多3个关键数字
    }
  }

  return results.slice(0, 5)
}

/**
 * 简化工具调用结果
 */
function simplifyToolResult(result) {
  try {
    const parsed = JSON.parse(result)

    if (parsed.success && parsed.data) {
      // 只返回关键信息
      const simplified = {
        success: true,
        count: parsed.count || parsed.data.length || 0
      }

      // 如果是列表数据，只返回前3条
      if (Array.isArray(parsed.data) && parsed.data.length > 3) {
        simplified.data = parsed.data.slice(0, 3)
        simplified.truncated = true
      } else {
        simplified.data = parsed.data
      }

      return JSON.stringify(simplified)
    }

    return result
  } catch {
    return result
  }
}

/**
 * 估算 Token 数量（简单估算）
 */
function estimateTokens(messages) {
  let totalChars = 0

  for (const msg of messages) {
    totalChars += (msg.content || '').length
  }

  // 粗略估算：中文约 1.5 字符/token，英文约 4 字符/token
  return Math.ceil(totalChars / 2)
}

module.exports = {
  compressHistory,
  compressMessages,
  simplifyToolResult,
  estimateTokens,
  MAX_HISTORY_LENGTH,
  KEEP_RECENT_TURNS
}
