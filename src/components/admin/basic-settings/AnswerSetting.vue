<template>
  <el-card class="setting-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span class="card-title">答题设置</span>
      </div>
    </template>

    <div class="setting-section">
      <div class="setting-row">
        <span class="setting-label">普通题库选项随机排序</span>
        <div class="setting-controls">
          <el-button
            :type="localRandomizeAnswers ? 'primary' : 'default'"
            @click="localRandomizeAnswers = true"
          >
            开启
          </el-button>
          <el-button
            :type="!localRandomizeAnswers ? 'primary' : 'default'"
            @click="localRandomizeAnswers = false"
          >
            关闭
          </el-button>
        </div>
        <span class="setting-status" :class="{ active: localRandomizeAnswers }">
          {{ localRandomizeAnswers ? '当前状态：开启' : '当前状态：关闭' }}
        </span>
      </div>

      <div class="setting-row">
        <span class="setting-label">错题巩固选项随机排序</span>
        <div class="setting-controls">
          <el-button
            :type="localRandomizeErrorCollectionAnswers ? 'primary' : 'default'"
            @click="localRandomizeErrorCollectionAnswers = true"
          >
            开启
          </el-button>
          <el-button
            :type="!localRandomizeErrorCollectionAnswers ? 'primary' : 'default'"
            @click="localRandomizeErrorCollectionAnswers = false"
          >
            关闭
          </el-button>
        </div>
        <span class="setting-status" :class="{ active: localRandomizeErrorCollectionAnswers }">
          {{ localRandomizeErrorCollectionAnswers ? '当前状态：开启' : '当前状态：关闭' }}
        </span>
      </div>
    </div>

    <el-divider />

    <!-- 全局默认题目数量 -->
    <div class="setting-section">
      <h4 class="section-title">全局默认题目数量</h4>
      <div class="setting-row">
        <span class="setting-label">模式</span>
        <div class="setting-controls">
          <el-button
            :type="!localFixedQuestionCount ? 'primary' : 'default'"
            @click="localFixedQuestionCount = false"
          >
            随机
          </el-button>
          <el-button
            :type="localFixedQuestionCount ? 'primary' : 'default'"
            @click="localFixedQuestionCount = true"
          >
            固定
          </el-button>
        </div>
        <template v-if="!localFixedQuestionCount">
          <el-input-number
            v-model="localMinQuestionCount"
            :min="1"
            :max="50"
            style="width: 100px"
          />
          <span class="range-text">至</span>
          <el-input-number
            v-model="localMaxQuestionCount"
            :min="1"
            :max="50"
            style="width: 100px"
          />
          <span class="setting-status active">
            当前范围：{{ localMinQuestionCount }}-{{ localMaxQuestionCount }}题
          </span>
        </template>
        <template v-else>
          <el-input-number
            v-model="localFixedQuestionCountValue"
            :min="1"
            :max="50"
            style="width: 100px"
          />
          <span class="setting-status active">当前数量：{{ localFixedQuestionCountValue }}题</span>
        </template>
      </div>
      <p class="section-hint">说明：未单独配置的学科将使用此默认值</p>
    </div>

    <el-divider />

    <!-- 学科独立配置 -->
    <div class="setting-section">
      <h4 class="section-title">学科独立配置</h4>
      <p class="section-hint">说明：勾选后可为该学科设置独立的题目数量</p>

      <div v-if="subjects.length > 0" class="subject-config-list">
        <div v-for="subject in subjects" :key="subject.id" class="subject-config-item">
          <el-checkbox
            v-model="getSubjectConfig(subject.id).enabled"
            :label="subject.name"
            @change="handleSubjectEnableChange(subject.id)"
          />

          <template v-if="getSubjectConfig(subject.id).enabled">
            <div class="subject-config-controls">
              <el-radio-group v-model="getSubjectConfig(subject.id).fixed" size="small">
                <el-radio-button :value="false">随机</el-radio-button>
                <el-radio-button :value="true">固定</el-radio-button>
              </el-radio-group>

              <template v-if="!getSubjectConfig(subject.id).fixed">
                <el-input-number
                  v-model="getSubjectConfig(subject.id).min"
                  :min="1"
                  :max="50"
                  size="small"
                  style="width: 90px"
                />
                <span class="range-text">至</span>
                <el-input-number
                  v-model="getSubjectConfig(subject.id).max"
                  :min="1"
                  :max="50"
                  size="small"
                  style="width: 90px"
                />
                <span class="config-summary">
                  随机 {{ getSubjectConfig(subject.id).min }}-{{ getSubjectConfig(subject.id).max }}
                  题
                </span>
              </template>

              <template v-else>
                <el-input-number
                  v-model="getSubjectConfig(subject.id).value"
                  :min="1"
                  :max="50"
                  size="small"
                  style="width: 90px"
                />
                <span class="config-summary">固定 {{ getSubjectConfig(subject.id).value }} 题</span>
              </template>
            </div>
          </template>

          <template v-else>
            <span class="use-default">使用全局默认</span>
          </template>
        </div>
      </div>
      <el-empty v-else description="暂无学科数据，请先添加学科" :image-size="80" />
    </div>

    <div class="setting-footer">
      <el-button type="primary" @click="updateAnswerSettings">保存设置</el-button>
    </div>
  </el-card>
</template>

<script setup>
import { ref, watch, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  randomizeAnswers: { type: Boolean, default: false },
  randomizeErrorCollectionAnswers: { type: Boolean, default: false },
  fixedQuestionCount: { type: Boolean, default: false },
  minQuestionCount: { type: Number, default: 5 },
  maxQuestionCount: { type: Number, default: 10 },
  fixedQuestionCountValue: { type: Number, default: 10 },
  subjects: { type: Array, default: () => [] },
  subjectQuestionCounts: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update-settings'])

const localRandomizeAnswers = ref(props.randomizeAnswers)
const localRandomizeErrorCollectionAnswers = ref(props.randomizeErrorCollectionAnswers)
const localFixedQuestionCount = ref(props.fixedQuestionCount)
const localMinQuestionCount = ref(props.minQuestionCount)
const localMaxQuestionCount = ref(props.maxQuestionCount)
const localFixedQuestionCountValue = ref(props.fixedQuestionCountValue)

const subjectConfigs = reactive({})

const getSubjectConfig = subjectId => {
  if (!subjectConfigs[subjectId]) {
    const savedConfig = props.subjectQuestionCounts[subjectId]
    if (savedConfig) {
      subjectConfigs[subjectId] = { ...savedConfig }
    } else {
      subjectConfigs[subjectId] = {
        enabled: false,
        fixed: false,
        min: props.minQuestionCount,
        max: props.maxQuestionCount,
        value: props.fixedQuestionCountValue
      }
    }
  }
  return subjectConfigs[subjectId]
}

const handleSubjectEnableChange = subjectId => {
  const config = getSubjectConfig(subjectId)
  if (config.enabled) {
    config.min = props.minQuestionCount
    config.max = props.maxQuestionCount
    config.value = props.fixedQuestionCountValue
    config.fixed = props.fixedQuestionCount
  }
}

watch(
  () => props.randomizeAnswers,
  v => (localRandomizeAnswers.value = v)
)
watch(
  () => props.randomizeErrorCollectionAnswers,
  v => (localRandomizeErrorCollectionAnswers.value = v)
)
watch(
  () => props.fixedQuestionCount,
  v => (localFixedQuestionCount.value = v)
)
watch(
  () => props.minQuestionCount,
  v => (localMinQuestionCount.value = v)
)
watch(
  () => props.maxQuestionCount,
  v => (localMaxQuestionCount.value = v)
)
watch(
  () => props.fixedQuestionCountValue,
  v => (localFixedQuestionCountValue.value = v)
)

watch(
  () => props.subjectQuestionCounts,
  newCounts => {
    Object.keys(newCounts).forEach(subjectId => {
      if (subjectConfigs[subjectId]) {
        subjectConfigs[subjectId] = { ...newCounts[subjectId] }
      }
    })
  },
  { deep: true }
)

watch([localMinQuestionCount, localMaxQuestionCount], ([newMin, newMax]) => {
  if (newMax < newMin) localMaxQuestionCount.value = newMin
})

watch(
  subjectConfigs,
  configs => {
    Object.keys(configs).forEach(subjectId => {
      if (configs[subjectId]?.max < configs[subjectId]?.min) {
        configs[subjectId].max = configs[subjectId].min
      }
    })
  },
  { deep: true }
)

const updateAnswerSettings = () => {
  const subjectQuestionCountsData = {}
  Object.keys(subjectConfigs).forEach(subjectId => {
    const config = subjectConfigs[subjectId]
    if (config?.enabled) {
      subjectQuestionCountsData[subjectId] = {
        enabled: true,
        fixed: config.fixed,
        min: config.min,
        max: config.max,
        value: config.value
      }
    }
  })

  emit('update-settings', {
    randomizeAnswers: localRandomizeAnswers.value,
    randomizeErrorCollectionAnswers: localRandomizeErrorCollectionAnswers.value,
    fixedQuestionCount: localFixedQuestionCount.value,
    minQuestionCount: localMinQuestionCount.value,
    maxQuestionCount: localMaxQuestionCount.value,
    fixedQuestionCountValue: localFixedQuestionCountValue.value,
    subjectQuestionCounts: JSON.stringify(subjectQuestionCountsData)
  })
}
</script>

<style scoped lang="scss">
.setting-card {
  border-radius: 12px !important;
}

.card-header {
  display: flex;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.setting-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #409eff;
  margin: 0 0 12px 0;
}

.section-hint {
  color: #909399;
  margin: 8px 0 0 0;
  font-size: 13px;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  flex-wrap: wrap;
}

.setting-label {
  font-weight: 500;
  min-width: 160px;
  color: #606266;
}

.setting-controls {
  display: flex;
  gap: 8px;
}

.setting-status {
  color: #909399;
  font-size: 13px;
}

.setting-status.active {
  color: #67c23a;
  font-weight: 500;
}

.range-text {
  color: #909399;
}

.subject-config-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-top: 12px;
}

.subject-config-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  gap: 16px;
}

.subject-config-item:last-child {
  border-bottom: none;
}

.subject-config-item:hover {
  background-color: #f5f7fa;
}

.subject-config-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.config-summary {
  color: #67c23a;
  font-weight: 500;
  font-size: 13px;
  min-width: 100px;
}

.use-default {
  color: #909399;
  font-size: 13px;
  margin-left: auto;
}

.setting-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid #ebeef5;
}
</style>
