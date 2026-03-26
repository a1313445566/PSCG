const express = require('express');
const router = express.Router();
const db = require('../services/database');
const cacheService = require('../services/cache');
const difficultyService = require('../services/difficultyService');
const { validateSubjectId } = require('../services/validationService');

const crypto = require('crypto');

// 生成签名的函数（与前端相同）
const generateSignature = (data, timestamp, userId) => {
  const secret = process.env.SIGNATURE_SECRET;
  if (!secret) {
    throw new Error('SIGNATURE_SECRET environment variable is required');
  }
  // 按照固定顺序构建dataStr
  const dataStr = JSON.stringify(data) + timestamp + userId;
  
  // 使用crypto模块实现HMAC-SHA256算法
  return crypto.createHmac('sha256', secret).update(dataStr).digest('hex');
};

// 安全降级签名（用于非HTTPS环境）
const generateFallbackSignature = (data, timestamp, userId) => {
  const secret = process.env.SIGNATURE_SECRET;
  if (!secret) {
    throw new Error('SIGNATURE_SECRET environment variable is required');
  }
  
  const dataStr = JSON.stringify(data) + timestamp + userId;
  const combinedStr = secret + dataStr + secret;
  let hash = 0;
  
  // 多轮哈希（与前端保持一致）
  for (let round = 0; round < 64; round++) {
    const roundStr = combinedStr + round.toString();
    for (let i = 0; i < roundStr.length; i++) {
      const char = roundStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
  }
  
  // 生成16位十六进制签名
  let result = Math.abs(hash).toString(16);
  while (result.length < 16) {
    result = '0' + result;
  }
  
  return result;
};

// 验证签名的函数
const validateSignature = (data, timestamp, signature, userId) => {
  try {
    if (!data || !timestamp || !signature || !userId) {
      console.log('签名验证失败: 缺少必要参数', { hasData: !!data, hasTimestamp: !!timestamp, hasSignature: !!signature, hasUserId: !!userId });
      return false;
    }
    
    // 检查时间戳是否在合理范围内（5分钟内）
    const currentTime = Date.now();
    const timeDiff = Math.abs(currentTime - timestamp);
    if (timeDiff > 5 * 60 * 1000) {
      console.log('签名验证失败: 时间戳超出范围', { currentTime, timestamp, timeDiff });
      return false;
    }
    
    // 生成预期签名并验证
    let signatureData;
    
    // 检查是否是题目尝试记录
    if (data.questionId) {
      // 题目尝试记录的签名数据
      signatureData = {
        userId: data.userId,
        questionId: data.questionId,
        answerRecordId: data.answerRecordId,
        timestamp: data.timestamp
      };
    } else {
      // 普通答题记录的签名数据
      signatureData = {
        userId: data.userId,
        grade: data.grade,
        class: data.class,
        subjectId: data.subjectId,
        subcategoryId: data.subcategoryId,
        totalQuestions: data.totalQuestions,
        correctCount: data.correctCount,
        timeSpent: data.timeSpent,
        timestamp: data.timestamp
      };
    }
    
    const expectedSignature = generateSignature(signatureData, timestamp, userId);
    const fallbackSignature = generateFallbackSignature(signatureData, timestamp, userId);
    
    // 支持 HMAC-SHA256（HTTPS环境）和 安全降级签名（HTTP环境）
    const isValid = expectedSignature === signature || fallbackSignature === signature;
    
    if (!isValid) {
      console.log('签名验证失败: 签名不匹配');
      console.log('前端签名数据:', JSON.stringify(signatureData));
      console.log('后端 HMAC 签名:', expectedSignature);
      console.log('后端降级签名:', fallbackSignature);
      console.log('前端传入签名:', signature);
    }
    
    return isValid;
  } catch (error) {
    console.error('签名验证失败:', error);
    return false;
  }
};

// 查找用户ID的函数
const findUserId = async (userId, grade, className) => {
  const user = await db.get('SELECT id FROM users WHERE student_id = ? AND grade = ? AND class = ?', [userId, grade, className]);
  if (!user) {
    throw new Error('用户不存在');
  }
  return user.id;
};

// 检查重复提交的函数
const checkDuplicateSubmission = async (userId, subjectId, subcategoryId, cooldownSeconds = 5) => {
  let recentRecord;
  if (subcategoryId === null) {
    // 错题巩固题库，使用 IS NULL 条件
    recentRecord = await db.get(
      'SELECT id FROM answer_records WHERE user_id = ? AND subject_id = ? AND subcategory_id IS NULL AND created_at >= DATE_SUB(NOW(), INTERVAL ? SECOND)',
      [userId, subjectId, cooldownSeconds]
    );
  } else {
    // 普通题库，使用 = 条件
    recentRecord = await db.get(
      'SELECT id FROM answer_records WHERE user_id = ? AND subject_id = ? AND subcategory_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? SECOND)',
      [userId, subjectId, subcategoryId, cooldownSeconds]
    );
  }
  return recentRecord;
};

// 处理选项和答案的函数
const processQuestionData = (question) => {
  // 解析选项
  let options = [];
  try {
    options = JSON.parse(question.options);
  } catch (e) {
    // 解析失败，使用空数组
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
  
  return question;
};

// 获取所有答题记录（支持筛选和分页）
router.get('/all', async (req, res) => {
  try {
    const { page = 1, limit = 20, grade, class: className, subjectId, startDate, endDate, student_id, userId, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    
    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    // 筛选条件
    if (student_id) {
      whereClause += ' AND u.student_id = ?';
      params.push(student_id);
      if (grade) {
        whereClause += ' AND u.grade = ?';
        params.push(grade);
      }
      if (className) {
        whereClause += ' AND u.`class` = ?';
        params.push(className);
      }
    } else if (userId) {
      whereClause += ' AND ar.user_id = ?';
      params.push(parseInt(userId));
      if (grade) {
        whereClause += ' AND u.grade = ?';
        params.push(grade);
      }
      if (className) {
        whereClause += ' AND u.`class` = ?';
        params.push(className);
      }
    } else {
      if (grade) {
        whereClause += ' AND u.grade = ?';
        params.push(grade);
      }
      if (className) {
        whereClause += ' AND u.`class` = ?';
        params.push(className);
      }
    }
    
    if (subjectId) {
      if (!validateSubjectId(subjectId)) {
        return res.status(400).json({ error: '学科ID格式错误' });
      }
      whereClause += ' AND ar.subject_id = ?';
      params.push(parseInt(subjectId));
    }
    
    if (startDate) {
      whereClause += ' AND ar.created_at >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND ar.created_at <= ?';
      params.push(endDate);
    }
    
    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM answer_records ar LEFT JOIN users u ON ar.user_id = u.id LEFT JOIN subjects s ON ar.subject_id = s.id LEFT JOIN subcategories sc ON ar.subcategory_id = sc.id ${whereClause}`;
    const countResult = await db.get(countQuery, params);
    const total = countResult?.total || 0;
    
    // 验证排序字段
    const allowedSortFields = ['created_at', 'student_id', 'name', 'grade', 'class', 'total_questions', 'correct_count'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // 排序字段映射
    const sortFieldMap = {
      'student_id': 'u.student_id',
      'name': 'u.name',
      'grade': 'u.grade',
      'class': 'u.`class`',
      'total_questions': 'ar.total_questions',
      'correct_count': 'ar.correct_count',
      'created_at': 'ar.created_at'
    };
    const orderField = sortFieldMap[validSortBy] || 'ar.created_at';
    
    // 分页查询
    // 注意：MySQL prepared statements 对 LIMIT/OFFSET 参数化支持有限
    // 使用严格验证的整数值直接拼接是安全的替代方案
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20)); // 限制最大100条
    const offset = (pageNum - 1) * limitNum;
    
    // 安全验证：确保分页参数是有效整数
    if (!Number.isInteger(pageNum) || !Number.isInteger(limitNum) || !Number.isInteger(offset)) {
      return res.status(400).json({ error: '分页参数无效' });
    }
    
    const dataQuery = `SELECT ar.*, u.id as user_id, u.student_id, u.name, u.grade, u.\`class\`, s.name as subject_name, sc.name as subcategory_name FROM answer_records ar LEFT JOIN users u ON ar.user_id = u.id LEFT JOIN subjects s ON ar.subject_id = s.id LEFT JOIN subcategories sc ON ar.subcategory_id = sc.id ${whereClause} ORDER BY ${orderField} ${validSortOrder} LIMIT ${limitNum} OFFSET ${offset}`;
    
    const records = await db.all(dataQuery, params);
    
    res.json({
      data: records,
      total: total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('获取答题记录失败:', error.message);
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
      SELECT qa.*, q.content, q.correct_answer, q.options, q.type, q.explanation, qa.shuffled_options, s.name as subject_name,
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
      // 处理题目数据
      processQuestionData(question);
      
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
    const { userId, grade, class: className, subjectId, subcategoryId, totalQuestions, correctCount, timeSpent, timestamp, signature } = req.body;
    
    // 验证签名
    const signatureData = {
      userId,
      grade,
      class: className,
      subjectId,
      subcategoryId,
      totalQuestions,
      correctCount,
      timeSpent,
      timestamp
    };
    
    if (!validateSignature(req.body, timestamp, signature, userId)) {
      return res.status(401).json({ error: '签名验证失败，提交无效' });
    }
    
    // 查找用户ID
    let actualUserId;
    try {
      actualUserId = await findUserId(userId, grade, className);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
    
    // 处理错题巩固题库的情况，subcategoryId为字符串
    const actualSubcategoryId = subcategoryId === 'error-collection' ? null : subcategoryId;
    
    // 检查是否存在重复提交
    const recentRecord = await checkDuplicateSubmission(actualUserId, subjectId, actualSubcategoryId);
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
    res.status(500).json({ error: '保存答题记录失败' });
  }
});

// 保存题目尝试记录
router.post('/question-attempts', async (req, res) => {
  try {
    const { userId, grade, class: className, questionId, subjectId, subcategoryId, userAnswer, correctAnswer, isCorrect, answerRecordId, shuffledOptions, timestamp, signature } = req.body;
    
    // 验证签名
    const signatureData = {
      userId,
      questionId,
      answerRecordId,
      timestamp
    };
    
    if (!validateSignature(req.body, timestamp, signature, userId)) {
      return res.status(401).json({ error: '签名验证失败，提交无效' });
    }
    
    // 查找用户ID
    let actualUserId;
    try {
      actualUserId = await findUserId(userId, grade, className);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
    
    // 处理错题巩固题库的情况，subcategoryId为字符串
    const actualSubcategoryId = subcategoryId === 'error-collection' ? null : subcategoryId;
    
    await db.run(
      'INSERT INTO question_attempts (user_id, question_id, subject_id, subcategory_id, user_answer, correct_answer, is_correct, answer_record_id, shuffled_options) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [actualUserId, questionId, subjectId, actualSubcategoryId, userAnswer, correctAnswer, isCorrect, answerRecordId, shuffledOptions]
    );
    
    // 保存后自动调整题目难度
    await difficultyService.adjustQuestionDifficulty(questionId);
    
    // 异步调整题库难度（不阻塞响应）
    if (actualSubcategoryId) {
      difficultyService.adjustSubcategoryDifficulty(actualSubcategoryId).catch(() => {});
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '保存题目尝试记录失败' });
  }
});

// 获取用户在某题库的统计数据（用于智能选题）
router.get('/user-subcategory-stats/:userId/:subcategoryId', async (req, res) => {
  try {
    const { userId, subcategoryId } = req.params;
    
    // 获取用户在该题库的答题统计
    const stats = await db.get(`
      SELECT 
        COUNT(*) as totalAttempts,
        SUM(is_correct) as correctCount,
        CASE WHEN COUNT(*) > 0 THEN
          (SUM(is_correct) * 100.0) / COUNT(*)
        ELSE 0 END as accuracy
      FROM question_attempts 
      WHERE user_id = ? AND subcategory_id = ?
    `, [userId, subcategoryId]);
    
    // 获取用户最近的答题趋势（最近20次）
    const recentStats = await db.get(`
      SELECT 
        COUNT(*) as recentAttempts,
        SUM(is_correct) as recentCorrect,
        CASE WHEN COUNT(*) > 0 THEN
          (SUM(is_correct) * 100.0) / COUNT(*)
        ELSE 0 END as recentAccuracy
      FROM (
        SELECT is_correct
        FROM question_attempts 
        WHERE user_id = ? AND subcategory_id = ?
        ORDER BY created_at DESC
        LIMIT 20
      ) as recent
    `, [userId, subcategoryId]);
    
    res.json({
      totalAttempts: stats?.totalAttempts || 0,
      correctCount: stats?.correctCount || 0,
      accuracy: stats?.accuracy || 0,
      recentAttempts: recentStats?.recentAttempts || 0,
      recentCorrect: recentStats?.recentCorrect || 0,
      recentAccuracy: recentStats?.recentAccuracy || 0
    });
  } catch (error) {
    console.error('获取用户题库统计失败:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

module.exports = router;