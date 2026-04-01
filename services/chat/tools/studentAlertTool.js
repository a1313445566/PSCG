/**
 * 学生预警工具
 * 文件: services/chat/tools/studentAlertTool.js
 * 功能: 识别学习异常的学生，及时预警
 * 适用场景: 小学教育（学生自律性差，需要及时干预）
 */

const { z } = require('zod')
const { defineTool } = require('./toolUtils')
const db = require('../../database')

const studentAlertTool = defineTool({
  name: 'query_student_alerts',
  description: '学生预警：识别学习异常学生（连续错误、正确率下降、未登录、答题量少）。小学教育刚需工具！',
  schema: z.object({
    grade: z.string().optional().describe('年级(1-6)'),
    className: z.string().optional().describe('班级'),
    alertType: z.enum(['all', 'consecutive_errors', 'accuracy_drop', 'inactive', 'low_activity']).optional().default('all').describe('预警类型: all=全部, consecutive_errors=连续错误, accuracy_drop=正确率下降, inactive=未登录, low_activity=答题量少'),
    days: z.number().int().positive().optional().default(7).describe('统计天数（默认7天）'),
    threshold: z.number().int().min(1).max(100).optional().describe('阈值：连续错误次数/正确率百分比/未登录天数')
  }),
  handler: async args => {
    try {
      const { grade, className, alertType, days = 7, threshold } = args
      const alerts = []

      // 1. 连续错误预警（小学生最需要！）
      if (alertType === 'all' || alertType === 'consecutive_errors') {
        const errorThreshold = threshold || 3
        const errorSQL = `
          SELECT 
            u.id, COALESCE(NULLIF(u.name, ''), u.student_id) as name, u.grade, u.class,
            COUNT(*) as consecutive_errors,
            MAX(qa.created_at) as last_error_time,
            GROUP_CONCAT(DISTINCT s.name) as error_subjects
          FROM (
            SELECT user_id, question_id, is_correct, created_at,
              @error_seq := IF(is_correct = 0, @error_seq + 1, 0) as error_count
            FROM question_attempts, (SELECT @error_seq := 0) as vars
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            ORDER BY user_id, created_at DESC
          ) qa
          JOIN users u ON qa.user_id = u.id
          JOIN questions q ON qa.question_id = q.id
          JOIN subjects s ON q.subject_id = s.id
          WHERE qa.is_correct = 0
          ${grade ? ' AND u.grade = ?' : ''}
          ${className ? ' AND u.class = ?' : ''}
          GROUP BY u.id
          HAVING consecutive_errors >= ?
          ORDER BY consecutive_errors DESC
          LIMIT 50
        `

        const errorParams = [days]
        if (grade) errorParams.push(grade)
        if (className) errorParams.push(className)
        errorParams.push(errorThreshold)

        const errorStudents = await db.query(errorSQL, errorParams)
        
        if (errorStudents.length > 0) {
          alerts.push({
            type: 'consecutive_errors',
            severity: 'high',
            title: '连续错误预警',
            description: `最近${days}天内连续错误超过${errorThreshold}次的学生`,
            count: errorStudents.length,
            students: errorStudents.map(s => ({
              id: s.id,
              name: s.name,
              grade: s.grade,
              class: s.class,
              consecutive_errors: s.consecutive_errors,
              last_error_time: s.last_error_time,
              error_subjects: s.error_subjects,
              suggestion: '建议及时辅导，避免学生丧失信心'
            }))
          })
        }
      }

      // 2. 正确率下降预警
      if (alertType === 'all' || alertType === 'accuracy_drop') {
        const dropThreshold = threshold || 20
        const dropSQL = `
          SELECT 
            u.id, COALESCE(NULLIF(u.name, ''), u.student_id) as name, u.grade, u.class,
            recent.accuracy as recent_accuracy,
            previous.accuracy as previous_accuracy,
            (previous.accuracy - recent.accuracy) as accuracy_drop,
            recent.total_questions as recent_questions
          FROM users u
          JOIN (
            SELECT 
              user_id,
              ROUND(SUM(correct_count) * 100.0 / NULLIF(SUM(total_questions), 0), 2) as accuracy,
              SUM(total_questions) as total_questions
            FROM answer_records
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY user_id
          ) recent ON u.id = recent.user_id
          JOIN (
            SELECT 
              user_id,
              ROUND(SUM(correct_count) * 100.0 / NULLIF(SUM(total_questions), 0), 2) as accuracy
            FROM answer_records
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) 
              AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY user_id
          ) previous ON u.id = previous.user_id
          WHERE (previous.accuracy - recent.accuracy) >= ?
          ${grade ? ' AND u.grade = ?' : ''}
          ${className ? ' AND u.class = ?' : ''}
          ORDER BY accuracy_drop DESC
          LIMIT 50
        `

        const dropParams = [days, days * 2, days, dropThreshold]
        if (grade) dropParams.push(grade)
        if (className) dropParams.push(className)

        const dropStudents = await db.query(dropSQL, dropParams)
        
        if (dropStudents.length > 0) {
          alerts.push({
            type: 'accuracy_drop',
            severity: 'medium',
            title: '正确率下降预警',
            description: `最近${days}天正确率下降超过${dropThreshold}%的学生`,
            count: dropStudents.length,
            students: dropStudents.map(s => ({
              id: s.id,
              name: s.name,
              grade: s.grade,
              class: s.class,
              recent_accuracy: s.recent_accuracy,
              previous_accuracy: s.previous_accuracy,
              accuracy_drop: s.accuracy_drop,
              recent_questions: s.recent_questions,
              suggestion: '建议了解原因，可能是知识点难度增加或学习状态不佳'
            }))
          })
        }
      }

      // 3. 未登录预警
      if (alertType === 'all' || alertType === 'inactive') {
        const inactiveThreshold = threshold || 3
        const inactiveSQL = `
          SELECT 
            u.id, COALESCE(NULLIF(u.name, ''), u.student_id) as name, u.grade, u.class, u.points,
            MAX(ar.created_at) as last_active_time,
            DATEDIFF(NOW(), MAX(ar.created_at)) as inactive_days
          FROM users u
          LEFT JOIN answer_records ar ON u.id = ar.user_id
          WHERE u.grade REGEXP '^[1-6]$'
          ${grade ? ' AND u.grade = ?' : ''}
          ${className ? ' AND u.class = ?' : ''}
          GROUP BY u.id
          HAVING inactive_days >= ? OR inactive_days IS NULL
          ORDER BY inactive_days DESC
          LIMIT 50
        `

        const inactiveParams = []
        if (grade) inactiveParams.push(grade)
        if (className) inactiveParams.push(className)
        inactiveParams.push(inactiveThreshold)

        const inactiveStudents = await db.query(inactiveSQL, inactiveParams)
        
        if (inactiveStudents.length > 0) {
          alerts.push({
            type: 'inactive',
            severity: 'high',
            title: '未登录预警',
            description: `超过${inactiveThreshold}天未登录的学生`,
            count: inactiveStudents.length,
            students: inactiveStudents.map(s => ({
              id: s.id,
              name: s.name,
              grade: s.grade,
              class: s.class,
              points: s.points,
              last_active_time: s.last_active_time,
              inactive_days: s.inactive_days || 999,
              suggestion: '建议及时联系家长，了解学生情况'
            }))
          })
        }
      }

      // 4. 答题量少预警
      if (alertType === 'all' || alertType === 'low_activity') {
        const activitySQL = `
          SELECT 
            u.id, COALESCE(NULLIF(u.name, ''), u.student_id) as name, u.grade, u.class,
            COUNT(DISTINCT ar.id) as sessions,
            SUM(ar.total_questions) as total_questions,
            avg_stats.avg_sessions,
            avg_stats.avg_questions,
            ROUND(COUNT(DISTINCT ar.id) * 100.0 / NULLIF(avg_stats.avg_sessions, 0), 2) as activity_ratio
          FROM users u
          LEFT JOIN answer_records ar ON u.id = ar.user_id 
            AND ar.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          CROSS JOIN (
            SELECT 
              AVG(sessions) as avg_sessions,
              AVG(questions) as avg_questions
            FROM (
              SELECT 
                user_id,
                COUNT(DISTINCT id) as sessions,
                SUM(total_questions) as questions
              FROM answer_records
              WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
              GROUP BY user_id
            ) as t
          ) as avg_stats
          WHERE u.grade REGEXP '^[1-6]$'
          ${grade ? ' AND u.grade = ?' : ''}
          ${className ? ' AND u.class = ?' : ''}
          GROUP BY u.id, avg_stats.avg_sessions, avg_stats.avg_questions
          HAVING activity_ratio < 50
          ORDER BY activity_ratio ASC
          LIMIT 50
        `

        const activityParams = [days, days]
        if (grade) activityParams.push(grade)
        if (className) activityParams.push(className)

        const lowActivityStudents = await db.query(activitySQL, activityParams)
        
        if (lowActivityStudents.length > 0) {
          alerts.push({
            type: 'low_activity',
            severity: 'medium',
            title: '答题量少预警',
            description: `最近${days}天答题量低于班级平均50%的学生`,
            count: lowActivityStudents.length,
            students: lowActivityStudents.map(s => ({
              id: s.id,
              name: s.name,
              grade: s.grade,
              class: s.class,
              sessions: s.sessions || 0,
              total_questions: s.total_questions || 0,
              avg_sessions: Math.round(s.avg_sessions),
              avg_questions: Math.round(s.avg_questions),
              activity_ratio: s.activity_ratio,
              suggestion: '建议鼓励学生增加练习量，提高学习积极性'
            }))
          })
        }
      }

      // 返回结果
      return JSON.stringify({
        success: true,
        data: {
          total_alerts: alerts.reduce((sum, a) => sum + a.count, 0),
          alert_types: alerts.length,
          alerts,
          summary: {
            high_severity: alerts.filter(a => a.severity === 'high').reduce((sum, a) => sum + a.count, 0),
            medium_severity: alerts.filter(a => a.severity === 'medium').reduce((sum, a) => sum + a.count, 0)
          },
          recommendation: alerts.length > 0 
            ? `发现 ${alerts.reduce((sum, a) => sum + a.count, 0)} 个预警学生，建议优先关注高危预警`
            : '暂无预警学生，学生整体学习状态良好'
        }
      })
    } catch (error) {
      console.error('[studentAlertTool] 查询失败:', error)
      return JSON.stringify({ success: false, error: error.message })
    }
  }
})

module.exports = studentAlertTool
