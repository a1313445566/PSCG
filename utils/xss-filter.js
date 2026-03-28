/**
 * XSS 过滤器
 * 用于清理富文本内容中的恶意代码
 */
class XSSFilter {
  constructor() {
    // 允许的 HTML 标签
    this.allowedTags = [
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
      'img'
    ]

    // 允许的属性
    this.allowedAttributes = {
      span: ['style', 'class'],
      img: ['src', 'alt', 'style', 'class'],
      p: ['style', 'class'],
      '*': ['class'] // 所有标签允许 class
    }

    // 允许的样式
    this.allowedStyles = [
      'color',
      'background-color',
      'font-size',
      'font-weight',
      'text-align',
      'text-decoration'
    ]
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

    // 2. 移除事件处理器
    clean = clean.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')

    // 3. 移除 javascript: 协议
    clean = clean.replace(/javascript:/gi, '')

    // 4. 移除 data: 协议（除了图片）
    clean = clean.replace(/(?<!src=["'])data:(?!image\/)/gi, '')

    // 5. 清理 iframe, object, embed 等危险标签
    clean = clean.replace(/<(iframe|object|embed|form|input|button)[^>]*>/gi, '')
    clean = clean.replace(/<\/(iframe|object|embed|form|input|button)>/gi, '')

    // 6. 验证图片 src
    clean = this.validateImageSources(clean)

    return clean
  }

  /**
   * 验证图片源
   */
  validateImageSources(html) {
    // 匹配图片标签
    return html.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, (match, src) => {
      // 允许的图片源：相对路径、Base64 图片
      const isValidSrc =
        src.startsWith('/images/') || src.startsWith('/audio/') || src.startsWith('data:image/')

      if (!isValidSrc) {
        return '<!-- 无效的图片源 -->'
      }

      return match
    })
  }

  /**
   * 深度清理（更严格）
   * 用于存储到数据库前的最终清理
   */
  deepSanitize(html) {
    let clean = this.sanitize(html)

    // 移除所有 style 中的 url()
    clean = clean.replace(/url\s*\([^)]*\)/gi, '')

    // 移除 expression()
    clean = clean.replace(/expression\s*\([^)]*\)/gi, '')

    return clean
  }
}

module.exports = new XSSFilter()
