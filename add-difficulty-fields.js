const db = require('./services/database');

async function checkAndAddColumn(table, column, definition) {
  try {
    // 检查列是否存在
    const result = await db.get(`SHOW COLUMNS FROM ${table} LIKE '${column}'`);
    if (!result) {
      // 列不存在，添加列
      await db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      console.log(`成功为 ${table} 表添加 ${column} 字段`);
    } else {
      console.log(`${table} 表已经存在 ${column} 字段`);
    }
  } catch (error) {
    console.error(`为 ${table} 表添加 ${column} 字段失败:`, error);
    throw error;
  }
}

async function addDifficultyFields() {
  try {
    console.log('开始添加难度字段...');
    
    // 为 subcategories 表添加 difficulty 字段
    await checkAndAddColumn('subcategories', 'difficulty', 'INT DEFAULT 1');
    
    // 为 questions 表添加 difficulty 字段
    await checkAndAddColumn('questions', 'difficulty', 'INT DEFAULT 1');
    
    console.log('难度字段添加完成！');
  } catch (error) {
    console.error('添加难度字段失败:', error);
  } finally {
    await db.close();
  }
}

addDifficultyFields();