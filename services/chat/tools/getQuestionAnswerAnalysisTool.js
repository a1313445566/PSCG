/**
 * 题目答案分析工具
 * 文件: services/chat/tools/getQuestionAnswerAnalysisTool.js
 * 功能: 分析特定题目的答案分布、学生选择情况、错误原因
 */

const { z } = require('zod')
const { defineTool } = require('./toolUtils')
const db = require('../../database')

const getQuestionAnswerAnalysisTool = defineTool({
  name: 'get_question_answer_analysis',
  description:
    '分析特定题目的答案分布，包括每个选项的选择人数、正确率、典型错误学生等，帮助教师了解学生的答题思路和常见错误。',
  schema: z.object({
    questionId: z.number().int().positive().describe('题目ID')
  }),
  handler: async args => {
    const { questionId } = args
    try {
      // 1. 查询题目基本信息
      const question = await db.get(
        `
        SELECT 
          q.id,
          q.title,
          q.options,
          q.answer,
          q.analysis,
          q.subject_id,
          s.name as subject_name,
          q.difficulty
        FROM questions q
        LEFT JOIN subjects s ON q.subject_id = s.id
        WHERE q.id = ?
      `,
        [questionId]
      )

      if (!question) {
        return JSON.stringify({
          success: false,
          error: '题目不存在'
        })
      }

      // 解析选项和答案
      let options = []
      try {
        options = question.options ? JSON.parse(question.options) : []
      } catch (e) {
        console.warn('选项解析失败:', e)
      }

      // 2. 查询每个选项的选择统计
      const optionStats = await db.query(
        `
        SELECT 
          qa.user_answer as selected_answer,
          COUNT(*) as select_count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM question_attempts WHERE question_id = ?), 2) as select_percentage
        FROM question_attempts qa
        WHERE qa.question_id = ?
        GROUP BY qa.user_answer
        ORDER BY select_count DESC
      `,
        [questionId, questionId]
      )

      // 3. 查询正确答案的选择情况
      const correctStats = await db.get(
        `
        SELECT 
          COUNT(*) as total_attempts,
          SUM(CASE WHEN qa.user_answer = ? THEN 1 ELSE 0 END) as correct_count,
          ROUND(SUM(CASE WHEN qa.user_answer = ? THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as correct_rate
        FROM question_attempts qa
        WHERE qa.question_id = ?
      `,
        [question.answer, question.answer, questionId]
      )

      // 4. 查询选择错误答案的学生（典型错误案例）
      const wrongStudents = await db.query(
        `
        SELECT 
          u.id as student_id,
          u.username as student_name,
          u.grade,
          qa.user_answer as selected_answer,
          qa.created_at as answer_time
        FROM users u
        JOIN question_attempts qa ON u.id = qa.user_id
        WHERE qa.question_id = ? AND qa.user_answer != ?
        ORDER BY qa.created_at DESC
        LIMIT 10
      `,
        [questionId, question.answer]
      )

      // 5. 查询答题时间分布（分析题目难度）
      const timeDistribution = await db.query(
        `
        SELECT 
          CASE 
            WHEN qa.time_spent <= 30 THEN '快速 (<30秒)'
            WHEN qa.time_spent <= 60 THEN '正常 (30-60秒)'
            WHEN qa.time_spent <= 120 THEN '较慢 (1-2分钟)'
            ELSE '很慢 (>2分钟)'
          END as time_range,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM question_attempts WHERE question_id = ?), 2) as percentage,
          ROUND(AVG(qa.time_spent), 2) as avg_time,
          ROUND(
            SUM(CASE WHEN qa.is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 
            2
          ) as accuracy_in_range
        FROM question_attempts qa
        WHERE qa.question_id = ?
        GROUP BY time_range
        ORDER BY 
          CASE time_range
            WHEN '快速 (<30秒)' THEN 1
            WHEN '正常 (30-60秒)' THEN 2
            WHEN '较慢 (1-2分钟)' THEN 3
            WHEN '很慢 (>2分钟)' THEN 4
          END
      `,
        [questionId, questionId]
      )

      return JSON.stringify({
        success: true,
        data: {
          question_info: {
            ...question,
            options: options,
            correct_answer: question.answer
          },
          option_distribution: optionStats,
          correct_stats: correctStats,
          wrong_students: wrongStudents,
          time_distribution: timeDistribution
        }
      })
    } catch (error) {
      console.error('[getQuestionAnswerAnalysisTool] 查询失败:', error)
      return JSON.stringify({
        success: false,
        error: error.message
      })
    }
  }
})

module.exports = getQuestionAnswerAnalysisTool
