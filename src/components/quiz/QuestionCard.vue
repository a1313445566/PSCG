<template>
  <div class="question-card" @mouseenter="$emit('mouseenter')" @mouseleave="$emit('mouseleave')">
    <div class="question-header">
      <div class="question-number">问题 {{ questionNumber }}</div>
      <div class="question-type" :class="`type-${question.type}`">
        {{ getQuestionTypeName(question.type) }}
      </div>
    </div>

    <div v-if="isErrorCollection && errorCollectionProgress" class="error-collection-progress">
      <div class="progress-header">
        <span class="progress-status">{{ errorCollectionProgress.status }}</span>
        <span class="progress-count">
          {{ errorCollectionProgress.correctCount }}/{{ MAX_CORRECT_COUNT }}
        </span>
      </div>
      <div class="progress-bar-container">
        <div
          class="progress-bar"
          :style="{
            width: (errorCollectionProgress.correctCount / MAX_CORRECT_COUNT) * 100 + '%',
            backgroundColor: getProgressColor(errorCollectionProgress.correctCount)
          }"
        ></div>
      </div>
      <div class="progress-info">
        <span>
          当前正确次数：{{ errorCollectionProgress.correctCount }}/{{ MAX_CORRECT_COUNT }}
        </span>
      </div>
    </div>

    <div v-if="question.subcategory_name" class="question-source">
      <span class="source-label">来源：</span>
      <span class="source-name">{{ question.subcategory_name }}</span>
    </div>

    <!-- 音频播放器子组件 -->
    <UniversalAudioPlayer mode="quiz" :model-value="question.audio_url" />

    <div class="question-content">
      <div
        ref="contentRef"
        class="question-text rich-text-content size-large rich-text-clickable"
        @click="handleContentClick"
        v-html="safeContent"
      ></div>

      <!-- 选项列表子组件 -->
      <OptionList
        :question="question"
        :user-answer="userAnswer"
        :show-result="showResult"
        @select-option="$emit('select-option', $event)"
        @image-click="handleImageClick"
      />

      <!-- 答案解析 -->
      <div v-if="showResult || isErrorCollection" class="explanation">
        <h4 class="explanation-title">📝 答案解析</h4>
        <p class="explanation-content">{{ question.explanation || '暂无解析' }}</p>
      </div>
    </div>

    <!-- 图片预览器 -->
    <el-image-viewer
      v-if="showImageViewer"
      :url-list="previewImages"
      :initial-index="previewIndex"
      teleported
      @close="closeImageViewer"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, nextTick, watch } from 'vue'
import { MAX_CORRECT_COUNT, getProgressColor } from '@/utils/errorCollectionUtils'
import { ElImageViewer } from 'element-plus'
import xssFilter from '@/utils/xss-filter'
import { applyLazyLoadToContent, injectLazyLoadStyles, isLazyLoadSupported } from '@/utils/lazyLoad'
import UniversalAudioPlayer from '@/components/common/UniversalAudioPlayer.vue'
import OptionList from './OptionList.vue'
import { useImageViewer } from '@/composables/useImageViewer'

if (isLazyLoadSupported()) {
  injectLazyLoadStyles()
}

const props = defineProps({
  question: { type: Object, required: true },
  questionNumber: { type: Number, required: true },
  userAnswer: { type: [String, Array], default: null },
  showResult: { type: Boolean, default: false },
  isErrorCollection: { type: Boolean, default: false },
  errorCollectionProgress: { type: Object, default: null }
})

const emit = defineEmits(['select-option', 'mouseenter', 'mouseleave'])

const contentRef = ref(null)
const {
  showImageViewer,
  previewImages,
  previewIndex,
  handleImageClick: onImageClick,
  closeImageViewer
} = useImageViewer()

const safeContent = computed(() => xssFilter.sanitize(props.question?.content || ''))

const handleContentClick = e => {
  if (e.target.tagName === 'IMG') {
    onImageClick(e)
  }
}

const handleImageClick = e => {
  onImageClick(e)
}

const applyLazyLoad = () => {
  if (!contentRef.value || !isLazyLoadSupported()) return
  nextTick(() => applyLazyLoadToContent(contentRef.value))
}

watch(
  () => props.question,
  () => applyLazyLoad(),
  { immediate: false }
)
onMounted(() => applyLazyLoad())

const getQuestionTypeName = type =>
  ({
    single: '单选题',
    multiple: '多选题',
    judgment: '判断题',
    listening: '听力题',
    reading: '阅读题',
    image: '看图题'
  })[type] || '未知类型'
</script>

<style scoped lang="scss">
@import '@/styles/rich-text.css';

.question-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--el-shadow-light);
  border: 2px solid #e8e8e8;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: var(--header-gradient);
    border-radius: 20px 20px 0 0;
    z-index: 1;
  }

  &:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px dashed #f0f0f0;
}

.question-source {
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  background-color: #f8f9fa;
  border-radius: 10px;
  border-left: 3px solid #7dd3f8;
  font-size: 0.9rem;
  display: inline-block;
}

.source-label {
  font-weight: bold;
  color: #666;
  margin-right: 0.5rem;
}
.source-name {
  color: #4a90e2;
  font-weight: 500;
}

.question-number {
  font-weight: bold;
  color: #7dd3f8;
  font-size: 1.1rem;
  font-family: 'Microsoft YaHei', 微软雅黑, sans-serif;
}

.question-type {
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  font-family: 'Microsoft YaHei', 微软雅黑, sans-serif;
  background: var(--header-gradient);
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.question-content {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.error-collection-progress {
  background: #f9f9f9;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-weight: 500;
}

.progress-status {
  color: #606266;
  font-size: 14px;
}
.progress-count {
  color: #409eff;
  font-weight: 600;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-info {
  font-size: 12px;
  color: #909399;
}

.explanation {
  background: #f8f9fa;
  border-left: 4px solid #409eff;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.explanation-title {
  margin: 0 0 0.5rem 0;
  color: #409eff;
  font-size: 1rem;
}

.explanation-content {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}
</style>
