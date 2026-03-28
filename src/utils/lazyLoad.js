/**
 * 图片懒加载工具
 * 使用 Intersection Observer API 实现
 */

/**
 * 懒加载配置
 */
const defaultConfig = {
  rootMargin: '100px', // 提前 100px 开始加载
  threshold: 0.1,
  fadeInDuration: 300 // 淡入动画时长（毫秒）
}

/**
 * 创建懒加载观察器
 * @param {Object} config - 配置选项
 * @returns {IntersectionObserver}
 */
export function createLazyLoadObserver(config = {}) {
  const options = { ...defaultConfig, ...config }

  return new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target

          if (img.dataset.src) {
            // 使用统一的加载函数
            loadImage(img)
          }

          // 停止观察
          options.observer?.unobserve(img) || entry.target._observer?.unobserve(img)
        }
      })
    },
    {
      rootMargin: options.rootMargin,
      threshold: options.threshold
    }
  )
}

/**
 * 检查元素是否在视口内
 * @param {HTMLElement} element - 元素
 * @param {number} margin - 边距
 * @returns {boolean}
 */
function isInViewport(element, margin = 100) {
  if (!element || !element.getBoundingClientRect) return true // 无法检测时默认在视口内

  const rect = element.getBoundingClientRect()
  const windowHeight = window.innerHeight || document.documentElement.clientHeight
  const windowWidth = window.innerWidth || document.documentElement.clientWidth

  return (
    rect.top <= windowHeight + margin &&
    rect.bottom >= -margin &&
    rect.left <= windowWidth + margin &&
    rect.right >= -margin
  )
}

/**
 * 加载单张图片
 * @param {HTMLImageElement} img - 图片元素
 */
function loadImage(img) {
  if (!img.dataset.src) return

  // 先添加事件监听器
  const onLoad = () => {
    img.classList.add('loaded')
    img.classList.remove('lazy-loading')
    img.removeEventListener('load', onLoad)
    img.removeEventListener('error', onError)
  }

  const onError = () => {
    img.classList.remove('lazy-loading')
    img.classList.add('load-error')
    img.src =
      'data:image/svg+xml,' +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100">
        <rect fill="#f5f5f5" width="200" height="100"/>
        <text x="100" y="55" text-anchor="middle" fill="#999" font-size="14">图片加载失败</text>
      </svg>
    `)
    img.removeEventListener('load', onLoad)
    img.removeEventListener('error', onError)
  }

  img.addEventListener('load', onLoad)
  img.addEventListener('error', onError)

  // 然后设置 src
  img.src = img.dataset.src
  delete img.dataset.src
}

/**
 * 应用懒加载到容器中的图片
 * @param {HTMLElement} container - 容器元素
 * @param {Object} config - 配置选项
 * @returns {IntersectionObserver|null}
 */
export function applyLazyLoadToContent(container, config = {}) {
  if (!container) return null

  const options = { ...defaultConfig, ...config }

  // 查找所有图片
  const images = container.querySelectorAll('img[src]')
  const observer = createLazyLoadObserver(options)

  images.forEach(img => {
    // 获取原始 src 属性（而非解析后的 img.src）
    const originalSrc = img.getAttribute('src') || ''

    // 只对 URL 图片启用懒加载，Base64 图片和 data URI 直接显示
    // 检查原始属性，避免浏览器自动解析的影响
    if (originalSrc.startsWith('data:')) {
      // base64 或 data URI，不处理
      return
    }

    // 检查是否已经被懒加载处理过
    if (img.dataset.src || img.classList.contains('lazy-loading')) {
      return
    }

    // 保存原始 src
    img.dataset.src = originalSrc

    // 检查是否已在视口内
    if (isInViewport(img, parseInt(options.rootMargin) || 100)) {
      // 已在视口内，直接加载
      loadImage(img)
      return
    }

    // 设置占位符
    img.src =
      'data:image/svg+xml,' +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100">
        <rect fill="#f5f5f5" width="200" height="100"/>
        <text x="100" y="55" text-anchor="middle" fill="#ccc" font-size="12">加载中...</text>
      </svg>
    `)

    img.classList.add('lazy-loading')

    // 保存观察器引用
    img._observer = observer

    // 开始观察
    observer.observe(img)
  })

  return observer
}

/**
 * Vue 指令：v-lazy
 */
export const lazyLoadDirective = {
  mounted(el, binding) {
    const observer = createLazyLoadObserver()

    // 保存原始 src
    el.dataset.src = binding.value

    // 设置占位符
    el.src =
      'data:image/svg+xml,' +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100">
        <rect fill="#f5f5f5" width="200" height="100"/>
      </svg>
    `)

    el.classList.add('lazy-loading')
    el._observer = observer

    observer.observe(el)
  },

  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      el.dataset.src = binding.value

      // 重新观察
      if (el._observer) {
        el._observer.unobserve(el)
        el._observer.observe(el)
      }
    }
  },

  unmounted(el) {
    if (el._observer) {
      el._observer.disconnect()
      delete el._observer
    }
  }
}

/**
 * 懒加载样式
 * 可以注入到页面中
 */
export const lazyLoadStyles = `
/* 懒加载占位符样式 */
img.lazy-loading {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: lazy-shimmer 1.5s infinite;
  min-height: 100px;
  object-fit: contain;
}

/* 加载完成动画 */
img.loaded {
  animation: lazy-fadeIn 0.3s ease-in;
}

/* 加载错误样式 */
img.load-error {
  opacity: 0.6;
  filter: grayscale(1);
}

/* 骨架屏动画 */
@keyframes lazy-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* 淡入动画 */
@keyframes lazy-fadeIn {
  from { 
    opacity: 0;
    transform: scale(0.98);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}
`

/**
 * 注入懒加载样式到页面
 */
export function injectLazyLoadStyles() {
  if (typeof document === 'undefined') return

  // 检查是否已注入
  if (document.getElementById('lazy-load-styles')) return

  const style = document.createElement('style')
  style.id = 'lazy-load-styles'
  style.textContent = lazyLoadStyles
  document.head.appendChild(style)
}

/**
 * 检查浏览器是否支持 Intersection Observer
 * @returns {boolean}
 */
export function isLazyLoadSupported() {
  return typeof IntersectionObserver !== 'undefined'
}

export default {
  createLazyLoadObserver,
  applyLazyLoadToContent,
  lazyLoadDirective,
  lazyLoadStyles,
  injectLazyLoadStyles,
  isLazyLoadSupported
}
