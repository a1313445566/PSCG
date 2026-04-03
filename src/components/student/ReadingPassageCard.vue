<template>
  <div class="reading-passage-card">
    <!-- 阅读材料区域 -->
    <div class="passage-section">
      <div class="passage-header">
        <div class="header-left">
          <el-icon><Document /></el-icon>
          <span>阅读材料</span>
        </div>
        <div class="question-type-badge type-reading">阅读理解</div>
      </div>
      <div class="passage-content" v-html="passage"></div>
    </div>

    <!-- 小题列表区域 -->
    <div class="sub-questions-section">
      <div class="sub-questions-header">
        <el-icon><List /></el-icon>
        <span>题目（共 {{ subQuestions.length }} 题）</span>
      </div>
      <div class="sub-questions-list">
        <div
          v-for="(sq, index) in subQuestions"
          :key="index"
          class="sub-question-item"
          :class="{ 'is-answered': answers[index] }"
        >
          <div class="sub-question-number">
            <span class="number-badge">{{ index + 1 }}</span>
            <span class="question-text" v-html="sq.content"></span>
          </div>
          <div class="sub-question-options">
            <div
              v-for="(opt, optIndex) in sq.displayOptions"
              :key="optIndex"
              class="option-item"
              :class="{
                'is-selected': answers[index] === opt.displayLabel,
                'is-disabled': disabled
              }"
              @click="!disabled && selectAnswer(index, opt.displayLabel)"
            >
              <span class="option-label">{{ opt.displayLabel }}.</span>
              <span class="option-content" v-html="opt.content"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Document, List, Warning } from '@element-plus/icons-vue'

/**
 * 阅读理解题答题卡片组件
 * 用于学生端显示阅读材料和所有小题
 */

// Props 定义
const props = defineProps({
  /** 阅读材料内容 */
  passage: {
    type: String,
    default: ''
  },
  /** 小题列表 */
  subQuestions: {
    type: Array,
    default: () => []
  },
  /** 是否禁用（已提交后禁用） */
  disabled: {
    type: Boolean,
    default: false
  },
  /** 已有答案（用于回显） */
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

// Emits 定义
const emit = defineEmits(['update:modelValue'])

// 答案存储：{ 小题索引: 选中选项标签 }
const answers = ref({})

// 选择答案
const selectAnswer = (questionIndex, optionLabel) => {
  if (props.disabled) return
  answers.value[questionIndex] = optionLabel
  emit('update:modelValue', { ...answers.value })
}

// 监听 modelValue 变化，回显答案
watch(
  () => props.modelValue,
  newVal => {
    if (newVal && Object.keys(newVal).length > 0) {
      answers.value = { ...newVal }
    }
  },
  { immediate: true, deep: true }
)

// 组件挂载时初始化
onMounted(() => {
  if (props.modelValue && Object.keys(props.modelValue).length > 0) {
    answers.value = { ...props.modelValue }
  }
})
</script>

<style scoped>
.reading-passage-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  border: 2px solid #e8e8e8;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.reading-passage-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: linear-gradient(90deg, #7dd3f8 0%, #a8e6cf 50%, #ffd88b 100%);
  border-radius: 20px 20px 0 0;
}

.reading-passage-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.passage-section {
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 24px;
}

.passage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 题目类型标签 */
.question-type-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  font-family: 'Microsoft YaHei', 微软雅黑，sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

/* 阅读题专用样式 */
.question-type-badge.type-reading {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.passage-content {
  line-height: 1.8;
  font-size: 15px;
  color: #334155;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
}

/* 阅读材料中的表格样式 */
:deep(.passage-content table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  overflow-x: auto;
  display: block;
}

:deep(.passage-content th),
:deep(.passage-content td) {
  border: 1px solid #d0d7de;
  padding: 10px 14px;
  text-align: left;
  word-break: break-word;
}

:deep(.passage-content th) {
  background-color: #f6f8fa;
  font-weight: 600;
  color: #24292e;
}

:deep(.passage-content tr:nth-child(even)) {
  background-color: #f6f8fa;
}

:deep(.passage-content tr:hover) {
  background-color: #f0f7ff;
}

:deep(.passage-content .table-wrapper) {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.sub-questions-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sub-questions-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.sub-questions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sub-question-item {
  padding: 16px;
  background-color: #ffffff;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.sub-question-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.sub-question-item.is-answered {
  border-color: #10b981;
  background-color: #f0fdf4;
}

.sub-question-number {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.number-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.question-text {
  flex: 1;
  line-height: 1.6;
  font-size: 15px;
  color: #1e293b;
}

.sub-question-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-left: 40px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  background-color: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-item:hover:not(.is-disabled) {
  border-color: #667eea;
  background-color: #f0f4ff;
}

.option-item.is-selected {
  border-color: #667eea;
  background-color: #eef2ff;
}

.option-item.is-selected .option-label {
  color: #667eea;
  font-weight: 600;
}

.option-item.is-disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.option-label {
  font-weight: 500;
  color: #475569;
  flex-shrink: 0;
}

.option-content {
  flex: 1;
  line-height: 1.5;
  color: #334155;
}

:deep(.passage-content img),
:deep(.question-text img),
:deep(.option-content img) {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  margin: 8px 0;
}

:deep(.passage-content p),
:deep(.question-text p),
:deep(.option-content p) {
  margin: 0;
}

@media (max-width: 768px) {
  .reading-passage-card {
    padding: 1.2rem;
  }

  .passage-content {
    padding: 12px;
    font-size: 14px;
  }

  .sub-question-item {
    padding: 12px;
  }
}
</style>
