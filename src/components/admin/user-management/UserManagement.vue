<template>
  <div class="user-management scroll-self-managed">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h3 style="margin: 0">用户管理</h3>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="showAddUserDialog">
          <el-icon><Plus /></el-icon>
          添加用户
        </el-button>
        <el-button type="danger" :disabled="selectedUsers.length === 0" @click="batchDeleteUsers">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <AdminFilter
      v-model="filters"
      :filter-items="filterItems"
      :show-tags="true"
      @search="applyFilters"
      @reset="resetFilters"
    />

    <!-- 用户列表 -->
    <div class="table-wrapper">
      <el-table
        v-loading="loading"
        :data="users"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="student_id" label="学号" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row">{{ row.student_id || row.user_id || '未设置' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row">{{ row.name || '未设置' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="年级" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row">{{ row.grade || '未设置' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="class" label="班级" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row">{{ row.class || '未设置' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="答题次数" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row">{{ row.total_sessions || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="正确率" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row">{{ Math.round(row.avg_accuracy || 0) }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <template v-if="row">
              <el-button type="primary" size="small" @click="editUser(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="deleteUser(row)">删除</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 用户表单对话框 -->
    <UserForm
      v-model:visible="userFormVisible"
      :user="selectedUser"
      :grades="grades"
      :classes="classes"
      @save-user="saveUser"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { api } from '../../../utils/api'
import AdminFilter from '../common/AdminFilter.vue'
import UserForm from './UserForm.vue'
import { usePagination } from '../../../composables/usePagination'

// 定义属性和事件
const props = defineProps({
  grades: {
    type: Array,
    default: () => []
  },
  classes: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update-users'])

// 筛选配置
const filterItems = computed(() => [
  {
    key: 'studentId',
    label: '学号',
    type: 'number',
    placeholder: '输入学号',
    width: '140px'
  },
  {
    key: 'name',
    label: '姓名',
    type: 'input',
    placeholder: '输入姓名',
    width: '140px'
  },
  {
    key: 'grade',
    label: '年级',
    type: 'select',
    placeholder: '选择年级',
    width: '120px',
    options: [
      { label: '全部', value: '' },
      ...props.grades.map(g => ({ label: `${g.name || g}年级`, value: g.name || g }))
    ]
  },
  {
    key: 'class',
    label: '班级',
    type: 'select',
    placeholder: '选择班级',
    width: '120px',
    options: [
      { label: '全部', value: '' },
      ...props.classes.map(c => ({ label: `${c.name || c}班`, value: c.name || c }))
    ]
  }
])

// 筛选值
const filters = ref({
  studentId: '',
  name: '',
  grade: '',
  class: ''
})

// 状态管理
const userFormVisible = ref(false)
const selectedUser = ref(null)
const selectedUsers = ref([])
const loading = ref(false)

// 使用分页 Hook（服务端分页）
const total = ref(0)
const {
  currentPage,
  pageSize,
  handleSizeChange,
  handleCurrentChange,
  reset: resetPagination
} = usePagination(20, total)

// 服务端分页数据
const users = ref([])

// 加载用户数据（服务端分页）
const loadUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      withStats: true
    }

    // 添加筛选条件
    if (filters.value.studentId) {
      params.student_id = filters.value.studentId
    }
    if (filters.value.name) {
      params.name = filters.value.name
    }
    if (filters.value.grade) {
      params.grade = filters.value.grade
    }
    if (filters.value.class) {
      params.class = filters.value.class
    }

    const result = await api.get('/users', params)

    // 检查返回格式（向后兼容）
    if (Array.isArray(result)) {
      // 旧格式：直接返回数组
      users.value = result
      total.value = result.length
    } else {
      // 新格式：分页对象
      users.value = result.data || []
      total.value = result.total || 0
    }
  } catch (error) {
    console.error('[loadUsers] 加载用户失败:', error)
    ElMessage.error('加载用户失败')
    users.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 监听分页变化
watch([currentPage, pageSize], () => {
  loadUsers()
})

// 处理选择变化
const handleSelectionChange = selection => {
  selectedUsers.value = selection
}

// 显示添加用户对话框
const showAddUserDialog = () => {
  selectedUser.value = null
  userFormVisible.value = true
}

// 编辑用户
const editUser = user => {
  selectedUser.value = user
  userFormVisible.value = true
}

// 删除用户
const deleteUser = user => {
  ElMessageBox.confirm(
    `确定要删除用户 ${user.name || user.student_id || user.user_id} 吗？删除后将清除该用户的所有数据。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        const userId = user.id
        if (userId) {
          await api.delete(`/users/${userId}`)
          ElMessage.success('用户删除成功！')
          loadUsers()
          emit('update-users')
        } else {
          ElMessage.error('用户ID不存在，无法删除')
        }
      } catch (error) {
        console.error('删除用户失败:', error)
        ElMessage.error('删除用户失败，请稍后重试')
      }
    })
    .catch(() => {
      // 取消删除
    })
}

// 批量删除用户
const batchDeleteUsers = () => {
  if (selectedUsers.value.length === 0) return

  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedUsers.value.length} 个用户吗？删除后将清除这些用户的所有数据。`,
    '批量删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        const userIds = selectedUsers.value.map(user => user.id).filter(id => id)

        if (userIds.length === 0) {
          ElMessage.warning('没有有效的用户ID')
          return
        }

        const result = await api.post('/users/batch-delete', { userIds })
        ElMessage.success(result.message || '批量删除成功！')
        loadUsers()
        emit('update-users')
        selectedUsers.value = []
      } catch (error) {
        console.error('批量删除用户失败:', error)
        ElMessage.error('批量删除用户失败，请稍后重试')
      }
    })
    .catch(() => {
      // 取消删除
    })
}

// 保存用户
const saveUser = async userData => {
  try {
    const userToSave = {
      name: userData.name,
      grade: userData.grade,
      class: userData.class,
      student_id: userData.student_id
    }

    if (userData.id) {
      await api.put(`/users/${userData.id}`, userToSave)
    } else {
      await api.post('/users', userToSave)
    }

    ElMessage.success('用户保存成功！')
    userFormVisible.value = false
    loadUsers()
    emit('update-users')
  } catch (error) {
    console.error('保存用户失败:', error)
    ElMessage.error('保存用户失败，请稍后重试')
  }
}

// 应用筛选
const applyFilters = () => {
  resetPagination()
  loadUsers()
}

// 重置筛选
const resetFilters = () => {
  filters.value = {
    studentId: '',
    name: '',
    grade: '',
    class: ''
  }
  resetPagination()
  loadUsers()
}

// 暴露刷新方法
defineExpose({
  refresh: loadUsers
})

// 初始化
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
  margin-bottom: 12px;
  border-radius: 8px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.pagination-container {
  margin-top: 12px;
  display: flex;
  justify-content: center;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  flex-shrink: 0;
}
</style>
