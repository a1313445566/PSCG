<template>
  <div class="new-home-view">
    <!-- Figma 风格导航栏 -->
    <FigmaHeader />

    <!-- Hero 渐变区域 -->
    <section class="hero-section">
      <div class="hero-gradient-bg"></div>
      <div class="hero-container">
        <div class="hero-content">
          <p class="hero-label">LEARNING PLATFORM</p>
          <h1 class="hero-title">智能学习，<br />触手可及</h1>
          <p class="hero-subtitle">
            全场景学习工具集 — 从练习到分析，一站式提升学习效率
          </p>
          <div class="hero-actions">
            <button class="hero-cta hero-cta--primary" @click="handleStartLearning">
              开始学习
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3.33334 8H12.6667M12.6667 8L8.00001 3.33333M12.6667 8L8.00001 12.6667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="hero-cta hero-cta--secondary" @click="handleExplore">
              探索功能
            </button>
          </div>
        </div>
        <div class="hero-visual">
          <div class="hero-card-stack">
            <div class="hero-float-card hero-float-card--1"></div>
            <div class="hero-float-card hero-float-card--2"></div>
            <div class="hero-float-card hero-float-card--3"></div>
          </div>
        </div>
      </div>
    </section>

    <div class="home-container">
      <main class="home-content">
        <!-- 产品卡片区域 -->
        <section class="product-cards">
          <div class="section-header">
            <span class="section-label">PRODUCTS</span>
            <h2 class="section-heading">核心功能</h2>
          </div>
          <div class="card-grid">
            <div
              v-for="(card, index) in productCards"
              :key="card.id || card.title"
              class="product-card"
              :class="{ 'is-active': activeCard === index }"
              @mouseenter="activeCard = index"
              @click="handleCardClick(card)"
              tabindex="0"
            >
              <div class="card-icon-wrap">
                <el-icon v-if="card.icon" :size="28">
                  <component :is="card.icon" />
                </el-icon>
                <img
                  v-else-if="card.iconUrl"
                  :src="card.iconUrl"
                  :alt="card.title"
                  style="width: 28px; height: 28px; object-fit: contain"
                />
              </div>
              <div class="card-info">
                <h3 class="card-title">{{ card.title }}</h3>
                <p class="card-description">{{ card.description }}</p>
              </div>
              <div class="card-arrow">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3.33334 8H12.6667M12.6667 8L8.00001 3.33333M12.6667 8L8.00001 12.6667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <span v-if="card.tag" class="card-tag" :class="'card-tag--' + card.tag">
                {{ card.tag.toUpperCase() }}
              </span>
            </div>
          </div>
        </section>

        <CmsContentSection />
        <LearningTools />
      </main>
    </div>

    <!-- Footer -->
    <footer class="figma-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <span class="footer-logo">PSCG</span>
          <span class="footer-divider">|</span>
          <span class="footer-slogan">智能学习平台</span>
        </div>
        <div class="footer-links">
          <a href="#" class="footer-link">关于我们</a>
          <a href="#" class="footer-link">使用条款</a>
          <a href="#" class="footer-link">隐私政策</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import CmsContentSection from '@/components/new-home/CmsContentSection.vue'
import LearningTools from '@/components/new-home/LearningTools.vue'
import FigmaHeader from '@/components/new-home/FigmaHeader.vue'
import { useProductCards } from '@/composables/useProductCards'
import { getIconComponent } from '@/config/elementIconsConfig'

const router = useRouter()
const activeCard = ref(null)
const productCards = ref([])

const { fetchVisibleCards } = useProductCards()

onMounted(async () => {
  try {
    const data = await fetchVisibleCards()
    productCards.value = data.map(card => ({
      ...card,
      icon: card.icon_type === 'element-plus' ? markRaw(getIconComponent(card.icon_name)) : null,
      iconUrl: card.icon_type === 'custom' ? card.icon_url : null,
      iconClass: card.icon_class || ''
    }))
  } catch (err) {
    console.error('[NewHomeView] 加载产品卡片失败:', err)
  }
})

const handleCardClick = card => {
  if (!card.link_type || !card.link_value) return
  if (card.link_type === 'route') {
    router.push(card.link_value)
  } else if (card.link_type === 'url') {
    window.open(card.link_value, '_blank')
  }
}

const handleStartLearning = () => {
  router.push('/home')
}

const handleExplore = () => {
  window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
}
</script>

<style scoped lang="scss" src="@/styles/scss/pages/_new-home-view.scss"></style>
