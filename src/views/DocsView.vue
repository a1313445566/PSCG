<template>
  <div class="feishu-docs">
    <!-- 顶部导航栏 -->
    <header class="docs-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </button>
        <div class="logo-area">
          <span class="logo-icon">📚</span>
          <h1 class="docs-title">文档中心</h1>
        </div>
      </div>

      <div class="header-center">
        <el-input
          v-model="searchQuery"
          placeholder="搜索文档..."
          clearable
          :prefix-icon="Search"
          class="global-search"
        />
      </div>

      <div class="header-right">
        <el-button type="primary" class="create-btn" @click="createNewDoc">
          <el-icon><Plus /></el-icon>
          <span>新建文档</span>
        </el-button>
        <div class="user-avatar">
          <el-avatar :size="32" icon="UserFilled" />
        </div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <div class="main-container">
      <!-- 左侧边栏：文档树 -->
      <aside class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
        <div class="sidebar-header">
          <h3 v-show="!isSidebarCollapsed" class="sidebar-title">文档目录</h3>
          <button class="toggle-sidebar" @click="isSidebarCollapsed = !isSidebarCollapsed">
            <el-icon v-if="isSidebarCollapsed"><Expand /></el-icon>
            <el-icon v-else><Fold /></el-icon>
          </button>
        </div>

        <div v-show="!isSidebarCollapsed" class="sidebar-content">
          <el-tree
            ref="treeRef"
            :data="treeData"
            :props="treeProps"
            node-key="id"
            :highlight-current="true"
            :filter-node-method="filterNode"
            :default-expand-all="true"
            class="doc-tree"
            @node-click="handleNodeClick"
          >
            <template #default="{ node, data }">
              <div class="tree-node" :class="{ 'is-file': data.type === 'file' }">
                <span class="node-icon">
                  <el-icon v-if="data.type === 'directory'">
                    <FolderOpened v-if="node.expanded" />
                    <Folder v-else />
                  </el-icon>
                  <el-icon v-else><Document /></el-icon>
                </span>
                <span class="node-label" :title="data.label">{{ data.label }}</span>
                <span v-if="data.type === 'file'" class="node-meta">
                  {{ formatDate(data.updatedAt) }}
                </span>
              </div>
            </template>
          </el-tree>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="content-area">
        <!-- 工具栏 -->
        <div class="toolbar">
          <div class="toolbar-left">
            <div class="view-switcher">
              <button
                class="view-btn"
                :class="{ active: viewMode === 'grid' }"
                title="卡片视图"
                @click="viewMode = 'grid'"
              >
                <el-icon><Grid /></el-icon>
              </button>
              <button
                class="view-btn"
                :class="{ active: viewMode === 'list' }"
                title="列表视图"
                @click="viewMode = 'list'"
              >
                <el-icon><List /></el-icon>
              </button>
            </div>

            <el-divider direction="vertical" />

            <div class="sort-options">
              <el-select v-model="sortBy" placeholder="排序方式" size="default">
                <el-option label="最近更新" value="updatedAt" />
                <el-option label="创建时间" value="createdAt" />
                <el-option label="名称" value="name" />
              </el-select>
            </div>
          </div>

          <div class="toolbar-right">
            <span class="doc-count">共 {{ filteredDocs.length }} 个文档</span>
          </div>
        </div>

        <!-- 文档内容区 -->
        <div class="docs-content">
          <!-- 空状态 -->
          <div v-if="filteredDocs.length === 0" class="empty-state">
            <el-empty description="暂无文档" :image-size="120">
              <template #description>
                <p class="empty-text">还没有文档，点击右上角"新建文档"开始创建</p>
              </template>
              <el-button type="primary" @click="createNewDoc">立即创建</el-button>
            </el-empty>
          </div>

          <!-- 卡片视图 -->
          <div v-else-if="viewMode === 'grid'" class="docs-grid">
            <div
              v-for="doc in filteredDocs"
              :key="doc.id"
              class="doc-card"
              @click="openDocument(doc)"
            >
              <div class="card-header">
                <div class="card-icon">
                  <el-icon :size="24"><Document /></el-icon>
                </div>
                <el-dropdown trigger="click" @command="cmd => handleDocAction(cmd, doc)">
                  <button class="more-btn" @click.stop>
                    <el-icon><MoreFilled /></el-icon>
                  </button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">编辑</el-dropdown-item>
                      <el-dropdown-item command="rename">重命名</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>

              <h3 class="card-title">{{ doc.title }}</h3>
              <p class="card-desc">{{ doc.description || '暂无描述' }}</p>

              <div class="card-footer">
                <span class="update-time">{{ formatDate(doc.updatedAt) }} 更新</span>
                <div class="card-tags">
                  <el-tag
                    v-for="tag in (doc.tags || []).slice(0, 2)"
                    :key="tag"
                    size="small"
                    type="info"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>

          <!-- 列表视图 -->
          <div v-else class="docs-list">
            <el-table
              :data="filteredDocs"
              style="width: 100%"
              highlight-current-row
              @row-click="openDocument"
            >
              <el-table-column prop="title" label="文档名称" min-width="300">
                <template #default="{ row }">
                  <div class="list-item-title">
                    <el-icon class="file-icon"><Document /></el-icon>
                    <span>{{ row.title }}</span>
                  </div>
                </template>
              </el-table-column>

              <el-table-column
                prop="description"
                label="描述"
                min-width="200"
                show-overflow-tooltip
              />

              <el-table-column prop="updatedAt" label="更新时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.updatedAt) }}
                </template>
              </el-table-column>

              <el-table-column label="操作" width="120" fixed="right">
                <template #default="{ row }">
                  <el-dropdown trigger="click" @command="cmd => handleDocAction(cmd, row)">
                    <el-button text type="primary" size="small">操作</el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="edit">编辑</el-dropdown-item>
                        <el-dropdown-item command="rename">重命名</el-dropdown-item>
                        <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </main>

      <!-- 右侧详情面板（选中文档时显示） -->
      <transition name="slide-fade">
        <aside v-if="selectedDoc && !selectedDoc.html" class="detail-panel">
          <div class="panel-header">
            <h3 class="panel-title">文档信息</h3>
            <button class="close-panel" @click="selectedDoc = null">
              <el-icon><Close /></el-icon>
            </button>
          </div>

          <div class="panel-content">
            <div class="info-section">
              <label>文档标题</label>
              <p>{{ selectedDoc?.title }}</p>
            </div>

            <div class="info-section">
              <label>文档路径</label>
              <p class="path-text">{{ selectedDoc?.path }}</p>
            </div>

            <div class="info-section">
              <label>更新时间</label>
              <p>{{ formatDate(selectedDoc?.updatedAt) }}</p>
            </div>

            <div v-if="selectedDoc?.tags?.length" class="info-section">
              <label>标签</label>
              <div class="tag-list">
                <el-tag
                  v-for="tag in selectedDoc.tags"
                  :key="tag"
                  size="small"
                  type="info"
                  style="margin: 2px"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>

            <div class="panel-actions">
              <el-button type="primary" style="width: 100%" @click="editDocument(selectedDoc)">
                <el-icon><Edit /></el-icon>
                编辑文档
              </el-button>
            </div>
          </div>
        </aside>
      </transition>
    </div>

    <!-- 文档查看器/编辑器弹窗 -->
    <el-dialog
      v-model="showDocViewer"
      :title="currentDoc?.title || '文档预览'"
      width="90%"
      top="5vh"
      class="doc-viewer-dialog"
      :close-on-click-modal="false"
    >
      <div
        v-if="currentDoc?.html"
        class="viewer-content markdown-body"
        v-html="currentDoc.html"
      ></div>
      <div v-else class="viewer-empty">
        <el-empty description="该文档暂无内容" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Plus,
  ArrowLeft,
  UserFilled,
  Grid,
  List,
  Document,
  Folder,
  FolderOpened,
  MoreFilled,
  Close,
  Edit,
  Expand,
  Fold
} from '@element-plus/icons-vue'

const router = useRouter()

// 响应式数据
const docsData = ref({ tree: [], stats: null })
const searchQuery = ref('')
const selectedItem = ref(null)
const selectedDoc = ref(null)
const isSidebarCollapsed = ref(false)
const treeRef = ref(null)
const viewMode = ref('grid')
const sortBy = ref('updatedAt')
const showDocViewer = ref(false)
const currentDoc = ref(null)

// el-tree 配置
const treeProps = {
  children: 'children',
  label: 'label'
}

// 将原始数据转换为 el-tree 格式
let idCounter = 0

function transformToTreeData(items) {
  return items.map(item => {
    const id = ++idCounter
    const node = {
      id,
      type: item.type,
      label: item.type === 'directory' ? item.name : item.title || item.name,
      name: item.name,
      path: item.path,
      title: item.title,
      html: item.html,
      updatedAt: item.updatedAt || new Date().toISOString(),
      tags: item.tags || [],
      description: item.description || ''
    }
    if (item.type === 'directory' && item.children) {
      node.children = transformToTreeData(item.children)
    }
    return node
  })
}

// 计算树形数据
const treeData = computed(() => {
  if (!docsData.value.tree.length) return []
  idCounter = 0
  return transformToTreeData(docsData.value.tree)
})

// 提取所有文档（扁平化）
const allDocs = computed(() => {
  const docs = []
  function extractDocs(nodes) {
    nodes.forEach(node => {
      if (node.type === 'file') {
        docs.push({
          ...node,
          id: node.id,
          title: node.label,
          updatedAt: node.updatedAt
        })
      }
      if (node.children) {
        extractDocs(node.children)
      }
    })
  }
  extractDocs(treeData.value)
  return docs
})

// 过滤和排序后的文档列表
const filteredDocs = computed(() => {
  let docs = [...allDocs.value]

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    docs = docs.filter(
      doc =>
        doc.title.toLowerCase().includes(query) || doc.description?.toLowerCase().includes(query)
    )
  }

  // 排序
  docs.sort((a, b) => {
    switch (sortBy.value) {
      case 'updatedAt':
      case 'createdAt':
        return new Date(b[sortBy.value]) - new Date(a[sortBy.value])
      case 'name':
        return a.title.localeCompare(b.title)
      default:
        return 0
    }
  })

  return docs
})

// 加载文档数据
onMounted(async () => {
  try {
    const response = await fetch('/docs-data.json')
    if (response.ok) {
      docsData.value = await response.json()
    }
  } catch (error) {
    console.error('加载文档数据失败:', error)
    ElMessage.error('加载文档失败')
  }
})

// 搜索过滤
watch(searchQuery, val => {
  if (treeRef.value) {
    treeRef.value.filter(val)
  }
})

function filterNode(value, data) {
  if (!value) return true
  const query = value.toLowerCase()
  return data.label?.toLowerCase().includes(query)
}

// 处理节点点击
function handleNodeClick(data) {
  if (data.type === 'file') {
    selectedDoc.value = {
      id: data.id,
      title: data.label,
      path: data.path,
      html: data.html,
      updatedAt: data.updatedAt,
      tags: data.tags,
      description: data.description
    }

    // 如果有HTML内容，直接打开查看器
    if (data.html) {
      openDocument(selectedDoc.value)
    }
  } else {
    selectedDoc.value = null
  }
}

// 打开文档
function openDocument(doc) {
  currentDoc.value = doc
  if (doc.html) {
    showDocViewer.value = true
  } else {
    selectedDoc.value = doc
  }
}

// 编辑文档
function editDocument(doc) {
  ElMessage.info(`正在打开编辑器: ${doc.title}`)
  // TODO: 集成富文本编辑器
}

// 创建新文档
function createNewDoc() {
  ElMessage.success('新建文档功能开发中...')
  // TODO: 实现新建文档逻辑
}

// 文档操作
async function handleDocAction(command, doc) {
  switch (command) {
    case 'edit':
      editDocument(doc)
      break
    case 'rename':
      try {
        const { value } = await ElMessageBox.prompt('请输入新的文档名称', '重命名', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputValue: doc.title
        })
        if (value) {
          ElMessage.success(`已重命名为: ${value}`)
          // TODO: 调用API更新文档名称
        }
      } catch {
        // 取消操作
      }
      break
    case 'delete':
      try {
        await ElMessageBox.confirm(`确定要删除文档"${doc.title}"吗？此操作不可恢复。`, '删除确认', {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        })
        ElMessage.success('删除成功')
        // TODO: 调用API删除文档
      } catch {
        // 取消操作
      }
      break
  }
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date

  // 小于1分钟
  if (diff < 60000) return '刚刚'
  // 小于1小时
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  // 小于1天
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  // 小于7天
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`

  // 显示具体日期
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function goBack() {
  router.back()
}
</script>

<style scoped lang="scss">
/* 飞书设计系统变量 */
$feishu-blue: #3370ff;
$feishu-blue-hover: #2860e1;
$feishu-blue-light: #e8f3ff;
$text-primary: #1f2329;
$text-regular: #646a73;
$text-secondary: #8f959e;
$bg-base: #f5f6f7;
$bg-white: #ffffff;
$border-color: #e5e6eb;
$shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
$radius-xs: 4px;
$radius-sm: 6px;
$radius-md: 8px;
$radius-lg: 12px;

.feishu-docs {
  min-height: 100vh;
  background: $bg-base;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans SC',
    'PingFang SC', 'Microsoft YaHei', sans-serif;
  display: flex;
  flex-direction: column;
}

/* ========== 顶部导航栏 ========== */
.docs-header {
  height: 64px;
  background: $bg-white;
  border-bottom: 1px solid $border-color;
  box-shadow: $shadow-sm;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 20px;
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: $text-regular;
  padding: 8px 12px;
  border-radius: $radius-sm;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background: $bg-base;
    color: $text-primary;
  }
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 24px;
}

.docs-title {
  font-size: 18px;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
  letter-spacing: -0.3px;
}

.header-center {
  flex: 1;
  max-width: 480px;
  margin: 0 auto;
}

.global-search {
  :deep(.el-input__wrapper) {
    border-radius: 20px;
    background: $bg-base;
    border: 1px solid transparent;
    box-shadow: none;
    transition: all 0.25s ease;

    &:hover {
      background: lighten($bg-base, 2%);
    }

    &:focus-within {
      background: $bg-white;
      border-color: $feishu-blue;
      box-shadow: 0 0 0 3px rgba($feishu-blue, 0.1);
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.create-btn {
  border-radius: $radius-sm;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;

  .el-icon {
    font-size: 14px;
  }
}

.user-avatar {
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
}

/* ========== 主容器布局 ========== */
.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ========== 左侧边栏 ========== */
.sidebar {
  width: 280px;
  background: $bg-white;
  border-right: 1px solid $border-color;
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  flex-shrink: 0;

  &.collapsed {
    width: 56px;
  }
}

.sidebar-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid $border-color;
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 15px;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.toggle-sidebar {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: $radius-xs;
  color: $text-regular;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: $bg-base;
    color: $text-primary;
  }
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: darken($bg-base, 10%);
    border-radius: 3px;

    &:hover {
      background: darken($bg-base, 15%);
    }
  }
}

.doc-tree {
  background: transparent;

  :deep(.el-tree-node__content) {
    height: 40px;
    border-radius: $radius-sm;
    margin: 2px 0;
    transition: all 0.2s ease;

    &:hover {
      background: $feishu-blue-light;
    }
  }

  :deep(.el-tree-node.is-current > .el-tree-node__content) {
    background: $feishu-blue-light;
    color: $feishu-blue;
    font-weight: 500;
  }

  :deep(.el-tree-node__expand-icon) {
    color: $text-secondary;
  }
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  font-size: 14px;

  .node-icon {
    color: $text-secondary;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .node-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: $text-primary;
  }

  .node-meta {
    font-size: 12px;
    color: $text-secondary;
    flex-shrink: 0;
  }

  &.is-file {
    .node-icon {
      color: $feishu-blue;
    }
  }
}

/* ========== 主内容区 ========== */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: $bg-base;
}

/* ========== 工具栏 ========== */
.toolbar {
  height: 56px;
  background: $bg-white;
  border-bottom: 1px solid $border-color;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-switcher {
  display: flex;
  background: $bg-base;
  border-radius: $radius-sm;
  padding: 2px;
  gap: 2px;
}

.view-btn {
  padding: 6px 10px;
  background: transparent;
  border: none;
  border-radius: $radius-xs;
  cursor: pointer;
  color: $text-regular;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    color: $text-primary;
  }

  &.active {
    background: $bg-white;
    color: $feishu-blue;
    box-shadow: $shadow-sm;
  }
}

.sort-options {
  :deep(.el-select) {
    width: 140px;
  }
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.doc-count {
  font-size: 13px;
  color: $text-secondary;
}

/* ========== 文档内容区 ========== */
.docs-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: darken($bg-base, 15%);
    border-radius: 4px;

    &:hover {
      background: darken($bg-base, 20%);
    }
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: $bg-white;
  border-radius: $radius-lg;
  border: 2px dashed darken($border-color, 5%);

  .empty-text {
    color: $text-secondary;
    margin-top: 12px;
    font-size: 14px;
  }
}

/* ========== 卡片视图 ========== */
.docs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.doc-card {
  background: $bg-white;
  border-radius: $radius-md;
  padding: 20px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-md;
    border-color: $border-color;

    .more-btn {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(0);
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-icon {
  width: 48px;
  height: 48px;
  background: $feishu-blue-light;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $feishu-blue;
}

.more-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: $radius-xs;
  color: $text-secondary;
  opacity: 0;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: $bg-base;
    color: $text-primary;
  }
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 8px 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-desc {
  font-size: 13px;
  color: $text-regular;
  line-height: 1.5;
  margin: 0 0 16px 0;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid $border-color;
}

.update-time {
  font-size: 12px;
  color: $text-secondary;
}

.card-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

/* ========== 列表视图 ========== */
.docs-list {
  background: $bg-white;
  border-radius: $radius-md;
  overflow: hidden;
  box-shadow: $shadow-sm;
}

.list-item-title {
  display: flex;
  align-items: center;
  gap: 8px;

  .file-icon {
    color: $feishu-blue;
    font-size: 16px;
  }
}

/* ========== 右侧详情面板 ========== */
.detail-panel {
  width: 320px;
  background: $bg-white;
  border-left: 1px solid $border-color;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.panel-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid $border-color;
  flex-shrink: 0;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.close-panel {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: $radius-xs;
  color: $text-regular;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: $bg-base;
    color: $text-primary;
  }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: darken($bg-base, 15%);
    border-radius: 3px;
  }
}

.info-section {
  margin-bottom: 20px;

  label {
    display: block;
    font-size: 12px;
    color: $text-secondary;
    font-weight: 500;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  p {
    margin: 0;
    font-size: 14px;
    color: $text-primary;
    line-height: 1.5;
  }

  .path-text {
    font-size: 13px;
    color: $text-regular;
    word-break: break-all;
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.panel-actions {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid $border-color;
}

/* ========== 文档查看器弹窗 ========== */
.doc-viewer-dialog {
  :deep(.el-dialog) {
    border-radius: $radius-lg;
    overflow: hidden;
  }

  :deep(.el-dialog__header) {
    border-bottom: 1px solid $border-color;
    padding: 16px 20px;
  }

  :deep(.el-dialog__body) {
    padding: 0;
    max-height: 80vh;
    overflow-y: auto;
  }
}

.viewer-content {
  padding: 32px 48px;
  line-height: 1.8;
  min-height: 400px;
}

.viewer-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

/* Markdown 内容样式 */
.markdown-body {
  color: $text-primary;

  :deep(h1) {
    font-size: 28px;
    font-weight: 700;
    margin: 24px 0 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid $border-color;
    letter-spacing: -0.5px;
  }

  :deep(h2) {
    font-size: 22px;
    font-weight: 600;
    margin: 20px 0 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid $border-color;
  }

  :deep(h3) {
    font-size: 18px;
    font-weight: 600;
    margin: 18px 0 10px;
  }

  :deep(p) {
    margin: 12px 0;
    line-height: 1.8;
    color: $text-regular;
  }

  :deep(code) {
    background: $bg-base;
    padding: 2px 6px;
    border-radius: $radius-xs;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 0.9em;
    color: #d63384;
  }

  :deep(pre) {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 16px 20px;
    border-radius: $radius-md;
    overflow-x: auto;
    margin: 16px 0;

    code {
      background: transparent;
      color: inherit;
      padding: 0;
    }
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 24px;
    margin: 12px 0;
  }

  :deep(li) {
    margin: 6px 0;
    line-height: 1.7;
  }

  :deep(blockquote) {
    border-left: 4px solid $feishu-blue;
    padding: 12px 20px;
    margin: 16px 0;
    background: $feishu-blue-light;
    border-radius: 0 $radius-sm $radius-sm 0;
    color: $text-regular;
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;

    th,
    td {
      border: 1px solid $border-color;
      padding: 10px 14px;
      text-align: left;
    }

    th {
      background: $bg-base;
      font-weight: 600;
      color: $text-primary;
    }

    tr:hover {
      background: lighten($bg-base, 1%);
    }
  }

  :deep(img) {
    max-width: 100%;
    border-radius: $radius-md;
    margin: 12px 0;
  }

  :deep(a) {
    color: $feishu-blue;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(hr) {
    border: none;
    border-top: 1px solid $border-color;
    margin: 24px 0;
  }
}

/* ========== 动画效果 ========== */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(30px);
  opacity: 0;
}

/* ========== 响应式设计 ========== */
@media (max-width: 1200px) {
  .sidebar {
    width: 240px;
  }

  .detail-panel {
    width: 280px;
  }

  .docs-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 992px) {
  .sidebar {
    position: absolute;
    left: 0;
    top: 64px;
    bottom: 0;
    z-index: 50;
    box-shadow: $shadow-md;

    &.collapsed {
      width: 0;
      overflow: hidden;
    }
  }

  .detail-panel {
    display: none;
  }

  .header-center {
    max-width: 320px;
  }
}

@media (max-width: 768px) {
  .docs-header {
    padding: 0 16px;
    gap: 12px;
  }

  .docs-title {
    font-size: 16px;
  }

  .header-center {
    display: none;
  }

  .create-btn span {
    display: none;
  }

  .toolbar {
    padding: 0 16px;
    flex-wrap: wrap;
    height: auto;
    padding: 12px 16px;
    gap: 12px;
  }

  .docs-content {
    padding: 16px;
  }

  .docs-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .doc-card {
    padding: 16px;
  }

  .viewer-content {
    padding: 20px 24px;
  }
}
</style>
