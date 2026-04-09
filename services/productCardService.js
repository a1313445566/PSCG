const { z } = require('zod')
const db = require('./database')

const createCardSchema = z
  .object({
    title: z.string().min(1).max(100),
    description: z.string().max(200).nullish(),
    icon_type: z.enum(['element-plus', 'custom']),
    icon_name: z.string().max(50).nullish(),
    icon_url: z.string().max(255).nullish(),
    icon_class: z.string().max(50).nullish(),
    link_type: z.enum(['route', 'url']),
    link_value: z.string().min(1).max(255),
    tag: z.string().max(20).nullish(),
    sort_order: z.number().int().default(0),
    is_visible: z
      .union([z.boolean(), z.number().int()])
      .transform(v => !!v)
      .default(true)
  })
  .refine(
    data => {
      if (data.icon_type === 'element-plus' && !data.icon_name) {
        return false
      }
      if (data.icon_type === 'custom' && !data.icon_url) {
        return false
      }
      return true
    },
    {
      message: '根据图标类型，必须填写图标名称或图标URL'
    }
  )

const updateCardSchema = z
  .object({
    title: z.string().min(1).max(100).nullish(),
    description: z.string().max(200).nullish(),
    icon_type: z.enum(['element-plus', 'custom']).nullish(),
    icon_name: z.string().max(50).nullish(),
    icon_url: z.string().max(255).nullish(),
    icon_class: z.string().max(50).nullish(),
    link_type: z.enum(['route', 'url']).nullish(),
    link_value: z.string().min(1).max(255).nullish(),
    tag: z.string().max(20).nullish(),
    sort_order: z.number().int().nullish(),
    is_visible: z
      .union([z.boolean(), z.number().int()])
      .transform(v => !!v)
      .nullish()
  })
  .refine(
    data => {
      if (data.icon_type === 'element-plus' && !data.icon_name) {
        return false
      }
      if (data.icon_type === 'custom' && !data.icon_url) {
        return false
      }
      return true
    },
    {
      message: '根据图标类型，必须填写图标名称或图标URL'
    }
  )

const defaultProductCards = [
  {
    title: '课程管理',
    description: '让课程管理更简单高效',
    icon_type: 'element-plus',
    icon_name: 'Reading',
    icon_class: null,
    link_type: 'route',
    link_value: '/courses',
    tag: null,
    sort_order: 1,
    is_visible: true
  },
  {
    title: '班级管理',
    description: '轻松管理班级信息',
    icon_type: 'element-plus',
    icon_name: 'UserFilled',
    icon_class: 'card-icon--purple',
    link_type: 'route',
    link_value: '/classes',
    tag: null,
    sort_order: 2,
    is_visible: true
  },
  {
    title: '数据统计',
    description: '实时查看学习数据',
    icon_type: 'element-plus',
    icon_name: 'DataAnalysis',
    icon_class: 'card-icon--pink',
    link_type: 'route',
    link_value: '/statistics',
    tag: null,
    sort_order: 3,
    is_visible: true
  },
  {
    title: 'AI 辅导',
    description: '智能辅导学习',
    icon_type: 'element-plus',
    icon_name: 'Monitor',
    icon_class: 'card-icon--green',
    link_type: 'route',
    link_value: '/ai-tutor',
    tag: 'hot',
    sort_order: 4,
    is_visible: true
  },
  {
    title: '智能推荐',
    description: '个性化学习推荐',
    icon_type: 'element-plus',
    icon_name: 'MagicStick',
    icon_class: 'card-icon--orange',
    link_type: 'route',
    link_value: '/recommendations',
    tag: null,
    sort_order: 5,
    is_visible: true
  },
  {
    title: '知识图谱',
    description: '构建知识网络',
    icon_type: 'element-plus',
    icon_name: 'Connection',
    icon_class: 'card-icon--indigo',
    link_type: 'route',
    link_value: '/knowledge-graph',
    tag: null,
    sort_order: 6,
    is_visible: true
  }
]

class ProductCardService {
  async getVisibleCards() {
    const [rows] = await db.pool.execute(`
      SELECT id, title, description, icon_type, icon_name, icon_url, icon_class,
             link_type, link_value, tag, sort_order,
             CAST(is_visible AS SIGNED) as is_visible
      FROM product_cards
      WHERE is_visible = 1
      ORDER BY sort_order ASC, id ASC
    `)
    return rows
  }

  async getAllCards() {
    const [rows] = await db.pool.execute(`
      SELECT id, title, description, icon_type, icon_name, icon_url, icon_class,
             link_type, link_value, tag, sort_order,
             CAST(is_visible AS SIGNED) as is_visible,
             created_at, updated_at
      FROM product_cards
      ORDER BY sort_order ASC, id ASC
    `)
    return rows
  }

  async createCard(data) {
    const validatedData = createCardSchema.parse(data)

    const [result] = await db.pool.execute(
      `INSERT INTO product_cards (title, description, icon_type, icon_name, icon_url, icon_class, link_type, link_value, tag, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        validatedData.title,
        validatedData.description,
        validatedData.icon_type,
        validatedData.icon_name,
        validatedData.icon_url,
        validatedData.icon_class,
        validatedData.link_type,
        validatedData.link_value,
        validatedData.tag,
        validatedData.sort_order,
        (validatedData.is_visible ?? true) ? 1 : 0
      ]
    )

    const [newCard] = await db.pool.execute(
      `
      SELECT id, title, description, icon_type, icon_name, icon_url, icon_class,
             link_type, link_value, tag, sort_order,
             CAST(is_visible AS SIGNED) as is_visible,
             created_at, updated_at
      FROM product_cards WHERE id = ?`,
      [result.insertId]
    )

    return newCard[0]
  }

  async updateCard(id, data) {
    const [existing] = await db.pool.execute('SELECT id FROM product_cards WHERE id = ?', [id])

    if (existing.length === 0) {
      throw new Error('卡片不存在')
    }

    const validatedData = updateCardSchema.parse(data)

    const fields = []
    const values = []

    if (validatedData.title !== undefined) {
      fields.push('title = ?')
      values.push(validatedData.title)
    }
    if (validatedData.description !== undefined) {
      fields.push('description = ?')
      values.push(validatedData.description)
    }
    if (validatedData.icon_type !== undefined) {
      fields.push('icon_type = ?')
      values.push(validatedData.icon_type)
    }
    if (validatedData.icon_name !== undefined) {
      fields.push('icon_name = ?')
      values.push(validatedData.icon_name)
    }
    if (validatedData.icon_url !== undefined) {
      fields.push('icon_url = ?')
      values.push(validatedData.icon_url)
    }
    if (validatedData.icon_class !== undefined) {
      fields.push('icon_class = ?')
      values.push(validatedData.icon_class)
    }
    if (validatedData.link_type !== undefined) {
      fields.push('link_type = ?')
      values.push(validatedData.link_type)
    }
    if (validatedData.link_value !== undefined) {
      fields.push('link_value = ?')
      values.push(validatedData.link_value)
    }
    if (validatedData.tag !== undefined) {
      fields.push('tag = ?')
      values.push(validatedData.tag)
    }
    if (validatedData.sort_order !== undefined) {
      fields.push('sort_order = ?')
      values.push(validatedData.sort_order)
    }
    if (validatedData.is_visible !== undefined) {
      fields.push('is_visible = ?')
      values.push((validatedData.is_visible ?? true) ? 1 : 0)
    }

    if (fields.length === 0) {
      throw new Error('没有提供需要更新的字段')
    }

    values.push(id)
    await db.pool.execute(`UPDATE product_cards SET ${fields.join(', ')} WHERE id = ?`, values)

    const [updatedCard] = await db.pool.execute(
      `
      SELECT id, title, description, icon_type, icon_name, icon_url, icon_class,
             link_type, link_value, tag, sort_order,
             CAST(is_visible AS SIGNED) as is_visible,
             created_at, updated_at
      FROM product_cards WHERE id = ?`,
      [id]
    )

    return updatedCard[0]
  }

  async deleteCard(id) {
    const [existing] = await db.pool.execute('SELECT id FROM product_cards WHERE id = ?', [id])

    if (existing.length === 0) {
      throw new Error('卡片不存在')
    }

    await db.pool.execute('DELETE FROM product_cards WHERE id = ?', [id])
  }

  async updateSortOrder(cards) {
    const connection = await db.pool.getConnection()

    try {
      await connection.beginTransaction()

      for (const card of cards) {
        await connection.execute('UPDATE product_cards SET sort_order = ? WHERE id = ?', [
          card.sort_order,
          card.id
        ])
      }

      await connection.commit()
      return { updated: cards.length }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  async initDefaultData() {
    try {
      const [countResult] = await db.pool.execute('SELECT COUNT(*) as count FROM product_cards')

      if (countResult[0].count === 0) {
        for (const card of defaultProductCards) {
          await db.pool.execute(
            `INSERT INTO product_cards (title, description, icon_type, icon_name, icon_url, icon_class, link_type, link_value, tag, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              card.title,
              card.description ?? null,
              card.icon_type,
              card.icon_name ?? null,
              card.icon_url ?? null,
              card.icon_class ?? null,
              card.link_type,
              card.link_value,
              card.tag ?? null,
              card.sort_order,
              (card.is_visible ?? true) ? 1 : 0
            ]
          )
        }
        console.log('✅ 已初始化默认产品卡片数据（共 6 条）')
      }
    } catch (error) {
      console.error('初始化默认产品卡片数据失败:', error)
      throw error
    }
  }
}

module.exports = new ProductCardService()
