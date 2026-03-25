import { ref } from 'vue'
import { ElLoading } from 'element-plus'

/**
 * Loading 状态管理 Hook
 * 
 * 用于管理全局 Loading 动画，避免实例管理错误和内存泄漏
 * 
 * @example
 * ```js
 * const { showLoading, hideLoading, withLoading } = useLoading()
 * 
 * // 方式1：手动控制
 * showLoading('加载中...')
 * await fetchData()
 * hideLoading()
 * 
 * // 方式2：自动包装（推荐）
 * await withLoading(async () => {
 *   await fetchData()
 * }, '加载中...')
 * ```
 */
export function useLoading() {
  // Loading 实例引用
  const loadingInstance = ref(null)
  
  /**
   * 显示 Loading 动画
   * @param {string} text - Loading 提示文本，默认"加载中..."
   */
  const showLoading = (text = '加载中...') => {
    // 先关闭已有实例，避免重复实例
    if (loadingInstance.value) {
      loadingInstance.value.close()
    }
    
    // 创建新的 Loading 实例
    loadingInstance.value = ElLoading.service({ 
      lock: true,  // 锁定屏幕滚动
      text,
      background: 'rgba(255, 255, 255, 0.7)'  // 半透明白色背景
    })
  }
  
  /**
   * 隐藏 Loading 动画
   */
  const hideLoading = () => {
    if (loadingInstance.value) {
      loadingInstance.value.close()
      loadingInstance.value = null  // 清空引用，避免内存泄漏
    }
  }
  
  /**
   * 包装异步函数，自动显示和隐藏 Loading
   * @param {Function} fn - 要执行的异步函数
   * @param {string} text - Loading 提示文本，默认"加载中..."
   * @returns {Promise} 异步函数的执行结果
   * 
   * @example
   * const result = await withLoading(
   *   () => fetchData(),
   *   '正在加载数据...'
   * )
   */
  const withLoading = async (fn, text = '加载中...') => {
    showLoading(text)
    try {
      return await fn()
    } finally {
      // 无论成功还是失败，都确保关闭 Loading
      hideLoading()
    }
  }
  
  return { 
    showLoading, 
    hideLoading, 
    withLoading 
  }
}
