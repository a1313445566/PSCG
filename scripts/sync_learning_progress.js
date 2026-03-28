/**
 * 同步学习进度数据
 * 从 answer_records 和 question_attempts 计算每个用户每个知识点的掌握度
 */

const db = require('../services/database')

async function syncLearningProgress() {
  console.log('开始同步学习进度数据...')

  try {
    // 1. 获取所有用户的知识点答题统计
    const statsQuery = `
      SELECT 
        qa.user_id,
        qa.subject_id,
        qa.subcategory_id,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN qa.is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
        MAX(qa.created_at) as last_practiced
      FROM question_attempts qa
      WHERE qa.subcategory_id IS NOT NULL
      GROUP BY qa.user_id, qa.subject_id, qa.subcategory_id
    `

    const stats = await db.all(statsQuery)
    console.log(`找到 ${stats.length} 条知识点答题统计`)

    let successCount = 0
    let errorCount = 0

    for (const stat of stats) {
      try {
        // 计算掌握度：正确率 * 权重
        const accuracy =
          stat.total_attempts > 0
            ? Math.round((stat.correct_attempts / stat.total_attempts) * 100)
            : 0

        // 插入或更新学习进度
        await db.run(
          `
          INSERT INTO learning_progress 
            (user_id, subject_id, subcategory_id, mastery_level, total_attempts, correct_attempts, last_practiced)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            mastery_level = VALUES(mastery_level),
            total_attempts = VALUES(total_attempts),
            correct_attempts = VALUES(correct_attempts),
            last_practiced = VALUES(last_practiced)
        `,
          [
            stat.user_id,
            stat.subject_id,
            stat.subcategory_id,
            accuracy,
            stat.total_attempts,
            stat.correct_attempts,
            stat.last_practiced
          ]
        )
        successCount++
      } catch (err) {
        console.error(
          `同步失败: user=${stat.user_id}, subject=${stat.subject_id}, subcategory=${stat.subcategory_id}`,
          err.message
        )
        errorCount++
      }
    }

    console.log(`同步完成: 成功 ${successCount}, 失败 ${errorCount}`)
    return { success: true, total: stats.length, successCount, errorCount }
  } catch (error) {
    console.error('同步学习进度失败:', error)
    throw error
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  db.connect().then(() => {
    syncLearningProgress()
      .then(result => {
        console.log('结果:', result)
        process.exit(0)
      })
      .catch(err => {
        console.error('执行失败:', err)
        process.exit(1)
      })
  })
}

module.exports = syncLearningProgress
