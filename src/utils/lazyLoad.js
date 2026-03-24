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
};

/**
 * 创建懒加载观察器
 * @param {Object} config - 配置选项
 * @returns {IntersectionObserver}
 */
export function createLazyLoadObserver(config = {}) {
  const options = { ...defaultConfig, ...config };
  
  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        
        if (img.dataset.src) {
          // 加载图片
          img.src = img.dataset.src;
          delete img.dataset.src;
          
          // 添加加载完成样式
          img.addEventListener('load', () => {
            img.classList.add('loaded');
            img.classList.remove('loading');
          });
          
          img.addEventListener('error', () => {
            img.classList.remove('loading');
            img.classList.add('load-error');
            // 设置占位图或错误提示
            img.src = 'data:image/svg+xml,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100">
                <rect fill="#f5f5f5" width="200" height="100"/>
                <text x="100" y="55" text-anchor="middle" fill="#999" font-size="14">图片加载失败</text>
              </svg>
            `);
          });
        }
        
        // 停止观察
        options.observer?.unobserve(img) || entry.target._observer?.unobserve(img);
      }
    });
  }, {
    rootMargin: options.rootMargin,
    threshold: options.threshold
  });
}

/**
 * 应用懒加载到容器中的图片
 * @param {HTMLElement} container - 容器元素
 * @param {Object} config - 配置选项
 * @returns {IntersectionObserver}
 */
export function applyLazyLoadToContent(container, config = {}) {
  const options = { ...defaultConfig, ...config };
  
  // 查找所有图片
  const images = container.querySelectorAll('img[src]');
  const observer = createLazyLoadObserver(options);
  
  images.forEach(img => {
    // 只对 URL 图片启用懒加载，Base64 图片直接显示
    if (!img.src.startsWith('data:')) {
      // 保存原始 src
      img.dataset.src = img.src;
      
      // 设置占位符
      img.src = 'data:image/svg+xml,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100">
          <rect fill="#f5f5f5" width="200" height="100"/>
          <text x="100" y="55" text-anchor="middle" fill="#ccc" font-size="12">加载中...</text>
        </svg>
      `);
      
      img.classList.add('lazy-loading');
      
      // 保存观察器引用
      img._observer = observer;
      
      // 开始观察
      observer.observe(img);
    }
  });
  
  return observer;
}

/**
 * Vue 指令：v-lazy
 */
export const lazyLoadDirective = {
  mounted(el, binding) {
    const observer = createLazyLoadObserver();
    
    // 保存原始 src
    el.dataset.src = binding.value;
    
    // 设置占位符
    el.src = 'data:image/svg+xml,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100">
        <rect fill="#f5f5f5" width="200" height="100"/>
      </svg>
    `);
    
    el.classList.add('lazy-loading');
    el._observer = observer;
    
    observer.observe(el);
  },
  
  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      el.dataset.src = binding.value;
      
      // 重新观察
      if (el._observer) {
        el._observer.unobserve(el);
        el._observer.observe(el);
      }
    }
  },
  
  unmounted(el) {
    if (el._observer) {
      el._observer.disconnect();
      delete el._observer;
    }
  }
};

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
`;

/**
 * 注入懒加载样式到页面
 */
export function injectLazyLoadStyles() {
  if (typeof document === 'undefined') return;
  
  // 检查是否已注入
  if (document.getElementById('lazy-load-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'lazy-load-styles';
  style.textContent = lazyLoadStyles;
  document.head.appendChild(style);
}

/**
 * 检查浏览器是否支持 Intersection Observer
 * @returns {boolean}
 */
export function isLazyLoadSupported() {
  return typeof IntersectionObserver !== 'undefined';
}

export default {
  createLazyLoadObserver,
  applyLazyLoadToContent,
  lazyLoadDirective,
  lazyLoadStyles,
  injectLazyLoadStyles,
  isLazyLoadSupported
};
