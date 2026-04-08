import { ref, computed } from 'vue'
import api from '../utils/api'
import message from '../utils/message'

// 导航菜单状态管理
const menus = ref([])
const loading = ref(false)
const error = ref(null)

export function useNavigationMenus() {
  // 获取所有菜单（管理后台使用）
  const fetchMenus = async () => {
    loading.value = true
    error.value = null

    try {
      const res = await api.get('/admin/navigation/menus')
      const data = res.data.data || res.data
      menus.value = Array.isArray(data) ? data : []
      return menus.value
    } catch (err) {
      error.value = err.message || '获取菜单失败'
      console.error('获取导航菜单失败:', err)
      message.error('获取导航菜单失败')
      return []
    } finally {
      loading.value = false
    }
  }

  // 获取可见菜单（前台导航栏使用）
  const fetchVisibleMenus = async () => {
    try {
      const res = await api.get('/admin/navigation/menus/visible')
      const data = res.data.data || res.data
      return Array.isArray(data) ? data : []
    } catch (err) {
      console.error('获取可见菜单失败:', err)
      // 返回默认菜单作为降级处理
      return getDefaultMenus()
    }
  }

  // 创建菜单
  const createMenu = async menuData => {
    loading.value = true

    try {
      const res = await api.post('/admin/navigation/menus', menuData)
      const newMenu = res.data.data

      // 更新本地列表
      if (newMenu) {
        menus.value.push(newMenu)
        // 按排序字段重新排列
        sortMenus()
      }

      message.success('菜单创建成功')
      return newMenu
    } catch (err) {
      console.error('创建菜单失败:', err)
      message.error(err.response?.data?.msg || '创建菜单失败')
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新菜单
  const updateMenu = async (id, menuData) => {
    loading.value = true

    try {
      const res = await api.put(`/admin/navigation/menus/${id}`, menuData)
      const updatedMenu = res.data.data

      // 更新本地列表
      if (updatedMenu) {
        const index = menus.value.findIndex(m => m.id === id)
        if (index !== -1) {
          menus.value[index] = updatedMenu
        }
      }

      message.success('菜单更新成功')
      return updatedMenu
    } catch (err) {
      console.error('更新菜单失败:', err)
      message.error(err.response?.data?.msg || '更新菜单失败')
      throw err
    } finally {
      loading.value = false
    }
  }

  // 删除菜单
  const deleteMenu = async id => {
    loading.value = true

    try {
      await api.delete(`/admin/navigation/menus/${id}`)

      // 从本地列表移除
      menus.value = menus.value.filter(m => m.id !== id)

      message.success('菜单删除成功')
      return true
    } catch (err) {
      console.error('删除菜单失败:', err)
      message.error(err.response?.data?.msg || '删除菜单失败')
      throw err
    } finally {
      loading.value = false
    }
  }

  // 批量更新排序
  const updateSortOrder = async sortedMenus => {
    loading.value = true

    try {
      await api.put('/admin/navigation/menus/sort', { menus: sortedMenus })

      // 更新本地列表的排序值
      sortedMenus.forEach(item => {
        const menu = menus.value.find(m => m.id === item.id)
        if (menu) {
          menu.sort_order = item.sort_order
        }
      })

      // 重新排序
      sortMenus()

      message.success('排序更新成功')
      return true
    } catch (err) {
      console.error('更新排序失败:', err)
      message.error('更新排序失败')
      throw err
    } finally {
      loading.value = false
    }
  }

  // 本地排序（按 sort_order 和 id）
  const sortMenus = () => {
    menus.value.sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order
      }
      return a.id - b.id
    })
  }

  // 计算属性：可见的菜单
  const visibleMenus = computed(() => {
    return menus.value
      .filter(m => m.is_visible)
      .sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order
        }
        return a.id - b.id
      })
  })

  return {
    // 状态
    menus,
    loading,
    error,
    visibleMenus,

    // 方法
    fetchMenus,
    fetchVisibleMenus,
    createMenu,
    updateMenu,
    deleteMenu,
    updateSortOrder
  }
}

// 默认菜单数据（用于 API 失败时的降级处理）
function getDefaultMenus() {
  return [
    { id: 0, name: '首页', type: 'route', path: '/new', icon: 'HomeFilled', sort_order: 1 },
    { id: 0, name: '产品功能', type: 'route', path: '/', icon: 'Grid', sort_order: 2 },
    { id: 0, name: '解决方案', type: 'route', path: '/', icon: 'MagicStick', sort_order: 3 },
    { id: 0, name: '帮助中心', type: 'route', path: '/', icon: 'QuestionFilled', sort_order: 4 }
  ]
}
