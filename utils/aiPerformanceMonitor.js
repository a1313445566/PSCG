/**
 * AI 性能监控工具
 * 用于监控 AI 任务的性能指标
 */

class AIPerformanceMonitor {
  constructor() {
    this.metrics = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      totalProcessingTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      apiCalls: 0,
      retryCount: 0
    }

    this.taskTimings = new Map()
  }

  /**
   * 记录任务开始
   */
  startTask(taskId) {
    this.taskTimings.set(taskId, {
      startTime: Date.now(),
      retries: 0
    })

    this.metrics.totalTasks++
  }

  /**
   * 记录任务完成
   */
  endTask(taskId, success = true) {
    const timing = this.taskTimings.get(taskId)

    if (timing) {
      const processingTime = Date.now() - timing.startTime

      if (success) {
        this.metrics.completedTasks++
        this.metrics.totalProcessingTime += processingTime
      } else {
        this.metrics.failedTasks++
      }

      this.metrics.retryCount += timing.retries || 0
      this.taskTimings.delete(taskId)
    }
  }

  /**
   * 记录重试
   */
  recordRetry(taskId) {
    const timing = this.taskTimings.get(taskId)

    if (timing) {
      timing.retries = (timing.retries || 0) + 1
    }
  }

  /**
   * 记录缓存命中
   */
  recordCacheHit() {
    this.metrics.cacheHits++
  }

  /**
   * 记录缓存未命中
   */
  recordCacheMiss() {
    this.metrics.cacheMisses++
  }

  /**
   * 记录 API 调用
   */
  recordApiCall() {
    this.metrics.apiCalls++
  }

  /**
   * 获取性能统计
   */
  getStats() {
    const avgProcessingTime =
      this.metrics.completedTasks > 0
        ? this.metrics.totalProcessingTime / this.metrics.completedTasks
        : 0

    const successRate =
      this.metrics.totalTasks > 0
        ? ((this.metrics.completedTasks / this.metrics.totalTasks) * 100).toFixed(2)
        : 0

    const cacheHitRate =
      this.metrics.cacheHits + this.metrics.cacheMisses > 0
        ? (
            (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) *
            100
          ).toFixed(2)
        : 0

    const avgRetries =
      this.metrics.totalTasks > 0
        ? (this.metrics.retryCount / this.metrics.totalTasks).toFixed(2)
        : 0

    return {
      totalTasks: this.metrics.totalTasks,
      completedTasks: this.metrics.completedTasks,
      failedTasks: this.metrics.failedTasks,
      successRate: `${successRate}%`,
      avgProcessingTime: `${avgProcessingTime.toFixed(0)}ms`,
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses,
      cacheHitRate: `${cacheHitRate}%`,
      apiCalls: this.metrics.apiCalls,
      avgRetries
    }
  }

  /**
   * 重置统计
   */
  reset() {
    this.metrics = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      totalProcessingTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      apiCalls: 0,
      retryCount: 0
    }

    this.taskTimings.clear()
  }

  /**
   * 打印性能报告
   */
  printReport() {
    const stats = this.getStats()

    console.log('\n========== AI 性能监控报告 ==========')
    console.log(`总任务数: ${stats.totalTasks}`)
    console.log(`完成任务: ${stats.completedTasks}`)
    console.log(`失败任务: ${stats.failedTasks}`)
    console.log(`成功率: ${stats.successRate}`)
    console.log(`平均处理时间: ${stats.avgProcessingTime}`)
    console.log(`缓存命中次数: ${stats.cacheHits}`)
    console.log(`缓存未命中次数: ${stats.cacheMisses}`)
    console.log(`缓存命中率: ${stats.cacheHitRate}`)
    console.log(`API 调用次数: ${stats.apiCalls}`)
    console.log(`平均重试次数: ${stats.avgRetries}`)
    console.log('=====================================\n')
  }
}

// 导出单例
const monitor = new AIPerformanceMonitor()

// 每小时打印一次报告
setInterval(() => {
  monitor.printReport()
}, 3600000)

module.exports = monitor
