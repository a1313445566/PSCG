<template>
  <div class="new-home-view">
    <!-- 飞书风格顶部导航栏（独立组件） -->
    <FeishuHeader />

    <div class="home-container">
      <main class="home-content">
        <!-- 飞书风格产品卡片 -->
        <section class="product-cards">
          <div class="card-grid">
            <div
              v-for="(card, index) in productCards"
              :key="card.id || card.title"
              class="product-card"
              :class="{ 'is-active': activeCard === index }"
              @mouseenter="activeCard = index"
              @click="handleCardClick(card)"
            >
              <div class="card-body">
                <div class="card-main">
                  <div class="card-icon-wrap" :class="card.iconClass">
                    <el-icon v-if="card.icon" class="card-icon" :size="36">
                      <component :is="card.icon" />
                    </el-icon>
                    <img
                      v-else-if="card.iconUrl"
                      :src="card.iconUrl"
                      :alt="card.title"
                      style="width: 36px; height: 36px; object-fit: contain"
                    />
                  </div>
                  <div class="card-text">
                    <div class="card-title">{{ card.title }}</div>
                    <div class="card-description">{{ card.description }}</div>
                  </div>
                </div>
                <span v-if="card.tag" class="card-tag" :class="'card-tag--' + card.tag">
                  {{ card.tag.toUpperCase() }}
                </span>
                <el-icon class="card-arrow" :size="14"><ArrowRight /></el-icon>
              </div>
            </div>
          </div>
        </section>

        <CmsContentSection />
        <LearningTools />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import CmsContentSection from '@/components/new-home/CmsContentSection.vue'
import LearningTools from '@/components/new-home/LearningTools.vue'
import FeishuHeader from '@/components/new-home/FeishuHeader.vue'
import { ArrowRight } from '@element-plus/icons-vue'
import { useProductCards } from '@/composables/useProductCards'
import { getIconComponent } from '@/config/elementIconsConfig'

const router = useRouter()
const activeCard = ref(null)
const productCards = ref([])

const { fetchVisibleCards, loading: cardsLoading } = useProductCards()

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
</script>

<style scoped lang="scss" src="@/styles/scss/pages/_new-home-view.scss"></style>
