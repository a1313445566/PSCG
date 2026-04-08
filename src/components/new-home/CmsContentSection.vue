<template>
  <section class="cms-content-section">
    <h2 class="section-title">最新动态</h2>
    <div class="articles-grid">
      <CmsArticleCard v-for="article in articles" :key="article.id" :article="article" />
    </div>
    <div class="view-more-wrapper">
      <el-button class="view-more-button" @click="handleViewMore">
        查看更多
        <span class="arrow-icon">→</span>
      </el-button>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { showMessage } from '@/utils/message'
import CmsArticleCard from './CmsArticleCard.vue'
import { cmsArticles } from '@/config/mockCmsData'

const articles = ref(cmsArticles)

const handleViewMore = () => {
  showMessage('更多文章功能开发中', 'info')
}
</script>

<style scoped lang="scss">
.cms-content-section {
  margin-bottom: $new-section-gap;
  width: 100%;
  min-width: 848px;
  max-width: 1184px;
  position: relative;
  margin: 0 auto;
  padding: 0 $spacing-lg;

  .section-title {
    font-size: 45px;
    font-weight: 600;
    color: $new-text-primary;
    margin-bottom: $spacing-lg;
    text-align: center;
    border-left: none;
    padding-left: 0;
  }

  .articles-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $new-card-gap;
  }

  .view-more-wrapper {
    display: flex;
    justify-content: center;
    margin-top: $spacing-xl;
  }

  .view-more-button {
    background: transparent;
    border: 2px solid #e5e6eb;
    color: $new-text-primary;
    padding: $spacing-md $spacing-xl;
    font-size: $font-size-base;
    font-weight: 500;
    border-radius: 9999px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: $spacing-sm;

    &:hover {
      border-color: $new-primary;
      color: $new-primary;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }

    &:active {
      transform: translateY(0);
    }

    .arrow-icon {
      transition: transform 0.3s ease;
    }

    &:hover .arrow-icon {
      transform: translateX(4px);
    }
  }
}

@media (max-width: $breakpoint-xl) {
  .cms-content-section {
    min-width: auto;
    padding: 0 $spacing-md;
  }
}

@media (max-width: $breakpoint-lg) {
  .cms-content-section {
    max-width: 100%;
    margin-bottom: $new-section-gap-sm;
    padding: 0 $spacing-md;

    .section-title {
      font-size: $font-size-xl;
      margin-bottom: $spacing-md;
    }

    .articles-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: $new-card-gap-sm;
    }

    .view-more-button {
      padding: $spacing-sm $spacing-lg;
      font-size: $font-size-sm;
    }
  }
}

@media (max-width: $breakpoint-md) {
  .cms-content-section {
    padding: 0 $spacing-sm;

    .articles-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}
</style>
