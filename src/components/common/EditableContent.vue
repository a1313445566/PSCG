<template>
  <div class="editable-content">
    <QuillEditor 
      v-model="localValue"
      :options="editorOptions"
      class="quill-editor"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import QuillEditor from './QuillEditor.vue'

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

watch(() => localValue.value, (newVal) => {
  if (newVal !== props.modelValue) {
    emit('update:modelValue', newVal);
  }
});

watch(() => props.modelValue, (newVal) => {
  if (newVal !== localValue.value) {
    localValue.value = newVal || '';
  }
}, { immediate: true });

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
