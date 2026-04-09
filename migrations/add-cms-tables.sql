-- ========================================
-- CMS 内容管理系统 - 数据库迁移脚本
-- 创建日期：2026-04-09
-- 版本：v1.0.0
-- 功能：创建 CMS 文章管理系统的数据库表结构
-- ========================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

SELECT '📦 开始执行 CMS 内容管理系统迁移脚本...' AS info;

-- ========================================
-- 第 1 步：创建分类表 (cms_categories)
-- ========================================
CREATE TABLE IF NOT EXISTS cms_categories (
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

SELECT '✅ 第 1 步完成：cms_categories 表已创建' AS status;

-- ========================================
-- 第 2 步：创建标签表 (cms_tags)
-- ========================================
CREATE TABLE IF NOT EXISTS cms_tags (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '标签ID',
  name VARCHAR(50) NOT NULL COMMENT '标签名称',
  slug VARCHAR(50) NOT NULL COMMENT '标签标识（用于URL）',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  -- 索引
  UNIQUE INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CMS标签表';

SELECT '✅ 第 2 步完成：cms_tags 表已创建' AS status;

-- ========================================
-- 第 3 步：创建文章表 (cms_articles)
-- ========================================
CREATE TABLE IF NOT EXISTS cms_articles (
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
  INDEX idx_category_id (category_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CMS文章表';

SELECT '✅ 第 3 步完成：cms_articles 表已创建' AS status;

-- ========================================
-- 第 4 步：创建文章-标签关联表 (cms_article_tags)
-- ========================================
CREATE TABLE IF NOT EXISTS cms_article_tags (
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

SELECT '✅ 第 4 步完成：cms_article_tags 表已创建' AS status;

-- ========================================
-- 第 5 步：插入默认分类数据
-- ========================================
INSERT IGNORE INTO cms_categories (name, slug, description, sort_order) VALUES
('学习技巧', 'learning-skills', '学习方法和技巧相关文章', 1),
('考试攻略', 'exam-strategies', '考试备考和应试策略', 2),
('教育资讯', 'education-news', '教育行业新闻和动态', 3),
('学科知识', 'subject-knowledge', '各学科知识点讲解', 4),
('成长故事', 'growth-stories', '学生成长经历分享', 5);

SELECT '✅ 第 5 步完成：已插入 5 个默认分类' AS status;

-- ========================================
-- 第 6 步：插入默认标签数据
-- ========================================
INSERT IGNORE INTO cms_tags (name, slug) VALUES
('学习方法', 'learning-methods'),
('时间管理', 'time-management'),
('考试技巧', 'exam-skills'),
('记忆技巧', 'memory-skills'),
('笔记方法', 'note-taking'),
('错题整理', 'error-collection'),
('学科辅导', 'subject-tutoring'),
('心理调节', 'psychological-adjustment'),
('目标规划', 'goal-planning'),
('效率提升', 'efficiency-improvement');

SELECT '✅ 第 6 步完成：已插入 10 个默认标签' AS status;

-- ========================================
-- 部署验证
-- ========================================
SELECT '========================================' AS `sep`;
SELECT '🎉 CMS 内容管理系统迁移完成！正在执行验证...' AS info;
SELECT '========================================' AS `sep`;

-- 验证 1：检查表是否存在
SELECT
  CASE WHEN COUNT(*) > 0 THEN '✅ 通过' ELSE '❌ 失败' END AS 表检查,
  CONCAT('cms_categories 表: ', COUNT(*), ' 个字段') AS 详情
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cms_categories';

SELECT
  CASE WHEN COUNT(*) > 0 THEN '✅ 通过' ELSE '❌ 失败' END AS 表检查,
  CONCAT('cms_tags 表: ', COUNT(*), ' 个字段') AS 详情
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cms_tags';

SELECT
  CASE WHEN COUNT(*) > 0 THEN '✅ 通过' ELSE '❌ 失败' END AS 表检查,
  CONCAT('cms_articles 表: ', COUNT(*), ' 个字段') AS 详情
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cms_articles';

SELECT
  CASE WHEN COUNT(*) > 0 THEN '✅ 通过' ELSE '❌ 失败' END AS 表检查,
  CONCAT('cms_article_tags 表: ', COUNT(*), ' 个字段') AS 详情
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cms_article_tags';

-- 验证 2：显示当前分类数据
SELECT '----------------------------------------' AS `sep`;
SELECT '📊 当前分类数据:' AS title;
SELECT '----------------------------------------' AS `sep`;

SELECT
  id,
  name AS 分类名称,
  slug AS 标识,
  description AS 描述,
  sort_order AS 排序
FROM cms_categories
ORDER BY sort_order ASC, id ASC;

-- 验证 3：显示当前标签数据
SELECT '----------------------------------------' AS `sep`;
SELECT '📊 当前标签数据:' AS title;
SELECT '----------------------------------------' AS `sep`;

SELECT
  id,
  name AS 标签名称,
  slug AS 标识
FROM cms_tags
ORDER BY id ASC;

-- 验证 4：检查外键约束
SELECT '----------------------------------------' AS `sep`;
SELECT '🔗 外键约束检查:' AS title;
SELECT '----------------------------------------' AS `sep`;

SELECT
  TABLE_NAME AS 表名,
  COLUMN_NAME AS 列名,
  REFERENCED_TABLE_NAME AS 引用表,
  REFERENCED_COLUMN_NAME AS 引用列
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('cms_articles', 'cms_article_tags')
  AND REFERENCED_TABLE_NAME IS NOT NULL;

SELECT '========================================' AS `sep`;
SELECT '🚀 迁移脚本执行完毕！' AS success;
SELECT '   提示：可在后台管理系统 → 内容管理系统 中进行文章管理' AS tip;
SELECT '   用户端导航：通过"导航菜单管理"添加"文章中心"菜单' AS tip2;
SELECT '========================================' AS `sep`;
