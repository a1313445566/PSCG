<template>
  <section class="learning-tools-section">
    <div class="section-header">
      <span class="section-label">TOOLS</span>
      <h2 class="section-heading">学习工具</h2>
    </div>
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

  .tools-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

@media (max-width: $breakpoint-xl) {
  .learning-tools-section {
    .tools-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }
  }
}

@media (max-width: $breakpoint-lg) {
  .learning-tools-section {
    .section-header {
      .section-heading {
        font-size: 32px;
        letter-spacing: -0.6px;
      }
    }

    .tools-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }
  }
}

@media (max-width: $breakpoint-md) {
  .learning-tools-section {
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

    .tools-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
  }
}
</style>
