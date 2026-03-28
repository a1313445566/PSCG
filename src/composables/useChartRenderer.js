import { ref, onUnmounted } from 'vue'
import { extractAllChartConfigs, VChart } from '@/utils/chartGenerator'

/**
 * 图表渲染 Composable
 * 封装图表渲染逻辑，支持多个图表实例管理
 */
export function useChartRenderer() {
  // 图表实例存储
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
        const instance = new VChart(chartConfig.config, {
          dom: chartWrapper,
          mode: 'desktop-browser',
          animation: true,
          theme: 'light'
        })
        instance.renderAsync()
        chartInstances.value.push(instance)
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
    chartInstances.value.forEach(instance => {
      try {
        instance?.release()
      } catch (e) {
        // 忽略释放错误
      }
    })
    chartInstances.value = []
  }

  /**
   * 调整所有图表大小
   */
  const resizeCharts = () => {
    chartInstances.value.forEach(instance => {
      try {
        instance?.resize()
      } catch (e) {
        // 忽略调整错误
      }
    })
  }

  // 组件卸载时自动清理
  onUnmounted(() => {
    clearCharts()
  })

  return {
    chartInstances,
    renderCharts,
    clearCharts,
    resizeCharts
  }
}
