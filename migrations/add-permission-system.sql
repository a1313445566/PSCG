-- ========================================
-- 管理员权限系统 - 数据库迁移脚本
-- 创建日期：2026-04-07
-- 版本：v2.1 (字符集修复版)
-- 修复内容：
--   1. 添加字段存在性检查，防止重复执行报错
--   2. 分离外键创建步骤，确保外键正确生效
--   3. 添加部署验证步骤
--   4. 修复字符集冲突问题（utf8mb4）
-- ========================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

SET @existing_database = CONVERT(DATABASE() USING utf8mb4);
SELECT CONCAT('📦 开始执行权限系统迁移脚本... 当前数据库: ', @existing_database) AS info;

-- ========================================
-- 第 1 步：创建角色表
-- ========================================
CREATE TABLE IF NOT EXISTS admin_roles (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '角色ID',
  name VARCHAR(50) NOT NULL UNIQUE COMMENT '角色名称',
  description VARCHAR(255) COMMENT '角色描述',
  permissions JSON NOT NULL COMMENT '权限配置（JSON格式）',
  is_preset TINYINT(1) DEFAULT 0 COMMENT '是否预设角色（0否 1是）',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  INDEX idx_is_preset (is_preset),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员角色表';

SELECT '✅ 第 1 步完成：admin_roles 表已就绪' AS status;

-- ========================================
-- 第 2 步：修改管理员表（添加字段和索引）
-- ========================================
-- 使用存储过程实现条件性添加字段（避免重复执行报错）
SET @sql = '';

-- 检查并添加 role_id 字段
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_credentials' AND COLUMN_NAME = 'role_id';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE admin_credentials ADD COLUMN role_id INT COMMENT ''角色ID'' AFTER password_hash',
  'SELECT ''role_id 字段已存在，跳过'' AS info');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 status 字段
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_credentials' AND COLUMN_NAME = 'status';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE admin_credentials ADD COLUMN status ENUM(''active'', ''disabled'') DEFAULT ''active'' COMMENT ''状态'' AFTER role_id',
  'SELECT ''status 字段已存在，跳过'' AS info');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 created_by 字段
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_credentials' AND COLUMN_NAME = 'created_by';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE admin_credentials ADD COLUMN created_by INT COMMENT ''创建人ID'' AFTER status',
  'SELECT ''created_by 字段已存在，跳过'' AS info');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 last_login_at 字段
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_credentials' AND COLUMN_NAME = 'last_login_at';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE admin_credentials ADD COLUMN last_login_at DATETIME COMMENT ''最后登录时间'' AFTER created_by',
  'SELECT ''last_login_at 字段已存在，跳过'' AS info');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 创建索引（如果不存在）
SELECT COUNT(*) INTO @idx_exists
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_credentials' AND INDEX_NAME = 'idx_role_id';

SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_role_id ON admin_credentials(role_id)',
  'SELECT ''idx_role_id 索引已存在，跳过'' AS info');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @idx_exists
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_credentials' AND INDEX_NAME = 'idx_status';

SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_status ON admin_credentials(status)',
  'SELECT ''idx_status 索引已存在，跳过'' AS info');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT '✅ 第 2 步完成：admin_credentials 表字段和索引已就绪' AS status;

-- ========================================
-- 第 3 步：创建外键约束（关键修复）
-- ========================================
-- 先删除可能存在的旧外键（防止重复创建失败）
SET @constraint_exists = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'admin_credentials'
  AND CONSTRAINT_NAME = 'fk_role'
);

SET @sql = IF(@constraint_exists > 0,
  'ALTER TABLE admin_credentials DROP FOREIGN KEY fk_role',
  'SELECT ''外键约束不存在，跳过删除'' AS info');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 创建新的外键约束
ALTER TABLE admin_credentials
ADD CONSTRAINT fk_role FOREIGN KEY (role_id)
REFERENCES admin_roles(id) ON DELETE SET NULL ON UPDATE CASCADE;

SELECT '✅ 第 3 步完成：外键约束 fk_role 已创建' AS status;

-- ========================================
-- 第 4 步：插入预设角色（如果不存在）
-- ========================================
INSERT IGNORE INTO admin_roles (name, description, permissions, is_preset) VALUES
(
  '超级管理员',
  '拥有所有权限的系统管理员，权限不可修改',
  '{
    "dashboard": {"view": true},
    "questions": {"view": true, "create": true, "edit": true, "delete": true, "batch": true},
    "subjects": {"view": true, "create": true, "edit": true, "delete": true},
    "grades-classes": {"view": true, "create": true, "edit": true, "delete": true},
    "user-stats": {"view": true},
    "recent-records": {"view": true},
    "user-management": {"view": true, "create": true, "edit": true, "delete": true},
    "data-analysis": {"view": true},
    "ai-chat": {"view": true},
    "ai-models": {"view": true, "create": true, "edit": true, "delete": true},
    "basic-settings": {"view": true, "edit": true},
    "database": {"view": true, "backup": true, "restore": true, "cleanup": true},
    "security": {"view": true, "block-ip": true, "unblock-ip": true},
    "admin-users": {"view": true, "create": true, "edit": true, "delete": true},
    "admin-roles": {"view": true, "create": true, "edit": true, "delete": true}
  }',
  1
),
(
  '普通管理员',
  '拥有部分权限的管理员',
  '{
    "dashboard": {"view": true},
    "questions": {"view": true, "create": true, "edit": true, "delete": false, "batch": false},
    "subjects": {"view": true, "create": false, "edit": false, "delete": false},
    "grades-classes": {"view": true, "create": false, "edit": false, "delete": false},
    "user-stats": {"view": true},
    "recent-records": {"view": true},
    "user-management": {"view": true, "create": false, "edit": false, "delete": false},
    "data-analysis": {"view": true},
    "ai-chat": {"view": false},
    "ai-models": {"view": false, "create": false, "edit": false, "delete": false},
    "basic-settings": {"view": true, "edit": false},
    "database": {"view": false, "backup": false, "restore": false, "cleanup": false},
    "security": {"view": false, "block-ip": false, "unblock-ip": false},
    "admin-users": {"view": false, "create": false, "edit": false, "delete": false},
    "admin-roles": {"view": false, "create": false, "edit": false, "delete": false}
  }',
  1
);

SELECT '✅ 第 4 步完成：预设角色已插入' AS status;

-- ========================================
-- 第 5 步：更新现有管理员的角色分配
-- ========================================
UPDATE admin_credentials
SET role_id = (SELECT id FROM admin_roles WHERE name = '超级管理员' LIMIT 1),
    status = 'active'
WHERE role_id IS NULL OR role_id = 0;

SELECT '✅ 第 5 步完成：现有管理员已分配角色' AS status;

-- ========================================
-- 部署验证（自动执行）
-- ========================================
SELECT '========================================' AS `sep`;
SELECT '🎉 权限系统迁移完成！正在执行验证...' AS info;
SELECT '========================================' AS `sep`;

-- 验证 1：检查表是否存在
SELECT
  CASE WHEN COUNT(*) > 0 THEN '✅ 通过' ELSE '❌ 失败' END AS 表检查,
  CONCAT('admin_roles 表: ', COUNT(*), ' 条记录') AS 详情
FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_roles'

UNION ALL

SELECT
  CASE WHEN COUNT(*) > 0 THEN '✅ 通过' ELSE '❌ 失败' END,
  CONCAT('admin_credentials 表: ', COUNT(*), ' 个字段')
FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_credentials';

-- 验证 2：检查外键约束
SELECT
  CASE WHEN COUNT(*) > 0 THEN '✅ 通过' ELSE '❌ 失败' END AS 外键检查,
  CONCAT('fk_role 外键: ', COUNT(*), ' 个约束') AS 详情
FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'admin_credentials'
AND CONSTRAINT_TYPE = 'FOREIGN KEY'
AND CONSTRAINT_NAME = 'fk_role';

-- 验证 3：检查管理员角色分配情况
SELECT
  CASE WHEN no_role_count = 0 THEN '✅ 通过' ELSE '⚠️ 警告' END AS 角色分配,
  CONCAT('未分配角色的管理员: ', no_role_count, ' 人') AS 详情
FROM (
  SELECT COUNT(*) as no_role_count
  FROM admin_credentials
  WHERE role_id IS NULL OR role_id = 0
) AS t;

-- 验证 4：显示当前数据摘要
SELECT '----------------------------------------' AS `sep`;
SELECT '📊 当前系统数据摘要:' AS title;
SELECT '----------------------------------------' AS `sep`;

SELECT
  r.id,
  r.name AS 角色名称,
  CASE r.is_preset WHEN 1 THEN '✓ 预设' ELSE '自定义' END AS 类型,
  COUNT(a.id) AS 管理员数量
FROM admin_roles r
LEFT JOIN admin_credentials a ON a.role_id = r.id
GROUP BY r.id, r.name, r.is_preset
ORDER BY r.id;

SELECT '========================================' AS `sep`;
SELECT '🚀 迁移脚本执行完毕！可以启动应用了！' AS success;
SELECT '========================================' AS `sep`;
