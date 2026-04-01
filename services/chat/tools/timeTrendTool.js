/**
 * 时间趋势工具
 * 文件: services/chat/tools/timeTrendTool.js
 * 功能: 查询答题活动的时间趋势
 */

const { z } = require('zod')
const { defineTool } = require('./toolUtils')
const db = require('../../database')

const timeTrendTool = defineTool({
  handler: async args => {
    const { startDate, endDate, granularity } = args
    try {
      let dateFormat = '%Y-%m-%d' // 默认按天

      if (granularity === 'hour') {
        dateFormat = '%Y-%m-%d %H:00'
      } else if (granularity === 'week') {
        dateFormat = '%Y-%u'
      } else if (granularity === 'month') {
        dateFormat = '%Y-%m'
      }

      const sql = `
        SELECT 
          DATE_FORMAT(created_at, '${dateFormat}') as time_period,
          COUNT(*) as record_count,
          SUM(total_questions) as total_questions,
          SUM(correct_count) as correct_count,
          ROUND(SUM(correct_count) * 100.0 / SUM(total_questions), 2) as accuracy
        FROM answer_records
        WHERE created_at >= ? AND created_at <= ?
        GROUP BY time_period
        ORDER BY time_period
      `

      const results = await db.query(sql, [startDate, endDate + ' 23:59:59'])

      return JSON.stringify({
        success: true,
        data: results,
        count: results.length
      })
    } catch (error) {
      console.error('[timeTrendTool] 查询失败:', error)
      return JSON.stringify({
        success: false,
        error: error.message
      })
    }
  },
  name: 'query_time_trend',
  description: '查询答题活动的时间趋势：答题数量、正确率随时间的变化。支持按小时、天、周、月分组。',
  schema: z.object({
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe('开始日期 YYYY-MM-DD'),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe('结束日期 YYYY-MM-DD'),
    granularity: z
      .enum(['hour', 'day', 'week', 'month'])
      .optional()
      .default('day')
      .describe('时间粒度: hour=小时, day=天, week=周, month=月')
  })
})

module.exports = timeTrendTool
