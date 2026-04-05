<template>
  <div class="error-analysis">
    <!-- 错题率统计表 -->
    <el-card class="error-stats-card">
      <template #header>
        <div class="card-header">
          <span>错题率统计（按学科）</span>
        </div>
      </template>
      <el-table :data="errorStatsData" stripe style="width: 100%">
        <el-table-column prop="subject" label="学科" width="150" align="center" />
        <el-table-column prop="total_attempts" label="答题次数" width="120" align="center">
          <template #default="{ row }">
            {{ row.total_attempts || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="error_count" label="错误次数" width="120" align="center">
          <template #default="{ row }">
            {{ row.error_count || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="错误率" min-width="200" align="center">
          <template #default="{ row }">
            <div class="error-rate-cell">
              <el-progress
                :percentage="row.error_rate || 0"
                :color="getErrorColor(row.error_rate)"
                :stroke-width="10"
              />
              <span class="error-rate-text">{{ formatPercent(row.error_rate || 0) }}</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 易错题 TOP20 -->
    <el-card class="error-questions-card">
      <template #header>
        <div class="card-header">
          <span>易错题 TOP20</span>
        </div>
      </template>
      <el-table :data="errorQuestionsData" stripe style="width: 100%">
        <el-table-column label="排名" width="70" align="center">
          <template #default="{ $index }">
            <el-tag
              v-if="$index < 3"
              :type="$index === 0 ? 'danger' : $index === 1 ? 'warning' : 'info'"
              effect="dark"
            >
              {{ $index + 1 }}
            </el-tag>
            <span v-else>{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="题目ID" width="100" align="center" />
        <el-table-column prop="subject_name" label="学科" width="120" align="center" />
        <el-table-column label="题目内容" min-width="300">
          <template #default="{ row }">
            <div
              class="question-content rich-text-content rich-text-compact size-small"
              v-html="sanitizeHtml(row.content)"
            ></div>
          </template>
        </el-table-column>
        <el-table-column label="错误次数" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="danger">
              {{ (row.total_attempts || 0) - (row.correct_count || 0) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="错误率" min-width="150" align="center">
          <template #default="{ row }">
            <el-tag :type="getErrorTagType(getErrorRate(row))">
              {{ formatPercent(getErrorRate(row)) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleViewDetail(row)">
              <el-icon><View /></el-icon>
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 题目详情弹窗 -->
    <el-dialog v-model="previewVisible" title="题目详情" width="700px" destroy-on-close>
      <div v-if="previewData" v-loading="previewLoading" class="preview-content">
        <div class="preview-item">
          <label>题目ID：</label>
          <span>{{ previewData.id }}</span>
        </div>
        <div class="preview-item">
          <label>所属学科：</label>
          <span>{{ previewData.subjectName }}</span>
        </div>
        <div class="preview-item">
          <label>所属题库：</label>
          <span>{{ previewData.subcategoryName || '-' }}</span>
        </div>
        <div class="preview-item">
          <label>题目类型：</label>
          <el-tag :type="getTypeTagType(previewData.type)">{{ previewData.typeName }}</el-tag>
        </div>
        <div class="preview-item">
          <label>题目内容：</label>
          <div
            class="preview-content-box rich-text-content size-large"
            v-html="previewData.content"
          ></div>
        </div>
        <div v-if="previewData.image" class="preview-item">
          <label>题目图片：</label>
          <el-image
            :src="previewData.image"
            fit="contain"
            style="max-width: 400px; max-height: 300px"
          />
        </div>
        <div v-if="previewData.audio" class="preview-item">
          <label>音频：</label>
          <audio controls :src="previewData.audio" style="max-width: 100%"></audio>
        </div>
        <div v-if="previewData.options && previewData.options.length > 0" class="preview-item">
          <label>选项：</label>
          <div class="preview-options">
            <div v-for="(option, index) in previewData.options" :key="index" class="preview-option">
              <span class="option-label">{{ String.fromCharCode(65 + index) }}.</span>
              <span class="option-content" v-html="option"></span>
            </div>
          </div>
        </div>
        <div class="preview-item">
          <label>正确答案：</label>
          <el-tag type="success" effect="dark">{{ previewData.answer }}</el-tag>
        </div>
        <div v-if="previewData.explanation" class="preview-item">
          <label>解析：</label>
          <div class="preview-content-box" v-html="previewData.explanation"></div>
        </div>
        <div class="preview-item">
          <label>答题统计：</label>
          <div class="stats-info">
            <el-tag type="info">总答题: {{ previewData.totalAttempts || 0 }} 次</el-tag>
            <el-tag type="success">正确: {{ previewData.correctCount || 0 }} 次</el-tag>
            <el-tag type="danger">
              错误: {{ (previewData.totalAttempts || 0) - (previewData.correctCount || 0) }} 次
            </el-tag>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { View } from '@element-plus/icons-vue'
import { formatPercent } from '../../../utils/format'
import xssFilter from '../../../utils/xss-filter'

const props = defineProps({
  analysisData: {
    type: Object,
    default: () => ({})
  }
})

// 预览相关状态
const previewVisible = ref(false)
const previewData = ref(null)
const previewLoading = ref(false)

// 错题率统计数据
const errorStatsData = computed(() => {
  return props.analysisData.errorAnalysisList || []
})

// 易错题列表数据
const errorQuestionsData = computed(() => {
  return props.analysisData.errorProneQuestions || []
})

// 获取错误率颜色
const getErrorColor = rate => {
  if (rate >= 50) return '#F56C6C'
  if (rate >= 30) return '#E6A23C'
  return '#67C23A'
}

// 获取错误率标签类型
const getErrorTagType = rate => {
  if (rate >= 50) return 'danger'
  if (rate >= 30) return 'warning'
  return 'info'
}

// 计算错误率
const getErrorRate = row => {
  const total = row.total_attempts || 0
  const correct = row.correct_count || 0
  if (total === 0) return 0
  return ((total - correct) / total) * 100
}

// XSS 防护
const sanitizeHtml = html => {
  if (!html) return ''
  return xssFilter.sanitize(html)
}

// 获取类型标签样式
const getTypeTagType = type => {
  const typeMap = {
    single: 'success',
    multiple: 'warning',
    judgment: 'info',
    listening: '',
    reading: '',
    image: ''
  }
  return typeMap[type] || ''
}

// 查看题目详情
const handleViewDetail = async row => {
  previewLoading.value = true
  previewVisible.value = true
  previewData.value = null

  try {
    // 解析选项（易错题数据中已有）
    let options = []
    if (row.options) {
      try {
        options = typeof row.options === 'string' ? JSON.parse(row.options) : row.options
      } catch (e) {
        console.error('解析选项失败:', e)
      }
    }

    // 解析正确答案（易错题数据中已有）
    let answer = row.correct_answer
    if (typeof answer === 'string') {
      try {
        const parsed = JSON.parse(answer)
        if (Array.isArray(parsed)) {
          answer = parsed.join(', ')
        } else if (typeof parsed === 'object') {
          // 处理阅读题答案格式 {"0":"B", "1":"C", "2":"B", "3":"D"}
          const entries = Object.entries(parsed)
            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
            .map(([index, value]) => `第${parseInt(index) + 1}题:${value}`)
          answer = entries.join(', ')
        } else {
          answer = parsed
        }
      } catch (e) {
        // 保持原值
      }
    }

    // 构建预览数据（优先使用易错题列表中已有的数据）
    previewData.value = {
      id: row.id,
      subjectName: row.subject_name,
      subcategoryName: row.subcategory_name || null,
      type: row.type,
      typeName: getTypeName(row.type),
      content: row.content,
      image: row.image_url || row.image,
      audio: row.audio_url || row.audio,
      options: options,
      answer: answer,
      explanation: row.explanation,
      totalAttempts: row.total_attempts,
      correctCount: row.correct_count
    }
  } catch (error) {
    console.error('获取题目详情失败:', error)
    previewVisible.value = false
  } finally {
    previewLoading.value = false
  }
}

// 获取类型名称
const getTypeName = type => {
  const typeNames = {
    single: '单选题',
    multiple: '多选题',
    judgment: '判断题',
    listening: '听力题',
    reading: '阅读题',
    image: '看图题'
  }
  return typeNames[type] || '未知类型'
}
</script>

<style scoped lang="scss">
@import '@/styles/rich-text.css';

.error-analysis {
  margin-bottom: 20px;
}

.error-stats-card,
.error-questions-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.card-header {
  font-weight: bold;
  font-size: 16px;
}

.error-rate-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.error-rate-cell .el-progress {
  flex: 1;
}

.error-rate-text {
  font-weight: 500;
  min-width: 50px;
  text-align: right;
}

.question-content {
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
}

/* 响应式 */
@media (max-width: 768px) {
  .error-rate-cell {
    flex-direction: column;
    align-items: flex-start;
  }

  .error-rate-cell .el-progress {
    width: 100%;
  }

  .error-rate-text {
    text-align: left;
    margin-top: 5px;
  }
}

/* 预览弹窗样式 */
.preview-content {
  padding: 10px;
}

.preview-item {
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.preview-item label {
  font-weight: bold;
  color: #606266;
  min-width: 90px;
  margin-right: 10px;
}

.preview-content-box {
  flex: 1;
}

.preview-options {
  flex: 1;
}

.preview-option {
  margin-bottom: 8px;
  display: flex;
  align-items: flex-start;
}

.option-label {
  font-weight: bold;
  margin-right: 8px;
  min-width: 25px;
}

.option-content {
  flex: 1;
}

.stats-info {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
