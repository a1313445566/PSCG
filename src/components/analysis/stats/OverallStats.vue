<template>
  <div class="stats-section">
    <div class="stats-header">
      <div class="stats-title">
        <i class="el-icon-data-analysis"></i>
        <h2>总体统计</h2>
      </div>
      <div class="display-mode">
        <span>显示模式：</span>
        <el-radio-group v-model="showMode" @change="updateShowMode" size="large">
          <el-radio-button value="both" border>
            <i class="el-icon-data-line"></i> 图表+表格
          </el-radio-button>
          <el-radio-button value="chart" border>
            <i class="el-icon-pie-chart"></i> 仅图表
          </el-radio-button>
          <el-radio-button value="table" border>
            <i class="el-icon-notebook-2"></i> 仅表格
          </el-radio-button>
        </el-radio-group>
      </div>
    </div>
    <div class="stats-card">
      <div class="stats-item">
        <div class="stats-icon user-icon">
          <i class="el-icon-user"></i>
        </div>
        <div class="stats-content">
          <div class="stats-value">{{ analysisData?.totalUsers || 0 }}</div>
          <div class="stats-label">总用户数</div>
        </div>
      </div>
      <div class="stats-item">
        <div class="stats-icon session-icon">
          <i class="el-icon-view"></i>
        </div>
        <div class="stats-content">
          <div class="stats-value">{{ analysisData?.totalSessions || 0 }}</div>
          <div class="stats-label">总答题次数</div>
        </div>
      </div>
      <div class="stats-item">
        <div class="stats-icon question-icon">
          <i class="el-icon-edit-outline"></i>
        </div>
        <div class="stats-content">
          <div class="stats-value">{{ analysisData?.totalQuestions || 0 }}</div>
          <div class="stats-label">总答题数</div>
        </div>
      </div>
      <div class="stats-item">
        <div class="stats-icon accuracy-icon">
          <i class="el-icon-check"></i>
        </div>
        <div class="stats-content">
          <div class="stats-value">{{ typeof (analysisData?.overallAccuracy || 0) === 'number' ? (analysisData?.overallAccuracy || 0).toFixed(1) : '0.0' }}%</div>
          <div class="stats-label">总体正确率</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAnalysisStore } from '../../../stores/analysisStore';

const analysisStore = useAnalysisStore();

// 从store中获取数据
const analysisData = analysisStore.analysisData;
const showMode = analysisStore.showMode;

// 更新显示模式
const updateShowMode = (mode) => {
  analysisStore.updateShowMode(mode);
};
</script>

<style scoped>
.stats-section {
  margin-bottom: 32px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.stats-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stats-title i {
  font-size: 20px;
  color: #409eff;
}

.stats-title h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.display-mode {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.display-mode span {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.stats-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  padding: 24px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stats-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.stats-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stats-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.user-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.session-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.question-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.accuracy-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stats-content {
  flex: 1;
}

.stats-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.stats-label {
  font-size: 14px;
  color: #606266;
  margin-top: 4px;
}
</style>
