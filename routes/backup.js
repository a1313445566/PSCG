const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const { execSync } = require('child_process')
const cacheService = require('../services/cache')

// 配置文件上传
const upload = multer({
  dest: path.join(__dirname, '..', 'uploads'),
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB限制（数据库备份文件可能较大）
  }
})

// 确保备份目录存在
const backupDir = path.join(__dirname, '..', 'backups')
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true })
}

// 备份数据（仅支持 DB 格式）
router.get('/backup', async (req, res) => {
  try {
    const { type = 'full' } = req.query

    // 执行数据库备份
    // 生成备份文件名，包含完整的时间戳（年月日时分秒毫秒）
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 23).replace(/[-T:]/g, '-')
    const backupFileName = `backup-${timestamp}-${type}.db`
    const backupFilePath = path.join(backupDir, backupFileName)

    // 检查备份目录是否存在且可写
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // 使用mysqldump命令备份数据库
    // 注意：这里需要根据实际的数据库配置修改命令参数
    const dbConfig = require('../config/database')

    // 使用环境变量传递密码，避免明文暴露
    const env = Object.assign({}, process.env, {
      MYSQL_PWD: dbConfig.password
    })

    // 构建mysqldump命令，添加完整参数确保备份完整性
    // --single-transaction: InnoDB一致性快照，不锁表
    // --routines: 备份存储过程和函数
    // --triggers: 备份触发器
    // --add-drop-table: 在CREATE TABLE前添加DROP TABLE（恢复时自动删除旧表）
    // --disable-keys: 插入数据时禁用索引，加速恢复
    const command = `mysqldump --no-tablespaces --single-transaction --routines --triggers --add-drop-table --disable-keys -h ${dbConfig.host} -u ${dbConfig.user} ${dbConfig.database} > ${backupFilePath}`

    try {
      execSync(command, { env })
    } catch (execError) {
      console.error('备份命令执行失败:', execError)
      throw new Error(`备份命令执行失败: ${execError.message}`)
    }

    // 检查备份文件是否存在
    if (!fs.existsSync(backupFilePath)) {
      throw new Error('备份文件未生成')
    }

    // 检查备份文件大小
    const fileStats = fs.statSync(backupFilePath)
    if (fileStats.size === 0) {
      fs.unlinkSync(backupFilePath)
      throw new Error('备份文件为空')
    }

    // 检查备份文件是否包含错误信息
    const backupContent = fs.readFileSync(backupFilePath, 'utf8')
    // 只检查文件是否为空，不再检查内容中的"error"字符串，因为mysqldump可能会在注释中包含警告信息
    if (!backupContent) {
      fs.unlinkSync(backupFilePath)
      throw new Error('备份文件内容为空')
    }
    // 发送备份文件
    res.download(backupFilePath, backupFileName)
  } catch (error) {
    console.error('备份数据失败:', error)
    res.status(500).json({ error: '备份数据失败' })
  }
})

// 获取备份历史
router.get('/backup/history', async (req, res) => {
  try {
    const backupFiles = fs.readdirSync(backupDir).filter(file => file.endsWith('.db'))

    const backupHistory = backupFiles
      .map(file => {
        const filePath = path.join(backupDir, file)
        const stats = fs.statSync(filePath)

        return {
          id: file.replace('.db', ''),
          filename: file,
          type: file.includes('full') ? 'full' : 'incremental',
          size: `${(stats.size / 1024).toFixed(2)} KB`,
          createdAt: stats.mtime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
        }
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    res.json(backupHistory)
  } catch (error) {
    console.error('获取备份历史失败:', error)
    res.status(500).json({ error: '获取备份历史失败' })
  }
})

// 下载备份
router.get('/backup/:id', async (req, res) => {
  try {
    const { id } = req.params
    const backupFileName = `${id}.db`
    const backupFilePath = path.join(backupDir, backupFileName)

    if (!fs.existsSync(backupFilePath)) {
      return res.status(404).json({ error: '备份文件不存在' })
    }

    res.download(backupFilePath, backupFileName)
  } catch (error) {
    console.error('下载备份失败:', error)
    res.status(500).json({ error: '下载备份失败' })
  }
})

// 删除备份
router.delete('/backup/:id', async (req, res) => {
  try {
    const { id } = req.params
    const backupFileName = `${id}.db`
    const backupFilePath = path.join(backupDir, backupFileName)

    if (!fs.existsSync(backupFilePath)) {
      return res.status(404).json({ error: '备份文件不存在' })
    }

    fs.unlinkSync(backupFilePath)
    res.json({ success: true, message: '备份文件删除成功' })
  } catch (error) {
    console.error('删除备份失败:', error)
    res.status(500).json({ error: '删除备份失败' })
  }
})

// 验证备份文件
router.post('/backup/verify', upload.single('backup'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择备份文件' })
    }

    const isValid = req.file.originalname.endsWith('.db')

    fs.unlinkSync(req.file.path)

    if (isValid) {
      res.json({
        valid: true,
        type: 'full',
        timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        size: `${(req.file.size / 1024).toFixed(2)} KB`
      })
    } else {
      res.json({
        valid: false,
        message: '备份文件格式无效，请上传.db格式的备份文件'
      })
    }
  } catch (error) {
    console.error('验证备份文件失败:', error)
    res.status(500).json({ error: '验证备份文件失败' })
  }
})

// 从历史备份恢复数据
router.post('/restore/:id', async (req, res) => {
  try {
    const { id } = req.params
    const backupFileName = `${id}.db`
    const backupFilePath = path.join(backupDir, backupFileName)

    if (!fs.existsSync(backupFilePath)) {
      return res.status(404).json({ error: '备份文件不存在' })
    }

    const dbConfig = require('../config/database')

    const env = Object.assign({}, process.env, {
      MYSQL_PWD: dbConfig.password
    })

    try {
      const checkDbCommand = `mysql -h ${dbConfig.host} -u ${dbConfig.user} -e "CREATE DATABASE IF NOT EXISTS ${dbConfig.database};"`
      execSync(checkDbCommand, { env })
      console.log('数据库检查/创建成功')
    } catch (checkError) {
      console.error('数据库检查失败:', checkError)
      return res.status(500).json({ error: '数据库连接失败，请检查配置' })
    }

    // 恢复命令：使用 --init-command 禁用外键检查，确保恢复顺序不受外键约束影响
    // 恢复完成后外键检查会自动恢复
    const command = `mysql --init-command="SET FOREIGN_KEY_CHECKS=0;" -h ${dbConfig.host} -u ${dbConfig.user} ${dbConfig.database} < ${backupFilePath}`

    try {
      execSync(command, { env })
      console.log('从历史备份恢复数据成功')

      // 清除所有缓存，确保前端获取最新数据
      cacheService.clear()
      console.log('缓存已清除')
    } catch (execError) {
      console.error('恢复数据命令执行失败:', execError)
      return res.status(500).json({ error: '恢复数据命令执行失败' })
    }

    res.json({ success: true, message: '数据恢复成功' })
  } catch (error) {
    console.error('从历史备份恢复失败:', error)
    res.status(500).json({ error: '恢复数据失败' })
  }
})

// 从上传文件恢复数据
router.post('/restore', upload.single('backup'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择备份文件' })
    }

    // 检查文件扩展名是否为.db
    if (!req.file.originalname.endsWith('.db')) {
      fs.unlinkSync(req.file.path)
      return res.status(400).json({ error: '请上传.db格式的备份文件' })
    }

    // 使用mysql命令恢复数据库
    // 注意：这里需要根据实际的数据库配置修改命令参数
    const dbConfig = require('../config/database')
    const backupFilePath = req.file.path

    // 先检查数据库是否存在
    try {
      // 使用环境变量传递密码，避免明文暴露
      const env = Object.assign({}, process.env, {
        MYSQL_PWD: dbConfig.password
      })
      const checkDbCommand = `mysql -h ${dbConfig.host} -u ${dbConfig.user} -e "CREATE DATABASE IF NOT EXISTS ${dbConfig.database};"`
      execSync(checkDbCommand, { env })
      console.log('数据库检查/创建成功')
    } catch (checkError) {
      console.error('数据库检查失败:', checkError)
      fs.unlinkSync(backupFilePath)
      return res.status(500).json({ error: '数据库连接失败，请检查配置' })
    }

    // 使用环境变量传递密码，避免明文暴露
    const env = Object.assign({}, process.env, {
      MYSQL_PWD: dbConfig.password
    })
    // 恢复命令：使用 --init-command 禁用外键检查，确保恢复顺序不受外键约束影响
    const command = `mysql --init-command="SET FOREIGN_KEY_CHECKS=0;" -h ${dbConfig.host} -u ${dbConfig.user} ${dbConfig.database} < ${backupFilePath}`

    try {
      execSync(command, { env })
      console.log('数据恢复命令执行成功')

      // 清除所有缓存，确保前端获取最新数据
      cacheService.clear()
      console.log('缓存已清除')
    } catch (execError) {
      console.error('恢复数据命令执行失败:', execError)
      console.error('错误输出:', execError.stderr ? execError.stderr.toString() : '无错误输出')
      fs.unlinkSync(backupFilePath)
      return res.status(500).json({ error: '恢复数据命令执行失败' })
    }

    // 删除临时上传文件
    fs.unlinkSync(backupFilePath)

    res.json({ success: true, message: '数据恢复成功' })
  } catch (error) {
    console.error('恢复数据失败:', error)
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path)
      } catch (unlinkError) {
        console.error('删除临时文件失败:', unlinkError)
      }
    }
    res.status(500).json({ error: '恢复数据失败' })
  }
})

// Multer 错误处理中间件
router.use((err, req, res, _next) => {
  console.error('[备份上传错误]', err.code, err.message)

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: '文件大小超过限制（最大 200MB）'
    })
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: '意外的文件字段'
    })
  }

  res.status(500).json({
    success: false,
    error: '上传失败: ' + (err.message || '未知错误')
  })
})

module.exports = router
