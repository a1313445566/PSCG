<script setup>
import { ref, onMounted, h, inject } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import api from '@/utils/api'
import { showMessage } from '@/utils/message'
import RoleForm from './RoleForm.vue'

// 注入权限检查函数
const hasPermission = inject('hasPermission')

const roles = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const currentRole = ref(null)
const isEdit = ref(false)

const fetchRoles = async () => {
  // 先检查权限
  if (!hasPermission || !hasPermission('admin-roles', 'view')) {
    console.log('[RoleManagement] 没有角色查看权限，跳过加载')
    return
  }
  
  loading.value = true
  try {
    const res = await api.get('/admin/permissions/roles')
    roles.value = res.data.data || []
  } catch (error) {
    console.error('获取角色列表失败:', error)
    showMessage('获取角色列表失败', 'error')
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  currentRole.value = null
  isEdit.value = false
  dialogVisible.value = true
}

const handleEdit = (role) => {
  currentRole.value = { ...role }
  isEdit.value = true
  dialogVisible.value = true
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该角色吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await api.delete(`/admin/permissions/roles/${id}`)
    showMessage('角色删除成功', 'success')
    await fetchRoles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除角色失败:', error)
      showMessage(error.response?.data?.msg || '删除角色失败', 'error')
    }
  }
}

const handleSubmit = async () => {
  await fetchRoles()
}

onMounted(() => {
  fetchRoles()
})
</script>

<template>
  <div class="role-management">
    <div class="toolbar">
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新建角色
      </el-button>
    </div>

    <el-table :data="roles" v-loading="loading" stripe style="width: 100%">
      <el-table-column prop="name" label="角色名称" min-width="150" />
      <el-table-column prop="description" label="描述" min-width="200" />
      <el-table-column prop="is_preset" label="类型" width="120">
        <template #default="{ row }">
          <el-tag :type="row.is_preset ? 'success' : 'info'">
            {{ row.is_preset ? '预设' : '自定义' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180">
        <template #default="{ row }">
          {{ new Date(row.created_at).toLocaleString('zh-CN') }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button link @click="handleEdit(row)" :disabled="!!row.is_preset">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button link @click="handleDelete(row.id)" :disabled="!!row.is_preset" type="danger">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <RoleForm
      v-model:visible="dialogVisible"
      :role="currentRole"
      :is-edit="isEdit"
      @submit="handleSubmit"
    />
  </div>
</template>

<style scoped lang="scss">
.role-management {
  padding: $spacing-lg;
  
  .toolbar {
    margin-bottom: $spacing-md;
  }
}
</style>
