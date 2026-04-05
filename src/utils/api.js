import { ElMessage } from 'element-plus'
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
 * 注意：baseUrl 固定为 /api，调用方只需传入相对路径（如 /subjects）
 *
 * @example
 * ```js
 * import { api } from '@/utils/api'
 *
 * // GET 请求
 * const users = await api.get('/subjects')
 *
 * // POST 请求
 * const result = await api.post('/questions', { title: '题目内容' })
 *
 * // DELETE 请求
 * await api.delete('/questions/123')
 * ```
 */
class ApiClient {
  constructor() {
    this.baseUrl = '/api'
    this.pending = new Map()
    this.abortControllers = new Map()
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
    return (
      error.name === 'TypeError' ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch')
    )
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
    const { retries = 2, showError = true, debounce = true, timeout = 30000 } = config

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
      // 获取 CSRF Token - 重试机制确保获取成功
      let csrfToken = await getCSRFToken()
      if (!csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(options.method || 'GET')) {
        console.warn('⚠️ CSRF Token 未就绪，尝试重新获取...')
        csrfToken = await getCSRFToken()
      }

      // 获取认证 Token (管理员或用户)
      const adminToken = sessionStorage.getItem('adminToken')
      const userToken = localStorage.getItem('token')
      const authToken = adminToken || userToken

      // 发起请求
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          ...options.headers
        },
        signal: controller.signal,
        ...options
      })

      clearTimeout(timeoutId)

      // 处理 HTTP 错误
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`
        )
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
        await this._delay(1000) // 延迟 1 秒后重试
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
    return this.request(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(data)
      },
      config
    )
  }

  /**
   * PUT 请求
   * @param {string} endpoint - API 端点
   * @param {Object} data - 请求数据
   * @param {Object} config - 配置选项
   * @returns {Promise} 响应数据
   */
  async put(endpoint, data = {}, config = {}) {
    return this.request(
      endpoint,
      {
        method: 'PUT',
        body: JSON.stringify(data)
      },
      config
    )
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

  /**
   * POST FormData 请求（用于文件上传）
   * @param {string} endpoint - API 端点
   * @param {FormData} formData - FormData 对象
   * @param {Object} config - 配置选项
   * @returns {Promise} 响应数据
   *
   * @example
   * const formData = new FormData()
   * formData.append('file', file)
   * const result = await api.postFormData('/upload', formData)
   */
  async postFormData(endpoint, formData, config = {}) {
    const { retries = 2, showError = true, timeout = 30000 } = config

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    this.abortControllers.set(endpoint, controller)

    try {
      let csrfToken = await getCSRFToken()
      if (!csrfToken) {
        console.warn('⚠️ CSRF Token 未就绪，尝试重新获取...')
        csrfToken = await getCSRFToken()
      }

      const adminToken = sessionStorage.getItem('adminToken')
      const userToken = localStorage.getItem('token')
      const authToken = adminToken || userToken

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`
        )
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        const timeoutError = new Error('请求超时，请检查网络连接')
        if (showError) ElMessage.error(timeoutError.message)
        throw timeoutError
      }

      if (retries > 0 && this._isNetworkError(error)) {
        await this._delay(1000)
        return this.postFormData(endpoint, formData, { ...config, retries: retries - 1, showError })
      }

      if (showError) {
        ElMessage.error(error.message || '网络请求失败')
      }
      throw error
    } finally {
      this.abortControllers.delete(endpoint)
    }
  }

  /**
   * SSE 流式请求
   * @param {string} endpoint - API 端点
   * @param {Object} data - 请求数据
   * @param {function} onMessage - 消息回调 (event: Object) => void
   * @param {Object} config - 配置 { timeout, signal }
   * @returns {Promise<void>}
   *
   * @example
   * await api.stream('/api/chat/sessions/123/messages', { content: '你好' }, (event) => {
   *   if (event.type === 'content') console.log(event.content)
   * })
   */
  async stream(endpoint, data, onMessage, config = {}) {
    const { timeout = 60000, signal: externalSignal } = config
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    // 获取 CSRF Token
    const csrfToken = await getCSRFToken()

    // 获取认证 Token (管理员或用户)
    const adminToken = sessionStorage.getItem('adminToken')
    const userToken = localStorage.getItem('token')
    const authToken = adminToken || userToken

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(data),
        signal: externalSignal
          ? AbortSignal.any([controller.signal, externalSignal])
          : controller.signal
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      // eslint-disable-next-line no-constant-condition -- 流式读取需要无限循环
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const payload = line.slice(6).trim()
            if (payload === '[DONE]') return
            try {
              const event = JSON.parse(payload)
              onMessage(event)
            } catch (e) {
              console.warn('Failed to parse SSE event:', e)
            }
          }
        }
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * 下载文件（返回 Blob）
   * @param {string} endpoint - API 端点
   * @param {Object} params - 查询参数
   * @param {Object} config - 配置选项
   * @returns {Promise<Blob>} Blob 数据
   *
   * @example
   * const blob = await api.download('/backup', { type: 'full' })
   * const url = URL.createObjectURL(blob)
   */
  async download(endpoint, params = {}, config = {}) {
    const { timeout = 60000 } = config

    // 过滤掉 undefined 和空字符串的参数
    const searchParams = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    )
    const url = searchParams.toString() ? `${endpoint}?${searchParams}` : endpoint

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      // 获取认证 Token (管理员或用户)
      const adminToken = sessionStorage.getItem('adminToken')
      const userToken = localStorage.getItem('token')
      const authToken = adminToken || userToken

      const response = await fetch(`${this.baseUrl}${url}`, {
        method: 'GET',
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`
        )
      }

      return await response.blob()
    } catch (error) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        throw new Error('下载超时，请检查网络连接')
      }

      throw error
    }
  }
}

// 导出单例实例
export const api = new ApiClient()

// 默认导出
export default api
