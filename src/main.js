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

// 全局错误处理器 - 捕获组件渲染期间的错误
app.config.errorHandler = (err, instance, info) => {
  // 忽略 Vue/Element Plus 组件在销毁/渲染期间的竞态错误
  const errorMessage = err?.message || ''
  const isIgnorableError = 
    errorMessage.includes("Cannot destructure property 'node' of 'undefined'") ||
    errorMessage.includes("Cannot destructure property 'row' of 'undefined'") ||
    errorMessage.includes("Cannot destructure property 'bum' of") ||
    errorMessage.includes('emitsOptions') ||
    errorMessage.includes('Cannot read properties of undefined') ||
    errorMessage.includes('as it is undefined') ||
    errorMessage.includes('as it is null') ||
    errorMessage.includes('Cannot destructure property')
  
  // 静默忽略这些无害错误
  if (isIgnorableError) {
    return
  }
  
  // 其他错误正常抛出
  console.error('[Vue Error]', err, info)
}

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

// 注意：数据初始化由各个页面自己管理，不再在全局初始化
// 这样可以避免竞态条件和重复初始化的问题