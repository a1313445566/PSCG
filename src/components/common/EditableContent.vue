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
  // 监听工具栏图片按钮点击（自定义工具栏）
  const toolbarContainer = quill.container.previousElementSibling
  if (toolbarContainer) {
    const imageButton = toolbarContainer.querySelector('.ql-image')
    if (imageButton) {
      imageButton.addEventListener('click', () => {
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
  }

  // 添加粘贴上传处理
  quill.root.addEventListener('paste', async e => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      // 处理图片文件粘贴
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          await insertImageToEditor(quill, file)
        }
        return
      }
    }

    // 处理 HTML 内容中的 base64 图片（从网页复制图片的情况）
    const htmlItem = Array.from(items).find(item => item.type === 'text/html')
    if (htmlItem) {
      e.preventDefault()
      htmlItem.getAsString(async html => {
        // 提取 base64 图片
        const base64Regex = /<img[^>]+src=["'](data:image\/[^"']+)["']/gi
        const matches = [...html.matchAll(base64Regex)]

        if (matches.length > 0) {
          for (const match of matches) {
            const base64Data = match[1]
            try {
              // 将 base64 转换为文件
              const file = await base64ToFile(base64Data)
              if (file) {
                await insertImageToEditor(quill, file)
              }
            } catch (error) {
              console.error('Base64 图片转换失败:', error)
              // 如果转换失败，直接插入原始 HTML
              const range = quill.getSelection(true)
              quill.clipboard.dangerouslyPasteHTML(range.index, match[0])
            }
          }
        } else {
          // 没有 base64 图片，正常粘贴 HTML
          const range = quill.getSelection(true)
          quill.clipboard.dangerouslyPasteHTML(range.index, html)
        }
      })
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

// 将 base64 转换为 File 对象
async function base64ToFile(base64Data) {
  try {
    // 提取 MIME 类型和数据
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) return null

    const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1]
    const mimeType = `image/${matches[1]}`
    const base64 = matches[2]

    // 将 base64 转换为 Blob
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: mimeType })

    // 创建 File 对象
    const file = new File([blob], `pasted-image-${Date.now()}.${extension}`, {
      type: mimeType
    })

    return file
  } catch (error) {
    console.error('Base64 转换错误:', error)
    return null
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

<style scoped lang="scss">
.editable-content {
  width: 100%;
}

.quill-editor {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

::deep(.ql-container) {
  min-height: 60px;
}

::deep(.ql-editor) {
  min-height: 40px;
  padding: 8px 12px;
}

::deep(.ql-editor p) {
  margin: 0;
  line-height: 1.5;
}

::deep(.ql-editor.ql-blank::before) {
  font-style: normal;
  color: #a8abb2;
}

/* 图片在编辑器中的样式 */
::deep(.ql-editor img) {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
  margin: 4px 0;
}
</style>
