/**
 * 文件引用服务
 * 用于维护文件引用计数和自动清理孤儿文件
 */

const fs = require('fs')
const path = require('path')
const db = require('./database')

// 文件存储目录（供将来扩展使用）
const _IMAGES_DIR = path.join(__dirname, '../images')
const _AUDIO_DIR = path.join(__dirname, '../audio')

/**
 * 从 HTML 内容中提取所有文件 URL
 * @param {string} content - HTML 内容
 * @returns {string[]} 文件 URL 列表
 */
function extractFileUrls(content) {
  if (!content || typeof content !== 'string') return []

  const urls = new Set()

  // 提取图片 URL
  const imgRegex = /\/images\/[^"'\s<>]+/g
  const imgMatches = content.match(imgRegex) || []
  imgMatches.forEach(url => urls.add(url))

  // 提取音频 URL
  const audioRegex = /\/audio\/[^"'\s<>]+/g
  const audioMatches = content.match(audioRegex) || []
  audioMatches.forEach(url => urls.add(url))

  return Array.from(urls)
}

/**
 * 从题目数据中提取所有文件 URL
 * @param {object} questionData - 题目数据
 * @returns {string[]} 文件 URL 列表
 */
function extractQuestionFiles(questionData) {
  const urls = new Set()

  // 从 image_url 字段提取
  if (questionData.image_url || questionData.image) {
    urls.add(questionData.image_url || questionData.image)
  }

  // 从 audio_url 字段提取
  if (questionData.audio_url || questionData.audio) {
    urls.add(questionData.audio_url || questionData.audio)
  }

  // 从 content 中提取
  if (questionData.content) {
    extractFileUrls(questionData.content).forEach(url => urls.add(url))
  }

  // 从 options 中提取
  if (questionData.options) {
    let options = questionData.options
    if (typeof options === 'string') {
      try {
        options = JSON.parse(options)
      } catch (e) {
        options = []
      }
    }

    if (Array.isArray(options)) {
      options.forEach(opt => {
        if (typeof opt === 'string') {
          extractFileUrls(opt).forEach(url => urls.add(url))
        }
      })
    }
  }

  // 从 explanation 中提取
  if (questionData.explanation) {
    extractFileUrls(questionData.explanation).forEach(url => urls.add(url))
  }

  return Array.from(urls)
}

/**
 * 增加文件引用计数
 * @param {string} fileUrl - 文件 URL
 */
async function incrementFileReference(fileUrl) {
  try {
    const result = await db.run(
      'UPDATE file_hashes SET ref_count = ref_count + 1 WHERE file_path = ?',
      [fileUrl]
    )

    if (result.changes === 0) {
      // 文件记录不存在，可能是历史数据，创建记录
      const filePath = path.join(__dirname, '..', fileUrl)
      if (fs.existsSync(filePath)) {
        const crypto = require('crypto')
        const fileBuffer = fs.readFileSync(filePath)
        const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex')
        const fileSize = fs.statSync(filePath).size
        const fileType = fileUrl.startsWith('/images/') ? 'image' : 'audio'

        await db.run(
          'INSERT INTO file_hashes (file_hash, file_path, file_type, file_size, ref_count) VALUES (?, ?, ?, ?, 1) ON DUPLICATE KEY UPDATE ref_count = ref_count + 1',
          [fileHash, fileUrl, fileType, fileSize]
        )

        console.log(`[文件引用] 创建历史文件记录: ${fileUrl}`)
      }
    }
  } catch (error) {
    console.error(`[文件引用] 增加引用失败 ${fileUrl}:`, error.message)
  }
}

/**
 * 减少文件引用计数，归零时删除物理文件
 * @param {string} fileUrl - 文件 URL
 * @returns {boolean} 是否删除了文件
 */
async function decrementFileReference(fileUrl) {
  try {
    // 先获取当前引用计数
    const record = await db.get('SELECT id, ref_count FROM file_hashes WHERE file_path = ?', [
      fileUrl
    ])

    if (!record) {
      console.log(`[文件引用] 记录不存在: ${fileUrl}`)
      return false
    }

    if (record.ref_count <= 1) {
      // 引用计数归零，删除物理文件和数据库记录
      const filePath = path.join(__dirname, '..', fileUrl)

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log(`[文件清理] 删除孤儿文件: ${fileUrl}`)
      }

      await db.run('DELETE FROM file_hashes WHERE id = ?', [record.id])
      return true
    } else {
      // 减少引用计数
      await db.run('UPDATE file_hashes SET ref_count = ref_count - 1 WHERE id = ?', [record.id])
      console.log(`[文件引用] 引用计数减少: ${fileUrl} (剩余 ${record.ref_count - 1})`)
      return false
    }
  } catch (error) {
    console.error(`[文件引用] 减少引用失败 ${fileUrl}:`, error.message)
    return false
  }
}

/**
 * 更新题目的文件引用
 * 在添加或更新题目时调用
 * @param {object} newQuestionData - 新题目数据
 * @param {object|null} oldQuestionData - 旧题目数据（更新时传入，添加时为 null）
 */
async function updateQuestionFileReferences(newQuestionData, oldQuestionData = null) {
  try {
    const newFiles = extractQuestionFiles(newQuestionData)
    const oldFiles = oldQuestionData ? extractQuestionFiles(oldQuestionData) : []

    // 找出新增的文件
    const addedFiles = newFiles.filter(f => !oldFiles.includes(f))
    // 找出移除的文件
    const removedFiles = oldFiles.filter(f => !newFiles.includes(f))

    // 增加新文件引用
    for (const fileUrl of addedFiles) {
      await incrementFileReference(fileUrl)
    }

    // 减少移除文件引用
    for (const fileUrl of removedFiles) {
      await decrementFileReference(fileUrl)
    }

    if (addedFiles.length > 0 || removedFiles.length > 0) {
      console.log(
        `[文件引用] 题目 ${newQuestionData.id || 'new'} - 新增 ${addedFiles.length} 个文件，移除 ${removedFiles.length} 个文件`
      )
    }
  } catch (error) {
    console.error('[文件引用] 更新文件引用失败:', error.message)
  }
}

/**
 * 删除题目的文件引用
 * 在删除题目时调用
 * @param {object} questionData - 被删除的题目数据
 */
async function deleteQuestionFileReferences(questionData) {
  try {
    const files = extractQuestionFiles(questionData)

    for (const fileUrl of files) {
      await decrementFileReference(fileUrl)
    }

    if (files.length > 0) {
      console.log(`[文件引用] 删除题目 ${questionData.id} - 清理 ${files.length} 个文件引用`)
    }
  } catch (error) {
    console.error('[文件引用] 删除文件引用失败:', error.message)
  }
}

/**
 * 批量删除题目的文件引用
 * @param {array} questions - 被删除的题目数组
 */
async function batchDeleteQuestionFileReferences(questions) {
  try {
    for (const question of questions) {
      await deleteQuestionFileReferences(question)
    }
  } catch (error) {
    console.error('[文件引用] 批量删除文件引用失败:', error.message)
  }
}

/**
 * 获取文件的引用计数
 * @param {string} fileUrl - 文件 URL
 * @returns {number} 引用计数
 */
async function getFileReferenceCount(fileUrl) {
  try {
    const record = await db.get('SELECT ref_count FROM file_hashes WHERE file_path = ?', [fileUrl])
    return record ? record.ref_count : 0
  } catch (error) {
    console.error(`[文件引用] 获取引用计数失败 ${fileUrl}:`, error.message)
    return 0
  }
}

module.exports = {
  extractFileUrls,
  extractQuestionFiles,
  incrementFileReference,
  decrementFileReference,
  updateQuestionFileReferences,
  deleteQuestionFileReferences,
  batchDeleteQuestionFileReferences,
  getFileReferenceCount
}
