const cache = require('memory-cache');

class CacheService {
  constructor() {
    this.CACHE_DURATION = 60000; // 1分钟
    this.CACHE_KEYS = {
      SUBJECTS: 'subjects',
      GRADES: 'grades',
      CLASSES: 'classes',
      SUBCATEGORIES: 'subcategories',
      ANALYSIS: 'analysis',
      ERROR_PRONE_QUESTIONS: 'error_prone_questions'
    };
  }

  // 设置缓存
  set(key, value, duration = this.CACHE_DURATION) {
    return cache.put(key, value, duration);
  }

  // 获取缓存
  get(key) {
    return cache.get(key);
  }

  // 删除缓存
  del(key) {
    return cache.del(key);
  }

  // 清除所有缓存
  clear() {
    return cache.clear();
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