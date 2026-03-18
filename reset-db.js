const mysql = require('mysql2/promise');

async function resetDatabase() {
  try {
    console.log('重置数据库...');
    
    // 连接MySQL数据库（不指定数据库名）
    const mysqlPool = mysql.createPool({
      host: '127.0.0.1',
      port: 3306,
      user: 'PSCG',
      password: 'xgsy@8188',
      charset: 'utf8mb4',
      multipleStatements: true
    });
    
    console.log('MySQL数据库连接成功');
    
    // 删除并重新创建数据库
    await mysqlPool.execute('DROP DATABASE IF EXISTS pscg');
    await mysqlPool.execute('CREATE DATABASE pscg DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('数据库已重新创建');
    
    // 关闭连接池
    await mysqlPool.end();
    
    // 重新连接到新创建的数据库
    const newMysqlPool = mysql.createPool({
      host: '127.0.0.1',
      port: 3306,
      user: 'PSCG',
      password: 'xgsy@8188',
      database: 'pscg',
      charset: 'utf8mb4',
      multipleStatements: true
    });
    
    // 创建表结构（无外键约束）
    await createTables(newMysqlPool);
    console.log('表结构创建成功');
    
    // 关闭数据库连接
    await newMysqlPool.end();
    console.log('数据库重置完成');
  } catch (error) {
    console.error('数据库重置失败:', error);
  }
}

async function createTables(mysqlPool) {
  // 创建学科表
  await mysqlPool.execute(`CREATE TABLE IF NOT EXISTS subjects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    icon_index INT DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  
  // 创建子分类表
  await mysqlPool.execute(`CREATE TABLE IF NOT EXISTS subcategories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    subject_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    icon_index INT DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  
  // 创建题目表
  await mysqlPool.execute(`CREATE TABLE IF NOT EXISTS questions (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  
  // 创建年级表
  await mysqlPool.execute(`CREATE TABLE IF NOT EXISTS grades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  
  // 创建班级表
  await mysqlPool.execute(`CREATE TABLE IF NOT EXISTS classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  
  // 创建用户表
  await mysqlPool.execute(`CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    grade INT,
    class INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  
  // 创建答题记录表
  await mysqlPool.execute(`CREATE TABLE IF NOT EXISTS answer_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subject_id INT NOT NULL,
    subcategory_id INT,
    total_questions INT NOT NULL,
    correct_count INT NOT NULL,
    time_spent INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  
  // 创建题目答题记录表
  await mysqlPool.execute(`CREATE TABLE IF NOT EXISTS question_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    subject_id INT NOT NULL,
    subcategory_id INT,
    user_answer TEXT NOT NULL,
    correct_answer TEXT,
    is_correct TINYINT NOT NULL,
    answer_record_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  
  // 创建设置表
  await mysqlPool.execute(`CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}

// 执行数据库重置
resetDatabase();