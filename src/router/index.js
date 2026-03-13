import { createRouter, createWebHashHistory } from 'vue-router'
import StudentView from '../views/StudentView.vue'
import AdminView from '../views/AdminView.vue'
import LeaderboardView from '../views/LeaderboardView.vue'

const routes = [
  {
    path: '/',
    redirect: '/student'
  },
  {
    path: '/student',
    name: 'Student',
    component: StudentView
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: LeaderboardView
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



export default router