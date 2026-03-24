import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/subcategory/:subjectId',
    name: 'Subcategory',
    component: () => import('../views/SubcategoryView.vue')
  },
  {
    path: '/quiz/:subjectId/:subcategoryId',
    name: 'Quiz',
    component: () => import('../views/QuizView.vue')
  },
  {
    path: '/result/:subjectId/:subcategoryId',
    name: 'Result',
    component: () => import('../views/ResultView.vue')
  },

  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/AdminView.vue')
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: () => import('../views/LeaderboardView.vue')
  },
  {
    path: '/docs',
    name: 'Docs',
    component: () => import('../views/DocsView.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 始终滚动到顶部
    return { top: 0 }
  }
})

// 导航守卫：检查用户是否已登录
router.beforeEach((to, from, next) => {
  // 检查用户是否已登录
  const isLoggedIn = !!localStorage.getItem('studentId')
  
  // 允许访问后台管理页面和文档中心，不需要学生登录
  if (to.path === '/admin' || to.path === '/docs') {
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