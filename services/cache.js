const cache = require('memory-cache');

class CacheService {
  constructor() {
    // 根据数据类型设置不同的缓存过期时间
    this.CACHE_DURATIONS = {
      // 静态数据：5分钟（变化少）
      STATIC: 5 * 60 * 1000, // 5分钟
      // 动态数据：1分钟（变化频繁）
      DYNAMIC: 1 * 60 * 1000, // 1分钟
      // 排行榜数据：2分钟
      LEADERBOARD: 2 * 60 * 1000, // 2分钟
      // 分析数据：3分钟
      ANALYSIS: 3 * 60 * 1000, // 3分钟
      // 用户数据：1分钟
      USER: 1 * 60 * 1000, // 1分钟
      // 默认：1分钟
      DEFAULT: 1 * 60 * 1000 // 1分钟
    };
    
    this.CACHE_KEYS = {
      SUBJECTS: 'subjects',
      GRADES: 'grades',
      CLASSES: 'classes',
      SUBCATEGORIES: 'subcategories',
      ANALYSIS: 'analysis',
      ERROR_PRONE_QUESTIONS: 'error_prone_questions',
      SUBJECTS_STATS: 'subjects_stats',
      LEADERBOARD: 'leaderboard',
      USER_STATS: 'user_stats'
    };
    
    // 缓存统计
    this.cacheStats = {
      hits: 0,
      misses: 0,
      totalRequests: 0
    };
  }

  // 设置缓存（根据key类型自动选择过期时间）
  set(key, value, duration = null) {
    // 根据key判断数据类型
    let cacheDuration = duration || this.getDurationByKey(key);
    return cache.put(key, value, cacheDuration);
  }
  
  // 滑动过期：更新缓存的过期时间而不修改值
  touch(key, duration = null) {
    const value = cache.get(key);
    if (value !== null) {
      let cacheDuration = duration || this.getDurationByKey(key);
      return cache.put(key, value, cacheDuration);
    }
    return null;
  }
  
  // 根据key类型获取缓存过期时间
  getDurationByKey(key) {
    if (key.startsWith(this.CACHE_KEYS.SUBJECTS) || 
        key.startsWith(this.CACHE_KEYS.GRADES) || 
        key.startsWith(this.CACHE_KEYS.CLASSES)) {
      return this.CACHE_DURATIONS.STATIC; // 静态数据
    } else if (key.startsWith(this.CACHE_KEYS.SUBCATEGORIES)) {
      return this.CACHE_DURATIONS.STATIC; // 静态数据
    } else if (key.startsWith(this.CACHE_KEYS.LEADERBOARD)) {
      return this.CACHE_DURATIONS.LEADERBOARD; // 排行榜数据
    } else if (key.startsWith(this.CACHE_KEYS.ANALYSIS)) {
      return this.CACHE_DURATIONS.ANALYSIS; // 分析数据
    } else if (key.startsWith(this.CACHE_KEYS.USER_STATS)) {
      return this.CACHE_DURATIONS.USER; // 用户数据
    } else if (key.startsWith(this.CACHE_KEYS.ERROR_PRONE_QUESTIONS)) {
      return this.CACHE_DURATIONS.ANALYSIS; // 错误率数据
    } else {
      return this.CACHE_DURATIONS.DEFAULT; // 默认
    }
  }

  // 获取缓存（带统计）
  get(key) {
    this.cacheStats.totalRequests++;
    const value = cache.get(key);
    if (value !== null) {
      this.cacheStats.hits++;
      return value;
    } else {
      this.cacheStats.misses++;
      return null;
    }
  }

  // 删除缓存
  del(key) {
    return cache.del(key);
  }

  // 清除所有缓存
  clear() {
    return cache.clear();
  }
  
  // 获取缓存统计
  getStats() {
    const hitRate = this.cacheStats.totalRequests > 0 
      ? (this.cacheStats.hits / this.cacheStats.totalRequests * 100).toFixed(2) 
      : '0.00';
    
    return {
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      totalRequests: this.cacheStats.totalRequests,
      hitRate: `${hitRate}%`,
      cacheSize: cache.size(),
      timestamp: new Date().toISOString()
    };
  }
  
  // 添加排行榜缓存键生成方法
  generateLeaderboardKey(params) {
    const { subjectId, grade, className, limit, id, student_id } = params;
    return `${this.CACHE_KEYS.LEADERBOARD}_${subjectId || ''}_${grade || ''}_${className || ''}_${limit || 100}_${id || ''}_${student_id || ''}`;
  }
  
  // 添加用户统计缓存键生成方法
  generateUserStatsKey(userId) {
    return `${this.CACHE_KEYS.USER_STATS}_${userId}`;
  }

  // 生成分析缓存键
  generateAnalysisKey(params) {
    const { studentId, grade, class: className, subjectId, subcategoryIds, startDate, endDate } = params;
    return `${this.CACHE_KEYS.ANALYSIS}_${studentId || ''}_${grade || ''}_${className || ''}_${subjectId || ''}_${subcategoryIds || ''}_${startDate || ''}_${endDate || ''}`;
  }

  // 生成错误率较高题目缓存键
  generateErrorProneKey(params) {
    const { subjectId, grade, class: className, subcategoryIds } = params;
    return `${this.CACHE_KEYS.ERROR_PRONE_QUESTIONS}_${subjectId || ''}_${grade || ''}_${className || ''}_${subcategoryIds || ''}`;
  }

  // 生成子分类缓存键
  generateSubcategoryKey(subjectId) {
    return `${this.CACHE_KEYS.SUBCATEGORIES}_${subjectId}`;
  }
}

// 导出单例实例
const cacheService = new CacheService();
module.exports = cacheService;