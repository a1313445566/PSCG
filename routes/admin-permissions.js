const express = require('express')
const router = express.Router()
const adminAuth = require('../middleware/adminAuth')
const permissionService = require('../services/permissionService')
const response = require('../utils/response')

function checkPermission(module, action) {
  return (req, res, next) => {
    try {
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

router.get('/roles', adminAuth, checkPermission('admin-roles', 'view'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const result = await permissionService.getRoles(page, limit)
    response.success(res, result, '获取角色列表成功')
  } catch (err) {
    console.error('获取角色列表失败:', err)
    response.error(res, '获取角色列表失败')
  }
})

router.get('/roles/:id', adminAuth, checkPermission('admin-roles', 'view'), async (req, res) => {
  try {
    const role = await permissionService.getRoleById(req.params.id)
    if (!role) {
      return response.error(res, '角色不存在', 404)
    }
    response.success(res, role, '获取角色详情成功')
  } catch (err) {
    console.error('获取角色详情失败:', err)
    response.error(res, '获取角色详情失败')
  }
})

router.post('/roles', adminAuth, checkPermission('admin-roles', 'create'), async (req, res) => {
  try {
    const role = await permissionService.createRole(req.body)
    response.success(res, role, '角色创建成功')
  } catch (err) {
    console.error('创建角色失败:', err)
    if (err.name === 'ZodError') {
      return response.error(res, '参数验证失败', 400)
    }
    response.error(res, '创建角色失败')
  }
})

router.put('/roles/:id', adminAuth, checkPermission('admin-roles', 'edit'), async (req, res) => {
  try {
    const role = await permissionService.updateRole(req.params.id, req.body)
    response.success(res, role, '角色更新成功')
  } catch (err) {
    console.error('更新角色失败:', err)
    if (err.name === 'ZodError') {
      return response.error(res, '参数验证失败', 400)
    }
    response.error(res, '更新角色失败')
  }
})

router.delete(
  '/roles/:id',
  adminAuth,
  checkPermission('admin-roles', 'delete'),
  async (req, res) => {
    try {
      const deleted = await permissionService.deleteRole(req.params.id)
      if (!deleted) {
        return response.error(res, '无法删除预设角色', 400)
      }
      response.success(res, null, '角色删除成功')
    } catch (err) {
      console.error('删除角色失败:', err)
      response.error(res, '删除角色失败')
    }
  }
)

router.get('/users', adminAuth, checkPermission('admin-users', 'view'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const filters = {
      status: req.query.status,
      role_id: req.query.role_id ? parseInt(req.query.role_id) : undefined
    }
    const result = await permissionService.getAdminUsers(page, limit, filters)
    response.success(res, result, '获取管理员列表成功')
  } catch (err) {
    console.error('获取管理员列表失败:', err)
    response.error(res, '获取管理员列表失败')
  }
})

router.get('/users/:id', adminAuth, checkPermission('admin-users', 'view'), async (req, res) => {
  try {
    const user = await permissionService.getAdminUserById(req.params.id)
    if (!user) {
      return response.error(res, '管理员不存在', 404)
    }
    response.success(res, user, '获取管理员详情成功')
  } catch (err) {
    console.error('获取管理员详情失败:', err)
    response.error(res, '获取管理员详情失败')
  }
})

router.post('/users', adminAuth, checkPermission('admin-users', 'create'), async (req, res) => {
  try {
    const user = await permissionService.createAdminUser(req.body, req.admin.id)
    response.success(res, user, '管理员创建成功')
  } catch (err) {
    console.error('创建管理员失败:', err)
    if (err.name === 'ZodError') {
      return response.error(res, '参数验证失败', 400)
    }
    if (err.code === 'ER_DUP_ENTRY') {
      return response.error(res, '用户名已存在', 400)
    }
    response.error(res, '创建管理员失败')
  }
})

router.put('/users/:id', adminAuth, checkPermission('admin-users', 'edit'), async (req, res) => {
  try {
    const user = await permissionService.updateAdminUser(req.params.id, req.body)
    response.success(res, user, '管理员更新成功')
  } catch (err) {
    console.error('更新管理员失败:', err)
    response.error(res, '更新管理员失败')
  }
})

router.put(
  '/users/:id/password',
  adminAuth,
  checkPermission('admin-users', 'edit'),
  async (req, res) => {
    try {
      await permissionService.resetAdminUserPassword(req.params.id, req.body.new_password)
      response.success(res, null, '密码重置成功')
    } catch (err) {
      console.error('重置密码失败:', err)
      response.error(res, '重置密码失败')
    }
  }
)

router.delete(
  '/users/:id',
  adminAuth,
  checkPermission('admin-users', 'delete'),
  async (req, res) => {
    try {
      const deleted = await permissionService.deleteAdminUser(req.params.id, req.admin.id)
      if (!deleted) {
        return response.error(res, '删除失败', 400)
      }
      response.success(res, null, '管理员删除成功')
    } catch (err) {
      console.error('删除管理员失败:', err)
      response.error(res, '删除管理员失败')
    }
  }
)

router.get('/permissions', adminAuth, (req, res) => {
  try {
    const permissions = {
      modules: [
        { key: 'dashboard', label: '数据概览', actions: ['view'] },
        {
          key: 'questions',
          label: '题目管理',
          actions: ['view', 'create', 'edit', 'delete', 'batch']
        },
        { key: 'subjects', label: '学科管理', actions: ['view', 'create', 'edit', 'delete'] },
        { key: 'grades-classes', label: '年级班级', actions: ['view', 'create', 'edit', 'delete'] },
        { key: 'user-stats', label: '用户数据', actions: ['view'] },
        { key: 'recent-records', label: '最近记录', actions: ['view'] },
        {
          key: 'user-management',
          label: '用户管理',
          actions: ['view', 'create', 'edit', 'delete']
        },
        { key: 'data-analysis', label: '数据分析', actions: ['view'] },
        { key: 'ai-chat', label: 'AI 助手', actions: ['view'] },
        { key: 'ai-models', label: '模型管理', actions: ['view', 'create', 'edit', 'delete'] },
        { key: 'basic-settings', label: '基础设置', actions: ['view', 'edit'] },
        { key: 'database', label: '数据库管理', actions: ['view', 'backup', 'restore', 'cleanup'] },
        { key: 'security', label: '安全中心', actions: ['view', 'block-ip', 'unblock-ip'] },
        { key: 'admin-users', label: '管理员管理', actions: ['view', 'create', 'edit', 'delete'] },
        { key: 'admin-roles', label: '角色管理', actions: ['view', 'create', 'edit', 'delete'] }
      ]
    }
    response.success(res, permissions, '获取权限列表成功')
  } catch (err) {
    console.error('获取权限列表失败:', err)
    response.error(res, '获取权限列表失败')
  }
})

router.get('/my-permissions', adminAuth, (req, res) => {
  try {
    response.success(
      res,
      {
        permissions: req.admin.permissions,
        roleId: req.admin.roleId,
        isSuper: req.admin.isSuper
      },
      '获取当前用户权限成功'
    )
  } catch (err) {
    console.error('获取当前用户权限失败:', err)
    response.error(res, '获取当前用户权限失败')
  }
})

module.exports = router
