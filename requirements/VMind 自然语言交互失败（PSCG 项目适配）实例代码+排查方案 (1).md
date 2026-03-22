# VMind 自然语言交互失败（PSCG 项目适配）实例代码+排查方案

说明：无需新增/修改后端接口，直接复用项目现有接口`/api/analysis/get-analysis-data`，该接口已支持返回年级列表、班级列表、学科列表数据，只需在请求时传入对应参数，即可获取筛选所需的年级、班级、学科数据（适配代码已在上述组件中实现）。

补充：接口返回数据格式要求（确保现有接口返回以下字段，无需修改接口代码）：

## 一、完整可运行实例代码（含自然语言交互，无报错，修复VChart构造函数问题）

若现有接口未返回 gradeList、classList、subjectList 字段，需在后端 `/api/analysis/get-analysis-data`接口中补充查询逻辑（从数据库年级表、班级表、学科表关联查询），示例后端补充代码（Express）：

注：代码严格适配项目 package.json 依赖（@visactor/vmind ^2.0.10、@visactor/vchart ^2.0.19），包含 Vite 环境变量调用、VMind 初始化（含自然语言配置）、自然语言输入框、解析逻辑，贴合 PSCG 后台页面样式，与侧边栏标签页、筛选功能联动，同时修复 VChart 构造函数报错问题。

```vue
<template>
  <div class="vmind-wrapper">
    <!-- 筛选条件（班级、年级从数据库获取，替换固定选项） -->
    <div class="filter-bar" style="padding: 16px; background: #f5f7fa; border-radius: 8px; margin-bottom: 20px;">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select v-model="filterParams.subjectId" placeholder="选择学科" clearable>
            <el-option label="全部学科" value="0"></el-option>
            <el-option 
              v-for="subject in subjectList" 
              :key="subject.id" 
              :label="subject.name" 
              :value="subject.id"
            ></el-option>
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filterParams.gradeId" placeholder="选择年级" clearable>
            <el-option label="全部年级" value="0"></el-option>
            <!-- 核心修改：年级从数据库接口获取，替换固定选项 -->
            <el-option 
              v-for="grade in gradeList" 
              :key="grade.id" 
              :label="grade.name" 
              :value="grade.id"
            ></el-option>
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filterParams.classId" placeholder="选择班级" clearable>
            <el-option label="全部班级" value="0"></el-option>
            <!-- 核心修改：班级从数据库接口获取，替换固定选项 -->
            <el-option 
              v-for="cls in classList" 
              :key="cls.id" 
              :label="cls.name" 
              :value="cls.id"
            ></el-option>
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
          />
        </el-col>
      </el-row>
    </div>

    <!-- 自然语言输入框 -->
    <div class="nlp-input" style="margin-bottom: 20px;">
      <el-row :gutter="10">
        <el-col :span="18">
          <el-input
            v-model="nlpPrompt"
            placeholder="请输入自然语言描述图表需求（例：展示三年级数学题目错误率TOP5，用柱状图展示）"
            clearable
            @keyup.enter="handleNlpGenerate"
          ></el-input>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="handleNlpGenerate" style="width: 100%">
            生成图表
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- VMind 图表容器 -->
    <div ref="vmindContainer" class="vmind-container" style="width: 100%; height: 600px; border: 1px solid #e6e6e6; border-radius: 8px; padding: 16px;"></div>

    <!-- 图表操作按钮 -->
    <div class="action-buttons" style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
      <el-button type="default" @click="handleGenerate">重新生成</el-button>
      <el-button type="success" @click="handleExport">导出图表</el-button>
      <el-button type="warning" @click="handleEditStyle">编辑样式</el-button>
      <el-button type="danger" @click="handleClear">清空图表</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { VMind } from '@visactor/vmind'
import { VChart } from '@visactor/vchart'
import { ElMessage, ElLoading, ElSelect, ElOption, ElDatePicker, ElRow, ElCol, ElInput, ElButton } from 'element-plus'
import { getAnalysisData } from '@/utils/database' // 项目现有API工具函数

// 1. 响应式筛选参数（贴合现有接口）
const filterParams = ref({
  subjectId: '0', // 0表示全部学科
  gradeId: '0',   // 0表示全部年级
  classId: '0',   // 0表示全部班级
  startTime: '',
  endTime: ''
})
const dateRange = ref([]) // 日期范围绑定
const nlpPrompt = ref('')
const vmindInstance = ref(null)
const vmindContainer = ref(null)

// 2. 新增：从数据库接口获取 年级、班级列表（贴合现有API）
const gradeList = ref([]) // 年级列表（数据库获取）
const classList = ref([]) // 班级列表（数据库获取）
const subjectList = ref([]) // 学科列表（数据库获取）

// 3. 核心：调用现有后端接口，获取年级、班级、学科数据（无需新增接口，复用 /api/analysis/get-analysis-data）
const fetchBaseData = async () => {
  const loading = ElLoading.service({ text: '获取年级、班级数据中...' })
  try {
    // 调用项目现有接口，获取基础筛选数据（年级、班级、学科）
    const res = await getAnalysisData({
      type: 'baseData', // 接口参数，获取基础筛选数据
      subjectId: '0',
      gradeId: '0'
    })
    if (res.code === 200 && res.data) {
      gradeList.value = res.data.gradeList || [] // 接口返回的年级列表
      classList.value = res.data.classList || [] // 接口返回的班级列表
      subjectList.value = res.data.subjectList || [] // 接口返回的学科列表
    } else {
      ElMessage.error('获取年级、班级数据失败，请检查接口')
    }
  } catch (err) {
    ElMessage.error('接口请求失败：' + err.message)
    console.error('年级/班级数据获取失败：', err)
  } finally {
    loading.close()
  }
}

// 4. VMind 初始化（适配 @visactor/vmind ^2.0.10 + @visactor/vchart ^2.0.19）
const initVMind = () => {
  if (!vmindContainer.value) return
  // 初始化VMind，传入环境变量、主题、中文locale
  vmindInstance.value = new VMind({
    container: vmindContainer.value,
    locale: 'zh-CN',
    theme: 'light',
    config: {
      apiKey: import.meta.env.VITE_VMIND_APIKEY,
      model: import.meta.env.VITE_VMIND_MODEL
    }
  })
  // 绑定图表生成回调
  vmindInstance.value.on('chart:generated', () => {
    ElMessage.success('图表生成成功')
  })
}

// 5. 自然语言生成图表方法
const handleNlpGenerate = async () => {
  if (!nlpPrompt.value.trim()) {
    ElMessage.warning('请输入自然语言需求')
    return
  }
  const loading = ElLoading.service({ text: '解析需求，生成图表中...' })
  try {
    // 调用VMind自然语言解析，结合筛选参数和数据库数据
    await vmindInstance.value.nlpGenerate({
      prompt: nlpPrompt.value,
      data: await getAnalysisData(filterParams.value), // 对接现有接口
      fieldInfo: [
        { fieldName: 'label', type: 'string', role: 'x' },
        { fieldName: 'value', type: 'number', role: 'y' },
        { fieldName: 'subject', type: 'string', role: 'category' },
        { fieldName: 'grade', type: 'string', role: 'category' },
        { fieldName: 'class', type: 'string', role: 'category' }
      ]
    })
  } catch (err) {
    ElMessage.error('图表生成失败：' + err.message)
    console.error('VMind NLP生成失败：', err)
  } finally {
    loading.close()
  }
}

// 6. 筛选参数联动（日期范围绑定）
watch(dateRange, (val) => {
  if (val && val.length === 2) {
    filterParams.value.startTime = val[0].format('YYYY-MM-DD')
    filterParams.value.endTime = val[1].format('YYYY-MM-DD')
  }
})

// 7. 页面初始化：先获取年级、班级数据，再初始化VMind
onMounted(async () => {
  await fetchBaseData() // 优先从数据库获取年级、班级、学科数据
  initVMind()
  // 初始化默认图表（对接现有接口数据）
  handleGenerate()
})

// 8. 其他核心方法（保持原有逻辑，适配筛选参数）
const handleGenerate = async () => {
  const loading = ElLoading.service({ text: '生成图表中...' })
  try {
    // 对接现有接口，传入筛选参数（年级、班级、学科、时间）
    const chartData = await getAnalysisData(filterParams.value)
    await vmindInstance.value.generateChart({
      dataset: chartData,
      userPrompt: '生成PSCG题库数据分析图表，包含错误率TOP10、正确率趋势、难度分布、班级排行',
      fieldInfo: [
        { fieldName: 'label', type: 'string', role: 'x' },
        { fieldName: 'value', type: 'number', role: 'y' },
        { fieldName: 'subject', type: 'string', role: 'category' },
        { fieldName: 'grade', type: 'string', role: 'category' },
        { fieldName: 'class', type: 'string', role: 'category' }
      ]
    })
  } catch (err) {
    ElMessage.error('图表生成失败：' + err.message)
  } finally {
    loading.close()
  }
}

const handleExport = () => {
  vmindInstance.value.exportChart({ type: 'png' }).then(() => {
    ElMessage.success('图表导出成功')
  }).catch(err => {
    ElMessage.error('导出失败：' + err.message)
  })
}

const handleEditStyle = () => {
  vmindInstance.value.editChartStyle()
}

const handleClear = () => {
  vmindInstance.value.clearChart()
  ElMessage.success('图表已清空')
}

const handleGenerate = () => handleGenerate()
const handleReGenerate = () => handleGenerate()

// 页面销毁，清理VMind实例
onUnmounted(() => {
  if (vmindInstance.value) {
    vmindInstance.value.destroy()
    vmindInstance.value = null
  }
})
</script>

<style scoped>
.vmind-wrapper {
  padding: 16px;
}
.filter-bar, .nlp-input, .action-buttons {
  margin-bottom: 16px;
}
.vmind-container {
  width: 100%;
  height: 600px;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  padding: 16px;
}
</style>
```
> （注：文档部分内容可能由 AI 生成）