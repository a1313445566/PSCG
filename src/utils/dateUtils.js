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
    const date = new Date(dateString);
    
    // 确保日期有效
    if (isNaN(date.getTime())) {
      return defaultStr;
    }
    
    // 使用 timeZone 选项直接显示北京时间
    return date.toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
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
