<template>
  <div class="ai-analysis-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>
        <el-icon><ChatDotRound /></el-icon>
        AI 智能分析
      </h2>
      <el-tag type="success">Powered by 豆包</el-tag>
    </div>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="analysis-tabs">
      <el-tab-pane label="自然语言分析" name="natural">
        <AIAnalysisPanel />
      </el-tab-pane>

      <el-tab-pane label="批量题目分析" name="batch">
        <BatchAnalysis />
      </el-tab-pane>

      <el-tab-pane label="历史记录" name="history">
        <AIHistoryList />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ChatDotRound } from '@element-plus/icons-vue'
import AIAnalysisPanel from '../components/admin/ai/AIAnalysisPanel.vue'
import BatchAnalysis from '../components/admin/ai/BatchAnalysis.vue'
import AIHistoryList from '../components/admin/ai/AIHistoryList.vue'

const activeTab = ref('natural')
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

.analysis-tabs {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

/* Tab 样式 */
::deep(.el-tabs__header) {
  margin-bottom: 20px;
}

::deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 500;
}

::deep(.el-tabs__item.is-active) {
  color: #409EFF;
  font-weight: 600;
}

::deep(.el-tabs__content) {
  padding: 0 20px 20px;
}
</style>
