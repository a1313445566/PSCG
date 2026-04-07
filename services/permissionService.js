const { z } = require('zod')
const db = require('./database')
const { hashPassword, verifyPassword } = require('./passwordHash')

const roleSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(255).optional(),
  permissions: z.record(z.record(z.boolean()))
})

const adminUserSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(6).optional(),
  role_id: z.number().int().positive()
})

const permissionService = {
  async getRoles(page = 1, limit = 20) {
    const offset = (page - 1) * limit

    // MySQL 不支持在 LIMIT/OFFSET 中使用参数化，需用字符串拼接（已做 parseInt 安全处理）
    const safeLimit = Math.max(1, Math.min(parseInt(limit), 100))
    const safeOffset = parseInt(offset) || 0

    const [rows] = await db.pool.execute(
      `SELECT id, name, description, permissions, is_preset, created_at, updated_at FROM admin_roles ORDER BY id ASC LIMIT ${safeLimit} OFFSET ${safeOffset}`
    )

    const [countResult] = await db.pool.execute('SELECT COUNT(*) as total FROM admin_roles')

    return {
      data: rows,
      total: countResult[0].total,
      page,
      limit
    }
  },

  async getRoleById(id) {
    const [rows] = await db.pool.execute(
      'SELECT id, name, description, permissions, is_preset, created_at, updated_at FROM admin_roles WHERE id = ?',
      [id]
    )
    return rows[0] || null
  },

  async createRole(data) {
    const validated = roleSchema.parse(data)
    const [result] = await db.pool.execute(
      'INSERT INTO admin_roles (name, description, permissions, is_preset) VALUES (?, ?, ?, 0)',
      [validated.name, validated.description || '', JSON.stringify(validated.permissions)]
    )
    return this.getRoleById(result.insertId)
  },

  async updateRole(id, data) {
    const validated = roleSchema.partial().parse(data)
    const updateFields = []
    const updateValues = []

    if (validated.name !== undefined) {
      updateFields.push('name = ?')
      updateValues.push(validated.name)
    }
    if (validated.description !== undefined) {
      updateFields.push('description = ?')
      updateValues.push(validated.description)
    }
    if (validated.permissions !== undefined) {
      updateFields.push('permissions = ?')
      updateValues.push(JSON.stringify(validated.permissions))
    }

    if (updateFields.length === 0) {
      return this.getRoleById(id)
    }

    updateValues.push(id)

    await db.pool.execute(
      `UPDATE admin_roles SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )
    return this.getRoleById(id)
  },

  async deleteRole(id) {
    const [result] = await db.pool.execute(
      'DELETE FROM admin_roles WHERE id = ? AND is_preset = 0',
      [id]
    )
    return result.affectedRows > 0
  },

  async getAdminUsers(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit
    let whereClause = 'WHERE 1=1'
    const whereValues = []

    if (filters.status) {
      whereClause += ' AND a.status = ?'
      whereValues.push(filters.status)
    }
    if (filters.role_id) {
      whereClause += ' AND a.role_id = ?'
      whereValues.push(filters.role_id)
    }

    // MySQL 不支持在 LIMIT/OFFSET 中使用参数化，需用字符串拼接（已做 parseInt 安全处理）
    const safeLimit = Math.max(1, Math.min(parseInt(limit), 100))
    const safeOffset = parseInt(offset) || 0

    const [rows] = await db.pool.execute(
      `SELECT a.id, a.username, a.status, a.role_id, a.created_at, a.last_login_at,
              r.name as role_name, r.is_preset as role_is_preset
       FROM admin_credentials a
       LEFT JOIN admin_roles r ON a.role_id = r.id
       ${whereClause}
       ORDER BY a.id DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      whereValues
    )

    const [countResult] = await db.pool.execute(
      `SELECT COUNT(*) as total FROM admin_credentials a ${whereClause}`,
      whereValues
    )

    return {
      data: rows,
      total: countResult[0].total,
      page,
      limit
    }
  },

  async getAdminUserById(id) {
    const [rows] = await db.pool.execute(
      `SELECT a.id, a.username, a.status, a.role_id, a.created_at, a.last_login_at,
              r.name as role_name, r.permissions, r.is_preset as role_is_preset
       FROM admin_credentials a
       LEFT JOIN admin_roles r ON a.role_id = r.id
       WHERE a.id = ?`,
      [id]
    )
    return rows[0] || null
  },

  async createAdminUser(data, createdBy) {
    const validated = adminUserSchema.parse(data)
    const passwordHash = await hashPassword(validated.password)

    const [result] = await db.pool.execute(
      'INSERT INTO admin_credentials (username, password_hash, role_id, created_by) VALUES (?, ?, ?, ?)',
      [validated.username, passwordHash, validated.role_id, createdBy]
    )
    return this.getAdminUserById(result.insertId)
  },

  async updateAdminUser(id, data) {
    const updateFields = []
    const updateValues = []

    if (data.username !== undefined) {
      updateFields.push('username = ?')
      updateValues.push(data.username)
    }
    if (data.role_id !== undefined) {
      updateFields.push('role_id = ?')
      updateValues.push(data.role_id)
    }
    if (data.status !== undefined) {
      updateFields.push('status = ?')
      updateValues.push(data.status)
    }

    if (updateFields.length === 0) {
      return this.getAdminUserById(id)
    }

    updateValues.push(id)

    await db.pool.execute(
      `UPDATE admin_credentials SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )
    return this.getAdminUserById(id)
  },

  async resetAdminUserPassword(id, newPassword) {
    const passwordHash = await hashPassword(newPassword)

    await db.pool.execute('UPDATE admin_credentials SET password_hash = ? WHERE id = ?', [
      passwordHash,
      id
    ])
    return true
  },

  async deleteAdminUser(id, currentAdminId) {
    if (id === currentAdminId) {
      throw new Error('不能删除自己')
    }
    
    // 保护默认超级管理员账号
    const [userRows] = await db.pool.execute(
      'SELECT username FROM admin_credentials WHERE id = ?',
      [id]
    )
    const user = userRows[0]
    if (user && user.username === 'admin') {
      throw new Error('默认超级管理员不能删除')
    }
    
    const [result] = await db.pool.execute('DELETE FROM admin_credentials WHERE id = ?', [id])
    return result.affectedRows > 0
  }
}

module.exports = permissionService
