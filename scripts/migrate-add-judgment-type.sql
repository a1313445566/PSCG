-- ============================================
-- 判断题功能 - 数据库迁移脚本
-- 版本: v1.2
-- 日期: 2026-04-04
-- 环境: MySQL 8.0.x
-- ============================================

-- 1. 创建备份表（安全措施）
CREATE TABLE IF NOT EXISTS questions_backup_20260404 AS
SELECT * FROM questions;

-- 2. 验证备份成功
SELECT COUNT(*) AS backup_count FROM questions_backup_20260404;

-- 3. 修改 type 字段类型
ALTER TABLE questions 
MODIFY COLUMN type VARCHAR(20) DEFAULT 'single' 
COMMENT '题目类型：single-单选, multiple-多选, judgment-判断, reading-阅读, listening-听力, image-看图';

-- 4. 验证修改成功
DESCRIBE questions;

-- 5. 添加索引（如果不存在）
-- MySQL 8.0 不支持 IF NOT EXISTS，使用存储过程或忽略错误
-- 检查索引是否存在
SELECT COUNT(*) AS index_exists 
FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
AND table_name = 'questions' 
AND index_name = 'idx_type';

-- 如果索引不存在则创建（需要手动执行或使用存储过程）
-- ALTER TABLE questions ADD INDEX idx_type (type);

-- 6. 验证数据完整性
SELECT 
  type, 
  COUNT(*) as count,
  MIN(created_at) as earliest,
  MAX(created_at) as latest
FROM questions 
GROUP BY type;

-- 迁移完成提示
SELECT 'Migration completed successfully!' AS status;
