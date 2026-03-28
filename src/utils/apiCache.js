// API 请求缓存工具

class ApiCache {
  constructor() {
    this.cache = new Map()
    this.defaultTTL = 5 * 60 * 1000 // 默认缓存时间 5 分钟
  }

  /**
   * 生成缓存键
   * @param {string} url - 请求 URL
   * @param {object} options - 请求选项
   * @returns {string} 缓存键
   */
  generateKey(url, options = {}) {
    const { method = 'GET', body } = options
    let key = `${method}:${url}`
    if (body) {
      key += `:${typeof body === 'string' ? body : JSON.stringify(body)}`
    }
    return key
  }

  /**
   * 获取缓存数据
   * @param {string} key - 缓存键
   * @returns {any|null} 缓存的数据，如果不存在或已过期则返回 null
   */
  get(key) {
    const cachedItem = this.cache.get(key)
    if (!cachedItem) return null

    const { data, expiry } = cachedItem
    if (Date.now() > expiry) {
      this.cache.delete(key)
      return null
    }

    return data
  }

  /**
   * 设置缓存数据
   * @param {string} key - 缓存键
   * @param {any} data - 要缓存的数据
   * @param {number} ttl - 缓存时间（毫秒）
   */
  set(key, data, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl
    this.cache.set(key, { data, expiry })
  }

  /**
   * 清除指定缓存
   * @param {string} key - 缓存键
   */
  delete(key) {
    this.cache.delete(key)
  }

  /**
   * 清除所有缓存
   */
  clear() {
    this.cache.clear()
  }

  /**
   * 清除过期的缓存
   */
  clearExpired() {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 清除匹配模式的缓存
   * @param {string} pattern - 匹配模式（例如：'GET:/api/subjects'）
   */
  clearPattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 缓存的 fetch 方法
   * @param {string} url - 请求 URL
   * @param {object} options - 请求选项
   * @param {number} ttl - 缓存时间（毫秒）
   * @returns {Promise<any>} 请求结果
   */
  async fetch(url, options = {}, ttl = this.defaultTTL) {
    const key = this.generateKey(url, options)

    // 检查缓存
    const cachedData = this.get(key)
    if (cachedData) {
      return cachedData
    }

    // 发送请求
    try {
      const response = await fetch(url, options)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      // 缓存响应
      this.set(key, data, ttl)
      return data
    } catch (error) {
      // console.error('Fetch error:', error);
      throw error
    }
  }

  /**
   * 缓存的 GET 请求
   * @param {string} url - 请求 URL
   * @param {number} ttl - 缓存时间（毫秒）
   * @returns {Promise<any>} 请求结果
   */
  async getCached(url, ttl = this.defaultTTL) {
    return this.fetch(url, { method: 'GET' }, ttl)
  }

  /**
   * 缓存的 POST 请求
   * @param {string} url - 请求 URL
   * @param {any} body - 请求体
   * @param {number} ttl - 缓存时间（毫秒）
   * @returns {Promise<any>} 请求结果
   */
  async post(url, body, ttl = this.defaultTTL) {
    return this.fetch(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      },
      ttl
    )
  }
}

// 导出单例
export const apiCache = new ApiCache()

// 导出缓存工具类
export default ApiCache
