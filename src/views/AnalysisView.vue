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
      <div class="filter-section">
        <div class="section-title">
          <i class="el-icon-filter"></i>
          <h3>数据筛选</h3>
        </div>
        <el-form :model="filterForm" class="filter-form" inline>
          <el-form-item label="学号">
            <el-input 
              v-model="filterForm.studentId" 
              placeholder="输入学号"
              style="width: 180px"
            ></el-input>
          </el-form-item>
          <el-form-item label="年级">
            <el-select v-model="filterForm.grade" placeholder="选择年级" style="width: 120px">
              <el-option label="全部" value=""></el-option>
              <el-option v-for="grade in grades" :key="grade.id" :label="grade.name + '年级'" :value="grade.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="班级">
            <el-select v-model="filterForm.class" placeholder="选择班级" style="width: 120px">
              <el-option label="全部" value=""></el-option>
              <el-option v-for="classItem in classes" :key="classItem.id" :label="classItem.name + '班'" :value="classItem.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="学科">
            <el-select v-model="filterForm.subjectId" placeholder="选择学科" style="width: 120px" @change="handleSubjectChange">
              <el-option label="全部" value=""></el-option>
              <el-option v-for="subject in subjects" :key="subject.id" :label="subject.name" :value="subject.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="子分类">
            <el-select v-model="filterForm.subcategoryIds" multiple placeholder="选择子分类" style="width: 180px">
              <el-option v-for="subcategory in subcategories" :key="subcategory.id" :label="subcategory.name" :value="subcategory.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 240px"
              :shortcuts="[
                { text: '最近7天', value: () => {
                  const end = new Date();
                  const start = new Date();
                  start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
                  return [start, end];
                }},
                { text: '最近30天', value: () => {
                  const end = new Date();
                  const start = new Date();
                  start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
                  return [start, end];
                }},
                { text: '今年', value: () => {
                  const end = new Date();
                  const start = new Date(new Date().getFullYear(), 0, 1);
                  return [start, end];
                }}
              ]"
            ></el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="applyFilters" class="btn-primary">
              <i class="el-icon-check"></i> 应用筛选
            </el-button>
          </el-form-item>
          <el-form-item>
            <el-button @click="resetFilters" class="btn-secondary">
              <i class="el-icon-refresh"></i> 重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 分析报告下载 -->
      <div class="download-section">
        <el-button type="success" @click="downloadReport('pdf')" class="btn-download">
          <i class="el-icon-document"></i> PDF报告
        </el-button>
        <el-button type="success" @click="downloadReport('excel')" class="btn-download">
          <i class="el-icon-s-grid"></i> 电子表格
        </el-button>
      </div>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="main-content">
      <div class="analysis-results" v-if="analysisData">
        <!-- 总体统计 -->
        <div class="stats-section">
          <div class="stats-header">
            <div class="stats-title">
              <i class="el-icon-data-analysis"></i>
              <h2>总体统计</h2>
            </div>
            <div class="display-mode">
              <span>显示模式：</span>
              <el-radio-group v-model="showMode" @change="initCharts" size="large">
                <el-radio-button label="both" border>
                  <i class="el-icon-data-line"></i> 图表+表格
                </el-radio-button>
                <el-radio-button label="chart" border>
                  <i class="el-icon-pie-chart"></i> 仅图表
                </el-radio-button>
                <el-radio-button label="table" border>
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
                <div class="stats-value">{{ analysisData.totalUsers }}</div>
                <div class="stats-label">总用户数</div>
              </div>
            </div>
            <div class="stats-item">
              <div class="stats-icon session-icon">
                <i class="el-icon-view"></i>
              </div>
              <div class="stats-content">
                <div class="stats-value">{{ analysisData.totalSessions }}</div>
                <div class="stats-label">总答题次数</div>
              </div>
            </div>
            <div class="stats-item">
              <div class="stats-icon question-icon">
                <i class="el-icon-edit-outline"></i>
              </div>
              <div class="stats-content">
                <div class="stats-value">{{ analysisData.totalQuestions }}</div>
                <div class="stats-label">总答题数</div>
              </div>
            </div>
            <div class="stats-item">
              <div class="stats-icon accuracy-icon">
                <i class="el-icon-check"></i>
              </div>
              <div class="stats-content">
                <div class="stats-value">{{ analysisData.overallAccuracy.toFixed(1) }}%</div>
                <div class="stats-label">总体正确率</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 图表网格布局 -->
        <div class="chart-grid">
          <!-- 学科分析 -->
          <div class="chart-card">
            <div class="chart-header">
              <div class="chart-title">
                <i class="el-icon-collection-tag"></i>
                <h3>学科分析</h3>
              </div>
              <div style="display: flex; gap: 10px; align-items: center;">
                <el-select v-model="chartTypes.subject" @change="initSubjectChart" size="small" class="chart-type-select">
                  <el-option label="柱状图" value="bar"></el-option>
                  <el-option label="折线图" value="line"></el-option>
                  <el-option label="饼图" value="pie"></el-option>
                  <el-option label="雷达图" value="radar"></el-option>
                </el-select>
                <el-checkbox v-model="expandedCards.subject" size="small">显示表格</el-checkbox>
              </div>
            </div>
            <div v-if="showMode === 'both' || showMode === 'chart'" ref="subjectChartRef" class="chart"></div>
            <div v-if="(showMode === 'both' || showMode === 'table') && expandedCards.subject" class="chart-table">
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
          
          <!-- 年级分析 -->
          <div class="chart-card">
            <div class="chart-header">
              <div class="chart-title">
                <i class="el-icon-school"></i>
                <h3>年级分析</h3>
              </div>
              <div style="display: flex; gap: 10px; align-items: center;">
                <el-select v-model="chartTypes.grade" @change="initGradeChart" size="small" class="chart-type-select">
                  <el-option label="柱状图" value="bar"></el-option>
                  <el-option label="折线图" value="line"></el-option>
                  <el-option label="饼图" value="pie"></el-option>
                  <el-option label="雷达图" value="radar"></el-option>
                </el-select>
                <el-checkbox v-model="expandedCards.grade" size="small">显示表格</el-checkbox>
              </div>
            </div>
            <div v-if="showMode === 'both' || showMode === 'chart'" ref="gradeChartRef" class="chart"></div>
            <div v-if="(showMode === 'both' || showMode === 'table') && expandedCards.grade" class="chart-table">
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
            </div>
          </div>
          
          <!-- 时间趋势分析 -->
          <div class="chart-card">
            <div class="chart-header">
              <div class="chart-title">
                <i class="el-icon-data-line"></i>
                <h3>时间趋势分析</h3>
              </div>
              <div style="display: flex; gap: 10px; align-items: center;">
                <el-select v-model="chartTypes.time" @change="initTimeChart" size="small" class="chart-type-select">
                  <el-option label="柱状图" value="bar"></el-option>
                  <el-option label="折线图" value="line"></el-option>
                  <el-option label="面积图" value="area"></el-option>
                  <el-option label="雷达图" value="radar"></el-option>
                </el-select>
                <el-checkbox v-model="expandedCards.time" size="small">显示表格</el-checkbox>
              </div>
            </div>
            <div v-if="showMode === 'both' || showMode === 'chart'" ref="timeChartRef" class="chart"></div>
            <div v-if="(showMode === 'both' || showMode === 'table') && expandedCards.time" class="chart-table">
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
            </div>
          </div>
          
          <!-- 班级分析 -->
          <div class="chart-card">
            <div class="chart-header">
              <div class="chart-title">
                <i class="el-icon-office-building"></i>
                <h3>班级分析</h3>
              </div>
              <div style="display: flex; gap: 10px; align-items: center;">
                <el-select v-model="chartTypes.class" @change="initClassChart" size="small" class="chart-type-select">
                  <el-option label="柱状图" value="bar"></el-option>
                  <el-option label="折线图" value="line"></el-option>
                  <el-option label="饼图" value="pie"></el-option>
                  <el-option label="雷达图" value="radar"></el-option>
                </el-select>
                <el-checkbox v-model="expandedCards.class" size="small">显示表格</el-checkbox>
              </div>
            </div>
            <div v-if="showMode === 'both' || showMode === 'chart'" ref="classChartRef" class="chart"></div>
            <div v-if="(showMode === 'both' || showMode === 'table') && expandedCards.class" class="chart-table">
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
            </div>
          </div>
          
          <!-- 子分类分析 -->
          <div class="chart-card">
            <div class="chart-header">
              <div class="chart-title">
                <i class="el-icon-menu"></i>
                <h3>子分类分析</h3>
              </div>
              <div style="display: flex; gap: 10px; align-items: center;">
                <el-select v-model="chartTypes.subcategory" @change="initSubcategoryChart" size="small" class="chart-type-select">
                  <el-option label="柱状图" value="bar"></el-option>
                  <el-option label="折线图" value="line"></el-option>
                  <el-option label="饼图" value="pie"></el-option>
                  <el-option label="雷达图" value="radar"></el-option>
                </el-select>
                <el-checkbox v-model="expandedCards.subcategory" size="small">显示表格</el-checkbox>
              </div>
            </div>
            <div v-if="showMode === 'both' || showMode === 'chart'" ref="subcategoryChartRef" class="chart"></div>
            <div v-if="(showMode === 'both' || showMode === 'table') && expandedCards.subcategory" class="chart-table">
              <el-table :data="analysisData.subcategoryAnalysisList" style="width: 100%" stripe border>
                <el-table-column prop="subject" label="学科" width="120"></el-table-column>
                <el-table-column prop="subcategory" label="子分类"></el-table-column>
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
          
          <!-- 答题时间分析 -->
          <div class="chart-card">
            <div class="chart-header">
              <div class="chart-title">
                <i class="el-icon-time"></i>
                <h3>答题时间分析</h3>
              </div>
              <div style="display: flex; gap: 10px; align-items: center;">
                <el-select v-model="chartTypes.timeSpent" @change="initTimeSpentChart" size="small" class="chart-type-select">
                  <el-option label="柱状图" value="bar"></el-option>
                  <el-option label="折线图" value="line"></el-option>
                  <el-option label="饼图" value="pie"></el-option>
                  <el-option label="雷达图" value="radar"></el-option>
                </el-select>
                <el-checkbox v-model="expandedCards.timeSpent" size="small">显示表格</el-checkbox>
              </div>
            </div>
            <div v-if="showMode === 'both' || showMode === 'chart'" ref="timeSpentChartRef" class="chart"></div>
            <div v-if="(showMode === 'both' || showMode === 'table') && expandedCards.timeSpent" class="chart-table">
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
            </div>
          </div>
          
          <!-- 错题分析 -->
          <div class="chart-card">
            <div class="chart-header">
              <div class="chart-title">
                <i class="el-icon-warning-outline"></i>
                <h3>错题分析</h3>
              </div>
              <div style="display: flex; gap: 10px; align-items: center;">
                <el-select v-model="chartTypes.error" @change="initErrorChart" size="small" class="chart-type-select">
                  <el-option label="柱状图" value="bar"></el-option>
                  <el-option label="折线图" value="line"></el-option>
                  <el-option label="饼图" value="pie"></el-option>
                  <el-option label="雷达图" value="radar"></el-option>
                </el-select>
                <el-checkbox v-model="expandedCards.error" size="small">显示表格</el-checkbox>
              </div>
            </div>
            <div v-if="showMode === 'both' || showMode === 'chart'" ref="errorChartRef" class="chart"></div>
            <div v-if="(showMode === 'both' || showMode === 'table') && expandedCards.error" class="chart-table">
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
            </div>
          </div>
          
          <!-- 错误率较高的题目 -->
          <div class="chart-card" style="grid-column: 1 / -1;">
            <div class="chart-header">
              <div class="chart-title">
                <i class="el-icon-warning"></i>
                <h3>错误率较高的题目</h3>
              </div>
              <el-checkbox v-model="expandedCards.errorProne" size="small">显示表格</el-checkbox>
            </div>
            <div style="margin-bottom: 15px; padding: 12px; background-color: #f0f9ff; border-radius: 4px; border-left: 4px solid #409eff;">
              <span style="font-weight: bold; color: #409eff;">说明：</span> 
              本列表显示被尝试至少3次的题目，按错误次数降序排列。错误率计算公式：(1 - 正确次数/总尝试次数) × 100%。
              若列表数据较少，可能是因为大部分题目被尝试的次数不足3次，或错误次数较少。
            </div>
            <div v-if="expandedCards.errorProne" class="chart-table">
              <el-table :data="paginatedErrorProneQuestions" style="width: 100%" stripe border>
                <el-table-column prop="id" label="ID" width="80"></el-table-column>
                <el-table-column prop="subject_name" label="学科" width="100"></el-table-column>
                <el-table-column prop="content" label="题目内容" min-width="300">
                  <template #default="scope">
                    <el-tooltip :content="scope.row.content" placement="top" effect="dark">
                      <div class="question-content-preview">{{ scope.row.content.replace(/<[^>]*>/g, '').substring(0, 50) }}{{ scope.row.content.length > 50 ? '...' : '' }}</div>
                    </el-tooltip>
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
import { ref, onMounted, computed } from 'vue';
import { getApiBaseUrl, getSubjects, getGrades, getClasses } from '../utils/database';
import { ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElButton, ElDatePicker, ElRow, ElCol, ElCard, ElTable, ElTableColumn, ElRadioGroup, ElRadioButton, ElPagination, ElCheckbox, ElTooltip, ElProgress } from 'element-plus';
import 'element-plus/dist/index.css';

const filterForm = ref({
  studentId: '',
  grade: '',
  class: '',
  subjectId: '',
  subcategoryIds: [],
  dateRange: []
});

const analysisData = ref(null);
const subjects = ref([]);
const grades = ref([]);
const classes = ref([]);
const subcategories = ref([]);
const subjectChartRef = ref(null);
const gradeChartRef = ref(null);
const timeChartRef = ref(null);
const classChartRef = ref(null);
const subcategoryChartRef = ref(null);
const timeSpentChartRef = ref(null);
const errorChartRef = ref(null);
const subjectChart = ref(null);
const gradeChart = ref(null);
const timeChart = ref(null);
const classChart = ref(null);
const subcategoryChart = ref(null);
const timeSpentChart = ref(null);
const errorChart = ref(null);

// 图表类型选择
const chartTypes = ref({
  subject: 'bar',
  grade: 'bar',
  time: 'line',
  class: 'bar',
  subcategory: 'bar',
  timeSpent: 'bar',
  error: 'bar'
});

// 显示模式
const showMode = ref('both'); // both, chart, table

// 卡片展开状态
const expandedCards = ref({
  subject: false,
  grade: false,
  time: false,
  class: false,
  subcategory: false,
  timeSpent: false,
  error: false,
  errorProne: true
});

// 错误率较高的题目分页
const errorProneCurrentPage = ref(1);
const errorPronePageSize = ref(10);
const paginatedErrorProneQuestions = computed(() => {
  if (!analysisData.value || !analysisData.value.errorProneQuestions) {
    return [];
  }
  const start = (errorProneCurrentPage.value - 1) * errorPronePageSize.value;
  const end = start + errorPronePageSize.value;
  return analysisData.value.errorProneQuestions.slice(start, end);
});

const handleErrorProneSizeChange = (size) => {
  errorPronePageSize.value = size;
  errorProneCurrentPage.value = 1;
};

const handleErrorProneCurrentChange = (current) => {
  errorProneCurrentPage.value = current;
};

onMounted(() => {
  loadSubjects();
  loadGrades();
  loadClasses();
  loadAnalysisData();
});

const loadSubjects = async () => {
  subjects.value = await getSubjects();
};

const loadGrades = async () => {
  grades.value = await getGrades();
};

const loadClasses = async () => {
  classes.value = await getClasses();
};

const loadSubcategories = async (subjectId) => {
  if (!subjectId) {
    subcategories.value = [];
    return;
  }
  
  const API_BASE_URL = getApiBaseUrl();
  try {
    const response = await fetch(`${API_BASE_URL}/api/subjects/${subjectId}/subcategories`);
    if (response.ok) {
      const data = await response.json();
      subcategories.value = data;
    }
  } catch (error) {
    console.error('获取子分类失败:', error);
  }
};

const handleSubjectChange = (subjectId) => {
  filterForm.value.subcategoryIds = [];
  loadSubcategories(subjectId);
};

const loadAnalysisData = async () => {
  const API_BASE_URL = getApiBaseUrl();
  const { studentId, grade, class: className, subjectId, subcategoryIds, dateRange } = filterForm.value;
  
  const params = new URLSearchParams();
  if (studentId) params.append('studentId', studentId);
  if (grade) params.append('grade', grade);
  if (className) params.append('class', className);
  if (subjectId) params.append('subjectId', subjectId);
  if (subcategoryIds && subcategoryIds.length > 0) {
    subcategoryIds.forEach(id => params.append('subcategoryIds', id));
  }
  if (dateRange && dateRange[0]) params.append('startDate', dateRange[0]);
  if (dateRange && dateRange[1]) params.append('endDate', dateRange[1]);
  
  try {
    console.log('请求分析数据:', `${API_BASE_URL}/analysis?${params.toString()}`);
    const response = await fetch(`${API_BASE_URL}/analysis?${params.toString()}`);
    console.log('响应状态:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('获取到的分析数据:', data);
      analysisData.value = data;
      initCharts();
    } else {
      console.error('获取分析数据失败:', response.statusText);
    }
  } catch (error) {
    console.error('获取分析数据失败:', error);
  }
};

const applyFilters = () => {
  loadAnalysisData();
};

const resetFilters = () => {
  filterForm.value = {
    studentId: '',
    grade: '',
    class: '',
    subjectId: '',
    subcategoryIds: [],
    dateRange: []
  };
  loadAnalysisData();
};

const initCharts = () => {
  if (!analysisData.value) return;
  
  initSubjectChart();
  initGradeChart();
  initTimeChart();
  initClassChart();
  initSubcategoryChart();
  initTimeSpentChart();
  initErrorChart();
};

const initSubjectChart = () => {
  if (!subjectChartRef.value) return;
  if (!analysisData.value || !analysisData.value.subjectAnalysisList) return;
  
  if (subjectChart.value) {
    subjectChart.value.dispose();
  }
  
  subjectChart.value = echarts.init(subjectChartRef.value);
  
  const subjectsData = analysisData.value.subjectAnalysisList.map(item => item.subject);
  const accuracies = analysisData.value.subjectAnalysisList.map(item => item.accuracy);
  const questions = analysisData.value.subjectAnalysisList.map(item => item.questions);
  
  let option;
  
  if (chartTypes.value.subject === 'radar') {
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
  } else if (chartTypes.value.subject === 'pie') {
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
            type: chartTypes.value.subject === 'bar' ? 'shadow' : 'cross'
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
          type: chartTypes.value.subject,
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
  
  subjectChart.value.setOption(option);
};

const initGradeChart = () => {
  if (!gradeChartRef.value) return;
  if (!analysisData.value || !analysisData.value.gradeAnalysisList) return;
  
  if (gradeChart.value) {
    gradeChart.value.dispose();
  }
  
  gradeChart.value = echarts.init(gradeChartRef.value);
  
  const grades = analysisData.value.gradeAnalysisList.map(item => item.grade + '年级');
  const accuracies = analysisData.value.gradeAnalysisList.map(item => item.accuracy);
  
  let option;
  
  if (chartTypes.value.grade === 'radar') {
    option = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: ['年级数据']
      },
      radar: {
        indicator: grades.map(grade => ({
          name: grade,
          max: 100
        }))
      },
      series: [
        {
          name: '年级数据',
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
  } else if (chartTypes.value.grade === 'pie') {
    option = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: grades
      },
      series: [
        {
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
        }
      ]
    };
  } else {
    option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: chartTypes.value.grade === 'bar' ? 'shadow' : 'cross'
        }
      },
      xAxis: {
        type: 'category',
        data: grades
      },
      yAxis: {
        type: 'value',
        name: '正确率(%)',
        min: 0,
        max: 100,
        interval: 20,
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: [
        {
          name: '正确率',
          type: chartTypes.value.grade,
          data: accuracies,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' }
            ])
          }
        }
      ]
    };
  }
  
  gradeChart.value.setOption(option);
};

const initTimeChart = () => {
  if (!timeChartRef.value) return;
  if (!analysisData.value || !analysisData.value.timeAnalysisList) return;
  
  if (timeChart.value) {
    timeChart.value.dispose();
  }
  
  timeChart.value = echarts.init(timeChartRef.value);
  
  const dates = analysisData.value.timeAnalysisList.map(item => item.date);
  const accuracies = analysisData.value.timeAnalysisList.map(item => item.accuracy);
  
  let option;
  
  if (chartTypes.value.time === 'radar') {
    option = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: ['时间趋势数据']
      },
      radar: {
        indicator: dates.map(date => ({
          name: date,
          max: 100
        }))
      },
      series: [
        {
          name: '时间趋势数据',
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
  } else if (chartTypes.value.time === 'pie') {
    option = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: dates
      },
      series: [
        {
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
        }
      ]
    };
  } else {
    option = {
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: dates
      },
      yAxis: {
        type: 'value',
        name: '正确率(%)',
        min: 0,
        max: 100,
        interval: 20,
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: [
        {
          name: '正确率',
          type: chartTypes.value.time,
          data: accuracies,
          smooth: chartTypes.value.time === 'line',
          itemStyle: {
            color: '#5470c6'
          },
          areaStyle: chartTypes.value.time === 'line' ? {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(84, 112, 198, 0.5)' },
              { offset: 1, color: 'rgba(84, 112, 198, 0.1)' }
            ])
          } : undefined
        }
      ]
    };
  }
  
  timeChart.value.setOption(option);
};

const initClassChart = () => {
  if (!classChartRef.value) return;
  if (!analysisData.value || !analysisData.value.classAnalysisList) return;
  
  if (classChart.value) {
    classChart.value.dispose();
  }
  
  classChart.value = echarts.init(classChartRef.value);
  
  const classes = analysisData.value.classAnalysisList.map(item => item.class_num + '班');
  const accuracies = analysisData.value.classAnalysisList.map(item => item.accuracy);
  
  let option;
  
  if (chartTypes.value.class === 'radar') {
    option = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: ['班级数据']
      },
      radar: {
        indicator: classes.map(classItem => ({
          name: classItem,
          max: 100
        }))
      },
      series: [
        {
          name: '班级数据',
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
  } else if (chartTypes.value.class === 'pie') {
    option = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: classes
      },
      series: [
        {
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
        }
      ]
    };
  } else {
    option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: chartTypes.value.class === 'bar' ? 'shadow' : 'cross'
        }
      },
      xAxis: {
        type: 'category',
        data: classes
      },
      yAxis: {
        type: 'value',
        name: '正确率(%)',
        min: 0,
        max: 100,
        interval: 20,
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: [
        {
          name: '正确率',
          type: chartTypes.value.class,
          data: accuracies,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#52c41a' },
              { offset: 0.5, color: '#389e0d' },
              { offset: 1, color: '#389e0d' }
            ])
          }
        }
      ]
    };
  }
  
  classChart.value.setOption(option);
};

const initSubcategoryChart = () => {
  if (!subcategoryChartRef.value) return;
  if (!analysisData.value || !analysisData.value.subcategoryAnalysisList) return;
  
  if (subcategoryChart.value) {
    subcategoryChart.value.dispose();
  }
  
  subcategoryChart.value = echarts.init(subcategoryChartRef.value);
  
  const subcategories = analysisData.value.subcategoryAnalysisList.map(item => item.subcategory || '未分类');
  const accuracies = analysisData.value.subcategoryAnalysisList.map(item => item.accuracy);
  
  let option;
  
  if (chartTypes.value.subcategory === 'radar') {
    option = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: ['子分类数据']
      },
      radar: {
        indicator: subcategories.map(subcategory => ({
          name: subcategory,
          max: 100
        }))
      },
      series: [
        {
          name: '子分类数据',
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
  } else if (chartTypes.value.subcategory === 'pie') {
    option = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: subcategories
      },
      series: [
        {
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
        }
      ]
    };
  } else {
    option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: chartTypes.value.subcategory === 'bar' ? 'shadow' : 'cross'
        }
      },
      xAxis: {
        type: 'category',
        data: subcategories,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: '正确率(%)',
        min: 0,
        max: 100,
        interval: 20,
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: [
        {
          name: '正确率',
          type: chartTypes.value.subcategory,
          data: accuracies,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#fa8c16' },
              { offset: 0.5, color: '#d46b08' },
              { offset: 1, color: '#d46b08' }
            ])
          }
        }
      ]
    };
  }
  
  subcategoryChart.value.setOption(option);
};

const initTimeSpentChart = () => {
  if (!timeSpentChartRef.value) return;
  if (!analysisData.value || !analysisData.value.timeSpentAnalysisList) return;
  
  if (timeSpentChart.value) {
    timeSpentChart.value.dispose();
  }
  
  timeSpentChart.value = echarts.init(timeSpentChartRef.value);
  
  const timeRanges = analysisData.value.timeSpentAnalysisList.map(item => item.time_range);
  const accuracies = analysisData.value.timeSpentAnalysisList.map(item => item.accuracy);
  const sessions = analysisData.value.timeSpentAnalysisList.map(item => item.sessions);
  
  let option;
  
  if (chartTypes.value.timeSpent === 'radar') {
    option = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: ['答题时间数据']
      },
      radar: {
        indicator: timeRanges.map(timeRange => ({
          name: timeRange,
          max: 100
        }))
      },
      series: [
        {
          name: '答题时间数据',
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
  } else if (chartTypes.value.timeSpent === 'pie') {
    option = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: timeRanges
      },
      series: [
        {
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
        data: ['正确率', '答题次数']
      },
      xAxis: [
        {
          type: 'category',
          data: timeRanges,
          axisPointer: {
            type: chartTypes.value.timeSpent === 'bar' ? 'shadow' : 'cross'
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
          name: '答题次数',
          min: 0,
          interval: 5,
          axisLabel: {
            formatter: '{value}'
          }
        }
      ],
      series: [
        {
          name: '正确率',
          type: chartTypes.value.timeSpent,
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
  
  timeSpentChart.value.setOption(option);
};

const initErrorChart = () => {
  if (!errorChartRef.value) return;
  if (!analysisData.value || !analysisData.value.errorAnalysisList) return;
  
  if (errorChart.value) {
    errorChart.value.dispose();
  }
  
  errorChart.value = echarts.init(errorChartRef.value);
  
  const subjects = analysisData.value.errorAnalysisList.map(item => item.subject);
  const errorRates = analysisData.value.errorAnalysisList.map(item => item.error_rate);
  const errorCounts = analysisData.value.errorAnalysisList.map(item => item.error_count);
  
  let option;
  
  if (chartTypes.value.error === 'radar') {
    option = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: ['错题分析数据']
      },
      radar: {
        indicator: subjects.map(subject => ({
          name: subject,
          max: 100
        }))
      },
      series: [
        {
          name: '错题分析数据',
          type: 'radar',
          data: [
            {
              value: errorRates,
              name: '错误率(%)'
            }
          ]
        }
      ]
    };
  } else if (chartTypes.value.error === 'pie') {
    option = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: subjects
      },
      series: [
        {
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
        data: ['错误率', '错题数']
      },
      xAxis: [
        {
          type: 'category',
          data: subjects,
          axisPointer: {
            type: chartTypes.value.error === 'bar' ? 'shadow' : 'cross'
          }
        }
      ],
      yAxis: [
        {
          type: 'value',
          name: '错误率(%)',
          min: 0,
          max: 100,
          interval: 20,
          axisLabel: {
            formatter: '{value}%'
          }
        },
        {
          type: 'value',
          name: '错题数',
          min: 0,
          interval: 5,
          axisLabel: {
            formatter: '{value}'
          }
        }
      ],
      series: [
        {
          name: '错误率',
          type: chartTypes.value.error,
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
          itemStyle: {
            color: '#fa8c16'
          }
        }
      ]
    };
  }
  
  errorChart.value.setOption(option);
};

const downloadReport = (type) => {
  const API_BASE_URL = getApiBaseUrl();
  const { studentId, grade, class: className, subjectId, subcategoryIds, dateRange } = filterForm.value;
  
  const params = new URLSearchParams();
  if (studentId) params.append('studentId', studentId);
  if (grade) params.append('grade', grade);
  if (className) params.append('class', className);
  if (subjectId) params.append('subjectId', subjectId);
  if (subcategoryIds && subcategoryIds.length > 0) {
    subcategoryIds.forEach(id => params.append('subcategoryIds', id));
  }
  if (dateRange && dateRange[0]) params.append('startDate', dateRange[0]);
  if (dateRange && dateRange[1]) params.append('endDate', dateRange[1]);
  
  window.open(`${API_BASE_URL}/analysis/download?type=${type}&${params.toString()}`);
};

// 获取错误率颜色
const getErrorRateColor = (accuracy) => {
  if (accuracy < 0.3) return '#ff4d4f';
  if (accuracy < 0.6) return '#faad14';
  return '#52c41a';
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

/* 筛选区域 */
.filter-section {
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.section-title i {
  font-size: 18px;
  color: #409eff;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: end;
}

.filter-form .el-form-item {
  margin-bottom: 0;
}

/* 下载区域 */
.download-section {
  display: flex;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.btn-download {
  padding: 10px 20px !important;
  font-size: 14px !important;
}

.btn-primary {
  padding: 10px 20px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
}

.btn-secondary {
  padding: 10px 20px !important;
  font-size: 14px !important;
}

/* 主要内容区域 */
.main-content {
  width: 100%;
}

/* 页面标题 */
.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.page-description {
  margin: 0;
  font-size: 16px;
  color: #606266;
}

/* 统计区域 */
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

/* 统计卡片 */
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

/* 图表网格 */
.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

/* 图表卡片 */
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

/* 图表 */
.chart {
  height: 250px;
  width: 100%;
}

/* 表格 */
.chart-table {
  margin-top: 20px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.chart-table .el-table {
  border-radius: 8px;
  overflow: hidden;
}

.chart-table .el-table th {
  background-color: #f8f9fa;
  font-weight: 500;
}

/* 文本颜色 */
.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}

/* 加载动画 */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 600px;
}

.loading-content {
  text-align: center;
}

.loading-icon {
  font-size: 64px;
  margin-bottom: 24px;
  color: #409eff;
  animation: spin 1s linear infinite;
}

.loading-content p {
  font-size: 16px;
  color: #606266;
  margin: 0;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .chart-grid {
    grid-template-columns: 1fr;
  }
  
  .chart {
    height: 350px;
  }
  
  .stats-card {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .left-panel {
    width: 240px;
  }
  
  .right-panel {
    padding: 20px;
  }
  
  .stats-card {
    grid-template-columns: 1fr;
  }
  
  .stats-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .display-mode {
    width: 100%;
    justify-content: space-between;
  }
}
</style>