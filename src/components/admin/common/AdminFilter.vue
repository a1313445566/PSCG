<template>
  <div class="admin-filter">
    <div class="admin-filter-row">
      <!-- 动态筛选项 -->
      <div
        v-for="item in filterItems"
        :key="item.key"
        class="admin-filter-item"
        :style="{ minWidth: item.width || '150px' }"
      >
        <label v-if="item.label" class="admin-filter-label">{{ item.label }}</label>

        <!-- 输入框 -->
        <el-input
          v-if="item.type === 'input'"
          v-model="localFilters[item.key]"
          :placeholder="item.placeholder || `请输入${item.label}`"
          :clearable="item.clearable !== false"
          @input="handleInput(item)"
        />

        <!-- 数字输入框 -->
        <el-input
          v-else-if="item.type === 'number'"
          v-model="localFilters[item.key]"
          :placeholder="item.placeholder || `请输入${item.label}`"
          :clearable="item.clearable !== false"
          @input="handleNumberInput(item)"
        />

        <!-- 下拉选择 -->
        <el-select
          v-else-if="item.type === 'select'"
          v-model="localFilters[item.key]"
          :placeholder="item.placeholder || `请选择${item.label}`"
          :clearable="item.clearable !== false"
          :multiple="item.multiple"
          @change="handleChange(item)"
        >
          <el-option
            v-for="option in item.options"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <!-- 日期选择 -->
        <el-date-picker
          v-else-if="item.type === 'date'"
          v-model="localFilters[item.key]"
          :type="item.dateType || 'date'"
          :placeholder="item.placeholder || `请选择${item.label}`"
          :clearable="item.clearable !== false"
          :value-format="item.valueFormat || 'YYYY-MM-DD'"
          @change="handleChange(item)"
        />

        <!-- 日期范围 -->
        <el-date-picker
          v-else-if="item.type === 'daterange'"
          v-model="localFilters[item.key]"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :clearable="item.clearable !== false"
          value-format="YYYY-MM-DD"
          @change="handleChange(item)"
        />
      </div>

      <!-- 操作按钮 -->
      <div class="admin-filter-actions">
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
        <slot name="extra-actions"></slot>
      </div>
    </div>

    <!-- 已选筛选标签 -->
    <div v-if="showTags && activeFilterTags.length > 0" class="admin-filter-tags">
      <span class="tags-label">已选筛选：</span>
      <el-tag
        v-for="tag in activeFilterTags"
        :key="tag.key"
        closable
        type="info"
        @close="removeFilterTag(tag)"
      >
        {{ tag.label }}: {{ tag.displayValue }}
      </el-tag>
      <el-button type="primary" link size="small" @click="clearAllTags">清除全部</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'

const props = defineProps({
  // 筛选项配置
  filterItems: {
    type: Array,
    default: () => []
    /**
     * 配置格式：
     * {
     *   key: 'studentId',        // 字段名
     *   label: '学号',            // 标签文字
     *   type: 'input',           // 类型: input, number, select, date, daterange
     *   placeholder: '输入学号',  // 占位文字
     *   options: [],             // select 类型的选项
     *   width: '150px',          // 宽度
     *   clearable: true,         // 是否可清除
     *   multiple: false,         // select 是否多选
     *   dateType: 'date',        // 日期类型
     *   format: val => val       // 格式化显示值
     * }
     */
  },
  // 筛选值 (v-model)
  modelValue: {
    type: Object,
    default: () => ({})
  },
  // 是否显示已选标签
  showTags: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'search', 'reset', 'change'])

// 本地筛选值
const localFilters = ref({ ...props.modelValue })

// 监听外部值变化
watch(
  () => props.modelValue,
  newVal => {
    localFilters.value = { ...newVal }
  },
  { deep: true }
)

// 处理输入
const handleInput = item => {
  emit('change', { key: item.key, value: localFilters.value[item.key] })
}

// 处理数字输入
const handleNumberInput = item => {
  if (localFilters.value[item.key]) {
    localFilters.value[item.key] = localFilters.value[item.key].replace(/[^0-9]/g, '')
  }
  emit('change', { key: item.key, value: localFilters.value[item.key] })
}

// 处理选择变化
const handleChange = item => {
  emit('change', { key: item.key, value: localFilters.value[item.key] })
}

// 搜索
const handleSearch = () => {
  emit('update:modelValue', { ...localFilters.value })
  emit('search', { ...localFilters.value })
}

// 重置
const handleReset = () => {
  const resetValues = {}
  props.filterItems.forEach(item => {
    resetValues[item.key] = item.type === 'select' && item.multiple ? [] : ''
  })
  localFilters.value = resetValues
  emit('update:modelValue', resetValues)
  emit('reset')
}

// 计算已选筛选标签
const activeFilterTags = computed(() => {
  const tags = []
  props.filterItems.forEach(item => {
    const value = localFilters.value[item.key]
    if (
      value !== '' &&
      value !== null &&
      value !== undefined &&
      !(Array.isArray(value) && value.length === 0)
    ) {
      let displayValue = value
      // 如果有选项配置，显示选项标签
      if (item.type === 'select' && item.options) {
        if (item.multiple && Array.isArray(value)) {
          const labels = value.map(v => {
            const opt = item.options.find(o => o.value === v)
            return opt ? opt.label : v
          })
          displayValue = labels.join(', ')
        } else {
          const opt = item.options.find(o => o.value === value)
          displayValue = opt ? opt.label : value
        }
      }
      // 自定义格式化
      if (item.format) {
        displayValue = item.format(value)
      }
      tags.push({
        key: item.key,
        label: item.label,
        value,
        displayValue
      })
    }
  })
  return tags
})

// 移除单个筛选标签
const removeFilterTag = tag => {
  const item = props.filterItems.find(i => i.key === tag.key)
  if (item && item.type === 'select' && item.multiple) {
    localFilters.value[tag.key] = []
  } else {
    localFilters.value[tag.key] = ''
  }
  handleSearch()
}

// 清除所有标签
const clearAllTags = () => {
  handleReset()
}
</script>

<style scoped lang="scss">
.admin-filter {
  background: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.admin-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}

.admin-filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 150px;
}

.admin-filter-label {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  white-space: nowrap;
}

.admin-filter-item .el-input,
.admin-filter-item .el-select,
.admin-filter-item .el-date-picker {
  width: 100%;
}

.admin-filter-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

.admin-filter-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  flex-wrap: wrap;
}

.tags-label {
  font-size: 13px;
  color: #909399;
  flex-shrink: 0;
}

.admin-filter-tags .el-tag {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 响应式 */
@media (max-width: 768px) {
  .admin-filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .admin-filter-item {
    width: 100%;
    min-width: auto;
  }

  .admin-filter-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
