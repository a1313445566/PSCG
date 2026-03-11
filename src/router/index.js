import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/student'
  },
  {
    path: '/student',
    name: 'Student',
    component: () => import('../views/StudentView.vue')
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
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router