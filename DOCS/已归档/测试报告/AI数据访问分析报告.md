# AI 自然语言分析数据访问分析报告

生成时间：2026-03-27  
分析对象：PSCG 智能题库系统 AI 分析功能

---

## 📊 数据库表清单

### 1️⃣ 核心业务表（database.js）

| 表名 | 用途 | 记录数量级 | AI 可访问 | 备注 |
|------|------|-----------|----------|------|
| `users` | 用户信息 | 数百~数千 | ✅ 是 | 学生基本信息 |
| `subjects` | 学科信息 | 个位数 | ✅ 是 | 数学、语文等 |
| `subcategories` | 知识点 | 数十 | ✅ 是 | 题库分类 |
| `questions` | 题目库 | 数千~数万 | ✅ 是 | 题目内容、答案 |
| `answer_records` | 答题记录 | 数万~数十万 | ✅ 是 | 每次答题会话 |
| `question_attempts` | 题目尝试 | 数十万 | ✅ 是 | 每道题的答题详情 |
| `error_collection` | 错题收藏 | 数千 | ✅ 是 | 学生收藏的错题 |
| `quiz_sessions` | 答题会话 | 数千 | ❌ 否 | 临时会话数据 |
| `quiz_attempts` | 答题尝试 | 数万 | ❌ 否 | 会话中的答题 |
| `grades` | 年级信息 | 个位数 | ❌ 否 | 年级配置 |
| `classes` | 班级信息 | 个位数 | ❌ 否 | 班级配置 |
| `file_hashes` | 文件哈希 | 数千 | ❌ 否 | 图片/音频去重 |

### 2️⃣ 系统配置表（server.cjs 动态创建）

| 表名 | 用途 | AI 可访问 | 备注 |
|------|------|----------|------|
| `settings` | 系统设置 | ❌ 否 | AI 配置、系统参数 |
| `security_logs` | 安全日志 | ❌ 否 | 封禁/解封操作记录 |
| `ai_analysis_cache` | AI 缓存 | ❌ 否 | AI 分析结果缓存 |
| `ai_analysis_history` | AI 历史 | ❌ 否 | 用户查询历史 |
| `ai_batch_analysis` | 批量分析 | ❌ 否 | 批量分析任务 |

### 3️⃣ 数据增强表（已创建但 AI 未使用）

| 表名 | 用途 | AI 可访问 | 状态 |
|------|------|----------|------|
| `question_difficulty_history` | 难度调整历史 | ❌ 否 | 已创建，AI 未使用 |
| `answer_behavior` | 答题行为详情 | ❌ 否 | 已创建，AI 未使用 |
| `learning_progress` | 学习进度 | ❌ 否 | 已创建，AI 未使用 |

---

## 🔍 AI 当前可访问的数据

### 通过 `getDatabaseContext()` 提供给 AI 的信息

#### Schema 信息（表结构描述）

```javascript
{
  users: { 
    fields: 'id, student_id, name, grade, class', 
    description: '学生信息（name字段用于查询学生）' 
  },
  subjects: { 
    fields: 'id, name', 
    description: '学科' 
  },
  questions: { 
    fields: 'id, subject_id, subcategory_id, type, difficulty, content, options, correct_answer', 
    description: '题目' 
  },
  subcategories: { 
    fields: 'id, subject_id, name', 
    description: '知识点' 
  },
  answer_records: { 
    fields: 'id, user_id, subject_id, subcategory_id, total_questions, correct_count, created_at', 
    description: '答题记录' 
  },
  question_attempts: { 
    fields: 'id, question_id, user_id, subject_id, is_correct, selected_answer, created_at', 
    description: '题目尝试' 
  },
  error_collection: { 
    fields: 'id, user_id, question_id, created_at', 
    description: '错题收藏' 
  }
}
```

#### Data 信息（预加载的数据）

```javascript
{
  students: [
    { id: 1, student_id: '001', name: '张三', grade: '3', class: '1' },
    // ... 所有学生
  ],
  subjects: [
    { id: 1, name: '数学' },
    { id: 2, name: '语文' },
    // ... 所有学科
  ],
  grades: ['1', '2', '3', '4', '5', '6'],  // 所有年级
  classes: ['1', '2', '3', '4'],  // 所有班级
  subcategories: [
    { id: 1, subject_id: 1, name: '加法' },
    // ... 所有知识点
  ],
  stats: {
    totalStudents: 120,
    totalQuestions: 1500,
    totalRecords: 5000,
    totalErrors: 300
  }
}
```

### 通过 `executeQueryPlan()` 实际查询的数据

#### 1. 个人分析查询

```sql
-- 用户基本信息
SELECT id, student_id, name, grade, class FROM users WHERE name = ?

-- 用户答题统计
SELECT COUNT(DISTINCT ar.id) as totalSessions,
  SUM(ar.total_questions) as totalQuestions,
  SUM(ar.correct_count) as totalCorrect,
  (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) as overallAccuracy
FROM answer_records ar WHERE ar.user_id = ?

-- 用户各学科表现
SELECT s.name as subject, COUNT(DISTINCT ar.id) as sessions,
  SUM(ar.total_questions) as questions,
  SUM(ar.correct_count) as correct,
  (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) as accuracy
FROM answer_records ar
INNER JOIN subjects s ON ar.subject_id = s.id
WHERE ar.user_id = ?
GROUP BY ar.subject_id, s.name
ORDER BY accuracy ASC

-- 最近答题记录
SELECT ar.id, s.name as subject, sub.name as subcategory,
  ar.total_questions, ar.correct_count,
  (ar.correct_count * 100.0) / ar.total_questions as accuracy,
  ar.created_at
FROM answer_records ar
INNER JOIN subjects s ON ar.subject_id = s.id
LEFT JOIN subcategories sub ON ar.subcategory_id = sub.id
WHERE ar.user_id = ?
ORDER BY ar.created_at DESC
LIMIT 20

-- 用户错题收藏
SELECT q.content, s.name as subject, ec.created_at
FROM error_collection ec
INNER JOIN questions q ON ec.question_id = q.id
INNER JOIN subjects s ON q.subject_id = s.id
WHERE ec.user_id = ?
ORDER BY ec.created_at DESC
LIMIT 20

-- 用户薄弱知识点
SELECT sub.name as subcategory, s.name as subject,
  COUNT(DISTINCT ar.id) as sessions,
  SUM(ar.total_questions) as questions,
  SUM(ar.correct_count) as correct,
  (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) as accuracy
FROM answer_records ar
INNER JOIN subcategories sub ON ar.subcategory_id = sub.id
INNER JOIN subjects s ON ar.subject_id = s.id
WHERE ar.user_id = ?
GROUP BY ar.subcategory_id, sub.name, s.name
HAVING sessions >= 1
ORDER BY accuracy ASC
LIMIT 10
```

#### 2. 群体分析查询

```sql
-- 基础统计
SELECT COUNT(DISTINCT u.id) as totalUsers,
  COUNT(DISTINCT ar.id) as totalSessions,
  SUM(ar.total_questions) as totalQuestions,
  SUM(ar.correct_count) as totalCorrect,
  (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) as overallAccuracy
FROM answer_records ar
INNER JOIN users u ON ar.user_id = u.id
WHERE [条件]

-- 学科分析
SELECT s.name as subject, COUNT(DISTINCT ar.id) as sessions,
  SUM(ar.total_questions) as questions, SUM(ar.correct_count) as correct,
  (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) as accuracy
FROM answer_records ar
INNER JOIN users u ON ar.user_id = u.id
INNER JOIN subjects s ON ar.subject_id = s.id
WHERE [条件]
GROUP BY ar.subject_id, s.name
ORDER BY accuracy ASC

-- 年级分析
SELECT u.grade, COUNT(DISTINCT ar.id) as sessions, COUNT(DISTINCT u.id) as users,
  SUM(ar.total_questions) as questions, SUM(ar.correct_count) as correct,
  (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) as accuracy
FROM answer_records ar
INNER JOIN users u ON ar.user_id = u.id
WHERE [条件]
GROUP BY u.grade
ORDER BY u.grade

-- 班级分析
SELECT u.grade, u.class, COUNT(DISTINCT ar.id) as sessions, COUNT(DISTINCT u.id) as users,
  (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) as accuracy
FROM answer_records ar
INNER JOIN users u ON ar.user_id = u.id
WHERE [条件]
GROUP BY u.grade, u.class
ORDER BY accuracy ASC
LIMIT 10

-- 知识点分析
SELECT s.name as subject, sub.name as subcategory,
  COUNT(DISTINCT ar.id) as sessions, SUM(ar.total_questions) as questions,
  SUM(ar.correct_count) as correct,
  (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) as accuracy
FROM answer_records ar
INNER JOIN users u ON ar.user_id = u.id
INNER JOIN subjects s ON ar.subject_id = s.id
INNER JOIN subcategories sub ON ar.subcategory_id = sub.id
WHERE [条件]
GROUP BY ar.subject_id, ar.subcategory_id, s.name, sub.name
ORDER BY accuracy ASC
LIMIT 10

-- 趋势分析（近7天）
SELECT DATE(ar.created_at) as date, COUNT(DISTINCT ar.id) as sessions,
  SUM(ar.total_questions) as questions, SUM(ar.correct_count) as correct,
  (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) as accuracy
FROM answer_records ar
INNER JOIN users u ON ar.user_id = u.id
WHERE [条件] AND ar.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(ar.created_at)
ORDER BY date DESC

-- 用户活跃度
SELECT COUNT(DISTINCT u.id) as totalUsers,
  COUNT(DISTINCT CASE WHEN ar.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN u.id END) as activeToday,
  COUNT(DISTINCT CASE WHEN ar.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN u.id END) as activeThisWeek,
  COUNT(DISTINCT CASE WHEN ar.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN u.id END) as activeThisMonth
FROM users u
LEFT JOIN answer_records ar ON u.id = ar.user_id

-- 错题统计
SELECT COUNT(DISTINCT ec.user_id) as usersWithErrors,
  COUNT(DISTINCT ec.question_id) as uniqueErrorQuestions
FROM error_collection ec
INNER JOIN users u ON ec.user_id = u.id
WHERE [条件]

-- 高频错题
SELECT q.content, s.name as subject, COUNT(DISTINCT ec.user_id) as errorCount
FROM error_collection ec
INNER JOIN questions q ON ec.question_id = q.id
INNER JOIN subjects s ON q.subject_id = s.id
INNER JOIN users u ON ec.user_id = u.id
WHERE [条件]
GROUP BY ec.question_id, q.content, s.name
HAVING errorCount >= 2
ORDER BY errorCount DESC
LIMIT 10

-- 题目统计
SELECT COUNT(*) as totalQuestions,
  COUNT(CASE WHEN type = 'single' THEN 1 END) as singleChoice,
  COUNT(CASE WHEN type = 'multiple' THEN 1 END) as multipleChoice,
  COALESCE(AVG(difficulty), 0) as avgDifficulty
FROM questions
```

---

## ❌ AI 当前无法访问的数据

### 1. 题目详细内容字段

**问题**：AI 只知道题目有 `content`、`options`、`correct_answer` 字段，但无法理解内容。

**缺失数据**：
- ❌ 题目关键词（无法提取"分数"、"加减法"等关键词）
- ❌ 题目标签（无法知道这是"计算题"还是"应用题"）
- ❌ 题目难度因素（无法分析为什么难）
- ❌ 相似题目（无法推荐相似题目）
- ❌ 题目质量评分（无法评估题目质量）

**影响**：
- 用户问："找一些关于分数的题目" → AI 无法理解"分数"这个关键词
- 用户问："这道题为什么难？" → AI 无法分析难度因素
- 用户问："推荐和第25题类似的题目" → AI 无法计算相似度

### 2. 用户答题行为细节

**问题**：AI 只能看到 `answer_records` 的汇总数据，看不到具体行为。

**缺失数据**：
- ❌ 答题时间（每道题花了多少秒）
- ❌ 答案修改次数（犹豫不决的次数）
- ❌ 首次答案是否正确（是否改对了）
- ❌ 犹豫时间（鼠标悬停在选项上的时间）
- ❌ 是否跳过后返回（是否先跳过再回来答）

**影响**：
- 用户问："张三为什么答题这么慢？" → AI 无法分析答题时间
- 用户问："李四是不是很犹豫？" → AI 无法看修改次数
- 用户问："王五的学习习惯怎么样？" → AI 无法分析行为模式

### 3. 错题原因分析

**问题**：AI 只知道哪些题错了，不知道为什么错。

**缺失数据**：
- ❌ 错误类型（概念错误/计算错误/粗心错误/理解错误）
- ❌ 错误原因（AI 分析的具体原因）
- ❌ 改进建议（针对性的学习建议）
- ❌ 相关知识点（需要复习的知识点）

**影响**：
- 用户问："张三为什么总做错这类题？" → AI 只能说"正确率低"，无法分析原因
- 用户问："李四的薄弱点是什么？" → AI 只能说"XX知识点正确率低"，无法给出深层原因

### 4. 学习进度和目标

**问题**：AI 无法量化知识点掌握程度，无法跟踪学习目标。

**缺失数据**：
- ❌ 掌握程度（0-100 的掌握度评分）
- ❌ 学习目标（目标掌握程度）
- ❌ 进度百分比（完成目标的百分比）
- ❌ 最近正确率趋势（进步/退步/稳定）
- ❌ AI 学习建议（个性化建议）

**影响**：
- 用户问："张三的数学学到什么程度了？" → AI 只能说"正确率70%"，无法量化掌握度
- 用户问："李四离目标还差多少？" → AI 无法计算目标完成度
- 用户问："给王五一些学习建议" → AI 只能给泛泛的建议，不够个性化

### 5. 学习风格分析

**问题**：AI 无法识别学生的学习风格和习惯。

**缺失数据**：
- ❌ 平均答题时间
- ❌ 答题时间稳定性（是否稳定发挥）
- ❌ 平均修改次数（是否犹豫不决）
- ❌ 跳题率（是否喜欢跳题）
- ❌ 错误模式（概念型错误多还是粗心型错误多）
- ❌ 学习风格标签（"谨慎型"、"快速型"等）

**影响**：
- 用户问："张三是什么类型的学习者？" → AI 无法识别学习风格
- 用户问："李四适合什么样的学习方式？" → AI 无法给出个性化建议

### 6. 系统配置和元数据

**问题**：AI 无法访问系统配置，不知道系统状态。

**缺失数据**：
- ❌ 系统设置（题目数量配置、答题时间限制等）
- ❌ AI 配置（模型信息、缓存设置等）
- ❌ 学科配置（哪些学科支持历史刷题等）
- ❌ 年级班级配置

**影响**：
- 用户问："系统里有多少题目？" → AI 只能统计，不知道系统配置
- 用户问："每个学科有多少道题？" → AI 需要实时统计，效率低

---

## 📈 数据访问能力对比

| 能力 | 当前状态 | 理想状态 | 差距 |
|------|---------|---------|------|
| **用户查询** | ✅ 能查询学生信息 | ✅ | 无 |
| **答题统计** | ✅ 能统计正确率、次数 | ✅ | 无 |
| **群体分析** | ✅ 能分析年级、班级、学科 | ✅ | 无 |
| **错题统计** | ✅ 能统计错题数量 | ✅ | 无 |
| **题目内容理解** | ❌ 无法理解语义 | ✅ 应该能提取关键词、标签 | **差距大** |
| **答题行为分析** | ❌ 只能看到汇总数据 | ✅ 应该能看到答题时间、修改次数 | **差距大** |
| **错题原因诊断** | ❌ 只知道错，不知道为什么 | ✅ 应该能分析错误类型 | **差距大** |
| **学习进度跟踪** | ❌ 无法量化掌握度 | ✅ 应该能跟踪进度、目标 | **差距大** |
| **学习风格识别** | ❌ 无法识别 | ✅ 应该能分析学习习惯 | **差距大** |
| **个性化建议** | ❌ 只能给泛泛建议 | ✅ 应该能生成针对性建议 | **差距大** |

---

## 🎯 数据增强建议

### 优先级 P0（立即实施）

#### 1. 题目语义分析
- **目的**：让 AI 理解题目内容
- **需要创建**：`question_semantic_analysis` 表
- **核心字段**：keywords、auto_tags、knowledge_points、difficulty_factors、similar_questions
- **预期效果**：
  - AI 能回答"找一些关于分数的题目"
  - AI 能推荐相似题目
  - AI 能分析题目为什么难

#### 2. 答题行为跟踪
- **目的**：记录用户答题细节
- **需要增强**：`answer_behavior` 表（已存在）
- **核心字段**：answer_time、answer_modifications、is_first_answer_correct、hesitation_time
- **预期效果**：
  - AI 能分析"张三答题很慢，平均每题2分钟"
  - AI 能识别"李四很犹豫，平均每题修改3次"
  - AI 能发现学习习惯问题

#### 3. 错题原因分析
- **目的**：自动诊断错误类型
- **需要创建**：`error_patterns` 表
- **核心字段**：error_type、error_reason、improvement_suggestion、related_knowledge_points
- **预期效果**：
  - AI 能回答"张三主要犯概念错误，需要复习基础概念"
  - AI 能给出针对性建议

### 优先级 P1（近期实施）

#### 4. 学习进度跟踪
- **目的**：量化知识点掌握程度
- **需要增强**：`learning_progress` 表（已存在）
- **核心字段**：mastery_level、target_goal、progress_percentage、recent_accuracy、accuracy_trend
- **预期效果**：
  - AI 能回答"张三的数学掌握度75%，距离目标还差5%"
  - AI 能跟踪学习进度

#### 5. 学习风格分析
- **目的**：识别学生学习习惯
- **需要创建**：`user_learning_style` 表
- **核心字段**：avg_answer_time、answer_time_stability、avg_modifications、skip_rate、error_patterns、learning_style_tags
- **预期效果**：
  - AI 能回答"张三是谨慎型学习者，答题稳定但较慢"
  - AI 能给出个性化建议

### 优先级 P2（未来实施）

#### 6. AI 学习建议系统
- **目的**：生成个性化学习建议
- **需要创建**：`ai_learning_suggestions` 表
- **核心字段**：suggestion_type、suggestion_text、priority、based_on_data
- **预期效果**：
  - AI 能主动提供学习建议
  - AI 能根据反馈优化建议

---

## 📊 数据量估算

### 当前数据访问量

每次 AI 分析，需要加载的数据量：

```
getDatabaseContext():
- students: ~1,000 条 × 5 字段 = ~50KB
- subjects: ~10 条 × 2 字段 = ~1KB
- grades: ~6 条 = ~0.1KB
- classes: ~4 条 = ~0.1KB
- subcategories: ~100 条 × 3 字段 = ~5KB
- stats: ~1 条 = ~0.1KB
总计: ~56KB

executeQueryPlan()（单次查询）:
- 基础统计: ~1 条 = ~0.1KB
- 学科分析: ~10 条 = ~1KB
- 年级分析: ~6 条 = ~0.5KB
- 班级分析: ~30 条 = ~3KB
- 知识点分析: ~20 条 = ~2KB
- 趋势分析: ~7 条 = ~0.5KB
- 错题统计: ~20 条 = ~2KB
总计: ~9KB

单次分析总数据量: ~65KB
```

### 增强后数据访问量估算

```
新增数据:
- 题目语义分析: ~1,500 条 × 8 字段 = ~100KB（如果全部加载）
- 答题行为: ~50,000 条 × 6 字段 = ~2MB（不建议全部加载）
- 错误模式: ~5,000 条 × 5 字段 = ~200KB
- 学习进度: ~10,000 条 × 8 字段 = ~500KB
- 学习风格: ~1,000 条 × 8 字段 = ~50KB

优化策略:
- 不在 getDatabaseContext() 中预加载
- 在 executeQueryPlan() 中按需查询
- 单次查询限制在 10-50KB
```

---

## 🚀 实施路线图

### 第一阶段（1-2周）：题目语义增强
1. 创建 `question_semantic_analysis` 表
2. 实现 AI 语义分析方法
3. 批量分析现有题目
4. 更新 AI 上下文

### 第二阶段（1-2周）：行为数据增强
1. 增强 `answer_behavior` 表
2. 前端集成行为跟踪
3. 后端记录行为数据
4. 实现 AI 行为分析

### 第三阶段（1-2周）：错误诊断与学习分析
1. 创建 `error_patterns` 表
2. 实现 AI 错误分析方法
3. 增强 `learning_progress` 表
4. 创建 `user_learning_style` 表
5. 实现 AI 学习建议

### 第四阶段（持续优化）
1. 收集用户反馈
2. 优化 AI 分析准确性
3. 扩展分析维度

---

## 📝 总结

### 当前 AI 能力
✅ **擅长**：
- 统计分析（正确率、次数、排名）
- 群体对比（年级、班级、学科）
- 趋势分析（时间维度）
- 基础查询（学生信息、题目信息）

❌ **不擅长**：
- 内容理解（无法理解题目语义）
- 行为分析（无法分析答题细节）
- 原因诊断（无法分析错误原因）
- 个性化建议（无法提供针对性指导）

### 核心差距
**当前 AI 更像"数据统计员"**，能准确统计和对比数据。  
**目标 AI 应该是"教育专家"**，能理解内容、分析行为、诊断问题、提供建议。

### 关键建议
1. **立即实施题目语义分析**：这是最基础的，能立即提升 AI 理解能力
2. **尽快积累行为数据**：答题时间、修改次数等数据需要长期积累
3. **逐步实现错误诊断**：基于语义和行为数据，实现智能诊断
4. **最终实现个性化建议**：整合所有数据，生成针对性建议

---

**文档版本**: v1.0  
**最后更新**: 2026-03-27
