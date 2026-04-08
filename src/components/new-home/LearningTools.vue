<template>
  <section class="learning-tools-section">
    <h2 class="section-title">学习工具</h2>
    <div class="tools-grid">
      <ToolCard v-for="tool in tools" :key="tool.id" :tool="tool" />
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import ToolCard from './ToolCard.vue'
import { teachingTools } from '@/config/toolsConfig'

const tools = ref(teachingTools)
</script>

<style scoped lang="scss">
.learning-tools-section {
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

  .tools-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $new-card-gap-lg;
  }
}

@media (max-width: $breakpoint-xl) {
  .learning-tools-section {
    min-width: auto;
    padding: 0 $spacing-md;
  }
}

@media (max-width: $breakpoint-lg) {
  .learning-tools-section {
    max-width: 100%;
    margin-bottom: $new-section-gap-sm;
    padding: 0 $spacing-md;

    .section-title {
      font-size: $font-size-xl;
      margin-bottom: $spacing-md;
    }

    .tools-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: $new-card-gap;
    }
  }
}

@media (max-width: $breakpoint-md) {
  .learning-tools-section {
    padding: 0 $spacing-sm;

    .section-title {
      font-size: $font-size-lg;
      margin-bottom: $spacing-sm;
    }

    .tools-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: $new-card-gap-sm;
    }
  }
}
</style>
