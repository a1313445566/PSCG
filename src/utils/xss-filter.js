/**
 * 前端 XSS 过滤器
 * 用于显示富文本内容时的安全清理
 * 与后端 xss-filter.js 保持一致的 API
 */

/**
 * XSS 过滤器类
 */
class XSSFilter {
  constructor() {
    // 允许的 HTML 标签
    this.allowedTags = new Set([
      'p',
      'br',
      'span',
      'strong',
      'em',
      'u',
      's',
      'del',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'sub',
      'sup',
      'img',
      // 表格相关标签
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'caption'
    ])

    // 允许的属性
    this.allowedAttributes = {
      span: ['style', 'class'],
      img: ['src', 'alt', 'style', 'class'],
      p: ['style', 'class'],
      table: ['style', 'class', 'border'],
      td: ['style', 'class', 'colspan', 'rowspan'],
      th: ['style', 'class', 'colspan', 'rowspan'],
      '*': ['class'] // 所有标签允许 class
    }

    // 允许的样式
    this.allowedStyles = new Set([
      'color',
      'background-color',
      'font-size',
      'font-weight',
      'text-align',
      'text-decoration'
    ])
  }

  /**
   * 清理 HTML 内容
   * @param {string} html - 原始 HTML
   * @returns {string} - 清理后的安全 HTML
   */
  sanitize(html) {
    if (!html) return ''

    // 1. 移除脚本标签
    let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

    // 2. 移除事件处理器 (onclick, onerror, onload 等)
    clean = clean.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    clean = clean.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')

    // 3. 移除 javascript: 协议
    clean = clean.replace(/javascript:/gi, '')

    // 4. 移除 vbscript: 协议
    clean = clean.replace(/vbscript:/gi, '')

    // 5. 清理 iframe, object, embed, form 等危险标签
    clean = clean.replace(/<(iframe|object|embed|form|input|button|meta|link)[^>]*>/gi, '')
    clean = clean.replace(/<\/(iframe|object|embed|form|input|button|meta|link)>/gi, '')

    // 6. 验证图片 src
    clean = this.validateImageSources(clean)

    // 7. 清理 style 中的危险内容
    clean = this.sanitizeStyles(clean)

    return clean
  }

  /**
   * 验证图片源
   * @param {string} html - HTML 内容
   * @returns {string}
   */
  validateImageSources(html) {
    return html.replace(/<img[^>]+>/gi, match => {
      const srcMatch = match.match(/src=["']([^"']+)["']/i)

      if (srcMatch) {
        const src = srcMatch[1]

        // 允许的图片源：/images/、/audio/、data:image/、相对路径
        const isValidSrc =
          src.startsWith('/images/') ||
          src.startsWith('/audio/') ||
          src.startsWith('data:image/') ||
          src.startsWith('http://') ||
          src.startsWith('https://') ||
          !src.includes(':') // 相对路径

        if (!isValidSrc) {
          return '<!-- 无效的图片源已移除 -->'
        }
      }

      return match
    })
  }

  /**
   * 清理 style 属性中的危险内容
   * @param {string} html - HTML 内容
   * @returns {string}
   */
  sanitizeStyles(html) {
    return html.replace(/style=["']([^"']+)["']/gi, (match, styleContent) => {
      // 移除 url()
      let cleanStyle = styleContent.replace(/url\s*\([^)]*\)/gi, '')

      // 移除 expression()
      cleanStyle = cleanStyle.replace(/expression\s*\([^)]*\)/gi, '')

      // 移除 behavior
      cleanStyle = cleanStyle.replace(/behavior\s*:[^;]+;?/gi, '')

      // 移除 -moz-binding
      cleanStyle = cleanStyle.replace(/-moz-binding\s*:[^;]+;?/gi, '')

      return `style="${cleanStyle}"`
    })
  }

  /**
   * 深度清理（更严格）
   * 用于存储到数据库前的最终清理
   * @param {string} html - HTML 内容
   * @returns {string}
   */
  deepSanitize(html) {
    let clean = this.sanitize(html)

    // 移除所有 style 中的 url()
    clean = clean.replace(/url\s*\([^)]*\)/gi, '')

    // 移除 expression()
    clean = clean.replace(/expression\s*\([^)]*\)/gi, '')

    // 移除 HTML 注释
    clean = clean.replace(/<!--[\s\S]*?-->/g, '')

    return clean
  }

  /**
   * 清理并截断文本
   * @param {string} html - HTML 内容
   * @param {number} maxLength - 最大长度
   * @returns {string}
   */
  sanitizeAndTruncate(html, maxLength = 200) {
    const clean = this.sanitize(html)
    // 移除 HTML 标签，只保留文本
    const text = clean.replace(/<[^>]+>/g, '')

    if (text.length <= maxLength) {
      return text
    }

    return text.substring(0, maxLength) + '...'
  }

  /**
   * 检查内容是否包含潜在危险
   * @param {string} html - HTML 内容
   * @returns {boolean}
   */
  hasDangerousContent(html) {
    if (!html) return false

    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /<form/i,
      /expression\s*\(/i
    ]

    return dangerousPatterns.some(pattern => pattern.test(html))
  }
}

/**
 * 转义 HTML 特殊字符（用于纯文本输入）
 * @param {string} text - 原始文本
 * @returns {string} 转义后的文本
 */
export const escapeHtml = text => {
  if (!text) return ''
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return String(text).replace(/[&<>"']/g, char => map[char])
}

// 导出单例
const xssFilter = new XSSFilter()
export default xssFilter

// 也导出类，以便需要时创建新实例
export { XSSFilter }
