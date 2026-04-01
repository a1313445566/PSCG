/**
 * 班级对比工具
 * 文件: services/chat/tools/classComparisonTool.js
 * 功能: 对比多个班级的学习表现
 * 适用场景: 小学教育管理（班级质量评估）
 */

const { z } = require('zod')
const { defineTool } = require('./toolUtils')
const db = require('../../database')

const classComparisonTool = defineTool({
  name: 'query_class_comparison',
  description: '班级对比分析：对比多个班级的学习表现、正确率、进步幅度。小学教育管理工具！',
  schema: z.object({
    grade: z.string().describe('年级(1-6)'),
    classes: z.array(z.string()).min(2).max(10).describe('班级列表（如["一班", "二班"]）'),
    subjectId: z.number().int().positive().optional().describe('学科ID'),
    compareBy: z.enum(['accuracy', 'progress', 'activity', 'all']).optional().default('all').describe('对比维度: accuracy=正确率, progress=进步幅度, activity=活跃度, all=全部')
  }),
  handler: async args => {
    try {
      const { grade, classes, subjectId, compareBy } = args

      const comparisonResults = []

      // 对每个班级进行统计
      for (const className of classes) {
        // 1. 基础统计
        const basicStats = await db.get(`
          SELECT 
            COUNT(DISTINCT u.id) as students,
            COUNT(DISTINCT ar.id) as sessions,
            SUM(ar.total_questions) as total_questions,
            SUM(ar.correct_count) as total_correct,
            ROUND(SUM(ar.correct_count) * 100.0 / NULLIF(SUM(ar.total_questions), 0), 2) as accuracy,
            ROUND(AVG(u.points), 2) as avg_points
          FROM users u
          LEFT JOIN answer_records ar ON u.id = ar.user_id
          ${subjectId ? ' AND ar.subject_id = ?' : ''}
          WHERE u.grade = ? AND u.class = ?
        `, subjectId ? [subjectId, grade, className] : [grade, className])

        // 2. 本周 vs 上周对比（进步幅度）
        const weeklyComparison = await db.get(`
          SELECT 
            (SELECT ROUND(SUM(correct_count) * 100.0 / NULLIF(SUM(total_questions), 0), 2)
             FROM answer_records ar
             JOIN users u ON ar.user_id = u.id
             WHERE u.grade = ? AND u.class = ?
               ${subjectId ? ' AND ar.subject_id = ?' : ''}
               AND ar.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ) as this_week_accuracy,
            (SELECT ROUND(SUM(correct_count) * 100.0 / NULLIF(SUM(total_questions), 0), 2)
             FROM answer_records ar
             JOIN users u ON ar.user_id = u.id
             WHERE u.grade = ? AND u.class = ?
               ${subjectId ? ' AND ar.subject_id = ?' : ''}
               AND ar.created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
               AND ar.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
            ) as last_week_accuracy
        `, subjectId 
          ? [grade, className, subjectId, grade, className, subjectId] 
          : [grade, className, grade, className]
        )

        const progressChange = (weeklyComparison.this_week_accuracy || 0) - (weeklyComparison.last_week_accuracy || 0)

        // 3. 学生正确率分布
        const accuracyDistribution = await db.query(`
          SELECT 
            CASE 
              WHEN accuracy >= 90 THEN '优秀'
              WHEN accuracy >= 80 THEN '良好'
              WHEN accuracy >= 70 THEN '中等'
              WHEN accuracy >= 60 THEN '及格'
              ELSE '不及格'
            END as level,
            COUNT(*) as count
          FROM (
            SELECT u.id,
              ROUND(SUM(ar.correct_count) * 100.0 / NULLIF(SUM(ar.total_questions), 0), 2) as accuracy
            FROM users u
            LEFT JOIN answer_records ar ON u.id = ar.user_id
            ${subjectId ? ' AND ar.subject_id = ?' : ''}
            WHERE u.grade = ? AND u.class = ?
            GROUP BY u.id
          ) as t
          GROUP BY level
          ORDER BY 
            CASE level
              WHEN '优秀' THEN 1
              WHEN '良好' THEN 2
              WHEN '中等' THEN 3
              WHEN '及格' THEN 4
              ELSE 5
            END
        `, subjectId ? [subjectId, grade, className] : [grade, className])

        // 4. TOP5 学生
        const topStudents = await db.query(`
          SELECT u.name, u.points,
            COUNT(DISTINCT ar.id) as sessions,
            ROUND(SUM(ar.correct_count) * 100.0 / NULLIF(SUM(ar.total_questions), 0), 2) as accuracy
          FROM users u
          LEFT JOIN answer_records ar ON u.id = ar.user_id
          ${subjectId ? ' AND ar.subject_id = ?' : ''}
          WHERE u.grade = ? AND u.class = ?
          GROUP BY u.id
          ORDER BY u.points DESC
          LIMIT 5
        `, subjectId ? [subjectId, grade, className] : [grade, className])

        comparisonResults.push({
          class: className,
          grade: grade,
          students: basicStats?.students || 0,
          basic_stats: {
            sessions: basicStats?.sessions || 0,
            total_questions: basicStats?.total_questions || 0,
            accuracy: basicStats?.accuracy || 0,
            avg_points: basicStats?.avg_points || 0
          },
          weekly_progress: {
            this_week_accuracy: weeklyComparison.this_week_accuracy || 0,
            last_week_accuracy: weeklyComparison.last_week_accuracy || 0,
            progress_change: progressChange,
            trend: progressChange > 5 ? '进步显著' : progressChange > 0 ? '略有进步' : progressChange < -5 ? '退步明显' : '保持稳定'
          },
          accuracy_distribution: {
            excellent: accuracyDistribution.find(d => d.level === '优秀')?.count || 0,
            good: accuracyDistribution.find(d => d.level === '良好')?.count || 0,
            average: accuracyDistribution.find(d => d.level === '中等')?.count || 0,
            pass: accuracyDistribution.find(d => d.level === '及格')?.count || 0,
            fail: accuracyDistribution.find(d => d.level === '不及格')?.count || 0
          },
          top_students: topStudents
        })
      }

      // 生成对比分析
      const sortedByAccuracy = [...comparisonResults].sort((a, b) => 
        b.basic_stats.accuracy - a.basic_stats.accuracy
      )

      const sortedByProgress = [...comparisonResults].sort((a, b) => 
        b.weekly_progress.progress_change - a.weekly_progress.progress_change
      )

      const sortedByActivity = [...comparisonResults].sort((a, b) => 
        b.basic_stats.sessions - a.basic_stats.sessions
      )

      return JSON.stringify({
        success: true,
        data: {
          comparison_scope: {
            grade: grade,
            classes: classes,
            subject_id: subjectId || '全部学科'
          },
          comparison_results: comparisonResults,
          ranking: {
            by_accuracy: sortedByAccuracy.map((c, index) => ({
              rank: index + 1,
              class: c.class,
              accuracy: c.basic_stats.accuracy,
              students: c.students
            })),
            by_progress: sortedByProgress.map((c, index) => ({
              rank: index + 1,
              class: c.class,
              progress_change: c.weekly_progress.progress_change,
              trend: c.weekly_progress.trend
            })),
            by_activity: sortedByActivity.map((c, index) => ({
              rank: index + 1,
              class: c.class,
              sessions: c.basic_stats.sessions,
              total_questions: c.basic_stats.total_questions
            }))
          },
          insights: {
            best_accuracy: {
              class: sortedByAccuracy[0]?.class,
              accuracy: sortedByAccuracy[0]?.basic_stats.accuracy,
              suggestion: '学习效果最佳，建议分享教学经验'
            },
            most_progress: {
              class: sortedByProgress[0]?.class,
              progress: sortedByProgress[0]?.weekly_progress.progress_change,
              suggestion: '进步最快，继续保持'
            },
            most_active: {
              class: sortedByActivity[0]?.class,
              sessions: sortedByActivity[0]?.basic_stats.sessions,
              suggestion: '学习最积极，值得表扬'
            }
          },
          recommendation: `对比 ${classes.length} 个班级，${sortedByAccuracy[0]?.class} 正确率最高(${sortedByAccuracy[0]?.basic_stats.accuracy}%)，${sortedByProgress[0]?.class} 进步最快(+${sortedByProgress[0]?.weekly_progress.progress_change}%)`
        }
      })
    } catch (error) {
      console.error('[classComparisonTool] 查询失败:', error)
      return JSON.stringify({ success: false, error: error.message })
    }
  }
})

module.exports = classComparisonTool