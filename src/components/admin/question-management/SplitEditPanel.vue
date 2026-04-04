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
        <el-button type="primary" size="small" :loading="saving" @click="$emit('save')">
          <el-icon><Check /></el-icon>
          {{ editMode === 'add' ? '添加' : '保存' }}
        </el-button>
        <el-button
          v-if="editMode === 'edit'"
          type="success"
          size="small"
          :loading="saving"
          @click="$emit('save-and-next')"
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
              :class="{ 'is-active': modelJudgmentAnswer === 'A' }"
              @click="$emit('update:modelJudgmentAnswer', 'A')"
            >
              <div class="judgment-icon correct">
                <el-icon><Check /></el-icon>
              </div>
              <span class="judgment-text">对</span>
            </div>
            <div
              class="judgment-card"
              :class="{ 'is-active': modelJudgmentAnswer === 'B' }"
              @click="$emit('update:modelJudgmentAnswer', 'B')"
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
            <el-button type="primary" size="small" text @click="$emit('add-option')">
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
                <el-button type="danger" size="small" text @click="$emit('remove-option', index)">
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
            <el-button type="primary" size="small" text @click="$emit('add-sub-question')">
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
                      @click.stop="$emit('add-sub-option', sqIndex)"
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
                        @click.stop="$emit('remove-sub-option', { sqIndex, optIdx })"
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
                    @click="$emit('move-sub-question', { sqIndex, direction: -1 })"
                  >
                    上移
                  </el-button>
                  <el-button
                    size="small"
                    :disabled="sqIndex === modelReadingSubQuestions.length - 1"
                    @click="$emit('move-sub-question', { sqIndex, direction: 1 })"
                  >
                    下移
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    :disabled="modelReadingSubQuestions.length <= 1"
                    @click="$emit('remove-sub-question', sqIndex)"
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
  'update:data',
  'subject-change',
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

watch(
  () => props.data,
  newData => {
    if (newData) {
      localData.value = JSON.parse(JSON.stringify(newData))
    } else {
      localData.value = null
    }
  },
  { immediate: true, deep: true }
)

watch(
  localData,
  newLocalData => {
    if (newLocalData) {
      emit('update:data', JSON.parse(JSON.stringify(newLocalData)))
    }
  },
  { deep: true }
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
  modelSubjectId.value = val
  emit('subject-change', val)
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
