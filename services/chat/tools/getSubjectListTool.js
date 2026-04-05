/**
 * 题库列表查询工具
 * 文件: services/chat/tools/getSubjectListTool.js
 * 功能: 获取所有学科（题库）列表及其统计数据
 */

const { z } = require('zod')
const { defineTool } = require('./toolUtils')
const db = require('../../database')

const getSubjectListTool = defineTool({
  name: 'get_subject_list',
  description: '获取所有学科（题库）列表，包含每个学科的题目数量、答题人数、平均正确率等统计数据。',
  schema: z.object({}),
  handler: async _args => {
    // eslint-disable-line @typescript-eslint/no-unused-vars -- API 规范要求参数
    try {
      // 查询所有学科及其统计数据
      const sql = `
        SELECT 
          s.id,
          s.name as subject_name,
          COUNT(DISTINCT q.id) as total_questions,
          COUNT(DISTINCT ar.user_id) as student_count,
          COUNT(DISTINCT ar.id) as total_attempts,
          COALESCE(
            ROUND(
              SUM(ar.correct_count) * 100.0 / 
              NULLIF(SUM(ar.total_questions), 0), 
              2
            ), 
            0
          ) as avg_accuracy
        FROM subjects s
        LEFT JOIN questions q ON s.id = q.subject_id
        LEFT JOIN answer_records ar ON s.id = ar.subject_id
        GROUP BY s.id, s.name
        ORDER BY s.id
      `

      const subjects = await db.query(sql)

      return JSON.stringify({
        success: true,
        data: {
          total_subjects: subjects.length,
          subjects: subjects
        }
      })
    } catch (error) {
      console.error('[getSubjectListTool] 查询失败:', error)
      return JSON.stringify({
        success: false,
        error: error.message
      })
    }
  }
})

module.exports = getSubjectListTool
