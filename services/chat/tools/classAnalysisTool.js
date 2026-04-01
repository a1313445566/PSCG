/**
 * 班级学情分析工具（重构版）
 */

const { z } = require('zod')
const { defineTool } = require('./toolUtils')
const db = require('../../database')

const classAnalysisTool = defineTool({
  name: 'query_class_analysis',
  description: '班级学情：学生人数、平均正确率、答题总数。',
  schema: z.object({
    grade: z.string().optional().describe('年级'),
    className: z.string().optional().describe('班级'),
    subjectId: z.number().int().positive().optional().describe('学科ID')
  }),
  handler: async args => {
    try {
      const { grade, className, subjectId } = args

      let sql = `
        SELECT 
          u.grade, u.class,
          COUNT(DISTINCT u.id) as students,
          COUNT(DISTINCT ar.id) as sessions,
          ROUND(SUM(ar.correct_count) * 100.0 / NULLIF(SUM(ar.total_questions), 0), 2) as accuracy,
          ROUND(AVG(u.points), 2) as avg_points
        FROM users u
        LEFT JOIN answer_records ar ON u.id = ar.user_id
        WHERE 1=1
      `
      const params = []

      if (grade) {
        sql += ' AND u.grade = ?'
        params.push(grade)
      }
      if (className) {
        sql += ' AND u.class = ?'
        params.push(className)
      }
      if (subjectId) {
        sql += ' AND ar.subject_id = ?'
        params.push(subjectId)
      }

      sql += ' GROUP BY u.grade, u.class ORDER BY accuracy DESC LIMIT 50'

      const results = await db.query(sql, params)

      return JSON.stringify({ success: true, data: results })
    } catch (error) {
      console.error('[classAnalysisTool] 查询失败:', error)
      return JSON.stringify({ success: false, error: error.message })
    }
  }
})

module.exports = classAnalysisTool
