const express = require('express');
const router = express.Router();
const difficultyService = require('../services/difficultyService');

// 调整题目难度
router.post('/question/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const result = await difficultyService.adjustQuestionDifficulty(questionId);
    res.json(result);
  } catch (error) {
    console.error('调整题目难度失败:', error);
    res.status(500).json({ success: false, message: '调整难度失败' });
  }
});

// 批量调整题目难度
router.post('/batch', async (req, res) => {
  try {
    const result = await difficultyService.batchAdjustQuestionDifficulty();
    res.json(result);
  } catch (error) {
    console.error('批量调整题目难度失败:', error);
    res.status(500).json({ success: false, message: '批量调整难度失败' });
  }
});

// 手动设置题目难度
router.put('/question/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const { difficulty } = req.body;
    const result = await difficultyService.setQuestionDifficulty(questionId, difficulty);
    res.json(result);
  } catch (error) {
    console.error('设置题目难度失败:', error);
    res.status(500).json({ success: false, message: '设置难度失败' });
  }
});

// 手动设置题库难度
router.put('/subcategory/:subcategoryId', async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    const { difficulty } = req.body;
    const result = await difficultyService.setSubcategoryDifficulty(subcategoryId, difficulty);
    res.json(result);
  } catch (error) {
    console.error('设置题库难度失败:', error);
    res.status(500).json({ success: false, message: '设置难度失败' });
  }
});

// 获取题目难度分布
router.get('/distribution', async (req, res) => {
  try {
    const result = await difficultyService.getQuestionDifficultyDistribution();
    res.json(result);
  } catch (error) {
    console.error('获取难度分布失败:', error);
    res.status(500).json({ success: false, message: '获取难度分布失败' });
  }
});

module.exports = router;