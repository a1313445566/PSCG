/**
 * 分页工具函数
 *
 * 统一处理分页参数计算，避免在各路由中重复代码
 */

/**
 * 计算分页参数
 * @param {string|number} page - 页码（从1开始）
 * @param {string|number} limit - 每页条数
 * @param {Object} options - 配置选项
 * @param {number} options.maxLimit - 最大允许的每页条数，默认100
 * @param {number} options.defaultLimit - 默认每页条数，默认20
 * @returns {Object} 分页参数 { pageNum, limitNum, offset }
 *
 * @example
 * const { pageNum, limitNum, offset } = getPaginationParams(req.query.page, req.query.limit)
 * const sql = `SELECT * FROM users LIMIT ${limitNum} OFFSET ${offset}`
 */
function getPaginationParams(page, limit, options = {}) {
  const { maxLimit = 100, defaultLimit = 20 } = options

  // 解析页码，确保至少为1
  const pageNum = Math.max(1, parseInt(page) || 1)

  // 解析每页条数，限制范围在 1-maxLimit 之间
  let limitNum = parseInt(limit) || defaultLimit
  limitNum = Math.max(1, Math.min(limitNum, maxLimit))

  // 计算偏移量
  const offset = (pageNum - 1) * limitNum

  return { pageNum, limitNum, offset }
}

/**
 * 生成分页响应数据
 * @param {Array} data - 当前页数据
 * @param {number} total - 总记录数
 * @param {number} pageNum - 当前页码
 * @param {number} limitNum - 每页条数
 * @returns {Object} 分页响应对象 { data, total, page, limit, totalPages }
 *
 * @example
 * const result = buildPaginationResponse(records, total, pageNum, limitNum)
 * res.json(result)
 */
function buildPaginationResponse(data, total, pageNum, limitNum) {
  return {
    data,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum)
  }
}

/**
 * 验证分页参数是否有效
 * @param {number} pageNum - 页码
 * @param {number} limitNum - 每页条数
 * @param {number} offset - 偏移量
 * @returns {boolean} 是否有效
 */
function validatePaginationParams(pageNum, limitNum, offset) {
  return (
    Number.isInteger(pageNum) &&
    Number.isInteger(limitNum) &&
    Number.isInteger(offset) &&
    pageNum > 0 &&
    limitNum > 0
  )
}

module.exports = {
  getPaginationParams,
  buildPaginationResponse,
  validatePaginationParams
}
