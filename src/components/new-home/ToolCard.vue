<template>
  <div class="tc" @click="handleClick">
    <!-- 悬停渐变动画层（纯装饰，pointer-events-none） -->
    <div class="tc__glow"></div>

    <!-- 卡片主体内容 -->
    <div class="tc__body">
      <!-- 上半：meta + 标题 -->
      <div class="tc__upper">
        <div class="tc__meta">
          <span class="tc__dot" :style="{ background: tool.avatarColor }"></span>
          <span class="tc__author">{{ tool.author }}</span>
          <span class="tc__views">{{ tool.views }} 次使用</span>
        </div>
        <h3 class="tc__name">{{ tool.name }}</h3>
      </div>

      <!-- 下半：封面渐变色块区域 -->
      <div class="tc__lower">
        <!-- 装饰性旋转渐变块 -->
        <div class="tc__deco" :style="decoStyle"></div>
        <!-- 主封面色块 -->
        <div class="tc__cover" :style="coverStyle"></div>
        <!-- 悬停按钮 -->
        <div class="tc__bar">
          <button class="tc__btn" @click.stop="handlePreview">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 19c4.68 0 7.84-4.26 9-6.1a1.6 1.6 0 0 0 0-1.8C19.84 9.3 16.68 5 12 5S4.16 9.3 3 11.1a1.6 1.6 0 0 0 0 1.8C4.16 14.7 7.32 19 12 19Zm0-2c-4.5 0-7-5-7-5s2.5-5 7-5 7 5 7 5-2.5 5-7 5Z"
                fill="currentColor"
              />
            </svg>
            预览详情
          </button>
          <button class="tc__btn tc__btn--sm" @click.stop="handleUse">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="m12 3.7 2.4 3.8a3 3 0 0 0 1.7 1.3l4.4 1.2-2.8 3.5a3 3 0 0 0-.7 2l.2 4.5-4.2-1.6a3 3 0 0 0-2.2 0l-4.2 1.6.2-4.5a3 3 0 0 0-.7-2L3.5 9.9l4.3-1.2A3 3 0 0 0 9.5 7.4L12 3.7Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { showMessage } from '@/utils/message'

const props = defineProps({
  tool: {
    type: Object,
    required: true,
    default: () => ({
      id: '',
      name: '',
      author: 'PSCG 官方',
      views: '0',
      avatarColor: '#3b82f6',
      gradientStart: '#dbeafe',
      gradientMid: '#3b82f6',
      gradientEnd: '#1d4ed8',
      gradientAlt: '#60a5fa',
      route: null
    })
  }
})

const decoStyle = computed(() => ({
  background: `linear-gradient(63deg, ${props.tool.gradientStart} -35%, ${props.tool.gradientMid} 17%, ${props.tool.gradientEnd} 56%, ${props.tool.gradientAlt} 93%)`
}))

const coverStyle = computed(() => ({
  background: `linear-gradient(135deg, ${props.tool.gradientMid} 0%, ${props.tool.gradientEnd} 100%)`
}))

const handleClick = () => {
  if (!props.tool.route) showMessage('功能开发中，敬请期待', 'info')
}
const handlePreview = () => {
  if (!props.tool.route) showMessage('功能开发中，敬请期待', 'info')
}
const handleUse = () => {
  if (!props.tool.route) showMessage('功能开发中，敬请期待', 'info')
}
</script>

<style scoped lang="scss" src="@/styles/scss/components/new-home/ToolCard.scss"></style>
