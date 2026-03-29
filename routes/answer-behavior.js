/**
 * 答题行为 API
 */

const express = require('express')
const router = express.Router()
const adminAuth = require('../middleware/adminAuth')
const db = require('../services/database')

/**
 * POST /api/answer-behavior/batch
 * 批量提交答题行为（优化性能）
 */
router.post('/batch', async (req, res) => {
  try {
    const { behaviors } = req.body

    if (!Array.isArray(behaviors) || behaviors.length === 0) {
      return res.status(400).json({ error: '请提供行为数据列表' })
    }

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
 * 获取用户学习风格分析（基础统计）
 */
router.get('/user-style/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params

    const stats = await db.get(
      `SELECT 
        COUNT(*) as total_attempts,
        AVG(answer_time) as avg_answer_time,
        AVG(answer_modifications) as avg_modifications,
        AVG(hesitation_time) as avg_hesitation_time,
        SUM(skipped_and_returned) as total_skips,
        SUM(is_correct) as correct_count
       FROM answer_behavior
       WHERE user_id = ?`,
      [userId]
    )

    res.json({
      success: true,
      styleAnalysis: {
        totalAttempts: stats.total_attempts || 0,
        avgAnswerTime: stats.avg_answer_time || 0,
        avgModifications: stats.avg_modifications || 0,
        avgHesitationTime: stats.avg_hesitation_time || 0,
        totalSkips: stats.total_skips || 0,
        correctCount: stats.correct_count || 0,
        correctRate:
          stats.total_attempts > 0
            ? ((stats.correct_count / stats.total_attempts) * 100).toFixed(2)
            : 0
      }
    })
  } catch (error) {
    console.error('[学习风格分析] 失败:', error)
    res.status(500).json({ error: '学习风格分析失败，请稍后重试' })
  }
})

/**
 * POST /api/answer-behavior/analyze-style
 * 重新分析学习风格（已移除 AI 功能）
 */
router.post('/analyze-style', adminAuth, async (req, res) => {
  res.json({
    success: false,
    message: 'AI 学习风格分析功能已移除'
  })
})

/**
 * POST /api/answer-behavior/analyze-error
 * 分析错题原因（已移除 AI 功能）
 */
router.post('/analyze-error', adminAuth, async (req, res) => {
  res.json({
    success: false,
    message: 'AI 错题分析功能已移除'
  })
})

/**
 * GET /api/answer-behavior/error-analysis/:errorId
 * 获取错题分析结果（已移除 AI 功能）
 */
router.get('/error-analysis/:errorId', adminAuth, async (req, res) => {
  res.json({
    success: false,
    message: 'AI 错题分析功能已移除'
  })
})

/**
 * GET /api/answer-behavior/statistics/:userId
 * 获取用户答题行为统计
 */
router.get('/statistics/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params
    const { days = 30 } = req.query

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

module.exports = router
