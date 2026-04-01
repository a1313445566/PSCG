/**
 * 班级全面分析工具（重构版）
 * 文件: services/chat/tools/classFullAnalysisTool.js
 * 功能: 班级整体学情分析
 */

const { z } = require('zod')
const { defineTool } = require('./toolUtils')
const db = require('../../database')

// 缓存配置
const analysisCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存

/**
 * 生成缓存键
 */
function getCacheKey(grade, classNum) {
  return `class_analysis:${grade}:${classNum}`
}

/**
 * 从缓存获取数据
 */
function getFromCache(key) {
  const cached = analysisCache.get(key)
  if (cached && Date.now() < cached.expiry) {
    console.log(`[classFullAnalysisTool] 命中缓存: ${key}`)
    return cached.data
  }
  return null
}

/**
 * 设置缓存数据
 */
function setToCache(key, data) {
  analysisCache.set(key, {
    data,
    expiry: Date.now() + CACHE_TTL
  })
  console.log(`[classFullAnalysisTool] 已缓存: ${key}`)
}

const classFullAnalysisTool = defineTool({
  name: 'query_class_full_analysis',
  description: '班级全面分析。返回：学生统计、TOP5学生、需关注学生、学科表现、高频错题。',
  schema: z.object({
    grade: z.string().describe('年级(1-6)'),
    classNum: z.string().describe('班级号')
  }),
  handler: async args => {
    try {
      const { grade, classNum } = args

      // 检查缓存
      const cacheKey = getCacheKey(grade, classNum)
      const cachedData = getFromCache(cacheKey)
      
      if (cachedData) {
        return cachedData
      }

      // 并行查询所有数据
      const [basicStats, topStudents, weakStudents, subjectPerf, topWrong, accuracyDist] =
        await Promise.all([
          // 1. 基础统计
          db.get(
            `
          SELECT 
            COUNT(DISTINCT u.id) as students,
            COUNT(DISTINCT ar.id) as sessions,
            SUM(ar.total_questions) as questions,
            ROUND(SUM(ar.correct_count) * 100.0 / NULLIF(SUM(ar.total_questions), 0), 2) as accuracy,
            ROUND(AVG(u.points), 2) as avg_points
          FROM users u
          LEFT JOIN answer_records ar ON u.id = ar.user_id
          WHERE u.grade = ? AND u.class = ?
        `,
            [grade, classNum]
          ),

          // 2. TOP 5 学生
          db.query(
            `
          SELECT u.name, u.points, 
            COUNT(DISTINCT ar.id) as sessions,
            ROUND(SUM(ar.correct_count) * 100.0 / NULLIF(SUM(ar.total_questions), 0), 2) as accuracy
          FROM users u
          LEFT JOIN answer_records ar ON u.id = ar.user_id
          WHERE u.grade = ? AND u.class = ?
          GROUP BY u.id
          ORDER BY u.points DESC
          LIMIT 5
        `,
            [grade, classNum]
          ),

          // 3. 需关注学生（正确率<70% 或 答题<3次）
          db.query(
            `
          SELECT u.name, 
            COUNT(DISTINCT ar.id) as sessions,
            ROUND(SUM(ar.correct_count) * 100.0 / NULLIF(SUM(ar.total_questions), 0), 2) as accuracy
          FROM users u
          LEFT JOIN answer_records ar ON u.id = ar.user_id
          WHERE u.grade = ? AND u.class = ?
          GROUP BY u.id
          HAVING accuracy < 70 OR sessions < 3
          ORDER BY accuracy ASC
          LIMIT 5
        `,
            [grade, classNum]
          ),

          // 4. 学科表现
          db.query(
            `
          SELECT s.name as subject,
            COUNT(DISTINCT ar.user_id) as students,
            ROUND(SUM(ar.correct_count) * 100.0 / NULLIF(SUM(ar.total_questions), 0), 2) as accuracy
          FROM subjects s
          LEFT JOIN answer_records ar ON s.id = ar.subject_id
          LEFT JOIN users u ON ar.user_id = u.id
          WHERE u.grade = ? AND u.class = ?
          GROUP BY s.id
          ORDER BY accuracy DESC
        `,
            [grade, classNum]
          ),

          // 5. 高频错题 TOP 5
          db.query(
            `
          SELECT 
            LEFT(q.content, 50) as question,
            s.name as subject,
            COUNT(*) as wrong_count
          FROM question_attempts qa
          JOIN questions q ON qa.question_id = q.id
          JOIN users u ON qa.user_id = u.id
          JOIN subjects s ON q.subject_id = s.id
          WHERE qa.is_correct = 0 AND u.grade = ? AND u.class = ?
          GROUP BY q.id
          ORDER BY wrong_count DESC
          LIMIT 5
        `,
            [grade, classNum]
          ),

          // 6. 正确率分布
          db.query(
            `
          SELECT 
            CASE 
              WHEN accuracy >= 90 THEN '优秀'
              WHEN accuracy >= 80 THEN '良好'
              WHEN accuracy >= 70 THEN '中等'
              WHEN accuracy >= 60 THEN '及格'
              ELSE '不及格'
            END as level,
            COUNT(*) as count
          FROM (
            SELECT u.id,
              ROUND(SUM(ar.correct_count) * 100.0 / NULLIF(SUM(ar.total_questions), 0), 2) as accuracy
            FROM users u
            LEFT JOIN answer_records ar ON u.id = ar.user_id
            WHERE u.grade = ? AND u.class = ?
            GROUP BY u.id
          ) as t
          GROUP BY level
          ORDER BY 
            CASE level
              WHEN '优秀' THEN 1
              WHEN '良好' THEN 2
              WHEN '中等' THEN 3
              WHEN '及格' THEN 4
              ELSE 5
            END
        `,
            [grade, classNum]
          )
        ])

      // 压缩返回数据
      const result = JSON.stringify({
        success: true,
        data: {
          basic: {
            students: basicStats?.students || 0,
            sessions: basicStats?.sessions || 0,
            accuracy: basicStats?.accuracy || 0,
            avgPoints: basicStats?.avg_points || 0
          },
          topStudents: topStudents || [],
          weakStudents: weakStudents || [],
          subjects: subjectPerf || [],
          topWrong: topWrong || [],
          distribution: accuracyDist || []
        }
      })

      // 存入缓存
      setToCache(cacheKey, result)

      return result
    } catch (error) {
      console.error('[classFullAnalysisTool] 查询失败:', error)
      return JSON.stringify({ success: false, error: error.message })
    }
  }
})

module.exports = classFullAnalysisTool
