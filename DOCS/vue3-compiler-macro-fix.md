# Vue 3 编译器宏修复报告

## 问题诊断

### 警告信息

```
[@vue/compiler-sfc] `defineProps` is a compiler macro and no longer needs to be imported.
[@vue/compiler-sfc] `defineEmits` is a compiler macro and no longer needs to be imported.
```

### 根本原因

**Vue 3.3+ 重大变更**：
- `defineProps` 和 `defineEmits` 现在是编译器宏
- 不再需要从 `vue` 导入
- 编译时自动注入，运行时不可用

---

## 已实施的修复

### 修复的文件（共 3 个）

#### 1. SkeletonLoader.vue ✅

```vue
<!-- ❌ 修复前 -->
<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  type: { type: String, default: 'text' }
})
</script>

<!-- ✅ 修复后 -->
<script setup>
const props = defineProps({
  type: { type: String, default: 'text' }
})
</script>
```

#### 2. PasswordDialog.vue ✅

```vue
<!-- ❌ 修复前 -->
<script setup>
import { ref, defineProps, defineEmits, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['close', 'login-success'])
</script>

<!-- ✅ 修复后 -->
<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['close', 'login-success'])
</script>
```

#### 3. BackupRestore.vue ✅

```vue
<!-- ❌ 修复前 -->
<script setup>
import { ref, defineProps } from 'vue'

const props = defineProps({ backupHistory: Array })
const emit = defineEmits(['backup-data'])
</script>

<!-- ✅ 修复后 -->
<script setup>
import { ref } from 'vue'

const props = defineProps({ backupHistory: Array })
const emit = defineEmits(['backup-data'])
</script>
```

---

## Vue 3 编译器宏说明

### 什么是编译器宏？

编译器宏是在编译时处理的特殊函数，不会被包含在运行时代码中。

### Vue 3.3+ 的编译器宏列表

| 宏 | 用途 | 是否需要导入 |
|-----|------|-------------|
| `defineProps` | 定义组件 Props | ❌ 不需要 |
| `defineEmits` | 定义组件事件 | ❌ 不需要 |
| `defineExpose` | 暴露组件方法 | ❌ 不需要 |
| `defineModel` | 定义双向绑定（实验性） | ❌ 不需要 |
| `defineOptions` | 定义组件选项（实验性） | ❌ 不需要 |

### 正确用法

```vue
<script setup>
// ✅ 正确：直接使用，无需导入
const props = defineProps({
  title: { type: String, required: true },
  count: { type: Number, default: 0 }
})

const emit = defineEmits(['update', 'delete'])

// ✅ 其他 API 需要导入
import { ref, computed, watch } from 'vue'

const localCount = ref(props.count)
const doubled = computed(() => localCount.value * 2)
</script>
```

### 错误用法

```vue
<script setup>
// ❌ 错误：不应该导入编译器宏
import { defineProps, defineEmits } from 'vue'

const props = defineProps({ ... })
</script>
```

---

## 修复验证

### 编译检查

```bash
npm run build
# ✅ 无警告信息
```

### 运行检查

```bash
npm run dev
# ✅ 无编译器警告
```

---

## Vue 3.3+ 其他变更

### 1. 更好的 TypeScript 支持

```vue
<script setup lang="ts">
// ✅ 类型推导
const props = defineProps<{
  title: string
  count?: number
}>()

const emit = defineEmits<{
  (e: 'update', value: number): void
  (e: 'delete'): void
}>()
</script>
```

### 2. 响应式 Props 解构

```vue
<script setup>
// ✅ Vue 3.3+ 支持响应式解构
const { title, count = 0 } = defineProps({
  title: String,
  count: Number
})

// 解构后的变量仍然是响应式的
console.log(title) // 响应式
</script>
```

### 3. defineModel 宏（实验性）

```vue
<script setup>
// ✅ Vue 3.4+ 新增
const modelValue = defineModel()

// 双向绑定
</script>

<template>
  <input v-model="modelValue" />
</template>
```

---

## 升级建议

### 短期（立即）

1. ✅ 移除所有 `defineProps` 和 `defineEmits` 导入
2. ✅ 测试所有组件功能正常
3. ✅ 清理编译警告

### 中期（1周内）

1. 更新 ESLint 配置，禁止导入编译器宏
2. 更新项目文档，说明 Vue 3.3+ 变更
3. 添加代码检查脚本

### 长期（1月内）

1. 探索 `defineModel` 宏（Vue 3.4+）
2. 优化 TypeScript 类型定义
3. 使用响应式 Props 解构

---

## ESLint 配置建议

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // 禁止导入编译器宏
    'no-restricted-imports': ['error', {
      paths: [
        {
          name: 'vue',
          importNames: ['defineProps', 'defineEmits', 'defineExpose']
        }
      ]
    }]
  }
}
```

---

## 相关文档

1. **Vue 3.3 发布说明**: https://blog.vuejs.org/posts/vue-3-3
2. **RFC: defineProps 和 defineEmits 改进**: https://github.com/vuejs/rfcs/discussions
3. **Vue 3 官方文档**: https://vuejs.org/api/sfc-script-setup.html

---

## 总结

**修复文件数量**: 3 个
**修复内容**: 移除 `defineProps` 和 `defineEmits` 的导入语句
**修复效果**: ✅ 消除编译器警告

**修复时间**: 2026-04-01 00:00
**修复人员**: AI 助手

所有 Vue 3 编译器宏警告已修复！项目现在符合 Vue 3.3+ 规范。