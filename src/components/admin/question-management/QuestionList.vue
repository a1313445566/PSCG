<template>
  <div class="question-management">
    <div class="filter-section">
      <div class="filter-row">
        <el-input v-model="searchKeyword" placeholder="搜索题目内容" style="width: 300px; margin-right: 10px;"></el-input>
        <el-select v-model="filterSubjectId" placeholder="选择学科" style="width: 120px; margin-right: 10px;" @change="handleSubjectChange">
          <el-option label="全部学科" value=""></el-option>
          <el-option v-for="subject in subjects" :key="subject.id" :label="subject.name" :value="subject.id"></el-option>
        </el-select>
        <el-select v-model="filterSubcategoryId" placeholder="选择学科题库" style="width: 150px; margin-right: 10px;">
          <el-option label="全部题库" value=""></el-option>
          <el-option v-for="subcategory in filterSubcategories" :key="subcategory.id" :label="subcategory.name" :value="subcategory.id"></el-option>
        </el-select>
        <el-select v-model="filterType" placeholder="选择类型" style="width: 120px; margin-right: 10px;">
          <el-option label="全部类型" value=""></el-option>
          <el-option label="单选题" value="single"></el-option>
          <el-option label="多选题" value="multiple"></el-option>
          <el-option label="判断题" value="judgment"></el-option>
          <el-option label="听力题" value="listening"></el-option>
          <el-option label="阅读题" value="reading"></el-option>
          <el-option label="看图题" value="image"></el-option>
        </el-select>
        <el-button type="primary" @click="applyQuestionFilters">应用筛选</el-button>
      </div>
      <div class="action-buttons">
        <el-button type="primary" @click="showAddQuestionDialog">添加题目</el-button>
        <el-button type="success" @click="showBatchAddQuestionDialog">批量添加题目</el-button>
        <el-button type="danger" @click="batchDeleteQuestions" :disabled="selectedQuestions.length === 0">批量删除</el-button>
        <el-button type="info" @click="toggleViewMode">
          {{ isCategoryView ? '切换到列表视图' : '切换到分类视图' }}
        </el-button>
        <el-button type="warning" @click="refreshQuestions">
          <el-icon><Refresh /></el-icon> 刷新数据
        </el-button>
      </div>
    </div>
    
    <!-- 列表视图 -->
    <div class="table-container" v-if="!isCategoryView">
      <el-table 
        :data="paginatedQuestions" 
        style="margin-top: 20px; width: 100%"
        @selection-change="handleSelectionChange"
        @row-click="editQuestion"
        stripe
        border
        :default-sort="{prop: 'createdAt', order: 'descending'}"
        :row-class-name="row => hasValidImage(row.content) || row.audio ? 'has-media' : ''"
      >
        <el-table-column type="selection" width="40"></el-table-column>
        <el-table-column prop="id" label="ID" width="60" align="center"></el-table-column>
        <el-table-column prop="subjectName" label="学科" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary" effect="light" style="width: auto; max-width: 100%;">
              {{ row.subjectName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="subcategoryName" label="学科题库" width="150" align="center">
          <template #default="{ row }">
            <span class="subcategory-text">{{ row.subcategoryName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="typeName" label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="{
              'single': 'primary',
              'multiple': 'success',
              'judgment': 'warning'
            }[row.type] || 'info'" style="width: auto; max-width: 100%;">
              {{ row.typeName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="题目内容" min-width="300" align="left">
          <template #default="{ row }">
            <div class="question-content-wrapper">
              <div class="question-content-preview">
                <div v-if="hasValidImage(row.content)" class="content-with-image">
                  <div class="image-preview">
                    <img :src="extractImageUrl(row.content)" alt="题目图片" class="question-image" />
                  </div>
                  <div class="content-text" v-html="stripImages(row.content)"></div>
                </div>
                <div v-else-if="row.audio" class="content-with-audio">
                  <el-icon class="audio-icon"><i class="el-icon-microphone"></i></el-icon>
                  <div class="content-text" v-html="row.content"></div>
                </div>
                <div v-else class="content-text" v-html="row.content"></div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="answer" label="答案" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="danger" effect="dark">{{ row.answer || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="140" align="center">
          <template #default="{ row }">
            <span class="time-text">{{ row.createdAt || '未知' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <div class="row-operations">
              <el-button type="primary" size="small" @click.stop="editQuestion(row)" style="margin-right: 5px;">编辑</el-button>
              <el-button type="danger" size="small" @click.stop="deleteQuestion(row.id)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 分类视图 -->
    <div class="category-view" v-else>
      <div class="category-filter" style="margin-bottom: 20px; padding: 15px; background-color: #f5f7fa; border-radius: 8px; display: flex; gap: 10px; align-items: center;">
        <el-select v-model="selectedCategorySubjectId" placeholder="选择学科" style="width: 150px;" @change="handleCategorySubjectChange">
          <el-option label="请选择学科" value=""></el-option>
          <el-option v-for="subject in subjects" :key="subject.id" :label="subject.name" :value="subject.id"></el-option>
        </el-select>
        <el-select v-model="selectedCategorySubcategoryId" placeholder="选择题库" style="width: 150px;" @change="handleCategorySubcategoryChange">
          <el-option label="请选择题库" value=""></el-option>
          <el-option v-for="subcategory in categorySubcategories" :key="subcategory.id" :label="subcategory.name" :value="subcategory.id"></el-option>
        </el-select>
      </div>
      
      <div v-if="selectedCategorySubjectId && selectedCategorySubcategoryId" class="category-questions-table">
        <el-table 
          :data="paginatedCategoryQuestions" 
          style="margin-top: 20px; width: 100%"
          @row-click="editQuestion"
          stripe
          border
          :default-sort="{prop: 'createdAt', order: 'descending'}"
          :row-class-name="row => hasValidImage(row.content) || row.audio ? 'has-media' : ''"
        >
          <el-table-column type="selection" width="40"></el-table-column>
          <el-table-column prop="id" label="ID" width="60" align="center"></el-table-column>
          <el-table-column prop="subjectName" label="学科" width="120" align="center">
            <template #default="{ row }">
              <el-tag size="small" type="primary" effect="light" style="width: auto; max-width: 100%;">
                {{ row.subjectName }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="subcategoryName" label="学科题库" width="150" align="center">
            <template #default="{ row }">
              <span class="subcategory-text">{{ row.subcategoryName || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="typeName" label="类型" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="{
                'single': 'primary',
                'multiple': 'success',
                'judgment': 'warning'
              }[row.type] || 'info'" style="width: auto; max-width: 100%;">
                {{ getTypeName(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="content" label="题目内容" min-width="300" align="left">
            <template #default="{ row }">
              <div class="question-content-wrapper">
                <div class="question-content-preview">
                  <div v-if="hasValidImage(row.content)" class="content-with-image">
                    <div class="image-preview">
                      <img :src="extractImageUrl(row.content)" alt="题目图片" class="question-image" />
                    </div>
                    <div class="content-text" v-html="stripImages(row.content)"></div>
                  </div>
                  <div v-else-if="row.audio" class="content-with-audio">
                    <el-icon class="audio-icon"><i class="el-icon-microphone"></i></el-icon>
                    <div class="content-text" v-html="row.content"></div>
                  </div>
                  <div v-else class="content-text" v-html="row.content"></div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="answer" label="答案" width="80" align="center">
            <template #default="{ row }">
              <el-tag size="small" type="danger" effect="dark">{{ row.answer || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="140" align="center">
            <template #default="{ row }">
              <span class="time-text">{{ row.createdAt || '未知' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right" align="center">
            <template #default="{ row }">
              <div class="row-operations">
                <el-button type="primary" size="small" @click.stop="editQuestion(row)" style="margin-right: 5px;">编辑</el-button>
                <el-button type="danger" size="small" @click.stop="deleteQuestion(row.id)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <div v-else class="category-empty" style="text-align: center; padding: 60px; color: #909399;">
        <el-icon style="font-size: 48px; margin-bottom: 20px;"><i class="el-icon-document"></i></el-icon>
        <h3 style="margin-bottom: 10px;">请选择学科和题库</h3>
        <p>选择后将显示该题库下的所有题目</p>
      </div>

    </div>
    
    <!-- 分页组件 -->
    <div class="pagination" style="margin-top: 20px; text-align: right;">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="isCategoryView ? categoryTotal : total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import { useQuestionStore } from '../../../stores/questionStore';

// 定义属性和事件
const props = defineProps({
  questions: {
    type: Array,
    default: () => []
  },
  subjects: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['edit-question', 'delete-question', 'batch-delete-questions', 'show-add-dialog', 'show-batch-add-dialog']);

// 筛选条件
const searchKeyword = ref('');
const filterSubjectId = ref('');
const filterSubcategoryId = ref('');
const filterType = ref('');

// 分类视图
const isCategoryView = ref(false);
const selectedCategorySubjectId = ref('');
const selectedCategorySubcategoryId = ref('');

// 分页
const currentPage = ref(1);
const pageSize = ref(10);

// 选中的题目
const selectedQuestions = ref([]);

// 批量添加对话框
const batchAddDialogVisible = ref(false);

// 计算筛选后的子分类
const filterSubcategories = computed(() => {
  if (!filterSubjectId.value) return [];
  const subject = props.subjects.find(s => s.id == filterSubjectId.value);
  return subject ? subject.subcategories || [] : [];
});

// 计算分类视图的子分类
const categorySubcategories = computed(() => {
  if (!selectedCategorySubjectId.value) return [];
  const subject = props.subjects.find(s => s.id == selectedCategorySubjectId.value);
  return subject ? subject.subcategories || [] : [];
});

// 计算筛选后的题目
const filteredQuestions = computed(() => {
  let result = [...props.questions];
  
  // 搜索关键词
  if (searchKeyword.value) {
    result = result.filter(q => {
      const content = q.content;
      if (typeof content === 'string') {
        return content.includes(searchKeyword.value);
      } else if (typeof content === 'object' && content.ops) {
        // 处理Delta对象
        const textContent = content.ops.map(op => {
          if (typeof op.insert === 'string') {
            return op.insert;
          }
          return '';
        }).join('');
        return textContent.includes(searchKeyword.value);
      }
      return false;
    });
  }
  
  // 学科筛选
  if (filterSubjectId.value) {
    result = result.filter(q => {
      const subjectId = q.subjectId || q.subject_id;
      return String(subjectId) === String(filterSubjectId.value);
    });
  }
  
  // 子分类筛选
  if (filterSubcategoryId.value) {
    result = result.filter(q => {
      const subcategoryId = q.subcategoryId || q.subcategory_id;
      return String(subcategoryId) === String(filterSubcategoryId.value);
    });
  }
  
  // 类型筛选
  if (filterType.value) {
    result = result.filter(q => q.type == filterType.value);
  }
  
  // 为每个题目添加学科名称、学科题库名称和类型名称
  return result.map(question => {
    // 查找学科名称
    const subjectId = question.subjectId || question.subject_id;
    const subject = props.subjects.find(s => String(s.id) === String(subjectId));
    const subjectName = subject ? subject.name : '';
    
    // 查找学科题库名称
    let subcategoryName = '';
    const subcategoryId = question.subcategoryId || question.subcategory_id;
    if (subject && subcategoryId) {
      const subcategory = subject.subcategories.find(sc => String(sc.id) === String(subcategoryId));
      subcategoryName = subcategory ? subcategory.name : '';
    }
    
    // 获取类型名称
    const typeName = getTypeName(question.type);
    
    // 处理创建时间
    const createdAt = question.createdAt || question.created_at || '未知';
    
    // 处理内容，确保是字符串
    let content = question.content;
    if (typeof content === 'object' && content.ops) {
      // 处理Delta对象
      const tempElement = document.createElement('div');
      content.ops.forEach(op => {
        if (typeof op.insert === 'string') {
          tempElement.innerHTML += op.insert;
        } else if (op.insert && op.insert.image) {
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
      createdAt
    };
  });
});

// 计算总数
const total = computed(() => filteredQuestions.value.length);

// 计算分页后的题目
const paginatedQuestions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredQuestions.value.slice(start, end);
});

// 计算分类视图的题目
const categoryQuestions = computed(() => {
  if (!selectedCategorySubjectId.value || !selectedCategorySubcategoryId.value) {
    return [];
  }
  
  const filteredQuestions = props.questions.filter(q => {
    const questionSubjectId = q.subjectId || q.subject_id;
    const questionSubcategoryId = q.subcategoryId || q.subcategory_id;
    return String(questionSubjectId) === String(selectedCategorySubjectId.value) && 
           String(questionSubcategoryId) === String(selectedCategorySubcategoryId.value);
  });
  
  // 为每个题目添加学科名称、学科题库名称和类型名称
  return filteredQuestions.map(question => {
    // 查找学科名称
    const subjectId = question.subjectId || question.subject_id;
    const subject = props.subjects.find(s => String(s.id) === String(subjectId));
    const subjectName = subject ? subject.name : '';
    
    // 查找学科题库名称
    let subcategoryName = '';
    const subcategoryId = question.subcategoryId || question.subcategory_id;
    if (subject && subcategoryId) {
      const subcategory = subject.subcategories.find(sc => String(sc.id) === String(subcategoryId));
      subcategoryName = subcategory ? subcategory.name : '';
    }
    
    // 获取类型名称
    const typeName = getTypeName(question.type);
    
    // 处理创建时间
    const createdAt = question.createdAt || question.created_at || '未知';
    
    // 处理内容，确保是字符串
    let content = question.content;
    if (typeof content === 'object' && content.ops) {
      // 处理Delta对象
      const tempElement = document.createElement('div');
      content.ops.forEach(op => {
        if (typeof op.insert === 'string') {
          tempElement.innerHTML += op.insert;
        } else if (op.insert && op.insert.image) {
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
      createdAt
    };
  });
});

// 计算分类视图总数
const categoryTotal = computed(() => categoryQuestions.value.length);

// 计算分页后的分类视图题目
const paginatedCategoryQuestions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return categoryQuestions.value.slice(start, end);
});

// 处理学科变化
const handleSubjectChange = () => {
  filterSubcategoryId.value = '';
};

// 处理分类视图学科变化
const handleCategorySubjectChange = () => {
  selectedCategorySubcategoryId.value = '';
  currentPage.value = 1;
};

// 处理分类视图子分类变化
const handleCategorySubcategoryChange = () => {
  currentPage.value = 1;
};

// 应用筛选
const applyQuestionFilters = () => {
  currentPage.value = 1;
};

// 切换视图模式
const toggleViewMode = () => {
  isCategoryView.value = !isCategoryView.value;
  currentPage.value = 1;
};

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedQuestions.value = selection;
};

// 编辑题目
const editQuestion = (row) => {
  emit('edit-question', row);
};

// 删除题目
const deleteQuestion = (questionId) => {
  ElMessageBox.confirm('确定要删除这个题目吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    emit('delete-question', questionId);
    ElMessage.success('题目删除成功');
  }).catch(() => {
    // 取消删除
  });
};

// 批量删除题目
const batchDeleteQuestions = () => {
  if (selectedQuestions.value.length === 0) {
    ElMessage.warning('请选择要删除的题目');
    return;
  }
  
  const questionIds = selectedQuestions.value.map(q => q.id);
  emit('batch-delete-questions', questionIds);
  selectedQuestions.value = [];
};

// 显示添加题目对话框
const showAddQuestionDialog = () => {
  emit('show-add-dialog');
};

// 显示批量添加题目对话框
const showBatchAddQuestionDialog = () => {
  emit('show-batch-add-dialog');
};

// 刷新题目数据
const refreshQuestions = async () => {
  try {
    const questionStore = useQuestionStore();
    
    // 重新加载数据
    await questionStore.loadData();
    ElMessage.success('数据刷新成功');
  } catch (error) {
    ElMessage.error('刷新数据失败，请稍后重试');
  }
};

// 辅助方法
const hasValidImage = (content) => {
  return content && content.includes('<img');
};

const extractImageUrl = (content) => {
  const match = content.match(/<img[^>]+src="([^"]+)"/);
  return match ? match[1] : '';
};

const stripImages = (content) => {
  return content.replace(/<img[^>]+>/g, '');
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
  return typeMap[type] || type;
};

// 监听题目变化，重置分页状态
watch(() => props.questions, () => {
  // 当题目列表变化时，重置到第一页，确保新添加的题目能显示出来
  currentPage.value = 1;
}, { deep: true });

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleCurrentChange = (current) => {
  currentPage.value = current;
};
</script>

<style scoped>
.question-management {
  padding: 20px;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-row {
  margin-bottom: 15px;
}

.action-buttons {
  margin-top: 10px;
}

.table-container {
  margin-top: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 24px;
  overflow: hidden;
}

.question-content-preview {
  line-height: 1.5 !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  display: -webkit-box !important;
  -webkit-line-clamp: 3 !important;
  line-clamp: 3 !important;
  -webkit-box-orient: vertical !important;
  width: 100% !important;
}

.question-content-wrapper {
  width: 100%;
}

.content-with-image {
  display: flex !important;
  align-items: flex-start !important;
  gap: 12px !important;
  flex-wrap: wrap !important;
}

.image-preview {
  flex-shrink: 0 !important;
  width: 80px !important;
  height: 60px !important;
  overflow: hidden !important;
  border-radius: 6px !important;
  border: 1px solid #e4e7ed !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05) !important;
  transition: all 0.3s ease !important;
}

.image-preview:hover {
  transform: scale(1.05) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.question-image {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}

.content-with-audio {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.audio-icon {
  font-size: 18px;
  color: #409eff;
}

.content-text {
  flex: 1 !important;
  min-width: 0 !important;
  word-break: break-word !important;
  line-height: 1.5 !important;
  font-size: 14px !important;
  color: #303133 !important;
}

.subcategory-text {
  text-align: center !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 0 auto !important;
  font-size: 13px !important;
  color: #606266 !important;
  line-height: 1.4 !important;
  width: 100% !important;
}

.time-text {
  font-size: 13px;
  color: #909399;
}

.row-operations {
  display: flex;
  justify-content: center;
  gap: 5px;
}

.has-media {
  background-color: #f8f9fa;
}
</style>