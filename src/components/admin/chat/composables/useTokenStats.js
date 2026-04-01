/**
 * Token 统计 Composable
 * 功能：获取和展示 Token 使用统计
 */
import { ref } from 'vue'
import { api } from '@/utils/api'

export function useTokenStats() {
  const stats = ref({
    totalInput: 0,
    totalOutput: 0,
    totalTokens: 0,
    totalCost: 0,
    cachedCount: 0,
    requestCount: 0,
    period: 'month'
  })

  const loading = ref(false)

  /**
   * 获取 Token 统计
   * @param {string} period - 统计周期：day/week/month
   */
  async function fetchStats(period = 'month') {
    try {
      loading.value = true
      const response = await api.get('/chat/token-stats', { period })

      if (response.success) {
        stats.value = response.data
      }
    } catch (error) {
      console.error('[TokenStats] 获取统计失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 格式化 Token 数量
   */
  function formatTokens(count) {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(2)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  /**
   * 格式化成本
   */
  function formatCost(cost) {
    if (cost < 0.01) {
      return `$${(cost * 100).toFixed(2)}¢`
    }
    return `$${cost.toFixed(2)}`
  }

  return {
    stats,
    loading,
    fetchStats,
    formatTokens,
    formatCost
  }
}
