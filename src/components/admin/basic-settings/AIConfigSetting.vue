<template>
  <el-card class="ai-config-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>
          <el-icon><Setting /></el-icon>
          AI 智能分析配置
        </span>
        <el-tag type="info" size="small">豆包 AI</el-tag>
      </div>
    </template>

    <el-form 
      ref="formRef" 
      :model="formData" 
      :rules="rules" 
      label-width="140px"
      v-loading="loading"
    >
      <!-- API Key -->
      <el-form-item label="API Key" prop="apiKey">
        <el-input 
          v-model="formData.apiKey" 
          type="password"
          placeholder="请输入豆包 API Key"
          show-password
          clearable
        >
          <template #prefix>
            <el-icon><Key /></el-icon>
          </template>
        </el-input>
        <div class="form-tip">
          <el-icon><InfoFilled /></el-icon>
          从豆包控制台获取 API Key
        </div>
      </el-form-item>

      <!-- API URL -->
      <el-form-item label="API 地址" prop="apiUrl">
        <el-input 
          v-model="formData.apiUrl" 
          placeholder="API 接口地址"
          clearable
        >
          <template #prefix>
            <el-icon><Link /></el-icon>
          </template>
        </el-input>
        <div class="form-tip">
          <el-icon><InfoFilled /></el-icon>
          默认: https://ark.cn-beijing.volces.com/api/v3
        </div>
      </el-form-item>

      <!-- Model -->
      <el-form-item label="模型 ID" prop="model">
        <el-input 
          v-model="formData.model" 
          placeholder="请输入模型 Endpoint ID"
          clearable
        >
          <template #prefix>
            <el-icon><Cpu /></el-icon>
          </template>
        </el-input>
        <div class="form-tip">
          <el-icon><InfoFilled /></el-icon>
          从豆包控制台创建推理接入点获取
        </div>
      </el-form-item>

      <!-- 功能开关 -->
      <el-form-item label="启用 AI 分析">
        <el-switch 
          v-model="formData.enabled"
          active-text="启用"
          inactive-text="禁用"
        />
      </el-form-item>

      <!-- 缓存设置 -->
      <el-form-item label="启用缓存">
        <el-switch 
          v-model="formData.cacheEnabled"
          active-text="启用"
          inactive-text="禁用"
        />
        <div class="form-tip">
          <el-icon><InfoFilled /></el-icon>
          启用缓存可减少 API 调用次数,节省成本
        </div>
      </el-form-item>

      <!-- 超时设置 -->
      <el-form-item label="超时时间">
        <el-input-number 
          v-model="formData.timeout"
          :min="10"
          :max="120"
          :step="10"
        />
        <span class="unit-label">秒</span>
      </el-form-item>

      <!-- 操作按钮 -->
      <el-form-item>
        <el-button type="primary" @click="handleSave" :loading="saving">
          <el-icon><Check /></el-icon>
          保存配置
        </el-button>
        <el-button @click="handleReset">
          <el-icon><RefreshRight /></el-icon>
          重置
        </el-button>
        <el-button type="success" @click="handleTest" :loading="testing" :disabled="!canTest">
          <el-icon><Connection /></el-icon>
          测试连接
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 测试结果 -->
    <el-alert
      v-if="testResult"
      :title="testResult.success ? '连接成功' : '连接失败'"
      :type="testResult.success ? 'success' : 'error'"
      :description="testResult.message"
      show-icon
      closable
      @close="testResult = null"
      class="test-result"
    />
  </el-card>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/utils/api'
import message from '@/utils/message'
import { 
  Setting, Key, Link, Cpu, InfoFilled, 
  Check, RefreshRight, Connection 
} from '@element-plus/icons-vue'

// 响应式数据
const formRef = ref(null)
const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const testResult = ref(null)

const formData = reactive({
  apiKey: '',
  apiUrl: 'https://ark.cn-beijing.volces.com/api/v3',
  model: '',
  enabled: true,
  cacheEnabled: true,
  timeout: 60
})

// 表单验证规则
const rules = {
  apiKey: [
    { required: true, message: '请输入 API Key', trigger: 'blur' }
  ],
  apiUrl: [
    { required: true, message: '请输入 API 地址', trigger: 'blur' }
  ],
  model: [
    { required: true, message: '请输入模型 ID', trigger: 'blur' }
  ]
}

// 是否可以测试
const canTest = computed(() => {
  return formData.apiKey && formData.apiUrl && formData.model
})

// 加载配置
const loadConfig = async () => {
  loading.value = true
  try {
    const result = await api.get('/settings')
    
    if (result.aiApiKey) formData.apiKey = result.aiApiKey
    if (result.aiApiUrl) formData.apiUrl = result.aiApiUrl
    if (result.aiModel) formData.model = result.aiModel
    if (result.aiEnabled !== undefined) formData.enabled = result.aiEnabled === 'true'
    if (result.aiCacheEnabled !== undefined) formData.cacheEnabled = result.aiCacheEnabled === 'true'
    if (result.aiTimeout) formData.timeout = parseInt(result.aiTimeout)
  } catch (error) {
    console.error('[AI配置] 加载失败:', error)
  } finally {
    loading.value = false
  }
}

// 保存配置
const handleSave = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    saving.value = true
    
    await api.post('/settings', {
      aiApiKey: formData.apiKey,
      aiApiUrl: formData.apiUrl,
      aiModel: formData.model,
      aiEnabled: formData.enabled.toString(),
      aiCacheEnabled: formData.cacheEnabled.toString(),
      aiTimeout: formData.timeout.toString()
    })
    
    // 重新加载 AI 服务配置
    await api.post('/ai/reload-config')
    
    message.actionSuccess('保存')
  } catch (error) {
    console.error('[AI配置] 保存失败:', error)
    // api 已自动显示错误
  } finally {
    saving.value = false
  }
}

// 重置
const handleReset = () => {
  loadConfig()
  testResult.value = null
}

// 测试连接
const handleTest = async () => {
  testing.value = true
  testResult.value = null
  
  try {
    const result = await api.post('/ai/test-connection', {
      apiKey: formData.apiKey,
      apiUrl: formData.apiUrl,
      model: formData.model
    }, {
      timeout: 30000,
      showError: false
    })
    
    testResult.value = {
      success: true,
      message: `AI 服务连接正常，模型: ${result.model || formData.model}`
    }
  } catch (error) {
    testResult.value = {
      success: false,
      message: error.response?.data?.error || error.message || '连接失败'
    }
  } finally {
    testing.value = false
  }
}

// 生命周期
onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.ai-config-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
}

.form-tip {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.unit-label {
  margin-left: 10px;
  color: #606266;
}

.test-result {
  margin-top: 20px;
}
</style>
