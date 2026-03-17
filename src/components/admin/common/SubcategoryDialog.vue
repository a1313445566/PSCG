<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="(value) => emit('update:visible', value)"
    :title="`管理 ${subject?.name} 的学科题库`"
    width="700px"
  >
    <div class="subcategory-management">
      <div class="add-subcategory" style="padding: 16px; background-color: #f5f7fa; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 15px; font-size: 16px; font-weight: 500; color: #303133;">添加新学科题库</h4>
        <div style="display: flex; align-items: flex-end; gap: 15px; flex-wrap: wrap;">
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label style="font-size: 14px; color: #606266; font-weight: 500;">学科题库名称</label>
            <el-input v-model="newSubcategoryName" placeholder="请输入学科题库名称" style="width: 200px;"></el-input>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label style="font-size: 14px; color: #606266; font-weight: 500;">选择图标</label>
            <el-select v-model="newSubcategoryIcon" placeholder="请选择图标" style="width: 150px;">
              <el-option v-for="(icon, index) in subjectIcons" :key="index" :label="icon + ' ' + subjectIconNames[index]" :value="index"></el-option>
            </el-select>
          </div>
          <el-button type="primary" @click="addSubcategory" style="margin-bottom: 0;">添加学科题库</el-button>
        </div>
      </div>
      
      <el-table :data="subject?.subcategories" style="margin-top: 20px;">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column label="图标" width="80">
          <template #default="{ row }">
            <span class="subcategory-icon">{{ subjectIcons[row.iconIndex || 0] }}</span>
          </template>
        </el-table-column>
        <el-table-column label="学科题库名称">
          <template #default="{ row }">
            <div v-if="editingSubcategoryId === row.id" class="subcategory-edit">
              <el-input v-model="editingSubcategoryName" placeholder="输入学科题库名称" style="width: 200px; margin-right: 10px;"></el-input>
              <el-select v-model="editingSubcategoryIcon" placeholder="选择图标" style="width: 150px; margin-right: 10px;">
                <el-option v-for="(icon, index) in subjectIcons" :key="index" :label="icon + ' ' + subjectIconNames[index]" :value="index"></el-option>
              </el-select>
              <el-button type="primary" size="small" @click="saveSubcategoryEdit(row.id)">保存</el-button>
              <el-button size="small" @click="cancelSubcategoryEdit">取消</el-button>
            </div>
            <div v-else class="subcategory-info">
              <span>{{ row.name }}</span>
              <el-button link size="small" @click="editSubcategory(row)">编辑</el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="danger" size="small" @click="deleteSubcategory(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="emit('update:visible', false)">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 定义属性和事件
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  subject: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:visible', 'add-subcategory', 'update-subcategory', 'delete-subcategory']);

// 学科图标和名称
const subjectIcons = ['📚', '🔬', '🧮', '🏛️', '🎨', '🎵', '⚽', '🌍', '💻', '⚗️'];
const subjectIconNames = ['书籍', '科学', '数学', '历史', '艺术', '音乐', '体育', '地理', '计算机', '化学'];

// 新学科题库信息
const newSubcategoryName = ref('');
const newSubcategoryIcon = ref(0);

// 编辑学科题库信息
const editingSubcategoryId = ref(null);
const editingSubcategoryName = ref('');
const editingSubcategoryIcon = ref(0);

// 添加学科题库
const addSubcategory = () => {
  if (!newSubcategoryName.value.trim()) {
    ElMessage.warning('请输入学科题库名称');
    return;
  }
  
  const newSubcategory = {
    id: Date.now(),
    name: newSubcategoryName.value.trim(),
    iconIndex: newSubcategoryIcon.value
  };
  
  emit('add-subcategory', props.subject.id, newSubcategory);
  
  // 重置表单
  newSubcategoryName.value = '';
  newSubcategoryIcon.value = 0;
  
  ElMessage.success('学科题库添加成功');
};

// 编辑学科题库
const editSubcategory = (subcategory) => {
  editingSubcategoryId.value = subcategory.id;
  editingSubcategoryName.value = subcategory.name;
  editingSubcategoryIcon.value = subcategory.iconIndex || 0;
};

// 保存学科题库编辑
const saveSubcategoryEdit = (subcategoryId) => {
  if (!editingSubcategoryName.value.trim()) {
    ElMessage.warning('请输入学科题库名称');
    return;
  }
  
  const updatedSubcategory = {
    id: subcategoryId,
    name: editingSubcategoryName.value.trim(),
    iconIndex: editingSubcategoryIcon.value
  };
  
  emit('update-subcategory', props.subject.id, updatedSubcategory);
  cancelSubcategoryEdit();
  ElMessage.success('学科题库更新成功');
};

// 取消学科题库编辑
const cancelSubcategoryEdit = () => {
  editingSubcategoryId.value = null;
  editingSubcategoryName.value = '';
  editingSubcategoryIcon.value = 0;
};

// 删除学科题库
const deleteSubcategory = (subcategoryId) => {
  ElMessageBox.confirm('确定要删除这个学科题库吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    emit('delete-subcategory', props.subject.id, subcategoryId);
    ElMessage.success('学科题库删除成功');
  }).catch(() => {
    // 取消删除
  });
};
</script>

<style scoped>
.dialog-footer {
  text-align: center;
}

.subcategory-icon {
  font-size: 24px;
}

.subcategory-info {
  display: flex !important;
  justify-content: flex-start !important;
  align-items: center !important;
  gap: 10px !important;
  width: 100% !important;
}
</style>