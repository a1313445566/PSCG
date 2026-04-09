# 图标资源目录

此目录用于存放 SVG 图标文件。

## 使用规范

### 1. 引用方式

```vue
<script setup>
// ✅ 推荐：作为组件引入
import IconUser from '@/assets/icons/user.svg?component'

// ✅ 或作为 URL 引入
import iconUserUrl from '@/assets/icons/user.svg'
</script>

<template>
  <!-- 作为组件使用 -->
  <IconUser class="icon" />
  
  <!-- 或作为图片使用 -->
  <img :src="iconUserUrl" alt="User" />
</template>
```

### 2. SVG 规范

- ✅ 使用纯色 SVG（便于通过 CSS 修改颜色）
- ✅ 移除不必要的 fill 属性
- ✅ 使用 viewBox 确保可缩放
- ❌ 禁止包含硬编码的颜色值

### 3. 命名规范

- 使用小写字母和连字符：`user-avatar.svg`
- 语义化命名：`arrow-right.svg`
- 统一前缀：`icon-user.svg`

## 推荐图标库

- [Element Plus Icons](https://element-plus.org/zh-CN/component/icon.html) - 项目已集成
- [Heroicons](https://heroicons.com/) - 开源 SVG 图标
- [Feather Icons](https://feathericons.com/) - 简洁图标库
