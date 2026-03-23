import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/loading.css'
import './styles/global.css'

// 导入Element Plus CSS (关键CSS，同步加载)
import 'element-plus/dist/index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 立即挂载应用
app.mount('#app')

// 隐藏加载动画
const loadingElement = document.getElementById('app-loading')
if (loadingElement) {
  loadingElement.style.opacity = '0'
  loadingElement.style.transition = 'opacity 0.3s ease'
  setTimeout(() => {
    loadingElement.remove()
  }, 300)
}

// 异步加载 Element Plus 组件库
import('element-plus').then(ElementPlus => {
  app.use(ElementPlus.default)
}).catch(err => {
  console.error('Element Plus 加载失败:', err)
})

// 后台加载数据
import { useQuestionStore } from './stores/questionStore'
const questionStore = useQuestionStore()
questionStore.initialize().catch(error => {
  console.error('初始化数据失败:', error)
})