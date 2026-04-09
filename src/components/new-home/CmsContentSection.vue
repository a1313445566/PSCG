<template>
  <section class="cms-content-section">
    <div class="section-header">
      <span class="section-label">LATEST</span>
      <h2 class="section-heading">最新动态</h2>
    </div>
    <div class="articles-grid">
      <CmsArticleCard v-for="article in articles" :key="article.id" :article="article" />
    </div>
    <div class="view-more-wrapper">
      <button class="view-more-button" @click="handleViewMore">
        查看更多
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M3.33334 8H12.6667M12.6667 8L8.00001 3.33333M12.6667 8L8.00001 12.6667"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import CmsArticleCard from './CmsArticleCard.vue'
import api from '@/utils/api'
import { showMessage } from '@/utils/message'

const router = useRouter()
const articles = ref([])

// 加载最新文章
const loadLatestArticles = async () => {
  try {
    const res = await api.get('/articles', {
      params: {
        page: 1,
        pageSize: 4
      }
    })
    articles.value = res.data.articles
  } catch (error) {
    console.error('获取最新文章失败:', error)
    showMessage('获取最新文章失败', 'error')
  }
}

// 查看更多
const handleViewMore = () => {
  router.push('/articles')
}

// 页面挂载时加载数据
onMounted(() => {
  loadLatestArticles()
})
</script>

<style scoped lang="scss">
.cms-content-section {
  margin-bottom: $spacing-3xl;
  width: 100%;

  .section-header {
    margin-bottom: $spacing-xl;

    .section-label {
      display: block;
      font-size: 13px;
      font-weight: 400;
      letter-spacing: 2.2px;
      text-transform: uppercase;
      color: #000000;
      opacity: 0.45;
      margin-bottom: $spacing-sm;
      line-height: 1;
    }

    .section-heading {
      font-size: 42px;
      font-weight: 600;
      letter-spacing: -0.82px;
      line-height: 1.15;
      color: #000000;
      margin: 0;
    }
  }

  .articles-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .view-more-wrapper {
    display: flex;
    justify-content: center;
    margin-top: $spacing-xl;
  }

  .view-more-button {
    background: transparent;
    border: 1px solid rgba(0, 0, 0, 0.15);
    color: #000000;
    padding: 10px 28px;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: -0.1px;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.25s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;

    &:hover {
      border-color: #000000;
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }

    &:focus-visible {
      outline: dashed 2px #000000;
      outline-offset: 3px;
    }
  }
}

@media (max-width: $breakpoint-xl) {
  .cms-content-section {
    .articles-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }
  }
}

@media (max-width: $breakpoint-lg) {
  .cms-content-section {
    .section-header {
      .section-heading {
        font-size: 32px;
        letter-spacing: -0.6px;
      }
    }

    .articles-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }

    .view-more-button {
      padding: 9px 24px;
      font-size: 13px;
    }
  }
}

@media (max-width: $breakpoint-md) {
  .cms-content-section {
    .section-header {
      margin-bottom: $spacing-md;

      .section-label {
        font-size: 11px;
        letter-spacing: 1.8px;
      }

      .section-heading {
        font-size: 26px;
        letter-spacing: -0.46px;
      }
    }

    .articles-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .view-more-button {
      padding: 8px 20px;
      font-size: 13px;
    }
  }
}
</style>
