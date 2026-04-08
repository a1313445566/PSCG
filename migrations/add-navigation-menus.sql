-- ========================================
-- 导航菜单管理系统 - 数据库迁移脚本
-- 创建日期：2026-04-09
-- 版本：v1.0
-- 功能：创建 navigation_menus 表用于管理前台导航栏菜单
-- ========================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

SELECT '📦 开始执行导航菜单系统迁移脚本...' AS info;

-- ========================================
-- 第 1 步：创建导航菜单配置表
-- ========================================
CREATE TABLE IF NOT EXISTS navigation_menus (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '菜单ID',
  name VARCHAR(100) NOT NULL COMMENT '菜单名称（用户自定义显示名）',
  type ENUM('route', 'link') NOT NULL DEFAULT 'route' 
    COMMENT '类型：route=内部路由路径，link=外部链接URL',
  path VARCHAR(500) NOT NULL COMMENT '路径（路由路径如 /new 或完整URL）',
  icon VARCHAR(50) COMMENT '图标名称（Element Plus 图标组件名，可选）',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号（数值越小越靠前，支持负数）',
  is_visible TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否可见（0=隐藏 1=显示）',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  -- 索引优化
  INDEX idx_sort_order (sort_order),
  INDEX idx_is_visible (is_visible),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='前台导航菜单配置表';

SELECT '✅ 第 1 步完成：navigation_menus 表已创建' AS status;

-- ========================================
-- 第 2 步：插入默认菜单数据（初始化）
-- ========================================
INSERT IGNORE INTO navigation_menus (name, type, path, icon, sort_order, is_visible) VALUES
('首页', 'route', '/new', 'HomeFilled', 1, 1),
('产品功能', 'route', '/', 'Grid', 2, 1),
('解决方案', 'route', '/', 'MagicStick', 3, 1),
('帮助中心', 'route', '/', 'QuestionFilled', 4, 1);

SELECT '✅ 第 2 步完成：已插入 4 条默认菜单数据' AS status;

-- ========================================
-- 部署验证
-- ========================================
SELECT '========================================' AS `sep`;
SELECT '🎉 导航菜单系统迁移完成！正在执行验证...' AS info;
SELECT '========================================' AS `sep`;

-- 验证 1：检查表是否存在
SELECT
  CASE WHEN COUNT(*) > 0 THEN '✅ 通过' ELSE '❌ 失败' END AS 表检查,
  CONCAT('navigation_menus 表: ', COUNT(*), ' 个字段') AS 详情
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'navigation_menus';

-- 验证 2：显示当前菜单数据
SELECT '----------------------------------------' AS `sep`;
SELECT '📊 当前导航菜单数据:' AS title;
SELECT '----------------------------------------' AS `sep`;

SELECT
  id,
  name AS 菜单名称,
  type AS 类型,
  path AS 路径,
  icon AS 图标,
  sort_order AS 排序,
  CASE is_visible WHEN 1 THEN '✓ 显示' ELSE '✗ 隐藏' END AS 状态,
  created_at AS 创建时间
FROM navigation_menus
ORDER BY sort_order ASC, id ASC;

SELECT '========================================' AS `sep`;
SELECT '🚀 迁移脚本执行完毕！' AS success;
SELECT '========================================' AS `sep`;
