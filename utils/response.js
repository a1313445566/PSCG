/**
 * 统一响应格式工具
 *
 * 提供标准的 API 响应格式，减少重复代码
 */

/**
 * 成功响应
 * @param {Object} res - Express response 对象
 * @param {*} data - 响应数据
 * @param {string} message - 成功消息（可选）
 */
function success(res, data, message) {
  const response = { success: true }
  if (data !== undefined) response.data = data
  if (message) response.message = message
  return res.json(response)
}

/**
 * 错误响应
 * @param {Object} res - Express response 对象
 * @param {string} message - 错误消息
 * @param {number} status - HTTP 状态码，默认500
 */
function error(res, message, status = 500) {
  return res.status(status).json({
    error: message,
    success: false
  })
}

/**
 * 参数验证错误响应
 * @param {Object} res - Express response 对象
 * @param {string} message - 错误消息
 */
function badRequest(res, message) {
  return error(res, message, 400)
}

/**
 * 未找到资源响应
 * @param {Object} res - Express response 对象
 * @param {string} resource - 资源名称
 */
function notFound(res, resource = '资源') {
  return error(res, `${resource}不存在`, 404)
}

/**
 * 未授权响应
 * @param {Object} res - Express response 对象
 * @param {string} message - 错误消息
 */
function unauthorized(res, message = '未授权访问') {
  return error(res, message, 401)
}

/**
 * 异步路由处理器包装器
 * 自动捕获错误并返回统一格式
 * @param {Function} fn - 异步路由处理函数
 * @returns {Function} 包装后的路由处理函数
 *
 * @example
 * router.get('/users', wrapAsync(async (req, res) => {
 *   const users = await db.all('SELECT * FROM users')
 *   return res.json({ data: users })
 * }))
 */
function wrapAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(err => {
      console.error(`[API Error] ${req.method} ${req.path}:`, err)
      return error(res, err.message || '服务器内部错误')
    })
  }
}

module.exports = {
  success,
  error,
  badRequest,
  notFound,
  unauthorized,
  wrapAsync
}
