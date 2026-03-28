# MySQL 8.0 参数化查询注意事项

**文档用途**: 记录 MySQL 8.0 与 mysql2 驱动的参数化查询限制和正确用法  
**适用对象**: AI 助手、开发人员  
**版本**: v1.0  
**最后更新**: 2026-03-27

---

## 🔴 核心问题：VALUES ? 语法不支持

### 问题描述

**MySQL 8.0 + mysql2 驱动不支持 `VALUES ?` 批量插入语法！**

这是最常见的错误，会导致 SQL 语法错误：

```sql
-- ❌ 错误：MySQL2 不支持这种语法
INSERT INTO table (col1, col2) VALUES ?
```

**错误信息**：
```
Error: You have an error in your SQL syntax; 
check the manual that corresponds to your MySQL server version 
for the right syntax to use near '?' at line 4
```

---

## ✅ 正确的批量插入方法

### 方法一：手动构建占位符（推荐）

```javascript
// ✅ 正确：手动构建占位符
const items = [
  { a: 1, b: 'x' },
  { a: 2, b: 'y' },
  { a: 3, b: 'z' }
];

// 1. 构建占位符：(?, ?), (?, ?), (?, ?)
const placeholders = items.map(() => '(?, ?)').join(', ');

// 2. 扁平化参数：[1, 'x', 2, 'y', 3, 'z']
const values = items.flatMap(item => [item.a, item.b]);

// 3. 执行 SQL
await db.query(
  `INSERT INTO table (col1, col2) VALUES ${placeholders}`,
  values
);
```

### 方法二：循环插入（适合少量数据）

```javascript
// ✅ 正确：循环插入（适合少量数据，< 100 条）
for (const item of items) {
  await db.query(
    'INSERT INTO table (col1, col2) VALUES (?, ?)',
    [item.a, item.b]
  );
}
```

### 方法三：使用事务批量插入（推荐）

```javascript
// ✅ 正确：使用事务批量插入
const connection = await db.pool.getConnection();
await connection.beginTransaction();

try {
  for (const item of items) {
    await connection.query(
      'INSERT INTO table (col1, col2) VALUES (?, ?)',
      [item.a, item.b]
    );
  }
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

---

## 📋 常见场景示例

### 场景 1：批量插入答题行为

```javascript
// ❌ 错误示例
const behaviors = [
  { userId: 1, questionId: 1, answerTime: 30 },
  { userId: 1, questionId: 2, answerTime: 25 }
];

await db.query(
  `INSERT INTO answer_behavior 
   (user_id, question_id, answer_time) VALUES ?`,
  [behaviors.map(b => [b.userId, b.questionId, b.answerTime])]
);
```

```javascript
// ✅ 正确示例
const behaviors = [
  { userId: 1, questionId: 1, answerTime: 30 },
  { userId: 1, questionId: 2, answerTime: 25 }
];

// 构建占位符
const placeholders = behaviors.map(() => '(?, ?, ?)').join(', ');

// 扁平化参数
const values = behaviors.flatMap(b => [
  b.userId,
  b.questionId,
  b.answerTime
]);

await db.query(
  `INSERT INTO answer_behavior 
   (user_id, question_id, answer_time) VALUES ${placeholders}`,
  values
);
```

### 场景 2：批量插入 AI 任务

```javascript
// ❌ 错误示例
const tasks = [
  { taskType: 'semantic', targetId: 1, priority: 5 },
  { taskType: 'semantic', targetId: 2, priority: 5 }
];

await db.query(
  `INSERT INTO ai_analysis_queue 
   (task_type, target_id, priority, status, created_at) VALUES ?`,
  [tasks.map(t => [t.taskType, t.targetId, t.priority, 'pending', new Date()])]
);
```

```javascript
// ✅ 正确示例
const tasks = [
  { taskType: 'semantic', targetId: 1, priority: 5 },
  { taskType: 'semantic', targetId: 2, priority: 5 }
];

// 构建占位符
const placeholders = tasks.map(() => '(?, ?, ?, ?, ?)').join(', ');

// 扁平化参数
const values = tasks.flatMap(t => [
  t.taskType,
  t.targetId,
  t.priority,
  'pending',
  new Date()
]);

await db.query(
  `INSERT INTO ai_analysis_queue 
   (task_type, target_id, priority, status, created_at) VALUES ${placeholders}`,
  values
);
```

---

## ⚠️ 其他 MySQL 8.0 限制

### 1. 不支持 `INTEGER PRIMARY KEY AUTOINCREMENT`（SQLite 语法）

```sql
-- ❌ 错误：SQLite 语法
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT
);
```

```sql
-- ✅ 正确：MySQL 语法
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 2. 不支持 `TEXT` 类型作为主键

```sql
-- ❌ 错误：TEXT 不能作为主键
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name VARCHAR(100)
);
```

```sql
-- ✅ 正确：使用 VARCHAR
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 3. 不支持 `DATETIME DEFAULT NOW()`（SQLite 语法）

```sql
-- ❌ 错误：SQLite 语法
CREATE TABLE logs (
  id INT PRIMARY KEY,
  created_at DATETIME DEFAULT NOW()
);
```

```sql
-- ✅ 正确：MySQL 语法
CREATE TABLE logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 4. 必须指定 ENGINE 和 CHARSET

```sql
-- ⚠️ 不推荐：没有指定引擎和字符集
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100)
);
```

```sql
-- ✅ 推荐：明确指定
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 📊 性能优化建议

### 1. 批量插入时使用事务

```javascript
// ✅ 推荐：使用事务提高性能
const connection = await db.pool.getConnection();
await connection.beginTransaction();

try {
  for (let i = 0; i < 1000; i++) {
    await connection.query(
      'INSERT INTO logs (message) VALUES (?)',
      [`Log ${i}`]
    );
  }
  await connection.commit();
  console.log('批量插入 1000 条数据成功');
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

### 2. 批量插入时限制每批数量

```javascript
// ✅ 推荐：分批插入（每批 1000 条）
const batchSize = 1000;

for (let i = 0; i < items.length; i += batchSize) {
  const batch = items.slice(i, i + batchSize);
  
  const placeholders = batch.map(() => '(?, ?)').join(', ');
  const values = batch.flatMap(item => [item.a, item.b]);
  
  await db.query(
    `INSERT INTO table (col1, col2) VALUES ${placeholders}`,
    values
  );
  
  console.log(`已插入 ${Math.min(i + batchSize, items.length)} / ${items.length} 条`);
}
```

---

## 🔍 调试技巧

### 1. 打印生成的 SQL

```javascript
const items = [{ a: 1, b: 'x' }, { a: 2, b: 'y' }];
const placeholders = items.map(() => '(?, ?)').join(', ');
const values = items.flatMap(item => [item.a, item.b]);

const sql = `INSERT INTO table (col1, col2) VALUES ${placeholders}`;

console.log('SQL:', sql);
console.log('Values:', values);

// 输出：
// SQL: INSERT INTO table (col1, col2) VALUES (?, ?), (?, ?)
// Values: [1, 'x', 2, 'y']
```

### 2. 检查参数数量

```javascript
const items = [{ a: 1, b: 'x', c: 'z' }, { a: 2, b: 'y', c: 'w' }];
const placeholders = items.map(() => '(?, ?, ?)').join(', ');
const values = items.flatMap(item => [item.a, item.b, item.c]);

// 检查占位符数量和参数数量是否匹配
const placeholderCount = (placeholders.match(/\?/g) || []).length;
const valueCount = values.length;

if (placeholderCount !== valueCount) {
  console.error('占位符数量和参数数量不匹配！');
  console.error(`占位符: ${placeholderCount}, 参数: ${valueCount}`);
}
```

---

## 📝 检查清单

**在执行批量插入前，检查以下项目**：

- [ ] 是否使用了 `VALUES ?` 语法？（❌ 必须改为手动构建占位符）
- [ ] 占位符数量和参数数量是否匹配？
- [ ] 是否在大量数据时使用了事务？
- [ ] 是否分批插入（每批 < 1000 条）？
- [ ] 是否使用了 SQLite 语法？（❌ 必须改为 MySQL 语法）
- [ ] 是否指定了 ENGINE 和 CHARSET？

---

## 🔗 相关文档

- **常见错误示例**: `DOCS/常见错误示例.md`
- **编码规范**: `DOCS/开发文档/编码规范.md`
- **技术栈清单**: `DOCS/技术栈清单.md`

---

## 📌 总结

| 问题 | 错误示例 | 正确示例 |
|------|----------|----------|
| **批量插入** | `VALUES ?` | 手动构建占位符 `VALUES (?, ?), (?, ?)` |
| **主键** | `INTEGER PRIMARY KEY AUTOINCREMENT` | `INT AUTO_INCREMENT PRIMARY KEY` |
| **默认时间** | `DATETIME DEFAULT NOW()` | `DATETIME DEFAULT CURRENT_TIMESTAMP` |
| **文本主键** | `TEXT PRIMARY KEY` | `VARCHAR(50) PRIMARY KEY` |

**核心原则**：
1. ✅ 永远不要使用 `VALUES ?` 语法
2. ✅ 手动构建占位符并扁平化参数
3. ✅ 批量插入时使用事务
4. ✅ 使用 MySQL 8.0 语法，不要使用 SQLite 语法
