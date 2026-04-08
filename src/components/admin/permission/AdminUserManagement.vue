<script setup>
import { ref, onMounted, inject } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Lock } from '@element-plus/icons-vue'
import api from '@/utils/api'
import { showMessage } from '@/utils/message'
import AdminUserForm from './AdminUserForm.vue'

// 注入权限检查函数
const hasPermission = inject('hasPermission')

const adminUsers = ref([])
const roles = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const currentUser = ref(null)
const isEdit = ref(false)

const fetchAdminUsers = async () => {
  // 先检查权限
  if (!hasPermission || !hasPermission('admin-users', 'view')) {
    console.log('[AdminUserManagement] 没有管理员查看权限，跳过加载')
    return
  }

  loading.value = true
  try {
    const res = await api.get('/admin/permissions/users')
    adminUsers.value = res.data.data || []
  } catch (error) {
    console.error('获取管理员列表失败:', error)
    showMessage('获取管理员列表失败', 'error')
  } finally {
    loading.value = false
  }
}

const fetchRoles = async () => {
  // 先检查权限
  if (!hasPermission || !hasPermission('admin-roles', 'view')) {
    return
  }

  try {
    const res = await api.get('/admin/permissions/roles')
    roles.value = res.data.data || []
  } catch (error) {
    console.error('获取角色列表失败:', error)
  }
}

const getRoleName = roleId => {
  const role = roles.value.find(r => r.id === roleId)
  return role?.name || '-'
}

const handleCreate = () => {
  currentUser.value = null
  isEdit.value = false
  dialogVisible.value = true
}

const handleEdit = user => {
  // 保护默认超级管理员账号
  if (user.username === 'admin') {
    showMessage('默认超级管理员不能编辑', 'warning')
    return
  }

  currentUser.value = { ...user }
  isEdit.value = true
  dialogVisible.value = true
}

const handleDelete = async (id, username) => {
  // 保护默认超级管理员账号
  if (username === 'admin') {
    showMessage('默认超级管理员不能删除', 'warning')
    return
  }

  try {
    await ElMessageBox.confirm('确定要删除该管理员吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await api.delete(`/admin/permissions/users/${id}`)
    showMessage('管理员删除成功', 'success')
    await fetchAdminUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除管理员失败:', error)
      showMessage(error.response?.data?.msg || '删除管理员失败', 'error')
    }
  }
}

const handleResetPassword = async id => {
  try {
    await ElMessageBox.prompt('请输入新密码', '重置密码', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^.{6,}$/,
      inputErrorMessage: '密码至少6位'
    }).then(async ({ value }) => {
      await api.put(`/admin/permissions/users/${id}/password`, { new_password: value })
      showMessage('密码重置成功', 'success')
    })
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重置密码失败:', error)
      showMessage(error.response?.data?.msg || '重置密码失败', 'error')
    }
  }
}

const handleSubmit = async () => {
  await fetchAdminUsers()
}

onMounted(() => {
  fetchAdminUsers()
  fetchRoles()
})
</script>

<template>
  <div class="admin-user-management">
    <div class="toolbar">
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新建管理员
      </el-button>
    </div>

    <el-table v-loading="loading" :data="adminUsers" stripe style="width: 100%">
      <el-table-column prop="username" label="用户名" min-width="150" />
      <el-table-column prop="role_id" label="角色" min-width="150">
        <template #default="{ row }">
          <el-tag :type="row.role_is_preset ? 'success' : 'info'">
            {{ getRoleName(row.role_id) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
            {{ row.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="last_login_at" label="最后登录" width="180">
        <template #default="{ row }">
          {{ row.last_login_at ? new Date(row.last_login_at).toLocaleString('zh-CN') : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180">
        <template #default="{ row }">
          {{ new Date(row.created_at).toLocaleString('zh-CN') }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <!-- 默认超级管理员不能编辑和删除 -->
          <el-button link :disabled="row.username === 'admin'" @click="handleEdit(row)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button link @click="handleResetPassword(row.id)">
            <el-icon><Lock /></el-icon>
            重置密码
          </el-button>
          <!-- 默认超级管理员不能删除 -->
          <el-button
            link
            type="danger"
            :disabled="row.username === 'admin'"
            @click="handleDelete(row.id, row.username)"
          >
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <AdminUserForm
      v-model:visible="dialogVisible"
      :user="currentUser"
      :roles="roles"
      :is-edit="isEdit"
      @submit="handleSubmit"
    />
  </div>
</template>

<style scoped lang="scss">
.admin-user-management {
  padding: $spacing-lg;

  .toolbar {
    margin-bottom: $spacing-md;
  }
}
</style>
