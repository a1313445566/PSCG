const express = require('express');
const router = express.Router();
const db = require('../services/database');

// 获取用户的错题巩固题库
router.get('/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { studentId, grade, class: className } = req.query;
    
    if (!studentId || !grade || !className) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 查找用户ID（使用student_id、grade和class的组合来唯一标识用户）
    // 支持数字或字符串形式的年级班级
    const user = await db.get(
      'SELECT id FROM users WHERE student_id = ? AND (grade = ? OR grade LIKE ?) AND (class = ? OR class LIKE ?)', 
      [studentId, grade, `%${grade}%`, className, `%${className}%`]
    );
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const userId = user.id;
    
    // 获取该用户在该学科下的错题记录，且累计正确次数小于3
    const query = `
      SELECT q.id, q.subject_id, q.subcategory_id, q.content, q.type, q.options, q.correct_answer as answer, q.explanation,
             COALESCE(ec.correct_count, 0) as correct_count, sc.name as subcategory_name
      FROM questions q
      LEFT JOIN (
        SELECT question_id, MAX(correct_count) as correct_count
        FROM error_collection
        WHERE user_id = ?
        GROUP BY question_id
      ) ec ON q.id = ec.question_id
      LEFT JOIN subcategories sc ON q.subcategory_id = sc.id
      WHERE q.subject_id = ?
      AND q.id IN (
        SELECT DISTINCT question_id
        FROM error_collection
        WHERE user_id = ?
      )
      AND COALESCE(ec.correct_count, 0) < 3
    `;
    
    const questions = await db.all(query, [userId, subjectId, userId]);
    
    // 处理选项和答案格式
    const processedQuestions = questions.map(question => {
      try {
        if (typeof question.options === 'string') {
          question.options = JSON.parse(question.options);
        }
      } catch (e) {
        question.options = [];
      }
      return question;
    });
    
    // 获取错题统计
    let stats = [];
    if (processedQuestions.length > 0) {
      const statsQuery = `
        SELECT question_id, correct_count
        FROM error_collection
        WHERE user_id = ?
        AND question_id IN (${processedQuestions.map(() => '?').join(', ')})
      `;
      
      const statsParams = [userId, ...processedQuestions.map(q => q.id)];
      stats = await db.all(statsQuery, statsParams);
    }
    
    const statsObj = {};
    stats.forEach(item => {
      statsObj[item.question_id] = { correctCount: item.correct_count };
    });
    
    res.json({ questions: processedQuestions, stats: statsObj });
  } catch (error) {
    console.error('获取错题巩固题库失败:', error.message);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ error: '获取错题巩固题库失败', message: error.message });
  }
});

// 更新错题的正确次数
router.post('/update', async (req, res) => {
  try {
    const { studentId, grade, class: className, questionId, correctCount } = req.body;
    
    if (!studentId || !grade || !className || !questionId || correctCount === undefined) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 查找用户ID（使用student_id、grade和class的组合来唯一标识用户）
    const user = await db.get('SELECT id FROM users WHERE student_id = ? AND grade = ? AND class = ?', [studentId, grade, className]);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const userId = user.id;
    
    // 检查是否已存在记录
    const existingRecord = await db.get(
      'SELECT id FROM error_collection WHERE user_id = ? AND question_id = ?',
      [userId, questionId]
    );
    
    if (existingRecord) {
      // 更新现有记录
      await db.run(
        'UPDATE error_collection SET correct_count = ? WHERE user_id = ? AND question_id = ?',
        [correctCount, userId, questionId]
      );
    } else {
      // 创建新记录
      await db.run(
        'INSERT INTO error_collection (user_id, question_id, correct_count) VALUES (?, ?, ?)',
        [userId, questionId, correctCount]
      );
    }
    
    // 错题巩固题库积分规则：每题累计正确3次+1分
    // 注意：quiz.js中的错题处理逻辑已经会处理积分，这里不再重复加分
    // 只在直接通过此接口更新时加分，避免重复
    if (correctCount === 3) {
      // 检查是否已经在quiz.js中处理过积分
      const recentQuizRecord = await db.get(
        'SELECT id FROM answer_records WHERE user_id = ? AND subcategory_id IS NULL AND created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)',
        [userId]
      );
      
      if (!recentQuizRecord) {
        // 当累计正确次数达到3次时，增加1分
        await db.run(
          'UPDATE users SET points = COALESCE(points, 0) + 1 WHERE id = ?',
          [userId]
        );
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('更新错题正确次数失败:', error);
    res.status(500).json({ error: '更新错题正确次数失败' });
  }
});

// 重置错题的正确次数
router.post('/reset', async (req, res) => {
  try {
    const { studentId, grade, class: className, questionId } = req.body;
    
    if (!studentId || !grade || !className || !questionId) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 查找用户ID（使用student_id、grade和class的组合来唯一标识用户）
    // 支持数字或字符串形式的年级班级
    const user = await db.get(
      'SELECT id FROM users WHERE student_id = ? AND (grade = ? OR grade LIKE ?) AND (class = ? OR class LIKE ?)', 
      [studentId, grade, `%${grade}%`, className, `%${className}%`]
    );
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const userId = user.id;
    
    // 重置正确次数为0
    await db.run(
      'UPDATE error_collection SET correct_count = 0 WHERE user_id = ? AND question_id = ?',
      [userId, questionId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('重置错题正确次数失败:', error);
    res.status(500).json({ error: '重置错题正确次数失败' });
  }
});

module.exports = router;