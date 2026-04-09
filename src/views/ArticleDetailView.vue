<template>
  <div class="article-detail-view">
    <div class="container">
      <!-- 返回按钮 -->
      <div class="back-button">
        <el-button icon="ArrowLeft" plain @click="goBack">返回文章列表</el-button>
      </div>

      <!-- 文章内容 -->
      <div v-if="!loading && article" class="article-content">
        <!-- 文章头部 -->
        <div class="article-header">
          <h1 class="article-title">{{ article.title }}</h1>
          <div class="article-meta">
            <span v-if="article.author" class="meta-item">
              <el-icon><User /></el-icon>
              {{ article.author }}
            </span>
            <span v-if="article.category_name" class="meta-item">
              <el-icon><FolderOpened /></el-icon>
              {{ article.category_name }}
            </span>
            <span class="meta-item">
              <el-icon><View /></el-icon>
              {{ article.view_count }} 浏览
            </span>
            <span class="meta-item">
              <el-icon><Time /></el-icon>
              {{ formatDate(article.published_at || article.created_at) }}
            </span>
          </div>
        </div>

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
          <el-tag v-for="tag in article.tags" :key="tag.id" size="small" effect="plain">
            {{ tag.name }}
          </el-tag>
        </div>

        <!-- 文章正文 -->
        <div class="article-body" v-html="article.content"></div>
      </div>

      <!-- 加载状态 -->
      <div v-else-if="loading" class="loading-container">
        <SkeletonLoader :count="5" />
      </div>

      <!-- 文章不存在 -->
      <div v-else class="not-found">
        <div class="not-found-icon">🔍</div>
        <h3>文章不存在</h3>
        <p>抱歉，您访问的文章不存在或已被删除</p>
        <el-button @click="goBack">返回文章列表</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { User, FolderOpened, View, Time, ArrowLeft } from '@element-plus/icons-vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import api from '@/utils/api'
import showMessage from '@/utils/message'

// 路由
const route = useRoute()
const router = useRouter()

// 状态
const article = ref(null)
const loading = ref(true)

// 格式化日期
const formatDate = dateString => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 返回上一页
const goBack = () => {
  router.push('/articles')
}

// 加载文章详情
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

// 页面挂载时加载数据
onMounted(() => {
  loadArticle()
})
</script>

<style scoped lang="scss">
.article-detail-view {
  min-height: 100vh;
  padding: $spacing-lg 0;
  background: $bg-gradient-page;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 $spacing-md;
}

.back-button {
  margin-bottom: $spacing-lg;
}

.article-content {
  background: $white;
  border-radius: $border-radius-lg;
  padding: $spacing-xl;
  box-shadow: $shadow-md;
}

.article-header {
  margin-bottom: $spacing-lg;

  .article-title {
    font-size: $font-size-xl;
    font-weight: 540;
    color: $text-primary;
    margin-bottom: $spacing-md;
    line-height: 1.3;
    letter-spacing: -0.3px;
  }

  .article-meta {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-md;
    color: $text-secondary;
    font-size: $font-size-sm;

    .meta-item {
      display: flex;
      align-items: center;
      gap: $spacing-xs;

      :deep(.el-icon) {
        font-size: 14px;
      }
    }
  }
}

.article-thumbnail {
  margin-bottom: $spacing-lg;

  img {
    width: 100%;
    height: auto;
    border-radius: $border-radius-md;
    object-fit: cover;
  }
}

.article-summary {
  font-size: $font-size-base;
  line-height: 1.6;
  color: $text-secondary;
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  background: $bg-light;
  border-left: 4px solid $primary-color;
  border-radius: $border-radius-sm;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
  margin-bottom: $spacing-lg;
}

.article-body {
  font-size: $font-size-base;
  line-height: 1.8;
  color: $text-primary;

  :deep(h1),
  :deep(h2),
  :deep(h3) {
    margin: $spacing-lg 0 $spacing-md;
    color: $text-primary;
  }

  :deep(p) {
    margin-bottom: $spacing-md;
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    margin: $spacing-md 0;
    border-radius: $border-radius-sm;
  }

  :deep(a) {
    color: $primary-color;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(ul),
  :deep(ol) {
    margin: $spacing-md 0;
    padding-left: $spacing-lg;
  }

  :deep(li) {
    margin-bottom: $spacing-xs;
  }
}

.loading-container {
  margin: $spacing-xl 0;
}

.not-found {
  text-align: center;
  padding: $spacing-3xl 0;

  .not-found-icon {
    font-size: 4rem;
    margin-bottom: $spacing-md;
  }

  h3 {
    font-size: $font-size-lg;
    color: $text-primary;
    margin-bottom: $spacing-sm;
  }

  p {
    color: $text-secondary;
    margin-bottom: $spacing-lg;
  }
}

@media (max-width: 768px) {
  .article-content {
    padding: $spacing-lg;
  }

  .article-title {
    font-size: $font-size-lg !important;
  }
}
</style>
