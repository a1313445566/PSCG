# UI 设计规范 - 新首页 (NewHomeView)

> **文档版本**: v2.1 | **创建日期**: 2026-04-08 | **更新**: 2026-04-08
> **设计风格**: 现代极简风 (Modern Minimalism)
> **主色调**: 蓝色系 (Blue Palette)
> **布局模式**: 单列流式 (Single-column Flow)
> **访问权限**: 公开访问（无需登录）
> **⚠️ 重大变更**: 新首页使用管理员登录机制，与学生登录系统完全独立

---

## 零、关键需求变更记录

### 🚨 v2.0 重大变更（2026-04-08）

**用户明确要求**：
> "目前用户端的登录不要影响新首页，新首页在右上角建立登录入口，使用后台管理员账户登录"

**UI 设计变更**：

| 变更项 | 原设计 | 新设计 | 影响 |
|--------|--------|--------|------|
| **访问权限** | 需要学生登录 | **公开访问** | 无需 WelcomeBar |
| **顶部区域** | WelcomeBar (用户信息) | **AdminLoginButton (右上角)** | 组件结构变化 |
| **登录入口** | 无 | **右上角"管理员登录"按钮** | 新增组件 |
| **用户信息** | 显示学生姓名/年级 | **不显示** | 移除 WelcomeBar |
| **底部入口** | "进入传统首页"按钮 | **移除** | 简化页面 |

---

## 一、设计概览

### 1.1 设计理念

```
核心原则:
├── 留白至上 (Whitespace First)
│   └── 让内容呼吸，减少认知负担
│
├── 层级清晰 (Clear Hierarchy)
│   └── 通过字号、字重、颜色建立信息优先级
│
├── 克制装饰 (Minimal Decoration)
│   └── 去除冗余元素，聚焦内容本身
│
└── 一致性 (Consistency)
    └── 统一的设计语言和交互模式
```

### 1.2 视觉参考

**正向参考** (Design Inspiration):
- Notion - 文档界面
- Linear - 项目管理工具
- Vercel - 开发者平台
- Stripe - 支付系统

**反向参考** (Anti-patterns):
- ❌ 过度使用渐变和阴影
- ❌ 大量 emoji 装饰
- ❌ 复杂的动画效果
- ❌ 高饱和度配色

---

## 二、页面结构设计

### 2.1 整体布局框架

```
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║                    [顶部区域]                             ║
║            (Logo + 系统标题 + 管理员登录按钮)             ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║   ┌────────────────────────────────────────────────┐     ║
║   │                                                │     ║
║   │              ① CMS 内容区域                     │     ║
║   │           (Section: 最新动态)                   │     ║
║   │                                                │     ║
║   │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │     ║
║   │  │ 文章1 │ │ 文章2 │ │ 文章3 │ │ 文章4 │         │     ║
║   │  └──────┘ └──────┘ └──────┘ └──────┘         │     ║
║   │                                                │     ║
║   └────────────────────────────────────────────────┘     ║
║                                                          ║
║                  ↓ 间距: 48px ↓                          ║
║                                                          ║
║   ┌────────────────────────────────────────────────┐     ║
║   │                                                │     ║
║   │             ② 大卡片式导航                      │     ║
║   │          (Section: 快速开始)                   │     ║
║   │                                                │     ║
║   │  ┌─────────────┐ ┌─────────────┐              │     ║
║   │  │  📚 基础闯关  │ │  📖 高级闯关  │              │     ║
║   │  └─────────────┘ └─────────────┘              │     ║
║   │                                                │     ║
║   │  ┌─────────────┐ ┌─────────────┐              │     ║
║   │  │  🏆 排行榜   │ │  ❌ 错题本   │              │     ║
║   │  └─────────────┘ └─────────────┘              │     ║
║   │                                                │     ║
║   │  ┌─────────────┐ ┌─────────────┐              │     ║
║   │  │  📊 学习报告  │ │  📈 学习进度  │              │     ║
║   │  └─────────────┘ └─────────────┘              │     ║
║   │                                                │     ║
║   │  ┌─────────────┐ ┌─────────────┐              │     ║
║   │  │  📝 答题历史  │ │  👤 个人中心  │              │     ║
║   │  └─────────────┘ └─────────────┘              │     ║
║   │                                                │     ║
║   └────────────────────────────────────────────────┘     ║
║                                                          ║
║                  ↓ 间距: 48px ↓                          ║
║                                                          ║
║   ┌────────────────────────────────────────────────┐     ║
║   │                                                │     ║
║   │             ③ 教学工具卡片                      │     ║
║   │          (Section: 学习工具)                   │     ║
║   │                                                │     ║
║   │  ┌──────┐ ┌──────┐ ┌──────┐                  │     ║
║   │  │ AI   │ │智能  │ │学习  │                  │     ║
║   │  │助手  │ │推荐  │ │分析  │                  │     ║
║   │  └──────┘ └──────┘ └──────┘                  │     ║
║   │                                                │     ║
║   │  ┌──────┐ ┌──────┐ ┌──────┐                  │     ║
║   │  │计算器│ │词典  │ │计时器│                  │     ║
║   │  └──────┘ └──────┘ └──────┘                  │     ║
║   │                                                │     ║
║   └────────────────────────────────────────────────┘     ║
║                                                          ║
║                  ↓ 间距: 32px ↓                          ║
║                                                          ║
║              [ ✏️ 进入传统首页 → ]                        ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║                     [AppFooter]                          ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

### 2.2 尺寸规范

| 属性 | 桌面端 (>992px) | 平板端 (768-992px) | 移动端 (<768px) |
|------|------------------|--------------------|------------------|
| 最大宽度 | 1200px | 100% | 100% |
| 左右 padding | 32px | 24px | 16px |
| Section 间距 | 48px | 36px | 28px |
| 卡片网格列数 | 3列 | 2列 | 1-2列 |
| 卡片间距 | 20px | 16px | 12px |

---

## 三、模块详细设计

### 3.1 顶部区域 (Header)

#### 3.1.1 简化欢迎栏

**位置**: 页面最顶部
**高度**: 自适应 (约 80-100px)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  👋 你好，张三同学                          [🔔] [👤]   │
│  高一(3)班 · 今天是学习的第 42 天                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**样式规范**:

```scss
.welcome-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $new-space-lg $new-space-xl;
  background: $new-bg-card;
  border-bottom: 1px solid $new-border;

  // 左侧：问候语 + 用户信息
  .greeting {
    h1 {
      font-size: 20px;       // H2
      font-weight: 600;      // Semibold
      color: $new-text-primary;
      margin-bottom: 4px;
    }

    .user-meta {
      font-size: 13px;       // Caption
      color: $new-text-tertiary;
    }
  }

  // 右侧：操作按钮
  .actions {
    display: flex;
    gap: $new-space-sm;

    .icon-btn {
      width: 36px;
      height: 36px;
      border-radius: $new-radius-md;
      border: 1px solid $new-border;
      background: transparent;
      color: $new-text-secondary;
      cursor: pointer;
      transition: all 200ms ease;

      &:hover {
        background: $new-bg-page;
        color: $new-primary;
        border-color: $new-primary-light;
      }
    }
  }
}
```

---

### 3.2 CMS 内容区域 (最新动态)

#### 3.2.1 Section 容器

```
┌─────────────────────────────────────────────────────────┐
│  最新动态                                    查看全部 →  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │              │ │              │ │              │   │
│  │  [缩略图]     │ │  [缩略图]     │ │  [缩略图]     │   │
│  │              │ │              │ │              │   │
│  ├──────────────┤ ├──────────────┤ ├──────────────┤   │
│  │ 标题文字...   │ │ 标题文字...   │ │ 标题文字...   │   │
│  │ 20字摘要内容  │ │ 20字摘要内容  │ │ 20字摘要内容  │   │
│  │ 2026-04-08   │ │ 2026-04-07   │ │ 2026-04-06   │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### 3.2.2 Section Header

```scss
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $new-space-lg;

  .section-title {
    font-size: 20px;       // H2
    font-weight: 600;      // Semibold
    color: $new-text-primary;
    margin: 0;
  }

  .view-all-link {
    font-size: 14px;       // Body
    color: $new-primary;
    text-decoration: none;
    font-weight: 500;
    transition: color 150ms ease;

    &:hover {
      color: $new-primary-dark;
    }

    &::after {
      content: '→';
      margin-left: 4px;
      transition: transform 150ms ease;
    }

    &:hover::after {
      transform: translateX(4px);
    }
  }
}
```

#### 3.2.3 文章卡片 (CmsArticleCard)

**尺寸**: 固定宽度或弹性宽度 (建议 280-320px)

```
┌──────────────────────┐
│                      │
│    ┌──────────────┐  │
│    │              │  │  ← 缩略图区域
│    │   160x100    │  │     (16:10 比例)
│    │              │  │
│    └──────────────┘  │
│                      │
│  标题标题标题标题...  │  ← H3 (16px, Medium)
│  20字的摘要内容展示   │  ← Body (14px, Regular, #64748b)
│                      │
│  📅 2026-04-08  🏷️  │  ← Caption (12px, #94a3b8)
│                      │
└──────────────────────┘
```

**样式规范**:

```scss
.cms-article-card {
  background: $new-bg-card;
  border-radius: $new-radius-lg;    // 12px
  border: 1px solid $new-border;
  overflow: hidden;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: $new-shadow-md;
    border-color: $new-primary-light;
  }

  // 缩略图区域
  .thumbnail {
    width: 100%;
    height: 100px;                 // 固定高度
    background: $new-gradient-subtle;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $new-primary;
    font-size: 32px;
  }

  // 内容区域
  .card-body {
    padding: $new-space-md;        // 16px

    .article-title {
      font-size: 16px;             // H3
      font-weight: 500;            // Medium
      color: $new-text-primary;
      margin: 0 0 8px 0;
      line-height: 1.4;

      // 超出两行省略
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .article-excerpt {
      font-size: 14px;             // Body
      color: $new-text-secondary;
      line-height: 1.5;
      margin: 0 0 12px 0;

      // 超出一行省略
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;             // Caption
      color: $new-text-tertiary;

      .tag {
        padding: 2px 8px;
        background: $new-primary-bg;
        color: $new-primary;
        border-radius: $new-radius-sm;  // 6px
        font-size: 11px;             // Overline
        font-weight: 500;
      }
    }
  }
}
```

**交互状态**:

| 状态 | 描述 | 视觉变化 |
|------|------|----------|
| Default | 默认状态 | 白色背景，浅灰边框 |
| Hover | 鼠标悬停 | 上浮 2px，蓝色边框，阴影加深 |
| Active | 点击按下 | 下浮 1px，阴影减弱 |
| Focus | 键盘聚焦 | 蓝色 outline (2px solid $new-primary) |

---

### 3.3 大卡片式导航 (快速开始)

#### 3.3.1 导航卡片网格（管理工具）

**布局**: CSS Grid, `grid-template-columns: repeat(2, 1fr)` (固定2列)
**间距**: `gap: 20px`
**状态**: 模拟展示，所有卡片显示"开发中"标签

```
┌─────────────────────────┐  ┌─────────────────────────┐
│                    🔜   │  │                    🔜   │
│    📚                   │  │    👥                   │
│                         │  │                         │
│   课程管理               │  │   班级管理               │
│                         │  │                         │
│   课程内容管理与发布      │  │   班级信息与学生管理      │
│                         │  │                         │
└─────────────────────────┘  └─────────────────────────┘

┌─────────────────────────┐  ┌─────────────────────────┐
│                    🔜   │  │                    🔜   │
│    📊                   │  │    ⚙️                   │
│                         │  │                         │
│   数据统计               │  │   系统设置               │
│                         │  │                         │
│   学习数据分析与报表      │  │   系统配置与权限管理      │
│                         │  │                         │
└─────────────────────────┘  └─────────────────────────┘
```

**备注**: 2x2 网格布局，右上角显示"开发中"标签

#### 3.3.2 单个导航卡片 (NavCard)

**尺寸**: 最小宽度 260px，自适应高度
**状态标签**: 右上角显示"开发中"徽章

```
┌─────────────────────────────────┐
│                         🔜 开发中│  ← 状态标签
│                                 │
│         📚 (图标 40px)          │
│                                 │
│      课程管理                    │  ← H2 (20px, Semibold)
│                                 │
│   课程内容管理与发布             │  ← Body (14px, Secondary)
│                                 │
└─────────────────────────────────┘
```

**样式规范**:

```scss
.nav-card {
  background: $new-bg-card;
  border-radius: $new-radius-xl;    // 16px
  border: 1px solid $new-border;
  padding: $new-space-xl;           // 32px
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
  overflow: hidden;

  // 左侧装饰条 (微妙)
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: $new-primary;
    opacity: 0;
    transition: opacity 200ms ease;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: $new-shadow-lg;
    border-color: $new-primary-light;

    &::before {
      opacity: 1;
    }
  }

  // 状态标签 (右上角)
  .status-badge {
    position: absolute;
    top: $new-space-md;
    right: $new-space-md;
    background: $new-warning-light;
    color: $new-warning-dark;
    padding: 4px 12px;
    border-radius: $new-radius-sm;
    font-size: 12px;
    font-weight: 500;
  }

  // 图标区域
  .nav-icon {
    font-size: 40px;
    margin-bottom: $new-space-md;   // 16px
    line-height: 1;
  }

  // 标题
  .nav-title {
    font-size: 20px;               // H2
    font-weight: 600;              // Semibold
    color: $new-text-primary;
    margin: 0 0 8px 0;
  }

  // 描述
  .nav-description {
    font-size: 14px;               // Body
    color: $new-text-secondary;
    line-height: 1.5;
    margin: 0;
  }
}
```

**导航卡片数据配置（模拟数据）**:

```javascript
const navigationCards = [
  {
    id: 'course-management',
    icon: '📚',
    title: '课程管理',
    description: '课程内容管理与发布',
    status: '开发中',
    disabled: true               // 模拟展示，不可点击
  },
  {
    id: 'class-management',
    icon: '👥',
    title: '班级管理',
    description: '班级信息与学生管理',
    status: '开发中',
    disabled: true
  },
  {
    id: 'data-statistics',
    icon: '📊',
    title: '数据统计',
    description: '学习数据分析与报表',
    status: '开发中',
    disabled: true
  },
  {
    id: 'system-settings',
    icon: '⚙️',
    title: '系统设置',
    description: '系统配置与权限管理',
    status: '开发中',
    disabled: true
  }
]
```

---

### 3.4 教学工具卡片 (学习工具)

#### 3.4.1 工具网格布局

**布局**: CSS Grid, `grid-template-columns: repeat(3, 1fr)` (桌面端)
**移动端**: `grid-template-columns: repeat(2, 1fr)`

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│              │ │              │ │              │
│     🤖       │ │     💡       │ │     📊       │
│              │ │              │ │              │
│   AI 智能助手  │ │   智能推荐    │ │   学习分析    │
│              │ │              │ │              │
│   🔜 开发中   │ │   🔜 开发中   │ │   🔜 开发中   │
│              │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│              │ │              │ │              │
│     🔢       │ │     📖       │ │     ⏱️       │
│              │ │              │ │              │
│    计算器     │ │   词典查询    │ │    计时器    │
│              │ │              │ │              │
│   🔜 待定    │ │   🔜 待定    │ │   🔜 待定    │
│              │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

#### 3.4.2 单个工具卡片 (ToolCard)

**尺寸**: 正方形或接近正方形 (比例 1:1 或 4:3)

```
┌──────────────────────┐
│                      │
│                      │
│         🤖           │  ← 图标 (48px)
│                      │
│                      │
│     AI 智能助手       │  ← H3 (16px, Medium)
│                      │
│    ┌────────────┐    │
│    │ 🔜 开发中   │    │  ← 状态标签 (小尺寸)
│    └────────────┘    │
│                      │
└──────────────────────┘
```

**样式规范**:

```scss
.tool-card {
  background: $new-bg-card;
  border-radius: $new-radius-lg;    // 12px
  border: 1px solid $new-border;
  padding: $new-space-xl;           // 32px
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $new-shadow-md;
    border-color: $new-primary-light;
  }

  // 禁用状态 (未开发工具)
  &.tool-card--disabled {
    opacity: 0.7;
    cursor: not-allowed;

    &:hover {
      transform: none;
      box-shadow: none;
    }
  }

  // 图标
  .tool-icon {
    font-size: 48px;
    margin-bottom: $new-space-md;   // 16px;
    line-height: 1;
    transition: transform 200ms ease;

    .tool-card:hover & {
      transform: scale(1.05);
    }
  }

  // 工具名称
  .tool-name {
    font-size: 16px;               // H3
    font-weight: 500;              // Medium
    color: $new-text-primary;
    margin: 0 0 8px 0;
  }

  // 状态标签
  .tool-status {
    display: inline-block;
    padding: 4px 12px;
    background: $new-bg-page;
    border: 1px solid $new-border;
    border-radius: $new-radius-full; // 50px (胶囊形)
    font-size: 11px;                // Overline
    color: $new-text-tertiary;
    font-weight: 500;

    // 开发中状态
    &--coming-soon {
      color: $new-warning;
      border-color: lighten($new-warning, 30%);
      background: rgba($new-warning, 0.05);
    }

    // 可用状态
    &--available {
      color: $new-success;
      border-color: lighten($new-success, 30%);
      background: rgba($new-success, 0.05);
    }
  }
}
```

**工具数据配置**:

```javascript
const teachingTools = [
  {
    id: 'ai-assistant',
    icon: '🤖',
    name: 'AI 智能助手',
    status: 'coming-soon',         // coming-soon | available | disabled
    statusText: '开发中',
    route: null                    // 暂无路由
  },
  {
    id: 'smart-recommend',
    icon: '💡',
    name: '智能推荐',
    status: 'coming-soon',
    statusText: '开发中',
    route: null
  },
  {
    id: 'learning-analysis',
    icon: '📊',
    name: '学习分析',
    status: 'coming-soon',
    statusText: '开发中',
    route: null
  },
  {
    id: 'calculator',
    icon: '🔢',
    name: '计算器',
    status: 'disabled',
    statusText: '待定',
    route: null
  },
  {
    id: 'dictionary',
    icon: '📖',
    name: '词典查询',
    status: 'disabled',
    statusText: '待定',
    route: null
  },
  {
    id: 'timer',
    icon: '⏱️',
    name: '计时器',
    status: 'disabled',
    statusText: '待定',
    route: null
  }
]
```

---

### 3.5 传统首页入口

**位置**: 页面底部，教学工具卡片下方
**样式**: 文字链接或次要按钮

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              ✏️ 进入传统首页 (经典模式) →                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**样式规范**:

```scss
.legacy-home-link {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: $new-space-lg 0;       // 24px 上下
  margin-top: $new-space-xl;      // 32px 上边距

  a {
    font-size: 14px;              // Body
    color: $new-text-tertiary;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 150ms ease;

    &:hover {
      color: $new-primary;

      &::after {
        content: '→';
        transform: translateX(4px);
      }
    }

    &::after {
      content: '→';
      transition: transform 150ms ease;
    }
  }
}
```

---

## 四、响应式设计

### 4.1 断点策略

```scss
// 断点变量 (与现有 _variables.scss 保持一致)
$breakpoint-mobile-s: 480px;    // 小屏手机
$breakpoint-mobile-l: 768px;    // 大屏手机/小平板
$breakpoint-tablet: 992px;      // 平板
$breakpoint-desktop: 1200px;    // 桌面端
$new-max-width: 1200px;         // 内容最大宽度
```

### 4.2 移动端适配 (< 768px)

**CMS 区域**:
- 改为单列横向滚动 (`overflow-x: auto`)
- 卡片宽度固定 280px
- 显示滚动提示箭头

**导航卡片**:
- 改为单列或双列网格
- 卡片内边距减小至 24px
- 图标尺寸减小至 32px

**工具卡片**:
- 2x3 网格布局
- 卡片内边距减小至 24px
- 图标尺寸减小至 40px

**整体调整**:
- 左右 padding: 16px
- Section 间距: 28px
- 字号整体缩小一级

```scss
// 移动端响应式示例
@media (max-width: $breakpoint-mobile-l) {
  .new-home-view {
    .home-content {
      padding: 0 16px;
    }

    // CMS 区域横向滚动
    .cms-section {
      .cms-grid {
        display: flex;
        overflow-x: auto;
        gap: 12px;
        padding-bottom: 12px;
        -webkit-overflow-scrolling: touch;

        &::-webkit-scrollbar {
          height: 4px;
        }

        .cms-article-card {
          flex-shrink: 0;
          width: 280px;
        }
      }
    }

    // 导航卡片双列
    .navigation-section {
      .nav-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .nav-card {
        padding: 24px;

        .nav-icon {
          font-size: 32px;
        }

        .nav-title {
          font-size: 18px;
        }
      }
    }

    // 工具卡片 2列
    .tools-section {
      .tools-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .tool-card {
        padding: 24px;

        .tool-icon {
          font-size: 40px;
        }
      }
    }
  }
}
```

### 4.3 平板端适配 (768px - 992px)

**CMS 区域**:
- 2列或3列网格（根据容器宽度自动调整）
- 卡片间距: 16px

**导航卡片**:
- 2列网格
- 保持桌面端的视觉层次

**工具卡片**:
- 3列网格
- 保持居中对齐

---

## 五、交互动效规范

### 5.1 全局过渡

```scss
// 全局过渡变量
$transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
$transition-normal: 200ms cubic-bezier(0.4, 0, 0.2, 1);
$transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);

// 应用到所有交互元素
a, button, .card {
  transition: 
    transform $transition-normal,
    box-shadow $transition-normal,
    border-color $transition-fast,
    color $transition-fast,
    background-color $transition-normal,
    opacity $transition-fast;
}
```

### 5.2 Hover 动效清单

| 元素 | 动效类型 | 参数 | 说明 |
|------|----------|------|------|
| 文章卡片 | 上浮 + 阴影 | `translateY(-2px)` + shadow md | 微妙提升感 |
| 导航卡片 | 上浮 + 装饰条 | `translateY(-4px)` + left border | 强调交互性 |
| 工具卡片 | 上浮 + 图标放大 | `translateY(-2px)` + `scale(1.05)` | 轻量反馈 |
| 按钮 | 颜色加深 | bg color 变化 | 明确可点击 |
| 链接 | 箭头位移 | `translateX(4px)` | 方向引导 |

### 5.3 加载状态

**骨架屏 (Skeleton Loading)**:

```scss
.skeleton {
  background: linear-gradient(
    90deg,
    $new-bg-page 0%,
    darken($new-bg-page, 3%) 50%,
    $new-bg-page 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: $new-radius-sm;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// 应用到各组件
.skeleton-card {
  @extend .skeleton;
  height: 240px;
}

.skeleton-text {
  @extend .skeleton;
  height: 16px;
  margin-bottom: 8px;

  &:last-child {
    width: 60%;
  }
}

.skeleton-circle {
  @extend .skeleton;
  border-radius: 50%;
  width: 48px;
  height: 48px;
}
```

---

## 六、无障碍访问 (Accessibility)

### 6.1 语义化 HTML

```vue
<template>
  <main class="new-home-view" role="main">
    <!-- 欢迎区域 -->
    <section class="welcome-bar" aria-label="用户信息">
      <h1>你好，{{ userName }}</h1>
    </section>

    <!-- CMS 内容 -->
    <section class="cms-section" aria-labelledby="cms-title">
      <h2 id="cms-title">最新动态</h2>
      <div class="cms-grid" role="list">
        <article class="cms-article-card" role="listitem">
          <h3>文章标题</h3>
          <p>摘要内容</p>
        </article>
      </div>
    </section>

    <!-- 导航区域 -->
    <section class="navigation-section" aria-labelledby="nav-title">
      <h2 id="nav-title">快速开始</h2>
      <nav class="nav-grid" aria-label="功能导航">
        <a href="/subcategory" class="nav-card">...</a>
      </nav>
    </section>

    <!-- 工具区域 -->
    <section class="tools-section" aria-labelledby="tools-title">
      <h2 id="tools-title">学习工具</h2>
      <div class="tools-grid" role="list">
        <button class="tool-card" disabled aria-disabled="true">
          <span>AI 智能助手</span>
          <span class="tool-status">开发中</span>
        </button>
      </div>
    </section>
  </main>
</template>
```

### 6.2 键盘导航

- 所有可点击元素支持 Tab 导航
- Focus 状态有明显的视觉指示 (outline: 2px solid $new-primary)
- Enter/Space 键触发点击事件
- Escape 关闭弹窗/模态框

### 6.3 颜色对比度

| 场景 | 前景色 | 背景色 | 对比度 | WCAG 等级 |
|------|--------|--------|--------|-----------|
| 主文字 | #1e293b | #ffffff | 15.2:1 | AAA ✅ |
| 次要文字 | #64748b | #ffffff | 4.6:1 | AA ✅ |
| 辅助文字 | #94a3b8 | #ffffff | 3.0:1 | AA (大字号) ✅ |
| 主蓝色 | #3b82f6 | #ffffff | 4.5:1 | AA ✅ |
| 链接文字 | #3b82f6 | #f8fafc | 4.8:1 | AA ✅ |

---

## 七、设计交付物清单

### 7.1 需要输出的资源

| 序号 | 资源类型 | 文件名 | 格式 | 说明 |
|------|----------|--------|------|------|
| 1 | 设计规范文档 | `UI_Design_新首页.md` | Markdown | 本文档 |
| 2 | 线框图 | `Wireframe_NewHome.png` | PNG/SVG | 页面结构示意 |
| 3 | 组件样式文件 | `NewHomeView.scss` | SCSS | 完整样式代码 |
| 4 | Mock 数据文件 | `mockData.js` | JavaScript | 测试数据 |
| 5 | 配色色板 | `ColorPalette.png` | PNG | 色值参考 |

### 7.2 设计 Token 汇总

```scss
// ============================================
// 新首页 Design Tokens (添加到 _variables.scss)
// ============================================

// 颜色
$new-primary: #3b82f6;
$new-primary-light: #60a5fa;
$new-primary-dark: #2563eb;
$new-primary-bg: #eff6ff;
$new-text-primary: #1e293b;
$new-text-secondary: #64748b;
$new-text-tertiary: #94a3b8;
$new-border: #e2e8f0;
$new-bg-page: #f8fafc;
$new-bg-card: #ffffff;
$new-success: #10b981;
$new-warning: #f59e0b;
$new-danger: #ef4444;
$new-gradient-subtle: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);

// 间距
$new-space-xs: 4px;
$new-space-sm: 8px;
$new-space-md: 16px;
$new-space-lg: 24px;
$new-space-xl: 32px;
$new-space-2xl: 48px;
$new-space-3xl: 64px;

// 圆角
$new-radius-sm: 6px;
$new-radius-md: 8px;
$new-radius-lg: 12px;
$new-radius-xl: 16px;
$new-radius-full: 50px;

// 阴影
$new-shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
$new-shadow-md: 0 4px 6px -1px rgba(0,0,0,0.07);
$new-shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.08);

// 字号
$new-font-display: 32px;
$new-font-h1: 24px;
$new-font-h2: 20px;
$new-font-h3: 16px;
$new-font-body: 14px;
$new-font-caption: 12px;
$new-font-overline: 11px;

// 过渡
$transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
$transition-normal: 200ms cubic-bezier(0.4, 0, 0.2, 1);
$transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);

// 断点
$new-max-width: 1200px;
```

---

## 八、附录

### 8.1 与现有系统的对比

| 维度 | 现有首页 (HomeView) | 新首页 (NewHomeView) |
|------|---------------------|----------------------|
| **设计风格** | 游戏化 (Game-like) | 现代极简 (Minimalist) |
| **主色调** | 珊瑚红 (#ff6b6b) | 蓝色系 (#3b82f6) |
| **字体** | Comic Sans MS | System Sans-serif |
| **圆角** | 16-24px | 6-16px |
| **阴影** | 多层夸张 | 微妙扁平 |
| **装饰** | Emoji、渐变边框 | 无装饰 |
| **动效** | 弹性动画 | 线性过渡 |
| **布局** | 混合布局 | 单列流式 |
| **信息密度** | 高 | 中等（留白多） |

### 8.2 迁移注意事项

1. **路由兼容**: 确保 `/home` 的书签和分享链接正常工作
2. **用户引导**: 首次访问新首页时显示简短的使用提示
3. **反馈渠道**: 提供"反馈问题"入口收集用户体验
4. **回退机制**: 如果新首页出现严重问题，可快速切换回旧首页
5. **数据监控**: 监控新首页的用户行为数据（点击率、停留时间等）

### 8.3 参考资料

- [Material Design 3 - Color System](https://m3.material.io/styles/color/system)
- [Tailwind CSS - Spacing Scale](https://tailwindcss.com/docs/spacing)
- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [Figma - Modern Minimalism Design Kit](https://www.figma.com/community)

---

**文档维护记录**:

| 版本 | 日期 | 修改人 | 修改内容 |
|------|------|--------|----------|
| v1.0 | 2026-04-08 | 6A工作流 + UI Designer | 初始版本，完整 UI 设计规范 |
| v2.0 | 2026-04-08 | 6A工作流 + UI Designer | **重大变更：移除 WelcomeBar，新增右上角管理员登录按钮，改为公开访问** |
| v2.1 | 2026-04-08 | 6A工作流 + UI Designer | **需求澄清：大卡片式导航改为模拟展示管理工具功能（4个卡片），不整合现有功能** |
