const express = require('express')
const router = express.Router()
const db = require('../services/database')
const cacheService = require('../services/cache')
const ExcelJS = require('exceljs')

// 数据分析API
router.get('/', async (req, res) => {
  try {
    const {
      studentId,
      grade,
      class: className,
      subjectId,
      subcategoryIds,
      startDate,
      endDate
    } = req.query

    // 生成缓存键
    const cacheKey = cacheService.generateAnalysisKey({
      studentId,
      grade,
      className,
      subjectId,
      subcategoryIds,
      startDate,
      endDate
    })

    // 尝试从缓存获取
    const cachedAnalysis = cacheService.get(cacheKey)
    if (cachedAnalysis) {
      res.json(cachedAnalysis)
      return
    }

    // 构建基础查询条件
    let whereClause = 'WHERE 1=1'
    let errorWhereClause = 'WHERE 1=1'
    const params = []

    if (studentId) {
      whereClause += ' AND u.student_id = ?'
      errorWhereClause += ' AND u.student_id = ?'
      params.push(studentId)
    }

    if (grade) {
      whereClause += ' AND u.grade = ?'
      errorWhereClause += ' AND u.grade = ?'
      params.push(grade)
    }

    if (className) {
      whereClause += ' AND u.class = ?'
      errorWhereClause += ' AND u.class = ?'
      params.push(className)
    }

    if (subjectId) {
      whereClause += ' AND ar.subject_id = ?'
      errorWhereClause += ' AND qa.subject_id = ?'
      params.push(subjectId)
    }

    if (subcategoryIds) {
      const subcategoryArray = Array.isArray(subcategoryIds) ? subcategoryIds : [subcategoryIds]
      if (subcategoryArray.length > 0) {
        whereClause +=
          ' AND ar.subcategory_id IN (' + subcategoryArray.map(() => '?').join(', ') + ')'
        errorWhereClause +=
          ' AND qa.subcategory_id IN (' + subcategoryArray.map(() => '?').join(', ') + ')'
        params.push(...subcategoryArray)
      }
    }

    if (startDate) {
      whereClause += ' AND ar.created_at >= ?'
      errorWhereClause += ' AND qa.created_at >= ?'
      params.push(startDate)
    }

    if (endDate) {
      whereClause += ' AND ar.created_at <= ?'
      errorWhereClause += ' AND qa.created_at <= ?'
      params.push(endDate)
    }

    // 基础统计查询 - 与数据看板保持一致
    const basicStatsQuery = `
      SELECT
        (SELECT COUNT(*) FROM users) as totalUsers,
        COUNT(DISTINCT ar.id) as totalSessions,
        (SELECT COUNT(*) FROM questions) as totalQuestions,
        SUM(ar.correct_count) as totalCorrect,
        CASE WHEN SUM(ar.total_questions) > 0 THEN
          (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions)
        ELSE 0 END as overallAccuracy
      FROM answer_records ar
      INNER JOIN users u ON ar.user_id = u.id
      ${whereClause}
    `

    // 按年级分析查询
    const gradeAnalysisQuery = `
      SELECT
        u.grade,
        COUNT(DISTINCT u.id) as users,
        COUNT(DISTINCT ar.id) as sessions,
        SUM(ar.total_questions) as questions,
        SUM(ar.correct_count) as correct,
        CASE WHEN SUM(ar.total_questions) > 0 THEN
          (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions)
        ELSE 0 END as accuracy
      FROM answer_records ar
      INNER JOIN users u ON ar.user_id = u.id
      ${whereClause}
      GROUP BY u.grade
      ORDER BY u.grade
    `

    // 按学科分析查询
    const subjectAnalysisQuery = `
      SELECT
        s.name as subject,
        COUNT(DISTINCT ar.id) as sessions,
        SUM(ar.total_questions) as questions,
        SUM(ar.correct_count) as correct,
        CASE WHEN SUM(ar.total_questions) > 0 THEN
          (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions)
        ELSE 0 END as accuracy
      FROM answer_records ar
      INNER JOIN users u ON ar.user_id = u.id
      INNER JOIN subjects s ON ar.subject_id = s.id
      ${whereClause}
      GROUP BY ar.subject_id, s.name
      ORDER BY s.name
    `

    // 按时间趋势分析查询
    const timeAnalysisQuery = `
      SELECT
        DATE(ar.created_at) as date,
        COUNT(DISTINCT ar.id) as sessions,
        SUM(ar.total_questions) as questions,
        SUM(ar.correct_count) as correct,
        CASE WHEN SUM(ar.total_questions) > 0 THEN
          (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions)
        ELSE 0 END as accuracy
      FROM answer_records ar
      INNER JOIN users u ON ar.user_id = u.id
      ${whereClause}
      GROUP BY DATE(ar.created_at)
      ORDER BY date
    `

    // 按班级分析查询
    const classAnalysisQuery = `
      SELECT
        u.grade,
        u.class as class_num,
        CONCAT(u.grade, '年级', u.class, '班') as class_name,
        COUNT(DISTINCT u.id) as users,
        COUNT(DISTINCT ar.id) as sessions,
        SUM(ar.total_questions) as questions,
        SUM(ar.correct_count) as correct,
        CASE WHEN SUM(ar.total_questions) > 0 THEN
          (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions)
        ELSE 0 END as accuracy
      FROM answer_records ar
      INNER JOIN users u ON ar.user_id = u.id
      ${whereClause}
      GROUP BY u.grade, u.class
      ORDER BY u.grade, u.class
    `

    // 按子分类分析查询
    const subcategoryAnalysisQuery = `
      SELECT
        sc.name as subcategory,
        s.name as subject,
        COUNT(DISTINCT ar.id) as sessions,
        SUM(ar.total_questions) as questions,
        SUM(ar.correct_count) as correct,
        CASE WHEN SUM(ar.total_questions) > 0 THEN
          (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions)
        ELSE 0 END as accuracy
      FROM answer_records ar
      INNER JOIN users u ON ar.user_id = u.id
      INNER JOIN subjects s ON ar.subject_id = s.id
      LEFT JOIN subcategories sc ON ar.subcategory_id = sc.id
      ${whereClause}
      GROUP BY ar.subcategory_id, sc.name, s.name
      ORDER BY s.name, sc.name
    `

    // 答题时间分析查询
    const timeSpentAnalysisQuery = `
      SELECT
        CASE
          WHEN time_spent < 30 THEN '0-30秒'
          WHEN time_spent < 60 THEN '30-60秒'
          WHEN time_spent < 120 THEN '1-2分钟'
          WHEN time_spent < 300 THEN '2-5分钟'
          ELSE '5分钟以上'
        END as time_range,
        COUNT(*) as sessions,
        SUM(total_questions) as questions,
        SUM(correct_count) as correct,
        CASE WHEN SUM(total_questions) > 0 THEN
          (SUM(correct_count) * 100.0) / SUM(total_questions)
        ELSE 0 END as accuracy
      FROM answer_records ar
      INNER JOIN users u ON ar.user_id = u.id
      ${whereClause}
      GROUP BY time_range
      ORDER BY MIN(time_spent)
    `

    // 错题分析查询
    const errorAnalysisQuery = `
      SELECT
        s.name as subject,
        COUNT(qa.id) as total_attempts,
        SUM(CASE WHEN qa.is_correct = 0 THEN 1 ELSE 0 END) as error_count,
        CASE WHEN COUNT(qa.id) > 0 THEN
          (SUM(CASE WHEN qa.is_correct = 0 THEN 1 ELSE 0 END) * 100.0) / COUNT(qa.id)
        ELSE 0 END as error_rate
      FROM question_attempts qa
      INNER JOIN users u ON qa.user_id = u.id
      INNER JOIN subjects s ON qa.subject_id = s.id
      ${errorWhereClause}
      GROUP BY qa.subject_id, s.name
      ORDER BY error_rate DESC
    `

    // 执行所有查询
    const [
      basicStats,
      gradeAnalysis,
      subjectAnalysis,
      timeAnalysis,
      classAnalysis,
      subcategoryAnalysis,
      timeSpentAnalysis,
      errorAnalysis
    ] = await Promise.all([
      db.get(basicStatsQuery, params),
      db.all(gradeAnalysisQuery, params),
      db.all(subjectAnalysisQuery, params),
      db.all(timeAnalysisQuery, params),
      db.all(classAnalysisQuery, params),
      db.all(subcategoryAnalysisQuery, params),
      db.all(timeSpentAnalysisQuery, params),
      db.all(errorAnalysisQuery, params)
    ])

    // 构建分析数据
    const analysisData = {
      totalUsers: basicStats?.totalUsers || 0,
      totalSessions: basicStats?.totalSessions || 0,
      totalQuestions: basicStats?.totalQuestions || 0,
      totalCorrect: basicStats?.totalCorrect || 0,
      overallAccuracy: basicStats?.overallAccuracy || 0,
      gradeAnalysisList: gradeAnalysis || [],
      subjectAnalysisList: subjectAnalysis || [],
      timeAnalysisList: timeAnalysis || [],
      classAnalysisList: classAnalysis || [],
      subcategoryAnalysisList: subcategoryAnalysis || [],
      timeSpentAnalysisList: timeSpentAnalysis || [],
      errorAnalysisList: errorAnalysis || [],
      errorProneQuestions: []
    }

    // 执行错误率较高的题目查询
    let errorProneQuery = `
      SELECT q.id, q.subject_id, q.content, q.type, q.options, q.correct_answer, q.explanation, q.image_url, q.audio_url,
             COUNT(qa.id) as total_attempts,
             SUM(qa.is_correct) as correct_count,
             s.name as subject_name,
             sc.name as subcategory_name
      FROM questions q
      LEFT JOIN question_attempts qa ON q.id = qa.question_id
      LEFT JOIN users u ON qa.user_id = u.id
      LEFT JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN subcategories sc ON q.subcategory_id = sc.id
      WHERE 1=1
    `

    if (subjectId) {
      errorProneQuery += ' AND q.subject_id = ?'
    }

    if (subcategoryIds) {
      const subcategoryArray = Array.isArray(subcategoryIds) ? subcategoryIds : [subcategoryIds]
      if (subcategoryArray.length > 0) {
        errorProneQuery +=
          ' AND q.subcategory_id IN (' + subcategoryArray.map(() => '?').join(', ') + ')'
      }
    }

    if (grade) {
      errorProneQuery += ' AND u.grade = ?'
    }

    if (className) {
      errorProneQuery += ' AND u.class = ?'
    }

    if (startDate) {
      errorProneQuery += ' AND qa.created_at >= ?'
    }

    if (endDate) {
      errorProneQuery += ' AND qa.created_at <= ?'
    }

    errorProneQuery +=
      ' GROUP BY q.id HAVING total_attempts >= 3 ORDER BY (total_attempts - correct_count) DESC LIMIT 20'

    const errorProneData = await db.all(errorProneQuery, params)

    // 处理错误率较高的题目数据，添加选项和选择次数
    for (const question of errorProneData) {
      // 解析选项
      let options = []
      try {
        options = JSON.parse(question.options)
      } catch (e) {
        // console.error('解析选项失败:', e);
      }
      question.options = options

      // 解析正确答案
      let correctAnswer = question.correct_answer
      try {
        const parsedAnswer = JSON.parse(question.correct_answer)
        if (typeof parsedAnswer === 'string') {
          correctAnswer = parsedAnswer
        }
      } catch (e) {
        // 解析失败，使用原始值
      }
      question.correctAnswer = correctAnswer

      // 构建选项选择次数查询，应用相同的筛选条件
      let optionCountsQuery = `
        SELECT user_answer, COUNT(*) as count
        FROM question_attempts qa
        LEFT JOIN users u ON qa.user_id = u.id
        WHERE qa.question_id = ?
      `

      const optionCountsParams = [question.id]

      if (grade) {
        optionCountsQuery += ' AND u.grade = ?'
        optionCountsParams.push(grade)
      }

      if (className) {
        optionCountsQuery += ' AND u.class = ?'
        optionCountsParams.push(className)
      }

      if (startDate) {
        optionCountsQuery += ' AND qa.created_at >= ?'
        optionCountsParams.push(startDate)
      }

      if (endDate) {
        optionCountsQuery += ' AND qa.created_at <= ?'
        optionCountsParams.push(endDate)
      }

      optionCountsQuery += ' GROUP BY user_answer'

      const optionCounts = await db.all(optionCountsQuery, optionCountsParams)

      // 构建选项选择次数对象
      const optionCountsObj = {}
      if (optionCounts) {
        optionCounts.forEach(item => {
          optionCountsObj[item.user_answer] = item.count
        })
      }
      question.optionCounts = optionCountsObj
    }

    analysisData.errorProneQuestions = errorProneData || []

    // 缓存结果
    cacheService.set(cacheKey, analysisData)
    res.json(analysisData)
  } catch (error) {
    // console.error('获取分析数据失败:', error);
    res.status(500).json({ error: '获取分析数据失败' })
  }
})

// 分析报告下载API
router.get('/download', async (req, res) => {
  try {
    const {
      type,
      studentId,
      grade,
      class: className,
      subjectId,
      subcategoryIds,
      startDate,
      endDate
    } = req.query

    // 构建基础查询条件
    let whereClause = 'WHERE 1=1'
    const params = []

    if (studentId) {
      whereClause += ' AND u.student_id = ?'
      params.push(studentId)
    }

    if (grade) {
      whereClause += ' AND u.grade = ?'
      params.push(grade)
    }

    if (className) {
      whereClause += ' AND u.class = ?'
      params.push(className)
    }

    if (subjectId) {
      whereClause += ' AND ar.subject_id = ?'
      params.push(subjectId)
    }

    if (subcategoryIds) {
      const subcategoryArray = Array.isArray(subcategoryIds) ? subcategoryIds : [subcategoryIds]
      if (subcategoryArray.length > 0) {
        whereClause +=
          ' AND ar.subcategory_id IN (' + subcategoryArray.map(() => '?').join(', ') + ')'
        params.push(...subcategoryArray)
      }
    }

    if (startDate) {
      whereClause += ' AND ar.created_at >= ?'
      params.push(startDate)
    }

    if (endDate) {
      whereClause += ' AND ar.created_at <= ?'
      params.push(endDate)
    }

    // 获取答题记录数据
    const recordsQuery = `
      SELECT u.student_id, u.name, u.grade, u.class, s.name as subject,
             sc.name as subcategory, ar.total_questions, ar.correct_count,
             CASE WHEN ar.total_questions > 0 THEN
               (ar.correct_count * 100.0) / ar.total_questions
             ELSE 0 END as accuracy,
             ar.time_spent, ar.created_at
      FROM answer_records ar
      LEFT JOIN users u ON ar.user_id = u.id
      LEFT JOIN subjects s ON ar.subject_id = s.id
      LEFT JOIN subcategories sc ON ar.subcategory_id = sc.id
      ${whereClause}
      ORDER BY ar.created_at DESC
    `

    const records = await db.all(recordsQuery, params)

    // 转换数据为Excel格式
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('答题记录')

    // 添加表头
    const headers = [
      '学号',
      '姓名',
      '年级',
      '班级',
      '学科',
      '子分类',
      '总题数',
      '正确数',
      '正确率',
      '用时(秒)',
      '创建时间'
    ]
    worksheet.addRow(headers)

    // 添加数据行
    records.forEach(record => {
      worksheet.addRow([
        record.student_id,
        record.name,
        record.grade,
        record.class,
        record.subject,
        record.subcategory,
        record.total_questions,
        record.correct_count,
        record.accuracy ? record.accuracy.toFixed(2) + '%' : '0%',
        record.time_spent,
        record.created_at
      ])
    })

    // 设置表头样式
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

    // 自动调整列宽
    worksheet.columns.forEach(column => {
      let maxLength = 0
      column.eachCell({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 10
        if (columnLength > maxLength) {
          maxLength = columnLength
        }
      })
      column.width = maxLength < 10 ? 10 : maxLength + 2
    })

    // 生成Excel文件
    const excelBuffer = await workbook.xlsx.writeBuffer()

    // 设置响应头
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader('Content-Disposition', `attachment; filename=analysis_${Date.now()}.xlsx`)

    res.send(excelBuffer)
  } catch (error) {
    // console.error('下载分析报告失败:', error);
    res.status(500).json({ error: '下载分析报告失败' })
  }
})

module.exports = router
