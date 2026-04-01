import { ref, onUnmounted } from 'vue'
import { extractAllChartConfigs, VChart } from '@/utils/chartGenerator'
import { registerChart, unregisterChart, observeContainer, unobserveContainer } from '@/utils/chartResize'

// 图表ID计数器
let chartIdCounter = 0

/**
 * 图表渲染 Composable
 * 封装图表渲染逻辑，支持多个图表实例管理
 * ✅ 使用全局图表自适应管理器
 */
export function useChartRenderer() {
  // 图表实例存储（本地引用，用于清理）
  const chartInstances = ref([])

  /**
   * 在指定容器中渲染图表
   * @param {HTMLElement} container - 包含 .chart-placeholder 的容器
   * @param {string} markdownContent - Markdown 内容（包含 vchart 代码块）
   * @returns {number} 渲染成功的图表数量
   */
  const renderCharts = (container, markdownContent) => {
    if (!container || !markdownContent) return 0

    const chartConfigs = extractAllChartConfigs(markdownContent)
    if (chartConfigs.length === 0) return 0

    const placeholders = container.querySelectorAll('.chart-placeholder')
    let renderedCount = 0

    placeholders.forEach((placeholder, index) => {
      const chartConfig = chartConfigs[index]
      if (!chartConfig) return

      const chartWrapper = document.createElement('div')
      chartWrapper.className = 'inline-chart-container'
      placeholder.replaceWith(chartWrapper)

      try {
        // ✅ 确保 autoFit 在 spec 配置中（关键！）
        const spec = {
          ...chartConfig.config,
          autoFit: true // 必须在 spec 中启用自动适应
        }

        const instance = new VChart(spec, {
          dom: chartWrapper,
          mode: 'desktop-browser',
          animation: true,
          theme: 'light'
        })
        instance.renderAsync()

        // ✅ 生成唯一ID
        const chartId = `chart-${chartIdCounter++}`

        // ✅ 注册到全局自适应管理器
        registerChart(chartId, instance, chartWrapper)
        observeContainer(chartWrapper)

        // ✅ 保存实例和容器引用（用于本地清理）
        chartInstances.value.push({ id: chartId, instance, container: chartWrapper })
        renderedCount++
      } catch (error) {
        console.error(`[图表] 渲染失败:`, error)
        chartWrapper.innerHTML = '<div class="chart-error">图表渲染失败</div>'
      }
    })

    return renderedCount
  }

  /**
   * 清理所有图表实例
   */
  const clearCharts = () => {
    chartInstances.value.forEach(({ id, instance, container }) => {
      try {
        // 从全局管理器注销
        unregisterChart(id)
        unobserveContainer(container)
        // 释放实例
        instance?.release()
      } catch (e) {
        // 忽略释放错误
      }
    })
    chartInstances.value = []
  }

  // 组件卸载时自动清理
  onUnmounted(() => {
    clearCharts()
  })

  return {
    chartInstances,
    renderCharts,
    clearCharts
  }
}
