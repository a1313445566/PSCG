<template>
  <div class="ai-history-list">
    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button 
        type="danger" 
        :disabled="historyList.length === 0"
        @click="handleClearAll"
      >
        <el-icon><Delete /></el-icon>
        清空历史
      </el-button>
    </div>

    <!-- 历史列表 -->
    <div v-loading="loading" class="history-container">
      <el-empty v-if="historyList.length === 0 && !loading" description="暂无分析历史" />
      
      <div v-else class="history-list">
        <el-card 
          v-for="item in historyList" 
          :key="item.id"
          class="history-card"
          shadow="hover"
        >
          <div class="history-header">
            <div class="history-question">
              <el-icon><QuestionFilled /></el-icon>
              {{ item.question }}
            </div>
            <div class="history-actions">
              <el-button size="small" text @click="handleViewDetail(item)">
                <el-icon><View /></el-icon>
                查看详情
              </el-button>
              <el-button size="small" text type="danger" @click="handleDelete(item.id)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </div>
          
          <div class="history-meta">
            <el-tag size="small" type="info">
              {{ formatDate(item.created_at) }}
            </el-tag>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadHistory"
        @size-change="loadHistory"
      />
    </div>

    <!-- 详情对话框 -->
    <el-dialog 
      v-model="detailDialogVisible"
      title="分析详情"
      width="60%"
      :close-on-click-modal="false"
    >
      <div v-if="currentDetail" class="detail-content">
        <div class="detail-question">
          <strong>问题：</strong>{{ currentDetail.question }}
        </div>
        <el-divider />
        <div class="detail-result">
          <strong>分析结果：</strong>
          <div class="markdown-body" v-html="renderMarkdown(currentDetail.result)"></div>
        </div>
        <el-divider />
        <div class="detail-meta">
          <el-tag size="small" type="info">
            分析时间: {{ formatDate(currentDetail.created_at) }}
          </el-tag>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/utils/api'
import message from '@/utils/message'
import { renderMarkdown } from '@/utils/markdown'
import '@/styles/markdown.css'
import { Delete, QuestionFilled, View } from '@element-plus/icons-vue'

// 响应式数据
const historyList = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const loading = ref(false)
const detailDialogVisible = ref(false)
const currentDetail = ref(null)

// 加载历史记录
const loadHistory = async () => {
  loading.value = true
  try {
    const data = await api.get('/ai/history', {
      page: currentPage.value,
      limit: pageSize.value
    })
    
    historyList.value = data.list || []
    total.value = data.total || 0
  } catch (error) {
    console.error('[历史记录] 加载失败:', error)
    message.error('加载历史记录失败')
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 查看详情
const handleViewDetail = (item) => {
  currentDetail.value = item
  detailDialogVisible.value = true
}

// 删除记录
const handleDelete = async (id) => {
  try {
    await api.delete(`/ai/history/${id}`)
    message.success('删除成功')
    loadHistory()
  } catch (error) {
    console.error('[历史记录] 删除失败:', error)
    message.error('删除失败')
  }
}

// 清空历史
const handleClearAll = async () => {
  try {
    await message.confirm('确定要清空所有历史记录吗？', '警告', {
      type: 'warning'
    })
    
    await api.delete('/ai/history')
    message.success('清空成功')
    loadHistory()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('[历史记录] 清空失败:', error)
      message.error('清空失败')
    }
  }
}

// 初始化
onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.ai-history-list {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.action-bar {
  margin-bottom: 15px;
  display: flex;
  justify-content: flex-end;
}

.history-container {
  min-height: 400px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-card {
  cursor: pointer;
  transition: all 0.3s;
}

.history-card:hover {
  transform: translateY(-2px);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.history-question {
  flex: 1;
  font-weight: 500;
  color: #303133;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.history-actions {
  display: flex;
  gap: 5px;
}

.history-meta {
  display: flex;
  justify-content: flex-end;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.detail-content {
  padding: 10px;
}

.detail-question {
  font-size: 15px;
  color: #303133;
  margin-bottom: 10px;
}

.detail-result {
  margin-bottom: 10px;
}

.detail-meta {
  text-align: right;
}
</style>
