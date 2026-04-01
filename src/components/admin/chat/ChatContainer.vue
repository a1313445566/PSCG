<template>
  <div class="chat-container">
    <!-- 左侧会话列表 -->
    <div class="chat-sidebar">
      <div class="sidebar-header">
        <el-button type="primary" :icon="Plus" circle @click="handleNewSession" />
        <span class="sidebar-title">对话列表</span>
      </div>

      <!-- 模型选择 -->
      <div class="model-selector">
        <el-select
          v-model="selectedModelId"
          placeholder="选择AI模型"
          size="small"
          @change="handleModelChange"
        >
          <el-option v-for="model in models" :key="model.id" :label="model.name" :value="model.id">
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>{{ model.name }}</span>
              <el-tag v-if="model.is_default" size="small" type="success">默认</el-tag>
            </div>
          </el-option>
        </el-select>
      </div>

      <!-- 快捷入口 -->
      <div class="quick-entry">
        <el-divider content-position="left">
          <el-icon><Star /></el-icon>
          快捷入口
        </el-divider>
        <div class="quick-buttons">
          <el-button size="small" @click="handleQuickEntry('student')">
            <el-icon><User /></el-icon>
            学生查询
          </el-button>
          <el-button size="small" @click="handleQuickEntry('class')">
            <el-icon><School /></el-icon>
            班级查询
          </el-button>
          <el-button size="small" @click="handleQuickEntry('alert')">
            <el-icon><Warning /></el-icon>
            预警查询
          </el-button>
        </div>
      </div>

      <div class="session-list">
        <div
          v-for="session in sessions"
          :key="session.id"
          class="session-item"
          :class="{ active: currentSession?.id === session.id }"
          @click="handleSelectSession(session.id)"
        >
          <div class="session-title">{{ session.title }}</div>
          <div class="session-meta">
            <span>{{ session.message_count }} 条消息</span>
            <el-button
              type="danger"
              size="small"
              text
              :icon="Delete"
              @click.stop="handleDeleteSession(session.id)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="chat-main">
      <div v-if="!currentSession" class="chat-welcome">
        <div class="welcome-icon">
          <el-icon :size="60"><ChatDotRound /></el-icon>
        </div>
        <h2>PSCG 智能助手</h2>
        <p>请选择或创建对话开始使用</p>
        <el-button type="primary" size="large" @click="handleNewSession">开始新对话</el-button>
      </div>

      <template v-else>
        <!-- 消息列表 -->
        <MessageList :messages="messages" :loading="isStreaming" />

        <!-- 输入区域（增强版） -->
        <ChatInput :disabled="isStreaming" :loading="isStreaming" @send="handleSendMessage" />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Plus, Delete, ChatDotRound, Star, User, School, Warning } from '@element-plus/icons-vue'
import { useChat } from './composables/useChat'
import { useStream } from './composables/useStream'
import { useModels } from './composables/useModels'
import MessageList from './MessageList.vue'
import ChatInput from './ChatInput.vue'
import message from '@/utils/message'

// 状态管理
const {
  sessions,
  currentSession,
  messages,
  loading,
  createSession,
  fetchSessions,
  selectSession,
  deleteSession,
  addMessage,
  updateLastMessage,
  cleanup
} = useChat()
const { models, defaultModel, fetchModels } = useModels()
const { sendMessage: sendStreamMessage, abort, isStreaming } = useStream()

// 当前选中的模型ID
const selectedModelId = ref(null)

// 思考消息
const thinkingMessage = ref('')

onMounted(async () => {
  try {
    // 并行加载模型和会话
    await Promise.all([fetchModels(), fetchSessions()])
    // 默认选择默认模型
    if (defaultModel.value) {
      selectedModelId.value = defaultModel.value.id
    }
  } catch (error) {
    message.error('加载数据失败')
  }
})

onUnmounted(() => {
  cleanup()
  abort()
})

/**
 * 创建新会话
 */
async function handleNewSession() {
  try {
    // 使用当前选中的模型
    await createSession(selectedModelId.value, '新对话')
    message.success('已创建新对话')
  } catch (error) {
    console.error(error)
  }
}

/**
 * 模型切换
 */
function handleModelChange(modelId) {
  console.log('切换模型:', modelId)
}

/**
 * 选择会话
 */
async function handleSelectSession(sessionId) {
  try {
    await selectSession(sessionId)
  } catch (error) {
    console.error(error)
  }
}

/**
 * 删除会话
 */
async function handleDeleteSession(sessionId) {
  try {
    await deleteSession(sessionId)
  } catch (error) {
    console.error(error)
  }
}

/**
 * 快捷入口
 */
function handleQuickEntry(type) {
  if (!currentSession.value) {
    message.warning('请先创建或选择对话')
    return
  }

  // 触发输入框显示工具栏
  // 这里通过事件总线或 provide/inject 传递
  console.log('快捷入口:', type)
}

/**
 * 发送消息
 */
async function handleSendMessage(content) {
  if (!currentSession.value || !content.trim()) return

  // 添加用户消息
  addMessage({ role: 'user', content })

  // 添加助手消息占位（显示思考状态）
  addMessage({ role: 'assistant', content: '💭 正在思考...' })
  const messageIndex = messages.value.length - 1

  try {
    await sendStreamMessage(currentSession.value.id, content, {
      onThinking: msg => {
        thinkingMessage.value = msg
        messages.value[messageIndex].content = `💭 ${msg}`
      },
      onContent: chunk => {
        // 首次收到内容时，清除思考状态
        if (messages.value[messageIndex].content.startsWith('💭')) {
          messages.value[messageIndex].content = ''
        }
        messages.value[messageIndex].content += chunk
      },
      onDone: () => {
        thinkingMessage.value = ''
        // 如果最终内容为空，显示提示
        if (
          !messages.value[messageIndex].content ||
          messages.value[messageIndex].content.startsWith('💭')
        ) {
          messages.value[messageIndex].content = '❌ AI 未返回有效内容，请重试'
        }
      },
      onError: error => {
        messages.value[messageIndex].content = `❌ ${error.message || 'AI 响应失败'}`
      }
    })
  } catch (error) {
    console.error(error)
    messages.value[messageIndex].content = `❌ 连接失败，请检查网络后重试`
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100%;
  background: #f5f7fa;
}

/* 左侧边栏 */
.chat-sidebar {
  width: 280px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.sidebar-title {
  font-weight: 600;
  font-size: 16px;
}

.model-selector {
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
}

.model-selector :deep(.el-select) {
  width: 100%;
}

/* 快捷入口 */
.quick-entry {
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
}

.quick-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.quick-buttons .el-button {
  justify-content: flex-start;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.session-item {
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.session-item:hover {
  background: #f0f2f5;
}

.session-item.active {
  background: #ecf5ff;
  border: 1px solid #409eff;
}

.session-title {
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

/* 右侧主区域 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.welcome-icon {
  color: #409eff;
}

.chat-welcome h2 {
  margin: 0;
  color: #303133;
}

.chat-welcome p {
  color: #909399;
  margin: 0;
}
</style>