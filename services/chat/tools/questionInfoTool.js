/**
 * 题目详情查询工具
 * 文件: services/chat/tools/questionInfoTool.js
 * 功能: 查询单个题目的详细信息、答题统计
 */

const { z } = require('zod')
const { defineTool } = require('./toolUtils')
const db = require('../../database')

const questionInfoTool = defineTool({
  handler: async args => {
    const { questionId } = args
    try {
      // 查询题目基本信息
      const questionSQL = `
        SELECT 
          q.id,
          q.title,
          q.options,
          q.answer,
          q.analysis,
          q.subject_id,
          s.name as subject_name,
          q.difficulty,
          q.created_at
        FROM questions q
        LEFT JOIN subjects s ON q.subject_id = s.id
        WHERE q.id = ?
      `

      const question = await db.get(questionSQL, [questionId])

      if (!question) {
        return JSON.stringify({
          success: false,
          error: '题目不存在'
        })
      }

      // 查询答题统计
      const statsSQL = `
        SELECT 
          COUNT(*) as total_attempts,
          SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
          ROUND(SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as accuracy
        FROM answer_records
        WHERE question_id = ?
      `

      const stats = await db.get(statsSQL, [questionId])

      return JSON.stringify({
        success: true,
        data: {
          ...question,
          options: question.options ? JSON.parse(question.options) : null,
          stats
        }
      })
    } catch (error) {
      console.error('[questionInfoTool] 查询失败:', error)
      return JSON.stringify({
        success: false,
        error: error.message
      })
    }
  },
  name: 'query_question_info',
  description: '查询单个题目的详细信息、答案、解析和答题统计。题目ID范围为2-401。',
  schema: z.object({
    questionId: z.number().int().min(2).max(401).describe('题目ID (范围: 2-401)')
  })
})

module.exports = questionInfoTool
