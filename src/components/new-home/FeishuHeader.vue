<template>
  <header class="feishu-header" :class="{ 'is-scrolled': isScrolled }">
    <div class="header-container">
      <!-- Logo（独立容器 - 最左侧） -->
      <router-link to="/new" class="logo">
        <img :src="logoImg" alt="PSCG" class="logo-img" />
      </router-link>

      <!-- 中间：导航菜单 -->
      <div class="header-center">
        <el-menu
          :default-active="activeMenu"
          mode="horizontal"
          :ellipsis="false"
          class="nav-menu"
          @select="handleMenuSelect"
        >
          <el-menu-item v-for="menu in navigationMenus" :key="menu.id" :index="menu.path">
            <el-icon v-if="menu.icon && getIconComponent(menu.icon)" class="menu-icon">
              <component :is="getIconComponent(menu.icon)" />
            </el-icon>
            {{ menu.name }}
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 右侧：登录按钮 -->
      <div class="header-right">
        <el-button type="primary" class="login-button" @click="handleLogin">登录</el-button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNavigationMenus } from '@/composables/useNavigationMenus'
import { getIconComponent as getConfigIconComponent } from '@/config/elementIconsConfig'
import logoImg from '../../../public/images/logo.png'

const router = useRouter()
const route = useRoute()
const { fetchVisibleMenus } = useNavigationMenus()

// 根据名称获取图标组件（使用配置文件）
const getIconComponent = iconName => {
  return getConfigIconComponent(iconName)
}

// 导航菜单数据（从API加载）
const navigationMenus = ref([])

const activeMenu = computed(() => route.path)

// 加载导航菜单数据
const loadNavigationMenus = async () => {
  try {
    const menus = await fetchVisibleMenus()
    navigationMenus.value = menus
  } catch (error) {
    console.error('加载导航菜单失败:', error)
    // 使用默认菜单作为降级处理
    navigationMenus.value = [
      { id: 0, name: '首页', type: 'route', path: '/new', sort_order: 1 },
      { id: 0, name: '产品功能', type: 'route', path: '/', sort_order: 2 },
      { id: 0, name: '解决方案', type: 'route', path: '/', sort_order: 3 },
      { id: 0, name: '帮助中心', type: 'route', path: '/', sort_order: 4 }
    ]
  }
}

// 处理菜单选择
const handleMenuSelect = index => {
  // 查找对应的菜单项
  const menu = navigationMenus.value.find(m => m.path === index)

  if (menu) {
    if (menu.type === 'link') {
      // 外部链接：在新窗口打开
      window.open(menu.path, '_blank')
    } else if (menu.type === 'route') {
      // 内部路由：在新窗口打开
      const baseUrl = window.location.origin + window.location.pathname
      const fullUrl = `${baseUrl}#${index}`
      window.open(fullUrl, '_blank')
    }
  }
}

// 登录按钮点击
const handleLogin = () => {
  router.push('/admin')
}

// 滚动阴影状态
const isScrolled = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 10
}

// 组件挂载时加载数据
onMounted(() => {
  loadNavigationMenus()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped lang="scss" src="@/styles/scss/components/new-home/FeishuHeader.scss"></style>
