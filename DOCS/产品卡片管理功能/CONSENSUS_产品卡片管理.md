# CONSENSUS 文档 - 产品卡片管理功能

> 创建时间：2026-04-09 | 状态：已确认 ✅

---

## 一、需求确认（已达成共识）

### 1.1 功能范围
✅ **核心功能**：在后台内容管理系统视图中添加产品卡片管理功能

**可编辑字段**：
- 图标（Icon）- 支持两种方式：
  - Element Plus 图标（复用 `elementIconsConfig.js` 配置）
  - 自定义图标文件（public/images/ 下的 .png 或 .svg）
- 标题（Title）- 必填，最长 100 字符
- 副标题/描述（Description）- 可选，最长 200 字符
- 跳转链接（Link）- 支持两种类型：
  - 内部路由（如 `/courses`, `/quiz/:id`）
  - 外部 URL（如 `https://example.com`）
- 标签（Tag）- 可选（hot, new, recommended 等）
- 排序序号（Sort Order）- 数值，越小越靠前
- 可见状态（Visibility）- 开关控制

### 1.2 技术约束
- ✅ 前端必须使用 Vue 3 Composition API + `<script setup>`
- ✅ UI 组件优先使用 Element Plus
- ✅ HTTP 请求必须使用 `src/utils/api.js`
- ✅ 消息提示必须使用 `src/utils/message.js`
- ✅ 样式必须使用 SCSS 变量（禁止硬编码颜色值）
- ✅ 新接口必须使用 Zod 参数校验
- ✅ 统一响应格式：`{ success: true, data: {}, message: '' }`（基于 utils/response.js 实际实现）

### 1.3 业务规则
- ✅ 默认保留现有的 6 个产品卡片数据（自动迁移）
- ✅ 管理员可以增删改查产品卡片
- ✅ 删除操作需要二次确认
- ✅ 前台展示仅加载可见的卡片（is_visible = 1）
- ✅ 按 sort_order 升序排列

---

## 二、技术方案确认

### 2.1 数据库设计

#### 表名：`product_cards`

```sql
CREATE TABLE IF NOT EXISTS product_cards (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL COMMENT '标题',
  description VARCHAR(200) DEFAULT NULL COMMENT '副标题/描述',

  -- 图标相关字段（支持两种模式）
  icon_type ENUM('element-plus', 'custom') NOT NULL DEFAULT 'element-plus'
    COMMENT '图标类型：element-plus=内置图标, custom=自定义文件',
  icon_name VARCHAR(50) DEFAULT NULL COMMENT 'Element Plus 图标名称（如 Reading）',
  icon_url VARCHAR(255) DEFAULT NULL COMMENT '自定义图标URL路径（如 /images/custom-icon.png）',
  icon_class VARCHAR(50) DEFAULT NULL COMMENT '图标CSS类名（如 card-icon--purple）',

  -- 链接相关字段
  link_type ENUM('route', 'url') NOT NULL DEFAULT 'route'
    COMMENT '链接类型：route=内部路由, url=外部URL',
  link_value VARCHAR(255) NOT NULL DEFAULT '/'
    COMMENT '跳转值（路由路径或完整URL）',

  -- 展示相关字段
  tag VARCHAR(20) DEFAULT NULL COMMENT '标签（hot/new/recommended等）',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号（越小越靠前）',
  is_visible TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否可见（1=可见, 0=隐藏）',

  -- 时间戳
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  -- 索引
  INDEX idx_sort_order (sort_order),
  INDEX idx_is_visible (is_visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='产品卡片配置表';
```

#### 字段说明
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | VARCHAR(100) | ✅ | 卡片标题 |
| description | VARCHAR(200) | ❌ | 卡片副标题 |
| icon_type | ENUM | ✅ | 图标类型选择 |
| icon_name | VARCHAR(50) | 条件必填 | Element Plus 图标名称（icon_type='element-plus'时必填） |
| icon_url | VARCHAR(255) | 条件必填 | 自定义图标路径（icon_type='custom'时必填） |
| icon_class | VARCHAR(50) | ❌ | 图标样式类名 |
| link_type | ENUM | ✅ | 链接类型 |
| link_value | VARCHAR(255) | ✅ | 跳转目标地址 |
| tag | VARCHAR(20) | ❌ | 营销标签 |
| sort_order | INT | ✅ | 排序权重 |
| is_visible | TINYINT(1) | ✅ | 可见性开关 |

---

### 2.2 API 设计

#### RESTful 接口列表

```
# ============================================
# 前台接口（无需认证）
# ============================================
GET    /api/product-cards
       → 获取所有可见且排序后的产品卡片
       → Query: 无
       → Response: { code: 200, data: [{ id, title, description, icon_*, link_*, tag }] }

# ============================================
# 后台管理接口（需管理员认证）
# ============================================
GET    /api/admin/product-cards
       → 获取所有产品卡片（包含隐藏的）
       → Auth: Bearer Token (adminAuth middleware)
       → Permission: content-management.view
       → Response: { code: 200, data: [...] }

POST   /api/admin/product-cards
       → 创建新产品卡片
       → Body: { title, description?, icon_type, icon_name?, icon_url?, icon_class?, link_type, link_value, tag?, sort_order?, is_visible? }
       → Validation: Zod schema
       → Response: { code: 200, data: { id, ... } }

PUT    /api/admin/product-cards/:id
       → 更新指定产品卡片
       → Params: id (INT)
       → Body: 同 POST（所有字段可选）
       → Response: { code: 200, data: { id, ... } }

DELETE /api/admin/product-cards/:id
       → 删除指定产品卡片
       → Params: id (INT)
       → Response: { code: 200, msg: '删除成功' }

PUT    /api/admin/product-cards/sort
       → 批量更新排序
       → Body: { cards: [{ id, sort_order }] }
       → Response: { code: 200, msg: '排序更新成功' }

POST   /api/admin/product-cards/upload-icon
       → 上传自定义图标文件
       → FormData: file (image/png, image/svg+xml)
       → Response: { code: 200, data: { url: '/images/uploads/xxx.png' } }
```

#### Zod 校验 Schema（示例）

```javascript
// 创建产品卡片的校验规则
const createProductCardSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(200).optional(),
  icon_type: z.enum(['element-plus', 'custom']),
  icon_name: z.string().max(50).optional(), // icon_type='element-plus' 时必填
  icon_url: z.string().max(255).optional(), // icon_type='custom' 时必填
  icon_class: z.string().max(50).optional(),
  link_type: z.enum(['route', 'url']),
  link_value: z.string().min(1).max(255),
  tag: z.string().max(20).optional(),
  sort_order: z.number().int().default(0),
  is_visible: z.boolean().default(true)
}).refine(data => {
  // 条件校验：根据 icon_type 确定必填字段
  if (data.icon_type === 'element-plus' && !data.icon_name) {
    return false
  }
  if (data.icon_type === 'custom' && !data.icon_url) {
    return false
  }
  return true
}, {
  message: '图标名称或图标URL必须填写其中一个'
})
```

---

### 2.3 前端架构设计

#### 2.3.1 新增文件清单

```
src/
├── components/
│   └── admin/
│       └── content-management/          # 新建目录
│           └── ProductCardManagement.vue # 产品卡片管理组件（主文件）
├── composables/
│   └── useProductCards.js               # 新增：产品卡片 CRUD 组合式函数
├── views/
│   └── NewHomeView.vue                  # 修改：改为从 API 加载

routes/
├── admin-product-cards.js               # 新增：后端路由文件
services/
├── productCardService.js                # 新增：业务逻辑层
```

#### 2.3.2 组件层级关系

```
AdminView.vue
  └─ [activeMenu === 'product-card-management']
     └─ ProductCardManagement.vue（新增）
         ├─ el-table（卡片列表）
         │   ├─ 列：ID / 图标预览 / 标题 / 描述 / 链接类型 / 标签 / 排序 / 状态 / 操作
         │   └─ 操作按钮：编辑 / 删除
         ├─ el-dialog（编辑对话框）
         │   └─ el-form
         │       ├─ 标题输入框（el-input）
         │       ├─ 描述输入框（el-input textarea）
         │       ├─ 图标类型选择（el-radio-group）
         │       │   ├─ [element-plus] 图标选择器（el-popover + 图标网格）
         │       │   └─ [custom] 图标上传（el-upload）+ URL 输入
         │       ├─ 图标样式类（el-select）
         │       ├─ 链接类型（el-radio-group）
         │       │   ├─ [route] 路由路径选择器（el-select）
         │       │   └─ [url] URL 输入框（el-input）
         │       ├─ 标签输入（el-input）
         │       ├─ 排序序号（el-input-number）
         │       └─ 可见开关（el-switch）
         └─ 工具栏
             ├─ 添加按钮（el-button）
             └─ 刷新按钮（el-button）
```

#### 2.3.3 数据流图

```
┌─────────────────────────────────────────────────────────────┐
│                      前台展示流程                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  NewHomeView.vue                                           │
│      │                                                      │
│      ├── onMounted()                                        │
│      │      └─ api.get('/api/product-cards')                │
│      │              └─ 返回可见卡片列表                       │
│      │                                                      │
│      ├── productCards = ref(response.data)                  │
│      │                                                      │
│      └─ v-for 渲染                                          │
│             ├─ 动态解析图标                                  │
│             │   ├─ icon_type='element-plus'                  │
│             │   │   └─ getIconComponent(icon_name)          │
│             │   └─ icon_type='custom'                       │
│             │       └─ <img :src="icon_url">               │
│             ├─ 显示标题和描述                                │
│             └─ @click → 跳转处理                             │
│                 ├─ link_type='route' → router.push()        │
│                 └─ link_type='url' → window.open()         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      后台管理流程                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ProductCardManagement.vue                                  │
│      │                                                      │
│      ├── useProductCards() composable                       │
│      │      ├─ fetchCards() → GET /api/admin/product-cards │
│      │      ├─ createCard() → POST /api/admin/product-cards│
│      │      ├─ updateCard() → PUT /api/admin/product-cards │
│      │      └─ deleteCard() → DELETE ...                   │
│      │                                                      │
│      ├── 编辑对话框                                          │
│      │      ├─ 图标选择器                                    │
│      │      │   └─ 复用 elementIconsConfig.js              │
│      │      ├─ 图标上传                                      │
│      │      │   └─ POST /api/admin/product-cards/upload-icon│
│      │      └─ 表单提交                                      │
│      │          └─ Zod 校验 → API 调用                      │
│      │                                                      │
│      └─ 列表渲染                                             │
│           └─ el-table + 分页/排序/筛选                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.4 后端架构设计

#### 2.4.1 文件结构

```
routes/
└── admin-product-cards.js          # 路由定义 + 权限检查

services/
└── productCardService.js            # 业务逻辑层
    ├─ getVisibleCards()            # 获取可见卡片（前台用）
    ├─ getAllCards()                # 获取所有卡片（后台用）
    ├─ createCard(data)             # 创建卡片
    ├─ updateCard(id, data)         # 更新卡片
    ├─ deleteCard(id)               # 删除卡片
    ├─ updateSortOrder(cards)       # 批量更新排序
    └─ uploadIcon(file)             # 上传图标文件
```

#### 2.4.2 中间件和权限

```javascript
// 路由权限配置
router.get('/admin/product-cards', adminAuth, checkPermission('content-management', 'view'))
router.post('/admin/product-cards', adminAuth, checkPermission('content-management', 'edit'))
router.put('/admin/product-cards/:id', adminAuth, checkPermission('content-management', 'edit'))
router.delete('/admin/product-cards/:id', adminAuth, checkPermission('content-management', 'edit'))
```

> **注意**：如果权限系统暂未接入 `content-management` 模块，可暂时使用 `basic-settings` 模块权限或对所有管理员开放（后续再细化）。

---

### 2.5 初始数据迁移策略

#### 默认数据（6 个产品卡片）

在 `database.js` 的 `initTables()` 方法中添加初始化逻辑：

```javascript
// 初始化默认产品卡片数据
const defaultProductCards = [
  {
    title: '课程管理',
    description: '让课程管理更简单高效',
    icon_type: 'element-plus',
    icon_name: 'Reading',
    icon_class: null,
    link_type: 'route',
    link_value: '/courses',
    tag: null,
    sort_order: 1,
    is_visible: true
  },
  {
    title: '班级管理',
    description: '轻松管理班级信息',
    icon_type: 'element-plus',
    icon_name: 'UserFilled',
    icon_class: 'card-icon--purple',
    link_type: 'route',
    link_value: '/classes',
    tag: null,
    sort_order: 2,
    is_visible: true
  },
  // ... 其余 4 个卡片
]

// 仅在表为空时插入默认数据
const [cardCount] = await pool.execute(
  'SELECT COUNT(*) as count FROM product_cards'
)
if (cardCount[0].count === 0) {
  for (const card of defaultProductCards) {
    await pool.execute(
      'INSERT INTO product_cards SET ?', card
    )
  }
  console.log('✅ 已初始化默认产品卡片数据')
}
```

---

## 三、任务边界限制

### 3.1 ✅ 本期包含
- [x] 数据库表设计和创建
- [x] 后端 CRUD API 完整实现
- [x] 前端管理界面开发（列表 + 编辑对话框）
- [x] Element Plus 图标选择器（复用现有配置）
- [x] 自定义图标上传功能
- [x] 跳转链接配置（内部路由 + 外部 URL）
- [x] 前台页面改造（API 动态加载）
- [x] 初始数据自动迁移
- [x] 表单验证（Zod）
- [x] 权限控制（adminAuth 中间件）

### 3.2 ❌ 本期不包含
- [ ] 产品卡片拖拽排序 UI（仅提供手动输入排序号）
- [ ] ~~产品卡片点击跳转的前台逻辑实现（仅保存配置）~~ → ✅ **已更正：Task 7 将实现完整的点击跳转功能**，包括：
  - 内部路由跳转：使用 `router.push(link_value)`
  - 外部 URL 跳转：使用 `window.open(link_value, '_blank')`
  - 基于 `link_type` 字段自动判断跳转方式
- [ ] 图标缓存和性能优化
- [ ] 产品卡片版本历史记录
- [ ] 多语言支持（i18n）
- [ ] A/B 测试功能
- [ ] 批量导入/导出功能

---

## 四、验收标准

### 4.1 功能验收
- [ ] 管理员可以在后台查看所有产品卡片列表
- [ ] 管理员可以创建新的产品卡片（填写所有字段）
- [ ] 管理员可以编辑现有产品卡片的任何字段
- [ ] 管理员可以删除产品卡片（带二次确认）
- [ ] 图标选择器正常工作（Element Plus 图标 + 自定义上传）
- [ ] 跳转链接配置正确区分内部路由和外部 URL
- [ ] 前台页面正确显示从 API 加载的产品卡片
- [ ] 隐藏的产品卡片在前台不显示
- [ ] 排序功能正常（按 sort_order 升序）
- [ ] 初始数据自动迁移成功（首次启动时）

### 4.2 技术验收
- [ ] 所有 API 接口返回统一响应格式
- [ ] 所有入参经过 Zod 校验
- [ ] SQL 使用参数化查询（防注入）
- [ ] 无硬编码颜色值（使用 SCSS 变量）
- [ ] 无 ESLint 错误
- [ ] 无 Prettier 格式化问题
- [ ] 代码符合项目规范（Vue 3 + Composition API）
- [ ] Element Plus 图标显式导入
- [ ] 使用 `src/utils/api.js` 发起请求
- [ ] 使用 `src/utils/message.js` 显示提示

### 4.3 性能验收
- [ ] 前台页面加载时间 < 1s（含 API 请求）
- [ ] 后台列表查询 < 500ms
- [ ] 图标选择器响应流畅（无卡顿）
- [ ] 图片上传 < 3s（< 2MB 文件）

---

## 五、集成方案

### 5.1 与现有系统集成

#### 5.1.1 AdminView.vue 集成
```vue
<!-- 在内容管理系统模板中添加 -->
<template v-if="isContentManagement">
  <!-- 导航菜单管理 -->
  <NavigationManagement v-if="activeMenu === 'navigation-management'" />

  <!-- ✨ 新增：产品卡片管理 -->
  <ProductCardManagement
    v-else-if="activeMenu === 'product-card-management'"
  />

  <!-- 角色管理 -->
  <RoleManagement v-else-if="activeMenu === 'role-management'" />
  ...
</template>
```

#### 5.1.2 AdminSidebar.vue 菜单项
需要在侧边栏配置中添加菜单项：
```javascript
{
  id: 'product-card-management',
  title: '产品卡片管理',
  icon: 'Grid',  // 或其他合适图标
  path: '/admin/content-management/product-cards'
}
```

#### 5.1.3 NewHomeView.vue 改造
```vue
<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/utils/api'
import { getIconComponent } from '@/config/elementIconsConfig'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeCard = ref(null)
const productCards = ref([])

onMounted(async () => {
  try {
    const data = await api.get('/api/product-cards')
    productCards.value = data.map(card => ({
      ...card,
      // 动态解析图标组件
      icon: card.icon_type === 'element-plus'
        ? getIconComponent(card.icon_name)
        : null,
      iconUrl: card.icon_type === 'custom' ? card.icon_url : null
    }))
  } catch (error) {
    console.error('[NewHomeView] 加载产品卡片失败:', error)
    // 降级：显示空数组或默认数据
  }
})

const handleCardClick = (card) => {
  if (card.link_type === 'route') {
    router.push(card.link_value)
  } else if (card.link_type === 'url') {
    window.open(card.link_value, '_blank')
  }
}
</script>
```

---

## 六、风险和缓解措施

### 6.1 技术风险
| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 图标动态导入失败 | 前台无法显示图标 | 中 | try-catch + 降级显示文字 |
| 自定义图标路径错误 | 图片加载失败 | 低 | 上传前验证 + 默认占位图 |
| 数据库迁移失败 | 无法启动服务 | 低 | 事务回滚 + 详细日志 |
| 权限配置缺失 | 403 错误 | 中 | 先开放给超级管理员 |

### 6.2 业务风险
| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 误删重要卡片 | 前台展示缺失 | 中 | 二次确认 + 软删除（可选） |
| 配置无效路由 | 用户点击无反应 | 低 | 前台校验 + 提示信息 |
| 排序冲突 | 显示顺序混乱 | 低 | 唯一索引 + 自动调整 |

---

## 七、假设和依赖

### 7.1 技术假设
- ✅ MySQL 数据库已正常运行
- ✅ Express 服务器已配置 multer 中间件（用于文件上传）
- ✅ public/ 目录可写（用于存储上传的图标）
- ✅ Element Plus 图标配置文件 (`elementIconsConfig.js`) 已包含所需图标

### 7.2 业务假设
- ✅ 管理员已熟悉后台管理系统的基本操作
- ✅ 产品卡片数量预计不超过 20 个（性能考虑）
- ✅ 自定义图标文件大小 < 2MB

### 7.3 外部依赖
- ⚠️ 需要确认 `content-management` 权限模块是否已在权限系统中注册
- ⚠️ 需要确认 AdminSidebar 是否支持动态添加菜单项（或需手动修改配置）

---

## 八、后续优化方向（TODO）

### 8.1 短期优化（下一迭代）
- [ ] 拖拽排序功能（使用 SortableJS 或 vue-draggable）
- [ ] 产品卡片预览功能（编辑时实时预览效果）
- [ ] 图标搜索过滤（当图标数量较多时）
- [ ] 批量操作（批量启用/禁用/删除）

### 8.2 中期优化
- [ ] 产品卡片统计分析（点击率、转化率）
- [ ] A/B 测试支持（不同用户组显示不同卡片）
- [ ] 多语言标题和描述支持
- [ ] 卡片分组和分类功能

### 8.3 长期规划
- [ ] 可视化卡片编辑器（所见即所得）
- [ ] AI 智能推荐图标和文案
- [ ] 卡片模板市场（预设模板一键应用）
- [ ] 多端适配（移动端卡片布局优化）

---

## 九、文档元信息

| 项目 | 内容 |
|------|------|
| **文档版本** | v1.0 |
| **创建时间** | 2026-04-09 |
| **最后更新** | 2026-04-09 |
| **作者** | 6A 工作流系统 |
| **审核状态** | ✅ 已通过用户确认 |
| **关联文档** | ALIGNMENT_产品卡片管理.md, DESIGN_产品卡片管理.md, TASK_产品卡片管理.md |

---

## 十、签字确认

- ✅ **需求方确认**：用户已确认所有关键决策点
- ✅ **技术方案确认**：架构设计符合项目规范
- ✅ **边界确认**：任务范围清晰无歧义
- ✅ **验收标准明确**：可测试可量化

**下一步行动**：进入阶段 2 (Architect) - 架构设计
