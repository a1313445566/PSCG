# CMS功能完善 - 对齐文档 (ALIGNMENT)

> 创建日期：2026-04-09
> 任务类型：功能完善
> 优先级：高

---

## 一、项目特性规范

### 1.1 技术栈约束

| 层级 | 技术 | 版本要求 | 备注 |
|------|------|----------|------|
| 前端框架 | Vue 3 | ^3.5.x | 必须使用 `<script setup>` |
| UI 库 | Element Plus | ^2.13.x | 图标需显式导入 |
| 状态管理 | Pinia | ^3.0.x | - |
| 构建工具 | Vite | ^5.2.x | - |
| 富文本编辑 | Quill | 2.0.2 | 已有组件可复用 |
| 后端框架 | Express | ^4.18.x | - |
| 数据库 | MySQL2 | ^3.20.x | 禁止 SQLite 语法 |
| 参数校验 | Zod | ^3.23.x | 新增接口必须使用 |

### 1.2 代码规范约束

1. **样式规范（强制）**：
   - 必须使用 SCSS 变量（`$primary-color`, `$spacing-md` 等）
   - 禁止硬编码颜色、间距、字号、圆角
   - 使用 `color.adjust()` 替代 `lighten()/darken()`
   - 样式超过 200 行时必须抽离为独立 `.scss` 文件

2. **API 规范（强制）**：
   - 前端必须使用 `@/utils/api.js`
   - 后端必须使用 `utils/response.js` 统一响应格式
   - 新增接口必须使用 Zod 进行参数校验

3. **组件规范（强制）**：
   - 组件命名：PascalCase
   - 变量命名：camelCase
   - CSS 类名：kebab-case
   - 必须复用现有组件（如 `QuillEditor.vue`）

### 1.3 设计规范约束

**用户端设计参照 Figma 风格（DESIGN.md）**：

1. **颜色系统**：
   - 界面层：纯黑（`#000000`）+ 纯白（`#ffffff`）
   - 内容层：可以使用渐变色（如 `CmsArticleCard.vue` 的渐变背景）

2. **排版系统**：
   - 字重：使用 Figma 风格的细字重（320-540）
   - 字间距：负值（-0.1px 到 -1.72px）
   - 行高：紧凑（1.0-1.45）

3. **几何系统**：
   - 按钮：胶囊形（50px radius）或圆形（50%）
   - 卡片：8px 圆角
   - 焦点指示器：虚线 2px（`dashed 2px`）

---

## 二、原始需求

### 2.1 用户输入

> "完善CMS功能 目前还缺少：列表页使用 `e:\PSCG\src\components\new-home\CmsArticleCard.vue` 卡片做出瀑布流，和内容页，用户端设计参照 `e:\PSCG\DESIGN.md` 后台缺少内容编辑组件，需要符合项目规则和个人规则、相关行业规则。注意组件和代码的复用性。"

### 2.2 需求拆解

| 需求项 | 描述 | 优先级 |
|--------|------|--------|
| 用户端 - 文章列表页 | 使用 `CmsArticleCard.vue` 实现瀑布流布局 | P0 |
| 用户端 - 文章详情页 | 展示文章完整内容 | P0 |
| 后台 - 文章管理 | CRUD 功能，包含富文本编辑 | P0 |
| 后台 - 内容编辑组件 | 复用 `QuillEditor.vue` | P0 |
| 数据库 - 文章表 | 存储 CMS 文章数据 | P0 |
| API - 文章接口 | 前后端接口对接 | P0 |

---

## 三、边界确认（明确任务范围）

### 3.1 包含范围

✅ **必须实现**：

1. **数据库层**：
   - 创建 `cms_articles` 表（参照 `product_cards` 表设计）
   - 包含字段：id, title, summary, content, thumbnail, author, category, tags, view_count, is_published, created_at, updated_at

2. **后端 API**：
   - 公开接口：`GET /api/articles`（列表）、`GET /api/articles/:id`（详情）
   - 管理接口：`POST /api/admin/articles`、`PUT /api/admin/articles/:id`、`DELETE /api/admin/articles/:id`
   - 参数校验：使用 Zod
   - 权限控制：管理接口需要 `adminAuth` 中间件

3. **前端 - 用户端**：
   - 文章列表页：`/articles`（瀑布流布局，使用 `CmsArticleCard.vue`）
   - 文章详情页：`/articles/:id`（展示完整内容）
   - 路由配置：添加到 `src/router/index.js`

4. **前端 - 后台管理**：
   - 文章管理组件：`src/components/admin/content-management/ArticleManagement.vue`
   - 富文本编辑：复用 `QuillEditor.vue`
   - 表格展示：参照 `ProductCardManagement.vue`

5. **样式规范**：
   - 用户端：遵循 Figma 设计风格（参照 DESIGN.md）
   - 后台端：遵循现有后台管理风格
   - 必须使用 SCSS 变量，禁止硬编码

### 3.2 不包含范围

❌ **明确排除**：

1. 文章评论功能
2. 文章点赞功能
3. 文章分享功能
4. 文章分类管理（独立模块）
5. 文章标签管理（独立模块）
6. 文章搜索功能（后续迭代）
7. 文章推荐算法（后续迭代）

### 3.3 边界约束

| 约束项 | 说明 |
|--------|------|
| 数据量 | 初始文章数量 < 100 篇 |
| 图片上传 | 复用现有 `multer` 配置，限制 2MB |
| 富文本 | 仅支持文本、图片、链接，不支持视频上传 |
| 分页 | 列表接口必须分页，默认每页 12 条 |
| 权限 | 仅超级管理员和有 `content-management` 权限的管理员可编辑 |

---

## 四、需求理解（对现有项目的理解）

### 4.1 现有 CMS 组件分析

| 组件 | 文件路径 | 状态 | 复用方案 |
|------|----------|------|----------|
| CmsArticleCard | `src/components/new-home/CmsArticleCard.vue` | ✅ 已存在 | 直接复用，修改点击事件跳转到详情页 |
| CmsContentSection | `src/components/new-home/CmsContentSection.vue` | ✅ 已存在 | 修改为调用真实 API，保留瀑布流逻辑 |
| QuillEditor | `src/components/common/QuillEditor.vue` | ✅ 已存在 | 后台文章编辑直接复用 |
| mockCmsData | `src/config/mockCmsData.js` | ⚠️ Mock 数据 | 删除或保留作为开发测试数据 |

### 4.2 现有数据库表参考

**参照 `product_cards` 表设计**：

```sql
-- product_cards 表的优秀设计点
CREATE TABLE product_cards (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '卡片ID',
  title VARCHAR(100) NOT NULL COMMENT '标题',
  -- ... 其他字段
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  is_visible TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否可见',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  -- 索引优化
  INDEX idx_sort_order (sort_order),
  INDEX idx_is_visible (is_visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**cms_articles 表设计建议**：

```sql
CREATE TABLE cms_articles (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '文章ID',
  title VARCHAR(200) NOT NULL COMMENT '标题',
  summary VARCHAR(500) DEFAULT NULL COMMENT '摘要',
  content LONGTEXT COMMENT '内容（HTML格式）',
  thumbnail VARCHAR(255) DEFAULT NULL COMMENT '封面图URL',
  author VARCHAR(50) DEFAULT NULL COMMENT '作者',
  category VARCHAR(50) DEFAULT NULL COMMENT '分类',
  tags VARCHAR(255) DEFAULT NULL COMMENT '标签（JSON数组）',
  view_count INT NOT NULL DEFAULT 0 COMMENT '浏览次数',
  is_published TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否发布（0=草稿, 1=已发布）',
  published_at DATETIME DEFAULT NULL COMMENT '发布时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  -- 索引优化
  INDEX idx_is_published (is_published),
  INDEX idx_published_at (published_at),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CMS文章表';
```

### 4.3 现有 API 模式参考

**参照 `admin-product-cards.js` 路由设计**：

```javascript
// 公开接口（无需认证）
router.get('/', async (req, res) => {
  const cards = await productCardService.getVisibleCards()
  response.success(res, cards, '获取成功')
})

// 管理接口（需要认证 + 权限）
router.post('/', adminAuth, checkPermission('content-management', 'edit'), async (req, res) => {
  const card = await productCardService.createCard(req.body)
  response.success(res, card, '创建成功')
})
```

### 4.4 现有后台管理组件模式

**参照 `ProductCardManagement.vue` 实现**：

1. **页面结构**：
   - 页面头部（标题 + 描述）
   - 工具栏（添加、刷新按钮）
   - 数据表格（使用 Element Plus `el-table`）
   - 编辑对话框（使用 `el-dialog` + `el-form`）

2. **交互逻辑**：
   - 表格支持排序、筛选
   - 对话框支持添加/编辑
   - 删除操作需要二次确认
   - 表单使用 Zod 验证

---

## 五、疑问澄清（存在歧义的地方）

### 5.1 已确认的问题

| 问题 | 答案 | 来源 |
|------|------|------|
| 文章列表是否需要分类筛选？ | ❌ 不需要，后续迭代 | 边界确认 |
| 文章是否需要草稿/发布状态？ | ✅ 需要（is_published 字段） | 行业标准 |
| 瀑布流布局如何实现？ | 使用 CSS Grid 或 Masonry.js | 技术选型 |
| 富文本编辑器是否支持图片上传？ | ✅ 支持，复用现有 multer 配置 | 现有功能 |
| 文章详情页是否需要侧边栏？ | ❌ 不需要，简洁布局 | Figma 风格 |

### 5.2 需要用户确认的问题

#### 问题 1：瀑布流布局实现方式

**选项 A**：纯 CSS Grid 实现（推荐）
- 优点：无需额外依赖，性能好
- 缺点：无法实现真正的瀑布流（高度不一致时会有空白）

**选项 B**：使用 Masonry.js 库
- 优点：真正的瀑布流效果，视觉效果更好
- 缺点：增加依赖，性能略差

**建议**：使用 CSS Grid，后续根据需求再优化

#### 问题 2：文章分类和标签管理

**选项 A**：简单实现（推荐）
- 分类和标签作为字符串字段存储
- 无需独立的分类/标签管理模块
- 适合文章数量较少的场景

**选项 B**：独立管理模块
- 创建独立的分类表和标签表
- 需要额外的管理界面
- 适合文章数量较多的场景

**建议**：采用选项 A，后续根据需求再扩展

#### 问题 3：文章封面图是否必填

**选项 A**：必填（推荐）
- 视觉效果更好，卡片展示更美观
- 符合现代 CMS 标准

**选项 B**：选填
- 使用默认占位图
- 降低发布门槛

**建议**：采用选项 A，后台编辑时提示用户上传封面图

---

## 六、智能决策策略

### 6.1 基于现有项目的决策

| 决策项 | 决策结果 | 依据 |
|--------|----------|------|
| 瀑布流实现 | CSS Grid | 项目无 Masonry.js 依赖，避免引入新依赖 |
| 分类标签管理 | 简单实现 | 文章数量少，无需独立模块 |
| 封面图 | 必填 | 视觉效果优先，符合 Figma 风格 |
| 富文本编辑器 | 复用 QuillEditor | 已有组件，避免重复开发 |
| API 路由 | `/api/articles` + `/api/admin/articles` | 参照 product-cards 路由设计 |
| 权限控制 | `content-management` 权限 | 复用现有权限模块 |

### 6.2 基于行业标准的决策

| 决策项 | 决策结果 | 依据 |
|--------|----------|------|
| 文章状态 | 草稿/已发布 | CMS 行业标准 |
| 浏览次数 | 记录但不展示 | 数据分析基础 |
| 发布时间 | 单独字段 | 区分创建时间和发布时间 |
| 软删除 | 不实现 | 文章数量少，直接物理删除 |

---

## 七、下一步行动

### 7.1 待用户确认

- [ ] 瀑布流布局实现方式（CSS Grid vs Masonry.js）
- [ ] 文章分类和标签管理方式（简单 vs 独立模块）
- [ ] 文章封面图是否必填

### 7.2 进入下一阶段

用户确认后，将进入 **阶段2: Architect (架构阶段)**，生成：
- `DESIGN_CMS功能完善.md` - 系统架构设计
- 包含数据库设计、API 设计、组件设计、路由设计

---

## 八、附录

### 8.1 参考文档

- [项目规则](../.trae/rules/project_rules.md)
- [个人规则](../.trae/rules/user_rules.md)
- [设计规范](../DESIGN.md)
- [样式变量使用指南](../DOCS/开发规范/样式变量使用指南.md)
- [编码规范](../DOCS/开发文档/编码规范.md)

### 8.2 相关代码文件

- `src/components/new-home/CmsArticleCard.vue` - 文章卡片组件
- `src/components/new-home/CmsContentSection.vue` - 文章内容区域
- `src/components/common/QuillEditor.vue` - 富文本编辑器
- `src/components/admin/content-management/ProductCardManagement.vue` - 产品卡片管理（参考）
- `routes/admin-product-cards.js` - 产品卡片 API（参考）
- `services/productCardService.js` - 产品卡片服务（参考）
- `migrations/add-product-cards.sql` - 数据库迁移脚本（参考）
