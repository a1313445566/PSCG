const db = require('./database')
const { z } = require('zod')

// 分类数据验证 schema
const categorySchema = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  sort_order: z.number().default(0)
})

class CategoryService {
  // 获取所有分类
  async getAllCategories() {
    try {
      const [rows] = await db.pool.execute(
        'SELECT * FROM cms_categories ORDER BY sort_order ASC, id ASC'
      )
      return rows
    } catch (error) {
      console.error('获取分类列表失败:', error)
      throw error
    }
  }

  // 根据 ID 获取分类
  async getCategoryById(id) {
    try {
      const [rows] = await db.pool.execute('SELECT * FROM cms_categories WHERE id = ?', [id])
      return rows[0] || null
    } catch (error) {
      console.error('获取分类详情失败:', error)
      throw error
    }
  }

  // 创建分类
  async createCategory(categoryData) {
    try {
      // 验证数据
      const validatedData = categorySchema.parse(categoryData)

      const [result] = await db.pool.execute(
        'INSERT INTO cms_categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)',
        [
          validatedData.name,
          validatedData.slug,
          validatedData.description || null,
          validatedData.sort_order
        ]
      )

      return await this.getCategoryById(result.insertId)
    } catch (error) {
      console.error('创建分类失败:', error)
      throw error
    }
  }

  // 更新分类
  async updateCategory(id, categoryData) {
    try {
      // 验证数据
      const validatedData = categorySchema.parse(categoryData)

      await db.pool.execute(
        'UPDATE cms_categories SET name = ?, slug = ?, description = ?, sort_order = ? WHERE id = ?',
        [
          validatedData.name,
          validatedData.slug,
          validatedData.description || null,
          validatedData.sort_order,
          id
        ]
      )

      return await this.getCategoryById(id)
    } catch (error) {
      console.error('更新分类失败:', error)
      throw error
    }
  }

  // 删除分类
  async deleteCategory(id) {
    try {
      const [result] = await db.pool.execute('DELETE FROM cms_categories WHERE id = ?', [id])
      return result.affectedRows > 0
    } catch (error) {
      console.error('删除分类失败:', error)
      throw error
    }
  }

  // 检查分类是否存在
  async categoryExists(id) {
    try {
      const [rows] = await db.pool.execute('SELECT id FROM cms_categories WHERE id = ?', [id])
      return rows.length > 0
    } catch (error) {
      console.error('检查分类是否存在失败:', error)
      throw error
    }
  }

  // 检查 slug 是否已存在
  async slugExists(slug, excludeId = null) {
    try {
      const params = [slug]
      let query = 'SELECT id FROM cms_categories WHERE slug = ?'

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
}

module.exports = new CategoryService()
