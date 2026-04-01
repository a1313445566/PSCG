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

      <!-- 详细信息 -->
      <div class="stats-details">
        <div class="detail-item">
          <span class="detail-label">请求数</span>
          <span class="detail-value">{{ stats.requestCount }} 次</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">缓存命中</span>
          <span class="detail-value">
            {{ stats.cachedCount }} 次
            <el-tag v-if="stats.requestCount > 0" size="small" type="success">
              {{ ((stats.cachedCount / stats.requestCount) * 100).toFixed(1) }}%
            </el-tag>
          </span>
        </div>
        <div class="detail-item">
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
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.stats-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.stat-card:hover {
  background: #ecf5ff;
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #409eff;
  color: #fff;
  border-radius: 8px;
}

.stat-icon.input {
  background: #67c23a;
}

.stat-icon.output {
  background: #e6a23c;
}

.stat-icon.cost {
  background: #f56c6c;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.stats-details {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed #e4e7ed;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  color: #606266;
  font-size: 14px;
}

.detail-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #303133;
}

.stats-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-item span {
  width: 40px;
  font-size: 14px;
  color: #606266;
}

.progress-item :deep(.el-progress) {
  flex: 1;
}
</style>
