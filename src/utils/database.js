const isDevelopment = import.meta.env.DEV

if (isDevelopment) {
  console.log('=== API 配置 ===')
  console.log('isDevelopment:', isDevelopment)
}

import { api } from './api.js'

export const initDatabase = async () => {
  return true
}

export const getSubjects = async () => {
  try {
    return await api.get('/subjects')
  } catch (error) {
    return []
  }
}

export const getQuestions = async () => {
  try {
    return await api.get('/questions', { limit: 1000 })
  } catch (error) {
    return []
  }
}

export const addSubject = async (name, iconIndex = 0) => {
  try {
    return await api.post('/subjects', { name, iconIndex })
  } catch (error) {
    return null
  }
}

export const updateSubject = async (subjectId, name, iconIndex = 0, showInHistoryQuiz = false) => {
  try {
    return await api.put(`/subjects/${subjectId}`, {
      name,
      iconIndex,
      showInHistoryQuiz
    })
  } catch (error) {
    return null
  }
}

export const deleteSubject = async subjectId => {
  try {
    await api.delete(`/subjects/${subjectId}`)
    return true
  } catch (error) {
    return false
  }
}

export const addSubcategory = async (subjectId, name, iconIndex = 0, difficulty = 1) => {
  try {
    return await api.post(`/subjects/${subjectId}/subcategories`, {
      name,
      iconIndex,
      difficulty
    })
  } catch (error) {
    return null
  }
}

export const updateSubcategory = async (subcategoryId, name, iconIndex = 0, difficulty = 1) => {
  try {
    return await api.put(`/subjects/subcategories/${subcategoryId}`, {
      name,
      iconIndex,
      difficulty
    })
  } catch (error) {
    return null
  }
}

export const deleteSubcategory = async subcategoryId => {
  try {
    await api.delete(`/subjects/subcategories/${subcategoryId}`)
    return true
  } catch (error) {
    return false
  }
}

export const addQuestion = async question => {
  try {
    return await api.post('/questions', question)
  } catch (error) {
    return null
  }
}

export const updateQuestion = async updatedQuestion => {
  try {
    return await api.put(`/questions/${updatedQuestion.id}`, updatedQuestion)
  } catch (error) {
    return null
  }
}

export const deleteQuestion = async questionId => {
  try {
    await api.delete(`/questions/${questionId}`)
    return true
  } catch (error) {
    return false
  }
}

export const clearAllData = async () => {
  try {
    await api.delete('/data')
    return true
  } catch (error) {
    return false
  }
}

export const closeDatabase = async () => {
  return true
}

export const importLocalData = async () => {
  try {
    const storedData = localStorage.getItem('quiz_data')
    if (!storedData) {
      throw new Error('localStorage中没有数据')
    }

    const data = JSON.parse(storedData)
    const response = await api.post('/import-local-data', { data })

    return response
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const getGrades = async () => {
  try {
    return await api.get('/grades')
  } catch (error) {
    return []
  }
}

export const getClasses = async () => {
  try {
    return await api.get('/classes')
  } catch (error) {
    return []
  }
}

export const addGrade = async name => {
  try {
    return await api.post('/grades', { name })
  } catch (error) {
    return null
  }
}

export const updateGrade = async (gradeId, name) => {
  try {
    return await api.put(`/grades/${gradeId}`, { name })
  } catch (error) {
    return null
  }
}

export const deleteGrade = async gradeId => {
  try {
    await api.delete(`/grades/${gradeId}`)
    return true
  } catch (error) {
    return false
  }
}

export const addClass = async name => {
  try {
    return await api.post('/classes', { name })
  } catch (error) {
    return null
  }
}

export const updateClass = async (classId, name) => {
  try {
    return await api.put(`/classes/${classId}`, { name })
  } catch (error) {
    return null
  }
}

export const deleteClass = async classId => {
  try {
    await api.delete(`/classes/${classId}`)
    return true
  } catch (error) {
    return false
  }
}

export const healthCheck = async () => {
  try {
    const response = await api.get('/data/health')
    return response
  } catch (error) {
    return { status: 'error', message: error.message }
  }
}
