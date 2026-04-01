/**
 * 图表自适应工具
 * 解决VChart图表在窗口大小变化时变空白的问题
 */

// 存储所有图表实例和对应的容器
const chartInstances = new Map()

// 防抖定时器
let debounceTimer = null

// ResizeObserver 实例
let resizeObserver = null

/**
 * 调整所有图表大小
 */
function resizeAllCharts() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(() => {
    chartInstances.forEach(({ chart, container }) => {
      try {
        const newWidth = container.offsetWidth
        const newHeight = container.offsetHeight

        if (newWidth > 0 && newHeight > 0) {
          chart?.resize(newWidth, newHeight)
        }
      } catch (e) {
        // 忽略错误
      }
    })
  }, 100)
}

/**
 * 初始化 ResizeObserver
 */
function initResizeObserver() {
  if (resizeObserver) return

  if (!window.ResizeObserver) {
    window.addEventListener('resize', resizeAllCharts)
    return
  }

  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) {
        resizeAllCharts()
        break
      }
    }
  })
}

/**
 * 注册图表实例
 */
export function registerChart(id, chart, container) {
  if (!chart || !container) return

  if (chartInstances.has(id)) {
    unregisterChart(id)
  }

  chartInstances.set(id, { chart, container })
  initResizeObserver()
}

/**
 * 注销图表实例
 */
export function unregisterChart(id) {
  chartInstances.delete(id)
}

/**
 * 监听容器尺寸变化
 */
export function observeContainer(container) {
  initResizeObserver()
  if (resizeObserver && container) {
    resizeObserver.observe(container)
  }
}

/**
 * 停止监听容器
 */
export function unobserveContainer(container) {
  if (resizeObserver && container) {
    try {
      resizeObserver.unobserve(container)
    } catch (e) {
      // 忽略错误
    }
  }
}

/**
 * 清理所有监听
 */
export function cleanup() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }

  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }

  window.removeEventListener('resize', resizeAllCharts)
  chartInstances.clear()
}

// 窗口大小变化时触发
window.addEventListener('resize', resizeAllCharts)
