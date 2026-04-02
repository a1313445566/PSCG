/**
 * 工具元数据 API
 * 文件: routes/tools.js
 */

const express = require('express')
const router = express.Router()
const { toolsMetadata, categories } = require('../services/chat/toolsMetadata')

/**
 * 获取所有工具元数据
 */
router.get('/metadata', (req, res) => {
  try {
    // 深拷贝并确保quickQuestions是数组
    const formattedTools = toolsMetadata.map(tool => ({
      ...tool,
      quickQuestions: Array.isArray(tool.quickQuestions) ? tool.quickQuestions : [],
      requiredParams: Array.isArray(tool.requiredParams) ? tool.requiredParams : [],
      optionalParams: Array.isArray(tool.optionalParams) ? tool.optionalParams : []
    }))

    res.json({
      code: 0,
      msg: 'success',
      data: {
        tools: formattedTools,
        categories
      }
    })
  } catch (error) {
    console.error('[Tools API] 获取工具元数据失败:', error)
    res.status(500).json({ code: 1, msg: '获取工具元数据失败', error: error.message })
  }
})

/**
 * 获取指定分类的工具
 */
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params
    const tools = toolsMetadata.filter(t => t.category === category)

    res.json({
      code: 0,
      msg: 'success',
      data: tools
    })
  } catch (error) {
    console.error('[Tools API] 获取分类工具失败:', error)
    res.status(500).json({ code: 1, msg: '获取分类工具失败', error: error.message })
  }
})

/**
 * 获取单个工具详情
 */
router.get('/detail/:name', (req, res) => {
  try {
    const { name } = req.params
    const tool = toolsMetadata.find(t => t.name === name)

    if (!tool) {
      return res.status(404).json({ code: 1, msg: '工具不存在' })
    }

    res.json({
      code: 0,
      msg: 'success',
      data: tool
    })
  } catch (error) {
    console.error('[Tools API] 获取工具详情失败:', error)
    res.status(500).json({ code: 1, msg: '获取工具详情失败', error: error.message })
  }
})

module.exports = router
