#!/usr/bin/env node
/**
 * 初始化文件哈希表
 * 扫描现有的 images 和 audio 目录，计算文件哈希并记录到数据库
 *
 * 使用方法: node scripts/init-file-hashes.js
 */

const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const db = require('../services/database')

// 要扫描的目录
const SCAN_DIRS = [
  { dir: path.join(__dirname, '..', 'images'), type: 'image', urlPrefix: '/images/' },
  { dir: path.join(__dirname, '..', 'audio'), type: 'audio', urlPrefix: '/audio/' }
]

// 支持的文件扩展名
const SUPPORTED_EXTENSIONS = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  audio: ['.mp3', '.wav', '.ogg', '.m4a']
}

/**
 * 计算文件 SHA256 哈希
 */
function calculateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath)
  return crypto.createHash('sha256').update(fileBuffer).digest('hex')
}

/**
 * 扫描目录并处理文件
 */
async function scanDirectory(dir, type, urlPrefix) {
  const results = {
    total: 0,
    processed: 0,
    skipped: 0,
    errors: 0,
    duplicates: 0
  }

  if (!fs.existsSync(dir)) {
    console.log(`[跳过] 目录不存在: ${dir}`)
    return results
  }

  const files = fs.readdirSync(dir)
  const supportedExts = SUPPORTED_EXTENSIONS[type]

  for (const file of files) {
    const ext = path.extname(file).toLowerCase()

    // 跳过不支持的文件
    if (!supportedExts.includes(ext)) {
      continue
    }

    results.total++

    const filePath = path.join(dir, file)
    const fileUrl = `${urlPrefix}${file}`

    try {
      // 检查数据库中是否已存在
      const existing = await db.get('SELECT id FROM file_hashes WHERE file_path = ?', [fileUrl])

      if (existing) {
        console.log(`[已存在] ${fileUrl}`)
        results.skipped++
        continue
      }

      // 计算哈希
      const fileHash = calculateFileHash(filePath)
      const fileSize = fs.statSync(filePath).size

      // 检查是否有相同哈希的文件
      const duplicate = await db.get(
        'SELECT id, file_path FROM file_hashes WHERE file_hash = ? AND file_type = ?',
        [fileHash, type]
      )

      if (duplicate) {
        console.log(`[重复] ${fileUrl} -> 已存在于 ${duplicate.file_path}`)
        results.duplicates++

        // 删除重复文件
        fs.unlinkSync(filePath)
        console.log(`  └─ 已删除重复文件: ${file}`)

        // 增加原文件引用计数
        await db.run('UPDATE file_hashes SET ref_count = ref_count + 1 WHERE id = ?', [
          duplicate.id
        ])
        continue
      }

      // 插入新记录
      await db.run(
        'INSERT INTO file_hashes (file_hash, file_path, file_type, file_size, ref_count) VALUES (?, ?, ?, ?, 1)',
        [fileHash, fileUrl, type, fileSize]
      )

      console.log(`[已记录] ${fileUrl} (${(fileSize / 1024).toFixed(1)}KB)`)
      results.processed++
    } catch (error) {
      console.error(`[错误] 处理 ${file} 失败:`, error.message)
      results.errors++
    }
  }

  return results
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================')
  console.log('文件哈希初始化脚本')
  console.log('========================================\n')

  try {
    // 连接数据库（会自动创建 file_hashes 表）
    await db.connect()
    console.log('数据库连接成功\n')

    const totalResults = {
      total: 0,
      processed: 0,
      skipped: 0,
      errors: 0,
      duplicates: 0
    }

    for (const { dir, type, urlPrefix } of SCAN_DIRS) {
      console.log(`\n扫描 ${type} 目录: ${dir}`)
      console.log('-'.repeat(50))

      const results = await scanDirectory(dir, type, urlPrefix)

      totalResults.total += results.total
      totalResults.processed += results.processed
      totalResults.skipped += results.skipped
      totalResults.errors += results.errors
      totalResults.duplicates += results.duplicates
    }

    console.log('\n========================================')
    console.log('处理完成')
    console.log('========================================')
    console.log(`总文件数: ${totalResults.total}`)
    console.log(`新记录: ${totalResults.processed}`)
    console.log(`已存在: ${totalResults.skipped}`)
    console.log(`重复删除: ${totalResults.duplicates}`)
    console.log(`错误: ${totalResults.errors}`)

    // 计算节省空间
    if (totalResults.duplicates > 0) {
      console.log(`\n已清理 ${totalResults.duplicates} 个重复文件`)
    }
  } catch (error) {
    console.error('执行失败:', error)
    process.exit(1)
  } finally {
    await db.close()
  }
}

main()
