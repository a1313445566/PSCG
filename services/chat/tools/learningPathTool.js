/**
 * 学习轨迹追踪工具
 * 文件: services/chat/tools/learningPathTool.js
 * 功能: 追踪学生的学习路径、答题历史、进步曲线
 * 适用场景: 小学教育（家校沟通、个性化指导）
 */

const { z } = require('zod')
const { defineTool } = require('./toolUtils')
const db = require('../../database')

const learningPathTool = defineTool({
  name: 'query_learning_path',
  description: '学习轨迹追踪：查看学生答题历史、进步曲线、高光时刻。小学家校沟通工具！',
  schema: z.object({
    studentId: z.number().int().positive().describe('学生ID'),
    days: z.number().int().positive().optional().default(30).describe('追踪天数（默认30天）'),
    detail: z
      .enum(['summary', 'timeline', 'trend', 'all'])
      .optional()
      .default('all')
      .describe('详情级别: summary=概要, timeline=时间线, trend=趋势, all=全部')
  }),
  handler: async args => {
    try {
      const { studentId, days = 30, detail: _detail } = args // eslint-disable-line @typescript-eslint/no-unused-vars -- detail 暂未使用

      // 1. 学生基本信息
      const studentInfo = await db.get(
        `
        SELECT 
          u.id, COALESCE(NULLIF(u.name, ''), u.student_id) as name, u.grade, u.class, u.points,
          COUNT(DISTINCT ar.id) as total_sessions,
          SUM(ar.total_questions) as total_questions,
          SUM(ar.correct_count) as total_correct,
          ROUND(SUM(ar.correct_count) * 100.0 / NULLIF(SUM(ar.total_questions), 0), 2) as overall_accuracy
        FROM users u
        LEFT JOIN answer_records ar ON u.id = ar.user_id
        WHERE u.id = ?
        GROUP BY u.id
      `,
        [studentId]
      )

      if (!studentInfo) {
        return JSON.stringify({ success: false, error: '学生不存在' })
      }

      // 2. 学习轨迹（每日）
      const dailyPathSQL = `
        SELECT 
          DATE(ar.created_at) as date,
          COUNT(DISTINCT ar.id) as sessions,
          SUM(ar.total_questions) as questions,
          SUM(ar.correct_count) as correct,
          ROUND(SUM(ar.correct_count) * 100.0 / NULLIF(SUM(ar.total_questions), 0), 2) as accuracy,
          GROUP_CONCAT(DISTINCT s.name) as subjects
        FROM answer_records ar
        LEFT JOIN subjects s ON ar.subject_id = s.id
        WHERE ar.user_id = ?
          AND ar.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(ar.created_at)
        ORDER BY date DESC
      `

      const dailyPath = await db.query(dailyPathSQL, [studentId, days])

      // 3. 班级平均水平（对比用）
      const classAverageSQL = `
        SELECT 
          DATE(ar.created_at) as date,
          ROUND(AVG(daily_stats.accuracy), 2) as class_avg_accuracy,
          AVG(daily_stats.questions) as class_avg_questions
        FROM (
          SELECT 
            ar.user_id,
            DATE(ar.created_at) as date,
            SUM(ar.total_questions) as questions,
            SUM(ar.correct_count) as correct,
            ROUND(SUM(ar.correct_count) * 100.0 / NULLIF(SUM(ar.total_questions), 0), 2) as accuracy
          FROM answer_records ar
          JOIN users u ON ar.user_id = u.id
          WHERE u.grade = ? AND u.class = ?
            AND ar.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          GROUP BY ar.user_id, DATE(ar.created_at)
        ) as daily_stats
        JOIN answer_records ar ON TRUE
        GROUP BY DATE(ar.created_at)
        ORDER BY date DESC
      `

      const classAverage = await db.query(classAverageSQL, [
        studentInfo.grade,
        studentInfo.class,
        days
      ])

      // 4. 进步曲线（按周）
      const weeklyTrendSQL = `
        SELECT 
          YEARWEEK(ar.created_at) as week,
          DATE(DATE_SUB(ar.created_at, INTERVAL WEEKDAY(ar.created_at) DAY)) as week_start,
          COUNT(DISTINCT ar.id) as sessions,
          SUM(ar.total_questions) as questions,
          SUM(ar.correct_count) as correct,
          ROUND(SUM(ar.correct_count) * 100.0 / NULLIF(SUM(ar.total_questions), 0), 2) as accuracy
        FROM answer_records ar
        WHERE ar.user_id = ?
          AND ar.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY YEARWEEK(ar.created_at)
        ORDER BY week DESC
      `

      const weeklyTrend = await db.query(weeklyTrendSQL, [studentId, days])

      // 5. 高光时刻
      const highlightsSQL = `
        SELECT 
          '连续答对' as type,
          DATE(created_at) as date,
          COUNT(*) as count,
          '连续答对多道题目' as description
        FROM (
          SELECT 
            created_at,
            is_correct,
            @consecutive := IF(is_correct = 1, @consecutive + 1, 0) as streak
          FROM question_attempts, (SELECT @consecutive := 0) as vars
          WHERE user_id = ?
            AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          ORDER BY created_at
        ) as t
        WHERE is_correct = 1
        GROUP BY DATE(created_at)
        HAVING MAX(streak) >= 5
        ORDER BY MAX(streak) DESC
        LIMIT 5
      `

      const highlights = await db.query(highlightsSQL, [studentId, days])

      // 6. 学科表现
      const subjectPerformanceSQL = `
        SELECT 
          s.id as subject_id,
          s.name as subject_name,
          COUNT(DISTINCT ar.id) as sessions,
          SUM(ar.total_questions) as questions,
          SUM(ar.correct_count) as correct,
          ROUND(SUM(ar.correct_count) * 100.0 / NULLIF(SUM(ar.total_questions), 0), 2) as accuracy,
          MAX(ar.created_at) as last_practiced
        FROM answer_records ar
        JOIN subjects s ON ar.subject_id = s.id
        WHERE ar.user_id = ?
          AND ar.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY s.id, s.name
        ORDER BY accuracy DESC
      `

      const subjectPerformance = await db.query(subjectPerformanceSQL, [studentId, days])

      // 7. 生成学习评语
      const avgAccuracy =
        dailyPath.reduce((sum, d) => sum + (d.accuracy || 0), 0) / dailyPath.length
      const totalDays = dailyPath.length
      const avgQuestionsPerDay = studentInfo.total_questions / days

      let evaluation = ''
      if (avgAccuracy >= 90) {
        evaluation = '学习效果优秀，正确率很高，继续保持！'
      } else if (avgAccuracy >= 80) {
        evaluation = '学习效果良好，正确率较高，继续保持努力！'
      } else if (avgAccuracy >= 70) {
        evaluation = '学习效果中等，建议加强薄弱知识点练习。'
      } else if (avgAccuracy >= 60) {
        evaluation = '学习效果及格，需要多加练习，提高正确率。'
      } else {
        evaluation = '学习效果不理想，建议及时找老师辅导，找出问题所在。'
      }

      return JSON.stringify({
        success: true,
        data: {
          student: {
            id: studentInfo.id,
            name: studentInfo.name,
            grade: studentInfo.grade,
            class: studentInfo.class,
            points: studentInfo.points,
            overall_accuracy: studentInfo.overall_accuracy,
            total_questions: studentInfo.total_questions,
            total_sessions: studentInfo.total_sessions
          },
          tracking_period: {
            days: days,
            active_days: totalDays,
            total_questions: studentInfo.total_questions,
            avg_questions_per_day: Math.round(avgQuestionsPerDay)
          },
          daily_path: dailyPath.map(d => ({
            date: d.date,
            sessions: d.sessions,
            questions: d.questions,
            correct: d.correct,
            accuracy: d.accuracy,
            subjects: d.subjects,
            class_avg_accuracy: classAverage.find(c => c.date === d.date)?.class_avg_accuracy || 0,
            vs_class:
              d.accuracy > (classAverage.find(c => c.date === d.date)?.class_avg_accuracy || 0)
                ? '高于平均'
                : '低于平均'
          })),
          weekly_trend: weeklyTrend.map(w => ({
            week_start: w.week_start,
            sessions: w.sessions,
            questions: w.questions,
            accuracy: w.accuracy,
            trend: '对比上周数据'
          })),
          highlights: highlights.map(h => ({
            type: h.type,
            date: h.date,
            count: h.count,
            description: h.description
          })),
          subject_performance: subjectPerformance.map(sp => ({
            subject_id: sp.subject_id,
            subject_name: sp.subject_name,
            sessions: sp.sessions,
            questions: sp.questions,
            accuracy: sp.accuracy,
            last_practiced: sp.last_practiced,
            status: sp.accuracy >= 80 ? '优秀' : sp.accuracy >= 60 ? '良好' : '需加强'
          })),
          evaluation: {
            avg_accuracy: Math.round(avgAccuracy),
            grade:
              avgAccuracy >= 90
                ? 'A'
                : avgAccuracy >= 80
                  ? 'B'
                  : avgAccuracy >= 70
                    ? 'C'
                    : avgAccuracy >= 60
                      ? 'D'
                      : 'E',
            comment: evaluation,
            suggestions:
              avgAccuracy >= 80
                ? ['继续保持良好的学习习惯', '适当挑战难题，拓展思维']
                : ['增加练习量', '重点复习薄弱知识点', '及时向老师请教问题']
          },
          recommendation: `${studentInfo.name} 最近${days}天学习${totalDays}天，平均正确率${Math.round(avgAccuracy)}%，${evaluation}`
        }
      })
    } catch (error) {
      console.error('[learningPathTool] 查询失败:', error)
      return JSON.stringify({ success: false, error: error.message })
    }
  }
})

module.exports = learningPathTool
