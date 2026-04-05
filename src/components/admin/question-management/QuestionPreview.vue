<template>
  <el-dialog v-model="modelVisible" title="题目预览" width="700px" destroy-on-close>
    <div v-if="data" v-loading="loading" class="preview-content">
      <div class="preview-item">
        <label>题目ID：</label>
        <span>{{ data.id }}</span>
      </div>
      <div class="preview-item">
        <label>所属学科：</label>
        <span>{{ data.subjectName }}</span>
      </div>
      <div class="preview-item">
        <label>所属题库：</label>
        <span>{{ data.subcategoryName || '-' }}</span>
      </div>
      <div class="preview-item">
        <label>题目类型：</label>
        <el-tag :type="getTypeTagType(data.type)">{{ data.typeName }}</el-tag>
      </div>
      <div class="preview-item">
        <label>题目内容：</label>
        <div class="preview-content-box" v-html="safeHtml(data.content)"></div>
      </div>
      <div v-if="data.image" class="preview-item">
        <label>题目图片：</label>
        <el-image :src="data.image" fit="contain" style="max-width: 400px; max-height: 300px" />
      </div>
      <div v-if="data.audio" class="preview-item">
        <label>音频：</label>
        <audio controls :src="data.audio" style="max-width: 100%"></audio>
      </div>
      <div v-if="data.options && data.options.length > 0" class="preview-item">
        <label>选项：</label>
        <!-- 阅读理解题显示小题列表 -->
        <template v-if="data.type === 'reading' && isReadingOptions(data.options)">
          <div class="preview-reading-options">
            <div v-for="(sq, sqIndex) in data.options" :key="sqIndex" class="preview-sub-question">
              <div class="sub-question-header">
                <span class="sub-question-order">第 {{ sq.order || sqIndex + 1 }} 题</span>
                <el-tag type="success" size="small">答案: {{ sq.answer }}</el-tag>
              </div>
              <div class="sub-question-content" v-html="safeHtml(sq.content)"></div>
              <div class="sub-question-options">
                <div
                  v-for="(opt, optIndex) in sq.options"
                  :key="optIndex"
                  class="preview-option"
                  :class="{ 'is-correct': sq.answer === String.fromCharCode(65 + optIndex) }"
                >
                  <span class="option-label">{{ String.fromCharCode(65 + optIndex) }}.</span>
                  <span class="option-content" v-html="safeHtml(opt)"></span>
                </div>
              </div>
            </div>
          </div>
        </template>
        <!-- 普通题目显示选项列表 -->
        <template v-else>
          <div class="preview-options">
            <div v-for="(option, index) in data.options" :key="index" class="preview-option">
              <span class="option-label">{{ String.fromCharCode(65 + index) }}.</span>
              <span class="option-content" v-html="safeHtml(option)"></span>
            </div>
          </div>
        </template>
      </div>
      <div class="preview-item">
        <label>正确答案：</label>
        <el-tag type="danger" effect="dark">{{ data.answer }}</el-tag>
      </div>
      <div v-if="data.explanation" class="preview-item">
        <label>解析：</label>
        <div class="preview-content-box" v-html="safeHtml(data.explanation)"></div>
      </div>
    </div>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">关闭</el-button>
      <el-button type="primary" @click="$emit('edit-from-preview')">编辑</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import xssFilter from '../../../utils/xss-filter'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  data: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  isReadingOptions: {
    type: Function,
    default: () => false
  },
  getTypeTagType: {
    type: Function,
    default: () => ''
  }
})

const emit = defineEmits(['update:visible', 'edit-from-preview'])

const modelVisible = computed({
  get: () => props.visible,
  set: val => emit('update:visible', val)
})

const safeHtml = html => xssFilter.sanitize(html)
</script>

<style scoped lang="scss">
@use '../../../styles/scss/components/question-management' as *;

.preview-content {
  max-height: 60vh;
  overflow-y: auto;
}

.preview-item {
  margin-bottom: 16px;

  label {
    display: inline-block;
    min-width: 80px;
    font-weight: 600;
    color: #303133;
    margin-right: 8px;
  }
}

.preview-content-box {
  display: inline-block;
  max-width: calc(100% - 90px);
  line-height: 1.6;
  color: #606266;
}

.preview-reading-options {
  width: 100%;
}

.preview-sub-question {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border-left: 3px solid #409eff;
}

.sub-question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.sub-question-order {
  font-weight: 600;
  color: #409eff;
  font-size: 15px;
}

.sub-question-content {
  margin-bottom: 12px;
  line-height: 1.6;
  color: #303133;
}

.sub-question-options {
  padding-left: 8px;
}

.preview-options {
  width: 100%;
}

.preview-option {
  padding: 8px 12px;
  margin-bottom: 6px;
  border-radius: 4px;
  transition: background 0.2s;
}

.preview-option:hover {
  background: #f5f7fa;
}

.preview-option.is-correct {
  background: #f0f9eb;
  border-left: 3px solid #67c23a;
}

.option-label {
  font-weight: 600;
  color: #409eff;
  margin-right: 8px;
}

.option-content {
  color: #606266;
  line-height: 1.5;
}
</style>
