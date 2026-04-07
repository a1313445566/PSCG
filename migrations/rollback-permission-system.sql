-- ========================================
-- 管理员权限系统 - 回滚脚本
-- 创建日期：2026-04-08
-- 版本：v1.0
-- 用途：撤销 add-permission-system.sql 的所有更改
-- 警告：执行前请务必备份数据库！
-- ========================================

SET @existing_database = DATABASE();
SELECT CONCAT('⚠️  开始执行权限系统回滚脚本... 当前数据库: ', @existing_database) AS warning;
SELECT '⚠️  此操作将删除角色表和相关字段！请确认已备份！' AS warning;

-- ========================================
-- 第 1 步：删除外键约束
-- ========================================
SELECT '📦 第 1 步：删除外键约束...' AS info;

SET @constraint_exists = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'admin_credentials' 
  AND CONSTRAINT_NAME = 'fk_role'
);

IF @constraint_exists > 0 THEN
  ALTER TABLE admin_credentials DROP FOREIGN KEY fk_role;
  SELECT '✅ 外键约束 fk_role 已删除' AS status;
ELSE
  SELECT 'ℹ️ 外键约束不存在，跳过' AS info;
END IF;

-- ========================================
-- 第 2 步：删除新增的字段和索引
-- ========================================
SELECT '📦 第 2 步：删除新增字段和索引...' AS info;

-- 删除索引
SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_credentials' AND INDEX_NAME = 'idx_role_id'
);

IF @idx_exists > 0 THEN
  DROP INDEX idx_role_id ON admin_credentials;
  SELECT '✅ 索引 idx_role_id 已删除' AS status;
END IF;

SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_credentials' AND INDEX_NAME = 'idx_status'
);

IF @idx_exists > 0 THEN
  DROP INDEX idx_status ON admin_credentials;
  SELECT '✅ 索引 idx_status 已删除' AS status;
END IF;

-- 删除字段（按逆序）
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_credentials' AND COLUMN_NAME = 'last_login_at'
);

IF @col_exists > 0 THEN
  ALTER TABLE admin_credentials DROP COLUMN last_login_at;
  SELECT '✅ 字段 last_login_at 已删除' AS status;
END IF;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_credentials' AND COLUMN_NAME = 'created_by'
);

IF @col_exists > 0 THEN
  ALTER TABLE admin_credentials DROP COLUMN created_by;
  SELECT '✅ 字段 created_by 已删除' AS status;
END IF;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_credentials' AND COLUMN_NAME = 'status'
);

IF @col_exists > 0 THEN
  ALTER TABLE admin_credentials DROP COLUMN status;
  SELECT '✅ 字段 status 已删除' AS status;
END IF;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_credentials' AND COLUMN_NAME = 'role_id'
);

IF @col_exists > 0 THEN
  ALTER TABLE admin_credentials DROP COLUMN role_id;
  SELECT '✅ 字段 role_id 已删除' AS status;
END IF;

SELECT '✅ 第 2 步完成：所有新增字段和索引已删除' AS status;

-- ========================================
-- 第 3 步：删除角色表
-- ========================================
SELECT '📦 第 3 步：删除角色表...' AS info;

SET @table_exists = (
  SELECT COUNT(*) FROM information_schema.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_roles'
);

IF @table_exists > 0 THEN
  DROP TABLE IF EXISTS admin_roles;
  SELECT '✅ admin_roles 表已删除' AS status;
ELSE
  SELECT 'ℹ️ admin_roles 表不存在，跳过' AS info;
END IF;

SELECT '✅ 第 3 步完成：角色表已删除' AS status;

-- ========================================
-- 回滚验证
-- ========================================
SELECT '========================================' AS separator;
SELECT '🔄 权限系统回滚完成！正在验证...' AS info;
SELECT '========================================' AS separator;

-- 验证 1：检查表是否已删除
SELECT 
  CASE WHEN COUNT(*) = 0 THEN '✅ 通过' ELSE '❌ 失败' END AS 表检查,
  CONCAT('admin_roles 表: ', CASE WHEN COUNT(*) = 0 THEN '已删除' ELSE '仍存在' END) AS 详情
FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_roles';

-- 验证 2：检查字段是否已删除
SELECT 
  CASE WHEN field_count = 0 THEN '✅ 通过' ELSE '❌ 失败' END AS 字段检查,
  CONCAT('新增字段残留: ', field_count, ' 个') AS 详情
FROM (
  SELECT COUNT(*) as field_count 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'admin_credentials' 
  AND COLUMN_NAME IN ('role_id', 'status', 'created_by', 'last_login_at')
) AS t;

-- 验证 3：检查外键是否已删除
SELECT 
  CASE WHEN COUNT(*) = 0 THEN '✅ 通过' ELSE '❌ 失败' END AS 外键检查,
  CONCAT('fk_role 外键: ', CASE WHEN COUNT(*) = 0 THEN '已删除' ELSE '仍存在' END) AS 详情
FROM information_schema.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'admin_credentials' 
AND CONSTRAINT_TYPE = 'FOREIGN KEY'
AND CONSTRAINT_NAME = 'fk_role';

-- 验证 4：显示当前表结构摘要
SELECT '----------------------------------------' AS separator;
SELECT '📊 当前 admin_credentials 表结构:' AS title;
SELECT '----------------------------------------' AS separator;

SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_credentials'
ORDER BY ORDINAL_POSITION;

SELECT '========================================' AS separator;
SELECT '✅ 回滚脚本执行完毕！系统已恢复到迁移前的状态！' AS success;
SELECT '========================================' AS separator;
