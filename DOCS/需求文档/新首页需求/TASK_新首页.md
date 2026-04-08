# TASK 文档 - 新首页开发任务拆分

> **文档版本**: v1.0 | **创建日期**: 2026-04-08
> **任务名称**: 独立门户首页（Portal Page）开发任务拆分
> **文档状态**: ✅ 任务拆分完成
> **基于**: CONSENSUS_新首页.md + DESIGN_新首页.md + UI_Design_新首页.md

---

## 一、任务总览

### 1.1 开发阶段划分

```
Phase 1: 基础设施层 (Infrastructure)
├── Task 1.1: 路由配置
├── Task 1.2: 样式变量扩展
└── Task 1.3: 组件目录创建

Phase 2: 配置文件层 (Configuration)
├── Task 2.1: 导航卡片配置
├── Task 2.2: 工具卡片配置
└── Task 2.3: CMS Mock 数据

Phase 3: 组件层 (Components)
├── Task 3.1: 主组件 NewHomeView.vue
├── Task 3.2: AdminLoginButton 组件
├── Task 3.3: CmsContentSection 组件
├── Task 3.4: NavigationCards 组件
├── Task 3.5: TeachingTools 组件
├── Task 3.6: CmsArticleCard 组件
├── Task 3.7: NavCard 组件
└── Task 3.8: ToolCard 组件

Phase 4: 集成测试层 (Integration)
├── Task 4.1: 路由访问测试
├── Task 4.2: 组件渲染测试
├── Task 4.3: 响应式测试
└── Task 4.4: 交互测试
```

### 1.2 任务统计

| 阶段 | 任务数 | 预估工时 | 优先级 |
|------|--------|----------|--------|
| Phase 1: 基础设施层 | 3 | 1.5h | P0 |
| Phase 2: 配置文件层 | 3 | 1h | P0 |
| Phase 3: 组件层 | 8 | 6h | P0 |
| Phase 4: 集成测试层 | 4 | 2h | P1 |
| **总计** | **18** | **10.5h** | - |

---

## 二、任务依赖关系图

```
┌─────────────────────────────────────────────────────────────┐
│                     Phase 1: 基础设施层                      │
├─────────────────────────────────────────────────────────────┤
│  Task 1.1 路由配置 ────────┐                                │
│  Task 1.2 样式变量扩展 ────┤                                │
│  Task 1.3 组件目录创建 ────┘                                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                     Phase 2: 配置文件层                      │
├─────────────────────────────────────────────────────────────┤
│  Task 2.1 导航卡片配置 ────┐                                │
│  Task 2.2 工具卡片配置 ────┤                                │
│  Task 2.3 CMS Mock 数据 ───┘                                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                     Phase 3: 组件层                          │
├─────────────────────────────────────────────────────────────┤
│  Task 3.1 NewHomeView.vue (主组件)                          │
│     ├── Task 3.2 AdminLoginButton.vue                       │
│     ├── Task 3.3 CmsContentSection.vue                      │
│     │     └── Task 3.6 CmsArticleCard.vue                   │
│     ├── Task 3.4 NavigationCards.vue                        │
│     │     └── Task 3.7 NavCard.vue                          │
│     └── Task 3.5 TeachingTools.vue                          │
│           └── Task 3.8 ToolCard.vue                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   Phase 4: 集成测试层                        │
├─────────────────────────────────────────────────────────────┤
│  Task 4.1 路由访问测试                                      │
│  Task 4.2 组件渲染测试                                      │
│  Task 4.3 响应式测试                                        │
│  Task 4.4 交互测试                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、详细任务清单

### Phase 1: 基础设施层 (Infrastructure)

#### Task 1.1: 路由配置

**优先级**: P0 | **预估工时**: 30分钟 | **依赖**: 无

**任务描述**:
在 `src/router/index.js` 中添加新首页路由配置

**实施步骤**:
1. 打开 `src/router/index.js`
2. 在路由数组中添加新路由配置：
   ```javascript
   {
     path: '/new',
     name: 'NewHome',
     component: lazyLoad('NewHomeView'),
     meta: { title: 'PSCG 智能学习' }
   }
   ```
3. 确保路由守卫不拦截 `/new` 路径（公开访问）

**验收标准**:
- ✅ 路由配置正确，无语法错误
- ✅ 访问 `http://localhost:5173/#/new` 不报错
- ✅ 路由守卫不拦截 `/new` 路径

**产出文件**:
- `src/router/index.js` (修改)

---

#### Task 1.2: 样式变量扩展

**优先级**: P0 | **预估工时**: 30分钟 | **依赖**: 无

**任务描述**:
在 `src/styles/scss/abstracts/_variables.scss` 中添加新首页的蓝色系设计 Token

**实施步骤**:
1. 打开 `src/styles/scss/abstracts/_variables.scss`
2. 添加新首页专用变量（参考 UI_Design 文档）：
   ```scss
   // 新首页 - 蓝色系设计 Token
   $new-primary: #3b82f6;
   $new-primary-light: #60a5fa;
   $new-primary-dark: #2563eb;
   // ... 其他变量
   ```

**验收标准**:
- ✅ 所有变量定义完整
- ✅ 变量命名符合规范（`$new-` 前缀）
- ✅ 无语法错误

**产出文件**:
- `src/styles/scss/abstracts/_variables.scss` (修改)

---

#### Task 1.3: 组件目录创建

**优先级**: P0 | **预估工时**: 10分钟 | **依赖**: 无

**任务描述**:
创建新首页专用组件目录

**实施步骤**:
1. 创建目录 `src/components/new-home/`
2. 创建目录 `src/config/`（如果不存在）

**验收标准**:
- ✅ 目录结构正确
- ✅ 无权限问题

**产出文件**:
- `src/components/new-home/` (新建目录)
- `src/config/` (确认存在)

---

### Phase 2: 配置文件层 (Configuration)

#### Task 2.1: 导航卡片配置

**优先级**: P0 | **预估工时**: 20分钟 | **依赖**: Task 1.3

**任务描述**:
创建导航卡片配置文件

**实施步骤**:
1. 创建文件 `src/config/navigationConfig.js`
2. 导出导航卡片配置数组（4个管理工具卡片）

**验收标准**:
- ✅ 配置数据结构正确
- ✅ 包含 4 个管理工具卡片
- ✅ 每个卡片包含：id, icon, title, description, status, disabled

**产出文件**:
- `src/config/navigationConfig.js` (新建)

---

#### Task 2.2: 工具卡片配置

**优先级**: P0 | **预估工时**: 20分钟 | **依赖**: Task 1.3

**任务描述**:
创建教学工具卡片配置文件

**实施步骤**:
1. 创建文件 `src/config/toolsConfig.js`
2. 导出工具卡片配置数组（6个工具卡片）

**验收标准**:
- ✅ 配置数据结构正确
- ✅ 包含 6 个工具卡片
- ✅ 每个工具包含：id, icon, name, status, statusText, route

**产出文件**:
- `src/config/toolsConfig.js` (新建)

---

#### Task 2.3: CMS Mock 数据

**优先级**: P0 | **预估工时**: 20分钟 | **依赖**: Task 1.3

**任务描述**:
创建 CMS 内容 Mock 数据文件

**实施步骤**:
1. 创建文件 `src/config/mockCmsData.js`
2. 导出 CMS 文章数组（4-6篇文章）

**验收标准**:
- ✅ 配置数据结构正确
- ✅ 包含 4-6 篇文章
- ✅ 每篇文章包含：id, title, summary, date, thumbnail(可选)

**产出文件**:
- `src/config/mockCmsData.js` (新建)

---

### Phase 3: 组件层 (Components)

#### Task 3.1: NewHomeView.vue (主组件)

**优先级**: P0 | **预估工时**: 1小时 | **依赖**: Task 1.1, Task 1.2, Task 3.2, Task 3.3, Task 3.4, Task 3.5

**任务描述**:
创建新首页主组件

**实施步骤**:
1. 创建文件 `src/views/NewHomeView.vue`
2. 导入子组件：AdminLoginButton, CmsContentSection, NavigationCards, TeachingTools
3. 实现页面布局（单列流式）
4. 实现响应式设计

**验收标准**:
- ✅ 组件结构清晰
- ✅ 所有子组件正确渲染
- ✅ 响应式布局正常
- ✅ 无 console 错误

**产出文件**:
- `src/views/NewHomeView.vue` (新建)

---

#### Task 3.2: AdminLoginButton.vue

**优先级**: P0 | **预估工时**: 30分钟 | **依赖**: Task 1.2

**任务描述**:
创建右上角管理员登录按钮组件

**实施步骤**:
1. 创建文件 `src/components/new-home/AdminLoginButton.vue`
2. 实现按钮样式（参考 UI_Design 文档）
3. 实现点击跳转到 `/admin` 的逻辑

**验收标准**:
- ✅ 按钮样式符合设计规范
- ✅ 点击后跳转到 `/admin`
- ✅ hover 效果正常

**产出文件**:
- `src/components/new-home/AdminLoginButton.vue` (新建)

---

#### Task 3.3: CmsContentSection.vue

**优先级**: P0 | **预估工时**: 40分钟 | **依赖**: Task 1.2, Task 2.3, Task 3.6

**任务描述**:
创建 CMS 内容区域组件

**实施步骤**:
1. 创建文件 `src/components/new-home/CmsContentSection.vue`
2. 导入 Mock 数据
3. 渲染文章卡片列表
4. 实现响应式网格布局

**验收标准**:
- ✅ 文章卡片正确渲染
- ✅ 网格布局正常
- ✅ 响应式适配正常

**产出文件**:
- `src/components/new-home/CmsContentSection.vue` (新建)

---

#### Task 3.4: NavigationCards.vue

**优先级**: P0 | **预估工时**: 40分钟 | **依赖**: Task 1.2, Task 2.1, Task 3.7

**任务描述**:
创建大卡片式导航组件

**实施步骤**:
1. 创建文件 `src/components/new-home/NavigationCards.vue`
2. 导入导航配置
3. 渲染 4 个管理工具卡片（2x2 网格）
4. 实现点击提示"功能开发中"

**验收标准**:
- ✅ 4 个卡片正确渲染
- ✅ 2x2 网格布局正常
- ✅ 点击后显示提示消息
- ✅ "开发中"标签显示正常

**产出文件**:
- `src/components/new-home/NavigationCards.vue` (新建)

---

#### Task 3.5: TeachingTools.vue

**优先级**: P0 | **预估工时**: 40分钟 | **依赖**: Task 1.2, Task 2.2, Task 3.8

**任务描述**:
创建教学工具卡片组件

**实施步骤**:
1. 创建文件 `src/components/new-home/TeachingTools.vue`
2. 导入工具配置
3. 渲染工具卡片网格
4. 实现点击提示"功能开发中"

**验收标准**:
- ✅ 工具卡片正确渲染
- ✅ 网格布局正常
- ✅ 点击后显示提示消息

**产出文件**:
- `src/components/new-home/TeachingTools.vue` (新建)

---

#### Task 3.6: CmsArticleCard.vue

**优先级**: P0 | **预估工时**: 30分钟 | **依赖**: Task 1.2

**任务描述**:
创建单个文章卡片组件

**实施步骤**:
1. 创建文件 `src/components/new-home/CmsArticleCard.vue`
2. 实现 Props: article
3. 实现卡片样式和 hover 效果

**验收标准**:
- ✅ 卡片样式符合设计规范
- ✅ hover 效果正常
- ✅ Props 验证正确

**产出文件**:
- `src/components/new-home/CmsArticleCard.vue` (新建)

---

#### Task 3.7: NavCard.vue

**优先级**: P0 | **预估工时**: 30分钟 | **依赖**: Task 1.2

**任务描述**:
创建单个导航卡片组件

**实施步骤**:
1. 创建文件 `src/components/new-home/NavCard.vue`
2. 实现 Props: card
3. 实现卡片样式、状态标签、hover 效果
4. 实现点击提示逻辑

**验收标准**:
- ✅ 卡片样式符合设计规范
- ✅ "开发中"标签显示正常
- ✅ hover 效果正常
- ✅ 点击后显示提示消息

**产出文件**:
- `src/components/new-home/NavCard.vue` (新建)

---

#### Task 3.8: ToolCard.vue

**优先级**: P0 | **预估工时**: 30分钟 | **依赖**: Task 1.2

**任务描述**:
创建单个工具卡片组件

**实施步骤**:
1. 创建文件 `src/components/new-home/ToolCard.vue`
2. 实现 Props: tool
3. 实现卡片样式、状态标签、hover 效果
4. 实现点击提示逻辑

**验收标准**:
- ✅ 卡片样式符合设计规范
- ✅ 状态标签显示正常
- ✅ hover 效果正常
- ✅ 点击后显示提示消息

**产出文件**:
- `src/components/new-home/ToolCard.vue` (新建)

---

### Phase 4: 集成测试层 (Integration)

#### Task 4.1: 路由访问测试

**优先级**: P1 | **预估工时**: 30分钟 | **依赖**: Task 3.1

**任务描述**:
测试新首页路由访问

**测试内容**:
1. 直接访问 `http://localhost:5173/#/new`
2. 未登录状态下访问（应成功）
3. 从其他页面跳转到 `/new`

**验收标准**:
- ✅ 所有测试场景通过
- ✅ 无路由错误

---

#### Task 4.2: 组件渲染测试

**优先级**: P1 | **预估工时**: 30分钟 | **依赖**: Task 3.1

**任务描述**:
测试所有组件正确渲染

**测试内容**:
1. AdminLoginButton 正确渲染
2. CmsContentSection 正确渲染文章列表
3. NavigationCards 正确渲染 4 个卡片
4. TeachingTools 正确渲染工具列表

**验收标准**:
- ✅ 所有组件正确渲染
- ✅ 无 console 错误
- ✅ 无样式错误

---

#### Task 4.3: 响应式测试

**优先级**: P1 | **预估工时**: 30分钟 | **依赖**: Task 3.1

**任务描述**:
测试响应式布局

**测试内容**:
1. 桌面端（≥1200px）
2. 平板端（768px - 1199px）
3. 移动端（<768px）

**验收标准**:
- ✅ 所有断点布局正常
- ✅ 无横向滚动条
- ✅ 卡片网格自适应

---

#### Task 4.4: 交互测试

**优先级**: P1 | **预估工时**: 30分钟 | **依赖**: Task 3.1

**任务描述**:
测试所有交互功能

**测试内容**:
1. 管理员登录按钮点击跳转
2. 导航卡片点击提示
3. 工具卡片点击提示
4. hover 效果

**验收标准**:
- ✅ 所有交互正常
- ✅ 提示消息正确显示
- ✅ 跳转逻辑正确

---

## 四、执行顺序建议

### 推荐执行顺序

```
Day 1 (上午):
1. Task 1.1 路由配置 (30分钟)
2. Task 1.2 样式变量扩展 (30分钟)
3. Task 1.3 组件目录创建 (10分钟)

Day 1 (下午):
4. Task 2.1 导航卡片配置 (20分钟)
5. Task 2.2 工具卡片配置 (20分钟)
6. Task 2.3 CMS Mock 数据 (20分钟)
7. Task 3.6 CmsArticleCard.vue (30分钟)
8. Task 3.7 NavCard.vue (30分钟)
9. Task 3.8 ToolCard.vue (30分钟)

Day 2 (上午):
10. Task 3.2 AdminLoginButton.vue (30分钟)
11. Task 3.3 CmsContentSection.vue (40分钟)
12. Task 3.4 NavigationCards.vue (40分钟)
13. Task 3.5 TeachingTools.vue (40分钟)

Day 2 (下午):
14. Task 3.1 NewHomeView.vue (1小时)
15. Task 4.1 路由访问测试 (30分钟)
16. Task 4.2 组件渲染测试 (30分钟)
17. Task 4.3 响应式测试 (30分钟)
18. Task 4.4 交互测试 (30分钟)
```

---

## 五、风险与应对

### 潜在风险

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 样式变量冲突 | 中 | 使用 `$new-` 前缀隔离 |
| 路由守卫拦截 | 高 | 提前配置白名单 |
| 组件命名冲突 | 低 | 使用 `new-home/` 目录隔离 |
| 响应式布局问题 | 中 | 使用 CSS Grid 自适应 |

---

## 六、验收标准总览

### 功能验收

- ✅ 访问 `/new` 路由成功
- ✅ 所有组件正确渲染
- ✅ 管理员登录按钮跳转正常
- ✅ 导航卡片点击提示正常
- ✅ 工具卡片点击提示正常

### 性能验收

- ✅ 首屏加载时间 < 2秒
- ✅ 无 console 错误
- ✅ 无内存泄漏

### 兼容性验收

- ✅ Chrome 最新版
- ✅ Firefox 最新版
- ✅ Safari 最新版
- ✅ 移动端浏览器

---

**文档维护记录**:

| 版本 | 日期 | 修改人 | 修改内容 |
|------|------|--------|----------|
| v1.0 | 2026-04-08 | 6A工作流 (Atomize) | 初始版本，完成任务拆分和依赖关系图 |
