const express = require('express');
const router = express.Router();
const db = require('../services/database');

// 获取所有设置
router.get('/', async (req, res) => {
  try {
    const settings = await db.all('SELECT key, value FROM settings');
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    res.json(settingsObj);
  } catch (error) {
    // console.error('获取设置失败:', error);
    res.status(500).json({ error: '获取设置失败' });
  }
});

// 保存设置
router.post('/', async (req, res) => {
  try {
    const settings = req.body;
    
    if (!settings || typeof settings !== 'object') {
      res.status(400).json({ error: '设置数据格式错误' });
      return;
    }
    
    const total = Object.keys(settings).length;
    if (total === 0) {
      res.json({ success: true, message: '设置保存成功' });
      return;
    }
    
    for (const [key, value] of Object.entries(settings)) {
      // 使用UPSERT操作：如果键存在则更新，不存在则插入
      await db.run(
        'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP',
        [key, value, value]
      );
    }
    
    res.json({ success: true, message: '设置保存成功' });
  } catch (error) {
    // console.error('保存设置失败:', error);
    res.status(500).json({ error: '保存设置失败' });
  }
});

module.exports = router;