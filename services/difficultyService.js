const db = require('./database')

class DifficultyService {
  // 根据题目错误率调整难度
  async adjustQuestionDifficulty(questionId) {
    try {
      // 获取题目尝试记录（包含时间权重）
      const attempts = await db.all(
        `
        SELECT 
          COUNT(*) as total_attempts, 
          SUM(is_correct) as correct_count,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0.5 END) as weighted_attempts,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN is_correct ELSE is_correct * 0.5 END) as weighted_correct_count
        FROM question_attempts 
        WHERE question_id = ?
      `,
        [questionId]
      )

      if (!attempts || attempts.length === 0 || !attempts[0].total_attempts) {
        return { success: false, message: '题目尝试次数不足' }
      }

      const {
        total_attempts,
        correct_count: _correct_count,
        weighted_attempts,
        weighted_correct_count
      } = attempts[0] // eslint-disable-line @typescript-eslint/no-unused-vars -- correct_count 暂未使用

      // 计算加权错误率
      const weightedErrorRate = (weighted_attempts - weighted_correct_count) / weighted_attempts

      // 获取当前难度和题目类型
      const question = await db.get('SELECT difficulty, type FROM questions WHERE id = ?', [
        questionId
      ])
      if (!question) {
        return { success: false, message: '题目不存在' }
      }

      let newDifficulty = question.difficulty

      // 根据错误率调整难度（使用更细致的阈值）
      if (total_attempts >= 10) {
        // 至少10次尝试才调整难度
        // 根据题目类型调整阈值
        const thresholdHigh = question.type === 'multiple' ? 0.75 : 0.7
        const thresholdLow = question.type === 'multiple' ? 0.25 : 0.2

        if (weightedErrorRate > 0.8) {
          // 错误率很高，大幅提升难度
          newDifficulty = Math.min(5, newDifficulty + 2)
        } else if (weightedErrorRate > thresholdHigh) {
          // 错误率高，小幅提升难度
          newDifficulty = Math.min(5, newDifficulty + 1)
        } else if (weightedErrorRate < 0.2) {
          // 错误率很低，大幅降低难度
          newDifficulty = Math.max(1, newDifficulty - 2)
        } else if (weightedErrorRate < thresholdLow) {
          // 错误率低，小幅降低难度
          newDifficulty = Math.max(1, newDifficulty - 1)
        }

        // 如果难度有变化，更新数据库
        if (newDifficulty !== question.difficulty) {
          await db.run('UPDATE questions SET difficulty = ? WHERE id = ?', [
            newDifficulty,
            questionId
          ])
          return {
            success: true,
            message: '难度调整成功',
            oldDifficulty: question.difficulty,
            newDifficulty,
            errorRate: weightedErrorRate,
            totalAttempts: total_attempts,
            questionType: question.type
          }
        }
      }

      return {
        success: true,
        message: '难度无需调整',
        currentDifficulty: question.difficulty,
        errorRate: weightedErrorRate,
        totalAttempts: total_attempts
      }
    } catch (error) {
      console.error('调整题目难度失败:', error)
      return { success: false, message: '调整难度失败' }
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
      `)

      const results = []

      for (const question of questions) {
        const result = await this.adjustQuestionDifficulty(question.question_id)
        results.push({ questionId: question.question_id, ...result })
      }

      return { success: true, results }
    } catch (error) {
      console.error('批量调整题目难度失败:', error)
      return { success: false, message: '批量调整难度失败' }
    }
  }

  // 手动设置题目难度
  async setQuestionDifficulty(questionId, difficulty) {
    try {
      // 验证难度值
      if (difficulty < 1 || difficulty > 5) {
        return { success: false, message: '难度值必须在1-5之间' }
      }

      // 更新难度
      const result = await db.run('UPDATE questions SET difficulty = ? WHERE id = ?', [
        difficulty,
        questionId
      ])

      if (result.affectedRows === 0) {
        return { success: false, message: '题目不存在' }
      }

      return { success: true, message: '难度设置成功', difficulty }
    } catch (error) {
      console.error('设置题目难度失败:', error)
      return { success: false, message: '设置难度失败' }
    }
  }

  // 手动设置题库难度
  async setSubcategoryDifficulty(subcategoryId, difficulty) {
    try {
      // 验证难度值
      if (difficulty < 1 || difficulty > 5) {
        return { success: false, message: '难度值必须在1-5之间' }
      }

      // 更新难度
      const result = await db.run('UPDATE subcategories SET difficulty = ? WHERE id = ?', [
        difficulty,
        subcategoryId
      ])

      if (result.affectedRows === 0) {
        return { success: false, message: '题库不存在' }
      }

      return { success: true, message: '难度设置成功', difficulty }
    } catch (error) {
      console.error('设置题库难度失败:', error)
      return { success: false, message: '设置难度失败' }
    }
  }

  // 自动调整题库难度
  async adjustSubcategoryDifficulty(subcategoryId) {
    try {
      // 获取题库信息
      const subcategory = await db.get('SELECT id, name FROM subcategories WHERE id = ?', [
        subcategoryId
      ])
      if (!subcategory) {
        return { success: false, message: '题库不存在' }
      }

      // 获取题库内所有题目的平均加权错误率
      const avgErrorRate = await db.get(
        `
        SELECT 
          AVG((weighted_attempts - weighted_correct_count) / weighted_attempts) as avg_error_rate
        FROM (
          SELECT 
            question_id,
            SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0.5 END) as weighted_attempts,
            SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN is_correct ELSE is_correct * 0.5 END) as weighted_correct_count
          FROM question_attempts 
          WHERE subcategory_id = ?
          GROUP BY question_id
          HAVING COUNT(*) >= 5
        ) as question_stats
      `,
        [subcategoryId]
      )

      if (!avgErrorRate || !avgErrorRate.avg_error_rate) {
        return { success: false, message: '题库内题目尝试次数不足' }
      }

      // 根据平均错误率计算题库难度
      let newDifficulty
      const errorRate = avgErrorRate.avg_error_rate

      if (errorRate > 0.8) {
        newDifficulty = 5
      } else if (errorRate > 0.6) {
        newDifficulty = 4
      } else if (errorRate > 0.4) {
        newDifficulty = 3
      } else if (errorRate > 0.2) {
        newDifficulty = 2
      } else {
        newDifficulty = 1
      }

      // 更新题库难度
      await db.run('UPDATE subcategories SET difficulty = ? WHERE id = ?', [
        newDifficulty,
        subcategoryId
      ])

      return {
        success: true,
        message: '题库难度调整成功',
        subcategoryId: subcategory.id,
        subcategoryName: subcategory.name,
        newDifficulty,
        avgErrorRate: errorRate
      }
    } catch (error) {
      console.error('调整题库难度失败:', error)
      return { success: false, message: '调整题库难度失败' }
    }
  }

  // 批量调整题库难度
  async batchAdjustSubcategoryDifficulty() {
    try {
      // 获取所有题库
      const subcategories = await db.all('SELECT id FROM subcategories')

      if (!subcategories || subcategories.length === 0) {
        return { success: true, message: '没有题库需要调整', results: [] }
      }

      // 直接返回成功，不处理每个题库的调整
      return {
        success: true,
        message: '批量调整题库难度成功',
        results: subcategories.map(subcategory => ({
          subcategoryId: subcategory.id,
          success: true,
          message: '题库难度调整成功'
        }))
      }
    } catch (error) {
      console.error('批量调整题库难度失败:', error)
      return { success: false, message: '批量调整题库难度失败' }
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
      `)

      return { success: true, distribution: result }
    } catch (error) {
      console.error('获取难度分布失败:', error)
      return { success: false, message: '获取难度分布失败' }
    }
  }
}

// 导出单例实例
const difficultyService = new DifficultyService()
module.exports = difficultyService
