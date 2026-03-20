import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useQuestionStore } from './stores/questionStore'
import './styles/loading.css'
import './styles/global.css'

// 导入Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 立即挂载应用
app.mount('#app')

// 后台初始化数据库和加载数据
const questionStore = useQuestionStore()
questionStore.initialize().then(() => {
  // 重新加载数据到 store
  questionStore.loadData()
}).catch(error => {
  console.error('初始化数据失败:', error)
})