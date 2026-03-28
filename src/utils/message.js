/**
 * 消息提示工具函数
 * 统一封装 Element Plus 的 ElMessage 组件
 */
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'

/**
 * 成功提示
 * @param {string} message - 提示消息
 * @param {number} duration - 显示时长（毫秒），默认 3000
 */
export const success = (message, duration = 3000) => {
  ElMessage.success({
    message,
    duration,
    showClose: true
  })
}

/**
 * 错误提示
 * @param {string} message - 提示消息
 * @param {number} duration - 显示时长（毫秒），默认 4000
 */
export const error = (message, duration = 4000) => {
  ElMessage.error({
    message,
    duration,
    showClose: true
  })
}

/**
 * 警告提示
 * @param {string} message - 提示消息
 * @param {number} duration - 显示时长（毫秒），默认 3500
 */
export const warning = (message, duration = 3500) => {
  ElMessage.warning({
    message,
    duration,
    showClose: true
  })
}

/**
 * 信息提示
 * @param {string} message - 提示消息
 * @param {number} duration - 显示时长（毫秒），默认 3000
 */
export const info = (message, duration = 3000) => {
  ElMessage.info({
    message,
    duration,
    showClose: true
  })
}

/**
 * 确认对话框
 * @param {string} message - 确认消息
 * @param {string} title - 标题，默认 '提示'
 * @param {object} options - 配置选项
 * @returns {Promise<boolean>} 用户是否确认
 */
export const confirm = async (message, title = '提示', options = {}) => {
  try {
    await ElMessageBox.confirm(message, title, {
      confirmButtonText: options.confirmText || '确定',
      cancelButtonText: options.cancelText || '取消',
      type: options.type || 'warning',
      ...options
    })
    return true
  } catch {
    return false
  }
}

/**
 * 删除确认对话框
 * @param {string} itemName - 要删除的项目名称
 * @returns {Promise<boolean>} 用户是否确认
 */
export const confirmDelete = async (itemName = '此项目') => {
  return confirm(`确定要删除${itemName}吗？此操作不可恢复。`, '删除确认', { type: 'warning' })
}

/**
 * 批量操作确认对话框
 * @param {number} count - 操作数量
 * @param {string} action - 操作名称，默认 '删除'
 * @returns {Promise<boolean>} 用户是否确认
 */
export const confirmBatch = async (count, action = '删除') => {
  return confirm(`确定要批量${action} ${count} 个项目吗？`, '批量操作确认', { type: 'warning' })
}

/**
 * 通知提示（右上角）
 * @param {string} title - 标题
 * @param {string} message - 消息内容
 * @param {string} type - 类型：success/warning/info/error
 * @param {number} duration - 显示时长（毫秒），默认 4500
 */
export const notify = (title, message, type = 'info', duration = 4500) => {
  ElNotification({
    title,
    message,
    type,
    duration,
    position: 'top-right'
  })
}

/**
 * 操作成功提示（带操作名称）
 * @param {string} action - 操作名称，如 '保存'、'删除'
 */
export const actionSuccess = action => {
  success(`${action}成功`)
}

/**
 * 操作失败提示（带操作名称）
 * @param {string} action - 操作名称，如 '保存'、'删除'
 * @param {string} reason - 失败原因（可选）
 */
export const actionFailed = (action, reason = '') => {
  const message = reason ? `${action}失败：${reason}` : `${action}失败，请稍后重试`
  error(message)
}

// 默认导出所有方法
export default {
  success,
  error,
  warning,
  info,
  confirm,
  confirmDelete,
  confirmBatch,
  notify,
  actionSuccess,
  actionFailed
}
