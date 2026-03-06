// 后端服务器
const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const app = express()
const port = 3000

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'dist')))
app.use('/audio', express.static(path.join(__dirname, 'audio')))

// 数据库连接
const db = new sqlite3.Database('./quiz.db', (err) => {
  if (err) {
    console.error('数据库连接失败:', err)
  } else {
    console.log('数据库连接成功')
    createTables()
  }
})

// 创建表结构
const createTables = () => {
  // 创建学科表
  db.run(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('创建学科表失败:', err)
    }
  })
  
  // 创建子分类表
  db.run(`
    CREATE TABLE IF NOT EXISTS subcategories (
      id INTEGER PRIMARY KEY,
      subject_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('创建子分类表失败:', err)
    }
  })
  
  // 创建题目表
  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY,
      subject_id INTEGER NOT NULL,
      subcategory_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      explanation TEXT,
      audio_url TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('创建题目表失败:', err)
    }
  })
}

// API路由

// 获取所有学科
app.get('/api/subjects', (req, res) => {
  const subjects = []
  let subjectsProcessed = 0
  
  // 获取所有学科
  db.all('SELECT * FROM subjects', (err, subjectList) => {
    if (err) {
      res.status(500).json({ error: '获取学科失败' })
      return
    }
    
    if (subjectList.length === 0) {
      res.json(subjects)
      return
    }
    
    for (const subject of subjectList) {
      subject.subcategories = []
      subjects.push(subject)
      
      // 获取每个学科的子分类
      db.all('SELECT * FROM subcategories WHERE subject_id = ?', [subject.id], (err, subcategories) => {
        if (err) {
          console.error('获取子分类失败:', err)
          subject.subcategories = []
        } else {
          subject.subcategories = subcategories
        }
        
        subjectsProcessed++
        if (subjectsProcessed === subjectList.length) {
          res.json(subjects)
        }
      })
    }
  })
})

// 获取所有题目
app.get('/api/questions', (req, res) => {
  db.all('SELECT * FROM questions', (err, questions) => {
    if (err) {
      res.status(500).json({ error: '获取题目失败' })
      return
    }
    
    // 解析JSON字段并转换字段名称
    const formattedQuestions = questions.map(question => {
      try {
        return {
          id: question.id,
          subjectId: question.subject_id,
          subcategoryId: question.subcategory_id,
          content: question.content,
          type: question.type,
          options: JSON.parse(question.options),
          answer: JSON.parse(question.correct_answer),
          correctAnswer: JSON.parse(question.correct_answer),
          explanation: question.explanation,
          audio: question.audio_url,
          image: question.image_url,
          createdAt: question.created_at
        }
      } catch (error) {
        console.error('解析题目数据失败:', error)
        return {
          id: question.id,
          subjectId: question.subject_id,
          subcategoryId: question.subcategory_id,
          content: question.content,
          type: question.type,
          options: [],
          answer: [],
          correctAnswer: [],
          explanation: question.explanation,
          audio: question.audio_url,
          image: question.image_url,
          createdAt: question.created_at
        }
      }
    })
    
    res.json(formattedQuestions)
  })
})

// 添加学科
app.post('/api/subjects', (req, res) => {
  const { name } = req.body
  
  db.run('INSERT INTO subjects (name) VALUES (?)', [name], function(err) {
    if (err) {
      res.status(500).json({ error: '添加学科失败' })
      return
    }
    
    res.json({
      id: this.lastID,
      name,
      subcategories: []
    })
  })
})

// 删除学科
app.delete('/api/subjects/:id', (req, res) => {
  const { id } = req.params
  
  db.run('DELETE FROM subjects WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: '删除学科失败' })
      return
    }
    
    res.json({ success: true })
  })
})

// 添加子分类
app.post('/api/subcategories', (req, res) => {
  const { subject_id, name } = req.body
  
  db.run('INSERT INTO subcategories (subject_id, name) VALUES (?, ?)', [subject_id, name], function(err) {
    if (err) {
      res.status(500).json({ error: '添加子分类失败' })
      return
    }
    
    res.json({
      id: this.lastID,
      name
    })
  })
})

// 删除子分类
app.delete('/api/subcategories/:id', (req, res) => {
  const { id } = req.params
  
  db.run('DELETE FROM subcategories WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: '删除子分类失败' })
      return
    }
    
    res.json({ success: true })
  })
})

// 添加题目
app.post('/api/questions', (req, res) => {
  const { subjectId, subcategoryId, content, type, options, correctAnswer, answer, explanation, audioUrl, audio, imageUrl, image } = req.body
  
  db.run(
    'INSERT INTO questions (subject_id, subcategory_id, content, type, options, correct_answer, explanation, audio_url, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [subjectId, subcategoryId, content, type, JSON.stringify(options), JSON.stringify(correctAnswer || answer), explanation, audioUrl || audio, imageUrl || image],
    function(err) {
      if (err) {
        res.status(500).json({ error: '添加题目失败' })
        return
      }
      
      res.json({
        id: this.lastID,
        subjectId,
        subcategoryId,
        content,
        type,
        options,
        answer: correctAnswer || answer,
        correctAnswer: correctAnswer || answer,
        explanation,
        audio: audioUrl || audio,
        image: imageUrl || image
      })
    }
  )
})

// 更新题目
app.put('/api/questions/:id', (req, res) => {
  const { id } = req.params
  const { subjectId, subcategoryId, content, type, options, correctAnswer, answer, explanation, audioUrl, audio, imageUrl, image } = req.body
  
  // 先查询题目信息，获取旧的音频和图片路径
  db.get('SELECT audio_url, image_url FROM questions WHERE id = ?', [id], (err, oldQuestion) => {
    if (err) {
      res.status(500).json({ error: '查询题目失败' })
      return
    }
    
    // 检查音频路径是否变化
    if (oldQuestion) {
      const newAudioPath = audioUrl || audio
      if (oldQuestion.audio_url && oldQuestion.audio_url !== newAudioPath) {
        const audioPath = path.join(__dirname, oldQuestion.audio_url)
        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath)
          console.log('删除旧音频文件:', audioPath)
        }
      }
      
      // 检查图片路径是否变化
      const newImagePath = imageUrl || image
      if (oldQuestion.image_url && oldQuestion.image_url !== newImagePath) {
        const imagePath = path.join(__dirname, oldQuestion.image_url)
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath)
          console.log('删除旧图片文件:', imagePath)
        }
      }
    }
    
    // 更新题目记录
    db.run(
      'UPDATE questions SET subject_id = ?, subcategory_id = ?, content = ?, type = ?, options = ?, correct_answer = ?, explanation = ?, audio_url = ?, image_url = ? WHERE id = ?',
      [subjectId, subcategoryId, content, type, JSON.stringify(options), JSON.stringify(correctAnswer || answer), explanation, audioUrl || audio, imageUrl || image, id],
      (err) => {
        if (err) {
          res.status(500).json({ error: '更新题目失败' })
          return
        }
        
        res.json({
          id: parseInt(id),
          subjectId,
          subcategoryId,
          content,
          type,
          options,
          answer: correctAnswer || answer,
          correctAnswer: correctAnswer || answer,
          explanation,
          audio: audioUrl || audio,
          image: imageUrl || image
        })
      }
    )
  })
})

// 删除题目
app.delete('/api/questions/:id', (req, res) => {
  const { id } = req.params
  
  // 先查询题目信息，获取音频和图片路径
  db.get('SELECT audio_url, image_url FROM questions WHERE id = ?', [id], (err, question) => {
    if (err) {
      res.status(500).json({ error: '查询题目失败' })
      return
    }
    
    // 删除相关文件
    if (question) {
      if (question.audio_url) {
        const audioPath = path.join(__dirname, question.audio_url)
        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath)
          console.log('删除音频文件:', audioPath)
        }
      }
      
      if (question.image_url) {
        const imagePath = path.join(__dirname, question.image_url)
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath)
          console.log('删除图片文件:', imagePath)
        }
      }
    }
    
    // 删除题目记录
    db.run('DELETE FROM questions WHERE id = ?', [id], (err) => {
      if (err) {
        res.status(500).json({ error: '删除题目失败' })
        return
      }
      
      res.json({ success: true })
    })
  })
})

// 清空所有数据
app.delete('/api/data', (req, res) => {
  // 先删除题目
  db.exec('DELETE FROM questions', (err) => {
    if (err) {
      res.status(500).json({ error: '清空题目失败' })
      return
    }
    
    // 再删除子分类
    db.exec('DELETE FROM subcategories', (err) => {
      if (err) {
        res.status(500).json({ error: '清空子分类失败' })
        return
      }
      
      // 最后删除学科
      db.exec('DELETE FROM subjects', (err) => {
        if (err) {
          res.status(500).json({ error: '清空学科失败' })
          return
        }
        
        res.json({ success: true })
      })
    })
  })
})

// 导入本地数据
app.post('/api/import-local-data', (req, res) => {
  const { data } = req.body
  
  if (!data) {
    res.status(400).json({ error: '没有提供数据' })
    return
  }
  
  // 开始事务
  db.serialize(() => {
    // 先清空现有数据
    db.run('DELETE FROM questions', (err) => {
      if (err) {
        res.status(500).json({ error: '清空题目失败' })
        return
      }
      
      db.run('DELETE FROM subcategories', (err) => {
        if (err) {
          res.status(500).json({ error: '清空子分类失败' })
          return
        }
        
        db.run('DELETE FROM subjects', (err) => {
          if (err) {
            res.status(500).json({ error: '清空学科失败' })
            return
          }
          
          // 导入学科和子分类
          let subjectsProcessed = 0
          const totalSubjects = data.subjects ? data.subjects.length : 0
          
          if (totalSubjects === 0) {
            res.json({ success: true, message: '没有数据可导入' })
            return
          }
          
          for (const subject of data.subjects) {
            // 插入学科
            db.run('INSERT INTO subjects (id, name) VALUES (?, ?)', [subject.id, subject.name], function(err) {
              if (err) {
                console.error('插入学科失败:', err)
              }
              
              // 插入子分类
              if (subject.subcategories) {
                for (const subcategory of subject.subcategories) {
                  db.run('INSERT INTO subcategories (id, subject_id, name) VALUES (?, ?, ?)', [subcategory.id, subject.id, subcategory.name], function(err) {
                    if (err) {
                      console.error('插入子分类失败:', err)
                    }
                  })
                }
              }
              
              subjectsProcessed++
              if (subjectsProcessed === totalSubjects) {
                // 导入题目
                if (data.questions) {
                  let questionsProcessed = 0
                  const totalQuestions = data.questions.length
                  
                  for (const question of data.questions) {
                    db.run(
                      'INSERT INTO questions (id, subject_id, subcategory_id, content, type, options, correct_answer, explanation, audio_url, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                      [
                        question.id,
                        question.subjectId,
                        question.subcategoryId,
                        question.content,
                        question.type,
                        JSON.stringify(question.options),
                        JSON.stringify(question.correctAnswer || question.answer),
                        question.explanation,
                        question.audioUrl || question.audio,
                        question.imageUrl || question.image
                      ],
                      function(err) {
                        if (err) {
                          console.error('插入题目失败:', err)
                        }
                        
                        questionsProcessed++
                        if (questionsProcessed === totalQuestions) {
                          res.json({ success: true, message: '数据导入成功' })
                        }
                      }
                    )
                  }
                } else {
                  res.json({ success: true, message: '数据导入成功' })
                }
              }
            })
          }
        })
      })
    })
  })
})

// 上传音频文件
const multer = require('multer')

// 音频存储配置
const audioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './audio')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})
const audioUpload = multer({ storage: audioStorage })

app.post('/api/upload-audio', audioUpload.single('audio'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: '没有选择文件' })
    return
  }
  
  res.json({ 
    filePath: 'audio/' + req.file.filename 
  })
})

// 图片存储配置
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 确保images目录存在
    if (!fs.existsSync('./images')) {
      fs.mkdirSync('./images')
    }
    cb(null, './images')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})
const imageUpload = multer({ storage: imageStorage })

app.post('/api/upload-image', imageUpload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: '没有选择文件' })
    return
  }
  
  res.json({ 
    filePath: 'images/' + req.file.filename 
  })
})

// 上传DataURL格式的图片
app.post('/api/upload-data-url', (req, res) => {
  const { dataUrl } = req.body
  if (!dataUrl) {
    res.status(400).json({ error: '没有提供DataURL' })
    return
  }
  
  try {
    // 确保images目录存在
    if (!fs.existsSync('./images')) {
      fs.mkdirSync('./images')
    }
    
    // 解析DataURL
    const matches = dataUrl.match(/^data:image\/([^;]+);base64,(.+)$/)
    if (!matches) {
      res.status(400).json({ error: '无效的DataURL格式' })
      return
    }
    
    const [, extension, base64Data] = matches
    const buffer = Buffer.from(base64Data, 'base64')
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const filename = `dataurl-${uniqueSuffix}.${extension}`
    const filePath = path.join(__dirname, 'images', filename)
    
    fs.writeFileSync(filePath, buffer)
    
    res.json({ 
      filePath: 'images/' + filename 
    })
  } catch (error) {
    console.error('上传DataURL失败:', error)
    res.status(500).json({ error: '上传DataURL失败' })
  }
})

// 静态文件服务
app.use('/images', express.static(path.join(__dirname, 'images')))

// 前端页面
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`)
})
