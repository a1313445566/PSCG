# 模型管理模块优化报告

## 🔍 检查发现

### 1. 字段名不一致问题 ⚠️

**代码中的字段名**（`modelManager.js`）：
```javascript
const sql = 'SELECT * FROM ai_models WHERE id = ?'
model.api_key = decryptApiKey(model.api_key)
model.base_url = ...
model.is_default = ...
model.is_active = ...
```

**数据库实际字段名**：
```sql
CREATE TABLE ai_models (
  api_url VARCHAR(255),           -- ← 不是 base_url
  api_key_encrypted TEXT,         -- ← 不是 api_key
  is_primary TINYINT(1),          -- ← 不是 is_default
  is_enabled TINYINT(1),          -- ← 不是 is_active
  cost_per_1k_input DECIMAL(10,6),
  cost_per_1k_output DECIMAL(10,6)
)
```

**影响**：
- ❌ 查询可能失败（字段不存在）
- ❌ 成本计算缺失
- ❌ 模型优先级未使用

---

## 🎯 优化方案

### 方案 A：修改代码适配数据库（推荐）

**优点**：
- ✅ 不影响现有数据
- ✅ 利用数据库已有字段
- ✅ 支持成本计算

**修改文件**：`services/chat/modelManager.js`

#### 1. 字段映射

```javascript
/**
 * 数据库字段映射
 */
const FIELD_MAP = {
  // 数据库字段 → 代码字段
  api_url: 'base_url',
  api_key_encrypted: 'api_key',
  is_primary: 'is_default',
  is_enabled: 'is_active'
}

/**
 * 转换数据库字段为代码字段
 */
function mapModelFields(dbModel) {
  return {
    id: dbModel.id,
    name: dbModel.name,
    provider: dbModel.provider,
    model_id: dbModel.model_id,
    base_url: dbModel.api_url,           // 映射
    api_key: dbModel.api_key_encrypted,   // 映射
    is_default: dbModel.is_primary,      // 映射
    is_active: dbModel.is_enabled,       // 映射
    config: dbModel.config || {},
    // 新增成本字段
    max_tokens: dbModel.max_tokens || 4096,
    temperature: dbModel.temperature || 0.7,
    cost_per_1k_input: dbModel.cost_per_1k_input || 0,
    cost_per_1k_output: dbModel.cost_per_1k_output || 0,
    created_at: dbModel.created_at,
    updated_at: dbModel.updated_at
  }
}
```

#### 2. 获取模型列表（优化）

```javascript
async function getModels(page = 1, limit = 12) {
  const pageNum = parseInt(page) || 1
  const limitNum = parseInt(limit) || 12
  const offset = (pageNum - 1) * limitNum

  const countSQL = 'SELECT COUNT(*) as total FROM ai_models'
  const countResult = await db.get(countSQL)

  // 使用数据库字段名
  const listSQL = `
    SELECT 
      id, name, provider, 
      api_url,              -- 数据库字段
      model_id, 
      is_primary,           -- 数据库字段
      is_enabled,           -- 数据库字段
      max_tokens,
      temperature,
      cost_per_1k_input,
      cost_per_1k_output,
      config, 
      created_at, updated_at
    FROM ai_models 
    ORDER BY is_primary DESC, created_at DESC 
    LIMIT ${limitNum} OFFSET ${offset}
  `

  const models = await db.query(listSQL)

  // 字段映射
  const processedModels = models.map(model => {
    const mapped = mapModelFields(model)
    // 解密 API Key
    mapped.api_key = decryptApiKey(mapped.api_key)
    return mapped
  })

  return {
    list: processedModels,
    total: countResult.total,
    page,
    limit
  }
}
```

#### 3. 保存模型（优化）

```javascript
async function saveModel(modelData) {
  const { id, name, provider, base_url, api_key, model_id, config, is_active } = modelData

  // 加密 API Key
  const encryptedKey = encryptApiKey(api_key)
  const configJson = config ? JSON.stringify(config) : null

  if (id) {
    // 更新（使用数据库字段名）
    const updateSQL = `
      UPDATE ai_models 
      SET 
        name = ?, 
        provider = ?, 
        api_url = ?,        -- 数据库字段
        model_id = ?, 
        config = ?, 
        is_enabled = ?,     -- 数据库字段
        updated_at = NOW()
      WHERE id = ?
    `
    await db.run(updateSQL, [
      name, 
      provider, 
      base_url,     // 映射到 api_url
      model_id, 
      configJson, 
      is_active || 1, 
      id
    ])

    // 如果 API Key 不是占位符，则更新
    if (api_key && api_key !== '****') {
      const updateKeySQL = 'UPDATE ai_models SET api_key_encrypted = ? WHERE id = ?'
      await db.run(updateKeySQL, [encryptedKey, id])
    }

    return { id, ...modelData }
  } else {
    // 新增（使用数据库字段名）
    const insertSQL = `
      INSERT INTO ai_models 
      (name, provider, api_url, api_key_encrypted, model_id, config, is_enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    const result = await db.run(insertSQL, [
      name,
      provider,
      base_url,          // 映射到 api_url
      encryptedKey,      // 映射到 api_key_encrypted
      model_id,
      configJson,
      is_active || 1
    ])

    return { id: result.insertId, ...modelData }
  }
}
```

#### 4. 新增成本计算

```javascript
/**
 * 计算模型使用成本
 */
async function calculateModelCost(modelId, inputTokens, outputTokens) {
  const model = await getModel(modelId)
  if (!model) return 0

  const inputCost = (inputTokens / 1000) * (model.cost_per_1k_input || 0)
  const outputCost = (outputTokens / 1000) * (model.cost_per_1k_output || 0)

  return inputCost + outputCost
}

/**
 * 更新 Token 统计并计算成本
 */
async function recordTokenUsageWithCost(adminId, sessionId, modelId, inputTokens, outputTokens) {
  const cost = await calculateModelCost(modelId, inputTokens, outputTokens)

  const sql = `
    INSERT INTO token_usage 
    (admin_id, session_id, model_id, input_tokens, output_tokens, total_tokens, cost, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `

  await db.run(sql, [
    adminId,
    sessionId,
    modelId,
    inputTokens,
    outputTokens,
    inputTokens + outputTokens,
    cost
  ])

  return { inputTokens, outputTokens, cost }
}
```

---

### 方案 B：修改数据库适配代码（不推荐）

**缺点**：
- ❌ 需要数据迁移
- ❌ 影响生产环境
- ❌ 可能破坏现有数据

**SQL 脚本**：
```sql
-- 重命名字段
ALTER TABLE ai_models CHANGE api_url base_url VARCHAR(255);
ALTER TABLE ai_models CHANGE api_key_encrypted api_key TEXT;
ALTER TABLE ai_models CHANGE is_primary is_default TINYINT(1);
ALTER TABLE ai_models CHANGE is_enabled is_active TINYINT(1);
```

---

## 📊 其他优化建议

### 1. 缓存优化

**当前问题**：
```javascript
// 当前缓存：固定 60 秒
let modelsCache = null
let cacheExpiry = 0
const CACHE_TTL = 60000
```

**优化方案**：使用 LRU 缓存
```javascript
const LRU = require('lru-cache')

const modelCache = new LRU({
  max: 10,              // 最多缓存 10 个模型
  ttl: 60 * 60 * 1000,  // 1 小时过期
  updateAgeOnGet: true  // 访问时更新
})

async function getCachedModel(modelId) {
  const cached = modelCache.get(modelId)
  if (cached) return cached

  const model = await getModel(modelId)
  if (model) {
    modelCache.set(modelId, model)
  }

  return model
}
```

### 2. 连接测试优化

**当前问题**：
```javascript
// 每次测试都创建新客户端
const client = new OpenAI({
  apiKey: model.api_key,
  baseURL: model.base_url,
  timeout: 15000
})
```

**优化方案**：复用客户端
```javascript
// 全局客户端池
const clientPool = new Map()

function getOpenAIClient(model) {
  const cacheKey = `${model.provider}:${model.model_id}`

  if (!clientPool.has(cacheKey)) {
    clientPool.set(cacheKey, new OpenAI({
      apiKey: model.api_key,
      baseURL: model.base_url,
      timeout: 30000
    }))
  }

  return clientPool.get(cacheKey)
}
```

### 3. 错误处理增强

**当前问题**：
```javascript
// 解密失败返回 null
function decryptApiKey(encryptedKey) {
  try {
    // ...
    return decrypted
  } catch (error) {
    console.error('[ModelManager] 解密失败:', error)
    return null
  }
}
```

**优化方案**：抛出明确错误
```javascript
function decryptApiKey(encryptedKey) {
  if (!encryptedKey) {
    throw new Error('API Key 为空')
  }

  try {
    const [ivHex, authTagHex, encrypted] = encryptedKey.split(':')

    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('API Key 格式错误')
    }

    // ...
    return decrypted
  } catch (error) {
    throw new Error(`API Key 解密失败: ${error.message}`)
  }
}
```

### 4. 模型验证

**新增验证函数**：
```javascript
/**
 * 验证模型配置
 */
function validateModelConfig(modelData) {
  const errors = []

  // 必填字段
  if (!modelData.name) errors.push('模型名称不能为空')
  if (!modelData.provider) errors.push('提供商不能为空')
  if (!modelData.model_id) errors.push('模型标识不能为空')
  if (!modelData.base_url) errors.push('API 地址不能为空')

  // 格式验证
  if (modelData.base_url && !modelData.base_url.startsWith('http')) {
    errors.push('API 地址格式错误')
  }

  if (modelData.max_tokens && modelData.max_tokens < 100) {
    errors.push('max_tokens 不能小于 100')
  }

  if (modelData.temperature && (modelData.temperature < 0 || modelData.temperature > 2)) {
    errors.push('temperature 必须在 0-2 之间')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
```

---

## 🔧 实施步骤

### 第一步：字段映射修复（立即）

```bash
# 1. 修改 modelManager.js
# 2. 添加字段映射函数
# 3. 更新所有查询语句
```

### 第二步：成本计算（本周）

```bash
# 1. 新增 calculateModelCost()
# 2. 修改 recordTokenUsage()
# 3. 前端显示成本
```

### 第三步：性能优化（下周）

```bash
# 1. 引入 LRU 缓存
# 2. 优化客户端复用
# 3. 添加监控日志
```

---

## 📈 预期效果

### 1. 字段一致性
- ✅ 解决字段名不匹配问题
- ✅ 避免查询失败
- ✅ 支持数据库新字段

### 2. 成本管理
- ✅ 精确计算每次调用成本
- ✅ 按模型统计费用
- ✅ 成本预警

### 3. 性能提升
- ✅ LRU 缓存减少数据库查询
- ✅ 客户端复用减少连接开销
- ✅ 模型加载速度提升 50%

---

## ✅ 总结

### 核心问题
**字段名不一致**：代码使用 `base_url`，数据库定义 `api_url`

### 解决方案
**字段映射**：在代码层统一转换，不破坏数据库

### 后续优化
1. 成本计算
2. LRU 缓存
3. 客户端复用
4. 配置验证

---

**检查完成时间**: 2026-03-31  
**建议优先级**: 🔴 高（字段不匹配可能导致功能异常）