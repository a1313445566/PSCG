const express = require('express');
const router = express.Router();
const db = require('../services/database');
const cacheService = require('../services/cache');
const difficultyService = require('../services/difficultyService');
const { validateSubjectId } = require('../services/validationService');

// 获取所有答题记录（支持筛选）
router.get('/all', async (req, res) => {
  try {
    const { limit = 50, grade, class: className, subjectId, startDate, endDate, student_id, userId } = req.query;
    
    let query = 'SELECT ar.*, u.id as user_id, u.student_id, u.name, u.grade, u.`class`, s.name as subject_name, sc.name as subcategory_name FROM answer_records ar LEFT JOIN users u ON ar.user_id = u.id LEFT JOIN subjects s ON ar.subject_id = s.id LEFT JOIN subcategories sc ON ar.subcategory_id = sc.id WHERE 1=1';
    
    const params = [];
    
    if (student_id) {
      query += ' AND u.student_id = ?';
      params.push(student_id);
      // 当使用student_id查询时，确保同时使用grade和class进行过滤
      if (grade) {
        query += ' AND u.grade = ?';
        params.push(grade);
      }
      if (className) {
        query += ' AND u.`class` = ?';
        params.push(className);
      }
    } else if (userId) {
      // 当使用userId查询时，根据用户ID筛选
      query += ' AND ar.user_id = ?';
      params.push(userId);
      // 同时可以使用grade和class进行过滤
      if (grade) {
        query += ' AND u.grade = ?';
        params.push(grade);
      }
      if (className) {
        query += ' AND u.`class` = ?';
        params.push(className);
      }
    } else {
      // 当不使用student_id和userId查询时，可以单独使用grade或class进行过滤
      if (grade) {
        query += ' AND u.grade = ?';
        params.push(grade);
      }
      if (className) {
        query += ' AND u.`class` = ?';
        params.push(className);
      }
    }
    
    if (subjectId) {
      if (!validateSubjectId(subjectId)) {
        return res.status(400).json({ error: '学科ID格式错误' });
      }
      query += ' AND ar.subject_id = ?';
      params.push(parseInt(subjectId));
    }
    
    if (startDate) {
      query += ' AND ar.created_at >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND ar.created_at <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY ar.created_at DESC';
    
    // 如果limit不为0，添加LIMIT子句
    const limitNum = Number(limit);
    if (limitNum > 0) {
      query += ' LIMIT ?';
      params.push(limitNum);
    }
    
    const records = await db.all(query, params);
    res.json(records);
  } catch (error) {
    // console.error('获取答题记录失败:', error);
    res.status(500).json({ error: '获取答题记录失败' });
  }
});

// 获取指定用户的答题记录
router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const query = `
      SELECT ar.*, s.name as subject_name, sc.name as subcategory_name
      FROM answer_records ar
      LEFT JOIN subjects s ON ar.subject_id = s.id
      LEFT JOIN subcategories sc ON ar.subcategory_id = sc.id
      WHERE ar.user_id = ?
      ORDER BY ar.created_at DESC
    `;
    
    const records = await db.all(query, [userId]);
    res.json(records);
  } catch (error) {
    // console.error('获取用户答题记录失败:', error);
    res.status(500).json({ error: '获取用户答题记录失败' });
  }
});

// 题目尝试记录相关API
router.get('/question-attempts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { answerRecordId } = req.query;
    
    let query = `
      SELECT qa.*, q.content, q.correct_answer, q.options, q.type, qa.shuffled_options, s.name as subject_name,
             sc.name as subcategory_name
      FROM question_attempts qa
      LEFT JOIN questions q ON qa.question_id = q.id
      LEFT JOIN subjects s ON qa.subject_id = s.id
      LEFT JOIN subcategories sc ON qa.subcategory_id = sc.id
      WHERE qa.user_id = ?
    `;
    
    const params = [userId];
    
    if (answerRecordId) {
      query += ' AND qa.answer_record_id = ?';
      params.push(answerRecordId);
    }
    
    query += ' ORDER BY qa.created_at DESC';
    
    const attempts = await db.all(query, params);
    res.json(attempts);
  } catch (error) {
    // console.error('获取题目尝试记录失败:', error);
    res.status(500).json({ error: '获取题目尝试记录失败' });
  }
});

// 错误率较高的题目API
router.get('/error-prone-questions', async (req, res) => {
  try {
    const { subjectId, grade, class: className, subcategoryIds } = req.query;
    
    // 生成缓存键
    const cacheKey = cacheService.generateErrorProneKey({ subjectId, grade, className, subcategoryIds });
    
    // 尝试从缓存获取
    const cachedQuestions = cacheService.get(cacheKey);
    if (cachedQuestions) {
      res.json(cachedQuestions);
      return;
    }
    
    let query = `
      SELECT q.id, q.subject_id, q.content, q.type, q.options, q.correct_answer,
             COUNT(qa.id) as total_attempts,
             SUM(qa.is_correct) as correct_count,
             s.name as subject_name
      FROM questions q
      LEFT JOIN question_attempts qa ON q.id = qa.question_id
      LEFT JOIN users u ON qa.user_id = u.id
      LEFT JOIN subjects s ON q.subject_id = s.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (subjectId) {
      query += ' AND q.subject_id = ?';
      params.push(subjectId);
    }
    
    if (subcategoryIds) {
      const subcategoryArray = Array.isArray(subcategoryIds) ? subcategoryIds : [subcategoryIds];
      if (subcategoryArray.length > 0) {
        query += ' AND q.subcategory_id IN (' + subcategoryArray.map(() => '?').join(', ') + ')';
        params.push(...subcategoryArray);
      }
    }
    
    if (grade) {
      query += ' AND u.grade = ?';
      params.push(grade);
    }
    
    if (className) {
      query += ' AND u.\`class\` = ?';
      params.push(className);
    }
    
    query += ' GROUP BY q.id HAVING total_attempts >= 3 ORDER BY (total_attempts - correct_count) DESC LIMIT 20';
    
    const questions = await db.all(query, params);
    
    // 处理错误率较高的题目数据，添加选项和选择次数
    for (const question of questions) {
      // 解析选项
      let options = [];
      try {
        options = JSON.parse(question.options);
      } catch (e) {
        // console.error('解析选项失败:', e);
      }
      question.options = options;
      
      // 解析正确答案
      let correctAnswer = question.correct_answer;
      try {
        const parsedAnswer = JSON.parse(question.correct_answer);
        if (typeof parsedAnswer === 'string') {
          correctAnswer = parsedAnswer;
        }
      } catch (e) {
        // 解析失败，使用原始值
      }
      question.correctAnswer = correctAnswer;
      
      // 构建选项选择次数查询，应用相同的筛选条件
      let optionCountsQuery = `
        SELECT user_answer, COUNT(*) as count
        FROM question_attempts qa
        LEFT JOIN users u ON qa.user_id = u.id
        WHERE qa.question_id = ?
      `;
      
      const optionCountsParams = [question.id];
      
      if (grade) {
        optionCountsQuery += ' AND u.grade = ?';
        optionCountsParams.push(grade);
      }
      
      if (className) {
        optionCountsQuery += ' AND u.class = ?';
        optionCountsParams.push(className);
      }
      
      optionCountsQuery += ' GROUP BY user_answer';
      
      const optionCounts = await db.all(optionCountsQuery, optionCountsParams);
      
      // 构建选项选择次数对象
      const optionCountsObj = {};
      if (optionCounts) {
        optionCounts.forEach(item => {
          optionCountsObj[item.user_answer] = item.count;
        });
      }
      question.optionCounts = optionCountsObj;
    }
    
    // 缓存结果
    cacheService.set(cacheKey, questions);
    res.json(questions);
  } catch (error) {
    // console.error('获取错误率较高的题目失败:', error);
    res.status(500).json({ error: '获取错误率较高的题目失败' });
  }
});

// 保存答题记录
router.post('/', async (req, res) => {
  try {
    const { userId, grade, class: className, subjectId, subcategoryId, totalQuestions, correctCount, timeSpent } = req.body;
    
    // 查找用户ID（使用student_id、grade和class的组合来唯一标识用户）
    const user = await db.get('SELECT id FROM users WHERE student_id = ? AND grade = ? AND class = ?', [userId, grade, className]);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const actualUserId = user.id;
    
    // 处理错题巩固题库的情况，subcategoryId为字符串
    const actualSubcategoryId = subcategoryId === 'error-collection' ? null : subcategoryId;
    
    // 检查是否存在重复提交（5秒内相同用户、相同学科、相同题库的提交）
    let recentRecord;
    const cooldownSeconds = 5;
    if (actualSubcategoryId === null) {
      // 错题巩固题库，使用 IS NULL 条件
      recentRecord = await db.get(
        'SELECT id FROM answer_records WHERE user_id = ? AND subject_id = ? AND subcategory_id IS NULL AND created_at >= DATE_SUB(NOW(), INTERVAL ? SECOND)',
        [actualUserId, subjectId, cooldownSeconds]
      );
    } else {
      // 普通题库，使用 = 条件
      recentRecord = await db.get(
        'SELECT id FROM answer_records WHERE user_id = ? AND subject_id = ? AND subcategory_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? SECOND)',
        [actualUserId, subjectId, actualSubcategoryId, cooldownSeconds]
      );
    }
    
    if (recentRecord) {
      return res.status(400).json({ error: '提交过于频繁，请稍后再试' });
    }
    
    // 计算积分
    let points = 0;
    if (subcategoryId === 'error-collection') {
      // 错题巩固题库规则：错误不扣分，每题累计正确3次+1分
      // 这里只记录答题记录，积分在error-collection/update中处理
      points = 0;
    } else {
      // 普通题库规则：答对1分，答错一题扣1分
      points = correctCount - (totalQuestions - correctCount);
      
      // 全对积分翻倍
      if (correctCount === totalQuestions && totalQuestions > 0) {
        points *= 2;
      }
    }
    
    // 直接执行操作，不使用事务
    // 保存答题记录
    const result = await db.run(
      'INSERT INTO answer_records (user_id, subject_id, subcategory_id, total_questions, correct_count, time_spent) VALUES (?, ?, ?, ?, ?, ?)',
      [actualUserId, subjectId, actualSubcategoryId, totalQuestions, correctCount, timeSpent]
    );
    
    // 更新用户积分
    await db.run(
      'UPDATE users SET points = COALESCE(points, 0) + ? WHERE id = ?',
      [points, actualUserId]
    );
    
    res.json({ success: true, recordId: result.insertId, points });
  } catch (error) {
    console.error('保存答题记录失败:', error);
    res.status(500).json({ error: '保存答题记录失败' });
  }
});

// 保存题目尝试记录
router.post('/question-attempts', async (req, res) => {
  try {
    const { userId, grade, class: className, questionId, subjectId, subcategoryId, userAnswer, correctAnswer, isCorrect, answerRecordId, shuffledOptions } = req.body;
    
    // 查找用户ID（使用student_id、grade和class的组合来唯一标识用户）
    const user = await db.get('SELECT id FROM users WHERE student_id = ? AND grade = ? AND class = ?', [userId, grade, className]);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const actualUserId = user.id;
    
    // 处理错题巩固题库的情况，subcategoryId为字符串
    const actualSubcategoryId = subcategoryId === 'error-collection' ? null : subcategoryId;
    
    await db.run(
      'INSERT INTO question_attempts (user_id, question_id, subject_id, subcategory_id, user_answer, correct_answer, is_correct, answer_record_id, shuffled_options) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [actualUserId, questionId, subjectId, actualSubcategoryId, userAnswer, correctAnswer, isCorrect, answerRecordId, shuffledOptions]
    );
    
    // 保存后自动调整题目难度
    await difficultyService.adjustQuestionDifficulty(questionId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('保存题目尝试记录失败:', error);
    res.status(500).json({ error: '保存题目尝试记录失败' });
  }
});

module.exports = router;