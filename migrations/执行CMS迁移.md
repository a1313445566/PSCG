# CMS 数据库迁移执行指南

> 创建日期：2026-04-09
> 迁移脚本：`add-cms-tables.sql`

---

## 一、迁移前准备

### 1.1 备份数据库（强烈建议）

```bash
# 使用 mysqldump 备份整个数据库
mysqldump -u root -p pscg_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 或使用 Navicat/MySQL Workbench 图形界面备份
```

### 1.2 确认数据库连接信息

请检查 `.env` 文件中的数据库配置：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pscg_db
```

---

## 二、执行迁移

### 方式1：命令行执行（推荐）

```bash
# 进入项目根目录
cd e:\PSCG

# 执行迁移脚本
mysql -u root -p pscg_db < migrations/add-cms-tables.sql

# 或指定完整路径
mysql -h localhost -u root -p -D pscg_db < "e:\PSCG\migrations\add-cms-tables.sql"
```

### 方式2：MySQL 客户端执行

```bash
# 登录 MySQL
mysql -u root -p

# 切换到目标数据库
USE pscg_db;

# 执行迁移脚本
source e:/PSCG/migrations/add-cms-tables.sql;

# 或使用相对路径
source ./migrations/add-cms-tables.sql;
```

### 方式3：图形界面工具（Navicat/MySQL Workbench）

1. 打开 Navicat 或 MySQL Workbench
2. 连接到目标数据库
3. 打开查询窗口
4. 复制 `add-cms-tables.sql` 的全部内容
5. 执行查询

---

## 三、验证迁移结果

### 3.1 检查表是否创建成功

```sql
-- 查看所有 CMS 表
SHOW TABLES LIKE 'cms_%';

-- 预期结果：
-- cms_articles
-- cms_article_tags
-- cms_categories
-- cms_tags
```

### 3.2 检查表结构

```sql
-- 查看文章表结构
DESC cms_articles;

-- 查看分类表结构
DESC cms_categories;

-- 查看标签表结构
DESC cms_tags;

-- 查看关联表结构
DESC cms_article_tags;
```

### 3.3 检查默认数据

```sql
-- 查看分类数据（预期：5 条）
SELECT * FROM cms_categories;

-- 查看标签数据（预期：10 条）
SELECT * FROM cms_tags;
```

### 3.4 检查外键约束

```sql
-- 查看外键约束
SELECT
  TABLE_NAME AS 表名,
  COLUMN_NAME AS 列名,
  REFERENCED_TABLE_NAME AS 引用表,
  REFERENCED_COLUMN_NAME AS 引用列
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('cms_articles', 'cms_article_tags')
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- 预期结果：
-- cms_articles.category_id -> cms_categories.id
-- cms_article_tags.article_id -> cms_articles.id
-- cms_article_tags.tag_id -> cms_tags.id
```

---

## 四、迁移成功标志

如果看到以下输出，说明迁移成功：

```
📦 开始执行 CMS 内容管理系统迁移脚本...
✅ 第 1 步完成：cms_categories 表已创建
✅ 第 2 步完成：cms_tags 表已创建
✅ 第 3 步完成：cms_articles 表已创建
✅ 第 4 步完成：cms_article_tags 表已创建
✅ 第 5 步完成：已插入 5 个默认分类
✅ 第 6 步完成：已插入 10 个默认标签
========================================
🎉 CMS 内容管理系统迁移完成！正在执行验证...
========================================
✅ 通过  cms_categories 表: 7 个字段
✅ 通过  cms_tags 表: 5 个字段
✅ 通过  cms_articles 表: 12 个字段
✅ 通过  cms_article_tags 表: 4 个字段
========================================
🚀 迁移脚本执行完毕！
========================================
```

---

## 五、常见问题

### 5.1 表已存在错误

**错误信息**：`Table 'cms_articles' already exists`

**解决方案**：
```sql
-- 删除已存在的表（注意：会丢失数据！）
DROP TABLE IF EXISTS cms_article_tags;
DROP TABLE IF EXISTS cms_articles;
DROP TABLE IF EXISTS cms_tags;
DROP TABLE IF EXISTS cms_categories;

-- 然后重新执行迁移脚本
```

### 5.2 外键约束错误

**错误信息**：`Cannot add foreign key constraint`

**解决方案**：
1. 确保数据库引擎为 InnoDB：`SHOW ENGINES;`
2. 确保字符集为 utf8mb4：`SHOW VARIABLES LIKE 'character%';`
3. 确保引用的表已创建（按顺序执行）

### 5.3 权限不足

**错误信息**：`Access denied for user`

**解决方案**：
```sql
-- 授予用户权限
GRANT ALL PRIVILEGES ON pscg_db.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

---

## 六、回滚方案（如需撤销迁移）

```sql
-- ⚠️ 警告：以下操作会删除所有 CMS 数据！

-- 删除表（注意顺序，先删除依赖表）
DROP TABLE IF EXISTS cms_article_tags;
DROP TABLE IF EXISTS cms_articles;
DROP TABLE IF EXISTS cms_tags;
DROP TABLE IF EXISTS cms_categories;
```

---

## 七、下一步

迁移成功后，请继续执行：

1. **任务3-5**：创建服务层（`categoryService.js`, `tagService.js`, `articleService.js`）
2. **任务6-10**：创建路由层（`admin-categories.js`, `admin-tags.js`, `admin-articles.js`, `articles.js`）
3. **任务11-15**：创建前端用户端组件
4. **任务16-19**：创建前端后台管理组件

---

## 八、相关文档

- [迁移脚本](./add-cms-tables.sql)
- [任务文档](../DOCS/CMS功能完善/TASK_CMS功能完善.md)
- [共识文档](../DOCS/CMS功能完善/CONSENSUS_CMS功能完善.md)
