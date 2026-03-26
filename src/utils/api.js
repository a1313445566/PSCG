import { ElMessage } from 'element-plus'
import { getApiBaseUrl } from './database.js'
import { getCSRFToken } from './csrf.js'

/**
 * API 客户端封装类
 * 
 * 提供统一的 API 调用接口，包含：
 * - 自动重试机制（网络错误自动重试 2 次）
 * - 请求防抖（防止重复请求）
 * - 请求超时处理（默认 30 秒）
 * - CSRF Token 自动添加
 * - 统一错误处理
 * 
 * @example
 * ```js
 * import { api } from '@/utils/api'
 * 
 * // GET 请求
 * const users = await api.get('/users', { page: 1, limit: 20 })
 * 
 * // POST 请求
 * const result = await api.post('/questions', { title: '题目内容' })
 * 
 * // DELETE 请求
 * await api.delete('/questions/123')
 * 
 * // 带配置的请求
 * const result = await api.get('/users', {}, { 
 *   showError: false,  // 不显示错误提示
 *   retries: 3         // 重试 3 次
 * })
 * ```
 */
class ApiClient {
  constructor() {
    this.baseUrl = getApiBaseUrl()
    this.pending = new Map()  // 防抖：存储进行中的请求
    this.abortControllers = new Map()  // 超时控制
  }
  
  /**
   * 生成请求唯一标识（用于防抖）
   * @private
   */
  _generateKey(endpoint, options) {
    return `${options.method || 'GET'}:${endpoint}:${JSON.stringify(options.body || {})}`
  }
  
  /**
   * 延迟函数
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  /**
   * 判断是否为网络错误
   * @private
   */
  _isNetworkError(error) {
    return error.name === 'TypeError' || 
           error.message.includes('network') ||
           error.message.includes('Failed to fetch')
  }
  
  /**
   * 核心请求方法
   * @param {string} endpoint - API 端点（如 '/users'）
   * @param {Object} options - fetch 选项
   * @param {Object} config - 配置选项
   * @param {number} config.retries - 重试次数，默认 2
   * @param {boolean} config.showError - 是否显示错误提示，默认 true
   * @param {boolean} config.debounce - 是否启用防抖，默认 true
   * @param {number} config.timeout - 超时时间（毫秒），默认 30000
   * @returns {Promise} 响应数据
   */
  async request(endpoint, options = {}, config = {}) {
    const { 
      retries = 2, 
      showError = true, 
      debounce = true, 
      timeout = 30000 
    } = config
    
    // 请求防抖：相同请求正在进行时，返回同一个 Promise
    if (debounce) {
      const key = this._generateKey(endpoint, options)
      if (this.pending.has(key)) {
        return this.pending.get(key)
      }
      const promise = this._doRequest(endpoint, options, retries, showError, timeout)
      this.pending.set(key, promise)
      return promise.finally(() => this.pending.delete(key))
    }
    
    return this._doRequest(endpoint, options, retries, showError, timeout)
  }
  
  /**
   * 执行实际请求
   * @private
   */
  async _doRequest(endpoint, options, retries, showError, timeout) {
    // 创建 AbortController 用于超时和取消
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    this.abortControllers.set(endpoint, controller)
    
    try {
      // 获取 CSRF Token
      const csrfToken = await getCSRFToken()
      
      // 获取认证 Token (管理员或用户)
      const adminToken = sessionStorage.getItem('adminToken')
      const userToken = localStorage.getItem('token')
      const authToken = adminToken || userToken
      
      // 发起请求
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: { 
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
          ...options.headers 
        },
        signal: controller.signal,
        ...options
      })
      
      clearTimeout(timeoutId)
      
      // 处理 HTTP 错误
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      // 解析响应数据
      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      
      // 超时错误
      if (error.name === 'AbortError') {
        const timeoutError = new Error('请求超时，请检查网络连接')
        if (showError) ElMessage.error(timeoutError.message)
        throw timeoutError
      }
      
      // 网络错误重试
      if (retries > 0 && this._isNetworkError(error)) {
        await this._delay(1000)  // 延迟 1 秒后重试
        return this._doRequest(endpoint, options, retries - 1, showError, timeout)
      }
      
      // 显示错误提示
      if (showError) {
        ElMessage.error(error.message || '网络请求失败')
      }
      throw error
    } finally {
      this.abortControllers.delete(endpoint)
    }
  }
  
  /**
   * 取消指定请求
   * @param {string} endpoint - API 端点
   */
  cancelRequest(endpoint) {
    const controller = this.abortControllers.get(endpoint)
    if (controller) {
      controller.abort()
      this.abortControllers.delete(endpoint)
    }
  }
  
  /**
   * 取消所有请求
   */
  cancelAllRequests() {
    this.abortControllers.forEach(controller => controller.abort())
    this.abortControllers.clear()
  }
  
  /**
   * GET 请求
   * @param {string} endpoint - API 端点
   * @param {Object} params - 查询参数
   * @param {Object} config - 配置选项
   * @returns {Promise} 响应数据
   * 
   * @example
   * const users = await api.get('/users', { page: 1, limit: 20 })
   */
  async get(endpoint, params = {}, config = {}) {
    // 过滤掉 undefined 和空字符串的参数
    const searchParams = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    )
    const url = searchParams.toString() ? `${endpoint}?${searchParams}` : endpoint
    return this.request(url, { method: 'GET' }, config)
  }
  
  /**
   * POST 请求
   * @param {string} endpoint - API 端点
   * @param {Object} data - 请求数据
   * @param {Object} config - 配置选项
   * @returns {Promise} 响应数据
   * 
   * @example
   * const result = await api.post('/questions', { title: '题目内容' })
   */
  async post(endpoint, data = {}, config = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    }, config)
  }
  
  /**
   * PUT 请求
   * @param {string} endpoint - API 端点
   * @param {Object} data - 请求数据
   * @param {Object} config - 配置选项
   * @returns {Promise} 响应数据
   */
  async put(endpoint, data = {}, config = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    }, config)
  }
  
  /**
   * DELETE 请求
   * @param {string} endpoint - API 端点
   * @param {Object} config - 配置选项
   * @returns {Promise} 响应数据
   * 
   * @example
   * await api.delete('/questions/123')
   */
  async delete(endpoint, config = {}) {
    return this.request(endpoint, { method: 'DELETE' }, config)
  }
}

// 导出单例实例
export const api = new ApiClient()

// 默认导出
export default api
