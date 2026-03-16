<template>
  <header class="app-header">
    <div class="header-content">
      <div class="header-left">
        <h1 class="app-title">{{ interfaceName }}</h1>
      </div>
      <div class="header-right">
        <div v-if="currentStudentId" class="user-info">
          <span class="user-name">{{ currentUserName || currentStudentId }}</span>
          <button class="logout-btn" @click="logout">退出登录</button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useSettingsStore } from '../../stores/questionStore'

const settingsStore = useSettingsStore()

// 界面名称
const interfaceName = computed(() => settingsStore.interfaceName)

// 组件挂载时加载设置
onMounted(async () => {
  await settingsStore.loadSettings()
})

// 用户信息
const currentStudentId = computed(() => localStorage.getItem('studentId'))
const currentUserName = computed(() => localStorage.getItem('userName'))

// 退出登录
const logout = () => {
  // 清除本地存储
  localStorage.removeItem('userId')
  localStorage.removeItem('studentId')
  localStorage.removeItem('userName')
  localStorage.removeItem('userGrade')
  localStorage.removeItem('userClass')
  
  // 刷新页面
  window.location.reload()
}
</script>

<style scoped>
.app-header {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  padding: 1.2rem 2rem;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  border-bottom: 4px solid var(--accent-color);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.app-title {
  font-family: var(--game-font);
  font-size: 2.2rem;
  font-weight: 900;
  color: white;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
  animation: pulse 2s infinite;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 0.8rem 1.5rem;
  border-radius: 50px;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.user-name {
  color: white;
  font-weight: 900;
  font-size: 1.1rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.logout-btn {
  background-color: var(--accent-color);
  color: var(--text-primary);
  border: 2px solid var(--accent-color);
  padding: 0.6rem 1.2rem;
  border-radius: 25px;
  font-weight: 900;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 0 #E6BF50;
}

.logout-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 7px 0 #E6BF50, 0 10px 15px rgba(255, 209, 102, 0.4);
}

.logout-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #E6BF50;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-header {
    padding: 1rem;
  }
  
  .app-title {
    font-size: 1.8rem;
  }
  
  .user-info {
    gap: 1rem;
    padding: 0.6rem 1.2rem;
  }
  
  .user-name {
    font-size: 1rem;
  }
  
  .logout-btn {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .app-title {
    font-size: 1.5rem;
  }
  
  .user-name {
    display: none;
  }
  
  .user-info {
    padding: 0.5rem 1rem;
  }
}
</style>