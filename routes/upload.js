const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const sharp = require('sharp')
const crypto = require('crypto')
const db = require('../services/database')

// 配置存储（临时存储，用于计算哈希后再决定最终路径）
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir
    if (file.mimetype.startsWith('audio/')) {
      uploadDir = path.join(__dirname, '../audio')
    } else {
      uploadDir = path.join(__dirname, '../images')
    }

    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // 临时文件名（用于计算哈希）
    const tempName = `temp-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`
    cb(null, tempName)
  }
})

// 图片文件过滤
const imageFileFilter = (req, file, cb) => {
  // 允许的图片类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('不支持的图片格式，仅支持 JPG、PNG、GIF、WebP'), false)
  }

  // 检查文件扩展名
  const ext = path.extname(file.originalname).toLowerCase()
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

  if (!allowedExts.includes(ext)) {
    return cb(new Error('不支持的文件扩展名'), false)
  }

  cb(null, true)
}

// 音频文件过滤
const audioFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'audio/mpeg', // MP3
    'audio/mp3', // MP3 (alternative)
    'audio/wav', // WAV
    'audio/x-wav', // WAV (alternative)
    'audio/wave', // WAV (alternative)
    'audio/ogg', // OGG
    'audio/mp4', // M4A/MP4
    'audio/x-m4a', // M4A
    'audio/m4a' // M4A (alternative)
  ]

  // 同时检查文件扩展名作为后备
  const ext = path.extname(file.originalname).toLowerCase()
  const allowedExts = ['.mp3', '.wav', '.ogg', '.m4a']

  if (!allowedTypes.includes(file.mimetype) && !allowedExts.includes(ext)) {
    return cb(new Error('不支持的音频格式，仅支持 MP3、WAV、OGG、M4A'), false)
  }

  cb(null, true)
}

// 配置 multer
const upload = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
})

// 音频上传配置
const audioUpload = multer({
  storage: storage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
})

// 图片上传路由
router.post('/image', upload.single('image'), async (req, res) => {
  let tempFilePath = null

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '未收到图片文件'
      })
    }

    tempFilePath = req.file.path

    // 图片安全检查
    const securityCheck = await validateImageSecurity(tempFilePath)
    if (!securityCheck.safe) {
      fs.unlinkSync(tempFilePath)
      return res.status(400).json({
        success: false,
        error: securityCheck.reason
      })
    }

    // 计算文件哈希
    const fileBuffer = fs.readFileSync(tempFilePath)
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex')
    const fileSize = fs.statSync(tempFilePath).size

    // 检查是否已存在相同哈希的文件
    const existingFile = await db.get(
      'SELECT * FROM file_hashes WHERE file_hash = ? AND file_type = ?',
      [fileHash, 'image']
    )

    if (existingFile) {
      // 验证物理文件是否存在
      const physicalPath = path.join(__dirname, '..', existingFile.file_path)
      if (fs.existsSync(physicalPath)) {
        // 文件已存在，删除临时文件，增加引用计数
        fs.unlinkSync(tempFilePath)
        await db.run('UPDATE file_hashes SET ref_count = ref_count + 1 WHERE id = ?', [
          existingFile.id
        ])

        console.log(`[去重] 图片已存在，复用: ${existingFile.file_path}`)

        return res.json({
          success: true,
          url: existingFile.file_path,
          filename: path.basename(existingFile.file_path),
          size: existingFile.file_size,
          deduplicated: true
        })
      } else {
        // 物理文件不存在，删除旧记录，保存新文件
        console.log(`[去重] 物理文件不存在，重新保存: ${existingFile.file_path}`)
        await db.run('DELETE FROM file_hashes WHERE id = ?', [existingFile.id])
      }
    }

    // 新文件：优化并保存
    const optimizedPath = await optimizeImage(tempFilePath)
    const finalPath = `/images/${path.basename(optimizedPath)}`

    // 记录文件哈希
    await db.run(
      'INSERT INTO file_hashes (file_hash, file_path, file_type, file_size, ref_count) VALUES (?, ?, ?, ?, 1)',
      [fileHash, finalPath, 'image', fileSize]
    )

    console.log(`[新文件] 图片已保存: ${finalPath}`)

    res.json({
      success: true,
      url: finalPath,
      filename: path.basename(optimizedPath),
      size: fs.statSync(optimizedPath).size,
      deduplicated: false
    })
  } catch (error) {
    console.error('图片上传失败:', error)

    // 清理临时文件
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath)
    }

    res.status(500).json({
      success: false,
      error: '图片上传失败: ' + error.message
    })
  }
})

// 音频上传路由
router.post('/audio', audioUpload.single('audio'), async (req, res) => {
  let tempFilePath = null

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '未收到音频文件'
      })
    }

    tempFilePath = req.file.path

    // 音频安全检查
    const securityCheck = await validateAudioSecurity(tempFilePath)
    if (!securityCheck.safe) {
      fs.unlinkSync(tempFilePath)
      return res.status(400).json({
        success: false,
        error: securityCheck.reason
      })
    }

    // 计算文件哈希
    const fileBuffer = fs.readFileSync(tempFilePath)
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex')
    const fileSize = fs.statSync(tempFilePath).size

    // 检查是否已存在相同哈希的文件
    const existingFile = await db.get(
      'SELECT * FROM file_hashes WHERE file_hash = ? AND file_type = ?',
      [fileHash, 'audio']
    )

    if (existingFile) {
      // 验证物理文件是否存在
      const physicalPath = path.join(__dirname, '..', existingFile.file_path)
      if (fs.existsSync(physicalPath)) {
        // 文件已存在，删除临时文件，增加引用计数
        fs.unlinkSync(tempFilePath)
        await db.run('UPDATE file_hashes SET ref_count = ref_count + 1 WHERE id = ?', [
          existingFile.id
        ])

        console.log(`[去重] 音频已存在，复用: ${existingFile.file_path}`)

        return res.json({
          success: true,
          url: existingFile.file_path,
          filename: path.basename(existingFile.file_path),
          size: existingFile.file_size,
          deduplicated: true
        })
      } else {
        // 物理文件不存在，删除旧记录，保存新文件
        console.log(`[去重] 物理文件不存在，重新保存: ${existingFile.file_path}`)
        await db.run('DELETE FROM file_hashes WHERE id = ?', [existingFile.id])
      }
    }

    // 新文件：重命名为最终文件名
    const ext = path.extname(tempFilePath)
    const finalName = `audio-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    const finalPath = path.join(path.dirname(tempFilePath), finalName)

    fs.renameSync(tempFilePath, finalPath)
    const audioUrl = `/audio/${finalName}`

    // 记录文件哈希
    await db.run(
      'INSERT INTO file_hashes (file_hash, file_path, file_type, file_size, ref_count) VALUES (?, ?, ?, ?, 1)',
      [fileHash, audioUrl, 'audio', fileSize]
    )

    console.log(`[新文件] 音频已保存: ${audioUrl}`)

    res.json({
      success: true,
      url: audioUrl,
      filename: finalName,
      size: fileSize,
      deduplicated: false
    })
  } catch (error) {
    console.error('音频上传失败:', error)

    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath)
    }

    res.status(500).json({
      success: false,
      error: '音频上传失败: ' + error.message
    })
  }
})

// 图片安全检查
async function validateImageSecurity(filePath) {
  try {
    const buffer = fs.readFileSync(filePath)

    // 1. 检查文件头（Magic Number）
    const magicNumbers = {
      'image/jpeg': [0xff, 0xd8, 0xff],
      'image/png': [0x89, 0x50, 0x4e, 0x47],
      'image/gif': [0x47, 0x49, 0x46],
      'image/webp': [0x52, 0x49, 0x46, 0x46]
    }

    // 获取文件类型
    const fileType = await detectFileType(buffer)
    if (!fileType) {
      return { safe: false, reason: '无法识别的文件类型' }
    }

    // 2. 检查是否包含恶意代码（基本的脚本检测）
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /onerror\s*=/i,
      /onload\s*=/i,
      /onclick\s*=/i
    ]

    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024))
    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        return { safe: false, reason: '文件包含潜在恶意内容' }
      }
    }

    // 3. 检查图片尺寸（防止解析攻击）
    const metadata = await sharp(buffer).metadata()
    if (metadata.width > 10000 || metadata.height > 10000) {
      return { safe: false, reason: '图片尺寸过大' }
    }

    return { safe: true }
  } catch (error) {
    return { safe: false, reason: '文件安全检查失败: ' + error.message }
  }
}

// 图片优化
async function optimizeImage(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase()
    const optimizedPath = filePath.replace(ext, `-optimized${ext}`)

    const image = sharp(filePath)
    const metadata = await image.metadata()

    // 根据格式进行优化
    if (metadata.format === 'jpeg') {
      await image
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85, mozjpeg: true })
        .toFile(optimizedPath)
    } else if (metadata.format === 'png') {
      await image
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png({ compressionLevel: 8 })
        .toFile(optimizedPath)
    } else if (metadata.format === 'webp') {
      await image
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 85 })
        .toFile(optimizedPath)
    } else if (metadata.format === 'gif') {
      // GIF 不压缩，直接重命名
      return filePath
    } else {
      // 其他格式转 JPEG
      const newOptimizedPath = filePath.replace(ext, '-optimized.jpg')
      await image
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toFile(newOptimizedPath)

      // 删除原始文件
      fs.unlinkSync(filePath)
      return newOptimizedPath
    }

    // 删除原始文件，使用优化后的文件
    const originalSize = fs.statSync(filePath).size
    const optimizedSize = fs.statSync(optimizedPath).size

    // 只有优化后的文件更小才替换
    if (optimizedSize < originalSize) {
      fs.unlinkSync(filePath)
      fs.renameSync(optimizedPath, filePath)
    } else {
      fs.unlinkSync(optimizedPath)
    }

    return filePath
  } catch (error) {
    console.error('图片优化失败:', error)
    // 如果优化失败，返回原文件
    return filePath
  }
}

// 检测文件类型
async function detectFileType(buffer) {
  const signature = buffer.slice(0, 4).toString('hex')

  const signatures = {
    ffd8ffe0: 'image/jpeg',
    ffd8ffe1: 'image/jpeg',
    ffd8ffdb: 'image/jpeg',
    '89504e47': 'image/png',
    47494638: 'image/gif',
    52494646: 'image/webp'
  }

  return signatures[signature.slice(0, 8)] || null
}

// 音频安全检查
async function validateAudioSecurity(filePath) {
  try {
    const buffer = fs.readFileSync(filePath)
    const stat = fs.statSync(filePath)

    // 检查文件头（扩展支持更多格式）
    const header = buffer.slice(0, 12).toString('hex').toLowerCase()
    const header4 = header.slice(0, 8) // 前4字节

    // 支持的音频文件头
    const validPatterns = [
      'fff3', // MP3 (MPEG-1 Layer 3)
      'fff2', // MP3 (MPEG-2 Layer 3)
      'fffb', // MP3 (MPEG-1 Layer 3, 128kbps)
      'fffa', // MP3 (MPEG-1 Layer 3, other bitrate)
      '494433', // ID3 tag (MP3 with metadata)
      '52494646', // RIFF (WAV)
      '4f676753' // OggS (OGG)
    ]

    // M4A/MP4: 检查 ftyp atom（通常在文件开头，偏移4字节处）
    const hasFtyp = header.includes('66747970') // 'ftyp' in hex

    let isValid = false
    for (const pattern of validPatterns) {
      if (header4.startsWith(pattern.toLowerCase())) {
        isValid = true
        break
      }
    }

    // 也接受 M4A/MP4 格式
    if (!isValid && hasFtyp) {
      isValid = true
    }

    if (!isValid) {
      console.log(`[音频验证] 不支持的文件头: ${header4}`)
      return { safe: false, reason: '不支持的音频格式，请使用 MP3、WAV、OGG 或 M4A 格式' }
    }

    return { safe: true }
  } catch (error) {
    console.error('[音频验证] 检查失败:', error)
    return { safe: false, reason: '文件安全检查失败' }
  }
}

// Multer 错误处理中间件
router.use((err, req, res, next) => {
  console.error('[上传错误]', err.code, err.message)

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: '文件大小超过限制（最大 10MB）'
    })
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: '意外的文件字段'
    })
  }

  if (err.message && err.message.includes('不支持的')) {
    return res.status(400).json({
      success: false,
      error: err.message
    })
  }

  res.status(500).json({
    success: false,
    error: '上传失败: ' + (err.message || '未知错误')
  })
})

module.exports = router
