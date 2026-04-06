# MEMORY.md - 长期记忆

## 项目：PSCG 样式变量化改造

### 当前状态（2026-04-06）
- **总览文档**：`DOCS/需求文档/样式变量化改造方案.md`（v5.0 AI 执行优化版）
- **分文档**：用户端 v2.0 + 后台端 v2.0
- **Phase 1 变量补齐**：✅ 已完成（45+ 场景化变量）
- **Phase 0（Vite additionalData）**：⬜ 未执行
- **Phase 1.2（公共样式清理）**：⬜ 未执行
- **硬编码总量**：~1575 处（含公共样式 ~85 处）

### 关键发现
- `_question-management.scss` 硬编码 ~60 处（原方案未统计）
- `vite.config.js` 未配置 `additionalData`
- `package.json` 未配置 Stylelint
- 骨架屏变量 `$skeleton-base`/`$shimmer` 需新增

### AI 执行原则
- 严格按替换速查表执行，AI 不自行判断颜色语义
- 每文件改完立即编译验证
- 视觉验证必须人工
- 例外：rgba(0,0,0,0.x) 纯透明黑、SVG fill/stroke、:deep(.el-*)、功能性语义色、:style 动态绑定

### 用户偏好
- 倾向于「方案 A」（治本方案，一次做全）而非临时变通
- 文档修订偏好：直接改，不需要二次确认
