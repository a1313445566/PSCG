/**
 * 知识点掌握度工具
 * 文件: services/chat/tools/knowledgePointMasteryTool.js
 * 功能: 分析学生在具体知识点上的掌握程度
 * 适用场景: 小学教育（精准定位知识盲区）
 */

const { z } = require('zod')
const { defineTool } = require('./toolUtils')
const db = require('../../database')

const knowledgePointMasteryTool = defineTool({
  name: 'query_knowledge_point_mastery',
  description: '知识点掌握度分析：查询学生在具体知识点（子分类）上的掌握程度。小学教育精准教学工具！',
  schema: z.object({
    studentId: z.number().int().positive().optional().describe('学生ID'),
    grade: z.string().optional().describe('年级(1-6)'),
    className: z.string().optional().describe('班级'),
    subjectId: z.number().int().positive().optional().describe('学科ID'),
    subcategoryId: z.number().int().positive().optional().describe('知识点ID（子分类ID）'),
    masteryThreshold: z.number().int().min(0).max(100).optional().default(70).describe('掌握度阈值（低于此值为薄弱点）')
  }),
  handler: async args => {
    try {
      const { studentId, grade, className, subjectId, subcategoryId, masteryThreshold = 70 } = args

      // 1. 查询学生在所有知识点的掌握度
      if (studentId) {
        const masterySQL = `
          SELECT 
            u.id as student_id,
            u.name as student_name,
            s.id as subject_id,
            s.name as subject_name,
            sc.id as subcategory_id,
            sc.name as subcategory_name,
            lp.mastery_level,
            lp.progress_percentage,
            lp.total_attempts,
            lp.correct_attempts,
            lp.recent_accuracy,
            lp.accuracy_trend,
            lp.last_practiced,
            lp.ai_suggestion
          FROM users u
          CROSS JOIN subcategories sc
          LEFT JOIN learning_progress lp ON u.id = lp.user_id AND sc.id = lp.subcategory_id
          LEFT JOIN subjects s ON sc.subject_id = s.id
          WHERE u.id = ?
          ${subjectId ? ' AND s.id = ?' : ''}
          ${subcategoryId ? ' AND sc.id = ?' : ''}
          ORDER BY lp.mastery_level ASC, lp.progress_percentage ASC
        `

        const params = [studentId]
        if (subjectId) params.push(subjectId)
        if (subcategoryId) params.push(subcategoryId)

        const studentMastery = await db.query(masterySQL, params)

        // 分析薄弱知识点
        const weakPoints = studentMastery.filter(m => 
          m.mastery_level < masteryThreshold || m.progress_percentage < masteryThreshold
        )

        // 分析优势知识点
        const strongPoints = studentMastery.filter(m => 
          m.mastery_level >= 90 && m.progress_percentage >= 90
        )

        return JSON.stringify({
          success: true,
          data: {
            student: {
              id: studentId,
              name: studentMastery[0]?.student_name
            },
            total_knowledge_points: studentMastery.length,
            mastery_distribution: {
              excellent: studentMastery.filter(m => m.mastery_level >= 90).length,
              good: studentMastery.filter(m => m.mastery_level >= 70 && m.mastery_level < 90).length,
              average: studentMastery.filter(m => m.mastery_level >= 50 && m.mastery_level < 70).length,
              weak: studentMastery.filter(m => m.mastery_level < 50).length,
              not_started: studentMastery.filter(m => !m.mastery_level).length
            },
            weak_points: weakPoints.slice(0, 10).map(wp => ({
              subcategory_id: wp.subcategory_id,
              subcategory_name: wp.subcategory_name,
              subject_name: wp.subject_name,
              mastery_level: wp.mastery_level || 0,
              progress_percentage: wp.progress_percentage || 0,
              total_attempts: wp.total_attempts || 0,
              recent_accuracy: wp.recent_accuracy || 0,
              accuracy_trend: wp.accuracy_trend,
              last_practiced: wp.last_practiced,
              ai_suggestion: wp.ai_suggestion,
              suggestion: wp.mastery_level < 50 
                ? '建议重点辅导，基础薄弱'
                : '建议加强练习，巩固提升'
            })),
            strong_points: strongPoints.slice(0, 5).map(sp => ({
              subcategory_id: sp.subcategory_id,
              subcategory_name: sp.subcategory_name,
              subject_name: sp.subject_name,
              mastery_level: sp.mastery_level,
              progress_percentage: sp.progress_percentage,
              suggestion: '掌握良好，可适当拓展'
            })),
            all_mastery: studentMastery,
            recommendation: weakPoints.length > 0
              ? `发现 ${weakPoints.length} 个薄弱知识点，建议重点辅导`
              : '知识点掌握良好，建议保持练习'
          }
        })
      }

      // 2. 查询全班/全年级在某个知识点的掌握度
      if (grade || className) {
        const classMasterySQL = `
          SELECT 
            sc.id as subcategory_id,
            sc.name as subcategory_name,
            s.id as subject_id,
            s.name as subject_name,
            COUNT(DISTINCT lp.user_id) as students_learned,
            AVG(lp.mastery_level) as avg_mastery,
            AVG(lp.progress_percentage) as avg_progress,
            AVG(lp.recent_accuracy) as avg_accuracy,
            SUM(CASE WHEN lp.mastery_level < ? THEN 1 ELSE 0 END) as weak_students,
            SUM(CASE WHEN lp.mastery_level >= 90 THEN 1 ELSE 0 END) as excellent_students,
            MAX(lp.last_practiced) as last_practiced
          FROM subcategories sc
          LEFT JOIN learning_progress lp ON sc.id = lp.subcategory_id
          LEFT JOIN subjects s ON sc.subject_id = s.id
          LEFT JOIN users u ON lp.user_id = u.id
          WHERE 1=1
          ${grade ? ' AND u.grade = ?' : ''}
          ${className ? ' AND u.class = ?' : ''}
          ${subjectId ? ' AND s.id = ?' : ''}
          ${subcategoryId ? ' AND sc.id = ?' : ''}
          GROUP BY sc.id, sc.name, s.id, s.name
          HAVING students_learned > 0
          ORDER BY avg_mastery ASC
        `

        const classParams = [masteryThreshold]
        if (grade) classParams.push(grade)
        if (className) classParams.push(className)
        if (subjectId) classParams.push(subjectId)
        if (subcategoryId) classParams.push(subcategoryId)

        const classMastery = await db.query(classMasterySQL, classParams)

        // 找出全班掌握度低的知识点
        const classWeakPoints = classMastery.filter(m => m.avg_mastery < masteryThreshold)

        return JSON.stringify({
          success: true,
          data: {
            scope: {
              grade: grade || '全部年级',
              class: className || '全部班级'
            },
            total_knowledge_points: classMastery.length,
            class_average_mastery: classMastery.reduce((sum, m) => sum + (m.avg_mastery || 0), 0) / classMastery.length,
            weak_knowledge_points: classWeakPoints.map(wp => ({
              subcategory_id: wp.subcategory_id,
              subcategory_name: wp.subcategory_name,
              subject_name: wp.subject_name,
              avg_mastery: Math.round(wp.avg_mastery || 0),
              avg_progress: Math.round(wp.avg_progress || 0),
              avg_accuracy: Math.round(wp.avg_accuracy || 0),
              students_learned: wp.students_learned,
              weak_students: wp.weak_students,
              excellent_students: wp.excellent_students,
              last_practiced: wp.last_practiced,
              suggestion: '建议全班重点讲解此知识点'
            })),
            excellent_knowledge_points: classMastery
              .filter(m => m.avg_mastery >= 90)
              .slice(0, 5)
              .map(ep => ({
                subcategory_id: ep.subcategory_id,
                subcategory_name: ep.subcategory_name,
                subject_name: ep.subject_name,
                avg_mastery: Math.round(ep.avg_mastery || 0),
                suggestion: '掌握良好，可适当拓展'
              })),
            all_mastery: classMastery.map(m => ({
              subcategory_id: m.subcategory_id,
              subcategory_name: m.subcategory_name,
              subject_name: m.subject_name,
              avg_mastery: Math.round(m.avg_mastery || 0),
              students_learned: m.students_learned,
              weak_students: m.weak_students
            })),
            recommendation: classWeakPoints.length > 0
              ? `发现 ${classWeakPoints.length} 个薄弱知识点，建议重点讲解`
              : '全班知识点掌握良好'
          }
        })
      }

      // 3. 查询特定知识点的详细情况
      if (subcategoryId) {
        const detailSQL = `
          SELECT 
            u.id, u.name, u.grade, u.class,
            lp.mastery_level,
            lp.progress_percentage,
            lp.total_attempts,
            lp.correct_attempts,
            lp.recent_accuracy,
            lp.accuracy_trend,
            lp.last_practiced,
            lp.ai_suggestion
          FROM learning_progress lp
          JOIN users u ON lp.user_id = u.id
          WHERE lp.subcategory_id = ?
          ${grade ? ' AND u.grade = ?' : ''}
          ${className ? ' AND u.class = ?' : ''}
          ORDER BY lp.mastery_level ASC
        `

        const detailParams = [subcategoryId]
        if (grade) detailParams.push(grade)
        if (className) detailParams.push(className)

        const studentDetails = await db.query(detailSQL, detailParams)

        // 获取知识点信息
        const subcategoryInfo = await db.get(`
          SELECT sc.*, s.name as subject_name
          FROM subcategories sc
          LEFT JOIN subjects s ON sc.subject_id = s.id
          WHERE sc.id = ?
        `, [subcategoryId])

        return JSON.stringify({
          success: true,
          data: {
            subcategory: subcategoryInfo,
            total_students: studentDetails.length,
            average_mastery: studentDetails.reduce((sum, s) => sum + (s.mastery_level || 0), 0) / studentDetails.length,
            mastery_distribution: {
              excellent: studentDetails.filter(s => s.mastery_level >= 90).length,
              good: studentDetails.filter(s => s.mastery_level >= 70 && s.mastery_level < 90).length,
              average: studentDetails.filter(s => s.mastery_level >= 50 && s.mastery_level < 70).length,
              weak: studentDetails.filter(s => s.mastery_level < 50).length
            },
            students: studentDetails.map(s => ({
              id: s.id,
              name: s.name,
              grade: s.grade,
              class: s.class,
              mastery_level: s.mastery_level || 0,
              progress_percentage: s.progress_percentage || 0,
              total_attempts: s.total_attempts || 0,
              correct_attempts: s.correct_attempts || 0,
              recent_accuracy: s.recent_accuracy || 0,
              accuracy_trend: s.accuracy_trend,
              last_practiced: s.last_practiced,
              ai_suggestion: s.ai_suggestion
            })),
            recommendation: `该知识点有 ${studentDetails.filter(s => s.mastery_level < masteryThreshold).length} 个学生掌握不足`
          }
        })
      }

      return JSON.stringify({
        success: false,
        error: '请提供学生ID、年级班级或知识点ID'
      })
    } catch (error) {
      console.error('[knowledgePointMasteryTool] 查询失败:', error)
      return JSON.stringify({ success: false, error: error.message })
    }
  }
})

module.exports = knowledgePointMasteryTool