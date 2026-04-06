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
                  {{ formatDate(data.createdAt) }}
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
                <el-option label="创建时间" value="createdAt" />
                <el-option label="最近更新" value="updatedAt" />
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
                <p class="empty-text">当前暂无文档内容</p>
              </template>
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
              </div>

              <h3 class="card-title">{{ doc.title }}</h3>
              <p class="card-desc">{{ doc.description || '暂无描述' }}</p>

              <div class="card-footer">
                <span class="update-time">{{ formatDate(doc.createdAt) }} 创建</span>
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

              <el-table-column prop="createdAt" label="创建时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.createdAt) }}
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
              <label>创建时间</label>
              <p>{{ formatDate(selectedDoc?.createdAt) }}</p>
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
import { ElMessage } from 'element-plus'
import {
  Search,
  ArrowLeft,
  Grid,
  List,
  Document,
  Folder,
  FolderOpened,
  Close,
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
const sortBy = ref('createdAt')
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
      createdAt: item.createdAt || null,
      updatedAt: item.updatedAt || null,
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
          createdAt: node.createdAt,
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
      createdAt: data.createdAt,
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


<style scoped lang="scss" src="./styles/DocsView.scss"></style>
