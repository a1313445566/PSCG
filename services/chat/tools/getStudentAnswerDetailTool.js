/**
 * 学生答题详情工具
 * 文件: services/chat/tools/getStudentAnswerDetailTool.js
 * 功能: 查询学生在特定题目或学科的答题详情
 */

const { z } = require('zod')
const { defineTool } = require('./toolUtils')
const db = require('../../database')

const getStudentAnswerDetailTool = defineTool({
  name: 'get_student_answer_detail',
  description:
    '查询学生在特定题目或学科的详细答题记录，包括答题时间、选择答案、是否正确等信息，帮助教师了解学生的答题过程。',
  schema: z.object({
    studentId: z.number().int().positive().describe('学生ID'),
    questionId: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('题目ID（可选，不提供则查询该学生所有答题记录）'),
    subjectId: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('学科ID（可选，不提供则查询所有学科）'),
    limit: z.number().int().min(1).max(100).default(20).describe('返回记录数量限制，默认20')
  }),
  handler: async args => {
    const { studentId, questionId, subjectId, limit = 20 } = args
    try {
      // 验证学生是否存在
      const student = await db.get(
        `
        SELECT id, username, grade
        FROM users
        WHERE id = ?
      `,
        [studentId]
      )

      if (!student) {
        return JSON.stringify({
          success: false,
          error: '学生不存在'
        })
      }

      // 构建查询条件
      let whereClause = 'WHERE qa.user_id = ?'
      const params = [studentId]

      if (questionId) {
        whereClause += ' AND qa.question_id = ?'
        params.push(questionId)
      }

      if (subjectId) {
        whereClause += ' AND qa.subject_id = ?'
        params.push(subjectId)
      }

      params.push(limit)

      // 查询答题记录
      const answerRecords = await db.query(
        `
        SELECT 
          qa.id as record_id,
          qa.question_id,
          q.title as question_title,
          q.difficulty,
          qa.subject_id,
          s.name as subject_name,
          qa.user_answer as selected_answer,
          q.answer as correct_answer,
          qa.is_correct,
          qa.time_spent,
          qa.created_at as answer_time
        FROM question_attempts qa
        LEFT JOIN questions q ON qa.question_id = q.id
        LEFT JOIN subjects s ON qa.subject_id = s.id
        ${whereClause.replace(/ar\./g, 'qa.')}
        ORDER BY qa.created_at DESC
        LIMIT ?
      `,
        params
      )

      // 统计概览
      const overviewSQL = `
        SELECT 
          COUNT(*) as total_attempts,
          SUM(CASE WHEN qa.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
          ROUND(SUM(CASE WHEN qa.is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as accuracy,
          ROUND(AVG(qa.time_spent), 2) as avg_time
        FROM question_attempts qa
        ${whereClause.replace(/ar\./g, 'qa.').replace('LIMIT ?', '')}
      `

      const overview = await db.get(overviewSQL, params.slice(0, -1))

      return JSON.stringify({
        success: true,
        data: {
          student: student,
          overview: overview,
          answer_records: answerRecords
        }
      })
    } catch (error) {
      console.error('[getStudentAnswerDetailTool] 查询失败:', error)
      return JSON.stringify({
        success: false,
        error: error.message
      })
    }
  }
})

module.exports = getStudentAnswerDetailTool
