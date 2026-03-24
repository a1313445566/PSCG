const mysql = require('mysql2/promise');

class Database {
  constructor() {
    this.pool = null;
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
        collation: 'utf8mb4_unicode_ci',
        waitForConnections: true,
        connectionLimit: 20,
        queueLimit: 100,
        acquireTimeout: 30000
      };

      this.pool = mysql.createPool(config);
      
      // 测试连接
      const connection = await this.pool.getConnection();
      connection.release();
      
      console.log('数据库连接池创建成功');
      
      // 初始化表结构
      await this.initTables();
      
    } catch (error) {
      console.error('数据库连接失败:', error);
      throw error;
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
          type ENUM('single', 'multiple') DEFAULT 'single',
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
          shuffled_options TEXT,
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      ];

      for (const sql of tables) {
        await this.pool.execute(sql);
      }

      // 添加新的索引
      await this.addIndexes();

      console.log('表结构创建成功');
    } catch (error) {
      console.error('初始化表结构失败:', error);
    }
  }

  // 添加索引
  async addIndexes() {
    try {
      // 检查并添加 quiz_sessions 表的索引
      const quizSessionsIndexes = await this.pool.execute(
        `SHOW INDEXES FROM quiz_sessions WHERE Key_name = 'idx_user_created'`
      );
      if (quizSessionsIndexes[0].length === 0) {
        await this.pool.execute(
          `ALTER TABLE quiz_sessions ADD INDEX idx_user_created (user_id, created_at)`
        );
      }

      // 检查并添加 quiz_attempts 表的索引
      const quizAttemptsIndexes = await this.pool.execute(
        `SHOW INDEXES FROM quiz_attempts WHERE Key_name = 'idx_quiz_question'`
      );
      if (quizAttemptsIndexes[0].length === 0) {
        await this.pool.execute(
          `ALTER TABLE quiz_attempts ADD INDEX idx_quiz_question (quiz_session_id, question_id)`
        );
      }

      console.log('索引添加成功');
    } catch (error) {
      console.error('添加索引失败:', error);
    }
  }

  // 执行查询
  async query(sql, params = []) {
    try {
      // 确保所有参数都不是 undefined，将 undefined 转换为 null
      const safeParams = params.map(param => param === undefined ? null : param);
      const [rows] = await this.pool.execute(sql, safeParams);
      return rows;
    } catch (error) {
      console.error('查询失败:', error);
      throw error;
    }
  }

  // 获取单个结果
  async get(sql, params = []) {
    try {
      // 确保所有参数都不是 undefined，将 undefined 转换为 null
      const safeParams = params.map(param => param === undefined ? null : param);
      const [rows] = await this.pool.execute(sql, safeParams);
      return rows[0] || null;
    } catch (error) {
      console.error('获取单个结果失败:', error);
      throw error;
    }
  }

  // 获取多个结果
  async all(sql, params = []) {
    try {
      // 确保所有参数都不是 undefined，将 undefined 转换为 null
      const safeParams = params.map(param => param === undefined ? null : param);
      const [rows] = await this.pool.execute(sql, safeParams);
      return rows;
    } catch (error) {
      console.error('获取多个结果失败:', error);
      throw error;
    }
  }

  // 执行更新/插入/删除操作
  async run(sql, params = []) {
    try {
      // 确保所有参数都不是 undefined，将 undefined 转换为 null
      const safeParams = params.map(param => param === undefined ? null : param);
      const [result] = await this.pool.execute(sql, safeParams);
      return result;
    } catch (error) {
      console.error('执行操作失败:', error);
      throw error;
    }
  }

  // 关闭连接
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 导出单例实例
const db = new Database();
module.exports = db;