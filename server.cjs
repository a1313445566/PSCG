const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
const cache = require('memory-cache');

// 缓存配置
const CACHE_DURATION = 3600000; // 1小时
const CACHE_KEYS = {
  SUBJECTS: 'subjects',
  GRADES: 'grades',
  CLASSES: 'classes',
  SUBCATEGORIES: 'subcategories',
  ANALYSIS: 'analysis',
  ERROR_PRONE_QUESTIONS: 'error_prone_questions'
};

const app = express();
const port = 3001;

// 中间件
app.use(cors());
app.use(express.json({ encoding: 'utf-8', limit: '10mb' }));
app.use(express.urlencoded({ extended: true, encoding: 'utf-8', limit: '10mb' }));

// 设置响应编码为 UTF-8
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// 静态文件服务 - 放在API路由之后
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/audio', express.static(path.join(__dirname, 'audio')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// 数据库连接
const db = new sqlite3.Database('./quiz.db', (err) => {
  if (err) {
    console.error('数据库连接失败:', err);
  } else {
    console.log('数据库连接成功');
    // 设置编码为 UTF-8
    db.run('PRAGMA encoding = "UTF-8";', (err) => {
      if (err) {
        console.error('设置编码失败:', err);
      }
      // 创建表结构
      createTables();
    });
  }
});

// 创建表结构
const createTables = () => {
  // 使用serialize确保表创建顺序执行
  db.serialize(() => {
    // 创建学科表
    db.run(`CREATE TABLE IF NOT EXISTS subjects (id INTEGER PRIMARY KEY, name TEXT NOT NULL, icon_index INTEGER DEFAULT 0)`);
    
    // 创建子分类表
    db.run(`CREATE TABLE IF NOT EXISTS subcategories (id INTEGER PRIMARY KEY, subject_id INTEGER NOT NULL, name TEXT NOT NULL, icon_index INTEGER DEFAULT 0, FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE)`);
    
    // 创建题目表
    db.run(`CREATE TABLE IF NOT EXISTS questions (id INTEGER PRIMARY KEY, subject_id INTEGER NOT NULL, subcategory_id INTEGER NOT NULL, content TEXT NOT NULL, type TEXT NOT NULL, options TEXT NOT NULL, correct_answer TEXT NOT NULL, explanation TEXT, audio_url TEXT, image_url TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE, FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE)`);
    
    // 创建年级表
    db.run(`CREATE TABLE IF NOT EXISTS grades (id INTEGER PRIMARY KEY, name TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    
    // 创建班级表
    db.run(`CREATE TABLE IF NOT EXISTS classes (id INTEGER PRIMARY KEY, name TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    
    // 创建用户表
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id TEXT UNIQUE NOT NULL, name TEXT, grade INTEGER, class INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    
    // 创建答题记录表
    db.run(`CREATE TABLE IF NOT EXISTS answer_records (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, subject_id INTEGER NOT NULL, subcategory_id INTEGER, total_questions INTEGER NOT NULL, correct_count INTEGER NOT NULL, time_spent INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE, FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE)`);
    
    // 创建题目答题记录表
    db.run(`CREATE TABLE IF NOT EXISTS question_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, question_id INTEGER NOT NULL, subject_id INTEGER NOT NULL, subcategory_id INTEGER, user_answer TEXT NOT NULL, is_correct INTEGER NOT NULL, answer_record_id INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE, FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE, FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE, FOREIGN KEY (answer_record_id) REFERENCES answer_records(id) ON DELETE CASCADE)`);
    
    // 创建设置表
    db.run(`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, key TEXT UNIQUE NOT NULL, value TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    
    // 初始化默认年级数据
    initializeDefaultGrades();
    
    // 初始化默认班级数据
    initializeDefaultClasses();
    
    // 初始化默认学科数据
    initializeDefaultSubjects();
  });
};

// 初始化默认年级数据
const initializeDefaultGrades = () => {
  // 检查是否已有年级数据
  db.get('SELECT COUNT(*) as count FROM grades', (err, result) => {
    if (err) {
      console.error('检查年级数据失败:', err);
      return;
    }
    
    if (result.count === 0) {
      // 插入默认年级数据
      const defaultGrades = ['1年级', '2年级', '3年级', '4年级', '5年级', '6年级'];
      defaultGrades.forEach((grade, index) => {
        db.run('INSERT INTO grades (id, name) VALUES (?, ?)', [index + 1, grade], (err) => {
          if (err) {
            console.error('插入年级数据失败:', err);
          }
        });
      });
    }
  });
};

// 初始化默认班级数据
const initializeDefaultClasses = () => {
  // 检查是否已有班级数据
  db.get('SELECT COUNT(*) as count FROM classes', (err, result) => {
    if (err) {
      console.error('检查班级数据失败:', err);
      return;
    }
    
    if (result.count === 0) {
      // 插入默认班级数据
      const defaultClasses = ['1班', '2班', '3班', '4班', '5班', '6班', '7班', '8班', '9班', '10班'];
      defaultClasses.forEach((className, index) => {
        db.run('INSERT INTO classes (id, name) VALUES (?, ?)', [index + 1, className], (err) => {
          if (err) {
            console.error('插入班级数据失败:', err);
          }
        });
      });
    }
  });
};

// 初始化默认学科数据
const initializeDefaultSubjects = () => {
  // 检查是否已有学科数据
  db.get('SELECT COUNT(*) as count FROM subjects', (err, result) => {
    if (err) {
      console.error('检查学科数据失败:', err);
      return;
    }
    
    if (result.count === 0) {
      // 插入默认学科数据
      const defaultSubjects = [
        { id: 1, name: '语文', icon_index: 0 },
        { id: 2, name: '数学', icon_index: 1 },
        { id: 3, name: '英语', icon_index: 2 },
        { id: 4, name: '物理', icon_index: 3 },
        { id: 5, name: '化学', icon_index: 4 },
        { id: 6, name: '生物', icon_index: 5 },
        { id: 7, name: '历史', icon_index: 6 },
        { id: 8, name: '地理', icon_index: 7 },
        { id: 9, name: '政治', icon_index: 8 }
      ];
      defaultSubjects.forEach((subject) => {
        db.run('INSERT INTO subjects (id, name, icon_index) VALUES (?, ?, ?)', [subject.id, subject.name, subject.icon_index], (err) => {
          if (err) {
            console.error('插入学科数据失败:', err);
          }
        });
      });
    }
  });
};

// 数据管理API

// 备份数据
app.post('/api/data/backup', (req, res) => {
  const backupData = {
    subjects: [],
    questions: [],
    users: [],
    answer_records: [],
    question_attempts: []
  };
  
  db.serialize(() => {
    db.all('SELECT * FROM subjects', (err, subjects) => {
      if (err) {
        console.error('获取学科失败:', err);
        res.status(500).json({ error: '备份数据失败' });
        return;
      }
      
      backupData.subjects = subjects;
      
      db.all('SELECT * FROM subcategories', (err, subcategories) => {
        if (err) {
          console.error('获取子分类失败:', err);
          res.status(500).json({ error: '备份数据失败' });
          return;
        }
        
        backupData.subcategories = subcategories;
        
        db.all('SELECT * FROM questions', (err, questions) => {
          if (err) {
            console.error('获取题目失败:', err);
            res.status(500).json({ error: '备份数据失败' });
            return;
          }
          
          backupData.questions = questions;
          
          db.all('SELECT * FROM users', (err, users) => {
            if (err) {
              console.error('获取用户失败:', err);
              res.status(500).json({ error: '备份数据失败' });
              return;
            }
            
            backupData.users = users;
            
            db.all('SELECT * FROM answer_records', (err, answerRecords) => {
              if (err) {
                console.error('获取答题记录失败:', err);
                res.status(500).json({ error: '备份数据失败' });
                return;
              }
              
              backupData.answer_records = answerRecords;
              
              db.all('SELECT * FROM question_attempts', (err, questionAttempts) => {
                if (err) {
                  console.error('获取题目尝试记录失败:', err);
                  res.status(500).json({ error: '备份数据失败' });
                  return;
                }
                
                backupData.question_attempts = questionAttempts;
                
                res.json({ success: true, data: backupData });
              });
            });
          });
        });
      });
    });
  });
});

// 恢复数据
app.post('/api/data/restore', (req, res) => {
  const { data } = req.body;
  
  if (!data) {
    res.status(400).json({ error: '没有提供数据' });
    return;
  }
  
  db.serialize(() => {
    db.run('DELETE FROM question_attempts', (err) => {
      if (err) {
        console.error('清空题目尝试记录失败:', err);
        res.status(500).json({ error: '恢复数据失败' });
        return;
      }
      
      db.run('DELETE FROM answer_records', (err) => {
        if (err) {
          console.error('清空答题记录失败:', err);
          res.status(500).json({ error: '恢复数据失败' });
          return;
        }
        
        db.run('DELETE FROM questions', (err) => {
          if (err) {
            console.error('清空题目失败:', err);
            res.status(500).json({ error: '恢复数据失败' });
            return;
          }
          
          db.run('DELETE FROM subcategories', (err) => {
            if (err) {
              console.error('清空子分类失败:', err);
              res.status(500).json({ error: '恢复数据失败' });
              return;
            }
            
            db.run('DELETE FROM users', (err) => {
              if (err) {
                console.error('清空用户失败:', err);
                res.status(500).json({ error: '恢复数据失败' });
                return;
              }
              
              db.run('DELETE FROM subjects', (err) => {
                if (err) {
                  console.error('清空学科失败:', err);
                  res.status(500).json({ error: '恢复数据失败' });
                  return;
                }
                
                if (data.subjects) {
                  let subjectsProcessed = 0;
                  const totalSubjects = data.subjects.length;
                  
                  if (totalSubjects === 0) {
                    res.json({ success: true, message: '数据恢复成功' });
                    return;
                  }
                  
                  for (const subject of data.subjects) {
                    db.run('INSERT INTO subjects (id, name, icon_index) VALUES (?, ?, ?)', 
                      [subject.id, subject.name, subject.icon_index || 0],
                      function(err) {
                        if (err) {
                          console.error('恢复学科失败:', err);
                        }
                        
                        subjectsProcessed++;
                        if (subjectsProcessed === totalSubjects) {
                          if (data.subcategories) {
                            let subcategoriesProcessed = 0;
                            const totalSubcategories = data.subcategories.length;
                            
                            for (const subcategory of data.subcategories) {
                              db.run('INSERT INTO subcategories (id, subject_id, name, icon_index) VALUES (?, ?, ?, ?)', 
                                [subcategory.id, subcategory.subject_id, subcategory.name, subcategory.icon_index || 0],
                                function(err) {
                                  if (err) {
                                    console.error('恢复子分类失败:', err);
                                  }
                                  
                                  subcategoriesProcessed++;
                                  if (subcategoriesProcessed === totalSubcategories) {
                                    if (data.users) {
                                      let usersProcessed = 0;
                                      const totalUsers = data.users.length;
                                      
                                      for (const user of data.users) {
                                        db.run('INSERT INTO users (id, student_id, name, grade, class) VALUES (?, ?, ?, ?, ?)', 
                                          [user.id, user.student_id, user.name, user.grade, user.class],
                                          function(err) {
                                            if (err) {
                                              console.error('恢复用户失败:', err);
                                            }
                                            
                                            usersProcessed++;
                                            if (usersProcessed === totalUsers) {
                                              if (data.questions) {
                                                let questionsProcessed = 0;
                                                const totalQuestions = data.questions.length;
                                                
                                                for (const question of data.questions) {
                                                  // 处理题目数据，支持两种命名格式
                                                  const subjectId = question.subjectId || question.subject_id;
                                                  const subcategoryId = question.subcategoryId || question.subcategory_id;
                                                  const correctAnswer = question.correctAnswer || question.correct_answer;
                                                  const audioUrl = question.audioUrl || question.audio_url;
                                                  const imageUrl = question.imageUrl || question.image_url;
                                                  
                                                  db.run('INSERT INTO questions (id, subject_id, subcategory_id, content, type, options, correct_answer, explanation, audio_url, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
                                                    [question.id, subjectId, subcategoryId, question.content, question.type, question.options, correctAnswer, question.explanation, audioUrl, imageUrl],
                                                    function(err) {
                                                      if (err) {
                                                        console.error('恢复题目失败:', err);
                                                      }
                                                      
                                                      questionsProcessed++;
                                                      if (questionsProcessed === totalQuestions) {
                                                        if (data.answer_records) {
                                                          let answerRecordsProcessed = 0;
                                                          const totalAnswerRecords = data.answer_records.length;
                                                          
                                                          for (const record of data.answer_records) {
                                                            db.run('INSERT INTO answer_records (id, user_id, subject_id, subcategory_id, total_questions, correct_count, time_spent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
                                                              [record.id, record.user_id, record.subject_id, record.subcategory_id, record.total_questions, record.correct_count, record.time_spent, record.created_at],
                                                              function(err) {
                                                                if (err) {
                                                                  console.error('恢复答题记录失败:', err);
                                                                }
                                                                
                                                                answerRecordsProcessed++;
                                                                if (answerRecordsProcessed === totalAnswerRecords) {
                                                                  if (data.question_attempts) {
                                                                    let questionAttemptsProcessed = 0;
                                                                    const totalQuestionAttempts = data.question_attempts.length;
                                                                    
                                                                    for (const attempt of data.question_attempts) {
                                                                      db.run('INSERT INTO question_attempts (id, user_id, question_id, subject_id, subcategory_id, user_answer, is_correct, answer_record_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
                                                                        [attempt.id, attempt.user_id, attempt.question_id, attempt.subject_id, attempt.subcategory_id, attempt.user_answer, attempt.is_correct, attempt.answer_record_id, attempt.created_at],
                                                                        function(err) {
                                                                          if (err) {
                                                                            console.error('恢复题目尝试记录失败:', err);
                                                                          }
                                                                          
                                                                          questionAttemptsProcessed++;
                                                                          if (questionAttemptsProcessed === totalQuestionAttempts) {
                                                                            res.json({ success: true, message: '数据恢复成功' });
                                                                          }
                                                                        }
                                                                      );
                                                                    }
                                                                  } else {
                                                                    res.json({ success: true, message: '数据恢复成功' });
                                                                  }
                                                                }
                                                              }
                                                            );
                                                          }
                                                        } else {
                                                          res.json({ success: true, message: '数据恢复成功' });
                                                        }
                                                      }
                                                    }
                                                  );
                                                }
                                              } else {
                                                res.json({ success: true, message: '数据恢复成功' });
                                              }
                                            }
                                          }
                                        );
                                      }
                                    } else {
                                      res.json({ success: true, message: '数据恢复成功' });
                                    }
                                  }
                                }
                              );
                            }
                          } else {
                            res.json({ success: true, message: '数据恢复成功' });
                          }
                        }
                      }
                    );
                  }
                } else {
                  res.json({ success: true, message: '数据恢复成功' });
                }
              });
            });
          });
        });
      });
    });
  });
});

// 导出数据
app.get('/api/data/export', (req, res) => {
  const exportData = {
    subjects: [],
    questions: [],
    users: [],
    answer_records: []
  };
  
  db.serialize(() => {
    db.all('SELECT * FROM subjects', (err, subjects) => {
      if (err) {
        console.error('获取学科失败:', err);
        res.status(500).json({ error: '导出数据失败' });
        return;
      }
      
      exportData.subjects = subjects;
      
      db.all('SELECT * FROM subcategories', (err, subcategories) => {
        if (err) {
          console.error('获取子分类失败:', err);
          res.status(500).json({ error: '导出数据失败' });
          return;
        }
        
        exportData.subcategories = subcategories;
        
        db.all('SELECT * FROM questions', (err, questions) => {
          if (err) {
            console.error('获取题目失败:', err);
            res.status(500).json({ error: '导出数据失败' });
            return;
          }
          
          exportData.questions = questions;
          
          db.all('SELECT * FROM users', (err, users) => {
            if (err) {
              console.error('获取用户失败:', err);
              res.status(500).json({ error: '导出数据失败' });
              return;
            }
            
            exportData.users = users;
            
            db.all('SELECT * FROM answer_records', (err, answerRecords) => {
              if (err) {
                console.error('获取答题记录失败:', err);
                res.status(500).json({ error: '导出数据失败' });
                return;
              }
              
              exportData.answer_records = answerRecords;
              
              res.json({ success: true, data: exportData });
            });
          });
        });
      });
    });
  });
});

// 清空所有数据
app.post('/api/data/clear-all', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM question_attempts', (err) => {
      if (err) {
        console.error('删除题目尝试记录失败:', err);
        res.status(500).json({ error: '清空数据失败' });
        return;
      }
      
      db.run('DELETE FROM answer_records', (err) => {
        if (err) {
          console.error('删除答题记录失败:', err);
          res.status(500).json({ error: '清空数据失败' });
          return;
        }
        
        db.run('DELETE FROM questions', (err) => {
          if (err) {
            console.error('删除题目失败:', err);
            res.status(500).json({ error: '清空数据失败' });
            return;
          }
          
          db.run('DELETE FROM subcategories', (err) => {
            if (err) {
              console.error('删除子分类失败:', err);
              res.status(500).json({ error: '清空数据失败' });
              return;
            }
            
            db.run('DELETE FROM subjects', (err) => {
              if (err) {
                console.error('删除学科失败:', err);
                res.status(500).json({ error: '清空数据失败' });
                return;
              }
              
              db.run('DELETE FROM users', (err) => {
                if (err) {
                  console.error('删除用户失败:', err);
                  res.status(500).json({ error: '清空数据失败' });
                  return;
                }
                
                db.run('DELETE FROM grades', (err) => {
                  if (err) {
                    console.error('删除年级数据失败:', err);
                    res.status(500).json({ error: '清空数据失败' });
                    return;
                  }
                  
                  db.run('DELETE FROM classes', (err) => {
                    if (err) {
                      console.error('删除班级数据失败:', err);
                      res.status(500).json({ error: '清空数据失败' });
                      return;
                    }
                    
                    res.json({ success: true, message: '所有数据清空成功' });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

// 清空用户答题记录
app.post('/api/data/clear-records', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM question_attempts', (err) => {
      if (err) {
        console.error('删除题目尝试记录失败:', err);
        res.status(500).json({ error: '清空用户答题记录失败' });
        return;
      }
      
      db.run('DELETE FROM answer_records', (err) => {
        if (err) {
          console.error('删除答题记录失败:', err);
          res.status(500).json({ error: '清空用户答题记录失败' });
          return;
        }
        
        res.json({ success: true, message: '用户答题记录清空成功' });
      });
    });
  });
});

// 设置相关API
// 获取所有设置
app.get('/api/settings', (req, res) => {
  db.all('SELECT key, value FROM settings', (err, settings) => {
    if (err) {
      console.error('获取设置失败:', err);
      res.status(500).json({ error: '获取设置失败' });
      return;
    }
    
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    res.json(settingsObj);
  });
});

// 保存设置
app.post('/api/settings', (req, res) => {
  const settings = req.body;
  
  if (!settings || typeof settings !== 'object') {
    res.status(400).json({ error: '设置数据格式错误' });
    return;
  }
  
  db.serialize(() => {
    let count = 0;
    const total = Object.keys(settings).length;
    
    if (total === 0) {
      res.json({ success: true, message: '设置保存成功' });
      return;
    }
    
    for (const [key, value] of Object.entries(settings)) {
      // 使用UPSERT操作：如果键存在则更新，不存在则插入
      db.run(
        'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP',
        [key, value, value],
        (err) => {
          if (err) {
            console.error('保存设置失败:', err);
          }
          
          count++;
          if (count === total) {
            res.json({ success: true, message: '设置保存成功' });
          }
        }
      );
    }
  });
});

// 学科相关API
app.get('/api/subjects', (req, res) => {
  // 尝试从缓存获取
  const cachedSubjects = cache.get(CACHE_KEYS.SUBJECTS);
  if (cachedSubjects) {
    console.log('从缓存获取学科数据');
    res.json(cachedSubjects);
    return;
  }
  
  db.serialize(() => {
    db.all('SELECT * FROM subjects', (err, subjects) => {
      if (err) {
        console.error('获取学科失败:', err);
        res.status(500).json({ error: '获取学科失败' });
        return;
      }
      
      // 为每个学科获取子分类
      const getSubcategories = (subjects, index) => {
        if (index >= subjects.length) {
          // 转换所有学科的字段名
          const subjectsWithCamelCase = subjects.map(subject => ({
            id: subject.id,
            name: subject.name,
            iconIndex: subject.icon_index,
            subcategories: subject.subcategories.map(subcat => ({
              id: subcat.id,
              subjectId: subcat.subject_id,
              name: subcat.name,
              iconIndex: subcat.icon_index
            }))
          }));
          
          // 缓存结果
          cache.put(CACHE_KEYS.SUBJECTS, subjectsWithCamelCase, CACHE_DURATION);
          console.log('缓存学科数据');
          
          res.json(subjectsWithCamelCase);
          return;
        }
        
        const subject = subjects[index];
        db.all('SELECT * FROM subcategories WHERE subject_id = ?', [subject.id], (err, subcategories) => {
          if (err) {
            console.error('获取子分类失败:', err);
          }
          subject.subcategories = subcategories || [];
          getSubcategories(subjects, index + 1);
        });
      };
      
      getSubcategories(subjects, 0);
    });
  });
});

// 子分类相关API
app.get('/api/subjects/:id/subcategories', (req, res) => {
  const subjectId = req.params.id;
  const cacheKey = `${CACHE_KEYS.SUBCATEGORIES}_${subjectId}`;
  
  // 尝试从缓存获取
  const cachedSubcategories = cache.get(cacheKey);
  if (cachedSubcategories) {
    console.log('从缓存获取子分类数据');
    res.json(cachedSubcategories);
    return;
  }
  
  db.all('SELECT * FROM subcategories WHERE subject_id = ?', [subjectId], (err, subcategories) => {
    if (err) {
      console.error('获取子分类失败:', err);
      res.status(500).json({ error: '获取子分类失败' });
      return;
    }
    
    // 缓存结果
    cache.put(cacheKey, subcategories, CACHE_DURATION);
    console.log('缓存子分类数据');
    
    res.json(subcategories);
  });
});

// 题目相关API
app.get('/api/questions', (req, res) => {
  const { subjectId, subcategoryId, type, page = 1, limit = 20 } = req.query;
  
  let query = 'SELECT * FROM questions WHERE 1=1';
  const params = [];
  
  if (subjectId) {
    query += ' AND subject_id = ?';
    params.push(subjectId);
  }
  
  if (subcategoryId) {
    query += ' AND subcategory_id = ?';
    params.push(subcategoryId);
  }
  
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
  
  db.all(query, params, (err, questions) => {
    if (err) {
      console.error('获取题目失败:', err);
      res.status(500).json({ error: '获取题目失败' });
      return;
    }
    
    // 转换字段名为camelCase格式
    const formattedQuestions = questions.map(question => {
      let options = [];
      let answer = question.correct_answer;
      
      try {
        options = JSON.parse(question.options);
      } catch (error) {
        console.error('解析选项失败:', error);
        options = [];
      }
      
      try {
        // 尝试解析answer字段，处理JSON字符串格式的答案
        const parsedAnswer = JSON.parse(question.correct_answer);
        if (typeof parsedAnswer === 'string') {
          answer = parsedAnswer;
        }
      } catch (error) {
        // 如果解析失败，使用原始值
      }
      
      return {
        id: question.id,
        subjectId: question.subject_id,
        subcategoryId: question.subcategory_id,
        content: question.content,
        type: question.type,
        options: options,
        answer: answer,
        explanation: question.explanation,
        audio: question.audio_url,
        image: question.image_url,
        createdAt: question.created_at
      };
    });
    
    res.json(formattedQuestions);
  });
});

// 年级相关API
app.get('/api/grades', (req, res) => {
  // 尝试从缓存获取
  const cachedGrades = cache.get(CACHE_KEYS.GRADES);
  if (cachedGrades) {
    console.log('从缓存获取年级数据');
    res.json(cachedGrades);
    return;
  }
  
  db.all('SELECT * FROM grades ORDER BY id', (err, grades) => {
    if (err) {
      console.error('获取年级失败:', err);
      res.status(500).json({ error: '获取年级失败' });
      return;
    }
    
    // 缓存结果
    cache.put(CACHE_KEYS.GRADES, grades, CACHE_DURATION);
    console.log('缓存年级数据');
    
    res.json(grades);
  });
});

app.post('/api/grades', (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    res.status(400).json({ error: '年级名称不能为空' });
    return;
  }
  
  db.run('INSERT INTO grades (name) VALUES (?)', [name], function(err) {
    if (err) {
      console.error('添加年级失败:', err);
      res.status(500).json({ error: '添加年级失败' });
      return;
    }
    // 返回新添加的年级
    db.get('SELECT * FROM grades WHERE id = ?', [this.lastID], (err, grade) => {
      if (err) {
        console.error('获取新年级失败:', err);
        res.status(500).json({ error: '添加年级失败' });
        return;
      }
      res.json(grade);
    });
  });
});

app.put('/api/grades/:id', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  if (!name) {
    res.status(400).json({ error: '年级名称不能为空' });
    return;
  }
  
  db.run('UPDATE grades SET name = ? WHERE id = ?', [name, id], function(err) {
    if (err) {
      console.error('更新年级失败:', err);
      res.status(500).json({ error: '更新年级失败' });
      return;
    }
    res.json({ success: true });
  });
});

app.delete('/api/grades/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM grades WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('删除年级失败:', err);
      res.status(500).json({ error: '删除年级失败' });
      return;
    }
    res.json({ success: true });
  });
});

app.post('/api/grades/init', (req, res) => {
  // 初始化年级数据
  db.serialize(() => {
    // 先清空现有数据
    db.run('DELETE FROM grades', (err) => {
      if (err) {
        console.error('清空年级数据失败:', err);
        res.status(500).json({ error: '初始化年级数据失败' });
        return;
      }
      
      // 插入默认年级数据
      const defaultGrades = ['1年级', '2年级', '3年级', '4年级', '5年级', '6年级'];
      let count = 0;
      
      defaultGrades.forEach((grade, index) => {
        db.run('INSERT INTO grades (id, name) VALUES (?, ?)', [index + 1, grade], (err) => {
          if (err) {
            console.error('插入年级数据失败:', err);
          }
          count++;
          
          if (count === defaultGrades.length) {
            res.json({ success: true, message: '年级数据初始化成功' });
          }
        });
      });
    });
  });
});

app.post('/api/grades/clear', (req, res) => {
  // 清空年级数据
  db.run('DELETE FROM grades', (err) => {
    if (err) {
      console.error('清空年级数据失败:', err);
      res.status(500).json({ error: '清空年级数据失败' });
      return;
    }
    res.json({ success: true, message: '年级数据清空成功' });
  });
});

// 班级相关API
app.get('/api/classes', (req, res) => {
  // 尝试从缓存获取
  const cachedClasses = cache.get(CACHE_KEYS.CLASSES);
  if (cachedClasses) {
    console.log('从缓存获取班级数据');
    res.json(cachedClasses);
    return;
  }
  
  db.all('SELECT * FROM classes ORDER BY id', (err, classes) => {
    if (err) {
      console.error('获取班级失败:', err);
      res.status(500).json({ error: '获取班级失败' });
      return;
    }
    
    // 缓存结果
    cache.put(CACHE_KEYS.CLASSES, classes, CACHE_DURATION);
    console.log('缓存班级数据');
    
    res.json(classes);
  });
});

app.post('/api/classes', (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    res.status(400).json({ error: '班级名称不能为空' });
    return;
  }
  
  db.run('INSERT INTO classes (name) VALUES (?)', [name], function(err) {
    if (err) {
      console.error('添加班级失败:', err);
      res.status(500).json({ error: '添加班级失败' });
      return;
    }
    // 返回新添加的班级
    db.get('SELECT * FROM classes WHERE id = ?', [this.lastID], (err, classItem) => {
      if (err) {
        console.error('获取新班级失败:', err);
        res.status(500).json({ error: '添加班级失败' });
        return;
      }
      res.json(classItem);
    });
  });
});

app.put('/api/classes/:id', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  if (!name) {
    res.status(400).json({ error: '班级名称不能为空' });
    return;
  }
  
  db.run('UPDATE classes SET name = ? WHERE id = ?', [name, id], function(err) {
    if (err) {
      console.error('更新班级失败:', err);
      res.status(500).json({ error: '更新班级失败' });
      return;
    }
    res.json({ success: true });
  });
});

app.delete('/api/classes/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM classes WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('删除班级失败:', err);
      res.status(500).json({ error: '删除班级失败' });
      return;
    }
    res.json({ success: true });
  });
});

app.post('/api/classes/init', (req, res) => {
  // 初始化班级数据
  db.serialize(() => {
    // 先清空现有数据
    db.run('DELETE FROM classes', (err) => {
      if (err) {
        console.error('清空班级数据失败:', err);
        res.status(500).json({ error: '初始化班级数据失败' });
        return;
      }
      
      // 插入默认班级数据
      const defaultClasses = ['1班', '2班', '3班', '4班', '5班', '6班', '7班', '8班', '9班', '10班'];
      let count = 0;
      
      defaultClasses.forEach((className, index) => {
        db.run('INSERT INTO classes (id, name) VALUES (?, ?)', [index + 1, className], (err) => {
          if (err) {
            console.error('插入班级数据失败:', err);
          }
          count++;
          
          if (count === defaultClasses.length) {
            res.json({ success: true, message: '班级数据初始化成功' });
          }
        });
      });
    });
  });
});

app.post('/api/classes/clear', (req, res) => {
  // 清空班级数据
  db.run('DELETE FROM classes', (err) => {
    if (err) {
      console.error('清空班级数据失败:', err);
      res.status(500).json({ error: '清空班级数据失败' });
      return;
    }
    res.json({ success: true, message: '班级数据清空成功' });
  });
});

// 排行榜相关API
app.get('/api/leaderboard/global', (req, res) => {
  const { limit = 100, grade, class: className } = req.query;
  
  let query = `
    SELECT u.id, u.student_id, u.name, u.grade, u.class,
           COUNT(DISTINCT ar.id) as total_sessions,
           SUM(ar.total_questions) as total_questions,
           SUM(ar.correct_count) as correct_count,
           CASE WHEN SUM(ar.total_questions) > 0 THEN
             (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions)
           ELSE 0 END as avg_accuracy
    FROM users u
    JOIN answer_records ar ON u.id = ar.user_id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (grade) {
    query += ' AND u.grade = ?';
    params.push(grade);
  }
  
  if (className) {
    query += ' AND u.class = ?';
    params.push(className);
  }
  
  query += ' GROUP BY u.id ORDER BY avg_accuracy DESC, total_questions DESC LIMIT ?';
  params.push(parseInt(limit));
  
  db.all(query, params, (err, users) => {
    if (err) {
      console.error('获取排行榜数据失败:', err);
      res.status(500).json({ error: '获取排行榜数据失败' });
      return;
    }
    res.json(users);
  });
});

// 学科排行榜API
app.get('/api/leaderboard/subject/:subjectId', (req, res) => {
  const { subjectId } = req.params;
  const { grade, class: className } = req.query;
  
  let query = `
    SELECT u.id, u.student_id, u.name, u.grade, u.class,
           COUNT(DISTINCT ar.id) as total_sessions,
           SUM(ar.total_questions) as total_questions,
           SUM(ar.correct_count) as correct_count,
           CASE WHEN SUM(ar.total_questions) > 0 THEN
             (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions)
           ELSE 0 END as avg_accuracy
    FROM users u
    JOIN answer_records ar ON u.id = ar.user_id
    WHERE ar.subject_id = ?
  `;
  
  const params = [subjectId];
  
  if (grade) {
    query += ' AND u.grade = ?';
    params.push(grade);
  }
  
  if (className) {
    query += ' AND u.class = ?';
    params.push(className);
  }
  
  query += ' GROUP BY u.id ORDER BY avg_accuracy DESC, total_questions DESC';
  
  db.all(query, params, (err, users) => {
    if (err) {
      console.error('获取学科排行榜数据失败:', err);
      res.status(500).json({ error: '获取学科排行榜数据失败' });
      return;
    }
    res.json(users);
  });
});

// 用户统计API
app.get('/api/user-stats/:userId', (req, res) => {
  const { userId } = req.params;
  
  // 获取用户总体统计
  const userStatsQuery = `
    SELECT COUNT(DISTINCT ar.id) as totalSessions,
           SUM(ar.total_questions) as totalQuestions,
           SUM(ar.correct_count) as totalCorrect,
           CASE WHEN SUM(ar.total_questions) > 0 THEN
             (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions)
           ELSE 0 END as avgAccuracy
    FROM answer_records ar
    WHERE ar.user_id = ?
  `;
  
  // 获取用户各学科统计
  const subjectStatsQuery = `
    SELECT ar.subject_id,
           s.name as subject_name,
           COUNT(DISTINCT ar.id) as total_sessions,
           SUM(ar.total_questions) as total_questions,
           SUM(ar.correct_count) as correct_count,
           CASE WHEN SUM(ar.total_questions) > 0 THEN
             (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions)
           ELSE 0 END as avg_accuracy
    FROM answer_records ar
    LEFT JOIN subjects s ON ar.subject_id = s.id
    WHERE ar.user_id = ?
    GROUP BY ar.subject_id
  `;
  
  db.serialize(() => {
    let userStats = {};
    
    // 执行用户总体统计查询
    db.get(userStatsQuery, [userId], (err, stats) => {
      if (err) {
        console.error('获取用户统计失败:', err);
        res.status(500).json({ error: '获取用户统计失败' });
        return;
      }
      
      userStats = stats || {
        totalSessions: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        avgAccuracy: 0
      };
      
      // 执行用户各学科统计查询
      db.all(subjectStatsQuery, [userId], (err, subjectStats) => {
        if (err) {
          console.error('获取用户学科统计失败:', err);
          res.status(500).json({ error: '获取用户学科统计失败' });
          return;
        }
        
        userStats.subjectStats = subjectStats;
        res.json(userStats);
      });
    });
  });
});

app.post('/api/leaderboard/clear', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM question_attempts', (err) => {
      if (err) {
        console.error('删除题目尝试记录失败:', err);
        res.status(500).json({ error: '清空排行榜数据失败' });
        return;
      }
      
      db.run('DELETE FROM answer_records', (err) => {
        if (err) {
          console.error('删除答题记录失败:', err);
          res.status(500).json({ error: '清空排行榜数据失败' });
          return;
        }
        
        res.json({ success: true, message: '排行榜数据清空成功' });
      });
    });
  });
});

// 答题记录相关API
app.get('/api/answer-records/all', (req, res) => {
  const { limit = 50, grade, class: className, subjectId, startDate, endDate } = req.query;
  
  let query = `
    SELECT ar.*, u.student_id, u.name, u.grade, u.class, s.name as subject_name,
           sc.name as subcategory_name
    FROM answer_records ar
    LEFT JOIN users u ON ar.user_id = u.id
    LEFT JOIN subjects s ON ar.subject_id = s.id
    LEFT JOIN subcategories sc ON ar.subcategory_id = sc.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (grade) {
    query += ' AND u.grade = ?';
    params.push(grade);
  }
  
  if (className) {
    query += ' AND u.class = ?';
    params.push(className);
  }
  
  if (subjectId) {
    query += ' AND ar.subject_id = ?';
    params.push(subjectId);
  }
  
  if (startDate) {
    query += ' AND ar.created_at >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    query += ' AND ar.created_at <= ?';
    params.push(endDate);
  }
  
  query += ' ORDER BY ar.created_at DESC LIMIT ?';
  params.push(parseInt(limit));
  
  db.all(query, params, (err, records) => {
    if (err) {
      console.error('获取答题记录失败:', err);
      res.status(500).json({ error: '获取答题记录失败' });
      return;
    }
    res.json(records);
  });
});

app.get('/api/answer-records/:userId', (req, res) => {
  const userId = req.params.userId;
  
  const query = `
    SELECT ar.*, s.name as subject_name, sc.name as subcategory_name
    FROM answer_records ar
    LEFT JOIN subjects s ON ar.subject_id = s.id
    LEFT JOIN subcategories sc ON ar.subcategory_id = sc.id
    WHERE ar.user_id = ?
    ORDER BY ar.created_at DESC
  `;
  
  db.all(query, [userId], (err, records) => {
    if (err) {
      console.error('获取用户答题记录失败:', err);
      res.status(500).json({ error: '获取用户答题记录失败' });
      return;
    }
    res.json(records);
  });
});

// 题目尝试记录相关API
app.get('/api/question-attempts/:userId', (req, res) => {
  const { userId } = req.params;
  const { answerRecordId } = req.query;
  
  let query = `
    SELECT qa.*, q.content, q.correct_answer, s.name as subject_name,
           sc.name as subcategory_name
    FROM question_attempts qa
    LEFT JOIN questions q ON qa.question_id = q.id
    LEFT JOIN subjects s ON qa.subject_id = s.id
    LEFT JOIN subcategories sc ON qa.subcategory_id = sc.id
    WHERE qa.user_id = ?
  `;
  
  const params = [userId];
  
  if (answerRecordId) {
    query += ' AND qa.answer_record_id = ?';
    params.push(answerRecordId);
  }
  
  query += ' ORDER BY qa.created_at DESC';
  
  db.all(query, params, (err, attempts) => {
    if (err) {
      console.error('获取题目尝试记录失败:', err);
      res.status(500).json({ error: '获取题目尝试记录失败' });
      return;
    }
    res.json(attempts);
  });
});

// 错误率较高的题目API
app.get('/api/error-prone-questions', (req, res) => {
  const { subjectId, grade, class: className, subcategoryIds } = req.query;
  
  // 生成缓存键
  const cacheKey = `${CACHE_KEYS.ERROR_PRONE_QUESTIONS}_${subjectId || ''}_${grade || ''}_${className || ''}_${subcategoryIds || ''}`;
  
  // 尝试从缓存获取
  const cachedQuestions = cache.get(cacheKey);
  if (cachedQuestions) {
    console.log('从缓存获取错误率较高的题目');
    res.json(cachedQuestions);
    return;
  }
  
  let query = `
    SELECT q.id, q.subject_id, q.content, q.type,
           COUNT(qa.id) as total_attempts,
           SUM(qa.is_correct) as correct_count,
           s.name as subject_name
    FROM questions q
    LEFT JOIN question_attempts qa ON q.id = qa.question_id
    LEFT JOIN users u ON qa.user_id = u.id
    LEFT JOIN subjects s ON q.subject_id = s.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (subjectId) {
    query += ' AND q.subject_id = ?';
    params.push(subjectId);
  }
  
  if (subcategoryIds) {
    const subcategoryArray = Array.isArray(subcategoryIds) ? subcategoryIds : [subcategoryIds];
    if (subcategoryArray.length > 0) {
      query += ' AND q.subcategory_id IN (' + subcategoryArray.map(() => '?').join(', ') + ')';
      params.push(...subcategoryArray);
    }
  }
  
  if (grade) {
    query += ' AND u.grade = ?';
    params.push(grade);
  }
  
  if (className) {
    query += ' AND u.class = ?';
    params.push(className);
  }
  
  query += ' GROUP BY q.id HAVING total_attempts >= 3 ORDER BY (total_attempts - correct_count) DESC LIMIT 20';
  
  db.all(query, params, (err, questions) => {
    if (err) {
      console.error('获取错误率较高的题目失败:', err);
      res.status(500).json({ error: '获取错误率较高的题目失败' });
      return;
    }
    
    // 缓存结果
    cache.put(cacheKey, questions, CACHE_DURATION);
    console.log('缓存错误率较高的题目');
    
    res.json(questions);
  });
});

// 数据分析API
app.get('/api/analysis', (req, res) => {
  const { studentId, grade, class: className, subjectId, subcategoryIds, startDate, endDate } = req.query;
  
  // 生成缓存键
  const cacheKey = `${CACHE_KEYS.ANALYSIS}_${studentId || ''}_${grade || ''}_${className || ''}_${subjectId || ''}_${subcategoryIds || ''}_${startDate || ''}_${endDate || ''}`;
  
  // 尝试从缓存获取
  const cachedAnalysis = cache.get(cacheKey);
  if (cachedAnalysis) {
    console.log('从缓存获取分析数据');
    res.json(cachedAnalysis);
    return;
  }
  
  // 构建基础查询条件
  let whereClause = 'WHERE 1=1';
  let errorWhereClause = 'WHERE 1=1';
  const params = [];
  
  if (studentId) {
    whereClause += ' AND u.student_id = ?';
    errorWhereClause += ' AND u.student_id = ?';
    params.push(studentId);
  }
  
  if (grade) {
    whereClause += ' AND u.grade = ?';
    errorWhereClause += ' AND u.grade = ?';
    params.push(grade);
  }
  
  if (className) {
    whereClause += ' AND u.class = ?';
    errorWhereClause += ' AND u.class = ?';
    params.push(className);
  }
  
  if (subjectId) {
    whereClause += ' AND ar.subject_id = ?';
    errorWhereClause += ' AND qa.subject_id = ?';
    params.push(subjectId);
  }
  
  if (subcategoryIds) {
    const subcategoryArray = Array.isArray(subcategoryIds) ? subcategoryIds : [subcategoryIds];
    if (subcategoryArray.length > 0) {
      whereClause += ' AND ar.subcategory_id IN (' + subcategoryArray.map(() => '?').join(', ') + ')';
      errorWhereClause += ' AND qa.subcategory_id IN (' + subcategoryArray.map(() => '?').join(', ') + ')';
      params.push(...subcategoryArray);
    }
  }
  
  if (startDate) {
    whereClause += ' AND ar.created_at >= ?';
    errorWhereClause += ' AND qa.created_at >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    whereClause += ' AND ar.created_at <= ?';
    errorWhereClause += ' AND qa.created_at <= ?';
    params.push(endDate);
  }
  
  // 基础统计查询
  const basicStatsQuery = `
    SELECT
      COUNT(DISTINCT u.id) as totalUsers,
      COUNT(DISTINCT ar.id) as totalSessions,
      SUM(ar.total_questions) as totalQuestions,
      SUM(ar.correct_count) as totalCorrect,
      CASE WHEN SUM(ar.total_questions) > 0 THEN
        (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions)
      ELSE 0 END as overallAccuracy
    FROM answer_records ar
    INNER JOIN users u ON ar.user_id = u.id
    ${whereClause}
  `;
  
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
  `;
  
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
  `;
  
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
  `;
  
  // 按班级分析查询
  const classAnalysisQuery = `
    SELECT
      u.class as class_num,
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
    GROUP BY u.class
    ORDER BY u.class
  `;
  
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
  `;
  
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
  `;
  
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
  `;
  
  db.serialize(() => {
    let analysisData = {
      totalUsers: 0,
      totalSessions: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      overallAccuracy: 0,
      gradeAnalysisList: [],
      subjectAnalysisList: [],
      timeAnalysisList: [],
      classAnalysisList: [],
      subcategoryAnalysisList: [],
      timeSpentAnalysisList: [],
      errorAnalysisList: [],
      errorProneQuestions: []
    };
    
    // 执行基础统计查询
    db.get(basicStatsQuery, params, (err, stats) => {
      if (err) {
        console.error('获取基础统计失败:', err);
        res.status(500).json({ error: '获取分析数据失败' });
        return;
      }
      
      if (stats) {
        analysisData = {
          totalUsers: stats.totalUsers || 0,
          totalSessions: stats.totalSessions || 0,
          totalQuestions: stats.totalQuestions || 0,
          totalCorrect: stats.totalCorrect || 0,
          overallAccuracy: stats.overallAccuracy || 0,
          gradeAnalysisList: [],
          subjectAnalysisList: [],
          timeAnalysisList: [],
          classAnalysisList: [],
          subcategoryAnalysisList: [],
          timeSpentAnalysisList: [],
          errorAnalysisList: []
        };
      }
      
      // 执行按年级分析查询
      db.all(gradeAnalysisQuery, params, (err, gradeData) => {
        if (err) {
          console.error('获取年级分析失败:', err);
          res.status(500).json({ error: '获取分析数据失败' });
          return;
        }
        
        analysisData.gradeAnalysisList = gradeData || [];
        
        // 执行按学科分析查询
        db.all(subjectAnalysisQuery, params, (err, subjectData) => {
          if (err) {
            console.error('获取学科分析失败:', err);
            res.status(500).json({ error: '获取分析数据失败' });
            return;
          }
          
          analysisData.subjectAnalysisList = subjectData || [];
          
          // 执行按时间趋势分析查询
          db.all(timeAnalysisQuery, params, (err, timeData) => {
            if (err) {
              console.error('获取时间趋势分析失败:', err);
              res.status(500).json({ error: '获取分析数据失败' });
              return;
            }
            
            analysisData.timeAnalysisList = timeData || [];
            
            // 执行按班级分析查询
            db.all(classAnalysisQuery, params, (err, classData) => {
              if (err) {
                console.error('获取班级分析失败:', err);
                res.status(500).json({ error: '获取分析数据失败' });
                return;
              }
              
              analysisData.classAnalysisList = classData || [];
              
              // 执行按子分类分析查询
              db.all(subcategoryAnalysisQuery, params, (err, subcategoryData) => {
                if (err) {
                  console.error('获取子分类分析失败:', err);
                  res.status(500).json({ error: '获取分析数据失败' });
                  return;
                }
                
                analysisData.subcategoryAnalysisList = subcategoryData || [];
                
                // 执行答题时间分析查询
                db.all(timeSpentAnalysisQuery, params, (err, timeSpentData) => {
                  if (err) {
                    console.error('获取答题时间分析失败:', err);
                    res.status(500).json({ error: '获取分析数据失败' });
                    return;
                  }
                  
                  analysisData.timeSpentAnalysisList = timeSpentData || [];
                  
                  // 执行错题分析查询
                  db.all(errorAnalysisQuery, params, (err, errorData) => {
                    if (err) {
                      console.error('获取错题分析失败:', err);
                      res.status(500).json({ error: '获取分析数据失败' });
                      return;
                    }
                    
                    analysisData.errorAnalysisList = errorData || [];
                    
                    // 执行错误率较高的题目查询
                    let errorProneQuery = `
                      SELECT q.id, q.subject_id, q.content, q.type,
                             COUNT(qa.id) as total_attempts,
                             SUM(qa.is_correct) as correct_count,
                             s.name as subject_name
                      FROM questions q
                      LEFT JOIN question_attempts qa ON q.id = qa.question_id
                      LEFT JOIN users u ON qa.user_id = u.id
                      LEFT JOIN subjects s ON q.subject_id = s.id
                      WHERE 1=1
                    `;
                    
                    if (subjectId) {
                      errorProneQuery += ' AND q.subject_id = ?';
                    }
                    
                    if (grade) {
                      errorProneQuery += ' AND u.grade = ?';
                    }
                    
                    if (className) {
                      errorProneQuery += ' AND u.class = ?';
                    }
                    
                    if (startDate) {
                      errorProneQuery += ' AND qa.created_at >= ?';
                    }
                    
                    if (endDate) {
                      errorProneQuery += ' AND qa.created_at <= ?';
                    }
                    
                    errorProneQuery += ' GROUP BY q.id HAVING total_attempts >= 3 ORDER BY (total_attempts - correct_count) DESC LIMIT 20';
                    
                    db.all(errorProneQuery, params, (err, errorProneData) => {
                      if (err) {
                        console.error('获取错误率较高的题目失败:', err);
                        res.status(500).json({ error: '获取分析数据失败' });
                        return;
                      }
                      
                      analysisData.errorProneQuestions = errorProneData || [];
                      
                      // 缓存结果
                      cache.put(cacheKey, analysisData, CACHE_DURATION);
                      console.log('缓存分析数据');
                      
                      res.json(analysisData);
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

// 分析报告下载API
app.get('/api/analysis/download', (req, res) => {
  const { type, studentId, grade, class: className, subjectId, subcategoryIds, startDate, endDate } = req.query;
  
  // 构建基础查询条件
  let whereClause = 'WHERE 1=1';
  let errorWhereClause = 'WHERE 1=1';
  const params = [];
  
  if (studentId) {
    whereClause += ' AND u.student_id = ?';
    errorWhereClause += ' AND u.student_id = ?';
    params.push(studentId);
  }
  
  if (grade) {
    whereClause += ' AND u.grade = ?';
    errorWhereClause += ' AND u.grade = ?';
    params.push(grade);
  }
  
  if (className) {
    whereClause += ' AND u.class = ?';
    errorWhereClause += ' AND u.class = ?';
    params.push(className);
  }
  
  if (subjectId) {
    whereClause += ' AND ar.subject_id = ?';
    errorWhereClause += ' AND qa.subject_id = ?';
    params.push(subjectId);
  }
  
  if (subcategoryIds) {
    const subcategoryArray = Array.isArray(subcategoryIds) ? subcategoryIds : [subcategoryIds];
    if (subcategoryArray.length > 0) {
      whereClause += ' AND ar.subcategory_id IN (' + subcategoryArray.map(() => '?').join(', ') + ')';
      errorWhereClause += ' AND qa.subcategory_id IN (' + subcategoryArray.map(() => '?').join(', ') + ')';
      params.push(...subcategoryArray);
    }
  }
  
  if (startDate) {
    whereClause += ' AND ar.created_at >= ?';
    errorWhereClause += ' AND qa.created_at >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    whereClause += ' AND ar.created_at <= ?';
    errorWhereClause += ' AND qa.created_at <= ?';
    params.push(endDate);
  }
  
  // 基础统计查询
  const basicStatsQuery = `
    SELECT
      COUNT(DISTINCT u.id) as totalUsers,
      COUNT(DISTINCT ar.id) as totalSessions,
      SUM(ar.total_questions) as totalQuestions,
      SUM(ar.correct_count) as totalCorrect,
      CASE WHEN SUM(ar.total_questions) > 0 THEN
        (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions)
      ELSE 0 END as overallAccuracy
    FROM answer_records ar
    INNER JOIN users u ON ar.user_id = u.id
    ${whereClause}
  `;
  
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
  `;
  
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
  `;
  
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
  `;
  
  // 按班级分析查询
  const classAnalysisQuery = `
    SELECT
      u.class as class_num,
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
    GROUP BY u.class
    ORDER BY u.class
  `;
  
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
  `;
  
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
  `;
  
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
  `;
  
  db.serialize(() => {
    let analysisData = {
      totalUsers: 0,
      totalSessions: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      overallAccuracy: 0,
      gradeAnalysisList: [],
      subjectAnalysisList: [],
      timeAnalysisList: []
    };
    
    // 执行基础统计查询
    db.get(basicStatsQuery, params, (err, stats) => {
      if (err) {
        console.error('获取基础统计失败:', err);
        res.status(500).json({ error: '获取分析数据失败' });
        return;
      }
      
      if (stats) {
        analysisData = {
          totalUsers: stats.totalUsers || 0,
          totalSessions: stats.totalSessions || 0,
          totalQuestions: stats.totalQuestions || 0,
          totalCorrect: stats.totalCorrect || 0,
          overallAccuracy: stats.overallAccuracy || 0,
          gradeAnalysisList: [],
          subjectAnalysisList: [],
          timeAnalysisList: [],
          classAnalysisList: [],
          subcategoryAnalysisList: [],
          timeSpentAnalysisList: [],
          errorAnalysisList: []
        };
      }
      
      // 执行年级分析查询
      db.all(gradeAnalysisQuery, params, (err, gradeData) => {
        if (err) {
          console.error('获取年级分析失败:', err);
          res.status(500).json({ error: '获取分析数据失败' });
          return;
        }
        
        analysisData.gradeAnalysisList = gradeData || [];
        
        // 执行学科分析查询
        db.all(subjectAnalysisQuery, params, (err, subjectData) => {
          if (err) {
            console.error('获取学科分析失败:', err);
            res.status(500).json({ error: '获取分析数据失败' });
            return;
          }
          
          analysisData.subjectAnalysisList = subjectData || [];
          
          // 执行时间趋势分析查询
          db.all(timeAnalysisQuery, params, (err, timeData) => {
            if (err) {
              console.error('获取时间趋势分析失败:', err);
              res.status(500).json({ error: '获取分析数据失败' });
              return;
            }
            
            analysisData.timeAnalysisList = timeData || [];
            
            // 执行按班级分析查询
            db.all(classAnalysisQuery, params, (err, classData) => {
              if (err) {
                console.error('获取班级分析失败:', err);
                res.status(500).json({ error: '获取分析数据失败' });
                return;
              }
              
              analysisData.classAnalysisList = classData || [];
              
              // 执行按子分类分析查询
              db.all(subcategoryAnalysisQuery, params, (err, subcategoryData) => {
                if (err) {
                  console.error('获取子分类分析失败:', err);
                  res.status(500).json({ error: '获取分析数据失败' });
                  return;
                }
                
                analysisData.subcategoryAnalysisList = subcategoryData || [];
                
                // 执行答题时间分析查询
                db.all(timeSpentAnalysisQuery, params, (err, timeSpentData) => {
                  if (err) {
                    console.error('获取答题时间分析失败:', err);
                    res.status(500).json({ error: '获取分析数据失败' });
                    return;
                  }
                  
                  analysisData.timeSpentAnalysisList = timeSpentData || [];
                  
                  // 执行错题分析查询
                  db.all(errorAnalysisQuery, params, (err, errorData) => {
                    if (err) {
                      console.error('获取错题分析失败:', err);
                      res.status(500).json({ error: '获取分析数据失败' });
                      return;
                    }
                    
                    analysisData.errorAnalysisList = errorData || [];
                    
                    if (type === 'pdf') {
                      generatePDFReport(analysisData, res);
                    } else if (type === 'excel') {
                      generateExcelReport(analysisData, res);
                    } else {
                      res.status(400).json({ error: '无效的报告类型' });
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

// 生成PDF报告
function generatePDFReport(analysisData, res) {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ margin: 50 });
  
  // 设置响应头
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=analysis_report.pdf');
  
  // 连接PDF流到响应
  doc.pipe(res);
  
  // 标题
  doc.fontSize(20).text('小学各学科数据分析报告', { align: 'center' });
  doc.moveDown(2);
  
  // 总体统计
  doc.fontSize(16).text('一、总体统计', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`总用户数: ${analysisData.totalUsers}`);
  doc.text(`总答题次数: ${analysisData.totalSessions}`);
  doc.text(`总答题数: ${analysisData.totalQuestions}`);
  doc.text(`总正确数: ${analysisData.totalCorrect}`);
  doc.text(`总体正确率: ${analysisData.overallAccuracy.toFixed(1)}%`);
  doc.moveDown(2);
  
  // 学科分析
  doc.fontSize(16).text('二、学科分析', { underline: true });
  doc.moveDown(0.5);
  analysisData.subjectAnalysisList.forEach(item => {
    doc.fontSize(12).text(`${item.subject}: 正确率 ${item.accuracy.toFixed(1)}%, 答题数 ${item.questions}`);
  });
  doc.moveDown(2);
  
  // 年级分析
  doc.fontSize(16).text('三、年级分析', { underline: true });
  doc.moveDown(0.5);
  analysisData.gradeAnalysisList.forEach(item => {
    doc.fontSize(12).text(`${item.grade}年级: 正确率 ${item.accuracy.toFixed(1)}%, 答题数 ${item.questions}`);
  });
  doc.moveDown(2);
  
  // 时间趋势分析
  doc.fontSize(16).text('四、时间趋势分析', { underline: true });
  doc.moveDown(0.5);
  analysisData.timeAnalysisList.forEach(item => {
    doc.fontSize(12).text(`${item.date}: 正确率 ${item.accuracy.toFixed(1)}%, 答题数 ${item.questions}`);
  });
  
  // 班级分析
  doc.fontSize(16).text('五、班级分析', { underline: true });
  doc.moveDown(0.5);
  analysisData.classAnalysisList.forEach(item => {
    doc.fontSize(12).text(`${item.class}班: 正确率 ${item.accuracy.toFixed(1)}%, 答题数 ${item.questions}`);
  });
  
  // 子分类分析
  doc.fontSize(16).text('六、子分类分析', { underline: true });
  doc.moveDown(0.5);
  analysisData.subcategoryAnalysisList.forEach(item => {
    doc.fontSize(12).text(`${item.subject} - ${item.subcategory || '未分类'}: 正确率 ${item.accuracy.toFixed(1)}%, 答题数 ${item.questions}`);
  });
  
  // 答题时间分析
  doc.fontSize(16).text('七、答题时间分析', { underline: true });
  doc.moveDown(0.5);
  analysisData.timeSpentAnalysisList.forEach(item => {
    doc.fontSize(12).text(`${item.time_range}: 正确率 ${item.accuracy.toFixed(1)}%, 答题次数 ${item.sessions}`);
  });
  
  // 错题分析
  doc.fontSize(16).text('八、错题分析', { underline: true });
  doc.moveDown(0.5);
  analysisData.errorAnalysisList.forEach(item => {
    doc.fontSize(12).text(`${item.subject}: 错误率 ${item.error_rate.toFixed(1)}%, 错题数 ${item.error_count}, 总尝试次数 ${item.total_attempts}`);
  });
  
  // 结束PDF生成
  doc.end();
}

// 生成Excel报告
function generateExcelReport(analysisData, res) {
  const XLSX = require('xlsx');
  // 创建工作簿
  const wb = XLSX.utils.book_new();
  
  // 总体统计工作表
  const statsData = [
    ['统计项目', '数值'],
    ['总用户数', analysisData.totalUsers],
    ['总答题次数', analysisData.totalSessions],
    ['总答题数', analysisData.totalQuestions],
    ['总正确数', analysisData.totalCorrect],
    ['总体正确率', `${analysisData.overallAccuracy.toFixed(1)}%`]
  ];
  const statsWs = XLSX.utils.aoa_to_sheet(statsData);
  XLSX.utils.book_append_sheet(wb, statsWs, '总体统计');
  
  // 学科分析工作表
  const subjectData = [['学科', '答题次数', '答题数', '正确数', '正确率']];
  analysisData.subjectAnalysisList.forEach(item => {
    subjectData.push([item.subject, item.sessions, item.questions, item.correct, `${item.accuracy.toFixed(1)}%`]);
  });
  const subjectWs = XLSX.utils.aoa_to_sheet(subjectData);
  XLSX.utils.book_append_sheet(wb, subjectWs, '学科分析');
  
  // 年级分析工作表
  const gradeData = [['年级', '用户数', '答题次数', '答题数', '正确数', '正确率']];
  analysisData.gradeAnalysisList.forEach(item => {
    gradeData.push([`${item.grade}年级`, item.users, item.sessions, item.questions, item.correct, `${item.accuracy.toFixed(1)}%`]);
  });
  const gradeWs = XLSX.utils.aoa_to_sheet(gradeData);
  XLSX.utils.book_append_sheet(wb, gradeWs, '年级分析');
  
  // 时间趋势分析工作表
  const timeData = [['日期', '答题次数', '答题数', '正确数', '正确率']];
  analysisData.timeAnalysisList.forEach(item => {
    timeData.push([item.date, item.sessions, item.questions, item.correct, `${item.accuracy.toFixed(1)}%`]);
  });
  const timeWs = XLSX.utils.aoa_to_sheet(timeData);
  XLSX.utils.book_append_sheet(wb, timeWs, '时间趋势');
  
  // 班级分析工作表
  const classData = [['班级', '用户数', '答题次数', '答题数', '正确数', '正确率']];
  analysisData.classAnalysisList.forEach(item => {
    classData.push([`${item.class}班`, item.users, item.sessions, item.questions, item.correct, `${item.accuracy.toFixed(1)}%`]);
  });
  const classWs = XLSX.utils.aoa_to_sheet(classData);
  XLSX.utils.book_append_sheet(wb, classWs, '班级分析');
  
  // 子分类分析工作表
  const subcategoryData = [['学科', '子分类', '答题次数', '答题数', '正确数', '正确率']];
  analysisData.subcategoryAnalysisList.forEach(item => {
    subcategoryData.push([item.subject, item.subcategory || '未分类', item.sessions, item.questions, item.correct, `${item.accuracy.toFixed(1)}%`]);
  });
  const subcategoryWs = XLSX.utils.aoa_to_sheet(subcategoryData);
  XLSX.utils.book_append_sheet(wb, subcategoryWs, '子分类分析');
  
  // 答题时间分析工作表
  const timeSpentData = [['时间范围', '答题次数', '答题数', '正确数', '正确率']];
  analysisData.timeSpentAnalysisList.forEach(item => {
    timeSpentData.push([item.time_range, item.sessions, item.questions, item.correct, `${item.accuracy.toFixed(1)}%`]);
  });
  const timeSpentWs = XLSX.utils.aoa_to_sheet(timeSpentData);
  XLSX.utils.book_append_sheet(wb, timeSpentWs, '答题时间分析');
  
  // 错题分析工作表
  const errorData = [['学科', '总尝试次数', '错题数', '错误率']];
  analysisData.errorAnalysisList.forEach(item => {
    errorData.push([item.subject, item.total_attempts, item.error_count, `${item.error_rate.toFixed(1)}%`]);
  });
  const errorWs = XLSX.utils.aoa_to_sheet(errorData);
  XLSX.utils.book_append_sheet(wb, errorWs, '错题分析');
  
  // 生成Excel文件
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  
  // 设置响应头
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=analysis_report.xlsx');
  
  // 发送Excel文件
  res.send(excelBuffer);
}

// 用户登录API
app.post('/api/users/login', (req, res) => {
  const { studentId, name, grade, class: className } = req.body;
  
  if (!studentId) {
    res.status(400).json({ error: '学号不能为空' });
    return;
  }
  
  db.serialize(() => {
    // 先检查用户是否存在
    db.get('SELECT * FROM users WHERE student_id = ?', [studentId], (err, user) => {
      if (err) {
        console.error('查询用户失败:', err);
        res.status(500).json({ error: '登录失败' });
        return;
      }
      
      if (user) {
        // 用户存在，更新信息
        db.run('UPDATE users SET name = ?, grade = ?, class = ? WHERE student_id = ?', 
          [name, grade, className, studentId], (err) => {
            if (err) {
              console.error('更新用户失败:', err);
              res.status(500).json({ error: '登录失败' });
              return;
            }
            res.json({ userId: user.id, studentId: user.student_id });
          }
        );
      } else {
        // 用户不存在，创建新用户
        db.run('INSERT INTO users (student_id, name, grade, class) VALUES (?, ?, ?, ?)', 
          [studentId, name, grade, className], function(err) {
            if (err) {
              console.error('创建用户失败:', err);
              res.status(500).json({ error: '登录失败' });
              return;
            }
            res.json({ userId: this.lastID, studentId });
          }
        );
      }
    });
  });
});

// 保存答题记录API
app.post('/api/answer-records', (req, res) => {
  const { userId, subjectId, subcategoryId, totalQuestions, correctCount, timeSpent } = req.body;
  
  if (!userId || !subjectId || !totalQuestions || correctCount === undefined) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }
  
  db.run('INSERT INTO answer_records (user_id, subject_id, subcategory_id, total_questions, correct_count, time_spent) VALUES (?, ?, ?, ?, ?, ?)', 
    [userId, subjectId, subcategoryId, totalQuestions, correctCount, timeSpent], function(err) {
      if (err) {
        console.error('保存答题记录失败:', err);
        res.status(500).json({ error: '保存答题记录失败' });
        return;
      }
      res.json({ success: true, recordId: this.lastID });
    }
  );
});

// 保存题目尝试记录API
app.post('/api/question-attempts', (req, res) => {
  const { userId, questionId, subjectId, subcategoryId, userAnswer, answerRecordId } = req.body;
  
  if (!userId || !questionId || !subjectId || !userAnswer) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }
  
  // 先获取正确答案
  db.get('SELECT correct_answer FROM questions WHERE id = ?', [questionId], (err, question) => {
    if (err) {
      console.error('获取题目失败:', err);
      res.status(500).json({ error: '保存题目尝试记录失败' });
      return;
    }
    
    if (!question) {
      res.status(404).json({ error: '题目不存在' });
      return;
    }
    
    // 处理正确答案，可能是JSON字符串
    let correctAnswer = question.correct_answer;
    try {
      const parsedAnswer = JSON.parse(question.correct_answer);
      if (typeof parsedAnswer === 'string') {
        correctAnswer = parsedAnswer;
      }
    } catch (error) {
      // 如果解析失败，使用原始值
    }
    
    const isCorrect = userAnswer === correctAnswer ? 1 : 0;
    
    db.run('INSERT INTO question_attempts (user_id, question_id, subject_id, subcategory_id, user_answer, is_correct, answer_record_id) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [userId, questionId, subjectId, subcategoryId, userAnswer, isCorrect, answerRecordId], function(err) {
        if (err) {
          console.error('保存题目尝试记录失败:', err);
          res.status(500).json({ error: '保存题目尝试记录失败' });
          return;
        }
        res.json({ success: true, attemptId: this.lastID });
      }
    );
  });
});

// 学科管理API
app.post('/api/subjects', (req, res) => {
  const { name, iconIndex } = req.body;
  
  if (!name) {
    res.status(400).json({ error: '学科名称不能为空' });
    return;
  }
  
  // 打印接收到的名称，检查编码
  console.log('接收到的学科名称:', name);
  
  db.run('INSERT INTO subjects (name, icon_index) VALUES (?, ?)', 
    [name, iconIndex || 0], function(err) {
      if (err) {
        console.error('添加学科失败:', err);
        res.status(500).json({ error: '添加学科失败' });
        return;
      }
      // 返回完整的学科对象
      db.get('SELECT * FROM subjects WHERE id = ?', [this.lastID], (err, subject) => {
        if (err) {
          console.error('获取新学科失败:', err);
          res.json({ success: true, id: this.lastID, name, iconIndex: iconIndex || 0, subcategories: [] });
          return;
        }
        // 打印从数据库获取的名称
        console.log('从数据库获取的学科名称:', subject.name);
        
        // 转换字段名以匹配前端
        const subjectWithCamelCase = {
          id: subject.id,
          name: subject.name,
          iconIndex: subject.icon_index,
          subcategories: []
        };
        res.json(subjectWithCamelCase);
      });
    }
  );
});

app.put('/api/subjects/:id', (req, res) => {
  const { id } = req.params;
  const { name, iconIndex } = req.body;
  
  if (!name) {
    res.status(400).json({ error: '学科名称不能为空' });
    return;
  }
  
  db.run('UPDATE subjects SET name = ?, icon_index = ? WHERE id = ?', 
    [name, iconIndex || 0, id], function(err) {
      if (err) {
        console.error('更新学科失败:', err);
        res.status(500).json({ error: '更新学科失败' });
        return;
      }
      // 更新成功后，返回更新后的学科对象
      db.get('SELECT * FROM subjects WHERE id = ?', [id], (err, subject) => {
        if (err) {
          console.error('获取更新后的学科失败:', err);
          res.status(500).json({ error: '更新学科失败' });
          return;
        }
        
        // 获取学科的子分类
        db.all('SELECT * FROM subcategories WHERE subject_id = ?', [id], (err, subcategories) => {
          if (err) {
            console.error('获取子分类失败:', err);
          }
          
          // 转换字段名，确保与前端一致
          const updatedSubject = {
            id: subject.id,
            name: subject.name,
            iconIndex: subject.icon_index,
            subcategories: (subcategories || []).map(subcat => ({
              id: subcat.id,
              subjectId: subcat.subject_id,
              name: subcat.name,
              iconIndex: subcat.icon_index
            }))
          };
          res.json(updatedSubject);
        });
      });
    }
  );
});

app.delete('/api/subjects/:id', (req, res) => {
  const { id } = req.params;
  
  db.serialize(() => {
    // 先删除相关的子分类和题目
    db.run('DELETE FROM questions WHERE subject_id = ?', [id], (err) => {
      if (err) {
        console.error('删除学科相关题目失败:', err);
        res.status(500).json({ error: '删除学科失败' });
        return;
      }
      
      db.run('DELETE FROM subcategories WHERE subject_id = ?', [id], (err) => {
        if (err) {
          console.error('删除学科相关子分类失败:', err);
          res.status(500).json({ error: '删除学科失败' });
          return;
        }
        
        db.run('DELETE FROM subjects WHERE id = ?', [id], function(err) {
          if (err) {
            console.error('删除学科失败:', err);
            res.status(500).json({ error: '删除学科失败' });
            return;
          }
          res.json({ success: true });
        });
      });
    });
  });
});

// 子分类管理API
app.post('/api/subcategories', (req, res) => {
  const { subjectId, name, iconIndex } = req.body;
  
  if (!subjectId || !name) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }
  
  db.run('INSERT INTO subcategories (subject_id, name, icon_index) VALUES (?, ?, ?)', 
    [subjectId, name, iconIndex || 0], function(err) {
      if (err) {
        console.error('添加子分类失败:', err);
        res.status(500).json({ error: '添加子分类失败' });
        return;
      }
      // 返回完整的子分类对象
      db.get('SELECT * FROM subcategories WHERE id = ?', [this.lastID], (err, subcategory) => {
        if (err) {
          console.error('获取新子分类失败:', err);
          res.json({ success: true, id: this.lastID, name, iconIndex: iconIndex || 0 });
          return;
        }
        // 转换字段名以匹配前端
        const subcategoryWithCamelCase = {
          id: subcategory.id,
          subjectId: subcategory.subject_id,
          name: subcategory.name,
          iconIndex: subcategory.icon_index
        };
        res.json(subcategoryWithCamelCase);
      });
    }
  );
});

app.put('/api/subcategories/:id', (req, res) => {
  const { id } = req.params;
  const { name, iconIndex } = req.body;
  
  if (!name) {
    res.status(400).json({ error: '子分类名称不能为空' });
    return;
  }
  
  db.run('UPDATE subcategories SET name = ?, icon_index = ? WHERE id = ?', 
    [name, iconIndex || 0, id], function(err) {
      if (err) {
        console.error('更新子分类失败:', err);
        res.status(500).json({ error: '更新子分类失败' });
        return;
      }
      // 更新成功后，返回更新后的子分类对象
      db.get('SELECT * FROM subcategories WHERE id = ?', [id], (err, subcategory) => {
        if (err) {
          console.error('获取更新后的子分类失败:', err);
          res.status(500).json({ error: '更新子分类失败' });
          return;
        }
        // 转换字段名，确保与前端一致
        const updatedSubcategory = {
          id: subcategory.id,
          subjectId: subcategory.subject_id,
          name: subcategory.name,
          iconIndex: subcategory.icon_index
        };
        res.json(updatedSubcategory);
      });
    }
  );
});

app.delete('/api/subcategories/:id', (req, res) => {
  const { id } = req.params;
  
  db.serialize(() => {
    // 先删除相关的题目
    db.run('DELETE FROM questions WHERE subcategory_id = ?', [id], (err) => {
      if (err) {
        console.error('删除子分类相关题目失败:', err);
        res.status(500).json({ error: '删除子分类失败' });
        return;
      }
      
      db.run('DELETE FROM subcategories WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('删除子分类失败:', err);
          res.status(500).json({ error: '删除子分类失败' });
          return;
        }
        res.json({ success: true });
      });
    });
  });
});

// 题目管理API
app.post('/api/questions', (req, res) => {
  const { subjectId, subcategoryId, content, type, options, correctAnswer, explanation, audio, image } = req.body;
  
  if (!subjectId || !subcategoryId || !content || !type || !options || !correctAnswer) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }
  
  db.run('INSERT INTO questions (subject_id, subcategory_id, content, type, options, correct_answer, explanation, audio_url, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
    [subjectId, subcategoryId, content, type, JSON.stringify(options), correctAnswer, explanation, audio, image], function(err) {
      if (err) {
        console.error('添加题目失败:', err);
        res.status(500).json({ error: '添加题目失败' });
        return;
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.put('/api/questions/:id', (req, res) => {
  const { id } = req.params;
  const { subjectId, subcategoryId, content, type, options, correctAnswer, explanation, audio, image } = req.body;
  
  if (!subjectId || !subcategoryId || !content || !type || !options || !correctAnswer) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }
  
  db.run('UPDATE questions SET subject_id = ?, subcategory_id = ?, content = ?, type = ?, options = ?, correct_answer = ?, explanation = ?, audio_url = ?, image_url = ? WHERE id = ?', 
    [subjectId, subcategoryId, content, type, JSON.stringify(options), correctAnswer, explanation, audio, image, id], function(err) {
      if (err) {
        console.error('更新题目失败:', err);
        res.status(500).json({ error: '更新题目失败' });
        return;
      }
      res.json({ success: true });
    }
  );
});

app.delete('/api/questions/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM questions WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('删除题目失败:', err);
      res.status(500).json({ error: '删除题目失败' });
      return;
    }
    res.json({ success: true });
  });
});

// 文件上传API
const multer = require('multer');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const audioDir = path.join(__dirname, 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const imageDir = path.join(__dirname, 'images');
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

// 配置multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, audioDir);
    } else if (file.mimetype.startsWith('image/')) {
      cb(null, imageDir);
    } else {
      cb(null, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件类型白名单
const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg'];

// 文件大小限制 (10MB)
const maxFileSize = 10 * 1024 * 1024;

// 文件过滤器
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的图片类型，请上传 JPEG、PNG、GIF 或 WebP 格式的图片'), false);
    }
  } else if (file.mimetype.startsWith('audio/')) {
    if (allowedAudioTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的音频类型，请上传 MP3、WAV 或 OGG 格式的音频'), false);
    }
  } else {
    cb(new Error('只支持图片和音频文件'), false);
  }
};

const upload = multer({ 
  storage,
  limits: {
    fileSize: maxFileSize
  },
  fileFilter
});

// 上传音频文件
app.post('/api/upload-audio', (req, res) => {
  upload.single('audio')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: '文件大小超过限制，最大支持10MB' });
      }
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }
    
    res.json({ success: true, filePath: 'audio/' + req.file.filename });
  });
});

// 上传图片文件
app.post('/api/upload-image', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: '文件大小超过限制，最大支持10MB' });
      }
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }
    
    res.json({ success: true, filePath: 'images/' + req.file.filename });
  });
});

// 上传DataURL图片
app.post('/api/upload-data-url', (req, res) => {
  const { dataUrl } = req.body;
  
  if (!dataUrl) {
    res.status(400).json({ error: '没有提供DataURL' });
    return;
  }
  
  try {
    // 解析DataURL
    const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      res.status(400).json({ error: '无效的DataURL' });
      return;
    }
    
    const extension = matches[1];
    const base64Data = matches[2];
    
    // 验证文件类型
    const allowedExtensions = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
    if (!allowedExtensions.includes(extension.toLowerCase())) {
      res.status(400).json({ error: '不支持的图片类型，请上传 JPEG、PNG、GIF 或 WebP 格式的图片' });
      return;
    }
    
    // 验证文件大小
    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > maxFileSize) {
      res.status(413).json({ error: '文件大小超过限制，最大支持10MB' });
      return;
    }
    
    // 生成文件名
    const filename = 'dataurl-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + '.' + extension;
    const filepath = path.join(imageDir, filename);
    
    // 保存文件
    fs.writeFileSync(filepath, buffer);
    
    res.json({ success: true, filePath: 'images/' + filename });
  } catch (error) {
    console.error('上传DataURL失败:', error);
    res.status(500).json({ error: '上传DataURL失败' });
  }
});

// 前端页面
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});