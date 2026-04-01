/**
 * 题库题目列表工具
 * 文件: services/chat/tools/getSubjectQuestionsTool.js
 * 功能: 获取特定学科（题库）下的题目列表及答题统计
 */

const { z } = require('zod')
const { defineTool } = require('./toolUtils')
const db = require('../../database')

const getSubjectQuestionsTool = defineTool({
  name: 'get_subject_questions',
  description: '获取特定学科（题库）下的题目列表，包含题目难度、答题次数、正确率等统计信息。',
  schema: z.object({
    subjectId: z.number().int().positive().describe('学科ID'),
    page: z.number().int().min(1).default(1).describe('页码，默认第1页'),
    pageSize: z.number().int().min(1).max(50).default(20).describe('每页数量，默认20，最大50'),
    sortBy: z.enum(['difficulty', 'accuracy', 'attempts']).optional().default('attempts').describe('排序方式：difficulty-难度，accuracy-正确率，attempts-答题次数'),
    order: z.enum(['asc', 'desc']).optional().default('desc').describe('排序顺序：asc-升序，desc-降序')
  }),
  handler: async (args) => {
    const { subjectId, page = 1, pageSize = 20, sortBy = 'attempts', order = 'desc' } = args
    const offset = (page - 1) * pageSize

    try {
      // 验证学科是否存在
      const subject = await db.get('SELECT id, name FROM subjects WHERE id = ?', [subjectId])
      if (!subject) {
        return JSON.stringify({
          success: false,
          error: '学科不存在'
        })
      }

      // 构建排序字段
      const orderField = {
        difficulty: 'q.difficulty',
        accuracy: 'accuracy',
        attempts: 'attempt_count'
      }[sortBy] || 'attempt_count'

      const orderClause = `ORDER BY ${orderField} ${order.toUpperCase()}`

      // 查询题目列表
      const questionsSQL = `
        SELECT 
          q.id,
          q.title,
          q.difficulty,
          COUNT(DISTINCT ar.id) as attempt_count,
          COUNT(DISTINCT ar.user_id) as student_count,
          ROUND(
            SUM(CASE WHEN ar.is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / 
            NULLIF(COUNT(ar.id), 0), 
            2
          ) as accuracy,
          SUM(CASE WHEN ar.is_correct = 0 THEN 1 ELSE 0 END) as wrong_count
        FROM questions q
        LEFT JOIN answer_records ar ON q.id = ar.question_id
        WHERE q.subject_id = ?
        GROUP BY q.id, q.title, q.difficulty
        ${orderClause}
        LIMIT ? OFFSET ?
      `

      const questions = await db.query(questionsSQL, [subjectId, pageSize, offset])

      // 查询总数
      const countSQL = 'SELECT COUNT(*) as total FROM questions WHERE subject_id = ?'
      const countResult = await db.get(countSQL, [subjectId])
      const total = countResult.total

      return JSON.stringify({
        success: true,
        data: {
          subject: subject,
          pagination: {
            page,
            page_size: pageSize,
            total,
            total_pages: Math.ceil(total / pageSize)
          },
          questions: questions
        }
      })
    } catch (error) {
      console.error('[getSubjectQuestionsTool] 查询失败:', error)
      return JSON.stringify({
        success: false,
        error: error.message
      })
    }
  }
})

module.exports = getSubjectQuestionsTool