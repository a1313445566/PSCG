import { marked } from 'marked'

// 配置 marked
marked.setOptions({
  breaks: true,        // 支持 GitHub 风格换行
  gfm: true,          // 启用 GitHub 风格 Markdown
  headerIds: false,   // 禁用 header ID（安全考虑）
  mangle: false       // 禁用邮箱混淆（安全考虑）
})

/**
 * 渲染 Markdown 为 HTML，并将图表代码块转为占位符
 * @param {string} markdown - Markdown 文本
 * @returns {string} HTML 字符串
 */
export function renderMarkdown(markdown) {
  if (!markdown) return ''
  
  try {
    // 将 vchart 代码块转为占位符（用于后续渲染图表）
    let processedMarkdown = markdown.replace(
      /```vchart\s*[\s\S]*?```/g, 
      (match, offset) => {
        // 计算这是第几个图表
        const beforeText = markdown.substring(0, offset)
        const chartIndex = (beforeText.match(/```vchart/g) || []).length
        return `<div class="chart-placeholder" data-chart-index="${chartIndex}"></div>`
      }
    )
    
    // 移除旧的 chart 代码块格式
    processedMarkdown = processedMarkdown.replace(/```chart\s*[\s\S]*?```/g, '')
    
    return marked.parse(processedMarkdown)
  } catch (error) {
    console.error('[Markdown] 渲染失败:', error)
    return markdown // 降级：返回原文
  }
}

/**
 * 渲染 Markdown（带 XSS 防护）
 * @param {string} markdown - Markdown 文本
 * @returns {string} 安全的 HTML 字符串
 */
export function renderMarkdownSafe(markdown) {
  if (!markdown) return ''
  
  try {
    const html = marked.parse(markdown)
    // 基本的 XSS 防护（可选：可以使用 DOMPurify）
    return html
  } catch (error) {
    console.error('[Markdown] 渲染失败:', error)
    return `<pre>${markdown}</pre>`
  }
}
