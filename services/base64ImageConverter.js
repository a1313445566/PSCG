const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const fileRefService = require('./fileReferenceService')

const IMAGES_DIR = path.join(__dirname, '../images')

/**
 * Base64 图片转换服务
 * 自动将 HTML 内容中的 base64 图片转换为文件并返回 URL
 * 防止数据库存储庞大的 base64 数据导致性能问题
 */
class Base64ImageConverter {
  constructor() {
    this.base64Regex = /<img[^>]+src=["']data:image\/([^"';\s]+);base64,([^"'\s]+)["'][^>]*>/gi
  }

  /**
   * 转换 HTML 内容中的所有 base64 图片
   * @param {string} html - 包含 base64 图片的 HTML 内容
   * @returns {Promise<{html: string, convertedCount: number}>} 转换后的 HTML 和转换数量
   */
  async convertHtml(html) {
    if (!html || typeof html !== 'string') {
      return { html: html || '', convertedCount: 0 }
    }

    const regex = new RegExp(this.base64Regex.source, 'gi')
    const matches = []
    let match

    while ((match = regex.exec(html)) !== null) {
      matches.push({
        mimeType: match[1],
        base64Data: match[2]
      })
    }

    if (matches.length === 0) {
      return { html, convertedCount: 0 }
    }

    const replacements = await Promise.all(matches.map(async item => this.convertSingleImage(item)))

    let convertedCount = 0
    let resultHtml = html
    replacements
      .filter(r => r)
      .forEach(r => {
        convertedCount++
        resultHtml = resultHtml.replace(r.original, r.replacement)
      })

    return { html: resultHtml, convertedCount }
  }

  /**
   * 转换单张 base64 图片
   * @param {{mimeType: string, base64Data: string}} item - 图片信息
   * @returns {Promise<{original: string, replacement: string}|null>}
   */
  async convertSingleImage(item) {
    try {
      const imageUrl = await this.saveBase64Image(item.base64Data, item.mimeType)
      if (imageUrl) {
        return {
          original: `data:image/${item.mimeType};base64,${item.base64Data}`,
          replacement: imageUrl
        }
      }
    } catch (error) {
      console.error('[Base64Converter] 转换失败:', error.message)
    }
    return null
  }

  /**
   * 将 base64 数据保存为图片文件
   * @param {string} base64Data - base64 编码的图片数据
   * @param {string} mimeType - MIME 类型（如 png、jpeg）
   * @returns {Promise<string|null>} 图片 URL 或 null（失败时）
   */
  async saveBase64Image(base64Data, mimeType) {
    try {
      const buffer = Buffer.from(base64Data, 'base64')

      const extension = this.getExtension(mimeType)
      const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 12)
      const filename = `base64-${Date.now()}-${hash}.${extension}`
      const filepath = path.join(IMAGES_DIR, filename)

      if (!fs.existsSync(IMAGES_DIR)) {
        fs.mkdirSync(IMAGES_DIR, { recursive: true })
      }

      fs.writeFileSync(filepath, buffer)

      const fileSizeKB = Math.round(buffer.length / 1024)
      console.log(`[Base64Converter] ✅ 已保存: ${filename} (${fileSizeKB}KB)`)

      const imageUrl = `/images/${filename}`

      await fileRefService.incrementFileReference(imageUrl)
      console.log(`[Base64Converter] 📝 已注册文件引用: ${filename}`)

      return imageUrl
    } catch (error) {
      console.error('[Base64Converter] 保存失败:', error)
      return null
    }
  }

  /**
   * 根据 MIME 类型获取文件扩展名
   * @param {string} mimeType - MIME 类型
   * @returns {string} 文件扩展名
   */
  getExtension(mimeType) {
    const mimeMap = {
      png: 'png',
      jpeg: 'jpg',
      jpg: 'jpg',
      gif: 'gif',
      webp: 'webp',
      svg: 'svg'
    }
    return mimeMap[mimeType.toLowerCase()] || 'png'
  }

  /**
   * 检查 HTML 是否包含 base64 图片
   * @param {string} html - HTML 内容
   * @returns {boolean} 是否包含 base64 图片
   */
  hasBase64Images(html) {
    if (!html || typeof html !== 'string') return false
    this.base64Regex.lastIndex = 0
    return this.base64Regex.test(html)
  }

  /**
   * 统计 HTML 中 base64 图片的数量和总大小
   * @param {string} html - HTML 内容
   * @returns {{count: number, totalSizeKB: number}} 统计信息
   */
  analyzeBase64Images(html) {
    if (!html || typeof html !== 'string') {
      return { count: 0, totalSizeKB: 0 }
    }

    this.base64Regex.lastIndex = 0
    let count = 0
    let totalSizeBytes = 0

    let match
    while ((match = this.base64Regex.exec(html)) !== null) {
      count++
      totalSizeBytes += match[2].length // base64 数据长度（第2个捕获组）
    }

    const totalSizeKB = Math.round((totalSizeBytes * 3) / 4 / 1024) // base64 解码后的大小

    return { count, totalSizeKB }
  }
}

module.exports = new Base64ImageConverter()
