-- 修复没有 answer_record_id 的 question_attempts 记录
-- 这个脚本会为每条没有 answer_record_id 的记录找到对应的 answer_records 记录，并更新 answer_record_id

UPDATE question_attempts qat
INNER JOIN (
    SELECT
        qat.id as question_attempt_id,
        ar.id as answer_record_id
    FROM question_attempts qat
    LEFT JOIN answer_records ar ON qat.user_id = ar.user_id
        AND qat.subject_id = ar.subject_id
        AND (qat.subcategory_id = ar.subcategory_id OR (qat.subcategory_id IS NULL AND ar.subcategory_id IS NULL))
        AND TIMESTAMPDIFF(SECOND, ar.created_at, qat.created_at) >= 0
        AND TIMESTAMPDIFF(SECOND, ar.created_at, qat.created_at) <= 60
    WHERE qat.answer_record_id IS NULL
    GROUP BY qat.id, ar.id
    HAVING answer_record_id IS NOT NULL
) matched ON qat.id = matched.question_attempt_id
SET qat.answer_record_id = matched.answer_record_id;

-- 查看修复结果
SELECT
    COUNT(*) as total_question_attempts,
    COUNT(CASE WHEN qat.answer_record_id IS NOT NULL THEN 1 END) as with_answer_record_id,
    COUNT(CASE WHEN qat.answer_record_id IS NULL THEN 1 END) as without_answer_record_id
FROM question_attempts qat;
