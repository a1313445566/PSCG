<template>
  <div class="analysis-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>数据分析仪表板</h1>
      <p class="page-description">全面了解学生答题情况和学习表现</p>
    </div>
    
    <!-- 数据筛选和下载区域 -->
    <div class="filter-download-section">
      <!-- 数据筛选 -->
      <FilterPanel />
      
      <!-- 分析报告下载 -->
      <DownloadPanel />
    </div>
    
    <!-- 主要内容区域 -->
    <div class="main-content">
      <div class="analysis-results" v-if="analysisData">
        <!-- 总体统计 -->
        <OverallStats />
        
        <!-- 图表网格布局 -->
        <div class="chart-grid">
          <!-- 学科分析 -->
          <BaseChart 
            title="学科分析" 
            iconClass="el-icon-collection-tag" 
            chartKey="subject"
            :chartConfig="initSubjectChart"
          >
            <template #table>
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
            </template>
          </BaseChart>
          
          <!-- 年级分析 -->
          <BaseChart 
            title="年级分析" 
            iconClass="el-icon-school" 
            chartKey="grade"
            :chartConfig="initGradeChart"
          >
            <template #table>
              <el-table :data="analysisData.gradeAnalysisList" style="width: 100%" stripe border>
                <el-table-column prop="grade" label="年级" width="100">
                  <template #default="scope">
                    {{ scope.row.grade }}年级
                  </template>
                </el-table-column>
                <el-table-column prop="users" label="用户数"></el-table-column>
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
            </template>
          </BaseChart>
          
          <!-- 时间趋势分析 -->
          <BaseChart 
            title="时间趋势分析" 
            iconClass="el-icon-data-line" 
            chartKey="time"
            :chartConfig="initTimeChart"
          >
            <template #table>
              <el-table :data="analysisData.timeAnalysisList" style="width: 100%" stripe border>
                <el-table-column prop="date" label="日期" width="120"></el-table-column>
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
            </template>
          </BaseChart>
          
          <!-- 班级分析 -->
          <BaseChart 
            title="班级分析" 
            iconClass="el-icon-office-building" 
            chartKey="class"
            :chartConfig="initClassChart"
          >
            <template #table>
              <el-table :data="analysisData.classAnalysisList" style="width: 100%" stripe border>
                <el-table-column prop="class_num" label="班级" width="100">
                  <template #default="scope">
                    {{ scope.row.class_num }}班
                  </template>
                </el-table-column>
                <el-table-column prop="users" label="用户数"></el-table-column>
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
            </template>
          </BaseChart>
          
          <!-- 学科题库分析 -->
          <BaseChart 
            title="学科题库分析" 
            iconClass="el-icon-menu" 
            chartKey="subcategory"
            :chartConfig="initSubcategoryChart"
          >
            <template #table>
              <el-table :data="analysisData.subcategoryAnalysisList" style="width: 100%" stripe border>
                <el-table-column prop="subject" label="学科" width="120"></el-table-column>
                <el-table-column prop="subcategory" label="学科题库"></el-table-column>
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
            </template>
          </BaseChart>
          
          <!-- 答题时间分析 -->
          <BaseChart 
            title="答题时间分析" 
            iconClass="el-icon-time" 
            chartKey="timeSpent"
            :chartConfig="initTimeSpentChart"
          >
            <template #table>
              <el-table :data="analysisData.timeSpentAnalysisList" style="width: 100%" stripe border>
                <el-table-column prop="time_range" label="时间范围" width="120"></el-table-column>
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
            </template>
          </BaseChart>
          
          <!-- 错题分析 -->
          <BaseChart 
            title="错题分析" 
            iconClass="el-icon-warning-outline" 
            chartKey="error"
            :chartConfig="initErrorChart"
          >
            <template #table>
              <el-table :data="analysisData.errorAnalysisList" style="width: 100%" stripe border>
                <el-table-column prop="subject" label="学科" width="120"></el-table-column>
                <el-table-column prop="total_attempts" label="总尝试次数"></el-table-column>
                <el-table-column prop="error_count" label="错题数"></el-table-column>
                <el-table-column label="错误率" sortable>
                  <template #default="scope">
                    <span :class="{'text-danger': scope.row.error_rate >= 30, 'text-warning': scope.row.error_rate >= 10 && scope.row.error_rate < 30, 'text-success': scope.row.error_rate < 10}">
                      {{ scope.row.error_rate.toFixed(1) }}%
                    </span>
                  </template>
                </el-table-column>
              </el-table>
            </template>
          </BaseChart>
          
          <!-- 错误率较高的题目 -->
          <div class="chart-card" style="grid-column: 1 / -1;">
            <div class="chart-header">
              <div class="chart-title">
                <i class="el-icon-warning"></i>
                <h3>错误率较高的题目</h3>
              </div>
              <el-checkbox v-model="expandedCards.errorProne" size="small" @change="updateExpandedCard('errorProne', $event)">显示表格</el-checkbox>
            </div>
            <div style="margin-bottom: 15px; padding: 12px; background-color: #f0f9ff; border-radius: 4px; border-left: 4px solid #409eff;">
              <span style="font-weight: bold; color: #409eff;">说明：</span> 
              本列表显示被尝试至少3次的题目，按错误次数降序排列。错误率计算公式：(1 - 正确次数/总尝试次数) × 100%。
              若列表数据较少，可能是因为大部分题目被尝试的次数不足3次，或错误次数较少。
            </div>
            <div v-if="expandedCards.errorProne" class="chart-table">
              <el-table :data="paginatedErrorProneQuestions" style="width: 100%" stripe border>
                <el-table-column prop="subject_name" label="学科" width="100"></el-table-column>
                <el-table-column prop="content" label="题目内容" min-width="300">
                  <template #default="scope">
                    <div class="question-content">
                      {{ scope.row.content.replace(/<[^>]*>/g, '') }}
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="选项及选择次数" min-width="400">
                  <template #default="scope">
                    <div v-if="scope.row.options && scope.row.options.length > 0" style="padding: 10px; background-color: #f9f9f9; border-radius: 4px;">
                      <div v-for="(option, index) in scope.row.options" :key="index" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 13px; padding: 4px 0;">
                        <div style="flex: 1; display: flex; align-items: center;">
                          <el-tooltip placement="top" :effect="isCorrectAnswer(scope.row.correctAnswer, option, index) ? 'light' : 'dark'">
                            <template #content>
                              <div v-html="typeof option === 'string' ? option : option.text || option.label || option.value"></div>
                            </template>
                            <span :class="{ 'correct-option': isCorrectAnswer(scope.row.correctAnswer, option, index) }" style="font-weight: bold; margin-right: 8px; cursor: help; min-width: 20px; text-align: center;">
                              {{ String.fromCharCode(65 + index) }}
                              <span v-if="isCorrectAnswer(scope.row.correctAnswer, option, index)" style="color: #67c23a; margin-left: 2px; font-size: 11px;">(正确)</span>
                            </span>
                          </el-tooltip>
                          <span style="color: #666;">选项</span>
                        </div>
                        <div style="color: #666; font-size: 12px; min-width: 80px; text-align: right;">
                          选择次数: {{ getOptionCount(scope.row.optionCounts, option, index) }}
                        </div>
                      </div>
                    </div>
                    <div v-else style="color: #999; font-size: 12px;">无选项数据</div>
                  </template>
                </el-table-column>
                <el-table-column label="错误率" width="150">
                  <template #default="scope">
                    <div style="display: flex; align-items: center;">
                      <el-progress :percentage="Math.round((1 - (scope.row.correct_count / scope.row.total_attempts)) * 100)" :color="getErrorRateColor(scope.row.correct_count / scope.row.total_attempts)" :show-text="false" style="flex: 1; margin-right: 10px;"></el-progress>
                      <span>{{ Math.round((1 - (scope.row.correct_count / scope.row.total_attempts)) * 100) }}%</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="总尝试次数" width="100">
                  <template #default="scope">
                    {{ scope.row.total_attempts || 0 }}
                  </template>
                </el-table-column>
                <el-table-column label="正确次数" width="100">
                  <template #default="scope">
                    {{ scope.row.correct_count || 0 }}
                  </template>
                </el-table-column>
              </el-table>
              <div class="pagination" style="margin-top: 16px; text-align: right;">
                <el-pagination
                  v-model:current-page="errorProneCurrentPage"
                  v-model:page-size="errorPronePageSize"
                  :page-sizes="[5, 10, 20]"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="analysisData.errorProneQuestions?.length || 0"
                  @size-change="handleErrorProneSizeChange"
                  @current-change="handleErrorProneCurrentChange"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="loading">
        <div class="loading-content">
          <el-icon class="loading-icon"><i class="el-icon-loading"></i></el-icon>
          <p>加载分析数据中...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts';
import { onMounted, computed } from 'vue';
import { useAnalysisStore } from '../stores/analysisStore';
import FilterPanel from '../components/analysis/filters/FilterPanel.vue';
import DownloadPanel from '../components/analysis/download/DownloadPanel.vue';
import OverallStats from '../components/analysis/stats/OverallStats.vue';
import BaseChart from '../components/analysis/charts/BaseChart.vue';

const analysisStore = useAnalysisStore();

// 从store中获取数据
const analysisData = computed(() => analysisStore.analysisData);
const expandedCards = computed(() => analysisStore.expandedCards);
const errorProneCurrentPage = computed({ get: () => analysisStore.errorProneCurrentPage, set: (value) => analysisStore.errorProneCurrentPage = value });
const errorPronePageSize = computed({ get: () => analysisStore.errorPronePageSize, set: (value) => analysisStore.errorPronePageSize = value });

// 分页后的错误率较高的题目
const paginatedErrorProneQuestions = computed(() => {
  return analysisStore.paginatedErrorProneQuestions;
});

// 初始化数据
onMounted(() => {
  analysisStore.initData();
});

// 处理错误率题目分页
const handleErrorProneSizeChange = (size) => {
  analysisStore.updateErrorPronePage(1, size);
};

const handleErrorProneCurrentChange = (current) => {
  analysisStore.updateErrorPronePage(current);
};

// 更新卡片展开状态
const updateExpandedCard = (key, value) => {
  analysisStore.updateExpandedCard(key, value);
};

// 获取错误率颜色
const getErrorRateColor = (accuracy) => {
  if (accuracy < 0.3) return '#ff4d4f';
  if (accuracy < 0.6) return '#faad14';
  return '#52c41a';
};

// 检查是否为正确答案
const isCorrectAnswer = (correctAnswer, option, index) => {
  if (!correctAnswer) return false;
  // 生成选项标签（A、B、C、D）
  const optionLabel = String.fromCharCode(65 + index);
  // 检查多种可能的匹配方式
  if (typeof option === 'string') {
    // 选项是字符串形式
    return correctAnswer === optionLabel || correctAnswer === option;
  } else {
    // 选项是对象形式
    return correctAnswer === option.value || correctAnswer === option.label || correctAnswer === option.text || correctAnswer === optionLabel;
  }
};

// 获取选项选择次数
const getOptionCount = (optionCounts, option, index) => {
  if (!optionCounts) return 0;
  // 生成选项标签（A、B、C、D）
  const optionLabel = String.fromCharCode(65 + index);
  // 检查多种可能的键名
  if (typeof option === 'string') {
    // 选项是字符串形式
    return optionCounts[option] || optionCounts[optionLabel] || 0;
  } else {
    // 选项是对象形式
    return optionCounts[option.value] || optionCounts[option.label] || optionCounts[option.text] || optionCounts[optionLabel] || 0;
  }
};

// 格式化tooltip内容
const formatTooltipContent = (content) => {
  if (!content) return '';
  
  // 处理图片标签，确保图片正确显示
  let formattedContent = content;
  
  // 替换图片标签，确保图片有合适的样式
  formattedContent = formattedContent.replace(/<img[^>]*src="([^"]+)"[^>]*>/g, '<img src="$1" style="max-width: 200px; max-height: 150px; display: block; margin: 10px 0;" />');
  
  // 移除可能的多余标签
  formattedContent = formattedContent.replace(/<style[^>]*>.*?<\/style>/g, '');
  
  return formattedContent;
};

// 学科分析图表配置
const initSubjectChart = ({ chartType, analysisData }) => {
  if (!analysisData || !analysisData.subjectAnalysisList) return;
  
  const subjectsData = analysisData.subjectAnalysisList.map(item => item.subject);
  const accuracies = analysisData.subjectAnalysisList.map(item => item.accuracy);
  const questions = analysisData.subjectAnalysisList.map(item => item.questions);
  
  if (chartType === 'radar') {
    return {
      tooltip: { trigger: 'item' },
      legend: { data: ['学科数据'] },
      radar: {
        indicator: subjectsData.map(subject => ({
          name: subject,
          max: 100
        }))
      },
      series: [{
        name: '学科数据',
        type: 'radar',
        data: [{
          value: accuracies,
          name: '正确率(%)'
        }]
      }]
    };
  } else if (chartType === 'pie') {
    return {
      tooltip: { trigger: 'item' },
      legend: { data: subjectsData },
      series: [{
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
      }]
    };
  } else {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: { color: '#999' }
        }
      },
      legend: { data: ['正确率', '答题数'] },
      xAxis: [{
        type: 'category',
        data: subjectsData,
        axisPointer: {
          type: chartType === 'bar' ? 'shadow' : 'cross'
        }
      }],
      yAxis: [
        {
          type: 'value',
          name: '正确率(%)',
          min: 0,
          max: 100,
          interval: 20,
          axisLabel: { formatter: '{value}%' }
        },
        {
          type: 'value',
          name: '答题数',
          min: 0,
          interval: 100,
          axisLabel: { formatter: '{value}' }
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
};

// 年级分析图表配置
const initGradeChart = ({ chartType, analysisData }) => {
  if (!analysisData || !analysisData.gradeAnalysisList) return;
  
  const grades = analysisData.gradeAnalysisList.map(item => item.grade + '年级');
  const accuracies = analysisData.gradeAnalysisList.map(item => item.accuracy);
  
  if (chartType === 'radar') {
    return {
      tooltip: { trigger: 'item' },
      legend: { data: ['年级数据'] },
      radar: {
        indicator: grades.map(grade => ({
          name: grade,
          max: 100
        }))
      },
      series: [{
        name: '年级数据',
        type: 'radar',
        data: [{
          value: accuracies,
          name: '正确率(%)'
        }]
      }]
    };
  } else if (chartType === 'pie') {
    return {
      tooltip: { trigger: 'item' },
      legend: { data: grades },
      series: [{
        name: '正确率',
        type: 'pie',
        radius: '60%',
        data: grades.map((grade, index) => ({
          name: grade,
          value: accuracies[index]
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  } else {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: chartType === 'bar' ? 'shadow' : 'cross'
        }
      },
      xAxis: { type: 'category', data: grades },
      yAxis: {
        type: 'value',
        name: '正确率(%)',
        min: 0,
        max: 100,
        interval: 20,
        axisLabel: { formatter: '{value}%' }
      },
      series: [{
        name: '正确率',
        type: chartType,
        data: accuracies,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        }
      }]
    };
  }
};

// 时间趋势分析图表配置
const initTimeChart = ({ chartType, analysisData }) => {
  if (!analysisData || !analysisData.timeAnalysisList) return;
  
  const dates = analysisData.timeAnalysisList.map(item => item.date);
  const accuracies = analysisData.timeAnalysisList.map(item => item.accuracy);
  
  if (chartType === 'radar') {
    return {
      tooltip: { trigger: 'item' },
      legend: { data: ['时间趋势数据'] },
      radar: {
        indicator: dates.map(date => ({
          name: date,
          max: 100
        }))
      },
      series: [{
        name: '时间趋势数据',
        type: 'radar',
        data: [{
          value: accuracies,
          name: '正确率(%)'
        }]
      }]
    };
  } else if (chartType === 'pie') {
    return {
      tooltip: { trigger: 'item' },
      legend: { data: dates },
      series: [{
        name: '正确率',
        type: 'pie',
        radius: '60%',
        data: dates.map((date, index) => ({
          name: date,
          value: accuracies[index]
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  } else {
    return {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: dates },
      yAxis: {
        type: 'value',
        name: '正确率(%)',
        min: 0,
        max: 100,
        interval: 20,
        axisLabel: { formatter: '{value}%' }
      },
      series: [{
        name: '正确率',
        type: chartType,
        data: accuracies,
        smooth: chartType === 'line',
        itemStyle: { color: '#5470c6' },
        areaStyle: chartType === 'line' ? {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(84, 112, 198, 0.5)' },
            { offset: 1, color: 'rgba(84, 112, 198, 0.1)' }
          ])
        } : undefined
      }]
    };
  }
};

// 班级分析图表配置
const initClassChart = ({ chartType, analysisData }) => {
  if (!analysisData || !analysisData.classAnalysisList) return;
  
  const classes = analysisData.classAnalysisList.map(item => item.class_num + '班');
  const accuracies = analysisData.classAnalysisList.map(item => item.accuracy);
  
  if (chartType === 'radar') {
    return {
      tooltip: { trigger: 'item' },
      legend: { data: ['班级数据'] },
      radar: {
        indicator: classes.map(classItem => ({
          name: classItem,
          max: 100
        }))
      },
      series: [{
        name: '班级数据',
        type: 'radar',
        data: [{
          value: accuracies,
          name: '正确率(%)'
        }]
      }]
    };
  } else if (chartType === 'pie') {
    return {
      tooltip: { trigger: 'item' },
      legend: { data: classes },
      series: [{
        name: '正确率',
        type: 'pie',
        radius: '60%',
        data: classes.map((classItem, index) => ({
          name: classItem,
          value: accuracies[index]
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  } else {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: chartType === 'bar' ? 'shadow' : 'cross'
        }
      },
      xAxis: { type: 'category', data: classes },
      yAxis: {
        type: 'value',
        name: '正确率(%)',
        min: 0,
        max: 100,
        interval: 20,
        axisLabel: { formatter: '{value}%' }
      },
      series: [{
        name: '正确率',
        type: chartType,
        data: accuracies,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#52c41a' },
            { offset: 0.5, color: '#389e0d' },
            { offset: 1, color: '#389e0d' }
          ])
        }
      }]
    };
  }
};

// 学科题库分析图表配置
const initSubcategoryChart = ({ chartType, analysisData }) => {
  if (!analysisData || !analysisData.subcategoryAnalysisList) return;
  
  const subcategories = analysisData.subcategoryAnalysisList.map(item => item.subcategory || '未分类');
  const accuracies = analysisData.subcategoryAnalysisList.map(item => item.accuracy);
  
  if (chartType === 'radar') {
    return {
      tooltip: { trigger: 'item' },
      legend: { data: ['学科题库数据'] },
      radar: {
        indicator: subcategories.map(subcategory => ({
          name: subcategory,
          max: 100
        }))
      },
      series: [{
        name: '学科题库数据',
        type: 'radar',
        data: [{
          value: accuracies,
          name: '正确率(%)'
        }]
      }]
    };
  } else if (chartType === 'pie') {
    return {
      tooltip: { trigger: 'item' },
      legend: { data: subcategories },
      series: [{
        name: '正确率',
        type: 'pie',
        radius: '60%',
        data: subcategories.map((subcategory, index) => ({
          name: subcategory,
          value: accuracies[index]
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  } else {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: chartType === 'bar' ? 'shadow' : 'cross'
        }
      },
      xAxis: {
        type: 'category',
        data: subcategories,
        axisLabel: { rotate: 45 }
      },
      yAxis: {
        type: 'value',
        name: '正确率(%)',
        min: 0,
        max: 100,
        interval: 20,
        axisLabel: { formatter: '{value}%' }
      },
      series: [{
        name: '正确率',
        type: chartType,
        data: accuracies,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#fa8c16' },
            { offset: 0.5, color: '#d46b08' },
            { offset: 1, color: '#d46b08' }
          ])
        }
      }]
    };
  }
};

// 答题时间分析图表配置
const initTimeSpentChart = ({ chartType, analysisData }) => {
  if (!analysisData || !analysisData.timeSpentAnalysisList) return;
  
  const timeRanges = analysisData.timeSpentAnalysisList.map(item => item.time_range);
  const accuracies = analysisData.timeSpentAnalysisList.map(item => item.accuracy);
  const sessions = analysisData.timeSpentAnalysisList.map(item => item.sessions);
  
  if (chartType === 'radar') {
    return {
      tooltip: { trigger: 'item' },
      legend: { data: ['答题时间数据'] },
      radar: {
        indicator: timeRanges.map(timeRange => ({
          name: timeRange,
          max: 100
        }))
      },
      series: [{
        name: '答题时间数据',
        type: 'radar',
        data: [{
          value: accuracies,
          name: '正确率(%)'
        }]
      }]
    };
  } else if (chartType === 'pie') {
    return {
      tooltip: { trigger: 'item' },
      legend: { data: timeRanges },
      series: [{
        name: '正确率',
        type: 'pie',
        radius: '60%',
        data: timeRanges.map((timeRange, index) => ({
          name: timeRange,
          value: accuracies[index]
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  } else {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: { color: '#999' }
        }
      },
      legend: { data: ['正确率', '答题次数'] },
      xAxis: [{
        type: 'category',
        data: timeRanges,
        axisPointer: {
          type: chartType === 'bar' ? 'shadow' : 'cross'
        }
      }],
      yAxis: [
        {
          type: 'value',
          name: '正确率(%)',
          min: 0,
          max: 100,
          interval: 20,
          axisLabel: { formatter: '{value}%' }
        },
        {
          type: 'value',
          name: '答题次数',
          min: 0,
          interval: 5,
          axisLabel: { formatter: '{value}' }
        }
      ],
      series: [
        {
          name: '正确率',
          type: chartType,
          data: accuracies
        },
        {
          name: '答题次数',
          type: 'line',
          yAxisIndex: 1,
          data: sessions
        }
      ]
    };
  }
};

// 错题分析图表配置
const initErrorChart = ({ chartType, analysisData }) => {
  if (!analysisData || !analysisData.errorAnalysisList) return;
  
  const subjects = analysisData.errorAnalysisList.map(item => item.subject);
  const errorRates = analysisData.errorAnalysisList.map(item => item.error_rate);
  const errorCounts = analysisData.errorAnalysisList.map(item => item.error_count);
  
  if (chartType === 'radar') {
    return {
      tooltip: { trigger: 'item' },
      legend: { data: ['错题分析数据'] },
      radar: {
        indicator: subjects.map(subject => ({
          name: subject,
          max: 100
        }))
      },
      series: [{
        name: '错题分析数据',
        type: 'radar',
        data: [{
          value: errorRates,
          name: '错误率(%)'
        }]
      }]
    };
  } else if (chartType === 'pie') {
    return {
      tooltip: { trigger: 'item' },
      legend: { data: subjects },
      series: [{
        name: '错误率',
        type: 'pie',
        radius: '60%',
        data: subjects.map((subject, index) => ({
          name: subject,
          value: errorRates[index]
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  } else {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: { color: '#999' }
        }
      },
      legend: { data: ['错误率', '错题数'] },
      xAxis: [{
        type: 'category',
        data: subjects,
        axisPointer: {
          type: chartType === 'bar' ? 'shadow' : 'cross'
        }
      }],
      yAxis: [
        {
          type: 'value',
          name: '错误率(%)',
          min: 0,
          max: 100,
          interval: 20,
          axisLabel: { formatter: '{value}%' }
        },
        {
          type: 'value',
          name: '错题数',
          min: 0,
          interval: 5,
          axisLabel: { formatter: '{value}' }
        }
      ],
      series: [
        {
          name: '错误率',
          type: chartType,
          data: errorRates,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#ff4d4f' },
              { offset: 0.5, color: '#cf1322' },
              { offset: 1, color: '#cf1322' }
            ])
          }
        },
        {
          name: '错题数',
          type: 'line',
          yAxisIndex: 1,
          data: errorCounts,
          itemStyle: { color: '#fa8c16' }
        }
      ]
    };
  }
};
</script>

<style scoped>
/* 全局样式 */
.analysis-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 24px;
}

/* 页面标题 */
.page-header {
  margin-bottom: 32px;
  text-align: center;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 600;
  color: #303133;
}

.page-description {
  margin: 0;
  font-size: 16px;
  color: #606266;
}

/* 筛选和下载区域 */
.filter-download-section {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 24px;
  margin-bottom: 32px;
}

/* 主要内容区域 */
.main-content {
  width: 100%;
}

/* 图表网格 */
.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

/* 加载状态 */
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.loading-content {
  text-align: center;
  color: #606266;
}

.loading-icon {
  font-size: 48px;
  margin-bottom: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 文本样式 */
.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}

/* 题目内容预览 */
.question-content-preview {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: help;
}

.question-content {
  max-width: 100%;
  word-break: break-word;
  line-height: 1.4;
}

.question-content img {
  max-width: 100%;
  max-height: 200px;
  display: block;
  margin: 8px 0;
  border-radius: 4px;
}

/* Tooltip内容样式 */
.tooltip-content {
  max-width: 400px;
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
  line-height: 1.5;
}

.tooltip-content img {
  max-width: 100%;
  max-height: 200px;
  display: block;
  margin: 8px 0;
  border-radius: 4px;
}

.tooltip-content p {
  margin: 8px 0;
}

/* 正确选项样式 */
.correct-option {
  color: #67c23a;
  font-weight: bold;
  position: relative;
}

.correct-option::after {
  content: ' (正确答案)';
  font-size: 12px;
  font-weight: normal;
  color: #999;
}

/* 自定义Tooltip样式 */
:deep(.el-tooltip__popper) {
  max-width: 400px !important;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.el-tooltip__popper.is-dark) {
  background-color: rgba(51, 51, 51, 0.95) !important;
  border: none;
}
</style>