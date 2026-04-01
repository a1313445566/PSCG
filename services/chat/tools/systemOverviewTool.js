/**
 * 系统概览工具（重构版）
 */

const { z } = require('zod')
const { defineTool } = require('./toolUtils')
const db = require('../../database')

const systemOverviewTool = defineTool({
  name: 'query_system_overview',
  description: '系统概览：用户数、题目数、答题统计、学科分布。',
  schema: z.object({}),
  handler: async (args) => {
    try {
      const [users, questions, records, subjects] = await Promise.all([
        db.get(`
          SELECT 
            COUNT(*) as total_users,
            SUM(CASE WHEN grade REGEXP '^[1-6]$' THEN 1 ELSE 0 END) as students
          FROM users
        `),
        db.get(`
          SELECT 
            COUNT(*) as total_questions,
            COUNT(DISTINCT subject_id) as subject_count
          FROM questions
        `),
        db.get(`
          SELECT 
            COUNT(*) as total_records,
            SUM(total_questions) as questions_answered,
            ROUND(SUM(correct_count) * 100.0 / SUM(total_questions), 2) as accuracy
          FROM answer_records
        `),
        db.query(`
          SELECT 
            s.name,
            COUNT(q.id) as questions,
            COUNT(DISTINCT ar.user_id) as students
          FROM subjects s
          LEFT JOIN questions q ON s.id = q.subject_id
          LEFT JOIN answer_records ar ON s.id = ar.subject_id
          GROUP BY s.id
        `)
      ])

      return JSON.stringify({
        success: true,
        data: { users, questions, records, subjects }
      })
    } catch (error) {
      console.error('[systemOverviewTool] 查询失败:', error)
      return JSON.stringify({ success: false, error: error.message })
    }
  }
})

module.exports = systemOverviewTool