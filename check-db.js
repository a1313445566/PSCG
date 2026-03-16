const db = require('./services/database');

async function checkDatabase() {
  try {
    console.log('连接数据库...');
    await db.connect();
    console.log('数据库连接成功');
    
    console.log('\n=== 检查学科 ===');
    const subjects = await db.all('SELECT * FROM subjects');
    console.log('学科数量:', subjects.length);
    subjects.forEach(subject => {
      console.log(`ID: ${subject.id}, 名称: ${subject.name}, 图标索引: ${subject.icon_index}`);
    });
    
    console.log('\n=== 检查题库 ===');
    const subcategories = await db.all('SELECT * FROM subcategories');
    console.log('题库数量:', subcategories.length);
    subcategories.forEach(subcategory => {
      console.log(`ID: ${subcategory.id}, 学科ID: ${subcategory.subject_id}, 名称: ${subcategory.name}, 图标索引: ${subcategory.icon_index}`);
    });
    
    console.log('\n=== 检查题目 ===');
    const questions = await db.all('SELECT * FROM questions');
    console.log('题目数量:', questions.length);
    questions.forEach(question => {
      console.log(`ID: ${question.id}, 学科ID: ${question.subject_id}, 题库ID: ${question.subcategory_id}, 类型: ${question.type}`);
    });
    
    console.log('\n=== 检查用户 ===');
    const users = await db.all('SELECT * FROM users');
    console.log('用户数量:', users.length);
    users.forEach(user => {
      console.log(`ID: ${user.id}, 学号: ${user.student_id}, 姓名: ${user.name}, 年级: ${user.grade}, 班级: ${user.class}`);
    });
    
    console.log('\n=== 检查答题记录 ===');
    const answerRecords = await db.all('SELECT * FROM answer_records');
    console.log('答题记录数量:', answerRecords.length);
    answerRecords.forEach(record => {
      console.log(`ID: ${record.id}, 用户ID: ${record.user_id}, 学科ID: ${record.subject_id}, 正确数: ${record.correct_count}`);
    });
    
    console.log('\n=== 检查题目尝试记录 ===');
    const questionAttempts = await db.all('SELECT * FROM question_attempts');
    console.log('题目尝试记录数量:', questionAttempts.length);
    questionAttempts.forEach(attempt => {
      console.log(`ID: ${attempt.id}, 用户ID: ${attempt.user_id}, 题目ID: ${attempt.question_id}, 是否正确: ${attempt.is_correct}`);
    });
    
    console.log('\n数据库检查完成！');
  } catch (error) {
    console.error('检查数据库失败:', error);
  } finally {
    await db.close();
  }
}

checkDatabase();