<template>
  <div class="model-manager">
    <!-- 头部 -->
    <div class="model-header">
      <h2>模型管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleAddModel">添加模型</el-button>
    </div>

    <!-- 统计概览 -->
    <div class="model-stats">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card shadow="never">
            <div class="stat-item">
              <div class="stat-label">已启用模型</div>
              <div class="stat-value">{{ stats.active || 0 }} / {{ stats.total || 0 }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="never">
            <div class="stat-item">
              <div class="stat-label">默认模型</div>
              <div class="stat-value">{{ stats.defaultModel || '未设置' }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="never">
            <div class="stat-item">
              <div class="stat-label">总调用次数</div>
              <div class="stat-value">{{ stats.totalCalls || 0 }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Token 使用统计 -->
    <div class="token-stats-section">
      <TokenStats />
    </div>

    <!-- 模型卡片列表 -->
    <div v-loading="loading" class="model-list">
      <el-row :gutter="20">
        <el-col v-for="model in models" :key="model.id" :xs="24" :sm="12" :md="8">
          <ModelCard
            :model="model"
            @edit="handleEditModel"
            @delete="handleDeleteModel"
            @test="handleTestModel"
            @set-default="handleSetDefault"
          />
        </el-col>
      </el-row>

      <!-- 空状态 -->
      <el-empty v-if="!loading && models.length === 0" description="暂无模型，请添加" />
    </div>

    <!-- 模型表单对话框 -->
    <ModelForm v-model:visible="formVisible" :model="currentModel" @submit="handleSubmit" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { useModel } from './composables/useModel'
import ModelCard from './ModelCard.vue'
import ModelForm from './ModelForm.vue'
import TokenStats from '../chat/TokenStats.vue'
import message from '@/utils/message'

const {
  models,
  stats,
  loading,
  fetchModels,
  saveModel,
  deleteModel,
  testModel,
  setDefaultModel,
  fetchStats,
  cleanup
} = useModel()

const formVisible = ref(false)
const currentModel = ref(null)

onMounted(async () => {
  await Promise.all([fetchModels(), fetchStats()])
})

onUnmounted(() => {
  cleanup()
})

/**
 * 添加模型
 */
function handleAddModel() {
  currentModel.value = null
  formVisible.value = true
}

/**
 * 编辑模型
 */
function handleEditModel(model) {
  currentModel.value = { ...model, api_key: '****' }
  formVisible.value = true
}

/**
 * 删除模型
 */
async function handleDeleteModel(model) {
  try {
    await ElMessageBox.confirm(`确定删除模型"${model.name}"吗？`, '提示', {
      type: 'warning'
    })

    await deleteModel(model.id)
  } catch (error) {
    // 用户取消
  }
}

/**
 * 测试模型
 */
async function handleTestModel(model) {
  const result = await testModel(model.id)
  console.log('测试结果:', result)
}

/**
 * 设为默认
 */
async function handleSetDefault(model) {
  await setDefaultModel(model.id)
}

/**
 * 提交表单
 */
async function handleSubmit(formData) {
  await saveModel(formData)
  formVisible.value = false
}
</script>

<style scoped lang="scss">
.model-manager {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.model-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.model-header h2 {
  margin: 0;
}

.model-stats {
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 10px 0;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.model-list {
  min-height: 300px;
}

.token-stats-section {
  margin-bottom: 20px;
}
</style>
