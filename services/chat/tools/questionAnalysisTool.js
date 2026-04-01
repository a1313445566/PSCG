/**
 * 题目详细分析工具（重构版）
 */

const { z } = require('zod')
const { defineTool } = require('./toolUtils')
const db = require('../../database')

const questionAnalysisTool = defineTool({
  name: 'analyze_question_detail',
  description: '题目详情：内容、选项、答案、解析、答题统计。',
  schema: z.object({
    questionId: z.number().int().positive().describe('题目ID')
  }),
  handler: async args => {
    try {
      const { questionId } = args

      const [question, stats] = await Promise.all([
        db.get(
          `
          SELECT 
            LEFT(q.content, 100) as content,
            q.correct_answer,
            LEFT(q.explanation, 100) as explanation,
            s.name as subject
          FROM questions q
          JOIN subjects s ON q.subject_id = s.id
          WHERE q.id = ?
        `,
          [questionId]
        ),
        db.get(
          `
          SELECT 
            COUNT(*) as attempts,
            SUM(is_correct = 1) as correct,
            ROUND(SUM(is_correct = 1) * 100.0 / COUNT(*), 2) as accuracy
          FROM question_attempts
          WHERE question_id = ?
        `,
          [questionId]
        )
      ])

      if (!question) {
        return JSON.stringify({ success: false, error: '题目不存在' })
      }

      return JSON.stringify({ success: true, data: { question, stats } })
    } catch (error) {
      console.error('[questionAnalysisTool] 查询失败:', error)
      return JSON.stringify({ success: false, error: error.message })
    }
  }
})

const wrongAnswerPatternTool = defineTool({
  name: 'analyze_wrong_answer_pattern',
  description: '错误答案分布：各选项选择人数、错误原因分析。',
  schema: z.object({
    questionId: z.number().int().positive().describe('题目ID')
  }),
  handler: async args => {
    try {
      const { questionId } = args

      const distribution = await db.query(
        `
        SELECT 
          user_answer,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM question_attempts WHERE question_id = ?), 2) as percentage
        FROM question_attempts
        WHERE question_id = ?
        GROUP BY user_answer
        ORDER BY count DESC
      `,
        [questionId, questionId]
      )

      return JSON.stringify({ success: true, data: distribution })
    } catch (error) {
      console.error('[wrongAnswerPatternTool] 查询失败:', error)
      return JSON.stringify({ success: false, error: error.message })
    }
  }
})

module.exports = { questionAnalysisTool, wrongAnswerPatternTool }
