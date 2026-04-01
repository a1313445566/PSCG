const express = require('express')
const router = express.Router()
const db = require('../services/database')
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const { execSync } = require('child_process')

// 配置文件上传
const upload = multer({
  dest: path.join(__dirname, '..', 'uploads'),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  }
})

// 确保备份目录存在
const backupDir = path.join(__dirname, '..', 'backups')
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true })
}

// 备份数据
router.get('/backup', async (req, res) => {
  try {
    const { type = 'full', format = 'db', dataTypes } = req.query

    // 验证format参数
    const validFormats = ['db', 'json']
    if (!validFormats.includes(format)) {
      return res.status(400).json({ error: '无效的格式参数，支持db和json格式' })
    }

    // 解析并验证dataTypes参数（仅在format为json时需要）
    let requestedTypes = []
    if (format === 'json') {
      requestedTypes = dataTypes ? dataTypes.split(',') : []

      // 验证dataTypes参数
      const validDataTypes = [
        'questions',
        'users',
        'answers',
        'settings',
        'subjects',
        'subcategories',
        'grades',
        'classes',
        'leaderboard',
        'analysis'
      ]
      const invalidTypes = requestedTypes.filter(dataType => !validDataTypes.includes(dataType))
      if (invalidTypes.length > 0) {
        return res.status(400).json({ error: `无效的数据类型: ${invalidTypes.join(', ')}` })
      }
    }

    // 如果请求JSON格式
    if (format === 'json') {
      const backupData = {
        timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        data: {}
      }

      // 根据请求的数据类型获取数据
      try {
        if (requestedTypes.length === 0 || requestedTypes.includes('questions')) {
          backupData.data.questions = await db.all('SELECT * FROM questions')
        }

        if (requestedTypes.length === 0 || requestedTypes.includes('users')) {
          backupData.data.users = await db.all('SELECT * FROM users')
        }

        if (requestedTypes.length === 0 || requestedTypes.includes('answers')) {
          backupData.data.answer_records = await db.all('SELECT * FROM answer_records')
        }

        if (requestedTypes.length === 0 || requestedTypes.includes('settings')) {
          backupData.data.settings = await db.all('SELECT * FROM settings')
        }

        if (requestedTypes.length === 0 || requestedTypes.includes('subjects')) {
          backupData.data.subjects = await db.all('SELECT * FROM subjects')
        }

        if (requestedTypes.length === 0 || requestedTypes.includes('subcategories')) {
          backupData.data.subcategories = await db.all('SELECT * FROM subcategories')
        }

        if (requestedTypes.length === 0 || requestedTypes.includes('grades')) {
          backupData.data.grades = await db.all('SELECT * FROM grades')
        }

        if (requestedTypes.length === 0 || requestedTypes.includes('classes')) {
          backupData.data.classes = await db.all('SELECT * FROM classes')
        }

        if (requestedTypes.length === 0 || requestedTypes.includes('leaderboard')) {
          // 排行榜数据可以从answer_records中计算
          backupData.data.leaderboard = await db.all(`
            SELECT
              u.id,
              u.student_id,
              u.name,
              u.grade,
              u.class,
              SUM(ar.total_questions) as total_questions,
              SUM(ar.correct_count) as correct_count,
              CASE WHEN SUM(ar.total_questions) > 0 THEN
                (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions)
              ELSE 0 END as avg_accuracy,
              SUM(ar.correct_count) * 10 as points
            FROM users u
            LEFT JOIN answer_records ar ON u.id = ar.user_id
            GROUP BY u.id
            HAVING SUM(ar.total_questions) >= 20
            ORDER BY points DESC, avg_accuracy DESC, total_questions DESC
            LIMIT 10
          `)
        }

        if (requestedTypes.length === 0 || requestedTypes.includes('analysis')) {
          // 分析数据
          backupData.data.analysis = {
            totalUsers: await db.get('SELECT COUNT(*) as count FROM users'),
            totalQuestions: await db.get('SELECT COUNT(*) as count FROM questions'),
            totalAnswerRecords: await db.get('SELECT COUNT(*) as count FROM answer_records')
          }
        }
      } catch (dbError) {
        console.error('数据库查询失败:', dbError)
        throw new Error(`数据库查询失败: ${dbError.message}`)
      }

      res.json(backupData)
      return
    }

    // 否则执行默认的数据库备份
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

    // 构建mysqldump命令，不包含密码
    const command = `mysqldump --no-tablespaces -h ${dbConfig.host} -u ${dbConfig.user} ${dbConfig.database} > ${backupFilePath}`

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

    // 检查文件扩展名是否为.db
    const isValid = req.file.originalname.endsWith('.db')

    // 删除临时上传文件
    fs.unlinkSync(req.file.path)

    if (isValid) {
      res.json({
        valid: true,
        type: 'full', // 默认为全量备份
        timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        size: `${(req.file.size / 1024).toFixed(2)} KB`,
        dataTypes: ['questions', 'users', 'answers', 'settings']
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

// 导出数据
router.get('/export', async (req, res) => {
  try {
    const exportData = {
      timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      data: {
        questions: await db.all('SELECT * FROM questions'),
        subjects: await db.all('SELECT * FROM subjects'),
        subcategories: await db.all('SELECT * FROM subcategories'),
        users: await db.all('SELECT * FROM users'),
        answer_records: await db.all('SELECT * FROM answer_records'),
        settings: await db.all('SELECT * FROM settings')
      }
    }

    // 保存导出文件
    const exportFileName = `export-${new Date().toISOString().slice(0, 10)}.json`
    const exportFilePath = path.join(backupDir, exportFileName)
    fs.writeFileSync(exportFilePath, JSON.stringify(exportData, null, 2))

    // 发送导出文件
    res.download(exportFilePath, exportFileName)
  } catch (error) {
    console.error('导出数据失败:', error)
    res.status(500).json({ error: '导出数据失败' })
  }
})

// 恢复数据
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
    const command = `mysql -h ${dbConfig.host} -u ${dbConfig.user} ${dbConfig.database} < ${backupFilePath}`

    try {
      execSync(command, { env })
      console.log('数据恢复命令执行成功')
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

module.exports = router
