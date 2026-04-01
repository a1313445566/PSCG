/**
 * 学科掌握进度工具
 * 文件: services/chat/tools/subjectProgressTool.js
 * 功能: 查询学生在各学科的掌握情况和进度
 */

const { z } = require('zod')
const { defineTool } = require('./toolUtils')
const db = require('../../database')

const subjectProgressTool = defineTool({
  handler: async args => {
    const { studentId, subjectId } = args
    try {
      let sql = `
        SELECT 
          u.id as student_id,
          u.name as student_name,
          s.id as subject_id,
          s.name as subject_name,
          COUNT(DISTINCT ar.id) as total_sessions,
          SUM(ar.total_questions) as total_questions,
          SUM(ar.correct_count) as correct_count,
          CASE 
            WHEN SUM(ar.total_questions) > 0 
            THEN ROUND(SUM(ar.correct_count) * 100.0 / SUM(ar.total_questions), 2)
            ELSE 0 
          END as accuracy,
          MAX(ar.created_at) as last_study_time
        FROM users u
        CROSS JOIN subjects s
        LEFT JOIN answer_records ar ON u.id = ar.user_id AND ar.subject_id = s.id
        WHERE 1=1
      `

      const params = []

      if (studentId) {
        sql += ' AND u.id = ?'
        params.push(studentId)
      }

      if (subjectId) {
        sql += ' AND s.id = ?'
        params.push(subjectId)
      }

      sql += ' GROUP BY u.id, u.name, s.id, s.name ORDER BY accuracy DESC'

      const results = await db.query(sql, params)

      return JSON.stringify({
        success: true,
        data: results,
        count: results.length
      })
    } catch (error) {
      console.error('[subjectProgressTool] 查询失败:', error)
      return JSON.stringify({
        success: false,
        error: error.message
      })
    }
  },
  name: 'query_subject_progress',
  description: '查询学生各学科掌握进度：答题数量、正确率、最近学习时间。可按学生、学科筛选。',
  schema: z.object({
    studentId: z.number().int().positive().optional().describe('学生ID'),
    subjectId: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('学科ID: 1=道德与法治, 2=语文, 34=语文机测')
  })
})

module.exports = subjectProgressTool
