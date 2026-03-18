const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');

async function migrateData() {
  try {
    console.log('开始数据迁移...');
    
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
    
    console.log('MySQL数据库连接成功');
    
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
    
    // 连接SQLite数据库
    const sqliteDb = new sqlite3.Database('./quiz.db');
    console.log('SQLite数据库连接成功');
    
    // 迁移学科数据
    await migrateTable(sqliteDb, mysqlPool, 'subjects', ['id', 'name', 'icon_index']);
    
    // 迁移子分类数据
    await migrateTable(sqliteDb, mysqlPool, 'subcategories', ['id', 'subject_id', 'name', 'icon_index']);
    
    // 迁移年级数据
    await migrateTable(sqliteDb, mysqlPool, 'grades', ['id', 'name', 'created_at']);
    
    // 迁移班级数据
    await migrateTable(sqliteDb, mysqlPool, 'classes', ['id', 'name', 'created_at']);
    
    // 迁移用户数据
    await migrateTable(sqliteDb, mysqlPool, 'users', ['id', 'student_id', 'name', 'grade', 'class', 'created_at']);
    
    // 迁移题目数据
    await migrateTable(sqliteDb, mysqlPool, 'questions', ['id', 'subject_id', 'subcategory_id', 'content', 'type', 'options', 'correct_answer', 'explanation', 'audio_url', 'image_url', 'created_at']);
    
    // 迁移答题记录数据
    await migrateTable(sqliteDb, mysqlPool, 'answer_records', ['id', 'user_id', 'subject_id', 'subcategory_id', 'total_questions', 'correct_count', 'time_spent', 'created_at']);
    
    // 迁移题目尝试记录数据
    await migrateTable(sqliteDb, mysqlPool, 'question_attempts', ['id', 'user_id', 'question_id', 'subject_id', 'subcategory_id', 'user_answer', 'correct_answer', 'is_correct', 'answer_record_id', 'created_at']);
    
    // 迁移设置数据
    await migrateTable(sqliteDb, mysqlPool, 'settings', ['id', 'key', 'value', 'created_at', 'updated_at'], 'setting_key');
    
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

// 迁移单个表的数据
function migrateTable(sqliteDb, mysqlPool, tableName, columns, renameColumn = null) {
  return new Promise((resolve, reject) => {
    console.log(`迁移${tableName}表数据...`);
    
    // 构建SQL查询
    const columnsStr = columns.join(', ');
    const placeholders = columns.map(() => '?').join(', ');
    
    // 构建MySQL插入语句
    let mysqlColumns = columns;
    if (renameColumn) {
      mysqlColumns = columns.map(col => col === 'key' ? 'setting_key' : col);
    }
    const mysqlColumnsStr = mysqlColumns.join(', ');
    
    sqliteDb.all(`SELECT ${columnsStr} FROM ${tableName}`, (err, rows) => {
      if (err) {
        console.error(`读取${tableName}表数据失败:`, err);
        resolve(); // 继续处理其他表
        return;
      }
      
      if (rows.length === 0) {
        console.log(`${tableName}表没有数据，跳过迁移`);
        resolve();
        return;
      }
      
      // 批量插入数据
      const insertPromises = rows.map(row => {
        // 处理列名重命名
        const values = columns.map(col => {
          return row[col];
        });
        
        return mysqlPool.execute(
          `INSERT INTO ${tableName} (${mysqlColumnsStr}) VALUES (${placeholders})`,
          values
        );
      });
      
      Promise.all(insertPromises)
        .then(() => {
          console.log(`成功迁移 ${rows.length} 条${tableName}表数据`);
          resolve();
        })
        .catch(err => {
          console.error(`插入${tableName}表数据失败:`, err);
          resolve(); // 继续处理其他表
        });
    });
  });
}

// 执行数据迁移
migrateData();