import { createRouter, createWebHashHistory } from 'vue-router'
import { defineComponent, h } from 'vue'

// 错误页面组件
const RouteErrorComponent = defineComponent({
  name: 'RouteError',
  setup() {
    const reload = () => location.reload()
    return () =>
      h('div', { class: 'route-error' }, [
        h('h2', '页面加载失败'),
        h('p', '抱歉，页面加载失败，请刷新重试'),
        h('button', { onClick: reload }, '刷新页面')
      ])
  }
})

// 404 页面组件
const NotFoundComponent = defineComponent({
  name: 'NotFound',
  setup() {
    const goHome = () => (location.href = '#/')
    return () =>
      h('div', { class: 'not-found' }, [
        h('h2', '页面不存在'),
        h('p', '您访问的页面不存在'),
        h('a', { onClick: goHome, style: 'cursor: pointer;' }, '返回首页')
      ])
  }
})

// 路由懒加载 - 带错误处理（文件扩展名必须是静态的）
const lazyLoad = viewName => {
  return () =>
    import(`../views/${viewName}.vue`).catch(error => {
      console.error(`[路由加载失败] ${viewName}:`, error)
      return { default: RouteErrorComponent }
    })
}

const routes = [
  {
    path: '/',
    redirect: '/new'
  },
  {
    path: '/login',
    name: 'Login',
    component: lazyLoad('LoginView')
  },
  {
    path: '/home',
    name: 'Home',
    component: lazyLoad('HomeView')
  },
  {
    path: '/subcategory/:subjectId',
    name: 'Subcategory',
    component: lazyLoad('SubcategoryView')
  },
  {
    path: '/quiz/:subjectId/:subcategoryId',
    name: 'Quiz',
    component: lazyLoad('QuizView')
  },
  {
    path: '/result/:subjectId/:subcategoryId',
    name: 'Result',
    component: lazyLoad('ResultView')
  },

  {
    path: '/admin',
    name: 'Admin',
    component: lazyLoad('AdminView')
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: lazyLoad('LeaderboardView')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: lazyLoad('ProfileView')
  },
  {
    path: '/learning-progress',
    name: 'LearningProgress',
    component: lazyLoad('LearningProgressView')
  },
  {
    path: '/error-book',
    name: 'ErrorBook',
    component: lazyLoad('ErrorBookView')
  },
  {
    path: '/learning-report',
    name: 'LearningReport',
    component: lazyLoad('LearningReportView')
  },
  {
    path: '/answer-history',
    name: 'AnswerHistory',
    component: lazyLoad('AnswerHistoryView')
  },
  {
    path: '/docs',
    name: 'Docs',
    component: lazyLoad('DocsView')
  },
  {
    path: '/new',
    name: 'NewHome',
    component: lazyLoad('NewHomeView'),
    meta: { title: 'PSCG 智能学习' }
  },
  {
    path: '/articles',
    name: 'Articles',
    component: lazyLoad('ArticlesView'),
    meta: { title: '文章中心' }
  },
  {
    path: '/articles/:id',
    name: 'ArticleDetail',
    component: lazyLoad('ArticleDetailView'),
    meta: { title: '文章详情' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundComponent
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(_to, _from, _savedPosition) {
    // eslint-disable-line @typescript-eslint/no-unused-vars -- Vue Router API 要求
    // 始终滚动到顶部
    return { top: 0 }
  }
})

// 全局路由错误处理
router.onError(error => {
  console.error('[路由错误]', error)
  // 可以在这里添加错误上报
})

// 导航守卫：检查用户是否已登录
router.beforeEach((to, from, next) => {
  // 检查用户是否已登录
  const isLoggedIn = !!localStorage.getItem('studentId')

  // 允许访问后台管理页面、文档中心、新首页和文章中心，不需要学生登录
  if (to.path === '/admin' || to.path === '/docs' || to.path === '/new' || to.path.startsWith('/articles')) {
    next()
  }
  // 如果用户已登录
  else if (isLoggedIn) {
    // 检查token是否过期
    const tokenExpiresAt = localStorage.getItem('tokenExpiresAt')
    if (tokenExpiresAt && Date.now() > parseInt(tokenExpiresAt)) {
      // token过期，清除登录状态
      localStorage.clear()
      sessionStorage.clear()
      next('/login')
      return
    }

    // 检查会话是否超时（30分钟无活动）
    const lastActivity = sessionStorage.getItem('lastActivity')
    if (lastActivity && Date.now() - parseInt(lastActivity) > 30 * 60 * 1000) {
      // 会话超时，清除登录状态
      localStorage.clear()
      sessionStorage.clear()
      next('/login')
      return
    }

    // 更新最后活动时间
    sessionStorage.setItem('lastActivity', Date.now())

    // 如果要访问登录页面，重定向到首页
    if (to.path === '/login') {
      next('/home')
    } else {
      next()
    }
  }
  // 如果用户未登录且要访问非登录页面，重定向到登录页面
  else if (!isLoggedIn && to.path !== '/login') {
    next('/login')
  }
  // 其他情况正常导航
  else {
    next()
  }
})

export default router
