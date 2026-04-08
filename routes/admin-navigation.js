const express = require('express')
const router = express.Router()
const adminAuth = require('../middleware/adminAuth')
const navigationService = require('../services/navigationService')
const response = require('../utils/response')

// 权限检查中间件
function checkPermission(module, action) {
  return (req, res, next) => {
    try {
      // 超级管理员拥有所有权限
      if (req.admin.isSuper) {
        return next()
      }

      const permissions = req.admin.permissions
      if (!permissions || !permissions[module] || !permissions[module][action]) {
        return response.error(res, '权限不足', 403)
      }

      next()
    } catch (err) {
      console.error('权限验证失败:', err)
      response.error(res, '权限验证失败', 500)
    }
  }
}

// ============================================
// 导航菜单管理 API
// ============================================

// GET /api/admin/navigation/menus - 获取所有菜单（管理后台使用）
router.get('/menus', adminAuth, checkPermission('basic-settings', 'view'), async (req, res) => {
  try {
    const menus = await navigationService.getMenus()
    response.success(res, menus, '获取菜单列表成功')
  } catch (err) {
    console.error('获取菜单列表失败:', err)
    response.error(res, '获取菜单列表失败')
  }
})

// GET /api/admin/navigation/menus/visible - 获取可见菜单（前台导航栏使用，无需权限）
router.get('/menus/visible', async (req, res) => {
  try {
    const menus = await navigationService.getVisibleMenus()
    response.success(res, menus, '获取可见菜单成功')
  } catch (err) {
    console.error('获取可见菜单失败:', err)
    response.error(res, '获取可见菜单失败')
  }
})

// POST /api/admin/navigation/menus - 创建新菜单
router.post('/menus', adminAuth, checkPermission('basic-settings', 'edit'), async (req, res) => {
  try {
    const menu = await navigationService.createMenu(req.body)
    response.success(res, menu, '菜单创建成功')
  } catch (err) {
    console.error('创建菜单失败:', err)
    if (err.name === 'ZodError') {
      return response.error(res, '参数验证失败: ' + err.errors.map(e => e.message).join(', '), 400)
    }
    response.error(res, '创建菜单失败')
  }
})

// PUT /api/admin/navigation/menus/:id - 更新菜单
router.put('/menus/:id', adminAuth, checkPermission('basic-settings', 'edit'), async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      return response.error(res, '无效的菜单ID', 400)
    }

    const menu = await navigationService.updateMenu(id, req.body)
    response.success(res, menu, '菜单更新成功')
  } catch (err) {
    console.error('更新菜单失败:', err)
    if (err.message === '菜单不存在') {
      return response.error(res, '菜单不存在', 404)
    }
    if (err.name === 'ZodError') {
      return response.error(res, '参数验证失败: ' + err.errors.map(e => e.message).join(', '), 400)
    }
    response.error(res, '更新菜单失败')
  }
})

// DELETE /api/admin/navigation/menus/:id - 删除菜单
router.delete(
  '/menus/:id',
  adminAuth,
  checkPermission('basic-settings', 'edit'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        return response.error(res, '无效的菜单ID', 400)
      }

      const result = await navigationService.deleteMenu(id)
      response.success(res, result, '菜单删除成功')
    } catch (err) {
      console.error('删除菜单失败:', err)
      if (err.message === '菜单不存在') {
        return response.error(res, '菜单不存在', 404)
      }
      response.error(res, '删除菜单失败')
    }
  }
)

// PUT /api/admin/navigation/menus/sort - 批量更新排序
router.put(
  '/menus/sort',
  adminAuth,
  checkPermission('basic-settings', 'edit'),
  async (req, res) => {
    try {
      const { menus: menuList } = req.body
      if (!menuList || !Array.isArray(menuList)) {
        return response.error(res, 'menus 参数必须是数组', 400)
      }

      const result = await navigationService.updateSortOrder(menuList)
      response.success(res, result, '排序更新成功')
    } catch (err) {
      console.error('更新排序失败:', err)
      response.error(res, '更新排序失败')
    }
  }
)

module.exports = router
