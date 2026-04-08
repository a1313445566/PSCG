-- ========================================
-- 产品卡片管理系统 - 数据库迁移脚本
-- 创建日期：2026-04-09
-- 版本：v1.0.0
-- 功能：创建 product_cards 表用于管理首页产品功能卡片
-- ========================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

SELECT '📦 开始执行产品卡片系统迁移脚本...' AS info;

-- ========================================
-- 第 1 步：创建产品卡片配置表
-- ========================================
CREATE TABLE IF NOT EXISTS product_cards (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '卡片ID',
  title VARCHAR(100) NOT NULL COMMENT '标题',
  description VARCHAR(200) DEFAULT NULL COMMENT '副标题/描述',
  icon_type ENUM('element-plus', 'custom') NOT NULL DEFAULT 'element-plus'
    COMMENT '图标类型：element-plus=内置图标, custom=自定义文件',
  icon_name VARCHAR(50) DEFAULT NULL COMMENT 'Element Plus 图标名称（如 Reading）',
  icon_url VARCHAR(255) DEFAULT NULL COMMENT '自定义图标URL路径（如 /images/custom-icon.png）',
  icon_class VARCHAR(50) DEFAULT NULL COMMENT '图标CSS类名（如 card-icon--purple）',
  link_type ENUM('route', 'url') NOT NULL DEFAULT 'route'
    COMMENT '链接类型：route=内部路由, url=外部URL',
  link_value VARCHAR(255) NOT NULL DEFAULT '/' COMMENT '跳转值（路由路径或完整URL）',
  tag VARCHAR(20) DEFAULT NULL COMMENT '标签（hot/new/recommended等）',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号（越小越靠前）',
  is_visible TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否可见（1=可见, 0=隐藏）',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  -- 索引优化
  INDEX idx_sort_order (sort_order),
  INDEX idx_is_visible (is_visible),
  INDEX idx_visible_sort (is_visible, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品卡片配置表';

SELECT '✅ 第 1 步完成：product_cards 表已创建' AS status;

-- ========================================
-- 第 2 步：插入默认产品卡片数据（初始化）
-- ========================================
INSERT IGNORE INTO product_cards (
  title, description, icon_type, icon_name,
  link_type, link_value, tag, sort_order, is_visible
) VALUES
(
  '课程管理', '在线课程学习中心', 'element-plus', 'Reading',
  'route', '/courses', NULL, 1, 1
),
(
  '班级管理', '班级信息与成员管理', 'element-plus', 'UserFilled',
  'route', '/classes', NULL, 2, 1
),
(
  '数据统计', '学习数据可视化分析', 'element-plus', 'DataAnalysis',
  'route', '/statistics', NULL, 3, 1
),
(
  'AI 辅导', '智能辅导学习助手', 'element-plus', 'Monitor',
  'route', '/ai-tutor', 'hot', 4, 1
),
(
  '智能推荐', '个性化学习内容推荐', 'element-plus', 'Star',
  'route', '/recommendations', NULL, 5, 1
),
(
  '知识图谱', '知识体系结构展示', 'element-plus', 'Share',
  'route', '/knowledge-graph', NULL, 6, 1
);

SELECT '✅ 第 2 步完成：已插入 6 条默认产品卡片数据' AS status;

-- ========================================
-- 部署验证
-- ========================================
SELECT '========================================' AS `sep`;
SELECT '🎉 产品卡片系统迁移完成！正在执行验证...' AS info;
SELECT '========================================' AS `sep`;

-- 验证 1：检查表是否存在
SELECT
  CASE WHEN COUNT(*) > 0 THEN '✅ 通过' ELSE '❌ 失败' END AS 表检查,
  CONCAT('product_cards 表: ', COUNT(*), ' 个字段') AS 详情
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_cards';

-- 验证 2：显示当前产品卡片数据
SELECT '----------------------------------------' AS `sep`;
SELECT '📊 当前产品卡片数据:' AS title;
SELECT '----------------------------------------' AS `sep`;

SELECT
  id,
  title AS 标题,
  icon_type AS 图标类型,
  icon_name AS 图标名称,
  link_type AS 链接类型,
  link_value AS 跳转地址,
  tag AS 标签,
  sort_order AS 排序,
  CASE is_visible WHEN 1 THEN '✓ 显示' ELSE '✗ 隐藏' END AS 可见状态,
  created_at AS 创建时间
FROM product_cards
ORDER BY sort_order ASC, id ASC;

SELECT '========================================' AS `sep`;
SELECT '🚀 迁移脚本执行完毕！' AS success;
SELECT '   提示：可在后台管理系统 → 内容管理系统 → 产品卡片管理 中进行编辑' AS tip;
SELECT '========================================' AS `sep`;
