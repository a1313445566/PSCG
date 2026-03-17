// 使用 API 与后端通信
// 自动检测当前环境：开发环境使用相对路径（通过Vite代理），生产环境使用远程服务器
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment 
  ? '/api'
  : import.meta.env.VITE_API_URL || '/api';

// 导入缓存模块
import { apiCache } from './apiCache.js';

// 导出API基础URL供其他模块使用
export const getApiBaseUrl = () => {
  return API_BASE_URL;
};

// 初始化数据库
export const initDatabase = async () => {
  // 后端会自动初始化数据库
  return true
}

// 获取所有学科
export const getSubjects = async () => {
  try {
    return await apiCache.getCached(`${API_BASE_URL}/subjects`);
  } catch (error) {

    return []
  }
}

// 获取所有题目
export const getQuestions = async () => {
  try {
    // 添加较大的limit参数，确保获取所有题目
    return await apiCache.getCached(`${API_BASE_URL}/questions?limit=1000`);
  } catch (error) {

    return []
  }
}

// 添加学科
export const addSubject = async (name, iconIndex = 0) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, iconIndex })
    })
    if (!response.ok) {
      throw new Error('添加学科失败')
    }
    return await response.json()
  } catch (error) {

    return null
  }
}

// 更新学科
export const updateSubject = async (subjectId, name, iconIndex = 0) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, iconIndex })
    })
    if (!response.ok) {
      throw new Error('更新学科失败')
    }
    return await response.json()
  } catch (error) {

    return null
  }
}

// 删除学科
export const deleteSubject = async (subjectId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      throw new Error('删除学科失败')
    }
    return true
  } catch (error) {

    return false
  }
}

// 添加子分类
export const addSubcategory = async (subjectId, name, iconIndex = 0) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}/subcategories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, iconIndex })
    })
    if (!response.ok) {
      throw new Error('添加子分类失败')
    }
    return await response.json()
  } catch (error) {

    return null
  }
}

// 更新子分类
export const updateSubcategory = async (subcategoryId, name, iconIndex = 0) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects/subcategories/${subcategoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, iconIndex })
    })
    if (!response.ok) {
      throw new Error('更新子分类失败')
    }
    return await response.json()
  } catch (error) {

    return null
  }
}

// 删除子分类
export const deleteSubcategory = async (subcategoryId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects/subcategories/${subcategoryId}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      throw new Error('删除子分类失败')
    }
    return true
  } catch (error) {

    return false
  }
}

// 添加题目
export const addQuestion = async (question) => {
  try {
    const response = await fetch(`${API_BASE_URL}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(question)
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '添加题目失败')
    }
    return await response.json()
  } catch (error) {

    return null
  }
}

// 更新题目
export const updateQuestion = async (updatedQuestion) => {
  try {
    const response = await fetch(`${API_BASE_URL}/questions/${updatedQuestion.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedQuestion)
    })
    if (!response.ok) {
      throw new Error('更新题目失败')
    }
    return await response.json()
  } catch (error) {

    return null
  }
}

// 删除题目
export const deleteQuestion = async (questionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      throw new Error('删除题目失败')
    }
    return true
  } catch (error) {

    return false
  }
}

// 清空所有数据
export const clearAllData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/data`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      throw new Error('清空数据失败')
    }
    return true
  } catch (error) {

    return false
  }
}

// 关闭数据库连接
export const closeDatabase = async () => {
  // 不需要关闭API连接
  return true
}

// 导入本地数据到SQL数据库
export const importLocalData = async () => {
  try {
    // 从localStorage获取数据
    const storedData = localStorage.getItem('quiz_data')
    if (!storedData) {
      throw new Error('localStorage中没有数据')
    }
    
    const data = JSON.parse(storedData)
    
    // 发送数据到后端API
    const response = await fetch(`${API_BASE_URL}/import-local-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data })
    })
    
    if (!response.ok) {
      throw new Error('导入数据失败')
    }
    
    return await response.json()
  } catch (error) {

    return { success: false, error: error.message }
  }
}

// 获取所有年级
export const getGrades = async () => {
  try {
    return await apiCache.getCached(`${API_BASE_URL}/grades`);
  } catch (error) {

    return []
  }
}

// 获取所有班级
export const getClasses = async () => {
  try {
    return await apiCache.getCached(`${API_BASE_URL}/classes`);
  } catch (error) {

    return []
  }
}

// 添加年级
export const addGrade = async (name) => {
  try {
    const response = await fetch(`${API_BASE_URL}/grades`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    })
    if (!response.ok) {
      throw new Error('添加年级失败')
    }
    return await response.json()
  } catch (error) {

    return null
  }
}

// 更新年级
export const updateGrade = async (gradeId, name) => {
  try {
    const response = await fetch(`${API_BASE_URL}/grades/${gradeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    })
    if (!response.ok) {
      throw new Error('更新年级失败')
    }
    return await response.json()
  } catch (error) {

    return null
  }
}

// 删除年级
export const deleteGrade = async (gradeId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/grades/${gradeId}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      throw new Error('删除年级失败')
    }
    return true
  } catch (error) {

    return false
  }
}

// 添加班级
export const addClass = async (name) => {
  try {
    const response = await fetch(`${API_BASE_URL}/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    })
    if (!response.ok) {
      throw new Error('添加班级失败')
    }
    return await response.json()
  } catch (error) {

    return null
  }
}

// 更新班级
export const updateClass = async (classId, name) => {
  try {
    const response = await fetch(`${API_BASE_URL}/classes/${classId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    })
    if (!response.ok) {
      throw new Error('更新班级失败')
    }
    return await response.json()
  } catch (error) {

    return null
  }
}

// 删除班级
export const deleteClass = async (classId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/classes/${classId}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      throw new Error('删除班级失败')
    }
    return true
  } catch (error) {

    return false
  }
}
