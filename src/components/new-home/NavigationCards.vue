<template>
  <section class="navigation-cards-section">
    <h2 class="section-title">学习工具</h2>
    <div class="cards-grid">
      <NavCard v-for="card in cards" :key="card.id" :card="card" />
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import NavCard from './NavCard.vue'
import { navigationCards } from '@/config/navigationConfig'

const cards = ref(navigationCards)
</script>

<style scoped lang="scss">
.navigation-cards-section {
  margin-bottom: $new-section-gap;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
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

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $new-card-gap;
    justify-items: center;
  }
}

@media (max-width: $breakpoint-xl) {
  .navigation-cards-section {
    .cards-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
}

@media (max-width: $breakpoint-lg) {
  .navigation-cards-section {
    .cards-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}

@media (max-width: $breakpoint-md) {
  .navigation-cards-section {
    max-width: 100%;
    margin-bottom: $new-section-gap-sm;

    .section-title {
      font-size: $font-size-xl;
      margin-bottom: $spacing-md;
    }

    .cards-grid {
      grid-template-columns: 1fr;
      gap: $new-card-gap-sm;
    }
  }
}
</style>
