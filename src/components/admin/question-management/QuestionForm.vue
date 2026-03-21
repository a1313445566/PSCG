<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="(value) => emit('update:visible', value)"
    :title="isEditing ? '编辑题目' : '添加题目'"
    width="1000px"
    :before-close="handleClose"
    custom-class="modern-dialog"
  >
    <div class="question-form-container">
      <!-- 基本信息区域 -->
      <div class="form-section">
        <div class="section-header">
          <h4 class="section-title">基本信息</h4>
          <div class="section-divider"></div>
        </div>
        <div class="basic-info-row">
          <div class="form-item-group">
            <label class="form-label">学科</label>
            <el-select v-model="form.subjectId" placeholder="选择学科" class="modern-select">
              <el-option v-for="subject in subjects" :key="subject.id" :label="subject.name" :value="subject.id"></el-option>
            </el-select>
          </div>
          
          <div class="form-item-group">
            <label class="form-label">学科题库</label>
            <el-select v-model="form.subcategoryId" placeholder="选择学科题库" class="modern-select">
              <el-option v-for="subcategory in currentSubcategories" :key="subcategory.id" :label="subcategory.name" :value="subcategory.id"></el-option>
            </el-select>
          </div>
          
          <div class="form-item-group">
            <label class="form-label">题目类型</label>
            <el-select v-model="form.type" placeholder="选择类型" class="modern-select">
              <el-option label="单选题" value="single"></el-option>
              <el-option label="多选题" value="multiple"></el-option>
              <el-option label="判断题" value="judgment"></el-option>
              <el-option label="听力题" value="listening"></el-option>
              <el-option label="阅读题" value="reading"></el-option>
              <el-option label="看图题" value="image"></el-option>
            </el-select>
          </div>
          
          <div class="form-item-group">
            <label class="form-label">难度</label>
            <el-select v-model="form.difficulty" placeholder="选择难度" class="modern-select">
              <el-option label="简单" value="1"></el-option>
              <el-option label="较简单" value="2"></el-option>
              <el-option label="中等" value="3"></el-option>
              <el-option label="较难" value="4"></el-option>
              <el-option label="困难" value="5"></el-option>
            </el-select>
          </div>
        </div>
      </div>
      
      <!-- 题目内容区域 -->
      <div class="form-section">
        <div class="section-header">
          <h4 class="section-title">题目内容</h4>
          <div class="section-divider"></div>
        </div>
        <div class="content-editor modern-card">
          <QuillEditor
                :key="editorKey"
                :content="form.content"
                @update:content="(value) => { form.content = value }"
                @ready="onQuillReady"
                :options="{
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
                  placeholder: '输入题目内容'
                }"
                style="width: 100%; height: 100%;"
              />
        </div>
      </div>
      
      <!-- 答案选项区域 -->
      <div class="form-section">
        <div class="section-header">
          <h4 class="section-title">答案选项</h4>
          <div class="section-divider"></div>
        </div>
        <div class="correct-answer-tip modern-alert">
          <div class="alert-icon">💡</div>
          <div class="alert-content">
            <p><strong>提示：</strong> 勾选框用于标记<strong>正确答案</strong>，请选择一个或多个正确的选项。</p>
            <p><strong>图片上传：</strong> 您可以直接复制图片，然后粘贴到答案编辑器中，或使用编辑器工具栏中的图片按钮上传图片。</p>
          </div>
        </div>
        <div class="options-list">
          <div v-for="(option, index) in form.options" :key="`option-${index}`" :class="['option-item', 'modern-card', { 'correct-answer': form.selectedAnswers.includes(String.fromCharCode(65 + index)) }]">
            <div class="option-layout">
              <div class="option-left">
                <el-checkbox 
                  :label="String.fromCharCode(65 + index)" 
                  v-model="form.selectedAnswers"
                  :disabled="form.type === 'single' && form.selectedAnswers.length > 0 && !form.selectedAnswers.includes(String.fromCharCode(65 + index))"
                  class="modern-checkbox"
                >
                  <span class="option-label">{{ String.fromCharCode(65 + index) }}. </span>
                  <span v-if="form.selectedAnswers.includes(String.fromCharCode(65 + index))" class="correct-badge">正确答案</span>
                </el-checkbox>
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="removeOption(index)" 
                  class="modern-button danger"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <div class="option-right">
                <EditableContent 
                  v-model="form.options[index]"
                  placeholder="输入答案内容"
                  class="answer-input"
                />
              </div>
            </div>
          </div>
          <div class="add-option-btn">
            <el-button type="primary" @click="addOption" class="modern-button primary">
              <el-icon><Plus /></el-icon> 添加答案
            </el-button>
          </div>
        </div>
      </div>
      
      <!-- 解析和媒体区域 -->
      <div class="form-section">
        <div class="section-header">
          <h4 class="section-title">解析与媒体</h4>
          <div class="section-divider"></div>
        </div>
        <div class="form-grid">
          <div class="form-item-group full-width">
            <label class="form-label">解析</label>
            <el-input v-model="form.explanation" type="textarea" :rows="3" placeholder="输入答案解析" class="modern-textarea"></el-input>
          </div>
          
          <div class="form-item-group full-width">
            <label class="form-label">音频文件</label>
            <div class="media-upload">
              <el-upload
                class="upload-audio"
                action="#"
                :auto-upload="false"
                :on-change="handleAudioChange"
                accept=".mp3,.wav"
                :limit="1"
              >
                <el-button type="primary" class="modern-button primary">
                  <el-icon><Upload /></el-icon> 上传音频
                </el-button>
              </el-upload>
              <div class="media-input" v-if="form.audio">
                <el-input v-model="form.audio" placeholder="音频文件路径" class="modern-input"></el-input>
                <el-button 
                  type="danger" 
                  @click="deleteAudio"
                  class="modern-button danger"
                >
                  <el-icon><Delete /></el-icon> 删除
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="emit('update:visible', false)" class="modern-button secondary">取消</el-button>
        <el-button type="primary" @click="saveQuestion" class="modern-button primary">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import { ElMessage } from 'element-plus';
import { Plus, Upload, Delete } from '@element-plus/icons-vue';
import EditableContent from '../../common/EditableContent.vue';

// 定义属性和事件
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  question: {
    type: Object,
    default: null
  },
  subjects: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:visible', 'save-question']);

// 表单数据
const form = ref({
  id: null,
  subjectId: '',
  subcategoryId: '',
  type: 'single',
  content: '<p>请输入题目内容</p>',
  options: ['', '', '', ''],
  selectedAnswers: [],
  answer: '',
  explanation: '',
  audio: '',
  difficulty: 1
});

// 编辑器key，用于重置编辑器
const editorKey = ref(0);

// 计算当前学科的子分类
const currentSubcategories = computed(() => {
  if (!form.value.subjectId) return [];
  const subject = props.subjects.find(s => s.id == form.value.subjectId);
  return subject ? subject.subcategories || [] : [];
});

// 是否为编辑模式
const isEditing = computed(() => !!props.question);

// 监听visible变化
watch(() => props.visible, (newValue) => {
  if (newValue) {
    if (props.question) {
      editQuestion(props.question);
    } else {
      resetForm();
    }
  }
});

// 编辑题目
const editQuestion = (question) => {
  isEditing.value = true;
  
  // 处理富文本内容
  let contentValue = '';
  if (typeof question.content === 'string' && question.content) {
    contentValue = question.content;
  } else if (typeof question.content === 'object' && question.content.ops) {
    // 处理Delta对象
    const tempElement = document.createElement('div');
    question.content.ops.forEach(op => {
      if (typeof op.insert === 'string') {
        tempElement.innerHTML += op.insert;
      } else if (op.insert && op.insert.image) {
        tempElement.innerHTML += `<img src="${op.insert.image}" alt="图片" style="max-width: 100%;">`;
      }
    });
    contentValue = tempElement.innerHTML;
  } else {
    contentValue = '';
  }
  
  // 构建表单数据
  const answer = question.answer || question.correct_answer || '';
  const audio = question.audio || question.audio_url || '';
  const image = question.image || question.image_url || '';
  
  // 处理options字段
  let options = [];
  if (question.options) {
    if (typeof question.options === 'string') {
      try {
        options = JSON.parse(question.options);
      } catch (e) {
        options = [question.options];
      }
    } else if (Array.isArray(question.options)) {
      options = question.options;
    }
  }
  
  // 确保数组中的每个元素都是字符串
  options = options.map(option => {
    if (typeof option === 'string') {
      return option;
    } else if (option === null || option === undefined) {
      return '';
    } else {
      return String(option);
    }
  });
  
  // 确保options数组至少有4个元素
  while (options.length < 4) {
    options.push('');
  }
  
  // 先设置表单数据
  form.value = {
    id: question.id,
    subjectId: question.subjectId || question.subject_id,
    subcategoryId: question.subcategoryId || question.subcategory_id,
    type: question.type || 'single',
    content: contentValue,
    options: options.length > 0 ? options : ['', '', '', ''],
    selectedAnswers: answer.split(''),
    answer: answer,
    correct_answer: question.correct_answer || answer,
    explanation: question.explanation || '',
    audio: audio,
    image: image,
    difficulty: question.difficulty || 1
  };
  
  // 增加一个key来强制重新渲染编辑器
  editorKey.value++;
};

// 重置表单
const resetForm = () => {
  isEditing.value = false;
  // 先设置表单数据
  form.value = {
    id: null,
    subjectId: props.subjects.length > 0 ? props.subjects[0].id : '',
    subcategoryId: '',
    type: 'single',
    content: '<p>请输入题目内容</p>',
    options: ['', '', '', ''],
    answer: '',
    selectedAnswers: [],
    explanation: '',
    audio: '',
    difficulty: 1
  };
  // 重置编辑器key
  editorKey.value++;
};

// 添加选项
const addOption = () => {
  form.value.options.push('');
};

// 删除选项
const removeOption = (index) => {
  // 移除对应的答案选项
  const optionLabel = String.fromCharCode(65 + index);
  const answerIndex = form.value.selectedAnswers.indexOf(optionLabel);
  if (answerIndex !== -1) {
    form.value.selectedAnswers.splice(answerIndex, 1);
  }
  // 移除选项
  form.value.options.splice(index, 1);
};

// 处理音频文件变化
const handleAudioChange = async (file) => {
  try {
    const formData = new FormData();
    formData.append('audio', file.raw);
    
    const response = await fetch('/api/upload/audio', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        form.value.audio = result.url;
      } else {
        ElMessage.error('音频上传失败');
      }
    } else {
      ElMessage.error('音频上传失败');
    }
  } catch (error) {
    ElMessage.error('音频上传失败');
  }
};

// 删除音频
const deleteAudio = () => {
  form.value.audio = '';
};

// 处理对话框关闭
const handleClose = () => {
  emit('update:visible', false);
};

// 保存题目
const saveQuestion = async () => {
  // 验证子分类
  if (!form.value.subcategoryId) {
    ElMessage.error('请选择学科题库！');
    return;
  }
  
  // 验证正确答案
  if (form.value.selectedAnswers.length === 0) {
    ElMessage.error('请选择正确答案！');
    return;
  }
  
  // 检查题目内容是否为空
  let content = form.value.content;
  let plainText = '';
  let contentHtml = '';
  let hasContent = false;
  
  // 处理Quill编辑器的内容
  if (typeof content === 'object' && content.ops) {
    // 对于Delta对象，提取纯文本进行验证
    plainText = content.ops.map(op => {
      if (typeof op.insert === 'string') {
        return op.insert;
      }
      return '';
    }).join('').trim();
    
    // 检查是否有内容（包括文本和图片）
    hasContent = plainText !== '' || content.ops.some(op => op.insert && op.insert.image);
    
    // 将Delta对象转换为HTML字符串
    const tempElement = document.createElement('div');
    content.ops.forEach(op => {
      if (typeof op.insert === 'string') {
        tempElement.innerHTML += op.insert;
      } else if (op.insert && op.insert.image) {
        tempElement.innerHTML += `<img src="${op.insert.image}" alt="图片" style="max-width: 100%;">`;
      }
    });
    contentHtml = tempElement.innerHTML;
  } else if (typeof content === 'string') {
    // 移除HTML标签并 trim 后检查是否为空
    plainText = content.replace(/<[^>]*>/g, '').trim();
    // 检查是否有内容（包括文本和图片）
    hasContent = plainText !== '' || content.includes('<img');
    contentHtml = content;
  } else {
    // 处理其他类型的内容
    plainText = String(content || '').trim();
    hasContent = plainText !== '';
    contentHtml = String(content || '');
  }
  
  // 检查是否为空
  if (!hasContent || plainText === '请输入题目内容') {
    ElMessage.error('请输入题目内容！');
    return;
  }
  
  // 处理选项数据，确保每个选项都是字符串
  const processedOptions = form.value.options.map(option => {
    if (typeof option === 'object' && option.ops) {
      // 处理Delta对象
      const tempElement = document.createElement('div');
      option.ops.forEach(op => {
        if (typeof op.insert === 'string') {
          tempElement.innerHTML += op.insert;
        } else if (op.insert && op.insert.image) {
          tempElement.innerHTML += `<img src="${op.insert.image}" alt="图片" style="max-width: 100%;">`;
        }
      });
      return tempElement.innerHTML;
    } else if (typeof option !== 'string') {
      return String(option || '');
    } else if (option === '<p><br></p>' || option === '<p>&nbsp;</p>') {
      // 处理空内容
      return '';
    }
    return option;
  });

  // 构建要保存的题目数据
  const questionData = {
    id: form.value.id,
    subjectId: form.value.subjectId,
    subcategoryId: form.value.subcategoryId,
    type: form.value.type,
    content: contentHtml,
    options: processedOptions,
    answer: form.value.selectedAnswers.sort().join(''),
    explanation: form.value.explanation,
    audio: form.value.audio,
    image: form.value.image,
    difficulty: form.value.difficulty
  };
  
  // 发送保存事件
  emit('save-question', questionData);
  emit('update:visible', false);
};

// Quill编辑器准备
const onQuillReady = (quill) => {
  // 编辑器准备就绪后，手动设置内容
  if (form.value.content) {
    quill.root.innerHTML = form.value.content;
  }
  
  // 添加图片上传处理
  const toolbar = quill.getModule('toolbar');
  toolbar.addHandler('image', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async function() {
      const file = input.files[0];
      if (file) {
        try {
          const formData = new FormData();
          formData.append('image', file);
          
          const response = await fetch('/api/upload/image', {
            method: 'POST',
            body: formData
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              const range = quill.getSelection();
              quill.insertEmbed(range.index, 'image', result.url);
              quill.setSelection(range.index + 1);
            } else {
              ElMessage.error('图片上传失败');
            }
          } else {
            ElMessage.error('图片上传失败');
          }
        } catch (error) {
          ElMessage.error('图片上传失败');
        }
      }
    };
    input.click();
  });
};
</script>

<style scoped>
/* 现代对话框样式 */
.modern-dialog {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

.modern-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  margin: 0;
}

.modern-dialog :deep(.el-dialog__title) {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.modern-dialog :deep(.el-dialog__close) {
  color: white;
  font-size: 24px;
  transition: all 0.3s ease;
}

.modern-dialog :deep(.el-dialog__close:hover) {
  color: rgba(255, 255, 255, 0.8);
}

.modern-dialog :deep(.el-dialog__body) {
  padding: 0;
  background-color: #f8fafc;
}

.question-form-container {
  padding: 30px;
  max-height: 70vh;
  overflow-y: auto;
}

/* 表单区域样式 */
.form-section {
  margin-bottom: 30px;
  padding: 24px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.form-section:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  flex: 1;
}

.section-divider {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
  margin-left: 16px;
}

/* 表单网格 */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

/* 基本信息单行布局 */
.basic-info-row {
  display: flex;
  gap: 15px;
  align-items: flex-start;
  flex-wrap: nowrap;
}

.basic-info-row .form-item-group {
  flex: 1;
  min-width: 0;
}

.form-item-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  margin: 0;
}

/* 现代输入控件 */
.modern-select,
.modern-input,
.modern-textarea {
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.modern-select:hover,
.modern-input:hover,
.modern-textarea:hover {
  border-color: #cbd5e1;
}

.modern-select:focus-within,
.modern-input:focus-within,
.modern-textarea:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 现代卡片 */
.modern-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  background-color: white;
}

.modern-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* 内容编辑器 */
.content-editor {
  height: 240px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.content-editor:hover {
  border-color: #cbd5e1;
}

/* 现代按钮 */
.modern-button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
  padding: 8px 16px;
}

.modern-button.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}

.modern-button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.modern-button.secondary {
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.modern-button.secondary:hover {
  background-color: #e2e8f0;
}

.modern-button.danger {
  background-color: #ef4444;
  border: none;
  color: white;
}

.modern-button.danger:hover {
  background-color: #dc2626;
  transform: translateY(-1px);
}

/* 现代复选框 */
.modern-checkbox {
  font-weight: 500;
  color: #475569;
}

/* 现代提示框 */
.modern-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #38bdf8;
}

.alert-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-content {
  flex: 1;
}

.alert-content p {
  margin: 0 0 8px 0;
  color: #1e40af;
  font-size: 14px;
}

.alert-content p:last-child {
  margin-bottom: 0;
}

/* 答案选项 */
.options-list {
  margin-top: 16px;
}

.option-item {
  margin-bottom: 16px;
  padding: 16px;
  transition: all 0.3s ease;
}

.option-layout {
  display: flex;
  align-items: center;
  gap: 20px;
}

.option-left {
  flex-shrink: 0;
  width: 220px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.option-left :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #409eff;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.option-left :deep(.el-checkbox__input.is-checked .el-checkbox__inner::after) {
  transform: rotate(45deg) scaleY(1);
}

.option-item.correct-answer {
  border-color: #67c23a;
  box-shadow: 0 0 0 3px rgba(103, 194, 58, 0.1);
}

.option-item.correct-answer .option-left {
  background-color: #f0f9eb;
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 4px solid #67c23a;
}

.correct-badge {
  margin-left: 8px;
  padding: 2px 8px;
  background-color: #67c23a;
  color: white;
  font-size: 12px;
  font-weight: 500;
  border-radius: 10px;
  white-space: nowrap;
}

.option-label {
  font-weight: 500;
  color: #303133;
}

.option-right {
  flex: 1;
  min-width: 0;
}

.answer-input {
  height: 80px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.answer-input:hover {
  border-color: #cbd5e1;
}

.answer-input:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.answer-input :deep(.ql-container) {
  height: 80px;
  min-height: 80px;
}

.answer-input :deep(.ql-editor) {
  height: 80px;
  min-height: 80px;
  line-height: 1.5;
  padding: 8px 12px;
}

.add-option-btn {
  margin-top: 20px;
  text-align: right;
}

/* 媒体上传 */
.media-upload {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.media-input {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.media-input .modern-input {
  flex: 1;
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  background-color: white;
  border-top: 1px solid #e2e8f0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .question-form-container {
    padding: 20px;
  }
  
  .form-section {
    padding: 20px;
    margin-bottom: 24px;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .content-editor {
    height: 200px;
  }
  
  .section-title {
    font-size: 16px;
  }
  
  .dialog-footer {
    flex-direction: column;
  }
  
  .dialog-footer .modern-button {
    width: 100%;
  }
}

/* 滚动条样式 */
.question-form-container::-webkit-scrollbar {
  width: 8px;
}

.question-form-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.question-form-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.question-form-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>