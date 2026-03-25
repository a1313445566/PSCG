import { ref, computed } from 'vue'

/**
 * 分页 Hook
 * 
 * 支持前端分页和服务端分页，提供统一的分页逻辑
 * 
 * @param {number} defaultPageSize - 默认每页条数，默认 10
 * @param {Ref<number>} total - 总条数（服务端分页时需要）
 * @returns {Object} 分页相关的方法和响应式数据
 * 
 * @example
 * ```js
 * // 前端分页
 * const { currentPage, pageSize, paginate } = usePagination(20)
 * const displayData = paginate(allData)
 * 
 * // 服务端分页
 * const total = ref(0)
 * const { currentPage, pageSize, getServerParams } = usePagination(20, total)
 * const params = getServerParams() // { page: 1, limit: 20 }
 * ```
 */
export function usePagination(defaultPageSize = 10, total = ref(0)) {
  // 当前页码（从 1 开始）
  const currentPage = ref(1)
  
  // 每页条数
  const pageSize = ref(defaultPageSize)
  
  /**
   * 总页数（服务端分页时使用）
   */
  const totalPages = computed(() => {
    return total.value ? Math.ceil(total.value / pageSize.value) : 0
  })
  
  /**
   * 前端分页：对数据进行切片
   * @param {Array} data - 完整数据数组
   * @returns {Array} 当前页的数据
   * 
   * @example
   * const allUsers = ref([...])  // 100 条数据
   * const { paginate } = usePagination(20)
   * const displayUsers = paginate(allUsers.value)  // 返回前 20 条
   */
  const paginate = (data) => {
    if (!data || !Array.isArray(data)) return []
    const start = (currentPage.value - 1) * pageSize.value
    return data.slice(start, start + pageSize.value)
  }
  
  /**
   * 服务端分页：生成分页参数
   * @returns {Object} 分页参数 { page, limit }
   * 
   * @example
   * const { getServerParams } = usePagination(20)
   * const params = getServerParams()  // { page: 1, limit: 20 }
   * const result = await api.get('/users', params)
   */
  const getServerParams = () => ({
    page: currentPage.value,
    limit: pageSize.value
  })
  
  /**
   * 每页条数变化处理
   * @param {number} size - 新的每页条数
   * 
   * @example
   * <el-pagination
   *   :page-size="pageSize"
   *   @size-change="handleSizeChange"
   * />
   */
  const handleSizeChange = (size) => {
    pageSize.value = size
    currentPage.value = 1  // 重置到第一页
  }
  
  /**
   * 页码变化处理
   * @param {number} page - 新的页码
   * 
   * @example
   * <el-pagination
   *   :current-page="currentPage"
   *   @current-change="handleCurrentChange"
   * />
   */
  const handleCurrentChange = (page) => {
    currentPage.value = page
  }
  
  /**
   * 跳转到指定页
   * @param {number} page - 目标页码
   * @returns {boolean} 是否跳转成功
   * 
   * @example
   * const { jumpToPage } = usePagination(20, total)
   * if (jumpToPage(5)) {
   *   console.log('跳转成功')
   * }
   */
  const jumpToPage = (page) => {
    // 验证页码范围
    if (page >= 1 && (totalPages.value === 0 || page <= totalPages.value)) {
      currentPage.value = page
      return true
    }
    return false
  }
  
  /**
   * 重置分页状态
   * - 当前页重置为第 1 页
   * - 每页条数重置为默认值
   * 
   * @example
   * const { reset } = usePagination(20)
   * reset()  // 重置为初始状态
   */
  const reset = () => {
    currentPage.value = 1
    pageSize.value = defaultPageSize
  }
  
  /**
   * 获取分页信息（用于调试或显示）
   * @returns {Object} 分页信息
   */
  const getPaginationInfo = () => ({
    currentPage: currentPage.value,
    pageSize: pageSize.value,
    totalPages: totalPages.value,
    total: total.value,
    startIndex: (currentPage.value - 1) * pageSize.value + 1,
    endIndex: Math.min(currentPage.value * pageSize.value, total.value || 0)
  })
  
  return { 
    // 响应式数据
    currentPage, 
    pageSize, 
    totalPages,
    
    // 分页方法
    paginate, 
    getServerParams,
    
    // 事件处理
    handleSizeChange, 
    handleCurrentChange,
    
    // 工具方法
    jumpToPage,
    reset,
    getPaginationInfo
  }
}
