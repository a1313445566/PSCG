<template>
  <header class="figma-header" :class="{ 'is-scrolled': isScrolled }">
    <div class="header-container">
      <router-link to="/new" class="header-logo">
        <span class="logo-text">PSCG</span>
      </router-link>

      <nav class="header-nav">
        <a
          v-for="menu in navigationMenus"
          :key="menu.id"
          :href="menu.path"
          class="nav-link"
          :class="{ 'is-active': isActive(menu) }"
          @click.prevent="handleMenuClick(menu)"
        >
          {{ menu.name }}
        </a>
      </nav>

      <div class="header-actions">
        <button v-if="isAdminAuthenticated" class="admin-btn" @click="handleAdminClick">
          <Setting />
          <span>后台管理</span>
        </button>

        <button v-if="isAdminAuthenticated" class="logout-btn" @click="handleLogout">
          <SwitchButton />
          <span>退出登录</span>
        </button>

        <button v-else class="login-btn" @click="handleLogin">登录</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNavigationMenus } from '@/composables/useNavigationMenus'
import { SwitchButton, Setting } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const { fetchVisibleMenus } = useNavigationMenus()

const navigationMenus = ref([])
const isScrolled = ref(false)

const isAdminAuthenticated = computed(() => {
  return sessionStorage.getItem('adminAuthenticated') === 'true'
})

const loadNavigationMenus = async () => {
  try {
    const menus = await fetchVisibleMenus()
    navigationMenus.value = menus
  } catch (error) {
    console.error('加载导航菜单失败:', error)
    navigationMenus.value = [
      { id: 0, name: '首页', type: 'route', path: '/new', sort_order: 1 },
      { id: 0, name: '学习中心', type: 'route', path: '/home', sort_order: 2 },
      { id: 0, name: '帮助中心', type: 'route', path: '/', sort_order: 3 }
    ]
  }
}

const isActive = menu => {
  if (menu.type === 'route') {
    return route.path === menu.path
  }
  return false
}

const handleMenuClick = menu => {
  if (menu.type === 'route') {
    router.push(menu.path)
  } else if (menu.type === 'link') {
    window.open(menu.path, '_blank')
  }
}

const handleLogin = () => {
  sessionStorage.setItem('showPasswordDialog', 'true')
  router.push('/admin')
}

const handleAdminClick = () => {
  router.push('/admin')
}

const handleLogout = () => {
  sessionStorage.removeItem('adminToken')
  sessionStorage.removeItem('adminUsername')
  sessionStorage.removeItem('adminAuthenticated')
  router.push('/new')
}

const handleScroll = () => {
  isScrolled.value = window.scrollY > 10
}

onMounted(() => {
  loadNavigationMenus()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped lang="scss" src="@/styles/scss/components/new-home/FigmaHeader.scss"></style>
