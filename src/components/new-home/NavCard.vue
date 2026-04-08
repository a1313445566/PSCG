<template>
  <div class="nav-card" :class="{ disabled: card.disabled }" @click="handleClick">
    <div class="bg-layer">
      <div class="conic-gradient"></div>
      <div class="overlay"></div>
    </div>
    <div class="content-layer">
      <div class="card-inner">
        <div class="card-header-area">
          <div class="header-top">
            <span class="card-icon">{{ card.icon }}</span>
            <span v-if="card.usageCount" class="usage-count">
              {{ formatUsageCount(card.usageCount) }} 次查看
            </span>
          </div>
          <h3 class="card-title">{{ card.title }}</h3>
        </div>
        <div class="card-visual-area">
          <div class="visual-back"></div>
          <div class="visual-front">
            <span class="visual-icon">{{ card.icon }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { showMessage } from '@/utils/message'

const props = defineProps({
  card: {
    type: Object,
    required: true,
    default: () => ({
      id: '',
      icon: '',
      title: '',
      description: '',
      status: '',
      disabled: true,
      usageCount: 0
    })
  }
})

const formatUsageCount = count => {
  if (count >= 1000) {
    return (count / 1000).toFixed(0) + 'k'
  }
  return count
}

const handleClick = () => {
  if (props.card.disabled) {
    showMessage('功能开发中，敬请期待', 'info')
  }
}
</script>

<style scoped lang="scss">
@use 'sass:color';

.nav-card {
  position: relative;
  border-radius: $new-card-radius;
  overflow: hidden;
  cursor: pointer;
  width: 270px;
  height: 270px;
  background: $new-bg-card;
  border: 1px solid $new-border-color;
  transition: box-shadow 0.3s ease;
  container-type: size;

  &:hover:not(.disabled) {
    box-shadow:
      0 4px 8px -8px rgba(31, 35, 41, 0.06),
      0 6px 12px 0 rgba(31, 35, 41, 0.04),
      0 8px 24px 8px rgba(31, 35, 41, 0.04);

    .bg-layer {
      .conic-gradient {
        background: conic-gradient(
          from 0deg,
          #ffba82 0deg,
          #fca1b1 120deg,
          #8662f9 240deg,
          #ffba82 360deg
        );
        animation-play-state: running;
      }

      .overlay {
        background: transparent;
      }
    }

    .card-visual-area {
      .visual-back {
        transform: rotate(-10deg);
      }

      .visual-front {
        transform: translateY(-4px);
      }
    }
  }

  &.disabled {
    cursor: not-allowed;
  }

  .bg-layer {
    position: absolute;
    inset: 0;
    overflow: hidden;
    transform-origin: top left;
    pointer-events: none;

    .conic-gradient {
      position: absolute;
      left: -25cqw;
      top: -25cqh;
      height: max(150cqw, 150cqh);
      width: max(150cqw, 150cqh);
      background: $new-bg-card;
      transition: background 0.3s ease;
      animation: rotate_3s_linear_infinite 3s linear infinite paused;
    }

    .overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.02);
      transition: background 0.3s ease;
    }
  }

  .content-layer {
    position: absolute;
    inset: 0;
    z-index: 10;
    border-radius: $new-card-radius;
    border: 1px solid transparent;
    overflow: hidden;

    .card-inner {
      position: absolute;
      inset: 0;
      background: $new-bg-card;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
  }

  .card-header-area {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    padding: $spacing-md;
    padding-top: $spacing-md;
    padding-bottom: $spacing-sm;
  }

  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .card-icon {
      font-size: $font-size-2xl;
      line-height: 1;
    }

    .usage-count {
      font-size: $font-size-xs;
      color: $new-text-tertiary;
      white-space: nowrap;
    }
  }

  .card-title {
    font-size: $font-size-md;
    font-weight: 500;
    color: $new-text-primary;
    margin: 0;
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    word-break: break-all;
  }

  .card-visual-area {
    position: relative;
    margin-top: -$spacing-md;
    padding-top: $spacing-xl;
    overflow: hidden;
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;

    .visual-back {
      position: absolute;
      top: $spacing-3xl;
      width: 68.42%;
      height: auto;
      aspect-ratio: 182/198;
      transform: rotate(-18deg);
      transition: transform 0.3s ease-out;
      border-radius: $border-radius-sm;
      opacity: 0.1;
      background: linear-gradient(
        63deg,
        #c0dbff -35.1%,
        #519aff 16.58%,
        #1e7dff 56.4%,
        #a994fa 93.24%
      );
      box-shadow: 0 0 20px 0 rgba(0, 72, 94, 0.1);
    }

    .visual-front {
      position: relative;
      z-index: 10;
      margin-top: auto;
      transform: translateY(4px);
      width: 68.42%;
      aspect-ratio: 182/177;
      transition: transform 0.3s ease-out;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #dbeafe 0%, #f3e8ff 100%);
      border-radius: $border-radius-sm $border-radius-sm 0 0;
      box-shadow: 0 0 12px 0 rgba(0, 14, 71, 0.2);

      .visual-icon {
        font-size: $font-size-4xl;
      }
    }
  }
}

@keyframes rotate_3s_linear_infinite {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: $breakpoint-md) {
  .nav-card {
    .card-header-area {
      padding: $spacing-sm;

      .header-top {
        .card-icon {
          font-size: $font-size-xl;
        }

        .usage-count {
          font-size: $font-size-xs;
        }
      }

      .card-title {
        font-size: $font-size-sm;
      }
    }
  }
}
</style>
