/**
 * 学生学习统计工具（重构版）
 * 文件: services/chat/tools/studentStatsTool.js
 * 功能: 查询学生答题次数、正确率、积分等统计数据
 */

const { z } = require('zod')
const { defineTool } = require('./toolUtils')
const db = require('../../database')

const studentStatsTool = defineTool({
  name: 'query_student_stats',
  description: '查询学生答题统计。返回：答题次数、正确率、积分。',
  schema: z.object({
    studentId: z.number().int().positive().optional().describe('学生ID'),
    studentName: z.string().min(1).optional().describe('学生姓名'),
    subjectId: z.number().int().positive().optional().describe('学科ID'),
    grade: z.string().optional().describe('年级(1-6)'),
    startDate: z.string().optional().describe('开始日期'),
    endDate: z.string().optional().describe('结束日期')
  }),
  handler: async args => {
    try {
      const { studentId, studentName, subjectId, grade, startDate, endDate } = args

      // 优化 SQL：只查询必要字段
      let sql = `
        SELECT 
          u.id, u.name, u.grade, u.class, u.points,
          COUNT(DISTINCT ar.id) as sessions,
          SUM(ar.total_questions) as questions,
          SUM(ar.correct_count) as correct,
          ROUND(SUM(ar.correct_count) * 100.0 / NULLIF(SUM(ar.total_questions), 0), 2) as accuracy
        FROM users u
        LEFT JOIN answer_records ar ON u.id = ar.user_id
        WHERE 1=1
      `

      const params = []

      if (studentId) {
        sql += ' AND u.id = ?'
        params.push(studentId)
      }

      if (studentName) {
        sql += ' AND u.name LIKE ?'
        params.push(`%${studentName}%`)
      }

      if (subjectId) {
        sql += ' AND ar.subject_id = ?'
        params.push(subjectId)
      }

      if (grade) {
        sql += ' AND u.grade = ?'
        params.push(grade)
      }

      if (startDate) {
        sql += ' AND ar.created_at >= ?'
        params.push(startDate)
      }

      if (endDate) {
        sql += ' AND ar.created_at <= ?'
        params.push(endDate + ' 23:59:59')
      }

      sql += ' GROUP BY u.id ORDER BY sessions DESC LIMIT 50'

      const results = await db.query(sql, params)

      // 压缩返回数据（移除冗余字段）
      const compressed = results.map(r => ({
        id: r.id,
        name: r.name,
        grade: r.grade,
        class: r.class,
        points: r.points,
        sessions: r.sessions || 0,
        accuracy: r.accuracy || 0
      }))

      return JSON.stringify({ success: true, data: compressed })
    } catch (error) {
      console.error('[studentStatsTool] 查询失败:', error)
      return JSON.stringify({ success: false, error: error.message })
    }
  }
})

module.exports = studentStatsTool
