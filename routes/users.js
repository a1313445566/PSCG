const express = require('express');
const router = express.Router();
const db = require('../services/database');
const jwt = require('jsonwebtoken');

// JWT密钥
const JWT_SECRET = 'your-secret-key';
const JWT_EXPIRES_IN = '24h'; // 24小时过期

// 获取用户列表
router.get('/', async (req, res) => {
  try {
    const { grade, class: className, page = 1, limit, withStats = false } = req.query;
    
    let query = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    
    if (grade) {
      query += ' AND grade = ?';
      params.push(grade);
    }
    
    if (className) {
      query += ' AND class = ?';
      params.push(className);
    }
    
    const pageNum = parseInt(page) || 1;
    let limitNum = limit === '0' ? 0 : parseInt(limit) || 50;
    
    // 如果limit为0或负数，返回所有用户
    if (limitNum <= 0) {
      query += ' ORDER BY CAST(student_id AS UNSIGNED)';
    } else {
      const offset = (pageNum - 1) * limitNum;
      query += ` ORDER BY CAST(student_id AS UNSIGNED) LIMIT ${limitNum} OFFSET ${offset}`;
    }
    
    let users = await db.all(query, params);
    
    // 如果需要统计数据，批量获取所有用户的统计信息
    if (withStats === 'true' && users.length > 0) {
      try {
        // 提取所有用户ID
        const userIds = users.map(user => user.id);
        
        // 批量获取所有用户的统计数据
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
        `;
        
        const statsResults = await db.all(batchStatsQuery, userIds);
        
        // 将统计数据映射到用户对象
        const statsMap = {};
        statsResults.forEach(stat => {
          statsMap[stat.user_id] = stat;
        });
        
        // 为每个用户设置统计数据
        for (const user of users) {
          const stats = statsMap[user.id] || {
            totalSessions: 0,
            totalQuestions: 0,
            totalCorrect: 0,
            avgAccuracy: 0
          };
          user.total_sessions = stats.totalSessions || 0;
          user.avg_accuracy = stats.avgAccuracy || 0;
        }
      } catch (error) {
        // console.error('批量获取用户统计数据失败:', error);
        // 失败时为所有用户设置默认值
        for (const user of users) {
          user.total_sessions = 0;
          user.avg_accuracy = 0;
        }
      }
    }
    
    res.json(users);
  } catch (error) {
    // console.error('获取用户失败:', error);
    res.status(500).json({ error: '获取用户失败' });
  }
});

// 获取单个用户
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    
    res.json(user);
  } catch (error) {
    // console.error('获取用户失败:', error);
    res.status(500).json({ error: '获取用户失败' });
  }
});

// 添加用户
router.post('/', async (req, res) => {
  try {
    const { student_id, name, grade, class: className } = req.body;
    
    if (!student_id) {
      res.status(400).json({ error: '学号不能为空' });
      return;
    }
    
    const result = await db.run('INSERT INTO users (student_id, name, grade, class) VALUES (?, ?, ?, ?)', [student_id, name, grade, className]);
    
    // 返回新添加的用户
    const newUser = await db.get('SELECT * FROM users WHERE id = ?', [result.insertId]);
    res.json(newUser);
  } catch (error) {
    // console.error('添加用户失败:', error);
    res.status(500).json({ error: '添加用户失败' });
  }
});

// 批量添加用户
router.post('/batch', async (req, res) => {
  try {
    const users = req.body;
    
    if (!Array.isArray(users)) {
      res.status(400).json({ error: '用户数据必须是数组' });
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      const { student_id, name, grade, class: className } = user;
      
      if (student_id) {
        try {
          await db.run('INSERT INTO users (student_id, name, grade, class) VALUES (?, ?, ?, ?)', [student_id, name, grade, className]);
          successCount++;
        } catch (error) {
          // console.error('添加用户失败:', error);
          errorCount++;
        }
      }
    }
    
    res.json({ success: true, message: `成功添加 ${successCount} 个用户，失败 ${errorCount} 个` });
  } catch (error) {
    // console.error('批量添加用户失败:', error);
    res.status(500).json({ error: '批量添加用户失败' });
  }
});

// 更新用户
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, grade, class: className, student_id } = req.body;
    
    await db.run('UPDATE users SET name = ?, grade = ?, class = ?, student_id = ? WHERE id = ?', [name, grade, className, student_id, id]);
    
    res.json({ success: true });
  } catch (error) {
    // console.error('更新用户失败:', error);
    res.status(500).json({ error: '更新用户失败' });
  }
});

// 删除用户
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 开始事务
    await db.run('START TRANSACTION');
    
    try {
      // 删除用户的题目尝试记录
      await db.run('DELETE FROM question_attempts WHERE user_id = ?', [id]);
      
      // 删除用户的答题记录
      await db.run('DELETE FROM answer_records WHERE user_id = ?', [id]);
      
      // 删除用户
      await db.run('DELETE FROM users WHERE id = ?', [id]);
      
      // 提交事务
      await db.run('COMMIT');
      
      res.json({ success: true });
    } catch (error) {
      // 回滚事务
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    // console.error('删除用户失败:', error);
    res.status(500).json({ error: '删除用户失败' });
  }
});

// 用户统计API
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
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
    `;
    
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
    `;
    
    const userStats = await db.get(userStatsQuery, [userId]) || {
      totalSessions: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      avgAccuracy: 0
    };
    
    const subjectStats = await db.all(subjectStatsQuery, [userId]);
    userStats.subjectStats = subjectStats;
    
    res.json(userStats);
  } catch (error) {
    // console.error('获取用户统计失败:', error);
    res.status(500).json({ error: '获取用户统计失败' });
  }
});

// 用户登录API
router.post('/login', async (req, res) => {
  try {
    const { studentId, name, grade, class: className } = req.body;
    
    if (!studentId) {
      res.status(400).json({ error: '学号不能为空' });
      return;
    }
    
    // 检查用户是否存在（根据学号、年级和班级的组合）
    let user = await db.get('SELECT * FROM users WHERE student_id = ? AND grade = ? AND class = ?', [studentId, grade, className]);
    
    if (!user) {
      // 如果用户不存在，创建新用户
      const result = await db.run('INSERT INTO users (student_id, name, grade, class) VALUES (?, ?, ?, ?)', [studentId, name, grade, className]);
      user = await db.get('SELECT * FROM users WHERE id = ?', [result.insertId]);
    } else {
      // 如果用户存在，更新用户信息
      await db.run('UPDATE users SET name = ? WHERE id = ?', [name, user.id]);
      user = await db.get('SELECT * FROM users WHERE id = ?', [user.id]);
    }
    
    // 生成JWT token
    const token = jwt.sign(
      { userId: user.id, studentId: user.student_id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // 返回用户信息和token
    res.json({
      userId: user.id,
      studentId: user.student_id,
      name: user.name,
      grade: user.grade,
      class: user.class,
      token: token,
      expiresIn: JWT_EXPIRES_IN
    });
  } catch (error) {
    // console.error('用户登录失败:', error);
    res.status(500).json({ error: '用户登录失败' });
  }
});

module.exports = router;