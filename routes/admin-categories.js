const express = require('express')
const router = express.Router()
const categoryService = require('../services/categoryService')
const adminAuth = require('../middleware/adminAuth')
const response = require('../utils/response')

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

// 获取分类列表
router.get('/', adminAuth, checkPermission('content-management', 'view'), async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories()
    response.success(res, categories, '获取分类列表成功')
  } catch (error) {
    response.error(res, error.message, 500)
  }
})

// 获取分类详情
router.get('/:id', adminAuth, checkPermission('content-management', 'view'), async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id)
    if (!category) {
      response.error(res, '分类不存在', 404)
      return
    }
    response.success(res, category, '获取分类详情成功')
  } catch (error) {
    response.error(res, error.message, 500)
  }
})

// 创建分类
router.post('/', adminAuth, checkPermission('content-management', 'edit'), async (req, res) => {
  try {
    // 检查 slug 是否已存在
    if (await categoryService.slugExists(req.body.slug)) {
      response.error(res, '分类标识已存在', 400)
      return
    }

    const category = await categoryService.createCategory(req.body)
    response.success(res, category, '创建分类成功')
  } catch (error) {
    response.error(res, error.message, 500)
  }
})

// 更新分类
router.put('/:id', adminAuth, checkPermission('content-management', 'edit'), async (req, res) => {
  try {
    // 检查分类是否存在
    if (!(await categoryService.categoryExists(req.params.id))) {
      response.error(res, '分类不存在', 404)
      return
    }

    // 检查 slug 是否已存在（排除当前分类）
    if (await categoryService.slugExists(req.body.slug, req.params.id)) {
      response.error(res, '分类标识已存在', 400)
      return
    }

    const category = await categoryService.updateCategory(req.params.id, req.body)
    response.success(res, category, '更新分类成功')
  } catch (error) {
    response.error(res, error.message, 500)
  }
})

// 删除分类
router.delete(
  '/:id',
  adminAuth,
  checkPermission('content-management', 'edit'),
  async (req, res) => {
    try {
      // 检查分类是否存在
      if (!(await categoryService.categoryExists(req.params.id))) {
        response.error(res, '分类不存在', 404)
        return
      }

      const success = await categoryService.deleteCategory(req.params.id)
      if (success) {
        response.success(res, null, '删除分类成功')
      } else {
        response.error(res, '分类不存在', 404)
      }
    } catch (error) {
      response.error(res, error.message, 500)
    }
  }
)

module.exports = router
