/**
 * AI Chat 缓存服务
 * 文件: services/chat/cacheService.js
 * 功能: 查询结果缓存，减少 Token 消耗
 */

const crypto = require('crypto')
const db = require('../database')

// L1 内存缓存
const memoryCache = new Map()
const MEMORY_CACHE_TTL = 300000 // 5分钟
const MAX_MEMORY_CACHE_SIZE = 100

/**
 * 生成缓存键（MD5 前 32 位）
 */
function generateCacheKey(query, contextHash = '') {
  const normalized = query.toLowerCase().trim()
  const combined = `${normalized}:${contextHash}`
  return crypto.createHash('md5').update(combined).digest('hex').substring(0, 32)
}

/**
 * 从缓存获取结果
 */
async function getCachedResponse(query, contextHash = '') {
  const cacheKey = generateCacheKey(query, contextHash)

  // 1. 检查内存缓存
  const memoryCached = memoryCache.get(cacheKey)
  if (memoryCached && Date.now() < memoryCached.expiry) {
    // 更新命中计数
    await updateHitCount(cacheKey, 0)
    return {
      found: true,
      response: memoryCached.response,
      fromMemory: true
    }
  }

  // 2. 检查数据库缓存（cache_hits 表没有 response_json 字段，仅记录统计）
  try {
    const sql = `
      SELECT query_hash, hit_count, tokens_saved 
      FROM cache_hits 
      WHERE query_hash = ? AND last_hit_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `
    const cached = await db.get(sql, [cacheKey])

    if (cached) {
      // 更新命中计数
      await updateHitCount(cacheKey, cached.tokens_saved)

      // 注意：cache_hits 表仅用于统计，不存储响应内容
      // 命中后需要重新查询或使用内存缓存
      return {
        found: false,
        fromMemory: false,
        hitStats: cached
      }
    }
  } catch (error) {
    console.error('[CacheService] 数据库缓存查询失败:', error)
  }

  return { found: false }
}

/**
 * 保存缓存结果
 * 注意：cache_hits 表仅用于统计，不存储响应内容
 */
async function setCachedResponse(query, response, contextHash = '') {
  const cacheKey = generateCacheKey(query, contextHash)

  try {
    // 生成响应哈希
    const responseHash = crypto.createHash('md5').update(response).digest('hex').substring(0, 32)

    // 仅保存统计信息到数据库（不存储 response_json）
    const sql = `
      INSERT INTO cache_hits (query_hash, query_text, response_hash, hit_count, tokens_saved, created_at, last_hit_at)
      VALUES (?, ?, ?, 1, 0, NOW(), NOW())
      ON DUPLICATE KEY UPDATE 
        response_hash = VALUES(response_hash),
        hit_count = hit_count + 1,
        last_hit_at = NOW()
    `

    await db.run(sql, [cacheKey, query, responseHash])

    // 保存到内存缓存
    if (memoryCache.size >= MAX_MEMORY_CACHE_SIZE) {
      // 清理最旧的缓存
      const oldestKey = memoryCache.keys().next().value
      memoryCache.delete(oldestKey)
    }

    memoryCache.set(cacheKey, {
      response,
      expiry: Date.now() + MEMORY_CACHE_TTL
    })

    return cacheKey
  } catch (error) {
    console.error('[CacheService] 保存缓存失败:', error)
    return null
  }
}

/**
 * 更新命中计数
 */
async function updateHitCount(cacheKey, currentSavedTokens) {
  try {
    const sql = `
      UPDATE cache_hits 
      SET hit_count = hit_count + 1,
          tokens_saved = tokens_saved + ?
      WHERE query_hash = ?
    `
    await db.run(sql, [currentSavedTokens, cacheKey])
  } catch (error) {
    console.error('[CacheService] 更新命中计数失败:', error)
  }
}

/**
 * 获取缓存统计
 */
async function getCacheStats() {
  try {
    const statsSQL = `
      SELECT 
        COUNT(*) as total_cached_queries,
        SUM(hit_count) as total_hits,
        SUM(tokens_saved) as total_tokens_saved,
        AVG(hit_count) as avg_hit_count
      FROM cache_hits
    `

    const recentSQL = `
      SELECT query_hash, query_text, hit_count, tokens_saved, created_at, last_hit_at
      FROM cache_hits
      ORDER BY last_hit_at DESC
      LIMIT 10
    `

    const [stats, recent] = await Promise.all([db.get(statsSQL), db.query(recentSQL)])

    return {
      totalCachedQueries: stats?.total_cached_queries || 0,
      totalHits: stats?.total_hits || 0,
      totalTokensSaved: stats?.total_tokens_saved || 0,
      avgHitCount: stats?.avg_hit_count || 0,
      memoryCacheSize: memoryCache.size,
      recentHits: recent || []
    }
  } catch (error) {
    console.error('[CacheService] 获取缓存统计失败:', error)
    return {
      totalCachedQueries: 0,
      totalHits: 0,
      totalTokensSaved: 0,
      avgHitCount: 0,
      memoryCacheSize: memoryCache.size,
      recentHits: []
    }
  }
}

/**
 * 清理过期缓存
 */
async function cleanExpiredCache() {
  try {
    const sql = `
      DELETE FROM cache_hits 
      WHERE last_hit_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
    `
    const result = await db.run(sql)
    console.log(`[CacheService] 清理了 ${result.affectedRows} 条过期缓存`)
    return result.affectedRows
  } catch (error) {
    console.error('[CacheService] 清理缓存失败:', error)
    return 0
  }
}

/**
 * 清空所有缓存
 */
async function clearAllCache() {
  memoryCache.clear()
  await db.run('DELETE FROM cache_hits')
  console.log('[CacheService] 已清空所有缓存')
}

module.exports = {
  generateCacheKey,
  getCachedResponse,
  setCachedResponse,
  getCacheStats,
  cleanExpiredCache,
  clearAllCache
}
