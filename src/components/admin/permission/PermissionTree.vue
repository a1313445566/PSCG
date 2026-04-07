<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const permissionModules = [
  { key: 'dashboard', label: '数据概览', actions: ['view'] },
  { key: 'questions', label: '题目管理', actions: ['view', 'create', 'edit', 'delete', 'batch'] },
  { key: 'subjects', label: '学科管理', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'grades-classes', label: '年级班级', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'user-stats', label: '用户数据', actions: ['view'] },
  { key: 'recent-records', label: '最近记录', actions: ['view'] },
  { key: 'user-management', label: '用户管理', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'data-analysis', label: '数据分析', actions: ['view'] },
  { key: 'ai-chat', label: 'AI 助手', actions: ['view'] },
  { key: 'ai-models', label: '模型管理', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'basic-settings', label: '基础设置', actions: ['view', 'edit'] },
  { key: 'database', label: '数据库管理', actions: ['view', 'backup', 'restore', 'cleanup'] },
  { key: 'security', label: '安全中心', actions: ['view', 'block-ip', 'unblock-ip'] },
  { key: 'admin-users', label: '管理员管理', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'admin-roles', label: '角色管理', actions: ['view', 'create', 'edit', 'delete'] }
]

const localPermissions = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const toggleModule = moduleKey => {
  if (props.disabled) return
  const module = permissionModules.find(m => m.key === moduleKey)
  if (!module) return

  const hasAnyPermission = module.actions.some(
    action => localPermissions.value[moduleKey]?.[action]
  )
  const newPermissions = { ...localPermissions.value }

  if (hasAnyPermission) {
    delete newPermissions[moduleKey]
  } else {
    newPermissions[moduleKey] = {}
    module.actions.forEach(action => {
      newPermissions[moduleKey][action] = true
    })
  }

  emit('update:modelValue', newPermissions)
}

const toggleAction = (moduleKey, action) => {
  if (props.disabled) return
  const newPermissions = { ...localPermissions.value }
  if (!newPermissions[moduleKey]) {
    newPermissions[moduleKey] = {}
  }
  newPermissions[moduleKey][action] = !newPermissions[moduleKey]?.[action]
  emit('update:modelValue', newPermissions)
}

const hasModulePermission = moduleKey => {
  const module = permissionModules.find(m => m.key === moduleKey)
  if (!module) return false
  return module.actions.some(action => localPermissions.value[moduleKey]?.[action])
}

const hasActionPermission = (moduleKey, action) => {
  return localPermissions.value[moduleKey]?.[action] || false
}
</script>

<template>
  <div class="permission-tree">
    <div v-for="module in permissionModules" :key="module.key" class="permission-module">
      <div class="module-header" @click="toggleModule(module.key)">
        <el-icon class="module-icon">
          <el-checkbox :model-value="hasModulePermission(module.key)" :disabled="disabled" />
        </el-icon>
        <span class="module-label">{{ module.label }}</span>
      </div>
      <div class="module-actions">
        <el-checkbox
          v-for="action in module.actions"
          :key="action"
          :model-value="hasActionPermission(module.key, action)"
          :disabled="disabled"
          @change="toggleAction(module.key, action)"
        >
          {{
            action === 'view'
              ? '查看'
              : action === 'create'
                ? '新增'
                : action === 'edit'
                  ? '编辑'
                  : action === 'delete'
                    ? '删除'
                    : action === 'batch'
                      ? '批量操作'
                      : action === 'backup'
                        ? '备份'
                        : action === 'restore'
                          ? '恢复'
                          : action === 'cleanup'
                            ? '清理'
                            : action === 'block-ip'
                              ? '封禁IP'
                              : action === 'unblock-ip'
                                ? '解封IP'
                                : action
          }}
        </el-checkbox>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.permission-tree {
  max-height: 400px;
  overflow-y: auto;

  .permission-module {
    margin-bottom: $spacing-sm;
    border: 1px solid $border-color;
    border-radius: $border-radius-sm;

    .module-header {
      display: flex;
      align-items: center;
      padding: $spacing-sm $spacing-md;
      background-color: rgba($primary-color, 0.05);
      cursor: pointer;

      &:hover {
        background-color: rgba($primary-color, 0.1);
      }

      .module-icon {
        margin-right: $spacing-sm;
      }

      .module-label {
        font-weight: 500;
      }
    }

    .module-actions {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-sm;
      padding: $spacing-sm $spacing-md;
      border-top: 1px solid $border-color;
    }
  }
}
</style>
