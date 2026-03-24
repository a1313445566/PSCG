// 加载环境变量
require('dotenv').config();
const db = require('./services/database');

// 更新题目中的图片URL
const updateQuestionImageUrls = async () => {
  try {
    console.log('开始更新题目中的图片URL...');
    
    // 连接数据库
    await db.connect();
    
    // 获取所有题目
    const questions = await db.all('SELECT id, content, options FROM questions');
    
    console.log(`找到 ${questions.length} 个题目`);
    
    let updatedCount = 0;
    
    for (const question of questions) {
      let updated = false;
      let updatedContent = question.content;
      let updatedOptions = question.options;
      
      // 处理内容中的图片URL
      if (updatedContent) {
        const originalContent = updatedContent;
        // 替换内网IP的图片URL为相对路径，使用更简单的正则表达式
        updatedContent = updatedContent.replace(/http:\/\/\d+\.\d+\.\d+\.\d+:\d+\/images\//g, '/images/');
        if (updatedContent !== originalContent) {
          updated = true;
        }
      }
      
      // 处理选项中的图片URL
      if (updatedOptions) {
        try {
          const options = JSON.parse(updatedOptions);
          if (Array.isArray(options)) {
            const updatedOptionsArray = options.map(option => {
              if (typeof option === 'string') {
                // 替换内网IP的图片URL为相对路径，使用更简单的正则表达式
                return option.replace(/http:\/\/\d+\.\d+\.\d+\.\d+:\d+\/images\//g, '/images/');
              }
              return option;
            });
            const newOptionsJson = JSON.stringify(updatedOptionsArray);
            if (newOptionsJson !== updatedOptions) {
              updatedOptions = newOptionsJson;
              updated = true;
            }
          }
        } catch (error) {
          console.error(`解析题目 ${question.id} 的选项失败:`, error);
        }
      }
      
      // 如果有更新，保存到数据库
      if (updated) {
        await db.run(
          'UPDATE questions SET content = ?, options = ? WHERE id = ?',
          [updatedContent, updatedOptions, question.id]
        );
        updatedCount++;
        console.log(`更新了题目 ${question.id}`);
      }
    }
    
    console.log(`更新完成，共更新了 ${updatedCount} 个题目`);
  } catch (error) {
    console.error('更新图片URL失败:', error);
  } finally {
    // 关闭数据库连接
    process.exit();
  }
};

// 运行更新
updateQuestionImageUrls();
