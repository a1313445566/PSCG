const express = require('express');
const router = express.Router();
const db = require('../services/database');
const { validateSubjectId } = require('../services/validationService');
const crypto = require('crypto');

// 生成随机会话ID
const generateQuizId = () => {
  return crypto.randomUUID();
};

// 开始答题API
router.post('/start', async (req, res) => {
  try {
    const { subjectId, subcategoryId, questionCount, studentId, grade, class: className } = req.body;
    
    // 验证必填参数
    if (!subjectId || !subcategoryId || !studentId || !grade || !className) {
      return res.status(400).json({ error: '缺少必填参数' });
    }
    
    if (!validateSubjectId(subjectId)) {
      return res.status(400).json({ error: '学科ID格式错误' });
    }
    
    // 查找用户ID
    const user = await db.get(
      'SELECT id FROM users WHERE student_id = ? AND grade = ? AND class = ?',
      [studentId, grade, className]
    );
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const userId = user.id;
    
    // 确定实际题库ID（错题巩固题库使用null）
    let actualSubcategoryId;
    if (subcategoryId === 'error-collection' || subcategoryId === 'error-collection') {
      actualSubcategoryId = null;
    } else {
      actualSubcategoryId = typeof subcategoryId === 'string' ? parseInt(subcategoryId) : subcategoryId;
    }
    
    console.log('Quiz start params:', {
      subcategoryId: subcategoryId,
      actualSubcategoryId: actualSubcategoryId,
      subjectId: subjectId,
      questionCount: questionCount
    });
    
    // 获取题目
    let questions;
    if (actualSubcategoryId === null) {
      // 错题巩固题库 - 只加载累计正确次数小于3次的错题，使用DISTINCT确保不重复
      const errorQuestions = await db.all(
        `SELECT DISTINCT q.* FROM questions q
         JOIN error_collection ec ON q.id = ec.question_id
         WHERE ec.user_id = ? AND q.subject_id = ? AND ec.correct_count < 3
         ORDER BY ec.created_at DESC`,
        [userId, subjectId]
      );
      
      if (errorQuestions.length === 0) {
        return res.status(404).json({ error: '错题巩固题库为空' });
      }
      
      questions = errorQuestions;
    } else {
      // 普通题库
      const limit = parseInt(questionCount) || 10;
      const subcategoryIdInt = parseInt(actualSubcategoryId);
      const subjectIdInt = parseInt(subjectId);
      
      console.log('Quiz start params:', {
        subcategoryId: subcategoryIdInt,
        subjectId: subjectIdInt,
        limit: limit
      });
      
      questions = await db.all(
        `SELECT q.*, (
           SELECT AVG(difficulty) 
           FROM questions 
           WHERE subcategory_id = ?
         ) as avg_difficulty
         FROM questions q
         WHERE q.subject_id = ? AND q.subcategory_id = ?
         ORDER BY RAND() LIMIT ${limit}`,
        [subcategoryIdInt, subjectIdInt, subcategoryIdInt]
      );
      
      if (questions.length === 0) {
        return res.status(404).json({ error: '该题库暂无题目' });
      }
    }
    
    // 生成会话ID和过期时间（30分钟）
    const quizId = generateQuizId();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    
    // 准备题目数据（不含正确答案）
    const questionsForSession = questions.map(q => ({
      id: q.id,
      subject_id: q.subject_id,
      subcategory_id: q.subcategory_id,
      content: q.content,
      type: q.type,
      options: JSON.parse(q.options),
      explanation: q.explanation,
      audio_url: q.audio_url,
      image_url: q.image_url,
      difficulty: q.difficulty
    }));
    
    // 保存会话到数据库
    await db.run(
      `INSERT INTO quiz_sessions (id, user_id, subject_id, subcategory_id, questions, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [quizId, userId, subjectId, actualSubcategoryId, JSON.stringify(questionsForSession), expiresAt]
    );
    
    // 准备返回数据
    const responseData = {
      quizId,
      questions: questionsForSession,
      expiresAt: expiresAt.toISOString()
    };
    
    // 如果是错题巩固题库，添加错题统计数据
    if (actualSubcategoryId === null) {
      const errorStats = await db.all(
        `SELECT question_id, correct_count FROM error_collection 
         WHERE user_id = ? AND question_id IN (${questions.map(q => '?').join(',')})`,
        [userId, ...questions.map(q => q.id)]
      );
      
      const stats = {};
      errorStats.forEach(stat => {
        stats[stat.question_id] = { correctCount: stat.correct_count };
      });
      
      responseData.stats = stats;
    }
    
    // 返回题目列表（不含正确答案）
    res.json(responseData);
  } catch (error) {
    console.error('开始答题失败:', error);
    res.status(500).json({ error: '开始答题失败' });
  }
});

// 提交答案API
router.post('/submit', async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    
    // 验证必填参数
    if (!quizId || !answers) {
      return res.status(400).json({ error: '缺少必填参数' });
    }
    
    // 查询会话
    const session = await db.get(
      'SELECT * FROM quiz_sessions WHERE id = ? AND expires_at > NOW()',
      [quizId]
    );
    
    if (!session) {
      return res.status(404).json({ error: '答题会话不存在或已过期' });
    }
    
    // 检查是否已经提交过
    const existingAttempts = await db.get(
      'SELECT COUNT(*) as count FROM quiz_attempts WHERE quiz_session_id = ?',
      [quizId]
    );
    
    if (existingAttempts && existingAttempts.count > 0) {
      return res.status(400).json({ error: '已经提交过答案' });
    }
    
    // 解析session.questions（可能是字符串或对象）
    const sessionQuestions = typeof session.questions === 'string' 
      ? JSON.parse(session.questions) 
      : session.questions;
    let correctCount = 0;
    const results = [];
    const userId = session.user_id;
    
    // 验证每道题的答案
    for (const question of sessionQuestions) {
      const userAnswer = answers[question.id];
      
      // 如果没有提供答案，跳过或提供默认答案
      if (userAnswer === undefined || userAnswer === null) {
        console.log(`题目 ${question.id} 没有提供答案，跳过`);
        continue;
      }
      
      const originalQuestion = await db.get('SELECT * FROM questions WHERE id = ?', [question.id]);
      
      if (!originalQuestion) {
        continue;
      }
      
      // 解析正确答案
      let correctAnswer = originalQuestion.correct_answer;
      try {
        const parsed = JSON.parse(correctAnswer);
        correctAnswer = typeof parsed === 'string' ? parsed : parsed;
      } catch (e) {
        // 保持原始值
      }
      
      // 判断答案是否正确
      let isCorrect = false;
      if (question.type === 'multiple') {
        const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : correctAnswer.split('');
        if (Array.isArray(userAnswer)) {
          const sortedUserAnswer = [...userAnswer].sort();
          const sortedCorrectAnswer = [...correctAnswers].sort();
          isCorrect = JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer);
        }
      } else {
        if (Array.isArray(userAnswer)) {
          isCorrect = userAnswer[0] === correctAnswer;
        } else {
          isCorrect = userAnswer === correctAnswer;
        }
      }
      
      if (isCorrect) {
        correctCount++;
      }
      
      // 保存答题尝试
      await db.run(
        `INSERT INTO quiz_attempts (quiz_session_id, question_id, user_answer, is_correct)
         VALUES (?, ?, ?, ?)`,
        [
          quizId,
          question.id,
          JSON.stringify(userAnswer),
          isCorrect ? 1 : 0
        ]
      );
      
      // 准备结果
      results.push({
        questionId: question.id,
        userAnswer,
        correctAnswer,
        isCorrect,
        explanation: originalQuestion.explanation,
        // 添加完整的题目信息
        content: originalQuestion.content,
        options: question.options,
        type: question.type || 'single',
        audio_url: originalQuestion.audio_url,
        image_url: originalQuestion.image_url
      });
    }
    
    // 计算积分
    const totalQuestions = sessionQuestions.length;
    let points = 0;
    
    if (session.subcategory_id === null) {
      // 错题巩固题库：每题累计正确3次+1分（在错题处理逻辑中处理）
      points = 0;
    } else {
      // 普通题库规则：答对1分，答错一题扣1分
      points = correctCount - (totalQuestions - correctCount);
      
      // 全对积分翻倍
      if (correctCount === totalQuestions && totalQuestions > 0) {
        points *= 2;
      }
    }
    
    // 保存答题记录
    const answerRecordResult = await db.run(
      `INSERT INTO answer_records (user_id, subject_id, subcategory_id, total_questions, correct_count, time_spent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, session.subject_id, session.subcategory_id, totalQuestions, correctCount, 0]
    );
    
    const answerRecordId = answerRecordResult.insertId;
    
    // 保存到历史记录表（保持兼容），使用answer_record_id
    for (const result of results) {
      const question = sessionQuestions.find(q => q.id === result.questionId);
      if (!question) {
        continue;
      }
      
      const originalQuestion = await db.get('SELECT * FROM questions WHERE id = ?', [question.id]);
      
      if (!originalQuestion) {
        continue;
      }
      
      // 解析正确答案
      let correctAnswer = originalQuestion.correct_answer;
      try {
        const parsed = JSON.parse(correctAnswer);
        correctAnswer = typeof parsed === 'string' ? parsed : parsed;
      } catch (e) {
        // 保持原始值
      }
      
      await db.run(
        `INSERT INTO question_attempts (user_id, question_id, subject_id, subcategory_id, user_answer, correct_answer, is_correct, answer_record_id, shuffled_options)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          question.id,
          session.subject_id,
          session.subcategory_id,
          JSON.stringify(result.userAnswer),
          JSON.stringify(correctAnswer),
          result.isCorrect ? 1 : 0,
          answerRecordId,
          JSON.stringify(question.options)
        ]
      );
    }
    
    // 更新用户积分
    await db.run(
      'UPDATE users SET points = COALESCE(points, 0) + ? WHERE id = ?',
      [points, userId]
    );
    
    // 处理错题
    for (const result of results) {
      const question = sessionQuestions.find(q => q.id === result.questionId);
      if (!question) {
        continue;
      }
      
      if (!result.isCorrect) {
        // 答错题目，添加到错题巩固题库或重置正确次数
        if (session.subcategory_id === null) {
          // 错题巩固题库中答错，重置正确次数为0
          await db.run(
            `INSERT INTO error_collection (user_id, question_id, correct_count)
             VALUES (?, ?, 0)
             ON DUPLICATE KEY UPDATE correct_count = 0`,
            [userId, question.id]
          );
        } else {
          // 普通题库中答错，添加到错题巩固题库
          await db.run(
            `INSERT IGNORE INTO error_collection (user_id, question_id, correct_count)
             VALUES (?, ?, 0)`,
            [userId, question.id]
          );
        }
      } else if (session.subcategory_id === null) {
        // 错题巩固题库答对，增加正确次数
        const existingError = await db.get(
          'SELECT * FROM error_collection WHERE user_id = ? AND question_id = ?',
          [userId, question.id]
        );
        
        if (existingError) {
          const newCount = (existingError.correct_count || 0) + 1;
          if (newCount >= 3) {
            // 达到3次正确，删除错题记录
            await db.run(
              'DELETE FROM error_collection WHERE user_id = ? AND question_id = ?',
              [userId, question.id]
            );
            points += 1; // 加1分
          } else {
            await db.run(
              'UPDATE error_collection SET correct_count = ? WHERE user_id = ? AND question_id = ?',
              [newCount, userId, question.id]
            );
          }
        }
      }
    }
    
    // 如果是错题巩固且有积分，更新用户积分
    if (points > 0 && session.subcategory_id === null) {
      await db.run(
        'UPDATE users SET points = COALESCE(points, 0) + ? WHERE id = ?',
        [points, userId]
      );
    }
    
    // 准备返回数据
    const responseData = {
      score: correctCount,
      correctCount,
      totalQuestions,
      results,
      points
    };
    
    // 如果是错题巩固题库，返回更新后的统计数据
    if (session.subcategory_id === null) {
      const errorStats = await db.all(
        `SELECT question_id, correct_count FROM error_collection 
         WHERE user_id = ? AND question_id IN (${sessionQuestions.map(q => '?').join(',')})`,
        [userId, ...sessionQuestions.map(q => q.id)]
      );
      
      const stats = {};
      errorStats.forEach(stat => {
        stats[stat.question_id] = { correctCount: stat.correct_count };
      });
      
      responseData.stats = stats;
    }
    
    res.json(responseData);
  } catch (error) {
    console.error('提交答案失败:', error);
    res.status(500).json({ error: '提交答案失败' });
  }
});

// 获取历史答题记录API
router.get('/history', async (req, res) => {
  try {
    const { studentId, limit = 20 } = req.query;
    
    if (!studentId) {
      return res.status(400).json({ error: '缺少学生ID参数' });
    }
    
    const grade = req.query.grade;
    const className = req.query.class;
    
    // 查找用户ID
    const user = await db.get(
      'SELECT id FROM users WHERE student_id = ? AND grade = ? AND class = ?',
      [studentId, grade, className]
    );
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const userId = user.id;
    
    // 获取历史答题记录
    const records = await db.all(
      `SELECT 
        ar.id,
        ar.subject_id,
        ar.subcategory_id,
        ar.total_questions,
        ar.correct_count,
        ar.time_spent,
        ar.created_at,
        s.name as subject_name,
        sc.name as subcategory_name
       FROM answer_records ar
       LEFT JOIN subjects s ON ar.subject_id = s.id
       LEFT JOIN subcategories sc ON ar.subcategory_id = sc.id
       WHERE ar.user_id = ?
       ORDER BY ar.created_at DESC
       LIMIT ${parseInt(limit)}`,
      [userId]
    );
    
    res.json(records);
  } catch (error) {
    console.error('获取历史答题记录失败:', error);
    res.status(500).json({ error: '获取历史答题记录失败' });
  }
});

// 清理过期会话（定时任务）
router.post('/cleanup', async (req, res) => {
  try {
    const result = await db.run(
      'DELETE FROM quiz_sessions WHERE expires_at < NOW()'
    );
    
    res.json({
      success: true,
      deletedCount: result.affectedRows || 0
    });
  } catch (error) {
    console.error('清理过期会话失败:', error);
    res.status(500).json({ error: '清理过期会话失败' });
  }
});

module.exports = router;
