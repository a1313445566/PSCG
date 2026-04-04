<template>
  <div class="question-management scroll-self-managed">
    <!-- 工具栏 -->
    <QuestionToolbar
      v-model:search-keyword="searchKeyword"
      v-model:filter-type="filterType"
      :loading="loading"
      :selected-count="selectedQuestions.length"
      @add="openAddPanel"
      @batch-add="showBatchAddQuestionDialog"
      @batch-command="handleBatchCommand"
      @refresh="refreshQuestions"
    />

    <!-- 主内容区 -->
    <div class="main-content">
      <div class="content-wrapper" :class="{ 'has-edit-panel': splitEditMode }">
        <!-- 分屏编辑面板 -->
        <SplitEditPanel
          :visible="splitEditMode"
          :data="splitEditData"
          :edit-mode="editMode"
          :editing-id="editingQuestionId"
          :saving="splitEditSaving"
          :height="editPanelHeight"
          :subjects="props.subjects"
          :subcategories="splitEditSubcategories"
          :model-judgment-answer="judgmentAnswer"
          :audio-uploading="audioUploading"
          :audio-progress="audioUploadProgress"
          :active-reading-index="activeReadingSubQuestion"
          @save="saveSplitEdit"
          @save-and-next="saveAndNext"
          @close="closeSplitEdit"
          @subject-change="onSplitEditSubjectChange"
          @update:model-judgment-answer="
            val => {
              if (splitEditData.value) splitEditData.value.selectedAnswers = [val]
            }
          "
          @add-option="addSplitEditOption"
          @remove-option="removeSplitEditOption"
          @add-sub-question="addReadingSubQuestion"
          @remove-sub-question="removeReadingSubQuestion"
          @add-sub-option="addReadingSubOption"
          @remove-sub-option="removeReadingSubOption"
          @move-sub-question="
            ({ sqIndex, direction }) => moveReadingSubQuestion(sqIndex, direction)
          "
          @update:active-reading-index="val => (activeReadingSubQuestion = val)"
          @audio-change="handleAudioChange"
        />

        <!-- 表格区 -->
        <QuestionTable
          :questions="displayQuestions"
          :loading="loading"
          :pagination="pagination"
          :current-subject-name="currentSubjectName"
          :current-subcategory-name="currentSubcategoryName"
          :has-filters="hasActiveFilters"
          :editing-id="editingId"
          :editing-content="editingContent"
          :filter-type="filterType"
          :search-keyword="searchKeyword"
          :filter-subject-id="filterSubjectId"
          :filter-subcategory-id="filterSubcategoryId"
          :get-row-class-name="getRowClassName"
          :has-valid-image="hasValidImage"
          :is-rich-text="isRichText"
          :can-inline-edit="canInlineEdit"
          :extract-image-url="extractImageUrl"
          :strip-images="stripImages"
          :truncate="truncate"
          :get-type-name="getTypeName"
          :get-type-tag-type="getTypeTagType"
          @selection-change="handleSelectionChange"
          @inline-edit-start="startInlineEdit"
          @inline-edit-save="saveInlineEdit"
          @inline-edit-cancel="cancelInlineEdit"
          @update:editing-content="val => (editingContent = val)"
          @preview="previewQuestion"
          @edit="editQuestion"
          @delete="deleteQuestionWithUndo"
          @show-image-preview="showImagePreview"
          @size-change="onSizeChange"
          @page-change="onPageChange"
          @clear-filter="clearFilter"
          @clear-all-filters="clearAllFilters"
        />
      </div>
    </div>

    <!-- 预览弹窗 -->
    <QuestionPreview
      v-model:visible="previewVisible"
      :data="previewData"
      :loading="previewLoading"
      :is-reading-options="isReadingOptions"
      :get-type-tag-type="getTypeTagType"
      @edit-from-preview="handleEditFromPreview"
    />

    <!-- 批量操作弹窗 -->
    <BatchOperationDialogs
      v-model:difficulty-visible="batchDifficultyVisible"
      v-model:difficulty="batchDifficulty"
      v-model:type-visible="batchTypeVisible"
      v-model:type="batchType"
      v-model:move-visible="batchMoveVisible"
      v-model:move-subject-id="batchMoveSubjectId"
      v-model:move-subcategory-id="batchMoveSubcategoryId"
      :move-subcategories="batchMoveSubcategories"
      :subjects="props.subjects"
      @execute-difficulty="executeBatchDifficulty"
      @execute-type="executeBatchType"
      @move-subject-change="handleBatchMoveSubjectChange"
      @execute-move="executeBatchMove"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAdminLayout } from '../../../composables/useAdminLayout'
import { useQuestionTable } from '../../../composables/useQuestionTable'
import { useSplitEdit } from '../../../composables/useSplitEdit'
import { useBatchOperations } from '../../../composables/useBatchOperations'
import { useAudioPlayer } from '../../../composables/useAudioPlayer'
import { useQuestionPreview } from '../../../composables/useQuestionPreview'

// 子组件
import QuestionToolbar from './QuestionToolbar.vue'
import SplitEditPanel from './SplitEditPanel.vue'
import QuestionTable from './QuestionTable.vue'
import QuestionPreview from './QuestionPreview.vue'
import BatchOperationDialogs from './BatchOperationDialogs.vue'

// Props
const props = defineProps({
  subjects: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['delete-question', 'show-batch-add-dialog'])

// 使用全局布局状态
const { filterSubjectId, filterSubcategoryId, clearFilter: clearGlobalFilter } = useAdminLayout()

// 筛选条件
const searchKeyword = ref('')
const filterType = ref('')

// 选中的题目
const selectedQuestions = ref([])

// 使用题目表格 composable
const {
  loading,
  serverQuestions,
  paginationTotal,
  loadQuestions,
  editingId,
  editingContent,
  startInlineEdit,
  saveInlineEdit,
  cancelInlineEdit,
  pendingDeletes,
  deleteQuestionWithUndo,
  hasValidImage,
  isRichText,
  canInlineEdit,
  extractImageUrl,
  stripImages,
  truncate,
  getTypeName,
  getTypeTagType,
  isReadingOptions,
  getRowClassName,
  paginationPage,
  paginationLimit,
  handleSizeChange,
  handleCurrentChange
} = useQuestionTable(props)

// 使用分屏编辑 composable
const {
  splitEditMode,
  editMode,
  editingQuestionId,
  splitEditData,
  splitEditSaving,
  editPanelHeight,
  activeReadingSubQuestion,
  splitEditSubcategories,
  openAddPanel,
  openSplitEdit,
  closeSplitEdit,
  saveSplitEdit,
  saveAndNext,
  onSplitEditSubjectChange,
  addSplitEditOption,
  removeSplitEditOption,
  addReadingSubQuestion,
  removeReadingSubQuestion,
  addReadingSubOption,
  removeReadingSubOption,
  moveReadingSubQuestion
} = useSplitEdit(props, { loadQuestions, serverQuestions })

// 使用批量操作 composable
const {
  batchDifficultyVisible,
  batchDifficulty,
  batchTypeVisible,
  batchType,
  batchMoveVisible,
  batchMoveSubjectId,
  batchMoveSubcategoryId,
  batchMoveSubcategories,
  handleBatchCommand,
  executeBatchDifficulty,
  executeBatchType,
  handleBatchMoveSubjectChange,
  executeBatchMove
} = useBatchOperations(selectedQuestions, loadQuestions, props.subjects)

// 使用音频播放器 composable
const {
  audioPlaying,
  audioCurrentTime,
  audioDuration,
  audioProgress,
  audioSpeed,
  audioUploading,
  audioUploadProgress,
  toggleAudioPlay,
  onAudioLoaded,
  onAudioTimeUpdate,
  onAudioEnded,
  onAudioProgressChange,
  audioSeekBackward,
  audioSeekForward,
  setAudioSpeed,
  formatAudioTime,
  handleSplitEditAudioChange: originalHandleSplitEditAudioChange,
  deleteSplitEditAudio: originalDeleteSplitEditAudio
} = useAudioPlayer()

const handleAudioChange = file => originalHandleSplitEditAudioChange(file, splitEditData)
// const deleteSplitEditAudio = () => originalDeleteSplitEditAudio(splitEditData) // eslint-disable-line no-unused-vars -- 暂未使用

// 防抖定时器
let searchTimer = null

// 当前学科名称
const currentSubjectName = computed(() => {
  if (!filterSubjectId.value) return ''
  const subject = props.subjects.find(s => s.id == filterSubjectId.value)
  return subject ? subject.name : ''
})

// 当前题库名称
const currentSubcategoryName = computed(() => {
  if (!filterSubcategoryId.value) return ''
  const subject = props.subjects.find(s => s.id == filterSubcategoryId.value)
  if (!subject || !subject.subcategories) return ''
  const subcategory = subject.subcategories.find(sc => sc.id == filterSubcategoryId.value)
  return subcategory ? subcategory.name : ''
})

// 使用题目预览 composable
const {
  previewVisible,
  previewData,
  previewLoading,
  previewQuestion,
  handleEditFromPreview,
  showImagePreview,
  clearPreviewCache
} = useQuestionPreview(props, {
  editQuestion: openSplitEdit,
  currentSubjectName,
  currentSubcategoryName,
  getTypeName
})

// 是否有激活的筛选条件
const hasActiveFilters = computed(() => {
  return !!(
    filterSubjectId.value ||
    filterSubcategoryId.value ||
    filterType.value ||
    searchKeyword.value
  )
})

// 显示的题目
const displayQuestions = computed(() => serverQuestions.value)

// 判断题答案（将数组转为字符串供 el-radio 使用）
const judgmentAnswer = computed({
  get: () => splitEditData.value?.selectedAnswers?.[0] || 'A',
  set: val => {
    if (splitEditData.value) {
      splitEditData.value.selectedAnswers = [val]
    }
  }
})

// 分页对象
const pagination = computed(() => ({
  page: paginationPage.value,
  limit: paginationLimit.value,
  total: paginationTotal.value
}))

// 包装 loadQuestions，添加筛选参数
const wrappedLoadQuestions = (resetPage = false) => {
  loadQuestions(resetPage, {
    filterSubjectId: filterSubjectId.value,
    filterSubcategoryId: filterSubcategoryId.value,
    filterType: filterType.value,
    searchKeyword: searchKeyword.value
  })
}

// 防抖搜索
const debouncedSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    wrappedLoadQuestions(true)
  }, 300)
}

// 监听筛选条件变化
watch([filterSubjectId, filterSubcategoryId, filterType], () => {
  wrappedLoadQuestions(true)
})

watch(searchKeyword, () => {
  debouncedSearch()
})

// 监听分页变化
watch([paginationPage, paginationLimit], () => {
  wrappedLoadQuestions()
})

// 分页变化处理
const onSizeChange = size => {
  handleSizeChange(size)
}

const onPageChange = page => {
  handleCurrentChange(page)
}

// 清除筛选
const clearFilter = type => {
  switch (type) {
    case 'subject':
    case 'subcategory':
      clearGlobalFilter()
      break
    case 'type':
      filterType.value = ''
      break
    case 'keyword':
      searchKeyword.value = ''
      break
  }
}

const clearAllFilters = () => {
  filterSubjectId.value = ''
  filterSubcategoryId.value = ''
  filterType.value = ''
  searchKeyword.value = ''
}

// 选择变化
const handleSelectionChange = selection => {
  selectedQuestions.value = selection
}

// 编辑题目
const editQuestion = row => {
  openSplitEdit(row)
}

// 显示批量添加对话框
const showBatchAddQuestionDialog = () => {
  emit('show-batch-add-dialog')
}

// 刷新题目
const refreshQuestions = () => {
  wrappedLoadQuestions()
}

// 初始加载
onMounted(() => {
  wrappedLoadQuestions()
})

// 组件卸载时清理
onUnmounted(() => {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
  clearPreviewCache()
  pendingDeletes.value.clear()
})

// 暴露方法给父组件
defineExpose({
  refresh: wrappedLoadQuestions
})
</script>

<style scoped lang="scss">
.question-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: transparent;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.content-wrapper.has-edit-panel .content-area {
  flex: 1;
  min-height: 0;
}
</style>
