<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="(value) => emit('update:visible', value)"
    :title="isEditing ? '编辑题目' : '添加题目'"
    width="1000px"
  >
    <el-form :model="form" label-width="100px">
      <el-form-item label="学科">
        <el-select v-model="form.subjectId" placeholder="选择学科" style="width: 100%;">
          <el-option v-for="subject in subjects" :key="subject.id" :label="subject.name" :value="subject.id"></el-option>
        </el-select>
      </el-form-item>
      
      <el-form-item label="学科题库">
        <el-select v-model="form.subcategoryId" placeholder="选择学科题库" style="width: 100%;">
          <el-option v-for="subcategory in currentSubcategories" :key="subcategory.id" :label="subcategory.name" :value="subcategory.id"></el-option>
        </el-select>
      </el-form-item>
      
      <el-form-item label="题目类型">
        <el-select v-model="form.type" placeholder="选择类型" style="width: 100%;">
          <el-option label="单选题" value="single"></el-option>
          <el-option label="多选题" value="multiple"></el-option>
          <el-option label="判断题" value="judgment"></el-option>
          <el-option label="听力题" value="listening"></el-option>
          <el-option label="阅读题" value="reading"></el-option>
          <el-option label="看图题" value="image"></el-option>
        </el-select>
      </el-form-item>
      
      <el-form-item label="题目内容">
        <div style="height: 200px; margin-bottom: 20px; clear: both;">
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
      </el-form-item>
      
      <el-form-item label="添加答案">
        <div class="options-container" style="margin-top: 20px;">
          <div class="correct-answer-tip" style="margin-bottom: 10px; padding: 10px; background-color: #f0f9ff; border-radius: 4px; border-left: 4px solid #409eff;">
            <span style="font-weight: bold; color: #409eff;">提示：</span> 勾选框用于标记<strong>正确答案</strong>，请选择一个或多个正确的选项。<br>
            <span style="font-weight: bold; color: #409eff;">图片上传：</span> 您可以直接复制图片，然后粘贴到答案编辑器中，或使用编辑器工具栏中的图片按钮上传图片。
          </div>
          <div v-for="(option, index) in form.options" :key="`option-${index}`" class="option-item">
            <el-checkbox 
              :label="String.fromCharCode(65 + index)" 
              v-model="form.selectedAnswers"
              :disabled="form.type === 'single' && form.selectedAnswers.length > 0 && !form.selectedAnswers.includes(String.fromCharCode(65 + index))"
            >
              {{ String.fromCharCode(65 + index) }}. 
            </el-checkbox>
            <div style="flex: 1; margin-left: 10px; margin-right: 10px;">
              <EditableContent 
                v-model="form.options[index]"
                placeholder="输入答案内容"
              />
            </div>
            <el-button type="danger" size="small" @click="removeOption(index)">删除</el-button>
          </div>
          <el-button type="primary" size="small" @click="addOption" style="margin-top: 10px;">添加答案</el-button>
        </div>
      </el-form-item>
      
      <el-form-item label="答案" v-if="false">
        <el-input v-model="form.answer" placeholder="输入答案，如：A或AB"></el-input>
      </el-form-item>
      
      <el-form-item label="解析">
        <el-input v-model="form.explanation" type="textarea" :rows="2" placeholder="输入答案解析"></el-input>
      </el-form-item>
      
      <el-form-item label="音频文件">
        <el-upload
          class="upload-audio"
          action="#"
          :auto-upload="false"
          :on-change="handleAudioChange"
          accept=".mp3,.wav"
          :limit="1"
        >
          <el-button size="small" type="primary">上传音频</el-button>
          <template #tip>
            <div class="el-upload__tip">
              请上传MP3或WAV格式的音频文件
            </div>
          </template>
        </el-upload>
        <div style="margin-top: 10px; display: flex; align-items: center;">
          <el-input v-model="form.audio" placeholder="输入音频文件路径，如：audio/elephant.mp3" style="flex: 1;"></el-input>
          <el-button 
            v-if="form.audio" 
            type="danger" 
            size="small" 
            @click="deleteAudio"
            style="margin-left: 10px;"
          >
            删除音频
          </el-button>
        </div>
      </el-form-item>
      

    </el-form>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="emit('update:visible', false)">取消</el-button>
        <el-button type="primary" @click="saveQuestion">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import { ElMessage } from 'element-plus';
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
  audio: ''
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
    image: image
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
    audio: ''
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
    image: form.value.image
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
.dialog-footer {
  text-align: center;
}

.option-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
  gap: 10px;
  flex-wrap: wrap;
}

.option-item .el-checkbox {
  margin-top: 5px;
  flex-shrink: 0;
}

.option-item .el-upload {
  margin-top: 5px;
}

.option-item .el-button {
  margin-top: 5px;
  flex-shrink: 0;
}
</style>