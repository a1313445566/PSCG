const express = require('express');
const router = express.Router();
const db = require('../services/database');

// 获取子分类统计数据（题目数量和平均难度）
router.get('/subcategories/stats', async (req, res) => {
  try {
    const { subjectId } = req.query;
    
    let query = `
      SELECT 
        subcategory_id as subcategoryId,
        COUNT(*) as questionCount,
        COALESCE(AVG(difficulty), 1) as avgDifficulty
      FROM questions
      WHERE 1=1
    `;
    const params = [];
    
    if (subjectId) {
      query += ' AND subject_id = ?';
      params.push(Number(subjectId));
    }
    
    query += ' GROUP BY subcategory_id';
    
    const stats = await db.all(query, params);
    
    // 转换为对象格式，方便前端查找
    const statsMap = {};
    stats.forEach(stat => {
      statsMap[stat.subcategoryId] = {
        questionCount: stat.questionCount,
        avgDifficulty: Math.round(stat.avgDifficulty * 10) / 10
      };
    });
    
    res.json(statsMap);
  } catch (error) {
    console.error('获取子分类统计失败:', error);
    res.status(500).json({ error: '获取数据失败' });
  }
});

// 获取题目列表（支持分页和筛选）
router.get('/', async (req, res) => {
  try {
    const { subjectId, subcategoryId, type, page = 1, limit = 20, excludeContent = 'false' } = req.query;

    // 根据是否排除内容字段，选择不同的查询字段
    const selectFields = excludeContent === 'true'
      ? 'id, subject_id as subjectId, subcategory_id as subcategoryId, type, correct_answer as answer, difficulty, created_at as createdAt, content, image_url as image, audio_url as audio'
      : '*';

    let query = `SELECT ${selectFields} FROM questions WHERE 1=1`;
    const params = [];

    if (subjectId) {
      query += ' AND subject_id = ?';
      params.push(Number(subjectId));
    }

    if (subcategoryId) {
      query += ' AND subcategory_id = ?';
      params.push(Number(subcategoryId));
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;

    query += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const questions = await db.all(query, params);

    // 转换字段名为camelCase格式（仅在需要时处理）
    const formattedQuestions = questions.map(question => {
      if (excludeContent === 'true') {
        // 不包含完整内容时，只返回基本信息和内容摘要
        return {
          id: question.id,
          subjectId: question.subjectId || question.subject_id,
          subcategoryId: question.subcategoryId || question.subcategory_id,
          content: question.content || '', // 只包含前200个字符
          type: question.type,
          answer: question.answer,
          difficulty: question.difficulty,
          image: question.image,
          audio: question.audio,
          createdAt: question.createdAt || question.created_at
        };
      }

      let options = [];
      let answer = question.correct_answer;

      try {
        options = JSON.parse(question.options);
      } catch (error) {
        options = [];
      }

      try {
        const parsedAnswer = JSON.parse(question.correct_answer);
        if (typeof parsedAnswer === 'string') {
          answer = parsedAnswer;
        }
      } catch (error) {
        // 如果解析失败，使用原始值
      }

      return {
        id: question.id,
        subjectId: question.subject_id,
        subcategoryId: question.subcategory_id,
        content: question.content,
        type: question.type,
        options: options,
        answer: answer,
        explanation: question.explanation,
        audio: question.audio_url,
        image: question.image_url,
        createdAt: question.created_at
      };
    });

    res.json(formattedQuestions);
  } catch (error) {
    // console.error('获取题目失败:', error);
    res.status(500).json({ error: '获取题目失败' });
  }
});

// 获取单个题目
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const question = await db.get('SELECT * FROM questions WHERE id = ?', [id]);
    
    if (!question) {
      res.status(404).json({ error: '题目不存在' });
      return;
    }
    
    // 转换字段名为camelCase格式
    let options = [];
    let answer = question.correct_answer;
    
    try {
      options = JSON.parse(question.options);
    } catch (error) {
      // console.error('解析选项失败:', error);
      options = [];
    }
    
    try {
      // 尝试解析answer字段，处理JSON字符串格式的答案
      const parsedAnswer = JSON.parse(question.correct_answer);
      if (typeof parsedAnswer === 'string') {
        answer = parsedAnswer;
      }
    } catch (error) {
      // 如果解析失败，使用原始值
    }
    
    const formattedQuestion = {
      id: question.id,
      subjectId: question.subject_id,
      subcategoryId: question.subcategory_id,
      content: question.content,
      type: question.type,
      options: options,
      answer: answer,
      explanation: question.explanation,
      audio: question.audio_url,
      image: question.image_url,
      createdAt: question.created_at
    };
    
    res.json(formattedQuestion);
  } catch (error) {
    // console.error('获取题目失败:', error);
    res.status(500).json({ error: '获取题目失败' });
  }
});

// 添加题目
router.post('/', async (req, res) => {
  try {
    const { subjectId, subcategoryId, content, type, options, answer, explanation = '', audio = null, image = null } = req.body;
    
    if (!subjectId || !subcategoryId || !content || !type || !options || !answer) {
      res.status(400).json({ error: '题目信息不完整' });
      return;
    }
    
    // 处理 options 参数，确保它是一个数组
    const optionsJson = JSON.stringify(options || []);
    
    const result = await db.run(
      'INSERT INTO questions (subject_id, subcategory_id, content, type, options, correct_answer, explanation, audio_url, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [subjectId, subcategoryId, content, type, optionsJson, answer, explanation, audio, image]
    );
    
    // 检查插入是否成功
    if (!result || !result.insertId) {
      throw new Error('插入题目失败，未返回插入ID');
    }
    
    // 返回新添加的题目
    const newQuestion = await db.get('SELECT * FROM questions WHERE id = ?', [result.insertId]);
    
    // 检查是否成功获取新题目
    if (!newQuestion) {
      throw new Error('获取新添加的题目失败');
    }
    
    // 格式化题目数据
    let formattedOptions = [];
    let correctAnswer = newQuestion.correct_answer;
    
    try {
      formattedOptions = JSON.parse(newQuestion.options);
    } catch (error) {
      formattedOptions = [];
    }
    
    try {
      // 尝试解析answer字段，处理JSON字符串格式的答案
      const parsedAnswer = JSON.parse(newQuestion.correct_answer);
      if (typeof parsedAnswer === 'string') {
        correctAnswer = parsedAnswer;
      }
    } catch (error) {
      // 如果解析失败，使用原始值
    }
    
    const formattedQuestion = {
      id: newQuestion.id,
      subjectId: newQuestion.subject_id,
      subcategoryId: newQuestion.subcategory_id,
      content: newQuestion.content,
      type: newQuestion.type,
      options: formattedOptions,
      answer: correctAnswer,
      explanation: newQuestion.explanation,
      audio: newQuestion.audio_url,
      image: newQuestion.image_url,
      createdAt: newQuestion.created_at
    };
    
    res.json(formattedQuestion);
  } catch (error) {
    console.error('添加题目失败:', error);
    res.status(500).json({ error: '添加题目失败', details: error.message });
  }
});

// 更新题目
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { subjectId, subcategoryId, content, type, options, answer, explanation, audio, image } = req.body;
    
    if (!subjectId || !subcategoryId || !content || !type || !options || !answer) {
      res.status(400).json({ error: '题目信息不完整' });
      return;
    }
    
    await db.run(
      'UPDATE questions SET subject_id = ?, subcategory_id = ?, content = ?, type = ?, options = ?, correct_answer = ?, explanation = ?, audio_url = ?, image_url = ? WHERE id = ?',
      [subjectId, subcategoryId, content, type, JSON.stringify(options), answer, explanation, audio, image, id]
    );
    
    // 返回更新后的题目
    const updatedQuestion = await db.get('SELECT * FROM questions WHERE id = ?', [id]);
    
    // 格式化题目数据
    let formattedOptions = [];
    let correctAnswer = updatedQuestion.correct_answer;
    
    try {
      formattedOptions = JSON.parse(updatedQuestion.options);
    } catch (error) {
      // console.error('解析选项失败:', error);
      formattedOptions = [];
    }
    
    try {
      // 尝试解析answer字段，处理JSON字符串格式的答案
      const parsedAnswer = JSON.parse(updatedQuestion.correct_answer);
      if (typeof parsedAnswer === 'string') {
        correctAnswer = parsedAnswer;
      }
    } catch (error) {
      // 如果解析失败，使用原始值
    }
    
    const formattedQuestion = {
      id: updatedQuestion.id,
      subjectId: updatedQuestion.subject_id,
      subcategoryId: updatedQuestion.subcategory_id,
      content: updatedQuestion.content,
      type: updatedQuestion.type,
      options: formattedOptions,
      answer: correctAnswer,
      explanation: updatedQuestion.explanation,
      audio: updatedQuestion.audio_url,
      image: updatedQuestion.image_url,
      createdAt: updatedQuestion.created_at
    };
    
    res.json(formattedQuestion);
  } catch (error) {
    // console.error('更新题目失败:', error);
    res.status(500).json({ error: '更新题目失败' });
  }
});

// 删除题目
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM questions WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    // console.error('删除题目失败:', error);
    res.status(500).json({ error: '删除题目失败' });
  }
});

module.exports = router;