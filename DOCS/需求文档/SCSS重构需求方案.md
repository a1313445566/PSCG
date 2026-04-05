# SCSS 7-1 架构重构需求方案

> 文档版本: v2.0 | 创建日期: 2026-04-05 | 状态: ✅ 基本完成

---

## 一、重构目标

### 1.1 核心目标
将项目从分散的 CSS 文件结构迁移到 **SCSS 7-1 架构模式**，提升样式代码的：
- **可维护性**: 模块化管理，职责清晰
- **可扩展性**: 新增样式只需对应模块文件
- **可复用性**: 变量、混合宏、函数统一管理
- **团队协作**: 减少样式冲突，提高开发效率

### 1.2 重构范围
- **前端目录**: `src/styles/scss/`
- **构建工具**: Vite + sass 预处理器
- **影响范围**: 全局样式、组件样式、布局样式、主题系统

### 1.3 预期收益
| 维度 | 重构前 | 重构后 |
|------|--------|--------|
| 文件组织 | 分散在多个目录 | 7-1 模块化结构 |
| 变量管理 | 硬编码或局部定义 | 统一变量系统 |
| 重复代码 | 大量冗余样式 | 混合宏复用 |
| 主题切换 | 困难 | 变量驱动切换 |
| 维护成本 | 高 | 低 |

---

## 二、架构设计

### 2.1 SCSS 7-1 模式说明
7-1 架构是指：
- **7 个核心文件夹**: abstracts, base, components, layouts, pages, themes, vendors
- **1 个主入口文件**: main.scss

### 2.2 目录结构设计
```
src/styles/scss/
├── abstracts/              # 抽象层：变量、混合宏、函数
│   ├── _variables.scss     # 全局变量（颜色、字体、间距等）
│   ├── _mixins.scss        # 可复用的混合宏
│   ├── _functions.scss     # SCSS 函数
│   └── _index.scss         # 抽象层入口
│
├── base/                   # 基础层：重置、基础样式
│   ├── _reset.scss         # CSS Reset / Normalize
│   └── _index.scss         # 基础层入口
│
├── components/             # 组件层：可复用组件样式
│   ├── _buttons.scss       # 按钮样式
│   ├── _cards.scss         # 卡片样式
│   ├── _forms.scss         # 表单样式
│   ├── _modals.scss        # 弹窗样式
│   ├── _question-management.scss  # 题目管理组件
│   ├── _skeleton.scss      # 骨架屏样式
│   ├── _tables.scss        # 表格样式
│   └── _index.scss         # 组件层入口
│
├── layouts/                # 布局层：页面布局
│   ├── _admin.scss         # 管理后台布局
│   ├── _game.scss          # 游戏答题布局
│   └── _index.scss         # 布局层入口
│
├── pages/                  # 页面层：特定页面样式
│   ├── _dashboard.scss     # 仪表盘页
│   ├── _login.scss         # 登录页
│   └── _index.scss         # 页面层入口
│
├── themes/                 # 主题层：主题变量
│   ├── _admin.scss         # 管理后台主题
│   ├── _game.scss          # 游戏主题
│   └── _index.scss         # 主题层入口
│
└── main.scss               # 主入口文件（引入所有模块）
```

---

## 三、详细模块说明

### 3.1 Abstracts 抽象层

#### _variables.scss - 全局变量系统
```scss
// ============================================
// 颜色系统
// ============================================
$primary-color: #409EFF;           // 主色调（Element Plus 蓝）
$success-color: #67C23A;           // 成功色
$warning-color: #E6A23C;           // 警告色
$danger-color: #F56C6C;            // 危险色
$info-color: #909399;              // 信息色

// 文字颜色
$text-primary: #303133;            // 主要文字
$text-regular: #606266;            // 常规文字
$text-secondary: #909399;          // 次要文字
$text-placeholder: #C0C4CC;        // 占位符

// 背景色
$bg-color: #F5F7FA;               // 页面背景
$bg-white: #FFFFFF;               // 白色背景

// 边框
$border-color: #DCDFE6;           // 边框色
$border-radius-base: 4px;         // 基础圆角
$border-radius-lg: 8px;           // 大圆角

// ============================================
// 字体系统
// ============================================
$font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
             Roboto, 'Helvetica Neue', Arial, sans-serif;
$font-size-base: 14px;            // 基础字号
$font-size-sm: 12px;              // 小字号
$font-size-lg: 16px;              // 大字号
$font-size-xl: 18px;              // 特大字号

// 字重
$font-weight-normal: 400;
$font-weight-bold: 700;

// ============================================
// 间距系统
// ============================================
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;

// ============================================
// 断点系统（响应式）
// ============================================
$breakpoint-xs: 480px;            // 手机竖屏
$breakpoint-sm: 768px;            // 手机横屏/小平板
$breakpoint-md: 992px;            // 平板
$breakpoint-lg: 1200px;           // 桌面
$breakpoint-xl: 1920px;           // 大屏

// ============================================
// 阴影系统
// ============================================
$box-shadow-base: 0 2px 4px rgba(0, 0, 0, 0.12);
$box-shadow-light: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
$box-shadow-dark: 0 4px 12px rgba(0, 0, 0, 0.15);

// ============================================
// 过渡动画
// ============================================
$transition-duration: 0.3s;
$transition-timing: ease;
```

#### _mixins.scss - 混合宏系统
```scss
// ============================================
// 响应式混合宏
// ============================================
@mixin respond-to($breakpoint) {
  @if $breakpoint == xs {
    @media (max-width: $breakpoint-xs) { @content; }
  } @else if $breakpoint == sm {
    @media (max-width: $breakpoint-sm) { @content; }
  } @else if $breakpoint == md {
    @media (max-width: $breakpoint-md) { @content; }
  } @else if $breakpoint == lg {
    @media (max-width: $breakpoint-lg) { @content; }
  } @else if $breakpoint == xl {
    @media (max-width: $breakpoint-xl) { @content; }
  }
}

// 最小宽度响应式
@mixin respond-above($breakpoint) {
  @if $breakpoint == xs {
    @media (min-width: $breakpoint-xs) { @content; }
  } @else if $breakpoint == sm {
    @media (min-width: $breakpoint-sm) { @content; }
  } // ... 其他断点
}

// ============================================
// Flexbox 布局混合宏
// ============================================
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@mixin flex-column {
  display: flex;
  flex-direction: column;
}

// ============================================
// 卡片样式混合宏
// ============================================
@mixin card-style($padding: $spacing-md) {
  background: $bg-white;
  border-radius: $border-radius-base;
  box-shadow: $box-shadow-base;
  padding: $padding;
  transition: box-shadow $transition-duration $transition-timing;

  &:hover {
    box-shadow: $box-shadow-light;
  }
}

// ============================================
// 文本截断混合宏
// ============================================
@mixin text-truncate($lines: 1) {
  @if $lines == 1 {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  } @else {
    display: -webkit-box;
    -webkit-line-clamp: $lines;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

// ============================================
// 滚动条样式混合宏
// ============================================
@mixin custom-scrollbar($width: 6px) {
  &::-webkit-scrollbar {
    width: $width;
    height: $width;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #C0C4CC;
    border-radius: 3px;

    &:hover {
      background: #909399;
    }
  }
}

// ============================================
// 清除浮动混合宏
// ============================================
@mixin clearfix {
  &::after {
    content: '';
    display: table;
    clear: both;
  }
}
```

#### _functions.scss - 函数库
```scss
// ============================================
// 颜色函数
// ============================================

// 获取颜色透明度版本
@function transparentize-color($color, $amount: 0.5) {
  @return rgba(red($color), green($color), blue($color), $amount);
}

// 计算相对亮度（用于对比度检测）
@function luminance($color) {
  $red: red($color) / 255;
  $green: green($color) / 255;
  $blue: blue($color) / 255;

  @return 0.2126 * $red + 0.7152 * $green + 0.0722 * $blue;
}

// ============================================
// 数学函数
// ============================================

// 将 px 转换为 rem
@function px-to-rem($px, $base: 16) {
  @return calc($px / $base) * 1rem;
}

// 计算百分比
@function percentage-value($value, $total: 100) {
  @return percentage(calc($value / $total));
}

// ============================================
// 字符串函数
// ============================================

// 生成唯一类名前缀
@function generate-class-prefix($component) {
  @return 'psc-#{$component}';
}
```

#### _index.scss - 抽象层入口
```scss
// 引入所有抽象层模块
@forward 'variables';
@forward 'mixins';
@forward 'functions';
```

---

### 3.2 Base 基础层

#### _reset.scss - CSS 重置
```scss
// ============================================
// 现代化 CSS Reset
// 基于: Modern Normalize + 自定义调整
// ============================================ *,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: $font-size-base;
  line-height: 1.5;
  -webkit-text-size-adjust: 100%;
  -moz-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

body {
  font-family: $font-family;
  color: $text-primary;
  background-color: $bg-color;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  @include custom-scrollbar();
}

// 移除列表默认样式
ul,
ol {
  list-style: none;
}

// 图片响应式
img,
picture,
video,
canvas,
svg {
  display: block;
  max-width: 100%;
  height: auto;
}

// 表单元素继承字体
input,
button,
textarea,
select {
  font: inherit;
  color: inherit;
}

// 链接默认样式移除下划线
a {
  color: inherit;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

// 表格边框合并
table {
  border-collapse: collapse;
  border-spacing: 0;
}

// 按钮重置
button {
  background: none;
  border: none;
  cursor: pointer;
  outline: none;
}
```

---

### 3.3 Components 组件层

#### _buttons.scss - 按钮组件
```scss
// ============================================
// 按钮组件样式
// ============================================
.psc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-sm $spacing-md;
  font-size: $font-size-base;
  font-weight: $font-weight-normal;
  line-height: 1;
  border-radius: $border-radius-base;
  cursor: pointer;
  transition: all $transition-duration $transition-timing;
  user-select: none;
  white-space: nowrap;

  // 尺寸变体
  &--sm {
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-sm;
  }

  &--lg {
    padding: $spacing-md $spacing-lg;
    font-size: $font-size-lg;
  }

  // 类型变体
  &--primary {
    background-color: $primary-color;
    color: $bg-white;

    &:hover {
      opacity: 0.9;
    }
  }

  &--success {
    background-color: $success-color;
    color: $bg-white;
  }

  &--danger {
    background-color: $danger-color;
    color: $bg-white;
  }

  // 幽灵按钮
  &--ghost {
    background-color: transparent;
    border: 1px solid $border-color;

    &:hover {
      border-color: $primary-color;
      color: $primary-color;
    }
  }

  // 禁用状态
  &--disabled,
  &[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }

  // 加载状态
  &--loading {
    position: relative;
    pointer-events: none;

    &::after {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top-color: currentColor;
      border-radius: 50%;
      animation: psc-spin 0.6s linear infinite;
    }
  }
}

@keyframes psc-spin {
  to {
    transform: rotate(360deg);
  }
}
```

#### _cards.scss - 卡片组件
```scss
// ============================================
// 卡片组件样式
// ============================================
.psc-card {
  @include card-style();

  // 头部区域
  &__header {
    padding-bottom: $spacing-md;
    margin-bottom: $spacing-md;
    border-bottom: 1px solid $border-color;

    &-title {
      font-size: $font-size-lg;
      font-weight: $font-weight-bold;
      color: $text-primary;
    }
  }

  // 内容区域
  &__body {
    flex: 1;
  }

  // 底部区域
  &__footer {
    padding-top: $spacing-md;
    margin-top: $spacing-md;
    border-top: 1px solid $border-color;
  }

  // 变体：阴影卡片
  &--shadow {
    box-shadow: $box-shadow-light;

    &:hover {
      box-shadow: $box-shadow-dark;
      transform: translateY(-2px);
    }
  }

  // 变体：无边框卡片
  &--flat {
    box-shadow: none;
    border: 1px solid $border-color;
  }

  // 变体：可点击卡片
  &--interactive {
    cursor: pointer;

    &:active {
      transform: scale(0.98);
    }
  }
}
```

#### _tables.scss - 表格组件
```scss
// ============================================
// 表格组件样式
// ============================================
.psc-table {
  width: 100%;
  border-collapse: collapse;
  background: $bg-white;
  border-radius: $border-radius-base;
  overflow: hidden;
  box-shadow: $box-shadow-base;

  // 表头
  thead {
    background: #FAFAFA;

    th {
      padding: $spacing-md;
      font-weight: $font-weight-bold;
      color: $text-primary;
      text-align: left;
      border-bottom: 2px solid $border-color;
      white-space: nowrap;
    }
  }

  // 表格内容
  tbody {
    tr {
      transition: background-color $transition-duration;

      &:hover {
        background: #F5F7FA;
      }

      // 斑马纹
      &:nth-child(even) {
        background: #FAFAFA;

        &:hover {
          background: #F5F7FA;
        }
      }
    }

    td {
      padding: $spacing-md;
      color: $text-regular;
      border-bottom: 1px solid #EBEEF5;
    }
  }

  // 单元格文本截断
  &__cell-truncate {
    @include text-truncate(1);
    max-width: 200px;
  }

  // 排序列
  &__sortable {
    cursor: pointer;
    user-select: none;

    &::after {
      content: ' ⇅';
      opacity: 0.3;
    }

    &:hover::after {
      opacity: 1;
    }
  }

  // 空状态
  &__empty {
    text-align: center;
    padding: $spacing-xl * 2;
    color: $text-secondary;
  }
}
```

#### _forms.scss - 表单组件
```scss
// ============================================
// 表单组件样式
// ============================================
.psc-form {
  // 表单项
  &__item {
    margin-bottom: $spacing-md;

    &-label {
      display: block;
      margin-bottom: $spacing-xs;
      font-size: $font-size-base;
      color: $text-regular;

      .required {
        color: $danger-color;
        margin-right: 4px;
      }
    }
  }

  // 输入框
  &__input {
    width: 100%;
    padding: $spacing-sm $spacing-md;
    font-size: $font-size-base;
    color: $text-primary;
    background: $bg-white;
    border: 1px solid $border-color;
    border-radius: $border-radius-base;
    outline: none;
    transition: border-color $transition-duration;

    &:focus {
      border-color: $primary-color;
      box-shadow: 0 0 0 2px transparentize-color($primary-color, 0.8);
    }

    &::placeholder {
      color: $text-placeholder;
    }

    // 错误状态
    &--error {
      border-color: $danger-color;

      &:focus {
        box-shadow: 0 0 0 2px transparentize-color($danger-color, 0.8);
      }
    }

    // 禁用状态
    &--disabled {
      background: #F5F7FA;
      cursor: not-allowed;
    }
  }

  // 选择框
  &__select {
    @extend .psc-form__input;
    appearance: none;
    background-image: url("data:image/svg+xml,...");
    background-repeat: no-repeat;
    background-position: right 8px center;
    padding-right: 32px;
  }

  // 错误信息
  &__error {
    margin-top: $spacing-xs;
    font-size: $font-size-sm;
    color: $danger-color;
  }
}
```

#### _modals.scss - 弹窗组件
```scss
// ============================================
// 弹窗/对话框组件样式
// ============================================
.psc-modal {
  // 遮罩层
  &__overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: psc-fade-in 0.3s ease;
  }

  // 弹窗容器
  &__container {
    @include card-style($spacing-lg);
    width: 90%;
    max-width: 520px;
    max-height: 80vh;
    overflow-y: auto;
    animation: psc-scale-in 0.3s ease;
  }

  // 头部
  &__header {
    @include flex-between();
    margin-bottom: $spacing-md;

    &-title {
      font-size: $font-size-lg;
      font-weight: $font-weight-bold;
    }

    &-close {
      font-size: 24px;
      color: $text-secondary;
      cursor: pointer;
      transition: color $transition-duration;

      &:hover {
        color: $text-primary;
      }
    }
  }

  // 内容区
  &__body {
    margin-bottom: $spacing-lg;
    color: $text-regular;
    line-height: 1.6;
  }

  // 底部按钮
  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-sm;
  }

  // 尺寸变体
  &--sm &__container {
    max-width: 400px;
  }

  &--lg &__container {
    max-width: 720px;
  }

  &--full &__container {
    max-width: 90vw;
    max-height: 90vh;
  }
}

@keyframes psc-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes psc-scale-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

#### _question-management.scss - 题目管理组件
```scss
// ============================================
// 题目管理专用组件样式
// ============================================

// 题目卡片
.question-card {
  @include card-style();
  margin-bottom: $spacing-md;
  transition: all $transition-duration;

  &:hover {
    border-color: $primary-color;
  }

  // 题目标签
  &__badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    font-size: $font-size-sm;
    border-radius: 10px;
    background: #ECF5FF;
    color: $primary-color;

    &--single { background: #ECF5FF; color: $primary-color; }
    &--multiple { background: #F0F9EB; color: $success-color; }
    &--judgment { background: #FEF0F0; color: $danger-color; }
  }

  // 难度标识
  &__difficulty {
    &--easy { color: $success-color; }
    &--medium { color: $warning-color; }
    &--hard { color: $danger-color; }
  }

  // 选项预览
  &__options {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: $spacing-sm;
    margin-top: $spacing-sm;
  }

  // 操作按钮组
  &__actions {
    display: flex;
    gap: $spacing-xs;
    margin-top: $spacing-md;
    padding-top: $spacing-md;
    border-top: 1px solid $border-color;
  }
}

// 批量操作栏
.batch-toolbar {
  @include flex-between();
  padding: $spacing-md;
  background: $bg-white;
  border-radius: $border-radius-base;
  box-shadow: $box-shadow-base;
  margin-bottom: $spacing-md;

  &__left {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__right {
    display: flex;
    gap: $spacing-sm;
  }

  // 选中计数
  &__count {
    color: $primary-color;
    font-weight: $font-weight-bold;
  }
}

// 题目筛选器
.question-filter {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: $spacing-md;
  padding: $spacing-md;
  background: $bg-white;
  border-radius: $border-radius-base;
  margin-bottom: $spacing-md;
}
```

#### _skeleton.scss - 骨架屏组件
```scss
// ============================================
// 骨架屏加载组件样式
// ============================================
.psc-skeleton {
  position: relative;
  overflow: hidden;
  background: #F2F3F5;
  border-radius: $border-radius-base;

  // 动画效果
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.5) 50%,
      transparent 100%
    );
    animation: psc-skeleton-loading 1.5s infinite;
  }
}

@keyframes psc-skeleton-loading {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}

// 文本骨架
.skeleton-text {
  @extend .psc-skeleton;
  height: 16px;
  margin-bottom: $spacing-sm;

  &--lg {
    height: 24px;
  }

  &--sm {
    height: 12px;
    width: 60%;
  }
}

// 圆形骨架（头像等）
.skeleton-circle {
  @extend .psc-skeleton;
  border-radius: 50%;

  &--sm { width: 32px; height: 32px; }
  &--md { width: 48px; height: 48px; }
  &--lg { width: 64px; height: 64px; }
}

// 卡片骨架
.skeleton-card {
  @extend .psc-skeleton;
  padding: $spacing-md;
  min-height: 200px;
}
```

#### _index.scss - 组件层入口
```scss
// 引入所有组件样式
@use '../abstracts' as *;

@forward 'buttons';
@forward 'cards';
@forward 'forms';
@forward 'modals';
@forward 'question-management';
@forward 'skeleton';
@forward 'tables';
```

---

### 3.4 Layouts 布局层

#### _admin.scss - 管理后台布局
```scss
// ============================================
// 管理后台布局
// ============================================
.admin-layout {
  display: flex;
  min-height: 100vh;

  // 侧边栏
  &__sidebar {
    width: 220px;
    background: #304156;
    color: #fff;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 100;
    transition: width $transition-duration;

    // 折叠状态
    &--collapsed {
      width: 64px;
    }
  }

  // 主内容区
  &__main {
    flex: 1;
    margin-left: 220px;
    display: flex;
    flex-direction: column;
    transition: margin-left $transition-duration;

    .admin-layout__sidebar--collapsed + & {
      margin-left: 64px;
    }
  }

  // 顶部导航
  &__header {
    height: 60px;
    background: $bg-white;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 $spacing-lg;
    position: sticky;
    top: 0;
    z-index: 99;
  }

  // 内容区域
  &__content {
    flex: 1;
    padding: $spacing-lg;
    background: $bg-color;
    overflow-y: auto;
  }

  // 响应式：平板以下隐藏侧边栏
  @include respond-to(md) {
    &__sidebar {
      transform: translateX(-100%);
      width: 220px !important;

      &--open {
        transform: translateX(0);
      }
    }

    &__main {
      margin-left: 0 !important;
    }
  }
}
```

#### _game.scss - 游戏答题布局
```scss
// ============================================
// 游戏/答题界面布局
// ============================================
.game-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-md;

  // 答题容器
  &__container {
    width: 100%;
    max-width: 800px;
    @include card-style($spacing-xl);
    min-height: 600px;
    display: flex;
    flex-direction: column;
  }

  // 进度条区域
  &__progress {
    margin-bottom: $spacing-lg;
  }

  // 题目区域
  &__question {
    flex: 1;
    margin-bottom: $spacing-lg;
  }

  // 操作区域
  &__actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: $spacing-lg;
    border-top: 1px solid $border-color;
  }

  // 响应式适配
  @include respond-to(sm) {
    padding: $spacing-sm;

    &__container {
      padding: $spacing-md;
    }
  }
}
```

#### _index.scss - 布局层入口
```scss
@use '../abstracts' as *;

@forward 'admin';
@forward 'game';
```

---

### 3.5 Pages 页面层

#### _dashboard.scss - 仪表盘页面
```scss
// ============================================
// 仪表盘页面样式
// ============================================
.dashboard-page {
  // 统计卡片网格
  &__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: $spacing-md;
    margin-bottom: $spacing-lg;
  }

  // 图表区域
  &__charts {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-md;
    margin-bottom: $spacing-lg;

    @include respond-to(md) {
      grid-template-columns: 1fr;
    }
  }

  // 快捷操作
  &__quick-actions {
    display: flex;
    gap: $spacing-md;
    flex-wrap: wrap;
  }

  // 最近活动列表
  &__recent-list {
    .activity-item {
      display: flex;
      align-items: center;
      padding: $spacing-md;
      border-bottom: 1px solid $border-color;

      &:last-child {
        border-bottom: none;
      }

      &__icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        @include flex-center();
        margin-right: $spacing-md;
        background: #ECF5FF;
        color: $primary-color;
      }

      &__content {
        flex: 1;

        &-title {
          font-weight: $font-weight-bold;
          margin-bottom: 4px;
        }

        &-time {
          font-size: $font-size-sm;
          color: $text-secondary;
        }
      }
    }
  }
}
```

#### _login.scss - 登录页面
```scss
// ============================================
// 登录页面样式
// ============================================
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  // 登录表单容器
  &__container {
    width: 100%;
    max-width: 420px;
    @include card-style($spacing-xl * 1.5);
    animation: psc-slide-up 0.5s ease;
  }

  // Logo 区域
  &__logo {
    text-align: center;
    margin-bottom: $spacing-xl;

    h1 {
      font-size: 28px;
      font-weight: bold;
      color: $text-primary;
      margin-bottom: $spacing-xs;
    }

    p {
      color: $text-secondary;
      font-size: $font-size-sm;
    }
  }

  // 表单区域
  &__form {
    .form-group {
      margin-bottom: $spacing-lg;
    }

    .submit-btn {
      width: 100%;
      height: 44px;
      font-size: $font-size-lg;
      margin-top: $spacing-md;
    }
  }

  // 底部链接
  &__footer {
    text-align: center;
    margin-top: $spacing-lg;
    padding-top: $spacing-lg;
    border-top: 1px solid $border-color;
    font-size: $font-size-sm;
    color: $text-secondary;

    a {
      color: $primary-color;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  // 响应式
  @include respond-to(sm) {
    padding: $spacing-md;

    &__container {
      padding: $spacing-lg;
    }
  }
}

@keyframes psc-slide-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### _index.scss - 页面层入口
```scss
@use '../abstracts' as *;

@forward 'dashboard';
@forward 'login';
```

---

### 3.6 Themes 主题层

#### _admin.scss - 管理后台主题
```scss
// ============================================
// 管理后台主题变量覆盖
// ============================================

// 侧边栏主题
$admin-sidebar-bg: #304156;
$admin-sidebar-text: #bfcbd9;
$admin-sidebar-active-bg: #1890ff;
$admin-sidebar-active-text: #fff;

// 顶部导航主题
$admin-header-bg: #fff;
$admin-header-border: #e6e6e6;

// 内容区主题
$admin-content-bg: #f0f2f5;

// 应用主题变量到布局
.admin-layout {
  &__sidebar {
    background: $admin-sidebar-bg;
    color: $admin-sidebar-text;
  }

  &__header {
    background: $admin-header-bg;
    border-bottom: 1px solid $admin-header-border;
  }

  &__content {
    background: $admin-content-bg;
  }
}
```

#### _game.scss - 游戏主题
```scss
// ============================================
// 游戏/答题界面主题
// ============================================

// 渐变背景
$game-bg-start: #667eea;
$game-bg-end: #764ba2;

// 卡片主题
$game-card-bg: #fff;
$game-card-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);

// 按钮主题
$game-btn-primary: #667eea;
$game-btn-success: #48bb78;
$game-btn-danger: #f56565;

// 文字主题
$game-text-primary: #2d3748;
$game-text-secondary: #718096;

// 应用主题
.game-layout {
  background: linear-gradient(135deg, $game-bg-start 0%, $game-bg-end 100%);

  &__container {
    background: $game-card-bg;
    box-shadow: $game-card-shadow;
  }
}
```

#### _index.scss - 主题层入口
```scss
@use '../abstracts' as *;

@forward 'admin';
@forward 'game';
```

---

### 3.7 main.scss 主入口文件

```scss
// ============================================
// PSCG 教育系统 - SCSS 主入口文件
// 版本: v2.0 | 更新: 2026-04-05
// 架构模式: SCSS 7-1
// ============================================

// 1. 引入抽象层（变量、混合宏、函数）- 必须最先加载
@use './abstracts' as *;

// 2. 引入基础层（CSS 重置）
@use './base';

// 3. 引入第三方库样式覆盖
// @use './vendors/element-overrides'; // 如果需要

// 4. 引入主题层
@use './themes';

// 5. 引入组件层
@use './components';

// 6. 引入布局层
@use './layouts';

// 7. 引入页面层
@use './pages';

// ============================================
// 全局工具类（可选）
// ============================================

// 文本对齐
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }

// 显示控制
.hidden { display: none !important; }
.visible { visibility: visible; }
.invisible { visibility: hidden; }

// 浮动清除
.clearfix {
  @include clearfix();
}

// 间距快捷类（如需使用）
.mt-0 { margin-top: 0 !important; }
.mb-0 { margin-bottom: 0 !important; }
// ... 更多间距类可根据需要添加
```

---

## 四、核心特性详解

### 4.1 变量系统
- **统一管理**: 所有设计 token 集中在 `_variables.scss`
- **语义化命名**: `$primary-color`, `$spacing-md` 等易于理解
- **主题切换**: 通过修改变量即可实现全局主题更换
- **Element Plus 对接**: 与 Element Plus 设计语言保持一致

### 4.2 混合宏系统
- **响应式**: `respond-to()`, `respond-above()` 断点混合宏
- **布局**: `flex-center()`, `flex-between()` Flexbox 工具
- **组件**: `card-style()`, `text-truncate()` 可复用模式
- **浏览器兼容**: `custom-scrollbar()` 统一滚动条样式

### 4.3 Element Plus 主题对接
```scss
// 在 main.js 或 vite.config.js 中配置
// Element Plus 使用 SCSS 变量时可直接引用我们的变量系统

// 示例：覆盖 Element Plus 主色
:root {
  --el-color-primary: #{$primary-color};
  --el-color-success: #{$success-color};
  --el-color-warning: #{$warning-color};
  --el-color-danger: #{$danger-color};
}
```

---

## 五、迁移计划与状态

### 5.1 迁移阶段

| 阶段 | 任务 | 状态 | 完成时间 |
|------|------|------|----------|
| **阶段一** | 创建 7-1 目录结构 | ✅ 完成 | 2026-03-XX |
| **阶段二** | 实现 abstracts 层（变量/混合宏/函数） | ✅ 完成 | 2026-03-XX |
| **阶段三** | 实现 base 层（CSS Reset） | ✅ 完成 | 2026-03-XX |
| **阶段四** | 实现 components 层（通用组件） | ✅ 完成 | 2026-04-XX |
| **阶段五** | 实现 layouts 层（布局系统） | ✅ 完成 | 2026-04-XX |
| **阶段六** | 实现 pages 层（页面样式） | ✅ 完成 | 2026-04-XX |
| **阶段七** | 实现 themes 层（主题系统） | ✅ 完成 | 2026-04-XX |
| **阶段八** | 配置 main.scss 入口 | ✅ 完成 | 2026-04-XX |
| **阶段九** | Vite 构建集成测试 | ✅ 完成 | 2026-04-XX |
| **阶段十** | 旧 CSS 文件迁移清理 | 🔄 进行中 | 待定 |

### 5.2 当前状态总结
- ✅ **SCSS 基础设施已完成**: 7-1 目录结构完整建立
- ✅ **main.scss 已接入**: 作为全局样式入口
- ✅ **变量系统可用**: 所有组件可引用统一变量
- ✅ **混合宏已定义**: 响应式、布局等工具可用
- 🔄 **旧文件清理中**: 部分 CSS 文件待确认是否完全迁移

---

## 六、验收标准清单

### 6.1 结构完整性
- [ ] 7 个核心文件夹全部创建且符合 7-1 规范
- [ ] 每个 folder 都有对应的 `_index.scss` 入口文件
- [ ] `main.scss` 正确引入所有模块
- [ ] 文件命名遵循下划线前缀约定（_xxx.scss）

### 6.2 编译正确性
- [ ] Vite 开发服务器正常启动无报错
- [ ] SCSS 编译输出 CSS 符合预期
- [ ] 生产构建成功且产物体积合理
- [ ] Source Map 正确生成

### 6.3 功能完整性
- [ ] 所有变量可在任意 SCSS 文件中使用
- [ ] 所有混合宏调用正常工作
- [ ] 响应式断点在不同屏幕尺寸生效
- [ ] 主题变量覆盖机制有效

### 6.4 代码质量
- [ ] 无未使用的变量/混合宏警告
- [ ] 代码注释清晰完整
- [ ] 命名语义化、一致性良好
- [ ] 符合项目编码规范

### 6.5 兼容性
- [ ] Chrome/Firefox/Safari/Edge 最新版正常
- [ ] IE11+ 兼容（如需支持）
- [ ] 移动端 Safari/iOS Chrome 正常
- [ ] Element Plus 组件样式无冲突

### 6.6 性能指标
- [ ] 首次编译时间 < 3 秒
- [ ] 增量编译时间 < 500ms
- [ ] 编译产物大小合理（< 100KB gzipped）
- [ ] 无性能回归问题

---

## 七、后续优化方向

### 7.1 短期优化（1-2 周）
- [ ] 完成剩余旧 CSS 文件迁移
- [ ] 补充单元测试覆盖关键混合宏
- [ ] 优化构建缓存策略
- [ ] 添加 Stylelint 规则配置

### 7.2 中期优化（1 个月）
- [ ] 实现暗黑模式主题
- [ ] 支持 RTL（从右到左）布局
- [ ] 添加更多组件样式（面包屑、标签页等）
- [ ] 性能优化（按需加载、Tree Shaking）

### 7.3 长期规划（3 个月+）
- [ ] Design System 文档站点
- [ ] 组件 Storybook 集成
- [ ] Figma tokens 同步工具
- [ ] 多品牌主题支持

---

## 八、相关资源

- [SCSS 官方文档](https://sass-lang.com/documentation)
- [7-1 Pattern 介绍](https://sass-guidelin.es/#the-7-1-pattern)
- [Element Plus 定制主题](https://element-plus.org/en-US/guide/theming)
- [Vite CSS 预处理器配置](https://vitejs.dev/guide/features.html#css-pre-processors)

---

**文档维护人**: 前端架构师 | 最后更新: 2026-04-05
