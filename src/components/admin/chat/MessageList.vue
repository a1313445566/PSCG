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
import { ref, watch, nextTick, onUnmounted, onMounted } from 'vue'
import { Cpu } from '@element-plus/icons-vue'
import { marked } from 'marked'
import xssFilter from '@/utils/xss-filter'

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
const chartInstances = ref([])
const resizeObserver = ref(null)

// 配置 marked 选项
marked.setOptions({
  breaks: true, // 支持 GitHub 风格的换行
  gfm: true // 启用 GitHub Flavored Markdown
})

/**
 * 渲染消息内容（支持 Markdown + 图表）
 */
function renderContent(content) {
  if (!content) return ''

  // 1. XSS 过滤
  const safeContent = xssFilter.sanitize(content)

  // 2. 解析 Markdown
  const htmlContent = marked.parse(safeContent)

  // 3. 延迟渲染图表（在下一帧执行，确保 DOM 已更新）
  setTimeout(() => {
    renderCharts()
  }, 50)

  return htmlContent
}

/**
 * 渲染图表（识别代码块中的 JSON 配置）
 */
async function renderCharts() {
  try {
    const VChart = (await import('@visactor/vchart')).default

    // 查找所有包含图表配置的代码块
    const codeBlocks = messageListRef.value?.querySelectorAll('code.language-json-chart') || []

    codeBlocks.forEach((codeBlock, index) => {
      try {
        let chartConfig = null
        
        // 尝试解析JSON
        try {
          chartConfig = JSON.parse(codeBlock.textContent)
        } catch (parseError) {
          console.warn('图表JSON解析失败，尝试修复:', parseError)
          
          // 尝试修复常见的JSON格式问题
          let fixedJson = codeBlock.textContent
            .replace(/,\s*}/g, '}')  // 移除末尾多余的逗号
            .replace(/,\s*]/g, ']')  // 移除数组末尾多余的逗号
            .replace(/'/g, '"')      // 单引号转双引号
          
          try {
            chartConfig = JSON.parse(fixedJson)
          } catch (e) {
            console.warn('图表JSON修复失败:', e)
            return
          }
        }

        if (!chartConfig || !chartConfig.type) {
          console.warn('图表配置缺少type字段:', chartConfig)
          return
        }

        // 创建图表容器
        const chartContainer = document.createElement('div')
        chartContainer.className = 'chart-container'
        chartContainer.style.cssText = 'width: 100%; height: 400px; margin: 16px 0;'

        // 替换代码块为图表容器
        const preElement = codeBlock.closest('pre')
        if (preElement) {
          preElement.replaceWith(chartContainer)
        } else {
          codeBlock.parentElement?.replaceWith(chartContainer)
        }

        // 渲染图表
        // ✅ 确保 autoFit 在 spec 配置中（关键！）
        if (!chartConfig.autoFit) {
          chartConfig.autoFit = true
        }

        const chart = new VChart(chartConfig, {
          dom: chartContainer,
          mode: 'desktop-browser',
          theme: 'light'
        })
        chart.render()

        // ✅ 注册到全局自适应管理器
        const chartId = `ai-chart-${chartIdCounter++}`
        import('../../../utils/chartResize').then(({ registerChart, observeContainer }) => {
          registerChart(chartId, chart, chartContainer)
          observeContainer(chartContainer)
        })

        // 保存图表实例和容器，组件卸载时销毁
        chartInstances.value.push({ id: chartId, chart, container: chartContainer })
      } catch (e) {
        console.warn('图表渲染失败:', e)
      }
    })
  } catch (e) {
    console.warn('VChart 加载失败:', e)
  }
}

/**
 * 自动滚动到底部
 */
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

/**
 * 组件卸载时销毁所有图表实例
 */
onUnmounted(async () => {
  // ✅ 动态导入全局工具
  const { unregisterChart, unobserveContainer } = await import('../../../utils/chartResize')

  // 从全局管理器注销
  chartInstances.value.forEach(({ id, container }) => {
    unregisterChart(id)
    unobserveContainer(container)
  })

  // 释放图表实例
  chartInstances.value.forEach(({ chart }) => {
    try {
      chart.release()
    } catch (e) {
      // 忽略错误
    }
  })
  chartInstances.value = []
})
</script>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f7fa;
}

.message-item {
  margin-bottom: 16px;
}

/* 用户消息 */
.message-user {
  display: flex;
  justify-content: flex-end;
}

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  word-wrap: break-word;
}

.message-bubble--user {
  background: #409eff;
  color: #fff;
}

/* 助手消息 */
.message-assistant {
  display: flex;
  gap: 12px;
}

.message-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
}

.message-bubble--assistant {
  background: #fff;
  color: #303133;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.message-content {
  white-space: pre-wrap;
}

/* Markdown 样式 */
.message-content :deep(h1) {
  font-size: 1.5em;
  font-weight: bold;
  margin: 16px 0 8px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e4e7ed;
}

.message-content :deep(h2) {
  font-size: 1.3em;
  font-weight: bold;
  margin: 14px 0 6px;
  color: #409eff;
}

.message-content :deep(h3) {
  font-size: 1.15em;
  font-weight: 600;
  margin: 12px 0 4px;
  color: #606266;
}

.message-content :deep(h4) {
  font-size: 1.05em;
  font-weight: 600;
  margin: 10px 0 4px;
}

.message-content :deep(p) {
  margin: 8px 0;
  line-height: 1.8;
}

.message-content :deep(strong) {
  font-weight: 600;
  color: #409eff;
}

.message-content :deep(em) {
  font-style: italic;
}

.message-content :deep(code) {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
  color: #e6a23c;
}

.message-content :deep(pre) {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
  border: 1px solid #e4e7ed;
}

.message-content :deep(pre code) {
  background: transparent;
  padding: 0;
  color: #303133;
}

.message-content :deep(ul),
.message-content :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.message-content :deep(li) {
  margin: 4px 0;
  line-height: 1.6;
}

.message-content :deep(a) {
  color: #409eff;
  text-decoration: none;
  border-bottom: 1px dashed #409eff;
}

.message-content :deep(a:hover) {
  color: #66b1ff;
  border-bottom-style: solid;
}

.message-content :deep(hr) {
  border: none;
  border-top: 1px solid #e4e7ed;
  margin: 16px 0;
}

.message-content :deep(blockquote) {
  border-left: 4px solid #409eff;
  padding-left: 12px;
  margin: 12px 0;
  color: #606266;
  background: #f5f7fa;
  padding: 8px 12px;
  border-radius: 4px;
}

/* 表格样式 */
.message-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 0.9em;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.message-content :deep(th),
.message-content :deep(td) {
  padding: 10px 12px;
  border: 1px solid #e4e7ed;
  text-align: left;
}

.message-content :deep(th) {
  background: #409eff;
  color: #fff;
  font-weight: 600;
}

.message-content :deep(tr:nth-child(even)) {
  background: #f5f7fa;
}

.message-content :deep(tr:hover) {
  background: #ecf5ff;
}

/* 图表容器 */
.message-content :deep(.chart-container) {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 思考状态 */
.thinking-indicator {
  color: #909399;
  font-style: italic;
}

.error-indicator {
  color: #f56c6c;
}

/* 打字指示器 */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #909399;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}
</style>
