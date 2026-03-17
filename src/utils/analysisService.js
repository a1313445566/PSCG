import { getApiBaseUrl } from './database';

// 分析数据服务
class AnalysisService {
  // 获取分析数据
  async getAnalysisData(filterParams = {}) {
    const API_BASE_URL = getApiBaseUrl();
    const { studentId, grade, class: className, subjectId, subcategoryIds, dateRange } = filterParams;
    
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
      const response = await fetch(url);
      
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('获取分析数据失败');
      }
    } catch (error) {
      // console.error('获取分析数据失败:', error);
      throw error;
    }
  }
  
  // 下载报告
  downloadReport(type, filterParams = {}) {
    const API_BASE_URL = getApiBaseUrl();
    const { studentId, grade, class: className, subjectId, subcategoryIds, dateRange } = filterParams;
    
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
  
  // 获取学科题库
  async getSubcategories(subjectId) {
    if (!subjectId) {
      return [];
    }
    
    const API_BASE_URL = getApiBaseUrl();
    try {
      const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}/subcategories`);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('获取学科题库失败');
      }
    } catch (error) {
      // console.error('获取学科题库失败:', error);
      throw error;
    }
  }
  
  // 格式化数据
  formatAnalysisData(data) {
    if (!data) return null;
    
    // 确保所有分析列表都存在
    const formattedData = {
      ...data,
      subjectAnalysisList: data.subjectAnalysisList || [],
      gradeAnalysisList: data.gradeAnalysisList || [],
      timeAnalysisList: data.timeAnalysisList || [],
      classAnalysisList: data.classAnalysisList || [],
      subcategoryAnalysisList: data.subcategoryAnalysisList || [],
      timeSpentAnalysisList: data.timeSpentAnalysisList || [],
      errorAnalysisList: data.errorAnalysisList || [],
      errorProneQuestions: data.errorProneQuestions || []
    };
    
    return formattedData;
  }
  
  // 计算统计数据
  calculateStats(data) {
    if (!data) {
      return {
        totalUsers: 0,
        totalSessions: 0,
        totalQuestions: 0,
        overallAccuracy: 0
      };
    }
    
    return {
      totalUsers: data.totalUsers || 0,
      totalSessions: data.totalSessions || 0,
      totalQuestions: data.totalQuestions || 0,
      overallAccuracy: data.overallAccuracy || 0
    };
  }
  
  // 生成图表数据
  generateChartData(type, data, chartType) {
    switch (type) {
      case 'subject':
        return this.generateSubjectChartData(data, chartType);
      case 'grade':
        return this.generateGradeChartData(data, chartType);
      case 'time':
        return this.generateTimeChartData(data, chartType);
      case 'class':
        return this.generateClassChartData(data, chartType);
      case 'subcategory':
        return this.generateSubcategoryChartData(data, chartType);
      case 'timeSpent':
        return this.generateTimeSpentChartData(data, chartType);
      case 'error':
        return this.generateErrorChartData(data, chartType);
      default:
        return null;
    }
  }
  
  // 生成学科图表数据
  generateSubjectChartData(data, chartType) {
    if (!data || !data.subjectAnalysisList) return null;
    
    const subjects = data.subjectAnalysisList.map(item => item.subject);
    const accuracies = data.subjectAnalysisList.map(item => item.accuracy);
    const questions = data.subjectAnalysisList.map(item => item.questions);
    
    return {
      subjects,
      accuracies,
      questions,
      chartType
    };
  }
  
  // 生成年级图表数据
  generateGradeChartData(data, chartType) {
    if (!data || !data.gradeAnalysisList) return null;
    
    const grades = data.gradeAnalysisList.map(item => item.grade + '年级');
    const accuracies = data.gradeAnalysisList.map(item => item.accuracy);
    
    return {
      grades,
      accuracies,
      chartType
    };
  }
  
  // 生成时间趋势图表数据
  generateTimeChartData(data, chartType) {
    if (!data || !data.timeAnalysisList) return null;
    
    const dates = data.timeAnalysisList.map(item => item.date);
    const accuracies = data.timeAnalysisList.map(item => item.accuracy);
    
    return {
      dates,
      accuracies,
      chartType
    };
  }
  
  // 生成班级图表数据
  generateClassChartData(data, chartType) {
    if (!data || !data.classAnalysisList) return null;
    
    const classes = data.classAnalysisList.map(item => item.class_num + '班');
    const accuracies = data.classAnalysisList.map(item => item.accuracy);
    
    return {
      classes,
      accuracies,
      chartType
    };
  }
  
  // 生成学科题库图表数据
  generateSubcategoryChartData(data, chartType) {
    if (!data || !data.subcategoryAnalysisList) return null;
    
    const subcategories = data.subcategoryAnalysisList.map(item => item.subcategory || '未分类');
    const accuracies = data.subcategoryAnalysisList.map(item => item.accuracy);
    
    return {
      subcategories,
      accuracies,
      chartType
    };
  }
  
  // 生成答题时间图表数据
  generateTimeSpentChartData(data, chartType) {
    if (!data || !data.timeSpentAnalysisList) return null;
    
    const timeRanges = data.timeSpentAnalysisList.map(item => item.time_range);
    const accuracies = data.timeSpentAnalysisList.map(item => item.accuracy);
    const sessions = data.timeSpentAnalysisList.map(item => item.sessions);
    
    return {
      timeRanges,
      accuracies,
      sessions,
      chartType
    };
  }
  
  // 生成错题分析图表数据
  generateErrorChartData(data, chartType) {
    if (!data || !data.errorAnalysisList) return null;
    
    const subjects = data.errorAnalysisList.map(item => item.subject);
    const errorRates = data.errorAnalysisList.map(item => item.error_rate);
    const errorCounts = data.errorAnalysisList.map(item => item.error_count);
    
    return {
      subjects,
      errorRates,
      errorCounts,
      chartType
    };
  }
}

export default new AnalysisService();
