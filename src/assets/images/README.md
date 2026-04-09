# 静态资源使用指南

> 更新日期：2026-04-09
> 适用范围：PSCG 智能学习平台

---

## 一、目录结构

```
src/assets/
├── fonts/              # 字体文件
│   └── README.md
├── icons/              # 图标文件
│   └── README.md
└── images/             # 图片资源
    ├── backgrounds/    # 背景图片
    │   ├── .gitkeep
    │   ├── article-placeholder-1.png  # 文章占位图1
    │   ├── article-placeholder-2.png  # 文章占位图2
    │   ├── article-placeholder-3.png  # 文章占位图3
    │   └── article-placeholder-4.png  # 文章占位图4
    ├── icons/          # 图标图片
    │   └── .gitkeep
    ├── logo.svg        # Logo 文件
    └── README.md       # 本文档
```

---

## 二、文章占位图使用规范

### 2.1 占位图列表

| 文件名 | 用途 | 尺寸建议 |
|--------|------|----------|
| `article-placeholder-1.png` | 文章默认封面图1 | 800x600px |
| `article-placeholder-2.png` | 文章默认封面图2 | 800x600px |
| `article-placeholder-3.png` | 文章默认封面图3 | 800x600px |
| `article-placeholder-4.png` | 文章默认封面图4 | 800x600px |

### 2.2 使用方式

#### 方式1：在 Vue 组件中直接引用

```vue
<template>
  <img :src="placeholderImage" alt="文章封面" />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  thumbnail: {
    type: String,
    default: null
  }
})

// 随机选择占位图
const placeholderImage = computed(() => {
  if (props.thumbnail) {
    return props.thumbnail
  }
  const randomIndex = Math.floor(Math.random() * 4) + 1
  return new URL(`../assets/images/backgrounds/article-placeholder-${randomIndex}.png`, import.meta.url).href
})
</script>
```

#### 方式2：在 CSS 中引用

```scss
.article-card {
  background-image: url('@/assets/images/backgrounds/article-placeholder-1.png');
  background-size: cover;
  background-position: center;
}
```

#### 方式3：在 JavaScript 中动态加载

```javascript
const getPlaceholderImage = (index) => {
  return new URL(`../assets/images/backgrounds/article-placeholder-${index}.png`, import.meta.url).href
}

// 随机选择
const randomIndex = Math.floor(Math.random() * 4) + 1
const placeholder = getPlaceholderImage(randomIndex)
```

### 2.3 使用场景

| 场景 | 使用方式 | 说明 |
|------|----------|------|
| 文章列表页 | 随机选择占位图 | 提升视觉多样性 |
| 文章详情页 | 显示用户上传的封面图 | 无封面时使用占位图 |
| 后台预览 | 固定使用占位图1 | 统一预览效果 |

---

## 三、用户上传图片存储规范

### 3.1 存储路径

用户上传的图片存储在 `public/images/uploads/` 目录：

```
public/images/uploads/
├── article-{timestamp}-{random}.jpg    # 文章封面图
├── product-card-{timestamp}-{random}.png  # 产品卡片图标
└── ...
```

### 3.2 命名规范

| 类型 | 命名格式 | 示例 |
|------|----------|------|
| 文章封面图 | `article-{timestamp}-{random}.jpg` | `article-1612345678-123456.jpg` |
| 产品卡片图标 | `product-card-{timestamp}-{random}.png` | `product-card-1612345678-123456.png` |

### 3.3 访问路径

用户上传的图片通过相对路径访问：

```javascript
// 数据库存储路径
thumbnail: '/images/uploads/article-1612345678-123456.jpg'

// 前端访问路径
<img :src="article.thumbnail" alt="文章封面" />
```

---

## 四、图片优化建议

### 4.1 格式选择

| 类型 | 推荐格式 | 说明 |
|------|----------|------|
| 照片类 | JPEG | 文件小，质量好 |
| 图标类 | PNG/SVG | 支持透明背景 |
| 矢量图 | SVG | 无限缩放不失真 |

### 4.2 尺寸建议

| 类型 | 推荐尺寸 | 最大尺寸 |
|------|----------|----------|
| 文章封面图 | 800x600px | 1920x1080px |
| 产品卡片图标 | 64x64px | 128x128px |
| Logo | 原始尺寸 | - |

### 4.3 文件大小限制

| 类型 | 最大大小 | 说明 |
|------|----------|------|
| 文章封面图 | 2MB | 超过自动压缩 |
| 产品卡片图标 | 2MB | 超过自动压缩 |

---

## 五、注意事项

### 5.1 Git 提交规范

1. **禁止提交大文件**：单文件 > 1MB 需压缩后提交
2. **使用 .gitkeep**：空目录必须包含 `.gitkeep` 文件
3. **更新 README**：新增资源时更新本文档

### 5.2 开发规范

1. **使用相对路径**：避免硬编码绝对路径
2. **懒加载图片**：使用 `IntersectionObserver` 或第三方库
3. **响应式图片**：使用 `srcset` 或 CSS 媒体查询

### 5.3 性能优化

1. **图片压缩**：使用 `sharp` 库自动压缩上传图片
2. **CDN 加速**：生产环境使用 CDN 加速图片加载
3. **缓存策略**：设置合理的缓存策略（Cache-Control）

---

## 六、相关文档

- [CMS功能完善 - 共识文档](../../DOCS/CMS功能完善/CONSENSUS_CMS功能完善.md)
- [样式变量使用指南](../../DOCS/开发规范/样式变量使用指南.md)
- [编码规范](../../DOCS/开发文档/编码规范.md)
