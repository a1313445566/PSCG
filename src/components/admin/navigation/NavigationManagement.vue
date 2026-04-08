<template>
  <div class="navigation-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>导航菜单管理</h2>
      <p class="description">自定义前台导航栏的菜单项，支持添加、编辑、删除和排序</p>
    </div>

    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加菜单
      </el-button>
      <el-button @click="fetchMenus">
        <el-icon><Refresh /></el-icon>
        刷新列表
      </el-button>
    </div>

    <!-- 菜单列表 -->
    <el-table v-loading="loading" :data="menus" border stripe row-key="id" style="width: 100%">
      <!-- 排序拖拽手柄 -->
      <el-table-column label="排序" width="80" align="center">
        <template #default>
          <el-icon class="drag-handle"><Rank /></el-icon>
        </template>
      </el-table-column>

      <!-- ID -->
      <el-table-column prop="id" label="ID" width="70" align="center" />

      <!-- 菜单名称 -->
      <el-table-column prop="name" label="菜单名称" min-width="120" />

      <!-- 类型 -->
      <el-table-column prop="type" label="类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.type === 'route' ? 'primary' : 'success'" size="small">
            {{ row.type === 'route' ? '内部路由' : '外部链接' }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 路径/URL -->
      <el-table-column prop="path" label="路径/URL" min-width="180" show-overflow-tooltip />

      <!-- 图标 -->
      <el-table-column prop="icon" label="图标" width="100" align="center">
        <template #default="{ row }">
          <span v-if="row.icon">{{ row.icon }}</span>
          <span v-else class="text-muted">未设置</span>
        </template>
      </el-table-column>

      <!-- 排序序号 -->
      <el-table-column prop="sort_order" label="排序" width="80" align="center" />

      <!-- 可见状态 -->
      <el-table-column prop="is_visible" label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-switch
            v-model="row.is_visible"
            :active-value="1"
            :inactive-value="0"
            @change="handleToggleVisible(row)"
          />
        </template>
      </el-table-column>

      <!-- 操作按钮 -->
      <el-table-column label="操作" width="160" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-popconfirm title="确定要删除这个菜单吗？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button type="danger" link size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑菜单' : '添加菜单'"
      width="600px"
      :close-on-click-modal="false"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <!-- 菜单名称 -->
        <el-form-item label="菜单名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入菜单名称（如：首页、产品功能）"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <!-- 菜单类型 -->
        <el-form-item label="菜单类型" prop="type">
          <el-radio-group v-model="formData.type">
            <el-radio value="route">内部路由</el-radio>
            <el-radio value="link">外部链接</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 路径/URL - 智能选择器 -->
        <el-form-item :label="formData.type === 'route' ? '路由路径' : '外部URL'" prop="path">
          <el-select
            v-if="formData.type === 'route'"
            v-model="formData.path"
            filterable
            allow-create
            default-first-option
            placeholder="请选择或输入路由路径"
            style="width: 100%"
            @change="handleRouteChange"
          >
            <el-option-group label="📌 核心页面">
              <el-option
                v-for="page in corePages"
                :key="page.path"
                :label="`${page.name} (${page.path})`"
                :value="page.path"
              >
                <div class="page-option">
                  <span class="page-name">{{ page.name }}</span>
                  <span class="page-path">{{ page.path }}</span>
                </div>
              </el-option>
            </el-option-group>
            <el-option-group label="📚 学习功能">
              <el-option
                v-for="page in learningPages"
                :key="page.path"
                :label="`${page.name} (${page.path})`"
                :value="page.path"
              >
                <div class="page-option">
                  <span class="page-name">{{ page.name }}</span>
                  <span class="page-path">{{ page.path }}</span>
                </div>
              </el-option>
            </el-option-group>
            <el-option-group label="👤 用户中心">
              <el-option
                v-for="page in userPages"
                :key="page.path"
                :label="`${page.name} (${page.path})`"
                :value="page.path"
              >
                <div class="page-option">
                  <span class="page-name">{{ page.name }}</span>
                  <span class="page-path">{{ page.path }}</span>
                </div>
              </el-option>
            </el-option-group>
            <el-option-group label="⚙️ 系统管理">
              <el-option
                v-for="page in systemPages"
                :key="page.path"
                :label="`${page.name} (${page.path})`"
                :value="page.path"
              >
                <div class="page-option">
                  <span class="page-name">{{ page.name }}</span>
                  <span class="page-path">{{ page.path }}</span>
                </div>
              </el-option>
            </el-option-group>
          </el-select>

          <el-input
            v-else
            v-model="formData.path"
            placeholder="请输入完整 URL（如：https://example.com）"
            maxlength="500"
            show-word-limit
          />

          <div class="form-tip" v-if="formData.type === 'route'">
            💡 选择预设页面会自动填充菜单名称和图标，也可手动输入自定义路径
          </div>
        </el-form-item>

        <!-- 图标（可选） -->
        <el-form-item label="图标" prop="icon">
          <el-popover
            placement="bottom-start"
            :width="680"
            trigger="click"
          >
            <template #reference>
              <div class="icon-selector-trigger">
                <el-icon v-if="formData.icon" class="selected-icon">
                  <component :is="formData.icon" />
                </el-icon>
                <span v-else class="placeholder">选择图标（可选）</span>
                <el-icon class="arrow-icon"><ArrowDown /></el-icon>
              </div>
            </template>

            <!-- 图标选择网格 -->
            <div class="icon-selector-grid">
              <!-- 清除选项 -->
              <div
                class="icon-item clear-option"
                @click="selectIcon('')"
                :class="{ active: !formData.icon }"
              >
                <span>无</span>
              </div>

              <!-- 所有可用图标 -->
              <div
                v-for="icon in availableIcons"
                :key="icon.name"
                class="icon-item"
                @click="selectIcon(icon.name)"
                :class="{ active: formData.icon === icon.name }"
              >
                <el-icon :size="20">
                  <component :is="icon.component" />
                </el-icon>
                <span class="icon-name">{{ icon.name }}</span>
              </div>
            </div>
          </el-popover>

          <div class="form-tip">
            点击选择图标，当前已选：<strong>{{ formData.icon || '无' }}</strong>
          </div>
        </el-form-item>

        <!-- 排序序号 -->
        <el-form-item label="排序序号" prop="sort_order">
          <el-input-number v-model="formData.sort_order" :min="-999" :max="999" />
          <div class="form-tip">数值越小越靠前，支持负数</div>
        </el-form-item>

        <!-- 是否可见 -->
        <el-form-item label="是否显示" prop="is_visible">
          <el-switch v-model="formData.is_visible" active-text="显示" inactive-text="隐藏" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          {{ isEditing ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus, Refresh, Rank, ArrowDown } from '@element-plus/icons-vue'
import {
  availableIcons,
  iconCategories,
  getIconComponent
} from '@/config/elementIconsConfig'
import { useNavigationMenus } from '../../../composables/useNavigationMenus'

const { menus, loading, fetchMenus, createMenu, updateMenu, deleteMenu } = useNavigationMenus()

// 选择图标的方法
const selectIcon = (iconName) => {
  formData.icon = iconName
}

// 对话框状态
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const submitLoading = ref(false)

// 表单引用和验证规则
const formRef = ref(null)
const formData = reactive({
  name: '',
  type: 'route',
  path: '',
  icon: '',
  sort_order: 0,
  is_visible: true
})

const formRules = {
  name: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  type: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
  path: [
    { required: true, message: '请输入路径或URL', trigger: 'blur' },
    { min: 1, max: 500, message: '长度在 1 到 500 个字符', trigger: 'blur' }
  ]
}

// 预设页面数据（按分类组织）
const corePages = [
  { name: '🏠 新首页', path: '/new', icon: 'HomeFilled' },
  { name: '📖 传统首页', path: '/home', icon: 'House' }
]

const learningPages = [
  { name: '🎯 答题练习', path: '/quiz/:subjectId/:subcategoryId', icon: 'EditPen' },
  { name: '📊 学习报告', path: '/learning-report', icon: 'TrendCharts' },
  { name: '📈 学习进度', path: '/learning-progress', icon: 'DataLine' },
  { name: '🏆 排行榜', path: '/leaderboard', icon: 'Trophy' },
  { name: '❌ 错题本', path: '/error-book', icon: 'DocumentDelete' },
  { name: '📝 答题记录', path: '/answer-history', icon: 'Clock' }
]

const userPages = [
  { name: '👤 个人中心', path: '/profile', icon: 'UserFilled' },
  { name: '📚 学科详情', path: '/subcategory/:subjectId', icon: 'Reading' }
]

const systemPages = [
  { name: '⚙️ 后台管理', path: '/admin', icon: 'Setting' },
  { name: '📖 帮助文档', path: '/docs', icon: 'Document' },
  { name: '🔐 登录页面', path: '/login', icon: 'Lock' }
]

// 处理路由选择变化
const handleRouteChange = value => {
  // 查找是否是预设页面
  const allPages = [...corePages, ...learningPages, ...userPages, ...systemPages]
  const selectedPage = allPages.find(p => p.path === value)

  if (selectedPage) {
    // 自动填充名称和图标（仅当用户未手动修改过时）
    if (!formData.name || formData.name.trim() === '') {
      // 移除 emoji 前缀，只保留中文名称
      const cleanName = selectedPage.name.replace(/^[\s\S]+\s/, '')
      formData.name = cleanName
    }

    if (!formData.icon || formData.icon.trim() === '') {
      formData.icon = selectedPage.icon
    }
  }
}

// 初始化加载数据
onMounted(() => {
  fetchMenus()
})

// 添加菜单
const handleAdd = () => {
  isEditing.value = false
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

// 编辑菜单
const handleEdit = row => {
  isEditing.value = true
  editingId.value = row.id

  // 填充表单数据
  Object.assign(formData, {
    name: row.name,
    type: row.type,
    path: row.path,
    icon: row.icon || '',
    sort_order: row.sort_order,
    is_visible: row.is_visible === 1
  })

  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitLoading.value = true

    const data = {
      ...formData,
      is_visible: formData.is_visible ? 1 : 0
    }

    if (isEditing.value) {
      await updateMenu(editingId.value, data)
    } else {
      await createMenu(data)
    }

    dialogVisible.value = false
  } catch (err) {
    if (err !== false) {
      console.error('表单提交失败:', err)
    }
  } finally {
    submitLoading.value = false
  }
}

// 删除菜单
const handleDelete = async id => {
  try {
    await deleteMenu(id)
  } catch (err) {
    console.error('删除失败:', err)
  }
}

// 切换可见状态
const handleToggleVisible = async row => {
  try {
    await updateMenu(row.id, { is_visible: row.is_visible === 1 })
  } catch (err) {
    // 失败时恢复原状态
    row.is_visible = row.is_visible === 1 ? 0 : 1
    console.error('更新状态失败:', err)
  }
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }

  Object.assign(formData, {
    name: '',
    type: 'route',
    path: '',
    icon: '',
    sort_order: 0,
    is_visible: true
  })
}
</script>

<style scoped lang="scss">
@use 'sass:color'; // 导入 color 模块

.navigation-management {
  padding: $spacing-lg;

  .page-header {
    margin-bottom: $spacing-lg;

    h2 {
      font-size: $font-size-xl;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: $spacing-xs;
    }

    .description {
      font-size: $font-size-sm;
      color: $text-secondary;
      margin: 0;
    }
  }

  .toolbar {
    display: flex;
    gap: $spacing-md;
    margin-bottom: $spacing-lg;
  }

  .drag-handle {
    cursor: move;
    font-size: 18px;
    color: $text-secondary;

    &:hover {
      color: $new-primary;
    }
  }

  .text-muted {
    color: $text-tertiary; // 使用已定义的文本颜色变量
    font-size: $font-size-sm;
  }

  .form-tip {
    font-size: $font-size-xs;
    color: $text-secondary;
    margin-top: $spacing-xs;
    line-height: 1.4;
  }

  // 页面选择器下拉选项样式
  :deep(.page-option) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    .page-name {
      font-weight: 500;
      color: $text-primary;
      flex-shrink: 0;
    }

    .page-path {
      font-size: $font-size-xs;
      color: $text-tertiary;
      margin-left: $spacing-md;
      font-family: 'Monaco', 'Menlo', monospace;
    }
  }

  :deep(.el-table) {
    border-radius: $border-radius-sm;
    overflow: hidden;
  }

  :deep(.el-dialog) {
    border-radius: $border-radius-lg; // 使用已定义的圆角变量
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
  }

  // 图标选择器样式
  .icon-selector-trigger {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: 8px 12px;
    border: 1px solid $border-color;
    border-radius: $border-radius-sm;
    cursor: pointer;
    transition: all 0.25s ease;
    background-color: #fff;
    min-width: 200px;

    &:hover {
      border-color: $new-primary;
      box-shadow: 0 0 0 2px rgba($new-primary, 0.1);
    }

    .selected-icon {
      font-size: 18px;
      color: $new-primary;
    }

    .placeholder {
      color: $text-tertiary;
      font-size: $font-size-sm;
    }

    .arrow-icon {
      margin-left: auto;
      color: $text-tertiary;
      transition: transform 0.25s ease;
    }
  }

  // 图标选择网格（Popover 内部）- 水平布局
  .icon-selector-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr); // 8列水平布局
    gap: 8px;
    max-height: 320px;
    overflow-y: auto;
    padding: $spacing-sm;

    .icon-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 10px 4px;
      border-radius: $border-radius-sm;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 2px solid transparent;
      background-color: #f8f9fa;

      &:hover {
        background-color: color.adjust($new-primary, $lightness: 95%);
        border-color: color.adjust($new-primary, $lightness: 80%);
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }

      &.active {
        background-color: $new-primary;
        border-color: $new-primary-dark;
        color: #fff;

        .el-icon {
          color: #fff;
        }

        .icon-name {
          color: #fff;
          opacity: 0.9;
        }
      }

      &.clear-option {
        background-color: #f5f5f5;
        border-style: dashed;

        &:hover {
          background-color: #ffebee;
          border-color: #ef5350;
        }

        &.active {
          background-color: #ef5350;
          border-color: #c62828;
          color: #fff;
        }
      }

      .el-icon {
        font-size: 22px; // 图标稍大一点
        margin-bottom: 6px; // 图标与文字间距
        color: $text-primary; // 默认颜色
      }

      .icon-name {
        font-size: 11px; // 字体大小
        color: $text-secondary;
        text-align: center;
        line-height: 1.2;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
                 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif; // 系统默认字体
      }
    }
  }
}

/* ============================================
   图标选择器全局样式（Popover 内容在 body 下，需要全局样式）
   ============================================ */
.icon-selector-grid {
  display: grid !important;
  grid-template-columns: repeat(8, 1fr) !important; // 8列水平布局
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
  padding: 8px;

  .icon-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10px 4px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 2px solid transparent;
    background-color: #f8f9fa;

    &:hover {
      background-color: #e6f7ff;
      border-color: #91d5ff;
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    &.active {
      background-color: #1677ff;
      border-color: #0958d9;
      color: #fff;

      .el-icon {
        color: #fff;
      }

      .icon-name {
        color: #fff;
        opacity: 0.9;
      }
    }

    &.clear-option {
      background-color: #f5f5f5;
      border-style: dashed;

      &:hover {
        background-color: #ffebee;
        border-color: #ef5350;
      }

      &.active {
        background-color: #ef5350;
        border-color: #c62828;
        color: #fff;
      }
    }

    .el-icon {
      font-size: 22px;
      margin-bottom: 6px;
      color: #333;
    }

    .icon-name {
      font-size: 11px;
      color: #666;
      text-align: center;
      line-height: 1.2;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
               'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }
  }
}
</style>
