# AItest 分支数据库迁移指南

## 📋 问题说明

**部署后报错原因**：AItest 分支新增了 AI 聊天功能，需要在数据库中创建相关表，但线上服务器缺少这些表。

**错误表现**：
```
GET http://10.78.127.30:3001/api/chat/models?page=1&limit=12 500 (Internal Server Error)
GET http://10.78.127.30:3001/api/chat/models/stats 500 (Internal Server Error)
POST http://10.78.127.30:3001/api/chat/models 500 (Internal Server Error)
```

**根本原因**：数据库缺少以下表：
- `ai_models` - AI 模型配置表
- `chat_sessions` - 聊天会话表
- `chat_messages` - 聊天消息表
- `token_usage` - Token 使用记录表
- `cache_hits` - 缓存命中记录表

---

## 🚀 快速修复步骤（推荐）

### 第一步：SSH 登录服务器

```bash
# 替换为你的服务器地址
ssh user@your-server-ip

# 切换到项目目录
cd /var/www/PSCG
```

---

### 第二步：备份数据库（强制）

```bash
# 创建备份目录
mkdir -p ~/backups

# 备份数据库
mysqldump -u root -p --single-transaction --routines --triggers pscg_db > ~/backups/pscg_db_before_migration_$(date +%Y%m%d_%H%M%S).sql

# 压缩备份文件
gzip ~/backups/pscg_db_before_migration_*.sql

# 验证备份文件
ls -lh ~/backups/
```

**记录备份文件位置**：
```bash
echo "备份文件: ~/backups/pscg_db_before_migration_$(date +%Y%m%d_%H%M%S).sql.gz"
```

---

### 第三步：上传迁移脚本到服务器

**方法1：使用 SCP 上传（如果迁移脚本在本地）**

```bash
# 在本地执行（Windows PowerShell）
scp migrations/migrate_to_aittest.sql user@your-server:/tmp/
scp migrations/rollback_from_aittest.sql user@your-server:/tmp/
```

**方法2：使用 Git Clone（如果迁移脚本在 Git 仓库）**

```bash
# 在服务器上执行
cd /tmp
git clone https://github.com/your-repo/PSCG.git
cd PSCG/migrations
```

---

### 第四步：执行数据库迁移

```bash
# SSH 登录服务器
ssh user@your-server-ip

# 切换到迁移脚本目录（根据上传方式）
cd /tmp  # 如果使用 SCP 上传
# 或
cd /tmp/PSCG/migrations  # 如果使用 Git Clone

# 执行迁移脚本
mysql -u root -p pscg_db < migrate_to_aittest.sql

# 查看执行结果
echo "迁移完成，请检查上方输出是否有错误"
```

**预期输出**：
```
✅ AItest 分支数据库迁移完成！
⚠️  请在后台配置 AI 模型的 API Key
```

---

### 第五步：验证数据库表结构

```bash
# 登录 MySQL
mysql -u root -p pscg_db

# 检查表是否创建成功
SHOW TABLES;

# 检查 ai_models 表结构
DESC ai_models;

# 检查是否有默认模型
SELECT * FROM ai_models;

# 退出 MySQL
exit;
```

**预期结果**：
- 表列表中应该有：`ai_models`、`chat_sessions`、`chat_messages`、`token_usage`、`cache_hits`
- `ai_models` 表应该有一条默认记录（但未启用）

---

### 第六步：重启服务

```bash
# 重启 PM2 服务
pm2 restart PSCG

# 查看日志
pm2 logs PSCG --lines 50

# 健康检查
curl http://localhost:3001/api/health
```

---

### 第七步：测试 AI 聊天功能

在浏览器中访问后台管理页面：
1. 登录后台
2. 进入"AI 模型管理"页面
3. 应该能看到模型列表（可能为空）
4. 点击"添加模型"配置一个 AI 模型

---

## 🔧 详细迁移说明

### 迁移脚本内容

`migrate_to_aittest.sql` 脚本会：

1. **创建 AI 模型配置表**（`ai_models`）
   - 字段：`name`、`provider`、`base_url`、`api_key`、`model_id`、`is_default`、`is_active` 等
   - 索引：`idx_provider`、`idx_is_default`、`idx_is_active`

2. **创建聊天会话表**（`chat_sessions`）
   - 字段：`id`（UUID）、`admin_id`、`model_id`、`title`、`total_tokens` 等
   - 外键：关联 `admin_credentials` 和 `ai_models`

3. **创建聊天消息表**（`chat_messages`）
   - 字段：`session_id`、`admin_id`、`model_id`、`role`、`content`、`tokens` 等
   - 外键：关联 `chat_sessions`、`admin_credentials`、`ai_models`

4. **创建 Token 使用记录表**（`token_usage`）
   - 字段：`admin_id`、`session_id`、`model_id`、`input_tokens`、`output_tokens`、`cost` 等
   - 外键：关联 `admin_credentials`、`chat_sessions`、`ai_models`

5. **创建缓存命中记录表**（`cache_hits`）
   - 字段：`query_hash`、`query_text`、`response_hash`、`hit_count`、`tokens_saved` 等

6. **扩展学科表**（`subjects`）
   - 新增字段：`show_in_history_quiz`

7. **添加性能优化索引**
   - `questions` 表：`idx_questions_type`、`idx_questions_created`、`idx_questions_filter`

8. **插入默认模型配置**
   - 插入一个示例配置（未启用，需要后续配置 API Key）

---

### 安全性保障

✅ **幂等性**：脚本使用 `IF NOT EXISTS` 和条件判断，可以安全重复执行

✅ **数据保护**：只创建新表，不修改现有数据

✅ **外键约束**：确保数据一致性，防止孤立记录

✅ **索引优化**：提升查询性能，减少数据库负载

---

## ⚠️ 常见问题

### 1. 迁移脚本报错"表已存在"

**原因**：之前可能部分执行过迁移脚本

**解决**：脚本已包含检查逻辑，会自动跳过已存在的表

---

### 2. 迁移后仍然报错 500

**可能原因**：
1. 服务未重启
2. 数据库连接配置错误
3. 表字段不匹配

**排查步骤**：
```bash
# 检查服务日志
pm2 logs PSCG --lines 100

# 检查数据库表结构
mysql -u root -p pscg_db -e "DESC ai_models"

# 检查是否有默认模型
mysql -u root -p pscg_db -e "SELECT * FROM ai_models"
```

---

### 3. 如何配置 AI 模型

**方法1：通过后台界面配置**
1. 登录后台管理
2. 进入"AI 模型管理"页面
3. 点击"添加模型"
4. 填写模型信息：
   - 名称：`GPT-3.5 Turbo`
   - 提供商：`openai`
   - API 地址：`https://api.openai.com/v1`
   - 模型 ID：`gpt-3.5-turbo`
   - API Key：`sk-xxx...`（你的 OpenAI API Key）
5. 保存并测试连接

**方法2：通过 SQL 直接插入**
```sql
-- 登录 MySQL
mysql -u root -p pscg_db

-- 插入模型配置（API Key 会被自动加密）
INSERT INTO ai_models (name, provider, base_url, api_key, model_id, is_default, is_active, max_tokens, temperature)
VALUES ('GPT-3.5 Turbo', 'openai', 'https://api.openai.com/v1', 'sk-your-api-key-here', 'gpt-3.5-turbo', 1, 1, 4096, 0.7);

-- 查看结果
SELECT * FROM ai_models;
```

---

### 4. 如何回滚到 master 分支

如果部署后发现问题，需要回滚：

```bash
# 1. 回滚代码
cd /var/www/PSCG
pm2 stop PSCG
git checkout master
git pull origin master
npm install --production
npm run build

# 2. 执行数据库回滚脚本
mysql -u root -p pscg_db < /path/to/rollback_from_aittest.sql

# 3. 重启服务
pm2 start PSCG

# 4. 验证服务
curl http://localhost:3001/api/health
```

---

## 📊 迁移验证清单

执行完迁移后，请验证：

### 数据库验证
- [ ] `ai_models` 表已创建
- [ ] `chat_sessions` 表已创建
- [ ] `chat_messages` 表已创建
- [ ] `token_usage` 表已创建
- [ ] `cache_hits` 表已创建
- [ ] `subjects` 表有 `show_in_history_quiz` 字段
- [ ] `questions` 表有性能优化索引

### 服务验证
- [ ] PM2 服务重启成功
- [ ] 健康检查接口正常：`/api/health`
- [ ] 后台可以访问"AI 模型管理"页面
- [ ] 可以添加新的 AI 模型
- [ ] 可以测试模型连接

### 功能验证
- [ ] 可以创建聊天会话
- [ ] 可以发送消息
- [ ] AI 可以回复
- [ ] Token 使用统计正常

---

## 🔗 相关文档

- [部署指南](./部署-AItest分支上线指南.md)
- [部署工具使用说明](./部署工具使用说明.md)
- [项目开发规范](./项目规则.md)

---

## 📞 技术支持

如果迁移过程中遇到问题：

1. **检查日志**：`pm2 logs PSCG --lines 100`
2. **检查数据库**：`mysql -u root -p pscg_db -e "SHOW TABLES"`
3. **检查备份**：`ls -lh ~/backups/`
4. **回滚操作**：执行 `rollback_from_aittest.sql` 脚本
5. **联系开发团队**：提供完整错误日志和数据库状态

---

**最后更新**：2026-04-01  
**版本**：v1.0