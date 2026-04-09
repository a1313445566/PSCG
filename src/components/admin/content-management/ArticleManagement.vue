<template>
  <div class="article-management">
    <div class="page-header">
      <h2 class="page-title">文章管理</h2>
      <p class="page-description">管理网站文章内容，支持富文本编辑和图片上传</p>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" icon="Plus" @click="handleAdd">新增文章</el-button>
      <el-button icon="Refresh" @click="handleRefresh">刷新</el-button>
    </div>

    <!-- 文章表格 -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="articles"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            <span class="article-title">{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="category_name" label="分类" width="120" />
        <el-table-column prop="view_count" label="浏览次数" width="100" sortable />
        <el-table-column prop="is_published" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_published ? 'success' : 'warning'">
              {{ row.is_published ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="published_at" label="发布时间" width="180" sortable>
          <template #default="{ row }">
            {{ formatDate(row.published_at || row.created_at) }}
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

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入文章标题" />
        </el-form-item>

        <el-form-item label="分类" prop="category_id">
          <el-select v-model="form.category_id" placeholder="请选择分类">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="标签" prop="tag_ids">
          <el-select v-model="form.tag_ids" multiple placeholder="请选择标签" style="width: 100%">
            <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="作者">
          <el-input v-model="form.author" placeholder="请输入作者" />
        </el-form-item>

        <el-form-item label="摘要">
          <el-input v-model="form.summary" type="textarea" rows="3" placeholder="请输入文章摘要" />
        </el-form-item>

        <el-form-item label="封面图">
          <el-upload
            class="avatar-uploader"
            :action="uploadUrl"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :before-upload="handleBeforeUpload"
          >
            <img v-if="form.thumbnail" :src="form.thumbnail" class="avatar" alt="封面图" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">点击上传封面图（建议尺寸：800x450）</div>
        </el-form-item>

        <el-form-item label="内容">
          <QuillEditor v-model="form.content" :options="editorOptions" />
        </el-form-item>

        <el-form-item label="状态">
          <el-switch v-model="form.is_published" active-text="已发布" inactive-text="草稿" />
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
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import QuillEditor from '@/components/common/QuillEditor.vue'
import api from '@/utils/api'
import showMessage from '@/utils/message'

// 状态
const loading = ref(false)
const articles = ref([])
const categories = ref([])
const tags = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectedRows = ref([])

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('新增文章')
const form = ref({
  title: '',
  summary: '',
  content: '',
  thumbnail: '',
  author: '',
  category_id: null,
  tag_ids: [],
  is_published: false
})
const formRef = ref(null)

// 验证规则
const rules = {
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' },
    { max: 200, message: '标题不能超过200个字符', trigger: 'blur' }
  ]
}

// 富文本编辑器配置
const editorOptions = {
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ header: 1 }, { header: 2 }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ direction: 'rtl' }],
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ color: [] }, { background: [] }],
      [{ font: [] }],
      [{ align: [] }],
      ['clean'],
      ['link', 'image', 'video']
    ]
  }
}

// 上传URL
const uploadUrl = '/admin/articles/upload'

// 格式化日期
const formatDate = dateString => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 加载文章列表
const loadArticles = async () => {
  loading.value = true
  try {
    const res = await api.get('/admin/articles', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value
      }
    })
    articles.value = res.data.articles
    total.value = res.data.pagination.total
  } catch (error) {
    console.error('获取文章列表失败:', error)
    showMessage('获取文章列表失败', 'error')
  } finally {
    loading.value = false
  }
}

// 加载分类和标签
const loadCategoriesAndTags = async () => {
  try {
    const [categoriesRes, tagsRes] = await Promise.all([
      api.get('/admin/categories'),
      api.get('/admin/tags')
    ])
    categories.value = categoriesRes.data
    tags.value = tagsRes.data
  } catch (error) {
    console.error('获取分类和标签失败:', error)
    showMessage('获取分类和标签失败', 'error')
  }
}

// 分页处理
const handleSizeChange = size => {
  pageSize.value = size
  currentPage.value = 1
  loadArticles()
}

const handleCurrentChange = page => {
  currentPage.value = page
  loadArticles()
}

// 选择处理
const handleSelectionChange = val => {
  selectedRows.value = val
}

// 新增文章
const handleAdd = () => {
  dialogTitle.value = '新增文章'
  form.value = {
    title: '',
    summary: '',
    content: '',
    thumbnail: '',
    author: '',
    category_id: null,
    tag_ids: [],
    is_published: false
  }
  dialogVisible.value = true
}

// 编辑文章
const handleEdit = async row => {
  dialogTitle.value = '编辑文章'
  try {
    const res = await api.get(`/admin/articles/${row.id}`)
    form.value = {
      ...res.data,
      tag_ids: res.data.tags?.map(tag => tag.id) || []
    }
    dialogVisible.value = true
  } catch (error) {
    console.error('获取文章详情失败:', error)
    showMessage('获取文章详情失败', 'error')
  }
}

// 删除文章
const handleDelete = row => {
  ElMessageBox.confirm('确定要删除这篇文章吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        await api.delete(`/admin/articles/${row.id}`)
        showMessage('删除成功', 'success')
        loadArticles()
      } catch (error) {
        console.error('删除文章失败:', error)
        showMessage('删除文章失败', 'error')
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

    const articleData = {
      ...form.value,
      is_published: form.value.is_published ? 1 : 0
    }

    if (form.value.id) {
      // 更新文章
      await api.put(`/admin/articles/${form.value.id}`, articleData)
      showMessage('更新成功', 'success')
    } else {
      // 创建文章
      await api.post('/admin/articles', articleData)
      showMessage('创建成功', 'success')
    }

    dialogVisible.value = false
    loadArticles()
  } catch (error) {
    console.error('保存文章失败:', error)
    showMessage('保存文章失败', 'error')
  }
}

// 刷新
const handleRefresh = () => {
  loadArticles()
}

// 上传处理
const handleUploadSuccess = response => {
  if (response.code === 200) {
    form.value.thumbnail = response.data.url
    showMessage('上传成功', 'success')
  } else {
    showMessage('上传失败', 'error')
  }
}

const handleBeforeUpload = file => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJpgOrPng) {
    showMessage('只能上传 JPG/PNG 图片', 'error')
  }
  if (!isLt2M) {
    showMessage('图片大小不能超过 2MB', 'error')
  }

  return isJpgOrPng && isLt2M
}

// 页面挂载时加载数据
onMounted(() => {
  loadCategoriesAndTags()
  loadArticles()
})
</script>

<style scoped lang="scss">
.article-management {
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

    :deep(.el-table) {
      .article-title {
        font-weight: 500;
      }
    }
  }

  .pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: $spacing-md;
  }

  .avatar-uploader {
    .avatar {
      width: 120px;
      height: 80px;
      object-fit: cover;
      border-radius: $border-radius-sm;
    }

    .avatar-uploader-icon {
      width: 120px;
      height: 80px;
      line-height: 80px;
      font-size: 20px;
      color: $text-secondary;
      background: $bg-gray-1;
      border: 1px dashed $border-color;
      border-radius: $border-radius-sm;
    }
  }

  .upload-tip {
    font-size: $font-size-sm;
    color: $text-secondary;
    margin-top: $spacing-xs;
  }

  .dialog-footer {
    text-align: right;
  }
}
</style>
