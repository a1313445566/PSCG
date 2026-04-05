<template>
  <UniversalAudioPlayer
    mode="admin"
    :model-value="modelValue"
    :uploading="uploading"
    :upload-progress="uploadProgress"
    @update:model-value="$emit('update:modelValue', $event)"
    @delete="$emit('delete')"
    @file-change="handleFileChange"
  />
</template>

<script setup>
import { ref } from 'vue'
import api from '@/utils/api'
import { ElMessage } from 'element-plus'
import UniversalAudioPlayer from '@/components/common/UniversalAudioPlayer.vue'

const emit = defineEmits([
  'update:modelValue',
  'delete',
  'upload-start',
  'upload-progress',
  'upload-success'
])

const uploading = ref(false)
const uploadProgress = ref(0)

const handleFileChange = async file => {
  if (!file) return

  const audioFile = file.raw || file
  if (!audioFile.type.startsWith('audio/')) {
    ElMessage.error('请选择音频文件')
    return
  }

  if (audioFile.size > 10 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 10MB')
    return
  }

  try {
    uploading.value = true
    uploadProgress.value = 0
    emit('upload-start', audioFile)

    const formData = new FormData()
    formData.append('audio', audioFile)

    const response = await api.post('/upload/audio', formData, {
      onUploadProgress: progressEvent => {
        uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        emit('upload-progress', uploadProgress.value)
      },
      timeout: 60000
    })

    emit('update:modelValue', response.url)
    emit('upload-success', response.url)
    ElMessage.success('音频上传成功')
  } catch (error) {
    console.error('音频上传失败:', error)
    ElMessage.error(error.message || '音频上传失败')
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}
</script>
