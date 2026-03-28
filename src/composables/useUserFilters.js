import { ref, computed } from 'vue'

/**
 * 用户筛选 Hook
 *
 * 用于管理用户筛选字段，提供验证、重置、参数转换等功能
 *
 * @returns {Object} 筛选相关的方法和响应式数据
 *
 * @example
 * ```js
 * import { useUserFilters } from '@/composables/useUserFilters'
 *
 * const {
 *   studentId,
 *   grade,
 *   classNum,
 *   validate,
 *   reset,
 *   toParams
 * } = useUserFilters()
 *
 * // 设置筛选条件
 * studentId.value = '2024001'
 * grade.value = '3'
 *
 * // 验证筛选条件
 * const errors = validate()
 * if (errors.length > 0) {
 *   ElMessage.error(errors[0])
 *   return
 * }
 *
 * // 转换为 API 参数
 * const params = toParams()
 * const result = await api.get('/users', params)
 * ```
 */
export function useUserFilters() {
  // 筛选字段
  const studentId = ref('') // 学号
  const grade = ref('') // 年级
  const classNum = ref('') // 班级（注意：class 是保留字）
  const subject = ref('') // 学科
  const name = ref('') // 姓名

  /**
   * 验证筛选条件
   * @returns {Array<string>} 错误信息数组，空数组表示验证通过
   *
   * @example
   * const errors = validate()
   * if (errors.length > 0) {
   *   console.log('验证失败:', errors)
   * }
   */
  const validate = () => {
    const errors = []

    // 学号只能包含数字
    if (studentId.value && !/^\d*$/.test(studentId.value)) {
      errors.push('学号只能包含数字')
    }

    // 年级范围检查（1-6年级）
    if (grade.value && (parseInt(grade.value) < 1 || parseInt(grade.value) > 6)) {
      errors.push('年级必须在 1-6 之间')
    }

    // 班级范围检查（1-20班）
    if (classNum.value && (parseInt(classNum.value) < 1 || parseInt(classNum.value) > 20)) {
      errors.push('班级必须在 1-20 之间')
    }

    // 姓名长度检查
    if (name.value && name.value.length > 20) {
      errors.push('姓名长度不能超过 20 个字符')
    }

    // 学号长度检查（防止过长输入）
    if (studentId.value && studentId.value.length > 20) {
      errors.push('学号长度不能超过 20 个字符')
    }

    return errors
  }

  /**
   * 重置筛选条件
   * - 清空所有筛选字段
   *
   * @example
   * reset()  // 清空所有筛选条件
   */
  const reset = () => {
    studentId.value = ''
    grade.value = ''
    classNum.value = ''
    subject.value = ''
    name.value = ''
  }

  /**
   * 转换为 API 参数
   * - 过滤掉空值
   * - 统一字段命名
   * @returns {Object} API 参数对象
   *
   * @example
   * studentId.value = '2024001'
   * grade.value = '3'
   * const params = toParams()
   * // { student_id: '2024001', grade: '3' }
   */
  const toParams = () => {
    const params = {}

    // 只有非空值才添加到参数中
    if (studentId.value) params.student_id = studentId.value
    if (name.value) params.name = name.value
    if (grade.value) params.grade = grade.value
    if (classNum.value) params.class = classNum.value
    if (subject.value) params.subjectId = subject.value

    return params
  }

  /**
   * 是否有活动的筛选条件
   * - 用于判断是否显示"清除筛选"按钮
   * @returns {boolean} 是否有活动的筛选条件
   *
   * @example
   * <el-button v-if="hasActiveFilters" @click="reset">清除筛选</el-button>
   */
  const hasActiveFilters = computed(() => {
    return !!(studentId.value || grade.value || classNum.value || subject.value || name.value)
  })

  /**
   * 获取筛选条件数量
   * - 用于显示筛选条件数量徽章
   * @returns {number} 活动的筛选条件数量
   *
   * @example
   * <el-badge :value="filterCount" :hidden="filterCount === 0">
   *   <el-button>筛选</el-button>
   * </el-badge>
   */
  const filterCount = computed(() => {
    let count = 0
    if (studentId.value) count++
    if (grade.value) count++
    if (classNum.value) count++
    if (subject.value) count++
    if (name.value) count++
    return count
  })

  /**
   * 获取筛选条件描述
   * - 用于显示当前筛选条件摘要
   * @returns {string} 筛选条件描述
   *
   * @example
   * <div v-if="hasActiveFilters">当前筛选: {{ filterDescription }}</div>
   */
  const filterDescription = computed(() => {
    const descriptions = []

    if (studentId.value) descriptions.push(`学号: ${studentId.value}`)
    if (name.value) descriptions.push(`姓名: ${name.value}`)
    if (grade.value) descriptions.push(`${grade.value}年级`)
    if (classNum.value) descriptions.push(`${classNum.value}班`)
    if (subject.value) descriptions.push(`学科ID: ${subject.value}`)

    return descriptions.join('、')
  })

  /**
   * 批量设置筛选条件
   * @param {Object} filters - 筛选条件对象
   *
   * @example
   * setFilters({
   *   studentId: '2024001',
   *   grade: '3',
   *   classNum: '2'
   * })
   */
  const setFilters = filters => {
    if (filters.studentId !== undefined) studentId.value = filters.studentId
    if (filters.name !== undefined) name.value = filters.name
    if (filters.grade !== undefined) grade.value = filters.grade
    if (filters.classNum !== undefined) classNum.value = filters.classNum
    if (filters.subject !== undefined) subject.value = filters.subject
  }

  /**
   * 获取当前筛选条件（用于保存或恢复）
   * @returns {Object} 当前筛选条件对象
   *
   * @example
   * const currentFilters = getFilters()
   * localStorage.setItem('userFilters', JSON.stringify(currentFilters))
   */
  const getFilters = () => ({
    studentId: studentId.value,
    name: name.value,
    grade: grade.value,
    classNum: classNum.value,
    subject: subject.value
  })

  /**
   * 从 URL 查询参数恢复筛选条件
   * @param {Object} query - URL 查询参数对象（如 route.query）
   *
   * @example
   * import { useRoute } from 'vue-router'
   * const route = useRoute()
   * restoreFromQuery(route.query)
   */
  const restoreFromQuery = query => {
    if (query.student_id) studentId.value = query.student_id
    if (query.name) name.value = query.name
    if (query.grade) grade.value = query.grade
    if (query.class) classNum.value = query.class
    if (query.subjectId) subject.value = query.subjectId
  }

  /**
   * 将筛选条件转换为 URL 查询参数
   * @returns {Object} URL 查询参数对象
   *
   * @example
   * const query = toQueryParams()
   * router.push({ query })
   */
  const toQueryParams = () => {
    const query = {}

    if (studentId.value) query.student_id = studentId.value
    if (name.value) query.name = name.value
    if (grade.value) query.grade = grade.value
    if (classNum.value) query.class = classNum.value
    if (subject.value) query.subjectId = subject.value

    return query
  }

  return {
    // 筛选字段
    studentId,
    grade,
    classNum,
    subject,
    name,

    // 验证方法
    validate,

    // 操作方法
    reset,
    setFilters,
    getFilters,
    toParams,

    // URL 相关
    restoreFromQuery,
    toQueryParams,

    // 计算属性
    hasActiveFilters,
    filterCount,
    filterDescription
  }
}
