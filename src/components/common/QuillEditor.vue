<template>
  <div v-if="isMounted" ref="editorContainer" class="quill-editor-container"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  options: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'ready'])

const editorContainer = ref(null)
const quillInstance = ref(null)
const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true
  
  // 延迟创建Quill实例，确保DOM已经完全渲染
  setTimeout(() => {
    if (editorContainer.value) {
      // 清理容器及其周围的旧工具栏节点
      // 查找并移除容器之前的工具栏节点
      let previousSibling = editorContainer.value.previousSibling
      while (previousSibling && previousSibling.classList && previousSibling.classList.contains('ql-toolbar')) {
        previousSibling.remove()
        previousSibling = editorContainer.value.previousSibling
      }
      
      // 确保容器是空的
      editorContainer.value.innerHTML = ''
      
      const defaultOptions = {
        theme: 'snow',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'font': [] }],
            [{ 'align': [] }],
            ['clean'],
            ['image']
          ]
        },
        placeholder: '输入内容...'
      }

      const editorOptions = {
        ...defaultOptions,
        ...props.options
      }

      // 创建新的Quill实例
      quillInstance.value = new Quill(editorContainer.value, editorOptions)

      // 设置初始内容
      if (props.modelValue) {
        quillInstance.value.root.innerHTML = props.modelValue
      }

      // 监听内容变化
      quillInstance.value.on('text-change', () => {
        const content = quillInstance.value.root.innerHTML
        emit('update:modelValue', content)
      })

      // 触发ready事件
      emit('ready', quillInstance.value)
    }
  }, 100)
})

watch(() => props.modelValue, (newVal) => {
  if (quillInstance.value && newVal !== quillInstance.value.root.innerHTML) {
    quillInstance.value.root.innerHTML = newVal || ''
  }
})

onUnmounted(() => {
  // 先设置为false，触发DOM卸载
  isMounted.value = false
  
  // 延迟清理，确保DOM已经完全卸载
  setTimeout(() => {
    if (quillInstance.value) {
      // 移除事件监听器
      quillInstance.value.off('text-change')
      
      // 清理容器及其周围的工具栏节点
      if (editorContainer.value) {
        // 查找并移除容器之前的工具栏节点
        let previousSibling = editorContainer.value.previousSibling
        while (previousSibling && previousSibling.classList && previousSibling.classList.contains('ql-toolbar')) {
          previousSibling.remove()
          previousSibling = editorContainer.value.previousSibling
        }
        
        // 清空容器
        editorContainer.value.innerHTML = ''
      }
      
      // 销毁实例
      quillInstance.value = null
    }
  }, 100)
})
</script>

<style scoped>
.quill-editor-container {
  width: 100%;
  height: 100%;
}
</style>
