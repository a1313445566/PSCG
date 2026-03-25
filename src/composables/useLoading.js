import { ref } from 'vue'
import { ElLoading } from 'element-plus'

/**
 * Loading 状态管理 Hook
 *
 * 用于管理全局 Loading 动画，避免实例管理错误和内存泄漏
 *
 * @example
 * ```js
 * const { showLoading, hideLoading, withLoading, cleanup } = useLoading()
 * 
 * // 在组件卸载时调用清理
 * onUnmounted(cleanup)
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
  
  // 组件挂载状态
  let isMounted = true

  /**
   * 显示 Loading 动画
   * @param {string} text - Loading 提示文本，默认"加载中..."
   */
  const showLoading = (text = '加载中...') => {
    console.log('[useLoading] showLoading 被调用', { text, isMounted })
    if (!isMounted) {
      console.warn('[useLoading] 组件已卸载，取消 showLoading')
      return
    }
    
    // 先关闭已有实例，避免重复实例
    if (loadingInstance.value) {
      try {
        loadingInstance.value.close()
      } catch (e) {
        console.warn('[useLoading] 关闭旧实例失败:', e)
      }
    }

    // 创建新的 Loading 实例
    try {
      loadingInstance.value = ElLoading.service({
        lock: true,  // 锁定屏幕滚动
        text,
        background: 'rgba(255, 255, 255, 0.7)'  // 半透明白色背景
      })
      console.log('[useLoading] Loading 实例创建成功')
    } catch (e) {
      console.error('[useLoading] 创建 Loading 实例失败:', e)
      loadingInstance.value = null
    }
  }

  /**
   * 隐藏 Loading 动画
   */
  const hideLoading = () => {
    console.log('[useLoading] hideLoading 被调用', { isMounted, hasInstance: !!loadingInstance.value })
    if (!isMounted) {
      console.warn('[useLoading] 组件已卸载，取消 hideLoading')
      return
    }
    
    if (loadingInstance.value) {
      try {
        loadingInstance.value.close()
        console.log('[useLoading] Loading 实例已关闭')
      } catch (e) {
        console.warn('[useLoading] 关闭 Loading 失败:', e)
      } finally {
        loadingInstance.value = null  // 清空引用，避免内存泄漏
        console.log('[useLoading] Loading 引用已清空')
      }
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
    console.log('[useLoading] withLoading 被调用', { text, isMounted })
    if (!isMounted) {
      console.warn('[useLoading] 组件已卸载，取消 withLoading')
      return
    }
    
    showLoading(text)
    try {
      console.log('[useLoading] 开始执行异步函数')
      const result = await fn()
      console.log('[useLoading] 异步函数执行完成')
      return result
    } catch (error) {
      // 记录错误但向上抛出让调用者处理
      console.error('[useLoading] 异步操作失败:', error)
      throw error
    } finally {
      // 无论成功还是失败，都确保关闭 Loading
      console.log('[useLoading] finally 块：准备关闭 Loading')
      hideLoading()
    }
  }

  /**
   * 清理资源（组件卸载时手动调用）
   */
  const cleanup = () => {
    console.log('[useLoading] cleanup 被调用，设置 isMounted = false')
    isMounted = false
    hideLoading()
  }

  return {
    showLoading,
    hideLoading,
    withLoading,
    cleanup
  }
}
