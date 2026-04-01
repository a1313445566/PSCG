-- 数据库迁移脚本：从master分支迁移到AItest分支
-- 执行顺序：先执行此脚本，再部署AItest分支代码

-- 1. 创建管理员凭证表（如果不存在）
CREATE TABLE IF NOT EXISTS admin_credentials (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 创建AI模型配置表（如果不存在）
CREATE TABLE IF NOT EXISTS ai_models (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL COMMENT '模型名称',
  provider VARCHAR(50) NOT NULL COMMENT '提供商',
  model_id VARCHAR(100) NOT NULL COMMENT '模型标识',
  api_url VARCHAR(255) NOT NULL COMMENT 'API 地址',
  api_key_encrypted TEXT COMMENT '加密后的 API Key',
  is_primary TINYINT(1) DEFAULT 0 COMMENT '是否主力模型',
  is_enabled TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  priority INT DEFAULT 0 COMMENT '优先级',
  max_tokens INT DEFAULT 4096 COMMENT '最大 Token',
  temperature DECIMAL(3,2) DEFAULT 0.7 COMMENT '温度参数',
  cost_per_1k_input DECIMAL(10,6) DEFAULT 0 COMMENT '输入成本/1k tokens',
  cost_per_1k_output DECIMAL(10,6) DEFAULT 0 COMMENT '输出成本/1k tokens',
  config JSON COMMENT '其他配置',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_provider (provider),
  INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 创建聊天会话表（如果不存在）
CREATE TABLE IF NOT EXISTS chat_sessions (
  id VARCHAR(36) PRIMARY KEY,
  admin_id INT NOT NULL COMMENT '管理员ID，关联 admin_credentials.id',
  title VARCHAR(100) COMMENT '会话标题',
  model_name VARCHAR(50) COMMENT '使用的模型',
  total_tokens INT DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  message_count INT DEFAULT 0,
  status ENUM('active', 'archived') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  expires_at DATETIME COMMENT '过期时间',
  INDEX idx_admin_id (admin_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (admin_id) REFERENCES admin_credentials(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 创建聊天消息表（如果不存在）
CREATE TABLE IF NOT EXISTS chat_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(36) NOT NULL,
  role ENUM('user', 'assistant', 'system') NOT NULL,
  content TEXT NOT NULL,
  tokens INT DEFAULT 0,
  tools_used JSON COMMENT '使用的工具',
  query_result JSON COMMENT '查询结果',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session_id (session_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 创建聊天摘要表（如果不存在）
CREATE TABLE IF NOT EXISTS chat_summaries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(36) NOT NULL,
  message_start_id INT NOT NULL,
  message_end_id INT NOT NULL,
  summary TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session_id (session_id),
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 创建Token使用记录表（如果不存在）
CREATE TABLE IF NOT EXISTS token_usage (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT NOT NULL COMMENT '管理员ID，关联 admin_credentials.id',
  session_id VARCHAR(36) NOT NULL,
  model_name VARCHAR(50) NOT NULL,
  input_tokens INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  cost DECIMAL(10,6) DEFAULT 0,
  query_type VARCHAR(50) COMMENT '查询类型',
  cached TINYINT(1) DEFAULT 0 COMMENT '是否命中缓存',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_id (admin_id),
  INDEX idx_session_id (session_id),
  INDEX idx_created_at (created_at),
  INDEX idx_model_name (model_name),
  FOREIGN KEY (admin_id) REFERENCES admin_credentials(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 创建缓存命中记录表（如果不存在）
CREATE TABLE IF NOT EXISTS cache_hits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  query_hash VARCHAR(64) NOT NULL,
  query_text TEXT NOT NULL,
  response_hash VARCHAR(64) NOT NULL,
  hit_count INT DEFAULT 1,
  tokens_saved INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_hit_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_query_hash (query_hash),
  INDEX idx_hit_count (hit_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 检查并添加 subjects 表的 show_in_history_quiz 字段
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS show_in_history_quiz TINYINT(1) DEFAULT 0;

-- 9. 添加 questions 表性能优化索引
-- 检查并添加 idx_questions_type 索引
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions (type);

-- 检查并添加 idx_questions_created 索引
CREATE INDEX IF NOT EXISTS idx_questions_created ON questions (created_at);

-- 检查并添加 idx_questions_filter 索引
CREATE INDEX IF NOT EXISTS idx_questions_filter ON questions (subject_id, subcategory_id, type);

-- 10. 添加 quiz_sessions 表的 idx_user_created 索引
CREATE INDEX IF NOT EXISTS idx_user_created ON quiz_sessions (user_id, created_at);

-- 11. 添加 quiz_attempts 表的 idx_quiz_question 索引
CREATE INDEX IF NOT EXISTS idx_quiz_question ON quiz_attempts (quiz_session_id, question_id);

-- 迁移完成
SELECT '数据库迁移完成' AS message;
