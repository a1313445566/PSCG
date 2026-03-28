/**
 * Dashboard API 路由
 *
 * 提供数据概览相关的 API 接口
 */
const express = require('express')
const router = express.Router()
const adminAuth = require('../middleware/adminAuth')
const db = require('../services/database')

/**
 * 获取统计数据
 * GET /api/dashboard/stats
 */
router.get('/stats', adminAuth, async (req, res) => {
  try {
    // 获取题目总数
    const questionsResult = await db.get('SELECT COUNT(*) as count FROM questions')
    const totalQuestions = questionsResult?.count || 0

    // 获取用户总数
    const usersResult = await db.get('SELECT COUNT(*) as count FROM users')
    const totalUsers = usersResult?.count || 0

    // 获取今日答题次数
    const today = new Date().toISOString().split('T')[0]
    const todayAttemptsResult = await db.get(
      `SELECT COUNT(*) as count FROM answer_records WHERE DATE(created_at) = ?`,
      [today]
    )
    const todayAttempts = todayAttemptsResult?.count || 0

    // 获取平均正确率（计算公式：correct_count / total_questions * 100）
    const avgAccuracyResult = await db.get(
      `SELECT AVG(correct_count * 100.0 / NULLIF(total_questions, 0)) as avg FROM answer_records`
    )
    const avgAccuracy = avgAccuracyResult?.avg ? Math.round(avgAccuracyResult.avg) : 0

    // 获取昨日的题目数量（用于计算趋势）
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const yesterdayQuestionsResult = await db.get(
      `SELECT COUNT(*) as count FROM questions WHERE DATE(created_at) = ?`,
      [yesterday]
    )
    const yesterdayQuestions = yesterdayQuestionsResult?.count || 0
    const questionTrend = Math.max(0, totalQuestions - yesterdayQuestions)

    // 获取昨日的用户数量
    const yesterdayUsersResult = await db.get(
      `SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = ?`,
      [yesterday]
    )
    const yesterdayUsers = yesterdayUsersResult?.count || 0
    const userTrend = Math.max(0, totalUsers - yesterdayUsers)

    // 获取昨日的答题次数
    const yesterdayAttemptsResult = await db.get(
      `SELECT COUNT(*) as count FROM answer_records WHERE DATE(created_at) = ?`,
      [yesterday]
    )
    const yesterdayAttempts = yesterdayAttemptsResult?.count || 0
    const attemptTrend =
      yesterdayAttempts > 0
        ? Math.round(((todayAttempts - yesterdayAttempts) / yesterdayAttempts) * 100)
        : 0

    // 获取昨日的平均正确率
    const yesterdayAccuracyResult = await db.get(
      `SELECT AVG(correct_count * 100.0 / NULLIF(total_questions, 0)) as avg FROM answer_records WHERE DATE(created_at) = ?`,
      [yesterday]
    )
    const yesterdayAccuracy = yesterdayAccuracyResult?.avg
      ? Math.round(yesterdayAccuracyResult.avg)
      : 0
    const accuracyTrend = avgAccuracy - yesterdayAccuracy

    res.json({
      totalQuestions,
      totalUsers,
      todayAttempts,
      avgAccuracy,
      questionTrend,
      userTrend,
      attemptTrend,
      accuracyTrend
    })
  } catch (error) {
    console.error('[Dashboard] 获取统计数据失败:', error)
    res.status(500).json({ error: '获取统计数据失败' })
  }
})

/**
 * 获取答题趋势数据
 * GET /api/dashboard/trend
 * @param {number} days - 天数，默认7天
 */
router.get('/trend', adminAuth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7

    // 生成日期数组
    const dates = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000)
      dates.push(date.toISOString().split('T')[0])
    }

    // 查询每天的数据
    const trendData = []
    for (const date of dates) {
      const attemptsResult = await db.get(
        `SELECT COUNT(*) as count FROM answer_records WHERE DATE(created_at) = ?`,
        [date]
      )
      const attempts = attemptsResult?.count || 0

      const accuracyResult = await db.get(
        `SELECT AVG(correct_count * 100.0 / NULLIF(total_questions, 0)) as avg FROM answer_records WHERE DATE(created_at) = ?`,
        [date]
      )
      const accuracy = accuracyResult?.avg ? Math.round(accuracyResult.avg) : 0

      trendData.push({
        date: date.substring(5), // 只显示 MM-DD
        attempts,
        accuracy
      })
    }

    res.json(trendData)
  } catch (error) {
    console.error('[Dashboard] 获取趋势数据失败:', error)
    res.status(500).json({ error: '获取趋势数据失败' })
  }
})

/**
 * 获取学科答题分布
 * GET /api/dashboard/subject-distribution
 */
router.get('/subject-distribution', adminAuth, async (req, res) => {
  try {
    const result = await db.all(`
      SELECT 
        s.name,
        COUNT(ar.id) as count
      FROM subjects s
      LEFT JOIN answer_records ar ON ar.subject_id = s.id
      GROUP BY s.id
      ORDER BY count DESC
      LIMIT 10
    `)

    const distribution = result.map(item => ({
      name: item.name,
      count: item.count || 0
    }))

    res.json(distribution)
  } catch (error) {
    console.error('[Dashboard] 获取学科分布失败:', error)
    res.status(500).json({ error: '获取学科分布失败' })
  }
})

/**
 * 获取最近答题记录
 * GET /api/dashboard/recent-activities
 * @param {number} limit - 数量限制，默认10
 */
router.get('/recent-activities', adminAuth, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit) || 10, 100)) // 限制范围 1-100

    // MySQL prepared statement 不支持 LIMIT 参数化，直接拼接
    const records = await db.all(`
      SELECT 
        ar.id,
        ar.user_id,
        ar.subject_id,
        ar.subcategory_id,
        ar.correct_count,
        ar.total_questions,
        ar.correct_count * 100.0 / NULLIF(ar.total_questions, 0) as accuracy,
        ar.created_at,
        s.name as subject_name,
        sub.name as subcategory_name,
        u.name as student_name
      FROM answer_records ar
      LEFT JOIN subjects s ON ar.subject_id = s.id
      LEFT JOIN subcategories sub ON ar.subcategory_id = sub.id
      LEFT JOIN users u ON ar.user_id = u.id
      ORDER BY ar.created_at DESC
      LIMIT ${limit}
    `)

    const activities = records.map(record => {
      const now = new Date()
      const createdAt = new Date(record.created_at)
      const diffMs = now - createdAt
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      let timeText = '刚刚'
      if (diffDays > 0) {
        timeText = `${diffDays}天前`
      } else if (diffHours > 0) {
        timeText = `${diffHours}小时前`
      } else if (diffMins > 0) {
        timeText = `${diffMins}分钟前`
      }

      return {
        id: record.id,
        student_name: record.student_name || '未知',
        subject: record.subject_name || '未知学科',
        subcategory: record.subcategory_name || '未知题库',
        score: record.correct_count || 0,
        accuracy: Math.round(record.accuracy || 0),
        time: timeText
      }
    })

    res.json(activities)
  } catch (error) {
    console.error('[Dashboard] 获取最近活动失败:', error)
    res.status(500).json({ error: '获取最近活动失败' })
  }
})

module.exports = router
