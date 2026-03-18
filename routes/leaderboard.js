const express = require('express');
const router = express.Router();
const db = require('../services/database');
const cacheService = require('../services/cache');

// 全局排行榜API
router.get('/global', async (req, res) => {
  try {
    const { limit = 100, grade, class: className, id } = req.query;
    
    let query = `
      SELECT u.id, u.student_id, u.name, u.grade, u.class,
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
    }
    
    if (grade) {
      query += ' AND u.grade = ?';
      params.push(grade);
    }
    
    if (className) {
      query += ' AND u.class = ?';
      params.push(className);
    }
    
    query += ' GROUP BY u.id ORDER BY avg_accuracy DESC, total_questions DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const users = await db.all(query, params);
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
      SELECT u.id, u.student_id, u.name, u.grade, u.class,
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