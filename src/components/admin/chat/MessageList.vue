<template>
  <div ref="messageListRef" class="message-list">
    <div v-for="(message, index) in messages" :key="message.id || index" class="message-item">
      <!-- 用户消息 -->
      <div v-if="message.role === 'user'" class="message-user">
        <div class="message-bubble message-bubble--user">
          {{ message.content }}
        </div>
      </div>

      <!-- 助手消息（跳过空消息） -->
      <div v-else-if="message.role === 'assistant' && message.content" class="message-assistant">
        <div class="message-avatar">
          <el-icon :size="24"><Cpu /></el-icon>
        </div>
        <div class="message-bubble message-bubble--assistant">
          <div v-if="message.content.startsWith('💭')" class="thinking-indicator">
            {{ message.content }}
          </div>
          <div v-else-if="message.content.startsWith('❌')" class="error-indicator">
            {{ message.content }}
          </div>
          <div
            v-else
            class="message-content markdown-body"
            v-html="renderContent(message.content)"
          ></div>
        </div>
      </div>
    </div>

    <!-- 加载指示器 -->
    <div v-if="loading" class="message-item">
      <div class="message-assistant">
        <div class="message-avatar">
          <el-icon :size="24"><Cpu /></el-icon>
        </div>
        <div class="message-bubble message-bubble--assistant">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { Cpu } from '@element-plus/icons-vue'
import xssFilter from '@/utils/xss-filter'
import { renderMarkdown } from '@/utils/markdown'
import { useChartRenderer } from '@/composables/useChartRenderer'

const props = defineProps({
  messages: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const messageListRef = ref(null)
const { renderCharts, clearCharts } = useChartRenderer()

/**
 * 渲染消息内容（支持 Markdown + 图表）
 */
function renderContent(content) {
  if (!content) return ''

  // 1. XSS 过滤
  const safeContent = xssFilter.sanitize(content)

  // 2. 使用自定义 Markdown 渲染器（将 vchart 转为占位符）
  const htmlContent = renderMarkdown(safeContent)

  // 3. 延迟渲染图表（在下一帧执行，确保 DOM 已更新）
  setTimeout(() => {
    if (messageListRef.value) {
      const renderedCount = renderCharts(messageListRef.value, content)
      console.log('[图表渲染] 成功渲染图表数量:', renderedCount)
    }
  }, 100)

  return htmlContent
}

// 监听消息变化，自动滚动到底部
watch(
  () => props.messages,
  () => {
    nextTick(() => {
      if (messageListRef.value) {
        messageListRef.value.scrollTop = messageListRef.value.scrollHeight
      }
    })
  },
  { deep: true }
)

// 组件卸载时清理图表实例
onUnmounted(() => {
  clearCharts()
})
</script>

<style scoped lang="scss">
.message-list {
  padding: 16px;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

.message-item {
  margin-bottom: 16px;
}

.message-user {
  display: flex;
  justify-content: flex-end;
}

.message-assistant {
  display: flex;
  gap: 12px;
}

.message-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.message-bubble {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  word-wrap: break-word;
}

.message-bubble--user {
  background: #409eff;
  color: white;
}

.message-bubble--assistant {
  background: #f5f7fa;
  color: #303133;
}

.thinking-indicator {
  color: #909399;
  font-style: italic;
}

.error-indicator {
  color: #f56c6c;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #909399;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
</style>
