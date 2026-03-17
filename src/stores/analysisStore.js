import { defineStore } from 'pinia';
import { getApiBaseUrl, getSubjects, getGrades, getClasses } from '../utils/database';

export const useAnalysisStore = defineStore('analysis', {
  state: () => ({
    // 分析数据
    analysisData: null,
    
    // 筛选条件
    filterForm: {
      studentId: '',
      grade: '',
      class: '',
      subjectId: '',
      subcategoryIds: [],
      dateRange: []
    },
    
    // 基础数据
    subjects: [],
    grades: [],
    classes: [],
    subcategories: [],
    
    // 图表类型
    chartTypes: {
      subject: 'bar',
      grade: 'bar',
      time: 'line',
      class: 'bar',
      subcategory: 'bar',
      timeSpent: 'bar',
      error: 'bar'
    },
    
    // 显示模式
    showMode: 'both', // both, chart, table
    
    // 卡片展开状态
    expandedCards: {
      subject: false,
      grade: false,
      time: false,
      class: false,
      subcategory: false,
      timeSpent: false,
      error: false,
      errorProne: true
    },
    
    // 错误率较高的题目分页
    errorProneCurrentPage: 1,
    errorPronePageSize: 10,
    
    // 加载状态
    loading: false,
    
    // 错误信息
    error: null
  }),
  
  getters: {
    // 分页后的错误率较高的题目
    paginatedErrorProneQuestions: (state) => {
      if (!state.analysisData || !state.analysisData.errorProneQuestions) {
        return [];
      }
      const start = (state.errorProneCurrentPage - 1) * state.errorPronePageSize;
      const end = start + state.errorPronePageSize;
      return state.analysisData.errorProneQuestions.slice(start, end);
    }
  },
  
  actions: {
    // 初始化数据
    async initData() {
      await Promise.all([
        this.loadSubjects(),
        this.loadGrades(),
        this.loadClasses()
      ]);
      await this.loadAnalysisData();
    },
    
    // 加载学科
    async loadSubjects() {
      try {
        this.subjects = await getSubjects();
      } catch (error) {
        // console.error('加载学科失败:', error);
        this.error = '加载学科失败';
      }
    },
    
    // 加载年级
    async loadGrades() {
      try {
        this.grades = await getGrades();
      } catch (error) {
        // console.error('加载年级失败:', error);
        this.error = '加载年级失败';
      }
    },
    
    // 加载班级
    async loadClasses() {
      try {
        this.classes = await getClasses();
      } catch (error) {
        // console.error('加载班级失败:', error);
        this.error = '加载班级失败';
      }
    },
    
    // 加载学科题库
    async loadSubcategories(subjectId) {
      if (!subjectId) {
        this.subcategories = [];
        return;
      }
      
      const API_BASE_URL = getApiBaseUrl();
      try {
        const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}/subcategories`);
        if (response.ok) {
          const data = await response.json();
          this.subcategories = data;
        }
      } catch (error) {
        // console.error('获取学科题库失败:', error);
        this.error = '获取学科题库失败';
      }
    },
    
    // 处理学科变化
    handleSubjectChange(subjectId) {
      this.filterForm.subcategoryIds = [];
      this.loadSubcategories(subjectId);
    },
    
    // 加载分析数据
    async loadAnalysisData() {
      // console.log('开始加载分析数据');
      this.loading = true;
      this.error = null;
      
      const API_BASE_URL = getApiBaseUrl();
      // console.log('API_BASE_URL:', API_BASE_URL);
      const { studentId, grade, class: className, subjectId, subcategoryIds, dateRange } = this.filterForm;
      
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
        const paramsString = params.toString();
        const url = paramsString ? `${API_BASE_URL}/analysis?${paramsString}` : `${API_BASE_URL}/analysis`;
        // console.log('请求URL:', url);
        const response = await fetch(url);
        // console.log('响应状态:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          // console.log('获取到的分析数据:', data);
          this.analysisData = data;
          // console.log('analysisData已设置:', this.analysisData);
        } else {
          throw new Error('获取分析数据失败');
        }
      } catch (error) {
        // console.error('获取分析数据失败:', error);
        this.error = '获取分析数据失败';
      } finally {
        this.loading = false;
        // console.log('加载完成，loading状态:', this.loading);
      }
    },
    
    // 应用筛选
    applyFilters() {
      this.loadAnalysisData();
    },
    
    // 重置筛选
    resetFilters() {
      this.filterForm = {
        studentId: '',
        grade: '',
        class: '',
        subjectId: '',
        subcategoryIds: [],
        dateRange: []
      };
      this.loadAnalysisData();
    },
    
    // 更新图表类型
    updateChartType(key, value) {
      this.chartTypes[key] = value;
    },
    
    // 更新显示模式
    updateShowMode(mode) {
      this.showMode = mode;
    },
    
    // 更新卡片展开状态
    updateExpandedCard(key, value) {
      this.expandedCards[key] = value;
    },
    
    // 更新错误率题目分页
    updateErrorPronePage(currentPage, pageSize) {
      if (currentPage !== undefined) {
        this.errorProneCurrentPage = currentPage;
      }
      if (pageSize !== undefined) {
        this.errorPronePageSize = pageSize;
        this.errorProneCurrentPage = 1;
      }
    },
    
    // 下载报告
    downloadReport(type) {
      if (type === 'excel') {
        const API_BASE_URL = getApiBaseUrl();
        const { studentId, grade, class: className, subjectId, subcategoryIds, dateRange } = this.filterForm;
        
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
      }
    }
  }
});
