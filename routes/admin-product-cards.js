const express = require('express')
const router = express.Router()
const adminAuth = require('../middleware/adminAuth')
const productCardService = require('../services/productCardService')
const response = require('../utils/response')
const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/images/uploads')
    const fs = require('fs')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, `product-card-${uniqueSuffix}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/svg+xml']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('仅支持 PNG 和 SVG 格式'))
    }
  }
})

function checkPermission(module, action) {
  return (req, res, next) => {
    try {
      if (req.admin.isSuper) return next()
      const hasPerm = req.admin.permissions?.[module]?.[action]
      if (hasPerm) return next()
      return response.error(res, '权限不足', 403)
    } catch (err) {
      console.error('权限验证失败:', err)
      response.error(res, '权限验证失败', 500)
    }
  }
}

// ============================================
// 获取列表接口
// - 管理端 (/api/admin/product-cards)：返回所有卡片（包括隐藏的）
// - 公开端 (/api/product-cards)：仅返回可见卡片
// ============================================

router.get('/', async (req, res) => {
  try {
    const isAdmin = req.originalUrl.includes('/admin/')
    const cards = isAdmin
      ? await productCardService.getAllCards()
      : await productCardService.getVisibleCards()
    response.success(res, cards, '获取产品卡片成功')
  } catch (err) {
    console.error('获取产品卡片失败:', err)
    response.error(res, '获取产品卡片失败')
  }
})

router.post('/', adminAuth, checkPermission('content-management', 'edit'), async (req, res) => {
  try {
    const card = await productCardService.createCard(req.body)
    response.success(res, card, '卡片创建成功')
  } catch (err) {
    console.error('创建卡片失败:', err)
    if (err.name === 'ZodError') {
      return response.error(res, '参数验证失败: ' + err.errors.map(e => e.message).join(', '), 400)
    }
    response.error(res, err.message || '创建卡片失败')
  }
})

router.put('/:id', adminAuth, checkPermission('content-management', 'edit'), async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      return response.error(res, '无效的卡片ID', 400)
    }

    const card = await productCardService.updateCard(id, req.body)
    response.success(res, card, '卡片更新成功')
  } catch (err) {
    console.error('更新卡片失败:', err)
    if (err.message === '卡片不存在') {
      return response.error(res, '卡片不存在', 404)
    }
    if (err.name === 'ZodError') {
      return response.error(res, '参数验证失败: ' + err.errors.map(e => e.message).join(', '), 400)
    }
    response.error(res, err.message || '更新卡片失败')
  }
})

router.delete(
  '/:id',
  adminAuth,
  checkPermission('content-management', 'edit'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        return response.error(res, '无效的卡片ID', 400)
      }

      await productCardService.deleteCard(id)
      response.success(res, null, '卡片删除成功')
    } catch (err) {
      console.error('删除卡片失败:', err)
      if (err.message === '卡片不存在') {
        return response.error(res, '卡片不存在', 404)
      }
      response.error(res, err.message || '删除卡片失败')
    }
  }
)

router.put('/sort', adminAuth, checkPermission('content-management', 'edit'), async (req, res) => {
  try {
    const { cards } = req.body
    if (!cards || !Array.isArray(cards)) {
      return response.error(res, 'cards 参数必须是数组', 400)
    }

    const result = await productCardService.updateSortOrder(cards)
    response.success(res, result, '排序更新成功')
  } catch (err) {
    console.error('更新排序失败:', err)
    response.error(res, '更新排序失败')
  }
})

router.post(
  '/upload-icon',
  adminAuth,
  checkPermission('content-management', 'edit'),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return response.error(res, '请选择要上传的文件', 400)
      }

      const imageUrl = `/images/uploads/${req.file.filename}`
      response.success(res, { url: imageUrl }, '图标上传成功')
    } catch (err) {
      console.error('上传图标失败:', err)
      response.error(res, err.message || '图标上传失败')
    }
  }
)

module.exports = router
