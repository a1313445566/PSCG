import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useQuestionStore } from './stores/questionStore'
import { seedTestData } from './utils/seedData'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 初始化数据库
const questionStore = useQuestionStore()
questionStore.initialize().then(() => {
  // 添加测试数据
  seedTestData()
  // 重新加载数据到 store
  questionStore.loadData()
  app.mount('#app')
}).catch(error => {
  console.error('数据库初始化失败:', error)
  app.mount('#app')
})