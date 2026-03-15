<template>
  <div class="editable-content">
    <div class="editor-toolbar">
      <div class="toolbar-group">
        <button 
          type="button"
          class="toolbar-btn"
          :class="{ active: isActive('bold') }"
          @mousedown.prevent="execCommand('bold')"
          title="加粗"
        >
          <strong>B</strong>
        </button>
        <button 
          type="button"
          class="toolbar-btn"
          :class="{ active: isActive('italic') }"
          @mousedown.prevent="execCommand('italic')"
          title="斜体"
        >
          <em>I</em>
        </button>
        <button 
          type="button"
          class="toolbar-btn"
          :class="{ active: isActive('underline') }"
          @mousedown.prevent="execCommand('underline')"
          title="下划线"
        >
          <u>U</u>
        </button>
        <button 
          type="button"
          class="toolbar-btn"
          :class="{ active: isActive('strikeThrough') }"
          @mousedown.prevent="execCommand('strikeThrough')"
          title="删除线"
        >
          <s>S</s>
        </button>
        <button 
          type="button"
          class="toolbar-btn"
          @mousedown.prevent="execCommand('insertUnorderedList')"
          title="项目符号"
        >
          <span>•</span>
        </button>
        <button 
          type="button"
          class="toolbar-btn"
          @mousedown.prevent="execCommand('insertOrderedList')"
          title="编号列表"
        >
          <span>1.</span>
        </button>
      </div>
      
      <div class="toolbar-divider"></div>
      
      <div class="toolbar-group">
        <button 
          type="button"
          class="toolbar-btn"
          @mousedown.prevent="addDotUnderText"
          title="文字下加点"
        >
          <span style="text-decoration: dotted underline; text-underline-offset: 3px;">T</span>
        </button>
      </div>
      
      <div class="toolbar-divider"></div>
      
      <div class="toolbar-group">
        <button 
          type="button"
          class="toolbar-btn"
          @mousedown.prevent="execCommand('justifyLeft')"
          title="左对齐"
        >
          <span>◀</span>
        </button>
        <button 
          type="button"
          class="toolbar-btn"
          @mousedown.prevent="execCommand('justifyCenter')"
          title="居中"
        >
          <span>▪</span>
        </button>
        <button 
          type="button"
          class="toolbar-btn"
          @mousedown.prevent="execCommand('justifyRight')"
          title="右对齐"
        >
          <span>▶</span>
        </button>
      </div>
      
      <div class="toolbar-divider"></div>
      
      <div class="toolbar-group">
        <div class="color-picker-wrapper">
          <button 
            type="button"
            class="toolbar-btn color-btn"
            :style="{ backgroundColor: textColor }"
            title="文字颜色"
            @click="showTextColorPalette = !showTextColorPalette; showBgColorPalette = false"
          >
            <span style="color: white;">A</span>
          </button>
          <input 
            type="color" 
            v-model="textColor"
            @input="applyTextColor"
            class="color-input"
          />
          <div class="color-palette" v-if="showTextColorPalette">
            <button 
              v-for="color in commonColors" 
              :key="color"
              type="button"
              class="color-swatch"
              :style="{ backgroundColor: color }"
              @click="selectTextColor(color)"
              :title="color"
            ></button>
          </div>
        </div>
        
        <div class="color-picker-wrapper">
          <button 
            type="button"
            class="toolbar-btn color-btn"
            :style="{ backgroundColor: bgColor }"
            title="背景颜色"
            @click="showBgColorPalette = !showBgColorPalette; showTextColorPalette = false"
          >
            <span style="color: white;">▬</span>
          </button>
          <input 
            type="color" 
            v-model="bgColor"
            @input="applyBgColor"
            class="color-input"
          />
          <div class="color-palette" v-if="showBgColorPalette">
            <button 
              v-for="color in commonColors" 
              :key="color"
              type="button"
              class="color-swatch"
              :style="{ backgroundColor: color }"
              @click="selectBgColor(color)"
              :title="color"
            ></button>
          </div>
        </div>
      </div>
      
      <div class="toolbar-divider"></div>
      
      <div class="toolbar-group">
        <button 
          type="button"
          class="toolbar-btn"
          @mousedown.prevent="removeFormat"
          title="清除格式"
        >
          <span>✕</span>
        </button>
      </div>
    </div>
    
    <div 
      ref="editorRef"
      contenteditable="true"
      class="editor-content"
      :innerHTML="modelValue"
      placeholder="输入内容..."
      @input="handleInput"
      @paste="handlePaste"
      @blur="handleBlur"
    ></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

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

const editorRef = ref(null)
const textColor = ref('#000000')
const bgColor = ref('#ffff00')
const showTextColorPalette = ref(false)
const showBgColorPalette = ref(false)

// 常用颜色 - 按照图片中的颜色排列
const commonColors = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
  '#ff9900', '#9900ff', '#009900', '#990000', '#000099', '#666666', '#cccccc',
  '#ffcc00', '#ff6600', '#cc66ff', '#6699ff', '#66ff99', '#ff6666', '#99cc99', '#cc9999',
  '#9999cc', '#cccc99', '#999999', '#ffcccc', '#ccffff', '#ffffcc', '#ffccff', '#ccffcc'
]

let isFocused = false

const execCommand = (command, value = null) => {
  document.execCommand(command, false, value)
  updateValue()
}

const applyTextColor = () => {
  document.execCommand('foreColor', false, textColor.value)
  updateValue()
}

const applyBgColor = () => {
  document.execCommand('hiliteColor', false, bgColor.value)
  updateValue()
}

const selectTextColor = (color) => {
  textColor.value = color
  applyTextColor()
  showTextColorPalette.value = false
}

const selectBgColor = (color) => {
  bgColor.value = color
  applyBgColor()
  showBgColorPalette.value = false
}

const removeFormat = () => {
  document.execCommand('removeFormat', false, null)
  updateValue()
}

const addDotUnderText = () => {
  // 添加文字下加点效果 - 为每个字符添加点
  const selection = window.getSelection()
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    
    if (range.collapsed) {
      // 如果没有选中文本，创建一个空的span并插入
      const span = document.createElement('span')
      span.style.textDecoration = 'dotted underline'
      span.style.textUnderlineOffset = '3px'
      range.insertNode(span)
      // 将光标移动到span内部
      const newRange = document.createRange()
      newRange.setStart(span, 0)
      newRange.setEnd(span, 0)
      selection.removeAllRanges()
      selection.addRange(newRange)
    } else {
      // 如果有选中文本，为每个字符添加点
      const text = range.toString()
      const fragment = document.createDocumentFragment()
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i]
        const span = document.createElement('span')
        span.style.textDecoration = 'dotted underline'
        span.style.textUnderlineOffset = '3px'
        span.textContent = char
        fragment.appendChild(span)
      }
      
      range.deleteContents()
      range.insertNode(fragment)
      
      // 重新选择添加了点的文本
      const newRange = document.createRange()
      newRange.setStart(range.startContainer, range.startOffset)
      newRange.setEnd(range.startContainer, range.startOffset + text.length)
      selection.removeAllRanges()
      selection.addRange(newRange)
    }
    updateValue()
  }
}

const isActive = (command) => {
  return document.queryCommandState(command)
}

const handleInput = () => {
  updateValue()
}

const handleBlur = () => {
  isFocused = false
  updateValue()
}

const handlePaste = (event) => {
  const clipboardData = event.clipboardData || event.originalEvent?.clipboardData
  if (!clipboardData) return

  const items = clipboardData.items
  let hasImage = false

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      hasImage = true
      const file = items[i].getAsFile()
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const img = document.createElement('img')
          img.src = e.target.result
          img.style.maxWidth = '100%'
          img.style.maxHeight = '200px'
          
          const selection = window.getSelection()
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            range.deleteContents()
            range.insertNode(img)
            range.collapse(false)
            selection.removeAllRanges()
            selection.addRange(range)
          } else {
            editorRef.value.appendChild(img)
          }
          updateValue()
        }
        reader.readAsDataURL(file)
      }
      event.preventDefault()
      break
    }
  }
}

const updateValue = () => {
  if (editorRef.value) {
    emit('update:modelValue', editorRef.value.innerHTML)
  }
}

watch(() => props.modelValue, (newVal) => {
  if (editorRef.value && editorRef.value.innerHTML !== newVal) {
    editorRef.value.innerHTML = newVal || ''
  }
})

// 点击外部关闭颜色选择面板
const handleClickOutside = (event) => {
  const colorPickers = document.querySelectorAll('.color-picker-wrapper')
  let isClickInside = false
  
  colorPickers.forEach(picker => {
    if (picker.contains(event.target)) {
      isClickInside = true
    }
  })
  
  if (!isClickInside) {
    showTextColorPalette.value = false
    showBgColorPalette.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.editable-content {
  width: 100%;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 10px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
}

.toolbar-group {
  display: flex;
  gap: 2px;
  align-items: center;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #dcdfe6;
  margin: 0 4px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: #ecf5ff;
  border-color: #409eff;
}

.toolbar-btn.active {
  background: #409eff;
  border-color: #409eff;
  color: white;
}

.color-picker-wrapper {
  position: relative;
}

.color-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 28px;
  height: 28px;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.color-btn {
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.color-palette {
  position: absolute;
  top: 100%;
  left: 0;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 2px;
  padding: 6px;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-top: 4px;
  width: 200px;
}

.color-swatch {
  width: 22px;
  height: 22px;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s;
  margin: 0;
  padding: 0;
}

.color-swatch:hover {
  transform: scale(1.05);
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.5);
}

.editor-content {
  min-height: 60px;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 0 0 4px 4px;
  outline: none;
  background: white;
  font-size: 14px;
  line-height: 1.6;
}

.editor-content:focus {
  border-color: #409eff;
}

.editor-content:empty:before {
  content: attr(placeholder);
  color: #c0c4cc;
  pointer-events: none;
}

.editor-content img {
  max-width: 100%;
  max-height: 200px;
  margin: 5px 0;
}
</style>
