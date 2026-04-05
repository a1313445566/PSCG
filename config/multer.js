/**
 * Multer 文件上传配置模块
 */

const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, './audio')
    } else {
      cb(null, './images')
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    const prefix = file.mimetype.startsWith('audio/') ? 'audio' : 'image'
    cb(null, `${prefix}-${uniqueSuffix}${ext}`)
  }
})

const fileFilter = function (req, file, cb) {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else if (file.mimetype.startsWith('audio/')) {
    cb(null, true)
  } else {
    cb(new Error('不支持的文件类型'), false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
})

module.exports = upload
