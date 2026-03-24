/**
 * CSRF Token 管理工具
 * 用于前端请求时携带 CSRF Token
 */

let cachedToken = null;
let tokenExpiry = 0;
const TOKEN_REFRESH_INTERVAL = 1.5 * 60 * 60 * 1000; // 1.5小时刷新

/**
 * 获取 CSRF Token
 * @returns {Promise<string|null>}
 */
export async function getCSRFToken() {
  // 检查缓存的 Token 是否有效
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  
  try {
    const response = await fetch('/api/csrf-token', {
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      console.error('获取CSRF Token失败:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.success && data.csrfToken) {
      cachedToken = data.csrfToken;
      tokenExpiry = Date.now() + TOKEN_REFRESH_INTERVAL;
      return cachedToken;
    }
    
    return null;
  } catch (error) {
    console.error('获取CSRF Token失败:', error);
    return null;
  }
}

/**
 * 带 CSRF Token 的请求
 * @param {string} url - 请求URL
 * @param {Object} options - fetch 选项
 * @returns {Promise<Response>}
 */
export async function secureFetch(url, options = {}) {
  // GET 请求不需要 CSRF Token
  const method = (options.method || 'GET').toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return fetch(url, options);
  }
  
  const token = await getCSRFToken();
  
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('X-CSRF-Token', token);
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin'
  });
}

/**
 * 带 CSRF Token 的 JSON 请求
 * @param {string} url - 请求URL
 * @param {Object} data - 请求数据
 * @param {Object} options - fetch 选项
 * @returns {Promise<Object>}
 */
export async function secureJSON(url, data = {}, options = {}) {
  const response = await secureFetch(url, {
    ...options,
    method: options.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: JSON.stringify(data)
  });
  
  return response.json();
}

/**
 * 带 CSRF Token 的 FormData 请求
 * @param {string} url - 请求URL
 * @param {FormData} formData - FormData 对象
 * @param {Object} options - fetch 选项
 * @returns {Promise<Response>}
 */
export async function secureFormData(url, formData, options = {}) {
  return secureFetch(url, {
    ...options,
    method: options.method || 'POST',
    body: formData
  });
}

/**
 * 清除缓存的 Token
 */
export function clearCSRFToken() {
  cachedToken = null;
  tokenExpiry = 0;
}

export default {
  getCSRFToken,
  secureFetch,
  secureJSON,
  secureFormData,
  clearCSRFToken
};
