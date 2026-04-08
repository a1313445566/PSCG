<template>
  <div class="product-card-management">
    <div class="page-header">
      <h2>产品卡片管理</h2>
      <p class="description">管理首页展示的产品功能卡片，支持自定义图标、标题、描述和跳转链接</p>
    </div>

    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加卡片
      </el-button>
      <el-button @click="fetchCards">
        <el-icon><Refresh /></el-icon>
        刷新列表
      </el-button>
    </div>

    <el-table v-loading="loading" :data="cards" border stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="60" align="center" />
      <el-table-column label="图标" width="80" align="center">
        <template #default="{ row }">
          <div class="icon-preview">
            <component
              :is="getIconComponent(row.icon_name)"
              v-if="row.icon_type === 'element-plus'"
              :size="24"
            />
            <img
              v-else-if="row.icon_type === 'custom' && row.icon_url"
              :src="row.icon_url"
              :alt="row.title"
              style="width: 24px; height: 24px; object-fit: contain"
            />
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="120" show-overflow-tooltip />
      <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
      <el-table-column label="链接类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.link_type === 'route' ? 'info' : 'warning'" size="small">
            {{ row.link_type === 'route' ? '路由' : 'URL' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="标签" width="80" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.tag" type="danger" size="small">{{ row.tag }}</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="sort_order" label="排序" width="70" align="center" />
      <el-table-column label="可见" width="70" align="center">
        <template #default="{ row }">
          <el-switch
            :model-value="Number(row.is_visible) === 1"
            @change="(val) => handleToggleVisibility(row, val ? 1 : 0)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-popconfirm title="确定删除此卡片吗？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button type="danger" link size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑卡片' : '添加卡片'"
      width="640px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="formData.title"
            placeholder="请输入卡片标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            placeholder="请输入卡片描述"
            maxlength="200"
            show-word-limit
            :rows="2"
          />
        </el-form-item>

        <el-form-item label="图标类型" prop="icon_type">
          <el-radio-group v-model="formData.icon_type" @change="handleIconTypeChange">
            <el-radio value="element-plus">Element Plus 图标</el-radio>
            <el-radio value="custom">自定义图标文件</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          v-if="formData.icon_type === 'element-plus'"
          label="选择图标"
          prop="icon_name"
        >
          <el-popover placement="bottom-start" :width="400" trigger="click">
            <template #reference>
              <el-input v-model="formData.icon_name" placeholder="点击选择图标" readonly>
                <template #prefix>
                  <component
                    :is="getIconComponent(formData.icon_name)"
                    v-if="formData.icon_name"
                    :size="16"
                  />
                </template>
              </el-input>
            </template>
            <div class="icon-selector-grid">
              <div
                v-for="icon in availableIcons"
                :key="icon.name"
                class="icon-item"
                :class="{ active: formData.icon_name === icon.name }"
                @click="selectIcon(icon.name)"
              >
                <component :is="getIconComponent(icon.name)" :size="20" />
                <span class="icon-name">{{ icon.name }}</span>
              </div>
            </div>
          </el-popover>
        </el-form-item>

        <el-form-item v-if="formData.icon_type === 'custom'" label="上传图标" prop="icon_url">
          <el-upload
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            accept=".png,.svg"
            :on-change="handleFileChange"
          >
            <el-button type="primary" plain>选择图片文件</el-button>
            <template #tip>
              <div class="upload-tip">支持 PNG、SVG 格式，最大 2MB</div>
            </template>
          </el-upload>
          <div v-if="formData.icon_url" class="uploaded-preview">
            <img :src="formData.icon_url" alt="预览" style="max-height: 60px; max-width: 60px" />
          </div>
        </el-form-item>

        <el-form-item label="图标样式类">
          <el-select
            v-model="formData.icon_class"
            placeholder="可选，如 card-icon--purple"
            clearable
            allow-create
            filterable
          >
            <el-option label="默认" value="" />
            <el-option label="紫色 (purple)" value="card-icon--purple" />
            <el-option label="粉色 (pink)" value="card-icon--pink" />
            <el-option label="绿色 (green)" value="card-icon--green" />
            <el-option label="橙色 (orange)" value="card-icon--orange" />
            <el-option label="靛蓝 (indigo)" value="card-icon--indigo" />
            <el-option label="蓝色 (blue)" value="card-icon--blue" />
          </el-select>
        </el-form-item>

        <el-form-item label="链接类型" prop="link_type">
          <el-radio-group v-model="formData.link_type">
            <el-radio value="route">内部路由</el-radio>
            <el-radio value="url">外部 URL</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="formData.link_type === 'route' ? '跳转地址' : '外部URL'" prop="link_value">
          <el-select
            v-if="formData.link_type === 'route'"
            v-model="formData.link_value"
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
              />
            </el-option-group>
            <el-option-group label="📚 学习功能">
              <el-option
                v-for="page in learningPages"
                :key="page.path"
                :label="`${page.name} (${page.path})`"
                :value="page.path"
              />
            </el-option-group>
            <el-option-group label="👤 用户中心">
              <el-option
                v-for="page in userPages"
                :key="page.path"
                :label="`${page.name} (${page.path})`"
                :value="page.path"
              />
            </el-option-group>
            <el-option-group label="⚙️ 系统管理">
              <el-option
                v-for="page in systemPages"
                :key="page.path"
                :label="`${page.name} (${page.path})`"
                :value="page.path"
              />
            </el-option-group>
          </el-select>
          <el-input
            v-else
            v-model="formData.link_value"
            placeholder="请输入完整 URL，如 https://example.com"
          />
        </el-form-item>

        <el-form-item label="标签">
          <el-input
            v-model="formData.tag"
            placeholder="可选，如 hot, new, recommended"
            maxlength="20"
          />
        </el-form-item>

        <el-form-item label="排序序号">
          <el-input-number v-model="formData.sort_order" :min="0" :max="999" />
        </el-form-item>

        <el-form-item label="是否可见">
          <el-switch v-model="formData.is_visible" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { useProductCards } from '@/composables/useProductCards'
import { availableIcons, getIconComponent } from '@/config/elementIconsConfig'

const { loading, fetchAllCards, createCard, updateCard, deleteCard, uploadIcon } = useProductCards()

const cards = ref([])
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const submitLoading = ref(false)
const formRef = ref(null)

const defaultFormData = () => ({
  title: '',
  description: '',
  icon_type: 'element-plus',
  icon_name: null,
  icon_url: null,
  icon_class: null,
  link_type: 'route',
  link_value: '/',
  tag: null,
  sort_order: 0,
  is_visible: true
})

const formData = ref(defaultFormData())

// 预设路由数据（按分类组织，与导航菜单保持一致）
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

// 处理路由选择变化（自动填充标题和图标）
const handleRouteChange = value => {
  const allPages = [...corePages, ...learningPages, ...userPages, ...systemPages]
  const selectedPage = allPages.find(p => p.path === value)

  if (selectedPage) {
    // 自动填充标题（仅当用户未手动修改过时）
    if (!formData.value.title || formData.value.title.trim() === '') {
      const cleanName = selectedPage.name.replace(/^[\s\S]+\s/, '')
      formData.value.title = cleanName
    }

    // 自动填充图标（仅当用户未选择过时）
    if (formData.value.icon_type === 'element-plus' && (!formData.value.icon_name || formData.value.icon_name.trim() === '')) {
      formData.value.icon_name = selectedPage.icon
    }
  }
}

const formRules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  icon_type: [{ required: true, message: '请选择图标类型', trigger: 'change' }],
  icon_name: [
    {
      validator: (rule, value, callback) => {
        if (formData.value.icon_type === 'element-plus' && !value) {
          callback(new Error('请选择 Element Plus 图标'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  icon_url: [
    {
      validator: (rule, value, callback) => {
        if (formData.value.icon_type === 'custom' && !value) {
          callback(new Error('请上传自定义图标'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  link_type: [{ required: true, message: '请选择链接类型', trigger: 'change' }],
  link_value: [
    { required: true, message: '请输入跳转地址', trigger: 'blur' },
    { min: 1, max: 255, message: '长度在 1 到 255 个字符', trigger: 'blur' }
  ]
}

onMounted(() => {
  fetchCards()
})

const fetchCards = async () => {
  cards.value = await fetchAllCards()
}

const handleAdd = () => {
  isEditing.value = false
  editingId.value = null
  formData.value = defaultFormData()
  dialogVisible.value = true
}

const handleEdit = row => {
  isEditing.value = true
  editingId.value = row.id
  formData.value = {
    ...row,
    is_visible: !!row.is_visible
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitLoading.value = true

  try {
    const submitData = {
      ...formData.value,
      is_visible: formData.value.is_visible ? 1 : 0
    }

    if (isEditing.value) {
      await updateCard(editingId.value, submitData)
    } else {
      await createCard(submitData)
    }

    dialogVisible.value = false
    await fetchCards()
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async id => {
  try {
    await deleteCard(id)
    await fetchCards()
  } catch (err) {
    console.error('删除失败:', err)
  }
}

const handleToggleVisibility = async (row, val) => {
  try {
    await updateCard(row.id, { is_visible: val ? 1 : 0 })
    await fetchCards()
  } catch (err) {
    console.error('更新可见性失败:', err)
  }
}

const handleIconTypeChange = () => {
  formData.value.icon_name = null
  formData.value.icon_url = null
}

const selectIcon = name => {
  formData.value.icon_name = name
}

const handleFileChange = async file => {
  if (!file.raw) return

  const maxSize = 2 * 1024 * 1024
  if (file.raw.size > maxSize) {
    alert('文件大小不能超过 2MB')
    return
  }

  try {
    const result = await uploadIcon(file.raw)
    formData.value.icon_url = result.url
  } catch (err) {
    console.error('上传失败:', err)
  }
}
</script>

<style lang="scss" scoped>
.product-card-management {
  padding: $spacing-lg;
}

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

.icon-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: $spacing-xs;
}

.icon-selector-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: $spacing-sm;
  max-height: 300px;
  overflow-y: auto;

  .icon-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $spacing-sm;
    border-radius: $border-radius-sm;
    cursor: pointer;
    border: $border-width solid transparent;
    transition: all 0.2s ease;

    &:hover {
      background-color: rgba($primary-color, 0.08);
      border-color: $primary-color;
    }

    &.active {
      background-color: rgba($primary-color, 0.15);
      border-color: $primary-color;
      color: $primary-color;
    }

    .icon-name {
      font-size: 10px;
      margin-top: 4px;
      text-align: center;
      word-break: break-all;
      line-height: 1.2;
    }
  }
}

.uploaded-preview {
  margin-top: $spacing-sm;
  display: inline-block;
  border: $border-width solid $border-color;
  border-radius: $border-radius-sm;
  padding: $spacing-xs;
}
</style>
