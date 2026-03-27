-- AI 自然语言分析数据增强 - 数据库迁移
-- 版本: v1.0
-- 日期: 2026-03-27
-- 说明: 创建题目语义分析、用户行为分析、学习风格分析相关表

-- ============================================
-- 第一部分：创建新表
-- ============================================

-- 1. 题目语义分析表
CREATE TABLE IF NOT EXISTS question_semantic_analysis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL UNIQUE COMMENT '题目ID',
  
  -- 关键词和标签
  keywords JSON COMMENT '关键词列表，如：["分数", "加减法"]',
  auto_tags JSON COMMENT 'AI自动标签，如：[{"name": "计算题", "category": "题型"}]',
  
  -- 考点和难度因素
  knowledge_points JSON COMMENT '考查知识点，如：["分数运算", "通分"]',
  difficulty_factors JSON COMMENT '难度因素，如：{"计算量": "大", "概念复杂度": "中"}',
  
  -- 相似题目
  similar_questions JSON COMMENT '相似题目ID列表，如：[12, 34, 56]',
  
  -- 质量评估
  content_quality_score FLOAT DEFAULT 0 COMMENT '内容质量评分（0-100）',
  difficulty_accuracy FLOAT DEFAULT 0 COMMENT '难度标注准确性（对比实际正确率）',
  
  -- AI 分析结果
  ai_analysis TEXT COMMENT 'AI分析的题目特征描述',
  
  -- 分析元数据
  analysis_version VARCHAR(20) DEFAULT '1.0' COMMENT '分析版本',
  last_analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '最后分析时间',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_question_id (question_id),
  INDEX idx_quality (content_quality_score),
  INDEX idx_analyzed_at (last_analyzed_at),
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目语义分析';

-- 2. 题目标签表
CREATE TABLE IF NOT EXISTS question_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tag_name VARCHAR(50) NOT NULL UNIQUE COMMENT '标签名称',
  tag_category VARCHAR(50) COMMENT '标签分类：题型/难度/考点/易错点',
  usage_count INT DEFAULT 0 COMMENT '使用次数',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_category (tag_category),
  INDEX idx_usage (usage_count DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目标签';

-- 3. 题目标签关联表
CREATE TABLE IF NOT EXISTS question_tag_relations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  tag_id INT NOT NULL,
  confidence FLOAT DEFAULT 1.0 COMMENT 'AI 置信度（0-1）',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_question_tag (question_id, tag_id),
  INDEX idx_tag (tag_id),
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES question_tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目标签关联';

-- 4. AI 分析任务队列表
CREATE TABLE IF NOT EXISTS ai_analysis_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_type VARCHAR(50) NOT NULL COMMENT '任务类型：semantic_analysis/error_analysis',
  target_id INT COMMENT '目标ID（question_id/user_id）',
  priority INT DEFAULT 5 COMMENT '优先级（1-10，数字越小优先级越高）',
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  retry_count INT DEFAULT 0 COMMENT '重试次数',
  max_retries INT DEFAULT 3 COMMENT '最大重试次数',
  error_message TEXT COMMENT '错误信息',
  result TEXT COMMENT '分析结果（JSON）',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME COMMENT '开始处理时间',
  completed_at DATETIME COMMENT '完成时间',
  
  INDEX idx_status_priority (status, priority),
  INDEX idx_task_type (task_type),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI分析任务队列';

-- 5. 用户学习风格分析表
CREATE TABLE IF NOT EXISTS user_learning_style (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE COMMENT '用户ID',
  
  -- 答题习惯
  avg_answer_time FLOAT DEFAULT 0 COMMENT '平均答题时间（秒）',
  answer_time_stability FLOAT DEFAULT 0 COMMENT '答题时间稳定性（标准差）',
  avg_modifications FLOAT DEFAULT 0 COMMENT '平均修改次数',
  skip_rate FLOAT DEFAULT 0 COMMENT '跳题率',
  
  -- 学习偏好
  preferred_difficulty INT DEFAULT 0 COMMENT '偏好难度（根据正确率分析）',
  preferred_time_slot VARCHAR(20) COMMENT '偏好答题时段（上午/下午/晚上）',
  
  -- 错误模式
  error_patterns JSON COMMENT '错误模式分析，如：{"concept_error": 5, "careless_error": 3}',
  
  -- AI 分析结果
  learning_style_tags JSON COMMENT '学习风格标签，如：["谨慎型", "思考型"]',
  ai_suggestion TEXT COMMENT 'AI 生成的学习建议',
  
  -- 统计数据
  total_analyzed_sessions INT DEFAULT 0 COMMENT '已分析的答题次数',
  
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户学习风格分析';

-- 6. 错误模式详情表
CREATE TABLE IF NOT EXISTS error_patterns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  question_id INT NOT NULL COMMENT '题目ID',
  
  -- 错误信息
  error_type VARCHAR(50) COMMENT '错误类型：concept(概念错误)/calculation(计算错误)/careless(粗心)/understanding(理解错误)',
  error_reason TEXT COMMENT 'AI 分析的错误原因',
  user_answer VARCHAR(50) COMMENT '用户的错误答案',
  correct_answer VARCHAR(50) COMMENT '正确答案',
  
  -- 改进建议
  improvement_suggestion TEXT COMMENT '改进建议',
  related_knowledge_points JSON COMMENT '需要复习的知识点',
  
  -- 反馈
  user_feedback TEXT COMMENT '用户反馈（可选）',
  is_helpful TINYINT(1) COMMENT '建议是否有帮助',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_error_type (user_id, error_type),
  INDEX idx_question (question_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='错误模式详情';

-- ============================================
-- 第二部分：增强已存在的表
-- ============================================

-- 7. 增强 answer_behavior 表
-- 使用存储过程安全地添加列（如果不存在）
DELIMITER //

DROP PROCEDURE IF EXISTS add_column_if_not_exists //

CREATE PROCEDURE add_column_if_not_exists(
  IN table_name_param VARCHAR(100),
  IN column_name_param VARCHAR(100),
  IN column_definition VARCHAR(500)
)
BEGIN
  DECLARE column_exists INT DEFAULT 0;
  
  SELECT COUNT(*) INTO column_exists
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = table_name_param
    AND COLUMN_NAME = column_name_param;
  
  IF column_exists = 0 THEN
    SET @sql = CONCAT('ALTER TABLE ', table_name_param, ' ADD COLUMN ', column_name_param, ' ', column_definition);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //

DELIMITER ;

-- 为 answer_behavior 添加列
CALL add_column_if_not_exists('answer_behavior', 'final_answer', "VARCHAR(50) COMMENT '最终答案'");
CALL add_column_if_not_exists('answer_behavior', 'is_correct', "TINYINT(1) COMMENT '最终是否正确'");
CALL add_column_if_not_exists('answer_behavior', 'hesitation_time', "INT DEFAULT 0 COMMENT '犹豫时间（秒）'");
CALL add_column_if_not_exists('answer_behavior', 'skipped_and_returned', "TINYINT(1) DEFAULT 0 COMMENT '是否跳过后返回'");
CALL add_column_if_not_exists('answer_behavior', 'session_id', "VARCHAR(100) COMMENT '答题会话ID'");

-- 为 answer_behavior 添加索引（如果不存在）
DROP PROCEDURE IF EXISTS add_index_if_not_exists //

DELIMITER //

CREATE PROCEDURE add_index_if_not_exists(
  IN table_name_param VARCHAR(100),
  IN index_name_param VARCHAR(100),
  IN index_columns VARCHAR(500)
)
BEGIN
  DECLARE index_exists INT DEFAULT 0;
  
  SELECT COUNT(*) INTO index_exists
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = table_name_param
    AND INDEX_NAME = index_name_param;
  
  IF index_exists = 0 THEN
    SET @sql = CONCAT('ALTER TABLE ', table_name_param, ' ADD INDEX ', index_name_param, ' (', index_columns, ')');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //

DELIMITER ;

CALL add_index_if_not_exists('answer_behavior', 'idx_session', 'session_id');

-- 8. 增强 learning_progress 表
CALL add_column_if_not_exists('learning_progress', 'ai_suggestion', "TEXT COMMENT 'AI 生成的学习建议'");
CALL add_column_if_not_exists('learning_progress', 'last_suggestion_at', "DATETIME COMMENT '上次建议时间'");
CALL add_column_if_not_exists('learning_progress', 'suggestion_type', "VARCHAR(50) COMMENT '建议类型：review/practice/challenge'");
CALL add_column_if_not_exists('learning_progress', 'recent_accuracy', "FLOAT DEFAULT 0 COMMENT '最近5次正确率'");
CALL add_column_if_not_exists('learning_progress', 'accuracy_trend', "VARCHAR(10) COMMENT '趋势：improving/declining/stable'");

-- 清理存储过程
DROP PROCEDURE IF EXISTS add_column_if_not_exists;
DROP PROCEDURE IF EXISTS add_index_if_not_exists;

-- 9. 增强 ai_analysis_cache 表（重构为通用缓存）
-- 先删除旧表，再创建新表（保留现有数据）
CREATE TABLE IF NOT EXISTS ai_cache_new (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cache_key VARCHAR(255) NOT NULL UNIQUE COMMENT '缓存键',
  cache_data TEXT NOT NULL COMMENT '缓存数据（JSON）',
  expires_at DATETIME NOT NULL COMMENT '过期时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_key (cache_key),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI缓存';

-- 迁移数据
INSERT IGNORE INTO ai_cache_new (cache_key, cache_data, expires_at, created_at)
SELECT 
  query_hash as cache_key,
  result_text as cache_data,
  expires_at,
  created_at
FROM ai_analysis_cache
ON DUPLICATE KEY UPDATE cache_data = VALUES(cache_data);

-- 删除旧表，重命名新表
DROP TABLE IF EXISTS ai_analysis_cache;
RENAME TABLE ai_cache_new TO ai_analysis_cache;

-- ============================================
-- 第三部分：清理和优化
-- ============================================

-- 清理过期的任务队列（保留最近7天）
DELETE FROM ai_analysis_queue 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY) AND status IN ('completed', 'failed');

-- 清理过期的缓存
DELETE FROM ai_analysis_cache WHERE expires_at < NOW();

-- 优化表
OPTIMIZE TABLE question_semantic_analysis;
OPTIMIZE TABLE question_tags;
OPTIMIZE TABLE question_tag_relations;
OPTIMIZE TABLE ai_analysis_queue;
OPTIMIZE TABLE user_learning_style;
OPTIMIZE TABLE error_patterns;
OPTIMIZE TABLE answer_behavior;
OPTIMIZE TABLE learning_progress;
OPTIMIZE TABLE ai_analysis_cache;

-- ============================================
-- 完成
-- ============================================

SELECT 'AI 数据增强数据库迁移完成！' as message;
SELECT 
  '已创建表：' as type,
  'question_semantic_analysis, question_tags, question_tag_relations, ai_analysis_queue, user_learning_style, error_patterns' as tables
UNION ALL
SELECT 
  '已增强表：' as type,
  'answer_behavior, learning_progress, ai_analysis_cache' as tables;
