const mysql = require('mysql2/promise');

async function checkDatabaseData() {
  try {
    console.log('检查数据库数据...');
    
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
    
    // 检查各表的数据量
    const tables = [
      'subjects',
      'subcategories',
      'grades',
      'classes',
      'users',
      'questions',
      'answer_records',
      'question_attempts',
      'settings'
    ];
    
    for (const table of tables) {
      const [rows] = await mysqlPool.execute(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`${table}: ${rows[0].count} 条数据`);
    }
    
    // 检查学科表的具体数据
    console.log('\n学科表数据:');
    const [subjects] = await mysqlPool.execute('SELECT * FROM subjects');
    subjects.forEach(subject => {
      console.log(`ID: ${subject.id}, 名称: ${subject.name}, 图标索引: ${subject.icon_index}`);
    });
    
    // 检查子分类表的具体数据
    console.log('\n子分类表数据:');
    const [subcategories] = await mysqlPool.execute('SELECT * FROM subcategories');
    subcategories.forEach(subcategory => {
      console.log(`ID: ${subcategory.id}, 学科ID: ${subcategory.subject_id}, 名称: ${subcategory.name}, 图标索引: ${subcategory.icon_index}`);
    });
    
    // 关闭数据库连接
    await mysqlPool.end();
    console.log('\n数据库检查完成');
  } catch (error) {
    console.error('数据库检查失败:', error);
  }
}

// 执行数据库检查
checkDatabaseData();