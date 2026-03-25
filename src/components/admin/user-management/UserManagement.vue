<template>
  <div class="user-management">
    <h3>用户管理</h3>
    
    <!-- 操作按钮区域 -->
    <div class="action-buttons" style="margin-bottom: 20px;">
      <el-button type="primary" @click="showAddUserDialog">添加用户</el-button>
      <el-button type="danger" @click="batchDeleteUsers" :disabled="selectedUsers.length === 0">批量删除</el-button>
    </div>
    
    <!-- 搜索和筛选 -->
    <div class="filter-section" style="margin-bottom: 20px; padding: 16px; background-color: #f8f9fa; border-radius: 8px;">
      <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 5px;">
          <label style="font-weight: 500; width: 60px;">学号</label>
          <el-input v-model="searchStudentId" placeholder="输入学号" style="width: 180px;" @input="searchStudentId = searchStudentId.replace(/[^0-9]/g, '')"></el-input>
        </div>
        <div style="display: flex; align-items: center; gap: 5px;">
          <label style="font-weight: 500; width: 60px;">姓名</label>
          <el-input v-model="searchName" placeholder="输入姓名" style="width: 180px;"></el-input>
        </div>
        <div style="display: flex; align-items: center; gap: 5px;">
          <label style="font-weight: 500; width: 60px;">年级</label>
          <el-select v-model="searchGrade" placeholder="选择年级" style="width: 120px;">
            <el-option label="全部" value=""></el-option>
            <el-option v-for="grade in grades" :key="grade.id || grade" :label="grade.name || grade" :value="grade.name || grade"></el-option>
          </el-select>
        </div>
        <div style="display: flex; align-items: center; gap: 5px;">
          <label style="font-weight: 500; width: 60px;">班级</label>
          <el-select v-model="searchClass" placeholder="选择班级" style="width: 120px;">
            <el-option label="全部" value=""></el-option>
            <el-option v-for="classNum in classes" :key="classNum.id || classNum" :label="classNum.name || classNum" :value="classNum.name || classNum"></el-option>
          </el-select>
        </div>
        <div style="display: flex; gap: 10px;">
          <el-button type="primary" @click="applyFilters">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>
      </div>
    </div>
    
    <!-- 用户列表 -->
    <div class="table-container" style="margin-top: 20px; background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); padding: 24px; overflow: hidden;">
      <el-table 
        :data="users" 
        stripe 
        style="width: 100%"
        v-loading="loading"
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
      
      <!-- 分页 -->
      <div class="pagination" style="margin-top: 20px; text-align: right;">
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
import { ref, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getApiBaseUrl } from '../../../utils/database';
import UserForm from './UserForm.vue';

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
});

const emit = defineEmits(['update-users']);

// 状态管理
const userFormVisible = ref(false);
const selectedUser = ref(null);
const selectedUsers = ref([]);
const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);

// 服务端分页数据
const users = ref([]);
const total = ref(0);

// 搜索和筛选
const searchStudentId = ref('');
const searchName = ref('');
const searchGrade = ref('');
const searchClass = ref('');

// 加载用户数据（服务端分页）
const loadUsers = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    params.append('page', currentPage.value);
    params.append('limit', pageSize.value);
    params.append('withStats', 'true');
    
    // 添加筛选条件
    if (searchStudentId.value) {
      params.append('student_id', searchStudentId.value);
    }
    if (searchName.value) {
      params.append('name', searchName.value);
    }
    if (searchGrade.value) {
      params.append('grade', searchGrade.value);
    }
    if (searchClass.value) {
      params.append('class', searchClass.value);
    }
    
    const response = await fetch(`${getApiBaseUrl()}/users?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // 检查返回格式（向后兼容）
    if (Array.isArray(result)) {
      // 旧格式：直接返回数组
      users.value = result;
      total.value = result.length;
    } else {
      // 新格式：分页对象
      users.value = result.data || [];
      total.value = result.total || 0;
    }
  } catch (error) {
    console.error('[loadUsers] 加载用户失败:', error);
    ElMessage.error('加载用户失败');
    users.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

// 监听分页变化
watch([currentPage, pageSize], () => {
  loadUsers();
});

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedUsers.value = selection;
};

// 显示添加用户对话框
const showAddUserDialog = () => {
  selectedUser.value = null;
  userFormVisible.value = true;
};

// 编辑用户
const editUser = (user) => {
  selectedUser.value = user;
  userFormVisible.value = true;
};

// 删除用户
const deleteUser = (user) => {
  ElMessageBox.confirm(`确定要删除用户 ${user.name || user.student_id || user.user_id} 吗？删除后将清除该用户的所有数据。`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
  .then(async () => {
    try {
      const userId = user.id;
      if (userId) {
        const response = await fetch(`${getApiBaseUrl()}/users/${userId}`, { method: 'DELETE' });
        
        if (response.ok) {
          ElMessage.success('用户删除成功！');
          loadUsers();
          emit('update-users');
        } else {
          throw new Error('删除用户失败');
        }
      } else {
        ElMessage.error('用户ID不存在，无法删除');
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      ElMessage.error('删除用户失败，请稍后重试');
    }
  })
  .catch(() => {
    // 取消删除
  });
};

// 批量删除用户
const batchDeleteUsers = () => {
  if (selectedUsers.value.length === 0) return;
  
  ElMessageBox.confirm(`确定要删除选中的 ${selectedUsers.value.length} 个用户吗？删除后将清除这些用户的所有数据。`, '批量删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
  .then(async () => {
    try {
      const userIds = selectedUsers.value.map(user => user.id).filter(id => id);
      
      if (userIds.length === 0) {
        ElMessage.warning('没有有效的用户ID');
        return;
      }
      
      const response = await fetch(`${getApiBaseUrl()}/users/batch-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userIds })
      });
      
      if (response.ok) {
        const result = await response.json();
        ElMessage.success(result.message || '批量删除成功！');
        loadUsers();
        emit('update-users');
        selectedUsers.value = [];
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '批量删除失败');
      }
    } catch (error) {
      console.error('批量删除用户失败:', error);
      ElMessage.error('批量删除用户失败，请稍后重试');
    }
  })
  .catch(() => {
    // 取消删除
  });
};

// 保存用户
const saveUser = async (userData) => {
  try {
    const userToSave = {
      name: userData.name,
      grade: parseInt(userData.grade),
      class: parseInt(userData.class),
      student_id: userData.student_id
    };
    
    let response;
    if (userData.id) {
      response = await fetch(`${getApiBaseUrl()}/users/${userData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userToSave)
      });
    } else {
      response = await fetch(`${getApiBaseUrl()}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userToSave)
      });
    }
    
    if (response.ok) {
      ElMessage.success('用户保存成功！');
      userFormVisible.value = false;
      loadUsers();
      emit('update-users');
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '保存用户失败');
    }
  } catch (error) {
    console.error('保存用户失败:', error);
    ElMessage.error('保存用户失败，请稍后重试');
  }
};

// 应用筛选
const applyFilters = () => {
  currentPage.value = 1;
  loadUsers();
};

// 重置筛选
const resetFilters = () => {
  searchStudentId.value = '';
  searchName.value = '';
  searchGrade.value = '';
  searchClass.value = '';
  currentPage.value = 1;
  loadUsers();
};

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleCurrentChange = (current) => {
  currentPage.value = current;
};

// 暴露刷新方法
defineExpose({
  refresh: loadUsers
});

// 初始化
onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.table-container {
  margin-top: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 24px;
  overflow: hidden;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>