const db = require('./database')
const { z } = require('zod')

// 标签数据验证 schema
const tagSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50)
})

class TagService {
  // 获取所有标签
  async getAllTags() {
    try {
      const [rows] = await db.pool.execute('SELECT * FROM cms_tags ORDER BY id ASC')
      return rows
    } catch (error) {
      console.error('获取标签列表失败:', error)
      throw error
    }
  }

  // 根据 ID 获取标签
  async getTagById(id) {
    try {
      const [rows] = await db.pool.execute('SELECT * FROM cms_tags WHERE id = ?', [id])
      return rows[0] || null
    } catch (error) {
      console.error('获取标签详情失败:', error)
      throw error
    }
  }

  // 创建标签
  async createTag(tagData) {
    try {
      // 验证数据
      const validatedData = tagSchema.parse(tagData)

      const [result] = await db.pool.execute('INSERT INTO cms_tags (name, slug) VALUES (?, ?)', [
        validatedData.name,
        validatedData.slug
      ])

      return await this.getTagById(result.insertId)
    } catch (error) {
      console.error('创建标签失败:', error)
      throw error
    }
  }

  // 更新标签
  async updateTag(id, tagData) {
    try {
      // 验证数据
      const validatedData = tagSchema.parse(tagData)

      await db.pool.execute('UPDATE cms_tags SET name = ?, slug = ? WHERE id = ?', [
        validatedData.name,
        validatedData.slug,
        id
      ])

      return await this.getTagById(id)
    } catch (error) {
      console.error('更新标签失败:', error)
      throw error
    }
  }

  // 删除标签
  async deleteTag(id) {
    try {
      const [result] = await db.pool.execute('DELETE FROM cms_tags WHERE id = ?', [id])
      return result.affectedRows > 0
    } catch (error) {
      console.error('删除标签失败:', error)
      throw error
    }
  }

  // 检查标签是否存在
  async tagExists(id) {
    try {
      const [rows] = await db.pool.execute('SELECT id FROM cms_tags WHERE id = ?', [id])
      return rows.length > 0
    } catch (error) {
      console.error('检查标签是否存在失败:', error)
      throw error
    }
  }

  // 检查 slug 是否已存在
  async slugExists(slug, excludeId = null) {
    try {
      const params = [slug]
      let query = 'SELECT id FROM cms_tags WHERE slug = ?'

      if (excludeId) {
        query += ' AND id != ?'
        params.push(excludeId)
      }

      const [rows] = await db.pool.execute(query, params)
      return rows.length > 0
    } catch (error) {
      console.error('检查 slug 是否存在失败:', error)
      throw error
    }
  }

  // 根据 ID 列表获取标签
  async getTagsByIds(ids) {
    try {
      if (!ids || ids.length === 0) {
        return []
      }

      const placeholders = ids.map(() => '?').join(',')
      const [rows] = await db.pool.execute(
        `SELECT * FROM cms_tags WHERE id IN (${placeholders})`,
        ids
      )
      return rows
    } catch (error) {
      console.error('根据 ID 列表获取标签失败:', error)
      throw error
    }
  }
}

module.exports = new TagService()
