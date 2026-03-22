<template>
  <div class="filter-container">
    <!-- 筛选头部 -->
    <div class="filter-header">
      <div class="filter-title">
        <el-icon class="filter-icon"><Filter /></el-icon>
        <h3>数据筛选</h3>
        <span class="result-count" v-if="resultCount > 0">
          <el-icon class="count-icon"><DataAnalysis /></el-icon>
          {{ resultCount }} 条结果
        </span>
      </div>
      <div class="filter-actions">
        <el-dropdown trigger="click" @command="loadFilterPreset" placement="bottom">
          <el-button size="small" type="info" plain>
            <el-icon><Clock /></el-icon> 历史筛选
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item 
                v-for="(preset, index) in filterHistory" 
                :key="index" 
                :command="preset"
                class="history-item"
              >
                <div class="history-item-content">
                  <span class="history-name">{{ preset.name }}</span>
                  <span class="history-time">{{ preset.time || '' }}</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item divided v-if="filterHistory.length === 0">
                暂无历史记录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button size="small" @click="saveFilterTemplate" type="warning" plain>
          <el-icon><Download /></el-icon> 保存模板
        </el-button>
      </div>
    </div>
    
    <!-- 基本筛选区域 -->
    <div class="basic-filter">
      <div class="filter-row">
        <div class="filter-item">
          <label class="filter-label">学号</label>
          <el-input 
            v-model="filterForm.studentId" 
            placeholder="输入学号"
            clearable
            prefix-icon="User"
            @input="filterForm.studentId = filterForm.studentId ? filterForm.studentId.replace(/[^0-9]/g, '') : ''"
          ></el-input>
        </div>
        <div class="filter-item">
          <label class="filter-label">年级</label>
          <el-select v-model="filterForm.grade" placeholder="选择年级" clearable>
            <el-option label="全部" value=""></el-option>
            <el-option v-for="grade in grades" :key="grade.id || grade" :label="grade.name || grade" :value="grade.name || grade"></el-option>
          </el-select>
        </div>
        <div class="filter-item">
          <label class="filter-label">班级</label>
          <el-select v-model="filterForm.class" placeholder="选择班级" clearable>
            <el-option label="全部" value=""></el-option>
            <el-option v-for="classItem in classes" :key="classItem.id || classItem" :label="classItem.name || classItem" :value="classItem.name || classItem"></el-option>
          </el-select>
        </div>
        <div class="filter-item">
          <label class="filter-label">学科</label>
          <el-select v-model="filterForm.subjectId" placeholder="选择学科" clearable @change="handleSubjectChange">
            <el-option label="全部" value=""></el-option>
            <el-option v-for="subject in subjects" :key="subject.id" :label="subject.name" :value="subject.id"></el-option>
          </el-select>
        </div>
        <div class="filter-item">
          <label class="filter-label">学科题库</label>
          <el-select v-model="filterForm.subcategoryIds" multiple placeholder="选择学科题库" clearable>
            <el-option v-for="subcategory in subcategories" :key="subcategory.id" :label="subcategory.name" :value="subcategory.id"></el-option>
          </el-select>
        </div>
        <div class="filter-item">
          <label class="filter-label">时间范围</label>
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            clearable
            :shortcuts="[
              {
                text: '最近7天',
                value: () => {
                  const end = new Date();
                  const start = new Date();
                  start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
                  return [start, end];
                }
              },
              {
                text: '最近30天',
                value: () => {
                  const end = new Date();
                  const start = new Date();
                  start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
                  return [start, end];
                }
              },
              {
                text: '今年',
                value: () => {
                  const end = new Date();
                  const start = new Date(new Date().getFullYear(), 0, 1);
                  return [start, end];
                }
              },
              {
                text: '全部时间',
                value: () => {
                  return [null, null];
                }
              }
            ]"
          ></el-date-picker>
        </div>
        <div class="filter-item action-buttons">
          <el-button type="primary" @click="applyFilters" class="btn-primary">
            <el-icon><Check /></el-icon> 应用筛选
          </el-button>
          <el-button @click="resetFilters" class="btn-secondary">
            <el-icon><Refresh /></el-icon> 重置
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 高级筛选 -->
    <div class="advanced-filter-section">
      <el-collapse v-model="activeNames">
        <el-collapse-item title="高级筛选" name="1">
          <div class="advanced-filter-content">
            <div class="filter-row">
              <div class="filter-item">
                <label class="filter-label">筛选逻辑</label>
                <el-select v-model="advancedFilter.logic">
                  <el-option label="包含" value="include"></el-option>
                  <el-option label="不包含" value="exclude"></el-option>
                  <el-option label="等于" value="equal"></el-option>
                  <el-option label="不等于" value="not_equal"></el-option>
                </el-select>
              </div>
              <div class="filter-item">
                <label class="filter-label">结果排序</label>
                <el-select v-model="advancedFilter.sortBy">
                  <el-option label="正确率" value="accuracy"></el-option>
                  <el-option label="答题数" value="questions"></el-option>
                  <el-option label="时间" value="time"></el-option>
                </el-select>
              </div>
              <div class="filter-item">
                <label class="filter-label">排序方式</label>
                <el-select v-model="advancedFilter.sortOrder">
                  <el-option label="升序" value="asc"></el-option>
                  <el-option label="降序" value="desc"></el-option>
                </el-select>
              </div>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useAnalysisStore } from '../../../stores/analysisStore';
import { Filter, DataAnalysis, Clock, Download, User, Check, Refresh } from '@element-plus/icons-vue';

const analysisStore = useAnalysisStore();

// 从store中获取数据
const filterForm = computed(() => analysisStore.filterForm);
const subjects = computed(() => analysisStore.subjects);
const grades = computed(() => analysisStore.grades);
const classes = computed(() => analysisStore.classes);
const subcategories = computed(() => analysisStore.subcategories);
const resultCount = computed(() => {
  if (!analysisStore.analysisData) return 0;
  return analysisStore.analysisData.totalQuestions || 0;
});

// 高级筛选
const activeNames = ref(['1']);
const advancedFilter = ref({
  logic: 'include',
  sortBy: 'accuracy',
  sortOrder: 'desc'
});

// 筛选历史
const filterHistory = ref([
  { 
    name: '最近7天数据', 
    filters: {},
    time: '今天 10:30'
  },
  { 
    name: '4年级数据', 
    filters: { grade: 4 },
    time: '昨天 15:45'
  },
  { 
    name: '道德与法治学科', 
    filters: { subjectId: 1 },
    time: '昨天 09:15'
  }
]);

// 处理学科变化
const handleSubjectChange = (subjectId) => {
  analysisStore.handleSubjectChange(subjectId);
};

// 应用筛选
const applyFilters = () => {
  // 保存到历史记录
  saveToHistory();
  analysisStore.applyFilters();
};

// 重置筛选
const resetFilters = () => {
  analysisStore.resetFilters();
};

// 保存到历史记录
const saveToHistory = () => {
  const now = new Date();
  const timeString = now.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  const dateString = now.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric'
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = now >= today;
  const timeLabel = isToday ? `今天 ${timeString}` : `${dateString} ${timeString}`;
  
  const filterName = generateFilterName();
  filterHistory.value.unshift({
    name: filterName,
    filters: { ...filterForm.value },
    time: timeLabel
  });
  
  // 只保留最近5条历史记录
  if (filterHistory.value.length > 5) {
    filterHistory.value = filterHistory.value.slice(0, 5);
  }
};

// 生成筛选名称
const generateFilterName = () => {
  const parts = [];
  if (filterForm.value.grade) {
    const grade = grades.value.find(g => g.id === filterForm.value.grade);
    if (grade) parts.push(`${grade.name}年级`);
  }
  if (filterForm.value.class) {
    const cls = classes.value.find(c => c.id === filterForm.value.class);
    if (cls) parts.push(`${cls.name}班`);
  }
  if (filterForm.value.subjectId) {
    const subject = subjects.value.find(s => s.id === filterForm.value.subjectId);
    if (subject) parts.push(subject.name);
  }
  if (filterForm.value.dateRange && filterForm.value.dateRange[0]) {
    parts.push('自定义时间');
  }
  return parts.length > 0 ? parts.join(' - ') : '默认筛选';
};

// 加载筛选预设
const loadFilterPreset = (preset) => {
  if (preset.filters) {
    // 应用预设筛选条件
    Object.assign(analysisStore.filterForm, preset.filters);
  }
};

// 保存筛选模板
const saveFilterTemplate = () => {
  const templateName = prompt('请输入模板名称：');
  if (templateName) {
    // 这里可以实现保存模板的逻辑
    alert(`模板 "${templateName}" 已保存`);
  }
};
</script>

<style scoped>
.filter-container {
  animation: fadeIn 0.5s ease-out;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.filter-icon {
  font-size: 20px;
  color: #409eff;
  transition: color 0.3s ease;
}

.filter-title:hover .filter-icon {
  color: #66b1ff;
}

.result-count {
  background-color: #ecf5ff;
  color: #409eff;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.1);
  transition: all 0.3s ease;
}

.result-count:hover {
  background-color: #e6f2ff;
  box-shadow: 0 3px 6px rgba(64, 158, 255, 0.15);
}

.count-icon {
  font-size: 14px;
}

.filter-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-actions .el-button {
  transition: all 0.3s ease;
}

.filter-actions .el-button:hover {
  transform: translateY(-1px);
}

.basic-filter {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: end;
  width: 100%;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 150px;
  flex: 1;
}

.filter-label {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  white-space: nowrap;
}

.filter-item .el-input,
.filter-item .el-select,
.filter-item .el-date-picker {
  width: 100%;
  min-width: 120px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 200px;
}

.btn-primary {
  padding: 10px 24px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  border-radius: 6px !important;
  transition: all 0.3s ease !important;
}

.btn-primary:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3) !important;
}

.btn-secondary {
  padding: 10px 24px !important;
  font-size: 14px !important;
  border-radius: 6px !important;
  transition: all 0.3s ease !important;
}

.btn-secondary:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.advanced-filter-section {
  margin-top: 16px;
}

.advanced-filter-content {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  margin-top: 8px;
  transition: all 0.3s ease;
}

/* 历史记录样式 */
.history-item {
  padding: 12px 16px !important;
  transition: all 0.2s ease;
}

.history-item:hover {
  background-color: #f5f7fa !important;
}

.history-item-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.history-time {
  font-size: 12px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .filter-actions {
    justify-content: flex-end;
  }
  
  .filter-row {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .filter-item {
    width: 100%;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    min-width: auto;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
