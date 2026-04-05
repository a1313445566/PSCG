<template>
  <div class="chat-input-enhanced">
    <!-- 工具和实体选择区 -->
    <div v-if="showSelectors" class="selectors-area">
      <!-- 实体选择器 -->
      <div class="selector-section">
        <div class="selector-label">
          <el-icon><UserFilled /></el-icon>
          <span>选择学生/班级</span>
        </div>
        <EntitySelector v-model="selectedEntity" />
      </div>

      <!-- 工具选择器 -->
      <div class="selector-section">
        <div class="selector-label">
          <el-icon><Tools /></el-icon>
          <span>选择工具</span>
          <el-button type="primary" size="small" text @click="showToolPanel = !showToolPanel">
            {{ showToolPanel ? '收起' : '展开' }}
          </el-button>
        </div>
        <ToolSelector v-if="showToolPanel" v-model:selected-tool="selectedTool" />
      </div>

      <!-- 快捷提问 -->
      <QuickQuestions
        v-if="selectedTool"
        :tool="selectedTool"
        :entity="selectedEntity"
        @select="handleQuickQuestion"
      />
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <div class="input-header">
        <el-button type="primary" text size="small" @click="showSelectors = !showSelectors">
          <el-icon><Operation /></el-icon>
          {{ showSelectors ? '隐藏工具栏' : '显示工具栏' }}
        </el-button>

        <!-- 已选实体和工具标签 -->
        <div v-if="selectedEntity || selectedTool" class="selected-tags">
          <el-tag
            v-if="selectedEntity"
            type="success"
            size="small"
            closable
            @close="selectedEntity = null"
          >
            {{ selectedEntity.displayName }}
          </el-tag>
          <el-tag
            v-if="selectedTool"
            type="primary"
            size="small"
            closable
            @close="selectedTool = null"
          >
            <el-icon><component :is="selectedTool.icon" /></el-icon>
            {{ selectedTool.displayName }}
          </el-tag>
        </div>
      </div>

      <el-input
        v-model="inputContent"
        type="textarea"
        :rows="3"
        :placeholder="placeholder"
        :disabled="disabled"
        resize="none"
        @keydown.enter.ctrl="handleSend"
      />

      <div class="input-actions">
        <span class="input-tip">Ctrl + Enter 发送</span>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="!inputContent.trim() || disabled"
          @click="handleSend"
        >
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { UserFilled, Tools, Operation } from '@element-plus/icons-vue'
import EntitySelector from './EntitySelector.vue'
import ToolSelector from './ToolSelector.vue'
import QuickQuestions from './QuickQuestions.vue'

// Props
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: '输入您的问题，按 Ctrl+Enter 发送...'
  }
})

// Emits
const emit = defineEmits(['send'])

// 状态
const showSelectors = ref(false)
const showToolPanel = ref(false)
const inputContent = ref('')
const selectedEntity = ref(null)
const selectedTool = ref(null)

/**
 * 快捷问题点击
 */
function handleQuickQuestion(question) {
  inputContent.value = question
  // 自动发送
  handleSend()
}

/**
 * 发送消息
 */
function handleSend() {
  if (!inputContent.value.trim() || props.disabled) return

  // 构建消息内容（包含上下文）
  let messageContent = inputContent.value.trim()

  // 如果选择了工具，在消息前添加提示
  if (selectedTool.value) {
    messageContent = `[使用工具: ${selectedTool.value.displayName}]\n${messageContent}`
  }

  emit('send', messageContent)

  // 清空输入
  inputContent.value = ''
}
</script>

<style scoped lang="scss">
.chat-input-enhanced {
  background: #fff;
}

.selectors-area {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafbfc;
  max-height: 500px;
  overflow-y: auto;
}

.selector-section {
  margin-bottom: 16px;
}

.selector-section:last-child {
  margin-bottom: 0;
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.input-area {
  padding: 16px 20px;
  border-top: 1px solid #e4e7ed;
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.selected-tags {
  display: flex;
  gap: 8px;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.input-tip {
  font-size: 12px;
  color: #909399;
}

/* 滚动条样式 */
.selectors-area::-webkit-scrollbar {
  width: 6px;
}

.selectors-area::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.selectors-area::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.selectors-area::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
