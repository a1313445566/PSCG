/**
 * AI 任务队列服务
 * 实现异步任务处理、并发控制、优先级调度
 */

const db = require('./database');
const aiService = require('./aiService');
const monitor = require('../utils/aiPerformanceMonitor');

class AIQueueService {
  constructor() {
    this.isProcessing = false;
    this.maxConcurrent = 5;
    this.pollInterval = 2000;
    this.currentTasks = 0;
    this.timer = null;
  }

  /**
   * 启动任务处理器
   */
  async startProcessor() {
    if (this.timer) return;
    
    // 等待数据库连接就绪
    let retries = 0;
    const maxRetries = 30; // 最多等待30秒
    while (!db.pool && retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries++;
    }
    
    if (!db.pool) {
      console.error('[AI队列] 数据库连接超时，任务处理器未启动');
      return;
    }
    
    console.log('[AI队列] 任务处理器启动');
    this.timer = setInterval(() => {
      this.processQueue();
    }, this.pollInterval);
    
    // 延迟执行第一次处理（等待数据库完全就绪）
    setTimeout(() => this.processQueue(), 2000);
  }

  /**
   * 停止任务处理器
   */
  stopProcessor() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[AI队列] 任务处理器停止');
    }
  }

  /**
   * 添加任务到队列
   */
  async addTask(taskType, targetId, priority = 5, data = null) {
    try {
      const result = await db.run(
        `INSERT INTO ai_analysis_queue 
         (task_type, target_id, priority, status, created_at)
         VALUES (?, ?, ?, 'pending', NOW())`,
        [taskType, targetId, priority]
      );
      
      console.log(`[AI队列] 添加任务: ${taskType}, ID: ${targetId}, 优先级: ${priority}`);
      
      return result.insertId;
    } catch (error) {
      console.error('[AI队列] 添加任务失败:', error);
      throw error;
    }
  }

  /**
   * 批量添加任务
   */
  async addBatchTasks(tasks) {
    try {
      const values = tasks.map(t => [
        t.taskType,
        t.targetId,
        t.priority || 5,
        'pending'
      ]);
      
      await db.query(
        `INSERT INTO ai_analysis_queue 
         (task_type, target_id, priority, status, created_at)
         VALUES ?`,
        [values]
      );
      
      console.log(`[AI队列] 批量添加 ${tasks.length} 个任务`);
    } catch (error) {
      console.error('[AI队列] 批量添加任务失败:', error);
      throw error;
    }
  }

  /**
   * 处理队列
   */
  async processQueue() {
    if (this.isProcessing) return;
    
    // 检查并发限制
    if (this.currentTasks >= this.maxConcurrent) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      // 获取待处理任务（按优先级和创建时间排序）
      const task = await db.get(
        `SELECT * FROM ai_analysis_queue 
         WHERE status = 'pending' 
         ORDER BY priority ASC, created_at ASC 
         LIMIT 1`
      );
      
      if (task) {
        this.currentTasks++;
        
        // 异步执行任务
        this.executeTask(task).finally(() => {
          this.currentTasks--;
        });
      }
    } catch (error) {
      console.error('[AI队列] 处理队列失败:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 执行任务
   */
  async executeTask(task) {
    console.log(`[AI队列] 开始执行任务: ${task.id}, 类型: ${task.task_type}`);
    
    monitor.startTask(task.id);
    
    try {
      // 更新任务状态为处理中
      await db.run(
        `UPDATE ai_analysis_queue 
         SET status = 'processing', started_at = NOW() 
         WHERE id = ?`,
        [task.id]
      );
      
      // 根据任务类型执行不同操作
      let result;
      switch (task.task_type) {
        case 'question_semantic':
          result = await this.processQuestionSemantic(task.target_id);
          break;
        case 'user_learning_style':
          result = await this.processUserLearningStyle(task.target_id);
          break;
        case 'error_analysis':
          result = await this.processErrorAnalysis(task.target_id);
          break;
        default:
          throw new Error(`未知任务类型: ${task.task_type}`);
      }
      
      // 更新任务状态为完成
      await db.run(
        `UPDATE ai_analysis_queue 
         SET status = 'completed', completed_at = NOW(), result = ? 
         WHERE id = ?`,
        [JSON.stringify(result), task.id]
      );
      
      monitor.endTask(task.id, true);
      console.log(`[AI队列] 任务完成: ${task.id}`);
      
    } catch (error) {
      console.error(`[AI队列] 任务失败: ${task.id}`, error);
      
      // 更新任务状态为失败
      const retryCount = task.retry_count + 1;
      const maxRetries = task.max_retries;
      
      if (retryCount < maxRetries) {
        // 重试
        await db.run(
          `UPDATE ai_analysis_queue 
           SET status = 'pending', retry_count = ?, error_message = ? 
           WHERE id = ?`,
          [retryCount, error.message, task.id]
        );
        
        monitor.recordRetry(task.id);
        console.log(`[AI队列] 任务将重试: ${task.id}, 次数: ${retryCount}/${maxRetries}`);
      } else {
        // 标记为失败
        await db.run(
          `UPDATE ai_analysis_queue 
           SET status = 'failed', error_message = ? 
           WHERE id = ?`,
          [error.message, task.id]
        );
        
        monitor.endTask(task.id, false);
        console.log(`[AI队列] 任务最终失败: ${task.id}`);
      }
    }
  }

  /**
   * 处理题目语义分析
   */
  async processQuestionSemantic(questionId) {
    // 获取题目信息
    const question = await db.get(
      `SELECT q.*, s.name as subject_name, sub.name as subcategory_name
       FROM questions q
       LEFT JOIN subjects s ON q.subject_id = s.id
       LEFT JOIN subcategories sub ON q.subcategory_id = sub.id
       WHERE q.id = ?`,
      [questionId]
    );
    
    if (!question) {
      throw new Error('题目不存在');
    }
    
    // 调用 AI 分析
    const analysis = await aiService.analyzeQuestionSemantic({
      id: question.id,
      content: question.content,
      type: question.type,
      difficulty: question.difficulty,
      subject: question.subject_name,
      subcategory: question.subcategory_name
    });
    
    // 保存分析结果
    await db.run(
      `INSERT INTO question_semantic_analysis 
       (question_id, keywords, auto_tags, knowledge_points, difficulty_factors, 
        content_quality_score, ai_analysis, last_analyzed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
       ON DUPLICATE KEY UPDATE
        keywords = VALUES(keywords),
        auto_tags = VALUES(auto_tags),
        knowledge_points = VALUES(knowledge_points),
        difficulty_factors = VALUES(difficulty_factors),
        content_quality_score = VALUES(content_quality_score),
        ai_analysis = VALUES(ai_analysis),
        last_analyzed_at = NOW(),
        updated_at = NOW()`,
      [
        questionId,
        JSON.stringify(analysis.keywords || []),
        JSON.stringify(analysis.autoTags || []),
        JSON.stringify(analysis.knowledgePoints || []),
        JSON.stringify(analysis.difficultyFactors || {}),
        analysis.contentQualityScore || 0,
        analysis.aiAnalysis || ''
      ]
    );
    
    return analysis;
  }

  /**
   * 处理用户学习风格分析
   */
  async processUserLearningStyle(userId) {
    // 获取用户答题行为数据
    const behaviorData = await db.query(
      `SELECT 
        ab.answer_time,
        ab.answer_modifications,
        ab.is_first_answer_correct,
        ab.hesitation_time,
        ab.skipped_and_returned,
        q.difficulty,
        q.type,
        s.name as subject,
        ab.created_at
       FROM answer_behavior ab
       LEFT JOIN questions q ON ab.question_id = q.id
       LEFT JOIN subjects s ON q.subject_id = s.id
       WHERE ab.user_id = ?
       ORDER BY ab.created_at DESC
       LIMIT 100`,
      [userId]
    );
    
    if (behaviorData.length < 10) {
      throw new Error('答题数据不足，至少需要 10 次答题记录');
    }
    
    // 计算统计数据
    const avgAnswerTime = behaviorData.reduce((sum, b) => sum + b.answer_time, 0) / behaviorData.length;
    const answerTimeStability = this.calculateStdDev(behaviorData.map(b => b.answer_time));
    const avgModifications = behaviorData.reduce((sum, b) => sum + b.answer_modifications, 0) / behaviorData.length;
    const skipRate = behaviorData.filter(b => b.skipped_and_returned).length / behaviorData.length;
    
    // 分析错误模式
    const errorPatterns = await db.query(
      `SELECT error_type, COUNT(*) as count
       FROM error_patterns
       WHERE user_id = ?
       GROUP BY error_type`,
      [userId]
    );
    
    const errorPatternsObj = {};
    errorPatterns.forEach(ep => {
      errorPatternsObj[ep.error_type] = ep.count;
    });
    
    // 调用 AI 分析学习风格
    const styleAnalysis = await aiService.analyzeUserLearningStyle({
      userId,
      behaviorData: {
        avgAnswerTime,
        answerTimeStability,
        avgModifications,
        skipRate,
        errorPatterns: errorPatternsObj,
        sampleSize: behaviorData.length
      }
    });
    
    // 保存分析结果
    await db.run(
      `INSERT INTO user_learning_style 
       (user_id, avg_answer_time, answer_time_stability, avg_modifications, skip_rate, 
        error_patterns, learning_style_tags, ai_suggestion, total_analyzed_sessions, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
        avg_answer_time = VALUES(avg_answer_time),
        answer_time_stability = VALUES(answer_time_stability),
        avg_modifications = VALUES(avg_modifications),
        skip_rate = VALUES(skip_rate),
        error_patterns = VALUES(error_patterns),
        learning_style_tags = VALUES(learning_style_tags),
        ai_suggestion = VALUES(ai_suggestion),
        total_analyzed_sessions = VALUES(total_analyzed_sessions),
        updated_at = NOW()`,
      [
        userId,
        avgAnswerTime,
        answerTimeStability,
        avgModifications,
        skipRate,
        JSON.stringify(errorPatternsObj),
        JSON.stringify(styleAnalysis.learningStyleTags || []),
        styleAnalysis.aiSuggestion || '',
        behaviorData.length
      ]
    );
    
    return styleAnalysis;
  }

  /**
   * 处理错题分析
   */
  async processErrorAnalysis(errorId) {
    // 获取错题信息
    const errorData = await db.get(
      `SELECT ep.*, q.content, q.options, q.correct_answer, q.type, q.difficulty
       FROM error_patterns ep
       LEFT JOIN questions q ON ep.question_id = q.id
       WHERE ep.id = ?`,
      [errorId]
    );
    
    if (!errorData) {
      throw new Error('错题记录不存在');
    }
    
    // 调用 AI 分析
    const analysis = await aiService.analyzeErrorReason({
      questionId: errorData.question_id,
      userAnswer: errorData.user_answer,
      correctAnswer: errorData.correct_answer,
      questionContent: errorData.content,
      questionType: errorData.type,
      difficulty: errorData.difficulty
    });
    
    // 更新错题分析结果
    await db.run(
      `UPDATE error_patterns 
       SET error_reason = ?, improvement_suggestion = ?, related_knowledge_points = ?
       WHERE id = ?`,
      [
        analysis.errorReason,
        analysis.improvementSuggestion,
        JSON.stringify(analysis.relatedKnowledgePoints || []),
        errorId
      ]
    );
    
    return analysis;
  }

  /**
   * 计算标准差
   */
  calculateStdDev(values) {
    if (values.length === 0) return 0;
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, v) => sum + v, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * 获取队列状态
   */
  async getQueueStatus() {
    try {
      const stats = await db.get(
        `SELECT 
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
         FROM ai_analysis_queue`
      );
      
      return {
        ...stats,
        currentTasks: this.currentTasks,
        maxConcurrent: this.maxConcurrent
      };
    } catch (error) {
      console.error('[AI队列] 获取状态失败:', error);
      throw error;
    }
  }

  /**
   * 清理已完成的任务
   */
  async cleanupCompletedTasks(daysToKeep = 7) {
    try {
      const result = await db.run(
        `DELETE FROM ai_analysis_queue 
         WHERE status IN ('completed', 'failed') 
         AND completed_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [daysToKeep]
      );
      
      console.log(`[AI队列] 清理了 ${result.affectedRows} 个已完成任务`);
      return result.affectedRows;
    } catch (error) {
      console.error('[AI队列] 清理任务失败:', error);
      throw error;
    }
  }
}

// 导出单例
const queueService = new AIQueueService();

// 延迟启动任务处理器（等待数据库连接）
setTimeout(() => {
  queueService.startProcessor();
}, 3000);

module.exports = queueService;
