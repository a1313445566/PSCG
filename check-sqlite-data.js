const sqlite3 = require('sqlite3').verbose();

function checkSqliteData() {
  const sqliteDb = new sqlite3.Database('./quiz.db');
  
  console.log('检查SQLite数据库数据...');
  
  // 检查subjects表
  sqliteDb.all('SELECT * FROM subjects', (err, subjects) => {
    if (err) {
      console.error('读取subjects表失败:', err);
      return;
    }
    
    console.log('\nsubjects表数据:');
    subjects.forEach(subject => {
      console.log(`ID: ${subject.id}, 名称: ${subject.name}`);
    });
    
    // 检查subcategories表
    sqliteDb.all('SELECT * FROM subcategories', (err, subcategories) => {
      if (err) {
        console.error('读取subcategories表失败:', err);
        return;
      }
      
      console.log('\nsubcategories表数据:');
      subcategories.forEach(subcategory => {
        console.log(`ID: ${subcategory.id}, 学科ID: ${subcategory.subject_id}, 名称: ${subcategory.name}`);
        
        // 检查subject_id是否存在于subjects表
        const subjectExists = subjects.some(subject => subject.id === subcategory.subject_id);
        if (!subjectExists) {
          console.log(`  警告: subject_id ${subcategory.subject_id} 不存在于subjects表`);
        }
      });
      
      // 检查questions表的content字段长度
      sqliteDb.all('SELECT id, LENGTH(content) as content_length FROM questions ORDER BY content_length DESC LIMIT 5', (err, questions) => {
        if (err) {
          console.error('读取questions表失败:', err);
          return;
        }
        
        console.log('\nquestions表content字段长度前5名:');
        questions.forEach(question => {
          console.log(`ID: ${question.id}, 长度: ${question.content_length}`);
        });
        
        sqliteDb.close();
        console.log('\nSQLite数据库检查完成');
      });
    });
  });
}

// 执行检查
checkSqliteData();