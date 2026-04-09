# CMS功能完善 - 共识文档 (CONSENSUS)

> 创建日期：2026-04-09
> 基于对齐文档：ALIGNMENT_CMS功能完善.md
> 用户确认时间：2026-04-09

---

## 一、需求描述

### 1.1 核心需求

完善CMS（内容管理系统）功能，实现文章的完整生命周期管理，包括：

1. **用户端功能**：
   - 文章列表页：使用 CSS Grid 实现瀑布流布局，展示已发布的文章卡片
   - 文章详情页：展示文章完整内容，支持富文本渲染

2. **后台管理功能**：
   - 文章管理：CRUD 操作，支持富文本编辑
   - 分类管理：独立的分类管理模块
   - 标签管理：独立的标签管理模块

3. **数据存储**：
   - 文章表：存储文章基本信息和内容
   - 分类表：存储文章分类
   - 标签表：存储文章标签
   - 文章-标签关联表：多对多关系

### 1.2 用户决策记录

| 决策项 | 用户选择 | 说明 |
|--------|----------|------|
| 瀑布流布局 | CSS Grid | 无需额外依赖，性能好 |
| 分类标签管理 | 独立管理模块 | 需要创建独立的分类表、标签表、关联表 |
| 封面图要求 | 选填 | 提供默认占位图，降低发布门槛 |

---

## 二、技术实现方案

### 2.1 数据库设计

#### 2.1.1 文章表 (cms_articles)

```sql
CREATE TABLE cms_articles (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '文章ID',
  title VARCHAR(200) NOT NULL COMMENT '标题',
  summary VARCHAR(500) DEFAULT NULL COMMENT '摘要',
  content LONGTEXT COMMENT '内容（HTML格式）',
  thumbnail VARCHAR(255) DEFAULT NULL COMMENT '封面图URL',
  author VARCHAR(50) DEFAULT NULL COMMENT '作者',
  category_id INT DEFAULT NULL COMMENT '分类ID',
  view_count INT NOT NULL DEFAULT 0 COMMENT '浏览次数',
  is_published TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否发布（0=草稿, 1=已发布）',
  published_at DATETIME DEFAULT NULL COMMENT '发布时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  -- 外键
  FOREIGN KEY (category_id) REFERENCES cms_categories(id) ON DELETE SET NULL,
  
  -- 索引优化
  INDEX idx_is_published (is_published),
  INDEX idx_published_at (published_at),
  INDEX idx_category_id (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CMS文章表';
```

#### 2.1.2 分类表 (cms_categories)

```sql
CREATE TABLE cms_categories (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '分类ID',
  name VARCHAR(50) NOT NULL COMMENT '分类名称',
  slug VARCHAR(50) NOT NULL COMMENT '分类标识（用于URL）',
  description VARCHAR(200) DEFAULT NULL COMMENT '分类描述',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  -- 索引
  UNIQUE INDEX idx_slug (slug),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CMS分类表';
```

#### 2.1.3 标签表 (cms_tags)

```sql
CREATE TABLE cms_tags (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '标签ID',
  name VARCHAR(50) NOT NULL COMMENT '标签名称',
  slug VARCHAR(50) NOT NULL COMMENT '标签标识（用于URL）',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  -- 索引
  UNIQUE INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CMS标签表';
```

#### 2.1.4 文章-标签关联表 (cms_article_tags)

```sql
CREATE TABLE cms_article_tags (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
  article_id INT NOT NULL COMMENT '文章ID',
  tag_id INT NOT NULL COMMENT '标签ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  
  -- 外键
  FOREIGN KEY (article_id) REFERENCES cms_articles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES cms_tags(id) ON DELETE CASCADE,
  
  -- 索引
  UNIQUE INDEX idx_article_tag (article_id, tag_id),
  INDEX idx_tag_id (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CMS文章-标签关联表';
```

### 2.2 API 设计

#### 2.2.1 公开接口（用户端）

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | `/api/articles` | 获取文章列表 | `page`, `pageSize`, `categoryId` |
| GET | `/api/articles/:id` | 获取文章详情 | - |
| GET | `/api/categories` | 获取分类列表 | - |
| GET | `/api/tags` | 获取标签列表 | - |

#### 2.2.2 管理接口（后台）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/admin/articles` | 获取所有文章（含草稿） | `content-management.view` |
| POST | `/api/admin/articles` | 创建文章 | `content-management.edit` |
| PUT | `/api/admin/articles/:id` | 更新文章 | `content-management.edit` |
| DELETE | `/api/admin/articles/:id` | 删除文章 | `content-management.edit` |
| POST | `/api/admin/articles/upload-thumbnail` | 上传封面图 | `content-management.edit` |
| GET | `/api/admin/categories` | 获取所有分类 | `content-management.view` |
| POST | `/api/admin/categories` | 创建分类 | `content-management.edit` |
| PUT | `/api/admin/categories/:id` | 更新分类 | `content-management.edit` |
| DELETE | `/api/admin/categories/:id` | 删除分类 | `content-management.edit` |
| GET | `/api/admin/tags` | 获取所有标签 | `content-management.view` |
| POST | `/api/admin/tags` | 创建标签 | `content-management.edit` |
| PUT | `/api/admin/tags/:id` | 更新标签 | `content-management.edit` |
| DELETE | `/api/admin/tags/:id` | 删除标签 | `content-management.edit` |

### 2.3 前端路由设计

#### 2.3.1 用户端路由

| 路径 | 组件 | 说明 |
|------|------|------|
| `/articles` | `ArticlesView.vue` | 文章列表页（瀑布流） |
| `/articles/:id` | `ArticleDetailView.vue` | 文章详情页 |

#### 2.3.2 后台路由

后台管理通过 `AdminView.vue` 的动态组件加载，新增以下管理页面：
- 文章管理：`ArticleManagement.vue`
- 分类管理：`CategoryManagement.vue`
- 标签管理：`TagManagement.vue`

### 2.4 组件设计

#### 2.4.1 用户端组件

| 组件 | 文件路径 | 说明 | 复用情况 |
|------|----------|------|----------|
| CmsArticleCard | `src/components/new-home/CmsArticleCard.vue` | 文章卡片 | ✅ 已存在，修改点击事件 |
| ArticlesView | `src/views/ArticlesView.vue` | 文章列表页 | 🆕 新建 |
| ArticleDetailView | `src/views/ArticleDetailView.vue` | 文章详情页 | 🆕 新建 |

#### 2.4.2 后台管理组件

| 组件 | 文件路径 | 说明 | 复用情况 |
|------|----------|------|----------|
| ArticleManagement | `src/components/admin/content-management/ArticleManagement.vue` | 文章管理 | 🆕 新建，参照 ProductCardManagement |
| CategoryManagement | `src/components/admin/content-management/CategoryManagement.vue` | 分类管理 | 🆕 新建 |
| TagManagement | `src/components/admin/content-management/TagManagement.vue` | 标签管理 | 🆕 新建 |
| QuillEditor | `src/components/common/QuillEditor.vue` | 富文本编辑器 | ✅ 已存在，直接复用 |

---

## 三、技术约束与集成方案

### 3.1 技术约束

| 约束项 | 约束内容 | 原因 |
|--------|----------|------|
| 样式规范 | 必须使用 SCSS 变量，禁止硬编码 | 项目规则 v3.0 强制要求 |
| API 规范 | 前端使用 `@/utils/api.js`，后端使用 `utils/response.js` | 项目规则强制要求 |
| 参数校验 | 新增接口必须使用 Zod | 项目规则强制要求 |
| 富文本编辑 | 复用 `QuillEditor.vue` | 避免重复开发 |
| 图片上传 | 复用现有 `multer` 配置，限制 2MB | 现有功能约束 |
| 权限控制 | 使用 `adminAuth` 中间件 + `content-management` 权限 | 现有权限系统约束 |

### 3.2 集成方案

#### 3.2.1 与现有系统集成

| 集成点 | 集成方案 | 影响范围 |
|--------|----------|----------|
| 新首页 | 修改 `CmsContentSection.vue` 调用真实 API | `src/views/NewHomeView.vue` |
| 后台导航 | 在后台侧边栏添加"内容管理"菜单 | `src/components/admin/layout/AdminSidebar.vue` |
| 权限系统 | 复用 `content-management` 权限模块 | `middleware/adminAuth.js` |
| 文件上传 | 复用 `multer` 配置，添加封面图上传接口 | `routes/upload.js` |

#### 3.2.2 数据迁移

1. **初始化数据**：
   - 创建迁移脚本：`migrations/add-cms-tables.sql`
   - 插入默认分类：学习技巧、考试攻略、教育资讯等
   - 插入默认标签：学习方法、时间管理、考试技巧等

2. **Mock 数据处理**：
   - 保留 `mockCmsData.js` 作为开发测试数据
   - 生产环境使用真实数据库数据

---

## 四、任务边界限制

### 4.1 包含范围

✅ **必须实现**：

1. **数据库层**：
   - 创建 4 张表：`cms_articles`, `cms_categories`, `cms_tags`, `cms_article_tags`
   - 添加索引和外键约束
   - 插入默认分类和标签数据

2. **后端 API**：
   - 实现所有公开接口（4个）
   - 实现所有管理接口（13个）
   - 参数校验（Zod）
   - 权限控制（adminAuth + content-management）

3. **前端 - 用户端**：
   - 文章列表页（瀑布流布局）
   - 文章详情页（富文本渲染）
   - 路由配置

4. **前端 - 后台管理**：
   - 文章管理组件（CRUD + 富文本编辑）
   - 分类管理组件（CRUD）
   - 标签管理组件（CRUD）
   - 后台导航菜单更新

5. **样式规范**：
   - 用户端：遵循 Figma 设计风格
   - 后台端：遵循现有后台管理风格
   - 必须使用 SCSS 变量

### 4.2 不包含范围

❌ **明确排除**：

1. 文章评论功能
2. 文章点赞功能
3. 文章分享功能
4. 文章搜索功能（后续迭代）
5. 文章推荐算法（后续迭代）
6. 文章浏览历史记录
7. 文章作者个人主页
8. 文章 RSS 订阅
9. 文章导出功能（PDF/Word）

### 4.3 边界约束

| 约束项 | 约束值 | 说明 |
|--------|--------|------|
| 文章数量 | < 100 篇 | 初期规模 |
| 分类数量 | < 20 个 | 避免过度细分 |
| 标签数量 | < 50 个 | 避免标签泛滥 |
| 图片大小 | ≤ 2MB | 复用现有 multer 配置 |
| 富文本内容 | 仅文本、图片、链接 | 不支持视频上传 |
| 分页大小 | 默认 12 条 | 列表接口必须分页 |
| 权限要求 | `content-management` 权限 | 仅管理员可编辑 |
| 默认封面图 | `src/assets/images/backgrounds/article-placeholder-{1-4}.png` | 文章无封面时随机使用 |

### 4.4 静态资源路径

| 资源类型 | 路径 | 说明 |
|----------|------|------|
| 文章占位图 | `src/assets/images/backgrounds/article-placeholder-{1-4}.png` | 4 张占位图，随机使用 |
| 文章封面图 | `public/images/uploads/article-{timestamp}.jpg` | 用户上传的封面图 |

### 4.5 导航栏实现方案

#### 用户端导航栏

**组件文件**：`src/components/new-home/FigmaHeader.vue`

**实现方式**：
- ✅ **无需修改代码**
- 通过后台"导航菜单管理"添加菜单项
- 菜单数据从数据库 `navigation_menus` 表动态加载

**操作步骤**：
1. 登录后台管理系统
2. 进入"内容管理" → "导航菜单管理"
3. 添加新菜单项：
   - 名称：`文章中心`
   - 类型：`route`
   - 路径：`/articles`
   - 排序：`4`

#### 后台导航栏

**组件文件**：
- `src/components/admin/layout/AdminSidebar.vue` - 侧边栏菜单
- `src/views/AdminView.vue` - 主视图组件加载

**实现方式**：
- ⚠️ **需要修改代码**
- 在 `AdminSidebar.vue` 的 `menuTreeData` computed 属性中添加菜单项
- 在 `AdminView.vue` 中添加组件加载逻辑
- 需要导入新图标：`PriceTag`（标签图标）

---

## 五、验收标准

### 5.1 功能验收标准

| 功能模块 | 验收标准 | 测试方法 |
|----------|----------|----------|
| 文章列表页 | 1. 瀑布流布局正常显示<br>2. 分页功能正常<br>3. 点击卡片跳转到详情页 | 手动测试 |
| 文章详情页 | 1. 文章内容正确渲染<br>2. 富文本样式正常<br>3. 浏览次数 +1 | 手动测试 |
| 文章管理 | 1. CRUD 功能正常<br>2. 富文本编辑器正常<br>3. 封面图上传正常<br>4. 分类和标签选择正常 | 手动测试 |
| 分类管理 | 1. CRUD 功能正常<br>2. 排序功能正常 | 手动测试 |
| 标签管理 | 1. CRUD 功能正常 | 手动测试 |
| 权限控制 | 1. 未登录无法访问管理接口<br>2. 无权限返回 403 | API 测试 |

### 5.2 技术验收标准

| 验收项 | 验收标准 | 检查方法 |
|--------|----------|----------|
| 代码规范 | ESLint 无错误，Prettier 格式化完成 | `npm run lint` |
| 样式规范 | 无硬编码颜色、间距、字号 | 代码审查 |
| API 规范 | 使用统一响应格式，参数校验完整 | 代码审查 |
| 数据库规范 | 表结构正确，索引完整，外键约束正常 | SQL 验证 |
| 性能要求 | 列表接口响应时间 < 500ms | 性能测试 |
| 安全要求 | 无 SQL 注入，无 XSS 漏洞 | 安全测试 |

### 5.3 文档验收标准

| 文档类型 | 验收标准 |
|----------|----------|
| 数据库迁移脚本 | 包含完整的建表语句、索引、默认数据、验证脚本 |
| API 文档 | 更新 `DOCS/API 文档/` 目录，包含所有新增接口 |
| 使用指南 | 更新 `DOCS/使用指南/` 目录，添加 CMS 使用说明 |

---

## 六、风险与应对

### 6.1 技术风险

| 风险项 | 影响 | 应对措施 |
|--------|------|----------|
| 瀑布流布局兼容性 | CSS Grid 在旧浏览器不支持 | 提供降级方案（单列布局） |
| 富文本 XSS 攻击 | 用户输入恶意代码 | 使用 `xss-filter.js` 过滤 |
| 图片上传失败 | 文件过大或格式不支持 | 前端验证 + 后端验证 |
| 数据库外键约束 | 删除分类时文章关联失效 | 使用 `ON DELETE SET NULL` |

### 6.2 业务风险

| 风险项 | 影响 | 应对措施 |
|--------|------|----------|
| 分类过多导致用户困惑 | 用户体验下降 | 限制分类数量，提供默认分类 |
| 标签滥用 | 标签失去意义 | 后台审核标签，限制标签数量 |
| 文章内容质量低 | 平台形象受损 | 后台审核机制（后续迭代） |

---

## 七、确认声明

### 7.1 需求确认

- ✅ 所有需求已明确，无歧义
- ✅ 任务边界清晰，不包含范围已确认
- ✅ 技术方案可行，符合项目规范
- ✅ 验收标准具体可测试

### 7.2 不确定性解决

- ✅ 瀑布流布局实现方式：CSS Grid
- ✅ 分类标签管理方式：独立管理模块
- ✅ 封面图要求：选填（提供默认占位图）
- ✅ 所有技术选型已确认

### 7.3 下一步行动

进入 **阶段2: Architect (架构阶段)**，生成：
- `DESIGN_CMS功能完善.md` - 系统架构设计
- 包含详细的数据库设计、API 设计、组件设计、路由设计

---

## 八、附录

### 8.1 参考文档

- [对齐文档](./ALIGNMENT_CMS功能完善.md)
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
