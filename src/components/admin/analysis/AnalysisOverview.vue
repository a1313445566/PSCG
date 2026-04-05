<template>
  <div class="analysis-overview">
    <el-row :gutter="20">
      <el-col v-for="item in overviewItems" :key="item.key" :xs="24" :sm="12" :md="6">
        <el-card class="overview-card" :body-style="{ padding: '20px' }">
          <div class="card-content">
            <div class="card-icon" :style="{ backgroundColor: item.bgColor }">
              <el-icon :size="32">
                <component :is="item.icon" />
              </el-icon>
            </div>
            <div class="card-info">
              <div class="card-value">{{ item.value }}</div>
              <div class="card-label">{{ item.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { User, Document, Reading, TrendCharts } from '@element-plus/icons-vue'
import { formatNumber, formatPercent } from '../../../utils/format'

const props = defineProps({
  analysisData: {
    type: Object,
    default: () => ({})
  }
})

// 概览项配置
const overviewItems = computed(() => [
  {
    key: 'totalUsers',
    label: '总用户数',
    value: formatNumber(props.analysisData.totalUsers || 0),
    icon: User,
    bgColor: '#409EFF20'
  },
  {
    key: 'totalSessions',
    label: '答题次数',
    value: formatNumber(props.analysisData.totalSessions || 0),
    icon: Document,
    bgColor: '#67C23A20'
  },
  {
    key: 'totalQuestions',
    label: '总题数',
    value: formatNumber(props.analysisData.totalQuestions || 0),
    icon: Reading,
    bgColor: '#E6A23C20'
  },
  {
    key: 'overallAccuracy',
    label: '整体正确率',
    value: formatPercent(props.analysisData.overallAccuracy || 0),
    icon: TrendCharts,
    bgColor: '#F56C6C20'
  }
])
</script>

<style scoped lang="scss">
.analysis-overview {
  margin-bottom: 20px;
}

.overview-card {
  margin-bottom: 20px;
  border-radius: 12px;
  transition: all 0.3s;
}

.overview-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 12px;
  flex-shrink: 0;
}

.card-icon .el-icon {
  color: var(--el-color-primary);
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-label {
  font-size: 14px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 响应式 */
@media (max-width: 768px) {
  .card-value {
    font-size: 24px;
  }

  .card-icon {
    width: 56px;
    height: 56px;
  }

  .card-icon .el-icon {
    font-size: 28px;
  }
}
</style>
