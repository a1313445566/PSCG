// 常量定义
export const MAX_CORRECT_COUNT = 3

/**
 * 获取进度条颜色
 * @param {number} correctCount - 当前正确次数
 * @returns {string} 颜色代码
 */
export const getProgressColor = correctCount => {
  if (correctCount >= MAX_CORRECT_COUNT) {
    return '#67C23A' // 绿色
  } else if (correctCount >= MAX_CORRECT_COUNT - 1) {
    return '#E6A23C' // 橙色
  } else {
    return '#F56C6C' // 红色
  }
}
