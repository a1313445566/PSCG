import { ElMessage, ElLoading } from 'element-plus'
import { getCSRFToken } from './csrf.js'

/**
 * 上传图片到服务器
 * @param {File} file - 图片文件
 * @param {number} maxSize - 最大文件大小（字节）
 * @returns {Promise<string>} 图片 URL
 */
export async function uploadImage(file, maxSize = 2 * 1024 * 1024) {
  // 检查文件大小
  if (file.size > maxSize) {
    throw new Error(`图片大小不能超过 ${maxSize / 1024 / 1024}MB`)
  }

  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('不支持的图片格式，仅支持 JPG、PNG、GIF、WebP')
  }

  const formData = new FormData()
  formData.append('image', file)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时

  try {
    // 获取 CSRF Token
    const csrfToken = await getCSRFToken()

    const headers = {}
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken
    }

    const response = await fetch('/api/upload/image', {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
      credentials: 'same-origin'
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '上传失败')
    }

    const result = await response.json()
    if (result.success) {
      return result.url
    }

    throw new Error(result.error || '上传失败')
  } catch (error) {
    clearTimeout(timeoutId)

    if (error.name === 'AbortError') {
      throw new Error('上传超时，请检查网络')
    }

    throw error
  }
}

/**
 * 带重试的图片上传
 */
export async function uploadImageWithRetry(file, maxRetries = 3) {
  let lastError = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await uploadImage(file)
    } catch (error) {
      lastError = error

      // 不重试的错误
      if (error.message.includes('不支持') || error.message.includes('超过')) {
        throw error
      }

      if (i < maxRetries - 1) {
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }

  throw lastError
}

/**
 * 上传队列，控制并发数
 * 支持进度显示、取消上传、状态管理
 */
export const uploadQueue = {
  queue: [],
  running: 0,
  maxConcurrent: 3,
  abortControllers: new Map(), // 用于取消上传
  listeners: new Set(), // 状态监听器

  // 添加状态监听
  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  },

  // 通知状态变化
  notify() {
    const state = {
      pending: this.queue.length,
      running: this.running,
      total: this.queue.length + this.running
    }
    this.listeners.forEach(listener => listener(state))
  },

  // 添加上传任务
  async add(file, taskId = null) {
    const id = taskId || `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const controller = new AbortController()
    this.abortControllers.set(id, controller)

    return new Promise((resolve, reject) => {
      this.queue.push({ file, resolve, reject, id, controller })
      this.notify()
      this.process()
    })
  },

  // 处理队列
  async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    this.running++
    this.notify()
    const { file, resolve, reject, id, controller } = this.queue.shift()

    try {
      const url = await uploadImageWithRetry(file, 3)
      resolve(url)
    } catch (error) {
      if (error.name === 'AbortError') {
        reject(new Error('上传已取消'))
      } else {
        reject(error)
      }
    } finally {
      this.running--
      this.abortControllers.delete(id)
      this.notify()
      this.process()
    }
  },

  // 取消上传
  cancel(taskId) {
    const controller = this.abortControllers.get(taskId)
    if (controller) {
      controller.abort()
      this.abortControllers.delete(taskId)
    }

    // 从队列中移除
    const index = this.queue.findIndex(item => item.id === taskId)
    if (index !== -1) {
      this.queue.splice(index, 1)
      this.notify()
    }
  },

  // 取消所有上传
  cancelAll() {
    this.abortControllers.forEach(controller => controller.abort())
    this.abortControllers.clear()
    this.queue = []
    this.notify()
  },

  // 获取状态
  getState() {
    return {
      pending: this.queue.length,
      running: this.running,
      total: this.queue.length + this.running
    }
  }
}

/**
 * 为 Quill 编辑器添加图片处理
 */
export function setupImageHandler(quill) {
  // 粘贴事件
  quill.root.addEventListener('paste', async e => {
    const items = e.clipboardData.items

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        await insertImage(quill, file)
      }
    }
  })

  // 拖拽事件
  quill.root.addEventListener('drop', async e => {
    const files = e.dataTransfer.files

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        e.preventDefault()
        await insertImage(quill, file)
      }
    }
  })
}

async function insertImage(quill, file) {
  const loading = ElLoading.service({
    lock: true,
    text: '上传图片中...'
  })

  try {
    const url = await uploadQueue.add(file)
    const range = quill.getSelection(true)
    quill.insertEmbed(range.index, 'image', url)
    quill.setSelection(range.index + 1)
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.close()
  }
}
