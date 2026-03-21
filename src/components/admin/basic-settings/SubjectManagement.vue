<template>
  <div class="setting-card">
    <h3 class="setting-title">学科管理</h3>
    <div class="subject-management" style="padding: 20px;">
      <!-- 操作按钮区 -->
      <div class="action-buttons" style="margin-bottom: 20px; display: flex; gap: 12px; align-items: center;">
        <el-button type="primary" @click="addSubject" :loading="loading">
          <el-icon><Plus /></el-icon>
          添加学科
        </el-button>
        <el-button type="info" @click="refreshTree" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      
      <!-- 树结构 -->
      <div class="tree-container" style="border: 1px solid #e4e7ed; border-radius: 8px; overflow: hidden;">
        <el-tree
          :lazy="true"
          :load="loadNode"
          :props="treeProps"
          :expand-on-click-node="true"
          node-key="id"
          :expanded-keys="expandedKeys"
          @node-expand="handleNodeExpand"
          @node-collapse="handleNodeCollapse"
          draggable
          :allow-drop="allowDrop"
          @node-drop="handleNodeDrop"
          :loading="loading"
        >
          <template #default="{ node, data }">
            <div class="tree-node-content" style="display: flex; flex-direction: column; align-items: flex-start; width: 100%; padding: 8px 0;">
              <!-- 节点内容 -->
              <div v-if="!data.isEditing" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 18px;">{{ data.icon }}</span>
                  <span style="font-size: 16px;">{{ data.label }}</span>
                  <span v-if="data.type === 'subcategory'" style="margin-left: 8px; font-size: 14px; color: #909399;">
                    (难度: {{ getDifficultyText(data.difficulty) }})
                  </span>
                </div>
                
                <!-- 操作按钮 -->
                <div style="display: flex; gap: 8px;">
                  <el-button
                    type="text"
                    @click="startEdit(data)"
                    style="color: #409eff; font-size: 14px;"
                  >
                    编辑
                  </el-button>
                  <el-button
                    v-if="data.type === 'subject'"
                    type="text"
                    @click="addSubcategory(data.id)"
                    style="color: #409eff; font-size: 14px;"
                  >
                    添加题库
                  </el-button>
                  <el-button
                    type="text"
                    @click="deleteNode(data)"
                    style="color: #f56c6c; font-size: 14px;"
                  >
                    删除
                  </el-button>
                </div>
              </div>
              
              <!-- 编辑模式 -->
              <div v-else style="display: flex; flex-direction: column; gap: 12px; width: 100%; padding: 8px 0;">
                <div style="display: flex; gap: 12px; align-items: center;">
                  <el-select
                    v-model="editingData.iconIndex"
                    placeholder="选择图标"
                    style="width: 140px; font-size: 16px;"
                  >
                    <el-option v-for="(icon, index) in subjectIcons" :key="index" :label="icon + ' ' + subjectIconNames[index]" :value="index" />
                  </el-select>
                  <el-input
                    v-model="editingData.name"
                    placeholder="请输入名称"
                    style="width: 200px; font-size: 16px;"
                  />
                  <el-select
                    v-if="editingData.type === 'subcategory'"
                    v-model="editingData.difficulty"
                    placeholder="选择难度"
                    style="width: 120px; font-size: 16px;"
                  >
                    <el-option label="简单" value="1" />
                    <el-option label="较简单" value="2" />
                    <el-option label="中等" value="3" />
                    <el-option label="较难" value="4" />
                    <el-option label="困难" value="5" />
                  </el-select>
                </div>
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                  <el-button
                    type="text"
                    @click="saveEdit"
                    style="color: #67c23a; font-size: 14px;"
                  >
                    保存
                  </el-button>
                  <el-button
                    type="text"
                    @click="cancelEdit"
                    style="color: #909399; font-size: 14px;"
                  >
                    取消
                  </el-button>
                </div>
              </div>
            </div>
          </template>
        </el-tree>
      </div>
    </div>
    
    <!-- 添加学科对话框 -->
    <el-dialog
      v-model="addSubjectDialogVisible"
      title="添加学科"
      width="500px"
    >
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label style="font-size: 14px; color: #606266; font-weight: 500;">学科名称</label>
          <el-input v-model="newSubjectData.name" placeholder="请输入学科名称" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label style="font-size: 14px; color: #606266; font-weight: 500;">选择图标</label>
          <el-select v-model="newSubjectData.iconIndex" placeholder="请选择图标">
            <el-option v-for="(icon, index) in subjectIcons" :key="index" :label="icon + ' ' + subjectIconNames[index]" :value="index" />
          </el-select>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addSubjectDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmAddSubject">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 添加题库对话框 -->
    <el-dialog
      v-model="addSubcategoryDialogVisible"
      title="添加题库"
      width="500px"
    >
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label style="font-size: 14px; color: #606266; font-weight: 500;">题库名称</label>
          <el-input v-model="newSubcategoryData.name" placeholder="请输入题库名称" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label style="font-size: 14px; color: #606266; font-weight: 500;">选择图标</label>
          <el-select v-model="newSubcategoryData.iconIndex" placeholder="请选择图标">
            <el-option v-for="(icon, index) in subjectIcons" :key="index" :label="icon + ' ' + subjectIconNames[index]" :value="index" />
          </el-select>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label style="font-size: 14px; color: #606266; font-weight: 500;">难度</label>
          <el-select v-model="newSubcategoryData.difficulty" placeholder="选择难度">
            <el-option label="简单" value="1" />
            <el-option label="较简单" value="2" />
            <el-option label="中等" value="3" />
            <el-option label="较难" value="4" />
            <el-option label="困难" value="5" />
          </el-select>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addSubcategoryDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmAddSubcategory">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useQuestionStore } from '../../../stores/questionStore';
import { Plus, Refresh } from '@element-plus/icons-vue';

// 组件挂载时初始化数据
onMounted(async () => {
  await questionStore.loadData();
});

// 定义属性和事件
const props = defineProps({
});

const emit = defineEmits(['manage-subcategories']);

const questionStore = useQuestionStore();

// 使用计算属性获取最新的学科数据
const subjects = computed(() => questionStore.subjects);

// 学科图标和名称
const subjectIcons = ['📚', '🔢', '🔬', '🎨', '🎵', '⚽', '🌍', '🖥️', '📝', '🌟', '⚗️', '🧬', '⚡', '📜', '🌎', '🚀', '💡', '📊', '🎭', '📱']
const subjectIconNames = ['语文', '数学', '科学', '美术', '音乐', '体育', '地理', '信息技术', '道德与法治', '综合实践', '化学', '生物', '物理', '历史', '世界地理', '航天科技', '创新思维', '数据分析', '戏剧', '数字媒体'];

// 树结构配置
const treeProps = {
  children: 'children',
  label: 'label',
  isLeaf: (data) => data.type === 'subcategory'
};

// 加载节点数据
const loadNode = async (node, resolve) => {
  console.log('loadNode called', node.level, node.data);
  if (node.level === 0) {
    // 加载根节点（学科）
    try {
      // 确保数据已加载
      if (subjects.value.length === 0) {
        await questionStore.loadData();
      }
      
      // 获取保存的学科顺序
      const savedSubjectOrder = localStorage.getItem('subjectOrder');
      let orderedSubjects = [...subjects.value];
      
      console.log('Subjects loaded:', orderedSubjects);
      
      // 如果有保存的顺序，则按照保存的顺序排序
      if (savedSubjectOrder) {
        try {
          const subjectOrder = JSON.parse(savedSubjectOrder);
          orderedSubjects.sort((a, b) => {
            const indexA = subjectOrder.indexOf(a.id);
            const indexB = subjectOrder.indexOf(b.id);
            return (indexA === -1 ? 9999 : indexA) - (indexB === -1 ? 9999 : indexB);
          });
        } catch (error) {
          console.error('解析学科顺序失败:', error);
        }
      }
      
      const formattedSubjects = orderedSubjects.map(subject => ({
        id: subject.id,
        label: subject.name,
        icon: subjectIcons[subject.iconIndex || 0],
        type: 'subject',
        hasChildren: subject.subcategories && subject.subcategories.length > 0
      }));
      
      console.log('Formatted subjects:', formattedSubjects);
      resolve(formattedSubjects);
    } catch (error) {
      console.error('加载学科失败:', error);
      resolve([]);
    }
  } else if (node.data.type === 'subject') {
    // 加载学科的子节点（题库）
    try {
      const subjectId = node.data.id;
      const subject = subjects.value.find(s => s.id === subjectId);
      if (subject && subject.subcategories) {
        // 获取保存的题库顺序
        const savedSubcategoryOrder = localStorage.getItem(`subcategoryOrder_${subjectId}`);
        let orderedSubcategories = [...subject.subcategories];
        
        // 如果有保存的顺序，则按照保存的顺序排序
        if (savedSubcategoryOrder) {
          try {
            const subcategoryOrder = JSON.parse(savedSubcategoryOrder);
            orderedSubcategories.sort((a, b) => {
              const indexA = subcategoryOrder.indexOf(a.id);
              const indexB = subcategoryOrder.indexOf(b.id);
              return (indexA === -1 ? 9999 : indexA) - (indexB === -1 ? 9999 : indexB);
            });
          } catch (error) {
            console.error('解析题库顺序失败:', error);
          }
        }
        
        const formattedSubcategories = orderedSubcategories.map(subcategory => ({
          id: subcategory.id,
          label: subcategory.name,
          icon: subjectIcons[subcategory.iconIndex || 0],
          type: 'subcategory',
          difficulty: subcategory.difficulty || 1,
          subjectId: subjectId,
          hasChildren: false
        }));
        resolve(formattedSubcategories);
      } else {
        resolve([]);
      }
    } catch (error) {
      console.error('加载题库失败:', error);
      resolve([]);
    }
  }
};

// 编辑状态
const editingData = ref(null);

// 添加学科对话框
const addSubjectDialogVisible = ref(false);
const newSubjectData = ref({ name: '', iconIndex: 0 });

// 添加题库对话框
const addSubcategoryDialogVisible = ref(false);
const newSubcategoryData = ref({ name: '', iconIndex: 0, difficulty: 1 });
let currentSubjectId = null;

// 加载状态
const loading = ref(false);

// 展开的节点
const expandedKeys = ref([]);

// 难度文本映射
const getDifficultyText = (difficulty) => {
  const difficultyMap = {
    1: '简单',
    2: '较简单',
    3: '中等',
    4: '较难',
    5: '困难'
  };
  return difficultyMap[difficulty] || '简单';
};



// 刷新树
const refreshTree = async () => {
  loading.value = true;
  try {
    await questionStore.loadData();
    ElMessage.success('刷新成功');
  } catch (error) {
    ElMessage.error('刷新失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 添加学科
const addSubject = () => {
  newSubjectData.value = { name: '', iconIndex: 0 };
  addSubjectDialogVisible.value = true;
};

// 确认添加学科
const confirmAddSubject = async () => {
  if (!newSubjectData.value.name.trim()) {
    ElMessage.warning('请输入学科名称');
    return;
  }
  
  loading.value = true;
  try {
    await questionStore.addSubject(newSubjectData.value.name.trim(), newSubjectData.value.iconIndex);
    addSubjectDialogVisible.value = false;
    ElMessage.success('学科添加成功');
  } catch (error) {
    ElMessage.error('学科添加失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 添加题库
const addSubcategory = (subjectId) => {
  currentSubjectId = subjectId;
  newSubcategoryData.value = { name: '', iconIndex: 0, difficulty: 1 };
  addSubcategoryDialogVisible.value = true;
};

// 确认添加题库
const confirmAddSubcategory = async () => {
  if (!newSubcategoryData.value.name.trim()) {
    ElMessage.warning('请输入题库名称');
    return;
  }
  
  loading.value = true;
  try {
    await questionStore.addSubcategory(
      currentSubjectId,
      newSubcategoryData.value.name.trim(),
      newSubcategoryData.value.iconIndex,
      newSubcategoryData.value.difficulty
    );
    addSubcategoryDialogVisible.value = false;
    ElMessage.success('题库添加成功');
  } catch (error) {
    ElMessage.error('题库添加失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 开始编辑
const startEdit = (data) => {
  editingData.value = { ...data };
  // 计算图标索引
  editingData.value.iconIndex = subjectIcons.indexOf(data.icon);
  // 确保name字段正确赋值
  editingData.value.name = data.label;
  data.isEditing = true;
};

// 保存编辑
const saveEdit = async () => {
  if (!editingData.value || !editingData.value.name.trim()) {
    ElMessage.warning('请输入名称');
    return;
  }
  
  loading.value = true;
  try {
    if (editingData.value.type === 'subject') {
      await questionStore.updateSubject(
        editingData.value.id,
        editingData.value.name.trim(),
        editingData.value.iconIndex
      );
    } else if (editingData.value.type === 'subcategory') {
      await questionStore.updateSubcategory(
        editingData.value.subjectId,
        editingData.value.id,
        editingData.value.name.trim(),
        editingData.value.iconIndex,
        editingData.value.difficulty
      );
    }
    
    // 重置编辑状态
    editingData.value = null;
    ElMessage.success('更新成功');
  } catch (error) {
    ElMessage.error('更新失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 取消编辑
const cancelEdit = () => {
  // 直接重置编辑状态
  editingData.value = null;
};

// 根据ID查找节点
const findNodeById = (nodes, id) => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

// 处理节点展开
const handleNodeExpand = (data) => {
  if (!expandedKeys.value.includes(data.id)) {
    expandedKeys.value.push(data.id);
  }
};

// 处理节点折叠
const handleNodeCollapse = (data) => {
  expandedKeys.value = expandedKeys.value.filter(key => key !== data.id);
};

// 控制拖拽规则
const allowDrop = (draggingNode, dropNode, type) => {
  // 只允许在同级之间拖拽
  if (type === 'inner') {
    return false; // 不允许拖入节点内部
  }
  
  // 确保类型相同（学科只能拖到学科同级，题库只能拖到题库同级）
  if (draggingNode.data.type !== dropNode.data.type) {
    return false;
  }
  
  // 对于题库，确保在同一学科下
  if (draggingNode.data.type === 'subcategory') {
    const draggingSubjectId = draggingNode.data.subjectId;
    const dropSubjectId = dropNode.data.subjectId;
    return draggingSubjectId === dropSubjectId;
  }
  
  return true;
};

// 处理节点拖拽完成
const handleNodeDrop = async (draggingNode, dropNode, dropType, ev) => {
  // 处理前端显示顺序的调整
  const draggingData = draggingNode.data;
  const dropData = dropNode.data;
  
  // 对于学科排序
  if (draggingData.type === 'subject' && dropData.type === 'subject') {
    const subjectsCopy = [...questionStore.subjects];
    const draggingIndex = subjectsCopy.findIndex(item => item.id === draggingData.id);
    const dropIndex = subjectsCopy.findIndex(item => item.id === dropData.id);
    
    // 从原位置移除
    const [draggedItem] = subjectsCopy.splice(draggingIndex, 1);
    // 插入到新位置
    subjectsCopy.splice(dropIndex, 0, draggedItem);
    
    // 更新questionStore中的subjects
    questionStore.subjects = subjectsCopy;
    
    // 保存学科顺序到本地存储
    const subjectOrder = subjectsCopy.map(subject => subject.id);
    localStorage.setItem('subjectOrder', JSON.stringify(subjectOrder));
  }
  // 对于题库排序（同一学科下）
  else if (draggingData.type === 'subcategory' && dropData.type === 'subcategory' && draggingData.subjectId === dropData.subjectId) {
    const subjectsCopy = [...questionStore.subjects];
    const subject = subjectsCopy.find(item => item.id === draggingData.subjectId);
    if (subject && subject.subcategories) {
      const subcategoriesCopy = [...subject.subcategories];
      const draggingIndex = subcategoriesCopy.findIndex(item => item.id === draggingData.id);
      const dropIndex = subcategoriesCopy.findIndex(item => item.id === dropData.id);
      
      // 从原位置移除
      const [draggedItem] = subcategoriesCopy.splice(draggingIndex, 1);
      // 插入到新位置
      subcategoriesCopy.splice(dropIndex, 0, draggedItem);
      
      // 更新subject的subcategories
      subject.subcategories = subcategoriesCopy;
      // 更新questionStore中的subjects
      questionStore.subjects = subjectsCopy;
      
      // 保存题库顺序到本地存储
      const subcategoryOrder = subcategoriesCopy.map(subcategory => subcategory.id);
      localStorage.setItem(`subcategoryOrder_${draggingData.subjectId}`, JSON.stringify(subcategoryOrder));
    }
  }
  
  ElMessage.success('排序调整成功');
};

// 删除节点
const deleteNode = async (data) => {
  const confirmText = data.type === 'subject' 
    ? '确定要删除这个学科吗？删除后相关的题库和题目也会被删除。' 
    : '确定要删除这个题库吗？';
  
  ElMessageBox.confirm(confirmText, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    loading.value = true;
    try {
      if (data.type === 'subject') {
        await questionStore.deleteSubject(data.id);
        // 从展开列表中移除
        expandedKeys.value = expandedKeys.value.filter(key => key !== data.id);
      } else if (data.type === 'subcategory') {
        await questionStore.deleteSubcategory(data.subjectId, data.id);
      }
      ElMessage.success('删除成功');
    } catch (error) {
      ElMessage.error('删除失败，请稍后重试');
    } finally {
      loading.value = false;
    }
  }).catch(() => {
    // 取消删除
  });
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

.tree-container {
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
}

.tree-node-content {
  transition: all 0.3s ease;
}

.tree-node-content:hover {
  background-color: #f5f7fa;
}

:deep(.el-tree-node__content) {
  height: auto !important;
  min-height: 40px;
  padding: 4px 0;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #ecf5ff;
}

:deep(.el-tree-node.is-current > .el-tree-node__content:hover) {
  background-color: #ecf5ff;
}

.action-buttons {
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.dialog-footer {
  text-align: center;
}
</style>