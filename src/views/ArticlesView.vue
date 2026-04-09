<template>
  <div class="articles-view">
    <FigmaHeader />

    <main class="articles-main">
      <div class="articles-container">
        <section class="articles-hero">
          <h1 class="hero-title">文章中心</h1>
          <p class="hero-subtitle">探索学习技巧、考试攻略和教育资讯</p>
        </section>

        <section class="articles-content">
          <div v-if="!loading" class="articles-grid">
            <CmsArticleCard
              v-for="(article, index) in articles"
              :key="article.id"
              :article="article"
              :style="{ transitionDelay: `${index * 30}ms` }"
            />
          </div>

          <div v-else class="loading-container">
            <SkeletonLoader :count="12" />
          </div>

          <div v-if="!loading && articles.length === 0" class="empty-state">
            <div class="empty-icon">📄</div>
            <h3 class="empty-title">暂无文章</h3>
            <p class="empty-subtitle">文章正在准备中，敬请期待</p>
          </div>

          <div v-if="hasMore && !loading" class="infinite-scroll-trigger" ref="loadMoreRef">
            <div class="infinite-scroll-loading">
              <span class="loading-text">加载中...</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import CmsArticleCard from '@/components/new-home/CmsArticleCard.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import FigmaHeader from '@/components/new-home/FigmaHeader.vue'
import api from '@/utils/api'
import showMessage from '@/utils/message'

const articles = ref([])
const loading = ref(true)
const hasMore = ref(true)
const loadMoreRef = ref(null)
let page = 1
const pageSize = 12

const loadArticles = async () => {
  if (!hasMore.value && articles.value.length > 0) return
  
  loading.value = true
  try {
    const res = await api.get('/articles', {
      params: {
        page: page,
        pageSize: pageSize
      }
    })
    
    const newArticles = res.data.articles
    articles.value = [...articles.value, ...newArticles]
    hasMore.value = res.data.pagination.total > articles.value.length
    
    if (newArticles.length > 0) {
      page++
    }
  } catch (error) {
    console.error('获取文章列表失败:', error)
    showMessage('获取文章列表失败', 'error')
  } finally {
    loading.value = false
  }
}

const handleIntersect = entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadArticles()
    }
  })
}

onMounted(() => {
  loadArticles()
  
  if (loadMoreRef.value) {
    const observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: '200px',
      threshold: 0
    })
    observer.observe(loadMoreRef.value)
  }
})

onUnmounted(() => {
  if (loadMoreRef.value) {
    const observer = new IntersectionObserver(handleIntersect)
    observer.unobserve(loadMoreRef.value)
  }
})
</script>

<style scoped lang="scss">
.articles-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.articles-main {
  flex: 1;
  margin-top: 64px;
  background: #ffffff;
}

.articles-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: $spacing-2xl $spacing-xl;
}

.articles-hero {
  text-align: center;
  margin-bottom: $spacing-3xl;

  .hero-title {
    font-size: 64px;
    font-weight: 400;
    color: #000000;
    line-height: 1.1;
    letter-spacing: -0.96px;
    margin: 0 0 $spacing-xl;

    @media (max-width: $breakpoint-lg) {
      font-size: 48px;
      letter-spacing: -0.72px;
    }

    @media (max-width: $breakpoint-md) {
      font-size: 36px;
      letter-spacing: -0.54px;
    }
  }

  .hero-subtitle {
    font-size: 20px;
    font-weight: 330;
    color: rgba(0, 0, 0, 0.65);
    line-height: 1.40;
    letter-spacing: -0.14px;
    margin: 0;

    @media (max-width: $breakpoint-md) {
      font-size: 18px;
    }
  }
}

.articles-content {
  margin-bottom: $spacing-2xl;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: $spacing-xl;
  margin-bottom: $spacing-2xl;
}

.loading-container {
  margin: $spacing-xl 0;
}

.empty-state {
  text-align: center;
  padding: $spacing-3xl 0;

  .empty-icon {
    font-size: 4rem;
    margin-bottom: $spacing-lg;
  }

  .empty-title {
    font-size: 24px;
    font-weight: 700;
    color: #000000;
    margin-bottom: $spacing-sm;
    letter-spacing: -0.24px;
  }

  .empty-subtitle {
    font-size: 16px;
    font-weight: 330;
    color: rgba(0, 0, 0, 0.55);
    margin: 0;
    letter-spacing: -0.14px;
  }
}

.infinite-scroll-trigger {
  width: 100%;
  height: 1px;
}

.infinite-scroll-loading {
  display: flex;
  justify-content: center;
  padding: $spacing-xl 0;

  .loading-text {
    font-size: 16px;
    font-weight: 330;
    color: rgba(0, 0, 0, 0.45);
    letter-spacing: -0.14px;
  }
}

@media (max-width: $breakpoint-xl) {
  .articles-container {
    max-width: 960px;
    padding: $spacing-xl $spacing-lg;
  }
}

@media (max-width: $breakpoint-lg) {
  .articles-container {
    max-width: 720px;
    padding: $spacing-xl $spacing-md;
  }

  .articles-hero {
    margin-bottom: $spacing-2xl;

    .hero-title {
      font-size: 48px;
      letter-spacing: -0.72px;
    }

    .hero-subtitle {
      font-size: 18px;
    }
  }

  .articles-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: $spacing-lg;
  }
}

@media (max-width: $breakpoint-md) {
  .articles-container {
    padding: $spacing-lg $spacing-md;
  }

  .articles-hero {
    margin-bottom: $spacing-xl;

    .hero-title {
      font-size: 36px;
      letter-spacing: -0.54px;
    }

    .hero-subtitle {
      font-size: 16px;
    }
  }

  .articles-grid {
    grid-template-columns: 1fr;
    gap: $spacing-md;
  }

  .empty-state {
    padding: $spacing-2xl 0;
  }
}
</style>
