<template>
  <div class="tool-card" tabindex="0" @click="handleClick">
    <div class="tool-visual">
      <div class="visual-gradient" :style="coverStyle"></div>
      <div class="visual-icon-wrap">
        <span class="visual-dot" :style="{ background: tool.avatarColor }"></span>
      </div>
    </div>
    <div class="tool-body">
      <div class="tool-meta">
        <span class="tool-author">{{ tool.author }}</span>
        <span class="tool-views">{{ tool.views }} 次使用</span>
      </div>
      <h3 class="tool-name">{{ tool.name }}</h3>
      <div class="tool-actions">
        <button class="tool-btn" @click.stop="handlePreview">
          预览
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path
              d="M12 8C12 10.21 10.21 12 8 12C5.79 12 4 10.21 4 8C4 5.79 5.79 4 8 4C10.21 4 12 5.79 12 8Z"
              stroke="currentColor"
              stroke-width="1.3"
            />
            <path
              d="M2 8C2 8 4.68629 4 8 4C11.3137 4 14 8 14 8C14 8 11.3137 12 8 12C4.68629 12 2 8 2 8Z"
              stroke="currentColor"
              stroke-width="1.3"
            />
          </svg>
        </button>
        <button class="tool-btn tool-btn--icon" @click.stop="handleUse">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="m12.6667 7.33333-5.33334-4v2.66667c-3.33333 0-5.999996 2.13333-5.999996 5.3333 0.666666-1.3333 2.666666-2.4 5.999996-2.4V11.3333l5.33334-4Z"
              stroke="currentColor"
              stroke-width="1.3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
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
      avatarColor: '#000000',
      gradientStart: '#22c55e',
      gradientMid: '#a855f7',
      gradientEnd: '#ec4899',
      gradientAlt: '#f43f5e',
      route: null
    })
  }
})

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

<style scoped lang="scss">
.tool-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.07);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    border-color: rgba(0, 0, 0, 0.12);

    .tool-actions {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &:focus-visible {
    outline: dashed 2px #000000;
    outline-offset: 2px;
  }

  .tool-visual {
    position: relative;
    width: 100%;
    height: 140px;
    overflow: hidden;

    .visual-gradient {
      position: absolute;
      inset: 0;
      opacity: 0.85;
    }

    .visual-icon-wrap {
      position: absolute;
      bottom: -12px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2;

      .visual-dot {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
    }
  }

  .tool-body {
    padding: $spacing-md $spacing-md $spacing-md + 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .tool-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .tool-author {
      font-size: 12px;
      font-weight: 330;
      letter-spacing: -0.08px;
      color: rgba(0, 0, 0, 0.45);
    }

    .tool-views {
      font-size: 11px;
      font-weight: 340;
      letter-spacing: -0.06px;
      color: rgba(0, 0, 0, 0.35);
    }
  }

  .tool-name {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.18px;
    line-height: 1.4;
    color: #000000;
    margin: 0;
  }

  .tool-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    opacity: 0;
    transform: translateY(4px);
    transition: all 0.25s ease;
  }

  .tool-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px;
    border-radius: 50px;
    background: #000000;
    color: #ffffff;
    border: none;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: -0.06px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;

    &:hover {
      opacity: 0.85;
    }

    &--icon {
      width: 28px;
      height: 28px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;

      svg {
        width: 13px;
        height: 13px;
      }
    }
  }
}

@media (max-width: $breakpoint-md) {
  .tool-card {
    .tool-visual {
      height: 110px;

      .visual-icon-wrap .visual-dot {
        width: 30px;
        height: 30px;
        border-width: 2.5px;
      }
    }

    .tool-body {
      padding: 12px 12px 16px;
    }

    .tool-name {
      font-size: 14px;
    }

    .tool-actions {
      opacity: 1;
      transform: translateY(0);
    }

    .tool-btn {
      padding: 4px 10px;
      font-size: 10px;

      &--icon {
        width: 26px;
        height: 26px;
      }
    }
  }
}
</style>
