<template>
  <div class="question-card" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
    <div class="question-header">
      <div class="question-number">问题 {{ questionNumber }}</div>
      <div class="question-type" :class="`type-${question.type}`">
        {{ getQuestionTypeName(question.type) }}
      </div>
    </div>

    <!-- 错题巩固进度 -->
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

    <!-- 题目来源信息 -->
    <div v-if="question.subcategory_name" class="question-source">
      <span class="source-label">来源：</span>
      <span class="source-name">{{ question.subcategory_name }}</span>
    </div>

    <!-- 听力音频播放器 -->
    <div v-if="question.audio_url" class="audio-section">
      <div class="audio-player-wrapper">
        <audio
          ref="audioPlayerRef"
          :src="question.audio_url"
          @loadedmetadata="onAudioLoaded"
          @timeupdate="onAudioTimeUpdate"
          @ended="onAudioEnded"
        ></audio>
        <div class="audio-player-controls">
          <!-- 快退按钮 -->
          <button class="seek-btn" title="后退5秒" @click="audioSeekBackward">
            <span class="seek-icon">⟲</span>
            <span class="seek-label">-5s</span>
          </button>

          <!-- 播放/暂停主按钮 -->
          <button class="play-main-btn" :class="{ playing: audioPlaying }" @click="toggleAudioPlay">
            <span v-if="audioPlaying" class="play-icon">❚❚</span>
            <span v-else class="play-icon">▶</span>
          </button>

          <!-- 快进按钮 -->
          <button class="seek-btn" title="前进5秒" @click="audioSeekForward">
            <span class="seek-icon">⟳</span>
            <span class="seek-label">+5s</span>
          </button>

          <!-- 进度条 -->
          <div class="progress-wrapper">
            <span class="time-display">{{ formatAudioTime(audioCurrentTime) }}</span>
            <el-slider
              v-model="audioProgress"
              :show-tooltip="false"
              class="progress-slider"
              @change="onAudioProgressChange"
            />
            <span class="time-display">{{ formatAudioTime(audioDuration) }}</span>
          </div>

          <!-- 倍速控制 -->
          <div class="speed-control">
            <el-dropdown trigger="click" @command="setAudioSpeed">
              <span class="speed-btn">{{ audioSpeed }}x 倍速</span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="0.5">0.5x</el-dropdown-item>
                  <el-dropdown-item :command="0.75">0.75x</el-dropdown-item>
                  <el-dropdown-item :command="1">1.0x</el-dropdown-item>
                  <el-dropdown-item :command="1.25">1.25x</el-dropdown-item>
                  <el-dropdown-item :command="1.5">1.5x</el-dropdown-item>
                  <el-dropdown-item :command="2">2.0x</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </div>

    <div class="question-content">
      <div
        ref="contentRef"
        class="question-text rich-text-content size-large rich-text-clickable"
        @click="handleContentClick"
        v-html="safeContent"
      ></div>

      <div class="options" :class="optionLayout">
        <div
          v-for="(option, index) in parsedOptions"
          :key="index"
          class="option-item"
          :class="{
            selected: isOptionSelected(String.fromCharCode(65 + index)),
            correct: showResult && isOptionCorrect(String.fromCharCode(65 + index)),
            wrong: showResult && isOptionWrong(String.fromCharCode(65 + index))
          }"
          @click="selectOption(String.fromCharCode(65 + index))"
        >
          <div class="option-content">
            <div class="option-label">{{ String.fromCharCode(65 + index) }}</div>
            <div
              class="option-text rich-text-content size-medium"
              @click="handleContentClick"
              v-html="option"
            ></div>
          </div>
          <div v-if="showResult" class="option-feedback">
            <span
              v-if="isOptionSelected(String.fromCharCode(65 + index))"
              class="feedback-selected"
            >
              你的选择
            </span>
            <span v-if="isOptionCorrect(String.fromCharCode(65 + index))" class="feedback-correct">
              正确答案
            </span>
            <span v-else-if="isOptionWrong(String.fromCharCode(65 + index))" class="feedback-wrong">
              错误选择
            </span>
          </div>
        </div>
      </div>

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
import { MAX_CORRECT_COUNT, getProgressColor } from '../../utils/errorCollectionUtils'
import { ElImageViewer } from 'element-plus'
// 音频播放器使用自定义按钮样式
import xssFilter from '../../utils/xss-filter.js'
import {
  applyLazyLoadToContent,
  injectLazyLoadStyles,
  isLazyLoadSupported
} from '../../utils/lazyLoad.js'

// 注入懒加载样式
if (isLazyLoadSupported()) {
  injectLazyLoadStyles()
}

// 图片预览状态
const showImageViewer = ref(false)
const previewImages = ref([])
const previewIndex = ref(0)
const contentRef = ref(null)

// 音频播放器状态
const audioPlayerRef = ref(null)
const audioPlaying = ref(false)
const audioCurrentTime = ref(0)
const audioDuration = ref(0)
const audioProgress = ref(0)
const audioSpeed = ref(1)

// 音频播放器方法
const toggleAudioPlay = () => {
  if (!audioPlayerRef.value) return
  if (audioPlaying.value) {
    audioPlayerRef.value.pause()
  } else {
    audioPlayerRef.value.play()
  }
  audioPlaying.value = !audioPlaying.value
}

const onAudioLoaded = () => {
  if (audioPlayerRef.value) {
    audioDuration.value = audioPlayerRef.value.duration
  }
}

const onAudioTimeUpdate = () => {
  if (!audioPlayerRef.value) return
  audioCurrentTime.value = audioPlayerRef.value.currentTime
  if (audioDuration.value > 0) {
    audioProgress.value = (audioCurrentTime.value / audioDuration.value) * 100
  }
}

const onAudioEnded = () => {
  audioPlaying.value = false
  audioProgress.value = 0
}

const onAudioProgressChange = val => {
  if (!audioPlayerRef.value || !audioDuration.value) return
  audioPlayerRef.value.currentTime = (val / 100) * audioDuration.value
}

const audioSeekBackward = () => {
  if (!audioPlayerRef.value) return
  audioPlayerRef.value.currentTime = Math.max(0, audioPlayerRef.value.currentTime - 5)
}

const audioSeekForward = () => {
  if (!audioPlayerRef.value) return
  audioPlayerRef.value.currentTime = Math.min(
    audioDuration.value,
    audioPlayerRef.value.currentTime + 5
  )
}

const setAudioSpeed = speed => {
  if (!audioPlayerRef.value) return
  audioPlayerRef.value.playbackRate = speed
  audioSpeed.value = speed
}

const formatAudioTime = seconds => {
  if (!seconds || isNaN(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const props = defineProps({
  question: {
    type: Object,
    required: true
  },
  questionNumber: {
    type: Number,
    required: true
  },
  userAnswer: {
    type: [String, Array],
    default: null
  },
  showResult: {
    type: Boolean,
    default: false
  },
  isErrorCollection: {
    type: Boolean,
    default: false
  },
  errorCollectionProgress: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['select-option', 'mouseenter', 'mouseleave'])

// XSS 过滤后的题目内容
const safeContent = computed(() => {
  return xssFilter.sanitize(props.question?.content || '')
})

// XSS 过滤后的选项
const parsedOptions = computed(() => {
  const question = props.question

  // 防御性检查：如果 question 不存在，返回空数组
  if (!question) {
    return []
  }

  // 优先使用shuffledOptions（如果有）
  let options = question.shuffledOptions || question.options

  // 解析JSON字符串
  if (typeof options === 'string') {
    try {
      options = JSON.parse(options)
    } catch (e) {
      console.error('解析选项失败:', e)
      options = []
    }
  }

  // XSS 过滤每个选项
  if (Array.isArray(options)) {
    return options.map(opt => {
      if (opt === null || opt === undefined) {
        return ''
      }
      if (typeof opt === 'string') {
        return xssFilter.deepSanitize(opt)
      }
      if (typeof opt === 'object') {
        // 处理对象类型的选项，遍历每个键值
        return Object.keys(opt).reduce((acc, key) => {
          acc[key] = typeof opt[key] === 'string' ? xssFilter.deepSanitize(opt[key]) : opt[key]
          return acc
        }, {})
      }
      return xssFilter.deepSanitize(String(opt))
    })
  }

  return []
})

// 计算选项排列方式
const optionLayout = computed(() => {
  const options = parsedOptions.value
  const optionCount = options.length

  // 判断题使用特殊布局
  if (props.question?.type === 'judgment') {
    return 'judgment-layout'
  }

  // 检查是否有选项包含图片
  const hasImageOption = options.some(opt => opt.includes('<img'))

  if (hasImageOption) {
    // 有图片选项，使用垂直布局
    return 'grid-1'
  }

  if (optionCount === 4) {
    // 检查选项长度
    const maxLength = Math.max(
      ...options.map(opt => {
        // 移除HTML标签，计算纯文本长度
        const plainText = opt.replace(/<[^>]*>/g, '')
        return plainText.length
      })
    )

    if (maxLength <= 15) {
      // 短选项，一行4个
      return 'grid-4'
    } else if (maxLength <= 30) {
      // 中等长度选项，2行2个
      return 'grid-2'
    } else {
      // 长选项，4行1个
      return 'grid-1'
    }
  }
  // 其他情况默认垂直排列
  return 'vertical'
})

// 解析用户答案
const parsedUserAnswer = computed(() => {
  let userAnswer = props.userAnswer || props.question?.user_answer

  if (typeof userAnswer === 'string') {
    try {
      userAnswer = JSON.parse(userAnswer)
    } catch (e) {
      // 解析失败，使用原始值
    }
  }

  return userAnswer
})

// 解析正确答案
const parsedCorrectAnswer = computed(() => {
  let correctAnswer = props.question?.correct_answer || props.question?.answer

  if (typeof correctAnswer === 'string') {
    try {
      correctAnswer = JSON.parse(correctAnswer)
    } catch (e) {
      // 解析失败，使用原始值
    }
  }

  return correctAnswer
})

// 获取题目类型名称
const getQuestionTypeName = type => {
  const typeMap = {
    single: '单选题',
    multiple: '多选题',
    judgment: '判断题',
    listening: '听力题',
    reading: '阅读题',
    image: '看图题'
  }
  return typeMap[type] || '未知类型'
}

// 检查选项是否被用户选择
const isOptionSelected = option => {
  const userAnswer = parsedUserAnswer.value
  if (!userAnswer) return false

  if (props.question?.type === 'multiple') {
    if (Array.isArray(userAnswer)) {
      return userAnswer.includes(option)
    } else if (typeof userAnswer === 'string') {
      return userAnswer.includes(option)
    }
    return false
  } else {
    return userAnswer === option
  }
}

// 检查选项是否是正确答案
const isOptionCorrect = option => {
  const correctAnswer = parsedCorrectAnswer.value

  if (props.question?.type === 'multiple') {
    let correctAnswers
    if (Array.isArray(correctAnswer)) {
      correctAnswers = correctAnswer
    } else if (typeof correctAnswer === 'string' && correctAnswer.length > 0) {
      correctAnswers = correctAnswer.split('')
    } else {
      correctAnswers = []
    }
    return correctAnswers.includes(option)
  } else {
    return option === correctAnswer
  }
}

// 检查选项是否是用户选择的错误答案
const isOptionWrong = option => {
  return isOptionSelected(option) && !isOptionCorrect(option)
}

// 选择选项
const selectOption = option => {
  if (!props.showResult) {
    emit('select-option', option)
  }
}

// 处理鼠标悬停事件（用于追踪犹豫时间）
const handleMouseEnter = () => {
  if (!props.showResult) {
    emit('mouseenter')
  }
}

const handleMouseLeave = () => {
  if (!props.showResult) {
    emit('mouseleave')
  }
}

// 处理内容区域的点击事件，实现图片预览
const handleContentClick = e => {
  const target = e.target
  if (target.tagName === 'IMG') {
    e.preventDefault()
    e.stopPropagation()

    // 收集当前题目中的所有图片
    const questionCard = target.closest('.question-card')
    const images = questionCard.querySelectorAll('.question-text img, .option-text img')

    // 构建图片列表
    const imageList = Array.from(images)
      .map(img => {
        // 处理相对路径和绝对路径
        let src = img.getAttribute('src') || img.src
        if (src.startsWith('/')) {
          src = window.location.origin + src
        }
        return src
      })
      .filter(src => src && !src.startsWith('data:')) // 排除 base64 图片

    if (imageList.length === 0) {
      imageList.push(target.src)
    }

    // 找到当前点击图片的索引
    const clickedSrc = target.getAttribute('src') || target.src
    const clickedIndex = imageList.findIndex(src => {
      const normalizedSrc = src.replace(window.location.origin, '')
      const normalizedClicked = clickedSrc.replace(window.location.origin, '')
      return normalizedSrc === normalizedClicked || src === clickedSrc
    })

    previewImages.value = imageList
    previewIndex.value = clickedIndex >= 0 ? clickedIndex : 0
    showImageViewer.value = true
  }
}

// 关闭图片预览
const closeImageViewer = () => {
  showImageViewer.value = false
  previewImages.value = []
  previewIndex.value = 0
}

// 应用懒加载到图片
const applyLazyLoad = () => {
  if (!contentRef.value || !isLazyLoadSupported()) return

  // 使用 nextTick 确保 DOM 已更新
  nextTick(() => {
    // 懒加载会自动检测视口内的图片并立即加载
    applyLazyLoadToContent(contentRef.value)
  })
}

// 监听题目变化，重新应用懒加载
watch(
  () => props.question,
  () => {
    applyLazyLoad()
  },
  { immediate: false }
)

onMounted(() => {
  applyLazyLoad()
})
</script>

<style scoped>
@import '@/styles/rich-text.css';

/* 听力音频播放器样式 */
.audio-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 16px;
  margin: 15px 0;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.audio-player-wrapper {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 16px;
}

.audio-player-wrapper audio {
  display: none;
}

.audio-player-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* 快退/快进按钮 */
.seek-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: none;
  background: #f0f2f5;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #606266;
}

.seek-btn:hover {
  background: #e4e7ed;
  transform: scale(1.05);
}

.seek-btn:active {
  transform: scale(0.95);
}

.seek-icon {
  font-size: 16px;
  line-height: 1;
}

.seek-label {
  font-size: 10px;
  font-weight: 600;
  margin-top: 2px;
}

/* 主播放按钮 */
.play-main-btn {
  width: 64px;
  height: 64px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.play-main-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.play-main-btn:active {
  transform: scale(0.95);
}

.play-main-btn.playing {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.play-icon {
  font-size: 22px;
  line-height: 1;
}

.progress-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 200px;
}

.progress-slider {
  flex: 1;
}

.time-display {
  font-size: 13px;
  color: #606266;
  min-width: 48px;
  text-align: center;
  font-family: monospace;
  font-weight: 500;
}

/* 倍速控制 */
.speed-control {
  flex-shrink: 0;
}

.speed-btn {
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  padding: 6px 12px;
  background: #f0f2f5;
  border-radius: 16px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.speed-btn:hover {
  background: #e4e7ed;
  color: #667eea;
}

/* 错题巩固进度样式 */
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

/* 引入全局CSS变量 */
:root {
  --primary-color: #ff6b6b;
  --accent-color: #ffd166;
  --background-color: #f7fff7;
  --header-gradient: linear-gradient(90deg, #7dd3f8 0%, #a8e6cf 50%, #ffd88b 100%);
  --header-border-color: #ff9999;
  --el-shadow-light: 0 6px 15px rgba(0, 0, 0, 0.1);
  --el-border-radius-round: 20px;
}

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
}

.question-card::before {
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

.question-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px dashed #f0f0f0;
}

/* 题目来源信息 */
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
  gap: 1rem;
}

.question-text {
  font-size: 1.1rem;
  color: #333;
  margin: 0;
  font-family: 'Microsoft YaHei', 微软雅黑，sans-serif;
}

/* 题目内容中的表格样式 */
:deep(.question-text table),
:deep(.option-text table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  overflow-x: auto;
  display: block;
}

:deep(.question-text th),
:deep(.question-text td),
:deep(.option-text th),
:deep(.option-text td) {
  border: 1px solid #d0d7de;
  padding: 8px 12px;
  text-align: left;
  word-break: break-word;
}

:deep(.question-text th),
:deep(.option-text th) {
  background-color: #f6f8fa;
  font-weight: 600;
  color: #24292e;
}

:deep(.question-text tr:nth-child(even)),
:deep(.option-text tr:nth-child(even)) {
  background-color: #f6f8fa;
}

:deep(.question-text tr:hover),
:deep(.option-text tr:hover) {
  background-color: #f0f7ff;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

/* 一行4个选项 */
.options.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.8rem;
}

/* 2行2个选项 */
.options.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.8rem;
}

/* 4行1个选项（默认垂直排列） */
.options.grid-1 {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

/* 垂直排列（默认） */
.options.vertical {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.option-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem;
  border: 2px solid #e8e8e8;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  background: white;
  min-height: 80px;
  box-sizing: border-box;
  flex-wrap: wrap;
}

.option-content {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  flex: 1;
  min-width: 0;
}

.option-text {
  flex: 1;
  font-size: 1rem;
  color: #333;
  font-family: 'Microsoft YaHei', 微软雅黑, sans-serif;
  min-width: 0;
}

/* 网格布局下的选项项 */
.options.grid-4 .option-item,
.options.grid-2 .option-item {
  flex: 1;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

/* 网格布局下的选项内容 */
.options.grid-4 .option-content,
.options.grid-2 .option-content {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
}

/* 网格布局下的选项反馈 */
.options.grid-4 .option-feedback,
.options.grid-2 .option-feedback {
  margin-top: 0.2rem;
  margin-left: 38px;
  width: calc(100% - 38px);
}

/* 垂直布局下的选项项 */
.options.grid-1 .option-item,
.options.vertical .option-item {
  min-height: 60px;
  gap: 1rem;
}

.option-item:hover:not(.correct):not(.wrong) {
  border-color: #7dd3f8;
  background-color: #f0f9ff;
  transform: translateX(5px);
  box-shadow: 0 2px 8px rgba(125, 211, 248, 0.3);
}

.option-item.selected {
  border-color: #7dd3f8;
  background-color: #e3f2fd;
  box-shadow: 0 0 0 2px rgba(125, 211, 248, 0.3);
}

.option-item.correct {
  border-color: #a8e6cf;
  background-color: #e8f5e9;
  box-shadow: 0 0 0 2px rgba(168, 230, 207, 0.3);
}

.option-item.wrong {
  border-color: #ff6b6b;
  background-color: #ffebee;
  box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.3);
}

.option-item.selected.correct {
  border-color: #a8e6cf;
  background-color: #e8f5e9;
  box-shadow: 0 0 0 2px rgba(168, 230, 207, 0.3);
}

.option-item.selected.wrong {
  border-color: #ff6b6b;
  background-color: #ffebee;
  box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.3);
}

.option-label {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #e8e8e8;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

/* 垂直布局下的选项标签 */
.options.grid-1 .option-label,
.options.vertical .option-label {
  margin-bottom: 0;
}

/* 网格布局下的选项标签 */
.options.grid-4 .option-label,
.options.grid-2 .option-label {
  margin-bottom: 0;
}

.option-item.selected .option-label {
  background: linear-gradient(135deg, #7dd3f8, #a8e6cf);
  color: white;
  box-shadow: 0 2px 4px rgba(125, 211, 248, 0.4);
}

.option-item.correct .option-label {
  background: linear-gradient(135deg, #a8e6cf, #7dd3f8);
  color: white;
  box-shadow: 0 2px 4px rgba(168, 230, 207, 0.4);
}

.option-item.wrong .option-label {
  background: linear-gradient(135deg, #ff6b6b, #ff9999);
  color: white;
  box-shadow: 0 2px 4px rgba(255, 107, 107, 0.4);
}

.option-item.selected.correct .option-label {
  background: linear-gradient(135deg, #a8e6cf, #7dd3f8);
  color: white;
  box-shadow: 0 2px 4px rgba(168, 230, 207, 0.4);
}

.option-item.selected.wrong .option-label {
  background: linear-gradient(135deg, #ff6b6b, #ff9999);
  color: white;
  box-shadow: 0 2px 4px rgba(255, 107, 107, 0.4);
}

.option-text {
  flex: 1;
  font-size: 1rem;
  color: #333;
  font-family: 'Microsoft YaHei', 微软雅黑, sans-serif;
  word-wrap: break-word;
  min-width: 0;
}

.option-feedback {
  font-size: 0.8rem;
  font-weight: bold;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 0.2rem;
  width: 100%;
}

/* 垂直布局下的选项反馈 */
.options.grid-1 .option-feedback,
.options.vertical .option-feedback {
  margin-top: 0;
  margin-left: auto;
}

/* 网格布局下的选项反馈 */
.options.grid-4 .option-feedback,
.options.grid-2 .option-feedback {
  margin-top: 0;
  margin-left: 0;
  width: auto;
  flex: 1;
}

.feedback-selected {
  color: #7dd3f8;
  background-color: rgba(125, 211, 248, 0.1);
  padding: 0.2rem 0.8rem;
  border-radius: 12px;
  border: 1px solid #7dd3f8;
  white-space: nowrap;
  font-family: 'Microsoft YaHei', 微软雅黑, sans-serif;
}

.feedback-correct {
  color: #a8e6cf;
  background-color: rgba(168, 230, 207, 0.1);
  padding: 0.2rem 0.8rem;
  border-radius: 12px;
  border: 1px solid #a8e6cf;
  white-space: nowrap;
  font-family: 'Microsoft YaHei', 微软雅黑, sans-serif;
}

.feedback-wrong {
  color: #ff6b6b;
  background-color: rgba(255, 107, 107, 0.1);
  padding: 0.2rem 0.8rem;
  border-radius: 12px;
  border: 1px solid #ff6b6b;
  white-space: nowrap;
  font-family: 'Microsoft YaHei', 微软雅黑, sans-serif;
}

/* 答案解析样式 */
.explanation {
  margin-top: 1.5rem;
  padding: 1.2rem;
  background-color: #f8f9fa;
  border-left: 4px solid #7dd3f8;
  border-radius: 15px;
  position: relative;
  overflow: hidden;
}

.explanation::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--header-gradient);
}

.explanation-title {
  font-size: 1rem;
  font-weight: bold;
  color: #333;
  margin: 0 0 0.8rem 0;
  font-family: 'Microsoft YaHei', 微软雅黑, sans-serif;
}

.explanation-content {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #555;
  margin: 0;
  font-family: 'Microsoft YaHei', 微软雅黑, sans-serif;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .question-card {
    padding: 1.2rem;
  }

  .question-text {
    font-size: 1rem;
  }

  .option-item {
    padding: 0.8rem;
  }

  /* 调整网格布局 */
  .options.grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }

  .options.grid-2 {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .question-card {
    padding: 1rem;
  }

  .question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .question-text {
    font-size: 0.9rem;
  }

  .option-item {
    padding: 0.7rem;
    flex-direction: column;
    align-items: flex-start;
  }

  .option-content {
    width: 100%;
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;
  }

  .option-feedback {
    width: 100%;
    margin-top: 0.5rem;
    margin-left: 32px;
  }

  .option-label {
    width: 24px;
    height: 24px;
    font-size: 0.9rem;
    flex-shrink: 0;
  }

  .option-text {
    font-size: 0.9rem;
    flex: 1;
    word-wrap: break-word;
  }

  /* 调整网格布局 */
  .options.grid-4,
  .options.grid-2 {
    grid-template-columns: 1fr;
  }
}

/* 判断题选项样式 */
.options.judgment-layout {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 20px;
}

.options.judgment-layout .option-item {
  min-width: 200px;
  max-width: 300px;
  flex: 1;
  justify-content: center;
}

.options.judgment-layout .option-content {
  justify-content: center;
  text-align: center;
}

.options.judgment-layout .option-label {
  width: 40px;
  height: 40px;
  font-size: 1.2rem;
}

.options.judgment-layout .option-text {
  font-size: 1.1rem;
  font-weight: 500;
}
</style>
