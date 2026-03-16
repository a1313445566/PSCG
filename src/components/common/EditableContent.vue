<template>
  <div class="editable-content">
    <QuillEditor 
      :key="editorKey"
      v-model="localValue"
      :options="editorOptions"
      class="quill-editor"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

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

// 添加一个key来强制重新渲染编辑器
const editorKey = ref(0)

// 确保初始值是字符串
const localValue = ref(String(props.modelValue || ''))

const editorOptions = {
  placeholder: props.placeholder,
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ]
  },
  theme: 'snow'
}

// 监听localValue变化，更新modelValue
watch(() => localValue.value, (newVal) => {
  emit('update:modelValue', newVal)
})

// 监听modelValue变化，更新localValue
watch(() => props.modelValue, (newVal) => {
  const stringValue = String(newVal || '')
  if (localValue.value !== stringValue) {
    localValue.value = stringValue
    // 更新key来强制重新渲染编辑器
    editorKey.value++
  }
}, { immediate: true })

// 确保组件挂载时localValue有正确的值
onMounted(() => {
  const stringValue = String(props.modelValue || '')
  localValue.value = stringValue
  // 初始化key
  editorKey.value++
})
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

:deep(.ql-container) {
  min-height: 100px;
}

:deep(.ql-editor) {
  min-height: 80px;
}
</style>