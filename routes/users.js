const express = require('express')
const router = express.Router()
const db = require('../services/database')
const jwt = require('jsonwebtoken')
const { getPaginationParams, buildPaginationResponse } = require('../utils/pagination')

// JWT密钥
const JWT_SECRET = 'your-secret-key'
const JWT_EXPIRES_IN = '24h' // 24小时过期

// 获取用户列表（支持服务端分页）
router.get('/', async (req, res) => {
  try {
    const {
      grade,
      class: className,
      page = 1,
      limit,
      withStats = false,
      student_id,
      name
    } = req.query

    // 构建查询条件
    const conditions = []
    const params = []

    if (student_id) {
      conditions.push('student_id LIKE ?')
      params.push(`%${student_id}%`)
    }

    if (name) {
      conditions.push('name LIKE ?')
      params.push(`%${name}%`)
    }

    if (grade) {
      conditions.push('grade = ?')
      params.push(grade)
    }

    if (className) {
      conditions.push('class = ?')
      params.push(className)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 如果limit为0或负数，返回所有用户（向后兼容）
    if (limit === '0' || (limit && parseInt(limit) <= 0)) {
      const query = `SELECT * FROM users ${whereClause} ORDER BY CAST(student_id AS UNSIGNED)`
      const users = await db.all(query, params)

      // 添加统计数据
      if (withStats === 'true' && users.length > 0) {
        await attachUserStats(users)
      }

      // 向后兼容：返回数组格式
      return res.json(users)
    }

    // 服务端分页模式 - 使用统一分页工具
    const { pageNum, limitNum, offset } = getPaginationParams(page, limit)

    // 1. 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`
    const countResult = await db.get(countQuery, params)
    const total = countResult?.total || 0

    // 2. 获取分页数据
    const dataQuery = `SELECT * FROM users ${whereClause} ORDER BY CAST(student_id AS UNSIGNED) LIMIT ${limitNum} OFFSET ${offset}`
    const users = await db.all(dataQuery, params)

    // 3. 添加统计数据
    if (withStats === 'true' && users.length > 0) {
      await attachUserStats(users)
    }

    // 返回分页格式 - 使用统一响应格式
    res.json(buildPaginationResponse(users, total, pageNum, limitNum))
  } catch (error) {
    console.error('[getUsers] 获取用户失败:', error)
    res.status(500).json({ error: '获取用户失败' })
  }
})

// 为用户附加统计数据的辅助函数
async function attachUserStats(users) {
  try {
    const userIds = users.map(user => user.id)

    const batchStatsQuery = `
      SELECT 
        ar.user_id,
        COUNT(DISTINCT ar.id) as totalSessions,
        SUM(ar.total_questions) as totalQuestions,
        SUM(ar.correct_count) as totalCorrect,
        CASE WHEN SUM(ar.total_questions) > 0 THEN
          (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions)
        ELSE 0 END as avgAccuracy
      FROM answer_records ar
      WHERE ar.user_id IN (${userIds.map(() => '?').join(',')})
      GROUP BY ar.user_id
    `

    const statsResults = await db.all(batchStatsQuery, userIds)

    const statsMap = {}
    statsResults.forEach(stat => {
      statsMap[stat.user_id] = stat
    })

    for (const user of users) {
      const stats = statsMap[user.id] || {
        totalSessions: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        avgAccuracy: 0
      }
      user.total_sessions = stats.totalSessions || 0
      user.avg_accuracy = stats.avgAccuracy || 0
    }
  } catch (error) {
    console.warn('[attachUserStats] 批量获取用户统计数据失败:', error)
    for (const user of users) {
      user.total_sessions = 0
      user.avg_accuracy = 0
    }
  }
}

// 获取单个用户
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id])

    if (!user) {
      res.status(404).json({ error: '用户不存在' })
      return
    }

    res.json(user)
  } catch (error) {
    // console.error('获取用户失败:', error);
    res.status(500).json({ error: '获取用户失败' })
  }
})

// 添加用户
router.post('/', async (req, res) => {
  try {
    const { student_id, name, grade, class: className } = req.body

    if (!student_id) {
      res.status(400).json({ error: '学号不能为空' })
      return
    }

    const result = await db.run(
      'INSERT INTO users (student_id, name, grade, class) VALUES (?, ?, ?, ?)',
      [student_id, name, grade, className]
    )

    // 返回新添加的用户
    const newUser = await db.get('SELECT * FROM users WHERE id = ?', [result.insertId])
    res.json(newUser)
  } catch (error) {
    // console.error('添加用户失败:', error);
    res.status(500).json({ error: '添加用户失败' })
  }
})

// 批量添加用户
router.post('/batch', async (req, res) => {
  try {
    const users = req.body

    if (!Array.isArray(users)) {
      res.status(400).json({ error: '用户数据必须是数组' })
      return
    }

    let successCount = 0
    let errorCount = 0

    for (const user of users) {
      const { student_id, name, grade, class: className } = user

      if (student_id) {
        try {
          await db.run('INSERT INTO users (student_id, name, grade, class) VALUES (?, ?, ?, ?)', [
            student_id,
            name,
            grade,
            className
          ])
          successCount++
        } catch (error) {
          // console.error('添加用户失败:', error);
          errorCount++
        }
      }
    }

    res.json({ success: true, message: `成功添加 ${successCount} 个用户，失败 ${errorCount} 个` })
  } catch (error) {
    // console.error('批量添加用户失败:', error);
    res.status(500).json({ error: '批量添加用户失败' })
  }
})

// 更新用户
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, grade, class: className, student_id } = req.body

    await db.run('UPDATE users SET name = ?, grade = ?, class = ?, student_id = ? WHERE id = ?', [
      name,
      grade,
      className,
      student_id,
      id
    ])

    res.json({ success: true })
  } catch (error) {
    // console.error('更新用户失败:', error);
    res.status(500).json({ error: '更新用户失败' })
  }
})

// 删除用户
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    await db.transaction(async conn => {
      // 删除用户的错题记录
      await conn.execute('DELETE FROM error_collection WHERE user_id = ?', [id])

      // 删除用户的答题尝试记录
      await conn.execute(
        'DELETE FROM quiz_attempts WHERE quiz_session_id IN (SELECT id FROM quiz_sessions WHERE user_id = ?)',
        [id]
      )

      // 删除用户的答题会话
      await conn.execute('DELETE FROM quiz_sessions WHERE user_id = ?', [id])

      // 删除用户的题目尝试记录
      await conn.execute('DELETE FROM question_attempts WHERE user_id = ?', [id])

      // 删除用户的答题记录
      await conn.execute('DELETE FROM answer_records WHERE user_id = ?', [id])

      // 删除用户
      await conn.execute('DELETE FROM users WHERE id = ?', [id])
    })

    res.json({ success: true })
  } catch (error) {
    console.error('删除用户失败:', error)
    res.status(500).json({ error: '删除用户失败' })
  }
})

// 批量删除用户
router.post('/batch-delete', async (req, res) => {
  try {
    const { userIds } = req.body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: '请选择要删除的用户' })
    }

    // 限制单次批量删除数量，防止过载
    const MAX_BATCH_SIZE = 100
    if (userIds.length > MAX_BATCH_SIZE) {
      return res.status(400).json({
        error: `单次最多删除 ${MAX_BATCH_SIZE} 个用户，当前选择 ${userIds.length} 个`
      })
    }

    // 过滤有效的用户ID
    const validUserIds = userIds.filter(id => Number.isInteger(id) && id > 0)
    if (validUserIds.length === 0) {
      return res.status(400).json({ error: '没有有效的用户ID' })
    }

    // 构建 IN 子句占位符
    const placeholders = validUserIds.map(() => '?').join(',')

    let deletedCount = 0

    await db.transaction(async conn => {
      // 批量删除用户的错题记录
      await conn.execute(
        `DELETE FROM error_collection WHERE user_id IN (${placeholders})`,
        validUserIds
      )

      // 批量删除用户的答题尝试记录（通过子查询）
      await conn.execute(
        `DELETE FROM quiz_attempts WHERE quiz_session_id IN (SELECT id FROM quiz_sessions WHERE user_id IN (${placeholders}))`,
        validUserIds
      )

      // 批量删除用户的答题会话
      await conn.execute(
        `DELETE FROM quiz_sessions WHERE user_id IN (${placeholders})`,
        validUserIds
      )

      // 批量删除用户的题目尝试记录
      await conn.execute(
        `DELETE FROM question_attempts WHERE user_id IN (${placeholders})`,
        validUserIds
      )

      // 批量删除用户的答题记录
      await conn.execute(
        `DELETE FROM answer_records WHERE user_id IN (${placeholders})`,
        validUserIds
      )

      // 批量删除用户
      const [result] = await conn.execute(
        `DELETE FROM users WHERE id IN (${placeholders})`,
        validUserIds
      )
      deletedCount = result.affectedRows
    })

    res.json({
      success: true,
      message: `成功删除 ${deletedCount} 个用户`,
      successCount: deletedCount,
      failCount: validUserIds.length - deletedCount
    })
  } catch (error) {
    console.error('批量删除用户失败:', error)
    res.status(500).json({ error: '批量删除用户失败' })
  }
})

// 用户统计API
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    // 获取用户总体统计
    const userStatsQuery = `
      SELECT COUNT(DISTINCT ar.id) as totalSessions,
             SUM(ar.total_questions) as totalQuestions,
             SUM(ar.correct_count) as totalCorrect,
             CASE WHEN SUM(ar.total_questions) > 0 THEN
               (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions)
             ELSE 0 END as avgAccuracy
      FROM answer_records ar
      WHERE ar.user_id = ?
    `

    // 获取用户各学科统计
    const subjectStatsQuery = `
      SELECT ar.subject_id,
             s.name as subject_name,
             COUNT(DISTINCT ar.id) as total_sessions,
             SUM(ar.total_questions) as total_questions,
             SUM(ar.correct_count) as correct_count,
             CASE WHEN SUM(ar.total_questions) > 0 THEN
               (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions)
             ELSE 0 END as avg_accuracy
      FROM answer_records ar
      LEFT JOIN subjects s ON ar.subject_id = s.id
      WHERE ar.user_id = ?
      GROUP BY ar.subject_id
    `

    const userStats = (await db.get(userStatsQuery, [userId])) || {
      totalSessions: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      avgAccuracy: 0
    }

    const subjectStats = await db.all(subjectStatsQuery, [userId])
    userStats.subjectStats = subjectStats

    res.json(userStats)
  } catch (error) {
    // console.error('获取用户统计失败:', error);
    res.status(500).json({ error: '获取用户统计失败' })
  }
})

// 用户登录API
router.post('/login', async (req, res) => {
  try {
    const { studentId, name, grade, class: className } = req.body

    if (!studentId) {
      res.status(400).json({ error: '学号不能为空' })
      return
    }

    // 验证学号格式
    const studentIdRegex = /^\d{2}$/
    if (!studentIdRegex.test(studentId)) {
      res.status(400).json({ error: '学号只能输入2位数字' })
      return
    }

    let trimmedName = name
    if (name) {
      trimmedName = name.trim()
    }

    // 验证名字格式（如果提供了名字）
    if (trimmedName) {
      // 只允许中文字符，长度不超过4个
      const chineseRegex = /^[\u4e00-\u9fa5]{1,4}$/
      if (!chineseRegex.test(trimmedName)) {
        res.status(400).json({ error: '姓名只能输入1-4个中文字符' })
        return
      }
    }

    // 检查用户是否存在（根据学号、年级和班级的组合）
    let user = await db.get(
      'SELECT * FROM users WHERE student_id = ? AND grade = ? AND class = ?',
      [studentId, grade, className]
    )

    if (!user) {
      // 如果用户不存在，创建新用户
      const result = await db.run(
        'INSERT INTO users (student_id, name, grade, class) VALUES (?, ?, ?, ?)',
        [studentId, trimmedName, grade, className]
      )
      user = await db.get('SELECT * FROM users WHERE id = ?', [result.insertId])
    } else {
      // 如果用户存在且提供了名字，更新用户信息
      if (trimmedName) {
        await db.run('UPDATE users SET name = ? WHERE id = ?', [trimmedName, user.id])
        user = await db.get('SELECT * FROM users WHERE id = ?', [user.id])
      }
    }

    // 生成JWT token
    const token = jwt.sign({ userId: user.id, studentId: user.student_id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    })

    // 返回用户信息和token
    res.json({
      userId: user.id,
      studentId: user.student_id,
      name: user.name,
      grade: user.grade,
      class: user.class,
      token: token,
      expiresIn: JWT_EXPIRES_IN
    })
  } catch (error) {
    // console.error('用户登录失败:', error);
    res.status(500).json({ error: '用户登录失败' })
  }
})

module.exports = router
