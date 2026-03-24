<template>
  <div class="question-management">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索题目内容..."
          style="width: 280px;"
          clearable
          :prefix-icon="Search"
        />
        <el-select v-model="filterType" placeholder="题目类型" style="width: 120px; margin-left: 10px;" clearable>
          <el-option label="全部类型" value="" />
          <el-option label="单选题" value="single" />
          <el-option label="多选题" value="multiple" />
          <el-option label="判断题" value="judgment" />
          <el-option label="听力题" value="listening" />
          <el-option label="阅读题" value="reading" />
          <el-option label="看图题" value="image" />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="showAddQuestionDialog">
          <el-icon><Plus /></el-icon> 添加题目
        </el-button>
        <el-button type="success" @click="showBatchAddQuestionDialog">
          <el-icon><Upload /></el-icon> 批量添加
        </el-button>
        <el-dropdown trigger="click" @command="handleBatchCommand" :disabled="selectedQuestions.length === 0">
          <el-button type="warning">
            批量操作 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="delete" :disabled="selectedQuestions.length === 0">
                <el-icon><Delete /></el-icon> 批量删除
              </el-dropdown-item>
              <el-dropdown-item command="updateDifficulty" :disabled="selectedQuestions.length === 0">
                <el-icon><Star /></el-icon> 修改难度
              </el-dropdown-item>
              <el-dropdown-item command="updateType" :disabled="selectedQuestions.length === 0">
                <el-icon><Document /></el-icon> 修改类型
              </el-dropdown-item>
              <el-dropdown-item command="move" :disabled="selectedQuestions.length === 0">
                <el-icon><FolderOpened /></el-icon> 移动到
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="info" @click="refreshQuestions" :loading="loading">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </div>
    </div>

    <!-- 主内容区：左侧树 + 右侧表格 -->
    <div class="main-content">
      <!-- 左侧学科树 -->
      <div class="sidebar" :style="{ width: sidebarWidth + 'px' }">
        <div class="sidebar-header">
          <el-icon><Folder /></el-icon>
          <span>学科导航</span>
        </div>
        <div class="tree-container">
          <el-tree
            ref="treeRef"
            :data="treeData"
            :props="treeProps"
            node-key="id"
            highlight-current
            default-expand-all
            @node-click="handleTreeNodeClick"
          >
            <template #default="{ node, data }">
              <span class="tree-node">
                <el-icon v-if="data.type === 'subject'"><Reading /></el-icon>
                <el-icon v-else><Notebook /></el-icon>
                <span class="tree-node-label">{{ node.label }}</span>
                <span class="tree-node-count" v-if="data.questionCount !== undefined">({{ data.questionCount }})</span>
              </span>
            </template>
          </el-tree>
        </div>
        <!-- 拖拽调整宽度 -->
        <div class="resize-handle" @mousedown="startResize"></div>
      </div>

      <!-- 右侧表格区 -->
      <div class="content-area">
        <!-- 当前路径面包屑 -->
        <div class="breadcrumb-bar">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>全部题目</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentSubjectName">{{ currentSubjectName }}</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentSubcategoryName">{{ currentSubcategoryName }}</el-breadcrumb-item>
          </el-breadcrumb>
          <span class="total-count">共 {{ pagination.total }} 题</span>
        </div>

        <!-- 筛选标签 -->
        <div class="filter-tags" v-if="hasActiveFilters">
          <span class="filter-label">当前筛选：</span>
          <el-tag
            v-if="filterSubjectId"
            closable
            @close="clearFilter('subject')"
            type="primary"
          >
            学科: {{ currentSubjectName }}
          </el-tag>
          <el-tag
            v-if="filterSubcategoryId"
            closable
            @close="clearFilter('subcategory')"
            type="success"
          >
            题库: {{ currentSubcategoryName }}
          </el-tag>
          <el-tag
            v-if="filterType"
            closable
            @close="clearFilter('type')"
            type="warning"
          >
            类型: {{ getTypeName(filterType) }}
          </el-tag>
          <el-tag
            v-if="searchKeyword"
            closable
            @close="clearFilter('keyword')"
            type="info"
          >
            关键词: {{ searchKeyword }}
          </el-tag>
          <el-button text type="primary" @click="clearAllFilters">清除全部</el-button>
        </div>

        <!-- 题目表格 -->
        <el-table
          ref="tableRef"
          :data="displayQuestions"
          @selection-change="handleSelectionChange"
          stripe
          border
          :row-class-name="getRowClassName"
          v-loading="loading"
          element-loading-text="加载中..."
          height="calc(100vh - 320px)"
        >
          <el-table-column type="selection" width="45" />
          <el-table-column prop="id" label="ID" width="55" align="center" />
          <el-table-column prop="subjectName" label="学科" width="85" align="center">
            <template #default="{ row }">
              <el-tag size="small" type="primary" effect="light">{{ row.subjectName }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="subcategoryName" label="题库" width="95" align="center" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="subcategory-text">{{ row.subcategoryName || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="typeName" label="类型" width="80" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="getTypeTagType(row.type)">{{ row.typeName }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="content" label="题目内容" min-width="300" align="left">
            <template #default="{ row }">
              <div class="question-content-wrapper">
                <!-- 行内编辑模式 -->
                <template v-if="editingId === row.id">
                  <el-input
                    v-model="editingContent"
                    type="textarea"
                    :rows="3"
                    @blur="saveInlineEdit(row)"
                    @keyup.enter.ctrl="saveInlineEdit(row)"
                    @keyup.escape="cancelInlineEdit"
                    ref="inlineEditInput"
                  />
                  <div class="edit-hint">按 Ctrl+Enter 保存，Esc 取消</div>
                </template>
                <!-- 正常显示模式 -->
                <template v-else>
                  <div
                    class="question-content-preview"
                    :class="{ editable: canInlineEdit(row) }"
                    @dblclick="startInlineEdit(row)"
                    :title="canInlineEdit(row) ? '双击快速编辑' : '富文本内容，请使用编辑按钮'"
                  >
                    <div v-if="hasValidImage(row)" class="content-with-image">
                      <div class="image-preview" @click.stop="showImagePreview(row)">
                        <img :src="extractImageUrl(row)" alt="题目图片" class="question-image" />
                      </div>
                      <div class="content-text" v-html="truncate(stripImages(row.content), 150)"></div>
                      <el-tag v-if="isRichText(row.content)" size="small" type="info" class="rich-text-tag">富文本</el-tag>
                    </div>
                    <div v-else-if="row.audio" class="content-with-audio">
                      <el-icon class="audio-icon"><Microphone /></el-icon>
                      <div class="content-text" v-html="truncate(row.content, 150)"></div>
                      <el-tag v-if="isRichText(row.content)" size="small" type="info" class="rich-text-tag">富文本</el-tag>
                    </div>
                    <div v-else class="content-text-wrapper">
                      <div class="content-text" v-html="truncate(row.content, 150)"></div>
                      <el-tag v-if="isRichText(row.content)" size="small" type="info" class="rich-text-tag">富文本</el-tag>
                    </div>
                  </div>
                </template>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="answer" label="答案" width="55" align="center">
            <template #default="{ row }">
              <el-tag size="small" type="danger" effect="dark">{{ row.answer || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="100" align="center" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="time-text">{{ row.createdAt || '未知' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right" align="center">
            <template #default="{ row }">
              <div class="row-operations">
                <el-button type="primary" size="small" link @click.stop="previewQuestion(row)">
                  <el-icon><View /></el-icon> 预览
                </el-button>
                <el-button type="warning" size="small" link @click.stop="editQuestion(row)">
                  <el-icon><Edit /></el-icon> 编辑
                </el-button>
                <el-button type="danger" size="small" link @click.stop="deleteQuestionWithUndo(row)">
                  <el-icon><Delete /></el-icon> 删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.limit"
            :page-sizes="[20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <!-- 预览弹窗 -->
    <el-dialog
      v-model="previewVisible"
      title="题目预览"
      width="700px"
      destroy-on-close
    >
      <div class="preview-content" v-loading="previewLoading" v-if="previewData">
        <div class="preview-item">
          <label>题目ID：</label>
          <span>{{ previewData.id }}</span>
        </div>
        <div class="preview-item">
          <label>所属学科：</label>
          <span>{{ previewData.subjectName }}</span>
        </div>
        <div class="preview-item">
          <label>所属题库：</label>
          <span>{{ previewData.subcategoryName || '-' }}</span>
        </div>
        <div class="preview-item">
          <label>题目类型：</label>
          <el-tag :type="getTypeTagType(previewData.type)">{{ previewData.typeName }}</el-tag>
        </div>
        <div class="preview-item">
          <label>题目内容：</label>
          <div class="preview-content-box" v-html="previewData.content"></div>
        </div>
        <div class="preview-item" v-if="previewData.image">
          <label>题目图片：</label>
          <el-image :src="previewData.image" fit="contain" style="max-width: 400px; max-height: 300px;" />
        </div>
        <div class="preview-item" v-if="previewData.audio">
          <label>音频：</label>
          <audio controls :src="previewData.audio" style="max-width: 100%;"></audio>
        </div>
        <div class="preview-item" v-if="previewData.options && previewData.options.length > 0">
          <label>选项：</label>
          <div class="preview-options">
            <div v-for="(option, index) in previewData.options" :key="index" class="preview-option">
              <span class="option-label">{{ String.fromCharCode(65 + index) }}.</span>
              <span class="option-content" v-html="option"></span>
            </div>
          </div>
        </div>
        <div class="preview-item">
          <label>正确答案：</label>
          <el-tag type="danger" effect="dark" v-html="previewData.answer"></el-tag>
        </div>
        <div class="preview-item" v-if="previewData.explanation">
          <label>解析：</label>
          <div class="preview-content-box" v-html="previewData.explanation"></div>
        </div>
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
        <el-button type="primary" @click="editQuestion(previewData); previewVisible = false;">编辑</el-button>
      </template>
    </el-dialog>

    <!-- 批量修改难度弹窗 -->
    <el-dialog v-model="batchDifficultyVisible" title="批量修改难度" width="400px">
      <el-form label-width="80px">
        <el-form-item label="目标难度">
          <el-rate v-model="batchDifficulty" :max="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchDifficultyVisible = false">取消</el-button>
        <el-button type="primary" @click="executeBatchDifficulty">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量修改类型弹窗 -->
    <el-dialog v-model="batchTypeVisible" title="批量修改类型" width="400px">
      <el-form label-width="80px">
        <el-form-item label="目标类型">
          <el-select v-model="batchType" placeholder="选择类型">
            <el-option label="单选题" value="single" />
            <el-option label="多选题" value="multiple" />
            <el-option label="判断题" value="judgment" />
            <el-option label="听力题" value="listening" />
            <el-option label="阅读题" value="reading" />
            <el-option label="看图题" value="image" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchTypeVisible = false">取消</el-button>
        <el-button type="primary" @click="executeBatchType">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量移动弹窗 -->
    <el-dialog v-model="batchMoveVisible" title="批量移动到" width="450px">
      <el-form label-width="80px">
        <el-form-item label="目标学科">
          <el-select v-model="batchMoveSubjectId" placeholder="选择学科" @change="handleBatchMoveSubjectChange">
            <el-option v-for="subject in subjects" :key="subject.id" :label="subject.name" :value="subject.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标题库">
          <el-select v-model="batchMoveSubcategoryId" placeholder="选择题库" :disabled="!batchMoveSubjectId">
            <el-option v-for="sub in batchMoveSubcategories" :key="sub.id" :label="sub.name" :value="sub.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchMoveVisible = false">取消</el-button>
        <el-button type="primary" @click="executeBatchMove" :disabled="!batchMoveSubjectId">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search, Plus, Upload, ArrowDown, Delete, Star, Document, FolderOpened,
  Refresh, Folder, Reading, Notebook, View, Edit, Microphone
} from '@element-plus/icons-vue';
import { useQuestionStore } from '../../../stores/questionStore';
import { formatDate } from '../../../utils/dateUtils';
import { getApiBaseUrl } from '../../../utils/database';

// Props
const props = defineProps({
  subjects: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits(['edit-question', 'delete-question', 'show-add-dialog', 'show-batch-add-dialog']);

// Store
const questionStore = useQuestionStore();

// 筛选条件
const searchKeyword = ref('');
const filterSubjectId = ref('');
const filterSubcategoryId = ref('');
const filterType = ref('');

// 加载状态
const loading = ref(false);

// 选中的题目
const selectedQuestions = ref([]);

// 分页
const pagination = ref({
  page: 1,
  limit: 50,
  total: 0
});

// 侧边栏宽度
const sidebarWidth = ref(220);

// 服务端数据
const serverQuestions = ref([]);

// 行内编辑
const editingId = ref(null);
const editingContent = ref('');
const inlineEditInput = ref(null);

// 预览
const previewVisible = ref(false);
const previewData = ref(null);
const previewLoading = ref(false);
const previewCache = new Map(); // 预览缓存

// 批量操作
const batchDifficultyVisible = ref(false);
const batchDifficulty = ref(1);
const batchTypeVisible = ref(false);
const batchType = ref('');
const batchMoveVisible = ref(false);
const batchMoveSubjectId = ref('');
const batchMoveSubcategoryId = ref('');

// Tree ref
const treeRef = ref(null);
const tableRef = ref(null);

// 删除撤销相关
const pendingDeletes = ref(new Map()); // 存储待删除的题目

// 防抖定时器
let searchTimer = null;

// Tree 配置
const treeProps = {
  children: 'children',
  label: 'name'
};

// 计算 Tree 数据
const treeData = computed(() => {
  return props.subjects.map(subject => ({
    id: `subject-${subject.id}`,
    name: subject.name,
    type: 'subject',
    subjectId: subject.id,
    questionCount: subject.questionCount || 0,
    children: (subject.subcategories || []).map(sub => ({
      id: `subcategory-${sub.id}`,
      name: sub.name,
      type: 'subcategory',
      subjectId: subject.id,
      subcategoryId: sub.id,
      questionCount: sub.questionCount || 0
    }))
  }));
});

// 当前学科名称
const currentSubjectName = computed(() => {
  if (!filterSubjectId.value) return '';
  const subject = props.subjects.find(s => s.id == filterSubjectId.value);
  return subject ? subject.name : '';
});

// 当前题库名称
const currentSubcategoryName = computed(() => {
  if (!filterSubcategoryId.value) return '';
  const subject = props.subjects.find(s => s.id == filterSubjectId.value);
  if (!subject || !subject.subcategories) return '';
  const subcategory = subject.subcategories.find(sc => sc.id == filterSubcategoryId.value);
  return subcategory ? subcategory.name : '';
});

// 批量移动的子分类列表
const batchMoveSubcategories = computed(() => {
  if (!batchMoveSubjectId.value) return [];
  const subject = props.subjects.find(s => s.id == batchMoveSubjectId.value);
  return subject ? subject.subcategories || [] : [];
});

// 是否有激活的筛选条件
const hasActiveFilters = computed(() => {
  return filterSubjectId.value || filterSubcategoryId.value || filterType.value || searchKeyword.value;
});

// 显示的题目
const displayQuestions = computed(() => serverQuestions.value);

// 加载题目
const loadQuestions = async (resetPage = false) => {
  try {
    loading.value = true;
    if (resetPage) {
      pagination.value.page = 1;
    }

    const result = await questionStore.loadQuestions({
      subjectId: filterSubjectId.value || null,
      subcategoryId: filterSubcategoryId.value || null,
      type: filterType.value || null,
      keyword: searchKeyword.value || null,
      page: pagination.value.page,
      limit: pagination.value.limit,
      excludeContent: true
    });

    serverQuestions.value = formatQuestions(result?.data || []);
    pagination.value.total = result?.total || 0;
  } catch (error) {
    console.error('加载题目失败:', error);
    ElMessage.error('加载题目失败');
  } finally {
    loading.value = false;
  }
};

// 格式化题目数据
const formatQuestions = (questions) => {
  return questions.map(question => {
    const subjectId = question.subjectId || question.subject_id;
    const subject = props.subjects.find(s => String(s.id) === String(subjectId));
    const subjectName = subject ? subject.name : '';

    let subcategoryName = '';
    const subcategoryId = question.subcategoryId || question.subcategory_id;
    if (subject && subcategoryId) {
      const subcategory = subject.subcategories?.find(sc => String(sc.id) === String(subcategoryId));
      subcategoryName = subcategory ? subcategory.name : '';
    }

    const typeName = getTypeName(question.type);
    const createdAt = question.createdAt || question.created_at || '未知';
    const formattedCreatedAt = typeof createdAt === 'string' && createdAt !== '未知' ? formatDate(createdAt) : createdAt;

    let content = question.content;
    if (typeof content === 'object' && content?.ops) {
      const tempElement = document.createElement('div');
      content.ops.forEach(op => {
        if (typeof op.insert === 'string') {
          tempElement.innerHTML += op.insert;
        } else if (op.insert?.image) {
          tempElement.innerHTML += `<img src="${op.insert.image}" alt="图片" style="max-width: 100%;">`;
        }
      });
      content = tempElement.innerHTML;
    } else if (typeof content !== 'string') {
      content = String(content || '');
    }

    return {
      ...question,
      content,
      subjectName,
      subcategoryName,
      typeName,
      createdAt: formattedCreatedAt,
      image: question.image || question.image_url || ''
    };
  });
};

// 防抖搜索
const debouncedSearch = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadQuestions(true);
  }, 300);
};

// 监听筛选条件变化
watch([filterSubjectId, filterSubcategoryId, filterType], () => {
  loadQuestions(true);
});

watch(searchKeyword, () => {
  debouncedSearch();
});

// 分页变化
const handlePageChange = (page) => {
  pagination.value.page = page;
  loadQuestions();
};

const handleSizeChange = (size) => {
  pagination.value.limit = size;
  pagination.value.page = 1;
  loadQuestions();
};

// Tree 节点点击
const handleTreeNodeClick = (data) => {
  if (data.type === 'subject') {
    filterSubjectId.value = data.subjectId;
    filterSubcategoryId.value = '';
  } else if (data.type === 'subcategory') {
    filterSubjectId.value = data.subjectId;
    filterSubcategoryId.value = data.subcategoryId;
  }
};

// 清除筛选
const clearFilter = (type) => {
  switch (type) {
    case 'subject':
      filterSubjectId.value = '';
      filterSubcategoryId.value = '';
      break;
    case 'subcategory':
      filterSubcategoryId.value = '';
      break;
    case 'type':
      filterType.value = '';
      break;
    case 'keyword':
      searchKeyword.value = '';
      break;
  }
};

const clearAllFilters = () => {
  filterSubjectId.value = '';
  filterSubcategoryId.value = '';
  filterType.value = '';
  searchKeyword.value = '';
};

// 选择变化
const handleSelectionChange = (selection) => {
  selectedQuestions.value = selection;
};

// 行内编辑
const startInlineEdit = (row) => {
  // 检查是否为富文本内容
  if (isRichText(row.content)) {
    ElMessage.warning('该题目包含富文本格式，请使用"编辑"按钮进行完整编辑');
    return;
  }
  
  editingId.value = row.id;
  editingContent.value = row.content;
  nextTick(() => {
    inlineEditInput.value?.focus();
  });
};

const saveInlineEdit = async (row) => {
  if (editingContent.value === row.content) {
    editingId.value = null;
    return;
  }

  try {
    // 获取完整题目数据
    const fullQuestion = await fetch(`${getApiBaseUrl()}/questions/${row.id}`).then(r => r.json());

    const response = await fetch(`${getApiBaseUrl()}/questions/${row.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...fullQuestion,
        content: editingContent.value
      })
    });

    if (response.ok) {
      ElMessage.success('修改成功');
      // 更新本地数据
      const index = serverQuestions.value.findIndex(q => q.id === row.id);
      if (index !== -1) {
        serverQuestions.value[index].content = editingContent.value;
      }
    } else {
      ElMessage.error('修改失败');
    }
  } catch (error) {
    console.error('保存失败:', error);
    ElMessage.error('保存失败');
  } finally {
    editingId.value = null;
  }
};

const cancelInlineEdit = () => {
  editingId.value = null;
};

// 删除撤销功能
const deleteQuestionWithUndo = (row) => {
  // 先临时从列表移除
  const index = serverQuestions.value.findIndex(q => q.id === row.id);
  const removed = { ...serverQuestions.value[index] };
  serverQuestions.value.splice(index, 1);
  pagination.value.total -= 1;

  // 存储待删除项
  pendingDeletes.value.set(row.id, {
    data: removed,
    index,
    timer: null
  });

  // 显示撤销提示
  ElMessage({
    message: `已删除题目 #${row.id}`,
    type: 'warning',
    duration: 3000,
    showClose: true,
    action: {
      text: '撤销',
      handler: () => {
        undoDelete(row.id);
      }
    },
    onClose: () => {
      // 消息关闭后执行真正删除
      executeRealDelete(row.id);
    }
  });
};

const undoDelete = (questionId) => {
  const pending = pendingDeletes.value.get(questionId);
  if (pending) {
    // 恢复数据
    serverQuestions.value.splice(pending.index, 0, pending.data);
    pagination.value.total += 1;
    pendingDeletes.value.delete(questionId);
    ElMessage.success('已撤销删除');
  }
};

const executeRealDelete = async (questionId) => {
  const pending = pendingDeletes.value.get(questionId);
  if (!pending) return; // 已被撤销

  try {
    await fetch(`${getApiBaseUrl()}/questions/${questionId}`, { method: 'DELETE' });
    pendingDeletes.value.delete(questionId);
    emit('delete-question', questionId);
  } catch (error) {
    console.error('删除失败:', error);
  }
};

// 批量操作
const handleBatchCommand = (command) => {
  if (selectedQuestions.value.length === 0) {
    ElMessage.warning('请先选择题目');
    return;
  }

  switch (command) {
    case 'delete':
      batchDeleteQuestions();
      break;
    case 'updateDifficulty':
      batchDifficulty.value = 1;
      batchDifficultyVisible.value = true;
      break;
    case 'updateType':
      batchType.value = '';
      batchTypeVisible.value = true;
      break;
    case 'move':
      batchMoveSubjectId.value = '';
      batchMoveSubcategoryId.value = '';
      batchMoveVisible.value = true;
      break;
  }
};

// 批量删除
const batchDeleteQuestions = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedQuestions.value.length} 道题目吗？`,
      '批量删除确认',
      { type: 'warning' }
    );

    const ids = selectedQuestions.value.map(q => q.id);
    const response = await fetch(`${getApiBaseUrl()}/questions/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', ids })
    });

    if (response.ok) {
      ElMessage.success(`成功删除 ${ids.length} 道题目`);
      selectedQuestions.value = [];
      loadQuestions();
    }
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 批量修改难度
const executeBatchDifficulty = async () => {
  const ids = selectedQuestions.value.map(q => q.id);
  try {
    const response = await fetch(`${getApiBaseUrl()}/questions/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateDifficulty',
        ids,
        data: { difficulty: batchDifficulty.value }
      })
    });

    if (response.ok) {
      ElMessage.success(`成功修改 ${ids.length} 道题目的难度`);
      batchDifficultyVisible.value = false;
      selectedQuestions.value = [];
      loadQuestions();
    }
  } catch (error) {
    ElMessage.error('修改失败');
  }
};

// 批量修改类型
const executeBatchType = async () => {
  if (!batchType.value) {
    ElMessage.warning('请选择目标类型');
    return;
  }

  const ids = selectedQuestions.value.map(q => q.id);
  try {
    const response = await fetch(`${getApiBaseUrl()}/questions/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateType',
        ids,
        data: { type: batchType.value }
      })
    });

    if (response.ok) {
      ElMessage.success(`成功修改 ${ids.length} 道题目的类型`);
      batchTypeVisible.value = false;
      selectedQuestions.value = [];
      loadQuestions();
    }
  } catch (error) {
    ElMessage.error('修改失败');
  }
};

// 批量移动
const handleBatchMoveSubjectChange = () => {
  batchMoveSubcategoryId.value = '';
};

const executeBatchMove = async () => {
  const ids = selectedQuestions.value.map(q => q.id);
  try {
    const response = await fetch(`${getApiBaseUrl()}/questions/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'move',
        ids,
        data: {
          subjectId: batchMoveSubjectId.value,
          subcategoryId: batchMoveSubcategoryId.value || null
        }
      })
    });

    if (response.ok) {
      ElMessage.success(`成功移动 ${ids.length} 道题目`);
      batchMoveVisible.value = false;
      selectedQuestions.value = [];
      loadQuestions();
    }
  } catch (error) {
    ElMessage.error('移动失败');
  }
};

// 预览题目
const previewQuestion = async (row) => {
  // 检查缓存
  if (previewCache.has(row.id)) {
    previewData.value = previewCache.get(row.id);
    previewVisible.value = true;
    return;
  }

  previewLoading.value = true;
  previewVisible.value = true;
  previewData.value = null;

  try {
    const response = await fetch(`${getApiBaseUrl()}/questions/${row.id}`);
    const data = await response.json();

    const previewInfo = {
      ...data,
      subjectName: currentSubjectName.value || props.subjects.find(s => s.id == data.subjectId)?.name || '',
      subcategoryName: currentSubcategoryName.value || props.subjects.find(s => s.id == data.subjectId)?.subcategories?.find(sc => sc.id == data.subcategoryId)?.name || '',
      typeName: getTypeName(data.type)
    };

    // 缓存预览数据（最多缓存50条）
    if (previewCache.size >= 50) {
      const firstKey = previewCache.keys().next().value;
      previewCache.delete(firstKey);
    }
    previewCache.set(row.id, previewInfo);

    previewData.value = previewInfo;
  } catch (error) {
    previewVisible.value = false;
    ElMessage.error('获取题目详情失败');
  } finally {
    previewLoading.value = false;
  }
};

// 显示图片预览
const showImagePreview = (row) => {
  const url = extractImageUrl(row);
  if (url) {
    window.open(url, '_blank');
  }
};

// 编辑题目
const editQuestion = (row) => {
  emit('edit-question', row);
};

// 显示添加对话框
const showAddQuestionDialog = () => {
  emit('show-add-dialog');
};

// 显示批量添加对话框
const showBatchAddQuestionDialog = () => {
  emit('show-batch-add-dialog');
};

// 刷新题目
const refreshQuestions = () => {
  loadQuestions();
};

// 侧边栏拖拽调整宽度
let isResizing = false;
let startX = 0;
let startWidth = 0;

const startResize = (e) => {
  isResizing = true;
  startX = e.clientX;
  startWidth = sidebarWidth.value;
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
};

const handleResize = (e) => {
  if (!isResizing) return;
  const diff = e.clientX - startX;
  const newWidth = Math.max(180, Math.min(350, startWidth + diff));
  sidebarWidth.value = newWidth;
};

const stopResize = () => {
  isResizing = false;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
};

// 辅助方法
const hasValidImage = (row) => {
  if (row.image) return true;
  if (row.image_url) return true;
  return typeof row.content === 'string' && row.content.includes('<img');
};

// 检测内容是否包含富文本（HTML标签）
const isRichText = (content) => {
  if (!content || typeof content !== 'string') return false;
  // 检测常见的 HTML 标签（排除简单的换行）
  const richTextPattern = /<(?!br\s*\/?>)[a-zA-Z][^>]*>/i;
  return richTextPattern.test(content);
};

// 检测内容是否可以安全进行行内编辑
const canInlineEdit = (row) => {
  // 富文本内容不适合行内编辑
  return !isRichText(row.content);
};

const extractImageUrl = (row) => {
  if (row.image) return row.image;
  if (row.image_url) return row.image_url;
  if (typeof row.content !== 'string') return '';
  const match = row.content.match(/<img[^>]+src="([^"]+)"/);
  return match ? match[1] : '';
};

const stripImages = (content) => {
  if (typeof content !== 'string') return '';
  return content.replace(/<img[^>]+>/g, '');
};

const truncate = (html, length) => {
  if (!html) return '';
  const text = html.replace(/<[^>]+>/g, '');
  return text.length > length ? text.substring(0, length) + '...' : html;
};

const getTypeName = (type) => {
  const typeMap = {
    'single': '单选题',
    'multiple': '多选题',
    'judgment': '判断题',
    'listening': '听力题',
    'reading': '阅读题',
    'image': '看图题'
  };
  return typeMap[type] || (typeof type === 'string' ? type : '未知');
};

const getTypeTagType = (type) => {
  const typeMap = {
    'single': 'primary',
    'multiple': 'success',
    'judgment': 'warning'
  };
  return typeMap[type] || 'info';
};

const getRowClassName = ({ row }) => {
  return (hasValidImage(row) || row.audio) ? 'has-media' : '';
};

// 初始加载
onMounted(() => {
  loadQuestions();
});

// 暴露方法给父组件
defineExpose({
  refresh: loadQuestions
});
</script>

<style scoped>
.question-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  position: relative;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tree-node-label {
  flex: 1;
}

.tree-node-count {
  color: #909399;
  font-size: 12px;
}

.resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background: transparent;
  transition: background 0.2s;
}

.resize-handle:hover {
  background: #409eff;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px;
  background: #f5f7fa;
}

.breadcrumb-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.total-count {
  color: #606266;
  font-size: 14px;
}

.filter-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 10px 16px;
  background: #fff;
  border-radius: 8px;
  flex-wrap: wrap;
}

.filter-label {
  color: #606266;
  font-size: 13px;
}

.question-content-wrapper {
  width: 100%;
}

.question-content-preview {
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  width: 100%;
}

.question-content-preview.editable {
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.question-content-preview.editable:hover {
  background: #f5f7fa;
}

.edit-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.content-with-image {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.image-preview {
  flex-shrink: 0;
  width: 60px;
  height: 45px;
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  cursor: pointer;
  transition: transform 0.2s;
}

.image-preview:hover {
  transform: scale(1.05);
}

.question-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content-with-audio {
  display: flex;
  align-items: center;
  gap: 8px;
}

.audio-icon {
  font-size: 18px;
  color: #409eff;
}

.content-text-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.rich-text-tag {
  flex-shrink: 0;
  font-size: 11px;
  opacity: 0.7;
}

.content-text {
  flex: 1;
  min-width: 0;
  word-break: break-word;
  line-height: 1.5;
  font-size: 14px;
  color: #303133;
}

.subcategory-text {
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #606266;
}

.time-text {
  font-size: 13px;
  color: #909399;
}

.row-operations {
  display: flex;
  justify-content: center;
  gap: 4px;
  flex-wrap: nowrap;
}

.row-operations .el-button {
  padding: 4px 6px;
  font-size: 12px;
}

.has-media {
  background-color: #fafafa;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}

/* 预览弹窗样式 */
.preview-content {
  padding: 10px;
}

.preview-item {
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
}

.preview-item label {
  width: 80px;
  flex-shrink: 0;
  color: #606266;
  font-weight: 500;
}

.preview-content-box {
  flex: 1;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  line-height: 1.6;
  word-break: break-word;
}

.preview-content-box img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
  margin: 8px 0;
}

.preview-options {
  flex: 1;
}

.preview-option {
  padding: 10px 12px;
  margin-bottom: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.option-label {
  flex-shrink: 0;
  font-weight: 600;
  color: #409eff;
}

.option-content {
  flex: 1;
  line-height: 1.6;
  word-break: break-word;
}

.option-content img {
  max-width: 200px;
  max-height: 100px;
  border-radius: 4px;
  margin: 4px 0;
}

/* Element Plus 样式覆盖 */
:deep(.el-tree-node__content) {
  height: 36px;
  border-radius: 4px;
  margin-bottom: 2px;
}

:deep(.el-tree-node__content:hover) {
  background-color: #ecf5ff;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #ecf5ff;
  color: #409eff;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background: #f5f7fa !important;
}
</style>
