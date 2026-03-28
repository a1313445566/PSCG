<template>
  <div class="editable-content">
    <QuillEditor
      ref="quillRef"
      v-model="localValue"
      toolbar-mode="basic"
      :options="{
        placeholder: placeholder
      }"
      class="quill-editor"
      @ready="onQuillReady"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import QuillEditor from './QuillEditor.vue'
import { ElMessage, ElLoading } from 'element-plus'
import { uploadImage } from '../../utils/imageUpload.js'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '输入内容...'
  }
})

const emit = defineEmits(['update:modelValue'])

const localValue = ref(props.modelValue || '')
const quillRef = ref(null)

// Quill 编辑器准备就绪
const onQuillReady = quill => {
  // 添加图片上传处理（工具栏按钮）
  const toolbar = quill.getModule('toolbar')
  if (toolbar.controls.image) {
    toolbar.controls.image[0].addEventListener('click', () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = async function () {
        const file = input.files[0]
        if (file) {
          await insertImageToEditor(quill, file)
        }
      }
      input.click()
    })
  }

  // 添加粘贴上传处理
  quill.root.addEventListener('paste', async e => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          await insertImageToEditor(quill, file)
        }
      }
    }
  })

  // 添加拖拽上传处理
  quill.root.addEventListener('drop', async e => {
    const files = e.dataTransfer?.files
    if (!files) return

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        e.preventDefault()
        await insertImageToEditor(quill, file)
      }
    }
  })
}

// 插入图片到编辑器
async function insertImageToEditor(quill, file) {
  // 检查文件大小
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 2MB')
    return
  }

  const loading = ElLoading.service({
    lock: true,
    text: '上传图片中...'
  })

  try {
    const url = await uploadImage(file)
    const range = quill.getSelection(true)
    quill.insertEmbed(range.index, 'image', url)
    quill.setSelection(range.index + 1)
  } catch (error) {
    ElMessage.error(error.message || '图片上传失败')
  } finally {
    loading.close()
  }
}

watch(
  () => localValue.value,
  newVal => {
    if (newVal !== props.modelValue) {
      emit('update:modelValue', newVal)
    }
  }
)

watch(
  () => props.modelValue,
  newVal => {
    if (newVal !== localValue.value) {
      localValue.value = newVal || ''
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.editable-content {
  width: 100%;
}

.quill-editor {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  min-height: 100px;
}

::deep(.ql-container) {
  min-height: 100px;
}

::deep(.ql-editor) {
  min-height: 80px;
}

/* 图片在编辑器中的样式 */
::deep(.ql-editor img) {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
  margin: 4px 0;
}
</style>
