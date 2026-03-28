/**
 * Vite 插件：构建时扫描 DOCS 目录，使用 marked 预渲染 Markdown
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DOCS_DIR = path.resolve(__dirname, '../DOCS')
const OUTPUT_FILE = 'docs-data.json'

/**
 * 递归扫描目录，生成文档树结构
 */
async function scanDocsDir(dir, basePath = '', marked) {
  const items = []

  if (!fs.existsSync(dir)) {
    console.warn(`[docsGenerator] DOCS 目录不存在: ${dir}`)
    return items
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relativePath = path.join(basePath, entry.name)

    // 跳过隐藏文件
    if (entry.name.startsWith('.')) continue

    if (entry.isDirectory()) {
      const children = await scanDocsDir(fullPath, relativePath, marked)
      if (children.length > 0) {
        items.push({
          type: 'directory',
          name: entry.name,
          path: relativePath.replace(/\\/g, '/'),
          children
        })
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf-8')
      // 提取标题（第一个 # 标题）
      const titleMatch = content.match(/^#\s+(.+)/m)
      const title = titleMatch ? titleMatch[1] : entry.name.replace('.md', '')

      // 使用 marked 预渲染 HTML
      const html = marked.parse(content)

      items.push({
        type: 'file',
        name: entry.name,
        title,
        path: relativePath.replace(/\\/g, '/'),
        html
      })
    }
  }

  // 排序：目录在前，文件在后，按名称排序
  items.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1
    }
    return a.name.localeCompare(b.name, 'zh-CN')
  })

  return items
}

/**
 * 生成文档统计数据
 */
function generateStats(items) {
  let totalFiles = 0
  let totalDirs = 0

  function count(items) {
    for (const item of items) {
      if (item.type === 'directory') {
        totalDirs++
        if (item.children) count(item.children)
      } else {
        totalFiles++
      }
    }
  }

  count(items)

  return {
    totalFiles,
    totalDirs,
    generatedAt: new Date().toISOString()
  }
}

export default function docsGeneratorPlugin() {
  return {
    name: 'vite-plugin-docs-generator',

    apply: 'build',

    async buildStart() {
      console.log('\n📚 [docsGenerator] 开始扫描 DOCS 目录...')
    },

    async generateBundle(options, bundle) {
      // 动态导入 marked
      const { marked } = await import('marked')

      // 配置 marked
      marked.setOptions({
        gfm: true,
        breaks: true
      })

      const docsTree = await scanDocsDir(DOCS_DIR, '', marked)
      const stats = generateStats(docsTree)

      const docsData = {
        stats,
        tree: docsTree
      }

      // 输出 JSON
      const jsonStr = JSON.stringify(docsData)

      this.emitFile({
        type: 'asset',
        fileName: OUTPUT_FILE,
        source: jsonStr
      })

      console.log(`📚 [docsGenerator] 文档数据生成完成:`)
      console.log(`   - 文件数: ${stats.totalFiles}`)
      console.log(`   - 目录数: ${stats.totalDirs}`)
      console.log(`   - 输出: ${OUTPUT_FILE}\n`)
    }
  }
}
