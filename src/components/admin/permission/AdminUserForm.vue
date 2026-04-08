<script setup>
import { ref, watch, computed } from 'vue'
import api from '@/utils/api'
import { showMessage } from '@/utils/message'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  user: {
    type: Object,
    default: null
  },
  roles: {
    type: Array,
    default: () => []
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'submit'])

// 使用计算属性处理 v-model
const visible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

const formRef = ref(null)
const form = ref({
  username: '',
  password: '',
  role_id: null,
  status: 'active'
})

const loading = ref(false)

const resetForm = () => {
  if (props.isEdit && props.user) {
    form.value = {
      username: props.user.username,
      password: '',
      role_id: props.user.role_id,
      status: props.user.status
    }
  } else {
    form.value = {
      username: '',
      password: '',
      role_id: null,
      status: 'active'
    }
  }
}

const handleClose = () => {
  emit('update:visible', false)
  resetForm()
}

const handleSubmit = async () => {
  if (!form.value.username.trim()) {
    showMessage('请输入用户名', 'warning')
    return
  }
  if (!form.value.role_id) {
    showMessage('请选择角色', 'warning')
    return
  }
  if (!props.isEdit && !form.value.password.trim()) {
    showMessage('请输入密码', 'warning')
    return
  }
  if (!props.isEdit && form.value.password.length < 6) {
    showMessage('密码至少6位', 'warning')
    return
  }

  loading.value = true
  try {
    if (props.isEdit) {
      const updateData = {
        username: form.value.username,
        role_id: form.value.role_id,
        status: form.value.status
      }
      await api.put(`/admin/permissions/users/${props.user.id}`, updateData)
      showMessage('管理员更新成功', 'success')
    } else {
      await api.post('/admin/permissions/users', form.value)
      showMessage('管理员创建成功', 'success')
    }
    emit('submit')
    handleClose()
  } catch (error) {
    console.error('保存管理员失败:', error)
    if (error.response?.data?.msg?.includes('已存在')) {
      showMessage('用户名已存在', 'error')
    } else {
      showMessage(error.response?.data?.msg || '保存管理员失败', 'error')
    }
  } finally {
    loading.value = false
  }
}

watch(
  () => props.visible,
  val => {
    if (val) {
      resetForm()
    }
  }
)
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑管理员' : '新建管理员'"
    width="500px"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" label-width="80px">
      <el-form-item label="用户名">
        <el-input v-model="form.username" placeholder="请输入用户名" :disabled="isEdit" />
      </el-form-item>
      <el-form-item v-if="!isEdit" label="密码">
        <el-input v-model="form.password" type="password" placeholder="请输入密码（至少6位）" />
      </el-form-item>
      <el-form-item label="角色">
        <el-select v-model="form.role_id" placeholder="请选择角色" style="width: 100%">
          <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="isEdit" label="状态">
        <el-radio-group v-model="form.status">
          <el-radio value="active">启用</el-radio>
          <el-radio value="disabled">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>
