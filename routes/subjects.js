const express = require('express');
const router = express.Router();
const db = require('../services/database');
const cacheService = require('../services/cache');

// 获取所有学科（包含子分类）
router.get('/', async (req, res) => {
  try {
    // 尝试从缓存获取
    const cachedSubjects = cacheService.get('subjects');
    if (cachedSubjects) {
      res.json(cachedSubjects);
      return;
    }
    
    const subjects = await db.all('SELECT * FROM subjects ORDER BY sort_order ASC');

    
    // 为每个学科获取子分类
    for (const subject of subjects) {
      const subcategories = await db.all('SELECT * FROM subcategories WHERE subject_id = ? ORDER BY sort_order ASC', [subject.id]);

      subject.subcategories = subcategories || [];
    }
    
    // 转换所有学科的字段名
    const subjectsWithCamelCase = subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      iconIndex: subject.icon_index,
      subcategories: subject.subcategories.map(subcat => ({
        id: subcat.id,
        subjectId: subcat.subject_id,
        name: subcat.name,
        iconIndex: subcat.icon_index
      }))
    }));
    
    // 缓存结果
    cacheService.set('subjects', subjectsWithCamelCase);
    res.json(subjectsWithCamelCase);
  } catch (error) {

    res.status(500).json({ error: '获取学科失败' });
  }
});

// 获取指定学科的子分类
router.get('/:id/subcategories', async (req, res) => {
  try {
    const subjectId = req.params.id;
    const cacheKey = cacheService.generateSubcategoryKey(subjectId);
    
    // 尝试从缓存获取
    const cachedSubcategories = cacheService.get(cacheKey);
    if (cachedSubcategories) {
      res.json(cachedSubcategories);
      return;
    }
    
    const subcategories = await db.all('SELECT * FROM subcategories WHERE subject_id = ? ORDER BY sort_order ASC', [subjectId]);

    
    // 缓存结果
    cacheService.set(cacheKey, subcategories);
    res.json(subcategories);
  } catch (error) {

    res.status(500).json({ error: '获取子分类失败' });
  }
});

// 添加学科
router.post('/', async (req, res) => {
  try {
    const { name, iconIndex = 0 } = req.body;
    
    if (!name) {
      res.status(400).json({ error: '学科名称不能为空' });
      return;
    }
    
    const result = await db.run('INSERT INTO subjects (name, icon_index) VALUES (?, ?)', [name, iconIndex]);
    
    // 清除缓存
    cacheService.del('subjects');
    
    // 返回新添加的学科
    const newSubject = await db.get('SELECT * FROM subjects WHERE id = ?', [result.insertId]);
    // 转换字段名为驼峰命名
    const formattedSubject = {
      id: newSubject.id,
      name: newSubject.name,
      iconIndex: newSubject.icon_index
    };
    res.json(formattedSubject);
  } catch (error) {

    res.status(500).json({ error: '添加学科失败' });
  }
});

// 更新学科排序
router.put('/sort', async (req, res) => {
  try {
    const { subjectOrder } = req.body;
    
    if (!Array.isArray(subjectOrder)) {
      res.status(400).json({ error: '学科排序数据格式错误' });
      return;
    }
    
    // 开启事务
    await db.run('START TRANSACTION');
    
    try {
      // 更新每个学科的排序值
      for (let i = 0; i < subjectOrder.length; i++) {
        const subjectId = subjectOrder[i];
        await db.run('UPDATE subjects SET sort_order = ? WHERE id = ?', [i, subjectId]);
      }
      
      // 提交事务
      await db.run('COMMIT');
      
      // 清除缓存
      cacheService.del('subjects');
      
      res.json({ success: true });
    } catch (error) {
      // 回滚事务
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {

    res.status(500).json({ error: '更新学科排序失败' });
  }
});

// 更新学科
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, iconIndex } = req.body;
    
    if (!name) {
      res.status(400).json({ error: '学科名称不能为空' });
      return;
    }
    
    await db.run('UPDATE subjects SET name = ?, icon_index = ? WHERE id = ?', [name, iconIndex, id]);
    
    // 清除缓存
    cacheService.del('subjects');
    
    // 获取更新后的学科
    const updatedSubject = await db.get('SELECT * FROM subjects WHERE id = ?', [id]);
    // 转换字段名为驼峰命名
    const formattedSubject = {
      id: updatedSubject.id,
      name: updatedSubject.name,
      iconIndex: updatedSubject.icon_index
    };
    res.json(formattedSubject);
  } catch (error) {

    res.status(500).json({ error: '更新学科失败' });
  }
});

// 删除学科
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.run('DELETE FROM subjects WHERE id = ?', [id]);
    
    // 清除缓存
    cacheService.del('subjects');
    
    res.json({ success: true });
  } catch (error) {

    res.status(500).json({ error: '删除学科失败' });
  }
});

// 添加子分类
router.post('/:subjectId/subcategories', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { name, iconIndex = 0 } = req.body;
    
    if (!name) {
      res.status(400).json({ error: '子分类名称不能为空' });
      return;
    }
    
    const result = await db.run('INSERT INTO subcategories (subject_id, name, icon_index) VALUES (?, ?, ?)', [subjectId, name, iconIndex]);
    
    // 清除缓存
    cacheService.del('subjects');
    cacheService.del(cacheService.generateSubcategoryKey(subjectId));
    
    // 返回新添加的子分类
    const newSubcategory = await db.get('SELECT * FROM subcategories WHERE id = ?', [result.insertId]);
    // 转换字段名为驼峰命名
    const formattedSubcategory = {
      id: newSubcategory.id,
      subjectId: newSubcategory.subject_id,
      name: newSubcategory.name,
      iconIndex: newSubcategory.icon_index
    };
    res.json(formattedSubcategory);
  } catch (error) {

    res.status(500).json({ error: '添加子分类失败' });
  }
});

// 更新子分类
router.put('/subcategories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, iconIndex } = req.body;
    
    if (!name) {
      res.status(400).json({ error: '子分类名称不能为空' });
      return;
    }
    
    // 获取子分类信息，用于清除缓存
    const subcategory = await db.get('SELECT * FROM subcategories WHERE id = ?', [id]);
    
    await db.run('UPDATE subcategories SET name = ?, icon_index = ? WHERE id = ?', [name, iconIndex, id]);
    
    // 清除缓存
    cacheService.del('subjects');
    if (subcategory) {
      cacheService.del(cacheService.generateSubcategoryKey(subcategory.subject_id));
    }
    
    // 获取更新后的子分类
    const updatedSubcategory = await db.get('SELECT * FROM subcategories WHERE id = ?', [id]);
    // 转换字段名为驼峰命名
    const formattedSubcategory = {
      id: updatedSubcategory.id,
      subjectId: updatedSubcategory.subject_id,
      name: updatedSubcategory.name,
      iconIndex: updatedSubcategory.icon_index
    };
    res.json(formattedSubcategory);
  } catch (error) {

    res.status(500).json({ error: '更新子分类失败' });
  }
});

// 删除子分类
router.delete('/subcategories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取子分类信息，用于清除缓存
    const subcategory = await db.get('SELECT * FROM subcategories WHERE id = ?', [id]);
    
    await db.run('DELETE FROM subcategories WHERE id = ?', [id]);
    
    // 清除缓存
    cacheService.del('subjects');
    if (subcategory) {
      cacheService.del(cacheService.generateSubcategoryKey(subcategory.subject_id));
    }
    
    res.json({ success: true });
} catch (error) {

  res.status(500).json({ error: '删除子分类失败' });
}
});

// 更新子分类排序
router.put('/:subjectId/subcategories/sort', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { subcategoryOrder } = req.body;
    
    if (!Array.isArray(subcategoryOrder)) {
      res.status(400).json({ error: '子分类排序数据格式错误' });
      return;
    }
    
    // 开启事务
    await db.run('START TRANSACTION');
    
    try {
      // 更新每个子分类的排序值
      for (let i = 0; i < subcategoryOrder.length; i++) {
        const subcategoryId = subcategoryOrder[i];
        await db.run('UPDATE subcategories SET sort_order = ? WHERE id = ? AND subject_id = ?', [i, subcategoryId, subjectId]);
      }
      
      // 提交事务
      await db.run('COMMIT');
      
      // 清除缓存
      cacheService.del('subjects');
      cacheService.del(cacheService.generateSubcategoryKey(subjectId));
      
      res.json({ success: true });
    } catch (error) {
      // 回滚事务
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {

    res.status(500).json({ error: '更新子分类排序失败' });
  }
});

module.exports = router;