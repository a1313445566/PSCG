const db = require('./database')
const { z } = require('zod')
const xssFilter = require('../utils/xss-filter')
const categoryService = require('./categoryService')
const tagService = require('./tagService')

// 从HTML内容中提取纯文本摘要
const extractSummary = (content, maxLength = 200) => {
  if (!content) return ''

  // 移除HTML标签
  let text = content.replace(/<[^>]*>/g, '')

  // 移除多余的空白字符
  text = text.replace(/\s+/g, ' ').trim()

  // 截取指定长度
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '...'
  }

  return text
}

// 封面图占位符列表
const placeholderImages = [
  '/src/assets/images/backgrounds/article-placeholder-1.png',
  '/src/assets/images/backgrounds/article-placeholder-2.png',
  '/src/assets/images/backgrounds/article-placeholder-3.png',
  '/src/assets/images/backgrounds/article-placeholder-4.png'
]

// 获取随机占位符图片
const getRandomPlaceholder = () => {
  const randomIndex = Math.floor(Math.random() * placeholderImages.length)
  return placeholderImages[randomIndex]
}

// 从HTML内容中提取第一张图片作为封面图
const extractFirstImage = content => {
  if (!content) return null

  // 匹配img标签的src属性
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/i
  const match = content.match(imgRegex)

  if (!match) return null

  const url = match[1]

  // 过滤掉 base64 格式的图片
  if (url && url.startsWith('data:image/')) {
    return null
  }

  return url
}

// 获取封面图(优先从内容提取,其次使用占位符)
const getThumbnail = (content, providedThumbnail) => {
  // 如果用户提供了封面图,优先使用
  if (providedThumbnail && providedThumbnail.trim() !== '') {
    return providedThumbnail
  }

  // 从内容中提取封面图
  if (content) {
    const extracted = extractFirstImage(content)
    if (extracted) return extracted
  }

  // 使用占位符
  return getRandomPlaceholder()
}

// 文章数据验证 schema
const articleSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(500).optional().nullable(),
  content: z.string().optional().nullable(),
  thumbnail: z.string().max(255).optional().nullable(),
  author: z.string().max(50).optional().nullable(),
  category_id: z.union([z.number(), z.null()]).optional().nullable(),
  tag_ids: z.array(z.number()).optional(),
  is_published: z.union([z.boolean(), z.number()]).transform(val => Boolean(val)),
  published_at: z.date().optional().nullable()
})

class ArticleService {
  // 获取文章列表（分页）
  // isPublished: true=只查已发布, false=查所有(包括草稿)
  async getArticles(page = 1, pageSize = 12, isPublished = false) {
    try {
      const offset = (page - 1) * pageSize

      let query = `
        SELECT a.*, c.name as category_name
        FROM cms_articles a
        LEFT JOIN cms_categories c ON a.category_id = c.id
      `

      if (isPublished) {
        query += ' WHERE a.is_published = 1'
      }

      query += ' ORDER BY a.published_at DESC, a.created_at DESC'
      query += ` LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}`

      const rows = await db.query(query)

      // 获取文章总数
      const countResult = await db.query(
        isPublished
          ? 'SELECT COUNT(*) as total FROM cms_articles WHERE is_published = 1'
          : 'SELECT COUNT(*) as total FROM cms_articles'
      )

      // 为每篇文章获取标签
      const articlesWithTags = await Promise.all(
        rows.map(async article => {
          const tags = await this.getArticleTags(article.id)
          return { ...article, tags }
        })
      )

      return {
        articles: articlesWithTags,
        pagination: {
          page,
          pageSize,
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / pageSize)
        }
      }
    } catch (error) {
      console.error('获取文章列表失败:', error)
      throw error
    }
  }

  // 根据 ID 获取文章详情
  async getArticleById(id, incrementView = false) {
    try {
      const [rows] = await db.pool.execute(
        `
          SELECT a.*, c.name as category_name
          FROM cms_articles a
          LEFT JOIN cms_categories c ON a.category_id = c.id
          WHERE a.id = ?
        `,
        [id]
      )

      if (!rows[0]) {
        return null
      }

      const article = rows[0]

      // 获取文章标签
      article.tags = await this.getArticleTags(id)

      // 增加浏览次数
      if (incrementView && article.is_published) {
        await db.pool.execute('UPDATE cms_articles SET view_count = view_count + 1 WHERE id = ?', [
          id
        ])
        article.view_count += 1
      }

      return article
    } catch (error) {
      console.error('获取文章详情失败:', error)
      throw error
    }
  }

  // 创建文章
  async createArticle(articleData) {
    try {
      // 验证数据
      const validatedData = articleSchema.parse(articleData)

      // XSS 过滤
      const safeContent = validatedData.content ? xssFilter.sanitize(validatedData.content) : null

      // 自动提取摘要（如果用户没有输入）
      let summary = validatedData.summary
      if (!summary && safeContent) {
        summary = extractSummary(safeContent)
      }

      // 自动提取封面图（如果用户没有输入）
      let thumbnail = validatedData.thumbnail
      if (!thumbnail && safeContent) {
        thumbnail = extractFirstImage(safeContent)
      }
      // 如果还是没有封面图,使用占位符
      if (!thumbnail) {
        thumbnail = getRandomPlaceholder()
      }
      // 确保 thumbnail 不超过 255 字符
      if (thumbnail && thumbnail.length > 255) {
        thumbnail = null
      }

      // 处理发布时间
      let publishedAt = validatedData.published_at
      if (validatedData.is_published && !publishedAt) {
        publishedAt = new Date()
      }
      // 确保 publishedAt 是 null 而不是 undefined
      publishedAt = publishedAt || null

      // 开始事务
      const connection = await db.pool.getConnection()

      try {
        await connection.beginTransaction()

        // 插入文章
        const [result] = await connection.execute(
          `
            INSERT INTO cms_articles
            (title, summary, content, thumbnail, author, category_id, is_published, published_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            validatedData.title,
            summary || null,
            safeContent,
            thumbnail || null,
            validatedData.author || null,
            validatedData.category_id || null,
            validatedData.is_published ? 1 : 0,
            publishedAt
          ]
        )

        const articleId = result.insertId

        // 处理标签关联
        if (validatedData.tag_ids && validatedData.tag_ids.length > 0) {
          await this.setArticleTags(connection, articleId, validatedData.tag_ids)
        }

        await connection.commit()

        return await this.getArticleById(articleId)
      } catch (error) {
        await connection.rollback()
        throw error
      } finally {
        connection.release()
      }
    } catch (error) {
      console.error('创建文章失败:', error)
      throw error
    }
  }

  // 更新文章
  async updateArticle(id, articleData) {
    try {
      // 验证数据
      const validatedData = articleSchema.parse(articleData)

      // XSS 过滤
      const safeContent = validatedData.content ? xssFilter.sanitize(validatedData.content) : null

      // 自动提取摘要（如果用户没有输入）
      let summary = validatedData.summary
      if (!summary && safeContent) {
        summary = extractSummary(safeContent)
      }

      // 自动提取封面图（如果用户没有输入）
      let thumbnail = validatedData.thumbnail
      if (!thumbnail && safeContent) {
        thumbnail = extractFirstImage(safeContent)
      }
      // 如果还是没有封面图,使用占位符
      if (!thumbnail) {
        thumbnail = getRandomPlaceholder()
      }
      // 确保 thumbnail 不超过 255 字符
      if (thumbnail && thumbnail.length > 255) {
        thumbnail = null
      }

      // 处理发布时间
      let publishedAt = validatedData.published_at

      // 检查是否需要更新发布时间
      const currentArticle = await this.getArticleById(id)
      if (!currentArticle) {
        throw new Error('文章不存在')
      }

      if (validatedData.is_published && !currentArticle.is_published && !publishedAt) {
        publishedAt = new Date()
      }

      // 确保 publishedAt 是 null 而不是 undefined
      publishedAt = publishedAt || null

      // 开始事务
      const connection = await db.pool.getConnection()

      try {
        await connection.beginTransaction()

        // 更新文章
        await connection.execute(
          `
            UPDATE cms_articles
            SET title = ?, summary = ?, content = ?, thumbnail = ?, author = ?,
                category_id = ?, is_published = ?, published_at = ?
            WHERE id = ?
          `,
          [
            validatedData.title,
            summary || null,
            safeContent,
            thumbnail || null,
            validatedData.author || null,
            validatedData.category_id || null,
            validatedData.is_published ? 1 : 0,
            publishedAt,
            id
          ]
        )

        // 处理标签关联
        if (validatedData.tag_ids !== undefined) {
          await this.setArticleTags(connection, id, validatedData.tag_ids)
        }

        await connection.commit()

        return await this.getArticleById(id)
      } catch (error) {
        await connection.rollback()
        throw error
      } finally {
        connection.release()
      }
    } catch (error) {
      console.error('更新文章失败:', error)
      throw error
    }
  }

  // 删除文章
  async deleteArticle(id) {
    try {
      const [result] = await db.pool.execute('DELETE FROM cms_articles WHERE id = ?', [id])
      return result.affectedRows > 0
    } catch (error) {
      console.error('删除文章失败:', error)
      throw error
    }
  }

  // 获取文章标签
  async getArticleTags(articleId) {
    try {
      const [rows] = await db.pool.execute(
        `
          SELECT t.*
          FROM cms_tags t
          JOIN cms_article_tags at ON t.id = at.tag_id
          WHERE at.article_id = ?
          ORDER BY t.id ASC
        `,
        [articleId]
      )
      return rows
    } catch (error) {
      console.error('获取文章标签失败:', error)
      throw error
    }
  }

  // 设置文章标签
  async setArticleTags(connection, articleId, tagIds) {
    try {
      // 删除现有标签关联
      await connection.execute('DELETE FROM cms_article_tags WHERE article_id = ?', [articleId])

      // 添加新标签关联
      if (tagIds && tagIds.length > 0) {
        const values = tagIds.map(tagId => [articleId, tagId])
        const placeholders = values.map(() => '(?, ?)').join(',')
        const params = values.flat()

        await connection.execute(
          `INSERT INTO cms_article_tags (article_id, tag_id) VALUES ${placeholders}`,
          params
        )
      }
    } catch (error) {
      console.error('设置文章标签失败:', error)
      throw error
    }
  }

  // 根据分类获取文章
  async getArticlesByCategory(categoryId, page = 1, pageSize = 12) {
    try {
      const offset = (page - 1) * pageSize

      const rows = await db.query(
        `
          SELECT a.*, c.name as category_name
          FROM cms_articles a
          LEFT JOIN cms_categories c ON a.category_id = c.id
          WHERE a.category_id = ${parseInt(categoryId)} AND a.is_published = 1
          ORDER BY a.published_at DESC, a.created_at DESC
          LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}
        `
      )

      // 获取文章总数
      const countResult = await db.query(
        `SELECT COUNT(*) as total FROM cms_articles WHERE category_id = ${parseInt(categoryId)} AND is_published = 1`
      )

      // 为每篇文章获取标签
      const articlesWithTags = await Promise.all(
        rows.map(async article => {
          const tags = await this.getArticleTags(article.id)
          return { ...article, tags }
        })
      )

      return {
        articles: articlesWithTags,
        pagination: {
          page,
          pageSize,
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / pageSize)
        }
      }
    } catch (error) {
      console.error('根据分类获取文章失败:', error)
      throw error
    }
  }
}

module.exports = new ArticleService()
