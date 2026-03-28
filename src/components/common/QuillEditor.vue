<template>
  <div v-if="isMounted" class="quill-wrapper">
    <!-- 自定义中文工具栏 -->
    <div v-if="showToolbar" ref="toolbarContainer" class="ql-toolbar ql-snow">
      <span v-if="toolbarMode === 'full'" class="ql-formats">
        <button class="ql-bold" title="加粗"></button>
        <button class="ql-italic" title="斜体"></button>
        <button class="ql-underline" title="下划线"></button>
        <button class="ql-strike" title="删除线"></button>
      </span>
      <span v-if="toolbarMode === 'full'" class="ql-formats">
        <button class="ql-script" value="sub" title="下标"></button>
        <button class="ql-script" value="super" title="上标"></button>
      </span>
      <span v-if="toolbarMode === 'full'" class="ql-formats">
        <select class="ql-header" title="标题">
          <option value="1">标题 1</option>
          <option value="2">标题 2</option>
          <option value="3">标题 3</option>
          <option value="4">标题 4</option>
          <option value="5">标题 5</option>
          <option value="6">标题 6</option>
          <option selected>正文</option>
        </select>
        <select class="ql-size" title="字号">
          <option value="small">小号</option>
          <option selected>正常</option>
          <option value="large">大号</option>
          <option value="huge">超大号</option>
        </select>
      </span>
      <span v-if="toolbarMode === 'full'" class="ql-formats">
        <select class="ql-font" title="字体">
          <option selected>默认字体</option>
          <option value="serif">衬线</option>
          <option value="monospace">等宽字体</option>
        </select>
      </span>
      <span class="ql-formats">
        <select class="ql-color" title="文字颜色"></select>
        <select class="ql-background" title="背景色"></select>
      </span>
      <span class="ql-formats">
        <button class="ql-list" value="ordered" title="有序列表"></button>
        <button class="ql-list" value="bullet" title="无序列表"></button>
      </span>
      <span v-if="toolbarMode === 'full'" class="ql-formats">
        <button class="ql-indent" value="-1" title="减少缩进"></button>
        <button class="ql-indent" value="+1" title="增加缩进"></button>
      </span>
      <span v-if="toolbarMode === 'full'" class="ql-formats">
        <select class="ql-align" title="对齐方式">
          <option selected>左对齐</option>
          <option value="center">居中</option>
          <option value="right">右对齐</option>
          <option value="justify">两端对齐</option>
        </select>
      </span>
      <span v-if="toolbarMode === 'full'" class="ql-formats">
        <button class="ql-blockquote" title="引用"></button>
        <button class="ql-code-block" title="代码块"></button>
      </span>
      <span class="ql-formats">
        <button class="ql-link" title="插入链接"></button>
        <button class="ql-image" title="插入图片"></button>
        <button v-if="toolbarMode === 'full'" class="ql-video" title="插入视频"></button>
      </span>
      <span class="ql-formats">
        <button class="ql-clean" title="清除格式"></button>
      </span>
    </div>

    <!-- 编辑器容器 -->
    <div ref="editorContainer" class="quill-editor-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, nextTick, computed } from 'vue'
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
  },
  // 工具栏配置：'full' 完整版 | 'basic' 基础版 | 'minimal' 精简版 | 'none' 无工具栏
  toolbarMode: {
    type: String,
    default: 'full'
  }
})

const emit = defineEmits(['update:modelValue', 'ready'])

const editorContainer = ref(null)
const toolbarContainer = ref(null)
const quillInstance = ref(null)
const isMounted = ref(false)

const showToolbar = computed(() => props.toolbarMode !== 'none')

onMounted(() => {
  isMounted.value = true

  nextTick(() => {
    if (editorContainer.value) {
      const editorOptions = {
        theme: 'snow',
        placeholder: props.options.placeholder || '输入内容...',
        ...props.options,
        modules: {
          toolbar: showToolbar.value ? toolbarContainer.value : false,
          history: {
            delay: 1000,
            maxStack: 100,
            userOnly: true
          },
          ...(props.options.modules || {})
        }
      }

      // 创建 Quill 实例
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

      // 触发 ready 事件
      emit('ready', quillInstance.value)
    }
  })
})

watch(
  () => props.modelValue,
  newVal => {
    if (quillInstance.value && newVal !== quillInstance.value.root.innerHTML) {
      quillInstance.value.root.innerHTML = newVal || ''
    }
  }
)

onUnmounted(() => {
  isMounted.value = false

  if (quillInstance.value) {
    quillInstance.value.off('text-change')
    quillInstance.value = null
  }
})
</script>

<style scoped>
.quill-wrapper {
  width: 100%;
  height: 100%;
}

.quill-editor-container {
  width: 100%;
  min-height: 200px;
}

/* 工具栏样式 */
:deep(.ql-toolbar) {
  border: 1px solid #dcdfe6;
  border-radius: 4px 4px 0 0;
  background: #fafafa;
}

:deep(.ql-container) {
  border: 1px solid #dcdfe6;
  border-top: 0;
  border-radius: 0 0 4px 4px;
  font-size: 14px;
}

:deep(.ql-editor) {
  min-height: 150px;
  line-height: 1.6;
}

/* 按钮样式 */
:deep(.ql-toolbar button) {
  padding: 4px 6px;
  border-radius: 3px;
  transition: all 0.2s;
}

:deep(.ql-toolbar button:hover) {
  background-color: #e8f4ff;
}

:deep(.ql-toolbar button.ql-active) {
  background-color: #d9ecff;
  color: #409eff;
}

/* 下拉选择器样式 */
:deep(.ql-picker) {
  font-size: 13px;
}

:deep(.ql-picker-label) {
  border-radius: 3px;
  display: flex;
  align-items: center;
}

:deep(.ql-picker-label:hover) {
  background-color: #e8f4ff;
}

/* 颜色选择器 */
:deep(.ql-color-picker) {
  width: 28px;
}

:deep(.ql-color-picker .ql-picker-label) {
  padding: 2px 4px;
}

/* 编辑器焦点状态 */
:deep(.ql-container.ql-focused) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* 下拉选项样式 */
:deep(.ql-picker-options) {
  padding: 4px 0;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

:deep(.ql-picker-item) {
  padding: 6px 12px;
  cursor: pointer;
}

:deep(.ql-picker-item:hover) {
  background-color: #f5f7fa;
}

:deep(.ql-picker-item.ql-selected) {
  background-color: #d9ecff;
  color: #409eff;
}
</style>
