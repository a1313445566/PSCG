<template>
  <div>
    <!-- 批量修改难度弹窗 -->
    <el-dialog v-model="modelDifficultyVisible" title="批量修改难度" width="400px">
      <el-form label-width="80px">
        <el-form-item label="目标难度">
          <el-rate
            :model-value="difficulty"
            :max="3"
            @update:model-value="$emit('update:difficulty', $event)"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="$emit('update:difficultyVisible', false)">取消</el-button>
        <el-button type="primary" @click="$emit('execute-difficulty')">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量修改类型弹窗 -->
    <el-dialog v-model="modelTypeVisible" title="批量修改类型" width="400px">
      <el-form label-width="80px">
        <el-form-item label="目标类型">
          <el-select
            :model-value="type"
            placeholder="选择类型"
            @update:model-value="$emit('update:type', $event)"
          >
            <el-option label="单选题" value="single" />
            <el-option label="多选题" value="multiple" />
            <el-option label="判断题" value="judgment" />
            <el-option label="听力题" value="listening" />
            <el-option label="阅读题" value="reading" />
            <el-option label="看图题" value="image" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="$emit('update:typeVisible', false)">取消</el-button>
        <el-button type="primary" @click="$emit('execute-type')">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量移动弹窗 -->
    <el-dialog v-model="modelMoveVisible" title="批量移动到" width="450px">
      <el-form label-width="80px">
        <el-form-item label="目标学科">
          <el-select
            :model-value="moveSubjectId"
            placeholder="选择学科"
            @update:model-value="$emit('move-subject-change', $event)"
          >
            <el-option
              v-for="subject in subjects"
              :key="subject.id"
              :label="subject.name"
              :value="subject.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标题库">
          <el-select
            :model-value="moveSubcategoryId"
            placeholder="选择题库"
            :disabled="!moveSubjectId"
            @update:model-value="$emit('update:moveSubcategoryId', $event)"
          >
            <el-option
              v-for="sub in moveSubcategories"
              :key="sub.id"
              :label="sub.name"
              :value="sub.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="$emit('update:moveVisible', false)">取消</el-button>
        <el-button type="primary" :disabled="!moveSubjectId" @click="$emit('execute-move')">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  difficultyVisible: {
    type: Boolean,
    default: false
  },
  difficulty: {
    type: Number,
    default: 0
  },
  typeVisible: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: ''
  },
  moveVisible: {
    type: Boolean,
    default: false
  },
  moveSubjectId: {
    type: [Number, String],
    default: null
  },
  moveSubcategoryId: {
    type: [Number, String],
    default: null
  },
  moveSubcategories: {
    type: Array,
    default: () => []
  },
  subjects: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'update:difficultyVisible',
  'update:difficulty',
  'update:typeVisible',
  'update:type',
  'update:moveVisible',
  'update:moveSubjectId',
  'update:moveSubcategoryId',
  'execute-difficulty',
  'execute-type',
  'execute-move',
  'move-subject-change'
])

const modelDifficultyVisible = computed({
  get: () => props.difficultyVisible,
  set: val => emit('update:difficultyVisible', val)
})

const modelTypeVisible = computed({
  get: () => props.typeVisible,
  set: val => emit('update:typeVisible', val)
})

const modelMoveVisible = computed({
  get: () => props.moveVisible,
  set: val => emit('update:moveVisible', val)
})
</script>
