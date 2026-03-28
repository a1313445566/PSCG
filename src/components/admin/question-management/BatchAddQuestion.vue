<template>
  <el-dialog
    :model-value="visible"
    title="批量添加题目"
    width="1000px"
    @update:model-value="value => emit('update:visible', value)"
  >
    <div class="batch-add-management">
      <div class="batch-add-layout">
        <!-- 左侧输入区域 -->
        <div class="input-section">
          <el-form label-width="100px">
            <el-form-item label="学科">
              <el-select
                v-model="batchSubjectId"
                placeholder="选择学科"
                style="width: 100%"
                @change="updateBatchSubcategories"
              >
                <el-option
                  v-for="subject in subjects"
                  :key="subject.id"
                  :label="subject.name"
                  :value="subject.id"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="学科题库">
              <el-select
                v-model="batchSubcategoryId"
                placeholder="选择学科题库"
                style="width: 100%"
              >
                <el-option
                  v-for="subcategory in batchSubcategories"
                  :key="subcategory.id"
                  :label="subcategory.name"
                  :value="subcategory.id"
                ></el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="题目文本">
              <el-input
                v-model="batchQuestionText"
                type="textarea"
                :rows="15"
                placeholder="请粘贴题目文本，格式如下：\n下面语句中加点的词语运用不恰当的一项是(B)\nA. 选项1\nB. 选项2\nC. 选项3\nD. 选项4"
                style="width: 100%"
              ></el-input>
            </el-form-item>
          </el-form>
        </div>

        <!-- 右侧预览区域 -->
        <div class="preview-section">
          <h3>题目预览</h3>
          <div v-if="parsedQuestions.length > 0" class="preview-content">
            <div v-for="(question, index) in parsedQuestions" :key="index" class="preview-question">
              <div class="preview-question-content">
                <span class="question-number">{{ index + 1 }}.</span>
                <span v-html="question.content"></span>
              </div>
              <div class="preview-options">
                <div
                  v-for="(option, optIndex) in question.options"
                  :key="optIndex"
                  class="preview-option"
                >
                  <span class="option-label">{{ String.fromCharCode(65 + optIndex) }}.</span>
                  {{ option }}
                  <span
                    v-if="question.answer.includes(String.fromCharCode(65 + optIndex))"
                    class="correct-answer-tag"
                  >
                    (正确答案)
                  </span>
                </div>
              </div>
              <div v-if="question.explanation" class="preview-explanation">
                <span class="explanation-label">解析：</span>
                <span>{{ question.explanation }}</span>
              </div>
            </div>
          </div>
          <div v-else class="preview-empty">
            <p>请输入题目文本并点击"解析题目"按钮</p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="emit('update:visible', false)">取消</el-button>
        <el-button type="primary" @click="parseBatchQuestions">解析题目</el-button>
        <el-button
          type="success"
          :disabled="parsedQuestions.length === 0"
          @click="saveBatchQuestions"
        >
          批量添加
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 定义属性和事件
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  subjects: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible', 'batch-add-questions'])

// 批量添加参数
const batchSubjectId = ref('')
const batchSubcategoryId = ref('')
const batchQuestionText = ref('')

// 解析后的题目
const parsedQuestions = ref([])

// 计算当前学科的子分类
const batchSubcategories = computed(() => {
  if (!batchSubjectId.value) return []
  const subject = props.subjects.find(s => String(s.id) === String(batchSubjectId.value))
  return subject ? subject.subcategories || [] : []
})

// 更新批量添加的子分类
const updateBatchSubcategories = () => {
  batchSubcategoryId.value = ''
}

// 解析批量题目文本
const parseBatchQuestions = () => {
  if (!batchQuestionText.value.trim()) {
    ElMessage.warning('请输入题目文本')
    return
  }

  const questions = []
  const lines = batchQuestionText.value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  let currentQuestion = null
  let inOptions = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 检查是否是新题目
    // 模式1: 数字+标点+题目内容+答案括号 (如: 1. 题目内容(A))
    // 模式2: 题目内容+答案括号 (如: 题目内容(A))
    // 支持答案括号后有句号等标点的情况
    const numberedQuestionMatch = line.match(
      /^(\d+[.、]\s*)(.+?)([\(（]\s*[A-Da-d]+\s*[\)）])(.*)$/
    )
    const unnumberedQuestionMatch = line.match(/^(.+?)([\(（]\s*[A-Da-d]+\s*[\)）])(.*)$/)

    if (numberedQuestionMatch) {
      // 保存当前题目（如果存在）
      if (currentQuestion) {
        questions.push(currentQuestion)
      }

      // 创建新题目
      const questionText = numberedQuestionMatch[2].trim()
      const answerMatch = numberedQuestionMatch[3].match(/[A-Da-d]+/)
      const answer = answerMatch ? answerMatch[0].toUpperCase() : ''
      const postfix = numberedQuestionMatch[4] || ''

      // 自动识别题目类型
      let questionType = 'single'
      // 检查是否有【多选】标记
      if (questionText.includes('【多选】') || answer.length > 1) {
        questionType = 'multiple'
      }

      // 保留括号但移除括号中的答案
      const contentWithEmptyBrackets =
        questionText + numberedQuestionMatch[3].replace(/[A-Da-d]+/, '') + postfix
      currentQuestion = {
        content: contentWithEmptyBrackets,
        answer: answer,
        type: questionType,
        options: [],
        explanation: ''
      }
      inOptions = true
    } else if (unnumberedQuestionMatch) {
      // 保存当前题目（如果存在）
      if (currentQuestion) {
        questions.push(currentQuestion)
      }

      // 创建新题目（无编号）
      const questionText = unnumberedQuestionMatch[1].trim()
      const answerMatch = unnumberedQuestionMatch[2].match(/[A-Da-d]+/)
      const answer = answerMatch ? answerMatch[0].toUpperCase() : ''
      const postfix = unnumberedQuestionMatch[3] || ''

      // 自动识别题目类型
      let questionType = 'single'
      // 检查是否有【多选】标记
      if (questionText.includes('【多选】') || answer.length > 1) {
        questionType = 'multiple'
      }

      // 保留括号但移除括号中的答案
      const contentWithEmptyBrackets =
        questionText + unnumberedQuestionMatch[2].replace(/[A-Da-d]+/, '') + postfix
      currentQuestion = {
        content: contentWithEmptyBrackets,
        answer: answer,
        type: questionType,
        options: [],
        explanation: ''
      }
      inOptions = true
    } else if (inOptions && currentQuestion) {
      // 检查是否是选项（以字母+标点开头，允许行首有空格）
      const optionMatch = line.match(/^\s*([A-Za-z][\.\、．]?\s*)(.*)$/)
      if (optionMatch) {
        // 移除选项标签（A.、B.等），只保留实际内容
        const optionContent = optionMatch[2].trim()
        currentQuestion.options.push(optionContent)
      } else {
        // 检查是否是解析（允许行首有空格）
        const explanationMatch = line.match(/^\s*解析[:：]\s*(.*)$/)
        if (explanationMatch) {
          // 提取解析内容
          currentQuestion.explanation = explanationMatch[1].trim()
        } else {
          // 如果不是选项和解析，可能是题目内容的延续（多行题目）
          // 这里暂时不处理，实际应用中可能需要更复杂的逻辑
        }
      }
    }
  }

  // 保存最后一个题目
  if (currentQuestion) {
    questions.push(currentQuestion)
  }

  parsedQuestions.value = questions
  ElMessage.success(`成功解析 ${questions.length} 个题目`)
}

// 保存批量添加的题目
const saveBatchQuestions = () => {
  if (parsedQuestions.value.length === 0) {
    ElMessage.warning('请先解析题目')
    return
  }

  if (!batchSubjectId.value) {
    ElMessage.warning('请选择学科')
    return
  }

  if (!batchSubcategoryId.value) {
    ElMessage.warning('请选择学科题库')
    return
  }

  // 处理题目数据
  const questionsToAdd = parsedQuestions.value.map(question => ({
    subjectId: batchSubjectId.value,
    subcategoryId: batchSubcategoryId.value,
    type: question.type,
    content: question.content,
    options: question.options,
    answer: question.answer,
    explanation: question.explanation
  }))

  // 发送批量添加事件
  emit('batch-add-questions', questionsToAdd)
  emit('update:visible', false)

  // 重置表单
  batchSubjectId.value = ''
  batchSubcategoryId.value = ''
  batchQuestionText.value = ''
  parsedQuestions.value = []
}
</script>

<style scoped>
.batch-add-layout {
  display: flex;
  gap: 20px;
}

.input-section {
  flex: 1;
}

.preview-section {
  flex: 1;
  max-height: 500px;
  overflow-y: auto;
}

.preview-question {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.question-number {
  font-weight: bold;
  margin-right: 8px;
}

.preview-options {
  margin-top: 10px;
  margin-left: 20px;
}

.preview-option {
  margin-bottom: 5px;
}

.option-label {
  font-weight: bold;
  margin-right: 8px;
}

.correct-answer-tag {
  color: #67c23a;
  font-weight: bold;
  margin-left: 10px;
}

.preview-explanation {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e0e0e0;
  font-style: italic;
}

.explanation-label {
  font-weight: bold;
  margin-right: 8px;
}

.preview-empty {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.dialog-footer {
  text-align: center;
}
</style>
