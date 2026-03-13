<template>
  <div class="chart-card">
    <div class="chart-header">
      <div class="chart-title">
        <i class="el-icon-collection-tag"></i>
        <h3>学科分析</h3>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <el-select v-model="chartType" @change="updateChartType" size="small" class="chart-type-select">
          <el-option label="柱状图" value="bar"></el-option>
          <el-option label="折线图" value="line"></el-option>
          <el-option label="饼图" value="pie"></el-option>
          <el-option label="雷达图" value="radar"></el-option>
        </el-select>
        <el-checkbox v-model="expanded" size="small" @change="updateExpanded">显示表格</el-checkbox>
      </div>
    </div>
    <div v-if="(showMode === 'both' || showMode === 'chart') && analysisData" ref="chartRef" class="chart"></div>
    <div v-if="(showMode === 'both' || showMode === 'table') && expanded && analysisData" class="chart-table">
      <el-table :data="analysisData.subjectAnalysisList" style="width: 100%" stripe border>
        <el-table-column prop="subject" label="学科" width="120"></el-table-column>
        <el-table-column prop="sessions" label="答题次数"></el-table-column>
        <el-table-column prop="questions" label="答题数"></el-table-column>
        <el-table-column prop="correct" label="正确数"></el-table-column>
        <el-table-column label="正确率" sortable>
          <template #default="scope">
            <span :class="{'text-success': scope.row.accuracy >= 80, 'text-warning': scope.row.accuracy >= 60 && scope.row.accuracy < 80, 'text-danger': scope.row.accuracy < 60}">
              {{ scope.row.accuracy.toFixed(1) }}%
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts';
import { ref, onMounted, watch, nextTick } from 'vue';
import { useAnalysisStore } from '../../../stores/analysisStore';

const analysisStore = useAnalysisStore();

// 从store中获取数据
const analysisData = analysisStore.analysisData;
const showMode = analysisStore.showMode;
const chartType = analysisStore.chartTypes.subject;
const expanded = analysisStore.expandedCards.subject;

// 图表引用
const chartRef = ref(null);
let chart = null;

// 更新图表类型
const updateChartType = (value) => {
  analysisStore.updateChartType('subject', value);
  nextTick(() => {
    initChart();
  });
};

// 更新展开状态
const updateExpanded = (value) => {
  analysisStore.updateExpandedCard('subject', value);
};

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return;
  if (!analysisData || !analysisData.subjectAnalysisList) return;
  
  if (chart) {
    chart.dispose();
  }
  
  chart = echarts.init(chartRef.value);
  
  const subjectsData = analysisData.subjectAnalysisList.map(item => item.subject);
  const accuracies = analysisData.subjectAnalysisList.map(item => item.accuracy);
  const questions = analysisData.subjectAnalysisList.map(item => item.questions);
  
  let option;
  
  if (chartType === 'radar') {
    option = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: ['学科数据']
      },
      radar: {
        indicator: subjectsData.map(subject => ({
          name: subject,
          max: 100
        }))
      },
      series: [
        {
          name: '学科数据',
          type: 'radar',
          data: [
            {
              value: accuracies,
              name: '正确率(%)'
            }
          ]
        }
      ]
    };
  } else if (chartType === 'pie') {
    option = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: subjectsData
      },
      series: [
        {
          name: '正确率',
          type: 'pie',
          radius: '60%',
          data: subjectsData.map((subject, index) => ({
            name: subject,
            value: accuracies[index]
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
  } else {
    option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: '#999'
          }
        }
      },
      legend: {
        data: ['正确率', '答题数']
      },
      xAxis: [
        {
          type: 'category',
          data: subjectsData,
          axisPointer: {
            type: chartType === 'bar' ? 'shadow' : 'cross'
          }
        }
      ],
      yAxis: [
        {
          type: 'value',
          name: '正确率(%)',
          min: 0,
          max: 100,
          interval: 20,
          axisLabel: {
            formatter: '{value}%'
          }
        },
        {
          type: 'value',
          name: '答题数',
          min: 0,
          interval: 100,
          axisLabel: {
            formatter: '{value}'
          }
        }
      ],
      series: [
        {
          name: '正确率',
          type: chartType,
          data: accuracies
        },
        {
          name: '答题数',
          type: 'line',
          yAxisIndex: 1,
          data: questions
        }
      ]
    };
  }
  
  chart.setOption(option);
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

// 组件挂载时初始化图表
onMounted(() => {
  nextTick(() => {
    initChart();
  });
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

.chart-table {
  margin-top: 20px;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}
</style>
