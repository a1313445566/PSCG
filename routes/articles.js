const express = require('express')
const router = express.Router()
const articleService = require('../services/articleService')
const response = require('../utils/response')

// 获取文章列表（公开）
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 12

    const result = await articleService.getArticles(page, pageSize, true)
    response.success(res, result, '获取文章列表成功')
  } catch (error) {
    response.error(res, error.message, 500)
  }
})

// 获取文章详情（公开）
router.get('/:id', async (req, res) => {
  try {
    const article = await articleService.getArticleById(req.params.id, true) // 增加浏览次数
    if (!article) {
      response.error(res, 404, '文章不存在')
      return
    }

    // 只返回已发布的文章
    if (!article.is_published) {
      response.error(res, 404, '文章不存在')
      return
    }

    response.success(res, article, '获取文章详情成功')
  } catch (error) {
    response.error(res, error.message, 500)
  }
})

// 根据分类获取文章（公开）
router.get('/category/:id', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 12

    const result = await articleService.getArticlesByCategory(req.params.id, page, pageSize)
    response.success(res, result, '获取分类文章成功')
  } catch (error) {
    response.error(res, error.message, 500)
  }
})

module.exports = router
