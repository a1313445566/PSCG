<template>
  <div class="ai-analysis-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>
        <el-icon><ChatDotRound /></el-icon>
        AI 智能分析
      </h2>
      <el-tag type="success" effect="dark" round>Powered by 豆包</el-tag>
    </div>

    <!-- Tab 切换 -->
    <div class="tabs-container">
      <div class="tabs-nav">
        <div 
          v-for="tab in tabs" 
          :key="tab.name"
          :class="['tab-item', { active: activeTab === tab.name }]"
          @click="activeTab = tab.name"
        >
          <el-icon><component :is="tab.icon" /></el-icon>
          <span>{{ tab.label }}</span>
        </div>
      </div>
      
      <div class="tabs-content">
        <AIAnalysisPanel v-if="activeTab === 'natural'" />
        <BatchAnalysis v-else-if="activeTab === 'batch'" />
        <AIHistoryList v-else-if="activeTab === 'history'" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ChatDotRound, ChatLineSquare, Document, Clock } from '@element-plus/icons-vue'
import AIAnalysisPanel from '../components/admin/ai/AIAnalysisPanel.vue'
import BatchAnalysis from '../components/admin/ai/BatchAnalysis.vue'
import AIHistoryList from '../components/admin/ai/AIHistoryList.vue'

const activeTab = ref('natural')

const tabs = [
  { name: 'natural', label: '自然语言分析', icon: 'ChatLineSquare' },
  { name: 'batch', label: '批量题目分析', icon: 'Document' },
  { name: 'history', label: '历史记录', icon: 'Clock' }
]
</script>

<style scoped>
@import '../styles/common.css';

.ai-analysis-view {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.tabs-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.tabs-nav {
  display: flex;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0 16px;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  user-select: none;
}

.tab-item:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.1);
}

.tab-item.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
  border-bottom-color: #fff;
  font-weight: 600;
}

.tab-item .el-icon {
  font-size: 18px;
}

.tabs-content {
  padding: 20px;
  min-height: 500px;
}
</style>
