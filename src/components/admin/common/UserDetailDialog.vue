<template>
  <el-dialog
    :model-value="dialogVisible"
    :title="
      selectedUser?.name
        ? `${selectedUser.name}的记录 (ID: ${currentAnswerRecordId || '未知'})`
        : `${selectedUser?.grade || '-'}年级${selectedUser?.class || '-'}班的${selectedUser?.student_id || selectedUser?.user_id || '未知'}的记录 (ID: ${currentAnswerRecordId || '未知'})`
    "
    width="85%"
    top="3vh"
    :destroy-on-close="true"
    class="user-detail-dialog"
    @update:model-value="value => emit('update:dialogVisible', value)"
  >
    <div class="dialog-content">
      <div
        v-if="selectedUser"
        class="user-detail-info"
        style="margin-bottom: 20px; padding: 15px; background-color: #f5f7fa; border-radius: 8px"
      >
        <div style="display: flex; gap: 20px; flex-wrap: wrap">
          <div>
            <strong>学号:</strong>
            {{ selectedUser.student_id || selectedUser.user_id || '未知' }}
          </div>
          <div>
            <strong>姓名:</strong>
            {{ selectedUser.name || '未知' }}
          </div>
          <div>
            <strong>年级:</strong>
            {{ selectedUser.grade || '-' }}年级
          </div>
          <div>
            <strong>班级:</strong>
            {{ selectedUser.class || '-' }}班
          </div>
          <div>
            <strong>正确率:</strong>
            {{ Math.round(selectedUser.avg_accuracy || 0) }}%
          </div>
          <div>
            <strong>答题数:</strong>
            {{ selectedUser.total_questions || 0 }}
          </div>
          <div>
            <strong>答题次数:</strong>
            {{ selectedUser.total_sessions || 0 }}
          </div>
        </div>
      </div>

      <el-tabs v-model="activeUserDetailTab" style="margin-top: 20px">
        <!-- 只在从用户答题统计点击时显示答题记录标签 -->
        <el-tab-pane v-if="dialogSource === 'userStats'" label="答题记录" name="records">
          <div v-if="selectedUserRecords.length > 0" class="user-answer-records">
            <div style="overflow-x: auto">
              <el-table :data="paginatedUserRecords" stripe style="width: 100%">
                <el-table-column
                  prop="subject_name"
                  label="学科"
                  width="120"
                  align="center"
                ></el-table-column>
                <el-table-column
                  prop="subcategory_name"
                  label="学科题库"
                  width="150"
                  align="center"
                >
                  <template #default="{ row }">
                    {{ row.subcategory_name || '全部' }}
                  </template>
                </el-table-column>
                <el-table-column label="成绩" width="100" align="center">
                  <template #default="{ row }">
                    {{ row.correct_count }} / {{ row.total_questions }}
                  </template>
                </el-table-column>
                <el-table-column label="正确率" width="100" align="center">
                  <template #default="{ row }">
                    {{ Math.round((row.correct_count / row.total_questions) * 100) }}%
                  </template>
                </el-table-column>
                <el-table-column label="用时(秒)" width="100" align="center">
                  <template #default="{ row }">
                    {{ row.time_spent || 0 }}
                  </template>
                </el-table-column>
                <el-table-column prop="created_at" label="时间" width="180" align="center">
                  <template #default="{ row }">
                    {{ formatDate(row.created_at) }}
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- 分页组件 -->
            <div class="pagination" style="margin-top: 20px; text-align: right">
              <el-pagination
                v-model:current-page="currentRecordsPage"
                v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="selectedUserRecords.length"
                @size-change="handleRecordsSizeChange"
                @current-change="handleRecordsCurrentChange"
              />
            </div>
          </div>
          <div v-else class="leaderboard-empty" style="text-align: center; padding: 40px">
            <p>暂无答题记录</p>
          </div>
        </el-tab-pane>

        <!-- 只在从最近答题记录点击时显示做题记录标签 -->
        <el-tab-pane v-if="dialogSource === 'recentRecords'" label="做题记录" name="attempts">
          <div v-if="selectedUserQuestionAttempts.length > 0" class="user-question-attempts">
            <div style="overflow-x: auto">
              <el-table :data="paginatedUserQuestionAttempts" stripe style="width: 100%">
                <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
                <el-table-column
                  prop="subject_name"
                  label="学科"
                  width="120"
                  align="center"
                ></el-table-column>
                <el-table-column
                  prop="subcategory_name"
                  label="学科题库"
                  width="150"
                  align="center"
                >
                  <template #default="{ row }">
                    {{ row.subcategory_name || '全部' }}
                  </template>
                </el-table-column>
                <el-table-column prop="content" label="题目内容" min-width="180" align="center">
                  <template #default="{ row }">
                    <el-tooltip :content="row.content" placement="top" effect="dark">
                      <div class="question-content-preview">
                        {{ (row.content || '').replace(/<[^>]*>/g, '').substring(0, 50)
                        }}{{ (row.content || '').length > 50 ? '...' : '' }}
                      </div>
                    </el-tooltip>
                  </template>
                </el-table-column>
                <el-table-column label="用户答案" width="120" align="center">
                  <template #default="{ row }">
                    <span
                      :class="{
                        'correct-answer': row.is_correct || row.isCorrect,
                        'incorrect-answer': !row.is_correct && !row.isCorrect
                      }"
                    >
                      {{ formatReadingAnswer(row.userAnswer || row.user_answer) }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="正确答案" width="120" align="center">
                  <template #default="{ row }">
                    <span class="correct-answer">
                      {{ formatReadingAnswer(row.correctAnswer || row.correct_answer) }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="结果" width="60" align="center">
                  <template #default="{ row }">
                    <el-tag :type="row.isCorrect || row.is_correct ? 'success' : 'danger'">
                      {{ row.isCorrect || row.is_correct ? '正确' : '错误' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="created_at" label="时间" width="150" align="center">
                  <template #default="{ row }">
                    {{ formatDate(row.created_at) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80" align="center">
                  <template #default="{ row }">
                    <el-button type="primary" size="small" @click="showQuestionDetail(row)">
                      查看详情
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- 分页组件 -->
            <div class="pagination" style="margin-top: 20px; text-align: right">
              <el-pagination
                v-model:current-page="currentAttemptsPage"
                v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="selectedUserQuestionAttempts.length"
                @size-change="handleAttemptsSizeChange"
                @current-change="handleAttemptsCurrentChange"
              />
            </div>
          </div>
          <div v-else class="leaderboard-empty" style="text-align: center; padding: 40px">
            <p>暂无做题记录</p>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { formatDate } from '../../../utils/dateUtils'

// 定义属性和事件
const props = defineProps({
  dialogVisible: {
    type: Boolean,
    default: false
  },
  selectedUser: {
    type: Object,
    default: null
  },
  dialogSource: {
    type: String,
    default: ''
  },
  selectedUserRecords: {
    type: Array,
    default: () => []
  },
  selectedUserQuestionAttempts: {
    type: Array,
    default: () => []
  },
  currentAnswerRecordId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['update:dialogVisible', 'show-question-detail'])

// 格式化阅读题答案（处理 JSON 格式）
const formatReadingAnswer = answer => {
  if (!answer) return '-'
  if (Array.isArray(answer)) {
    return answer.join(', ')
  }

  // 处理阅读题答案格式 {"0":"B", "1":"C", "2":"B", "3":"D"}
  if (typeof answer === 'string' && answer.startsWith('{')) {
    try {
      const parsed = JSON.parse(answer)
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        // 格式化为 "第1题:B, 第2题:C, 第3题:B, 第4题:D"
        const entries = Object.entries(parsed)
          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
          .map(([index, value]) => `第${parseInt(index) + 1}题:${value}`)
        return entries.join(', ')
      }
    } catch (e) {
      // 解析失败，返回原始字符串
    }
  }

  return String(answer)
}

// 激活的标签
const activeUserDetailTab = ref('records')

// 分页相关状态
const currentRecordsPage = ref(1)
const currentAttemptsPage = ref(1)
const pageSize = ref(10)

// 分页后的答题记录
const paginatedUserRecords = computed(() => {
  const records = props.selectedUserRecords || []
  const start = (currentRecordsPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return records.slice(start, end)
})

// 分页后的做题记录
const paginatedUserQuestionAttempts = computed(() => {
  const attempts = props.selectedUserQuestionAttempts || []
  const start = (currentAttemptsPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return attempts.slice(start, end)
})

// 监听对话框可见性变化
watch(
  () => props.dialogVisible,
  newValue => {
    if (newValue) {
      activeUserDetailTab.value = props.dialogSource === 'userStats' ? 'records' : 'attempts'
      // 重置分页
      currentRecordsPage.value = 1
      currentAttemptsPage.value = 1
    }
  }
)

// 答题记录分页处理
const handleRecordsSizeChange = size => {
  pageSize.value = size
  currentRecordsPage.value = 1
}

const handleRecordsCurrentChange = current => {
  currentRecordsPage.value = current
}

// 做题记录分页处理
const handleAttemptsSizeChange = size => {
  pageSize.value = size
  currentAttemptsPage.value = 1
}

const handleAttemptsCurrentChange = current => {
  currentAttemptsPage.value = current
}

// 显示题目详情
const showQuestionDetail = row => {
  emit('show-question-detail', row)
}
</script>

<style scoped>
.dialog-content {
  max-height: 82vh;
  overflow-y: auto;
}

/* 弹窗样式优化 */
:deep(.el-dialog__body) {
  padding: 10px 20px;
  overflow: hidden;
}

.correct-answer {
  color: #67c23a;
  font-weight: bold;
}

.incorrect-answer {
  color: #f56c6c;
  font-weight: bold;
}

.question-content-preview {
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
</style>
