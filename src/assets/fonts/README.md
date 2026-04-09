# 字体资源目录

此目录用于存放自定义字体文件。

## 支持的字体格式

- **WOFF2** - 推荐格式（压缩率高，兼容性好）
- **WOFF** - 兼容格式
- **TTF/OTF** - 传统格式（不推荐）

## 使用规范

### 1. 引入字体

```scss
// 在 src/styles/scss/base/_fonts.scss 中定义
@font-face {
  font-family: 'CustomFont';
  src: url('@/assets/fonts/custom-font.woff2') format('woff2'),
       url('@/assets/fonts/custom-font.woff') format('woff');
  font-weight: normal;
  font-style: normal;
  font-display: swap; // 性能优化
}
```

### 2. 使用字体

```scss
.custom-text {
  font-family: 'CustomFont', sans-serif;
}
```

### 3. 性能优化

- ✅ 使用 `font-display: swap` 避免阻塞渲染
- ✅ 仅加载需要的字重（font-weight）
- ✅ 使用 WOFF2 格式（体积最小）
- ❌ 禁止加载过多字体文件

## 注意事项

- 字体文件较大，请谨慎使用
- 优先使用系统字体（性能更好）
- 项目默认使用 Element Plus 字体栈
