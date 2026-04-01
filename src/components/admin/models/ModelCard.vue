<template>
  <el-card class="model-card" shadow="hover" :class="{ 'is-default': model.is_default }">
    <div class="card-header">
      <div class="status-dot" :class="{ active: model.is_active }"></div>
      <span v-if="model.is_default" class="default-badge">默认模型</span>
    </div>

    <h3 class="model-name">{{ model.name }}</h3>
    <div class="model-meta">
      <el-tag :type="getProviderColor(model.provider)" size="small">
        {{ model.provider }}
      </el-tag>
      <span class="model-id">{{ model.model_id }}</span>
    </div>

    <div class="model-config">
      <span v-if="model.config?.temperature">温度: {{ model.config.temperature }}</span>
      <span v-if="model.config?.max_tokens">Token: {{ model.config.max_tokens }}</span>
    </div>

    <div class="model-actions">
      <el-button size="small" @click="$emit('test', model)">测试</el-button>
      <el-button size="small" @click="$emit('edit', model)">编辑</el-button>
      <el-button
        v-if="!model.is_default"
        size="small"
        type="primary"
        text
        @click="$emit('setDefault', model)"
      >
        设为默认
      </el-button>
      <el-button
        v-if="!model.is_default"
        size="small"
        type="danger"
        text
        @click="$emit('delete', model)"
      >
        删除
      </el-button>
    </div>
  </el-card>
</template>

<script setup>
defineProps({
  model: {
    type: Object,
    required: true
  }
})

defineEmits(['edit', 'delete', 'test', 'setDefault'])

/**
 * 提供商颜色映射
 */
function getProviderColor(provider) {
  const colors = {
    scnet: 'primary',
    openai: 'success',
    deepseek: 'warning',
    dashscope: 'danger'
  }
  return colors[provider] || 'info'
}
</script>

<style scoped>
.model-card {
  margin-bottom: 20px;
  position: relative;
}

.model-card.is-default {
  border: 2px solid #409eff;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #c0c4cc;
}

.status-dot.active {
  background: #67c23a;
}

.default-badge {
  font-size: 12px;
  color: #409eff;
  font-weight: 500;
}

.model-name {
  margin: 0 0 12px 0;
  font-size: 16px;
}

.model-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.model-id {
  font-size: 12px;
  color: #909399;
}

.model-config {
  font-size: 12px;
  color: #606266;
  margin-bottom: 16px;
}

.model-config span {
  margin-right: 12px;
}

.model-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
