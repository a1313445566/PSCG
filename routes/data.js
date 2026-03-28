const express = require('express')
const router = express.Router()
const db = require('../services/database')
const cacheService = require('../services/cache')
const fs = require('fs')
const path = require('path')

// 读取目录中的文件并转换为Base64
function readFilesFromDirectory(dirPath) {
  const files = []

  if (!fs.existsSync(dirPath)) {
    return files
  }

  const fileList = fs.readdirSync(dirPath)

  fileList.forEach(fileName => {
    const filePath = path.join(dirPath, fileName)
    const stats = fs.statSync(filePath)

    if (stats.isFile()) {
      const content = fs.readFileSync(filePath, 'base64')
      files.push({
        name: fileName,
        content: content
      })
    }
  })

  return files
}

// 将Base64编码的文件写入目录
function writeFilesToDirectory(files, dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }

  files.forEach(file => {
    const filePath = path.join(dirPath, file.name)
    fs.writeFileSync(filePath, file.content, 'base64')
  })
}

// 备份数据
router.post('/backup', async (req, res) => {
  try {
    const backupData = {
      subjects: [],
      questions: [],
      users: [],
      answer_records: [],
      question_attempts: [],
      audioFiles: [],
      imageFiles: []
    }

    backupData.subjects = await db.all('SELECT * FROM subjects')
    backupData.subcategories = await db.all('SELECT * FROM subcategories')
    backupData.questions = await db.all('SELECT * FROM questions')
    backupData.users = await db.all('SELECT * FROM users')
    backupData.answer_records = await db.all('SELECT * FROM answer_records')
    backupData.question_attempts = await db.all('SELECT * FROM question_attempts')

    // 备份音频文件
    backupData.audioFiles = readFilesFromDirectory(path.join(__dirname, '..', 'audio'))

    // 备份图片文件
    backupData.imageFiles = readFilesFromDirectory(path.join(__dirname, '..', 'images'))

    res.json({ success: true, data: backupData })
  } catch (error) {
    // console.error('备份数据失败:', error);
    res.status(500).json({ error: '备份数据失败' })
  }
})

// 恢复数据
router.post('/restore', async (req, res) => {
  try {
    const { data } = req.body

    if (!data) {
      res.status(400).json({ error: '没有提供数据' })
      return
    }

    // 清空现有数据
    await db.run('DELETE FROM question_attempts')
    await db.run('DELETE FROM answer_records')
    await db.run('DELETE FROM questions')
    await db.run('DELETE FROM subcategories')
    await db.run('DELETE FROM users')
    await db.run('DELETE FROM subjects')

    // 恢复学科数据
    if (data.subjects && data.subjects.length > 0) {
      for (const subject of data.subjects) {
        await db.run('INSERT INTO subjects (id, name, icon_index) VALUES (?, ?, ?)', [
          subject.id,
          subject.name,
          subject.icon_index || 0
        ])
      }
    }

    // 恢复子分类数据
    if (data.subcategories && data.subcategories.length > 0) {
      for (const subcategory of data.subcategories) {
        await db.run(
          'INSERT INTO subcategories (id, subject_id, name, icon_index) VALUES (?, ?, ?, ?)',
          [subcategory.id, subcategory.subject_id, subcategory.name, subcategory.icon_index || 0]
        )
      }
    }

    // 恢复用户数据
    if (data.users && data.users.length > 0) {
      for (const user of data.users) {
        await db.run(
          'INSERT INTO users (id, student_id, name, grade, class) VALUES (?, ?, ?, ?, ?)',
          [user.id, user.student_id, user.name, user.grade, user.class]
        )
      }
    }

    // 恢复题目数据
    if (data.questions && data.questions.length > 0) {
      for (const question of data.questions) {
        const subjectId = question.subjectId || question.subject_id
        const subcategoryId = question.subcategoryId || question.subcategory_id
        const correctAnswer = question.correctAnswer || question.correct_answer
        const audioUrl = question.audioUrl || question.audio_url
        const imageUrl = question.imageUrl || question.image_url

        await db.run(
          'INSERT INTO questions (id, subject_id, subcategory_id, content, type, options, correct_answer, explanation, audio_url, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            question.id,
            subjectId,
            subcategoryId,
            question.content,
            question.type,
            question.options,
            correctAnswer,
            question.explanation,
            audioUrl,
            imageUrl
          ]
        )
      }
    }

    // 恢复答题记录数据
    if (data.answer_records && data.answer_records.length > 0) {
      for (const record of data.answer_records) {
        await db.run(
          'INSERT INTO answer_records (id, user_id, subject_id, subcategory_id, total_questions, correct_count, time_spent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            record.id,
            record.user_id,
            record.subject_id,
            record.subcategory_id,
            record.total_questions,
            record.correct_count,
            record.time_spent,
            record.created_at
          ]
        )
      }
    }

    // 恢复题目尝试记录数据
    if (data.question_attempts && data.question_attempts.length > 0) {
      for (const attempt of data.question_attempts) {
        await db.run(
          'INSERT INTO question_attempts (id, user_id, question_id, subject_id, subcategory_id, user_answer, is_correct, answer_record_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            attempt.id,
            attempt.user_id,
            attempt.question_id,
            attempt.subject_id,
            attempt.subcategory_id,
            attempt.user_answer,
            attempt.is_correct,
            attempt.answer_record_id,
            attempt.created_at
          ]
        )
      }
    }

    // 恢复音频文件
    if (data.audioFiles && data.audioFiles.length > 0) {
      writeFilesToDirectory(data.audioFiles, path.join(__dirname, '..', 'audio'))
    }

    // 恢复图片文件
    if (data.imageFiles && data.imageFiles.length > 0) {
      writeFilesToDirectory(data.imageFiles, path.join(__dirname, '..', 'images'))
    }

    // 清除所有缓存
    cacheService.clear()

    res.json({ success: true, message: '数据恢复成功' })
  } catch (error) {
    // console.error('恢复数据失败:', error);
    res.status(500).json({ error: '恢复数据失败' })
  }
})

// 导出数据
router.get('/export', async (req, res) => {
  try {
    const exportData = {
      subjects: [],
      questions: [],
      users: [],
      answer_records: []
    }

    exportData.subjects = await db.all('SELECT * FROM subjects')
    exportData.subcategories = await db.all('SELECT * FROM subcategories')
    exportData.questions = await db.all('SELECT * FROM questions')
    exportData.users = await db.all('SELECT * FROM users')
    exportData.answer_records = await db.all('SELECT * FROM answer_records')

    res.json({ success: true, data: exportData })
  } catch (error) {
    // console.error('导出数据失败:', error);
    res.status(500).json({ error: '导出数据失败' })
  }
})

// 清空所有数据
router.post('/clear-all', async (req, res) => {
  try {
    // 清空所有表数据
    await db.run('DELETE FROM question_attempts')
    await db.run('DELETE FROM answer_records')
    await db.run('DELETE FROM questions')
    await db.run('DELETE FROM subcategories')
    await db.run('DELETE FROM subjects')
    await db.run('DELETE FROM users')
    await db.run('DELETE FROM grades')
    await db.run('DELETE FROM classes')

    // 清除所有缓存
    cacheService.clear()

    res.json({ success: true, message: '所有数据清空成功' })
  } catch (error) {
    // console.error('清空数据失败:', error);
    res.status(500).json({ error: '清空数据失败' })
  }
})

// 清空用户答题记录
router.post('/clear-records', async (req, res) => {
  try {
    // 清空答题记录
    await db.run('DELETE FROM question_attempts')
    await db.run('DELETE FROM answer_records')

    // 清除相关缓存
    cacheService.del('analysis')
    cacheService.del('error_prone_questions')

    res.json({ success: true, message: '用户答题记录清空成功' })
  } catch (error) {
    console.error('清空用户答题记录失败:', error)
    res.status(500).json({ error: '清空用户答题记录失败' })
  }
})

// 导入本地数据
router.post('/import-local-data', async (req, res) => {
  try {
    const { data } = req.body

    if (!data) {
      res.status(400).json({ error: '没有提供数据' })
      return
    }

    // 清空现有数据
    await db.run('DELETE FROM question_attempts')
    await db.run('DELETE FROM answer_records')
    await db.run('DELETE FROM questions')
    await db.run('DELETE FROM subcategories')
    await db.run('DELETE FROM users')
    await db.run('DELETE FROM subjects')
    await db.run('DELETE FROM grades')
    await db.run('DELETE FROM classes')

    // 恢复学科数据
    if (data.subjects && data.subjects.length > 0) {
      for (const subject of data.subjects) {
        await db.run('INSERT INTO subjects (name, icon_index) VALUES (?, ?)', [
          subject.name,
          subject.iconIndex || 0
        ])
      }
    }

    // 恢复子分类数据
    if (data.subcategories && data.subcategories.length > 0) {
      for (const subcategory of data.subcategories) {
        await db.run('INSERT INTO subcategories (subject_id, name, icon_index) VALUES (?, ?, ?)', [
          subcategory.subjectId,
          subcategory.name,
          subcategory.iconIndex || 0
        ])
      }
    }

    // 恢复年级数据
    if (data.grades && data.grades.length > 0) {
      for (const grade of data.grades) {
        await db.run('INSERT INTO grades (name) VALUES (?)', [grade.name])
      }
    }

    // 恢复班级数据
    if (data.classes && data.classes.length > 0) {
      for (const cls of data.classes) {
        await db.run('INSERT INTO classes (name) VALUES (?)', [cls.name])
      }
    }

    // 恢复用户数据
    if (data.users && data.users.length > 0) {
      for (const user of data.users) {
        await db.run('INSERT INTO users (student_id, name, grade, class) VALUES (?, ?, ?, ?)', [
          user.studentId,
          user.name,
          user.grade,
          user.class
        ])
      }
    }

    // 恢复题目数据
    if (data.questions && data.questions.length > 0) {
      for (const question of data.questions) {
        await db.run(
          'INSERT INTO questions (subject_id, subcategory_id, content, type, options, correct_answer, explanation, audio_url, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            question.subjectId,
            question.subcategoryId,
            question.content,
            question.type,
            question.options,
            question.correctAnswer,
            question.explanation,
            question.audioUrl,
            question.imageUrl
          ]
        )
      }
    }

    // 清除所有缓存
    cacheService.clear()

    res.json({ success: true, message: '本地数据导入成功' })
  } catch (error) {
    console.error('导入本地数据失败:', error)
    res.status(500).json({ error: '导入本地数据失败' })
  }
})

// 清空排行榜数据
router.post('/clear-leaderboard', async (req, res) => {
  try {
    // 清空答题记录（排行榜数据）
    await db.run('DELETE FROM question_attempts')
    await db.run('DELETE FROM answer_records')

    // 清除相关缓存
    cacheService.del('analysis')
    cacheService.del('error_prone_questions')

    res.json({ success: true, message: '排行榜数据已清空' })
  } catch (error) {
    console.error('清空排行榜数据失败:', error)
    res.status(500).json({ error: '清空排行榜数据失败' })
  }
})

// 清空年级数据
router.post('/clear-grades', async (req, res) => {
  try {
    // 清空年级数据
    await db.run('DELETE FROM grades')

    // 清除相关缓存
    cacheService.clear()

    res.json({ success: true, message: '年级数据已清空' })
  } catch (error) {
    console.error('清空年级数据失败:', error)
    res.status(500).json({ error: '清空年级数据失败' })
  }
})

// 清空班级数据
router.post('/clear-classes', async (req, res) => {
  try {
    // 清空班级数据
    await db.run('DELETE FROM classes')

    // 清除相关缓存
    cacheService.clear()

    res.json({ success: true, message: '班级数据已清空' })
  } catch (error) {
    console.error('清空班级数据失败:', error)
    res.status(500).json({ error: '清空班级数据失败' })
  }
})

// 健康检查
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await db.healthCheck()
    res.json(healthStatus)
  } catch (error) {
    console.error('健康检查失败:', error)
    res.status(500).json({ status: 'error', message: error.message })
  }
})

module.exports = router
