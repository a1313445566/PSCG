<template>
  <div class="content-area">
    <!-- 当前路径面包屑 -->
    <div class="breadcrumb-bar">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>全部题目</el-breadcrumb-item>
        <el-breadcrumb-item v-if="currentSubjectName">{{ currentSubjectName }}</el-breadcrumb-item>
        <el-breadcrumb-item v-if="currentSubcategoryName">
          {{ currentSubcategoryName }}
        </el-breadcrumb-item>
      </el-breadcrumb>
      <span class="total-count">共 {{ pagination.total }} 题</span>
    </div>

    <!-- 筛选标签 -->
    <div v-if="hasFilters" class="filter-tags">
      <span class="filter-label">当前筛选：</span>
      <el-tag
        v-if="filterSubjectId"
        closable
        type="primary"
        @click="$emit('clear-filter', 'subject')"
      >
        学科: {{ currentSubjectName }}
      </el-tag>
      <el-tag
        v-if="filterSubcategoryId"
        closable
        type="success"
        @click="$emit('clear-filter', 'subcategory')"
      >
        题库: {{ currentSubcategoryName }}
      </el-tag>
      <el-tag v-if="filterType" closable type="warning" @click="$emit('clear-filter', 'type')">
        类型: {{ getTypeName(filterType) }}
      </el-tag>
      <el-tag v-if="searchKeyword" closable type="info" @click="$emit('clear-filter', 'keyword')">
        关键词: {{ searchKeyword }}
      </el-tag>
      <el-button text type="primary" @click="$emit('clear-all-filters')">清除全部</el-button>
    </div>

    <!-- 题目表格 -->
    <div class="table-wrapper">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="questions"
        stripe
        border
        :row-class-name="getRowClassName"
        element-loading-text="加载中..."
        height="100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="40" />
        <el-table-column prop="id" label="ID" width="50" align="center" />
        <el-table-column prop="subjectName" label="学科" width="70" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary" effect="light">{{ row.subjectName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="subcategoryName"
          label="题库"
          width="80"
          align="center"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span class="subcategory-text">{{ row.subcategoryName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="typeName" label="类型" width="70" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getTypeTagType(row.type)">{{ row.typeName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="题目内容" min-width="200" align="left">
          <template #default="{ row }">
            <div class="question-content-wrapper">
              <!-- 行内编辑模式 -->
              <template v-if="editingId === row.id">
                <el-input
                  ref="inlineEditInput"
                  :model-value="editingContent"
                  type="textarea"
                  :rows="3"
                  @update:model-value="$emit('update:editingContent', $event)"
                  @blur="$emit('inline-edit-save', row)"
                  @keyup.enter.ctrl="$emit('inline-edit-save', row)"
                  @keyup.escape="$emit('inline-edit-cancel')"
                />
                <div class="edit-hint">按 Ctrl+Enter 保存，Esc 取消</div>
              </template>
              <!-- 正常显示模式 -->
              <template v-else>
                <div
                  class="question-content-preview"
                  :class="{ editable: canInlineEdit(row) }"
                  :title="canInlineEdit(row) ? '双击快速编辑' : '富文本内容，请使用编辑按钮'"
                  @dblclick="$emit('inline-edit-start', row)"
                >
                  <div v-if="hasValidImage(row)" class="content-with-image">
                    <div class="image-preview" @click.stop="$emit('show-image-preview', row)">
                      <img :src="extractImageUrl(row)" alt="题目图片" class="question-image" />
                    </div>
                    <div
                      class="content-text"
                      v-html="safeHtml(truncate(stripImages(row.content), 150))"
                    ></div>
                    <el-tag
                      v-if="isRichText(row.content)"
                      size="small"
                      type="info"
                      class="rich-text-tag"
                    >
                      富文本
                    </el-tag>
                  </div>
                  <div v-else-if="row.audio" class="content-with-audio">
                    <el-icon class="audio-icon"><Microphone /></el-icon>
                    <div class="content-text" v-html="safeHtml(truncate(row.content, 150))"></div>
                    <el-tag
                      v-if="isRichText(row.content)"
                      size="small"
                      type="info"
                      class="rich-text-tag"
                    >
                      富文本
                    </el-tag>
                  </div>
                  <div v-else class="content-text-wrapper">
                    <div class="content-text" v-html="truncate(row.content, 150)"></div>
                    <el-tag
                      v-if="isRichText(row.content)"
                      size="small"
                      type="info"
                      class="rich-text-tag"
                    >
                      富文本
                    </el-tag>
                  </div>
                </div>
              </template>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="answer" label="答案" width="100" align="center">
          <template #default="{ row }">
            <template v-if="row.type === 'judgment'">
              <el-tag size="small" type="danger" effect="dark">
                {{
                  row.answer === 'A' || row.answer === '对'
                    ? '对'
                    : row.answer === 'B' || row.answer === '错'
                      ? '错'
                      : row.answer || '-'
                }}
              </el-tag>
            </template>
            <template v-else-if="row.type === 'reading'">
              <template v-if="typeof row.answer === 'string' && row.answer.startsWith('{')">
                <el-tag size="small" type="success" effect="light" :title="'答案：' + row.answer">
                  {{ Object.keys(JSON.parse(row.answer)).length }} 题
                </el-tag>
              </template>
              <template v-else-if="typeof row.answer === 'object' && row.answer !== null">
                <el-tag
                  size="small"
                  type="success"
                  effect="light"
                  :title="'答案：' + JSON.stringify(row.answer)"
                >
                  {{ Object.keys(row.answer).length }} 题
                </el-tag>
              </template>
              <el-tag v-else size="small" type="danger" effect="dark">
                {{ row.answer || '-' }}
              </el-tag>
            </template>
            <template v-else>
              <el-tag size="small" type="danger" effect="dark">
                {{ row.answer || '-' }}
              </el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column
          prop="createdAt"
          label="创建时间"
          width="90"
          align="center"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span class="time-text">{{ row.createdAt || '未知' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <div class="row-operations">
              <el-button type="primary" size="small" link @click.stop="$emit('preview', row)">
                <el-icon><View /></el-icon>
                预览
              </el-button>
              <el-button type="warning" size="small" link @click.stop="$emit('edit', row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="danger" size="small" link @click.stop="$emit('delete', row)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        :current-page="pagination.page"
        :page-size="pagination.limit"
        :page-sizes="[20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="$emit('size-change', $event)"
        @current-change="$emit('page-change', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { View, Edit, Delete, Microphone } from '@element-plus/icons-vue'
import xssFilter from '../../../utils/xss-filter'

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- props 在模板中使用
const _props = defineProps({
  questions: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  pagination: {
    type: Object,
    default: () => ({ page: 1, limit: 20, total: 0 })
  },
  currentSubjectName: {
    type: String,
    default: ''
  },
  currentSubcategoryName: {
    type: String,
    default: ''
  },
  hasFilters: {
    type: Boolean,
    default: false
  },
  editingId: {
    type: [Number, String],
    default: null
  },
  editingContent: {
    type: String,
    default: ''
  },
  filterType: {
    type: String,
    default: ''
  },
  searchKeyword: {
    type: String,
    default: ''
  },
  filterSubjectId: {
    type: [String, Number],
    default: null
  },
  filterSubcategoryId: {
    type: [String, Number],
    default: null
  },
  getRowClassName: {
    type: Function,
    default: () => ''
  },
  hasValidImage: {
    type: Function,
    default: () => false
  },
  isRichText: {
    type: Function,
    default: () => false
  },
  canInlineEdit: {
    type: Function,
    default: () => false
  },
  extractImageUrl: {
    type: Function,
    default: () => ''
  },
  stripImages: {
    type: Function,
    default: content => content
  },
  truncate: {
    type: Function,
    default: (text, length) => text?.slice(0, length)
  },
  getTypeName: {
    type: Function,
    default: type => type
  },
  getTypeTagType: {
    type: Function,
    default: () => ''
  }
})

const emit = defineEmits([
  'selection-change',
  'inline-edit-start',
  'inline-edit-save',
  'inline-edit-cancel',
  'update:editingContent',
  'preview',
  'edit',
  'delete',
  'show-image-preview',
  'size-change',
  'page-change',
  'clear-filter',
  'clear-all-filters'
])

const tableRef = ref(null)
const inlineEditInput = ref(null)

const handleSelectionChange = selection => {
  emit('selection-change', selection)
}

const safeHtml = html => xssFilter.sanitize(html)
</script>

<style scoped lang="scss">
@use '../../../styles/scss/components/question-management' as *;

.breadcrumb-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 10px 14px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
}

.total-count {
  color: #606266;
  font-size: 14px;
}

.filter-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 14px;
  background: #fff;
  border-radius: 8px;
  flex-wrap: wrap;
  flex-shrink: 0;
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
  line-clamp: 3;
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

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  background: transparent;
  min-height: 0;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background: #f5f7fa !important;
}
</style>
