-- ============================================
-- 判断题功能 - 数据库回滚脚本
-- 版本: v1.2
-- 日期: 2026-04-04
-- ============================================

-- 1. 检查备份表是否存在
SELECT COUNT(*) FROM questions_backup_20260404;

-- 2. 删除当前表（危险操作，需确认）
DROP TABLE IF EXISTS questions;

-- 3. 从备份恢复
CREATE TABLE questions AS
SELECT * FROM questions_backup_20260404;

-- 4. 恢复表结构（重新创建索引和外键）
ALTER TABLE questions
ADD PRIMARY KEY (id),
ADD INDEX idx_subject_id (subject_id),
ADD INDEX idx_subcategory_id (subcategory_id),
ADD INDEX idx_difficulty (difficulty);

-- 5. 验证恢复结果
SELECT COUNT(*) FROM questions;

-- 回滚完成提示
SELECT 'Rollback completed successfully!' AS status;
