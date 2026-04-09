const express = require('express')
const router = express.Router()
const tagService = require('../services/tagService')
const adminAuth = require('../middleware/adminAuth')
const response = require('../utils/response')

// 验证权限的中间件
const checkPermission = (module, action) => {
  return (req, res, next) => {
    // 这里简化处理，实际应该从权限系统获取
    if (
      req.admin &&
      (req.admin.role_id === 1 || req.admin.permissions.includes(`${module}:${action}`))
    ) {
      next()
    } else {
      response.error(res, '权限不足', 403)
    }
  }
}

// 获取标签列表
router.get('/', adminAuth, checkPermission('content-management', 'view'), async (req, res) => {
  try {
    const tags = await tagService.getAllTags()
    response.success(res, tags, '获取标签列表成功')
  } catch (error) {
    response.error(res, error.message, 500)
  }
})

// 获取标签详情
router.get('/:id', adminAuth, checkPermission('content-management', 'view'), async (req, res) => {
  try {
    const tag = await tagService.getTagById(req.params.id)
    if (!tag) {
      response.error(res, '标签不存在', 404)
      return
    }
    response.success(res, tag, '获取标签详情成功')
  } catch (error) {
    response.error(res, error.message, 500)
  }
})

// 创建标签
router.post('/', adminAuth, checkPermission('content-management', 'edit'), async (req, res) => {
  try {
    // 检查 slug 是否已存在
    if (await tagService.slugExists(req.body.slug)) {
      response.error(res, '标签标识已存在', 400)
      return
    }

    const tag = await tagService.createTag(req.body)
    response.success(res, tag, '创建标签成功')
  } catch (error) {
    response.error(res, error.message, 500)
  }
})

// 更新标签
router.put('/:id', adminAuth, checkPermission('content-management', 'edit'), async (req, res) => {
  try {
    // 检查标签是否存在
    if (!(await tagService.tagExists(req.params.id))) {
      response.error(res, '标签不存在', 404)
      return
    }

    // 检查 slug 是否已存在（排除当前标签）
    if (await tagService.slugExists(req.body.slug, req.params.id)) {
      response.error(res, '标签标识已存在', 400)
      return
    }

    const tag = await tagService.updateTag(req.params.id, req.body)
    response.success(res, tag, '更新标签成功')
  } catch (error) {
    response.error(res, error.message, 500)
  }
})

// 删除标签
router.delete(
  '/:id',
  adminAuth,
  checkPermission('content-management', 'edit'),
  async (req, res) => {
    try {
      // 检查标签是否存在
      if (!(await tagService.tagExists(req.params.id))) {
        response.error(res, '标签不存在', 404)
        return
      }

      const success = await tagService.deleteTag(req.params.id)
      if (success) {
        response.success(res, null, '删除标签成功')
      } else {
        response.error(res, '标签不存在', 404)
      }
    } catch (error) {
      response.error(res, error.message, 500)
    }
  }
)

module.exports = router
