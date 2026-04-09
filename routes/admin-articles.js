const express = require('express')
const router = express.Router()
const articleService = require('../services/articleService')
const adminAuth = require('../middleware/adminAuth')
const response = require('../utils/response')
const multer = require('../config/multer')

// 验证权限的中间件
const checkPermission = (module, action) => {
  return (req, res, next) => {
    // 这里简化处理，实际应该从权限系统获取
    if (
      req.admin &&
      (req.admin.isSuper || (req.admin.permissions[module] && req.admin.permissions[module][action]))
    ) {
      next()
    } else {
      response.error(res, '权限不足', 403)
    }
  }
}

// 获取文章列表
router.get('/', adminAuth, checkPermission('content-management', 'view'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 12
    const isPublished = req.query.isPublished === 'true'

    const result = await articleService.getArticles(page, pageSize, isPublished)
    response.success(res, result, '获取文章列表成功')
  } catch (error) {
    response.error(res, error.message, 500)
  }
})

// 获取文章详情
router.get('/:id', adminAuth, checkPermission('content-management', 'view'), async (req, res) => {
  try {
    const article = await articleService.getArticleById(req.params.id)
    if (!article) {
      response.error(res, '文章不存在', 404)
      return
    }
    response.success(res, article, '获取文章详情成功')
  } catch (error) {
    response.error(res, error.message, 500)
  }
})

// 创建文章
router.post('/', adminAuth, checkPermission('content-management', 'edit'), async (req, res) => {
  try {
    console.log('[admin-articles] POST / - 请求数据:', req.body)
    const article = await articleService.createArticle(req.body)
    console.log('[admin-articles] 创建成功:', article)
    response.success(res, article, '创建文章成功')
  } catch (error) {
    console.error('[admin-articles] 创建文章失败:', error)
    response.error(res, error.message, 500)
  }
})

// 更新文章
router.put('/:id', adminAuth, checkPermission('content-management', 'edit'), async (req, res) => {
  try {
    const article = await articleService.updateArticle(req.params.id, req.body)
    if (!article) {
      response.error(res, '文章不存在', 404)
      return
    }
    response.success(res, article, '更新文章成功')
  } catch (error) {
    response.error(res, error.message, 500)
  }
})

// 删除文章
router.delete(
  '/:id',
  adminAuth,
  checkPermission('content-management', 'edit'),
  async (req, res) => {
    try {
      const success = await articleService.deleteArticle(req.params.id)
      if (success) {
        response.success(res, null, '删除文章成功')
      } else {
        response.error(res, '文章不存在', 404)
      }
    } catch (error) {
      response.error(res, error.message, 500)
    }
  }
)

// 上传封面图
router.post(
  '/upload',
  adminAuth,
  checkPermission('content-management', 'edit'),
  multer.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        response.error(res, '请选择文件', 400)
        return
      }

      const fileUrl = `/uploads/${req.file.filename}`
      response.success(res, { url: fileUrl }, '上传成功')
    } catch (error) {
      response.error(res, error.message, 500)
    }
  }
)

module.exports = router
