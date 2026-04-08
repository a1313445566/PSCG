<template>
  <div class="cms-article-card" @click="handleClick">
    <div class="article-thumbnail">
      <div class="article-tag">PSCG</div>
    </div>
    <div class="article-content">
      <h3 class="article-title">{{ article.title }}</h3>
      <div class="article-footer">
        <span class="article-meta-item">
          <span class="meta-icon">📚</span>
          <span>1 篇文章</span>
        </span>
        <span class="article-meta-item">{{ article.date }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { showMessage } from '@/utils/message'

defineProps({
  article: {
    type: Object,
    required: true,
    default: () => ({
      id: 0,
      title: '',
      summary: '',
      date: '',
      thumbnail: null
    })
  }
})

const handleClick = () => {
  showMessage('文章详情功能开发中', 'info')
}
</script>

<style scoped lang="scss">
.cms-article-card {
  background: #ffffff;
  border-radius: 8px;
  padding: 0;
  box-shadow: none;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e5e6eb;
  overflow: hidden;

  &:hover {
    box-shadow: none;
    transform: none;
    border-color: $new-primary-light;
  }

  .article-thumbnail {
    width: 100%;
    height: 180px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    .article-tag {
      position: absolute;
      top: 16px;
      left: 16px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      color: #ffffff;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
  }

  .article-content {
    padding: 16px;

    .article-title {
      font-size: $font-size-lg;
      font-weight: 600;
      color: #000000;
      margin-bottom: 12px;
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .article-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .article-meta-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: $font-size-sm;
        color: $new-text-tertiary;

        .meta-icon {
          font-size: 14px;
        }
      }
    }
  }
}

@media (max-width: $breakpoint-md) {
  .cms-article-card {
    .article-thumbnail {
      height: 140px;
    }

    .article-content {
      padding: 12px;

      .article-title {
        font-size: $font-size-base;
        margin-bottom: 8px;
      }

      .article-footer {
        .article-meta-item {
          font-size: 12px;
        }
      }
    }
  }
}
</style>
