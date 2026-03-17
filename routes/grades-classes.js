const express = require('express');
const router = express.Router();
const db = require('../services/database');
const cacheService = require('../services/cache');

// 年级相关API
router.get('/grades', async (req, res) => {
  try {
    // 尝试从缓存获取
    const cachedGrades = cacheService.get('grades');
    if (cachedGrades) {
      res.json(cachedGrades);
      return;
    }
    
    const grades = await db.all('SELECT * FROM grades ORDER BY id');
    
    // 缓存结果
    cacheService.set('grades', grades);
    res.json(grades);
  } catch (error) {
    // console.error('获取年级失败:', error);
    res.status(500).json({ error: '获取年级失败' });
  }
});

router.post('/grades', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      res.status(400).json({ error: '年级名称不能为空' });
      return;
    }
    
    const result = await db.run('INSERT INTO grades (name) VALUES (?)', [name]);
    
    // 清除缓存
    cacheService.del('grades');
    
    // 返回新添加的年级
    const newGrade = await db.get('SELECT * FROM grades WHERE id = ?', [result.lastID]);
    res.json(newGrade);
  } catch (error) {
    // console.error('添加年级失败:', error);
    res.status(500).json({ error: '添加年级失败' });
  }
});

router.put('/grades/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      res.status(400).json({ error: '年级名称不能为空' });
      return;
    }
    
    await db.run('UPDATE grades SET name = ? WHERE id = ?', [name, id]);
    
    // 清除缓存
    cacheService.del('grades');
    
    res.json({ success: true });
  } catch (error) {
    // console.error('更新年级失败:', error);
    res.status(500).json({ error: '更新年级失败' });
  }
});

router.delete('/grades/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.run('DELETE FROM grades WHERE id = ?', [id]);
    
    // 清除缓存
    cacheService.del('grades');
    
    res.json({ success: true });
  } catch (error) {
    // console.error('删除年级失败:', error);
    res.status(500).json({ error: '删除年级失败' });
  }
});

router.post('/grades/init', async (req, res) => {
  try {
    // 初始化年级数据
    // 先清空现有数据
    await db.run('DELETE FROM grades');
    
    // 插入默认年级数据
    const defaultGrades = ['1年级', '2年级', '3年级', '4年级', '5年级', '6年级'];
    for (const [index, grade] of defaultGrades.entries()) {
      await db.run('INSERT INTO grades (id, name) VALUES (?, ?)', [index + 1, grade]);
    }
    
    // 清除缓存
    cacheService.del('grades');
    res.json({ success: true, message: '年级数据初始化成功' });
  } catch (error) {
    // console.error('初始化年级数据失败:', error);
    res.status(500).json({ error: '初始化年级数据失败' });
  }
});

router.post('/grades/clear', async (req, res) => {
  try {
    // 清空年级数据
    await db.run('DELETE FROM grades');
    
    // 清除缓存
    cacheService.del('grades');
    
    res.json({ success: true, message: '年级数据清空成功' });
  } catch (error) {
    // console.error('清空年级数据失败:', error);
    res.status(500).json({ error: '清空年级数据失败' });
  }
});

// 班级相关API
router.get('/classes', async (req, res) => {
  try {
    // 尝试从缓存获取
    const cachedClasses = cacheService.get('classes');
    if (cachedClasses) {
      res.json(cachedClasses);
      return;
    }
    
    const classes = await db.all('SELECT * FROM classes ORDER BY id');
    
    // 缓存结果
    cacheService.set('classes', classes);
    res.json(classes);
  } catch (error) {
    // console.error('获取班级失败:', error);
    res.status(500).json({ error: '获取班级失败' });
  }
});

router.post('/classes', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      res.status(400).json({ error: '班级名称不能为空' });
      return;
    }
    
    const result = await db.run('INSERT INTO classes (name) VALUES (?)', [name]);
    
    // 清除缓存
    cacheService.del('classes');
    
    // 返回新添加的班级
    const newClass = await db.get('SELECT * FROM classes WHERE id = ?', [result.lastID]);
    res.json(newClass);
  } catch (error) {
    // console.error('添加班级失败:', error);
    res.status(500).json({ error: '添加班级失败' });
  }
});

router.put('/classes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      res.status(400).json({ error: '班级名称不能为空' });
      return;
    }
    
    await db.run('UPDATE classes SET name = ? WHERE id = ?', [name, id]);
    
    // 清除缓存
    cacheService.del('classes');
    
    res.json({ success: true });
  } catch (error) {
    // console.error('更新班级失败:', error);
    res.status(500).json({ error: '更新班级失败' });
  }
});

router.delete('/classes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.run('DELETE FROM classes WHERE id = ?', [id]);
    
    // 清除缓存
    cacheService.del('classes');
    
    res.json({ success: true });
  } catch (error) {
    // console.error('删除班级失败:', error);
    res.status(500).json({ error: '删除班级失败' });
  }
});

router.post('/classes/init', async (req, res) => {
  try {
    // 初始化班级数据
    // 先清空现有数据
    await db.run('DELETE FROM classes');
    
    // 插入默认班级数据
    const defaultClasses = ['1班', '2班', '3班', '4班', '5班', '6班', '7班', '8班', '9班', '10班'];
    for (const [index, className] of defaultClasses.entries()) {
      await db.run('INSERT INTO classes (id, name) VALUES (?, ?)', [index + 1, className]);
    }
    
    // 清除缓存
    cacheService.del('classes');
    res.json({ success: true, message: '班级数据初始化成功' });
  } catch (error) {
    // console.error('初始化班级数据失败:', error);
    res.status(500).json({ error: '初始化班级数据失败' });
  }
});

router.post('/classes/clear', async (req, res) => {
  try {
    // 清空班级数据
    await db.run('DELETE FROM classes');
    
    // 清除缓存
    cacheService.del('classes');
    
    res.json({ success: true, message: '班级数据清空成功' });
  } catch (error) {
    // console.error('清空班级数据失败:', error);
    res.status(500).json({ error: '清空班级数据失败' });
  }
});

module.exports = router;