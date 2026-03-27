/**
 * AI 输入验证中间件
 * 用于验证 AI 相关 API 的输入数据
 */

/**
 * 验证题目 ID
 */
const validateQuestionId = (req, res, next) => {
  const { questionId } = req.body;
  
  if (!questionId) {
    return res.status(400).json({ error: '请提供题目ID' });
  }
  
  if (!Number.isInteger(questionId) || questionId <= 0) {
    return res.status(400).json({ error: '题目ID必须是正整数' });
  }
  
  next();
};

/**
 * 验证用户 ID
 */
const validateUserId = (req, res, next) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: '请提供用户ID' });
  }
  
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: '用户ID必须是正整数' });
  }
  
  next();
};

/**
 * 验证批量题目 ID 列表
 */
const validateQuestionIds = (req, res, next) => {
  const { questionIds } = req.body;
  
  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    return res.status(400).json({ error: '请提供题目ID列表' });
  }
  
  if (questionIds.length > 100) {
    return res.status(400).json({ error: '一次最多分析 100 道题目' });
  }
  
  // 验证每个 ID
  for (const id of questionIds) {
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: '题目ID必须是正整数' });
    }
  }
  
  next();
};

/**
 * 验证批量行为数据
 */
const validateBehaviors = (req, res, next) => {
  const { behaviors } = req.body;
  
  if (!Array.isArray(behaviors) || behaviors.length === 0) {
    return res.status(400).json({ error: '请提供行为数据列表' });
  }
  
  if (behaviors.length > 50) {
    return res.status(400).json({ error: '一次最多提交 50 条行为数据' });
  }
  
  // 验证每条行为数据
  for (let i = 0; i < behaviors.length; i++) {
    const b = behaviors[i];
    
    if (!b.userId || !Number.isInteger(b.userId)) {
      return res.status(400).json({ error: `第 ${i + 1} 条数据：用户ID无效` });
    }
    
    if (!b.questionId || !Number.isInteger(b.questionId)) {
      return res.status(400).json({ error: `第 ${i + 1} 条数据：题目ID无效` });
    }
    
    if (typeof b.answerTime !== 'number' || b.answerTime < 0) {
      return res.status(400).json({ error: `第 ${i + 1} 条数据：答题时间无效` });
    }
    
    if (typeof b.answerModifications !== 'number' || b.answerModifications < 0) {
      return res.status(400).json({ error: `第 ${i + 1} 条数据：修改次数无效` });
    }
    
    // 验证可选字段
    if (b.finalAnswer && typeof b.finalAnswer !== 'string') {
      return res.status(400).json({ error: `第 ${i + 1} 条数据：最终答案格式无效` });
    }
    
    if (b.sessionId && typeof b.sessionId !== 'string') {
      return res.status(400).json({ error: `第 ${i + 1} 条数据：会话ID格式无效` });
    }
    
    // 限制字符串长度
    if (b.finalAnswer && b.finalAnswer.length > 100) {
      b.finalAnswer = b.finalAnswer.substring(0, 100);
    }
    
    if (b.sessionId && b.sessionId.length > 100) {
      b.sessionId = b.sessionId.substring(0, 100);
    }
  }
  
  next();
};

/**
 * 验证优先级
 */
const validatePriority = (req, res, next) => {
  const { priority } = req.body;
  
  if (priority !== undefined) {
    if (!Number.isInteger(priority) || priority < 1 || priority > 10) {
      return res.status(400).json({ error: '优先级必须是 1-10 之间的整数' });
    }
  }
  
  next();
};

/**
 * 验证 JSON 数据大小
 */
const validateJsonSize = (maxSizeKB = 10) => {
  return (req, res, next) => {
    const maxSize = maxSizeKB * 1024; // 转换为字节
    
    try {
      const jsonString = JSON.stringify(req.body);
      
      if (jsonString.length > maxSize) {
        return res.status(400).json({ 
          error: `数据大小超出限制（最大 ${maxSizeKB}KB）` 
        });
      }
      
      next();
    } catch (error) {
      return res.status(400).json({ error: '数据格式无效' });
    }
  };
};

/**
 * XSS 防护：转义用户输入的字符串
 */
const sanitizeStrings = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // 转义 HTML 特殊字符
      obj[key] = obj[key]
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    } else if (typeof obj[key] === 'object') {
      sanitizeStrings(obj[key]);
    }
  }
  
  return obj;
};

/**
 * 清理用户输入
 */
const sanitizeInput = (req, res, next) => {
  // 清理 body
  if (req.body) {
    req.body = sanitizeStrings(req.body);
  }
  
  // 清理 query
  if (req.query) {
    req.query = sanitizeStrings(req.query);
  }
  
  next();
};

module.exports = {
  validateQuestionId,
  validateUserId,
  validateQuestionIds,
  validateBehaviors,
  validatePriority,
  validateJsonSize,
  sanitizeInput
};
