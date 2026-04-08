const { z } = require('zod')
const db = require('./database')

// Zod 参数校验 schema
const menuSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['route', 'link']),
  path: z.string().min(1).max(500),
  icon: z.string().max(50).optional().nullable(),
  sort_order: z.number().int().default(0),
  is_visible: z.preprocess(val => {
    if (typeof val === 'boolean') return val
    if (typeof val === 'number') return val === 1
    return true
  }, z.boolean().default(true))
})

const updateMenuSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(['route', 'link']).optional(),
  path: z.string().min(1).max(500).optional(),
  icon: z.string().max(50).nullable().optional(),
  sort_order: z.number().int().optional(),
  is_visible: z.preprocess(val => {
    if (typeof val === 'boolean') return val
    if (typeof val === 'number') return val === 1
    return true
  }, z.boolean().optional())
})

const navigationService = {
  // 获取所有菜单（按排序字段排序）
  async getMenus() {
    const [rows] = await db.pool.execute(
      'SELECT id, name, type, path, icon, sort_order, is_visible, created_at, updated_at FROM navigation_menus ORDER BY sort_order ASC, id ASC'
    )
    return rows
  },

  // 获取可见的菜单（用于前端导航栏展示）
  async getVisibleMenus() {
    const [rows] = await db.pool.execute(
      'SELECT id, name, type, path, icon, sort_order FROM navigation_menus WHERE is_visible = 1 ORDER BY sort_order ASC, id ASC'
    )
    return rows
  },

  // 根据 ID 获取单个菜单
  async getMenuById(id) {
    const [rows] = await db.pool.execute(
      'SELECT id, name, type, path, icon, sort_order, is_visible, created_at, updated_at FROM navigation_menus WHERE id = ?',
      [id]
    )
    return rows[0] || null
  },

  // 创建新菜单
  async createMenu(data) {
    const validated = menuSchema.parse(data)

    const [result] = await db.pool.execute(
      'INSERT INTO navigation_menus (name, type, path, icon, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, ?)',
      [
        validated.name,
        validated.type,
        validated.path,
        validated.icon || null,
        validated.sort_order,
        validated.is_visible ? 1 : 0
      ]
    )

    return await this.getMenuById(result.insertId)
  },

  // 更新菜单
  async updateMenu(id, data) {
    const existingMenu = await this.getMenuById(id)
    if (!existingMenu) {
      throw new Error('菜单不存在')
    }

    const validated = updateMenuSchema.parse(data)

    // 动态构建更新字段
    const updates = []
    const values = []

    if (validated.name !== undefined) {
      updates.push('name = ?')
      values.push(validated.name)
    }
    if (validated.type !== undefined) {
      updates.push('type = ?')
      values.push(validated.type)
    }
    if (validated.path !== undefined) {
      updates.push('path = ?')
      values.push(validated.path)
    }
    if (validated.icon !== undefined) {
      updates.push('icon = ?')
      values.push(validated.icon)
    }
    if (validated.sort_order !== undefined) {
      updates.push('sort_order = ?')
      values.push(validated.sort_order)
    }
    if (validated.is_visible !== undefined) {
      updates.push('is_visible = ?')
      values.push(validated.is_visible ? 1 : 0)
    }

    if (updates.length === 0) {
      return existingMenu
    }

    values.push(id)
    await db.pool.execute(`UPDATE navigation_menus SET ${updates.join(', ')} WHERE id = ?`, values)

    return await this.getMenuById(id)
  },

  // 删除菜单
  async deleteMenu(id) {
    const existingMenu = await this.getMenuById(id)
    if (!existingMenu) {
      throw new Error('菜单不存在')
    }

    await db.pool.execute('DELETE FROM navigation_menus WHERE id = ?', [id])
    return { success: true, deletedId: id }
  },

  // 批量更新排序（拖拽排序）
  async updateSortOrder(menus) {
    // 验证输入格式：数组格式 [{id: 1, sort_order: 1}, ...]
    if (!Array.isArray(menus)) {
      throw new Error('参数必须是数组格式')
    }

    const connection = await db.pool.getConnection()

    try {
      await connection.beginTransaction()

      for (const menu of menus) {
        if (!menu.id || typeof menu.sort_order !== 'number') {
          throw new Error('无效的菜单数据格式')
        }

        await connection.execute('UPDATE navigation_menus SET sort_order = ? WHERE id = ?', [
          menu.sort_order,
          menu.id
        ])
      }

      await connection.commit()
      return { success: true }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}

module.exports = navigationService
