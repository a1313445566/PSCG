/**
 * AI 分析 API 路由
 * 提供自然语言分析、智能推荐等接口
 */

const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const db = require('../services/database');
const adminAuth = require('../middleware/adminAuth');

/**
 * POST /api/ai/analyze
 * 自然语言数据分析
 */
/**
 * POST /api/ai/analyze
 * 自然语言数据分析（智能版 - AI 自己理解用户意图）
 */
router.post('/analyze', adminAuth, async (req, res) => {
  try {
    const { question, filters } = req.body;
    
    // 输入验证
    if (!question || question.trim() === '') {
      return res.status(400).json({ error: '请输入分析问题' });
    }
    
    // 限制问题长度
    if (question.length > 500) {
      return res.status(400).json({ error: '问题长度不能超过500字' });
    }

    // 使用智能分析：让 AI 自己理解问题并决定查询
    const analysis = await aiService.smartAnalyze(question, filters || {});
    
    res.json({ 
      success: true, 
      analysis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[AI分析] 失败:', error);
    res.status(500).json({ error: error.message || 'AI 分析失败' });
  }
});

/**
 * POST /api/ai/analyze-legacy
 * 原有分析接口（保留作为备用）
 */
router.post('/analyze-legacy', adminAuth, async (req, res) => {
  try {
    const { question, filters } = req.body;
    
    // 输入验证
    if (!question || question.trim() === '') {
      return res.status(400).json({ error: '请输入分析问题' });
    }
    
    // 限制问题长度
    if (question.length > 500) {
      return res.status(400).json({ error: '问题长度不能超过500字' });
    }

    // 获取分析数据（复用现有分析逻辑）
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (filters?.grade) {
      whereClause += ' AND u.grade = ?';
      params.push(filters.grade);
    }
    if (filters?.class) {
      whereClause += ' AND u.class = ?';
      params.push(filters.class);
    }
    if (filters?.subjectId) {
      whereClause += ' AND ar.subject_id = ?';
      params.push(filters.subjectId);
    }

    // 查询基础数据
    const basicStats = await db.get(`
      SELECT 
        COUNT(DISTINCT u.id) as totalUsers,
        COUNT(DISTINCT ar.id) as totalSessions,
        SUM(ar.total_questions) as totalQuestions,
        SUM(ar.correct_count) as totalCorrect,
        CASE WHEN SUM(ar.total_questions) > 0 
          THEN (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) 
          ELSE 0 END as overallAccuracy
      FROM answer_records ar
      INNER JOIN users u ON ar.user_id = u.id
      ${whereClause}
    `, params);

    // 查询学科分析
    const subjectAnalysis = await db.query(`
      SELECT 
        s.name as subject,
        COUNT(DISTINCT ar.id) as sessions,
        SUM(ar.total_questions) as questions,
        SUM(ar.correct_count) as correct,
        CASE WHEN SUM(ar.total_questions) > 0 
          THEN (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) 
          ELSE 0 END as accuracy
      FROM answer_records ar
      INNER JOIN users u ON ar.user_id = u.id
      INNER JOIN subjects s ON ar.subject_id = s.id
      ${whereClause}
      GROUP BY ar.subject_id, s.name
      ORDER BY accuracy ASC
    `, params);

    // 查询年级分析
    const gradeAnalysis = await db.query(`
      SELECT 
        u.grade,
        COUNT(DISTINCT ar.id) as sessions,
        COUNT(DISTINCT u.id) as users,
        SUM(ar.total_questions) as questions,
        SUM(ar.correct_count) as correct,
        CASE WHEN SUM(ar.total_questions) > 0 
          THEN (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) 
          ELSE 0 END as accuracy
      FROM answer_records ar
      INNER JOIN users u ON ar.user_id = u.id
      ${whereClause}
      GROUP BY u.grade
      ORDER BY u.grade
    `, params);

    // 查询班级分析
    const classAnalysis = await db.query(`
      SELECT 
        u.grade,
        u.class,
        COUNT(DISTINCT ar.id) as sessions,
        COUNT(DISTINCT u.id) as users,
        CASE WHEN SUM(ar.total_questions) > 0 
          THEN (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) 
          ELSE 0 END as accuracy
      FROM answer_records ar
      INNER JOIN users u ON ar.user_id = u.id
      ${whereClause}
      GROUP BY u.grade, u.class
      ORDER BY accuracy ASC
      LIMIT 10
    `, params);

    // 查询知识点分析（薄弱知识点）
    const subcategoryAnalysis = await db.query(`
      SELECT 
        s.name as subject,
        sub.name as subcategory,
        COUNT(DISTINCT ar.id) as sessions,
        SUM(ar.total_questions) as questions,
        SUM(ar.correct_count) as correct,
        CASE WHEN SUM(ar.total_questions) > 0 
          THEN (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) 
          ELSE 0 END as accuracy
      FROM answer_records ar
      INNER JOIN users u ON ar.user_id = u.id
      INNER JOIN subjects s ON ar.subject_id = s.id
      INNER JOIN subcategories sub ON ar.subcategory_id = sub.id
      ${whereClause}
      GROUP BY ar.subject_id, ar.subcategory_id, s.name, sub.name
      ORDER BY accuracy ASC
      LIMIT 10
    `, params);

    // 查询近7天趋势
    const trendAnalysis = await db.query(`
      SELECT 
        DATE(ar.created_at) as date,
        COUNT(DISTINCT ar.id) as sessions,
        SUM(ar.total_questions) as questions,
        SUM(ar.correct_count) as correct,
        CASE WHEN SUM(ar.total_questions) > 0 
          THEN (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) 
          ELSE 0 END as accuracy
      FROM answer_records ar
      INNER JOIN users u ON ar.user_id = u.id
      ${whereClause}
      AND ar.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(ar.created_at)
      ORDER BY date DESC
    `, params);

    // ===== 新增：题目数据统计 =====
    const questionStats = await db.get(`
      SELECT 
        COUNT(*) as totalQuestions,
        COUNT(CASE WHEN type = 'single' THEN 1 END) as singleChoice,
        COUNT(CASE WHEN type = 'multiple' THEN 1 END) as multipleChoice,
        COALESCE(AVG(difficulty), 0) as avgDifficulty
      FROM questions
    `);

    // 难度分布
    const difficultyDistribution = await db.query(`
      SELECT 
        difficulty,
        COUNT(*) as count,
        CASE difficulty
          WHEN 1 THEN '简单'
          WHEN 2 THEN '中等'
          WHEN 3 THEN '困难'
          ELSE '未知'
        END as label
      FROM questions
      GROUP BY difficulty
      ORDER BY difficulty
    `);

    // 各学科题目数量
    const questionBySubject = await db.query(`
      SELECT 
        s.name as subject,
        COUNT(q.id) as questionCount,
        COALESCE(AVG(q.difficulty), 0) as avgDifficulty
      FROM questions q
      INNER JOIN subjects s ON q.subject_id = s.id
      GROUP BY q.subject_id, s.name
      ORDER BY questionCount DESC
    `);

    // ===== 新增：用户活跃度统计 =====
    const userActivityStats = await db.get(`
      SELECT 
        COUNT(DISTINCT u.id) as totalUsers,
        COUNT(DISTINCT CASE WHEN ar.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN u.id END) as activeToday,
        COUNT(DISTINCT CASE WHEN ar.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN u.id END) as activeThisWeek,
        COUNT(DISTINCT CASE WHEN ar.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN u.id END) as activeThisMonth
      FROM users u
      LEFT JOIN answer_records ar ON u.id = ar.user_id
    `);

    // 用户答题次数分布
    const userAnswerDistribution = await db.query(`
      SELECT 
        CASE 
          WHEN answer_count = 0 THEN '0次'
          WHEN answer_count BETWEEN 1 AND 5 THEN '1-5次'
          WHEN answer_count BETWEEN 6 AND 10 THEN '6-10次'
          WHEN answer_count BETWEEN 11 AND 20 THEN '11-20次'
          ELSE '20次以上'
        END as answer_range,
        COUNT(*) as userCount
      FROM (
        SELECT u.id, COUNT(ar.id) as answer_count
        FROM users u
        LEFT JOIN answer_records ar ON u.id = ar.user_id
        GROUP BY u.id
      ) user_stats
      GROUP BY answer_range
      ORDER BY 
        CASE answer_range
          WHEN '0次' THEN 1
          WHEN '1-5次' THEN 2
          WHEN '6-10次' THEN 3
          WHEN '11-20次' THEN 4
          ELSE 5
        END
    `);

    // ===== 新增：错题收集统计 =====
    const errorCollectionStats = await db.get(`
      SELECT 
        COUNT(DISTINCT ec.user_id) as usersWithErrors,
        COUNT(DISTINCT ec.question_id) as uniqueErrorQuestions,
        COUNT(*) as totalErrorRecords
      FROM error_collection ec
    `);

    // 高频错题（被收藏3次以上）
    const frequentErrorQuestions = await db.query(`
      SELECT 
        q.content,
        s.name as subject,
        sub.name as subcategory,
        COUNT(DISTINCT ec.user_id) as errorUserCount
      FROM error_collection ec
      INNER JOIN questions q ON ec.question_id = q.id
      INNER JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN subcategories sub ON q.subcategory_id = sub.id
      GROUP BY ec.question_id, q.content, s.name, sub.name
      HAVING errorUserCount >= 3
      ORDER BY errorUserCount DESC
      LIMIT 10
    `);

    // ===== 新增：答题时间分布 =====
    const timeDistribution = await db.query(`
      SELECT 
        CASE 
          WHEN HOUR(created_at) BETWEEN 6 AND 11 THEN '上午(6-12点)'
          WHEN HOUR(created_at) BETWEEN 12 AND 17 THEN '下午(12-18点)'
          WHEN HOUR(created_at) BETWEEN 18 AND 21 THEN '晚上(18-21点)'
          ELSE '夜间(21-6点)'
        END as timeSlot,
        COUNT(*) as sessionCount,
        SUM(total_questions) as questionCount,
        CASE WHEN SUM(total_questions) > 0 
          THEN (SUM(correct_count) * 100.0) / SUM(total_questions) 
          ELSE 0 END as accuracy
      FROM answer_records
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY timeSlot
      ORDER BY 
        CASE timeSlot
          WHEN '上午(6-12点)' THEN 1
          WHEN '下午(12-18点)' THEN 2
          WHEN '晚上(18-21点)' THEN 3
          ELSE 4
        END
    `);

    // ===== 新增：题目尝试统计（各题正确率）=====
    const questionAttemptStats = await db.query(`
      SELECT 
        s.name as subject,
        COUNT(DISTINCT qa.question_id) as attemptedQuestions,
        SUM(qa.is_correct) as correctCount,
        COUNT(*) as totalAttempts,
        CASE WHEN COUNT(*) > 0 
          THEN (SUM(qa.is_correct) * 100.0) / COUNT(*) 
          ELSE 0 END as accuracy
      FROM question_attempts qa
      INNER JOIN subjects s ON qa.subject_id = s.id
      GROUP BY qa.subject_id, s.name
      ORDER BY accuracy ASC
    `);

    // 最难题目（正确率最低，至少被答5次）
    const hardestQuestions = await db.query(`
      SELECT 
        q.content,
        s.name as subject,
        COUNT(*) as attempts,
        SUM(qa.is_correct) as correct,
        CASE WHEN COUNT(*) > 0 
          THEN (SUM(qa.is_correct) * 100.0) / COUNT(*) 
          ELSE 0 END as accuracy
      FROM question_attempts qa
      INNER JOIN questions q ON qa.question_id = q.id
      INNER JOIN subjects s ON q.subject_id = s.id
      GROUP BY qa.question_id, q.content, s.name
      HAVING attempts >= 5
      ORDER BY accuracy ASC
      LIMIT 10
    `);

    // 构建上下文数据
    const analysisData = {
      // 原有数据
      basicStats,
      subjectAnalysis,
      gradeAnalysis,
      classAnalysis,
      subcategoryAnalysis,
      trendAnalysis,
      
      // 新增：题目统计
      questionStats,
      difficultyDistribution,
      questionBySubject,
      
      // 新增：用户活跃度
      userActivityStats,
      userAnswerDistribution,
      
      // 新增：错题统计
      errorCollectionStats,
      frequentErrorQuestions,
      
      // 新增：时间分布
      timeDistribution,
      
      // 新增：题目尝试统计
      questionAttemptStats,
      hardestQuestions,
      
      filters,
      timestamp: new Date().toISOString()
    };

    // 调用 AI 分析
    const analysis = await aiService.analyzeData(analysisData, question);

    res.json({ 
      success: true, 
      analysis,
      question,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI分析] 分析失败:', error);
    res.status(500).json({ 
      error: error.message || 'AI 分析失败,请稍后重试',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/ai/error-analysis
 * 错题智能分析
 */
router.post('/error-analysis', adminAuth, async (req, res) => {
  try {
    const { questionIds } = req.body;
    
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: '请提供题目ID列表' });
    }

    // 限制题目数量
    if (questionIds.length > 20) {
      return res.status(400).json({ error: '单次最多分析20道题目' });
    }

    // 查询题目数据
    const questions = await db.query(`
      SELECT 
        q.content,
        s.name as subject_name,
        COUNT(qa.id) as total_attempts,
        SUM(qa.is_correct) as correct_count,
        q.options,
        q.correct_answer
      FROM questions q
      LEFT JOIN question_attempts qa ON q.id = qa.question_id
      LEFT JOIN subjects s ON q.subject_id = s.id
      WHERE q.id IN (${questionIds.map(() => '?').join(',')})
      GROUP BY q.id
      HAVING total_attempts >= 3
    `, questionIds);

    if (questions.length === 0) {
      return res.status(404).json({ error: '未找到符合条件的题目数据' });
    }

    // 调用 AI 分析
    const analysis = await aiService.generateErrorAnalysis(questions);

    res.json({ 
      success: true, 
      analysis,
      questionCount: questions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI错题分析] 分析失败:', error);
    res.status(500).json({ 
      error: error.message || '错题分析失败,请稍后重试'
    });
  }
});

/**
 * POST /api/ai/explanation
 * 生成题目解析
 */
router.post('/explanation', adminAuth, async (req, res) => {
  try {
    const { questionId } = req.body;
    
    if (!questionId) {
      return res.status(400).json({ error: '请提供题目ID' });
    }

    // 查询题目数据
    const question = await db.get(`
      SELECT 
        q.content,
        q.type,
        q.options,
        q.correct_answer as correctAnswer,
        s.name as subject_name
      FROM questions q
      LEFT JOIN subjects s ON q.subject_id = s.id
      WHERE q.id = ?
    `, [questionId]);

    if (!question) {
      return res.status(404).json({ error: '题目不存在' });
    }

    // 解析选项和答案
    try {
      question.options = JSON.parse(question.options);
    } catch (e) {
      question.options = [];
    }

    // 调用 AI 生成解析
    const explanation = await aiService.generateQuestionExplanation(question);

    res.json({ 
      success: true, 
      explanation,
      questionId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI解析生成] 生成失败:', error);
    res.status(500).json({ 
      error: error.message || '解析生成失败,请稍后重试'
    });
  }
});

/**
 * POST /api/ai/test-connection
 * 测试 AI 连接
 */
router.post('/test-connection', adminAuth, async (req, res) => {
  try {
    const { apiKey, apiUrl, model } = req.body;
    
    if (!apiKey || !apiUrl || !model) {
      return res.status(400).json({ error: '请提供完整的配置信息' });
    }

    // 测试连接
    const result = await aiService.testConnection(apiKey, apiUrl, model);

    res.json({ 
      success: true, 
      message: '连接成功',
      model: result.model
    });
  } catch (error) {
    console.error('[AI测试] 测试失败:', error);
    res.status(400).json({ 
      error: error.message || '连接测试失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/ai/cache
 * 清理 AI 缓存（管理员）
 */
router.delete('/cache', adminAuth, async (req, res) => {
  try {
    const count = await aiService.cleanExpiredCache();
    
    res.json({ 
      success: true, 
      message: `AI缓存清理完成,已清理 ${count} 条记录`,
      cleanedCount: count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI缓存] 清理失败:', error);
    res.status(500).json({ 
      error: error.message || '缓存清理失败'
    });
  }
});

/**
 * POST /api/ai/reload-config
 * 重新加载配置（配置更新后调用）
 */
router.post('/reload-config', adminAuth, async (req, res) => {
  try {
    await aiService.reloadConfig();
    
    res.json({ 
      success: true, 
      message: '配置重新加载成功',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI配置] 重新加载失败:', error);
    res.status(500).json({ 
      error: error.message || '配置重新加载失败'
    });
  }
});

/**
 * POST /api/ai/history
 * 保存 AI 分析历史
 */
router.post('/history', adminAuth, async (req, res) => {
  try {
    const { question, result, filters } = req.body;
    const userId = req.admin.id;
    
    // 输入验证
    if (!question || !result) {
      return res.status(400).json({ error: '问题和结果不能为空' });
    }
    
    // 保存历史
    await db.run(
      `INSERT INTO ai_analysis_history (user_id, question, result, filters, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, question, result, JSON.stringify(filters || {})]
    );
    
    res.json({ success: true, message: '历史保存成功' });
  } catch (error) {
    console.error('[AI历史] 保存失败:', error);
    res.status(500).json({ error: '保存历史失败' });
  }
});

/**
 * GET /api/ai/history
 * 获取 AI 分析历史列表（分页）
 */
router.get('/history', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // 最大100
    const userId = req.admin.id;
    const offset = (page - 1) * limit;
    
    // 查询总数
    const countResult = await db.get(
      'SELECT COUNT(*) as total FROM ai_analysis_history WHERE user_id = ?',
      [userId]
    );
    
    // 查询列表（MySQL 不支持 LIMIT/OFFSET 使用占位符，直接拼接）
    const list = await db.all(
      `SELECT id, question, result, filters, created_at
       FROM ai_analysis_history
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      [userId]
    );
    
    res.json({
      list,
      total: countResult?.total || 0,
      page,
      limit
    });
  } catch (error) {
    console.error('[AI历史] 查询失败:', error);
    res.status(500).json({ error: '查询历史失败' });
  }
});

/**
 * DELETE /api/ai/history/:id
 * 删除单条历史记录
 */
router.delete('/history/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.admin.id;
    
    const result = await db.run(
      'DELETE FROM ai_analysis_history WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }
    
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('[AI历史] 删除失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

/**
 * DELETE /api/ai/history
 * 清空所有历史记录
 */
router.delete('/history', adminAuth, async (req, res) => {
  try {
    const userId = req.admin.id;
    
    await db.run('DELETE FROM ai_analysis_history WHERE user_id = ?', [userId]);
    
    res.json({ success: true, message: '清空成功' });
  } catch (error) {
    console.error('[AI历史] 清空失败:', error);
    res.status(500).json({ error: '清空失败' });
  }
});

/**
 * POST /api/ai/batch
 * 创建批量分析任务
 */
router.post('/batch', adminAuth, async (req, res) => {
  try {
    const { questionIds, title, analysisType = 'deep' } = req.body;
    const userId = req.admin.id;
    
    // 输入验证
    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: '请选择要分析的题目' });
    }
    
    if (questionIds.length > 50) {
      return res.status(400).json({ error: '单次最多分析50道题目' });
    }
    
    // 创建批量分析记录
    const result = await db.run(
      `INSERT INTO ai_batch_analysis (user_id, title, question_ids, status, created_at)
       VALUES (?, ?, ?, 'pending', NOW())`,
      [userId, title || '批量题目分析', JSON.stringify(questionIds)]
    );
    
    // 异步处理批量分析（后台任务）
    processBatchAnalysis(result.insertId, questionIds, analysisType);
    
    res.json({ 
      success: true, 
      batchId: result.insertId,
      message: '批量分析任务已创建，正在处理中...'
    });
  } catch (error) {
    console.error('[AI批量分析] 创建失败:', error);
    res.status(500).json({ error: '创建批量分析失败' });
  }
});

/**
 * 处理批量分析任务
 * @param {number} batchId - 批次ID
 * @param {array} questionIds - 题目ID列表
 * @param {string} analysisType - 分析类型: 'deep'(深度分析含答题数据) 或 'simple'(简单解析)
 */
async function processBatchAnalysis(batchId, questionIds, analysisType = 'deep') {
  try {
    // 更新状态为处理中
    await db.run(
      'UPDATE ai_batch_analysis SET status = ? WHERE id = ?',
      ['processing', batchId]
    );
    
    const results = [];
    let summaryStats = {
      totalQuestions: questionIds.length,
      totalAttempts: 0,
      totalCorrect: 0,
      avgAccuracy: 0
    };
    
    // 收集所有题目的统计数据
    const questionsWithStats = [];
    
    for (const questionId of questionIds) {
      try {
        // 获取题目基本信息
        const question = await db.get(`
          SELECT 
            q.id, q.content, q.type, q.options, q.correct_answer, q.difficulty,
            s.name as subject,
            sub.name as subcategory
          FROM questions q
          LEFT JOIN subjects s ON q.subject_id = s.id
          LEFT JOIN subcategories sub ON q.subcategory_id = sub.id
          WHERE q.id = ?
        `, [questionId]);
        
        if (!question) continue;
        
        // 解析选项
        let options = [];
        try {
          options = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
        } catch (e) {}
        
        // 获取答题统计
        const attemptStats = await db.get(`
          SELECT 
            COUNT(*) as attempts,
            SUM(is_correct) as correctCount,
            CASE WHEN COUNT(*) > 0 
              THEN (SUM(is_correct) * 100.0) / COUNT(*) 
              ELSE 0 END as accuracy
          FROM question_attempts
          WHERE question_id = ?
        `, [questionId]);
        
        // 获取各选项选择分布
        const optionDistribution = await db.query(`
          SELECT 
            user_answer as selected_option,
            COUNT(*) as count
          FROM question_attempts
          WHERE question_id = ?
          GROUP BY user_answer
          ORDER BY count DESC
        `, [questionId]);
        
        // 获取错题收藏数
        const errorStats = await db.get(`
          SELECT COUNT(DISTINCT user_id) as errorUserCount
          FROM error_collection
          WHERE question_id = ?
        `, [questionId]);
        
        // 难度标签
        const difficultyLabels = { 1: '简单', 2: '中等', 3: '困难' };
        const typeLabels = { single: '单选题', multiple: '多选题', true_false: '判断题' };
        
        // 提取内容预览
        const contentPreview = question.content 
          ? question.content.replace(/<[^>]+>/g, '').substring(0, 60) + '...' 
          : `题目${questionId}`;
        
        const questionStats = {
          questionId: question.id,
          content: question.content,
          contentPreview,
          subject: question.subject,
          subcategory: question.subcategory,
          type: question.type,
          typeLabel: typeLabels[question.type] || '其他',
          difficulty: question.difficulty,
          difficultyLabel: difficultyLabels[question.difficulty] || '未知',
          options,
          correctAnswer: question.correct_answer,
          attempts: attemptStats?.attempts || 0,
          correctCount: attemptStats?.correctCount || 0,
          wrongCount: (attemptStats?.attempts || 0) - (attemptStats?.correctCount || 0),
          accuracy: attemptStats?.accuracy || 0,
          optionDistribution: optionDistribution.reduce((acc, item) => {
            acc[item.selected_option] = item.count;
            return acc;
          }, {}),
          errorUserCount: errorStats?.errorUserCount || 0,
          // 高频错误选项（非正确答案中选择最多的）
          errorOptions: optionDistribution
            .filter(o => o.selected_option && o.selected_option !== question.correct_answer)
            .slice(0, 2)
            .map(o => o.selected_option)
        };
        
        questionsWithStats.push(questionStats);
        
        // 更新汇总统计
        summaryStats.totalAttempts += questionStats.attempts;
        summaryStats.totalCorrect += questionStats.correctCount;
        
      } catch (error) {
        console.error(`[AI批量分析] 题目 ${questionId} 数据获取失败:`, error);
      }
    }
    
    // 计算平均正确率
    if (summaryStats.totalAttempts > 0) {
      summaryStats.avgAccuracy = (summaryStats.totalCorrect * 100.0) / summaryStats.totalAttempts;
    }
    
    // 根据分析类型选择分析方法
    if (analysisType === 'deep' && questionsWithStats.length > 1) {
      // 深度分析：整体分析所有题目
      try {
        const analysis = await aiService.analyzeQuestionsWithStats(questionsWithStats, summaryStats);
        
        results.push({
          questionId: 'summary',
          questionTitle: '📊 批量分析报告',
          analysis,
          isSummary: true,
          summaryStats
        });
      } catch (error) {
        console.error('[AI批量分析] 整体分析失败:', error);
      }
      
      // 同时为每个题目生成简短分析
      for (const qStats of questionsWithStats) {
        try {
          const analysis = await aiService.analyzeSingleQuestionWithStats(qStats);
          
          results.push({
            questionId: qStats.questionId,
            questionTitle: qStats.contentPreview,
            subject: qStats.subject,
            options: qStats.options,
            correctAnswer: qStats.correctAnswer,
            accuracy: qStats.accuracy,
            attempts: qStats.attempts,
            analysis
          });
          
          // 延迟，避免 API 调用过快
          await new Promise(resolve => setTimeout(resolve, 800));
        } catch (error) {
          console.error(`[AI批量分析] 题目 ${qStats.questionId} 分析失败:`, error);
          results.push({
            questionId: qStats.questionId,
            questionTitle: qStats.contentPreview,
            error: '分析失败'
          });
        }
      }
    } else {
      // 简单解析：逐个生成题目解析
      for (const qStats of questionsWithStats) {
        try {
          const analysis = await aiService.generateQuestionExplanation({
            content: qStats.content,
            type: qStats.type,
            options: qStats.options,
            correctAnswer: qStats.correctAnswer
          });
          
          results.push({
            questionId: qStats.questionId,
            questionTitle: qStats.contentPreview,
            subject: qStats.subject,
            options: qStats.options,
            correctAnswer: qStats.correctAnswer,
            accuracy: qStats.accuracy,
            attempts: qStats.attempts,
            analysis
          });
          
          // 延迟
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`[AI批量分析] 题目 ${qStats.questionId} 解析失败:`, error);
          results.push({
            questionId: qStats.questionId,
            questionTitle: qStats.contentPreview,
            error: '解析失败'
          });
        }
      }
    }
    
    // 更新批量分析结果
    await db.run(
      `UPDATE ai_batch_analysis 
       SET status = 'completed', results = ?, completed_at = NOW()
       WHERE id = ?`,
      [JSON.stringify(results), batchId]
    );
    
  } catch (error) {
    console.error('[AI批量分析] 处理失败:', error);
    
    // 更新状态为失败
    await db.run(
      'UPDATE ai_batch_analysis SET status = ? WHERE id = ?',
      ['failed', batchId]
    );
  }
}

/**
 * GET /api/ai/batch/:id
 * 查询批量分析状态和结果
 */
router.get('/batch/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.admin.id;
    
    const batch = await db.get(
      'SELECT * FROM ai_batch_analysis WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (!batch) {
      return res.status(404).json({ error: '批次不存在' });
    }
    
    // 解析 JSON 字段（mysql2 可能已自动解析）
    if (typeof batch.question_ids === 'string') {
      batch.question_ids = JSON.parse(batch.question_ids || '[]');
    }
    if (typeof batch.results === 'string') {
      batch.results = JSON.parse(batch.results || '[]');
    }
    
    res.json(batch);
  } catch (error) {
    console.error('[AI批量分析] 查询失败:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

/**
 * GET /api/ai/batch
 * 获取批量分析列表
 */
router.get('/batch', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.admin.id;
    const offset = (page - 1) * limit;
    
    const countResult = await db.get(
      'SELECT COUNT(*) as total FROM ai_batch_analysis WHERE user_id = ?',
      [userId]
    );
    
    const list = await db.query(
      `SELECT id, title, status, created_at, completed_at
       FROM ai_batch_analysis
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), offset]
    );
    
    res.json({
      list,
      total: countResult.total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('[AI批量分析] 列表查询失败:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

/**
 * POST /api/ai/error-analysis-user
 * 用户错题深度分析（支持图片答案）
 */
router.post('/error-analysis-user', adminAuth, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: '请提供学生ID' });
    }
    
    // 查询用户的错题收藏
    const errorQuestions = await db.query(`
      SELECT 
        q.id,
        q.content,
        q.type,
        q.options,
        q.correct_answer as correctAnswer,
        q.explanation,
        s.name as subject,
        sub.name as subcategory,
        ec.created_at as errorTime
      FROM error_collection ec
      INNER JOIN questions q ON ec.question_id = q.id
      INNER JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN subcategories sub ON q.subcategory_id = sub.id
      WHERE ec.user_id = ?
      ORDER BY ec.created_at DESC
      LIMIT 30
    `, [userId]);
    
    if (errorQuestions.length === 0) {
      return res.json({
        success: true,
        analysis: '该学生暂无错题收藏记录。',
        errorCount: 0
      });
    }
    
    // 解析选项JSON
    errorQuestions.forEach(q => {
      try {
        q.options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
      } catch (e) {
        q.options = [];
      }
    });
    
    // 调用AI分析（支持图片）
    const analysis = await aiService.analyzeErrorQuestions(userId, errorQuestions);
    
    res.json({
      success: true,
      analysis,
      errorCount: errorQuestions.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[AI错题分析] 分析失败:', error);
    res.status(500).json({ error: error.message || '错题分析失败' });
  }
});

/**
 * POST /api/ai/question-quality
 * 题目质量评估（支持图片答案）
 */
router.post('/question-quality', adminAuth, async (req, res) => {
  try {
    const { questionId, includeStats = true } = req.body;
    
    if (!questionId) {
      return res.status(400).json({ error: '请提供题目ID' });
    }
    
    // 查询题目详情
    const question = await db.get(`
      SELECT 
        q.*,
        s.name as subject,
        sub.name as subcategory
      FROM questions q
      LEFT JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN subcategories sub ON q.subcategory_id = sub.id
      WHERE q.id = ?
    `, [questionId]);
    
    if (!question) {
      return res.status(404).json({ error: '题目不存在' });
    }
    
    // 解析选项
    try {
      question.options = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
    } catch (e) {
      question.options = [];
    }
    
    let answerStats = null;
    
    // 查询答题统计
    if (includeStats) {
      answerStats = await db.get(`
        SELECT 
          COUNT(*) as totalAttempts,
          SUM(is_correct) as correctCount,
          CASE WHEN COUNT(*) > 0 
            THEN (SUM(is_correct) * 100.0) / COUNT(*) 
            ELSE 0 END as accuracy
        FROM question_attempts
        WHERE question_id = ?
      `, [questionId]);
      
      // 选项分布
      const optionDist = await db.query(`
        SELECT 
          selected_answer as option,
          COUNT(*) as count
        FROM question_attempts
        WHERE question_id = ?
        GROUP BY selected_answer
        ORDER BY count DESC
      `, [questionId]);
      
      if (answerStats) {
        answerStats.optionDistribution = optionDist;
      }
    }
    
    // 调用AI评估（支持图片）
    const evaluation = await aiService.evaluateQuestionQuality(question, answerStats);
    
    res.json({
      success: true,
      evaluation,
      questionId,
      hasImages: question.options.some(opt => 
        opt && (opt.includes('<img') || opt.includes('!['))
      ),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[AI题目评估] 评估失败:', error);
    res.status(500).json({ error: error.message || '题目评估失败' });
  }
});

module.exports = router;
