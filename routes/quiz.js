const express = require('express')
const router = express.Router()
const db = require('../services/database')
const { validateSubjectId } = require('../services/validationService')
const crypto = require('crypto')
const { submitLimiter } = require('../middleware/rateLimit')
const signatureCache = require('../middleware/signatureCache')

// 生成随机会话ID
const generateQuizId = () => {
  return crypto.randomUUID()
}

// 开始答题API
router.post('/start', async (req, res) => {
  try {
    const { subjectId, subcategoryId, questionCount, studentId, grade, class: className } = req.body

    // 验证必填参数
    if (!subjectId || !subcategoryId || !studentId || !grade || !className) {
      return res.status(400).json({ error: '缺少必填参数' })
    }

    if (!validateSubjectId(subjectId)) {
      return res.status(400).json({ error: '学科ID格式错误' })
    }

    // 查找用户ID
    const user = await db.get(
      'SELECT id FROM users WHERE student_id = ? AND grade = ? AND class = ?',
      [studentId, grade, className]
    )

    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    const userId = user.id

    // 确定实际题库ID（错题巩固题库使用null）
    let actualSubcategoryId
    if (subcategoryId === 'error-collection' || subcategoryId === 'error-collection') {
      actualSubcategoryId = null
    } else {
      actualSubcategoryId =
        typeof subcategoryId === 'string' ? parseInt(subcategoryId) : subcategoryId
    }

    console.log('Quiz start params:', {
      subcategoryId: subcategoryId,
      actualSubcategoryId: actualSubcategoryId,
      subjectId: subjectId,
      questionCount: questionCount
    })

    // 获取题目
    let questions
    if (actualSubcategoryId === null) {
      // 错题巩固题库 - 只加载累计正确次数小于3次的错题，使用DISTINCT确保不重复
      const errorQuestions = await db.all(
        `SELECT DISTINCT q.* FROM questions q
         JOIN error_collection ec ON q.id = ec.question_id
         WHERE ec.user_id = ? AND q.subject_id = ? AND ec.correct_count < 3
         ORDER BY ec.created_at DESC`,
        [userId, subjectId]
      )

      if (errorQuestions.length === 0) {
        return res.status(404).json({ error: '错题巩固题库为空' })
      }

      questions = errorQuestions
    } else {
      // 普通题库
      const limit = parseInt(questionCount) || 10
      const subcategoryIdInt = parseInt(actualSubcategoryId)
      const subjectIdInt = parseInt(subjectId)

      console.log('Quiz start params:', {
        subcategoryId: subcategoryIdInt,
        subjectId: subjectIdInt,
        limit: limit
      })

      questions = await db.all(
        `SELECT q.*, (
           SELECT AVG(difficulty) 
           FROM questions 
           WHERE subcategory_id = ?
         ) as avg_difficulty
         FROM questions q
         WHERE q.subject_id = ? AND q.subcategory_id = ?
         ORDER BY RAND() LIMIT ${limit}`,
        [subcategoryIdInt, subjectIdInt, subcategoryIdInt]
      )

      if (questions.length === 0) {
        return res.status(404).json({ error: '该题库暂无题目' })
      }
    }

    // 生成会话ID和过期时间（30分钟）
    const quizId = generateQuizId()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

    // 准备题目数据（不含正确答案）
    const questionsForSession = questions.map(q => ({
      id: q.id,
      subject_id: q.subject_id,
      subcategory_id: q.subcategory_id,
      content: q.content,
      type: q.type,
      options: JSON.parse(q.options),
      explanation: q.explanation,
      audio_url: q.audio_url,
      image_url: q.image_url,
      difficulty: q.difficulty
    }))

    // 保存会话到数据库
    await db.run(
      `INSERT INTO quiz_sessions (id, user_id, subject_id, subcategory_id, questions, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        quizId,
        userId,
        subjectId,
        actualSubcategoryId,
        JSON.stringify(questionsForSession),
        expiresAt
      ]
    )

    // 准备返回数据
    const responseData = {
      quizId,
      questions: questionsForSession,
      expiresAt: expiresAt.toISOString()
    }

    // 如果是错题巩固题库，添加错题统计数据
    if (actualSubcategoryId === null) {
      const errorStats = await db.all(
        `SELECT question_id, correct_count FROM error_collection 
         WHERE user_id = ? AND question_id IN (${questions.map(q => '?').join(',')})`,
        [userId, ...questions.map(q => q.id)]
      )

      const stats = {}
      errorStats.forEach(stat => {
        stats[stat.question_id] = { correctCount: stat.correct_count }
      })

      responseData.stats = stats
    }

    // 返回题目列表（不含正确答案）
    res.json(responseData)
  } catch (error) {
    console.error('开始答题失败:', error)
    res.status(500).json({ error: '开始答题失败' })
  }
})

// 生成签名的函数（与前端相同）
const generateSignature = (data, timestamp, userId) => {
  const secret = process.env.SIGNATURE_SECRET
  if (!secret) {
    throw new Error('SIGNATURE_SECRET environment variable is required')
  }
  // 按照固定顺序构建dataStr
  const dataStr = JSON.stringify(data) + timestamp + userId

  // 使用crypto模块实现HMAC-SHA256算法
  return crypto.createHmac('sha256', secret).update(dataStr).digest('hex')
}

// 安全降级签名（用于非HTTPS环境）
const generateFallbackSignature = (data, timestamp, userId) => {
  const secret = process.env.SIGNATURE_SECRET
  if (!secret) {
    throw new Error('SIGNATURE_SECRET environment variable is required')
  }

  const dataStr = JSON.stringify(data) + timestamp + userId
  const combinedStr = secret + dataStr + secret
  let hash = 0

  // 多轮哈希（与前端保持一致）
  for (let round = 0; round < 64; round++) {
    const roundStr = combinedStr + round.toString()
    for (let i = 0; i < roundStr.length; i++) {
      const char = roundStr.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
  }

  // 生成16位十六进制签名
  let result = Math.abs(hash).toString(16)
  while (result.length < 16) {
    result = '0' + result
  }

  return result
}

// 安全的签名脱敏函数（只显示前8位和后8位）
const maskSignature = signature => {
  if (!signature || signature.length < 20) {
    return '***invalid***'
  }
  const start = signature.substring(0, 8)
  const end = signature.substring(signature.length - 8)
  return `${start}***${end}`
}

// 安全的日志输出函数
const logSignatureDebug = (message, data = {}) => {
  const isProduction = process.env.NODE_ENV === 'production'

  // 生产环境只输出关键信息
  if (isProduction) {
    console.log(`[签名验证] ${message}`, {
      ...data,
      timestamp: undefined,
      fullSignature: undefined,
      secret: undefined
    })
  } else {
    // 开发环境输出详细信息（脱敏）
    console.log(`[签名验证] ${message}`, data)
  }
}

// 验证签名的函数
const validateSignature = (data, timestamp, signature, userId) => {
  try {
    logSignatureDebug('开始验证签名', {
      quizId: data.quizId,
      userId,
      hasTimestamp: !!timestamp,
      hasSignature: !!signature,
      answerCount: data.answers ? Object.keys(data.answers).length : 0
    })

    if (!data || !timestamp || !signature || !userId) {
      logSignatureDebug('❌ 验证失败: 缺少必要参数', {
        hasData: !!data,
        hasTimestamp: !!timestamp,
        hasSignature: !!signature,
        hasUserId: !!userId
      })
      return false
    }

    // 检查时间戳是否在合理范围内（5分钟内）
    const currentTime = Date.now()
    const timeDiff = Math.abs(currentTime - timestamp)

    logSignatureDebug('时间戳检查', {
      timeDiff: `${Math.round(timeDiff / 1000)}秒`,
      isValid: timeDiff <= 5 * 60 * 1000
    })

    if (timeDiff > 5 * 60 * 1000) {
      logSignatureDebug('❌ 验证失败: 时间戳超出范围', {
        timeDiff: `${Math.round(timeDiff / 1000)}秒`,
        maxAllowed: '300秒'
      })
      return false
    }

    // 生成预期签名并验证
    const signatureData = {
      quizId: data.quizId,
      answers: data.answers,
      timestamp: timestamp
    }

    const expectedSignature = generateSignature(signatureData, timestamp, userId)
    const fallbackSignature = generateFallbackSignature(signatureData, timestamp, userId)

    logSignatureDebug('签名生成完成', {
      hmacLength: expectedSignature.length,
      fallbackLength: fallbackSignature.length,
      receivedLength: signature.length
    })

    // 支持 HMAC-SHA256（HTTPS环境）和 安全降级签名（HTTP环境）
    const isHmacValid = expectedSignature === signature
    const isFallbackValid = fallbackSignature === signature
    const isValid = isHmacValid || isFallbackValid

    if (isValid) {
      logSignatureDebug('✅ 签名验证成功', {
        method: isHmacValid ? 'HMAC-SHA256' : '降级签名',
        signature: maskSignature(signature)
      })
    } else {
      logSignatureDebug('❌ 验证失败: 签名不匹配', {
        received: maskSignature(signature),
        expectedHmac: maskSignature(expectedSignature),
        expectedFallback: maskSignature(fallbackSignature),
        hint: '请检查前后端签名密钥是否一致'
      })
    }

    return isValid
  } catch (error) {
    logSignatureDebug('❌ 验证异常', {
      error: error.message,
      stack: error.stack
    })
    return false
  }
}

// 将正确答案从原始位置映射到打乱后位置的函数
const mapAnswerToShuffled = (correctAnswer, shuffleMapping) => {
  if (!correctAnswer || !shuffleMapping) return correctAnswer

  const letterToIndex = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5 }
  const indexToLetter = ['A', 'B', 'C', 'D', 'E', 'F']

  if (Array.isArray(correctAnswer)) {
    // 多选题
    return correctAnswer.map(letter => {
      const originalIndex = letterToIndex[letter]
      const shuffledIndex = shuffleMapping[originalIndex]
      return indexToLetter[shuffledIndex]
    })
  } else if (typeof correctAnswer === 'string' && correctAnswer.length > 1) {
    // 多选题，格式为 "ABC"
    const letters = correctAnswer.split('')
    const mappedLetters = letters.map(letter => {
      const originalIndex = letterToIndex[letter]
      const shuffledIndex = shuffleMapping[originalIndex]
      return indexToLetter[shuffledIndex]
    })
    return mappedLetters.join('')
  } else {
    // 单选题
    const originalIndex = letterToIndex[correctAnswer]
    const shuffledIndex = shuffleMapping[originalIndex]
    return indexToLetter[shuffledIndex]
  }
}

// 将用户答案从打乱后的位置映射回原始位置的函数
const mapAnswerToOriginal = (userAnswer, reverseMapping) => {
  if (!userAnswer || !reverseMapping) return userAnswer

  const letterToIndex = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5 }
  const indexToLetter = ['A', 'B', 'C', 'D', 'E', 'F']

  if (Array.isArray(userAnswer)) {
    // 多选题
    return userAnswer.map(letter => {
      const shuffledIndex = letterToIndex[letter]
      const originalIndex = reverseMapping[shuffledIndex]
      return indexToLetter[originalIndex]
    })
  } else {
    // 单选题
    const shuffledIndex = letterToIndex[userAnswer]
    const originalIndex = reverseMapping[shuffledIndex]
    return indexToLetter[originalIndex]
  }
}

// 提交答案API - 应用严格限流
router.post('/submit', submitLimiter.middleware(), async (req, res) => {
  try {
    const { quizId, answers, shuffleMappings, timestamp, signature, timeSpent } = req.body

    // 验证必填参数
    if (!quizId || !answers || !timestamp || !signature) {
      return res.status(400).json({ error: '缺少必填参数' })
    }

    // 用时默认为 0，确保是数字
    const timeSpentSeconds = parseInt(timeSpent) || 0

    // 【优化】先进行基础验证，再查询数据库

    // 检查时间戳是否在合理范围内（提前验证，避免无效请求消耗数据库资源）
    // 严格限制：不允许未来时间戳超过 1 分钟容错，不允许过去时间戳超过 5 分钟
    const currentTime = Date.now()
    if (timestamp > currentTime + 60000 || currentTime - timestamp > 300000) {
      return res.status(401).json({ error: '请求已过期，请重新提交' })
    }

    // 查询会话
    const session = await db.get(
      'SELECT * FROM quiz_sessions WHERE id = ? AND expires_at > NOW()',
      [quizId]
    )

    if (!session) {
      return res.status(404).json({ error: '答题会话不存在或已过期' })
    }

    // 【防护】检查签名是否已被使用（防止重放攻击）
    if (signatureCache.isUsed(signature, quizId, session.user_id)) {
      console.warn(`🚨 [安全] 检测到签名重放攻击: quizId=${quizId}, userId=${session.user_id}`)
      return res.status(401).json({ error: '请求已被处理，请勿重复提交' })
    }

    // 验证签名
    if (!validateSignature(req.body, timestamp, signature, session.user_id)) {
      return res.status(401).json({ error: '签名验证失败，提交无效' })
    }

    // 【防护】标记签名为已使用
    signatureCache.markAsUsed(signature, quizId, session.user_id)

    // 检查是否已经提交过
    const existingAttempts = await db.get(
      'SELECT COUNT(*) as count FROM quiz_attempts WHERE quiz_session_id = ?',
      [quizId]
    )

    if (existingAttempts && existingAttempts.count > 0) {
      return res.status(400).json({ error: '已经提交过答案' })
    }

    // 解析session.questions（可能是字符串或对象）
    const sessionQuestions =
      typeof session.questions === 'string' ? JSON.parse(session.questions) : session.questions
    let correctCount = 0
    const results = []
    const userId = session.user_id

    // 验证每道题的答案
    for (const question of sessionQuestions) {
      const userAnswer = answers[question.id]

      // 如果没有提供答案，跳过或提供默认答案
      if (userAnswer === undefined || userAnswer === null) {
        console.log(`题目 ${question.id} 没有提供答案，跳过`)
        continue
      }

      const originalQuestion = await db.get('SELECT * FROM questions WHERE id = ?', [question.id])

      if (!originalQuestion) {
        continue
      }

      // 解析正确答案
      let correctAnswer = originalQuestion.correct_answer
      try {
        const parsed = JSON.parse(correctAnswer)
        correctAnswer = typeof parsed === 'string' ? parsed : parsed
      } catch (e) {
        // 保持原始值
      }

      // 获取该题的打乱映射（前端传递的是 reverseMapping）
      const reverseMapping = shuffleMappings ? shuffleMappings[question.id] : null

      // 计算 shuffleMapping（从 reverseMapping 反转）
      let shuffleMapping = null
      if (reverseMapping) {
        shuffleMapping = {}
        Object.keys(reverseMapping).forEach(key => {
          shuffleMapping[reverseMapping[key]] = key
        })
      }

      // 将用户答案映射回原始位置（使用 reverseMapping）
      let mappedUserAnswer = userAnswer
      if (reverseMapping) {
        mappedUserAnswer = mapAnswerToOriginal(userAnswer, reverseMapping)
      }

      // 判断答案是否正确（使用映射后的答案）
      let isCorrect = false
      if (question.type === 'multiple') {
        const correctAnswers = Array.isArray(correctAnswer)
          ? correctAnswer
          : correctAnswer.split('')
        if (Array.isArray(mappedUserAnswer)) {
          const sortedUserAnswer = [...mappedUserAnswer].sort()
          const sortedCorrectAnswer = [...correctAnswers].sort()
          isCorrect = JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer)
        }
      } else {
        if (Array.isArray(mappedUserAnswer)) {
          isCorrect = mappedUserAnswer[0] === correctAnswer
        } else {
          isCorrect = mappedUserAnswer === correctAnswer
        }
      }

      // 将正确答案映射到打乱后的位置（用于前端显示）
      let displayCorrectAnswer = correctAnswer
      let shuffledOptions = question.options

      if (shuffleMapping) {
        displayCorrectAnswer = mapAnswerToShuffled(correctAnswer, shuffleMapping)
      }

      // 生成打乱后的选项（使用 reverseMapping）
      if (reverseMapping) {
        const originalOptions =
          typeof question.options === 'string' ? JSON.parse(question.options) : question.options

        // 根据 reverseMapping（打乱后位置 -> 原始位置）生成打乱后的选项
        shuffledOptions = Object.keys(reverseMapping)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(key => originalOptions[reverseMapping[key]])
      }

      if (isCorrect) {
        correctCount++
      }

      // 保存答题尝试
      await db.run(
        `INSERT INTO quiz_attempts (quiz_session_id, question_id, user_answer, is_correct)
         VALUES (?, ?, ?, ?)`,
        [quizId, question.id, JSON.stringify(userAnswer), isCorrect ? 1 : 0]
      )

      // 准备结果
      results.push({
        questionId: question.id,
        userAnswer,
        mappedUserAnswer, // 添加映射回原始位置的答案
        correctAnswer: displayCorrectAnswer, // 使用映射后的正确答案
        isCorrect,
        explanation: originalQuestion.explanation,
        // 添加完整的题目信息
        content: originalQuestion.content,
        options: shuffledOptions, // 使用打乱后的选项
        type: question.type || 'single',
        audio_url: originalQuestion.audio_url,
        image_url: originalQuestion.image_url,
        // 添加打乱映射，用于前端显示（实际上前端不需要了，因为后端已经处理好了）
        shuffleMapping: reverseMapping
      })
    }

    // 检查重复提交
    const checkDuplicateSubmission = async (
      userId,
      subjectId,
      subcategoryId,
      cooldownSeconds = 5
    ) => {
      let recentRecord
      if (subcategoryId === null) {
        // 错题巩固题库，使用 IS NULL 条件
        recentRecord = await db.get(
          'SELECT id FROM answer_records WHERE user_id = ? AND subject_id = ? AND subcategory_id IS NULL AND created_at >= DATE_SUB(NOW(), INTERVAL ? SECOND)',
          [userId, subjectId, cooldownSeconds]
        )
      } else {
        // 普通题库，使用 = 条件
        recentRecord = await db.get(
          'SELECT id FROM answer_records WHERE user_id = ? AND subject_id = ? AND subcategory_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? SECOND)',
          [userId, subjectId, subcategoryId, cooldownSeconds]
        )
      }
      return recentRecord
    }

    // 检查是否存在重复提交
    const recentRecord = await checkDuplicateSubmission(
      userId,
      session.subject_id,
      session.subcategory_id
    )
    if (recentRecord) {
      return res.status(400).json({ error: '提交过于频繁，请稍后再试' })
    }

    // 计算积分
    const totalQuestions = sessionQuestions.length
    let points = 0

    if (session.subcategory_id === null) {
      // 错题巩固题库：每题累计正确3次+1分（在错题处理逻辑中处理）
      points = 0
    } else {
      // 普通题库规则：答对1分，答错一题扣1分
      points = correctCount - (totalQuestions - correctCount)

      // 全对积分翻倍
      if (correctCount === totalQuestions && totalQuestions > 0) {
        points *= 2
      }
    }

    // 保存答题记录
    const answerRecordResult = await db.run(
      `INSERT INTO answer_records (user_id, subject_id, subcategory_id, total_questions, correct_count, time_spent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        session.subject_id,
        session.subcategory_id,
        totalQuestions,
        correctCount,
        timeSpentSeconds
      ]
    )

    const answerRecordId = answerRecordResult.insertId

    // 保存到历史记录表（保持兼容），使用answer_record_id
    for (const result of results) {
      const question = sessionQuestions.find(q => q.id === result.questionId)
      if (!question) {
        continue
      }

      const originalQuestion = await db.get('SELECT * FROM questions WHERE id = ?', [question.id])

      if (!originalQuestion) {
        continue
      }

      // 解析正确答案
      let correctAnswer = originalQuestion.correct_answer
      try {
        const parsed = JSON.parse(correctAnswer)
        correctAnswer = typeof parsed === 'string' ? parsed : parsed
      } catch (e) {
        // 保持原始值
      }

      // 获取该题的打乱映射（前端传递的是 reverseMapping）
      const reverseMapping = shuffleMappings ? shuffleMappings[question.id] : null

      // 生成打乱后的选项
      let shuffledOptions = question.options
      if (reverseMapping) {
        // 解析原始选项
        const originalOptions =
          typeof question.options === 'string' ? JSON.parse(question.options) : question.options

        // 根据 reverseMapping（打乱后位置 -> 原始位置）生成打乱后的选项
        shuffledOptions = Object.keys(reverseMapping)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(key => originalOptions[reverseMapping[key]])
      }

      // 计算映射回原始位置的用户答案
      let userAnswerOriginal = result.userAnswer
      if (reverseMapping) {
        userAnswerOriginal = mapAnswerToOriginal(result.userAnswer, reverseMapping)
      }

      await db.run(
        `INSERT INTO question_attempts (user_id, question_id, subject_id, subcategory_id, user_answer, correct_answer, is_correct, answer_record_id, shuffled_options)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          question.id,
          session.subject_id,
          session.subcategory_id,
          JSON.stringify(userAnswerOriginal), // 保存映射回原始位置的答案
          JSON.stringify(correctAnswer), // 原始位置的正确答案
          result.isCorrect ? 1 : 0,
          answerRecordId,
          JSON.stringify(shuffledOptions) // 打乱后的选项
        ]
      )
    }

    // 处理错题
    for (const result of results) {
      const question = sessionQuestions.find(q => q.id === result.questionId)
      if (!question) {
        continue
      }

      if (!result.isCorrect) {
        // 答错题目，添加到错题巩固题库或重置正确次数
        if (session.subcategory_id === null) {
          // 错题巩固题库中答错，重置正确次数为0
          await db.run(
            `INSERT INTO error_collection (user_id, question_id, correct_count)
             VALUES (?, ?, 0)
             ON DUPLICATE KEY UPDATE correct_count = 0`,
            [userId, question.id]
          )
        } else {
          // 普通题库中答错，添加到错题巩固题库
          await db.run(
            `INSERT IGNORE INTO error_collection (user_id, question_id, correct_count)
             VALUES (?, ?, 0)`,
            [userId, question.id]
          )
        }
      } else if (session.subcategory_id === null) {
        // 错题巩固题库答对，增加正确次数
        const existingError = await db.get(
          'SELECT * FROM error_collection WHERE user_id = ? AND question_id = ?',
          [userId, question.id]
        )

        if (existingError) {
          const newCount = (existingError.correct_count || 0) + 1
          if (newCount >= 3) {
            // 达到3次正确，删除错题记录
            await db.run('DELETE FROM error_collection WHERE user_id = ? AND question_id = ?', [
              userId,
              question.id
            ])
            points += 1 // 加1分
          } else {
            await db.run(
              'UPDATE error_collection SET correct_count = ? WHERE user_id = ? AND question_id = ?',
              [newCount, userId, question.id]
            )
          }
        }
      }
    }

    // 更新用户积分
    await db.run('UPDATE users SET points = COALESCE(points, 0) + ? WHERE id = ?', [points, userId])

    // 准备返回数据
    const responseData = {
      score: correctCount,
      correctCount,
      totalQuestions,
      results,
      points
    }

    // 如果是错题巩固题库，返回更新后的统计数据
    if (session.subcategory_id === null) {
      const errorStats = await db.all(
        `SELECT question_id, correct_count FROM error_collection 
         WHERE user_id = ? AND question_id IN (${sessionQuestions.map(q => '?').join(',')})`,
        [userId, ...sessionQuestions.map(q => q.id)]
      )

      const stats = {}
      errorStats.forEach(stat => {
        stats[stat.question_id] = { correctCount: stat.correct_count }
      })

      responseData.stats = stats
    }

    res.json(responseData)
  } catch (error) {
    console.error('提交答案失败:', error)
    res.status(500).json({ error: '提交答案失败' })
  }
})

// 获取历史答题记录API
router.get('/history', async (req, res) => {
  try {
    const { studentId, limit = 20 } = req.query

    if (!studentId) {
      return res.status(400).json({ error: '缺少学生ID参数' })
    }

    const grade = req.query.grade
    const className = req.query.class

    // 查找用户ID
    const user = await db.get(
      'SELECT id FROM users WHERE student_id = ? AND grade = ? AND class = ?',
      [studentId, grade, className]
    )

    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    const userId = user.id

    // 获取历史答题记录
    const records = await db.all(
      `SELECT 
        ar.id,
        ar.subject_id,
        ar.subcategory_id,
        ar.total_questions,
        ar.correct_count,
        ar.time_spent,
        ar.created_at,
        s.name as subject_name,
        sc.name as subcategory_name
       FROM answer_records ar
       LEFT JOIN subjects s ON ar.subject_id = s.id
       LEFT JOIN subcategories sc ON ar.subcategory_id = sc.id
       WHERE ar.user_id = ?
       ORDER BY ar.created_at DESC
       LIMIT ${parseInt(limit)}`,
      [userId]
    )

    res.json(records)
  } catch (error) {
    console.error('获取历史答题记录失败:', error)
    res.status(500).json({ error: '获取历史答题记录失败' })
  }
})

// 清理过期会话（定时任务）
router.post('/cleanup', async (_req, res) => {
  try {
    const result = await db.run('DELETE FROM quiz_sessions WHERE expires_at < NOW()')

    res.json({
      success: true,
      deletedCount: result.affectedRows || 0
    })
  } catch (error) {
    console.error('清理过期会话失败:', error)
    res.status(500).json({ error: '清理过期会话失败' })
  }
})

module.exports = router
