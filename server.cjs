const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/audio', express.static(path.join(__dirname, 'audio')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// 数据库连接
const db = new sqlite3.Database('./quiz.db', (err) => {
  if (err) {
    console.error('数据库连接失败:', err);
  } else {
    console.log('数据库连接成功');
    createTables();
  }
});

// 创建表结构
const createTables = () => {
  // 创建学科表
  db.run(`CREATE TABLE IF NOT EXISTS subjects (id INTEGER PRIMARY KEY, name TEXT NOT NULL, icon_index INTEGER DEFAULT 0)`);
  
  // 创建子分类表
  db.run(`CREATE TABLE IF NOT EXISTS subcategories (id INTEGER PRIMARY KEY, subject_id INTEGER NOT NULL, name TEXT NOT NULL, icon_index INTEGER DEFAULT 0, FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE)`);
  
  // 创建题目表
  db.run(`CREATE TABLE IF NOT EXISTS questions (id INTEGER PRIMARY KEY, subject_id INTEGER NOT NULL, subcategory_id INTEGER NOT NULL, content TEXT NOT NULL, type TEXT NOT NULL, options TEXT NOT NULL, correct_answer TEXT NOT NULL, explanation TEXT, audio_url TEXT, image_url TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE, FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE)`);
  
  // 创建用户表
  db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id TEXT UNIQUE NOT NULL, name TEXT, grade INTEGER, class INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  
  // 创建答题记录表
  db.run(`CREATE TABLE IF NOT EXISTS answer_records (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, subject_id INTEGER NOT NULL, subcategory_id INTEGER, total_questions INTEGER NOT NULL, correct_count INTEGER NOT NULL, time_spent INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE, FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE)`);
  
  // 创建题目答题记录表
  db.run(`CREATE TABLE IF NOT EXISTS question_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, question_id INTEGER NOT NULL, subject_id INTEGER NOT NULL, subcategory_id INTEGER, user_answer TEXT NOT NULL, is_correct INTEGER NOT NULL, answer_record_id INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE, FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE, FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE, FOREIGN KEY (answer_record_id) REFERENCES answer_records(id) ON DELETE CASCADE)`);
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
                
                res.json({ success: true, message: '所有数据清空成功' });
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

// 学科相关API
app.get('/api/subjects', (req, res) => {
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
          res.json(subjects);
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
  db.all('SELECT * FROM subcategories WHERE subject_id = ?', [subjectId], (err, subcategories) => {
    if (err) {
      console.error('获取子分类失败:', err);
      res.status(500).json({ error: '获取子分类失败' });
      return;
    }
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
  // 返回默认的1-6年级
  res.json([1, 2, 3, 4, 5, 6]);
});

app.post('/api/grades/init', (req, res) => {
  // 初始化年级数据，这里只是返回成功，因为年级数据是动态生成的
  res.json({ success: true, message: '年级数据初始化成功' });
});

app.post('/api/grades/clear', (req, res) => {
  // 清空年级数据，这里只是返回成功
  res.json({ success: true, message: '年级数据清空成功' });
});

// 班级相关API
app.get('/api/classes', (req, res) => {
  // 返回默认的1-10班级
  res.json([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

app.post('/api/classes/init', (req, res) => {
  // 初始化班级数据，这里只是返回成功
  res.json({ success: true, message: '班级数据初始化成功' });
});

app.post('/api/classes/clear', (req, res) => {
  // 清空班级数据，这里只是返回成功
  res.json({ success: true, message: '班级数据清空成功' });
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
  const { subjectId, grade, class: className } = req.query;
  
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
    res.json(questions);
  });
});

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
  
  db.run('INSERT INTO subjects (name, icon_index) VALUES (?, ?)', 
    [name, iconIndex || 0], function(err) {
      if (err) {
        console.error('添加学科失败:', err);
        res.status(500).json({ error: '添加学科失败' });
        return;
      }
      res.json({ success: true, id: this.lastID });
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
      res.json({ success: true });
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
      res.json({ success: true, id: this.lastID });
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
      res.json({ success: true });
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