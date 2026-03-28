/**
 * 答题行为 API
 */

const express = require('express')
const router = express.Router()
const adminAuth = require('../middleware/adminAuth')
const {
  validateBehaviors,
  validateUserId,
  validatePriority
} = require('../middleware/aiInputValidation')
const db = require('../services/database')
const aiService = require('../services/aiService')
const queueService = require('../services/aiQueueService')

/**
 * POST /api/answer-behavior/batch
 * 批量提交答题行为（优化性能）
 */
router.post('/batch', validateBehaviors, async (req, res) => {
  try {
    const { behaviors } = req.body

    if (!Array.isArray(behaviors) || behaviors.length === 0) {
      return res.status(400).json({ error: '请提供行为数据列表' })
    }

    // 验证并清理数据
    const validBehaviors = behaviors.filter(
      b =>
        b.userId &&
        b.questionId &&
        typeof b.answerTime === 'number' &&
        typeof b.answerModifications === 'number'
    )

    if (validBehaviors.length === 0) {
      return res.status(400).json({ error: '没有有效的行为数据' })
    }

    // 批量插入 - 使用正确的占位符语法
    const placeholders = validBehaviors.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')
    const values = validBehaviors.flatMap(b => [
      b.userId,
      b.questionId,
      b.answerTime,
      b.answerModifications,
      b.isFirstAnswerCorrect ? 1 : 0,
      b.finalAnswer || '',
      b.isCorrect ? 1 : 0,
      b.hesitationTime || 0,
      b.skippedAndReturned ? 1 : 0,
      b.sessionId || null,
      new Date()
    ])

    await db.query(
      `INSERT INTO answer_behavior 
       (user_id, question_id, answer_time, answer_modifications, is_first_answer_correct,
        final_answer, is_correct, hesitation_time, skipped_and_returned, session_id, created_at)
       VALUES ${placeholders}`,
      values
    )

    res.json({
      success: true,
      insertedCount: validBehaviors.length,
      skippedCount: behaviors.length - validBehaviors.length
    })
  } catch (error) {
    console.error('[批量提交答题行为] 失败:', error)
    res.status(500).json({ error: '批量提交失败，请稍后重试' })
  }
})

/**
 * GET /api/answer-behavior/user-style/:userId
 * 获取用户学习风格分析
 */
router.get('/user-style/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params

    // 尝试从缓存获取
    const cacheKey = `learning_style_${userId}`
    const cached = await aiService.getFromCache(aiService.generateQueryHash(cacheKey, {}))

    if (cached) {
      return res.json({
        success: true,
        styleAnalysis: JSON.parse(cached),
        cached: true
      })
    }

    // 检查是否已有分析结果
    const styleAnalysis = await db.get('SELECT * FROM user_learning_style WHERE user_id = ?', [
      userId
    ])

    // 如果没有或数据过旧，添加到任务队列
    if (!styleAnalysis || shouldReanalyze(styleAnalysis)) {
      const taskId = await queueService.addTask('user_learning_style', userId, 5)

      return res.json({
        success: false,
        message: '学习风格分析任务已添加到队列',
        taskId,
        existingAnalysis: styleAnalysis
      })
    }

    // 缓存结果
    await aiService.saveToCache(
      aiService.generateQueryHash(cacheKey, {}),
      cacheKey,
      JSON.stringify(styleAnalysis)
    )

    res.json({
      success: true,
      styleAnalysis
    })
  } catch (error) {
    console.error('[学习风格分析] 失败:', error)
    res.status(500).json({ error: '学习风格分析失败，请稍后重试' })
  }
})

/**
 * POST /api/answer-behavior/analyze-style
 * 重新分析学习风格
 */
router.post('/analyze-style', adminAuth, validateUserId, validatePriority, async (req, res) => {
  try {
    const { userId, priority = 5 } = req.body

    if (!userId) {
      return res.status(400).json({ error: '请提供用户ID' })
    }

    // 检查用户是否存在
    const user = await db.get('SELECT id, name, student_id FROM users WHERE id = ?', [userId])
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    // 检查答题数据是否足够
    const behaviorCount = await db.get(
      'SELECT COUNT(*) as count FROM answer_behavior WHERE user_id = ?',
      [userId]
    )

    if (!behaviorCount || behaviorCount.count < 10) {
      return res.status(400).json({
        error: `答题数据不足，当前仅 ${behaviorCount?.count || 0} 次答题记录，至少需要 10 次`,
        currentCount: behaviorCount?.count || 0,
        requiredCount: 10
      })
    }

    // 添加到任务队列
    const taskId = await queueService.addTask('user_learning_style', userId, priority)

    res.json({
      success: true,
      message: '学习风格分析任务已添加到队列',
      taskId,
      queuePosition: await getQueuePosition(taskId),
      userName: user.name || user.student_id
    })
  } catch (error) {
    console.error('[重新分析学习风格] 失败:', error)
    res.status(500).json({ error: '重新分析失败，请稍后重试' })
  }
})

/**
 * POST /api/answer-behavior/analyze-error
 * 分析错题原因
 */
router.post('/analyze-error', adminAuth, async (req, res) => {
  try {
    const { userId, questionId, userAnswer, correctAnswer } = req.body

    if (!userId || !questionId) {
      return res.status(400).json({ error: '请提供用户ID和题目ID' })
    }

    // 获取题目信息
    const question = await db.get('SELECT * FROM questions WHERE id = ?', [questionId])

    if (!question) {
      return res.status(404).json({ error: '题目不存在' })
    }

    // 创建错题记录
    const result = await db.run(
      `INSERT INTO error_patterns 
       (user_id, question_id, error_type, user_answer, correct_answer, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, questionId, '待分析', userAnswer || '', correctAnswer || question.correct_answer]
    )

    // 添加到任务队列
    const taskId = await queueService.addTask('error_analysis', result.insertId, 5)

    res.json({
      success: true,
      message: '错题分析任务已添加到队列',
      errorId: result.insertId,
      taskId
    })
  } catch (error) {
    console.error('[错题分析] 失败:', error)
    res.status(500).json({ error: '错题分析失败，请稍后重试' })
  }
})

/**
 * GET /api/answer-behavior/error-analysis/:errorId
 * 获取错题分析结果
 */
router.get('/error-analysis/:errorId', adminAuth, async (req, res) => {
  try {
    const { errorId } = req.params

    const errorAnalysis = await db.get('SELECT * FROM error_patterns WHERE id = ?', [errorId])

    if (!errorAnalysis) {
      return res.status(404).json({ error: '错题分析结果不存在' })
    }

    res.json({
      success: true,
      errorAnalysis
    })
  } catch (error) {
    console.error('[获取错题分析] 失败:', error)
    res.status(500).json({ error: '获取错题分析失败，请稍后重试' })
  }
})

/**
 * GET /api/answer-behavior/statistics/:userId
 * 获取用户答题行为统计
 */
router.get('/statistics/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params
    const { days = 30 } = req.query

    // 获取答题行为统计
    const stats = await db.get(
      `SELECT 
        COUNT(*) as total_attempts,
        AVG(answer_time) as avg_answer_time,
        AVG(answer_modifications) as avg_modifications,
        AVG(hesitation_time) as avg_hesitation_time,
        SUM(skipped_and_returned) as total_skips,
        SUM(is_correct) as correct_count
       FROM answer_behavior
       WHERE user_id = ? 
       AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [userId, parseInt(days)]
    )

    // 获取答题时段分布
    const timeDistribution = await db.query(
      `SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as count
       FROM answer_behavior
       WHERE user_id = ?
       AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY HOUR(created_at)
       ORDER BY hour`,
      [userId, parseInt(days)]
    )

    res.json({
      success: true,
      statistics: {
        ...stats,
        correctRate:
          stats.total_attempts > 0
            ? ((stats.correct_count / stats.total_attempts) * 100).toFixed(2)
            : 0,
        timeDistribution
      }
    })
  } catch (error) {
    console.error('[获取行为统计] 失败:', error)
    res.status(500).json({ error: '获取行为统计失败，请稍后重试' })
  }
})

/**
 * 辅助函数：判断是否需要重新分析
 */
function shouldReanalyze(styleAnalysis) {
  if (!styleAnalysis || !styleAnalysis.updated_at) return true

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  return new Date(styleAnalysis.updated_at) < oneWeekAgo
}

/**
 * 辅助函数：获取队列位置
 */
async function getQueuePosition(taskId) {
  try {
    const result = await db.get(
      `SELECT COUNT(*) as position 
       FROM ai_analysis_queue 
       WHERE status = 'pending' 
       AND (priority < (SELECT priority FROM ai_analysis_queue WHERE id = ?)
            OR (priority = (SELECT priority FROM ai_analysis_queue WHERE id = ?) 
                AND created_at < (SELECT created_at FROM ai_analysis_queue WHERE id = ?)))`,
      [taskId, taskId, taskId]
    )
    return result.position + 1
  } catch (error) {
    return 0
  }
}

module.exports = router
