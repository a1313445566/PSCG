import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useQuestionStore } from './stores/questionStore'
import './styles/loading.css'

// 导入Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 初始化数据库
const questionStore = useQuestionStore()
questionStore.initialize().then(() => {
  // 重新加载数据到 store
  questionStore.loadData()
  app.mount('#app')
}).catch(error => {
  console.error('数据库初始化失败:', error)
  app.mount('#app')
})