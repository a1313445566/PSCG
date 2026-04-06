# MEMORY.md - 长期记忆

## 项目：PSCG 样式变量化改造

### 当前状态（2026-04-07）
- **总览文档**：`DOCS/需求文档/样式变量化改造方案.md`（v5.1 间距/尺寸变量体系补全版）
- **分文档**：用户端 v2.1 + 后台端 v2.1
- **Phase 1（颜色变量补齐）**：✅ 已完成（~70 个场景化变量）
- **Phase 1.3（尺寸变量补齐）**：✅ 已完成（20 个变量：间距 5 + 字号 9 + 圆角 3 + 边框宽度 3）
- **Phase 0（Vite additionalData）**：⬜ 未执行
- **Phase 1.2（公共样式清理）**：⬜ 未执行
- **硬编码总量**：~1575 处颜色 + ~700+ 处尺寸

### 变量体系现状
- 颜色：~90 个 SCSS 变量 + ~60 个 CSS 变量（Phase 1 ✅）
- 间距：11 个（$spacing-2xs ~ $spacing-3xl + compact/comfortable/section）（Phase 1.3 ✅）
- 字号：9 个（$font-size-xs ~ $font-size-4xl）（Phase 1.3 ✅）
- 圆角：6 个（$border-radius-xs ~ $border-radius-full）（Phase 1.3 ✅）
- 边框宽度：3 个（$border-width, -md, -lg）（Phase 1.3 ✅）
- **注意**：$spacing-md = 16px（76+ 处引用，不可改动）

### 关键发现
- `_question-management.scss` 硬编码 ~60 处（原方案未统计）
- `vite.config.js` 未配置 `additionalData`
- `package.json` 未配置 Stylelint
- 骨架屏变量 `$skeleton-base`/`$shimmer` 需新增
- 尺寸硬编码 ~700+ 处（间距 ~350 + 字号 ~264 + 圆角 ~92 + 边框宽度 ~25）

### AI 执行原则
- 严格按替换速查表执行，AI 不自行判断颜色/尺寸语义
- 每文件改完立即编译验证
- 视觉验证必须人工
- 固定尺寸（width/height）和动画偏移量（transform）不替换
- 低频尺寸值（6/10/14px）保守处理
- 例外：rgba(0,0,0,0.x) 纯透明黑、SVG fill/stroke、:deep(.el-*)、功能性语义色、:style 动态绑定

### 用户偏好
- 倾向于「方案 A」（治本方案，一次做全）而非临时变通
- 文档修订偏好：直接改，不需要二次确认
