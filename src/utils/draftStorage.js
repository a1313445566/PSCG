/**
 * 草稿存储工具
 * 支持多标签页隔离、版本迁移、大小限制
 */

const DRAFT_VERSION = 2
const MAX_AGE = 24 * 60 * 60 * 1000 // 24小时
const MAX_SIZE = 4 * 1024 * 1024 // 4MB

class DraftStorage {
  constructor() {
    this.version = DRAFT_VERSION
    this.maxAge = MAX_AGE
    this.maxSize = MAX_SIZE
  }

  // 获取标签页唯一ID
  getTabId() {
    if (typeof sessionStorage === 'undefined') return 'default'

    if (!sessionStorage.getItem('tabId')) {
      sessionStorage.setItem(
        'tabId',
        Date.now().toString(36) + Math.random().toString(36).substr(2)
      )
    }
    return sessionStorage.getItem('tabId')
  }

  // 获取存储 key
  get key() {
    return `question_edit_draft_${this.getTabId()}`
  }

  // 保存草稿
  save(questionId, formData) {
    const draft = {
      version: this.version,
      id: questionId,
      isNew: !questionId,
      data: formData,
      timestamp: Date.now()
    }

    let jsonStr = JSON.stringify(draft)

    // 检查大小，必要时压缩
    if (jsonStr.length > this.maxSize) {
      draft.data = this.compressData(formData)
      jsonStr = JSON.stringify(draft)

      if (jsonStr.length > this.maxSize) {
        console.warn('草稿内容过大，无法保存')
        return false
      }
    }

    try {
      localStorage.setItem(this.key, jsonStr)
      return true
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        // 清理过期草稿后重试
        this.clearExpiredDrafts()
        try {
          localStorage.setItem(this.key, jsonStr)
          return true
        } catch (_) {
          console.error('存储空间不足，草稿保存失败')
          return false
        }
      }
      throw e
    }
  }

  // 恢复草稿
  restore() {
    try {
      const draft = localStorage.getItem(this.key)
      if (!draft) return null

      const parsed = JSON.parse(draft)

      // 版本检查和迁移
      if (parsed.version !== this.version) {
        return this.migrate(parsed)
      }

      // 超时检查
      if (Date.now() - parsed.timestamp > this.maxAge) {
        this.clear()
        return null
      }

      return {
        id: parsed.id,
        isNew: parsed.isNew,
        data: parsed.data,
        timestamp: parsed.timestamp
      }
    } catch (e) {
      console.error('草稿解析失败:', e)
      this.clear()
      return null
    }
  }

  // 检查草稿状态
  hasDraft(currentQuestionId) {
    const draft = this.restore()
    if (!draft) return false

    // 新建题目检查
    if (!currentQuestionId && draft.isNew) return true

    // 编辑题目检查
    if (currentQuestionId && draft.id === currentQuestionId) return true

    // 有其他题目的草稿
    return {
      hasOtherDraft: true,
      draftId: draft.id,
      draftIsNew: draft.isNew,
      timestamp: draft.timestamp
    }
  }

  // 清除草稿
  clear() {
    localStorage.removeItem(this.key)
  }

  // 清理过期草稿
  clearExpiredDrafts() {
    const keys = Object.keys(localStorage)

    keys.forEach(key => {
      if (key.startsWith('question_edit_draft_')) {
        try {
          const draft = JSON.parse(localStorage.getItem(key))
          if (Date.now() - draft.timestamp > this.maxAge) {
            localStorage.removeItem(key)
          }
        } catch (e) {
          localStorage.removeItem(key)
        }
      }
    })
  }

  // 压缩数据（移除Base64图片）
  compressData(formData) {
    const compressed = { ...formData }

    if (compressed.content) {
      compressed.content = compressed.content.replace(
        /<img[^>]+src="data:image\/[^"]+"/g,
        '<img src="[图片数据已压缩，请重新上传]"'
      )
    }

    if (compressed.options) {
      compressed.options = compressed.options.map(
        opt =>
          opt?.replace(
            /<img[^>]+src="data:image\/[^"]+"/g,
            '<img src="[图片数据已压缩，请重新上传]"'
          ) || opt
      )
    }

    return compressed
  }

  // 版本迁移
  migrate(oldDraft) {
    const version = oldDraft.version || 1

    // v1 -> v2 迁移
    if (version === 1) {
      this.clear()
      return null
    }

    this.clear()
    return null
  }
}

export default new DraftStorage()
