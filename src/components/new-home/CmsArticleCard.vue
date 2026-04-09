<template>
  <div class="cms-article-card" tabindex="0" @click="handleClick">
    <div class="article-visual">
      <img
        v-if="article.thumbnail"
        :src="article.thumbnail"
        :alt="article.title"
        class="article-image"
      />
      <div v-else class="article-gradient"></div>
      <span class="article-tag">{{ article.category_name || '文章' }}</span>
    </div>
    <div class="article-body">
      <h3 class="article-title">{{ article.title }}</h3>
      <div class="article-meta">
        <span class="meta-item">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path
              d="M2.66667 2.66667H13.3333C14.0667 2.66667 14.6667 3.26667 14.6667 4V12C14.6667 12.7333 14.0667 13.3333 13.3333 13.3333H2.66667C1.93333 13.3333 1.33333 12.7333 1.33333 12V4C1.33333 3.26667 1.93333 2.66667 2.66667 2.66667Z"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M14.6667 4L8 8.66667L1.33334 4"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          {{ article.view_count || 0 }} 浏览
        </span>
        <span class="meta-divider"></span>
        <span class="meta-item">{{ formatDate(article.published_at || article.created_at) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  article: {
    type: Object,
    required: true,
    default: () => ({
      id: 0,
      title: '',
      summary: '',
      view_count: 0,
      published_at: null,
      created_at: null,
      thumbnail: null,
      category_name: null
    })
  }
})

const { article } = props

// 格式化日期
const formatDate = dateString => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 点击跳转到详情页
const handleClick = () => {
  router.push(`/articles/${article.id}`)
}
</script>

<style scoped lang="scss">
.cms-article-card {
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.07);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    border-color: rgba(0, 0, 0, 0.12);
  }

  &:focus-visible {
    outline: dashed 2px #000000;
    outline-offset: 2px;
  }

  .article-visual {
    position: relative;
    width: 100%;
    height: 160px;
    overflow: hidden;

    .article-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .article-gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f43f5e 100%);
      opacity: 0.85;
    }

    .article-tag {
      position: absolute;
      top: 12px;
      left: 12px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.6px;
      padding: 3px 10px;
      border-radius: 50px;
      color: #ffffff;
      background: rgba(0, 0, 0, 0.25);
      backdrop-filter: blur(8px);
      line-height: 1.4;
    }
  }

  .article-body {
    padding: $spacing-md;

    .article-title {
      font-size: 15px;
      font-weight: 600;
      letter-spacing: -0.18px;
      line-height: 1.45;
      color: #000000;
      margin: 0 0 $spacing-sm;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .article-meta {
      display: flex;
      align-items: center;
      gap: 8px;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        font-weight: 330;
        letter-spacing: -0.08px;
        color: rgba(0, 0, 0, 0.45);

        svg {
          flex-shrink: 0;
          opacity: 0.55;
        }
      }

      .meta-divider {
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.2);
      }
    }
  }
}

@media (max-width: $breakpoint-md) {
  .cms-article-card {
    .article-visual {
      height: 130px;
    }

    .article-body {
      padding: 12px;

      .article-title {
        font-size: 14px;
        margin-bottom: 8px;
      }

      .article-meta {
        .meta-item {
          font-size: 11px;
        }
      }
    }
  }
}
</style>
