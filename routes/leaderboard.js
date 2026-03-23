const express = require('express');
const router = express.Router();
const db = require('../services/database');
const cacheService = require('../services/cache');
const { validateSubjectId } = require('../services/validationService');

// 全局排行榜API
router.get('/global', async (req, res) => {
  try {
    const { limit = 20, page = 1, grade, class: className, id, student_id, subjectId } = req.query;
    
    // 生成缓存键
    const cacheKey = cacheService.generateLeaderboardKey({ 
      subjectId, 
      grade, 
      className, 
      limit,
      page,
      id,
      student_id
    });
    
    // 尝试从缓存获取
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      // 更新缓存时间戳（滑动过期）
      cacheService.touch(cacheKey, cacheService.CACHE_DURATIONS.LEADERBOARD);
      res.json(cachedData);
      return;
    }
    
    // 计算偏移量
    const limitNum = limit === '0' ? 0 : (Number(limit) || 20);
    const pageNum = Math.max(1, Number(page) || 1);
    const offset = (pageNum - 1) * limitNum;
    
    // 先查询总数
    let countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      JOIN answer_records ar ON u.id = ar.user_id
      WHERE 1=1
    `;
    
    const countParams = [];
    
    if (id) {
      countQuery += ' AND u.id = ?';
      countParams.push(id);
      // 当使用id查询时，也可以使用grade和class进行过滤
      if (grade) {
        countQuery += ' AND u.grade = ?';
        countParams.push(grade);
      }
      if (className) {
        countQuery += ' AND u.class = ?';
        countParams.push(className);
      }
    } else if (student_id) {
      countQuery += ' AND u.student_id = ?';
      countParams.push(student_id);
      // 当使用student_id查询时，确保同时使用grade和class进行过滤
      if (grade) {
        countQuery += ' AND u.grade = ?';
        countParams.push(grade);
      }
      if (className) {
        countQuery += ' AND u.class = ?';
        countParams.push(className);
      }
    } else {
      // 当不使用student_id和id查询时，可以单独使用grade或class进行过滤
      if (grade) {
        countQuery += ' AND u.grade = ?';
        countParams.push(grade);
      }
      if (className) {
        countQuery += ' AND u.class = ?';
        countParams.push(className);
      }
    }
    
    // 学科筛选
    if (subjectId) {
      if (!validateSubjectId(subjectId)) {
        return res.status(400).json({ error: '学科ID格式错误' });
      }
      countQuery += ' AND ar.subject_id = ?';
      countParams.push(parseInt(subjectId));
    }
    
    const countResult = await db.get(countQuery, countParams);
    const total = countResult ? countResult.total : 0;
    
    // 查询数据
    let dataQuery = `
      SELECT u.id, u.student_id, u.name, u.grade, u.class, u.points,
             COUNT(DISTINCT ar.id) as total_sessions,
             SUM(ar.total_questions) as total_questions,
             SUM(ar.correct_count) as correct_count,
             CASE WHEN SUM(ar.total_questions) > 0 THEN
               (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions)
             ELSE 0 END as avg_accuracy
      FROM users u
      JOIN answer_records ar ON u.id = ar.user_id
      WHERE 1=1
    `;
    
    const dataParams = [];
    
    if (id) {
      dataQuery += ' AND u.id = ?';
      dataParams.push(id);
      // 当使用id查询时，也可以使用grade和class进行过滤
      if (grade) {
        dataQuery += ' AND u.grade = ?';
        dataParams.push(grade);
      }
      if (className) {
        dataQuery += ' AND u.class = ?';
        dataParams.push(className);
      }
    } else if (student_id) {
      dataQuery += ' AND u.student_id = ?';
      dataParams.push(student_id);
      // 当使用student_id查询时，确保同时使用grade和class进行过滤
      if (grade) {
        dataQuery += ' AND u.grade = ?';
        dataParams.push(grade);
      }
      if (className) {
        dataQuery += ' AND u.class = ?';
        dataParams.push(className);
      }
    } else {
      // 当不使用student_id和id查询时，可以单独使用grade或class进行过滤
      if (grade) {
        dataQuery += ' AND u.grade = ?';
        dataParams.push(grade);
      }
      if (className) {
        dataQuery += ' AND u.class = ?';
        dataParams.push(className);
      }
    }
    
    // 学科筛选
    if (subjectId) {
      if (!validateSubjectId(subjectId)) {
        return res.status(400).json({ error: '学科ID格式错误' });
      }
      dataQuery += ' AND ar.subject_id = ?';
      dataParams.push(parseInt(subjectId));
    }
    
    dataQuery += ' GROUP BY u.id ORDER BY avg_accuracy DESC, total_questions DESC';
    
    // 添加LIMIT和OFFSET子句
    if (limitNum > 0) {
      dataQuery += ` LIMIT ${limitNum} OFFSET ${offset}`;
    }
    
    const users = await db.all(dataQuery, dataParams);
    
    // 构建响应数据
    const responseData = {
      total,
      page: pageNum,
      pageSize: limitNum,
      data: users
    };
    
    // 缓存结果
    cacheService.set(cacheKey, responseData, cacheService.CACHE_DURATIONS.LEADERBOARD);
    
    res.json(responseData);
  } catch (error) {
    console.error('获取排行榜数据失败:', error);
    res.status(500).json({ error: '获取排行榜数据失败', message: error.message });
  }
});

// 学科排行榜API
router.get('/subject/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { grade, class: className, subcategoryId, limit = 20, page = 1 } = req.query;
    
    // 生成缓存键
    const cacheKey = cacheService.generateLeaderboardKey({ 
      subjectId, 
      grade, 
      className, 
      subcategoryId,
      limit,
      page
    });
    
    // 尝试从缓存获取
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      // 更新缓存时间戳（滑动过期）
      cacheService.touch(cacheKey, cacheService.CACHE_DURATIONS.LEADERBOARD);
      res.json(cachedData);
      return;
    }
    
    // 计算偏移量
    const limitNum = limit === '0' ? 0 : (Number(limit) || 20);
    const pageNum = Math.max(1, Number(page) || 1);
    const offset = (pageNum - 1) * limitNum;
    
    // 先查询总数
    let countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      JOIN answer_records ar ON u.id = ar.user_id
      WHERE ar.subject_id = ?
    `;
    
    const countParams = [subjectId];
    
    if (subcategoryId) {
      countQuery += ' AND ar.subcategory_id = ?';
      countParams.push(subcategoryId);
    }
    
    if (grade) {
      countQuery += ' AND u.grade = ?';
      countParams.push(grade);
    }
    
    if (className) {
      countQuery += ' AND u.class = ?';
      countParams.push(className);
    }
    
    const countResult = await db.get(countQuery, countParams);
    const total = countResult ? countResult.total : 0;
    
    // 查询数据
    let dataQuery = `
      SELECT u.id, u.student_id, u.name, u.grade, u.class, u.points,
             COUNT(DISTINCT ar.id) as total_sessions,
             SUM(ar.total_questions) as total_questions,
             SUM(ar.correct_count) as correct_count,
             CASE WHEN SUM(ar.total_questions) > 0 THEN
               (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions)
             ELSE 0 END as avg_accuracy
      FROM users u
      JOIN answer_records ar ON u.id = ar.user_id
      WHERE ar.subject_id = ?
    `;
    
    const dataParams = [subjectId];
    
    if (subcategoryId) {
      dataQuery += ' AND ar.subcategory_id = ?';
      dataParams.push(subcategoryId);
    }
    
    if (grade) {
      dataQuery += ' AND u.grade = ?';
      dataParams.push(grade);
    }
    
    if (className) {
      dataQuery += ' AND u.class = ?';
      dataParams.push(className);
    }
    
    dataQuery += ' GROUP BY u.id ORDER BY avg_accuracy DESC, total_questions DESC';
    
    // 添加LIMIT和OFFSET子句
    if (limitNum > 0) {
      dataQuery += ` LIMIT ${limitNum} OFFSET ${offset}`;
    }
    
    const users = await db.all(dataQuery, dataParams);
    
    // 构建响应数据
    const responseData = {
      total,
      page: pageNum,
      pageSize: limitNum,
      data: users
    };
    
    // 缓存结果
    cacheService.set(cacheKey, responseData, cacheService.CACHE_DURATIONS.LEADERBOARD);
    
    res.json(responseData);
  } catch (error) {
    // console.error('获取学科排行榜数据失败:', error);
    res.status(500).json({ error: '获取学科排行榜数据失败' });
  }
});

// TOP10排行榜API（每周统计）
router.get('/top10', async (req, res) => {
  try {
    const { subjectId } = req.query;
    
    // 预计算本周开始和结束日期，避免在SQL中重复计算
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 计算到本周一的差值
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const startDateStr = startOfWeek.toISOString().slice(0, 19).replace('T', ' ');
    const endDateStr = endOfWeek.toISOString().slice(0, 19).replace('T', ' ');
    
    let query = `
      SELECT u.id, u.student_id, u.name, u.grade, u.class,
             COUNT(DISTINCT ar.id) as total_sessions,
             SUM(ar.total_questions) as total_questions,
             SUM(ar.correct_count) as correct_count,
             CASE WHEN SUM(ar.total_questions) > 0 THEN
               (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions)
             ELSE 0 END as avg_accuracy,
             SUM(
               CASE 
                 WHEN ar.total_questions = ar.correct_count AND ar.total_questions > 0 THEN
                   (ar.correct_count - (ar.total_questions - ar.correct_count)) * 2
                 ELSE
                   ar.correct_count - (ar.total_questions - ar.correct_count)
               END
             ) as points
      FROM users u
      JOIN answer_records ar ON u.id = ar.user_id
      WHERE 1=1
      AND ar.created_at >= ? AND ar.created_at <= ?
    `;
    
    const params = [startDateStr, endDateStr];
    
    // 学科筛选
    if (subjectId) {
      if (!validateSubjectId(subjectId)) {
        return res.status(400).json({ error: '学科ID格式错误' });
      }
      query += ' AND ar.subject_id = ?';
      params.push(parseInt(subjectId));
    }
    
    query += ' GROUP BY u.id HAVING SUM(ar.total_questions) >= 20 ORDER BY points DESC, avg_accuracy DESC, total_questions DESC LIMIT 10';
    
    const users = await db.all(query, params);
    res.json(users);
  } catch (error) {
    // console.error('获取TOP10排行榜数据失败:', error);
    res.status(500).json({ error: '获取TOP10排行榜数据失败' });
  }
});

// 清空排行榜数据
router.post('/clear', async (req, res) => {
  try {
    // 清空答题记录
    await db.run('DELETE FROM question_attempts');
    await db.run('DELETE FROM answer_records');
    
    // 清除相关缓存
    cacheService.del('analysis');
    cacheService.del('error_prone_questions');
    
    res.json({ success: true, message: '排行榜数据清空成功' });
  } catch (error) {
    // console.error('清空排行榜数据失败:', error);
    res.status(500).json({ error: '清空排行榜数据失败' });
  }
});

module.exports = router;