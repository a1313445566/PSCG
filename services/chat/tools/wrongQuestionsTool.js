/**
 * 学生错题查询工具（重构版）
 */

const { z } = require('zod')
const { defineTool } = require('./toolUtils')
const db = require('../../database')

const wrongQuestionsTool = defineTool({
  name: 'query_wrong_questions',
  description: '学生错题：题目内容、错误答案、正确答案、解析。',
  schema: z.object({
    studentName: z.string().optional().describe('学生姓名'),
    subjectId: z.number().int().positive().optional().describe('学科ID'),
    limit: z.number().int().positive().optional().describe('数量（默认5）')
  }),
  handler: async args => {
    try {
      const { studentName, subjectId, limit = 5 } = args

      let sql = `
        SELECT 
          LEFT(q.content, 80) as question,
          q.correct_answer,
          LEFT(q.explanation, 100) as explanation,
          s.name as subject,
          COALESCE(NULLIF(u.name, ''), u.student_id) as student,
          qa.user_answer,
          qa.created_at as answered_at
        FROM question_attempts qa
        JOIN questions q ON qa.question_id = q.id
        JOIN users u ON qa.user_id = u.id
        JOIN subjects s ON q.subject_id = s.id
        WHERE qa.is_correct = 0
      `
      const params = []

      if (studentName) {
        sql += ' AND COALESCE(NULLIF(u.name, \'\'), u.student_id) LIKE ?'
        params.push(`%${studentName}%`)
      }
      if (subjectId) {
        sql += ' AND q.subject_id = ?'
        params.push(subjectId)
      }

      sql += ` ORDER BY qa.created_at DESC LIMIT ${parseInt(limit)}`
      const results = await db.query(sql, params)

      return JSON.stringify({ success: true, data: results })
    } catch (error) {
      console.error('[wrongQuestionsTool] 查询失败:', error)
      return JSON.stringify({ success: false, error: error.message })
    }
  }
})

module.exports = wrongQuestionsTool
