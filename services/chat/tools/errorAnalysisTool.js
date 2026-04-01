/**
 * 错题分析工具
 * 文件: services/chat/tools/errorAnalysisTool.js
 * 功能: 查询学生错题统计，按知识点、题目类型等维度分析
 */

const { z } = require('zod')
const { defineTool } = require('./toolUtils')
const db = require('../../database')

const errorAnalysisTool = defineTool({
  handler: async args => {
    const { studentId, subjectId, grade } = args
    try {
      let sql = `
        SELECT 
          q.id as question_id,
          q.title,
          q.subject_id,
          s.name as subject_name,
          q.difficulty,
          COUNT(DISTINCT ar.user_id) as error_count,
          GROUP_CONCAT(DISTINCT u.name) as error_students
        FROM questions q
        JOIN answer_records ar ON q.id = ar.question_id
        JOIN users u ON ar.user_id = u.id
        JOIN subjects s ON q.subject_id = s.id
        WHERE ar.is_correct = 0
      `

      const params = []

      if (studentId) {
        sql += ' AND ar.user_id = ?'
        params.push(studentId)
      }

      if (subjectId) {
        sql += ' AND q.subject_id = ?'
        params.push(subjectId)
      }

      if (grade) {
        sql += ' AND u.grade = ?'
        params.push(grade)
      }

      sql += `
        GROUP BY q.id, q.title, q.subject_id, s.name, q.difficulty
        ORDER BY error_count DESC
        LIMIT 100
      `

      const results = await db.query(sql, params)

      return JSON.stringify({
        success: true,
        data: results,
        count: results.length
      })
    } catch (error) {
      console.error('[errorAnalysisTool] 查询失败:', error)
      return JSON.stringify({
        success: false,
        error: error.message
      })
    }
  },
  name: 'query_error_analysis',
  description:
    '查询错题统计分析：高频错题、错题学生名单。可按学生、学科、年级筛选。年级为字符串类型(1-6)。',
  schema: z.object({
    studentId: z.number().int().positive().optional().describe('学生ID'),
    subjectId: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('学科ID: 1=道德与法治, 2=语文, 34=语文机测'),
    grade: z
      .string()
      .regex(/^[1-6]$/)
      .optional()
      .describe('年级(1-6, 字符串)')
  })
})

module.exports = errorAnalysisTool
