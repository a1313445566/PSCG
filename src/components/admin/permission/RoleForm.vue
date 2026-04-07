<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'
import message from '@/utils/message'
import PermissionTree from './PermissionTree.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  role: {
    type: Object,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'submit'])

const formRef = ref(null)
const form = ref({
  name: '',
  description: '',
  permissions: {}
})

const loading = ref(false)

const resetForm = () => {
  if (props.isEdit && props.role) {
    form.value = {
      name: props.role.name,
      description: props.role.description || '',
      permissions: typeof props.role.permissions === 'string' 
        ? JSON.parse(props.role.permissions) 
        : props.role.permissions || {}
    }
  } else {
    form.value = {
      name: '',
      description: '',
      permissions: {}
    }
  }
}

const handleClose = () => {
  emit('update:visible', false)
  resetForm()
}

const handleSubmit = async () => {
  if (!form.value.name.trim()) {
    message.warning('请输入角色名称')
    return
  }

  loading.value = true
  try {
    if (props.isEdit) {
      await api.put(`/admin/permissions/roles/${props.role.id}`, form.value)
      message.success('角色更新成功')
    } else {
      await api.post('/admin/permissions/roles', form.value)
      message.success('角色创建成功')
    }
    emit('submit')
    handleClose()
  } catch (error) {
    console.error('保存角色失败:', error)
    message.error(error.response?.data?.msg || '保存角色失败')
  } finally {
    loading.value = false
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    resetForm()
  }
})
</script>

<template>
  <el-dialog
    :title="isEdit ? '编辑角色' : '新建角色'"
    :model-value="visible"
    @update:model-value="(val) => emit('update:visible', val)"
    width="600px"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" label-width="80px">
      <el-form-item label="角色名称">
        <el-input v-model="form.name" placeholder="请输入角色名称" />
      </el-form-item>
      <el-form-item label="角色描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="2"
          placeholder="请输入角色描述（可选）"
        />
      </el-form-item>
      <el-form-item label="权限配置">
        <PermissionTree v-model="form.permissions" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>
