<template>
  <div class="tool-selector">
    <!-- 工具分类 -->
    <div class="tool-categories">
      <el-tag
        v-for="cat in categories"
        :key="cat.id"
        :type="selectedCategory === cat.id ? 'primary' : 'info'"
        :effect="selectedCategory === cat.id ? 'dark' : 'plain'"
        class="category-tag"
        @click="handleCategoryClick(cat.id)"
      >
        <el-icon class="category-icon"><component :is="cat.icon" /></el-icon>
        {{ cat.name }}
      </el-tag>
    </div>

    <!-- 工具列表 -->
    <div class="tool-list">
      <div
        v-for="tool in filteredTools"
        :key="tool.name"
        class="tool-item"
        :class="{ active: selectedTool?.name === tool.name }"
        @click="handleSelectTool(tool)"
      >
        <div class="tool-header">
          <el-icon class="tool-icon"><component :is="tool.icon" /></el-icon>
          <span class="tool-name">{{ tool.displayName }}</span>
        </div>
        <div class="tool-desc">{{ tool.description }}</div>
        <div v-if="tool.quickQuestions?.length" class="tool-questions">
          <el-tag
            v-for="(q, idx) in tool.quickQuestions.slice(0, 2)"
            :key="idx"
            size="small"
            type="info"
            class="question-tag"
          >
            {{ formatQuestionPreview(q) }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 已选工具 -->
    <div v-if="selectedTool" class="selected-tool">
      <div class="selected-header">
        <span class="selected-title">
          <el-icon><component :is="selectedTool.icon" /></el-icon>
          已选: {{ selectedTool.displayName }}
        </span>
        <el-button type="danger" size="small" text @click="handleClearTool">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      <div class="selected-desc">{{ selectedTool.description }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  User,
  School,
  Aim,
  TrendCharts,
  MagicStick,
  Document,
  Monitor,
  Warning,
  DataAnalysis,
  Histogram,
  DocumentRemove,
  DataLine,
  Collection,
  Close,
  Compass
} from '@element-plus/icons-vue'
import { api } from '@/utils/api'

// Props
const props = defineProps({
  selectedTool: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:selectedTool'])

// 状态
const categories = ref([
  { id: 'student', name: '学生分析', icon: 'User' },
  { id: 'class', name: '班级分析', icon: 'School' },
  { id: 'knowledge', name: '知识点', icon: 'Aim' },
  { id: 'progress', name: '学习轨迹', icon: 'TrendCharts' },
  { id: 'recommendation', name: '推荐', icon: 'MagicStick' },
  { id: 'question', name: '题目', icon: 'Document' },
  { id: 'system', name: '系统', icon: 'Monitor' }
])
const tools = ref([])
const selectedCategory = ref('student')
const selectedTool = ref(props.selectedTool)

// 图标映射
const _iconComponents = {
  User,
  School,
  Aim,
  TrendCharts,
  MagicStick,
  Document,
  Monitor,
  Warning,
  DataAnalysis,
  Histogram,
  DocumentRemove,
  DataLine,
  Compass,
  Collection
}

// 过滤工具
const filteredTools = computed(() => {
  if (!selectedCategory.value) return tools.value
  return tools.value.filter(t => t.category === selectedCategory.value)
})

/**
 * 加载工具元数据
 */
async function loadToolsMetadata() {
  try {
    const res = await api.get('/tools/metadata')
    if (res.code === 0) {
      tools.value = res.data.tools
      categories.value = res.data.categories
    }
  } catch (error) {
    console.error('加载工具元数据失败:', error)
  }
}

/**
 * 选择分类
 */
function handleCategoryClick(catId) {
  selectedCategory.value = catId
}

/**
 * 选择工具
 */
function handleSelectTool(tool) {
  selectedTool.value = tool
  emit('update:selectedTool', tool)
}

/**
 * 清除选择
 */
function handleClearTool() {
  selectedTool.value = null
  emit('update:selectedTool', null)
}

/**
 * 格式化问题预览
 */
function formatQuestionPreview(question) {
  return (
    question
      .replace(/\{[^}]+\}/g, '___')
      .replace(/查看|分析|查询/g, '')
      .substring(0, 15) + '...'
  )
}

onMounted(() => {
  loadToolsMetadata()
})
</script>

<style scoped lang="scss">
.tool-selector {
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.tool-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.category-tag {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s;
}

.category-tag:hover {
  transform: translateY(-2px);
}

.category-icon {
  font-size: 14px;
}

.tool-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.tool-item {
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.tool-item:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

.tool-item.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.tool-icon {
  font-size: 18px;
  color: #409eff;
}

.tool-name {
  font-weight: 500;
  font-size: 14px;
}

.tool-desc {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  line-height: 1.4;
}

.tool-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.question-tag {
  font-size: 11px;
}

.selected-tool {
  margin-top: 16px;
  padding: 12px;
  background: #f0f9ff;
  border: 1px solid #409eff;
  border-radius: 8px;
}

.selected-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.selected-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #409eff;
}

.selected-desc {
  font-size: 12px;
  color: #606266;
}
</style>
