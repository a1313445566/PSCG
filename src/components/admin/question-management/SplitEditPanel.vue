<template>
  <div v-if="visible" class="edit-panel" :style="{ height: height + 'px' }">
    <div class="edit-panel-header">
      <div class="edit-panel-title">
        <el-icon><Edit /></el-icon>
        <span>
          {{ editMode === 'add' ? '添加新题目' : `编辑题目 #${editingId}` }}
        </span>
      </div>
      <div class="edit-panel-actions">
        <el-button type="primary" size="small" :loading="saving" @click="handleSave">
          <el-icon><Check /></el-icon>
          {{ editMode === 'add' ? '添加' : '保存' }}
        </el-button>
        <el-button
          v-if="editMode === 'edit'"
          type="success"
          size="small"
          :loading="saving"
          @click="handleSaveAndNext"
        >
          <el-icon><Right /></el-icon>
          保存并下一个
        </el-button>
        <el-button size="small" @click="$emit('close')">
          <el-icon><Close /></el-icon>
          关闭
        </el-button>
      </div>
    </div>

    <div v-if="localData" class="edit-panel-body">
      <div class="split-edit-form">
        <!-- 基本信息 -->
        <div class="quick-edit-row">
          <el-select
            v-model="modelSubjectId"
            placeholder="学科"
            size="small"
            style="width: 120px"
            @change="handleSubjectChange"
          >
            <el-option
              v-for="subject in subjects"
              :key="subject.id"
              :label="subject.name"
              :value="subject.id"
            />
          </el-select>
          <el-select
            v-model="modelSubcategoryId"
            placeholder="题库"
            size="small"
            style="width: 140px"
          >
            <el-option
              v-for="sub in subcategories"
              :key="sub.id"
              :label="sub.name"
              :value="sub.id"
            />
          </el-select>
          <el-select v-model="modelType" placeholder="类型" size="small" style="width: 100px">
            <el-option label="单选" value="single" />
            <el-option label="多选" value="multiple" />
            <el-option label="判断" value="judgment" />
            <el-option label="听力" value="listening" />
            <el-option label="阅读" value="reading" />
            <el-option label="看图" value="image" />
          </el-select>
          <el-select v-model="modelDifficulty" placeholder="难度" size="small" style="width: 100px">
            <el-option label="简单" :value="1" />
            <el-option label="较简单" :value="2" />
            <el-option label="中等" :value="3" />
            <el-option label="较难" :value="4" />
            <el-option label="困难" :value="5" />
          </el-select>
        </div>

        <!-- 题目内容 -->
        <div class="quick-edit-section">
          <label class="section-label">题目内容</label>
          <div class="content-editor-wrapper">
            <QuillEditor
              v-if="localData.content !== undefined"
              :key="'content-' + editingId"
              v-model="modelContent"
              toolbar-mode="full"
              :options="{ placeholder: '输入题目内容' }"
            />
          </div>
        </div>

        <!-- 判断题选项 -->
        <div v-if="localData.type === 'judgment'" class="quick-edit-section">
          <label class="section-label">答案选项（判断题固定为"对/错"）</label>
          <div class="judgment-options">
            <div
              class="judgment-card"
              :class="{ 'is-active': localData.selectedAnswers?.[0] === 'A' }"
              @click="handleJudgmentSelect('A')"
            >
              <div class="judgment-icon correct">
                <el-icon><Check /></el-icon>
              </div>
              <span class="judgment-text">对</span>
            </div>
            <div
              class="judgment-card"
              :class="{ 'is-active': localData.selectedAnswers?.[0] === 'B' }"
              @click="handleJudgmentSelect('B')"
            >
              <div class="judgment-icon wrong">
                <el-icon><Close /></el-icon>
              </div>
              <span class="judgment-text">错</span>
            </div>
          </div>
        </div>

        <!-- 普通题目选项 -->
        <div v-else-if="localData && localData.type !== 'reading'" class="quick-edit-section">
          <label class="section-label">
            答案选项
            <el-button type="primary" size="small" text @click="handleAddOption">
              <el-icon><Plus /></el-icon>
              添加
            </el-button>
          </label>
          <el-checkbox-group v-model="modelSelectedAnswers">
            <div class="options-grid">
              <div v-for="(_option, index) in modelOptions" :key="index" class="quick-option-item">
                <el-checkbox
                  :value="String.fromCharCode(65 + index)"
                  :label="String.fromCharCode(65 + index)"
                  :disabled="
                    localData.type === 'single' &&
                    modelSelectedAnswers.length > 0 &&
                    !modelSelectedAnswers.includes(String.fromCharCode(65 + index))
                  "
                >
                  <span class="option-letter">{{ String.fromCharCode(65 + index) }}</span>
                </el-checkbox>
                <EditableContent
                  v-model="modelOptions[index]"
                  placeholder="输入选项内容"
                  class="quick-option-input"
                />
                <el-button type="danger" size="small" text @click="handleRemoveOption(index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </el-checkbox-group>
        </div>

        <!-- 阅读理解题小题列表（折叠面板） -->
        <div v-else class="quick-edit-section">
          <label class="section-label">
            小题列表
            <el-button type="primary" size="small" text @click="handleAddSubQuestion">
              <el-icon><Plus /></el-icon>
              添加小题（{{ modelReadingSubQuestions?.length || 0 }}/20）
            </el-button>
          </label>
          <!-- 阅读理解题提示 -->
          <div class="reading-tip">
            <el-icon><Reading /></el-icon>
            <span>上方"题目内容"为阅读材料，下方为小题列表。每道小题支持富文本编辑。</span>
          </div>
          <!-- 折叠面板 -->
          <el-collapse
            :model-value="activeReadingIndex"
            accordion
            class="reading-sub-collapse"
            @update:model-value="$emit('update:activeReadingIndex', $event)"
          >
            <el-collapse-item
              v-for="(sq, sqIndex) in modelReadingSubQuestions"
              :key="sqIndex"
              :name="sqIndex"
            >
              <template #title>
                <div class="sub-collapse-title">
                  <span class="sub-collapse-order">第 {{ sqIndex + 1 }} 题</span>
                  <el-tag v-if="sq.answer" type="success" size="small" class="sub-answer-tag">
                    答案: {{ sq.answer }}
                  </el-tag>
                  <el-tag v-else type="info" size="small">未设答案</el-tag>
                </div>
              </template>
              <div class="sub-collapse-content">
                <!-- 小题题目（富文本） -->
                <div class="sub-field sub-field-content">
                  <label class="sub-label">小题题目</label>
                  <QuillEditor
                    v-model="sq.content"
                    toolbar-mode="basic"
                    :options="{ placeholder: '输入小题题目...' }"
                  />
                </div>
                <!-- 小题选项 -->
                <div class="sub-field sub-field-options">
                  <label class="sub-label">
                    选项
                    <el-button
                      type="primary"
                      size="small"
                      text
                      @click.stop="handleAddSubOption(sqIndex)"
                    >
                      添加选项
                    </el-button>
                  </label>
                  <div class="sub-options-grid">
                    <div
                      v-for="(_opt, optIdx) in sq.options"
                      :key="optIdx"
                      class="sub-option-row"
                      :class="{ 'is-selected': sq.answer === String.fromCharCode(65 + optIdx) }"
                    >
                      <el-radio v-model="sq.answer" :label="String.fromCharCode(65 + optIdx)">
                        {{ String.fromCharCode(65 + optIdx) }}
                      </el-radio>
                      <EditableContent
                        v-model="sq.options[optIdx]"
                        :placeholder="`选项 ${String.fromCharCode(65 + optIdx)}`"
                        class="sub-option-editor"
                      />
                      <el-button
                        v-if="sq.options.length > 2"
                        type="danger"
                        size="small"
                        text
                        @click.stop="handleRemoveSubOption(sqIndex, optIdx)"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </div>
                <!-- 小题解析 -->
                <div class="sub-field sub-field-explanation">
                  <label class="sub-label">解析（可选）</label>
                  <el-input
                    v-model="sq.explanation"
                    type="textarea"
                    :rows="2"
                    placeholder="输入小题解析..."
                  />
                </div>
                <!-- 小题操作按钮 -->
                <div class="sub-actions">
                  <el-button
                    size="small"
                    :disabled="sqIndex === 0"
                    @click="handleMoveSubQuestion(sqIndex, -1)"
                  >
                    上移
                  </el-button>
                  <el-button
                    size="small"
                    :disabled="sqIndex === modelReadingSubQuestions.length - 1"
                    @click="handleMoveSubQuestion(sqIndex, 1)"
                  >
                    下移
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    :disabled="modelReadingSubQuestions.length <= 1"
                    @click="handleRemoveSubQuestion(sqIndex)"
                  >
                    删除小题
                  </el-button>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>

        <!-- 解析 -->
        <div class="quick-edit-section">
          <label class="section-label">解析（可选）</label>
          <el-input
            v-model="modelExplanation"
            type="textarea"
            :rows="2"
            placeholder="输入答案解析..."
          />
        </div>

        <!-- 音频上传 -->
        <div class="quick-edit-section">
          <label class="section-label">音频（听力题用）</label>
          <div class="audio-upload-area">
            <!-- 上传区域 -->
            <div v-if="!modelAudio && !audioUploading">
              <el-upload
                class="audio-uploader"
                action=""
                :auto-upload="false"
                :show-file-list="false"
                accept="audio/*"
                :drag="true"
                :on-change="handleAudioChange"
              >
                <div class="audio-upload-dragger">
                  <el-icon class="upload-icon"><Upload /></el-icon>
                  <div class="upload-text">
                    拖拽音频文件到此处，或
                    <em>点击上传</em>
                  </div>
                  <div class="upload-tip">支持 MP3、WAV、OGG、M4A 格式，最大 10MB</div>
                </div>
              </el-upload>
            </div>
            <!-- 上传进度 -->
            <div v-if="audioUploading" class="audio-uploading">
              <el-progress type="circle" :percentage="audioProgress" :width="60" />
              <span>{{ audioProgress >= 100 ? '处理中...' : '上传中...' }}</span>
            </div>
            <!-- 音频预览 -->
            <div v-if="modelAudio && !audioUploading" class="audio-preview">
              <AudioPlayer :src="modelAudio" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Edit, Check, Right, Close, Plus, Delete, Upload, Reading } from '@element-plus/icons-vue'
import EditableContent from '../../common/EditableContent.vue'
import QuillEditor from '../../common/QuillEditor.vue'
import AudioPlayer from './AudioPlayer.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  data: {
    type: Object,
    default: null
  },
  editMode: {
    type: String,
    default: 'add'
  },
  editingId: {
    type: [Number, String],
    default: null
  },
  saving: {
    type: Boolean,
    default: false
  },
  height: {
    type: Number,
    default: 400
  },
  subjects: {
    type: Array,
    default: () => []
  },
  subcategories: {
    type: Array,
    default: () => []
  },
  modelJudgmentAnswer: {
    type: String,
    default: 'A'
  },
  audioUploading: {
    type: Boolean,
    default: false
  },
  audioProgress: {
    type: Number,
    default: 0
  },
  activeReadingIndex: {
    type: [Number, Array],
    default: null
  }
})

const emit = defineEmits([
  'save',
  'save-and-next',
  'close',
  'sync-data',
  'subject-change',
  'subcategory-change',
  'update:modelJudgmentAnswer',
  'add-option',
  'remove-option',
  'add-sub-question',
  'remove-sub-question',
  'add-sub-option',
  'remove-sub-option',
  'move-sub-question',
  'audio-change',
  'update:activeReadingIndex'
])

const localData = ref(null)

// 监听类型变化，判断题自动设置固定选项（本地同步）
watch(
  () => localData.value?.type,
  newType => {
    if (!localData.value) return
    if (newType === 'judgment') {
      localData.value.options = ['对', '错']
      localData.value.selectedAnswers = ['A']
    } else if (
      localData.value.options?.length === 2 &&
      localData.value.options[0] === '对' &&
      localData.value.options[1] === '错'
    ) {
      // 从判断题切回普通题型，重置为4个空选项
      localData.value.options = ['', '', '', '']
      localData.value.selectedAnswers = []
    }
  }
)

// 用引用比较区分「切换题目」和「内部操作」
// - 引用变化（newData !== oldData）= 切换题目 → 完整同步 localData
// - 引用不变但内部变化 = 添加小题/修改选项等 → 跳过，避免 el-select 重置
watch(
  () => props.data,
  (newData, oldData) => {
    if (!newData) {
      localData.value = null
      return
    }
    // 引用变化才同步（切换题目时 splitEditData 会被整体替换）
    if (newData !== oldData) {
      localData.value = JSON.parse(JSON.stringify(newData))
    }
    // 引用不变的深层变化（如 push 小题）直接跳过，localData 内部已通过 computed 保持一致
  },
  { immediate: true }
)

const modelSubjectId = computed({
  get: () => localData.value?.subjectId,
  set: val => {
    if (localData.value) {
      localData.value.subjectId = val
    }
  }
})

const modelSubcategoryId = computed({
  get: () => localData.value?.subcategoryId,
  set: val => {
    if (localData.value) {
      localData.value.subcategoryId = val
    }
    // 同步到父组件的 splitEditData（保存验证需要）
    emit('subcategory-change', val)
  }
})

const modelType = computed({
  get: () => localData.value?.type,
  set: val => {
    if (localData.value) {
      localData.value.type = val
    }
  }
})

const modelDifficulty = computed({
  get: () => localData.value?.difficulty,
  set: val => {
    if (localData.value) {
      localData.value.difficulty = val
    }
  }
})

const modelContent = computed({
  get: () => localData.value?.content,
  set: val => {
    if (localData.value) {
      localData.value.content = val
    }
  }
})

const modelOptions = computed({
  get: () => localData.value?.options,
  set: val => {
    if (localData.value) {
      localData.value.options = val
    }
  }
})

const modelSelectedAnswers = computed({
  get: () => localData.value?.selectedAnswers,
  set: val => {
    if (localData.value) {
      localData.value.selectedAnswers = val
      // 同步到父组件（checkbox 选答案时触发）
      emit('sync-data', JSON.parse(JSON.stringify(localData.value)))
    }
  }
})

const modelExplanation = computed({
  get: () => localData.value?.explanation,
  set: val => {
    if (localData.value) {
      localData.value.explanation = val
    }
  }
})

const modelAudio = computed({
  get: () => localData.value?.audio,
  set: val => {
    if (localData.value) {
      localData.value.audio = val
    }
  }
})

const modelReadingSubQuestions = computed({
  get: () => localData.value?.readingSubQuestions,
  set: val => {
    if (localData.value) {
      localData.value.readingSubQuestions = val
    }
  }
})

const handleAudioChange = file => {
  emit('audio-change', file)
}

const handleSubjectChange = val => {
  // 更新本地数据
  if (localData.value) {
    localData.value.subjectId = val
    // 学科变化时立即清空题库选择，避免显示旧学科的题库
    localData.value.subcategoryId = null
  }

  // 通知父组件（关键！让 useSplitEdit.js 同步更新 splitEditData.subjectId）
  emit('subject-change', val)
}

// 保存时将面板最新 localData 整体同步给父组件（彻底解决字段不同步问题）
const handleSave = () => {
  syncToParent()
  emit('save')
}

const handleSaveAndNext = () => {
  syncToParent()
  emit('save-and-next')
}

// 将 localData 所有字段同步到父组件的 splitEditData
const syncToParent = () => {
  if (localData.value) {
    emit('sync-data', JSON.parse(JSON.stringify(localData.value)))
  }
}

// ========== 判断题答案选择（先更新 localData 保持UI同步，再sync到父组件） ==========
const handleJudgmentSelect = val => {
  if (localData.value) {
    localData.value.selectedAnswers = [val]
  }
  syncToParent()
  emit('update:modelJudgmentAnswer', val)
}

// ========== 普通题目选项操作（先更新 localData 保持UI同步，再sync到父组件） ==========
const handleAddOption = () => {
  if (localData.value?.options) {
    if (localData.value.options.length >= 6) return
    localData.value.options.push('')
  }
  syncToParent()
  emit('add-option')
}

const handleRemoveOption = index => {
  if (localData.value?.options) {
    const letter = String.fromCharCode(65 + index)
    localData.value.options.splice(index, 1)
    // 同步移除答案中的该选项
    localData.value.selectedAnswers =
      localData.value.selectedAnswers?.filter(a => a !== letter) || []
  }
  syncToParent()
  emit('remove-option', index)
}

// ========== 阅读理解小题操作（先更新 localData 保持UI同步，再sync到父组件） ==========
const handleAddSubQuestion = () => {
  if (localData.value?.readingSubQuestions) {
    if (localData.value.readingSubQuestions.length >= 10) return
    localData.value.readingSubQuestions.push({
      content: '',
      options: ['', '', '', ''],
      answer: 'A',
      explanation: ''
    })
  }
  syncToParent()
  emit('add-sub-question')
}

const handleRemoveSubQuestion = sqIndex => {
  if (localData.value?.readingSubQuestions) {
    if (localData.value.readingSubQuestions.length <= 1) return
    localData.value.readingSubQuestions.splice(sqIndex, 1)
  }
  syncToParent()
  emit('remove-sub-question', sqIndex)
}

const handleAddSubOption = sqIndex => {
  if (localData.value?.readingSubQuestions?.[sqIndex]) {
    const subQ = localData.value.readingSubQuestions[sqIndex]
    if (subQ.options.length >= 6) return
    subQ.options.push('')
  }
  syncToParent()
  emit('add-sub-option', sqIndex)
}

const handleRemoveSubOption = (sqIndex, optIdx) => {
  if (localData.value?.readingSubQuestions?.[sqIndex]) {
    const subQ = localData.value.readingSubQuestions[sqIndex]
    if (subQ.options.length <= 2) return
    subQ.options.splice(optIdx, 1)
    // 如果删除的是当前答案，重置为A
    const removedLetter = String.fromCharCode(65 + optIdx)
    if (subQ.answer === removedLetter) subQ.answer = 'A'
  }
  syncToParent()
  emit('remove-sub-option', { sqIndex, optIdx })
}

const handleMoveSubQuestion = (sqIndex, direction) => {
  if (!localData.value?.readingSubQuestions) return
  const list = localData.value.readingSubQuestions
  const newIndex = sqIndex + direction
  if (newIndex < 0 || newIndex >= list.length) return
  const temp = list[sqIndex]
  list[sqIndex] = list[newIndex]
  list[newIndex] = temp
  syncToParent()
  emit('move-sub-question', { sqIndex, direction })
}
</script>

<style scoped lang="scss">
@use '../../../styles/scss/components/question-management' as *;

// ============================================
// SplitEditPanel 布局骨架（面板容器必须的样式）
// 子模块复用样式见 _question-management.scss
// ============================================
.edit-panel {
  background: #fff;
  border-bottom: 3px solid #409eff;
  display: flex;
  flex-direction: column;
  position: relative;
  flex-shrink: 0;
  min-height: 280px;
  max-height: 80vh;
  z-index: 100;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.edit-panel-header {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  position: relative;
}

.edit-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.edit-panel-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.edit-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

// 音频上传区域
.audio-upload-area {
  width: 100%;
}

.audio-uploader {
  width: 100%;

  :deep(.el-upload-dragger) {
    width: 100%;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }
}

.audio-upload-dragger {
  text-align: center;

  .upload-icon {
    font-size: 48px;
    color: #409eff;
    margin-bottom: 8px;
  }

  .upload-text {
    font-size: 14px;
    color: #606266;

    em {
      color: #409eff;
      font-style: normal;
      font-weight: 500;
    }
  }

  .upload-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }
}

.audio-uploading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
  color: #409eff;
  font-size: 14px;
}

.audio-preview {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

// 音频播放器（如果 AudioPlayer 组件没有完整样式）
.audio-player {
  width: 100%;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.play-buttons {
  display: flex;
  gap: 4px;
}

.progress-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-display {
  font-size: 12px;
  color: #909399;
  min-width: 40px;
  font-family: 'Monaco', 'Menlo', monospace;
}

.progress-slider {
  flex: 1;
}

.speed-control {
  margin-left: 8px;
}
</style>
