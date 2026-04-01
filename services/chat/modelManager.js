/**
 * AI 模型管理服务
 * 文件: services/chat/modelManager.js
 * 功能: 模型配置管理、缓存、成本计算
 */

const db = require('../database')
const crypto = require('crypto')

// 缓存配置
const modelCache = new Map()
const CACHE_TTL = 60000 // 60秒

/**
 * 字段映射（数据库字段 → 代码字段）
 */
function mapModelFields(dbModel) {
  return {
    ...dbModel,
    // 字段映射（兼容性处理）
    base_url: dbModel.api_url, // 数据库中是api_url，映射为base_url
    api_key: dbModel.api_key_encrypted, // 数据库中是api_key_encrypted，映射为api_key
    is_default: dbModel.is_primary || 0, // 数据库中是is_primary，映射为is_default
    is_active: dbModel.is_enabled !== undefined ? dbModel.is_enabled : 1, // 数据库中是is_enabled，映射为is_active
    // 成本字段（可选）
    max_tokens: dbModel.max_tokens || 4096,
    temperature: dbModel.temperature || 0.7,
    cost_per_1k_input: parseFloat(dbModel.cost_per_1k_input) || 0,
    cost_per_1k_output: parseFloat(dbModel.cost_per_1k_output) || 0
  }
}

/**
 * 加密 API Key
 */
function encryptApiKey(apiKey) {
  if (!apiKey) return apiKey

  try {
    const algorithm = 'aes-256-cbc'
    // ✅ 使用与 adminAuth.js 相同的 JWT_SECRET 默认值
    const secret = process.env.JWT_SECRET || 'pscg-admin-secret-key-change-in-production'
    const key = crypto.scryptSync(secret, 'salt', 32)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(algorithm, key, iv)

    let encrypted = cipher.update(apiKey, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    return iv.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('[ModelManager] 加密失败:', error)
    return apiKey
  }
}

/**
 * 解密 API Key
 */
function decryptApiKey(encryptedKey) {
  if (!encryptedKey) return encryptedKey

  try {
    const algorithm = 'aes-256-cbc'
    // ✅ 使用与 adminAuth.js 相同的 JWT_SECRET 默认值
    const secret = process.env.JWT_SECRET || 'pscg-admin-secret-key-change-in-production'
    const key = crypto.scryptSync(secret, 'salt', 32)

    // ✅ 只按第一个冒号分割（加密数据可能包含冒号）
    const colonIndex = encryptedKey.indexOf(':')
    if (colonIndex === -1) {
      console.warn('[ModelManager] API Key 未加密或格式错误')
      return encryptedKey // 未加密
    }

    const iv = Buffer.from(encryptedKey.substring(0, colonIndex), 'hex')
    const encrypted = encryptedKey.substring(colonIndex + 1)
    const decipher = crypto.createDecipheriv(algorithm, key, iv)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    // ✅ 验证解密后的 API key 格式
    if (!decrypted || decrypted.length < 10) {
      console.error('[ModelManager] 解密后的 API Key 格式无效')
      return null
    }

    return decrypted
  } catch (error) {
    console.error('[ModelManager] 解密失败:', error.message)
    return encryptedKey
  }
}

/**
 * 获取模型列表（分页）
 */
async function getModels(page = 1, limit = 12) {
  // 确保 page 和 limit 是整数
  const safePage = parseInt(page) || 1
  const safeLimit = parseInt(limit) || 12
  const offset = (safePage - 1) * safeLimit

  // 使用模板字符串拼接 SQL（避免 prepared statement 对 LIMIT/OFFSET 的限制）
  const sql = `
    SELECT
      id, name, provider,
      api_url,
      model_id,
      is_primary,
      is_enabled,
      IFNULL(max_tokens, 4096) as max_tokens,
      IFNULL(temperature, 0.7) as temperature,
      IFNULL(cost_per_1k_input, 0) as cost_per_1k_input,
      IFNULL(cost_per_1k_output, 0) as cost_per_1k_output,
      config,
      created_at, updated_at
    FROM ai_models
    ORDER BY is_primary DESC, created_at DESC
    LIMIT ${safeLimit} OFFSET ${offset}
  `

  const models = await db.query(sql)

  // 统计总数
  const countSQL = 'SELECT COUNT(*) as total FROM ai_models'
  const countResult = await db.get(countSQL)

  // 字段映射
  const processedModels = models.map(model => mapModelFields(model))

  return {
    list: processedModels,
    total: countResult.total,
    page,
    limit
  }
}

/**
 * 获取单个模型（含解密后的 API Key）
 */
async function getModel(modelId) {
  // 检查缓存
  const cacheKey = `model:${modelId}`
  const cached = modelCache.get(cacheKey)
  if (cached && Date.now() < cached.expiry) {
    return cached.data
  }

  const sql = `
    SELECT
      *,
      IFNULL(max_tokens, 4096) as max_tokens,
      IFNULL(temperature, 0.7) as temperature,
      IFNULL(cost_per_1k_input, 0) as cost_per_1k_input,
      IFNULL(cost_per_1k_output, 0) as cost_per_1k_output
    FROM ai_models
    WHERE id = ?
  `
  const model = await db.get(sql, [modelId])

  if (!model) return null

  // 字段映射
  const mappedModel = mapModelFields(model)

  // 解密 API Key
  mappedModel.api_key = decryptApiKey(mappedModel.api_key)

  // 保存缓存
  modelCache.set(cacheKey, {
    data: mappedModel,
    expiry: Date.now() + CACHE_TTL
  })

  return mappedModel
}

/**
 * 获取默认模型
 */
async function getDefaultModel() {
  const cacheKey = 'default_model'
  const cached = modelCache.get(cacheKey)
  if (cached && Date.now() < cached.expiry) {
    console.log('[ModelManager] 从缓存返回默认模型')
    return cached.data
  }

  // ✅ 使用数据库实际字段名
  const sql = `
    SELECT
      *,
      IFNULL(max_tokens, 4096) as max_tokens,
      IFNULL(temperature, 0.7) as temperature,
      IFNULL(cost_per_1k_input, 0) as cost_per_1k_input,
      IFNULL(cost_per_1k_output, 0) as cost_per_1k_output
    FROM ai_models
    WHERE is_primary = 1 AND is_enabled = 1
    LIMIT 1
  `
  const model = await db.get(sql)

  if (!model) return null

  // 字段映射
  const mappedModel = mapModelFields(model)

  // 解密 API Key
  console.log(
    '[ModelManager] getDefaultModel - 加密的 API Key (前30字符):',
    mappedModel.api_key?.substring(0, 30)
  )
  mappedModel.api_key = decryptApiKey(mappedModel.api_key)
  console.log(
    '[ModelManager] getDefaultModel - 解密后的 API Key (前20字符):',
    mappedModel.api_key?.substring(0, 20)
  )

  // 保存缓存
  modelCache.set(cacheKey, {
    data: mappedModel,
    expiry: Date.now() + CACHE_TTL
  })

  return mappedModel
}

/**
 * 保存模型（添加或更新）
 */
async function saveModel(modelData) {
  const {
    id,
    name,
    provider,
    base_url,
    api_key,
    model_id,
    config,
    is_active,
    is_default,
    max_tokens,
    temperature,
    cost_per_1k_input,
    cost_per_1k_output
  } = modelData

  // 加密 API Key
  const encryptedKey = encryptApiKey(api_key)

  if (id) {
    // 更新模型
    const sql = `
      UPDATE ai_models SET
        name = ?,
        provider = ?,
        api_url = ?,
        api_key_encrypted = ?,
        model_id = ?,
        config = ?,
        is_enabled = ?,
        is_primary = ?,
        max_tokens = ?,
        temperature = ?,
        cost_per_1k_input = ?,
        cost_per_1k_output = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    await db.run(sql, [
      name,
      provider,
      base_url,
      encryptedKey,
      model_id,
      JSON.stringify(config || {}),
      is_active !== undefined ? is_active : 1,
      is_default !== undefined ? is_default : 0,
      max_tokens || 4096,
      temperature || 0.7,
      cost_per_1k_input || 0,
      cost_per_1k_output || 0,
      id
    ])

    // 清除缓存
    modelCache.delete(`model:${id}`)
    modelCache.delete('default_model')

    return { id, ...modelData }
  } else {
    // 添加模型
    const sql = `
      INSERT INTO ai_models (name, provider, api_url, api_key_encrypted, model_id, config, is_enabled, is_primary, max_tokens, temperature, cost_per_1k_input, cost_per_1k_output)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    const result = await db.run(sql, [
      name,
      provider,
      base_url,
      encryptedKey,
      model_id,
      JSON.stringify(config || {}),
      is_active !== undefined ? is_active : 1,
      is_default !== undefined ? is_default : 0,
      max_tokens || 4096,
      temperature || 0.7,
      cost_per_1k_input || 0,
      cost_per_1k_output || 0
    ])

    // 清除缓存
    modelCache.delete('default_model')

    return { id: result.insertId, ...modelData }
  }
}

/**
 * 删除模型
 */
async function deleteModel(modelId) {
  const sql = 'DELETE FROM ai_models WHERE id = ?'
  await db.run(sql, [modelId])

  // 清除缓存
  modelCache.delete(`model:${modelId}`)
  modelCache.delete('default_model')
}

/**
 * 设置默认模型
 */
async function setDefaultModel(modelId) {
  // 清除所有默认
  await db.run('UPDATE ai_models SET is_primary = 0')

  // 设置新默认
  await db.run('UPDATE ai_models SET is_primary = 1 WHERE id = ?', [modelId])

  // 清除缓存
  modelCache.delete('default_model')
}

/**
 * 测试模型连接
 */
async function testModelConnection(modelId) {
  const model = await getModel(modelId)
  if (!model) {
    throw new Error('模型不存在')
  }

  console.log('[ModelManager] 测试模型连接:', {
    id: model.id,
    name: model.name,
    base_url: model.base_url,
    api_key_prefix: model.api_key?.substring(0, 10) + '...'
  })

  try {
    // 简单的连接测试
    const testUrl = `${model.base_url}/models`
    console.log('[ModelManager] 测试 URL:', testUrl)

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${model.api_key}`
      }
    })

    console.log('[ModelManager] 响应状态:', response.status, response.statusText)

    if (response.ok) {
      const data = await response.json()
      console.log('[ModelManager] 测试成功，返回数据:', data)
      return { success: true, message: '连接成功' }
    } else {
      const errorText = await response.text()
      console.error('[ModelManager] 测试失败:', response.status, errorText)
      return {
        success: false,
        message: `连接失败: ${response.status} ${response.statusText}`,
        details: errorText
      }
    }
  } catch (error) {
    console.error('[ModelManager] 连接测试异常:', error)
    return {
      success: false,
      message: `连接异常: ${error.message}`,
      details: error.stack
    }
  }
}

/**
 * 计算模型使用成本
 */
async function calculateModelCost(modelId, inputTokens, outputTokens) {
  const model = await getModel(modelId)
  if (!model) return 0

  const inputCost = (inputTokens / 1000) * model.cost_per_1k_input
  const outputCost = (outputTokens / 1000) * model.cost_per_1k_output

  return inputCost + outputCost
}

/**
 * 获取模型统计信息
 */
async function getModelStats() {
  const totalSQL = 'SELECT COUNT(*) as total FROM ai_models'

  // ✅ 使用数据库实际字段名
  const activeSQL = 'SELECT COUNT(*) as active FROM ai_models WHERE is_enabled = 1'
  const defaultSQL = 'SELECT name FROM ai_models WHERE is_primary = 1 LIMIT 1'

  const [total, active, defaultModel] = await Promise.all([
    db.get(totalSQL),
    db.get(activeSQL),
    db.get(defaultSQL)
  ])

  return {
    total: total.total,
    active: active.active,
    defaultModel: defaultModel?.name || '未设置'
  }
}

/**
 * 清除缓存
 */
function clearCache() {
  modelCache.clear()
  console.log('[ModelManager] 缓存已清除')
}

module.exports = {
  getModels,
  getModel,
  getDefaultModel,
  saveModel,
  deleteModel,
  setDefaultModel,
  testModelConnection,
  calculateModelCost,
  getModelStats,
  clearCache,
  encryptApiKey,
  decryptApiKey
}
