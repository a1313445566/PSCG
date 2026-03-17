<template>
  <div class="setting-card">
    <h3 class="setting-title">学科管理</h3>
    <div class="subject-management" style="padding: 20px;">
      <div class="add-subject" style="margin-bottom: 20px; padding: 20px; background-color: #f5f7fa; border-radius: 8px;">
        <h4 style="margin: 0 0 15px; font-size: 16px; font-weight: 500; color: #303133;">添加新学科</h4>
        <div style="display: flex; align-items: flex-end; gap: 15px; flex-wrap: wrap;">
          <div class="form-item" style="display: flex; flex-direction: column; gap: 6px;">
            <label style="font-size: 14px; color: #606266; font-weight: 500;">学科名称</label>
            <el-input v-model="newSubjectName" placeholder="请输入学科名称" style="width: 220px;"></el-input>
          </div>
          <div class="form-item" style="display: flex; flex-direction: column; gap: 6px;">
            <label style="font-size: 14px; color: #606266; font-weight: 500;">选择图标</label>
            <el-select v-model="newSubjectIcon" placeholder="请选择图标" style="width: 180px;">
              <el-option v-for="(icon, index) in subjectIcons" :key="index" :label="icon + ' ' + subjectIconNames[index]" :value="index"></el-option>
            </el-select>
          </div>
          <el-button type="primary" @click="addSubject" style="margin-bottom: 0;">添加学科</el-button>
        </div>
      </div>
      
      <div class="subjects-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
        <div v-for="subject in subjects" :key="subject.id" class="subject-card" style="background: #fff; border: 1px solid #e4e7ed; border-radius: 12px; padding: 20px; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
          <div class="subject-header" style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px;">
            <div class="subject-info-header" style="display: flex; align-items: center; gap: 12px;">
              <span class="subject-icon-large" style="font-size: 40px;">{{ subjectIcons[subject.iconIndex || 0] }}</span>
              <div class="subject-name-section">
                <div v-if="editingSubjectId === subject.id" class="subject-edit-inline" style="display: flex; flex-direction: column; gap: 8px;">
                  <el-input v-model="editingSubjectName" placeholder="输入学科名称" style="width: 180px;"></el-input>
                  <el-select v-model="editingSubjectIcon" placeholder="选择图标" style="width: 180px;">
                    <el-option v-for="(icon, index) in subjectIcons" :key="index" :label="icon + ' ' + subjectIconNames[index]" :value="index"></el-option>
                  </el-select>
                  <div class="edit-buttons" style="display: flex; gap: 8px;">
                    <el-button type="primary" size="small" @click="saveSubjectEdit(subject.id)">保存</el-button>
                    <el-button size="small" @click="cancelSubjectEdit">取消</el-button>
                  </div>
                </div>
                <div v-else class="subject-name-display">
                  <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #303133;">{{ subject.name }}</h3>
                  <p style="margin: 4px 0 0; font-size: 13px; color: #909399;">学科题库: {{ subject.subcategories ? subject.subcategories.length : 0 }} 个</p>
                </div>
              </div>
            </div>
            <div v-if="editingSubjectId !== subject.id" class="subject-actions" style="display: flex; gap: 6px;">
              <el-button type="primary" size="small" @click="editSubject(subject)">编辑</el-button>
              <el-button type="danger" size="small" @click="deleteSubject(subject.id)">删除</el-button>
            </div>
          </div>
          
          <div class="subcategories-section" style="border-top: 1px solid #f0f0f0; padding-top: 16px;">
            <div class="subcategories-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <span style="font-size: 14px; font-weight: 500; color: #606266;">学科题库</span>
              <el-button type="primary" size="small" @click="manageSubcategories(subject)">管理</el-button>
            </div>
            
            <div v-if="subject.subcategories && subject.subcategories.length > 0" class="subcategories-list">
              <div v-for="subcategory in subject.subcategories" :key="subcategory.id" class="subcategory-tag">
                <span>{{ subjectIcons[subcategory.iconIndex || 0] }}</span>
                <span>{{ subcategory.name }}</span>
              </div>
            </div>
            <div v-else class="no-subcategories" style="text-align: center; padding: 16px; color: #909399; font-size: 13px;">
              暂无学科题库
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useQuestionStore } from '../../../stores/questionStore';

// 定义属性和事件
const props = defineProps({
});

const emit = defineEmits(['manage-subcategories']);

const questionStore = useQuestionStore();

// 使用计算属性获取最新的学科数据
const subjects = computed(() => questionStore.subjects);

// 学科图标和名称
const subjectIcons = ['📚', '🔢', '🔬', '🎨', '🎵', '⚽', '🌍', '🖥️', '📝', '🌟']
const subjectIconNames = ['语文', '数学', '科学', '美术', '音乐', '体育', '地理', '信息技术', '道德与法治', '综合实践'];

// 新学科信息
const newSubjectName = ref('');
const newSubjectIcon = ref(0);

// 编辑学科信息
const editingSubjectId = ref(null);
const editingSubjectName = ref('');
const editingSubjectIcon = ref(0);

// 添加学科
const addSubject = async () => {
  if (!newSubjectName.value.trim()) {
    ElMessage.warning('请输入学科名称');
    return;
  }
  
  try {
    await questionStore.addSubject(newSubjectName.value.trim(), newSubjectIcon.value);
    
    // 重置表单
    newSubjectName.value = '';
    newSubjectIcon.value = 0;
    
    ElMessage.success('学科添加成功');
  } catch (error) {
    ElMessage.error('学科添加失败，请稍后重试');
  }
};

// 编辑学科
const editSubject = (subject) => {
  editingSubjectId.value = subject.id;
  editingSubjectName.value = subject.name;
  editingSubjectIcon.value = subject.iconIndex || 0;
};

// 保存学科编辑
const saveSubjectEdit = async (subjectId) => {
  if (!editingSubjectName.value.trim()) {
    ElMessage.warning('请输入学科名称');
    return;
  }
  
  try {
    await questionStore.updateSubject(subjectId, editingSubjectName.value.trim(), editingSubjectIcon.value);
    cancelSubjectEdit();
    ElMessage.success('学科更新成功');
  } catch (error) {
    ElMessage.error('学科更新失败，请稍后重试');
  }
};

// 取消学科编辑
const cancelSubjectEdit = () => {
  editingSubjectId.value = null;
  editingSubjectName.value = '';
  editingSubjectIcon.value = 0;
};

// 删除学科
const deleteSubject = async (subjectId) => {
  ElMessageBox.confirm('确定要删除这个学科吗？删除后相关的题库和题目也会被删除。', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await questionStore.deleteSubject(subjectId);
      ElMessage.success('学科删除成功');
    } catch (error) {
      ElMessage.error('学科删除失败，请稍后重试');
    }
  }).catch(() => {
    // 取消删除
  });
};

// 管理学科题库
const manageSubcategories = (subject) => {
  emit('manage-subcategories', subject);
};
</script>

<style scoped>
.setting-card {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.setting-title {
  background-color: #f5f7fa;
  padding: 15px 20px;
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
}

.subcategory-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: #f0f9ff;
  border: 1px solid #d9ecff;
  border-radius: 16px;
  padding: 4px 12px;
  margin: 4px;
  font-size: 13px;
  color: #409eff;
}
</style>