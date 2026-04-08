# DESIGN 文档 - 新首页 (NewHomeView) 架构设计

> **文档版本**: v1.3 | **创建日期**: 2026-04-08 | **更新**: 2026-04-08
> **任务名称**: 独立新首页系统架构设计与模块拆分
> **文档状态**: ✅ 设计完成 | 🔄 需求变更已更新
> **基于**: CONSENSUS_新首页.md + UI_Design_新首页.md
> **⚠️ 重要声明**: **新首页是完全独立于现有项目功能外的独立门户页面**
> **⚠️ 重大变更**: **新首页使用管理员登录机制，与学生登录系统完全独立**

---

## 零、核心定位：独立门户页面

### ⭐ 关键决策：完全独立架构

**用户明确要求**：
> "现在的首页是完全独立于现有项目功能外的一个首页"

**v2.0 补充要求**：
> "目前用户端的登录不要影响新首页，新首页在右上角建立登录入口，使用后台管理员账户登录"

**这意味着**：
```
✅ 新首页是一个独立的"门户/入口大厅"(Portal Page)
✅ 不依赖现有的 questionStore、学科数据等业务逻辑
✅ 不影响现有 HomeView 的任何功能
✅ 现有 HomeView 保持不变，继续作为"功能首页"
✅ 新首页更偏向内容展示和导航聚合
✅ 数据来源完全独立（Mock 数据或未来独立 API）
✅ 公开访问（无需登录）
✅ 右上角提供管理员登录入口
```

**架构对比**：
```
【传统理解 - 已废弃】
/home (NewHomeView) ← 替代 HomeView
/home/legacy (HomeView) ← 降级为子页面

【正确理解 - 当前方案】
/new 或 /portal (NewHomeView) ← 独立门户页面（新增）
  ├── 公开访问（无需登录）
  └── 右上角: 管理员登录按钮 → /admin
/home (HomeView) ← 现有功能首页（保持不变）
  └── 需要学生登录
```

### 独立性原则

| 维度 | 说明 |
|------|------|
| **路由独立** | 使用全新路由路径（如 `/new`），不占用 `/home` |
| **数据独立** | 不依赖 `questionStore`，使用独立数据源 |
| **样式独立** | 使用全新的蓝色系设计 Token，不影响现有样式 |
| **逻辑独立** | 组件内部自包含，不导入业务模块 |
| **部署独立** | 可单独开发、测试、部署 |
| **认证独立** | 公开访问，不依赖学生登录，提供管理员登录入口 |

### 用户认证机制

| 维度 | 学生端 | 管理员端 | 新首页 |
|------|--------|----------|--------|
| **路由** | `/login` → `/home` | `/admin` (PasswordDialog) | `/new` |
| **访问权限** | 需登录 | 需登录 | **公开** ⭐ |
| **登录入口** | 专用登录页 | PasswordDialog | **右上角按钮** ⭐ |
| **存储方式** | `localStorage` | `sessionStorage` | 无需存储 |
| **Token字段** | `studentId` | `adminToken` | - |
| **登录后跳转** | `/home` | `/admin` | - |

---

## 一、整体架构概览

### 1.1 系统架构图（独立模式）

```
╔═══════════════════════════════════════════════════════════════════╗
║                     PSCG 智能学习系统 - 双首页架构                   ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  ┌─────────────────────────────────────────────────────────────┐ ║
║  │                      Vue Router (Hash)                     │ ║
║  │                                                             │ ║
║  │  /login         → LoginView        (登录页)               │ ║
║  │                                                             │ ║
║  │  /new ⭐         → NewHomeView      (独立门户首页) ★新增   │ ║
║  │  /home          → HomeView         (现有功能首页) ★不变    │ ║
║  │                                                             │ ║
║  │  /subcategory/* → SubcategoryView  (学科选择)              │ ║
║  │  /quiz/*        → QuizView         (答题页面)              │ ║
║  │  /leaderboard   → LeaderboardView  (排行榜)                │ ║
║  │  ...            → ...             (其他功能页面)           │ ║
║  └─────────────────────────────────────────────────────────────┘ ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  ┌──────────────────────┐    ┌────────────────────────────────┐  ║
║  │                      │    │                                │  ║
║  │   🆕 NewHomeView     │    │   📦 HomeView (现有不变)       │  ║
║  │   (独立门户页面)      │    │   (功能首页)                  │  ║
║  │                      │    │                                │  ║
║  │  ┌────────────────┐  │    │  ┌────────────────────────┐  │  ║
║  │  │ WelcomeBar      │  │    │  │ AppHeader              │  │  ║
║  │  │ (欢迎栏)        │  │    │  │ welcome-section        │  │  ║
║  │  ├────────────────┤  │    │  │ subject-section         │  │  ║
║  │  │ CmsContentSection│  │    │  │ leaderboard-preview    │  │  ║
║  │  │ (CMS内容区域)   │  │    │  └────────────────────────┘  │  ║
║  │  ├────────────────┤  │    │                                │  ║
║  │  │ NavigationCards │  │    │  数据源: questionStore        │  ║
║  │  │ (导航卡片)      │  │    │  样式: 游戏化风格 (红色系)    │  ║
║  │  ├────────────────┤  │    │  路由: /home                  │  ║
║  │  │ TeachingTools   │  │    │                                │  ║
║  │  │ (教学工具)      │  │    └────────────────────────────────┘  ║
║  │  ├────────────────┤  │                                       ║
║  │  │ LegacyLink      │  │                                       ║
║  │  │ (→ 进入功能首页) │  │                                       ║
║  │  └────────────────┘  │                                       ║
║  │                      │                                       ║
║  │  数据源: Mock Data    │                                       ║
║  │  样式: 极简风(蓝色系) │                                       ║
║  │  路由: /new          │                                       ║
║  └──────────────────────┘                                       ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║                      完全隔离 · 互不影响                            ║
╚═══════════════════════════════════════════════════════════════════╝
```

### 1.2 分层架构说明

| 层级 | 职责 | 包含内容 | 技术选型 |
|------|------|----------|----------|
| **视图层 (View)** | UI 渲染、用户交互 | Vue 组件、模板、样式 | Vue 3 + Element Plus |
| **逻辑层 (Logic)** | 业务逻辑、数据处理 | Composables、事件处理 | Composition API |
| **数据层 (Data)** | 状态管理、数据缓存 | Pinia Store、Mock Data | Pinia + localStorage |
| **服务层 (Service)** | API 调用、工具函数 | api.js、utils | Axios 封装 |
| **基础层 (Base)** | 样式变量、全局配置 | _variables.scss、config | SCSS + CSS Variables |

---

## 二、组件架构设计

### 2.1 组件树结构

```
NewHomeView (主页面)
│
├── [Layout] 页面布局
│   ├── WelcomeBar (欢迎栏 - 用户信息)
│   └── AppFooter (页脚 - 复用现有)
│
├── [Section] CMS 内容区域
│   └── SectionHeader (区块标题 - "最新动态")
│   └── CmsArticleCard × N (文章卡片 - 可横向滚动)
│
├── [Section] 大卡片式导航
│   └── SectionHeader (区块标题 - "快速开始")
│   └── NavCard × N (功能导航卡片 - 8个)
│
├── [Section] 教学工具卡片
│   └── SectionHeader (区块标题 - "学习工具")
│   └── ToolCard × N (工具图标卡片 - 6个)
│
└── [Action] 传统首页入口
    └── LegacyLink (文字链接按钮)
```

### 2.2 组件清单与职责

#### 主组件

| 组件名 | 文件路径 | 类型 | 职责 | 复杂度 |
|--------|----------|------|------|--------|
| **NewHomeView** | `src/views/NewHomeView.vue` | Page | 页面主容器，组装子组件，管理生命周期 | 中 |

#### 子组件 (components/new-home/)

| 组件名 | 文件路径 | 类型 | 职责 | Props | 复杂度 |
|--------|----------|------|------|-------|--------|
| **WelcomeBar** | `components/new-home/WelcomeBar.vue` | Layout | 显示用户问候语、学习天数、操作按钮 | `userName, userGrade, userClass, days` | 低 |
| **CmsContentSection** | `components/new-home/CmsContentSection.vue` | Container | CMS 区域容器，管理文章列表渲染 | `articles: Array` | 中 |
| **CmsArticleCard** | `components/new-home/CmsArticleCard.vue` | Presentational | 单篇文章卡片展示 | `article: { title, excerpt, date, tag, thumbnail }` | 低 |
| **NavigationCards** | `components/new-home/NavigationCards.vue` | Container | 导航卡片网格容器 | `cards: Array` | 低 |
| **NavCard** | `components/new-home/NavCard.vue` | Presentational | 单个功能导航卡片 | `{ icon, title, description, stats, route, featured }` | 低 |
| **TeachingTools** | `components/new-home/TeachingTools.vue` | Container | 工具卡片网格容器 | `tools: Array` | 低 |
| **ToolCard** | `components/new-home/ToolCard.vue` | Presentational | 单个工具图标卡片 | `{ icon, name, status, statusText, route }` | 低 |
| **LegacyLink** | `components/new-home/LegacyLink.vue` | Action | 传统首页入口链接 | 无 | 极低 |

#### 复用组件 (已有)

| 组件名 | 文件路径 | 用途 | 复用方式 |
|--------|----------|------|----------|
| AppFooter | `src/components/common/AppFooter.vue` | 页脚 | 直接引入 |
| SkeletonLoader | `src/components/common/SkeletonLoader.vue` | 骨架屏 | 按需引入 |

---

## 三、数据流架构

### 3.1 数据流向图

```
┌─────────────────────────────────────────────────────────────────┐
│                        数据流向 (Data Flow)                      │
└─────────────────────────────────────────────────────────────────┘

【初始化阶段】

  localStorage (用户信息)
        │
        ▼
  ┌─────────────┐
  │ NewHomeView │ ← onMounted()
  │  .setup()   │
  └──────┬──────┘
         │
         ├──────────────────────┐
         │                      │
         ▼                      ▼
  ┌─────────────┐      ┌─────────────────┐
  │ 读取用户信息  │      │ 加载 CMS Mock   │
  │ userName     │      │ Data            │
  │ userGrade    │      │ articles[]      │
  │ userClass    │      │                 │
  └──────┬──────┘      └────────┬────────┘
         │                      │
         ▼                      ▼
  ┌─────────────┐      ┌─────────────────┐
  │ WelcomeBar  │      │ CmsContentSection│
  │ (Props Down)│      │ (Props Down)     │
  └─────────────┘      └─────────────────┘


【静态配置数据】

  配置文件 (navigationConfig.js / toolsConfig.js)
        │
        ▼
  ┌─────────────────┐    ┌─────────────────┐
  │ NavigationCards │    │ TeachingTools    │
  │ (导入配置)       │    │ (导入配置)        │
  └────────┬────────┘    └────────┬────────┘
           │                      │
           ▼                      ▼
  ┌─────────────┐          ┌─────────────┐
  │ NavCard × N  │          │ ToolCard × N │
  │ (v-for 循环) │          │ (v-for 循环) │
  └─────────────┘          └─────────────┘


【用户交互阶段】

  用户点击 NavCard / ToolCard
        │
        ▼
  ┌─────────────┐
  │ router.push()│
  │ (Vue Router) │
  └──────┬──────┘
         │
         ▼
  目标页面 (/leaderboard, /error-book 等)
```

### 3.2 状态管理策略

**核心原则**: 新首页采用 **"轻量状态"** 策略，避免过度使用 Pinia Store。

| 数据类型 | 存储位置 | 管理方式 | 原因 |
|----------|----------|----------|------|
| 用户信息 (姓名/年级/班级) | `localStorage` | 组件内直接读取 | 已有数据，无需额外封装 |
| 学习天数 | `localStorage` 或计算得出 | Composable 函数 | 简单派生数据 |
| CMS 文章列表 | **组件内部 ref()** | 局部状态 | 仅首页使用，无需全局共享 |
| 导航卡片配置 | **静态 JS 对象** | import 导入 | 固定配置，不变化 |
| 工具卡片配置 | **静态 JS 对象** | import 导入 | 固定配置，不变化 |
| Loading 状态 | **useLoading()** | 复用现有 Composable | 项目统一规范 |

**不使用 Pinia Store 的原因**:
1. 新首页的数据不需要跨组件共享
2. 避免不必要的全局状态污染
3. 保持组件的独立性和可测试性
4. 符合"最小知识原则"

---

## 四、接口契约定义

### 4.1 组件接口规范

#### NewHomeView (主组件)

```typescript
// 输入 (无 Props - 页面级组件)
// 输出 (无 Emits - 不向父组件传递事件)

// 内部状态
interface NewHomeViewState {
  // 用户信息
  userName: string
  userGrade: string
  userClass: string
  studentId: string
  learningDays: number

  // CMS 数据
  cmsArticles: CmsArticle[]
  isCmsLoading: boolean

  // 导航配置
  navigationCards: NavCardConfig[]
  teachingTools: ToolCardConfig[]
}

// 生命周期钩子
onMounted(): void  // 初始化数据
onUnmounted(): void // 清理定时器等资源
```

#### WelcomeBar (欢迎栏)

```typescript
// Props (输入契约)
interface WelcomeBarProps {
  userName: string        // 用户姓名
  userGrade: string       // 年级 (如 "高一")
  userClass: string       // 班级 (如 "3班")
  learningDays?: number   // 学习天数 (可选)
}

// Emits (输出契约)
interface WelcomeBarEmits {
  (e: 'profile'): void           // 点击个人中心
  (e: 'logout'): void            // 点击退出登录
  (e: 'notification'): void      // 点击通知图标
}
```

#### CmsArticleCard (文章卡片)

```typescript
// Props (输入契约)
interface CmsArticle {
  id: string | number
  title: string              // 文章标题 (最多显示2行)
  excerpt: string            // 摘要 (20字以内)
  thumbnail?: string         // 缩略图 URL 或 emoji
  date: string               // 发布日期 (YYYY-MM-DD 格式)
  tag?: string               // 标签 (可选)
  link?: string              // 跳转链接 (可选)
}

interface CmsArticleCardProps {
  article: CmsArticle
}

// Emits (输出契约)
interface CmsArticleCardEmits {
  (e: 'click', article: CmsArticle): void  // 点击卡片
}
```

#### NavCard (导航卡片)

```typescript
// Props (输入契约)
interface NavCardConfig {
  id: string                // 唯一标识
  icon: string              // 图标 (emoji 或图标名称)
  title: string             // 卡片标题
  description: string       // 描述文字
  stats?: string            // 底部统计信息 (可选)
  route: string             // 路由路径
  featured?: boolean        // 是否为强调卡片 (可选)
  disabled?: boolean        // 是否禁用 (可选)
}

interface NavCardProps {
  card: NavCardConfig
}

// Emits (输出契约)
interface NavCardEmits {
  (e: 'navigate', route: string): void  // 点击导航
}
```

#### ToolCard (工具卡片)

```typescript
// Props (输入契约)
type ToolStatus = 'available' | 'coming-soon' | 'disabled'

interface ToolCardConfig {
  id: string                // 唯一标识
  icon: string              // 图标 (emoji)
  name: string              // 工具名称
  status: ToolStatus        // 状态
  statusText: string        // 状态文本 ("开发中"/"可用"/"待定")
  route?: string            // 路由路径 (可选)
}

interface ToolCardProps {
  tool: ToolCardConfig
}

// Emits (输出契约)
interface ToolCardEmits {
  (e: 'click', tool: ToolCardConfig): void  // 点击工具
}
```

### 4.2 配置文件接口

#### navigationConfig.js (导航卡片配置 - 模拟数据)

```javascript
/**
 * @file 新首页导航卡片配置（模拟数据）
 * @description 管理工具功能占位符配置
 * @status 模拟展示，等后台功能建立后替换
 */

export const navigationCards = [
  {
    id: 'course-management',
    icon: '📚',
    title: '课程管理',
    description: '课程内容管理与发布',
    status: '开发中',
    disabled: true              // 模拟展示，不可点击
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

export default navigationCards
```

#### toolsConfig.js (工具卡片配置)

```javascript
/**
 * @file 教学工具卡片配置
 * @description 定义所有教学工具的静态配置
 */

export const teachingTools = [
  {
    id: 'ai-assistant',
    icon: '🤖',
    name: 'AI 智能助手',
    status: 'coming-soon',
    statusText: '开发中',
    route: null
  },
  // ... 其他5个工具
]

export default teachingTools
```

#### mockCmsData.js (CMS Mock 数据)

```javascript
/**
 * @file CMS 内容区域 Mock 数据
 * @description 用于前端开发的模拟数据，后续替换为真实 API
 */

export const mockArticles = [
  {
    id: 1,
    title: '如何高效备考期末考试？',
    excerpt: '5个科学复习方法助你冲刺满分',
    thumbnail: '📚',
    date: '2026-04-08',
    tag: '学习方法'
  },
  {
    id: 2,
    title: '错题本使用指南：从错误中成长',
    excerpt: '建立个人错题库的完整步骤',
    thumbnail: '✍️',
    date: '2026-04-07',
    tag: '学习技巧'
  },
  {
    id: 3,
    title: '本周排行榜更新：看看谁登顶了！',
    excerpt: '恭喜张三同学连续三周蝉联榜首',
    thumbnail: '🏆',
    date: '2026-04-06',
    tag: '校园动态'
  },
  // ... 更多文章
]

export default mockArticles
```

---

## 五、路由与导航设计

### 5.1 路由配置变更（独立架构模式）

**修改文件**: `src/router/index.js`

```javascript
// ============================================
// 路由配置修改方案 - 独立门户页面
// ============================================

const routes = [
  // ... 其他路由保持不变 ...

  // 【保持不变】现有功能首页
  {
    path: '/home',
    name: 'Home',
    component: lazyLoad('HomeView')     // 保持原样，不修改！
  },

  // 【新增】独立门户页面 (全新路径)
  {
    path: '/new',                        // 使用 /new 作为独立路径
    name: 'NewHome',                     // 新增路由名称
    component: lazyLoad('NewHomeView'),  // 新组件
    meta: { title: 'PSCG 智能学习' }    // 页面标题
  },

  // ... 其他路由保持不变 ...
]
```

**关键变更说明**：
- ✅ `/home` 路由 **完全不变**，继续指向 HomeView
- ✅ 新增 `/new` 路径指向 NewHomeView (独立门户)
- ✅ 不影响任何现有功能页面的路由配置
- ✅ 可选：后续可调整为 `/portal` 或 `/dashboard`

### 5.2 导航守卫影响分析（最小化）

**当前逻辑**: 无需修改！

```javascript
router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem('studentId')

  if (to.path === '/admin' || to.path === '/docs') {
    next()  // 允许访问
  }
  else if (isLoggedIn) {
    if (to.path === '/login') {
      next('/home')  // 登录后跳转到 /home (保持原有逻辑)
      // ⚠️ 如果希望登录后进入新首页，改为: next('/new')
    } else {
      next()
    }
  }
  else if (!isLoggedIn && to.path !== '/login') {
    next('/login')
  }
})
```

**影响评估**:
- ✅ **零影响**：现有导航守卫逻辑完全不需要修改
- ✅ `/new` 会自动继承登录检查逻辑
- ✅ 登录后默认跳转 `/home` (现有行为不变)
- 💡 **可选优化**：如果想让用户登录后直接看到新首页，可将 `next('/home')` 改为 `next('/new')`

### 5.3 内部跳转逻辑（独立模式）

```
新首页 (/new) 内的导航跳转:

NavCard 点击 → router.push(card.route)
  ├── /subcategory/:subjectId  → SubcategoryView (需要处理动态参数)
  ├── /leaderboard             → LeaderboardView
  ├── /error-book              → ErrorBookView
  ├── /learning-report         → LearningReportView
  ├── /learning-progress       → LearningProgressView
  ├── /answer-history          → AnswerHistoryView
  └── /profile                 → ProfileView

LegacyLink ("进入功能首页") 点击 → router.push('/home')

ToolCard 点击 (status !== 'available'):
  └── showMessage('该功能正在开发中，敬请期待！', 'info')
```

### 5.4 入口方式设计

**如何让用户访问到新首页？**

| 方式 | 实现位置 | 说明 |
|------|----------|------|
| **方案A：手动输入 URL** | 用户在浏览器地址栏输入 `/new` | 最简单，无需改动代码 |
| **方案B：HomeView 添加入口** | 在 HomeView 顶部添加 "体验新版" 按钮 | 推荐方案 |
| **方案C：Header 导航栏** | 在 AppHeader 添加切换按钮 | 需要修改 Header 组件 |
| **方案D：登录后默认跳转** | 修改 router 守卫的 `next('/home')` 为 `next('/new')` | 影响较大 |

**推荐采用 方案B 或 组合方案 (A+B)**

---

## 六、样式架构设计

### 6.1 样式文件组织

```
src/
├── styles/
│   └── scss/
│       └── abstracts/
│           └── _variables.scss        # 全局变量 (扩展蓝色系 Token)
│
├── views/
│   └── styles/
│       └── NewHomeView.scss           # 新首页主样式文件 (新建)
│
└── components/
    └── new-home/
        ├── WelcomeBar.vue             # 内联 <style scoped>
        ├── CmsContentSection.vue      # 内联 <style scoped>
        ├── CmsArticleCard.vue         # 内联 <style scoped>
        ├── NavigationCards.vue        # 内联 <style scoped>
        ├── NavCard.vue                # 内联 <style scoped>
        ├── TeachingTools.vue          # 内联 <style scoped>
        ├── ToolCard.vue               # 内联 <style scoped>
        └── LegacyLink.vue             # 内联 <style scoped>
```

### 6.2 样式分层策略

```
层级1: 全局变量 (Global Tokens)
├── _variables.scss (新增 $new-* 变量系列)
│   ├── $new-primary, $new-text-*, $new-space-*, ...
│   └── CSS Custom Properties (:root 新增)
│
层级2: 页面级样式 (Page Styles)
├── NewHomeView.scss (>200行时抽离)
│   ├── .new-home-view (容器样式)
│   ├── .section-header (通用区块标题)
│   └── 响应式断点 (@media queries)
│
层级3: 组件样式 (Component Styles)
├── 各 .vue 文件的 <style scoped>
│   ├── WelcomeBar 样式
│   ├── CmsArticleCard 样式
│   ├── NavCard 样式
│   └── ToolCard 样式
│
层级4: 覆盖样式 (Overrides - 最少使用)
└── 仅在必要时覆盖 Element Plus 默认样式
    └── :deep(.el-xxx) { ... }
```

### 6.3 新增 Design Tokens (添加到 _variables.scss)

```scss
// ============================================
// 新首页专属 Design Tokens
// 位置: src/styles/scss/abstracts/_variables.scss
// ============================================

// --- 颜色系统 (蓝色系) ---
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

// --- 间距系统 (8px 网格) ---
$new-space-xs: 4px;
$new-space-sm: 8px;
$new-space-md: 16px;
$new-space-lg: 24px;
$new-space-xl: 32px;
$new-space-2xl: 48px;
$new-space-3xl: 64px;

// --- 圆角系统 ---
$new-radius-sm: 6px;
$new-radius-md: 8px;
$new-radius-lg: 12px;
$new-radius-xl: 16px;
$new-radius-full: 50px;

// --- 阴影系统 (扁平化) ---
$new-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
$new-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07);
$new-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08);

// --- 字号系统 ---
$new-font-display: 32px;
$new-font-h1: 24px;
$new-font-h2: 20px;
$new-font-h3: 16px;
$new-font-body: 14px;
$new-font-caption: 12px;
$new-font-overline: 11px;

// --- 过渡动画 ---
$transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
$transition-normal: 200ms cubic-bezier(0.4, 0, 0.2, 1);
$transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);

// --- 布局常量 ---
$new-max-width: 1200px;
$new-breakpoint-mobile-s: 480px;
$new-breakpoint-mobile-l: 768px;
$new-breakpoint-tablet: 992px;

// --- CSS 自定义属性 (供内联样式使用) ---
:root {
  --new-primary: #{$new-primary};
  --new-primary-light: #{$new-primary-light};
  --new-text-primary: #{$new-text-primary};
  --new-text-secondary: #{$new-text-secondary};
  --new-border: #{$new-border};
  --new-bg-page: #{$new-bg-page};
  --new-bg-card: #{$new-bg-card};
  // ... 其他变量
}
```

---

## 七、异常处理策略

### 7.1 错误类型与处理方式

| 错误场景 | 错误类型 | 处理方式 | 用户提示 |
|----------|----------|----------|----------|
| 用户未登录 | 认证错误 | 路由守卫拦截 → 重定向到 `/login` | 无 (静默跳转) |
| CMS 数据加载失败 | 网络错误 | try-catch 捕获 → 显示空状态 | "内容加载失败，请刷新重试" |
| 路由参数缺失 | 参数错误 | 使用默认值或阻止跳转 | 无 (静默处理) |
| 组件渲染异常 | 运行时错误 | ErrorBoundary 捕获 → 显示降级 UI | "页面出现问题，请刷新" |
| localStorage 不可用 | 存储错误 | 降级为匿名模式 | 显示默认欢迎语 |

### 7.2 错误边界实现

```vue
<!-- NewHomeView.vue 中的错误处理示例 -->
<template>
  <div class="new-home-view">
    <!-- 正常内容 -->
    <template v-if="!hasError">
      <WelcomeBar ... />
      <CmsContentSection ... />
      <!-- ... -->
    </template>

    <!-- 错误降级 UI -->
    <div v-else class="error-fallback">
      <p>⚠️ 页面加载出现问题</p>
      <button @click="retry">重新加载</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)
const errorMessage = ref('')

onErrorCaptured((err, instance, info) => {
  console.error('[NewHomeView Error]', err, info)
  hasError.value = true
  errorMessage.value = err.message
  return false  // 阻止错误继续向上传播
})

const retry = () => {
  hasError.value = false
  window.location.reload()
}
</script>
```

### 7.3 Loading 状态管理

```vue
<!-- 使用项目现有的 useLoading Composable -->
<script setup>
import { useLoading } from '@/composables/useLoading'

const {
  isLoading,
  withLoading,
  error,
  setError
} = useLoading()

onMounted(async () => {
  await withLoading(async () => {
    await loadCmsData()
    await loadUserData()
  })
})
</script>

<template>
  <div class="new-home-view">
    <SkeletonLoader v-if="isLoading" type="new-home" />
    <template v-else>
      <!-- 正常内容 -->
    </template>
  </div>
</template>
```

---

## 八、性能优化策略

### 8.1 加载性能

| 优化项 | 技术 | 预期效果 |
|--------|------|----------|
| 路由懒加载 | `lazyLoad('NewHomeView')` | 减少 main bundle 体积 |
| 图片懒加载 | `loading="lazy"` | 延迟加载非首屏图片 |
| 组件按需渲染 | `v-if` 控制显隐 | 减少初始渲染量 |
| 骨架屏 | SkeletonLoader 组件 | 提升感知性能 |

### 8.2 渲染性能

| 优化项 | 技术 | 应用场景 |
|--------|------|----------|
| 列表虚拟滚动 | (暂不需要，<100项) | CMS 文章 > 50篇时考虑 |
| 计算属性缓存 | `computed()` | 过滤/排序操作 |
| 事件防抖 | `debounce()` | 窗口 resize、搜索输入 |
| 动画 GPU 加速 | `transform`, `opacity` | hover 动效 |

### 8.3 包体积控制

```
预估新增代码量:
├── NewHomeView.vue:         ~150 行 (主组件)
├── WelcomeBar.vue:           ~80 行
├── CmsContentSection.vue:    ~100 行
├── CmsArticleCard.vue:       ~80 行
├── NavigationCards.vue:      ~60 行
├── NavCard.vue:              ~90 行
├── TeachingTools.vue:        ~60 行
├── ToolCard.vue:             ~80 行
├── LegacyLink.vue:           ~30 行
├── NewHomeView.scss:         ~400 行 (抽离后)
├── navigationConfig.js:      ~80 行 (配置)
├── toolsConfig.js:           ~50 行 (配置)
└── mockCmsData.js:           ~60 行 (Mock 数据)
───────────────────────────────────────
总计:                       ~1320 行 (估算)

Gzip 后预估增加: ~15-20KB (可接受范围)
```

---

## 九、安全考虑

### 9.1 前端安全措施

| 安全风险 | 应对策略 | 实现方式 |
|----------|----------|----------|
| XSS 攻击 | 输入转义 | Vue 自动转义 {{ }} + v-text |
| 用户信息泄露 | 最小权限 | 只读取必要的 localStorage 字段 |
| 路由越权 | 守卫检查 | 复用现有 router.beforeEach |
| 外部链接安全 | target="_blank" | 添加 rel="noopener noreferrer" |

### 9.2 数据验证

```javascript
// 从 localStorage 读取用户信息时的验证
const getSafeUserInfo = () => {
  const userName = localStorage.getItem('userName') || '同学'
  const userGrade = localStorage.getItem('userGrade') || ''
  const userClass = localStorage.getItem('userClass') || ''

  return {
    userName: sanitizeHtml(userName),  // 使用 xss-filter
    userGrade: sanitizeHtml(userGrade),
    userClass: sanitizeHtml(userClass)
  }
}
```

---

## 十、测试策略

### 10.1 测试范围 (本次不实施，但预留接口)

| 测试类型 | 覆盖范围 | 工具 | 优先级 |
|----------|----------|------|--------|
| 单元测试 | Composables、工具函数 | Vitest | P2 |
| 组件测试 | 各组件渲染、交互 | Vue Test Utils | P2 |
| 快照测试 | UI 结构一致性 | Jest Snapshot | P3 |
| E2E 测试 | 关键用户流程 | Playwright | P3 |

### 10.2 手动测试检查清单

**功能测试**:
- [ ] 新首页在 `/home` 正确渲染
- [ ] 所有导航卡片点击后跳转到正确页面
- [ ] "进入传统首页"按钮跳转到 `/home/legacy`
- [ ] 未登录状态下被重定向到 `/login`
- [ ] CMS 文章卡片显示正确的内容和格式
- [ ] 工具卡片显示正确的状态标签

**视觉测试**:
- [ ] 桌面端 (1920x1080) 布局正常
- [ ] 平板端 (768x1024) 布局正常
- [ ] 移动端 (375x667) 布局正常
- [ ] Hover 状态动效流畅
- [ ] 配色符合蓝色系规范

**兼容性测试**:
- [ ] Chrome 最新版
- [ Firefox 最新版
- [ Edge 最新版
- [ Safari (Mac/iOS)

---

## 十一、部署与发布

### 11.1 发布步骤

```bash
# 1. 创建特性分支
git checkout -b feature/new-homepage

# 2. 开发完成后运行检查
npm run lint
npm run format

# 3. 本地构建测试
npm run build
npm run preview  # 预览构建结果

# 4. 提交代码
git add .
git commit -m("feat(home): 添加现代化新首页 (NewHomeView)")

# 5. 合并到主分支
git checkout main
git merge feature/new-homepage

# 6. 部署到生产环境
# (根据实际部署流程执行)
```

### 11.2 回滚方案

如果新首页出现严重问题：

```bash
# 方案1: 快速回滚代码
git revert <commit-hash>

# 方案2: 通过路由配置切换回旧首页
# 在 router/index.js 中临时注释掉新路由
{
  path: '/home',
  name: 'Home',              // 恢复原名
  component: lazyLoad('HomeView')  // 指向旧组件
}
```

---

## 十二、架构决策记录 (ADR)

### ADR-000: 采用完全独立架构（⭐ 核心决策）

**背景**: 用户明确要求新首页是完全独立于现有项目功能外的一个首页。

**决策**: 新首页作为独立的门户页面 (Portal Page)，与现有 HomeView 完全解耦。

**理由**:
1. **用户需求**：用户明确表示"完全独立于现有项目功能"
2. **风险隔离**：避免修改现有代码引入 bug
3. **渐进式发布**：可独立开发、测试、部署，不影响现有功能
4. **灵活切换**：用户可在新旧页面间自由选择
5. **技术债务最小化**：不需要重构现有架构

**具体实现**:
- 路由：使用全新路径 `/new`，不占用 `/home`
- 数据：不依赖 `questionStore`，使用独立 Mock 数据源
- 样式：使用全新的蓝色系 Design Token
- 逻辑：组件内部自包含，不导入业务模块

**后果**:
- ✅ 零风险：现有功能完全不受影响
- ✅ 独立开发：团队可并行工作
- ✅ 易于回滚：出现问题可直接删除 `/new` 路由
- ⚠️ 入口设计：需要额外提供访问新首页的方式（如按钮链接）
- ⚠️ 数据同步：如果需要显示真实数据，后续需独立 API 支持

---

### ADR-001: 选择轻量状态管理而非 Pinia Store

**背景**: 新首页需要管理用户信息、CMS 文章列表、导航配置等多种状态。

**决策**: 使用组件局部状态 (`ref/reactive`) + 静态配置文件，不创建新的 Pinia Store。

**理由**:
1. 新首页数据不需要跨组件共享
2. 遵循"最小知识原则"，降低耦合
3. 减少全局状态的复杂性和调试难度
4. 符合 Vue 3 Composition API 的最佳实践

**后果**:
- ✅ 组件独立性更强，易于测试和维护
- ✅ 减少对全局状态的依赖
- ⚠️ 如果未来需要跨页面共享数据，需要重构为 Store

---

### ADR-002: 采用单列流式布局而非双栏布局

**背景**: 新首页需要在桌面端和移动端都有良好的体验。

**决策**: 使用单列垂直流式布局，通过 Grid/Flexbox 实现响应式。

**理由**:
1. 符合现代极简设计趋势 (Notion, Linear 等)
2. 移动端适配更简单，无需复杂的断点逻辑
3. 内容聚焦，减少认知负担
4. 更容易实现无限滚动或动态加载

**后果**:
- ✅ 开发成本低，维护简单
- ✅ 用户体验一致性好
- ⚠️ 大屏幕上可能显得过于空旷 (可通过 max-width 缓解)

---

### ADR-003: 使用 Emoji 作为图标而非 Icon Font/SVG

**背景**: 导航卡片和工具卡片需要图标来增强识别度。

**决策**: MVP 阶段使用 Emoji 图标，后续迭代替换为 SVG/Iconify。

**理由**:
1. 零依赖，无需引入额外的图标库
2. 开发速度快，即插即用
3. 跨平台兼容性好
4. 易于快速调整和替换

**后果**:
- ✅ 减少包体积和依赖数量
- ✅ 快速交付 MVP
- ⚠️ 不同平台/浏览器显示可能略有差异
- ⚠️ 后续需要迁移到专业图标方案 (Iconify/Phosphor Icons)

---

## 十三、附录

### 13.1 文件索引

| 文件类型 | 文件路径 | 操作 | 说明 |
|----------|----------|------|------|
| 页面组件 | `src/views/NewHomeView.vue` | **新建** | 独立门户页面主组件 |
| 页面样式 | `src/views/styles/NewHomeView.scss` | **新建** | 页面级样式 (如>200行) |
| 子组件目录 | `src/components/new-home/` | **新建** | 8个子组件 (完全独立) |
| 路由配置 | `src/router/index.js` | **修改 (最小化)** | 新增 `/new` 路由，不修改现有路由 |
| 样式变量 | `src/styles/scss/abstracts/_variables.scss` | **修改 (扩展)** | 新增蓝色系 Token，不影响现有变量 |
| 导航配置 | `src/config/navigationConfig.js` | **新建** | 导航卡片静态配置 |
| 工具配置 | `src/config/toolsConfig.js` | **新建** | 工具卡片静态配置 |
| Mock 数据 | `src/config/mockCmsData.js` | **新建** | CMS 模拟数据 (独立数据源) |

### 13.2 与现有系统的集成点（极简化）

```
集成点清单 (独立架构 - 最小化依赖):

1. 路由系统 ⭐
   └── 仅新增 /new 路由
   └── 不修改 /home 或任何其他路由

2. 状态管理 ❌ (无依赖)
   └── 不使用 questionStore
   └── 不使用任何业务 Store

3. 基础设施 ✅ (复用)
   └── 使用 api.js (预留，当前用 Mock)
   └── 使用 message.js 显示消息提示
   └── 使用 useLoading Composable

4. UI 组件 ✅ (可选复用)
   └── 复用 AppFooter.vue (页脚)
   └── 复用 SkeletonLoader.vue (骨架屏)
   └── 使用 Element Plus 基础组件 (el-button, el-card 等)

5. 样式系统 ✅ (扩展)
   └── 扩展 _variables.scss (新增 $new-* 变量)
   └── 遵循 SCSS 变量规范
   └── 使用 scoped 样式隔离

6. 用户认证 ✅ (自动继承)
   └── 自动继承 router.beforeEach 守卫
   └── 读取 localStorage 获取用户信息
```

### 13.3 参考资料

- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Pinia 状态管理](https://pinia.vuejs.org/)
- [Vue Router 官方文档](https://router.vuejs.org/)
- [Element Plus 组件库](https://element-plus.org/)
- [SCSS 最佳实践](https://sass-lang.com/guide/style-guide)
- [8pt Grid System](https://spec.fm/specific_spec/8-point-grid)

---

**文档维护记录**:

| 版本 | 日期 | 修改人 | 修改内容 |
|------|------|--------|----------|
| v1.0 | 2026-04-08 | 6A工作流 (Architect) | 初始版本，完成完整的架构设计 |
| v1.1 | 2026-04-08 | 6A工作流 (Architect) | 更新为独立门户页面架构，路由改为 `/new` |
| v1.2 | 2026-04-08 | 6A工作流 (Architect) | **重大变更：新首页改为公开访问+管理员登录入口，完全独立于学生端系统** |
| v1.3 | 2026-04-08 | 6A工作流 (Architect) | **需求澄清：大卡片式导航改为模拟展示管理工具功能（4个卡片），不整合现有功能** |
