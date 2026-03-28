-- =====================================================
-- 创建学习进度表
-- 文件: scripts/create_learning_progress.sql
-- 功能: 存储用户各知识点的学习进度和AI建议
-- 创建时间: 2026-03-28
-- =====================================================

USE pscg;

-- 检查表是否存在
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_schema = 'pscg' 
AND table_name = 'learning_progress';

-- 创建表
CREATE TABLE IF NOT EXISTS learning_progress (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  user_id INT NOT NULL COMMENT '用户ID',
  subject_id INT NOT NULL COMMENT '学科ID',
  subcategory_id INT NOT NULL COMMENT '子分类ID',
  mastery_level INT DEFAULT 0 COMMENT '掌握程度(0-100)',
  total_attempts INT DEFAULT 0 COMMENT '总尝试次数',
  correct_attempts INT DEFAULT 0 COMMENT '正确次数',
  last_practiced_at DATETIME COMMENT '最后练习时间',
  ai_suggestion TEXT COMMENT 'AI学习建议',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY unique_user_subcategory (user_id, subcategory_id),
  INDEX idx_user_id (user_id),
  INDEX idx_subject_id (subject_id),
  INDEX idx_last_practiced (last_practiced_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习进度表';

-- 验证表创建
DESC learning_progress;
