#!/usr/bin/env node
/**
 * 清理孤儿文件脚本
 * 用于清理数据库中不再引用的图片和音频文件
 *
 * 使用方法：
 *   node scripts/cleanup-orphan-files.js [--dry-run] [--days=30]
 *
 * 参数：
 *   --dry-run  只显示将被删除的文件，不实际删除
 *   --days=N   只清理 N 天前的文件（默认 30 天）
 */

// 加载环境变量
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const fs = require('fs')
const path = require('path')
const db = require('../services/database')

// 初始化数据库连接
let dbInitialized = false

async function initDb() {
  if (!dbInitialized) {
    await db.connect()
    dbInitialized = true
  }
}

// 配置
const DRY_RUN = process.argv.includes('--dry-run')
const DAYS_ARG = process.argv.find(arg => arg.startsWith('--days='))
const DAYS = DAYS_ARG ? parseInt(DAYS_ARG.split('=')[1]) : 30
const CUTOFF_TIME = Date.now() - DAYS * 24 * 60 * 60 * 1000

// 目录配置
const IMAGES_DIR = path.join(__dirname, '..', 'images')
const AUDIO_DIR = path.join(__dirname, '..', 'audio')

/**
 * 获取数据库中引用的所有文件
 */
async function getReferencedFiles() {
  await initDb()
  const files = new Set()

  try {
    // 查询所有题目
    const questions = await db.all('SELECT content, options, image_url, audio_url FROM questions')

    for (const q of questions) {
      // 从 image_url 收集
      if (q.image_url) {
        files.add(q.image_url)
      }

      // 从 audio_url 收集
      if (q.audio_url) {
        files.add(q.audio_url)
      }

      // 从 content 中提取图片路径
      if (q.content) {
        const imgMatches = q.content.match(/\/images\/[^"'\s]+/g) || []
        const audioMatches = q.content.match(/\/audio\/[^"'\s]+/g) || []
        imgMatches.forEach(f => files.add(f))
        audioMatches.forEach(f => files.add(f))
      }

      // 从 options 中提取图片路径
      if (q.options) {
        try {
          const options = JSON.parse(q.options)
          if (Array.isArray(options)) {
            for (const opt of options) {
              if (typeof opt === 'string') {
                const imgMatches = opt.match(/\/images\/[^"'\s]+/g) || []
                imgMatches.forEach(f => files.add(f))
              }
            }
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }

    console.log(`[信息] 数据库中引用的文件数量: ${files.size}`)
  } catch (error) {
    console.error('[错误] 获取数据库引用失败:', error.message)
    throw error
  }

  return files
}

/**
 * 获取目录中的所有文件
 */
function getFilesInDirectory(dir, baseDir = dir) {
  const files = []

  if (!fs.existsSync(dir)) {
    console.log(`[警告] 目录不存在: ${dir}`)
    return files
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      // 递归处理子目录
      files.push(...getFilesInDirectory(fullPath, baseDir))
    } else {
      // 获取相对路径（转换为 URL 格式）
      const relativePath = '/' + path.relative(path.dirname(baseDir), fullPath).replace(/\\/g, '/')
      const stat = fs.statSync(fullPath)

      files.push({
        path: fullPath,
        url: relativePath,
        size: stat.size,
        mtime: stat.mtime.getTime()
      })
    }
  }

  return files
}

/**
 * 清理孤儿文件
 */
async function cleanupOrphanFiles() {
  console.log('========================================')
  console.log('清理孤儿文件脚本')
  console.log('========================================')
  console.log(`模式: ${DRY_RUN ? '预览模式（不实际删除）' : '执行模式'}`)
  console.log(`清理阈值: ${DAYS} 天前的文件`)
  console.log('========================================\n')

  // 获取数据库引用
  const referencedFiles = await getReferencedFiles()

  // 获取所有文件
  const imageFiles = getFilesInDirectory(IMAGES_DIR)
  const audioFiles = getFilesInDirectory(AUDIO_DIR)
  const allFiles = [...imageFiles, ...audioFiles]

  console.log(`[信息] 图片目录文件数量: ${imageFiles.length}`)
  console.log(`[信息] 音频目录文件数量: ${audioFiles.length}`)
  console.log(`[信息] 总文件数量: ${allFiles.length}\n`)

  // 找出孤儿文件
  const orphanFiles = allFiles.filter(file => {
    // 检查是否被引用
    const isReferenced = referencedFiles.has(file.url)

    // 检查是否超过时间阈值
    const isOldEnough = file.mtime < CUTOFF_TIME

    return !isReferenced && isOldEnough
  })

  console.log(`[信息] 孤儿文件数量: ${orphanFiles.length}\n`)

  if (orphanFiles.length === 0) {
    console.log('[完成] 没有需要清理的孤儿文件')
    return
  }

  // 计算总大小
  const totalSize = orphanFiles.reduce((sum, f) => sum + f.size, 0)
  console.log(`[信息] 孤儿文件总大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`)

  // 显示将被删除的文件
  console.log('将被清理的文件:')
  console.log('----------------------------------------')

  let deletedCount = 0
  let deletedSize = 0
  let errorCount = 0

  for (const file of orphanFiles) {
    const sizeKB = (file.size / 1024).toFixed(1)
    const mtime = new Date(file.mtime).toISOString().split('T')[0]

    if (DRY_RUN) {
      console.log(`[预览] ${file.url} (${sizeKB} KB, ${mtime})`)
    } else {
      try {
        fs.unlinkSync(file.path)
        deletedCount++
        deletedSize += file.size
        console.log(`[删除] ${file.url} (${sizeKB} KB, ${mtime})`)
      } catch (error) {
        errorCount++
        console.error(`[错误] 无法删除 ${file.url}: ${error.message}`)
      }
    }
  }

  console.log('----------------------------------------')
  console.log('\n清理统计:')
  console.log(`  处理文件数: ${orphanFiles.length}`)

  if (DRY_RUN) {
    console.log(`  预计释放空间: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
    console.log('\n[提示] 这是一个预览，使用不带 --dry-run 参数的命令来实际删除文件')
  } else {
    console.log(`  实际删除: ${deletedCount}`)
    console.log(`  删除失败: ${errorCount}`)
    console.log(`  释放空间: ${(deletedSize / 1024 / 1024).toFixed(2)} MB`)
  }

  console.log('\n[完成] 清理脚本执行完毕')
}

// 执行清理
;(async () => {
  try {
    await cleanupOrphanFiles()
    process.exit(0)
  } catch (error) {
    console.error('[错误] 脚本执行失败:', error)
    process.exit(1)
  }
})()
