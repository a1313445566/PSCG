/**
 * 缓存配置管理
 * 实现前后台缓存分离，后台实时数据，前台长期缓存
 */

// 缓存版本号（用于强制刷新缓存）
export const CACHE_VERSION = 'v1'

// 缓存键常量（前后台分离）
export const CACHE_KEYS = {
  // 前台缓存键
  CORE_DATA: `coreData_${CACHE_VERSION}`,
  CORE_DATA_EXPIRY: `coreDataExpiry_${CACHE_VERSION}`,

  // 后台缓存键（独立，不影响前台）
  ADMIN_CORE_DATA: `adminCoreData_${CACHE_VERSION}`,
  ADMIN_CORE_DATA_EXPIRY: `adminCoreDataExpiry_${CACHE_VERSION}`
}

// 缓存时间配置（毫秒）
export const CACHE_TTL = {
  ADMIN: 5 * 60 * 1000, // 后台：5分钟
  FRONTEND: 24 * 60 * 60 * 1000 // 前台：24小时
}

/**
 * 判断是否为后台页面
 * @returns {boolean}
 */
export const isAdminPage = () => {
  return window.location.pathname.startsWith('/admin')
}

/**
 * 获取当前页面对应的缓存键
 * @returns {{ data: string, expiry: string }}
 */
export const getCacheKeys = () => {
  return isAdminPage()
    ? {
        data: CACHE_KEYS.ADMIN_CORE_DATA,
        expiry: CACHE_KEYS.ADMIN_CORE_DATA_EXPIRY
      }
    : {
        data: CACHE_KEYS.CORE_DATA,
        expiry: CACHE_KEYS.CORE_DATA_EXPIRY
      }
}

/**
 * 获取当前页面对应的缓存时间
 * @returns {number} 毫秒
 */
export const getCacheTTL = () => {
  return isAdminPage() ? CACHE_TTL.ADMIN : CACHE_TTL.FRONTEND
}

/**
 * 安全的缓存读取（带损坏检测）
 * @param {string} key
 * @returns {any|null}
 */
export const getCacheSafely = key => {
  try {
    const data = localStorage.getItem(key)
    if (!data) return null
    return JSON.parse(data)
  } catch (error) {
    console.warn(`[cacheConfig] 缓存数据损坏，已清除: ${key}`)
    localStorage.removeItem(key)
    return null
  }
}

/**
 * 安全的缓存写入
 * @param {string} key
 * @param {any} data
 * @returns {boolean}
 */
export const setCacheSafely = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    return true
  } catch (error) {
    console.warn(`[cacheConfig] 缓存写入失败: ${key}`, error)
    // 缓存空间不足时，清理旧缓存
    clearOldCache()
    return false
  }
}

/**
 * 清理旧版本缓存
 */
export const clearOldCache = () => {
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    // 清理不带版本号的旧缓存
    if (
      key &&
      (key.startsWith('coreData') || key.startsWith('adminCoreData')) &&
      !key.includes(CACHE_VERSION)
    ) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key))
  if (keysToRemove.length > 0) {
    console.log(`[cacheConfig] 已清理 ${keysToRemove.length} 个旧缓存`)
  }
}

/**
 * 清除当前页面的缓存
 */
export const clearCurrentCache = () => {
  const { data, expiry } = getCacheKeys()
  localStorage.removeItem(data)
  localStorage.removeItem(expiry)
}

/**
 * 清除所有缓存
 */
export const clearAllCache = () => {
  Object.values(CACHE_KEYS).forEach(key => localStorage.removeItem(key))
}
