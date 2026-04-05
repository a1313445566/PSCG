/**
 * 安全监控服务
 * 提供安全日志记录、IP 封禁管理等功能
 */

const db = require('./database')

const createSecurityLogsTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS security_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(50) NOT NULL COMMENT '操作类型: block, unblock, batch_block, unblock_all',
      ip VARCHAR(100) NOT NULL COMMENT 'IP 地址',
      duration INT COMMENT '封禁时长（毫秒）',
      reason TEXT COMMENT '封禁/解封原因',
      operator VARCHAR(100) NOT NULL COMMENT '操作人（管理员用户名）',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
      metadata TEXT COMMENT '其他元数据（JSON 格式）',
      INDEX idx_timestamp (timestamp),
      INDEX idx_ip (ip),
      INDEX idx_operator (operator),
      INDEX idx_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='安全监控操作日志'
  `

  try {
    await db.run(createTableSQL)
    console.log('✅ 安全监控操作日志表已准备就绪')
  } catch (error) {
    console.error('❌ 创建安全监控操作日志表失败:', error)
  }
}

const logSecurityOperation = async logData => {
  const { type, ip, duration, reason, operator, metadata } = logData

  const sql = `
    INSERT INTO security_logs (type, ip, duration, reason, operator, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  `

  try {
    await db.run(sql, [
      type,
      ip,
      duration || null,
      reason || null,
      operator,
      metadata ? JSON.stringify(metadata) : null
    ])
  } catch (error) {
    console.error('[安全监控] 记录操作日志失败:', error)
  }
}

const isValidIP = ip => {
  if (!ip || typeof ip !== 'string') return false

  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
  const ipv4Match = ip.match(ipv4Regex)
  if (ipv4Match) {
    const nums = ipv4Match.slice(1, 5).map(Number)
    return nums.every(n => n >= 0 && n <= 255)
  }

  const ipv6FullRegex = /^[0-9a-fA-F]{1,4}(:[0-9a-fA-F]{1,4}){7}$/
  const ipv6CompressedRegex =
    /^(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?::(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?$/

  return ipv6FullRegex.test(ip) || ipv6CompressedRegex.test(ip)
}

const getSecurityLogs = async (page = 1, limit = 20, filters = {}) => {
  const { type, ip, operator } = filters

  let whereClause = 'WHERE 1=1'
  const params = []

  if (type) {
    whereClause += ' AND type = ?'
    params.push(type)
  }
  if (ip) {
    whereClause += ' AND ip LIKE ?'
    params.push(`%${ip}%`)
  }
  if (operator) {
    whereClause += ' AND operator LIKE ?'
    params.push(`%${operator}%`)
  }

  const countSQL = `SELECT COUNT(*) as total FROM security_logs ${whereClause}`
  const countResult = await db.get(countSQL, params)

  const limitNum = Number(limit)
  const offsetNum = (Number(page) - 1) * limitNum
  const logsSQL = `
    SELECT * FROM security_logs
    ${whereClause}
    ORDER BY timestamp DESC
    LIMIT ${limitNum} OFFSET ${offsetNum}
  `
  const logs = await db.query(logsSQL, params)

  return {
    logs: logs || [],
    total: countResult.total,
    page: parseInt(page),
    limit: parseInt(limit)
  }
}

module.exports = {
  createSecurityLogsTable,
  logSecurityOperation,
  isValidIP,
  getSecurityLogs
}
