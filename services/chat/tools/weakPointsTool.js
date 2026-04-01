/**
 * 薄弱知识点工具
 * 文件: services/chat/tools/weakPointsTool.js
 * 功能: 查询学生的薄弱知识点和题型
 */

const { z } = require('zod')
const { defineTool } = require('./toolUtils')
const db = require('../../database')

const weakPointsTool = defineTool({
  handler: async args => {
    const { studentId, subjectId } = args
    try {
      // 查询学生各难度的答题情况
      const difficultySQL = `
        SELECT 
          q.difficulty,
          COUNT(*) as total_attempts,
          SUM(CASE WHEN ar.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
          ROUND(SUM(CASE WHEN ar.is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as accuracy
        FROM answer_records ar
        JOIN questions q ON ar.question_id = q.id
        WHERE ar.user_id = ?
        ${subjectId ? ' AND q.subject_id = ?' : ''}
        GROUP BY q.difficulty
        ORDER BY q.difficulty
      `

      const params = subjectId ? [studentId, subjectId] : [studentId]
      const difficultyStats = await db.query(difficultySQL, params)

      // 查询高频错题
      const errorSQL = `
        SELECT 
          q.id as question_id,
          q.title,
          q.difficulty,
          s.name as subject_name,
          COUNT(*) as error_count
        FROM answer_records ar
        JOIN questions q ON ar.question_id = q.id
        JOIN subjects s ON q.subject_id = s.id
        WHERE ar.user_id = ? AND ar.is_correct = 0
        ${subjectId ? ' AND q.subject_id = ?' : ''}
        GROUP BY q.id, q.title, q.difficulty, s.name
        ORDER BY error_count DESC
        LIMIT 10
      `

      const frequentErrors = await db.query(errorSQL, params)

      // 分析薄弱点
      const weakPoints = difficultyStats
        .filter(d => d.accuracy < 60)
        .map(d => ({
          difficulty: d.difficulty,
          accuracy: d.accuracy,
          suggestion: `难度${d.difficulty}题目正确率较低，建议加强练习`
        }))

      return JSON.stringify({
        success: true,
        data: {
          difficultyStats,
          frequentErrors,
          weakPoints,
          recommendation:
            weakPoints.length > 0
              ? '建议针对低正确率难度进行专项练习'
              : '各难度掌握情况良好，继续保持'
        }
      })
    } catch (error) {
      console.error('[weakPointsTool] 查询失败:', error)
      return JSON.stringify({
        success: false,
        error: error.message
      })
    }
  },
  name: 'query_weak_points',
  description: '查询学生的薄弱知识点：按难度分析正确率、高频错题，提供练习建议。',
  schema: z.object({
    studentId: z.number().int().positive().describe('学生ID'),
    subjectId: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('学科ID: 1=道德与法治, 2=语文, 34=语文机测')
  })
})

module.exports = weakPointsTool
