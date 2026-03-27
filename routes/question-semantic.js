/**
 * 题目语义分析 API
 */

const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const { 
  validateQuestionId, 
  validateQuestionIds, 
  validatePriority 
} = require('../middleware/aiInputValidation');
const db = require('../services/database');
const aiService = require('../services/aiService');
const queueService = require('../services/aiQueueService');

/**
 * POST /api/question-semantic/analyze
 * AI 分析单个题目
 */
router.post('/analyze', adminAuth, validateQuestionId, async (req, res) => {
  try {
    const { questionId } = req.body;
    
    if (!questionId) {
      return res.status(400).json({ error: '请提供题目ID' });
    }
    
    // 检查题目是否存在
    const question = await db.get('SELECT id FROM questions WHERE id = ?', [questionId]);
    if (!question) {
      return res.status(404).json({ error: '题目不存在' });
    }
    
    // 检查是否已有分析结果
    const existingAnalysis = await db.get(
      'SELECT * FROM question_semantic_analysis WHERE question_id = ?',
      [questionId]
    );
    
    // 如果存在且未过期（1小时内），直接返回
    if (existingAnalysis) {
      const analyzedAt = new Date(existingAnalysis.last_analyzed_at);
      const now = new Date();
      const hoursSinceAnalysis = (now - analyzedAt) / (1000 * 60 * 60);
      
      if (hoursSinceAnalysis < 1) {
        return res.json({
          success: true,
          analysis: existingAnalysis,
          cached: true
        });
      }
    }
    
    // 添加到任务队列
    const taskId = await queueService.addTask('question_semantic', questionId, 5);
    
    res.json({
      success: true,
      message: '分析任务已添加到队列',
      taskId,
      queuePosition: await getQueuePosition(taskId)
    });
    
  } catch (error) {
    console.error('[题目语义分析] 失败:', error);
    res.status(500).json({ error: '题目语义分析失败，请稍后重试' });
  }
});

/**
 * POST /api/question-semantic/batch-analyze
 * 批量分析题目
 */
router.post('/batch-analyze', adminAuth, validateQuestionIds, validatePriority, async (req, res) => {
  try {
    const { questionIds, priority = 5 } = req.body;
    
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: '请提供题目ID列表' });
    }
    
    // 批量添加任务
    const tasks = questionIds.map(id => ({
      taskType: 'question_semantic',
      targetId: id,
      priority
    }));
    
    await queueService.addBatchTasks(tasks);
    
    res.json({
      success: true,
      message: `已添加 ${questionIds.length} 个分析任务到队列`,
      totalTasks: questionIds.length
    });
    
  } catch (error) {
    console.error('[批量分析] 失败:', error);
    res.status(500).json({ error: '批量分析失败，请稍后重试' });
  }
});

/**
 * GET /api/question-semantic/batch-status
 * 查询批量分析状态
 */
router.get('/batch-status', adminAuth, async (req, res) => {
  try {
    const status = await queueService.getQueueStatus();
    
    res.json({
      success: true,
      status
    });
    
  } catch (error) {
    console.error('[查询状态] 失败:', error);
    res.status(500).json({ error: '查询状态失败，请稍后重试' });
  }
});

/**
 * GET /api/question-semantic/similar/:questionId
 * 查找相似题目
 */
router.get('/similar/:questionId', adminAuth, async (req, res) => {
  try {
    const { questionId } = req.params;
    const { limit = 5 } = req.query;
    
    // 获取题目的语义分析结果
    let analysis = await db.get(
      'SELECT * FROM question_semantic_analysis WHERE question_id = ?',
      [questionId]
    );
    
    // 如果没有分析结果，先进行分析
    if (!analysis) {
      const taskId = await queueService.addTask('question_semantic', questionId, 5);
      return res.json({
        success: false,
        message: '题目尚未分析，已添加分析任务到队列',
        taskId
      });
    }
    
    // 尝试从缓存获取相似题目
    const cacheKey = `similar_questions_${questionId}`;
    const cachedResult = await aiService.getFromCache(aiService.generateQueryHash(cacheKey, {}));
    
    if (cachedResult) {
      return res.json({
        success: true,
        similarQuestions: JSON.parse(cachedResult),
        cached: true
      });
    }
    
    // 调用 AI 查找相似题目
    const similarResult = await aiService.findSimilarQuestions(
      questionId,
      {
        keywords: JSON.parse(analysis.keywords || '[]'),
        autoTags: JSON.parse(analysis.auto_tags || '[]'),
        knowledgePoints: JSON.parse(analysis.knowledge_points || '[]')
      },
      parseInt(limit)
    );
    
    // 如果有推荐的题目ID，查询详细信息
    let similarQuestions = [];
    if (similarResult.similarQuestionIds && similarResult.similarQuestionIds.length > 0) {
      const placeholders = similarResult.similarQuestionIds.map(() => '?').join(',');
      similarQuestions = await db.query(
        `SELECT 
          q.id, q.content, q.type, q.difficulty,
          s.name as subject,
          sub.name as subcategory
         FROM questions q
         LEFT JOIN subjects s ON q.subject_id = s.id
         LEFT JOIN subcategories sub ON q.subcategory_id = sub.id
         WHERE q.id IN (${placeholders})
         LIMIT ?`,
        [...similarResult.similarQuestionIds, parseInt(limit)]
      );
    }
    
    // 缓存结果
    await aiService.saveToCache(
      aiService.generateQueryHash(cacheKey, {}),
      cacheKey,
      JSON.stringify(similarQuestions)
    );
    
    res.json({
      success: true,
      similarQuestions,
      reasoning: similarResult.reasoning
    });
    
  } catch (error) {
    console.error('[查找相似题目] 失败:', error);
    res.status(500).json({ error: '查找相似题目失败，请稍后重试' });
  }
});

/**
 * GET /api/question-semantic/tags
 * 获取题目标签统计
 */
router.get('/tags', adminAuth, async (req, res) => {
  try {
    const { category } = req.query;
    
    let whereClause = '';
    const params = [];
    
    if (category) {
      whereClause = 'WHERE tag_category = ?';
      params.push(category);
    }
    
    const tags = await db.query(
      `SELECT 
        t.id, t.tag_name, t.tag_category, t.usage_count,
        COUNT(qtr.question_id) as question_count
       FROM question_tags t
       LEFT JOIN question_tag_relations qtr ON t.id = qtr.tag_id
       ${whereClause}
       GROUP BY t.id
       ORDER BY t.usage_count DESC
       LIMIT 50`,
      params
    );
    
    res.json({
      success: true,
      tags
    });
    
  } catch (error) {
    console.error('[获取标签统计] 失败:', error);
    res.status(500).json({ error: '获取标签统计失败，请稍后重试' });
  }
});

/**
 * GET /api/question-semantic/analysis/:questionId
 * 获取题目分析结果
 */
router.get('/analysis/:questionId', adminAuth, async (req, res) => {
  try {
    const { questionId } = req.params;
    
    const analysis = await db.get(
      'SELECT * FROM question_semantic_analysis WHERE question_id = ?',
      [questionId]
    );
    
    if (!analysis) {
      return res.status(404).json({ error: '题目分析结果不存在' });
    }
    
    res.json({
      success: true,
      analysis
    });
    
  } catch (error) {
    console.error('[获取分析结果] 失败:', error);
    res.status(500).json({ error: '获取分析结果失败，请稍后重试' });
  }
});

/**
 * 辅助函数：获取队列位置
 */
async function getQueuePosition(taskId) {
  try {
    const result = await db.get(
      `SELECT COUNT(*) as position 
       FROM ai_analysis_queue 
       WHERE status = 'pending' 
       AND (priority < (SELECT priority FROM ai_analysis_queue WHERE id = ?)
            OR (priority = (SELECT priority FROM ai_analysis_queue WHERE id = ?) 
                AND created_at < (SELECT created_at FROM ai_analysis_queue WHERE id = ?)))`,
      [taskId, taskId, taskId]
    );
    return result.position + 1;
  } catch (error) {
    return 0;
  }
}

module.exports = router;
