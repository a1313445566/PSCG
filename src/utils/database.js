// 使用 API 与后端通信
// 自动检测当前环境：开发环境使用相对路径（通过Vite代理），生产环境使用远程服务器
const isDevelopment = import.meta.env.DEV || true;
const API_BASE_URL = isDevelopment 
  ? '/api'
  : import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// 输出环境变量信息（仅在开发环境）
if (isDevelopment) {
  console.log('=== API 配置 ===');
  console.log('isDevelopment:', isDevelopment);
  console.log('API_BASE_URL:', API_BASE_URL);
}

// 导入缓存模块
import { apiCache } from './apiCache.js';

// 请求超时设置
const REQUEST_TIMEOUT = 30000;

// 通用请求函数
const fetchApi = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `请求失败: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接');
    }
    
    // 仅在开发环境输出错误日志
    if (isDevelopment) {
      console.error('API请求错误:', error);
    }
    
    throw error;
  }
};

// 导出API基础URL供其他模块使用
export const getApiBaseUrl = () => {
  return API_BASE_URL;
};

// 初始化数据库
export const initDatabase = async () => {
  try {
    // 后端会自动初始化数据库
    return true;
  } catch (error) {

    return false;
  }
};

// 获取所有学科
export const getSubjects = async () => {
  try {
    return await apiCache.getCached(`${API_BASE_URL}/subjects`);
  } catch (error) {

    return [];
  }
};

// 获取所有题目
export const getQuestions = async () => {
  try {
    // 添加较大的limit参数，确保获取所有题目
    return await apiCache.getCached(`${API_BASE_URL}/questions?limit=1000`);
  } catch (error) {

    return [];
  }
};

// 添加学科
export const addSubject = async (name, iconIndex = 0) => {
  try {
    return await fetchApi(`${API_BASE_URL}/subjects`, {
      method: 'POST',
      body: JSON.stringify({ name, iconIndex })
    });
  } catch (error) {

    return null;
  }
};

// 更新学科
export const updateSubject = async (subjectId, name, iconIndex = 0) => {
  try {
    return await fetchApi(`${API_BASE_URL}/subjects/${subjectId}`, {
      method: 'PUT',
      body: JSON.stringify({ name, iconIndex })
    });
  } catch (error) {

    return null;
  }
};

// 删除学科
export const deleteSubject = async (subjectId) => {
  try {
    await fetchApi(`${API_BASE_URL}/subjects/${subjectId}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {

    return false;
  }
};

// 添加子分类
export const addSubcategory = async (subjectId, name, iconIndex = 0, difficulty = 1) => {
  try {
    return await fetchApi(`${API_BASE_URL}/subjects/${subjectId}/subcategories`, {
      method: 'POST',
      body: JSON.stringify({ name, iconIndex, difficulty })
    });
  } catch (error) {

    return null;
  }
};

// 更新子分类
export const updateSubcategory = async (subcategoryId, name, iconIndex = 0, difficulty = 1) => {
  try {
    return await fetchApi(`${API_BASE_URL}/subjects/subcategories/${subcategoryId}`, {
      method: 'PUT',
      body: JSON.stringify({ name, iconIndex, difficulty })
    });
  } catch (error) {

    return null;
  }
};

// 删除子分类
export const deleteSubcategory = async (subcategoryId) => {
  try {
    await fetchApi(`${API_BASE_URL}/subjects/subcategories/${subcategoryId}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {

    return false;
  }
};

// 添加题目
export const addQuestion = async (question) => {
  try {
    return await fetchApi(`${API_BASE_URL}/questions`, {
      method: 'POST',
      body: JSON.stringify(question)
    });
  } catch (error) {

    return null;
  }
};

// 更新题目
export const updateQuestion = async (updatedQuestion) => {
  try {
    return await fetchApi(`${API_BASE_URL}/questions/${updatedQuestion.id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedQuestion)
    });
  } catch (error) {

    return null;
  }
};

// 删除题目
export const deleteQuestion = async (questionId) => {
  try {
    await fetchApi(`${API_BASE_URL}/questions/${questionId}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {

    return false;
  }
};

// 清空所有数据
export const clearAllData = async () => {
  try {
    await fetchApi(`${API_BASE_URL}/data`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {

    return false;
  }
};

// 关闭数据库连接
export const closeDatabase = async () => {
  // 不需要关闭API连接
  return true;
};

// 导入本地数据到SQL数据库
export const importLocalData = async () => {
  try {
    // 从localStorage获取数据
    const storedData = localStorage.getItem('quiz_data');
    if (!storedData) {
      throw new Error('localStorage中没有数据');
    }
    
    const data = JSON.parse(storedData);
    
    // 发送数据到后端API
    const response = await fetchApi(`${API_BASE_URL}/import-local-data`, {
      method: 'POST',
      body: JSON.stringify({ data })
    });
    
    return response;
  } catch (error) {

    return { success: false, error: error.message };
  }
};

// 获取所有年级
export const getGrades = async () => {
  try {
    return await apiCache.getCached(`${API_BASE_URL}/grades`);
  } catch (error) {

    return [];
  }
};

// 获取所有班级
export const getClasses = async () => {
  try {
    return await apiCache.getCached(`${API_BASE_URL}/classes`);
  } catch (error) {

    return [];
  }
};

// 添加年级
export const addGrade = async (name) => {
  try {
    return await fetchApi(`${API_BASE_URL}/grades`, {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  } catch (error) {

    return null;
  }
};

// 更新年级
export const updateGrade = async (gradeId, name) => {
  try {
    return await fetchApi(`${API_BASE_URL}/grades/${gradeId}`, {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
  } catch (error) {

    return null;
  }
};

// 删除年级
export const deleteGrade = async (gradeId) => {
  try {
    await fetchApi(`${API_BASE_URL}/grades/${gradeId}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {

    return false;
  }
};

// 添加班级
export const addClass = async (name) => {
  try {
    return await fetchApi(`${API_BASE_URL}/classes`, {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  } catch (error) {

    return null;
  }
};

// 更新班级
export const updateClass = async (classId, name) => {
  try {
    return await fetchApi(`${API_BASE_URL}/classes/${classId}`, {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
  } catch (error) {

    return null;
  }
};

// 删除班级
export const deleteClass = async (classId) => {
  try {
    await fetchApi(`${API_BASE_URL}/classes/${classId}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {

    return false;
  }
};

// 健康检查
export const healthCheck = async () => {
  try {
    const response = await fetchApi(`${API_BASE_URL}/data/health`);
    return response;
  } catch (error) {

    return { status: 'error', message: error.message };
  }
};
