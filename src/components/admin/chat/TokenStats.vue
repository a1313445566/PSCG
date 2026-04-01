<template>
  <div class="token-stats">
    <div class="stats-header">
      <h3>Token 使用统计</h3>
      <el-select v-model="selectedPeriod" size="small" @change="handlePeriodChange">
        <el-option label="今天" value="day" />
        <el-option label="本周" value="week" />
        <el-option label="本月" value="month" />
      </el-select>
    </div>

    <el-skeleton v-if="loading" :rows="4" animated />

    <div v-else class="stats-content">
      <!-- 核心指标 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon :size="24"><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">总 Token</div>
            <div class="stat-value">{{ formatTokens(stats.totalTokens) }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon input">
            <el-icon :size="24"><Upload /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">输入 Token</div>
            <div class="stat-value">{{ formatTokens(stats.totalInput) }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon output">
            <el-icon :size="24"><Download /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">输出 Token</div>
            <div class="stat-value">{{ formatTokens(stats.totalOutput) }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon cost">
            <el-icon :size="24"><Money /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">总成本</div>
            <div class="stat-value">{{ formatCost(stats.totalCost) }}</div>
          </div>
        </div>
      </div>

        <!-- 详细信息 - 横向排列 -->
      <div class="stats-details">
        <div class="detail-row">
          <div class="detail-cell">
            <span class="detail-label">请求数</span>
            <span class="detail-value">{{ stats.requestCount }} 次</span>
          </div>
          <div class="detail-cell">
            <span class="detail-label">缓存命中</span>
            <span class="detail-value">
              {{ stats.cachedCount }} 次
              <el-tag v-if="stats.requestCount > 0" size="small" type="success">
                {{ ((stats.cachedCount / stats.requestCount) * 100).toFixed(1) }}%
              </el-tag>
            </span>
          </div>
          <div class="detail-cell">
            <span class="detail-label">平均每次</span>
            <span class="detail-value">
              {{
                stats.requestCount > 0
                  ? formatTokens(Math.round(stats.totalTokens / stats.requestCount))
                  : 0
              }}
              tokens
            </span>
          </div>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="stats-progress">
        <div class="progress-item">
          <span>输入</span>
          <el-progress
            :percentage="getPercentage(stats.totalInput, stats.totalTokens)"
            :show-text="false"
            color="#409eff"
          />
        </div>
        <div class="progress-item">
          <span>输出</span>
          <el-progress
            :percentage="getPercentage(stats.totalOutput, stats.totalTokens)"
            :show-text="false"
            color="#67c23a"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Document, Upload, Download, Money } from '@element-plus/icons-vue'
import { useTokenStats } from './composables/useTokenStats'
import message from '@/utils/message'

const { stats, loading, fetchStats, formatTokens, formatCost } = useTokenStats()
const selectedPeriod = ref('month')

onMounted(async () => {
  try {
    await fetchStats(selectedPeriod.value)
  } catch (error) {
    message.error('加载统计数据失败')
  }
})

/**
 * 切换统计周期
 */
async function handlePeriodChange(period) {
  try {
    await fetchStats(period)
  } catch (error) {
    message.error('加载统计数据失败')
  }
}

/**
 * 计算百分比
 */
function getPercentage(value, total) {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}
</script>

<style scoped>
.token-stats {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f2f5;
}

.stats-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #fff 100%);
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.stat-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3);
}

.stat-icon.input {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  box-shadow: 0 4px 8px rgba(103, 194, 58, 0.3);
}

.stat-icon.output {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
  box-shadow: 0 4px 8px rgba(230, 162, 60, 0.3);
}

.stat-icon.cost {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
  box-shadow: 0 4px 8px rgba(245, 108, 108, 0.3);
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 6px;
  font-weight: 500;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}

.stats-details {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.detail-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: center;
}

.detail-cell:not(:last-child) {
  border-right: 1px dashed #dcdfe6;
  padding-right: 20px;
}

.detail-label {
  color: #909399;
  font-size: 13px;
  font-weight: 500;
}

.detail-value {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
  font-size: 15px;
}

.stats-progress {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.progress-item span {
  width: 50px;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.progress-item :deep(.el-progress) {
  flex: 1;
}

.progress-item :deep(.el-progress-bar__outer) {
  height: 10px !important;
  border-radius: 6px;
}

.progress-item :deep(.el-progress-bar__inner) {
  border-radius: 6px;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .detail-row {
    flex-direction: column;
    gap: 12px;
  }

  .detail-cell:not(:last-child) {
    border-right: none;
    border-bottom: 1px dashed #dcdfe6;
    padding-right: 0;
    padding-bottom: 12px;
  }
}
</style>
