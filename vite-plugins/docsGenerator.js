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

      // 使用 marked 实例解析（v12+ 构造器方式）
      const html = marked.parse(content)

      // 获取文件真实的时间戳
      const stats = fs.statSync(fullPath)
      const createdAt = stats.birthtime.toISOString()
      const updatedAt = stats.mtime.toISOString()

      items.push({
        type: 'file',
        name: entry.name,
        title,
        path: relativePath.replace(/\\/g, '/'),
        html,
        createdAt,
        updatedAt
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
  let cachedDocsData = null

  async function generateDocsData() {
    if (cachedDocsData) return cachedDocsData

    const { Marked } = await import('marked')
    // marked v12+：使用构造器替代已废弃的 setOptions
    const marked = new Marked({ gfm: true, breaks: true })

    const docsTree = await scanDocsDir(DOCS_DIR, '', marked)
    const stats = generateStats(docsTree)

    cachedDocsData = JSON.stringify({ stats, tree: docsTree })
    return cachedDocsData
  }

  return {
    name: 'vite-plugin-docs-generator',

    apply: 'build',

    async buildStart() {
      console.log('\n📚 [docsGenerator] 开始扫描 DOCS 目录...')
    },

    async generateBundle(_options, _bundle) {
      const jsonStr = await generateDocsData()

      this.emitFile({
        type: 'asset',
        fileName: OUTPUT_FILE,
        source: jsonStr
      })

      const data = JSON.parse(jsonStr)
      console.log(`📚 [docsGenerator] 文档数据生成完成:`)
      console.log(`   - 文件数: ${data.stats.totalFiles}`)
      console.log(`   - 目录数: ${data.stats.totalDirs}`)
      console.log(`   - 输出: ${OUTPUT_FILE}\n`)
    },

    async configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/docs-data.json') {
          try {
            const jsonStr = await generateDocsData()
            res.setHeader('Content-Type', 'application/json')
            res.end(jsonStr)
          } catch (error) {
            console.error('[docsGenerator] 生成文档数据失败:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ error: '生成文档数据失败' }))
          }
        } else {
          next()
        }
      })
    }
  }
}
