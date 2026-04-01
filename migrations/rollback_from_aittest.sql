-- ====================================================
-- AItest 分支数据库回滚脚本
-- 版本: v1.0
-- 日期: 2026-04-01
-- 说明: 从 AItest 分支回滚到 master 分支
-- 警告: 执行此脚本将删除 AI 相关的所有数据！
-- 执行顺序: 先备份数据库 → 部署 master 代码 → 执行此脚本
-- ====================================================

USE pscg_db;

-- ==================== 安全警告 ====================

SELECT '⚠️  警告：此操作将删除所有 AI 聊天相关数据！' AS warning;
SELECT '建议：请确保已备份数据库' AS reminder;
SELECT '执行时间：' AS timestamp, NOW() AS current_time;

-- ==================== 1. 删除缓存命中记录表 ====================

DROP TABLE IF EXISTS cache_hits;
SELECT '✅ 已删除 cache_hits 表' AS message;

-- ==================== 2. 删除 Token 使用记录表 ====================

DROP TABLE IF EXISTS token_usage;
SELECT '✅ 已删除 token_usage 表' AS message;

-- ==================== 3. 删除聊天消息表 ====================

DROP TABLE IF EXISTS chat_messages;
SELECT '✅ 已删除 chat_messages 表' AS message;

-- ==================== 4. 删除聊天会话表 ====================

DROP TABLE IF EXISTS chat_sessions;
SELECT '✅ 已删除 chat_sessions 表' AS message;

-- ==================== 5. 删除 AI 模型配置表 ====================

DROP TABLE IF EXISTS ai_models;
SELECT '✅ 已删除 ai_models 表' AS message;

-- ==================== 6. 删除学科表字段（可选）====================

-- 检查字段是否存在
SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = 'pscg_db' 
    AND table_name = 'subjects' 
    AND column_name = 'show_in_history_quiz');

-- 删除字段（如果存在）
SET @drop_column = IF(@column_exists > 0,
    'ALTER TABLE subjects DROP COLUMN show_in_history_quiz',
    'SELECT ''show_in_history_quiz 字段不存在'' AS message'
);

PREPARE stmt FROM @drop_column;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT '✅ 已删除 subjects.show_in_history_quiz 字段' AS message;

-- ==================== 7. 删除性能优化索引（可选）====================

-- 删除 questions 表索引
DROP INDEX IF EXISTS idx_questions_type ON questions;
DROP INDEX IF EXISTS idx_questions_created ON questions;
DROP INDEX IF EXISTS idx_questions_filter ON questions;

SELECT '✅ 已删除 questions 表性能索引' AS message;

-- ==================== 完成 ====================

SELECT '✅ 数据库回滚完成！' AS message;
SELECT '所有 AI 相关数据已清除' AS reminder;