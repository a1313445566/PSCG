const sqlite3 = require('sqlite3').verbose();

class DatabaseService {
  constructor() {
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database('./quiz.db', (err) => {
        if (err) {
          console.error('数据库连接失败:', err);
          reject(err);
        } else {
          // 设置编码为 UTF-8
          this.db.run('PRAGMA encoding = "UTF-8";', (err) => {
            if (err) {
              console.error('设置编码失败:', err);
              reject(err);
            } else {
              this.createTables()
                .then(() => resolve(this.db))
                .catch(reject);
            }
          });
        }
      });
    });
  }

  createTables() {
    return new Promise((resolve, reject) => {
      // 使用serialize确保表创建顺序执行
      this.db.serialize(() => {
        // 创建学科表
        this.db.run(`CREATE TABLE IF NOT EXISTS subjects (id INTEGER PRIMARY KEY, name TEXT NOT NULL, icon_index INTEGER DEFAULT 0)`);
        
        // 创建子分类表
        this.db.run(`CREATE TABLE IF NOT EXISTS subcategories (id INTEGER PRIMARY KEY, subject_id INTEGER NOT NULL, name TEXT NOT NULL, icon_index INTEGER DEFAULT 0, FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE)`);
        
        // 创建题目表
        this.db.run(`CREATE TABLE IF NOT EXISTS questions (id INTEGER PRIMARY KEY, subject_id INTEGER NOT NULL, subcategory_id INTEGER NOT NULL, content TEXT NOT NULL, type TEXT NOT NULL, options TEXT NOT NULL, correct_answer TEXT NOT NULL, explanation TEXT, audio_url TEXT, image_url TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE, FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE)`);
        
        // 创建年级表
        this.db.run(`CREATE TABLE IF NOT EXISTS grades (id INTEGER PRIMARY KEY, name TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
        // 创建班级表
        this.db.run(`CREATE TABLE IF NOT EXISTS classes (id INTEGER PRIMARY KEY, name TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
        // 创建用户表
        this.db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id TEXT UNIQUE NOT NULL, name TEXT, grade INTEGER, class INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
        // 创建答题记录表
        this.db.run(`CREATE TABLE IF NOT EXISTS answer_records (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, subject_id INTEGER NOT NULL, subcategory_id INTEGER, total_questions INTEGER NOT NULL, correct_count INTEGER NOT NULL, time_spent INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE, FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE)`);
        
        // 创建题目答题记录表
        this.db.run(`CREATE TABLE IF NOT EXISTS question_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, question_id INTEGER NOT NULL, subject_id INTEGER NOT NULL, subcategory_id INTEGER, user_answer TEXT NOT NULL, correct_answer TEXT, is_correct INTEGER NOT NULL, answer_record_id INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE, FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE, FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE, FOREIGN KEY (answer_record_id) REFERENCES answer_records(id) ON DELETE CASCADE)`);
        
        // 创建设置表
        this.db.run(`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, key TEXT UNIQUE NOT NULL, value TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
        resolve();
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  serialize(callback) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        try {
          callback();
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

// 导出单例实例
const databaseService = new DatabaseService();
module.exports = databaseService;