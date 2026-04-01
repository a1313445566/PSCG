<template>
  <el-dialog
    :model-value="visible"
    :title="model ? '编辑模型' : '添加模型'"
    width="600px"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
      <el-form-item label="模型名称" prop="name">
        <el-input v-model="formData.name" placeholder="如: DeepSeek-R1" />
      </el-form-item>

      <el-form-item label="提供商" prop="provider">
        <el-select v-model="formData.provider" placeholder="选择提供商">
          <el-option label="SCNet" value="scnet" />
          <el-option label="OpenAI" value="openai" />
          <el-option label="DeepSeek" value="deepseek" />
          <el-option label="DashScope" value="dashscope" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>

      <el-form-item label="模型标识" prop="model_id">
        <el-input v-model="formData.model_id" placeholder="如: deepseek-chat" />
      </el-form-item>

      <el-form-item label="API 地址" prop="base_url">
        <el-input v-model="formData.base_url" placeholder="https://api.deepseek.com/v1" />
      </el-form-item>

      <el-form-item label="API 密钥" prop="api_key">
        <el-input
          v-model="formData.api_key"
          type="password"
          show-password
          placeholder="输入 API Key"
        />
      </el-form-item>

      <el-form-item label="最大 Token">
        <el-input-number v-model="formData.max_tokens" :min="256" :max="32768" />
      </el-form-item>

      <el-form-item label="温度">
        <el-slider v-model="formData.temperature" :min="0" :max="2" :step="0.1" show-input />
      </el-form-item>

      <el-form-item label="启用状态">
        <el-switch v-model="formData.is_active" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  model: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'submit'])

const formRef = ref(null)

const formData = reactive({
  id: null,
  name: '',
  provider: '',
  model_id: '',
  base_url: '',
  api_key: '',
  max_tokens: 4096,
  temperature: 0.6,
  is_active: true
})

const rules = {
  name: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  provider: [{ required: true, message: '请选择提供商', trigger: 'change' }],
  model_id: [{ required: true, message: '请输入模型标识', trigger: 'blur' }],
  base_url: [{ required: true, message: '请输入 API 地址', trigger: 'blur' }],
  api_key: [{ required: true, message: '请输入 API 密钥', trigger: 'blur' }]
}

// 监听 model 变化
watch(
  () => props.model,
  newModel => {
    if (newModel) {
      Object.assign(formData, {
        id: newModel.id,
        name: newModel.name,
        provider: newModel.provider,
        model_id: newModel.model_id,
        base_url: newModel.base_url,
        api_key: newModel.api_key || '',
        max_tokens: newModel.config?.max_tokens || 4096,
        temperature: newModel.config?.temperature || 0.6,
        is_active: newModel.is_active === 1
      })
    }
  },
  { immediate: true }
)

/**
 * 提交表单
 */
async function handleSubmit() {
  try {
    await formRef.value.validate()

    const submitData = {
      ...formData,
      config: {
        max_tokens: formData.max_tokens,
        temperature: formData.temperature
      }
    }

    // 如果是编辑且 API Key 未修改，不发送
    if (props.model && formData.api_key === '****') {
      delete submitData.api_key
    }

    emit('submit', submitData)
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

/**
 * 关闭对话框
 */
function handleClose() {
  formRef.value?.resetFields()
  Object.assign(formData, {
    id: null,
    name: '',
    provider: '',
    model_id: '',
    base_url: '',
    api_key: '',
    max_tokens: 4096,
    temperature: 0.6,
    is_active: true
  })
}
</script>
