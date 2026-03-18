const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');

async function migrateData() {
  try {
    console.log('开始数据迁移...');
    
    // 连接SQLite数据库
    const sqliteDb = new sqlite3.Database('./quiz.db');
    
    // 连接MySQL数据库
    const mysqlPool = mysql.createPool({
      host: '127.0.0.1',
      port: 3306,
      user: 'PSCG',
      password: 'xgsy@8188',
      database: 'pscg',
      charset: 'utf8mb4',
      multipleStatements: true
    });
    
    console.log('数据库连接成功');
    
    // 禁用外键约束
    await mysqlPool.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log('外键约束已禁用');
    
    // 清空MySQL数据库中的所有表数据
    await mysqlPool.execute('DELETE FROM question_attempts');
    await mysqlPool.execute('DELETE FROM answer_records');
    await mysqlPool.execute('DELETE FROM questions');
    await mysqlPool.execute('DELETE FROM subcategories');
    await mysqlPool.execute('DELETE FROM users');
    await mysqlPool.execute('DELETE FROM classes');
    await mysqlPool.execute('DELETE FROM grades');
    await mysqlPool.execute('DELETE FROM subjects');
    await mysqlPool.execute('DELETE FROM settings');
    console.log('MySQL数据库表数据已清空');
    
    // 读取SQLite数据并插入到MySQL
    await migrateSubjects(sqliteDb, mysqlPool);
    await migrateSubcategories(sqliteDb, mysqlPool);
    await migrateGrades(sqliteDb, mysqlPool);
    await migrateClasses(sqliteDb, mysqlPool);
    await migrateUsers(sqliteDb, mysqlPool);
    await migrateQuestions(sqliteDb, mysqlPool);
    await migrateAnswerRecords(sqliteDb, mysqlPool);
    await migrateQuestionAttempts(sqliteDb, mysqlPool);
    await migrateSettings(sqliteDb, mysqlPool);
    
    // 启用外键约束
    await mysqlPool.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('外键约束已启用');
    
    // 关闭数据库连接
    sqliteDb.close();
    await mysqlPool.end();
    
    console.log('数据迁移完成');
  } catch (error) {
    console.error('数据迁移失败:', error);
  }
}

// 迁移学科数据
async function migrateSubjects(sqliteDb, mysqlPool) {
  return new Promise((resolve, reject) => {
    console.log('迁移学科数据...');
    sqliteDb.all('SELECT * FROM subjects', (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      // 先禁用外键约束
      mysqlPool.execute('SET FOREIGN_KEY_CHECKS = 0')
        .then(() => {
          const insertPromises = rows.map(row => {
            return mysqlPool.execute(
              'INSERT INTO subjects (id, name, icon_index) VALUES (?, ?, ?)',
              [row.id, row.name, row.icon_index || 0]
            );
          });
          
          return Promise.all(insertPromises);
        })
        .then(() => {
          console.log(`成功迁移 ${rows.length} 条学科数据`);
          resolve();
        })
        .catch(reject);
    });
  });
}

// 迁移子分类数据
async function migrateSubcategories(sqliteDb, mysqlPool) {
  return new Promise((resolve, reject) => {
    console.log('迁移子分类数据...');
    sqliteDb.all('SELECT * FROM subcategories', (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      // 先禁用外键约束
      mysqlPool.execute('SET FOREIGN_KEY_CHECKS = 0')
        .then(() => {
          const insertPromises = rows.map(row => {
            return mysqlPool.execute(
              'INSERT INTO subcategories (id, subject_id, name, icon_index) VALUES (?, ?, ?, ?)',
              [row.id, row.subject_id, row.name, row.icon_index || 0]
            );
          });
          
          return Promise.all(insertPromises);
        })
        .then(() => {
          console.log(`成功迁移 ${rows.length} 条子分类数据`);
          resolve();
        })
        .catch(reject);
    });
  });
}

// 迁移年级数据
async function migrateGrades(sqliteDb, mysqlPool) {
  return new Promise((resolve, reject) => {
    console.log('迁移年级数据...');
    sqliteDb.all('SELECT * FROM grades', (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      // 先禁用外键约束
      mysqlPool.execute('SET FOREIGN_KEY_CHECKS = 0')
        .then(() => {
          const insertPromises = rows.map(row => {
            return mysqlPool.execute(
              'INSERT INTO grades (id, name, created_at) VALUES (?, ?, ?)',
              [row.id, row.name, row.created_at]
            );
          });
          
          return Promise.all(insertPromises);
        })
        .then(() => {
          console.log(`成功迁移 ${rows.length} 条年级数据`);
          resolve();
        })
        .catch(reject);
    });
  });
}

// 迁移班级数据
async function migrateClasses(sqliteDb, mysqlPool) {
  return new Promise((resolve, reject) => {
    console.log('迁移班级数据...');
    sqliteDb.all('SELECT * FROM classes', (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      // 先禁用外键约束
      mysqlPool.execute('SET FOREIGN_KEY_CHECKS = 0')
        .then(() => {
          const insertPromises = rows.map(row => {
            return mysqlPool.execute(
              'INSERT INTO classes (id, name, created_at) VALUES (?, ?, ?)',
              [row.id, row.name, row.created_at]
            );
          });
          
          return Promise.all(insertPromises);
        })
        .then(() => {
          console.log(`成功迁移 ${rows.length} 条班级数据`);
          resolve();
        })
        .catch(reject);
    });
  });
}

// 迁移用户数据
async function migrateUsers(sqliteDb, mysqlPool) {
  return new Promise((resolve, reject) => {
    console.log('迁移用户数据...');
    sqliteDb.all('SELECT * FROM users', (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      // 先禁用外键约束
      mysqlPool.execute('SET FOREIGN_KEY_CHECKS = 0')
        .then(() => {
          const insertPromises = rows.map(row => {
            return mysqlPool.execute(
              'INSERT INTO users (id, student_id, name, grade, class, created_at) VALUES (?, ?, ?, ?, ?, ?)',
              [row.id, row.student_id, row.name, row.grade, row.class, row.created_at]
            );
          });
          
          return Promise.all(insertPromises);
        })
        .then(() => {
          console.log(`成功迁移 ${rows.length} 条用户数据`);
          resolve();
        })
        .catch(reject);
    });
  });
}

// 迁移题目数据
async function migrateQuestions(sqliteDb, mysqlPool) {
  return new Promise((resolve, reject) => {
    console.log('迁移题目数据...');
    sqliteDb.all('SELECT * FROM questions', (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      // 先禁用外键约束
      mysqlPool.execute('SET FOREIGN_KEY_CHECKS = 0')
        .then(() => {
          const insertPromises = rows.map(row => {
            return mysqlPool.execute(
              'INSERT INTO questions (id, subject_id, subcategory_id, content, type, options, correct_answer, explanation, audio_url, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [row.id, row.subject_id, row.subcategory_id, row.content, row.type, row.options, row.correct_answer, row.explanation, row.audio_url, row.image_url, row.created_at]
            );
          });
          
          return Promise.all(insertPromises);
        })
        .then(() => {
          console.log(`成功迁移 ${rows.length} 条题目数据`);
          resolve();
        })
        .catch(reject);
    });
  });
}

// 迁移答题记录数据
async function migrateAnswerRecords(sqliteDb, mysqlPool) {
  return new Promise((resolve, reject) => {
    console.log('迁移答题记录数据...');
    sqliteDb.all('SELECT * FROM answer_records', (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      // 先禁用外键约束
      mysqlPool.execute('SET FOREIGN_KEY_CHECKS = 0')
        .then(() => {
          const insertPromises = rows.map(row => {
            return mysqlPool.execute(
              'INSERT INTO answer_records (id, user_id, subject_id, subcategory_id, total_questions, correct_count, time_spent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [row.id, row.user_id, row.subject_id, row.subcategory_id, row.total_questions, row.correct_count, row.time_spent, row.created_at]
            );
          });
          
          return Promise.all(insertPromises);
        })
        .then(() => {
          console.log(`成功迁移 ${rows.length} 条答题记录数据`);
          resolve();
        })
        .catch(reject);
    });
  });
}

// 迁移题目尝试记录数据
async function migrateQuestionAttempts(sqliteDb, mysqlPool) {
  return new Promise((resolve, reject) => {
    console.log('迁移题目尝试记录数据...');
    sqliteDb.all('SELECT * FROM question_attempts', (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      // 先禁用外键约束
      mysqlPool.execute('SET FOREIGN_KEY_CHECKS = 0')
        .then(() => {
          const insertPromises = rows.map(row => {
            return mysqlPool.execute(
              'INSERT INTO question_attempts (id, user_id, question_id, subject_id, subcategory_id, user_answer, correct_answer, is_correct, answer_record_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [row.id, row.user_id, row.question_id, row.subject_id, row.subcategory_id, row.user_answer, row.correct_answer, row.is_correct, row.answer_record_id, row.created_at]
            );
          });
          
          return Promise.all(insertPromises);
        })
        .then(() => {
          console.log(`成功迁移 ${rows.length} 条题目尝试记录数据`);
          resolve();
        })
        .catch(reject);
    });
  });
}

// 迁移设置数据
async function migrateSettings(sqliteDb, mysqlPool) {
  return new Promise((resolve, reject) => {
    console.log('迁移设置数据...');
    sqliteDb.all('SELECT * FROM settings', (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      // 先禁用外键约束
      mysqlPool.execute('SET FOREIGN_KEY_CHECKS = 0')
        .then(() => {
          const insertPromises = rows.map(row => {
            return mysqlPool.execute(
              'INSERT INTO settings (id, setting_key, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
              [row.id, row.key, row.value, row.created_at, row.updated_at]
            );
          });
          
          return Promise.all(insertPromises);
        })
        .then(() => {
          console.log(`成功迁移 ${rows.length} 条设置数据`);
          resolve();
        })
        .catch(reject);
    });
  });
}

// 执行数据迁移
migrateData();