/**
 * 后端格式化工具函数 (CommonJS)
 * 与前端 src/utils/format.js 保持功能一致
 */

/**
 * 安全格式化数字
 * @param {number|string} value - 数值
 * @param {number} decimals - 小数位数，默认 1
 * @returns {string} 格式化后的数字
 */
function formatNumber(value, decimals = 1) {
  if (value === null || value === undefined || value === '') {
    return decimals === 0 ? '0' : '0.' + '0'.repeat(decimals)
  }

  const num = Number(value)
  if (isNaN(num)) {
    return decimals === 0 ? '0' : '0.' + '0'.repeat(decimals)
  }

  return num.toFixed(decimals)
}

/**
 * 格式化百分比
 * @param {number|string} value - 数值（0-100）
 * @param {number} decimals - 小数位数，默认 1
 * @returns {string} 格式化后的百分比，如 "85.5%"
 */
function formatPercent(value, decimals = 1) {
  return formatNumber(value, decimals) + '%'
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小，如 "1.5 MB"
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + units[i]
}

/**
 * 格式化时长（秒转为 mm:ss）
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时长，如 "05:30"
 */
function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '00:00'

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0')
}

module.exports = {
  formatNumber,
  formatPercent,
  formatFileSize,
  formatDuration
}
