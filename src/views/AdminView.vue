<template>
  <div class="admin-container">
    <!-- 密码验证对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="🔐 后台管理登录"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <el-form :model="passwordForm" label-width="80px">
        <el-form-item label="密码">
          <el-input v-model="passwordForm.password" type="password" placeholder="请输入管理密码" show-password></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="verifyPassword">登录</el-button>
        </span>
      </template>
    </el-dialog>

    <div class="admin-header" v-if="isAuthenticated">
      <h1 class="title">题库管理系统</h1>
      <div class="header-buttons">
        <router-link to="/" class="back-home-btn">
          <el-button type="primary">返回首页</el-button>
        </router-link>
        <el-button type="danger" @click="logout">退出登录</el-button>
      </div>
    </div>
    
    <el-tabs v-model="activeTab" v-if="isAuthenticated">
      <!-- 学科管理 -->
      <el-tab-pane label="学科管理" name="subjects">
        <div class="subject-management">
          <div class="add-subject">
            <el-input v-model="newSubjectName" placeholder="输入学科名称" style="width: 200px; margin-right: 10px;"></el-input>
            <el-select v-model="newSubjectIcon" placeholder="选择图标" style="width: 100px; margin-right: 10px;">
              <el-option v-for="(icon, index) in subjectIcons" :key="index" :label="icon" :value="index"></el-option>
            </el-select>
            <el-button type="primary" @click="addSubject">添加学科</el-button>
            <el-button type="warning" @click="importLocalData">导入本地数据</el-button>
          </div>
          
          <el-table :data="subjects" style="margin-top: 20px;">
            <el-table-column prop="id" label="ID" width="80"></el-table-column>
            <el-table-column label="图标" width="80">
              <template #default="{ row }">
                <span class="subject-icon">{{ subjectIcons[row.iconIndex || 0] }}</span>
              </template>
            </el-table-column>
            <el-table-column label="学科名称">
              <template #default="{ row }">
                <div v-if="editingSubjectId === row.id" class="subject-edit">
                  <el-input v-model="editingSubjectName" placeholder="输入学科名称" style="width: 200px; margin-right: 10px;"></el-input>
                  <el-select v-model="editingSubjectIcon" placeholder="选择图标" style="width: 100px; margin-right: 10px;">
                    <el-option v-for="(icon, index) in subjectIcons" :key="index" :label="icon" :value="index"></el-option>
                  </el-select>
                  <el-button type="primary" size="small" @click="saveSubjectEdit(row.id)">保存</el-button>
                  <el-button size="small" @click="cancelSubjectEdit">取消</el-button>
                </div>
                <div v-else class="subject-info">
                  <span>{{ row.name }}</span>
                  <el-button type="text" size="small" @click="editSubject(row)">编辑</el-button>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="子分类数量" width="120">
              <template #default="{ row }">
                {{ row.subcategories ? row.subcategories.length : 0 }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="manageSubcategories(row)">管理子分类</el-button>
                <el-button type="danger" size="small" @click="deleteSubject(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
      
      <!-- 题目管理 -->
      <el-tab-pane label="题目管理" name="questions">
        <div class="question-management">
          <div class="filter-section">
            <div class="filter-row">
              <el-input v-model="searchKeyword" placeholder="搜索题目内容" style="width: 300px; margin-right: 10px;"></el-input>
              <el-select v-model="filterSubjectId" placeholder="选择学科" style="width: 120px; margin-right: 10px;">
                <el-option label="全部学科" value=""></el-option>
                <el-option v-for="subject in subjects" :key="subject.id" :label="subject.name" :value="subject.id"></el-option>
              </el-select>
              <el-select v-model="filterType" placeholder="选择类型" style="width: 120px; margin-right: 10px;">
                <el-option label="全部类型" value=""></el-option>
                <el-option label="单选题" value="single"></el-option>
                <el-option label="多选题" value="multiple"></el-option>
                <el-option label="判断题" value="judgment"></el-option>
                <el-option label="听力题" value="listening"></el-option>
                <el-option label="阅读题" value="reading"></el-option>
                <el-option label="看图题" value="image"></el-option>
              </el-select>
            </div>
            <div class="action-buttons">
              <el-button type="primary" @click="showAddQuestionDialog">添加题目</el-button>
              <el-button type="success" @click="batchAddDialogVisible = true">批量添加题目</el-button>
              <el-button type="danger" @click="batchDeleteQuestions" :disabled="selectedQuestions.length === 0">批量删除</el-button>
            </div>
          </div>
          
          <div class="table-container">
            <el-table 
              :data="filteredQuestions" 
              style="margin-top: 20px; width: 100%"
              @selection-change="handleSelectionChange"
              stripe
              border
              :default-sort="{prop: 'createdAt', order: 'descending'}"
            >
              <el-table-column type="selection" width="40"></el-table-column>
              <el-table-column prop="id" label="ID" width="40"></el-table-column>
              <el-table-column prop="subjectName" label="学科" width="70">
                <template #default="{ row }">
                  <span class="subject-tag">{{ row.subjectName }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="subcategoryName" label="子分类" width="90"></el-table-column>
              <el-table-column prop="type" label="类型" width="60">
                <template #default="{ row }">
                  <span class="type-tag" :class="'type-' + row.type">
                    {{ 
                      row.type === 'single' ? '单选' : 
                      row.type === 'multiple' ? '多选' : 
                      row.type === 'judgment' ? '判断' : 
                      row.type === 'listening' ? '听力' : 
                      row.type === 'reading' ? '阅读' : 
                      row.type === 'image' ? '看图' : '未知'
                    }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="content" label="题目内容" min-width="150">
                <template #default="{ row }">
                  <div class="question-row">
                    <el-tooltip :content="row.content" placement="top" effect="dark" :enterable="true" :popper-class="'content-tooltip'">
                      <div class="question-content-preview">
                        <div v-if="hasValidImage(row.content) || row.audio" class="content-with-media">
                          <span class="image-indicator" v-if="hasValidImage(row.content)">📷</span>
                          <span class="audio-indicator" v-if="row.audio">🎵</span>
                          <span class="content-text" v-html="row.content"></span>
                        </div>
                        <div v-else class="content-text">
                          {{ row.content }}
                        </div>
                      </div>
                    </el-tooltip>
                    <div class="row-operations">
                      <el-button type="primary" size="small" @click="editQuestion(row)">编辑</el-button>
                      <el-button type="danger" size="small" @click="deleteQuestion(row.id)">删除</el-button>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="answer" label="答案" width="60">
                <template #default="{ row }">
                  <span class="answer-tag">{{ row.answer }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="createdAt" label="时间" width="120">
                <template #default="{ row }">
                  {{ row.createdAt || '未知' }}
                </template>
              </el-table-column>

            </el-table>
          </div>
          
          <!-- 分页组件 -->
          <div class="pagination" style="margin-top: 20px; text-align: right;">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <!-- 子分类管理对话框 -->
    <el-dialog
      v-model="subcategoryDialogVisible"
      :title="`管理 ${currentSubjectForSubcategory?.name} 的子分类`"
      width="700px"
    >
      <div class="subcategory-management">
        <div class="add-subcategory">
          <el-input v-model="newSubcategoryName" placeholder="输入子分类名称" style="width: 200px; margin-right: 10px;"></el-input>
          <el-select v-model="newSubcategoryIcon" placeholder="选择图标" style="width: 100px; margin-right: 10px;">
            <el-option v-for="(icon, index) in subjectIcons" :key="index" :label="icon" :value="index"></el-option>
          </el-select>
          <el-button type="primary" @click="addSubcategory">添加子分类</el-button>
        </div>
        
        <el-table :data="currentSubjectForSubcategory?.subcategories" style="margin-top: 20px;">
          <el-table-column prop="id" label="ID" width="80"></el-table-column>
          <el-table-column label="图标" width="80">
            <template #default="{ row }">
              <span class="subcategory-icon">{{ subjectIcons[row.iconIndex || 0] }}</span>
            </template>
          </el-table-column>
          <el-table-column label="子分类名称">
            <template #default="{ row }">
              <div v-if="editingSubcategoryId === row.id" class="subcategory-edit">
                <el-input v-model="editingSubcategoryName" placeholder="输入子分类名称" style="width: 200px; margin-right: 10px;"></el-input>
                <el-select v-model="editingSubcategoryIcon" placeholder="选择图标" style="width: 100px; margin-right: 10px;">
                  <el-option v-for="(icon, index) in subjectIcons" :key="index" :label="icon" :value="index"></el-option>
                </el-select>
                <el-button type="primary" size="small" @click="saveSubcategoryEdit(row.id)">保存</el-button>
                <el-button size="small" @click="cancelSubcategoryEdit">取消</el-button>
              </div>
              <div v-else class="subcategory-info">
                <span>{{ row.name }}</span>
                <el-button type="text" size="small" @click="editSubcategory(row)">编辑</el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="danger" size="small" @click="deleteSubcategory(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="subcategoryDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 批量添加题目对话框 -->
    <el-dialog
      v-model="batchAddDialogVisible"
      title="批量添加题目"
      width="1000px"
    >
      <div class="batch-add-management">
        <div class="batch-add-layout">
          <!-- 左侧输入区域 -->
          <div class="input-section">
            <el-form label-width="100px">
              <el-form-item label="学科">
                <el-select v-model="batchSubjectId" placeholder="选择学科" style="width: 100%;" @change="updateBatchSubcategories">
                  <el-option v-for="subject in subjects" :key="subject.id" :label="subject.name" :value="subject.id"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="子分类">
                <el-select v-model="batchSubcategoryId" placeholder="选择子分类" style="width: 100%;">
                  <el-option v-for="subcategory in batchSubcategories" :key="subcategory.id" :label="subcategory.name" :value="subcategory.id"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="题目类型">
                <el-select v-model="batchQuestionType" placeholder="选择题目类型" style="width: 100%;">
                  <el-option label="单选题" value="single"></el-option>
                  <el-option label="多选题" value="multiple"></el-option>
                  <el-option label="判断题" value="judgment"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="题目文本">
                <el-input
                  v-model="batchQuestionText"
                  type="textarea"
                  :rows="15"
                  placeholder="请粘贴题目文本，格式如下：\n下面语句中加点的词语运用不恰当的一项是(B)\nA. 选项1\nB. 选项2\nC. 选项3\nD. 选项4"
                  style="width: 100%;"
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
                  <span class="question-number">{{ index + 1 }}. </span>
                  <span v-html="formatQuestionContent(question.content, question.answer)"></span>
                </div>
                <div class="preview-options">
                  <div v-for="(option, optIndex) in question.options" :key="optIndex" class="preview-option">
                    {{ option }}
                    <span v-if="option.trim().startsWith(question.answer + '.') || option.trim().startsWith(question.answer + '、') || option.trim().startsWith(question.answer + '．') || option.trim().startsWith(question.answer.toLowerCase() + '.') || option.trim().startsWith(question.answer.toLowerCase() + '、') || option.trim().startsWith(question.answer.toLowerCase() + '．')" class="correct-answer-tag">(正确答案)</span>
                  </div>
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
          <el-button @click="batchAddDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="parseBatchQuestions">解析题目</el-button>
          <el-button type="success" @click="saveBatchQuestions" :disabled="parsedQuestions.length === 0">批量添加</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 添加/编辑题目对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑题目' : '添加题目'"
      width="800px"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="学科">
          <el-select v-model="form.subjectId" placeholder="选择学科" style="width: 100%;">
            <el-option v-for="subject in subjects" :key="subject.id" :label="subject.name" :value="subject.id"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="子分类">
          <el-select v-model="form.subcategoryId" placeholder="选择子分类" style="width: 100%;">
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
          <div style="height: 200px; margin-bottom: 50px; clear: both; position: relative; z-index: 100;">
            <QuillEditor
              :key="editorKey"
              ref="quillEditor"
              v-model:content="form.content"
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
              style="width: 100%; height: 100%; position: relative; z-index: 101;"
            />
          </div>
        </el-form-item>
        
        <el-form-item label="添加答案">
          <div class="options-container" style="margin-top: 50px;">
            <div class="correct-answer-tip" style="margin-bottom: 10px; padding: 10px; background-color: #f0f9ff; border-radius: 4px; border-left: 4px solid #409eff;">
              <span style="font-weight: bold; color: #409eff;">提示：</span> 勾选框用于标记<strong>正确答案</strong>，请选择一个或多个正确的选项。<br>
              <span style="font-weight: bold; color: #409eff;">图片上传：</span> 您可以直接复制图片，然后粘贴到答案编辑器中，或使用编辑器工具栏中的图片按钮上传图片。
            </div>
            <div v-for="(option, index) in form.options" :key="index" class="option-item">
              <el-checkbox 
                :label="String.fromCharCode(65 + index)" 
                v-model="form.selectedAnswers"
                :disabled="form.type === 'single' && form.selectedAnswers.length > 0 && !form.selectedAnswers.includes(String.fromCharCode(65 + index))"
              >
                {{ String.fromCharCode(65 + index) }}. 
              </el-checkbox>
              <div style="flex: 1; margin-left: 10px; margin-right: 10px;">
                <div 
                  contenteditable="true"
                  :innerHTML="form.options[index]"
                  placeholder="输入答案内容"
                  style="width: 100%; min-height: 100px; padding: 10px; border: 1px solid #dcdfe6; border-radius: 4px; outline: none;"
                  @paste="handlePaste"
                  @blur="handleContentChange($event, index)"
                ></div>
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
        
        <el-form-item label="图片文件">
          <el-upload
            class="upload-image"
            action="#"
            :auto-upload="false"
            :on-change="handleImageChange"
            accept=".jpg,.jpeg,.png,.gif"
            :limit="1"
          >
            <el-button size="small" type="primary">上传图片</el-button>
            <template #tip>
              <div class="el-upload__tip">
                请上传JPG、JPEG、PNG或GIF格式的图片文件
              </div>
            </template>
          </el-upload>
          <el-input v-model="form.image" placeholder="输入图片文件路径，如：images/cat.jpg" style="margin-top: 10px;"></el-input>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveQuestion">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useQuestionStore } from '../stores/questionStore'
import { getApiBaseUrl } from '../utils/database'
import { ElTabs, ElTabPane, ElInput, ElButton, ElTable, ElTableColumn, ElSelect, ElOption, ElDialog, ElForm, ElFormItem, ElPagination, ElCheckbox, ElCheckboxGroup, ElUpload, ElMessage, ElMessageBox, ElTooltip } from 'element-plus'
import { QuillEditor } from '@vueup/vue-quill'
import 'element-plus/dist/index.css'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const store = useQuestionStore()

const activeTab = ref('subjects')
const newSubjectName = ref('')
const newSubjectIcon = ref(0)
const subjects = computed(() => store.subjects)
const questions = computed(() => store.questions)
const filterSubjectId = ref('')
const dialogVisible = ref(false)
const isEditing = ref(false)

// 学科编辑相关
const editingSubjectId = ref(null)
const editingSubjectName = ref('')
const editingSubjectIcon = ref(0)

// 学科图标
const subjectIcons = ['📚', '🔢', '🌍', '⚡', '🎨', '🎵', '⚽', '🔬']

// 子分类管理相关
const subcategoryDialogVisible = ref(false)
const currentSubjectForSubcategory = ref(null)
const newSubcategoryName = ref('')
const newSubcategoryIcon = ref(0)

// 子分类编辑相关
const editingSubcategoryId = ref(null)
const editingSubcategoryName = ref('')
const editingSubcategoryIcon = ref(0)

// 批量添加题目相关
const batchAddDialogVisible = ref(false)
const batchSubjectId = ref('')
const batchSubcategoryId = ref('')
const batchQuestionType = ref('single')
const batchQuestionText = ref('')
const parsedQuestions = ref([])

// 批量添加时的子分类列表
const batchSubcategories = computed(() => {
  if (!batchSubjectId.value) return []
  const subject = subjects.value.find(s => s.id === batchSubjectId.value)
  return subject ? subject.subcategories : []
})

// 题目管理相关
const searchKeyword = ref('')
const filterType = ref('')
const selectedQuestions = ref([])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 密码验证相关
const isAuthenticated = ref(localStorage.getItem('adminAuthenticated') === 'true')
const passwordDialogVisible = ref(!isAuthenticated.value)
const passwordForm = ref({
  password: ''
})

// 验证密码
const verifyPassword = () => {
  const correctPassword = 'xgsy8188'
  if (passwordForm.value.password === correctPassword) {
    isAuthenticated.value = true
    passwordDialogVisible.value = false
    localStorage.setItem('adminAuthenticated', 'true')
  } else {
    ElMessage.error('密码错误，请重新输入！')
    passwordForm.value.password = ''
  }
}

// 退出登录
const logout = () => {
  isAuthenticated.value = false
  passwordDialogVisible.value = true
  localStorage.removeItem('adminAuthenticated')
}

const form = ref({
  id: null,
  subjectId: '',
  subcategoryId: '',
  type: 'single',
  content: '<p>请输入题目内容</p>',
  options: ['', '', '', ''],
  answer: '',
  selectedAnswers: [],
  explanation: ''
})

const quillEditor = ref(null)
const editorKey = ref(0)

// 子分类相关
const currentSubcategories = computed(() => {
  if (!form.value.subjectId) return []
  const subject = subjects.value.find(s => s.id === form.value.subjectId)
  return subject ? subject.subcategories : []
})

const filteredQuestions = computed(() => {
  let filtered = questions.value
  
  // 按学科过滤
  if (filterSubjectId.value) {
    filtered = filtered.filter(q => q.subjectId === parseInt(filterSubjectId.value))
  }
  
  // 按类型过滤
  if (filterType.value) {
    filtered = filtered.filter(q => q.type === filterType.value)
  }
  
  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(q => q.content.toLowerCase().includes(keyword))
  }
  
  // 添加学科和子分类名称
  filtered = filtered.map(q => {
    // 获取学科名称
    const subject = subjects.value.find(s => s.id === q.subjectId)
    const subjectName = subject ? subject.name : ''
    
    // 获取子分类名称
    let subcategoryName = ''
    if (subject && q.subcategoryId) {
      const subcategory = subject.subcategories.find(s => s.id === q.subcategoryId)
      subcategoryName = subcategory ? subcategory.name : ''
    }
    
    return {
      ...q,
      subjectName,
      subcategoryName
    }
  })
  
  // 更新总数
  total.value = filtered.length
  
  // 计算分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filtered.slice(start, end)
})

const addSubject = () => {
  if (newSubjectName.value.trim()) {
    store.addSubject(newSubjectName.value.trim(), newSubjectIcon.value)
    newSubjectName.value = ''
    newSubjectIcon.value = 0
  }
}

// 编辑学科
const editSubject = (subject) => {
  editingSubjectId.value = subject.id
  editingSubjectName.value = subject.name
  editingSubjectIcon.value = subject.iconIndex || 0
}

// 保存学科编辑
const saveSubjectEdit = (subjectId) => {
  if (editingSubjectName.value.trim()) {
    store.updateSubject(subjectId, editingSubjectName.value.trim(), editingSubjectIcon.value)
    cancelSubjectEdit()
  }
}

// 取消学科编辑
const cancelSubjectEdit = () => {
  editingSubjectId.value = null
  editingSubjectName.value = ''
  editingSubjectIcon.value = 0
}

const deleteSubject = (subjectId) => {
  ElMessageBox.confirm('确定要删除该学科吗？删除后相关题目也会被删除。', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
  .then(() => {
    store.deleteSubject(subjectId)
  })
  .catch(() => {
    // 取消删除
  })
}

// 子分类管理方法
const manageSubcategories = (subject) => {
  currentSubjectForSubcategory.value = subject
  subcategoryDialogVisible.value = true
}

const addSubcategory = () => {
  if (newSubcategoryName.value.trim() && currentSubjectForSubcategory.value) {
    store.addSubcategory(currentSubjectForSubcategory.value.id, newSubcategoryName.value.trim(), newSubcategoryIcon.value)
    newSubcategoryName.value = ''
    newSubcategoryIcon.value = 0
  }
}

// 编辑子分类
const editSubcategory = (subcategory) => {
  editingSubcategoryId.value = subcategory.id
  editingSubcategoryName.value = subcategory.name
  editingSubcategoryIcon.value = subcategory.iconIndex || 0
}

// 保存子分类编辑
const saveSubcategoryEdit = (subcategoryId) => {
  if (editingSubcategoryName.value.trim() && currentSubjectForSubcategory.value) {
    store.updateSubcategory(currentSubjectForSubcategory.value.id, subcategoryId, editingSubcategoryName.value.trim(), editingSubcategoryIcon.value)
    cancelSubcategoryEdit()
  }
}

// 取消子分类编辑
const cancelSubcategoryEdit = () => {
  editingSubcategoryId.value = null
  editingSubcategoryName.value = ''
  editingSubcategoryIcon.value = 0
}

// 更新批量添加时的子分类列表
const updateBatchSubcategories = () => {
  batchSubcategoryId.value = ''
}

// 解析批量添加的题目
const parseBatchQuestions = () => {
  const text = batchQuestionText.value
  if (!text) {
    ElMessage.error('请输入题目文本')
    return
  }
  
  const questions = []
  
  // 按题目分割文本，支持多种格式
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  let currentQuestion = null
  let inOptions = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // 检查是否是新题目
    // 模式1: 数字+标点+题目内容+答案括号 (如: 1. 题目内容(A))
    // 模式2: 题目内容+答案括号 (如: 题目内容(A))
    const numberedQuestionMatch = line.match(/^(\d+[.、]\s*)(.+?)([\(（]\s*[A-Za-z]*\s*[\)）])$/)
    const unnumberedQuestionMatch = line.match(/^(.+?)([\(（]\s*[A-Za-z]*\s*[\)）])$/)
    
    if (numberedQuestionMatch) {
      // 保存当前题目（如果存在）
      if (currentQuestion) {
        questions.push(currentQuestion)
      }
      
      // 创建新题目
      const questionText = numberedQuestionMatch[2].trim()
      const answerMatch = numberedQuestionMatch[3].match(/[A-Za-z]+/)
      const answer = answerMatch ? answerMatch[0].toUpperCase() : ''
      
      currentQuestion = {
        content: questionText + numberedQuestionMatch[3],
        answer: answer,
        options: []
      }
      inOptions = true
    } else if (unnumberedQuestionMatch) {
      // 保存当前题目（如果存在）
      if (currentQuestion) {
        questions.push(currentQuestion)
      }
      
      // 创建新题目（无编号）
      const questionText = unnumberedQuestionMatch[1].trim()
      const answerMatch = unnumberedQuestionMatch[2].match(/[A-Za-z]+/)
      const answer = answerMatch ? answerMatch[0].toUpperCase() : ''
      
      currentQuestion = {
        content: questionText + unnumberedQuestionMatch[2],
        answer: answer,
        options: []
      }
      inOptions = true
    } else if (inOptions && currentQuestion) {
      // 检查是否是选项（以字母+标点开头）
      const optionMatch = line.match(/^([A-Za-z][\.\、．]?\s*.*)$/)
      if (optionMatch) {
        currentQuestion.options.push(optionMatch[1].trim())
      } else {
        // 如果不是选项，可能是题目内容的延续（多行题目）
        currentQuestion.content += ' ' + line
      }
    }
  }
  
  // 保存最后一个题目
  if (currentQuestion) {
    questions.push(currentQuestion)
  }
  
  parsedQuestions.value = questions
  
  if (questions.length > 0) {
    ElMessage.success(`成功解析 ${questions.length} 道题目`)
  } else {
    ElMessage.error('未解析到题目，请检查格式')
  }
}

// 保存批量添加的题目
const saveBatchQuestions = async () => {
  if (parsedQuestions.value.length === 0) {
    ElMessage.error('请先解析题目')
    return
  }
  
  if (!batchSubjectId.value || !batchSubcategoryId.value) {
    ElMessage.error('请选择学科和子分类')
    return
  }
  
  let successCount = 0
  
  for (const question of parsedQuestions.value) {
    // 从题目内容中移除答案部分，然后添加带两个空格的括号
    let contentWithoutAnswer = question.content
    // 匹配并移除答案括号部分，如：(A)、( A )、(     )、（A）、（ A ）、（     ）、(a)、( a )等
    contentWithoutAnswer = contentWithoutAnswer.replace(/\s*[\(（]\s*[A-Za-z]*\s*[\)）]/, ' (  )')
    
    const questionData = {
      subjectId: batchSubjectId.value,
      subcategoryId: batchSubcategoryId.value,
      type: batchQuestionType.value,
      content: contentWithoutAnswer,
      options: question.options,
      correctAnswer: question.answer,
      explanation: ''
    }
    
    try {
      await store.addQuestion(questionData)
      successCount++
    } catch (error) {
      console.error('添加题目失败:', error)
    }
  }
  
  ElMessage.success(`成功添加 ${successCount} 道题目`)
  batchAddDialogVisible.value = false
  // 重置表单
  batchSubjectId.value = ''
  batchSubcategoryId.value = ''
  batchQuestionType.value = 'single'
  batchQuestionText.value = ''
  parsedQuestions.value = []
}

const deleteSubcategory = (subcategoryId) => {
  ElMessageBox.confirm('确定要删除该子分类吗？删除后相关题目也会被删除。', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
  .then(() => {
    if (currentSubjectForSubcategory.value) {
      store.deleteSubcategory(currentSubjectForSubcategory.value.id, subcategoryId)
    }
  })
  .catch(() => {
    // 取消删除
  })
}

// 题目管理方法
const handleSelectionChange = (selection) => {
  selectedQuestions.value = selection
}

const batchDeleteQuestions = () => {
  if (selectedQuestions.value.length === 0) return
  
  ElMessageBox.confirm(`确定要删除选中的 ${selectedQuestions.value.length} 道题目吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
  .then(() => {
    selectedQuestions.value.forEach(question => {
      store.deleteQuestion(question.id)
    })
    selectedQuestions.value = []
  })
  .catch(() => {
    // 取消删除
  })
}

const showAddQuestionDialog = () => {
  isEditing.value = false
  // 重置编辑器key
  editorKey.value++
  form.value = {
    id: null,
    subjectId: subjects.value.length > 0 ? subjects.value[0].id : '',
    subcategoryId: '',
    type: 'single',
    content: '<p>请输入题目内容</p>',
    options: ['', '', '', ''],
    answer: '',
    selectedAnswers: [],
    explanation: ''
  }
  dialogVisible.value = true
}

const editQuestion = (question) => {
  isEditing.value = true
  console.log('Editing question:', question)
  console.log('Question content type:', typeof question.content)
  console.log('Question content:', question.content)
  console.log('Question audio:', question.audio)
  console.log('Question audio type:', typeof question.audio)
  
  // 处理富文本内容
  let contentValue = ''
  if (typeof question.content === 'string' && question.content) {
    contentValue = question.content
  } else {
    contentValue = ''
  }
  
  // 构建表单数据
  form.value = {
    ...question,
    selectedAnswers: question.answer.split(''),
    content: contentValue,
    audio: question.audio || ''
  }
  
  console.log('Form content after assignment:', form.value.content)
  console.log('Form audio after assignment:', form.value.audio)
  
  // 增加一个key来强制重新渲染编辑器
  editorKey.value++
  
  // 打开对话框
  dialogVisible.value = true
  console.log('Dialog opened, form content:', form.value.content)
  console.log('Dialog opened, form audio:', form.value.audio)
}

const saveQuestion = async () => {
  console.log('saveQuestion方法被调用')
  
  // 验证子分类
  if (!form.value.subcategoryId) {
    ElMessage.error('请选择子分类！')
    console.log('未选择子分类，保存失败')
    return
  }
  
  // 验证正确答案
  if (form.value.selectedAnswers.length === 0) {
    ElMessage.error('请选择正确答案！')
    console.log('未选择正确答案，保存失败')
    return
  }
  
  // 检查题目内容是否为空
  console.log('form.content:', form.value.content)
  console.log('form.content类型:', typeof form.value.content)
  
  // 处理Delta对象
  let content = ''
  if (typeof form.value.content === 'object' && form.value.content.ops) {
    // 处理Delta对象，保留HTML内容
    content = form.value.content.ops.map(op => {
      if (typeof op.insert === 'string') {
        return op.insert
      } else if (op.insert && op.insert.image) {
        return `<img src="${op.insert.image}" alt="图片" style="max-width: 100%;">`
      }
      return ''
    }).join('')
  } else if (typeof form.value.content === 'string') {
    content = form.value.content
  }
  
  console.log('content:', content)
  // 移除HTML标签并 trim 后检查是否为空
  const plainText = content.replace(/<[^>]*>/g, '').trim()
  console.log('plainText:', plainText)
  console.log('plainText长度:', plainText.length)
  if (!plainText || plainText === '请输入题目内容') {
    ElMessage.error('请输入题目内容！')
    console.log('题目内容为空，保存失败')
    return
  }
  console.log('题目内容不为空，继续保存')
  
  // 清理答案中的HTML标签和Word格式，但保留图片标签
  form.value.options = await Promise.all(form.value.options.map(async (option) => {
    if (typeof option === 'string') {
      // 处理DataURL格式的图片
      let processedOption = option
      // 查找DataURL格式的图片
      const dataUrlRegex = /<img[^>]*src="data:image\/[^;]+;base64,[^"]+"[^>]*>/g
      const dataUrlMatches = processedOption.match(dataUrlRegex)
      if (dataUrlMatches) {
        for (const match of dataUrlMatches) {
          // 提取DataURL
          const srcMatch = match.match(/src="(data:image\/[^;]+;base64,[^"]+)"/)
          if (srcMatch && srcMatch[1]) {
            const dataUrl = srcMatch[1]
            // 上传DataURL到服务器
            try {
              const response = await fetch(`${getApiBaseUrl()}/upload-data-url`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ dataUrl })
              })
              if (response.ok) {
                const result = await response.json()
                // 替换DataURL为服务器路径
                processedOption = processedOption.replace(dataUrl, `${getApiBaseUrl().replace('/api', '')}/${result.filePath}`)
              }
            } catch (error) {
              console.error('上传DataURL失败:', error)
            }
          }
        }
      }
      // 保留图片标签，移除其他HTML标签
      let cleaned = processedOption
        // 保留图片标签
        .replace(/<img[^>]*>/g, match => match)
        // 移除其他HTML标签
        .replace(/<(?!img)[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim()
      return cleaned
    }
    return option
  }))
  
  // 将selectedAnswers转换为answer字符串
  form.value.answer = form.value.selectedAnswers.sort().join('')
  console.log('answer:', form.value.answer)
  
  // 上传音频文件
  if (selectedAudioFile.value) {
    ElMessage.success(`正在上传音频文件 ${selectedAudioFile.value.name}...`)
    try {
      const formData = new FormData()
      formData.append('audio', selectedAudioFile.value)
      
      const response = await fetch(`${getApiBaseUrl()}/upload-audio`, {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        form.value.audio = result.filePath
        ElMessage.success(`音频文件 ${selectedAudioFile.value.name} 上传成功`)
      } else {
        ElMessage.error('音频文件上传失败')
      }
    } catch (error) {
      console.error('音频文件上传失败:', error)
      ElMessage.error('音频文件上传失败')
    }
  }
  
  // 上传图片文件
  if (selectedImageFile.value) {
    ElMessage.success(`正在上传图片文件 ${selectedImageFile.value.name}...`)
    try {
      const formData = new FormData()
      formData.append('image', selectedImageFile.value)
      
      const response = await fetch(`${getApiBaseUrl()}/upload-image`, {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        form.value.image = result.filePath
        ElMessage.success(`图片文件 ${selectedImageFile.value.name} 上传成功`)
      } else {
        ElMessage.error('图片文件上传失败')
      }
    } catch (error) {
      console.error('图片文件上传失败:', error)
      ElMessage.error('图片文件上传失败')
    }
  }
  
  try {
    console.log('开始保存题目')
    console.log('isEditing:', isEditing.value)
    // 确保form.value.content是字符串
    if (typeof form.value.content === 'object' && form.value.content.ops) {
      // 处理Delta对象，保留HTML内容
      form.value.content = form.value.content.ops.map(op => {
        if (typeof op.insert === 'string') {
          return op.insert
        } else if (op.insert && op.insert.image) {
          return `<img src="${op.insert.image}" alt="图片" style="max-width: 100%;">`
        }
        return ''
      }).join('')
    } else if (typeof form.value.content !== 'string') {
      form.value.content = ''
    }
    
    // 确保form.value.audio是字符串
    if (typeof form.value.audio !== 'string') {
      form.value.audio = form.value.audio || ''
    }
    
    // 确保form.value.image是字符串
    if (typeof form.value.image !== 'string') {
      form.value.image = form.value.image || ''
    }
    
    console.log('处理后的form.content:', form.value.content)
    console.log('处理后的form.audio:', form.value.audio)
    // 保存题目
    if (isEditing.value) {
      console.log('更新题目')
      await store.updateQuestion(form.value)
      ElMessage.success('题目更新成功！')
      console.log('题目更新成功')
    } else {
      console.log('添加题目')
      await store.addQuestion(form.value)
      ElMessage.success('题目添加成功！')
      console.log('题目添加成功')
    }
    
    // 清空选中的文件
    selectedAudioFile.value = null
    selectedImageFile.value = null
    
    dialogVisible.value = false
    console.log('保存完成，关闭对话框')
  } catch (error) {
    console.error('保存题目失败:', error)
    ElMessage.error('保存题目失败，请稍后重试！')
  }
}

const deleteQuestion = (questionId) => {
  console.log('Delete question clicked with ID:', questionId)
  ElMessageBox.confirm('确定要删除该题目吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
  .then(() => {
    console.log('Proceeding with deletion')
    store.deleteQuestion(questionId)
  })
  .catch(() => {
    console.log('Deletion cancelled')
  })
}

const addOption = () => {
  form.value.options.push('')
}

const removeOption = (index) => {
  // 移除对应的答案选项
  const optionLabel = String.fromCharCode(65 + index)
  const answerIndex = form.value.selectedAnswers.indexOf(optionLabel)
  if (answerIndex !== -1) {
    form.value.selectedAnswers.splice(answerIndex, 1)
  }
  // 移除选项
  form.value.options.splice(index, 1)
  // 重新计算剩余选项的标签
  // 这里不需要重新计算标签，因为选项标签是根据索引动态生成的
}

// 保存选中的文件
const selectedAudioFile = ref(null)
const selectedImageFile = ref(null)

// 文件选择处理函数
const handleAudioChange = (file) => {
  selectedAudioFile.value = file.raw
  ElMessage.success(`音频文件 ${file.name} 已选择`)
  // 暂时不上传，只保存文件对象，在保存时上传
  form.value.audio = `audio/${file.name}`
}

const handleImageChange = (file) => {
  selectedImageFile.value = file.raw
  ElMessage.success(`图片文件 ${file.name} 已选择`)
  // 暂时不上传，只保存文件对象，在保存时上传
  form.value.image = `images/${file.name}`
}

// 处理粘贴事件
const handlePaste = (event) => {
  const items = (event.clipboardData || event.originalEvent.clipboardData).items;
  let hasImage = false;
  
  for (const item of items) {
    if (item.type.indexOf('image') === 0) {
      hasImage = true;
      event.preventDefault();
      const blob = item.getAsFile();
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '200px';
        event.target.appendChild(img);
        event.target.blur();
      };
      reader.readAsDataURL(blob);
    }
  }
}

// 处理contenteditable div的内容变化
const handleContentChange = (event, index) => {
  form.value.options[index] = event.target.innerHTML;
}

// 删除音频文件
const deleteAudio = () => {
  if (form.value.audio) {
    // 显示确认对话框
    ElMessageBox.confirm('确定要删除该音频文件吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    .then(() => {
      // 清空音频路径
      form.value.audio = '';
      // 清空选中的音频文件
      selectedAudioFile.value = null;
      ElMessage.success('音频文件已删除！');
    })
    .catch(() => {
      // 取消删除
    });
  }
}

// 检查内容中是否包含有效的图片
const hasValidImage = (content) => {
  if (typeof content !== 'string') return false;
  // 检查是否包含带有src属性的img标签
  const imgRegex = /<img[^>]*src="[^"]+"[^>]*>/i;
  return imgRegex.test(content);
}

// 格式化题目内容，在预览时特殊显示正确答案
const formatQuestionContent = (content, answer) => {
  // 直接返回题目内容，因为我们现在在选项后面添加正确答案标记
  return content;
}

// 清理内容，移除所有HTML标签和残留的图片代码
const cleanContent = (content) => {
  if (typeof content !== 'string') return '';
  // 移除所有HTML标签
  let cleaned = content.replace(/<[^>]*>/g, '');
  // 移除可能的残留图片代码
  cleaned = cleaned.replace(/data:image\/[^;]+;base64,[^\s]+/g, '');
  // 移除多余的空白字符
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

// 分页事件处理
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1 // 重置到第一页
}

const handleCurrentChange = (current) => {
  currentPage.value = current
}

// 导入本地数据
const importLocalData = async () => {
  if (confirm('确定要从本地存储导入数据到SQL数据库吗？这将会覆盖现有的数据。')) {
    const result = await store.importLocalData()
    if (result.success) {
      ElMessage.success('数据导入成功！')
    } else {
      ElMessage.error(`数据导入失败：${result.error}`)
    }
  }
}

// Quill编辑器准备就绪事件
const onQuillReady = (editor) => {
  console.log('Quill editor ready')
  if (isEditing.value && form.value.content) {
    console.log('Setting content to:', form.value.content)
    // 手动设置编辑器内容
    editor.root.innerHTML = form.value.content
    // 确保编辑器知道内容已更改
    editor.updateContents({})
  }
}

// 监听form.content的变化，确保编辑器内容同步
watch(() => form.value.content, (newValue) => {
  console.log('Form content changed:', newValue)
}, { deep: true })

// 监听对话框打开事件，确保富文本内容正确显示
watch(dialogVisible, (newValue) => {
  if (newValue && isEditing.value) {
    console.log('Dialog opened, form content:', form.value.content)
    // 确保内容是字符串格式
    if (typeof form.value.content !== 'string') {
      form.value.content = ''
    }
  }
})

// 监听批量添加题目文本变化，实现实时预览
watch(batchQuestionText, (newValue) => {
  if (batchAddDialogVisible && newValue) {
    parseBatchQuestions()
  }
})

// 监听批量添加对话框关闭事件，清空输入字段
watch(batchAddDialogVisible, (newValue) => {
  if (!newValue) {
    // 对话框关闭时清空所有字段
    batchSubjectId.value = ''
    batchSubcategoryId.value = ''
    batchQuestionType.value = 'single'
    batchQuestionText.value = ''
    parsedQuestions.value = []
  }
})

onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.title {
  text-align: center;
  color: #333;
  margin: 0;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.back-home-btn {
  text-decoration: none;
}

.subject-management {
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.add-subject {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.subject-edit {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px;
  background-color: #f0f9ff;
  border-radius: 4px;
}

.subject-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.subject-icon {
  font-size: 24px;
  margin-right: 5px;
}

.subcategory-icon {
  font-size: 24px;
  margin-right: 5px;
}

.add-subcategory {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.subcategory-edit {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px;
  background-color: #f0f9ff;
  border-radius: 4px;
}

.subcategory-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.batch-add-management {
  padding: 20px;
}

.batch-add-layout {
  display: flex;
  gap: 20px;
  height: 500px;
}

.input-section {
  flex: 1;
  overflow-y: auto;
}

.preview-section {
  flex: 1;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.preview-section h3 {
  margin-bottom: 15px;
  color: #6a11cb;
  flex-shrink: 0;
}

.preview-content {
  flex: 1;
  overflow-y: auto;
}

.preview-question {
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.preview-question-content {
  margin-bottom: 10px;
  line-height: 1.5;
}

.question-number {
  font-weight: bold;
  color: #6a11cb;
}

.question-answer {
  font-weight: bold;
  color: #4caf50;
  margin-left: 10px;
}

.preview-options {
  margin-left: 20px;
}

.preview-option {
  margin-bottom: 5px;
  line-height: 1.4;
}

.answer-highlight {
  background-color: #ffeb3b;
  color: #333;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: bold;
  border: 2px solid #fbc02d;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: inline-block;
  margin: 0 2px;
}

.correct-answer-tag {
  background-color: #4caf50;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  margin-left: 10px;
  display: inline-block;
}

.preview-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  text-align: center;
}

.batch-add-management .el-form-item {
  margin-bottom: 20px;
}

.batch-add-management .el-textarea {
  resize: vertical;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .batch-add-layout {
    flex-direction: column;
    height: auto;
  }
  
  .input-section,
  .preview-section {
    flex: none;
    height: 400px;
  }
}

.question-management {
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.filter-section {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.options-container {
  width: 100%;
}

.option-item {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 题目内容预览 */
.question-content-preview {
  white-space: normal;
  max-width: 100%;
  color: #666;
  line-height: 1.4;
  min-height: 40px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.content-with-image {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  white-space: normal;
  overflow: hidden;
}

.content-with-media {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  white-space: normal;
  overflow: hidden;
}

.content-with-image .content-text,
.content-with-media .content-text {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.content-text img {
  max-width: 100%;
  max-height: 100px;
  object-fit: contain;
  margin: 5px 0;
}

.image-indicator {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
  margin-top: 2px;
  margin-right: 5px;
}

.audio-indicator {
  background-color: #f3e5f5;
  color: #7b1fa2;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
  margin-top: 2px;
  margin-right: 5px;
}

.content-text {
  flex: 1;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 过滤器部分 */
.filter-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f0f9ff;
  border-radius: 8px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.action-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* 表格样式 */
.el-table {
  border-radius: 8px;
  overflow: hidden;
  width: 100% !important;
  table-layout: auto;
  font-size: 14px;
}

.el-table th {
  background-color: #f8f9fa;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 40px;
  padding: 8px 12px;
  vertical-align: middle;
}

.el-table td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 40px;
  padding: 12px;
  vertical-align: middle;
}

/* 题目内容列的单元格样式 */
.el-table-column:nth-child(7) .cell {
  white-space: normal;
  line-height: 1.4;
  min-height: 60px;
  display: flex;
  align-items: center;
}

/* 按钮样式 */
.el-button {
  border-radius: 4px;
  white-space: nowrap;
}

/* 分页样式 */
.pagination {
  margin-top: 20px;
  text-align: right;
  white-space: nowrap;
}

/* 操作列样式 */
.el-table .cell {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 题目内容列的单元格样式 */
.el-table-column:nth-child(7) .cell {
  white-space: normal;
  line-height: 1.4;
  min-height: 40px;
}

/* 容器样式 */
.question-management {
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* 表格容器 */
.table-container {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  max-width: 100%;
  width: 100%;
  margin: 0 auto;
  overflow-x: auto;
  box-sizing: border-box;
  padding: 0 10px;
}

.el-table {
  width: 100% !important;
  table-layout: auto;
}

/* 操作按钮容器 */
.el-table-column--selection {
  width: 55px !important;
  min-width: 55px;
  max-width: 55px;
}

/* 学科标签 */
.subject-tag {
  display: inline-block;
  padding: 2px 8px;
  background-color: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

/* 类型标签 */
.type-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.type-single {
  background-color: #e8f5e8;
  color: #388e3c;
}

.type-multiple {
  background-color: #e3f2fd;
  color: #1976d2;
}

.type-judgment {
  background-color: #fff3e0;
  color: #f57c00;
}

.type-listening {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.type-reading {
  background-color: #e0f7fa;
  color: #00838f;
}

.type-image {
  background-color: #fffde7;
  color: #fbc02d;
}

/* 答案标签 */
.answer-tag {
  display: inline-block;
  padding: 2px 8px;
  background-color: #e1bee7;
  color: #6a11cb;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

/* 题目行容器 */
.question-row {
  position: relative;
  width: 100%;
  transition: all 0.3s ease;
}

/* 行操作按钮 */
.row-operations {
  display: flex;
  gap: 5px;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.el-table__row:hover .row-operations {
  opacity: 1;
  max-height: 40px;
  margin-top: 10px;
}

.el-table__row:hover .question-content-preview {
  margin-bottom: 5px;
}

/* 提示框样式 */
.content-tooltip {
  max-width: 400px !important;
  white-space: normal !important;
  word-break: break-all !important;
}

/* 自定义列宽 */
.el-table-column:nth-child(3) {
  width: 40px !important; /* ID列 */
  min-width: 40px;
  max-width: 40px;
}

.el-table-column:nth-child(4) {
  width: 80px !important; /* 学科列 */
  min-width: 80px;
  max-width: 100px;
}

.el-table-column:nth-child(5) {
  width: 100px !important; /* 子分类列 */
  min-width: 100px;
  max-width: 120px;
}

.el-table-column:nth-child(6) {
  width: 60px !important; /* 类型列 */
  min-width: 60px;
  max-width: 60px;
}

/* 题目内容列特殊处理 */
.el-table-column:nth-child(7) {
  flex: 1 !important;
  min-width: 200px;
  max-width: 400px;
}

.el-table-column:nth-child(8) {
  width: 60px !important; /* 答案列 */
  min-width: 60px;
  max-width: 80px;
}

.el-table-column:nth-child(9) {
  width: 120px !important; /* 创建时间列 */
  min-width: 120px;
  max-width: 120px;
}

.el-table-column:nth-child(10) {
  width: 100px !important; /* 操作列 */
  min-width: 100px;
  max-width: 100px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-section {
    padding: 10px;
  }
  
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-row .el-input,
  .filter-row .el-select {
    width: 100% !important;
    margin-right: 0 !important;
    margin-bottom: 10px;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-buttons .el-button {
    width: 100%;
    margin-bottom: 10px;
  }
  
  .el-table {
    font-size: 14px;
  }
  
  .el-table-column {
    min-width: 100px;
  }
  
  /* 小屏幕下的表格列宽调整 */
  .el-table-column--selection {
    width: 40px !important;
  }
  
  /* 小屏幕下的自定义列宽 */
  .el-table-column:nth-child(3) {
    width: 50px !important; /* ID列 */
  }
  
  .el-table-column:nth-child(4) {
    width: 80px !important; /* 学科列 */
  }
  
  .el-table-column:nth-child(5) {
    width: 90px !important; /* 子分类列 */
  }
  
  .el-table-column:nth-child(6) {
    width: 70px !important; /* 类型列 */
  }
  
  .el-table-column:nth-child(8) {
    width: 70px !important; /* 答案列 */
  }
  
  .el-table-column:nth-child(9) {
    width: 140px !important; /* 创建时间列 */
  }
  
  .el-table-column:nth-child(10) {
    width: 120px !important; /* 操作列 */
  }
  
  /* 小屏幕下的标签样式 */
  .subject-tag,
  .type-tag,
  .answer-tag {
    font-size: 10px;
    padding: 1px 6px;
  }
  
  /* 小屏幕下的操作按钮 */
  .operation-buttons {
    flex-direction: column;
    gap: 3px;
  }
  
  .edit-btn,
  .delete-btn {
    width: 100%;
    font-size: 11px;
    padding: 2px 4px;
  }
  
  /* 小屏幕下的表格容器 */
  .table-container {
    box-shadow: 0 1px 6px 0 rgba(0, 0, 0, 0.1);
  }
  
  /* 小屏幕下的按钮样式 */
  .el-table .el-button {
    font-size: 12px;
    padding: 4px 8px;
  }
  
  /* 小屏幕下的分页样式 */
  .pagination {
    text-align: center;
  }
  
  /* 小屏幕下的题目管理容器 */
  .question-management {
    padding: 10px;
  }
}
</style>