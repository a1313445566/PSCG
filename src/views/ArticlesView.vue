<template>
  <div class="articles-view">
    <div class="container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="page-title">文章中心</h1>
        <p class="page-subtitle">探索学习技巧、考试攻略和教育资讯</p>
      </div>

      <!-- 文章列表 -->
      <div v-if="!loading" class="articles-grid">
        <CmsArticleCard v-for="article in articles" :key="article.id" :article="article" />
      </div>

      <!-- 加载状态 -->
      <div v-else class="loading-container">
        <SkeletonLoader :count="12" />
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && articles.length === 0" class="empty-state">
        <div class="empty-icon">📄</div>
        <h3>暂无文章</h3>
        <p>文章正在准备中，敬请期待</p>
      </div>

      <!-- 分页 -->
      <div v-if="!loading && articles.length > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[12, 24, 36]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import CmsArticleCard from '@/components/new-home/CmsArticleCard.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import api from '@/utils/api'
import showMessage from '@/utils/message'

// 状态
const articles = ref([])
const loading = ref(true)
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

// 加载文章列表
const loadArticles = async () => {
  loading.value = true
  try {
    const res = await api.get('/articles', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value
      }
    })
    articles.value = res.data.articles
    total.value = res.data.pagination.total
  } catch (error) {
    console.error('获取文章列表失败:', error)
    showMessage('获取文章列表失败', 'error')
  } finally {
    loading.value = false
  }
}

// 分页处理
const handleSizeChange = size => {
  pageSize.value = size
  currentPage.value = 1
  loadArticles()
}

const handleCurrentChange = page => {
  currentPage.value = page
  loadArticles()
}

// 页面挂载时加载数据
onMounted(() => {
  loadArticles()
})
</script>

<style scoped lang="scss">
.articles-view {
  min-height: 100vh;
  padding: $spacing-lg 0;
  background: $bg-gradient-page;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 $spacing-md;
}

.page-header {
  text-align: center;
  margin-bottom: $spacing-xl;

  .page-title {
    font-size: $font-size-2xl;
    font-weight: 540;
    color: $text-primary;
    margin-bottom: $spacing-sm;
    letter-spacing: -0.5px;
  }

  .page-subtitle {
    font-size: $font-size-base;
    color: $text-secondary;
    margin: 0;
  }
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.loading-container {
  margin: $spacing-xl 0;
}

.empty-state {
  text-align: center;
  padding: $spacing-2xl 0;

  .empty-icon {
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
    margin: 0;
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: $spacing-xl;

  :deep(.el-pagination) {
    .el-pagination__sizes {
      margin-right: $spacing-md;
    }
  }
}
</style>
