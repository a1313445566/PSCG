<template>
  <div class="login-form-container">
    <div class="login-card">
      <div class="login-header">
        <h2 class="login-title">欢迎来到<span class="highlight">{{ interfaceName }}</span></h2>
        <p class="login-subtitle">请输入您的信息开始学习之旅</p>
      </div>
      <form @submit.prevent="saveStudentId" class="login-form">
        <div class="form-group">
          <label class="form-label">学号</label>
          <input 
            type="text" 
            v-model="inputStudentId" 
            placeholder="请输入2位学号" 
            class="form-input"
            required
            inputmode="numeric"
            maxlength="2"
            @input="inputStudentId = inputStudentId.replace(/[^0-9]/g, '').slice(0, 2)"
          />
        </div>
        <div class="form-group">
          <label class="form-label">姓名</label>
          <input 
            type="text" 
            v-model="inputName" 
            placeholder="请输入姓名（可选）" 
            class="form-input"
          />
        </div>
        <div class="form-row">
          <div class="form-group half">
            <label class="form-label">年级</label>
            <select v-model="inputGrade" class="form-select" required>
              <option value="">请选择年级</option>
              <option v-for="grade in grades" :key="grade" :value="grade">{{ grade }}年级</option>
            </select>
          </div>
          <div class="form-group half">
            <label class="form-label">班级</label>
            <select v-model="inputClass" class="form-select" required>
              <option value="">请选择班级</option>
              <option v-for="classNum in classes" :key="classNum" :value="classNum">{{ classNum }}班</option>
            </select>
          </div>
        </div>
        <button type="submit" class="login-btn" :disabled="isLoading">
          <span v-if="isLoading">登录中...</span>
          <span v-else>开始学习</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../stores/questionStore'
import { getApiBaseUrl } from '../../utils/database'
import { ElMessage } from 'element-plus'

const router = useRouter()

const settingsStore = useSettingsStore()

// 界面名称
const interfaceName = computed(() => settingsStore.interfaceName)

// 表单数据
const inputStudentId = ref('')
const inputName = ref('')
const inputGrade = ref('')
const inputClass = ref('')
const isLoading = ref(false)

// 年级和班级数据
const grades = ref([])
const classes = ref([])

// 加载年级和班级数据
const loadGradesAndClasses = async () => {
  try {
    // 获取年级列表
    const gradesResponse = await fetch(`${getApiBaseUrl()}/grades`)
    if (gradesResponse.ok) {
      const serverGrades = await gradesResponse.json()
      if (Array.isArray(serverGrades) && serverGrades.length > 0) {
        grades.value = serverGrades.map(grade => {
          if (typeof grade === 'object' && grade.name) {
            const gradeNum = parseInt(grade.name.match(/\d+/)?.[0] || '')
            return isNaN(gradeNum) ? parseInt(grade.id) || 1 : gradeNum
          } else if (typeof grade === 'number') {
            return grade
          } else {
            return 1
          }
        }).filter((value, index, self) => self.indexOf(value) === index).sort((a, b) => a - b)
      } else {
        grades.value = []
      }
    } else {
      grades.value = []
    }
    
    // 获取班级列表
    const classesResponse = await fetch(`${getApiBaseUrl()}/classes`)
    if (classesResponse.ok) {
      const serverClasses = await classesResponse.json()
      if (Array.isArray(serverClasses) && serverClasses.length > 0) {
        classes.value = serverClasses.map(classItem => {
          if (typeof classItem === 'object' && classItem.name) {
            const classNum = parseInt(classItem.name.match(/\d+/)?.[0] || '')
            return isNaN(classNum) ? parseInt(classItem.id) || 1 : classNum
          } else if (typeof classItem === 'number') {
            return classItem
          } else {
            return 1
          }
        }).filter((value, index, self) => self.indexOf(value) === index).sort((a, b) => a - b)
      } else {
        classes.value = []
      }
    } else {
      classes.value = []
    }
  } catch (error) {
    // console.error('加载年级和班级数据失败:', error)
    grades.value = []
    classes.value = []
  }
}

// 保存学号
const saveStudentId = async () => {
  if (!inputStudentId.value.trim()) {
    ElMessage.error('请输入学号')
    return
  }
  
  if (!inputGrade.value) {
    ElMessage.error('请选择年级')
    return
  }
  
  if (!inputClass.value) {
    ElMessage.error('请选择班级')
    return
  }
  
  isLoading.value = true
  
  try {
    // 处理学号格式，确保是两位数
    const formattedStudentId = inputStudentId.value.trim().padStart(2, '0')
    
    const response = await fetch(`${getApiBaseUrl()}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        studentId: formattedStudentId,
        name: inputName.value.trim(),
        grade: parseInt(inputGrade.value),
        class: parseInt(inputClass.value)
      })
    })
    
    if (response.ok) {
        const data = await response.json()
        localStorage.setItem('userId', data.userId)
        localStorage.setItem('studentId', formattedStudentId)
        localStorage.setItem('userName', data.name || '')
        localStorage.setItem('userGrade', inputGrade.value)
        localStorage.setItem('userClass', inputClass.value)
        localStorage.setItem('token', data.token)
        localStorage.setItem('tokenExpiresAt', Date.now() + (24 * 60 * 60 * 1000)) // 24小时过期
        sessionStorage.setItem('lastActivity', Date.now()) // 记录最后活动时间
        ElMessage.success('登录成功')
        
        // 跳转到首页
        router.push('/home')
      } else {
        ElMessage.error('登录失败')
      }
  } catch (error) {
    // console.error('登录失败:', error)
    ElMessage.error('登录失败，请检查网络连接')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await settingsStore.loadSettings()
  await loadGradesAndClasses()
})
</script>

<style scoped>
.login-form-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 2rem;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23F7FFF7"/><circle cx="20" cy="20" r="2" fill="%23FF6B6B" opacity="0.3"/><circle cx="80" cy="40" r="2" fill="%234ECDC4" opacity="0.3"/><circle cx="40" cy="80" r="2" fill="%23FFD166" opacity="0.3"/><circle cx="60" cy="60" r="2" fill="%2306D6A0" opacity="0.3"/></svg>');
  background-repeat: repeat;
}

.login-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
  padding: 3rem;
  width: 100%;
  max-width: 550px;
  animation: slideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 4px solid var(--accent-color);
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 8px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color), var(--accent-color));
}

.login-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.login-title {
  font-family: var(--game-font);
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.highlight {
  color: var(--primary-color);
  text-shadow: 2px 2px 4px rgba(255, 107, 107, 0.3);
  animation: pulse 2s infinite;
}

.login-subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin: 0;
  font-weight: 700;
  letter-spacing: 1px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.form-row {
  display: flex;
  gap: 1.2rem;
}

.form-group.half {
  flex: 1;
}

.form-label {
  font-weight: 900;
  color: var(--text-primary);
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.login-btn {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: white;
  border: 3px solid var(--primary-color);
  padding: 1.2rem;
  border-radius: 50px;
  font-size: 1.2rem;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  box-shadow: 0 6px 0 #D9534F;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: 0 10px 0 #D9534F, 0 15px 20px rgba(255, 107, 107, 0.4);
}

.login-btn:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #D9534F;
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-form-container {
    padding: 1rem;
  }
  
  .login-card {
    padding: 2.5rem;
  }
  
  .login-title {
    font-size: 1.8rem;
  }
  
  .form-row {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 2rem;
  }
  
  .login-title {
    font-size: 1.5rem;
  }
  
  .login-btn {
    padding: 1rem;
    font-size: 1.1rem;
  }
}
</style>