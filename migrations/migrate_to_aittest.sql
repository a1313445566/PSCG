-- ====================================================
-- AItest 分支数据库迁移脚本
-- 版本: v1.0
-- 日期: 2026-04-01
-- 说明: 从 master 分支迁移到 AItest 分支
-- 执行顺序: 先备份数据库 → 执行此脚本 → 部署代码
-- ====================================================

USE pscg_db;

-- ==================== 1. AI 模型配置表 ====================

-- 检查表是否存在
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = 'pscg_db' AND table_name = 'ai_models');

-- 如果表不存在则创建
SET @create_ai_models = IF(@table_exists = 0,
    'CREATE TABLE ai_models (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL COMMENT ''模型名称'',
        provider VARCHAR(50) NOT NULL COMMENT ''提供商（openai/anthropic等）'',
        base_url VARCHAR(255) NOT NULL COMMENT ''API 基础地址'',
        api_key TEXT COMMENT ''加密后的 API Key'',
        model_id VARCHAR(100) NOT NULL COMMENT ''模型标识'',
        is_default TINYINT(1) DEFAULT 0 COMMENT ''是否默认模型'',
        is_active TINYINT(1) DEFAULT 1 COMMENT ''是否启用'',
        max_tokens INT DEFAULT 4096 COMMENT ''最大 Token'',
        temperature DECIMAL(3,2) DEFAULT 0.7 COMMENT ''温度参数'',
        cost_per_1k_input DECIMAL(10,6) DEFAULT 0.0000 COMMENT ''输入成本/1k tokens'',
        cost_per_1k_output DECIMAL(10,6) DEFAULT 0.0000 COMMENT ''输出成本/1k tokens'',
        config JSON COMMENT ''其他配置'',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_provider (provider),
        INDEX idx_is_default (is_default),
        INDEX idx_is_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT=''AI模型配置表''',
    'SELECT ''ai_models 表已存在'' AS message'
);

PREPARE stmt FROM @create_ai_models;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==================== 2. 聊天会话表 ====================

SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = 'pscg_db' AND table_name = 'chat_sessions');

SET @create_chat_sessions = IF(@table_exists = 0,
    'CREATE TABLE chat_sessions (
        id VARCHAR(36) PRIMARY KEY COMMENT ''会话 UUID'',
        admin_id INT NOT NULL COMMENT ''管理员ID'',
        model_id INT COMMENT ''使用的模型ID'',
        title VARCHAR(100) COMMENT ''会话标题'',
        total_tokens INT DEFAULT 0 COMMENT ''总 Token 数'',
        total_cost DECIMAL(10,4) DEFAULT 0.0000 COMMENT ''总成本'',
        message_count INT DEFAULT 0 COMMENT ''消息数量'',
        status ENUM(''active'', ''archived'') DEFAULT ''active'' COMMENT ''状态'',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        expires_at DATETIME COMMENT ''过期时间'',
        INDEX idx_admin_id (admin_id),
        INDEX idx_model_id (model_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (admin_id) REFERENCES admin_credentials(id) ON DELETE CASCADE,
        FOREIGN KEY (model_id) REFERENCES ai_models(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT=''聊天会话表''',
    'SELECT ''chat_sessions 表已存在'' AS message'
);

PREPARE stmt FROM @create_chat_sessions;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==================== 3. 聊天消息表 ====================

SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = 'pscg_db' AND table_name = 'chat_messages');

SET @create_chat_messages = IF(@table_exists = 0,
    'CREATE TABLE chat_messages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        session_id VARCHAR(36) NOT NULL COMMENT ''会话ID'',
        admin_id INT NOT NULL COMMENT ''管理员ID'',
        model_id INT COMMENT ''模型ID'',
        role ENUM(''user'', ''assistant'', ''system'') NOT NULL COMMENT ''角色'',
        content TEXT NOT NULL COMMENT ''消息内容'',
        tokens INT DEFAULT 0 COMMENT ''Token 数量'',
        tools_used JSON COMMENT ''使用的工具'',
        query_result JSON COMMENT ''查询结果'',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_session_id (session_id),
        INDEX idx_admin_id (admin_id),
        INDEX idx_model_id (model_id),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (admin_id) REFERENCES admin_credentials(id) ON DELETE CASCADE,
        FOREIGN KEY (model_id) REFERENCES ai_models(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT=''聊天消息表''',
    'SELECT ''chat_messages 表已存在'' AS message'
);

PREPARE stmt FROM @create_chat_messages;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==================== 4. Token 使用记录表 ====================

SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = 'pscg_db' AND table_name = 'token_usage');

SET @create_token_usage = IF(@table_exists = 0,
    'CREATE TABLE token_usage (
        id INT PRIMARY KEY AUTO_INCREMENT,
        admin_id INT NOT NULL COMMENT ''管理员ID'',
        session_id VARCHAR(36) COMMENT ''会话ID'',
        model_id INT COMMENT ''模型ID'',
        input_tokens INT DEFAULT 0 COMMENT ''输入 Token'',
        output_tokens INT DEFAULT 0 COMMENT ''输出 Token'',
        total_tokens INT DEFAULT 0 COMMENT ''总 Token'',
        cost DECIMAL(10,6) DEFAULT 0.000000 COMMENT ''成本'',
        query_type VARCHAR(50) COMMENT ''查询类型'',
        cached TINYINT(1) DEFAULT 0 COMMENT ''是否命中缓存'',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_admin_id (admin_id),
        INDEX idx_session_id (session_id),
        INDEX idx_model_id (model_id),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (admin_id) REFERENCES admin_credentials(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE SET NULL,
        FOREIGN KEY (model_id) REFERENCES ai_models(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT=''Token使用记录表''',
    'SELECT ''token_usage 表已存在'' AS message'
);

PREPARE stmt FROM @create_token_usage;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==================== 5. 缓存命中记录表 ====================

SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = 'pscg_db' AND table_name = 'cache_hits');

SET @create_cache_hits = IF(@table_exists = 0,
    'CREATE TABLE cache_hits (
        id INT PRIMARY KEY AUTO_INCREMENT,
        query_hash VARCHAR(64) NOT NULL COMMENT ''查询哈希'',
        query_text TEXT NOT NULL COMMENT ''查询文本'',
        response_hash VARCHAR(64) NOT NULL COMMENT ''响应哈希'',
        hit_count INT DEFAULT 1 COMMENT ''命中次数'',
        tokens_saved INT DEFAULT 0 COMMENT ''节省的 Token'',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_hit_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE INDEX idx_query_hash (query_hash),
        INDEX idx_hit_count (hit_count)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT=''缓存命中记录表''',
    'SELECT ''cache_hits 表已存在'' AS message'
);

PREPARE stmt FROM @create_cache_hits;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==================== 6. 学科表字段扩展 ====================

-- 检查并添加 show_in_history_quiz 字段
SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = 'pscg_db' 
    AND table_name = 'subjects' 
    AND column_name = 'show_in_history_quiz');

SET @add_column = IF(@column_exists = 0,
    'ALTER TABLE subjects ADD COLUMN show_in_history_quiz TINYINT(1) DEFAULT 0 COMMENT ''是否在历史测验中显示''',
    'SELECT ''show_in_history_quiz 字段已存在'' AS message'
);

PREPARE stmt FROM @add_column;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==================== 7. 性能优化索引 ====================

-- 检查并添加 questions 表索引
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
    WHERE table_schema = 'pscg_db' 
    AND table_name = 'questions' 
    AND index_name = 'idx_questions_type');

SET @add_index = IF(@index_exists = 0,
    'CREATE INDEX idx_questions_type ON questions (type)',
    'SELECT ''idx_questions_type 索引已存在'' AS message'
);

PREPARE stmt FROM @add_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 idx_questions_created 索引
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
    WHERE table_schema = 'pscg_db' 
    AND table_name = 'questions' 
    AND index_name = 'idx_questions_created');

SET @add_index = IF(@index_exists = 0,
    'CREATE INDEX idx_questions_created ON questions (created_at)',
    'SELECT ''idx_questions_created 索引已存在'' AS message'
);

PREPARE stmt FROM @add_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 idx_questions_filter 复合索引
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
    WHERE table_schema = 'pscg_db' 
    AND table_name = 'questions' 
    AND index_name = 'idx_questions_filter');

SET @add_index = IF(@index_exists = 0,
    'CREATE INDEX idx_questions_filter ON questions (subject_id, subcategory_id, type)',
    'SELECT ''idx_questions_filter 索引已存在'' AS message'
);

PREPARE stmt FROM @add_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==================== 8. 插入默认 AI 模型配置 ====================

-- 检查是否有默认模型
SET @model_count = (SELECT COUNT(*) FROM ai_models WHERE is_default = 1);

-- 如果没有默认模型，插入一个示例配置（需要后续手动配置 API Key）
SET @insert_default = IF(@model_count = 0,
    'INSERT INTO ai_models (name, provider, base_url, model_id, is_default, is_active, max_tokens, temperature) 
     VALUES (''GPT-3.5 Turbo'', ''openai'', ''https://api.openai.com/v1'', ''gpt-3.5-turbo'', 1, 0, 4096, 0.7)',
    'SELECT ''默认模型已存在'' AS message'
);

PREPARE stmt FROM @insert_default;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==================== 完成 ====================

SELECT '✅ AItest 分支数据库迁移完成！' AS message;
SELECT '⚠️  请在后台配置 AI 模型的 API Key' AS reminder;