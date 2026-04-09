<template>
  <div class="tag-management">
    <div class="page-header">
      <h2 class="page-title">标签管理</h2>
      <p class="page-description">管理文章标签，用于文章的分类和筛选</p>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" icon="Plus" @click="handleAdd">新增标签</el-button>
      <el-button icon="Refresh" @click="handleRefresh">刷新</el-button>
    </div>

    <!-- 标签表格 -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="tags"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column prop="name" label="标签名称" min-width="150" />
        <el-table-column prop="slug" label="标识" width="150" />
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
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="400px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入标签名称" />
        </el-form-item>

        <el-form-item label="标识" prop="slug">
          <el-input v-model="form.slug" placeholder="请输入标签标识（用于URL）" />
          <div class="form-tip">建议使用小写字母和连字符，例如：learning-methods</div>
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
import showMessage from '@/utils/message'

// 状态
const loading = ref(false)
const tags = ref([])
const selectedRows = ref([])

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('新增标签')
const form = ref({
  name: '',
  slug: ''
})
const formRef = ref(null)

// 验证规则
const rules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { max: 50, message: '标签名称不能超过50个字符', trigger: 'blur' }
  ],
  slug: [
    { required: true, message: '请输入标签标识', trigger: 'blur' },
    { max: 50, message: '标签标识不能超过50个字符', trigger: 'blur' },
    { pattern: /^[a-z0-9-]+$/, message: '标签标识只能包含小写字母、数字和连字符', trigger: 'blur' }
  ]
}

// 格式化日期
const formatDate = dateString => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 加载标签列表
const loadTags = async () => {
  loading.value = true
  try {
    const res = await api.get('/admin/tags')
    tags.value = res.data
  } catch (error) {
    console.error('获取标签列表失败:', error)
    showMessage('获取标签列表失败', 'error')
  } finally {
    loading.value = false
  }
}

// 选择处理
const handleSelectionChange = val => {
  selectedRows.value = val
}

// 新增标签
const handleAdd = () => {
  dialogTitle.value = '新增标签'
  form.value = {
    name: '',
    slug: ''
  }
  dialogVisible.value = true
}

// 编辑标签
const handleEdit = row => {
  dialogTitle.value = '编辑标签'
  form.value = { ...row }
  dialogVisible.value = true
}

// 删除标签
const handleDelete = row => {
  ElMessageBox.confirm('确定要删除这个标签吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        await api.delete(`/admin/tags/${row.id}`)
        showMessage('删除成功', 'success')
        loadTags()
      } catch (error) {
        console.error('删除标签失败:', error)
        showMessage('删除标签失败', 'error')
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
      // 更新标签
      await api.put(`/admin/tags/${form.value.id}`, form.value)
      showMessage('更新成功', 'success')
    } else {
      // 创建标签
      await api.post('/admin/tags', form.value)
      showMessage('创建成功', 'success')
    }

    dialogVisible.value = false
    loadTags()
  } catch (error) {
    console.error('保存标签失败:', error)
    showMessage('保存标签失败', 'error')
  }
}

// 刷新
const handleRefresh = () => {
  loadTags()
}

// 页面挂载时加载数据
onMounted(() => {
  loadTags()
})
</script>

<style scoped lang="scss">
.tag-management {
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
