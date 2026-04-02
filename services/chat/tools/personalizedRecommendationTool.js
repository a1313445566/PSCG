/**
 * 个性化推荐工具
 * 文件: services/chat/tools/personalizedRecommendationTool.js
 * 功能: 根据学生薄弱点推荐适合的题目
 * 适用场景: 小学教育（分层教学、因材施教）
 */

const { z } = require('zod')
const { defineTool } = require('./toolUtils')
const db = require('../../database')

const personalizedRecommendationTool = defineTool({
  name: 'query_personalized_recommendations',
  description: '个性化题目推荐：根据学生薄弱知识点推荐适合的题目。小学分层教学工具！',
  schema: z.object({
    studentId: z.number().int().positive().describe('学生ID'),
    subjectId: z.number().int().positive().optional().describe('学科ID'),
    count: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .default(10)
      .describe('推荐题目数量（默认10）'),
    difficultyRange: z
      .enum(['adaptive', 'easy', 'medium', 'hard'])
      .optional()
      .default('adaptive')
      .describe('难度策略: adaptive=自适应, easy=基础, medium=中等, hard=挑战'),
    focusWeak: z.boolean().optional().default(true).describe('是否聚焦薄弱知识点')
  }),
  handler: async args => {
    try {
      const { studentId, subjectId, count = 10, difficultyRange, focusWeak = true } = args

      // 1. 查询学生基本信息和整体表现
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

      // 2. 查询学生薄弱知识点
      const weakPointsSQL = `
        SELECT 
          lp.subcategory_id,
          sc.name as subcategory_name,
          s.id as subject_id,
          s.name as subject_name,
          lp.mastery_level,
          lp.progress_percentage,
          lp.total_attempts,
          lp.recent_accuracy
        FROM learning_progress lp
        JOIN subcategories sc ON lp.subcategory_id = sc.id
        JOIN subjects s ON sc.subject_id = s.id
        WHERE lp.user_id = ?
          AND (lp.mastery_level < 70 OR lp.progress_percentage < 70)
        ${subjectId ? ' AND s.id = ?' : ''}
        ORDER BY lp.mastery_level ASC, lp.progress_percentage ASC
        LIMIT 10
      `

      const weakPointsParams = [studentId]
      if (subjectId) weakPointsParams.push(subjectId)

      const weakPoints = await db.query(weakPointsSQL, weakPointsParams)

      // 3. 根据策略确定题目难度
      let targetDifficulty
      if (difficultyRange === 'adaptive') {
        // 自适应：根据学生整体正确率调整
        const accuracy = studentInfo.overall_accuracy || 0
        if (accuracy >= 85) {
          targetDifficulty = [2, 3] // 优秀学生：中等+难题
        } else if (accuracy >= 70) {
          targetDifficulty = [1, 2] // 良好学生：基础+中等
        } else if (accuracy >= 60) {
          targetDifficulty = [1] // 及格学生：基础题
        } else {
          targetDifficulty = [1] // 不及格学生：只推基础题
        }
      } else if (difficultyRange === 'easy') {
        targetDifficulty = [1]
      } else if (difficultyRange === 'medium') {
        targetDifficulty = [2]
      } else if (difficultyRange === 'hard') {
        targetDifficulty = [3]
      }

      // 4. 推荐题目
      let recommendations = []

      if (focusWeak && weakPoints.length > 0) {
        // 聚焦薄弱知识点
        for (const weakPoint of weakPoints) {
          if (recommendations.length >= count) break

          const questionsSQL = `
            SELECT 
              q.id,
              LEFT(q.content, 80) as content_preview,
              q.type,
              q.difficulty,
              sc.name as subcategory_name,
              s.name as subject_name,
              q.correct_answer,
              q.explanation,
              (SELECT COUNT(*) FROM question_attempts qa WHERE qa.question_id = q.id AND qa.is_correct = 1) * 100.0 / 
                NULLIF((SELECT COUNT(*) FROM question_attempts qa WHERE qa.question_id = q.id), 0) as success_rate,
              (SELECT COUNT(*) FROM question_attempts qa WHERE qa.user_id = ? AND qa.question_id = q.id) as my_attempts
            FROM questions q
            JOIN subcategories sc ON q.subcategory_id = sc.id
            JOIN subjects s ON q.subject_id = s.id
            WHERE q.subcategory_id = ?
              AND q.difficulty IN (${targetDifficulty.join(',')})
              AND NOT EXISTS (
                SELECT 1 FROM question_attempts qa 
                WHERE qa.user_id = ? AND qa.question_id = q.id AND qa.is_correct = 1
              )
            ORDER BY RAND()
            LIMIT ?
          `

          const questionsForWeak = await db.query(questionsSQL, [
            studentId,
            weakPoint.subcategory_id,
            studentId,
            Math.ceil(count / weakPoints.length)
          ])

          recommendations.push(
            ...questionsForWeak.map(q => ({
              ...q,
              recommendation_reason: '薄弱知识点',
              subcategory_id: weakPoint.subcategory_id,
              mastery_level: weakPoint.mastery_level,
              progress_percentage: weakPoint.progress_percentage,
              priority: 'high'
            }))
          )
        }
      }

      // 5. 如果题目不够，补充其他题目
      if (recommendations.length < count) {
        const remaining = count - recommendations.length

        const additionalSQL = `
          SELECT 
            q.id,
            LEFT(q.content, 80) as content_preview,
            q.type,
            q.difficulty,
            sc.name as subcategory_name,
            s.name as subject_name,
            q.correct_answer,
            q.explanation,
            (SELECT COUNT(*) FROM question_attempts qa WHERE qa.question_id = q.id AND qa.is_correct = 1) * 100.0 / 
              NULLIF((SELECT COUNT(*) FROM question_attempts qa WHERE qa.question_id = q.id), 0) as success_rate,
            (SELECT COUNT(*) FROM question_attempts qa WHERE qa.user_id = ? AND qa.question_id = q.id) as my_attempts
          FROM questions q
          JOIN subcategories sc ON q.subcategory_id = sc.id
          JOIN subjects s ON q.subject_id = s.id
          WHERE q.difficulty IN (${targetDifficulty.join(',')})
            ${subjectId ? ' AND q.subject_id = ?' : ''}
            AND NOT EXISTS (
              SELECT 1 FROM question_attempts qa 
              WHERE qa.user_id = ? AND qa.question_id = q.id AND qa.is_correct = 1
            )
          ORDER BY RAND()
          LIMIT ?
        `

        const additionalParams = [studentId]
        if (subjectId) additionalParams.push(subjectId)
        additionalParams.push(studentId, remaining)

        const additionalQuestions = await db.query(additionalSQL, additionalParams)

        recommendations.push(
          ...additionalQuestions.map(q => ({
            ...q,
            recommendation_reason: '拓展练习',
            priority: 'medium'
          }))
        )
      }

      // 6. 去重并限制数量
      recommendations = recommendations
        .filter((q, index, self) => self.findIndex(t => t.id === q.id) === index)
        .slice(0, count)

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
            total_questions: studentInfo.total_questions
          },
          recommendation_strategy: {
            type: difficultyRange,
            target_difficulty: targetDifficulty.map(d =>
              d === 1 ? '基础' : d === 2 ? '中等' : '困难'
            ),
            focus_weak: focusWeak,
            weak_points_count: weakPoints.length
          },
          recommendations: recommendations.map((q, index) => ({
            rank: index + 1,
            id: q.id,
            content_preview: q.content_preview,
            type: q.type,
            difficulty: q.difficulty === 1 ? '基础' : q.difficulty === 2 ? '中等' : '困难',
            subcategory_name: q.subcategory_name,
            subject_name: q.subject_name,
            success_rate: Math.round(q.success_rate || 0),
            my_attempts: q.my_attempts || 0,
            recommendation_reason: q.recommendation_reason,
            priority: q.priority,
            mastery_level: q.mastery_level,
            explanation: '详细解析请查看题目详情'
          })),
          weak_points: weakPoints.slice(0, 5).map(wp => ({
            subcategory_id: wp.subcategory_id,
            subcategory_name: wp.subcategory_name,
            subject_name: wp.subject_name,
            mastery_level: wp.mastery_level,
            progress_percentage: wp.progress_percentage,
            suggestion: '建议优先练习此知识点'
          })),
          summary: {
            total_recommended: recommendations.length,
            high_priority: recommendations.filter(r => r.priority === 'high').length,
            medium_priority: recommendations.filter(r => r.priority === 'medium').length,
            difficulty_distribution: {
              easy: recommendations.filter(r => r.difficulty === 1).length,
              medium: recommendations.filter(r => r.difficulty === 2).length,
              hard: recommendations.filter(r => r.difficulty === 3).length
            }
          },
          recommendation: `为 ${studentInfo.name} 推荐 ${recommendations.length} 道题目，其中 ${recommendations.filter(r => r.priority === 'high').length} 道为薄弱知识点专项练习`
        }
      })
    } catch (error) {
      console.error('[personalizedRecommendationTool] 查询失败:', error)
      return JSON.stringify({ success: false, error: error.message })
    }
  }
})

module.exports = personalizedRecommendationTool
