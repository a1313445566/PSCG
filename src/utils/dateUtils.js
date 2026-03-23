/**
 * 日期格式化工具函数
 */

/**
 * 格式化日期为本地化字符串
 * @param {string|Date} dateString - 日期字符串或Date对象
 * @param {string} defaultStr - 当日期无效时返回的默认值
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (dateString, defaultStr = '') => {
  if (!dateString) return defaultStr;
  try {
    // 处理数据库返回的时间字符串，确保正确解析时区
    let date;
    if (typeof dateString === 'string') {
      // 直接解析，然后转换为北京时间
      date = new Date(dateString);
    } else {
      date = new Date(dateString);
    }
    
    // 确保日期有效
    if (isNaN(date.getTime())) {
      return defaultStr;
    }
    
    // 手动调整时区，确保显示北京时间
    const beijingTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    
    // 调试：查看时间解析（仅在开发环境）
    if (import.meta.env.DEV) {
      console.log('Date parsing:', {
        original: dateString,
        utcDate: date,
        beijingTime: beijingTime,
        timestamp: date.getTime()
      });
    }
    
    // 格式化日期为北京时间
    return beijingTime.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    return defaultStr;
  }
};
