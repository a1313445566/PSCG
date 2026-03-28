/**
 * 豆包 AI 服务 - 完全自主智能版本
 * AI 自己决定查询、输出格式、图表配置
 */

const crypto = require('crypto')
const db = require('./database')
const monitor = require('../utils/aiPerformanceMonitor')

class AIService {
  constructor() {
    this.config = {
      apiKey: null,
      apiUrl: 'https://ark.cn-beijing.volces.com/api/v3',
      model: null,
      enabled: true,
      cacheEnabled: true,
      timeout: 60000,
      cacheExpiry: 3600,
      maxConcurrent: 5,
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimitWait: 60000
    }

    this.configLoaded = false
  }

  /**
   * 从数据库加载配置
   */
  async loadConfig() {
    if (this.configLoaded) return

    try {
      const settings = await db.all(
        'SELECT setting_key, value FROM settings WHERE setting_key LIKE "ai%"'
      )

      settings.forEach(setting => {
        switch (setting.setting_key) {
          case 'aiApiKey':
            this.config.apiKey = setting.value
            break
          case 'aiApiUrl':
            this.config.apiUrl = setting.value
            break
          case 'aiModel':
            this.config.model = setting.value
            break
          case 'aiEnabled':
            this.config.enabled = setting.value === 'true'
            break
          case 'aiCacheEnabled':
            this.config.cacheEnabled = setting.value === 'true'
            break
          case 'aiTimeout':
            this.config.timeout = parseInt(setting.value) * 1000
            break
          case 'aiMaxConcurrent':
            this.config.maxConcurrent = parseInt(setting.value)
            break
          case 'aiRetryAttempts':
            this.config.retryAttempts = parseInt(setting.value)
            break
          case 'aiRetryDelay':
            this.config.retryDelay = parseInt(setting.value)
            break
          case 'aiRateLimitWait':
            this.config.rateLimitWait = parseInt(setting.value)
            break
          case 'aiCacheTTL':
            this.config.cacheExpiry = parseInt(setting.value)
            break
        }
      })

      this.configLoaded = true
    } catch (error) {
      console.error('[AI服务] 加载配置失败:', error)
      this.config.apiKey = process.env.DOUBAO_API_KEY
      this.config.apiUrl = process.env.DOUBAO_API_URL || this.config.apiUrl
      this.config.model = process.env.DOUBAO_MODEL
      this.configLoaded = true
    }
  }

  async reloadConfig() {
    this.configLoaded = false
    await this.loadConfig()
  }

  generateQueryHash(prompt, context) {
    const content = prompt + JSON.stringify(context)
    return crypto.createHash('sha256').update(content).digest('hex')
  }

  async getFromCache(hash) {
    if (!this.config.cacheEnabled) return null
    try {
      const row = await db.get(
        'SELECT result_text FROM ai_analysis_cache WHERE query_hash = ? AND expires_at > NOW()',
        [hash]
      )

      if (row) {
        monitor.recordCacheHit()
        return row.result_text
      } else {
        monitor.recordCacheMiss()
        return null
      }
    } catch (error) {
      console.error('[AI缓存] 读取失败:', error)
      return null
    }
  }

  async saveToCache(hash, query, result) {
    if (!this.config.cacheEnabled) return
    try {
      await db.run(
        `INSERT INTO ai_analysis_cache (query_hash, query_text, result_text, expires_at)
         VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND))`,
        [hash, query, result, this.config.cacheExpiry]
      )
    } catch (error) {
      console.error('[AI缓存] 保存失败:', error)
    }
  }

  async cleanExpiredCache() {
    try {
      const result = await db.run('DELETE FROM ai_analysis_cache WHERE expires_at < NOW()')
      return result.affectedRows
    } catch (error) {
      console.error('[AI缓存] 清理失败:', error)
      return 0
    }
  }

  /**
   * 从HTML内容中提取图片URL
   */
  extractImageUrls(html) {
    if (!html || typeof html !== 'string') return []

    const urls = []

    // 匹配 <img src="..."> 标签
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
    let match
    while ((match = imgRegex.exec(html)) !== null) {
      if (match[1] && !urls.includes(match[1])) {
        urls.push(match[1])
      }
    }

    // 匹配 markdown 格式 ![alt](url)
    const mdRegex = /!\[.*?\]\(([^)]+)\)/g
    while ((match = mdRegex.exec(html)) !== null) {
      if (match[1] && !urls.includes(match[1])) {
        urls.push(match[1])
      }
    }

    return urls
  }

  /**
   * 构建多模态消息内容（支持文本+图片）
   */
  buildMultimodalContent(prompt, imageUrls = []) {
    if (!imageUrls || imageUrls.length === 0) {
      return prompt // 纯文本
    }

    // 多模态格式：文本 + 图片
    const content = [{ type: 'text', text: prompt }]

    // 添加图片（最多3张，避免超出token限制）
    const limitedUrls = imageUrls.slice(0, 3)
    limitedUrls.forEach(url => {
      // 确保URL是完整的
      if (url.startsWith('http')) {
        content.push({
          type: 'image_url',
          image_url: { url: url }
        })
      }
    })

    return content
  }

  /**
   * 调用 AI API（核心方法，支持多模态）
   */
  async callAI(prompt, context = {}) {
    await this.loadConfig()

    if (!this.config.enabled) {
      throw new Error('AI 服务未启用')
    }

    if (!this.config.apiKey) {
      throw new Error('AI 服务未配置 API Key')
    }

    const hash = this.generateQueryHash(prompt, context)
    const cachedResult = await this.getFromCache(hash)
    if (cachedResult) return cachedResult

    const result = await this._callAPI(prompt, context)
    await this.saveToCache(hash, prompt, result)
    return result
  }

  async _callAPI(prompt, context = {}) {
    const { apiKey, apiUrl, model, timeout } = this.config

    monitor.recordApiCall()

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      // 构建消息内容（支持多模态）
      const userContent = this.buildMultimodalContent(prompt, context.imageUrls)

      const requestBody = {
        model: model,
        messages: [{ role: 'user', content: userContent }],
        temperature: 0.7,
        max_tokens: 4000
      }

      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[AI API] 错误响应:', errorText)
        throw new Error(`API 调用失败: ${response.status}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('AI 分析超时')
      }
      throw error
    }
  }

  /**
   * 获取数据库完整上下文（扩展版 - 包含所有高级表）
   */
  async getDatabaseContext() {
    try {
      const context = {
        schema: {
          // ===== 基础表（已使用）=====
          users: {
            fields: 'id, student_id, name, grade, class',
            description: '学生信息（name字段用于查询学生）'
          },
          subjects: {
            fields: 'id, name',
            description: '学科列表'
          },
          questions: {
            fields:
              'id, subject_id, subcategory_id, type, difficulty, content, options, correct_answer',
            description: '题目库'
          },
          subcategories: {
            fields: 'id, subject_id, name',
            description: '知识点分类'
          },
          answer_records: {
            fields:
              'id, user_id, subject_id, subcategory_id, total_questions, correct_count, created_at',
            description: '答题记录（汇总数据：总题数、正确数）'
          },
          question_attempts: {
            fields: 'id, question_id, user_id, subject_id, is_correct, selected_answer, created_at',
            description: '题目尝试记录'
          },
          error_collection: {
            fields: 'id, user_id, question_id, created_at',
            description: '错题收藏'
          },

          // ===== 语义分析表（新增 - 高价值）=====
          question_semantic_analysis: {
            fields:
              'id, question_id, keywords, auto_tags, knowledge_points, difficulty_factors, similar_questions, content_quality_score, ai_analysis',
            description:
              '题目语义分析结果（AI分析的题目特征：关键词、自动标签、知识点、难度因素、质量分数）。用于智能搜索题目、推荐相似题目、分析题目质量。'
          },
          question_tags: {
            fields: 'id, tag_name, tag_category, usage_count',
            description:
              '题目标签库（题型、难度、考点、易错点等分类标签）。用于题目分类和标签统计。'
          },
          question_tag_relations: {
            fields: 'question_id, tag_id',
            description: '题目与标签的关联关系'
          },

          // ===== 行为分析表（新增 - 高价值）=====
          answer_behavior: {
            fields:
              'id, user_id, question_id, answer_time, answer_modifications, is_first_answer_correct, hesitation_time, skipped_and_returned, session_id',
            description:
              '答题行为详情（答题时间、修改次数、犹豫时间、是否跳题等）。用于分析学生学习行为模式、答题习惯、注意力集中程度。'
          },
          user_learning_style: {
            fields:
              'id, user_id, avg_answer_time, answer_time_stability, avg_modifications, skip_rate, preferred_difficulty, error_patterns, learning_style_tags, ai_suggestion',
            description:
              '用户学习风格分析（AI生成的风格标签、错误模式、个性化建议）。用于了解学生学习特点、提供个性化建议。'
          },
          error_patterns: {
            fields:
              'id, user_id, question_id, error_type, error_reason, improvement_suggestion, related_knowledge_points',
            description:
              '错题模式分析（错误类型、原因、改进建议）。用于分析学生常见错误类型和薄弱知识点。'
          },

          // ===== 学习进度表（新增 - 高价值）=====
          learning_progress: {
            fields:
              'id, user_id, subject_id, subcategory_id, mastery_level, progress_percentage, recent_accuracy, accuracy_trend, ai_suggestion',
            description:
              '学习进度追踪（知识点掌握程度、正确率趋势、AI建议）。用于分析知识点掌握情况、学习进度变化、生成学习建议。'
          },

          // ===== AI 辅助表（新增 - 中等价值）=====
          ai_analysis_history: {
            fields: 'id, user_id, question, result, filters, created_at',
            description: 'AI分析历史记录。可用于查看用户的分析历史、分析热点问题。'
          },
          ai_analysis_queue: {
            fields: 'id, task_type, target_id, priority, status, retry_count, result',
            description: 'AI任务队列（任务类型、状态、优先级）。用于监控AI任务执行情况。'
          },

          // ===== 答题会话表（新增 - 高价值）=====
          quiz_sessions: {
            fields: 'id, user_id, subject_id, subcategory_id, questions, created_at, expires_at',
            description: '答题会话（一组题目的答题记录）。用于分析答题连续性、答题时段偏好。'
          },
          quiz_attempts: {
            fields: 'id, quiz_session_id, question_id, user_answer, is_correct, created_at',
            description: '答题尝试详情（属于某个会话的具体答题记录）。用于分析答题过程、答案分布。'
          }
        },
        data: {}
      }

      // ===== 获取基础数据 =====

      // 获取所有学生姓名和ID映射
      const students = await db.query(
        'SELECT id, student_id, name, grade, class FROM users ORDER BY name'
      )
      context.data.students = students

      // 获取学科列表
      const subjects = await db.query('SELECT id, name FROM subjects ORDER BY id')
      context.data.subjects = subjects

      // 获取年级范围
      const grades = await db.query(
        'SELECT DISTINCT grade FROM users WHERE grade IS NOT NULL ORDER BY grade'
      )
      context.data.grades = grades.map(g => g.grade)

      // 获取班级范围
      const classes = await db.query(
        'SELECT DISTINCT class FROM users WHERE class IS NOT NULL ORDER BY class'
      )
      context.data.classes = classes.map(c => c.class)

      // 获取所有知识点
      const subcategories = await db.query(
        'SELECT id, subject_id, name FROM subcategories ORDER BY name'
      )
      context.data.subcategories = subcategories

      // 获取基础统计信息
      const stats = await db.get(`
        SELECT 
          (SELECT COUNT(*) FROM users) as totalStudents,
          (SELECT COUNT(*) FROM questions) as totalQuestions,
          (SELECT COUNT(*) FROM answer_records) as totalRecords,
          (SELECT COUNT(*) FROM error_collection) as totalErrors
      `)
      context.data.stats = stats

      // ===== 获取高级数据（如果存在）=====

      // 获取题目语义分析示例（前5条）
      try {
        const semanticExamples = await db.query(`
          SELECT qsa.question_id, q.content, qsa.keywords, qsa.auto_tags, 
                 qsa.knowledge_points, qsa.content_quality_score
          FROM question_semantic_analysis qsa
          INNER JOIN questions q ON qsa.question_id = q.id
          LIMIT 5
        `)
        if (semanticExamples.length > 0) {
          context.data.semanticAnalysisExamples = semanticExamples
          context.data.stats.semanticAnalyzed = await db
            .get('SELECT COUNT(*) as count FROM question_semantic_analysis')
            .then(r => r.count)
        }
      } catch (e) {
        // 表可能不存在或为空，忽略
      }

      // 获取热门标签（前20个）
      try {
        const popularTags = await db.query(`
          SELECT tag_name, tag_category, usage_count 
          FROM question_tags 
          ORDER BY usage_count DESC 
          LIMIT 20
        `)
        if (popularTags.length > 0) {
          context.data.popularTags = popularTags
        }
      } catch (e) {
        // 表可能不存在或为空，忽略
      }

      // 获取学习进度统计
      try {
        const progressStats = await db.get(`
          SELECT 
            COUNT(*) as totalProgressRecords,
            AVG(progress_percentage) as avgProgress,
            AVG(recent_accuracy) as avgAccuracy
          FROM learning_progress
        `)
        if (progressStats && progressStats.totalProgressRecords > 0) {
          context.data.progressStats = progressStats
        }
      } catch (e) {
        // 表可能不存在或为空，忽略
      }

      // 获取学习风格统计
      try {
        const learningStyleStats = await db.get(`
          SELECT 
            COUNT(*) as totalAnalyzed,
            AVG(avg_answer_time) as avgAnswerTime,
            AVG(skip_rate) as avgSkipRate
          FROM user_learning_style
        `)
        if (learningStyleStats && learningStyleStats.totalAnalyzed > 0) {
          context.data.learningStyleStats = learningStyleStats
        }
      } catch (e) {
        // 表可能不存在或为空，忽略
      }

      // 获取答题行为统计
      try {
        const behaviorStats = await db.get(`
          SELECT 
            COUNT(*) as totalBehaviors,
            AVG(answer_time) as avgAnswerTime,
            AVG(answer_modifications) as avgModifications,
            AVG(hesitation_time) as avgHesitationTime
          FROM answer_behavior
        `)
        if (behaviorStats && behaviorStats.totalBehaviors > 0) {
          context.data.behaviorStats = behaviorStats
        }
      } catch (e) {
        // 表可能不存在或为空，忽略
      }

      return context
    } catch (error) {
      console.error('[AI上下文] 获取失败:', error)
      // 返回基础schema
      return {
        schema: {
          users: { fields: 'id, student_id, name, grade, class', description: '学生信息' },
          subjects: { fields: 'id, name', description: '学科' }
        },
        data: {}
      }
    }
  }

  /**
   * 智能分析入口
   */
  async smartAnalyze(question, filters = {}) {
    // 第一步：让 AI 决定查询什么
    const queryPlan = await this.planQuery(question, filters)

    // 第二步：执行查询
    const queryResults = await this.executeQueryPlan(queryPlan)

    // 第三步：让 AI 自由输出
    return await this.analyzeWithResults(question, queryResults)
  }

  /**
   * 让 AI 规划查询（完全自主）
   */
  async planQuery(question, filters = {}) {
    // 动态获取数据库完整上下文
    const dbContext = await this.getDatabaseContext()

    const prompt = `你是一个数据库专家，拥有完全自主权。

**数据库完整信息**：
${JSON.stringify(dbContext, null, 2)}

用户问题: ${question}
额外筛选: ${JSON.stringify(filters)}

**你的自由**：
- 你可以查询任何你想要的数据
- 你可以自由决定查询条件
- 学生姓名、学科、年级等所有字段都开放给你
- 不需要验证、不需要限制，自主决策

请返回 JSON 格式的查询计划（只返回 JSON）：
{
  "studentName": "学生姓名或null",
  "grade": 年级数字或null,
  "class": 班级数字或null,
  "subjectId": 学科ID或null,
  "timeRange": "today"|"week"|"month"|"all",
  "focusAreas": ["subject"|"grade"|"class"|"trend"|"question"|"user"|"error"|"individual"],
  "limit": 记录数限制
}`

    const response = await this.callAI(prompt)

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('[AI] 解析查询计划失败:', e)
    }

    return {
      studentName: null,
      grade: null,
      class: null,
      subjectId: null,
      timeRange: 'all',
      focusAreas: ['subject', 'grade', 'class'],
      limit: 10
    }
  }

  /**
   * 执行查询计划
   */
  async executeQueryPlan(plan) {
    const results = {}
    const conditions = ['1=1']
    const params = []

    // 如果查询特定用户
    if (plan.focusAreas?.includes('individual') || plan.studentName) {
      // 查询用户基本信息
      const userInfo = await db.get(
        `
        SELECT id, student_id, name, grade, class
        FROM users
        WHERE name = ?
      `,
        [plan.studentName]
      )

      if (userInfo) {
        results.userInfo = userInfo

        // 查询该用户的答题统计
        results.userStats = await db.get(
          `
          SELECT 
            COUNT(DISTINCT ar.id) as totalSessions,
            SUM(ar.total_questions) as totalQuestions,
            SUM(ar.correct_count) as totalCorrect,
            CASE WHEN SUM(ar.total_questions) > 0 
              THEN (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) 
              ELSE 0 END as overallAccuracy
          FROM answer_records ar
          WHERE ar.user_id = ?
        `,
          [userInfo.id]
        )

        // 查询各学科表现
        results.userSubjectStats = await db.query(
          `
          SELECT s.name as subject, COUNT(DISTINCT ar.id) as sessions,
            SUM(ar.total_questions) as questions, SUM(ar.correct_count) as correct,
            CASE WHEN SUM(ar.total_questions) > 0 
              THEN (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) 
              ELSE 0 END as accuracy
          FROM answer_records ar
          INNER JOIN subjects s ON ar.subject_id = s.id
          WHERE ar.user_id = ?
          GROUP BY ar.subject_id, s.name
          ORDER BY accuracy ASC
        `,
          [userInfo.id]
        )

        // 查询最近答题记录
        results.recentRecords = await db.query(
          `
          SELECT ar.id, s.name as subject, sub.name as subcategory,
            ar.total_questions, ar.correct_count,
            CASE WHEN ar.total_questions > 0 
              THEN (ar.correct_count * 100.0) / ar.total_questions 
              ELSE 0 END as accuracy,
            ar.created_at
          FROM answer_records ar
          INNER JOIN subjects s ON ar.subject_id = s.id
          LEFT JOIN subcategories sub ON ar.subcategory_id = sub.id
          WHERE ar.user_id = ?
          ORDER BY ar.created_at DESC
          LIMIT 20
        `,
          [userInfo.id]
        )

        // 查询错题收藏
        results.userErrors = await db.query(
          `
          SELECT q.content, s.name as subject, ec.created_at
          FROM error_collection ec
          INNER JOIN questions q ON ec.question_id = q.id
          INNER JOIN subjects s ON q.subject_id = s.id
          WHERE ec.user_id = ?
          ORDER BY ec.created_at DESC
          LIMIT 20
        `,
          [userInfo.id]
        )

        // 查询知识点薄弱点（使用实际的答题记录）
        results.userWeakPoints = await db.query(
          `
          SELECT sub.name as subcategory, s.name as subject,
            COUNT(DISTINCT ar.id) as sessions,
            COUNT(DISTINCT qa.id) as questions,
            SUM(qa.is_correct) as correct,
            CASE WHEN COUNT(DISTINCT qa.id) > 0 
              THEN (SUM(qa.is_correct) * 100.0) / COUNT(DISTINCT qa.id) 
              ELSE 0 END as accuracy
          FROM answer_records ar
          INNER JOIN subcategories sub ON ar.subcategory_id = sub.id
          INNER JOIN subjects s ON ar.subject_id = s.id
          LEFT JOIN question_attempts qa ON qa.answer_record_id = ar.id
          WHERE ar.user_id = ?
          GROUP BY ar.subcategory_id, sub.name, s.name
          HAVING sessions >= 1
          ORDER BY accuracy ASC
          LIMIT 10
        `,
          [userInfo.id]
        )

        return results // 返回个人数据，跳过其他统计
      } else {
        // 用户不存在，返回完整学生列表供AI分析
        const allStudents = await db.query(
          'SELECT id, student_id, name, grade, class FROM users ORDER BY name'
        )
        return {
          queryStatus: 'studentNotFound',
          searchedName: plan.studentName,
          allStudents: allStudents,
          stats: {
            totalStudents: allStudents.length,
            subjects: dbContext?.data?.subjects || []
          }
        }
      }
    }

    // 处理年级/班级筛选
    if (plan.grade) {
      conditions.push('u.grade = ?')
      params.push(plan.grade)
    }
    if (plan.class) {
      conditions.push('u.class = ?')
      params.push(plan.class)
    }
    if (plan.subjectId) {
      conditions.push('ar.subject_id = ?')
      params.push(plan.subjectId)
    }

    if (plan.timeRange === 'today') {
      conditions.push('DATE(ar.created_at) = CURDATE()')
    } else if (plan.timeRange === 'week') {
      conditions.push('ar.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)')
    } else if (plan.timeRange === 'month') {
      conditions.push('ar.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)')
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`
    const limit = plan.limit || 10

    // 基础统计
    results.basicStats = await db.get(
      `
      SELECT 
        COUNT(DISTINCT u.id) as totalUsers,
        COUNT(DISTINCT ar.id) as totalSessions,
        SUM(ar.total_questions) as totalQuestions,
        SUM(ar.correct_count) as totalCorrect,
        CASE WHEN SUM(ar.total_questions) > 0 
          THEN (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) 
          ELSE 0 END as overallAccuracy
      FROM answer_records ar
      INNER JOIN users u ON ar.user_id = u.id
      ${whereClause}
    `,
      params
    )

    // 根据关注点查询
    if (plan.focusAreas?.includes('subject')) {
      results.subjectAnalysis = await db.query(
        `
        SELECT s.name as subject, COUNT(DISTINCT ar.id) as sessions,
          SUM(ar.total_questions) as questions, SUM(ar.correct_count) as correct,
          CASE WHEN SUM(ar.total_questions) > 0 THEN (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) ELSE 0 END as accuracy
        FROM answer_records ar
        INNER JOIN users u ON ar.user_id = u.id
        INNER JOIN subjects s ON ar.subject_id = s.id
        ${whereClause}
        GROUP BY ar.subject_id, s.name ORDER BY accuracy ASC
      `,
        params
      )
    }

    if (plan.focusAreas?.includes('grade')) {
      results.gradeAnalysis = await db.query(
        `
        SELECT u.grade, COUNT(DISTINCT ar.id) as sessions, COUNT(DISTINCT u.id) as users,
          SUM(ar.total_questions) as questions, SUM(ar.correct_count) as correct,
          CASE WHEN SUM(ar.total_questions) > 0 THEN (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) ELSE 0 END as accuracy
        FROM answer_records ar
        INNER JOIN users u ON ar.user_id = u.id
        ${whereClause}
        GROUP BY u.grade ORDER BY u.grade
      `,
        params
      )
    }

    if (plan.focusAreas?.includes('class')) {
      results.classAnalysis = await db.query(
        `
        SELECT u.grade, u.class, COUNT(DISTINCT ar.id) as sessions, COUNT(DISTINCT u.id) as users,
          CASE WHEN SUM(ar.total_questions) > 0 THEN (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) ELSE 0 END as accuracy
        FROM answer_records ar
        INNER JOIN users u ON ar.user_id = u.id
        ${whereClause}
        GROUP BY u.grade, u.class ORDER BY accuracy ASC LIMIT ${limit}
      `,
        params
      )
    }

    if (plan.focusAreas?.includes('trend')) {
      results.trendAnalysis = await db.query(
        `
        SELECT DATE(ar.created_at) as date, COUNT(DISTINCT ar.id) as sessions,
          SUM(ar.total_questions) as questions, SUM(ar.correct_count) as correct,
          CASE WHEN SUM(ar.total_questions) > 0 THEN (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) ELSE 0 END as accuracy
        FROM answer_records ar
        INNER JOIN users u ON ar.user_id = u.id
        ${whereClause} AND ar.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(ar.created_at) ORDER BY date DESC
      `,
        params
      )
    }

    if (plan.focusAreas?.includes('question') || plan.focusAreas?.includes('knowledge')) {
      results.subcategoryAnalysis = await db.query(
        `
        SELECT s.name as subject, sub.name as subcategory,
          COUNT(DISTINCT ar.id) as sessions, COUNT(DISTINCT qa.id) as questions,
          SUM(qa.is_correct) as correct,
          CASE WHEN COUNT(DISTINCT qa.id) > 0 THEN (SUM(qa.is_correct) * 100.0) / COUNT(DISTINCT qa.id) ELSE 0 END as accuracy
        FROM answer_records ar
        INNER JOIN users u ON ar.user_id = u.id
        INNER JOIN subjects s ON ar.subject_id = s.id
        INNER JOIN subcategories sub ON ar.subcategory_id = sub.id
        LEFT JOIN question_attempts qa ON qa.answer_record_id = ar.id
        ${whereClause}
        GROUP BY ar.subject_id, ar.subcategory_id, s.name, sub.name
        ORDER BY accuracy ASC LIMIT ${limit}
      `,
        params
      )
    }

    if (plan.focusAreas?.includes('user')) {
      // 用户活跃度统计：只筛选年级/班级，时间条件已在 CASE WHEN 中处理
      const userWhereClause =
        conditions.length > 1
          ? `WHERE ${conditions.filter(c => !c.includes('ar.')).join(' AND ')}`
          : ''
      const userParams = params.filter((p, i) => {
        const cond = conditions[i]
        return cond && !cond.includes('ar.')
      })

      results.userActivityStats = await db.get(
        `
        SELECT COUNT(DISTINCT u.id) as totalUsers,
          COUNT(DISTINCT CASE WHEN ar.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN u.id END) as activeToday,
          COUNT(DISTINCT CASE WHEN ar.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN u.id END) as activeThisWeek,
          COUNT(DISTINCT CASE WHEN ar.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN u.id END) as activeThisMonth
        FROM users u
        LEFT JOIN answer_records ar ON u.id = ar.user_id
        ${userWhereClause}
      `,
        userParams
      )
    }

    if (plan.focusAreas?.includes('error')) {
      // 错题统计：只筛选年级/班级，不包含时间条件
      const errorWhereClause =
        conditions.length > 1
          ? `WHERE ${conditions.filter(c => !c.includes('ar.') && !c.includes('DATE')).join(' AND ')}`
          : ''
      const errorParams = params.filter((p, i) => {
        const cond = conditions[i]
        return cond && !cond.includes('ar.') && !cond.includes('DATE')
      })

      results.errorStats = await db.get(
        `
        SELECT COUNT(DISTINCT ec.user_id) as usersWithErrors,
          COUNT(DISTINCT ec.question_id) as uniqueErrorQuestions
        FROM error_collection ec
        INNER JOIN users u ON ec.user_id = u.id
        ${errorWhereClause}
      `,
        errorParams
      )

      results.frequentErrors = await db.query(
        `
        SELECT q.content, s.name as subject, COUNT(DISTINCT ec.user_id) as errorCount
        FROM error_collection ec
        INNER JOIN questions q ON ec.question_id = q.id
        INNER JOIN subjects s ON q.subject_id = s.id
        INNER JOIN users u ON ec.user_id = u.id
        ${errorWhereClause}
        GROUP BY ec.question_id, q.content, s.name
        HAVING errorCount >= 2
        ORDER BY errorCount DESC LIMIT ${limit}
      `,
        errorParams
      )
    }

    // 题目统计（总是查询）
    results.questionStats = await db.get(`
      SELECT COUNT(*) as totalQuestions,
        COUNT(CASE WHEN type = 'single' THEN 1 END) as singleChoice,
        COUNT(CASE WHEN type = 'multiple' THEN 1 END) as multipleChoice,
        COALESCE(AVG(difficulty), 0) as avgDifficulty
      FROM questions
    `)

    return results
  }

  /**
   * 让 AI 自由输出分析结果
   */
  async analyzeWithResults(question, queryResults) {
    const prompt = `你是一个专业的教育数据分析师。

用户问题：${question}

查询到的原始数据：
\`\`\`json
${JSON.stringify(queryResults, null, 2)}
\`\`\`

**你有完全自主权决定**：
- 输出格式、分析角度、语言风格
- 是否需要图表、图表类型、样式、颜色等所有细节
- 如果学生不存在，如何提示用户

**如果需要图表**，可以在回答任意位置插入 VChart 配置：
\`\`\`vchart
{
  "type": "图表类型（如 bar/line/pie/radar/rose/scatter/wordCloud 等）",
  "data": [{ "id": "data", "values": [...] }],
  ...其他配置由你自主决定
}
\`\`\`

图表配置必须是合法的 JSON 格式。你可以插入多个图表。

请开始你的分析。`

    return await this.callAI(prompt)
  }

  /**
   * 生成题目解析（支持图片答案）
   */
  async generateQuestionExplanation(question) {
    // 提取选项中的图片URL
    const imageUrls = []
    if (question.options && Array.isArray(question.options)) {
      question.options.forEach(opt => {
        const urls = this.extractImageUrls(opt)
        imageUrls.push(...urls)
      })
    }

    const prompt = `请为以下题目生成解析：

题目：${question.content}
选项：${JSON.stringify(question.options)}
正确答案：${question.correctAnswer}
题目类型：${question.type}
${imageUrls.length > 0 ? `\n注意：选项中包含图片，请结合图片内容进行分析。` : ''}

你可以自由决定解析的格式、风格和内容深度。如果答案涉及图片，请详细描述图片内容。`

    return await this.callAI(prompt, { imageUrls })
  }

  /**
   * 批量分析题目（支持图片答案）
   */
  async analyzeQuestionsWithStats(questionsWithStats, summaryStats) {
    // 提取所有图片URL
    const imageUrls = []
    questionsWithStats.forEach(q => {
      if (q.options && Array.isArray(q.options)) {
        q.options.forEach(opt => {
          const urls = this.extractImageUrls(opt)
          imageUrls.push(...urls)
        })
      }
    })

    const prompt = `你是教育数据分析专家。

原始数据：
\`\`\`json
${JSON.stringify({ questions: questionsWithStats, summary: summaryStats }, null, 2)}
\`\`\`

${imageUrls.length > 0 ? `注意：部分题目选项包含图片，请结合图片内容进行分析。` : ''}

**你有完全自主权决定**：
- 分析哪些角度、输出格式、语言风格
- 是否需要图表、图表类型和样式
- 重点分析什么内容

如果需要图表，可以在回答任意位置插入 VChart 配置：
\`\`\`vchart
{ "type": "图表类型", "data": [...], ... }
\`\`\`

开始你的分析。`

    return await this.callAI(prompt, { imageUrls })
  }

  /**
   * 单个题目深度分析（支持图片）
   */
  async analyzeSingleQuestionWithStats(questionStats) {
    // 提取图片URL
    const imageUrls = []
    if (questionStats.options && Array.isArray(questionStats.options)) {
      questionStats.options.forEach(opt => {
        const urls = this.extractImageUrls(opt)
        imageUrls.push(...urls)
      })
    }

    const prompt = `你是教育数据分析专家。

题目数据：
\`\`\`json
${JSON.stringify(questionStats, null, 2)}
\`\`\`

${imageUrls.length > 0 ? `注意：选项中包含图片，请结合图片内容进行分析。` : ''}

**你有完全自主权决定**分析内容、格式、是否需要图表。

如果需要图表，可以使用 VChart 配置。开始分析。`

    return await this.callAI(prompt, { imageUrls })
  }

  /**
   * 错题分析（支持图片答案）
   */
  async analyzeErrorQuestions(userId, errorQuestions) {
    // 提取错题中的图片URL
    const imageUrls = []
    errorQuestions.forEach(q => {
      if (q.options && Array.isArray(q.options)) {
        q.options.forEach(opt => {
          const urls = this.extractImageUrls(opt)
          imageUrls.push(...urls)
        })
      }
    })

    const prompt = `你是教育专家，擅长分析学生的错题。

学生ID: ${userId}
错题列表：
\`\`\`json
${JSON.stringify(errorQuestions, null, 2)}
\`\`\`

${imageUrls.length > 0 ? `注意：部分题目选项包含图片，请结合图片内容分析。` : ''}

**你有完全自主权决定**分析角度、输出格式、是否需要图表。

开始分析。`

    return await this.callAI(prompt, { imageUrls })
  }

  /**
   * 题目质量评估（支持图片答案）
   */
  async evaluateQuestionQuality(question, answerStats = null) {
    // 提取图片URL
    const imageUrls = []
    if (question.options && Array.isArray(question.options)) {
      question.options.forEach(opt => {
        const urls = this.extractImageUrls(opt)
        imageUrls.push(...urls)
      })
    }

    const prompt = `请评估以下题目的质量：

题目内容：
\`\`\`json
${JSON.stringify(question, null, 2)}
\`\`\`

${
  answerStats
    ? `答题统计：
\`\`\`json
${JSON.stringify(answerStats, null, 2)}
\`\`\``
    : ''
}

${imageUrls.length > 0 ? `注意：选项中包含图片，请评估图片的清晰度、相关性和对答题的影响。` : ''}

请从以下维度评估：
1. 题目描述的清晰度和准确性
2. 选项的合理性（是否有明显干扰项）
3. 答案的准确性
4. 难度设置是否合理
5. 图片质量（如果有）
6. 区分度（如果提供了答题统计）
7. 改进建议

你可以自由决定输出格式。`

    return await this.callAI(prompt, { imageUrls })
  }

  /**
   * 带重试机制的 AI 调用
   */
  async callWithRetry(fn, options = {}) {
    const {
      maxRetries = this.config.retryAttempts,
      retryDelay = this.config.retryDelay,
      backoffMultiplier = 2
    } = options

    let lastError

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error

        // 检查是否为速率限制错误
        if (error.message && error.message.includes('rate_limit')) {
          const waitTime = this.extractRetryAfter(error) || this.config.rateLimitWait
          console.log(`[AI重试] 速率限制，等待 ${waitTime}ms`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }

        // 检查是否为可重试错误
        if (!this.isRetryableError(error)) {
          throw error
        }

        // 计算延迟时间（指数退避）
        const delay = retryDelay * Math.pow(backoffMultiplier, attempt)
        console.log(`[AI重试] 第 ${attempt + 1}/${maxRetries} 次重试，等待 ${delay}ms`)

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  /**
   * 判断是否为可重试错误
   */
  isRetryableError(error) {
    const retryableMessages = [
      'network',
      'timeout',
      'ECONNRESET',
      'ETIMEDOUT',
      'rate_limit',
      '429',
      '503',
      '502'
    ]

    return retryableMessages.some(
      msg => error.message && error.message.toLowerCase().includes(msg.toLowerCase())
    )
  }

  /**
   * 从错误中提取重试等待时间
   */
  extractRetryAfter(error) {
    const match = error.message && error.message.match(/retry.?after.?(\d+)/i)
    return match ? parseInt(match[1]) * 1000 : null
  }

  /**
   * 文本截断
   */
  truncateText(text, maxLength = 500) {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  /**
   * 分析题目语义
   */
  async analyzeQuestionSemantic(questionData) {
    const prompt = `请分析以下题目的语义特征：

题目ID: ${questionData.id}
题目内容: ${this.truncateText(questionData.content, 500)}
题目类型: ${questionData.type}
难度: ${questionData.difficulty}
学科: ${questionData.subject || '未知'}
知识点: ${questionData.subcategory || '未知'}

请返回 JSON 格式的分析结果（只返回 JSON）：
{
  "keywords": ["关键词1", "关键词2", ...],
  "autoTags": ["自动标签1", "自动标签2", ...],
  "knowledgePoints": ["知识点1", "知识点2", ...],
  "difficultyFactors": {
    "conceptComplexity": 1-5,
    "calculationRequired": true/false,
    "contextUnderstanding": 1-5
  },
  "contentQualityScore": 1-100,
  "aiAnalysis": "详细的 AI 分析文本"
}`

    const response = await this.callWithRetry(() => this.callAI(prompt))

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('[AI] 解析题目语义分析失败:', e)
    }

    // 返回默认值
    return {
      keywords: [],
      autoTags: [],
      knowledgePoints: [],
      difficultyFactors: {},
      contentQualityScore: 0,
      aiAnalysis: response
    }
  }

  /**
   * 分析用户学习风格 - 完全自主智能，无硬编码
   */
  async analyzeUserLearningStyle(data) {
    const prompt = `你是教育数据分析专家，拥有完全自主权。

**用户数据**：
- 用户ID: ${data.userId}
- 平均答题时间: ${data.behaviorData.avgAnswerTime.toFixed(2)} 秒
- 答题时间稳定性: ${data.behaviorData.answerTimeStability.toFixed(2)}
- 平均修改次数: ${data.behaviorData.avgModifications.toFixed(2)}
- 跳题率: ${(data.behaviorData.skipRate * 100).toFixed(2)}%
- 错误模式: ${JSON.stringify(data.behaviorData.errorPatterns)}
- 样本大小: ${data.behaviorData.sampleSize}

**你的完全自主权**：
- 你可以自由决定如何分析这些数据
- 你可以自由定义学习风格的标签类型和名称
- 你可以自由决定分析的维度和角度
- 你可以自由决定建议的内容、风格和深度
- 不需要遵循任何预设的分类框架
- 不需要使用任何预定义的标签
- 完全基于数据本身进行创造性分析

**输出要求**：
请返回 JSON 格式（只返回 JSON，不要其他文字）：
{
  "learningStyleTags": ["你自主定义的风格标签1", "你自主定义的风格标签2", ...],
  "aiSuggestion": "你的个性化学习建议（可以包含多个段落、列表、具体措施等）",
  "analysisDimensions": {
    "你自主定义的分析维度1": "分析结果",
    "你自主定义的分析维度2": "分析结果"
  },
  "strengths": ["你发现的优势1", "优势2"],
  "improvements": ["你发现的改进点1", "改进点2"],
  "recommendedActions": ["你建议的具体行动1", "行动2"]
}

注意：所有字段名称和内容都由你自主决定，以上只是一个示例框架。`

    const response = await this.callWithRetry(() => this.callAI(prompt))

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('[AI] 解析学习风格分析失败:', e)
    }

    // 返回 AI 的原始输出，不预设默认值
    return {
      learningStyleTags: [],
      aiSuggestion: response,
      rawOutput: response // 保留原始输出供前端展示
    }
  }

  /**
   * 分析错题原因
   */
  async analyzeErrorReason(errorData) {
    const prompt = `请分析以下错题的原因：

题目内容: ${this.truncateText(errorData.questionContent, 300)}
题目类型: ${errorData.questionType}
难度: ${errorData.difficulty}
用户答案: ${errorData.userAnswer}
正确答案: ${errorData.correctAnswer}

请返回 JSON 格式的分析结果（只返回 JSON）：
{
  "errorType": "概念理解错误/计算错误/审题错误/知识点缺失",
  "errorReason": "详细的错误原因分析",
  "improvementSuggestion": "改进建议",
  "relatedKnowledgePoints": ["相关知识点1", "相关知识点2", ...]
}`

    const response = await this.callWithRetry(() => this.callAI(prompt))

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('[AI] 解析错题分析失败:', e)
    }

    // 返回默认值
    return {
      errorType: '未知',
      errorReason: response,
      improvementSuggestion: '',
      relatedKnowledgePoints: []
    }
  }

  /**
   * 生成学习建议
   */
  async generateLearningSuggestion(progressData) {
    const prompt = `请根据以下学习进度数据生成个性化学习建议：

用户ID: ${progressData.userId}
学科: ${progressData.subject}
知识点: ${progressData.subcategory}
总体进度: ${progressData.progressPercentage}%
最近正确率: ${progressData.recentAccuracy}%
趋势: ${progressData.accuracyTrend}
已完成题目数: ${progressData.completedQuestions}

请返回 JSON 格式的建议（只返回 JSON）：
{
  "suggestionType": "review/practice/challenge",
  "suggestion": "具体的学习建议",
  "recommendedQuestions": 建议练习的题目数量,
  "focusAreas": ["重点关注的领域1", "重点关注领域2"]
}`

    const response = await this.callWithRetry(() => this.callAI(prompt))

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('[AI] 解析学习建议失败:', e)
    }

    // 返回默认值
    return {
      suggestionType: 'practice',
      suggestion: response,
      recommendedQuestions: 5,
      focusAreas: []
    }
  }

  /**
   * 查找相似题目
   */
  async findSimilarQuestions(questionId, analysis, limit = 5) {
    const prompt = `基于以下题目的语义分析结果，推荐相似题目：

题目ID: ${questionId}
关键词: ${JSON.stringify(analysis.keywords)}
自动标签: ${JSON.stringify(analysis.autoTags)}
知识点: ${JSON.stringify(analysis.knowledgePoints)}

请返回 JSON 格式的推荐（只返回 JSON）：
{
  "similarQuestionIds": [题目ID1, 题目ID2, ...],
  "reasoning": "推荐理由"
}`

    const response = await this.callWithRetry(() => this.callAI(prompt))

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('[AI] 解析相似题目失败:', e)
    }

    return {
      similarQuestionIds: [],
      reasoning: response
    }
  }

  /**
   * 测试 AI 连接
   */
  async testConnection(apiKey, apiUrl, model) {
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: '测试' }],
        max_tokens: 10
      })
    })

    if (!response.ok) {
      throw new Error(`连接失败: ${response.status}`)
    }

    const data = await response.json()
    return { success: true, model: data.model }
  }

  // 兼容旧接口
  async callDoubaoAI(prompt, context) {
    return this.callAI(prompt, context)
  }

  async analyzeData(analysisData, question) {
    return this.analyzeWithResults(question, analysisData)
  }
}

module.exports = new AIService()
