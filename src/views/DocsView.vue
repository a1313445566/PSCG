<template>
  <div class="docs-view">
    <!-- 顶部导航 -->
    <div class="docs-header">
      <button class="back-btn" @click="goBack">
        <span class="back-icon">←</span>
        返回
      </button>
      <h1 class="docs-title">📚 文档中心</h1>
      <div v-if="docsData.stats" class="docs-stats">
        <span>{{ docsData.stats.totalFiles }} 个文档</span>
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="docs-search">
      <el-input
        v-model="searchQuery"
        placeholder="搜索文档..."
        clearable
        :prefix-icon="Search"
        class="search-input"
      />
    </div>

    <!-- 主内容区 -->
    <div class="docs-container">
      <!-- 左侧目录树 -->
      <div class="docs-sidebar" :class="{ collapsed: isSidebarCollapsed }">
        <button class="toggle-btn" @click="isSidebarCollapsed = !isSidebarCollapsed">
          {{ isSidebarCollapsed ? '展开' : '收起' }}
        </button>
        <div v-show="!isSidebarCollapsed" class="tree-container">
          <el-tree
            ref="treeRef"
            :data="treeData"
            :props="treeProps"
            node-key="id"
            :highlight-current="true"
            :filter-node-method="filterNode"
            :height="treeHeight"
            @node-click="handleNodeClick"
          >
            <template #default="{ node, data }">
              <span class="custom-tree-node">
                <span class="node-icon">
                  {{ data.type === 'directory' ? (node.expanded ? '📂' : '📁') : '📄' }}
                </span>
                <span class="node-label">{{ data.label }}</span>
              </span>
            </template>
          </el-tree>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="docs-content">
        <!-- 空状态 -->
        <div v-if="!selectedItem" class="empty-state">
          <div class="empty-icon">📖</div>
          <p class="empty-text">请从左侧选择一个文档查看</p>
        </div>

        <!-- 文档内容 -->
        <div v-else class="document-viewer">
          <div class="document-header">
            <h2 class="document-title">{{ selectedItem.title || selectedItem.name }}</h2>
            <span class="document-path">{{ selectedItem.path }}</span>
          </div>

          <!-- 直接渲染预编译的 HTML -->
          <div class="document-body markdown-body" v-html="selectedItem.html"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'

const router = useRouter()

// 响应式数据
const docsData = ref({ tree: [], stats: null })
const searchQuery = ref('')
const selectedItem = ref(null)
const isSidebarCollapsed = ref(false)
const treeRef = ref(null)
const treeHeight = ref(500)

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
      html: item.html // 预渲染的 HTML
    }
    if (item.type === 'directory' && item.children) {
      node.children = transformToTreeData(item.children)
    }
    return node
  })
}

const treeData = computed(() => {
  if (!docsData.value.tree.length) return []
  idCounter = 0
  return transformToTreeData(docsData.value.tree)
})

// 加载文档数据
onMounted(async () => {
  try {
    const response = await fetch('./docs-data.json')
    if (response.ok) {
      docsData.value = await response.json()
      treeHeight.value = window.innerHeight - 200
    }
  } catch (error) {
    console.error('加载文档数据失败:', error)
  }
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

function handleResize() {
  treeHeight.value = window.innerHeight - 200
}

// 搜索过滤
watch(searchQuery, val => {
  if (treeRef.value) {
    treeRef.value.filter(val)
  }
})

function filterNode(value, data) {
  if (!value) return true
  const query = value.toLowerCase()
  // 只搜索标题和名称，不搜索 HTML 内容（太慢）
  return data.label?.toLowerCase().includes(query)
}

// 处理节点点击
function handleNodeClick(data) {
  if (data.type === 'file') {
    selectedItem.value = {
      name: data.name,
      path: data.path,
      title: data.title,
      html: data.html
    }
  }
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.docs-view {
  min-height: 100vh;
  background: #f8f9fa;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans',
    'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 顶部导航 */
.docs-header {
  background: #0066cc;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.back-icon {
  font-size: 1.1rem;
}

.docs-title {
  flex: 1;
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: 0.5px;
}

.docs-stats {
  font-size: 0.9rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.4rem 1rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

/* 搜索框 */
.docs-search {
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.search-input {
  max-width: 600px;
  width: 100%;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  border: 1px solid #ced4da;
  box-shadow: none;
  transition: all 0.3s;
}

.search-input :deep(.el-input__wrapper:focus-within) {
  border-color: #0066cc;
  box-shadow: 0 0 0 0.2rem rgba(0, 102, 204, 0.25);
}

/* 主内容区 */
.docs-container {
  display: flex;
  height: calc(100vh - 120px);
}

/* 左侧目录 */
.docs-sidebar {
  width: 300px;
  background: white;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.docs-sidebar.collapsed {
  width: 70px;
}

.toggle-btn {
  padding: 0.75rem;
  background: #f8f9fa;
  border: none;
  border-bottom: 1px solid #e9ecef;
  cursor: pointer;
  font-size: 0.85rem;
  color: #495057;
  transition: background-color 0.2s;
}

.toggle-btn:hover {
  background: #e9ecef;
}

.tree-container {
  flex: 1;
  overflow: hidden;
  padding: 0.5rem;
}

.tree-container :deep(.el-tree) {
  background: transparent;
  --el-tree-node-content-height: 38px;
  --el-tree-node-hover-bg-color: #e3f2fd;
}

.tree-container :deep(.el-tree-node__content) {
  border-radius: 4px;
  padding: 0 8px;
  transition: all 0.2s;
}

.tree-container :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #0066cc;
  color: white;
}

.tree-container :deep(.el-tree-node__expand-icon) {
  color: #6c757d;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  font-size: 0.9rem;
  color: #495057;
}

.node-icon {
  font-size: 1rem;
  width: 16px;
  text-align: center;
}

.node-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
}

/* 右侧内容区 */
.docs-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #6c757d;
  background: white;
  margin: 2rem;
  border-radius: 8px;
  border: 2px dashed #dee2e6;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: #adb5bd;
}
.empty-text {
  font-size: 1.1rem;
  font-weight: 500;
}

/* 文档查看器 */
.document-viewer {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  margin: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  min-height: 0;
  border: 1px solid #e9ecef;
}

.document-header {
  background: #f8f9fa;
  color: #343a40;
  padding: 1.25rem 2rem;
  flex-shrink: 0;
  border-bottom: 1px solid #e9ecef;
}

.document-title {
  margin: 0 0 0.5rem;
  font-size: 1.4rem;
  font-weight: 600;
  color: #212529;
}

.document-path {
  font-size: 0.85rem;
  color: #6c757d;
}

/* Markdown 样式 */
.document-body {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  line-height: 1.7;
  min-height: 0;
  color: #343a40;
}

.markdown-body :deep(h1) {
  font-size: 2rem;
  margin: 1.5rem 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #0066cc;
  color: #212529;
  font-weight: 600;
}

.markdown-body :deep(h2) {
  font-size: 1.5rem;
  margin: 1.5rem 0 1rem;
  padding-bottom: 0.3rem;
  border-bottom: 1px solid #dee2e6;
  color: #212529;
  font-weight: 600;
}

.markdown-body :deep(h3) {
  font-size: 1.25rem;
  margin: 1.2rem 0 0.8rem;
  color: #212529;
  font-weight: 600;
}

.markdown-body :deep(h4) {
  font-size: 1.1rem;
  margin: 1rem 0 0.6rem;
  color: #212529;
  font-weight: 600;
}

.markdown-body :deep(p) {
  margin: 0.8rem 0;
  color: #495057;
}

.markdown-body :deep(code) {
  background: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
  color: #dc3545;
  border: 1px solid #e9ecef;
}

.markdown-body :deep(pre) {
  background: #f8f9fa;
  padding: 1rem 1.25rem;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1rem 0;
  border: 1px solid #e9ecef;
}

.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
  color: #495057;
  display: block;
  white-space: pre;
  border: none;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 1.5rem;
  margin: 0.8rem 0;
  color: #495057;
}

.markdown-body :deep(li) {
  margin: 0.4rem 0;
}

.markdown-body :deep(a) {
  color: #0066cc;
  text-decoration: none;
  font-weight: 500;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid #dee2e6;
  margin: 2rem 0;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid #0066cc;
  padding-left: 1rem;
  margin: 1rem 0;
  color: #6c757d;
  background: #f8f9fa;
  padding: 1rem 1.5rem;
  border-radius: 0 6px 6px 0;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
  font-size: 0.9rem;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid #dee2e6;
  padding: 0.75rem 1rem;
  text-align: left;
}

.markdown-body :deep(th) {
  background: #f8f9fa;
  font-weight: 600;
  color: #212529;
}

.markdown-body :deep(tr:nth-child(even)) {
  background: #f8f9fa;
}

.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  padding: 0.5rem;
  background: white;
}

/* 滚动条样式 */
.document-body::-webkit-scrollbar {
  width: 8px;
}

.document-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.document-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.document-body::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式 */
@media (max-width: 768px) {
  .docs-header {
    padding: 1rem;
    flex-wrap: wrap;
  }

  .docs-title {
    font-size: 1.2rem;
    order: -1;
    width: 100%;
    margin-bottom: 0.5rem;
  }

  .docs-container {
    flex-direction: column;
    height: auto;
    min-height: calc(100vh - 120px);
  }

  .docs-sidebar {
    width: 100%;
    max-height: 250px;
    border-right: none;
    border-bottom: 1px solid #e9ecef;
  }

  .document-viewer {
    margin: 0.5rem;
  }

  .document-body {
    padding: 1.25rem;
  }
}
</style>
