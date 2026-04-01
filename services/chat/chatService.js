/**
 * AI Chat 对话服务
 * 文件: services/chat/chatService.js
 * 功能: 对话会话管理、消息存储、Token 统计
 */

const crypto = require('crypto')
const db = require('../database')
const { ErrorCodes, ChatError } = require('../../utils/chatErrors')

/**
 * 创建新会话
 */
async function createSession(adminId, modelName = null, title = '新对话') {
  const sessionId = crypto.randomUUID()
  const sql = `
    INSERT INTO chat_sessions (id, admin_id, title, model_name, message_count, updated_at)
    VALUES (?, ?, ?, ?, 0, NOW())
  `

  await db.run(sql, [sessionId, adminId, title, modelName])

  return {
    id: sessionId,
    admin_id: adminId,
    title,
    model_name: modelName,
    message_count: 0,
    created_at: new Date()
  }
}

/**
 * 获取用户的会话列表
 */
async function getSessions(adminId, page = 1, limit = 20) {
  // 确保参数是整数
  const pageNum = parseInt(page) || 1
  const limitNum = parseInt(limit) || 20
  const offset = (pageNum - 1) * limitNum

  const countSQL = 'SELECT COUNT(*) as total FROM chat_sessions WHERE admin_id = ?'
  const countResult = await db.get(countSQL, [adminId])

  // MySQL LIMIT/OFFSET 不支持占位符，直接拼接数值
  const listSQL = `
    SELECT 
      s.id, 
      s.title, 
      s.model_name,
      s.message_count,
      s.updated_at as last_message_at,
      s.created_at
    FROM chat_sessions s
    WHERE s.admin_id = ?
    ORDER BY s.updated_at DESC
    LIMIT ${limitNum} OFFSET ${offset}
  `

  const sessions = await db.query(listSQL, [adminId])

  return {
    list: sessions,
    total: countResult.total,
    page,
    limit
  }
}

/**
 * 获取会话详情
 */
async function getSession(sessionId, adminId) {
  const sql = `
    SELECT * FROM chat_sessions
    WHERE id = ? AND admin_id = ?
  `

  const session = await db.get(sql, [sessionId, adminId])

  if (!session) {
    throw new ChatError(ErrorCodes.SESSION_NOT_FOUND)
  }

  return session
}

/**
 * 获取会话历史消息
 */
async function getMessages(sessionId, adminId, page = 1, limit = 50) {
  // 验证会话归属
  await getSession(sessionId, adminId)

  // 确保参数是整数
  const pageNum = parseInt(page) || 1
  const limitNum = parseInt(limit) || 50
  const offset = (pageNum - 1) * limitNum

  const countSQL = 'SELECT COUNT(*) as total FROM chat_messages WHERE session_id = ?'
  const countResult = await db.get(countSQL, [sessionId])

  // MySQL LIMIT/OFFSET 不支持占位符，直接拼接数值
  const listSQL = `
    SELECT 
      id,
      role,
      content,
      tools_used,
      tokens,
      created_at
    FROM chat_messages
    WHERE session_id = ?
    ORDER BY created_at ASC
    LIMIT ${limitNum} OFFSET ${offset}
  `

  const messages = await db.query(listSQL, [sessionId])

  return {
    list: messages.map(msg => ({
      ...msg,
      tools_used: msg.tools_used
        ? typeof msg.tools_used === 'string'
          ? JSON.parse(msg.tools_used)
          : msg.tools_used
        : null
    })),
    total: countResult.total,
    page,
    limit
  }
}

/**
 * 保存消息
 */
async function saveMessage(sessionId, adminId, modelName, role, content, extras = {}) {
  const { tools_used, tokens = 0 } = extras

  const sql = `
    INSERT INTO chat_messages 
    (session_id, role, content, tools_used, tokens, created_at)
    VALUES (?, ?, ?, ?, ?, NOW())
  `

  const result = await db.run(sql, [
    sessionId,
    role,
    content,
    tools_used ? JSON.stringify(tools_used) : null,
    tokens
  ])

  // 更新会话统计
  await updateSessionStats(sessionId)

  return result.insertId
}

/**
 * 更新会话统计
 */
async function updateSessionStats(sessionId) {
  const sql = `
    UPDATE chat_sessions s
    SET 
      message_count = (SELECT COUNT(*) FROM chat_messages WHERE session_id = s.id),
      updated_at = NOW()
    WHERE s.id = ?
  `

  await db.run(sql, [sessionId])
}

/**
 * 删除会话
 */
async function deleteSession(sessionId, adminId) {
  // 验证会话归属
  await getSession(sessionId, adminId)

  // 删除历史消息
  await db.run('DELETE FROM chat_messages WHERE session_id = ?', [sessionId])

  // 删除会话
  await db.run('DELETE FROM chat_sessions WHERE id = ?', [sessionId])

  return true
}

/**
 * 记录 Token 使用
 */
async function recordTokenUsage(
  adminId,
  sessionId,
  modelName,
  inputTokens,
  outputTokens,
  cached = false
) {
  const totalTokens = inputTokens + outputTokens

  // 计算成本（示例：DeepSeek 价格）
  const cost = (inputTokens * 0.001 + outputTokens * 0.002) / 1000 // 假设价格

  const sql = `
    INSERT INTO token_usage 
    (admin_id, session_id, model_name, input_tokens, output_tokens, total_tokens, cost, cached, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `

  await db.run(sql, [
    adminId,
    sessionId,
    modelName,
    inputTokens,
    outputTokens,
    totalTokens,
    cost,
    cached ? 1 : 0
  ])

  return {
    inputTokens,
    outputTokens,
    totalTokens,
    cost
  }
}

/**
 * 获取 Token 统计
 */
async function getTokenStats(adminId, period = 'month') {
  let dateFilter = ''

  if (period === 'day') {
    dateFilter = 'AND DATE(created_at) = CURDATE()'
  } else if (period === 'week') {
    dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
  } else if (period === 'month') {
    dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
  }

  const sql = `
    SELECT 
      SUM(input_tokens) as total_input,
      SUM(output_tokens) as total_output,
      SUM(total_tokens) as total_tokens,
      SUM(cost) as total_cost,
      SUM(CASE WHEN cached = 1 THEN 1 ELSE 0 END) as cached_count,
      COUNT(*) as request_count
    FROM token_usage
    WHERE admin_id = ? ${dateFilter}
  `

  const stats = await db.get(sql, [adminId])

  return {
    totalInput: parseInt(stats?.total_input) || 0,
    totalOutput: parseInt(stats?.total_output) || 0,
    totalTokens: parseInt(stats?.total_tokens) || 0,
    totalCost: parseFloat(stats?.total_cost) || 0,
    cachedCount: parseInt(stats?.cached_count) || 0,
    requestCount: parseInt(stats?.request_count) || 0,
    period
  }
}

module.exports = {
  createSession,
  getSessions,
  getSession,
  getMessages,
  saveMessage,
  updateSessionStats,
  deleteSession,
  recordTokenUsage,
  getTokenStats
}
