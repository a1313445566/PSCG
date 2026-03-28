/**
 * 用户统计 API
 * 提供学习报告和答题历史所需的统计数据
 */

const express = require('express')
const router = express.Router()
const db = require('../services/database')

/**
 * GET /api/user-stats/learning-style/:userId
 * 获取用户学习风格分析
 */
router.get('/learning-style/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    // 验证用户
    const user = await db.get('SELECT id FROM users WHERE id = ?', [userId])
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    // 1. 学习时间偏好分析
    const timePreferenceQuery = `
      SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as session_count
      FROM answer_records
      WHERE user_id = ?
      GROUP BY HOUR(created_at)
      ORDER BY session_count DESC
      LIMIT 3
    `
    const timePreference = await db.all(timePreferenceQuery, [userId])

    // 2. 学科偏好分析
    const subjectPreferenceQuery = `
      SELECT 
        s.id,
        s.name,
        COUNT(*) as session_count,
        SUM(ar.total_questions) as total_questions,
        AVG(ar.correct_count * 100.0 / ar.total_questions) as avg_accuracy
      FROM answer_records ar
      INNER JOIN subjects s ON ar.subject_id = s.id
      WHERE ar.user_id = ?
      GROUP BY s.id
      ORDER BY session_count DESC
      LIMIT 3
    `
    const subjectPreference = await db.all(subjectPreferenceQuery, [userId])

    // 3. 学习强度分析
    const intensityQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as sessions_per_day,
        AVG(total_questions) as avg_questions,
        AVG(time_spent) as avg_time
      FROM answer_records
      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `
    const intensity = await db.all(intensityQuery, [userId])

    // 4. 错题倾向分析
    const errorTendencyQuery = `
      SELECT 
        s.name as subject_name,
        COUNT(*) as error_count
      FROM error_collection ec
      INNER JOIN questions q ON ec.question_id = q.id
      INNER JOIN subjects s ON q.subject_id = s.id
      WHERE ec.user_id = ? AND ec.correct_count < 3
      GROUP BY s.id
      ORDER BY error_count DESC
      LIMIT 3
    `
    const errorTendency = await db.all(errorTendencyQuery, [userId])

    // 5. 学习风格判断
    let learningStyle = 'balanced'
    const styleScores = {
      consistent: 0, // 稳健型：规律学习
      intensive: 0, // 集中型：集中突击
      exploratory: 0, // 探索型：多学科尝试
      focused: 0 // 专注型：少数学科深度学习
    }

    // 判断学习风格
    if (intensity.length >= 20) {
      // 规律学习
      styleScores.consistent += 2
    } else if (intensity.length < 10 && intensity.length > 0) {
      // 集中突击
      styleScores.intensive += 2
    }

    if (subjectPreference.length >= 4) {
      // 多学科探索
      styleScores.exploratory += 2
    } else if (subjectPreference.length <= 2 && subjectPreference.length > 0) {
      // 专注少数学科
      styleScores.focused += 2
    }

    // 选择得分最高的风格
    learningStyle = Object.entries(styleScores).reduce((a, b) => (a[1] > b[1] ? a : b))[0]

    const styleNames = {
      consistent: '稳健型',
      intensive: '集中型',
      exploratory: '探索型',
      focused: '专注型'
    }

    const styleDescriptions = {
      consistent: '学习规律性强，能够持之以恒，建议保持节奏',
      intensive: '倾向集中时间突击学习，建议适当分散学习时间',
      exploratory: '喜欢尝试不同学科，建议深入攻克薄弱科目',
      focused: '专注少数学科，建议适当拓展学习范围'
    }

    res.json({
      success: true,
      timePreference: timePreference.map(t => ({
        hour: t.hour,
        label: `${t.hour}:00-${t.hour + 1}:00`,
        sessions: t.session_count
      })),
      subjectPreference,
      intensity: intensity.map(i => ({
        date: i.date,
        sessions: i.sessions_per_day,
        avgQuestions: Math.round(i.avg_questions || 0),
        avgTime: Math.round(i.avg_time || 0)
      })),
      errorTendency,
      learningStyle: {
        type: learningStyle,
        name: styleNames[learningStyle],
        description: styleDescriptions[learningStyle]
      }
    })
  } catch (error) {
    console.error('[学习风格分析] 失败:', error)
    res.status(500).json({ error: '获取学习风格分析失败' })
  }
})

/**
 * GET /api/user-stats/behavior/:userId
 * 获取用户答题行为分析
 */
router.get('/behavior/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const { days = 30 } = req.query

    // 验证用户
    const user = await db.get('SELECT id FROM users WHERE id = ?', [userId])
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    // 1. 答题速度趋势
    const speedTrendQuery = `
      SELECT 
        DATE(created_at) as date,
        AVG(total_questions) as avg_questions,
        AVG(time_spent) as avg_time,
        AVG(time_spent * 1.0 / total_questions) as avg_time_per_question
      FROM answer_records
      WHERE user_id = ? 
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `
    const speedTrend = await db.all(speedTrendQuery, [userId, parseInt(days)])

    // 2. 正确率趋势
    const accuracyTrendQuery = `
      SELECT 
        DATE(created_at) as date,
        AVG(correct_count * 100.0 / total_questions) as avg_accuracy
      FROM answer_records
      WHERE user_id = ? 
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `
    const accuracyTrend = await db.all(accuracyTrendQuery, [userId, parseInt(days)])

    // 3. 答题时段分布
    const hourlyDistributionQuery = `
      SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as session_count,
        SUM(total_questions) as total_questions,
        AVG(correct_count * 100.0 / total_questions) as avg_accuracy
      FROM answer_records
      WHERE user_id = ? 
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY HOUR(created_at)
      ORDER BY hour ASC
    `
    const hourlyDistribution = await db.all(hourlyDistributionQuery, [userId, parseInt(days)])

    // 4. 每日学习时长
    const dailyTimeQuery = `
      SELECT 
        DATE(created_at) as date,
        SUM(time_spent) as total_time
      FROM answer_records
      WHERE user_id = ? 
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `
    const dailyTime = await db.all(dailyTimeQuery, [userId, parseInt(days)])

    res.json({
      success: true,
      speedTrend: speedTrend.map(s => ({
        date: s.date,
        avgQuestions: Math.round(s.avg_questions || 0),
        avgTime: Math.round(s.avg_time || 0),
        avgTimePerQuestion: Math.round((s.avg_time_per_question || 0) * 10) / 10
      })),
      accuracyTrend: accuracyTrend.map(a => ({
        date: a.date,
        avgAccuracy: Math.round(a.avg_accuracy || 0)
      })),
      hourlyDistribution: hourlyDistribution.map(h => ({
        hour: h.hour,
        label: `${h.hour}:00`,
        sessions: h.session_count,
        questions: h.total_questions,
        accuracy: Math.round(h.avg_accuracy || 0)
      })),
      dailyTime: dailyTime.map(d => ({
        date: d.date,
        totalTime: Math.round(d.total_time || 0)
      }))
    })
  } catch (error) {
    console.error('[答题行为分析] 失败:', error)
    res.status(500).json({ error: '获取答题行为分析失败' })
  }
})

/**
 * GET /api/user-stats/subject-radar/:userId
 * 获取用户学科能力雷达图数据
 */
router.get('/subject-radar/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    // 验证用户
    const user = await db.get('SELECT id FROM users WHERE id = ?', [userId])
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    // 获取所有学科
    const subjects = await db.all('SELECT id, name FROM subjects ORDER BY id')

    // 计算每个学科的能力值
    const radarData = await Promise.all(
      subjects.map(async subject => {
        // 正确率
        const accuracyQuery = `
          SELECT 
            AVG(correct_count * 100.0 / total_questions) as avg_accuracy
          FROM answer_records
          WHERE user_id = ? AND subject_id = ?
        `
        const accuracyResult = await db.get(accuracyQuery, [userId, subject.id])
        const accuracy = Math.round(accuracyResult?.avg_accuracy || 0)

        // 答题量
        const volumeQuery = `
          SELECT SUM(total_questions) as total
          FROM answer_records
          WHERE user_id = ? AND subject_id = ?
        `
        const volumeResult = await db.get(volumeQuery, [userId, subject.id])
        const volume = volumeResult?.total || 0

        // 错题掌握度（已掌握 / 总错题）
        const masteryQuery = `
          SELECT 
            COUNT(*) as total_errors,
            SUM(CASE WHEN correct_count >= 3 THEN 1 ELSE 0 END) as mastered
          FROM error_collection ec
          INNER JOIN questions q ON ec.question_id = q.id
          WHERE ec.user_id = ? AND q.subject_id = ?
        `
        const masteryResult = await db.get(masteryQuery, [userId, subject.id])
        const masteryRate =
          masteryResult?.total_errors > 0
            ? Math.round((masteryResult.mastered / masteryResult.total_errors) * 100)
            : 100

        // 综合能力值 = 正确率 * 0.5 + 答题量分数 * 0.3 + 错题掌握度 * 0.2
        const volumeScore = Math.min(100, Math.round(volume / 5)) // 每5题得1分，最高100分
        const ability = Math.round(accuracy * 0.5 + volumeScore * 0.3 + masteryRate * 0.2)

        return {
          subject: subject.name,
          accuracy,
          volume,
          volumeScore,
          masteryRate,
          ability
        }
      })
    )

    res.json({
      success: true,
      radarData: radarData.filter(d => d.volume > 0) // 只返回有数据的学科
    })
  } catch (error) {
    console.error('[学科雷达图] 失败:', error)
    res.status(500).json({ error: '获取学科雷达图数据失败' })
  }
})

module.exports = router
