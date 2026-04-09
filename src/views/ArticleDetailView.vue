<template>
  <div class="article-detail-view">
    <FigmaHeader />

    <main class="article-detail-main">
      <div class="article-detail-container">
        <!-- 返回按钮 -->
        <div class="back-section">
          <button class="back-btn" @click="goBack">
            <ArrowLeft />
            <span>返回文章列表</span>
          </button>
        </div>

        <!-- 文章内容 -->
        <article v-if="!loading && article" class="article-content">
          <!-- 文章头部 -->
          <header class="article-header">
            <h1 class="article-title">{{ article.title }}</h1>
            <div class="article-meta">
              <span v-if="article.author" class="meta-item">
                <User />
                <span>{{ article.author }}</span>
              </span>
              <span v-if="article.category_name" class="meta-item">
                <FolderOpened />
                <span>{{ article.category_name }}</span>
              </span>
              <span class="meta-item">
                <View />
                <span>{{ article.view_count }} 浏览</span>
              </span>
              <span class="meta-item">
                <Timer />
                <span>{{ formatDate(article.published_at || article.created_at) }}</span>
              </span>
            </div>
          </header>

          <!-- 文章封面图 -->
          <div v-if="article.thumbnail" class="article-thumbnail">
            <img :src="article.thumbnail" :alt="article.title" />
          </div>

          <!-- 文章摘要 -->
          <div v-if="article.summary" class="article-summary">
            {{ article.summary }}
          </div>

          <!-- 文章标签 -->
          <div v-if="article.tags && article.tags.length > 0" class="article-tags">
            <span
              v-for="tag in article.tags"
              :key="tag.id"
              class="tag-item"
            >
              {{ tag.name }}
            </span>
          </div>

          <!-- 文章正文 -->
          <div class="article-body" v-html="article.content"></div>
        </article>

        <!-- 加载状态 -->
        <div v-else-if="loading" class="loading-container">
          <SkeletonLoader :count="5" />
        </div>

        <!-- 文章不存在 -->
        <div v-else class="not-found">
          <div class="not-found-icon">🔍</div>
          <h3 class="not-found-title">文章不存在</h3>
          <p class="not-found-subtitle">抱歉，您访问的文章不存在或已被删除</p>
          <button class="back-btn" @click="goBack">
            <ArrowLeft />
            <span>返回文章列表</span>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { User, FolderOpened, View, Timer, ArrowLeft } from '@element-plus/icons-vue'
import FigmaHeader from '@/components/new-home/FigmaHeader.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import api from '@/utils/api'
import showMessage from '@/utils/message'

const route = useRoute()
const router = useRouter()

const article = ref(null)
const loading = ref(true)

const formatDate = dateString => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const goBack = () => {
  router.push('/articles')
}

const loadArticle = async () => {
  const id = route.params.id
  loading.value = true
  try {
    const res = await api.get(`/articles/${id}`)
    article.value = res.data
  } catch (error) {
    console.error('获取文章详情失败:', error)
    showMessage('获取文章详情失败', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadArticle()
})
</script>

<style scoped lang="scss">
.article-detail-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.article-detail-main {
  flex: 1;
  margin-top: 64px;
  background: #ffffff;
}

.article-detail-container {
  max-width: 800px;
  margin: 0 auto;
  padding: $spacing-2xl $spacing-xl;
}

.back-section {
  margin-bottom: $spacing-xl;

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: 16px;
    font-weight: 330;
    color: #000000;
    background: transparent;
    border: none;
    cursor: pointer;
    letter-spacing: -0.14px;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.65;
    }

    &:focus-visible {
      outline: dashed 2px #000000;
      outline-offset: 2px;
    }

    svg {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
    }
  }
}

.article-content {
  margin-bottom: $spacing-2xl;
}

.article-header {
  margin-bottom: $spacing-xl;

  .article-title {
    font-size: $font-size-4xl;
    font-weight: 400;
    color: #000000;
    line-height: 1.1;
    letter-spacing: -0.96px;
    margin: 0 0 $spacing-lg;

    @media (max-width: $breakpoint-lg) {
      font-size: $font-size-3xl;
      letter-spacing: -0.72px;
    }

    @media (max-width: $breakpoint-md) {
      font-size: $font-size-xl;
      letter-spacing: -0.54px;
    }
  }

  .article-meta {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-md;
    font-size: $font-size-base;
    font-weight: 330;
    color: rgba(0, 0, 0, 0.45);
    letter-spacing: -0.14px;

    .meta-item {
      display: flex;
      align-items: center;
      gap: $spacing-xs;

      svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        opacity: 0.55;
      }
    }
  }
}

.article-thumbnail {
  margin-bottom: $spacing-xl;

  img {
    width: 100%;
    height: auto;
    border-radius: $border-radius-sm;
    object-fit: cover;
  }
}

.article-summary {
  font-size: $font-size-xl;
  font-weight: 330;
  color: rgba(0, 0, 0, 0.65);
  line-height: 1.40;
  letter-spacing: -0.14px;
  margin-bottom: $spacing-xl;
  padding: $spacing-lg;
  background: rgba(0, 0, 0, 0.03);
  border-left: 4px solid #000000;
  border-radius: 6px;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
  margin-bottom: $spacing-xl;

  .tag-item {
    font-size: $font-size-sm;
    font-weight: 330;
    color: rgba(0, 0, 0, 0.55);
    padding: 6px 14px;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 50px;
    letter-spacing: -0.12px;
  }
}

.article-body {
  font-size: $font-size-base;
  font-weight: 330;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.65;
  letter-spacing: -0.14px;

  :deep(h1),
  :deep(h2),
  :deep(h3) {
    margin: $spacing-xl 0 $spacing-lg;
    font-weight: 700;
    color: #000000;
    letter-spacing: -0.2px;
  }

  :deep(h1) {
    font-size: $font-size-3xl;
    line-height: 1.1;
    letter-spacing: -0.72px;

    @media (max-width: $breakpoint-md) {
      font-size: $font-size-xl;
      letter-spacing: -0.48px;
    }
  }

  :deep(h2) {
    font-size: $font-size-2xl;
    line-height: 1.15;
    letter-spacing: -0.54px;

    @media (max-width: $breakpoint-md) {
      font-size: $font-size-lg;
      letter-spacing: -0.42px;
    }
  }

  :deep(h3) {
    font-size: $font-size-xl;
    line-height: 1.25;
    letter-spacing: -0.24px;

    @media (max-width: $breakpoint-md) {
      font-size: $font-size-md;
      letter-spacing: -0.3px;
    }
  }

  :deep(p) {
    margin-bottom: $spacing-lg;
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    margin: $spacing-xl 0;
    border-radius: 8px;
  }

  :deep(a) {
    color: #000000;
    text-decoration: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.2);

    &:hover {
      border-bottom-color: transparent;
      text-decoration: underline;
    }
  }

  :deep(ul),
  :deep(ol) {
    margin: $spacing-lg 0;
    padding-left: $spacing-xl;
    font-weight: 330;

    li {
      margin-bottom: $spacing-xs;
    }
  }

  :deep(blockquote) {
    margin: $spacing-xl 0;
    padding: $spacing-lg $spacing-xl;
    background: rgba(0, 0, 0, 0.03);
    border-left: 4px solid #000000;
    border-radius: 6px;
    font-size: $font-size-lg;
    font-weight: 320;
    color: rgba(0, 0, 0, 0.65);
    letter-spacing: -0.18px;
    line-height: 1.55;
  }

  :deep(code) {
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: $font-size-sm;
    font-weight: 400;
    color: #d63384;
    background: rgba(0, 0, 0, 0.03);
    padding: 2px 6px;
    border-radius: $border-radius-xs;
  }

  :deep(pre) {
    margin: $spacing-lg 0;
    padding: $spacing-xl;
    background: #000000;
    border-radius: $border-radius-sm;
    overflow-x: auto;

    code {
      color: #ffffff;
      background: transparent;
      padding: 0;
    }
  }

  :deep(table) {
    width: 100%;
    margin: $spacing-lg 0;
    border-collapse: collapse;

    th,
    td {
      padding: $spacing-md $spacing-lg;
      border: 1px solid rgba(0, 0, 0, 0.08);
      text-align: left;
    }

    th {
      background: rgba(0, 0, 0, 0.03);
      font-weight: 700;
    }
  }
}

.loading-container {
  margin: $spacing-xl 0;
}

.not-found {
  text-align: center;
  padding: $spacing-2xl 0;

  .not-found-icon {
    font-size: 4rem;
    margin-bottom: $spacing-lg;
  }

  .not-found-title {
    font-size: $font-size-xl;
    font-weight: 700;
    color: #000000;
    margin-bottom: $spacing-sm;
    letter-spacing: -0.24px;
  }

  .not-found-subtitle {
    font-size: $font-size-base;
    font-weight: 330;
    color: rgba(0, 0, 0, 0.55);
    margin: 0 0 $spacing-xl;
    letter-spacing: -0.14px;
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-base;
    font-weight: 330;
    color: #000000;
    background: transparent;
    border: none;
    cursor: pointer;
    letter-spacing: -0.14px;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.65;
    }

    &:focus-visible {
      outline: dashed 2px #000000;
      outline-offset: 2px;
    }

    svg {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
    }
  }
}

@media (max-width: $breakpoint-md) {
  .article-detail-container {
    padding: $spacing-xl $spacing-lg;
  }

  .back-section {
    margin-bottom: $spacing-lg;
  }

  .article-header {
    margin-bottom: $spacing-lg;

    .article-title {
      font-size: $font-size-xl;
      letter-spacing: -0.54px;
    }
  }

  .article-summary {
    font-size: $font-size-lg;
    padding: $spacing-md;
  }

  .article-body {
    :deep(h1) {
      font-size: $font-size-xl;
    }

    :deep(h2) {
      font-size: $font-size-lg;
    }

    :deep(h3) {
      font-size: $font-size-md;
    }
  }
}
</style>
