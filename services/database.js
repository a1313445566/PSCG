const mysql = require('mysql2/promise');

class DatabaseService {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect() {
    try {
      this.pool = mysql.createPool({
        host: '127.0.0.1',
        port: 3306,
        user: 'PSCG',
        password: 'xgsy@8188',
        database: 'pscg',
        charset: 'utf8mb4',
        multipleStatements: true,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 10000,
        acquireTimeout: 10000,
        timeout: 30000
      });
      
      // 测试连接
      const connection = await this.pool.getConnection();
      connection.release();
      
      console.log('数据库连接池创建成功');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      await this.createTables();
      return this.pool;
    } catch (err) {
      console.error('数据库连接失败:', err);
      this.isConnected = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        console.log(`尝试重新连接... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.connect();
      }
      
      throw err;
    }
  }

  async createTables() {
    try {
      if (!this.pool) {
        await this.connect();
      }
      
      const tables = [
        // 创建学科表
        `CREATE TABLE IF NOT EXISTS subjects (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          icon_index INT DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        
        // 创建子分类表
        `CREATE TABLE IF NOT EXISTS subcategories (
          id INT PRIMARY KEY AUTO_INCREMENT,
          subject_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          icon_index INT DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        
        // 创建题目表
        `CREATE TABLE IF NOT EXISTS questions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          subject_id INT NOT NULL,
          subcategory_id INT NOT NULL,
          content LONGTEXT NOT NULL,
          type VARCHAR(50) NOT NULL,
          options LONGTEXT NOT NULL,
          correct_answer TEXT NOT NULL,
          explanation TEXT,
          audio_url VARCHAR(255),
          image_url VARCHAR(255),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        
        // 创建年级表
        `CREATE TABLE IF NOT EXISTS grades (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        
        // 创建班级表
        `CREATE TABLE IF NOT EXISTS classes (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        
        // 创建用户表
        `CREATE TABLE IF NOT EXISTS users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          student_id VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255),
          grade INT,
          class INT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        
        // 创建答题记录表
        `CREATE TABLE IF NOT EXISTS answer_records (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          subject_id INT NOT NULL,
          subcategory_id INT,
          total_questions INT NOT NULL,
          correct_count INT NOT NULL,
          time_spent INT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        
        // 创建题目答题记录表
        `CREATE TABLE IF NOT EXISTS question_attempts (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          question_id INT NOT NULL,
          subject_id INT NOT NULL,
          subcategory_id INT,
          user_answer TEXT NOT NULL,
          correct_answer TEXT,
          is_correct TINYINT NOT NULL,
          answer_record_id INT,
          shuffled_options TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        
        // 创建设置表
        `CREATE TABLE IF NOT EXISTS settings (
          id INT PRIMARY KEY AUTO_INCREMENT,
          setting_key VARCHAR(255) UNIQUE NOT NULL,
          value TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      ];
      
      for (const sql of tables) {
        await this.pool.execute(sql);
      }
      
      console.log('表结构创建成功');
    } catch (err) {
      console.error('创建表结构失败:', err);
      throw err;
    }
  }

  async ensureConnection() {
    if (!this.pool || !this.isConnected) {
      await this.connect();
    }
  }

  async run(sql, params = []) {
    try {
      await this.ensureConnection();
      const [result] = await this.pool.query(sql, params);
      return result;
    } catch (err) {
      console.error('执行SQL失败:', sql, err);
      this.isConnected = false;
      // 尝试重新连接
      await this.connect();
      // 重新执行
      const [result] = await this.pool.query(sql, params);
      return result;
    }
  }

  async get(sql, params = []) {
    try {
      await this.ensureConnection();
      const [rows] = await this.pool.query(sql, params);
      return rows[0] || null;
    } catch (err) {
      console.error('查询SQL失败:', sql, err);
      this.isConnected = false;
      // 尝试重新连接
      await this.connect();
      // 重新执行
      const [rows] = await this.pool.query(sql, params);
      return rows[0] || null;
    }
  }

  async all(sql, params = []) {
    try {
      await this.ensureConnection();
      const [rows] = await this.pool.query(sql, params);
      return rows;
    } catch (err) {
      console.error('查询SQL失败:', sql, err);
      this.isConnected = false;
      // 尝试重新连接
      await this.connect();
      // 重新执行
      const [rows] = await this.pool.query(sql, params);
      return rows;
    }
  }

  async close() {
    try {
      if (this.pool) {
        await this.pool.end();
        console.log('数据库连接池已关闭');
        this.isConnected = false;
      }
    } catch (err) {
      console.error('关闭数据库连接池失败:', err);
      throw err;
    }
  }

  async healthCheck() {
    try {
      await this.ensureConnection();
      const [rows] = await this.pool.query('SELECT 1 as health_check');
      return { status: 'ok', timestamp: new Date().toISOString() };
    } catch (err) {
      console.error('数据库健康检查失败:', err);
      return { status: 'error', message: err.message, timestamp: new Date().toISOString() };
    }
  }
}

// 导出单例实例
const databaseService = new DatabaseService();
module.exports = databaseService;