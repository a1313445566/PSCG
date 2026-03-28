/**
 * 格式化工具函数
 * 统一处理常见的数据格式化需求
 */

/**
 * 格式化百分比
 * @param {number|string} value - 数值（0-100 或 0-1）
 * @param {object} options - 配置选项
 * @param {boolean} options.isDecimal - 是否为小数形式（0-1），默认 false
 * @param {number} options.decimals - 小数位数，默认 0
 * @param {string} options.suffix - 后缀，默认 '%'
 * @returns {string} 格式化后的百分比字符串
 */
export const formatPercent = (value, options = {}) => {
  const { isDecimal = false, decimals = 0, suffix = '%' } = options

  if (value === null || value === undefined || value === '') {
    return `0${suffix}`
  }

  let num = parseFloat(value)
  if (isNaN(num)) return `0${suffix}`

  // 如果是小数形式（0-1），转换为百分比
  if (isDecimal) {
    num = num * 100
  }

  // 限制范围
  num = Math.max(0, Math.min(100, num))

  return `${num.toFixed(decimals)}${suffix}`
}

/**
 * 格式化正确率（项目常用）
 * @param {number|string} accuracy - 正确率数值（0-100）
 * @returns {string} 格式化后的正确率，如 "85%"
 */
export const formatAccuracy = accuracy => {
  return formatPercent(accuracy, { decimals: 0 })
}

/**
 * 格式化数字（添加千分位）
 * @param {number|string} value - 数值
 * @param {number} decimals - 小数位数，默认 0
 * @returns {string} 格式化后的数字
 */
export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined || value === '') {
    return '0'
  }

  const num = parseFloat(value)
  if (isNaN(num)) return '0'

  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小，如 "1.5 MB"
 */
export const formatFileSize = bytes => {
  if (!bytes || bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`
}

/**
 * 格式化时长（秒转为 mm:ss）
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时长，如 "05:30"
 */
export const formatDuration = seconds => {
  if (!seconds || seconds < 0) return '00:00'

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 格式化学号（补零）
 * @param {string|number} studentId - 学号
 * @param {number} length - 总长度，默认 2
 * @returns {string} 格式化后的学号
 */
export const formatStudentId = (studentId, length = 2) => {
  if (!studentId) return ''
  return String(studentId).padStart(length, '0')
}

/**
 * 截断文本
 * @param {string} text - 原文本
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 后缀，默认 '...'
 * @returns {string} 截断后的文本
 */
export const truncate = (text, maxLength, suffix = '...') => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + suffix
}
