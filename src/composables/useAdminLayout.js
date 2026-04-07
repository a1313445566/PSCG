import { ref, computed } from 'vue'
import api from '../utils/api'

const currentView = ref('default')

// 侧边栏状态
const isCollapse = ref(false)
const activeMenu = ref('dashboard')
const currentWidth = ref(240)
const filterSubjectId = ref(null)
const filterSubcategoryId = ref(null)

// 权限状态
const permissions = ref({})
const permissionsLoaded = ref(false)

export function useAdminLayout() {
  const setCurrentView = view => {
    currentView.value = view
    localStorage.setItem('admin_current_view', view)

    if (view === 'content-management') {
      activeMenu.value = 'role-management'
      localStorage.setItem('admin_active_menu', 'role-management')
    } else {
      activeMenu.value = 'dashboard'
      localStorage.setItem('admin_active_menu', 'dashboard')
    }
  }

  const isContentManagement = computed(() => currentView.value === 'content-management')

  const toggleCollapse = () => {
    isCollapse.value = !isCollapse.value
    localStorage.setItem('admin_sidebar_collapse', isCollapse.value ? 'true' : 'false')
  }

  const setActiveMenu = menu => {
    activeMenu.value = menu
    localStorage.setItem('admin_active_menu', menu)
  }

  const setSidebarWidth = width => {
    currentWidth.value = width
    localStorage.setItem('admin_sidebar_width', width)
  }

  const setFilterSubject = subjectId => {
    filterSubjectId.value = subjectId
  }

  const setFilterSubcategory = subcategoryId => {
    filterSubcategoryId.value = subcategoryId
  }

  const clearFilter = () => {
    filterSubjectId.value = null
    filterSubcategoryId.value = null
  }

  // 加载权限数据
  const loadPermissions = async () => {
    try {
      const res = await api.get('/admin/permissions/my-permissions')

      // 后端返回格式是 {permissions, roleId, isSuper}，没有 success 字段
      const permissionsData = res.data.data || res.data

      if (permissionsData && permissionsData.permissions !== undefined) {
        permissions.value = permissionsData.permissions || {}
        permissionsLoaded.value = true
      } else {
        permissionsLoaded.value = true
      }
    } catch (error) {
      // 如果加载失败，默认给予所有权限（降级处理）
      permissionsLoaded.value = true
    }
  }

  // 检查是否有某个模块的权限
  const hasPermission = (moduleKey, action = 'view') => {
    if (!permissionsLoaded.value || Object.keys(permissions.value).length === 0) {
      return true // 权限未加载时默认允许
    }
    return permissions.value[moduleKey]?.[action] === true
  }

  // 初始化时恢复保存的状态
  const initializeState = () => {
    const savedCollapse = localStorage.getItem('admin_sidebar_collapse')
    if (savedCollapse) {
      isCollapse.value = savedCollapse === 'true'
    }

    const savedWidth = localStorage.getItem('admin_sidebar_width')
    if (savedWidth) {
      currentWidth.value = parseInt(savedWidth) || 240
    }

    const savedView = localStorage.getItem('admin_current_view')
    if (savedView) {
      currentView.value = savedView
    }

    const savedMenu = localStorage.getItem('admin_active_menu')
    if (savedMenu) {
      activeMenu.value = savedMenu
    } else {
      activeMenu.value =
        currentView.value === 'content-management' ? 'role-management' : 'dashboard'
    }
  }

  return {
    currentView,
    setCurrentView,
    isContentManagement,
    isCollapse,
    activeMenu,
    currentWidth,
    toggleCollapse,
    setActiveMenu,
    setSidebarWidth,
    filterSubjectId,
    filterSubcategoryId,
    setFilterSubject,
    setFilterSubcategory,
    clearFilter,
    initializeState,
    permissions,
    permissionsLoaded,
    loadPermissions,
    hasPermission
  }
}
