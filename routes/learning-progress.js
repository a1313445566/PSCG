/**
 * 学习进度 API
 * 路由: /api/learning-progress
 */

const express = require('express')
const router = express.Router()
const db = require('../services/database')

/**
 * GET /api/learning-progress/user/:userId
 * 获取用户学习进度详情
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const { subjectId } = req.query

    // 验证用户是否存在
    const user = await db.get('SELECT id FROM users WHERE id = ?', [userId])
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    // 构建查询条件
    let whereClause = 'WHERE lp.user_id = ?'
    const params = [userId]

    if (subjectId) {
      whereClause += ' AND lp.subject_id = ?'
      params.push(subjectId)
    }

    // 获取各知识点进度
    const progressQuery = `
      SELECT 
        lp.id,
        lp.user_id,
        lp.subject_id,
        lp.subcategory_id,
        lp.mastery_level,
        lp.total_attempts,
        lp.correct_attempts,
        lp.last_practiced as last_practiced,
        lp.ai_suggestion,
        s.name as subject_name,
        sub.name as subcategory_name
      FROM learning_progress lp
      INNER JOIN subjects s ON lp.subject_id = s.id
      INNER JOIN subcategories sub ON lp.subcategory_id = sub.id
      ${whereClause}
      ORDER BY s.id, lp.mastery_level DESC
    `

    const progress = await db.all(progressQuery, params)

    res.json({
      success: true,
      progress
    })
  } catch (error) {
    console.error('[获取学习进度] 失败:', error)
    res.status(500).json({ error: '获取学习进度失败' })
  }
})

/**
 * GET /api/learning-progress/summary/:userId
 * 获取用户学习进度汇总
 */
router.get('/summary/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    // 验证用户是否存在
    const user = await db.get('SELECT id FROM users WHERE id = ?', [userId])
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    // 计算整体进度
    const overallQuery = `
      SELECT 
        COUNT(*) as total_subcategories,
        SUM(CASE WHEN mastery_level >= 80 THEN 1 ELSE 0 END) as mastered,
        SUM(CASE WHEN mastery_level >= 40 AND mastery_level < 80 THEN 1 ELSE 0 END) as learning,
        SUM(CASE WHEN mastery_level < 40 THEN 1 ELSE 0 END) as not_started,
        AVG(mastery_level) as avg_mastery
      FROM learning_progress
      WHERE user_id = ?
    `

    const overall = await db.get(overallQuery, [userId])

    // 按学科分组统计
    const subjectProgressQuery = `
      SELECT 
        s.id,
        s.name as subject_name,
        COUNT(*) as total_subcategories,
        AVG(lp.mastery_level) as avg_mastery,
        SUM(CASE WHEN lp.mastery_level >= 80 THEN 1 ELSE 0 END) as mastered
      FROM learning_progress lp
      INNER JOIN subjects s ON lp.subject_id = s.id
      WHERE lp.user_id = ?
      GROUP BY s.id
      ORDER BY avg_mastery DESC
    `

    const subjectProgress = await db.all(subjectProgressQuery, [userId])

    res.json({
      success: true,
      overall: overall || {
        total_subcategories: 0,
        mastered: 0,
        learning: 0,
        not_started: 0,
        avg_mastery: 0
      },
      subjectProgress
    })
  } catch (error) {
    console.error('[获取学习进度汇总] 失败:', error)
    res.status(500).json({ error: '获取学习进度汇总失败' })
  }
})

module.exports = router
