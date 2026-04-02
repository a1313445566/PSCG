/**
 * 题库详情分析工具
 * 文件: services/chat/tools/getSubjectDetailTool.js
 * 功能: 获取特定学科（题库）的详细统计数据
 */

const { z } = require('zod')
const { defineTool } = require('./toolUtils')
const db = require('../../database')

const getSubjectDetailTool = defineTool({
  name: 'get_subject_detail',
  description: '获取特定学科（题库）的详细统计，包括题目分布、难度分布、学生答题情况、高频错题等。',
  schema: z.object({
    subjectId: z.number().int().positive().describe('学科ID')
  }),
  handler: async args => {
    const { subjectId } = args
    try {
      // 1. 学科基本信息
      const subjectInfo = await db.get(
        `
        SELECT 
          s.id,
          s.name as subject_name,
          COUNT(DISTINCT q.id) as total_questions,
          COUNT(DISTINCT ar.user_id) as student_count,
          COUNT(DISTINCT ar.id) as total_attempts,
          COALESCE(
            ROUND(SUM(ar.correct_count) * 100.0 / NULLIF(SUM(ar.total_questions), 0), 2),
            0
          ) as avg_accuracy
        FROM subjects s
        LEFT JOIN questions q ON s.id = q.subject_id
        LEFT JOIN answer_records ar ON s.id = ar.subject_id
        WHERE s.id = ?
        GROUP BY s.id, s.name
      `,
        [subjectId]
      )

      if (!subjectInfo) {
        return JSON.stringify({
          success: false,
          error: '学科不存在'
        })
      }

      // 2. 题目难度分布
      const difficultyDistribution = await db.query(
        `
        SELECT 
          CASE 
            WHEN q.difficulty <= 1 THEN '简单'
            WHEN q.difficulty <= 3 THEN '中等'
            ELSE '困难'
          END as difficulty_level,
          COUNT(*) as question_count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM questions WHERE subject_id = ?), 2) as percentage
        FROM questions q
        WHERE q.subject_id = ?
        GROUP BY difficulty_level
        ORDER BY 
          CASE difficulty_level
            WHEN '简单' THEN 1
            WHEN '中等' THEN 2
            WHEN '困难' THEN 3
          END
      `,
        [subjectId, subjectId]
      )

      // 3. 学生正确率分布
      const studentPerformance = await db.query(
        `
        SELECT 
          u.id as student_id,
          u.username as student_name,
          COUNT(DISTINCT ar.id) as attempt_count,
          COALESCE(ROUND(SUM(ar.correct_count) * 100.0 / NULLIF(SUM(ar.total_questions), 0), 2), 0) as accuracy,
          CASE 
            WHEN COALESCE(ROUND(SUM(ar.correct_count) * 100.0 / NULLIF(SUM(ar.total_questions), 0), 2), 0) >= 90 THEN '优秀'
            WHEN COALESCE(ROUND(SUM(ar.correct_count) * 100.0 / NULLIF(SUM(ar.total_questions), 0), 2), 0) >= 70 THEN '良好'
            WHEN COALESCE(ROUND(SUM(ar.correct_count) * 100.0 / NULLIF(SUM(ar.total_questions), 0), 2), 0) >= 60 THEN '及格'
            ELSE '需加强'
          END as performance_level
        FROM users u
        JOIN answer_records ar ON u.id = ar.user_id
        WHERE ar.subject_id = ?
        GROUP BY u.id, u.username
        ORDER BY accuracy DESC
        LIMIT 20
      `,
        [subjectId]
      )

      // 4. 高频错题（错误次数最多的题目）
      const topWrongQuestions = await db.query(
        `
        SELECT 
          q.id as question_id,
          q.title,
          q.difficulty,
          COUNT(qa.id) as attempt_count,
          SUM(CASE WHEN qa.is_correct = 0 THEN 1 ELSE 0 END) as wrong_count,
          ROUND(SUM(CASE WHEN qa.is_correct = 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(qa.id), 2) as wrong_rate
        FROM questions q
        JOIN question_attempts qa ON q.id = qa.question_id
        WHERE q.subject_id = ?
        GROUP BY q.id, q.title, q.difficulty
        HAVING wrong_count > 0
        ORDER BY wrong_count DESC, wrong_rate DESC
        LIMIT 10
      `,
        [subjectId]
      )

      return JSON.stringify({
        success: true,
        data: {
          subject_info: subjectInfo,
          difficulty_distribution: difficultyDistribution,
          student_performance: studentPerformance,
          top_wrong_questions: topWrongQuestions
        }
      })
    } catch (error) {
      console.error('[getSubjectDetailTool] 查询失败:', error)
      return JSON.stringify({
        success: false,
        error: error.message
      })
    }
  }
})

module.exports = getSubjectDetailTool
