/**
 * 后台管理布局状态管理 Hook
 *
 * 管理侧边栏折叠、菜单选中、侧边栏宽度等状态
 */
import { ref, computed } from 'vue'

// 全局状态（模块级别单例）
const isCollapse = ref(false)
const sidebarWidth = ref(220)
const activeMenu = ref('dashboard')
const activeTreeNode = ref(null)

// 学科筛选状态
const filterSubjectId = ref('')
const filterSubcategoryId = ref('')

/**
 * 后台管理布局 Hook
 * @returns {Object} 布局状态和方法
 */
export function useAdminLayout() {
  /**
   * 切换折叠状态
   */
  const toggleCollapse = () => {
    isCollapse.value = !isCollapse.value
  }

  /**
   * 设置当前激活菜单
   * @param {string} key - 菜单键
   */
  const setActiveMenu = (key) => {
    activeMenu.value = key
  }

  /**
   * 设置侧边栏宽度
   * @param {number} width - 宽度值
   */
  const setSidebarWidth = (width) => {
    sidebarWidth.value = Math.max(180, Math.min(350, width))
  }

  /**
   * 设置学科筛选
   */
  const setFilterSubject = (subjectId) => {
    filterSubjectId.value = subjectId
    filterSubcategoryId.value = ''
  }

  /**
   * 设置题库筛选
   */
  const setFilterSubcategory = (subjectId, subcategoryId) => {
    filterSubjectId.value = subjectId
    filterSubcategoryId.value = subcategoryId
  }

  /**
   * 清除筛选
   */
  const clearFilter = () => {
    filterSubjectId.value = ''
    filterSubcategoryId.value = ''
  }

  // 展开宽度
  const expandedWidth = computed(() => sidebarWidth.value)

  // 折叠宽度
  const collapsedWidth = 64

  // 当前实际宽度
  const currentWidth = computed(() => isCollapse.value ? collapsedWidth : expandedWidth.value)

  // 当前菜单标题
  const currentMenuTitle = computed(() => {
    const titleMap = {
      'dashboard': '数据概览',
      'questions': '题目管理',
      'subjects': '学科管理',
      'grades-classes': '年级班级',
      'user-data': '用户数据',
      'user-management': '用户管理',
      'basic-settings': '基础设置',
      'database': '数据库管理',
      'security': '安全中心'
    }
    return titleMap[activeMenu.value] || '数据概览'
  })

  return {
    isCollapse,
    sidebarWidth,
    activeMenu,
    activeTreeNode,
    toggleCollapse,
    setActiveMenu,
    setSidebarWidth,
    expandedWidth,
    collapsedWidth,
    currentWidth,
    currentMenuTitle,
    filterSubjectId,
    filterSubcategoryId,
    setFilterSubject,
    setFilterSubcategory,
    clearFilter
  }
}
