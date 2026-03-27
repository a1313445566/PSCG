# AI 自然语言分析数据增强需求

## 📋 文档说明

- **文档类型**: 需求文档
- **适用对象**: AI 开发助手
- **优先级**: P0（高优先级）
- **预计时间**: 72 小时
- **创建日期**: 2026-03-27
- **版本**: v4.0
- **参考文档**: 
  - `DOCS/AI辅助开发指南.md`
  - `DOCS/技术栈清单.md`
  - `DOCS/环境配置说明.md`

---

## ⚠️ 重要技术约束

### 数据库规范
- ✅ **使用 MySQL 语法**: `AUTO_INCREMENT`, `VARCHAR`, `INT`, `DATETIME`
- ❌ **禁止 SQLite 语法**: `AUTOINCREMENT`, `TEXT`, `INTEGER`

### 前端规范
- ✅ **使用 api 封装**: `api.get/post/put/delete`
- ✅ **使用 message 封装**: `message.success/error`
- ✅ **使用 useLoading**: `withLoading(async () => {...})`
- ✅ **使用 usePagination**: `total` 作为参数传入
- ❌ **禁止原生 fetch**: 必须使用封装的 api
- ❌ **禁止 ElMessage**: 必须使用封装的 message

### 后端规范
- ✅ **使用 adminAuth 中间件**: 所有管理后台 API
- ✅ **使用 db 实例**: `db.get/query/run`
- ✅ **统一错误处理**: 所有异步操作 try-catch
- ❌ **禁止绕过权限验证**

---

## 🔍 项目现状分析

### 当前 AI 分析系统能力

你的 AI 分析系统（豆包）具备以下能力：
- ✅ **自然语言理解**：用户用自然语言提问，AI 自己理解意图
- ✅ **自主查询决策**：AI 自己决定查询什么数据、如何分析
- ✅ **多模态支持**：支持文本 + 图片（题目选项中的图片）
- ✅ **自由输出格式**：AI 自己决定输出格式、是否需要图表

### 当前可访问的数据

通过 `aiService.js` 的 `getDatabaseContext()` 和 `routes/ai.js`，AI 当前可访问：

**结构化数据**：
- 用户信息（姓名、年级、班级）
- 学科、知识点
- 答题记录（次数、正确率、时间）
- 错题收藏（哪些题目被收藏）
- 题目尝试（每个题目的答题情况）

**题目内容数据**：
- `content`：题目文本（HTML）
- `options`：选项（HTML，可能包含图片）
- `correct_answer`：正确答案
- `difficulty`：难度（1-3）
- `explanation`：解析（部分题目有）

**统计数据**：
- 各学科正确率
- 年级/班级排名
- 活跃度统计
- 时间分布
- 高频错题

### 核心问题

❌ **题目语义理解不足**：
- AI 只能看到题目文本，无法理解题目的关键词、考点
- 无法自动推荐相似题目
- 无法分析题目为什么难

❌ **用户行为模式缺失**：
- 无法分析用户的答题习惯（答题时间、修改次数）
- 无法识别用户的学习风格
- 无法发现用户的错误模式

❌ **错题原因不明确**：
- 只知道哪些题做错了，不知道为什么错
- 无法自动分析错误类型（概念错误、计算错误、粗心等）
- 无法提供针对性的改进建议

❌ **学习进度不清晰**：
- 无法量化知识点掌握程度
- 无法跟踪学习目标完成情况
- 无法生成个性化学习建议

---

## 🎯 核心需求

为 AI 自然语言分析系统提供更丰富的**语义数据**和**行为数据**，让 AI 能够：
1. **深度理解题目内容**（语义分析）
2. **识别用户学习模式**（行为分析）
3. **分析错题原因**（错误诊断）
4. **跟踪学习进度**（个性化建议）

---

## 📦 需求详情

### 需求 1: 题目内容语义增强

#### 目标
让 AI 能够理解题目的语义信息，支持智能推荐和深度分析。

#### 数据库设计

```sql
-- 题目语义分析表
CREATE TABLE IF NOT EXISTS question_semantic_analysis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL UNIQUE COMMENT '题目ID',
  
  -- 关键词和标签
  keywords JSON COMMENT '关键词列表，如：["分数", "加减法"]',
  auto_tags JSON COMMENT 'AI自动标签，如：[{"name": "计算题", "category": "题型"}]',
  
  -- 考点和难度因素
  knowledge_points JSON COMMENT '考查知识点，如：["分数运算", "通分"]',
  difficulty_factors JSON COMMENT '难度因素，如：{"计算量": "大", "概念复杂度": "中"}',
  
  -- 相似题目
  similar_questions JSON COMMENT '相似题目ID列表，如：[12, 34, 56]',
  
  -- 质量评估
  content_quality_score FLOAT DEFAULT 0 COMMENT '内容质量评分（0-100）',
  difficulty_accuracy FLOAT DEFAULT 0 COMMENT '难度标注准确性（对比实际正确率）',
  
  -- AI 分析结果
  ai_analysis TEXT COMMENT 'AI分析的题目特征描述',
  
  -- 分析元数据
  analysis_version VARCHAR(20) DEFAULT '1.0' COMMENT '分析版本',
  last_analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '最后分析时间',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_question_id (question_id),
  INDEX idx_quality (content_quality_score),
  INDEX idx_analyzed_at (last_analyzed_at),
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目语义分析';

-- 题目标签表（用于快速筛选）
CREATE TABLE IF NOT EXISTS question_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tag_name VARCHAR(50) NOT NULL UNIQUE COMMENT '标签名称',
  tag_category VARCHAR(50) COMMENT '标签分类：题型/难度/考点/易错点',
  usage_count INT DEFAULT 0 COMMENT '使用次数',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_category (tag_category),
  INDEX idx_usage (usage_count DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目标签';

-- 题目标签关联表
CREATE TABLE IF NOT EXISTS question_tag_relations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  tag_id INT NOT NULL,
  confidence FLOAT DEFAULT 1.0 COMMENT 'AI 置信度（0-1）',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_question_tag (question_id, tag_id),
  INDEX idx_tag (tag_id),
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES question_tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目标签关联';

-- AI 分析任务队列表（用于批量分析）
CREATE TABLE IF NOT EXISTS ai_analysis_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_type VARCHAR(50) NOT NULL COMMENT '任务类型：semantic_analysis/error_analysis',
  target_id INT COMMENT '目标ID（question_id/user_id）',
  priority INT DEFAULT 5 COMMENT '优先级（1-10，数字越小优先级越高）',
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  retry_count INT DEFAULT 0 COMMENT '重试次数',
  max_retries INT DEFAULT 3 COMMENT '最大重试次数',
  error_message TEXT COMMENT '错误信息',
  result TEXT COMMENT '分析结果（JSON）',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME COMMENT '开始处理时间',
  completed_at DATETIME COMMENT '完成时间',
  
  INDEX idx_status_priority (status, priority),
  INDEX idx_task_type (task_type),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI分析任务队列';
```

#### 后端 API 实现

**文件位置**: `routes/question-semantic.js`（新建）

```javascript
const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const db = require('../services/database');
const aiService = require('../services/aiService');
const aiQueueService = require('../services/aiQueueService');

/**
 * POST /api/question-semantic/analyze
 * AI 分析单个题目（提取关键词、标签、难度因素）
 */
router.post('/analyze', adminAuth, async (req, res) => {
  try {
    const { questionId, forceReanalyze = false } = req.body;
    
    if (!questionId) {
      return res.status(400).json({ error: '请提供题目ID' });
    }
    
    // 检查缓存（如果已分析过且未强制重新分析）
    if (!forceReanalyze) {
      const cacheKey = `semantic_${questionId}`;
      const cached = await aiService.getCache(cacheKey);
      
      if (cached) {
        return res.json({ 
          success: true, 
          analysis: cached,
          cached: true,
          cacheHit: true
        });
      }
      
      // 检查数据库中是否已分析
      const existing = await db.get(
        'SELECT * FROM question_semantic_analysis WHERE question_id = ?',
        [questionId]
      );
      
      if (existing) {
        // 缓存结果
        await aiService.setCache(cacheKey, existing, 3600); // 缓存1小时
        return res.json({ 
          success: true, 
          analysis: existing,
          cached: true,
          cacheHit: false
        });
      }
    }
    
    // 获取题目详情
    const question = await db.get(`
      SELECT q.*, s.name as subject_name, sub.name as subcategory_name
      FROM questions q
      LEFT JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN subcategories sub ON q.subcategory_id = sub.id
      WHERE q.id = ?
    `, [questionId]);
    
    if (!question) {
      return res.status(404).json({ error: '题目不存在' });
    }
    
    // 解析选项
    let options = [];
    try {
      options = typeof question.options === 'string' 
        ? JSON.parse(question.options) 
        : question.options;
    } catch (e) {
      console.error('[题目语义分析] 选项解析失败:', e);
    }
    
    // 获取答题统计（如果有）
    const answerStats = await db.get(`
      SELECT 
        COUNT(*) as attempts,
        SUM(is_correct) as correct_count,
        CASE WHEN COUNT(*) > 0 
          THEN (SUM(is_correct) * 100.0) / COUNT(*) 
          ELSE 0 END as accuracy
      FROM question_attempts
      WHERE question_id = ?
    `, [questionId]);
    
    // 调用 AI 分析题目语义（带重试机制）
    const semanticAnalysis = await aiService.callWithRetry(
      () => aiService.analyzeQuestionSemantic({
        content: question.content,
        options: options,
        correctAnswer: question.correct_answer,
        difficulty: question.difficulty,
        subject: question.subject_name,
        subcategory: question.subcategory_name,
        answerStats: answerStats
      }),
      {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2
      }
    );
    
    // 验证并清理 JSON 数据
    const cleanedData = validateAndCleanJSON(semanticAnalysis);
    
    // 保存分析结果
    await db.run(`
      INSERT INTO question_semantic_analysis 
      (question_id, keywords, auto_tags, knowledge_points, difficulty_factors, 
       similar_questions, content_quality_score, difficulty_accuracy, ai_analysis,
       analysis_version, last_analyzed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '1.0', NOW())
      ON DUPLICATE KEY UPDATE
        keywords = VALUES(keywords),
        auto_tags = VALUES(auto_tags),
        knowledge_points = VALUES(knowledge_points),
        difficulty_factors = VALUES(difficulty_factors),
        similar_questions = VALUES(similar_questions),
        content_quality_score = VALUES(content_quality_score),
        difficulty_accuracy = VALUES(difficulty_accuracy),
        ai_analysis = VALUES(ai_analysis),
        analysis_version = '1.0',
        last_analyzed_at = NOW(),
        updated_at = NOW()
    `, [
      questionId,
      JSON.stringify(cleanedData.keywords || []),
      JSON.stringify(cleanedData.autoTags || []),
      JSON.stringify(cleanedData.knowledgePoints || []),
      JSON.stringify(cleanedData.difficultyFactors || {}),
      JSON.stringify(cleanedData.similarQuestions || []),
      cleanedData.contentQualityScore || 0,
      cleanedData.difficultyAccuracy || 0,
      cleanedData.aiAnalysis || ''
    ]);
    
    // 保存标签关联
    if (cleanedData.autoTags && cleanedData.autoTags.length > 0) {
      await saveTagRelations(questionId, cleanedData.autoTags);
    }
    
    // 缓存结果
    const result = {
      question_id: questionId,
      ...cleanedData
    };
    await aiService.setCache(`semantic_${questionId}`, result, 3600);
    
    res.json({
      success: true,
      analysis: result,
      cached: false
    });
    
  } catch (error) {
    console.error('[题目语义分析] 失败:', error);
    res.status(500).json({ 
      error: error.message || '语义分析失败',
      retryable: isRetryableError(error)
    });
  }
});

/**
 * POST /api/question-semantic/batch-analyze
 * 批量分析题目（使用任务队列）
 */
router.post('/batch-analyze', adminAuth, async (req, res) => {
  try {
    const { questionIds, forceReanalyze = false, priority = 5 } = req.body;
    
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: '请提供题目ID列表' });
    }
    
    if (questionIds.length > 100) {
      return res.status(400).json({ error: '单次最多分析100道题目' });
    }
    
    // 将任务添加到队列
    const taskIds = [];
    for (const questionId of questionIds) {
      const taskId = await aiQueueService.addTask({
        taskType: 'semantic_analysis',
        targetId: questionId,
        priority: priority,
        data: { forceReanalyze }
      });
      taskIds.push(taskId);
    }
    
    res.json({
      success: true,
      taskIds: taskIds,
      message: `已创建 ${taskIds.length} 个分析任务`,
      statusCheckUrl: '/api/question-semantic/batch-status'
    });
    
  } catch (error) {
    console.error('[批量语义分析] 创建失败:', error);
    res.status(500).json({ error: '创建批量分析失败' });
  }
});

/**
 * GET /api/question-semantic/batch-status
 * 查询批量分析状态
 */
router.get('/batch-status', adminAuth, async (req, res) => {
  try {
    const { taskIds } = req.query;
    
    if (!taskIds) {
      return res.status(400).json({ error: '请提供任务ID列表' });
    }
    
    const taskIdList = taskIds.split(',').map(id => parseInt(id));
    
    const tasks = await db.query(`
      SELECT id, task_type, target_id, status, error_message, created_at, completed_at
      FROM ai_analysis_queue
      WHERE id IN (${taskIdList.map(() => '?').join(',')})
    `, taskIdList);
    
    const summary = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      processing: tasks.filter(t => t.status === 'processing').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length
    };
    
    res.json({
      success: true,
      summary,
      tasks
    });
    
  } catch (error) {
    console.error('[查询批量状态] 失败:', error);
    res.status(500).json({ error: '查询状态失败' });
  }
});

/**
 * GET /api/question-semantic/similar/:questionId
 * 查找相似题目
 */
router.get('/similar/:questionId', adminAuth, async (req, res) => {
  try {
    const { questionId } = req.params;
    const { limit = 10 } = req.query;
    
    // 尝试从缓存获取
    const cacheKey = `similar_${questionId}_${limit}`;
    const cached = await aiService.getCache(cacheKey);
    
    if (cached) {
      return res.json({
        success: true,
        similarQuestions: cached,
        cached: true
      });
    }
    
    // 获取语义分析结果
    const semantic = await db.get(
      'SELECT similar_questions FROM question_semantic_analysis WHERE question_id = ?',
      [questionId]
    );
    
    if (!semantic || !semantic.similar_questions) {
      return res.json({ 
        success: true, 
        similarQuestions: [],
        message: '该题目尚未进行语义分析' 
      });
    }
    
    const similarIds = JSON.parse(semantic.similar_questions);
    
    if (similarIds.length === 0) {
      return res.json({ 
        success: true, 
        similarQuestions: [] 
      });
    }
    
    // 查询相似题目详情
    const similarQuestions = await db.query(`
      SELECT 
        q.id, q.content, q.type, q.difficulty,
        s.name as subject,
        sub.name as subcategory,
        qa.accuracy
      FROM questions q
      LEFT JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN subcategories sub ON q.subcategory_id = sub.id
      LEFT JOIN (
        SELECT question_id, 
          CASE WHEN COUNT(*) > 0 THEN (SUM(is_correct) * 100.0) / COUNT(*) ELSE 0 END as accuracy
        FROM question_attempts
        GROUP BY question_id
      ) qa ON q.id = qa.question_id
      WHERE q.id IN (${similarIds.map(() => '?').join(',')})
      LIMIT ?
    `, [...similarIds, parseInt(limit)]);
    
    // 缓存结果
    await aiService.setCache(cacheKey, similarQuestions, 1800); // 缓存30分钟
    
    res.json({
      success: true,
      similarQuestions
    });
    
  } catch (error) {
    console.error('[查找相似题目] 失败:', error);
    res.status(500).json({ error: '查找相似题目失败' });
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
    
    const tags = await db.query(`
      SELECT 
        t.id, t.tag_name, t.tag_category, t.usage_count,
        COUNT(qtr.question_id) as question_count
      FROM question_tags t
      LEFT JOIN question_tag_relations qtr ON t.id = qtr.tag_id
      ${whereClause}
      GROUP BY t.id
      ORDER BY t.usage_count DESC
      LIMIT 50
    `, params);
    
    res.json({
      success: true,
      tags
    });
    
  } catch (error) {
    console.error('[获取标签统计] 失败:', error);
    res.status(500).json({ error: '获取标签统计失败' });
  }
});

/**
 * 辅助函数：验证并清理 JSON 数据
 */
function validateAndCleanJSON(data) {
  const MAX_JSON_SIZE = 10000; // 10KB
  
  const cleanField = (field, defaultValue) => {
    if (!field) return defaultValue;
    
    try {
      const jsonString = JSON.stringify(field);
      
      // 检查大小限制
      if (jsonString.length > MAX_JSON_SIZE) {
        console.warn(`[JSON清理] 字段大小超限: ${jsonString.length} bytes`);
        return defaultValue;
      }
      
      return field;
    } catch (e) {
      console.error('[JSON清理] 序列化失败:', e);
      return defaultValue;
    }
  };
  
  return {
    keywords: cleanField(data.keywords, []),
    autoTags: cleanField(data.autoTags, []),
    knowledgePoints: cleanField(data.knowledgePoints, []),
    difficultyFactors: cleanField(data.difficultyFactors, {}),
    similarQuestions: cleanField(data.similarQuestions, []),
    contentQualityScore: data.contentQualityScore || 0,
    difficultyAccuracy: data.difficultyAccuracy || 0,
    aiAnalysis: data.aiAnalysis || ''
  };
}

/**
 * 辅助函数：保存标签关联
 */
async function saveTagRelations(questionId, tags) {
  for (const tag of tags) {
    try {
      // 插入或获取标签
      await db.run(`
        INSERT INTO question_tags (tag_name, tag_category, usage_count)
        VALUES (?, ?, 1)
        ON DUPLICATE KEY UPDATE usage_count = usage_count + 1
      `, [tag.name, tag.category || '其他']);
      
      // 获取标签ID
      const tagRecord = await db.get(
        'SELECT id FROM question_tags WHERE tag_name = ?',
        [tag.name]
      );
      
      // 关联题目和标签
      await db.run(`
        INSERT INTO question_tag_relations (question_id, tag_id, confidence)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE confidence = VALUES(confidence)
      `, [questionId, tagRecord.id, tag.confidence || 1.0]);
      
    } catch (error) {
      console.error('[保存标签关联] 失败:', error);
    }
  }
}

/**
 * 辅助函数：判断是否可重试的错误
 */
function isRetryableError(error) {
  const retryableErrors = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EAI_AGAIN',
    'rate_limit_exceeded',
    'service_unavailable'
  ];
  
  return retryableErrors.some(err => 
    error.message && error.message.includes(err)
  );
}

module.exports = router;
```

#### AI 服务扩展

**文件位置**: `services/aiService.js`（扩展）

在 `aiService.js` 中添加以下方法：

```javascript
/**
 * 带重试机制的 AI 调用
 */
async callWithRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    backoffMultiplier = 2
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;
      
      // 检查是否为可重试错误
      if (!this.isRetryableError(error)) {
        throw error;
      }
      
      // 检查是否为速率限制错误
      if (error.message && error.message.includes('rate_limit')) {
        const waitTime = this.extractRetryAfter(error) || 60000;
        console.warn(`[AI重试] 遇到速率限制，等待 ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        // 指数退避
        const waitTime = retryDelay * Math.pow(backoffMultiplier, attempt);
        console.warn(`[AI重试] 第 ${attempt + 1} 次失败，等待 ${waitTime}ms 后重试`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
}

/**
 * 判断是否可重试错误
 */
isRetryableError(error) {
  const retryablePatterns = [
    /rate_limit/i,
    /timeout/i,
    /network/i,
    /ECONNRESET/,
    /ETIMEDOUT/,
    /service_unavailable/i
  ];
  
  return retryablePatterns.some(pattern => 
    pattern.test(error.message) || pattern.test(error.code)
  );
}

/**
 * 从错误中提取重试等待时间
 */
extractRetryAfter(error) {
  const match = error.message && error.message.match(/retry.?after.?:?\s*(\d+)/i);
  return match ? parseInt(match[1]) * 1000 : null;
}

/**
 * 获取缓存
 */
async getCache(key) {
  try {
    const result = await this.db.get(
      'SELECT cache_data FROM ai_analysis_cache WHERE cache_key = ? AND expires_at > NOW()',
      [key]
    );
    
    if (result && result.cache_data) {
      return JSON.parse(result.cache_data);
    }
    
    return null;
  } catch (error) {
    console.error('[缓存获取] 失败:', error);
    return null;
  }
}

/**
 * 设置缓存
 */
async setCache(key, data, ttl = 3600) {
  try {
    const expiresAt = new Date(Date.now() + ttl * 1000);
    
    await this.db.run(`
      INSERT INTO ai_analysis_cache (cache_key, cache_data, expires_at)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        cache_data = VALUES(cache_data),
        expires_at = VALUES(expires_at)
    `, [key, JSON.stringify(data), expiresAt]);
    
    return true;
  } catch (error) {
    console.error('[缓存设置] 失败:', error);
    return false;
  }
}

/**
 * 分析题目语义（关键词、标签、难度因素）
 */
async analyzeQuestionSemantic(questionData) {
  const prompt = `你是教育专家，请分析以下题目的语义信息：

题目内容：${this.truncateText(questionData.content, 500)}
选项：${JSON.stringify(questionData.options).substring(0, 500)}
正确答案：${questionData.correctAnswer}
标注难度：${questionData.difficulty}
学科：${questionData.subject}
${questionData.subcategory ? `知识点：${questionData.subcategory}` : ''}
${questionData.answerStats ? `答题统计：${JSON.stringify(questionData.answerStats)}` : ''}

请返回 JSON 格式的分析结果：
{
  "keywords": ["关键词1", "关键词2"],
  "autoTags": [
    {"name": "标签名", "category": "题型/难度/考点/易错点", "confidence": 0.95}
  ],
  "knowledgePoints": ["考查知识点1", "考查知识点2"],
  "difficultyFactors": {
    "计算量": "大/中/小",
    "概念复杂度": "高/中/低",
    "陷阱数量": "数字",
    "解题步骤": "数字"
  },
  "contentQualityScore": 85,
  "difficultyAccuracy": 90,
  "aiAnalysis": "题目的简要特征描述，50字以内"
}

注意：
- keywords 提取 3-5 个核心关键词
- autoTags 建议添加题型标签（如：计算题、应用题）、难度标签、易错点标签
- difficultyFactors 分析题目为什么难
- contentQualityScore 评估题目描述是否清晰、选项是否合理（0-100）
- difficultyAccuracy 对比标注难度和实际正确率，评估难度标注是否准确（0-100）`;

  const response = await this.callAI(prompt);
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('[AI语义分析] 解析失败:', e);
  }
  
  return {
    keywords: [],
    autoTags: [],
    knowledgePoints: [],
    difficultyFactors: {},
    aiAnalysis: ''
  };
}

/**
 * 文本截断（避免超出 API 限制）
 */
truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
}
```

---

### 需求 2: AI 任务队列服务

#### 目标
实现高效的 AI 任务处理队列，支持异步处理、优先级调度和错误重试。

#### 实现方案

**文件位置**: `services/aiQueueService.js`（新建）

```javascript
const db = require('./database');
const aiService = require('./aiService');

/**
 * AI 任务队列服务
 */
class AIQueueService {
  constructor() {
    this.isProcessing = false;
    this.concurrentTasks = 0;
    this.maxConcurrent = 5; // 最大并发任务数
    this.pollInterval = 2000; // 轮询间隔（毫秒）
    
    // 启动队列处理器
    this.startProcessor();
  }
  
  /**
   * 添加任务到队列
   */
  async addTask({ taskType, targetId, priority = 5, data = {} }) {
    try {
      const result = await db.run(`
        INSERT INTO ai_analysis_queue 
        (task_type, target_id, priority, status, created_at)
        VALUES (?, ?, ?, 'pending', NOW())
      `, [taskType, targetId, priority]);
      
      return result.insertId;
    } catch (error) {
      console.error('[任务队列] 添加任务失败:', error);
      throw error;
    }
  }
  
  /**
   * 启动队列处理器
   */
  startProcessor() {
    setInterval(() => {
      if (!this.isProcessing && this.concurrentTasks < this.maxConcurrent) {
        this.processNextTask();
      }
    }, this.pollInterval);
  }
  
  /**
   * 处理下一个任务
   */
  async processNextTask() {
    if (this.concurrentTasks >= this.maxConcurrent) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      // 获取优先级最高的待处理任务
      const task = await db.get(`
        SELECT * FROM ai_analysis_queue
        WHERE status = 'pending'
        ORDER BY priority ASC, created_at ASC
        LIMIT 1
        FOR UPDATE
      `);
      
      if (!task) {
        return;
      }
      
      // 标记为处理中
      await db.run(
        'UPDATE ai_analysis_queue SET status = ?, started_at = NOW() WHERE id = ?',
        ['processing', task.id]
      );
      
      this.concurrentTasks++;
      
      // 异步处理任务
      this.processTask(task)
        .then(() => {
          this.concurrentTasks--;
        })
        .catch(error => {
          console.error('[任务处理] 失败:', error);
          this.concurrentTasks--;
        });
      
    } catch (error) {
      console.error('[队列处理] 错误:', error);
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * 处理单个任务
   */
  async processTask(task) {
    try {
      let result;
      
      switch (task.task_type) {
        case 'semantic_analysis':
          result = await this.processSemanticAnalysis(task.target_id);
          break;
        case 'error_analysis':
          result = await this.processErrorAnalysis(task.target_id);
          break;
        default:
          throw new Error(`未知任务类型: ${task.task_type}`);
      }
      
      // 标记为完成
      await db.run(
        'UPDATE ai_analysis_queue SET status = ?, result = ?, completed_at = NOW() WHERE id = ?',
        ['completed', JSON.stringify(result), task.id]
      );
      
    } catch (error) {
      console.error(`[任务处理] 任务 ${task.id} 失败:`, error);
      
      // 检查是否可重试
      if (task.retry_count < task.max_retries) {
        await db.run(
          'UPDATE ai_analysis_queue SET status = ?, retry_count = retry_count + 1, error_message = ? WHERE id = ?',
          ['pending', error.message, task.id]
        );
      } else {
        // 标记为失败
        await db.run(
          'UPDATE ai_analysis_queue SET status = ?, error_message = ? WHERE id = ?',
          ['failed', error.message, task.id]
        );
      }
    }
  }
  
  /**
   * 处理语义分析任务
   */
  async processSemanticAnalysis(questionId) {
    const question = await db.get(
      'SELECT q.*, s.name as subject_name FROM questions q LEFT JOIN subjects s ON q.subject_id = s.id WHERE q.id = ?',
      [questionId]
    );
    
    if (!question) {
      throw new Error('题目不存在');
    }
    
    let options = [];
    try {
      options = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
    } catch (e) {}
    
    const semanticAnalysis = await aiService.analyzeQuestionSemantic({
      content: question.content,
      options: options,
      correctAnswer: question.correct_answer,
      difficulty: question.difficulty,
      subject: question.subject_name
    });
    
    // 保存结果
    await db.run(`
      INSERT INTO question_semantic_analysis 
      (question_id, keywords, auto_tags, knowledge_points, difficulty_factors, similar_questions, ai_analysis)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        keywords = VALUES(keywords),
        auto_tags = VALUES(auto_tags),
        knowledge_points = VALUES(knowledge_points),
        difficulty_factors = VALUES(difficulty_factors),
        similar_questions = VALUES(similar_questions),
        ai_analysis = VALUES(ai_analysis)
    `, [
      questionId,
      JSON.stringify(semanticAnalysis.keywords || []),
      JSON.stringify(semanticAnalysis.autoTags || []),
      JSON.stringify(semanticAnalysis.knowledgePoints || []),
      JSON.stringify(semanticAnalysis.difficultyFactors || {}),
      JSON.stringify(semanticAnalysis.similarQuestions || []),
      semanticAnalysis.aiAnalysis || ''
    ]);
    
    return { success: true, questionId };
  }
  
  /**
   * 处理错误分析任务（预留）
   */
  async processErrorAnalysis(userId) {
    // TODO: 实现错误分析逻辑
    return { success: true, userId };
  }
}

module.exports = new AIQueueService();
```

---

### 需求 3: 用户答题行为分析

#### 目标
记录用户的答题行为细节，让 AI 能够分析用户的学习习惯和错误模式。

#### 数据库设计

```sql
-- 答题行为详情表（已创建，补充说明）
CREATE TABLE IF NOT EXISTS answer_behavior (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  question_id INT NOT NULL COMMENT '题目ID',
  
  -- 答题行为数据
  answer_time INT NOT NULL COMMENT '答题时间（秒）',
  answer_modifications INT DEFAULT 0 COMMENT '答案修改次数',
  is_first_answer_correct TINYINT(1) DEFAULT 0 COMMENT '首次答案是否正确',
  final_answer VARCHAR(50) COMMENT '最终答案',
  is_correct TINYINT(1) COMMENT '最终是否正确',
  
  -- 新增：犹豫行为
  hesitation_time INT DEFAULT 0 COMMENT '犹豫时间（秒）（鼠标悬停在选项上的时间）',
  skipped_and_returned TINYINT(1) DEFAULT 0 COMMENT '是否跳过后返回',
  
  -- 会话信息
  session_id VARCHAR(100) COMMENT '答题会话ID',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '答题时间',
  
  INDEX idx_user_question (user_id, question_id),
  INDEX idx_question_id (question_id),
  INDEX idx_answer_time (answer_time),
  INDEX idx_session (session_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='答题行为详情';

-- 用户学习风格分析表
CREATE TABLE IF NOT EXISTS user_learning_style (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE COMMENT '用户ID',
  
  -- 答题习惯
  avg_answer_time FLOAT DEFAULT 0 COMMENT '平均答题时间（秒）',
  answer_time_stability FLOAT DEFAULT 0 COMMENT '答题时间稳定性（标准差）',
  avg_modifications FLOAT DEFAULT 0 COMMENT '平均修改次数',
  skip_rate FLOAT DEFAULT 0 COMMENT '跳题率',
  
  -- 学习偏好
  preferred_difficulty INT DEFAULT 0 COMMENT '偏好难度（根据正确率分析）',
  preferred_time_slot VARCHAR(20) COMMENT '偏好答题时段（上午/下午/晚上）',
  
  -- 错误模式
  error_patterns JSON COMMENT '错误模式分析，如：{"concept_error": 5, "careless_error": 3}',
  
  -- AI 分析结果
  learning_style_tags JSON COMMENT '学习风格标签，如：["谨慎型", "思考型"]',
  ai_suggestion TEXT COMMENT 'AI 生成的学习建议',
  
  -- 统计数据
  total_analyzed_sessions INT DEFAULT 0 COMMENT '已分析的答题次数',
  
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户学习风格分析';

-- 错误模式详情表
CREATE TABLE IF NOT EXISTS error_patterns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  question_id INT NOT NULL COMMENT '题目ID',
  
  -- 错误信息
  error_type VARCHAR(50) COMMENT '错误类型：concept(概念错误)/calculation(计算错误)/careless(粗心)/understanding(理解错误)',
  error_reason TEXT COMMENT 'AI 分析的错误原因',
  user_answer VARCHAR(50) COMMENT '用户的错误答案',
  correct_answer VARCHAR(50) COMMENT '正确答案',
  
  -- 改进建议
  improvement_suggestion TEXT COMMENT '改进建议',
  related_knowledge_points JSON COMMENT '需要复习的知识点',
  
  -- 反馈
  user_feedback TEXT COMMENT '用户反馈（可选）',
  is_helpful TINYINT(1) COMMENT '建议是否有帮助',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_error_type (user_id, error_type),
  INDEX idx_question (question_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='错误模式详情';
```

#### 前端行为跟踪（优化版）

**文件位置**: `src/components/quiz/AnswerBehaviorTracker.vue`（增强现有组件）

```vue
<template>
  <!-- 答题行为跟踪组件（内嵌到答题页面） -->
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { api } from '@/utils/api'  // ✅ 使用封装的 api
import message from '@/utils/message'  // ✅ 使用封装的 message
import { useLoading } from '@/composables/useLoading'  // ✅ 使用 useLoading

// 使用 useLoading
const { withLoading, cleanup: cleanupLoading } = useLoading()

// 答题开始时间
const startTime = ref(0)
// 答案修改次数
const modificationCount = ref(0)
// 首次答案
const firstAnswer = ref(null)
// 题目ID
const currentQuestionId = ref(null)
// 犹豫时间跟踪
const hesitationTime = ref(0)
const hoverStartTime = ref(0)
// 是否跳过
const isSkipped = ref(false)
// 会话ID
const sessionId = ref(null)
// 行为缓冲区（批量提交）
const behaviorBuffer = ref([])
// 提交定时器
const submitTimer = ref(null)

// 性能优化参数
const BATCH_SIZE = 10 // 批量提交大小
const SUBMIT_INTERVAL = 30000 // 批量提交间隔（30秒）

onMounted(() => {
  // 生成会话ID
  sessionId.value = generateSessionId()
  
  // 启动批量提交定时器
  submitTimer.value = setInterval(() => {
    flushBuffer()
  }, SUBMIT_INTERVAL)
})

onUnmounted(() => {
  // 清理定时器
  if (submitTimer.value) {
    clearInterval(submitTimer.value)
  }
  
  // 清理 useLoading
  cleanupLoading()
  
  // 提交剩余数据
  flushBuffer()
})

// 开始答题
const startTracking = (questionId) => {
  currentQuestionId.value = questionId
  startTime.value = Date.now()
  modificationCount.value = 0
  firstAnswer.value = null
  hesitationTime.value = 0
  isSkipped.value = false
}

// 记录答案修改
const trackModification = () => {
  modificationCount.value++
}

// 记录首次答案
const trackFirstAnswer = (answer) => {
  if (!firstAnswer.value) {
    firstAnswer.value = answer
  }
}

// 记录鼠标悬停（犹豫）- 节流优化
const trackHoverStart = () => {
  if (!hoverStartTime.value) {
    hoverStartTime.value = Date.now()
  }
}

const trackHoverEnd = () => {
  if (hoverStartTime.value > 0) {
    const duration = (Date.now() - hoverStartTime.value) / 1000
    
    // 只有超过1秒的犹豫才记录
    if (duration > 1) {
      hesitationTime.value += duration
    }
    
    hoverStartTime.value = 0
  }
}

// 记录跳题
const trackSkip = () => {
  isSkipped.value = true
}

// 记录返回
const trackReturn = () => {
  isSkipped.value = false
}

// 提交答题行为（批量优化）
const submitBehavior = async (userId, questionId, finalAnswer, isCorrect) => {
  const answerTime = Math.round((Date.now() - startTime.value) / 1000)
  const isFirstAnswerCorrect = firstAnswer.value === finalAnswer && isCorrect
  
  // 添加到缓冲区
  behaviorBuffer.value.push({
    userId,
    questionId,
    answerTime,
    answerModifications: modificationCount.value,
    isFirstAnswerCorrect,
    finalAnswer,
    isCorrect,
    hesitationTime: Math.round(hesitationTime.value),
    skippedAndReturned: isSkipped.value ? 1 : 0,
    sessionId: sessionId.value
  })
  
  // 如果缓冲区满了，立即提交
  if (behaviorBuffer.value.length >= BATCH_SIZE) {
    await flushBuffer()
  }
}

// 批量提交缓冲区数据
const flushBuffer = async () => {
  if (behaviorBuffer.value.length === 0) {
    return
  }
  
  const dataToSubmit = [...behaviorBuffer.value]
  behaviorBuffer.value = []
  
  try {
    // ✅ 使用 withLoading 和 api 封装
    await withLoading(async () => {
      await api.post('/api/answer-behavior/batch', {
        behaviors: dataToSubmit
      })
    }, '提交数据中...')
  } catch (error) {
    // ✅ api 会自动显示错误
    // 如果失败，重新添加回缓冲区
    behaviorBuffer.value = [...dataToSubmit, ...behaviorBuffer.value]
  }
}

// 生成会话ID
const generateSessionId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 导出方法
defineExpose({
  startTracking,
  trackModification,
  trackFirstAnswer,
  trackHoverStart,
  trackHoverEnd,
  trackSkip,
  trackReturn,
  submitBehavior,
  flushBuffer
})
</script>
```

#### 后端 API 扩展（批量提交优化）

**文件位置**: `routes/answer-behavior.js`（增强现有文件）

```javascript
const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');  // ✅ 使用 adminAuth
const db = require('../services/database');  // ✅ 使用 db 实例
const aiService = require('../services/aiService');

/**
 * POST /api/answer-behavior/batch
 * 批量提交答题行为（优化性能）
 */
router.post('/batch', async (req, res) => {
  try {
    const { behaviors } = req.body;
    
    if (!Array.isArray(behaviors) || behaviors.length === 0) {
      return res.status(400).json({ error: '请提供行为数据列表' });
    }
    
    // 批量插入（✅ 使用 MySQL 语法）
    const values = behaviors.map(b => [
      b.userId,
      b.questionId,
      b.answerTime,
      b.answerModifications,
      b.isFirstAnswerCorrect,
      b.finalAnswer,
      b.isCorrect,
      b.hesitationTime,
      b.skippedAndReturned,
      b.sessionId
    ]);
    
    await db.query(`
      INSERT INTO answer_behavior 
      (user_id, question_id, answer_time, answer_modifications, is_first_answer_correct,
       final_answer, is_correct, hesitation_time, skipped_and_returned, session_id)
      VALUES ?
    `, [values]);
    
    res.json({
      success: true,
      insertedCount: behaviors.length
    });
    
  } catch (error) {
    console.error('[批量提交答题行为] 失败:', error);
    res.status(500).json({ error: '批量提交失败，请稍后重试' });
  }
});

/**
 * GET /api/answer-behavior/user-style/:userId
 * 获取用户学习风格分析
 */
router.get('/user-style/:userId', adminAuth, async (req, res) => {  // ✅ 使用 adminAuth
  try {
    const { userId } = req.params;
    
    // 尝试从缓存获取
    const cacheKey = `learning_style_${userId}`;
    const cached = await aiService.getCache(cacheKey);
    
    if (cached) {
      return res.json({ 
        success: true, 
        styleAnalysis: cached,
        cached: true
      });
    }
    
    // 检查是否已有分析结果
    let styleAnalysis = await db.get(
      'SELECT * FROM user_learning_style WHERE user_id = ?',
      [userId]
    );
    
    // 如果没有或数据过旧，重新分析
    if (!styleAnalysis || shouldReanalyze(styleAnalysis)) {
      styleAnalysis = await analyzeUserLearningStyle(userId);
    }
    
    // 缓存结果
    await aiService.setCache(cacheKey, styleAnalysis, 1800);
    
    res.json({ 
      success: true, 
      styleAnalysis 
    });
    
  } catch (error) {
    console.error('[学习风格分析] 失败:', error);
    res.status(500).json({ error: '学习风格分析失败，请稍后重试' });
  }
});

/**
 * 分析用户学习风格
 */
async function analyzeUserLearningStyle(userId) {
  // 获取用户答题行为数据（✅ 使用 db.query）
  const behaviorData = await db.query(`
    SELECT 
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
    LIMIT 100
  `, [userId]);
  
  if (behaviorData.length < 10) {
    return {
      user_id: userId,
      avg_answer_time: 0,
      answer_time_stability: 0,
      avg_modifications: 0,
      skip_rate: 0,
      error_patterns: {},
      learning_style_tags: [],
      ai_suggestion: '答题数据不足，请继续答题以获取更准确的学习风格分析',
      total_analyzed_sessions: behaviorData.length
    };
  }
  
  // 计算统计数据
  const avgAnswerTime = behaviorData.reduce((sum, b) => sum + b.answer_time, 0) / behaviorData.length;
  const answerTimeStability = calculateStdDev(behaviorData.map(b => b.answer_time));
  const avgModifications = behaviorData.reduce((sum, b) => sum + b.answer_modifications, 0) / behaviorData.length;
  const skipRate = behaviorData.filter(b => b.skipped_and_returned).length / behaviorData.length;
  
  // 分析错误模式（✅ 使用 db.query）
  const errorPatterns = await db.query(`
    SELECT error_type, COUNT(*) as count
    FROM error_patterns
    WHERE user_id = ?
    GROUP BY error_type
  `, [userId]);
  
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
  
  // 保存分析结果（✅ 使用 db.run + MySQL 语法）
  await db.run(`
    INSERT INTO user_learning_style 
    (user_id, avg_answer_time, answer_time_stability, avg_modifications, skip_rate, 
     error_patterns, learning_style_tags, ai_suggestion, total_analyzed_sessions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      avg_answer_time = VALUES(avg_answer_time),
      answer_time_stability = VALUES(answer_time_stability),
      avg_modifications = VALUES(avg_modifications),
      skip_rate = VALUES(skip_rate),
      error_patterns = VALUES(error_patterns),
      learning_style_tags = VALUES(learning_style_tags),
      ai_suggestion = VALUES(ai_suggestion),
      total_analyzed_sessions = VALUES(total_analyzed_sessions),
      updated_at = NOW()
  `, [
    userId,
    avgAnswerTime,
    answerTimeStability,
    avgModifications,
    skipRate,
    JSON.stringify(errorPatternsObj),
    JSON.stringify(styleAnalysis.learningStyleTags || []),
    styleAnalysis.aiSuggestion || '',
    behaviorData.length
  ]);
  
  return {
    user_id: userId,
    avg_answer_time: avgAnswerTime,
    answer_time_stability: answerTimeStability,
    avg_modifications: avgModifications,
    skip_rate: skipRate,
    error_patterns: errorPatternsObj,
    learning_style_tags: styleAnalysis.learningStyleTags || [],
    ai_suggestion: styleAnalysis.aiSuggestion || '',
    total_analyzed_sessions: behaviorData.length
  };
}

// 辅助函数：计算标准差
function calculateStdDev(values) {
  if (values.length === 0) return 0;
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

// 辅助函数：判断是否需要重新分析
function shouldReanalyze(styleAnalysis) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return new Date(styleAnalysis.updated_at) < oneWeekAgo;
}

module.exports = router;
```

---

## 🔄 更新 AI 上下文

最后，更新 `services/aiService.js` 中的 `getDatabaseContext()` 方法，将新增的数据表添加到 AI 可访问的上下文中：

```javascript
async getDatabaseContext() {
  try {
    const context = {
      schema: {
        // 原有表
        users: { fields: 'id, student_id, name, grade, class', description: '学生信息' },
        subjects: { fields: 'id, name', description: '学科' },
        questions: { fields: 'id, subject_id, subcategory_id, type, difficulty, content, options, correct_answer', description: '题目' },
        subcategories: { fields: 'id, subject_id, name', description: '知识点' },
        answer_records: { fields: 'id, user_id, subject_id, subcategory_id, total_questions, correct_count, created_at', description: '答题记录' },
        question_attempts: { fields: 'id, question_id, user_id, subject_id, is_correct, selected_answer, created_at', description: '题目尝试' },
        error_collection: { fields: 'id, user_id, question_id, created_at', description: '错题收藏' },
        
        // 新增语义分析表
        question_semantic_analysis: { 
          fields: 'question_id, keywords, auto_tags, knowledge_points, difficulty_factors, similar_questions, content_quality_score, ai_analysis', 
          description: '题目语义分析（关键词、标签、难度因素、相似题目）' 
        },
        question_tags: { 
          fields: 'id, tag_name, tag_category, usage_count', 
          description: '题目标签' 
        },
        
        // 新增用户行为表
        answer_behavior: { 
          fields: 'user_id, question_id, answer_time, answer_modifications, is_first_answer_correct, hesitation_time, skipped_and_returned', 
          description: '答题行为详情（答题时间、修改次数、犹豫时间）' 
        },
        user_learning_style: { 
          fields: 'user_id, avg_answer_time, answer_time_stability, avg_modifications, skip_rate, error_patterns, learning_style_tags, ai_suggestion', 
          description: '用户学习风格分析' 
        },
        error_patterns: { 
          fields: 'user_id, question_id, error_type, error_reason, improvement_suggestion, related_knowledge_points', 
          description: '错误模式详情（错误类型、原因、改进建议）' 
        },
        
        // 新增学习进度表
        learning_progress: { 
          fields: 'user_id, subject_id, subcategory_id, mastery_level, target_goal, progress_percentage, recent_accuracy, accuracy_trend, ai_suggestion', 
          description: '学习进度（掌握程度、学习目标、效果跟踪）' 
        }
      },
      data: {}
    };
    
    // 原有数据查询...
    
    // 新增：热门标签（按需查询，不预加载）
    // const popularTags = await db.query(`
    //   SELECT tag_name, tag_category, usage_count
    //   FROM question_tags
    //   ORDER BY usage_count DESC
    //   LIMIT 20
    // `);
    // context.data.popularTags = popularTags;
    
    // 新增：题目质量统计（按需查询）
    // const qualityStats = await db.get(`
    //   SELECT 
    //     COUNT(*) as analyzed_questions,
    //     AVG(content_quality_score) as avg_quality_score
    //   FROM question_semantic_analysis
    // `);
    // context.data.qualityStats = qualityStats;
    
    return context;
  } catch (error) {
    console.error('[AI上下文] 获取失败:', error);
    return { schema: {}, data: {} };
  }
}
```

---

## ⚠️ 性能优化与注意事项

### 1. 性能优化策略

#### 批量分析优化
- ✅ **任务队列**：使用 `ai_analysis_queue` 表实现异步处理
- ✅ **并发控制**：最大并发数限制为 5，避免服务器过载
- ✅ **优先级调度**：支持任务优先级，紧急任务优先处理
- ✅ **延迟处理**：批量任务间隔 1-2 秒，避免 API 调用过快

#### 前端优化
- ✅ **批量提交**：答题行为数据批量提交，减少 API 调用
- ✅ **节流处理**：鼠标悬停等高频事件节流处理
- ✅ **缓冲区机制**：达到阈值或定时批量提交
- ✅ **失败重试**：提交失败自动重试

#### 缓存策略
- ✅ **数据库缓存**：使用 `ai_analysis_cache` 表缓存结果
- ✅ **语义分析缓存**：1 小时有效期
- ✅ **学习风格缓存**：30 分钟有效期
- ✅ **相似题目缓存**：30 分钟有效期

### 2. 数据存储规范

#### JSON 字段限制
```javascript
// JSON 字段大小限制
const MAX_JSON_SIZE = 10000; // 10KB

// 验证并清理 JSON 数据
function validateAndCleanJSON(data) {
  const cleanField = (field, defaultValue) => {
    if (!field) return defaultValue;
    
    const jsonString = JSON.stringify(field);
    if (jsonString.length > MAX_JSON_SIZE) {
      console.warn(`[JSON清理] 字段大小超限: ${jsonString.length} bytes`);
      return defaultValue;
    }
    
    return field;
  };
  
  return {
    keywords: cleanField(data.keywords, []),
    autoTags: cleanField(data.autoTags, []),
    // ... 其他字段
  };
}
```

#### 数据结构一致性
```javascript
// 确保 JSON 数据结构一致
const standardKeywords = {
  type: 'array',
  items: { type: 'string' },
  maxItems: 10
};

const standardAutoTags = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      category: { type: 'string', enum: ['题型', '难度', '考点', '易错点'] },
      confidence: { type: 'number', minimum: 0, maximum: 1 }
    },
    required: ['name']
  },
  maxItems: 20
};
```

### 3. AI 调用优化

#### 重试机制
```javascript
// 带重试的 AI 调用
const result = await aiService.callWithRetry(
  () => aiService.analyzeQuestionSemantic(data),
  {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2 // 指数退避
  }
);
```

#### 速率限制处理
```javascript
// 自动识别速率限制错误
if (error.message && error.message.includes('rate_limit')) {
  const waitTime = this.extractRetryAfter(error) || 60000;
  console.warn(`[AI重试] 遇到速率限制，等待 ${waitTime}ms`);
  await new Promise(resolve => setTimeout(resolve, waitTime));
}
```

#### 文本长度限制
```javascript
// 截断文本，避免超出 API 限制
const truncatedContent = this.truncateText(question.content, 500);
```

---

## ✅ 验收标准

### 功能验收
- [ ] **题目语义分析**：AI 能够分析题目关键词、标签、难度因素
- [ ] **相似题目推荐**：能够根据语义分析推荐相似题目
- [ ] **用户行为跟踪**：能够记录答题时间、修改次数、犹豫时间
- [ ] **学习风格分析**：能够分析用户的学习风格和错误模式
- [ ] **错题原因分析**：能够自动分析错误类型和改进建议
- [ ] **学习进度跟踪**：能够量化知识点掌握程度
- [ ] **个性化建议**：AI 能够生成个性化学习建议
- [ ] **AI 上下文更新**：新增数据已添加到 AI 可访问的上下文中

### 性能验收
- [ ] **批量分析性能**：100 道题目分析时间 < 10 分钟
- [ ] **并发控制**：最大并发数不超过 5
- [ ] **缓存命中率**：缓存命中率 > 60%
- [ ] **批量提交效率**：前端 API 调用次数减少 > 80%
- [ ] **重试成功率**：可重试错误的重试成功率 > 95%

### 数据验证
- [ ] **JSON 字段大小**：所有 JSON 字段 < 10KB
- [ ] **数据结构一致性**：JSON 数据结构符合规范
- [ ] **语义分析准确性**：关键词提取准确率 > 80%
- [ ] **相似题目相关性**：推荐题目相关性评分 > 0.7
- [ ] **错误类型分类准确性**：AI 分类准确率 > 75%
- [ ] **建议采纳率**：用户采纳建议比例 > 60%

---

## 🚀 实施步骤

### 第一步：环境配置准备（30 分钟）
1. 更新 `.env` 文件，添加 AI 服务配置
2. 检查数据库连接和权限
3. 检查现有工具和中间件
4. 验证签名密钥配置

### 第二步：数据库准备（90 分钟）
1. 创建题目语义分析相关表
2. 创建用户行为分析相关表
3. 创建 AI 任务队列表
4. 创建缓存表（如不存在）
5. 添加必要的索引

### 第三步：核心服务开发（240 分钟）
1. 实现 AI 任务队列服务（`services/aiQueueService.js`）
2. 扩展 AI 服务（重试、缓存、截断）（`services/aiService.js`）
3. 实现题目语义分析 API（`routes/question-semantic.js`）
4. 实现学习风格分析 API（扩展现有 `routes/answer-behavior.js`）

### 第四步：前端优化（150 分钟）
1. 增强答题行为跟踪组件（批量提交）
2. 添加节流和缓冲区机制
3. 添加语义分析相关 UI
4. 添加学习风格展示
5. 集成 useLoading 和 message

### 第五步：性能优化与安全加固（120 分钟）
1. 实现缓存策略
2. 优化数据库查询
3. 添加并发控制
4. XSS/CSRF 防护
5. 输入验证

### 第六步：测试验证（90 分钟）
1. 功能测试
2. 性能测试（批量分析、并发、缓存）
3. 安全测试
4. AI 分析准确性测试

---

## ⚙️ 环境配置说明

### 新增环境变量

在项目根目录的 `.env` 文件中添加以下配置：

```bash
# AI 服务配置（新增）
AI_API_ENDPOINT=https://ark.cn-beijing.volcano.com/api/v3/chat/completions
AI_API_KEY=your-ai-api-key-here
AI_MODEL=doubao-pro-32k-241215

# AI 服务限流配置（新增）
AI_MAX_CONCURRENT=5                    # 最大并发请求数
AI_RETRY_ATTEMPTS=3                    # 重试次数
AI_RETRY_DELAY=1000                    # 重试延迟（毫秒）
AI_RATE_LIMIT_WAIT=60000               # 速率限制等待时间（毫秒）

# AI 缓存配置（新增）
AI_CACHE_TTL=3600                      # AI 结果缓存时间（秒）

# 已有配置（无需修改）
SERVER_PORT=3001
VITE_API_URL=http://localhost:3001/api
SIGNATURE_SECRET=your-secret-key-here
VITE_SIGNATURE_SECRET=your-secret-key-here
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=pscg
DB_PASSWORD=your-password
DB_NAME=pscg
```

### 环境变量使用说明

#### 前端访问（Vite）
```javascript
// 访问 VITE_* 变量
const apiUrl = import.meta.env.VITE_API_URL
const signatureSecret = import.meta.env.VITE_SIGNATURE_SECRET
```

#### 后端访问（Node.js）
```javascript
// 使用 dotenv 加载
require('dotenv').config()

// 访问环境变量
const apiKey = process.env.AI_API_KEY
const maxConcurrent = parseInt(process.env.AI_MAX_CONCURRENT || '5')
```

### 安全注意事项

1. **AI API 密钥管理**
   - 不要在代码中硬编码 API 密钥
   - 定期轮换 API 密钥（每 3-6 个月）
   - 使用环境变量注入（推荐）

2. **签名密钥一致性**
   - 确保 `SIGNATURE_SECRET` 和 `VITE_SIGNATURE_SECRET` 相同
   - 修改后需要重新构建前端并重启后端

3. **配置文件安全**
   - 永远不要提交 `.env` 到 Git
   - 使用 `.env.example` 作为配置模板

---

## 📝 注意事项

### 技术栈规范

#### 数据库相关
- ✅ 使用 MySQL 语法（`AUTO_INCREMENT`, `VARCHAR`, `INT`）
- ✅ 使用参数化查询（`db.get/query/run`）
- ✅ 为大表添加索引
- ✅ 使用连接池（已配置）
- ❌ 禁止 SQLite 语法
- ❌ 禁止 SQL 字符串拼接

#### 前端相关
- ✅ 使用 `<script setup>` 语法
- ✅ 使用 Composition API（`ref`, `reactive`, `computed`）
- ✅ 使用项目封装的工具（`api`, `message`, `useLoading`）
- ✅ 使用 Element Plus 图标（从 `@element-plus/icons-vue` 导入）
- ✅ 使用 XSS 防护（`escapeHtml`）
- ❌ 禁止原生 `fetch`
- ❌ 禁止直接使用 `ElMessage`
- ❌ 禁止忘记导入图标

#### 后端相关
- ✅ 使用 CommonJS（`require`/`module.exports`）
- ✅ 使用 `adminAuth` 中间件（所有管理后台 API）
- ✅ 使用 `db` 实例（`services/database`）
- ✅ 统一错误处理（所有异步操作 `try-catch`）
- ✅ 输入验证（必填、类型、格式）
- ❌ 禁止绕过权限验证
- ❌ 禁止返回敏感信息

### 性能优化建议

#### AI 分析调用优化
- ✅ 使用缓存避免重复分析（缓存时间 1 小时）
- ✅ 使用任务队列处理批量任务
- ✅ 实现重试机制（指数退避）
- ✅ 处理速率限制错误（自动等待）
- ✅ 并发控制（最多 5 个并发）
- ✅ 文本截断（避免超出 API 限制）

#### 前端性能优化
- ✅ 批量提交数据（减少 API 调用）
- ✅ 节流处理高频事件（鼠标悬停等）
- ✅ 使用缓冲区机制
- ✅ 使用 useLoading 避免 UI 阻塞
- ✅ 组件卸载时清理资源

#### 数据库优化
- ✅ 为常用查询字段添加索引
- ✅ 使用连接池
- ✅ 批量插入（`INSERT VALUES ?`）
- ✅ 查询结果限制（`LIMIT`）
- ✅ JSON 字段大小限制（10KB）

### 安全措施

#### XSS 防护
```javascript
import { escapeHtml } from '@/utils/xss-filter'

// 用户输入必须转义
const safeText = escapeHtml(userInput)
```

#### CSRF 防护
```javascript
// ✅ 已自动集成在 api 封装中
import { api } from '@/utils/api'

// api 会自动添加 CSRF Token
await api.post('/api/resource', data)
```

#### 权限验证
```javascript
const adminAuth = require('../middleware/adminAuth')

// ✅ 所有管理后台 API 必须使用
router.post('/admin/resource', adminAuth, async (req, res) => {
  // req.admin 包含当前管理员信息
  const operator = req.admin.username
})
```

#### 输入验证
```javascript
// 必填验证
if (!name || name.trim() === '') {
  return res.status(400).json({ error: '姓名不能为空' })
}

// 类型验证
if (typeof age !== 'number' || age < 0) {
  return res.status(400).json({ error: '年龄必须是正整数' })
}

// JSON 大小验证
const jsonString = JSON.stringify(data)
if (jsonString.length > 10000) {
  return res.status(400).json({ error: '数据大小超出限制' })
}
```

### 数据质量保证

- ✅ JSON 字段大小限制（10KB）
- ✅ 数据结构验证和清理
- ✅ 语义分析需要足够的数据量
- ✅ 学习风格分析至少需要 10 次答题数据
- ✅ 定期更新分析结果（每周重新分析）

### 用户隐私保护

- ✅ 不记录敏感个人信息
- ✅ AI 分析结果仅供学习参考
- ✅ 用户可以删除自己的数据
- ✅ 数据脱敏处理
- ✅ 日志不记录用户输入

---

## 📚 参考文档

### 核心文档
- **AI 辅助开发指南**: `DOCS/AI辅助开发指南.md` - AI 工作流程和规范
- **技术栈清单**: `DOCS/技术栈清单.md` - 完整技术栈参考
- **环境配置说明**: `DOCS/环境配置说明.md` - 环境变量配置
- **项目规则**: 根目录 `.cursorrules` - 项目编码规范
- **AI 数据访问分析报告**: `DOCS/AI数据访问分析报告.md` - 数据访问能力分析

### API 文档
- **题目管理**: `DOCS/API文档/题目管理API.md`
- **用户管理**: `DOCS/API文档/用户管理API.md`
- **答题记录**: `DOCS/API文档/答题记录API.md`
- **数据分析**: `DOCS/API文档/数据分析API.md`

### 工具文档
- **useLoading**: `src/composables/useLoading.js`
- **usePagination**: `src/composables/usePagination.js`
- **api 封装**: `src/utils/api.js`
- **message 封装**: `src/utils/message.js`
- **格式化工具**: `src/utils/format.js`

---

## 版本记录

| 版本 | 日期 | 修改内容 | 修改原因 |
|------|------|---------|---------|
| v1.0 | 2026-03-27 | 初始版本（错误的需求） | - |
| v2.0 | 2026-03-27 | 重新设计需求，专注于 AI 自然语言分析 | 理解真实需求 |
| v3.0 | 2026-03-27 | 补充性能优化、数据规范、错误处理 | 根据用户反馈优化 |
| v4.0 | 2026-03-27 | 根据项目技术栈规范全面修订 | 符合项目规范 |

### v4.0 主要变更
1. **添加技术约束章节**：明确数据库、前端、后端规范
2. **添加环境配置说明**：新增 AI 服务相关环境变量
3. **优化实施步骤**：增加环境配置准备和安全加固步骤
4. **完善注意事项**：补充技术栈规范、安全措施、编码规范
5. **修订代码示例**：
   - 前端：使用 `api`、`message`、`useLoading` 封装
   - 后端：使用 `adminAuth`、`db` 实例、统一错误处理
   - 数据库：使用 MySQL 语法
6. **完善参考文档**：添加核心文档、API 文档、工具文档索引

---

**文档状态**: 待实施  
**最后更新**: 2026-03-27  
**维护说明**: 本文档应随项目技术栈变化及时更新
