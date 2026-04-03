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
      'img',
      // 表格相关标签
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'caption',
      'col',
      'colgroup'
    ]

    // 允许的属性
    this.allowedAttributes = {
      span: ['style', 'class'],
      img: ['src', 'alt', 'style', 'class'],
      p: ['style', 'class'],
      // 表格相关属性
      table: ['class', 'style', 'border', 'cellspacing', 'cellpadding'],
      td: ['colspan', 'rowspan', 'class', 'style'],
      th: ['colspan', 'rowspan', 'class', 'style', 'scope'],
      tr: ['class', 'style'],
      thead: ['class', 'style'],
      tbody: ['class', 'style'],
      col: ['class', 'style', 'span'],
      colgroup: ['class', 'style', 'span'],
      '*': ['class'] // 所有标签允许 class
    }

    // 允许的样式
    this.allowedStyles = [
      'color',
      'background-color',
      'font-size',
      'font-weight',
      'text-align',
      'text-decoration',
      // 表格相关样式
      'border',
      'border-collapse',
      'border-spacing',
      'padding',
      'margin',
      'width',
      'height',
      'vertical-align',
      'white-space'
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

  /**
   * 递归清理对象/数组中的所有字符串字段
   * 用于阅读理解题等嵌套 JSON 结构的 XSS 过滤
   * @param {*} data - 任意数据（字符串、数组、对象）
   * @returns {*} - 清理后的数据
   */
  recursiveSanitize(data) {
    // 处理 null 和 undefined
    if (data === null || data === undefined) {
      return data
    }

    // 处理字符串：直接清理
    if (typeof data === 'string') {
      return this.deepSanitize(data)
    }

    // 处理数组：递归处理每个元素
    if (Array.isArray(data)) {
      return data.map(item => this.recursiveSanitize(item))
    }

    // 处理对象：递归处理每个属性
    if (typeof data === 'object') {
      return Object.keys(data).reduce((acc, key) => {
        acc[key] = this.recursiveSanitize(data[key])
        return acc
      }, {})
    }

    // 其他类型直接返回（数字、布尔值等）
    return data
  }
}

module.exports = new XSSFilter()
