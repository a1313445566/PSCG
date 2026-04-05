<template>
  <div class="entity-selector">
    <!-- 实体类型选择 -->
    <el-radio-group v-model="entityType" size="small" class="entity-type-group">
      <el-radio-button value="student">学生</el-radio-button>
      <el-radio-button value="class">班级</el-radio-button>
    </el-radio-group>

    <!-- 年级选择 -->
    <el-select
      v-model="selectedGrade"
      placeholder="选择年级"
      size="small"
      clearable
      class="grade-select"
      @change="handleGradeChange"
    >
      <el-option v-for="i in 6" :key="i" :label="`${i}年级`" :value="String(i)" />
    </el-select>

    <!-- 班级选择 -->
    <el-select
      v-if="selectedGrade && (entityType === 'class' || entityType === 'student')"
      v-model="selectedClass"
      placeholder="选择班级"
      size="small"
      clearable
      filterable
      class="class-select"
      @change="handleClassChange"
    >
      <el-option v-for="i in 10" :key="i" :label="`${i}班`" :value="String(i)" />
    </el-select>

    <!-- 学生选择（如果是学生类型） -->
    <el-select
      v-if="entityType === 'student' && selectedGrade && selectedClass"
      v-model="selectedStudentId"
      placeholder="选择学生"
      size="small"
      clearable
      filterable
      class="student-select"
      :loading="loadingStudents"
      @change="handleStudentChange"
    >
      <el-option
        v-for="student in students"
        :key="student.id"
        :label="student.name"
        :value="student.id"
      >
        <span>{{ student.name }}</span>
        <span style="float: right; color: #909399; font-size: 12px">{{ student.class }}班</span>
      </el-option>
    </el-select>

    <!-- 已选实体显示 -->
    <div v-if="selectedEntity" class="selected-entity">
      <el-tag type="success" size="large" closable @close="handleClearEntity">
        <el-icon><component :is="entityType === 'student' ? 'User' : 'School'" /></el-icon>
        {{ selectedEntity.name }}
      </el-tag>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { User, School } from '@element-plus/icons-vue'
import { api } from '@/utils/api'

// Props
const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:modelValue'])

// 状态
const entityType = ref('student')
const selectedGrade = ref('')
const selectedClass = ref('')
const selectedStudentId = ref(null)
const students = ref([])
const loadingStudents = ref(false)

// 计算已选实体
const selectedEntity = computed(() => {
  if (entityType.value === 'student' && selectedStudentId.value) {
    const student = students.value.find(s => s.id === selectedStudentId.value)
    if (student) {
      return {
        type: 'student',
        id: student.id,
        name: student.name,
        grade: selectedGrade.value,
        class: selectedClass.value,
        displayName: `${student.name}（${selectedGrade.value}年级${selectedClass.value}班）`
      }
    }
  } else if (entityType.value === 'class' && selectedGrade.value && selectedClass.value) {
    return {
      type: 'class',
      grade: selectedGrade.value,
      class: selectedClass.value,
      name: `${selectedGrade.value}年级${selectedClass.value}班`,
      displayName: `${selectedGrade.value}年级${selectedClass.value}班`
    }
  }
  return null
})

/**
 * 加载学生列表
 */
async function loadStudents() {
  if (!selectedGrade.value || !selectedClass.value) return

  loadingStudents.value = true
  try {
    const res = await api.get('/users', {
      grade: selectedGrade.value,
      class: selectedClass.value,
      page: 1,
      limit: 100
    })

    // 兼容不同的响应格式
    let users = []
    if (res.code === 0 && res.data?.users) {
      users = res.data.users
    } else if (Array.isArray(res.data)) {
      users = res.data
    } else if (res.users) {
      users = res.users
    }

    students.value = users
  } catch (error) {
    console.error('加载学生列表失败:', error)
    students.value = []
  } finally {
    loadingStudents.value = false
  }
}

/**
 * 年级变化
 */
function handleGradeChange() {
  selectedClass.value = ''
  selectedStudentId.value = null
  students.value = []
  emitUpdate()
}

/**
 * 班级变化
 */
function handleClassChange() {
  selectedStudentId.value = null
  if (entityType.value === 'student') {
    loadStudents()
  }
  emitUpdate()
}

/**
 * 学生变化
 */
function handleStudentChange() {
  emitUpdate()
}

/**
 * 清除选择
 */
function handleClearEntity() {
  selectedGrade.value = ''
  selectedClass.value = ''
  selectedStudentId.value = null
  students.value = []
  emitUpdate()
}

/**
 * 向上传递更新
 */
function emitUpdate() {
  emit('update:modelValue', selectedEntity.value)
}

// 监听实体类型变化
watch(entityType, () => {
  handleClearEntity()
})

// 监听外部值变化
watch(
  () => props.modelValue,
  newVal => {
    if (!newVal) {
      handleClearEntity()
    }
  }
)
</script>

<style scoped lang="scss">
.entity-selector {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.entity-type-group {
  flex-shrink: 0;
}

.grade-select,
.class-select,
.student-select {
  width: 120px;
}

.student-select {
  width: 150px;
}

.selected-entity {
  display: flex;
  align-items: center;
}

.selected-entity .el-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
