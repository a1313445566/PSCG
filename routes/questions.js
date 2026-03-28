const express = require('express')
const router = express.Router()
const db = require('../services/database')
const xssFilter = require('../utils/xss-filter')
const { getPaginationParams } = require('../utils/pagination')
const fileRefService = require('../services/fileReferenceService')

// 获取子分类列表（供筛选器使用）
router.get('/subcategories', async (req, res) => {
  try {
    const { subjectId } = req.query

    let query = `
      SELECT 
        sub.id,
        sub.name,
        sub.subject_id as subjectId,
        s.name as subjectName,
        COUNT(q.id) as questionCount
      FROM subcategories sub
      LEFT JOIN subjects s ON sub.subject_id = s.id
      LEFT JOIN questions q ON sub.id = q.subcategory_id
    `
    const params = []

    if (subjectId) {
      query += ' WHERE sub.subject_id = ?'
      params.push(Number(subjectId))
    }

    query += ' GROUP BY sub.id, sub.name, sub.subject_id, s.name ORDER BY sub.id'

    const list = await db.all(query, params)

    res.json(list)
  } catch (error) {
    console.error('获取子分类列表失败:', error)
    res.status(500).json({ error: '获取数据失败' })
  }
})

// 获取子分类统计数据（题目数量和平均难度）
router.get('/subcategories/stats', async (req, res) => {
  try {
    const { subjectId } = req.query

    let query = `
      SELECT 
        subcategory_id as subcategoryId,
        COUNT(*) as questionCount,
        COALESCE(AVG(difficulty), 1) as avgDifficulty
      FROM questions
      WHERE 1=1
    `
    const params = []

    if (subjectId) {
      query += ' AND subject_id = ?'
      params.push(Number(subjectId))
    }

    query += ' GROUP BY subcategory_id'

    const stats = await db.all(query, params)

    // 转换为对象格式，方便前端查找
    const statsMap = {}
    stats.forEach(stat => {
      statsMap[stat.subcategoryId] = {
        questionCount: stat.questionCount,
        avgDifficulty: Math.round(stat.avgDifficulty * 10) / 10
      }
    })

    res.json(statsMap)
  } catch (error) {
    console.error('获取子分类统计失败:', error)
    res.status(500).json({ error: '获取数据失败' })
  }
})

// 获取题目列表（支持分页和筛选）
router.get('/', async (req, res) => {
  try {
    const {
      subjectId,
      subcategoryId,
      type,
      difficulty,
      keyword,
      page = 1,
      limit = 20,
      excludeContent = 'false'
    } = req.query

    // 构建基础查询条件
    let countQuery = 'SELECT COUNT(*) as total FROM questions q WHERE 1=1'
    let dataQuery = `
      SELECT 
        q.id, 
        q.subject_id as subjectId, 
        q.subcategory_id as subcategoryId, 
        q.type, 
        q.correct_answer as answer, 
        q.difficulty, 
        q.created_at as createdAt, 
        q.content, 
        q.image_url as image, 
        q.audio_url as audio,
        s.name as subjectName,
        sub.name as subcategoryName
      FROM questions q
      LEFT JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN subcategories sub ON q.subcategory_id = sub.id
      WHERE 1=1
    `
    const params = []

    if (subjectId) {
      const condition = ' AND q.subject_id = ?'
      countQuery += condition
      dataQuery += condition
      params.push(Number(subjectId))
    }

    if (subcategoryId) {
      const condition = ' AND q.subcategory_id = ?'
      countQuery += condition
      dataQuery += condition
      params.push(Number(subcategoryId))
    }

    if (type) {
      const condition = ' AND q.type = ?'
      countQuery += condition
      dataQuery += condition
      params.push(type)
    }

    if (difficulty) {
      const condition = ' AND q.difficulty = ?'
      countQuery += condition
      dataQuery += condition
      params.push(Number(difficulty))
    }

    // 新增：关键词搜索
    if (keyword && keyword.trim()) {
      const condition = ' AND q.content LIKE ?'
      countQuery += condition
      dataQuery += condition
      // 转义 LIKE 通配符，防止通配符注入
      const escapedKeyword = keyword
        .trim()
        .replace(/[%_]/g, '\\$&') // 转义 % 和 _
        .substring(0, 100) // 限制长度
      params.push(`%${escapedKeyword}%`)
    }

    // 获取总数
    const countResult = await db.get(countQuery, params)
    const total = countResult.total

    // 使用统一分页工具
    const { pageNum, limitNum, offset } = getPaginationParams(page, limit, { maxLimit: 100 })

    // MySQL prepared statement 不支持 LIMIT/OFFSET 参数化
    // 使用验证后的整数值进行拼接是安全的
    dataQuery += ` ORDER BY q.created_at DESC LIMIT ${limitNum} OFFSET ${offset}`

    const questions = await db.all(dataQuery, params)

    // 转换字段名为camelCase格式（仅在需要时处理）
    const formattedQuestions = questions.map(question => {
      if (excludeContent === 'true') {
        // 不包含完整内容时，只返回基本信息和内容摘要
        return {
          id: question.id,
          subjectId: question.subjectId || question.subject_id,
          subcategoryId: question.subcategoryId || question.subcategory_id,
          subjectName: question.subjectName,
          subcategoryName: question.subcategoryName,
          content: question.content || '',
          type: question.type,
          answer: question.answer,
          difficulty: question.difficulty,
          image: question.image,
          audio: question.audio,
          createdAt: question.createdAt || question.created_at
        }
      }

      let options = []
      let answer = question.correct_answer

      try {
        options = JSON.parse(question.options)
      } catch (error) {
        options = []
      }

      try {
        const parsedAnswer = JSON.parse(question.correct_answer)
        if (typeof parsedAnswer === 'string') {
          answer = parsedAnswer
        }
      } catch (error) {
        // 如果解析失败，使用原始值
      }

      return {
        id: question.id,
        subjectId: question.subject_id,
        subcategoryId: question.subcategory_id,
        subjectName: question.subjectName,
        subcategoryName: question.subcategoryName,
        content: question.content,
        type: question.type,
        options: options,
        answer: answer,
        explanation: question.explanation,
        audio: question.audio_url,
        image: question.image_url,
        createdAt: question.created_at
      }
    })

    // 返回新格式
    res.json({
      data: formattedQuestions,
      total: total,
      page: pageNum,
      limit: limitNum
    })
  } catch (error) {
    // console.error('获取题目失败:', error);
    res.status(500).json({ error: '获取题目失败' })
  }
})

// 获取单个题目
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const question = await db.get('SELECT * FROM questions WHERE id = ?', [id])

    if (!question) {
      res.status(404).json({ error: '题目不存在' })
      return
    }

    // 转换字段名为camelCase格式
    let options = []
    let answer = question.correct_answer

    try {
      options = JSON.parse(question.options)
    } catch (error) {
      // console.error('解析选项失败:', error);
      options = []
    }

    try {
      // 尝试解析answer字段，处理JSON字符串格式的答案
      const parsedAnswer = JSON.parse(question.correct_answer)
      if (typeof parsedAnswer === 'string') {
        answer = parsedAnswer
      }
    } catch (error) {
      // 如果解析失败，使用原始值
    }

    const formattedQuestion = {
      id: question.id,
      subjectId: question.subject_id,
      subcategoryId: question.subcategory_id,
      content: question.content,
      type: question.type,
      difficulty: question.difficulty || 1,
      options: options,
      answer: answer,
      explanation: question.explanation,
      audio: question.audio_url,
      image: question.image_url,
      createdAt: question.created_at
    }

    res.json(formattedQuestion)
  } catch (error) {
    // console.error('获取题目失败:', error);
    res.status(500).json({ error: '获取题目失败' })
  }
})

// 添加题目
router.post('/', async (req, res) => {
  try {
    let {
      subjectId,
      subcategoryId,
      content,
      type,
      options,
      answer,
      explanation = '',
      audio = null,
      image = null
    } = req.body // eslint-disable-line prefer-const

    if (!subjectId || !subcategoryId || !content || !type || !options || !answer) {
      res.status(400).json({ error: '题目信息不完整' })
      return
    }

    // XSS 过滤 - 对富文本内容进行清理
    content = xssFilter.deepSanitize(content)
    explanation = xssFilter.sanitize(explanation)

    // 过滤选项中的富文本内容
    const sanitizedOptions = options.map(opt => {
      if (opt === null || opt === undefined) {
        return ''
      }
      if (typeof opt === 'string') {
        return xssFilter.deepSanitize(opt)
      }
      if (typeof opt === 'object') {
        // 递归处理对象属性
        return Object.keys(opt).reduce((acc, key) => {
          acc[key] = typeof opt[key] === 'string' ? xssFilter.deepSanitize(opt[key]) : opt[key]
          return acc
        }, {})
      }
      return opt
    })

    // 处理 options 参数，确保它是一个数组
    const optionsJson = JSON.stringify(sanitizedOptions || [])

    const result = await db.run(
      'INSERT INTO questions (subject_id, subcategory_id, content, type, options, correct_answer, explanation, audio_url, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [subjectId, subcategoryId, content, type, optionsJson, answer, explanation, audio, image]
    )

    // 检查插入是否成功
    if (!result || !result.insertId) {
      throw new Error('插入题目失败，未返回插入ID')
    }

    // 返回新添加的题目
    const newQuestion = await db.get('SELECT * FROM questions WHERE id = ?', [result.insertId])

    // 检查是否成功获取新题目
    if (!newQuestion) {
      throw new Error('获取新添加的题目失败')
    }

    // 更新文件引用计数
    await fileRefService.updateQuestionFileReferences(newQuestion)

    // 格式化题目数据
    let formattedOptions = []
    let correctAnswer = newQuestion.correct_answer

    try {
      formattedOptions = JSON.parse(newQuestion.options)
    } catch (error) {
      formattedOptions = []
    }

    try {
      // 尝试解析answer字段，处理JSON字符串格式的答案
      const parsedAnswer = JSON.parse(newQuestion.correct_answer)
      if (typeof parsedAnswer === 'string') {
        correctAnswer = parsedAnswer
      }
    } catch (error) {
      // 如果解析失败，使用原始值
    }

    const formattedQuestion = {
      id: newQuestion.id,
      subjectId: newQuestion.subject_id,
      subcategoryId: newQuestion.subcategory_id,
      content: newQuestion.content,
      type: newQuestion.type,
      options: formattedOptions,
      answer: correctAnswer,
      explanation: newQuestion.explanation,
      audio: newQuestion.audio_url,
      image: newQuestion.image_url,
      createdAt: newQuestion.created_at
    }

    res.json(formattedQuestion)
  } catch (error) {
    console.error('添加题目失败:', error)
    res.status(500).json({ error: '添加题目失败', details: error.message })
  }
})

// 更新题目
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    let { subjectId, subcategoryId, content, type, options, answer, explanation, audio, image } =
      req.body // eslint-disable-line prefer-const

    if (!subjectId || !subcategoryId || !content || !type || !options || !answer) {
      res.status(400).json({ error: '题目信息不完整' })
      return
    }

    // XSS 过滤 - 对富文本内容进行清理
    content = xssFilter.deepSanitize(content)
    explanation = xssFilter.sanitize(explanation)

    // 过滤选项中的富文本内容
    const sanitizedOptions = options.map(opt => {
      if (opt === null || opt === undefined) {
        return ''
      }
      if (typeof opt === 'string') {
        return xssFilter.deepSanitize(opt)
      }
      if (typeof opt === 'object') {
        // 递归处理对象属性
        return Object.keys(opt).reduce((acc, key) => {
          acc[key] = typeof opt[key] === 'string' ? xssFilter.deepSanitize(opt[key]) : opt[key]
          return acc
        }, {})
      }
      return opt
    })

    // 获取旧题目数据（用于对比文件引用）
    const oldQuestion = await db.get('SELECT * FROM questions WHERE id = ?', [id])

    await db.run(
      'UPDATE questions SET subject_id = ?, subcategory_id = ?, content = ?, type = ?, options = ?, correct_answer = ?, explanation = ?, audio_url = ?, image_url = ? WHERE id = ?',
      [
        subjectId,
        subcategoryId,
        content,
        type,
        JSON.stringify(sanitizedOptions),
        answer,
        explanation,
        audio,
        image,
        id
      ]
    )

    // 返回更新后的题目
    const updatedQuestion = await db.get('SELECT * FROM questions WHERE id = ?', [id])

    // 更新文件引用计数（对比新旧内容）
    await fileRefService.updateQuestionFileReferences(updatedQuestion, oldQuestion)

    // 格式化题目数据
    let formattedOptions = []
    let correctAnswer = updatedQuestion.correct_answer

    try {
      formattedOptions = JSON.parse(updatedQuestion.options)
    } catch (error) {
      // console.error('解析选项失败:', error);
      formattedOptions = []
    }

    try {
      // 尝试解析answer字段，处理JSON字符串格式的答案
      const parsedAnswer = JSON.parse(updatedQuestion.correct_answer)
      if (typeof parsedAnswer === 'string') {
        correctAnswer = parsedAnswer
      }
    } catch (error) {
      // 如果解析失败，使用原始值
    }

    const formattedQuestion = {
      id: updatedQuestion.id,
      subjectId: updatedQuestion.subject_id,
      subcategoryId: updatedQuestion.subcategory_id,
      content: updatedQuestion.content,
      type: updatedQuestion.type,
      options: formattedOptions,
      answer: correctAnswer,
      explanation: updatedQuestion.explanation,
      audio: updatedQuestion.audio_url,
      image: updatedQuestion.image_url,
      createdAt: updatedQuestion.created_at
    }

    res.json(formattedQuestion)
  } catch (error) {
    // console.error('更新题目失败:', error);
    res.status(500).json({ error: '更新题目失败' })
  }
})

// 删除题目
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // 获取要删除的题目数据（用于清理文件引用）
    const question = await db.get('SELECT * FROM questions WHERE id = ?', [id])

    if (question) {
      // 先清理文件引用
      await fileRefService.deleteQuestionFileReferences(question)
      // 再删除题目
      await db.run('DELETE FROM questions WHERE id = ?', [id])
    }

    res.json({ success: true })
  } catch (error) {
    // console.error('删除题目失败:', error);
    res.status(500).json({ error: '删除题目失败' })
  }
})

// 批量操作接口
router.post('/batch', async (req, res) => {
  try {
    const { action, ids, data } = req.body

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: '参数错误' })
      return
    }

    // 限制单次操作数量
    if (ids.length > 100) {
      res.status(400).json({ error: '单次最多操作100条记录' })
      return
    }

    // 验证 ids 都是有效正整数，防止注入
    const validIds = []
    for (const id of ids) {
      const num = Number(id)
      if (!Number.isInteger(num) || num <= 0) {
        res.status(400).json({ error: '包含无效的题目ID' })
        return
      }
      validIds.push(num)
    }

    const placeholders = validIds.map(() => '?').join(',')

    switch (action) {
      case 'delete': {
        // 获取要删除的题目数据（用于清理文件引用）
        const questionsToDelete = await db.all(
          `SELECT * FROM questions WHERE id IN (${placeholders})`,
          validIds
        )
        // 先清理文件引用
        await fileRefService.batchDeleteQuestionFileReferences(questionsToDelete)
        // 再删除题目
        await db.run(`DELETE FROM questions WHERE id IN (${placeholders})`, validIds)
        res.json({ success: true, affected: validIds.length })
        break
      }

      case 'updateDifficulty':
        if (!data || data.difficulty === undefined) {
          res.status(400).json({ error: '缺少难度参数' })
          return
        }
        await db.run(`UPDATE questions SET difficulty = ? WHERE id IN (${placeholders})`, [
          data.difficulty,
          ...validIds
        ])
        res.json({ success: true, affected: validIds.length })
        break

      case 'updateType':
        if (!data || !data.type) {
          res.status(400).json({ error: '缺少类型参数' })
          return
        }
        await db.run(`UPDATE questions SET type = ? WHERE id IN (${placeholders})`, [
          data.type,
          ...validIds
        ])
        res.json({ success: true, affected: validIds.length })
        break

      case 'move':
        if (!data || data.subjectId === undefined) {
          res.status(400).json({ error: '缺少学科参数' })
          return
        }
        await db.run(
          `UPDATE questions SET subject_id = ?, subcategory_id = ? WHERE id IN (${placeholders})`,
          [data.subjectId, data.subcategoryId || null, ...validIds]
        )
        res.json({ success: true, affected: validIds.length })
        break

      default:
        res.status(400).json({ error: '未知操作类型' })
    }
  } catch (error) {
    console.error('批量操作失败:', error)
    res.status(500).json({ error: '操作失败' })
  }
})

module.exports = router
