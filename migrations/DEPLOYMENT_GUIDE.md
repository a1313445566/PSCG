# 权限系统部署指南

## 📦 文件清单

| 文件名 | 用途 | 状态 |
|--------|------|------|
| `add-permission-system.sql` | 迁移脚本（v2.0 修复版） | ✅ 已就绪 |
| `rollback-permission-system.sql` | 回滚脚本 | ✅ 已就绪 |

---

## 🚀 部署步骤

### 1️⃣ 备份数据库（必须）

```bash
# Linux/Mac
mysqldump -u root -p pscg > backup_$(date +%Y%m%d_%H%M%S).sql

# Windows (PowerShell)
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
mysqldump -u root -p pscg > "backup_$timestamp.sql"
```

### 2️⃣ 执行迁移脚本

```bash
mysql -u root -p pscg < migrations/add-permission-system.sql
```

**预期输出**：
```
📦 开始执行权限系统迁移脚本... 当前数据库: pscg
✅ 第 1 步完成：admin_roles 表已就绪
✅ 第 2 步完成：admin_credentials 表字段和索引已就绪
✅ 第 3 步完成：外键约束 fk_role 已创建
✅ 第 4 步完成：预设角色已插入
✅ 第 5 步完成：现有管理员已分配角色
========================================
🎉 权限系统迁移完成！正在执行验证...
========================================
✅ 通过 | admin_roles 表: 2 条记录
✅ 通过 | admin_credentials 表: 10 个字段
✅ 通过 | fk_role 外键: 1 个约束
✅ 通过 | 未分配角色的管理员: 0 人
📊 当前系统数据摘要:
1 | 超级管理员 | ✓ 预设 | 1
2 | 普通管理员 | ✓ 预设 | 0
========================================
🚀 迁移脚本执行完毕！可以启动应用了！
========================================
```

### 3️⃣ 验证部署结果

登录管理后台，检查：
- [ ] 能正常登录
- [ ] 角色管理页面显示"超级管理员"和"普通管理员"两个预设角色
- [ ] 默认管理员账号拥有所有权限
- [ ] 可以创建新管理员并分配角色

---

## ⚠️ 回滚操作（如果出现问题）

```bash
# 执行回滚脚本
mysql -u root -p pscg < migrations/rollback-permission-system.sql
```

**预期输出**：
```
⚠️  开始执行权限系统回滚脚本... 当前数据库: pscg
⚠️  此操作将删除角色表和相关字段！请确认已备份！
✅ 外键约束 fk_role 已删除
✅ 字段 role_id/status/created_by/last_login_at 已删除
✅ admin_roles 表已删除
========================================
🔄 权限系统回滚完成！正在验证...
========================================
✅ 通过 | admin_roles 表: 已删除
✅ 通过 | 新增字段残留: 0 个
✅ 通过 | fk_role 外键: 已删除
✅ 回滚脚本执行完毕！系统已恢复到迁移前的状态！
========================================
```

---

## 🔧 常见问题排查

### 问题 1：外键创建失败

**错误信息**：
```
ERROR 1824 (HY000): Failed to open the referenced table 'admin_roles'
```

**解决方案**：
1. 确保 `admin_roles` 表在第 1 步成功创建
2. 检查表是否存在：`SHOW TABLES LIKE 'admin_roles';`
3. 如果表不存在，手动创建后再执行第 3 步

### 问题 2：字段已存在导致 ALTER TABLE 失败

**错误信息**：
```
ERROR 1060 (42S21): Duplicate column name 'role_id'
```

**说明**：这是正常的，v2.0 版本已经处理了这种情况。

**解决方案**：
- 脚本会自动检测并跳过已存在的字段
- 如果仍然报错，可以手动注释掉对应的 ALTER TABLE 语句

### 问题 3：权限不生效

**症状**：登录后看不到菜单或提示"权限不足"

**排查步骤**：

```sql
-- 检查管理员是否分配了角色
SELECT id, username, role_id, status FROM admin_credentials;

-- 检查角色是否存在
SELECT * FROM admin_roles;

-- 检查外键是否生效
SELECT * FROM information_schema.TABLE_CONSTRAINTS 
WHERE TABLE_NAME = 'admin_credentials' AND CONSTRAINT_TYPE = 'FOREIGN KEY';
```

**常见原因及解决**：
| 原因 | 解决方案 |
|------|----------|
| 管理员 role_id 为 NULL | 手动更新：`UPDATE admin_credentials SET role_id = 1 WHERE username = 'admin'` |
| 角色表为空 | 重新执行迁移脚本的第 4 步 |
| 外键缺失 | 重新执行迁移脚本的第 3 步 |

---

## 📊 数据库变更摘要

### 新增的表

**admin_roles** - 管理员角色表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT PK | 自增主键 |
| name | VARCHAR(50) UNIQUE | 角色名称 |
| description | VARCHAR(255) | 角色描述 |
| permissions | JSON | 权限配置 |
| is_preset | TINYINT(1) | 是否预设角色 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 修改的表

**admin_credentials** - 管理员凭证表

新增字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| role_id | INT FK | 关联角色ID |
| status | ENUM | 状态(active/disabled) |
| created_by | INT | 创建人ID |
| last_login_at | DATETIME | 最后登录时间 |

新增索引：

| 索引名 | 字段 | 用途 |
|--------|------|------|
| idx_role_id | role_id | 加速按角色查询 |
| idx_status | status | 加速按状态查询 |

新增外键：

| 约束名 | 字段 | 引用 | 删除策略 |
|--------|------|------|----------|
| fk_role | role_id | admin_roles(id) | SET NULL |

---

## ✅ 部署检查清单

- [ ] 已备份数据库
- [ ] 已在测试环境验证通过
- [ ] 已确认 MySQL 版本 ≥ 5.7（支持 JSON 类型）
- [ ] 已确认数据库字符集为 utf8mb4
- [ ] 已通知相关人员维护窗口时间
- [ ] 已准备好回滚方案
- [ ] 已记录当前数据库版本号（用于对比）

---

## 🎯 性能影响评估

| 操作 | 影响 | 说明 |
|------|------|------|
| 表结构修改 | 低 | 仅添加字段，无锁表风险 |
| 索引创建 | 低 | 小表，秒级完成 |
| 外键添加 | 中 | 可能短暂锁定写入 |
| 数据插入 | 低 | 仅 2 条预设角色 |
| **总体评估** | ✅ **可接受** | 预计总耗时 < 5 秒 |

---

## 📞 技术支持

如遇到问题，请提供以下信息：

1. **MySQL 版本**：`SELECT VERSION();`
2. **完整错误日志**
3. **执行的 SQL 及行号**
4. **当前表结构**：`DESCRIBE admin_credentials;`

---

**版本历史**：
- v1.0 (2026-04-07): 初始版本
- v2.0 (2026-04-08): 修复版（添加幂等性、外键验证、自动回滚）
