<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <el-input
        :model-value="searchKeyword"
        placeholder="搜索题目内容..."
        style="width: 280px"
        clearable
        :prefix-icon="Search"
        @update:model-value="$emit('update:searchKeyword', $event)"
      />
      <el-select
        :model-value="filterType"
        placeholder="题目类型"
        style="width: 120px; margin-left: 10px"
        clearable
        @update:model-value="$emit('update:filterType', $event)"
      >
        <el-option label="全部类型" value="" />
        <el-option label="单选题" value="single" />
        <el-option label="多选题" value="multiple" />
        <el-option label="判断题" value="judgment" />
        <el-option label="听力题" value="listening" />
        <el-option label="阅读题" value="reading" />
        <el-option label="看图题" value="image" />
      </el-select>
    </div>
    <div class="toolbar-right">
      <el-button type="primary" @click="$emit('add')">
        <el-icon><Plus /></el-icon>
        添加题目
      </el-button>
      <el-button type="success" @click="$emit('batch-add')">
        <el-icon><Upload /></el-icon>
        批量添加
      </el-button>
      <el-dropdown
        trigger="click"
        :disabled="selectedCount === 0"
        @command="$emit('batch-command', $event)"
      >
        <el-button type="warning">
          批量操作
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="delete" :disabled="selectedCount === 0">
              <el-icon><Delete /></el-icon>
              批量删除
            </el-dropdown-item>
            <el-dropdown-item command="updateDifficulty" :disabled="selectedCount === 0">
              <el-icon><Star /></el-icon>
              修改难度
            </el-dropdown-item>
            <el-dropdown-item command="updateType" :disabled="selectedCount === 0">
              <el-icon><Document /></el-icon>
              修改类型
            </el-dropdown-item>
            <el-dropdown-item command="move" :disabled="selectedCount === 0">
              <el-icon><FolderOpened /></el-icon>
              移动到
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button type="info" :loading="loading" @click="$emit('refresh')">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>
  </div>
</template>

<script setup>
import {
  Search,
  Plus,
  Upload,
  ArrowDown,
  Delete,
  Star,
  Document,
  FolderOpened,
  Refresh
} from '@element-plus/icons-vue'

defineProps({
  searchKeyword: {
    type: String,
    default: ''
  },
  filterType: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  selectedCount: {
    type: Number,
    default: 0
  }
})

defineEmits([
  'update:searchKeyword',
  'update:filterType',
  'add',
  'batch-add',
  'batch-command',
  'refresh'
])
</script>

<style scoped lang="scss">
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
  margin-bottom: 12px;
  border-radius: 8px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-right .el-button {
  padding: 8px 12px;
}
</style>
