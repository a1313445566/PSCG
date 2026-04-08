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
              :key="card.title"
              class="product-card"
              :class="{ 'is-active': activeCard === index }"
              @mouseenter="activeCard = index"
            >
              <div class="card-body">
                <div class="card-main">
                  <div class="card-icon-wrap" :class="card.iconClass">
                    <el-icon class="card-icon" :size="22">
                      <component :is="card.icon" />
                    </el-icon>
                  </div>
                  <div class="card-text">
                    <div class="card-title">{{ card.title }}</div>
                    <div class="card-description">{{ card.description }}</div>
                  </div>
                </div>
                <span v-if="card.tag" class="card-tag" :class="'card-tag--' + card.tag">{{ card.tag.toUpperCase() }}</span>
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
import { ref } from 'vue'
import CmsContentSection from '@/components/new-home/CmsContentSection.vue'
import LearningTools from '@/components/new-home/LearningTools.vue'
import FeishuHeader from '@/components/new-home/FeishuHeader.vue'
import { Reading, UserFilled, DataAnalysis, Monitor, MagicStick, Connection, ArrowRight } from '@element-plus/icons-vue'

const activeCard = ref(null)

const productCards = [
  {
    title: '课程管理',
    description: '让课程管理更简单高效',
    icon: Reading,
    iconClass: '',
    tag: null
  },
  {
    title: '班级管理',
    description: '轻松管理班级信息',
    icon: UserFilled,
    iconClass: 'card-icon--purple',
    tag: null
  },
  {
    title: '数据统计',
    description: '实时查看学习数据',
    icon: DataAnalysis,
    iconClass: 'card-icon--pink',
    tag: null
  },
  {
    title: 'AI 辅导',
    description: '智能辅导学习',
    icon: Monitor,
    iconClass: 'card-icon--green',
    tag: 'hot'
  },
  {
    title: '智能推荐',
    description: '个性化学习推荐',
    icon: MagicStick,
    iconClass: 'card-icon--orange',
    tag: null
  },
  {
    title: '知识图谱',
    description: '构建知识网络',
    icon: Connection,
    iconClass: 'card-icon--indigo',
    tag: null
  }
]
</script>

<style scoped lang="scss" src="@/styles/scss/pages/_new-home-view.scss"></style>
