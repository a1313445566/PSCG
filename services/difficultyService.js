const db = require('./database');

class DifficultyService {
  // 根据题目错误率调整难度
  async adjustQuestionDifficulty(questionId) {
    try {
      // 获取题目尝试记录
      const attempts = await db.all(`
        SELECT COUNT(*) as total_attempts, 
               SUM(is_correct) as correct_count 
        FROM question_attempts 
        WHERE question_id = ?
      `, [questionId]);
      
      if (!attempts || attempts.length === 0 || !attempts[0].total_attempts) {
        return { success: false, message: '题目尝试次数不足' };
      }
      
      const { total_attempts, correct_count } = attempts[0];
      
      // 计算错误率
      const errorRate = (total_attempts - correct_count) / total_attempts;
      
      // 获取当前难度
      const question = await db.get('SELECT difficulty FROM questions WHERE id = ?', [questionId]);
      if (!question) {
        return { success: false, message: '题目不存在' };
      }
      
      let newDifficulty = question.difficulty;
      
      // 根据错误率调整难度
      if (total_attempts >= 5) { // 至少5次尝试才调整难度
        if (errorRate > 0.7) {
          // 错误率高，提升难度
          newDifficulty = Math.min(5, newDifficulty + 1);
        } else if (errorRate < 0.3) {
          // 错误率低，降低难度
          newDifficulty = Math.max(1, newDifficulty - 1);
        }
        
        // 如果难度有变化，更新数据库
        if (newDifficulty !== question.difficulty) {
          await db.run(
            'UPDATE questions SET difficulty = ? WHERE id = ?',
            [newDifficulty, questionId]
          );
          return { 
            success: true, 
            message: '难度调整成功', 
            oldDifficulty: question.difficulty, 
            newDifficulty, 
            errorRate 
          };
        }
      }
      
      return { 
        success: true, 
        message: '难度无需调整', 
        currentDifficulty: question.difficulty, 
        errorRate 
      };
    } catch (error) {
      console.error('调整题目难度失败:', error);
      return { success: false, message: '调整难度失败' };
    }
  }
  
  // 批量调整题目难度
  async batchAdjustQuestionDifficulty() {
    try {
      // 获取所有有尝试记录的题目
      const questions = await db.all(`
        SELECT DISTINCT question_id 
        FROM question_attempts 
        GROUP BY question_id 
        HAVING COUNT(*) >= 5
      `);
      
      const results = [];
      
      for (const question of questions) {
        const result = await this.adjustQuestionDifficulty(question.question_id);
        results.push({ questionId: question.question_id, ...result });
      }
      
      return { success: true, results };
    } catch (error) {
      console.error('批量调整题目难度失败:', error);
      return { success: false, message: '批量调整难度失败' };
    }
  }
  
  // 手动设置题目难度
  async setQuestionDifficulty(questionId, difficulty) {
    try {
      // 验证难度值
      if (difficulty < 1 || difficulty > 5) {
        return { success: false, message: '难度值必须在1-5之间' };
      }
      
      // 更新难度
      const result = await db.run(
        'UPDATE questions SET difficulty = ? WHERE id = ?',
        [difficulty, questionId]
      );
      
      if (result.affectedRows === 0) {
        return { success: false, message: '题目不存在' };
      }
      
      return { success: true, message: '难度设置成功', difficulty };
    } catch (error) {
      console.error('设置题目难度失败:', error);
      return { success: false, message: '设置难度失败' };
    }
  }
  
  // 手动设置题库难度
  async setSubcategoryDifficulty(subcategoryId, difficulty) {
    try {
      // 验证难度值
      if (difficulty < 1 || difficulty > 5) {
        return { success: false, message: '难度值必须在1-5之间' };
      }
      
      // 更新难度
      const result = await db.run(
        'UPDATE subcategories SET difficulty = ? WHERE id = ?',
        [difficulty, subcategoryId]
      );
      
      if (result.affectedRows === 0) {
        return { success: false, message: '题库不存在' };
      }
      
      return { success: true, message: '难度设置成功', difficulty };
    } catch (error) {
      console.error('设置题库难度失败:', error);
      return { success: false, message: '设置难度失败' };
    }
  }
  
  // 获取题目难度分布
  async getQuestionDifficultyDistribution() {
    try {
      const result = await db.all(`
        SELECT difficulty, COUNT(*) as count 
        FROM questions 
        GROUP BY difficulty 
        ORDER BY difficulty
      `);
      
      return { success: true, distribution: result };
    } catch (error) {
      console.error('获取难度分布失败:', error);
      return { success: false, message: '获取难度分布失败' };
    }
  }
}

// 导出单例实例
const difficultyService = new DifficultyService();
module.exports = difficultyService;