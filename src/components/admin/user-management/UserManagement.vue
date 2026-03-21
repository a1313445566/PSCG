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
          <el-input v-model="searchStudentId" placeholder="输入学号" style="width: 180px;"></el-input>
        </div>
        <div style="display: flex; align-items: center; gap: 5px;">
          <label style="font-weight: 500; width: 60px;">姓名</label>
          <el-input v-model="searchName" placeholder="输入姓名" style="width: 180px;"></el-input>
        </div>
        <div style="display: flex; align-items: center; gap: 5px;">
          <label style="font-weight: 500; width: 60px;">年级</label>
          <el-select v-model="searchGrade" placeholder="选择年级" style="width: 120px;">
            <el-option label="全部" value=""></el-option>
            <el-option v-for="grade in grades" :key="grade.id || grade" :label="grade.name || grade" :value="grade.id || grade"></el-option>
          </el-select>
        </div>
        <div style="display: flex; align-items: center; gap: 5px;">
          <label style="font-weight: 500; width: 60px;">班级</label>
          <el-select v-model="searchClass" placeholder="选择班级" style="width: 120px;">
            <el-option label="全部" value=""></el-option>
            <el-option v-for="classNum in classes" :key="classNum.id || classNum" :label="classNum.name || classNum" :value="classNum.id || classNum"></el-option>
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
        :data="paginatedUsers" 
        stripe 
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="student_id" label="学号" width="120" align="center">
          <template #default="{ row }">
            {{ row.student_id || row.user_id || '未设置' }}
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="100" align="center">
          <template #default="{ row }">
            {{ row.name || '未设置' }}
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="年级" width="100" align="center">
          <template #default="{ row }">
            {{ row.grade || '未设置' }}
          </template>
        </el-table-column>
        <el-table-column prop="class" label="班级" width="100" align="center">
          <template #default="{ row }">
            {{ row.class || '未设置' }}
          </template>
        </el-table-column>
        <el-table-column label="答题次数" width="120" align="center">
          <template #default="{ row }">
            {{ row.total_sessions || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="正确率" width="120" align="center">
          <template #default="{ row }">
            {{ Math.round(row.avg_accuracy || 0) }}%
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editUser(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteUser(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination" style="margin-top: 20px; text-align: right;">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredUsers.length"
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
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getApiBaseUrl } from '../../../utils/database';
import UserForm from './UserForm.vue';

// 定义属性和事件
const props = defineProps({
  users: {
    type: Array,
    default: () => []
  },
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
const pageSize = ref(10);

// 搜索和筛选
const searchStudentId = ref('');
const searchName = ref('');
const searchGrade = ref('');
const searchClass = ref('');

// 计算筛选后的用户列表
const filteredUsers = computed(() => {
  return props.users.filter(user => {
    const studentId = user.student_id || user.user_id || '';
    const name = user.name || '';
    const grade = user.grade || '';
    const classNum = user.class || '';
    
    return (
      studentId.includes(searchStudentId.value) &&
      name.includes(searchName.value) &&
      (searchGrade.value === '' || grade.toString() === searchGrade.value.toString()) &&
      (searchClass.value === '' || classNum.toString() === searchClass.value.toString())
    );
  });
});

// 分页后的用户列表
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredUsers.value.slice(start, end);
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
        // 调用删除用户API
        const response = await fetch(`${getApiBaseUrl()}/users/${userId}`, { method: 'DELETE' });
        
        if (response.ok) {
          ElMessage.success('用户删除成功！');
          // 触发更新用户列表
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
      let successCount = 0;
      for (const user of selectedUsers.value) {
        const userId = user.id;
        if (userId) {
          // 调用删除用户API
          const response = await fetch(`${getApiBaseUrl()}/users/${userId}`, { method: 'DELETE' });
          if (response.ok) {
            successCount++;
          }
        }
      }
      
      ElMessage.success(`成功删除 ${successCount} 个用户！`);
      // 触发更新用户列表
      emit('update-users');
      // 清空选择
      selectedUsers.value = [];
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
    // 构建用户数据对象
    const userToSave = {
      name: userData.name,
      grade: parseInt(userData.grade),
      class: parseInt(userData.class)
    };
    
    let response;
    if (userData.id) {
      // 编辑用户
      response = await fetch(`${getApiBaseUrl()}/users/${userData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userToSave)
      });
    } else {
      // 添加用户
      const newUser = {
        ...userToSave,
        student_id: userData.student_id
      };
      response = await fetch(`${getApiBaseUrl()}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });
    }
    
    if (response.ok) {
      ElMessage.success('用户保存成功！');
      userFormVisible.value = false;
      // 触发更新用户列表
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
};

// 重置筛选
const resetFilters = () => {
  searchStudentId.value = '';
  searchName.value = '';
  searchGrade.value = '';
  searchClass.value = '';
  currentPage.value = 1;
};

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleCurrentChange = (current) => {
  currentPage.value = current;
};

// 初始化
onMounted(() => {
  // 可以在这里加载用户数据
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