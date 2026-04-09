<template>
  <div class="category-management">
    <div class="page-header">
      <h2 class="page-title">分类管理</h2>
      <p class="page-description">管理文章分类，用于组织和筛选文章内容</p>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <template #icon>
          <el-icon><Plus /></el-icon>
        </template>
        新增分类
      </el-button>
      <el-button @click="handleRefresh">
        <template #icon>
          <el-icon><Refresh /></el-icon>
        </template>
        刷新
      </el-button>
    </div>

    <!-- 分类表格 -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="categories"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column prop="name" label="分类名称" min-width="150" />
        <el-table-column prop="slug" label="标识" width="150" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="sort_order" label="排序" width="100" sortable />
        <el-table-column prop="created_at" label="创建时间" width="180" sortable>
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>

        <el-form-item label="标识" prop="slug">
          <el-input v-model="form.slug" placeholder="请输入分类标识（用于URL）" />
          <div class="form-tip">建议使用小写字母和连字符，例如：learning-skills</div>
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>

        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" placeholder="排序序号" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import api from '@/utils/api'
import { showMessage } from '@/utils/message'

// 状态
const loading = ref(false)
const categories = ref([])
const selectedRows = ref([])

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('新增分类')
const form = ref({
  name: '',
  slug: '',
  description: '',
  sort_order: 0
})
const formRef = ref(null)

// 验证规则
const rules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { max: 50, message: '分类名称不能超过50个字符', trigger: 'blur' }
  ],
  slug: [
    { required: true, message: '请输入分类标识', trigger: 'blur' },
    { max: 50, message: '分类标识不能超过50个字符', trigger: 'blur' },
    { pattern: /^[a-z0-9-]+$/, message: '分类标识只能包含小写字母、数字和连字符', trigger: 'blur' }
  ]
}

// 格式化日期
const formatDate = dateString => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 加载分类列表
const loadCategories = async () => {
  loading.value = true
  try {
    const res = await api.get('/admin/categories')
    categories.value = res.data
  } catch (error) {
    console.error('获取分类列表失败:', error)
    showMessage('获取分类列表失败', 'error')
  } finally {
    loading.value = false
  }
}

// 选择处理
const handleSelectionChange = val => {
  selectedRows.value = val
}

// 新增分类
const handleAdd = () => {
  dialogTitle.value = '新增分类'
  form.value = {
    name: '',
    slug: '',
    description: '',
    sort_order: 0
  }
  dialogVisible.value = true
}

// 编辑分类
const handleEdit = row => {
  dialogTitle.value = '编辑分类'
  form.value = { ...row }
  dialogVisible.value = true
}

// 删除分类
const handleDelete = row => {
  ElMessageBox.confirm('确定要删除这个分类吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        await api.delete(`/admin/categories/${row.id}`)
        showMessage('删除成功', 'success')
        loadCategories()
      } catch (error) {
        console.error('删除分类失败:', error)
        showMessage('删除分类失败', 'error')
      }
    })
    .catch(() => {
      // 取消删除
    })
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    if (form.value.id) {
      // 更新分类
      await api.put(`/admin/categories/${form.value.id}`, form.value)
      showMessage('更新成功', 'success')
    } else {
      // 创建分类
      await api.post('/admin/categories', form.value)
      showMessage('创建成功', 'success')
    }

    dialogVisible.value = false
    loadCategories()
  } catch (error) {
    console.error('保存分类失败:', error)
    showMessage('保存分类失败', 'error')
  }
}

// 刷新
const handleRefresh = () => {
  loadCategories()
}

// 页面挂载时加载数据
onMounted(() => {
  loadCategories()
})
</script>

<style scoped lang="scss">
.category-management {
  .page-header {
    margin-bottom: $spacing-lg;

    .page-title {
      font-size: $font-size-lg;
      font-weight: 540;
      color: $text-primary;
      margin-bottom: $spacing-xs;
    }

    .page-description {
      color: $text-secondary;
      margin: 0;
    }
  }

  .toolbar {
    margin-bottom: $spacing-md;
    display: flex;
    gap: $spacing-sm;
  }

  .table-container {
    margin-bottom: $spacing-md;
  }

  .form-tip {
    font-size: $font-size-sm;
    color: $text-secondary;
    margin-top: $spacing-xs;
  }

  .dialog-footer {
    text-align: right;
  }
}
</style>
