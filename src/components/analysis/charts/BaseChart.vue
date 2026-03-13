<template>
  <div class="chart-card">
    <div class="chart-header">
      <div class="chart-title">
        <i :class="iconClass"></i>
        <h3>{{ title }}</h3>
      </div>
      <div v-if="showControls" style="display: flex; gap: 10px; align-items: center;">
        <el-select v-model="localChartType" @change="updateChartType" size="small" class="chart-type-select">
          <el-option label="柱状图" value="bar"></el-option>
          <el-option label="折线图" value="line"></el-option>
          <el-option label="饼图" value="pie"></el-option>
          <el-option label="雷达图" value="radar"></el-option>
        </el-select>
        <el-checkbox v-model="localExpanded" size="small" @change="updateExpanded">显示表格</el-checkbox>
      </div>
    </div>
    <div v-if="(showMode === 'both' || showMode === 'chart') && analysisData" ref="chartRef" class="chart"></div>
    <slot v-if="(showMode === 'both' || showMode === 'table') && localExpanded && analysisData" name="table"></slot>
  </div>
</template>

<script setup>
import * as echarts from 'echarts';
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useAnalysisStore } from '../../../stores/analysisStore';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  iconClass: {
    type: String,
    default: 'el-icon-data-line'
  },
  chartKey: {
    type: String,
    required: true
  },
  showControls: {
    type: Boolean,
    default: true
  },
  chartConfig: {
    type: Function,
    required: true
  }
});

const analysisStore = useAnalysisStore();

// 从store中获取数据
const analysisData = computed(() => analysisStore.analysisData);
const showMode = computed(() => analysisStore.showMode);

// 本地状态
const localChartType = computed({
  get: () => analysisStore.chartTypes[props.chartKey],
  set: (value) => analysisStore.updateChartType(props.chartKey, value)
});

const localExpanded = computed({
  get: () => analysisStore.expandedCards[props.chartKey],
  set: (value) => analysisStore.updateExpandedCard(props.chartKey, value)
});

// 图表引用
const chartRef = ref(null);
let chart = null;

// 更新图表类型
const updateChartType = (value) => {
  localChartType.value = value;
  nextTick(() => {
    initChart();
  });
};

// 更新展开状态
const updateExpanded = (value) => {
  localExpanded.value = value;
};

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return;
  if (!analysisData.value) return;
  
  // 确保容器有正确的尺寸
  if (chartRef.value.offsetWidth === 0 || chartRef.value.offsetHeight === 0) {
    // 延迟初始化，等待容器尺寸计算完成
    setTimeout(initChart, 100);
    return;
  }
  
  if (chart) {
    chart.dispose();
  }
  
  chart = echarts.init(chartRef.value);
  
  // 调用父组件传递的图表配置函数
  const chartConfig = props.chartConfig({
    chartType: localChartType.value,
    analysisData: analysisData.value
  });
  
  if (chartConfig) {
    chart.setOption(chartConfig);
  }
  
  // 添加resize事件监听
  window.addEventListener('resize', handleResize);
};

// 处理窗口 resize
const handleResize = () => {
  if (chart) {
    chart.resize();
  }
};

// 监听数据变化
watch(analysisData, () => {
  nextTick(() => {
    initChart();
  });
}, { deep: true });

// 监听显示模式变化
watch(showMode, () => {
  nextTick(() => {
    initChart();
  });
});

// 监听图表类型变化
watch(localChartType, () => {
  nextTick(() => {
    initChart();
  });
});

// 组件挂载时初始化图表
onMounted(() => {
  nextTick(() => {
    initChart();
  });
});

// 组件卸载时清理
onUnmounted(() => {
  if (chart) {
    chart.dispose();
  }
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.chart-card {
  padding: 16px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  margin-bottom: 16px;
}

.chart-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-title i {
  font-size: 18px;
  color: #409eff;
}

.chart-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.chart-type-select {
  min-width: 100px;
}

.chart {
  width: 100%;
  height: 300px;
}
</style>
