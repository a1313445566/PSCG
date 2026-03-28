class DBPerformanceMonitor {
  constructor() {
    this.slowQueries = []
    this.queryCount = 0
    this.totalQueryTime = 0
    this.maxSlowQueries = 100 // 最多记录100个慢查询
  }

  // 监控数据库查询
  monitorQuery(dbService) {
    const originalRun = dbService.run.bind(dbService)
    const originalGet = dbService.get.bind(dbService)
    const originalAll = dbService.all.bind(dbService)

    // 包装run方法
    dbService.run = async (sql, params = []) => {
      const start = Date.now()
      try {
        const result = await originalRun(sql, params)
        this.recordQuery(sql, Date.now() - start, params)
        return result
      } catch (error) {
        this.recordQuery(sql, Date.now() - start, params, error)
        throw error
      }
    }

    // 包装get方法
    dbService.get = async (sql, params = []) => {
      const start = Date.now()
      try {
        const result = await originalGet(sql, params)
        this.recordQuery(sql, Date.now() - start, params)
        return result
      } catch (error) {
        this.recordQuery(sql, Date.now() - start, params, error)
        throw error
      }
    }

    // 包装all方法
    dbService.all = async (sql, params = []) => {
      const start = Date.now()
      try {
        const result = await originalAll(sql, params)
        this.recordQuery(sql, Date.now() - start, params)
        return result
      } catch (error) {
        this.recordQuery(sql, Date.now() - start, params, error)
        throw error
      }
    }
  }

  // 记录查询性能
  recordQuery(sql, duration, params, error = null) {
    this.queryCount++
    this.totalQueryTime += duration

    // 如果查询时间超过200ms，记录为慢查询
    if (duration > 200) {
      const queryInfo = {
        timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        sql: this.truncateSql(sql),
        duration: `${duration}ms`,
        params: this.sanitizeParams(params),
        error: error ? error.message : null
      }

      this.slowQueries.push(queryInfo)

      // 保持最大记录数
      if (this.slowQueries.length > this.maxSlowQueries) {
        this.slowQueries.shift()
      }

      // 输出慢查询警告
      console.warn(`⚠️ SLOW QUERY (${duration}ms): ${this.truncateSql(sql)}`)
    }

    // 每1000次查询输出统计信息
    if (this.queryCount % 1000 === 0) {
      this.logStats()
    }
  }

  // 截断过长的SQL语句
  truncateSql(sql, maxLength = 200) {
    if (sql.length > maxLength) {
      return sql.substring(0, maxLength) + '...'
    }
    return sql
  }

  // 清理参数（避免敏感信息）
  sanitizeParams(params) {
    if (!Array.isArray(params)) return params
    return params.map(param => {
      if (typeof param === 'string' && param.length > 50) {
        return param.substring(0, 50) + '...'
      }
      return param
    })
  }

  // 记录统计信息
  logStats() {
    const avgQueryTime = this.queryCount > 0 ? this.totalQueryTime / this.queryCount : 0
    console.log(
      `📊 DB STATS: ${this.queryCount} queries, avg: ${avgQueryTime.toFixed(2)}ms, slow queries: ${this.slowQueries.length}`
    )
  }

  // 获取性能报告
  getReport() {
    const avgQueryTime = this.queryCount > 0 ? this.totalQueryTime / this.queryCount : 0

    return {
      queryCount: this.queryCount,
      totalQueryTime: this.totalQueryTime,
      averageQueryTime: avgQueryTime,
      slowQueryCount: this.slowQueries.length,
      slowQueries: this.slowQueries.slice(-10), // 返回最近10个慢查询
      timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    }
  }

  // API端点：获取性能报告
  createPerformanceEndpoint(app) {
    app.get('/api/performance/db', (req, res) => {
      const report = this.getReport()
      res.json(report)
    })

    app.get('/api/performance/health', (req, res) => {
      const health = {
        status: 'ok',
        timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        queryStats: {
          totalQueries: this.queryCount,
          slowQueries: this.slowQueries.length
        }
      }
      res.json(health)
    })
  }
}

// 导出单例实例
const dbPerformanceMonitor = new DBPerformanceMonitor()
module.exports = dbPerformanceMonitor
