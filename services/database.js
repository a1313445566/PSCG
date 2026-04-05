const mysql = require('mysql2/promise')

class Database {
  constructor() {
    this.pool = null
  }

  // 连接数据库
  async connect() {
    try {
      // 从环境变量获取数据库配置
      const config = {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'PSCG',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'pscg',
        charset: 'utf8mb4',
        timezone: '+08:00', // 设置为东八区，解决日期时区问题
        waitForConnections: true,
        connectionLimit: 20,
        queueLimit: 100
      }

      this.pool = mysql.createPool(config)

      // 测试连接
      const connection = await this.pool.getConnection()
      connection.release()

      console.log('数据库连接池创建成功')

      // 初始化表结构
      await this.initTables()
    } catch (error) {
      console.error('数据库连接失败:', error)
      throw error
    }
  }

  // 初始化表结构
  async initTables() {
    try {
      const tables = [
        // 创建学科表
        `CREATE TABLE IF NOT EXISTS subjects (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(50) NOT NULL,
          icon_index INT DEFAULT 0,
          sort_order INT DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 创建子分类表
        `CREATE TABLE IF NOT EXISTS subcategories (
          id INT PRIMARY KEY AUTO_INCREMENT,
          subject_id INT NOT NULL,
          name VARCHAR(100) NOT NULL,
          icon_index INT DEFAULT 0,
          difficulty INT DEFAULT 1,
          sort_order INT DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_subject_id (subject_id),
          FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 创建题目表
        `CREATE TABLE IF NOT EXISTS questions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          subject_id INT NOT NULL,
          subcategory_id INT NOT NULL,
          content TEXT NOT NULL,
          type VARCHAR(20) DEFAULT 'single',
          options TEXT NOT NULL,
          correct_answer TEXT NOT NULL,
          explanation TEXT,
          difficulty INT DEFAULT 1,
          audio_url VARCHAR(255),
          image_url VARCHAR(255),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_subject_id (subject_id),
          INDEX idx_subcategory_id (subcategory_id),
          INDEX idx_difficulty (difficulty),
          FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
          FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 创建用户表
        `CREATE TABLE IF NOT EXISTS users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          student_id VARCHAR(20) NOT NULL,
          name VARCHAR(50) NOT NULL,
          grade VARCHAR(20) NOT NULL,
          class VARCHAR(20) NOT NULL,
          points INT DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_student (student_id, grade, class)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 创建年级表
        `CREATE TABLE IF NOT EXISTS grades (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(20) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 创建班级表
        `CREATE TABLE IF NOT EXISTS classes (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(20) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 创建答题记录表
        `CREATE TABLE IF NOT EXISTS answer_records (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          subject_id INT NOT NULL,
          subcategory_id INT,
          total_questions INT NOT NULL,
          correct_count INT NOT NULL,
          time_spent INT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_subject_id (subject_id),
          INDEX idx_subcategory_id (subcategory_id),
          INDEX idx_created_at (created_at),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 创建题目尝试表
        `CREATE TABLE IF NOT EXISTS question_attempts (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          question_id INT NOT NULL,
          subject_id INT NOT NULL,
          subcategory_id INT,
          user_answer TEXT NOT NULL,
          correct_answer TEXT NOT NULL,
          is_correct TINYINT NOT NULL,
          answer_record_id INT,
          shuffled_options LONGTEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_question_id (question_id),
          INDEX idx_answer_record_id (answer_record_id),
          INDEX idx_subject_id (subject_id),
          INDEX idx_subcategory_id (subcategory_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
          FOREIGN KEY (answer_record_id) REFERENCES answer_records(id) ON DELETE CASCADE,
          FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 创建错误收集表
        `CREATE TABLE IF NOT EXISTS error_collection (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          question_id INT NOT NULL,
          correct_count INT DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_question (user_id, question_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 创建答题会话表
        `CREATE TABLE IF NOT EXISTS quiz_sessions (
          id VARCHAR(36) PRIMARY KEY,
          user_id INT NOT NULL,
          subject_id INT NOT NULL,
          subcategory_id INT,
          questions JSON NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NOT NULL,
          INDEX idx_user_id (user_id),
          INDEX idx_expires_at (expires_at),
          INDEX idx_subject_subcategory (subject_id, subcategory_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 创建答题尝试表
        `CREATE TABLE IF NOT EXISTS quiz_attempts (
          id INT PRIMARY KEY AUTO_INCREMENT,
          quiz_session_id VARCHAR(36) NOT NULL,
          question_id INT NOT NULL,
          user_answer TEXT NOT NULL,
          is_correct TINYINT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_quiz_session (quiz_session_id),
          INDEX idx_question_id (question_id),
          FOREIGN KEY (quiz_session_id) REFERENCES quiz_sessions(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 创建文件哈希表（用于文件去重）
        `CREATE TABLE IF NOT EXISTS file_hashes (
          id INT PRIMARY KEY AUTO_INCREMENT,
          file_hash VARCHAR(64) NOT NULL UNIQUE,
          file_path VARCHAR(255) NOT NULL,
          file_type ENUM('image', 'audio') NOT NULL,
          file_size INT NOT NULL,
          ref_count INT DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_file_hash (file_hash),
          INDEX idx_file_type (file_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 创建管理员凭证表（如果不存在）
        `CREATE TABLE IF NOT EXISTS admin_credentials (
          id INT PRIMARY KEY AUTO_INCREMENT,
          username VARCHAR(50) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 创建AI模型配置表
        `CREATE TABLE IF NOT EXISTS ai_models (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(50) NOT NULL COMMENT '模型名称',
          provider VARCHAR(50) NOT NULL COMMENT '提供商',
          model_id VARCHAR(100) NOT NULL COMMENT '模型标识',
          api_url VARCHAR(255) NOT NULL COMMENT 'API 地址',
          api_key_encrypted TEXT COMMENT '加密后的 API Key',
          is_primary TINYINT(1) DEFAULT 0 COMMENT '是否主力模型',
          is_enabled TINYINT(1) DEFAULT 1 COMMENT '是否启用',
          priority INT DEFAULT 0 COMMENT '优先级',
          max_tokens INT DEFAULT 4096 COMMENT '最大 Token',
          temperature DECIMAL(3,2) DEFAULT 0.7 COMMENT '温度参数',
          cost_per_1k_input DECIMAL(10,6) DEFAULT 0 COMMENT '输入成本/1k tokens',
          cost_per_1k_output DECIMAL(10,6) DEFAULT 0 COMMENT '输出成本/1k tokens',
          config JSON COMMENT '其他配置',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_provider (provider),
          INDEX idx_priority (priority)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 创建聊天会话表
        `CREATE TABLE IF NOT EXISTS chat_sessions (
          id VARCHAR(36) PRIMARY KEY,
          admin_id INT NOT NULL COMMENT '管理员ID，关联 admin_credentials.id',
          title VARCHAR(100) COMMENT '会话标题',
          model_name VARCHAR(50) COMMENT '使用的模型',
          total_tokens INT DEFAULT 0,
          total_cost DECIMAL(10,4) DEFAULT 0,
          message_count INT DEFAULT 0,
          status ENUM('active', 'archived') DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          expires_at DATETIME COMMENT '过期时间',
          INDEX idx_admin_id (admin_id),
          INDEX idx_status (status),
          INDEX idx_created_at (created_at),
          FOREIGN KEY (admin_id) REFERENCES admin_credentials(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 创建聊天消息表
        `CREATE TABLE IF NOT EXISTS chat_messages (
          id INT PRIMARY KEY AUTO_INCREMENT,
          session_id VARCHAR(36) NOT NULL,
          role ENUM('user', 'assistant', 'system') NOT NULL,
          content TEXT NOT NULL,
          tokens INT DEFAULT 0,
          tools_used JSON COMMENT '使用的工具',
          query_result JSON COMMENT '查询结果',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_session_id (session_id),
          INDEX idx_created_at (created_at),
          FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 创建聊天摘要表
        `CREATE TABLE IF NOT EXISTS chat_summaries (
          id INT PRIMARY KEY AUTO_INCREMENT,
          session_id VARCHAR(36) NOT NULL,
          message_start_id INT NOT NULL,
          message_end_id INT NOT NULL,
          summary TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_session_id (session_id),
          FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 创建Token使用记录表
        `CREATE TABLE IF NOT EXISTS token_usage (
          id INT PRIMARY KEY AUTO_INCREMENT,
          admin_id INT NOT NULL COMMENT '管理员ID，关联 admin_credentials.id',
          session_id VARCHAR(36) NOT NULL,
          model_name VARCHAR(50) NOT NULL,
          input_tokens INT DEFAULT 0,
          output_tokens INT DEFAULT 0,
          total_tokens INT DEFAULT 0,
          cost DECIMAL(10,6) DEFAULT 0,
          query_type VARCHAR(50) COMMENT '查询类型',
          cached TINYINT(1) DEFAULT 0 COMMENT '是否命中缓存',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_admin_id (admin_id),
          INDEX idx_session_id (session_id),
          INDEX idx_created_at (created_at),
          INDEX idx_model_name (model_name),
          FOREIGN KEY (admin_id) REFERENCES admin_credentials(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // 创建缓存命中记录表
        `CREATE TABLE IF NOT EXISTS cache_hits (
          id INT PRIMARY KEY AUTO_INCREMENT,
          query_hash VARCHAR(64) NOT NULL,
          query_text TEXT NOT NULL,
          response_hash VARCHAR(64) NOT NULL,
          hit_count INT DEFAULT 1,
          tokens_saved INT DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_hit_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_query_hash (query_hash),
          INDEX idx_hit_count (hit_count)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      ]

      for (const sql of tables) {
        await this.pool.execute(sql)
      }

      // 添加新的索引
      await this.addIndexes()

      console.log('表结构创建成功')
    } catch (error) {
      console.error('初始化表结构失败:', error)
    }
  }

  // 添加索引和新字段
  async addIndexes() {
    try {
      // 检查并添加 quiz_sessions 表的索引
      const quizSessionsIndexes = await this.pool.execute(
        `SHOW INDEXES FROM quiz_sessions WHERE Key_name = 'idx_user_created'`
      )
      if (quizSessionsIndexes[0].length === 0) {
        await this.pool.execute(
          `ALTER TABLE quiz_sessions ADD INDEX idx_user_created (user_id, created_at)`
        )
      }

      // 检查并添加 quiz_attempts 表的索引
      const quizAttemptsIndexes = await this.pool.execute(
        `SHOW INDEXES FROM quiz_attempts WHERE Key_name = 'idx_quiz_question'`
      )
      if (quizAttemptsIndexes[0].length === 0) {
        await this.pool.execute(
          `ALTER TABLE quiz_attempts ADD INDEX idx_quiz_question (quiz_session_id, question_id)`
        )
      }

      // 检查并添加 subjects 表的 show_in_history_quiz 字段
      const subjectsColumns = await this.pool.execute(
        `SHOW COLUMNS FROM subjects LIKE 'show_in_history_quiz'`
      )
      if (subjectsColumns[0].length === 0) {
        await this.pool.execute(
          `ALTER TABLE subjects ADD COLUMN show_in_history_quiz TINYINT(1) DEFAULT 0`
        )
        console.log('subjects 表添加 show_in_history_quiz 字段成功')
      }

      // 新增：questions 表性能优化索引
      const questionIndexes = [
        {
          name: 'idx_questions_type',
          sql: 'ALTER TABLE questions ADD INDEX idx_questions_type (type)'
        },
        {
          name: 'idx_questions_created',
          sql: 'ALTER TABLE questions ADD INDEX idx_questions_created (created_at)'
        },
        {
          name: 'idx_questions_filter',
          sql: 'ALTER TABLE questions ADD INDEX idx_questions_filter (subject_id, subcategory_id, type)'
        }
      ]

      for (const index of questionIndexes) {
        const existing = await this.pool.execute(`SHOW INDEXES FROM questions WHERE Key_name = ?`, [
          index.name
        ])
        if (existing[0].length === 0) {
          await this.pool.execute(index.sql)
          console.log(`questions 表添加 ${index.name} 索引成功`)
        }
      }

      console.log('索引添加成功')
    } catch (error) {
      console.error('添加索引失败:', error)
    }
  }

  // 执行查询（带自动重连）
  async query(sql, params = []) {
    try {
      // 检查连接状态
      if (!this.pool) {
        console.log('⚠️ 数据库未连接，尝试重新连接...')
        await this.connect()
      }

      // 确保所有参数都不是 undefined，将 undefined 转换为 null
      const safeParams = params.map(param => (param === undefined ? null : param))

      // ✅ 如果没有参数，使用 query() 方法（不使用 prepared statement）
      // 这样可以避免 MySQL 对某些 SQL 语法的限制
      if (safeParams.length === 0) {
        const [rows] = await this.pool.query(sql)
        return rows
      }

      // ✅ 有参数时，使用 execute() 方法（prepared statement）
      const [rows] = await this.pool.execute(sql, safeParams)
      return rows
    } catch (error) {
      console.error('查询失败:', error)

      // 如果是连接错误，尝试重连一次
      if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNREFUSED') {
        console.log('🔄 数据库连接丢失，尝试重连...')
        try {
          await this.connect()
          const safeParams = params.map(param => (param === undefined ? null : param))
          const [rows] = await this.pool.execute(sql, safeParams)
          return rows
        } catch (retryError) {
          console.error('❌ 重连失败:', retryError)
          throw retryError
        }
      }

      throw error
    }
  }

  // 获取单个结果（带自动重连）
  async get(sql, params = []) {
    try {
      // 检查连接状态
      if (!this.pool) {
        console.log('⚠️ 数据库未连接，尝试重新连接...')
        await this.connect()
      }

      // 确保所有参数都不是 undefined，将 undefined 转换为 null
      const safeParams = params.map(param => (param === undefined ? null : param))
      const [rows] = await this.pool.execute(sql, safeParams)
      return rows[0] || null
    } catch (error) {
      console.error('获取单个结果失败:', error)

      // 如果是连接错误，尝试重连一次
      if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNREFUSED') {
        console.log('🔄 数据库连接丢失，尝试重连...')
        try {
          await this.connect()
          const safeParams = params.map(param => (param === undefined ? null : param))
          const [rows] = await this.pool.execute(sql, safeParams)
          return rows[0] || null
        } catch (retryError) {
          console.error('❌ 重连失败:', retryError)
          throw retryError
        }
      }

      throw error
    }
  }

  // 获取多个结果（带自动重连）
  async all(sql, params = []) {
    try {
      // 检查连接状态
      if (!this.pool) {
        console.log('⚠️ 数据库未连接，尝试重新连接...')
        await this.connect()
      }

      // 确保所有参数都不是 undefined，将 undefined 转换为 null
      const safeParams = params.map(param => (param === undefined ? null : param))
      const [rows] = await this.pool.execute(sql, safeParams)
      return rows
    } catch (error) {
      console.error('获取多个结果失败:', error)

      // 如果是连接错误，尝试重连一次
      if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNREFUSED') {
        console.log('🔄 数据库连接连接丢失，尝试重连...')
        try {
          await this.connect()
          const safeParams = params.map(param => (param === undefined ? null : param))
          const [rows] = await this.pool.execute(sql, safeParams)
          return rows
        } catch (retryError) {
          console.error('❌ 重连失败:', retryError)
          throw retryError
        }
      }

      throw error
    }
  }

  // 执行更新/插入/删除操作
  async run(sql, params = []) {
    try {
      // 确保所有参数都不是 undefined，将 undefined 转换为 null
      const safeParams = params.map(param => (param === undefined ? null : param))
      const [result] = await this.pool.execute(sql, safeParams)
      return result
    } catch (error) {
      console.error('执行操作失败:', error)
      throw error
    }
  }

  // 执行事务
  async transaction(callback) {
    const connection = await this.pool.getConnection()
    try {
      await connection.beginTransaction()
      const result = await callback(connection)
      await connection.commit()
      return result
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  // 健康检查
  async healthCheck() {
    try {
      const startTime = Date.now()

      // 检查连接池是否存在
      if (!this.pool) {
        return {
          status: 'disconnected',
          message: '数据库连接池未初始化',
          timestamp: new Date().toISOString()
        }
      }

      // 尝试获取连接并执行简单查询
      const connection = await this.pool.getConnection()
      try {
        await connection.execute('SELECT 1')
        const responseTime = Date.now() - startTime

        return {
          status: 'healthy',
          message: '数据库连接正常',
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString()
        }
      } finally {
        connection.release()
      }
    } catch (error) {
      console.error('健康检查失败:', error)
      return {
        status: 'unhealthy',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  // 关闭连接
  async close() {
    if (this.pool) {
      await this.pool.end()
      console.log('数据库连接已关闭')
    }
  }
}

// 导出单例实例
const db = new Database()
module.exports = db
