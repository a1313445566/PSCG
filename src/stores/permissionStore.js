import { defineStore } from 'pinia'
import { api } from '@/utils/api'

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    permissions: {},
    roleId: null,
    isSuper: false,
    filteredMenus: []
  }),

  getters: {
    hasPermission: state => (module, action) => {
      if (state.isSuper) return true
      return state.permissions[module]?.[action] || false
    },

    hasModulePermission: state => module => {
      if (state.isSuper) return true
      return state.permissions[module] && Object.values(state.permissions[module]).some(v => v)
    }
  },

  actions: {
    setPermissions(permissions, roleId, isSuper) {
      this.permissions = permissions
      this.roleId = roleId
      this.isSuper = isSuper
      this.filterMenus()
    },

    filterMenus() {
      const allMenus = [
        { key: 'dashboard', module: 'dashboard', label: '数据概览', icon: 'DataLine' },
        { key: 'questions', module: 'questions', label: '题目管理', icon: 'Document' },
        { key: 'subjects', module: 'subjects', label: '学科管理', icon: 'Reading' },
        { key: 'grades-classes', module: 'grades-classes', label: '年级班级', icon: 'School' },
        { key: 'user-stats', module: 'user-stats', label: '用户数据', icon: 'UserFilled' },
        { key: 'user-management', module: 'user-management', label: '用户管理', icon: 'User' },
        { key: 'data-analysis', module: 'data-analysis', label: '数据分析', icon: 'TrendCharts' },
        { key: 'ai-chat', module: 'ai-chat', label: 'AI 助手', icon: 'ChatDotRound' },
        { key: 'ai-models', module: 'ai-models', label: '模型管理', icon: 'Cpu' },
        { key: 'basic-settings', module: 'basic-settings', label: '基础设置', icon: 'Tools' },
        { key: 'database', module: 'database', label: '数据库管理', icon: 'Coin' },
        { key: 'security', module: 'security', label: '安全中心', icon: 'Lock' }
      ]

      this.filteredMenus = allMenus.filter(menu => {
        return this.hasModulePermission(menu.module)
      })
    },

    clearPermissions() {
      this.permissions = {}
      this.roleId = null
      this.isSuper = false
      this.filteredMenus = []
    }
  }
})
