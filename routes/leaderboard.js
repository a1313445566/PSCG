const express = require('express');
const router = express.Router();
const db = require('../services/database');
const cacheService = require('../services/cache');
const { validateSubjectId } = require('../services/validationService');

// 全局排行榜API
router.get('/global', async (req, res) => {
  try {
    const { limit = 100, grade, class: className, id, student_id, subjectId } = req.query;
    
    // 生成缓存键
    const cacheKey = cacheService.generateLeaderboardKey({ 
      subjectId, 
      grade, 
      className, 
      limit,
      id,
      student_id
    });
    
    // 尝试从缓存获取
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      // 更新缓存时间戳（滑动过期）
      cacheService.touch(cacheKey, cacheService.CACHE_DURATIONS.LEADERBOARD);
      res.json(cachedData);
      return;
    }
    
    let query = `
      SELECT u.id, u.student_id, u.name, u.grade, u.class, u.points,
             COUNT(DISTINCT ar.id) as total_sessions,
             SUM(ar.total_questions) as total_questions,
             SUM(ar.correct_count) as correct_count,
             CASE WHEN SUM(ar.total_questions) > 0 THEN
               (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions)
             ELSE 0 END as avg_accuracy
      FROM users u
      JOIN answer_records ar ON u.id = ar.user_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (id) {
      query += ' AND u.id = ?';
      params.push(id);
      // 当使用id查询时，也可以使用grade和class进行过滤
      if (grade) {
        query += ' AND u.grade = ?';
        params.push(grade);
      }
      if (className) {
        query += ' AND u.class = ?';
        params.push(className);
      }
    } else if (student_id) {
      query += ' AND u.student_id = ?';
      params.push(student_id);
      // 当使用student_id查询时，确保同时使用grade和class进行过滤
      if (grade) {
        query += ' AND u.grade = ?';
        params.push(grade);
      }
      if (className) {
        query += ' AND u.class = ?';
        params.push(className);
      }
    } else {
      // 当不使用student_id和id查询时，可以单独使用grade或class进行过滤
      if (grade) {
        query += ' AND u.grade = ?';
        params.push(grade);
      }
      if (className) {
        query += ' AND u.class = ?';
        params.push(className);
      }
    }
    
    // 学科筛选
    if (subjectId) {
      if (!validateSubjectId(subjectId)) {
        return res.status(400).json({ error: '学科ID格式错误' });
      }
      query += ' AND ar.subject_id = ?';
      params.push(parseInt(subjectId));
    }
    
    query += ' GROUP BY u.id ORDER BY avg_accuracy DESC, total_questions DESC';
    
    // 如果limit不为0，添加LIMIT子句
    const limitNum = parseInt(limit);
    if (limitNum > 0) {
      query += ' LIMIT ?';
      params.push(limitNum);
    }
    
    const users = await db.all(query, params);
    
    // 缓存结果
    cacheService.set(cacheKey, users, cacheService.CACHE_DURATIONS.LEADERBOARD);
    
    res.json(users);
  } catch (error) {
    // console.error('获取排行榜数据失败:', error);
    res.status(500).json({ error: '获取排行榜数据失败' });
  }
});

// 学科排行榜API
router.get('/subject/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { grade, class: className, subcategoryId } = req.query;
    
    let query = `
      SELECT u.id, u.student_id, u.name, u.grade, u.class, u.points,
             COUNT(DISTINCT ar.id) as total_sessions,
             SUM(ar.total_questions) as total_questions,
             SUM(ar.correct_count) as correct_count,
             CASE WHEN SUM(ar.total_questions) > 0 THEN
               (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions)
             ELSE 0 END as avg_accuracy
      FROM users u
      JOIN answer_records ar ON u.id = ar.user_id
      WHERE ar.subject_id = ?
    `;
    
    const params = [subjectId];
    
    if (subcategoryId) {
      query += ' AND ar.subcategory_id = ?';
      params.push(subcategoryId);
    }
    
    if (grade) {
      query += ' AND u.grade = ?';
      params.push(grade);
    }
    
    if (className) {
      query += ' AND u.class = ?';
      params.push(className);
    }
    
    query += ' GROUP BY u.id ORDER BY avg_accuracy DESC, total_questions DESC';
    
    const users = await db.all(query, params);
    res.json(users);
  } catch (error) {
    // console.error('获取学科排行榜数据失败:', error);
    res.status(500).json({ error: '获取学科排行榜数据失败' });
  }
});

// TOP10排行榜API（每周统计）
router.get('/top10', async (req, res) => {
  try {
    const { subjectId } = req.query;
    
    // 预计算本周开始和结束日期，避免在SQL中重复计算
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 计算到本周一的差值
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const startDateStr = startOfWeek.toISOString().slice(0, 19).replace('T', ' ');
    const endDateStr = endOfWeek.toISOString().slice(0, 19).replace('T', ' ');
    
    let query = `
      SELECT u.id, u.student_id, u.name, u.grade, u.class,
             COUNT(DISTINCT ar.id) as total_sessions,
             SUM(ar.total_questions) as total_questions,
             SUM(ar.correct_count) as correct_count,
             CASE WHEN SUM(ar.total_questions) > 0 THEN
               (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions)
             ELSE 0 END as avg_accuracy,
             SUM(
               CASE 
                 WHEN ar.total_questions = ar.correct_count AND ar.total_questions > 0 THEN
                   (ar.correct_count - (ar.total_questions - ar.correct_count)) * 2
                 ELSE
                   ar.correct_count - (ar.total_questions - ar.correct_count)
               END
             ) as points
      FROM users u
      JOIN answer_records ar ON u.id = ar.user_id
      WHERE 1=1
      AND ar.created_at >= ? AND ar.created_at <= ?
    `;
    
    const params = [startDateStr, endDateStr];
    
    // 学科筛选
    if (subjectId) {
      if (!validateSubjectId(subjectId)) {
        return res.status(400).json({ error: '学科ID格式错误' });
      }
      query += ' AND ar.subject_id = ?';
      params.push(parseInt(subjectId));
    }
    
    query += ' GROUP BY u.id HAVING SUM(ar.total_questions) >= 20 ORDER BY points DESC, avg_accuracy DESC, total_questions DESC LIMIT 10';
    
    const users = await db.all(query, params);
    res.json(users);
  } catch (error) {
    // console.error('获取TOP10排行榜数据失败:', error);
    res.status(500).json({ error: '获取TOP10排行榜数据失败' });
  }
});

// 清空排行榜数据
router.post('/clear', async (req, res) => {
  try {
    // 清空答题记录
    await db.run('DELETE FROM question_attempts');
    await db.run('DELETE FROM answer_records');
    
    // 清除相关缓存
    cacheService.del('analysis');
    cacheService.del('error_prone_questions');
    
    res.json({ success: true, message: '排行榜数据清空成功' });
  } catch (error) {
    // console.error('清空排行榜数据失败:', error);
    res.status(500).json({ error: '清空排行榜数据失败' });
  }
});

module.exports = router;