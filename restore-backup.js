const fs = require('fs');
const mysql = require('mysql2/promise');
const dbConfig = require('./config/database');

async function restoreBackup() {
  try {
    // 读取备份文件
    const backupData = JSON.parse(fs.readFileSync('./backups/backup_2026-03-21.json', 'utf8'));
    
    // 连接数据库
    const connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功');
    
    // 开始事务
    await connection.beginTransaction();
    
    try {
      // 恢复subjects表
      if (backupData.subjects && backupData.subjects.length > 0) {
        console.log('开始恢复subjects表...');
        for (const subject of backupData.subjects) {
          await connection.execute(
            'INSERT IGNORE INTO subjects (id, name, icon_index) VALUES (?, ?, ?)',
            [subject.id, subject.name, subject.icon_index]
          );
        }
        console.log(`成功恢复 ${backupData.subjects.length} 条subjects数据`);
      }
      
      // 恢复questions表
      if (backupData.questions && backupData.questions.length > 0) {
        console.log('开始恢复questions表...');
        let count = 0;
        for (const question of backupData.questions) {
          await connection.execute(
            `INSERT IGNORE INTO questions (id, subject_id, subcategory_id, content, type, options, correct_answer, explanation, audio_url, image_url, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              question.id, 
              question.subject_id, 
              question.subcategory_id, 
              question.content, 
              question.type, 
              question.options, 
              question.correct_answer, 
              question.explanation, 
              question.audio_url || '', 
              question.image_url || '', 
              question.created_at
            ]
          );
          count++;
          if (count % 100 === 0) {
            console.log(`已恢复 ${count} 条questions数据`);
          }
        }
        console.log(`成功恢复 ${backupData.questions.length} 条questions数据`);
      }
      
      // 提交事务
      await connection.commit();
      console.log('数据恢复成功！');
      
    } catch (