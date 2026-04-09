<template>
  <div
    class="admin-sidebar"
    :class="{ 'is-mobile': isMobile, 'mobile-open': mobileOpen }"
    :style="{ width: isMobile ? '240px' : currentWidth + 'px' }"
  >
    <!-- 折叠按钮 -->
    <div class="collapse-btn" @click="handleCollapseClick">
      <el-icon :size="20">
        <ArrowLeft v-if="!isCollapse && !isMobile" />
        <ArrowRight v-else-if="!isMobile" />
        <Close v-if="isMobile && mobileOpen" />
        <Menu v-if="isMobile && !mobileOpen" />
      </el-icon>
    </div>

    <!-- 树形菜单 -->
    <el-scrollbar class="sidebar-scroll">
      <!-- 折叠状态显示图标菜单 -->
      <div v-if="isCollapse" class="collapsed-menu">
        <el-tooltip
          v-for="item in topLevelNodes"
          :key="item.key"
          :content="item.label"
          placement="right"
          :show-after="300"
        >
          <div
            class="collapsed-menu-item"
            :class="{
              active: activeMenu === item.key || (item.key === 'questions' && isQuestionsActive)
            }"
            @click="handleCollapsedClick(item)"
          >
            <el-icon :size="20">
              <component :is="getIconComponent(item.icon)" />
            </el-icon>
          </div>
        </el-tooltip>
      </div>

      <!-- 展开状态显示树形菜单 -->
      <el-tree
        v-else
        ref="treeRef"
        :data="menuTreeData"
        :props="treeProps"
        node-key="id"
        :default-expanded-keys="expandedKeys"
        :current-node-key="currentNodeKey"
        highlight-current
        :expand-on-click-node="false"
        @node-click="handleNodeClick"
      >
        <template #default="{ node, data }">
          <span class="tree-node" :class="{ 'is-menu': data.isMenu, 'is-filter': data.isFilter }">
            <el-icon v-if="data.icon" class="node-icon">
              <component :is="getIconComponent(data.icon)" />
            </el-icon>
            <span class="node-label">{{ node.label }}</span>
            <span v-if="data.questionCount !== undefined" class="node-count">
              ({{ data.questionCount }})
            </span>
            <el-button
              v-if="data.showClearFilter && (filterSubjectId || filterSubcategoryId)"
              type="primary"
              size="small"
              link
              class="clear-btn"
              @click.stop="handleClearFilter"
            >
              清除
            </el-button>
          </span>
        </template>
      </el-tree>
    </el-scrollbar>

    <!-- 拖拽调整宽度 -->
    <div v-if="!isCollapse" class="resize-handle" @mousedown="startResize" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted, inject, nextTick, onMounted } from 'vue'
import { useAdminLayout } from '../../../composables/useAdminLayout'
import {
  DataLine,
  Document,
  Reading,
  School,
  UserFilled,
  User,
  Tools,
  Coin,
  Lock,
  ArrowLeft,
  ArrowRight,
  Grid,
  FolderOpened,
  Histogram,
  Clock,
  TrendCharts,
  ChatDotRound,
  Cpu,
  Close,
  Menu,
  Setting,
  PriceTag,
  Postcard
} from '@element-plus/icons-vue'

const {
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
  isContentManagement,
  initializeState,
  hasPermission
} = useAdminLayout()

// 从父组件注入权限
const permissions = inject('permissions', ref({}))
const permissionsLoaded = inject('permissionsLoaded', ref(false))

// 从父组件注入 subjects
const subjects = inject('subjects', ref([]))

const emit = defineEmits(['menu-select', 'mobile-state-change'])
const treeRef = ref(null)

// 移动端状态
const isMobile = ref(false)
const mobileOpen = ref(false)

// 检测屏幕尺寸
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 992
  if (!isMobile.value) {
    mobileOpen.value = false
  }
}

// 处理折叠按钮点击
const handleCollapseClick = () => {
  if (isMobile.value) {
    mobileOpen.value = !mobileOpen.value
    emit('mobile-state-change', mobileOpen.value)
  } else {
    toggleCollapse()
  }
}

// 暴露方法给父组件
const openMobileSidebar = () => {
  if (isMobile.value) {
    mobileOpen.value = true
    emit('mobile-state-change', true)
  }
}

// 关闭移动端侧边栏
const closeMobileSidebar = () => {
  if (isMobile.value) {
    mobileOpen.value = false
    emit('mobile-state-change', false)
  }
}

defineExpose({
  openMobileSidebar,
  closeMobileSidebar
})

// 图标组件映射
const iconMap = {
  DataLine,
  Document,
  Reading,
  School,
  UserFilled,
  User,
  Tools,
  Coin,
  Lock,
  Grid,
  FolderOpened,
  Histogram,
  Clock,
  TrendCharts,
  ChatDotRound,
  Cpu,
  Setting,
  PriceTag,
  Postcard
}

// 获取图标组件
const getIconComponent = iconName => {
  return iconMap[iconName] || Document
}

// 顶级菜单节点（用于折叠状态）- 根据权限过滤
const topLevelNodes = computed(() => {
  if (isContentManagement.value) {
    return [{ key: 'admin-permission', label: '管理员管理', icon: 'UserFilled' }]
  }
  const allNodes = [
    { key: 'dashboard', label: '数据概览', icon: 'DataLine', permissionKey: 'dashboard' },
    { key: 'questions', label: '题目管理', icon: 'Document', permissionKey: 'questions' },
    { key: 'subjects', label: '学科管理', icon: 'Reading', permissionKey: 'subjects' },
    { key: 'grades-classes', label: '年级班级', icon: 'School', permissionKey: 'grades-classes' },
    { key: 'user-data', label: '答题数据', icon: 'UserFilled', permissionKey: 'user-stats' },
    { key: 'user-management', label: '用户管理', icon: 'User', permissionKey: 'user-management' },
    {
      key: 'data-analysis',
      label: '数据分析',
      icon: 'TrendCharts',
      permissionKey: 'data-analysis'
    },
    { key: 'ai-chat', label: 'AI 助手', icon: 'ChatDotRound', permissionKey: 'ai-chat' },
    { key: 'ai-models', label: '模型管理', icon: 'Cpu', permissionKey: 'ai-models' },
    { key: 'basic-settings', label: '基础设置', icon: 'Tools', permissionKey: 'basic-settings' },
    { key: 'database', label: '数据库管理', icon: 'Coin', permissionKey: 'database' },
    { key: 'security', label: '安全中心', icon: 'Lock', permissionKey: 'security' }
  ]
  // 根据权限过滤
  return allNodes.filter(node => hasPermission(node.permissionKey, 'view'))
})

// 树形数据配置
const treeProps = {
  children: 'children',
  label: 'label'
}

// 展开的节点
const expandedKeys = ref(['questions'])

// 当前选中的节点
const currentNodeKey = computed(() => {
  // 如果在题目管理页面且有筛选
  if (activeMenu.value === 'questions') {
    if (filterSubjectId.value && filterSubcategoryId.value) {
      return `subcategory-${filterSubcategoryId.value}`
    }
    if (filterSubjectId.value) {
      return `subject-${filterSubjectId.value}`
    }
    return 'all-questions'
  }
  return activeMenu.value
})

// 是否在题目管理相关页面
const isQuestionsActive = computed(() => {
  if (isContentManagement.value) return false
  return activeMenu.value === 'questions' || filterSubjectId.value || filterSubcategoryId.value
})

// 树形菜单数据 - 根据权限过滤
const menuTreeData = computed(() => {
  if (isContentManagement.value) {
    const topLevelMenus = []
    const adminMenuItems = []

    // 导航菜单管理 - 作为独立顶级菜单
    if (hasPermission('basic-settings', 'view')) {
      topLevelMenus.push({
        id: 'navigation-management',
        label: '导航菜单管理',
        icon: 'Grid',
        isMenu: true
      })
      topLevelMenus.push({
        id: 'product-card-management',
        label: '产品卡片管理',
        icon: 'Postcard',
        isMenu: true
      })

      // CMS 内容管理
      topLevelMenus.push({
        id: 'article-management',
        label: '文章管理',
        icon: 'Document',
        isMenu: true
      })
      topLevelMenus.push({
        id: 'category-management',
        label: '分类管理',
        icon: 'FolderOpened',
        isMenu: true
      })
      topLevelMenus.push({
        id: 'tag-management',
        label: '标签管理',
        icon: 'PriceTag',
        isMenu: true
      })
    }

    // 角色管理权限
    if (hasPermission('admin-roles', 'view')) {
      adminMenuItems.push({
        id: 'role-management',
        label: '角色管理',
        icon: 'Setting',
        isMenu: true
      })
    }
    // 管理员用户权限
    if (hasPermission('admin-users', 'view')) {
      adminMenuItems.push({
        id: 'admin-user-management',
        label: '管理员用户',
        icon: 'User',
        isMenu: true
      })
    }

    // 如果有管理员子菜单，添加管理员管理节点
    if (adminMenuItems.length > 0) {
      topLevelMenus.push({
        id: 'admin-permission',
        label: '管理员管理',
        icon: 'UserFilled',
        isMenu: true,
        children: adminMenuItems
      })
    }

    // 如果没有任何菜单，返回空数组
    if (topLevelMenus.length === 0) return []

    return topLevelMenus
  }

  const subjectsValue = subjects.value || []

  // 构建学科筛选节点
  const subjectFilterNodes = subjectsValue.map(subject => ({
    id: `subject-${subject.id}`,
    label: subject.name,
    icon: 'Reading',
    type: 'subject',
    subjectId: subject.id,
    isFilter: true,
    questionCount: subject.questionCount || 0,
    children: (subject.subcategories || []).map(sub => ({
      id: `subcategory-${sub.id}`,
      label: sub.name,
      type: 'subcategory',
      subjectId: subject.id,
      subcategoryId: sub.id,
      isFilter: true,
      questionCount: sub.questionCount || 0
    }))
  }))

  const allMenus = []

  // 数据概览
  if (hasPermission('dashboard', 'view')) {
    allMenus.push({
      id: 'dashboard',
      label: '数据概览',
      icon: 'DataLine',
      isMenu: true
    })
  }

  // 题目管理
  if (hasPermission('questions', 'view')) {
    allMenus.push({
      id: 'questions',
      label: '题目管理',
      icon: 'Document',
      isMenu: true,
      showClearFilter: true,
      children: [
        {
          id: 'all-questions',
          label: '全部题目',
          icon: 'Grid',
          isMenu: true,
          isFilter: true
        },
        ...subjectFilterNodes
      ]
    })
  }

  // 学科管理
  if (hasPermission('subjects', 'view')) {
    allMenus.push({
      id: 'subjects',
      label: '学科管理',
      icon: 'FolderOpened',
      isMenu: true
    })
  }

  // 年级班级
  if (hasPermission('grades-classes', 'view')) {
    allMenus.push({
      id: 'grades-classes',
      label: '年级班级',
      icon: 'School',
      isMenu: true
    })
  }

  // 用户数据（需要 user-stats 或 recent-records 权限）
  const userDataChildren = []
  if (hasPermission('user-stats', 'view')) {
    userDataChildren.push({
      id: 'user-stats',
      label: '用户答题统计',
      icon: 'Histogram',
      isMenu: true
    })
  }
  if (hasPermission('recent-records', 'view')) {
    userDataChildren.push({
      id: 'recent-records',
      label: '答题记录',
      icon: 'Clock',
      isMenu: true
    })
  }
  if (userDataChildren.length > 0) {
    allMenus.push({
      id: 'user-data',
      label: '用户数据',
      icon: 'UserFilled',
      isMenu: true,
      children: userDataChildren
    })
  }

  // 用户管理
  if (hasPermission('user-management', 'view')) {
    allMenus.push({
      id: 'user-management',
      label: '用户管理',
      icon: 'User',
      isMenu: true
    })
  }

  // 数据分析
  if (hasPermission('data-analysis', 'view')) {
    allMenus.push({
      id: 'data-analysis',
      label: '数据分析',
      icon: 'TrendCharts',
      isMenu: true
    })
  }

  // AI 助手
  if (hasPermission('ai-chat', 'view')) {
    allMenus.push({
      id: 'ai-chat',
      label: 'AI 助手',
      icon: 'ChatDotRound',
      isMenu: true
    })
  }

  // 模型管理
  if (hasPermission('ai-models', 'view')) {
    allMenus.push({
      id: 'ai-models',
      label: '模型管理',
      icon: 'Cpu',
      isMenu: true
    })
  }

  // 基础设置
  if (hasPermission('basic-settings', 'view')) {
    allMenus.push({
      id: 'basic-settings',
      label: '基础设置',
      icon: 'Tools',
      isMenu: true
    })
  }

  // 数据库管理
  if (hasPermission('database', 'view')) {
    allMenus.push({
      id: 'database',
      label: '数据库管理',
      icon: 'Coin',
      isMenu: true
    })
  }

  // 安全中心
  if (hasPermission('security', 'view')) {
    allMenus.push({
      id: 'security',
      label: '安全中心',
      icon: 'Lock',
      isMenu: true
    })
  }

  return allMenus
})

// 节点点击处理
const handleNodeClick = (data, _node) => {
  // 如果是内容管理系统的父节点，默认展开并选中第一个子节点
  if (isContentManagement.value && data.id === 'admin-permission') {
    setActiveMenu('role-management')
    emit('menu-select', 'role-management')
    // 自动展开父节点
    expandedKeys.value = ['admin-permission']
  }
  // 如果是"全部题目"
  else if (data.id === 'all-questions') {
    setActiveMenu('questions')
    emit('menu-select', 'questions')
    clearFilter()
  }
  // 如果是"用户数据"父节点，默认跳转到用户答题统计
  else if (data.id === 'user-data') {
    setActiveMenu('user-stats')
    emit('menu-select', 'user-stats')
  }
  // 如果是菜单项，切换到对应页面
  else if (data.isMenu) {
    setActiveMenu(data.id)
    emit('menu-select', data.id)
    // 切换到其他页面时清除筛选
    if (data.id !== 'questions') {
      clearFilter()
    }
  }
  // 如果是学科节点，设置筛选
  else if (data.type === 'subject') {
    setActiveMenu('questions')
    emit('menu-select', 'questions')
    setFilterSubject(data.subjectId)
  }
  // 如果是题库节点，设置筛选
  else if (data.type === 'subcategory') {
    setActiveMenu('questions')
    emit('menu-select', 'questions')
    setFilterSubcategory(data.subjectId, data.subcategoryId)
  }
}

// 折叠状态点击
const handleCollapsedClick = item => {
  setActiveMenu(item.key)
  emit('menu-select', item.key)
  // 点击题目管理时清除筛选，显示全部
  if (item.key === 'questions') {
    clearFilter()
  }
}

// 清除筛选
const handleClearFilter = () => {
  clearFilter()
  // 清除后选中"全部题目"
  if (treeRef.value) {
    treeRef.value.setCurrentKey('all-questions')
  }
}

// 监听展开状态变化，更新树选中状态
watch(isCollapse, async collapsed => {
  if (!collapsed && treeRef.value) {
    await nextTick()
    treeRef.value.setCurrentKey(currentNodeKey.value)
  }
})

// 监听当前节点变化
watch(currentNodeKey, newKey => {
  if (treeRef.value && !isCollapse.value) {
    treeRef.value.setCurrentKey(newKey)
  }
})

// 拖拽调整宽度
const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(0)

const startResize = e => {
  isResizing.value = true
  startX.value = e.clientX
  startWidth.value = currentWidth.value

  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

const handleResize = e => {
  if (!isResizing.value) return

  const diff = e.clientX - startX.value
  const newWidth = startWidth.value + diff

  setSidebarWidth(newWidth)
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// 组件卸载时清理
onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  window.removeEventListener('resize', checkMobile)
})

// 组件挂载时检测
onMounted(() => {
  // 初始化状态（从 localStorage 恢复）
  initializeState()

  checkMobile()
  window.addEventListener('resize', checkMobile)
})
</script>

<style scoped lang="scss">
.admin-sidebar {
  position: relative;
  height: 100%;
  background-color: #304156;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;

  // 移动端样式
  &.is-mobile {
    position: fixed;
    left: -240px;
    top: 0;
    bottom: 0;
    height: 100vh;
    z-index: 1000;
    transition: left 0.3s ease;

    &.mobile-open {
      left: 0;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
    }
  }
}

.collapse-btn {
  position: absolute;
  top: 16px;
  right: -12px;
  width: 24px;
  height: 24px;
  background-color: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  color: #fff;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);

  // 移动端调整按钮位置到内部
  .is-mobile & {
    right: 8px;
    top: 12px;
  }
}

.collapse-btn:hover {
  background-color: #66b1ff;
  transform: scale(1.1);
}

.sidebar-scroll {
  flex: 1;
  overflow: hidden;
}

/* 折叠状态菜单 */
.collapsed-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
}

.collapsed-menu-item {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  color: #bfcbd9;
  transition: all 0.3s;
}

.collapsed-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.collapsed-menu-item.active {
  background-color: #409eff !important;
  color: #fff !important;
}

/* 树形菜单样式 */
:deep(.el-tree) {
  background-color: transparent !important;
  color: #bfcbd9;
  font-size: 14px;
}

:deep(.el-tree-node) {
  outline: none;
}

:deep(.el-tree-node__content) {
  height: 48px !important;
  line-height: 48px !important;
  margin: 4px 8px !important;
  padding: 0 12px !important;
  border-radius: 4px !important;
  background-color: transparent !important;
}

:deep(.el-tree-node__content:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #409eff !important;
  color: #fff !important;
}

:deep(.el-tree-node.is-current > .el-tree-node__content .node-icon) {
  color: #fff !important;
}

:deep(.el-tree-node__expand-icon) {
  color: #bfcbd9 !important;
  font-size: 12px;
  padding: 6px;
}

:deep(.el-tree-node__expand-icon.is-leaf) {
  color: transparent !important;
}

:deep(.el-tree-node__expand-icon.expanded) {
  transform: rotate(90deg);
}

/* 树节点样式 */
.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  height: 100%;
}

.tree-node.is-menu {
  font-weight: 500;
}

.tree-node.is-filter {
  font-weight: normal;
}

.node-icon {
  font-size: 18px;
  color: #bfcbd9;
  flex-shrink: 0;
}

.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.node-count {
  color: #909399;
  font-size: 12px;
  flex-shrink: 0;
}

.clear-btn {
  flex-shrink: 0;
  padding: 2px 8px;
  font-size: 12px;
  margin-left: 4px;
}

/* 子节点缩进 - 题目管理下的子节点 */
:deep(.el-tree-node__children) {
  background-color: #263445;
}

:deep(.el-tree-node__children .el-tree-node__content) {
  height: 42px !important;
  line-height: 42px !important;
  padding-left: 32px !important;
}

:deep(.el-tree-node__children .el-tree-node__children .el-tree-node__content) {
  height: 38px !important;
  line-height: 38px !important;
  padding-left: 48px !important;
}

:deep(.el-tree-node__children .tree-node) {
  font-weight: normal;
}

:deep(.el-tree-node__children .node-icon) {
  font-size: 16px;
}

:deep(.el-tree-node__children .node-label) {
  font-size: 13px;
}

/* 拖拽手柄 */
.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  cursor: col-resize;
  background-color: transparent;
  transition: background-color 0.3s;
}

.resize-handle:hover {
  background-color: #409eff;
}
</style>
