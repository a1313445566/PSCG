# AItest 分支部署指南

## 📋 部署概览

- **源分支**: AItest（新功能）
- **目标服务器**: Ubuntu 24
- **当前运行**: master 分支
- **部署方式**: Git 拉取 + PM2 重启
- **预计停机时间**: 5-10分钟

---

## ⚠️ 部署前必须确认

### 1. 数据库变更检查

**检查 AItest 分支是否有数据库结构变更**

```bash
# 在本地 AItest 分支执行
git diff master..AItest -- services/database.js routes/*.js | grep -i "CREATE TABLE\|ALTER TABLE\|DROP TABLE"

# 或查看数据库迁移文件（如果有）
ls -la migrations/ 2>/dev/null || echo "无迁移文件"
```

**如果有数据库变更**：
- ✅ 准备 SQL 迁移脚本
- ✅ 在测试环境验证迁移脚本
- ✅ 准备回滚 SQL 脚本
- ✅ **备份数据库**（强制）

**如果无数据库变更**：
- ✅ 仅需代码部署

---

### 2. 环境变量检查

**对比 master 和 AItest 的环境变量差异**

```bash
# 查看是否新增了环境变量
git diff master..AItest -- .env.example 2>/dev/null || echo "无 .env.example 变更"
```

**需要确认的环境变量**（如果有）：
```bash
# 登录线上服务器检查
ssh user@your-server
cd /path/to/PSCG
cat .env
```

**记录当前环境变量**：
- `DB_HOST`、`DB_USER`、`DB_PASSWORD`、`DB_NAME`
- `JWT_SECRET`
- `AI_API_KEY`（如果有）
- 其他自定义配置

---

### 3. 依赖包变更检查

```bash
# 检查 package.json 变化
git diff master..AItest -- package.json
```

**如果有新增依赖**：
- ✅ 确认依赖包安全
- ✅ 检查是否有 peerDependencies 冲突
- ✅ 提前在本地 `npm install` 测试

---

## 🚀 完整部署流程

### 阶段一：本地准备（10分钟）

#### 1.1 代码最终检查

```bash
# 切换到 AItest 分支
git checkout AItest
git pull origin AItest

# 代码质量检查
npm run lint:check
npm run format

# 本地构建测试
npm run build

# 检查构建产物
ls -lh dist/
```

#### 1.2 创建部署清单文件

```bash
# 创建部署信息文件
cat > DEPLOY_INFO.md <<EOF
# 部署信息

- 部署时间: $(date '+%Y-%m-%d %H:%M:%S')
- 部署分支: AItest
- 部署人: $(git config user.name)
- Git 提交: $(git rev-parse HEAD)
- Git 信息: $(git log -1 --pretty=format:'%h - %s (%ar)')

## 数据库变更
- [ ] 无数据库变更
- [ ] 有数据库变更（已准备 SQL 脚本）

## 环境变量变更
- [ ] 无新增环境变量
- [ ] 有新增环境变量（已配置）

## 新增依赖
- [ ] 无新增依赖
- [ ] 有新增依赖（已测试）
EOF

# 提交到 Git
git add DEPLOY_INFO.md
git commit -m "docs: 添加部署信息文档"
git push origin AItest
```

---

### 阶段二：线上备份（5分钟）

#### 2.1 SSH 登录服务器

```bash
# 替换为你的服务器地址
ssh user@your-server-ip

# 切换到项目目录（假设在 /var/www/PSCG）
cd /var/www/PSCG
```

#### 2.2 数据库备份（强制）

```bash
# 创建备份目录
mkdir -p ~/backups
cd ~/backups

# 备份整个数据库（包含结构和数据）
mysqldump -u root -p --single-transaction --routines --triggers pscg_db > pscg_db_$(date +%Y%m%d_%H%M%S).sql

# 压缩备份文件
gzip pscg_db_*.sql

# 验证备份文件
ls -lh ~/backups/

# 记录备份文件位置
echo "备份文件: ~/backups/pscg_db_$(date +%Y%m%d_%H%M%S).sql.gz"
```

#### 2.3 代码备份

```bash
cd /var/www/PSCG

# 创建备份目录
BACKUP_DIR=~/backups/code_backup_$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份关键目录
cp -r dist $BACKUP_DIR/
cp -r images $BACKUP_DIR/
cp -r audio $BACKUP_DIR/
cp .env $BACKUP_DIR/
cp package.json $BACKUP_DIR/

# 记录当前 Git 状态
git log -1 > $BACKUP_DIR/git_log.txt
git status > $BACKUP_DIR/git_status.txt

echo "代码备份完成: $BACKUP_DIR"
ls -lh $BACKUP_DIR
```

---

### 阶段三：部署执行（10分钟）

#### 3.1 暂停服务（通知用户）

```bash
cd /var/www/PSCG

# 检查当前 PM2 状态
pm2 list

# 创建维护页面（可选）
cat > dist/maintenance.html <<EOF
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>系统维护中</title>
    <style>
        body { font-family: Arial; text-align: center; padding: 50px; }
        h1 { color: #333; }
        p { color: #666; }
    </style>
</head>
<body>
    <h1>🔧 系统维护中</h1>
    <p>正在部署新功能，预计 10 分钟后恢复</p>
    <p>感谢您的耐心等待！</p>
</body>
</html>
EOF

# 使用 Nginx 重定向到维护页面（如果有 Nginx）
# 或者在 server.cjs 中添加维护中间件

# 停止服务
pm2 stop PSCG

# 等待 3 秒确保进程完全停止
sleep 3

# 确认进程已停止
pm2 list
```

#### 3.2 拉取 AItest 分支代码

```bash
cd /var/www/PSCG

# 保存当前分支信息
echo "当前分支: $(git branch --show-current)" > ~/backups/current_branch.txt
echo "当前提交: $(git rev-parse HEAD)" >> ~/backups/current_branch.txt

# 拉取最新代码
git fetch --all
git checkout AItest
git pull origin AItest

# 验证代码
git log -1
git status
```

#### 3.3 安装依赖

```bash
# 安装后端依赖
npm install --production

# 安装前端构建依赖（如果 package.json 有变化）
npm install
```

#### 3.4 构建前端

```bash
# 构建生产版本
npm run build

# 验证构建产物
ls -lh dist/
du -sh dist/
```

#### 3.5 数据库迁移（如果有）

```bash
# 仅在数据库结构有变更时执行
# 假设你有迁移脚本: migrations/migrate_to_aittest.sql

# 检查迁移脚本是否存在
if [ -f "migrations/migrate_to_aittest.sql" ]; then
    echo "执行数据库迁移..."
    
    # 先在测试数据库验证（强烈建议）
    # mysql -u root -p test_db < migrations/migrate_to_aittest.sql
    
    # 生产环境执行迁移
    mysql -u root -p pscg_db < migrations/migrate_to_aittest.sql
    
    echo "数据库迁移完成"
else
    echo "无数据库迁移脚本，跳过"
fi
```

#### 3.6 启动服务

```bash
# 使用 PM2 启动服务
pm2 start PSCG

# 或者如果没有 PM2 配置，手动启动
# pm2 start server.cjs --name PSCG

# 查看启动状态
pm2 list
pm2 logs PSCG --lines 50

# 等待服务完全启动
sleep 5

# 检查服务健康状态
curl -f http://localhost:3001/api/health || echo "服务启动失败！"
```

---

### 阶段四：部署验证（5分钟）

#### 4.1 服务健康检查

```bash
# 检查进程状态
pm2 list
pm2 monit

# 检查端口监听
netstat -tlnp | grep 3001

# 检查 API 健康状态
curl http://localhost:3001/api/health
curl http://localhost:3001/api/tools

# 检查日志
pm2 logs PSCG --lines 100
```

#### 4.2 功能测试（在本地浏览器）

```bash
# 在本地执行（替换为你的服务器 IP 或域名）
# 1. 访问首页
curl -I http://your-server-ip:3001/

# 2. 测试登录接口
curl -X POST http://your-server-ip:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# 3. 测试数据查询接口
curl http://your-server-ip:3001/api/subjects

# 4. 测试图片上传接口（如果有）
curl -I http://your-server-ip:3001/images/
```

#### 4.3 浏览器验证

打开浏览器，访问以下页面：

1. ✅ 首页加载正常
2. ✅ 登录功能正常
3. ✅ 新功能可以访问
4. ✅ 图片/音频文件加载正常
5. ✅ 数据查询正常

---

### 阶段五：回滚方案（紧急情况）

#### 5.1 快速回滚到 master 分支

```bash
cd /var/www/PSCG

# 1. 立即停止服务
pm2 stop PSCG

# 2. 回滚到 master 分支
git checkout master
git pull origin master

# 3. 回滚数据库（如果有迁移）
if [ -f "migrations/rollback_from_aittest.sql" ]; then
    mysql -u root -p pscg_db < migrations/rollback_from_aittest.sql
fi

# 4. 回滚代码
npm install --production
npm run build

# 5. 恢复备份文件（如果需要）
# cp ~/backups/code_backup_YYYYMMDD_HHMMSS/dist/* dist/
# cp ~/backups/code_backup_YYYYMMDD_HHMMSS/images/* images/

# 6. 重启服务
pm2 start PSCG

# 7. 验证服务
curl http://localhost:3001/api/health
```

#### 5.2 数据库恢复（极端情况）

```bash
# 如果部署导致数据损坏，立即恢复数据库

# 停止服务
pm2 stop PSCG

# 恢复数据库
cd ~/backups
gunzip pscg_db_*.sql.gz
mysql -u root -p pscg_db < pscg_db_*.sql

# 重启服务
pm2 start PSCG
```

---

## 📝 部署检查清单

### 部署前检查（本地）

- [ ] 确认 AItest 分支代码已通过测试
- [ ] 确认无未提交的代码变更
- [ ] 确认 package.json 依赖变化
- [ ] 确认数据库迁移脚本（如果有）
- [ ] 确认环境变量配置（如果有）
- [ ] 本地执行 `npm run build` 成功
- [ ] 本地执行 `npm run lint` 无错误

### 部署前准备（线上）

- [ ] SSH 登录服务器成功
- [ ] 数据库备份完成
- [ ] 代码备份完成
- [ ] 环境变量备份完成
- [ ] 当前 Git 状态已记录

### 部署执行

- [ ] 服务已停止
- [ ] Git 切换到 AItest 分支成功
- [ ] 依赖安装完成
- [ ] 前端构建完成
- [ ] 数据库迁移执行（如有）
- [ ] 服务启动成功

### 部署后验证

- [ ] PM2 进程状态正常
- [ ] API 健康检查通过
- [ ] 首页访问正常
- [ ] 登录功能正常
- [ ] 新功能可以访问
- [ ] 日志无错误信息
- [ ] 性能监控正常

---

## 🔧 常见问题处理

### 1. 端口被占用

```bash
# 检查端口占用
netstat -tlnp | grep 3001

# 强制杀死进程
kill -9 <PID>

# 重启服务
pm2 restart PSCG
```

### 2. 依赖安装失败

```bash
# 清除缓存重新安装
rm -rf node_modules
rm package-lock.json
npm install
```

### 3. 构建失败

```bash
# 检查 Node.js 版本
node -v

# 清除 Vite 缓存
rm -rf node_modules/.vite
npm run build
```

### 4. 数据库连接失败

```bash
# 检查数据库服务状态
systemctl status mysql

# 检查数据库连接配置
cat .env | grep DB_

# 测试数据库连接
mysql -u root -p
```

### 5. PM2 启动失败

```bash
# 查看 PM2 日志
pm2 logs PSCG

# 删除 PM2 配置重新启动
pm2 delete PSCG
pm2 start server.cjs --name PSCG
```

---

## 📊 部署后监控

### 监控指标

```bash
# 实时监控
pm2 monit

# 查看资源使用
pm2 list

# 查看日志
pm2 logs PSCG

# 查看性能监控（如果配置了）
curl http://localhost:3001/api/performance/db
```

### 监控时间表

- **部署后 1 小时**: 每 10 分钟检查一次
- **部署后 24 小时**: 每小时检查一次
- **部署后 7 天**: 每天检查一次

---

## 🎯 最佳实践建议

1. **部署时间选择**: 选择用户访问量最低的时间段（如凌晨 2-5 点）
2. **灰度发布**: 先部署到测试服务器，验证通过后再部署到生产
3. **自动化部署**: 考虑使用 CI/CD 工具（如 GitHub Actions）
4. **监控告警**: 配置自动告警，及时发现异常
5. **文档更新**: 部署完成后更新部署文档

---

## 📞 紧急联系

如果部署过程中遇到无法解决的问题：

1. 立即执行回滚方案
2. 恢复数据库备份
3. 联系开发团队
4. 记录问题详情和日志

---

## 附录：一键部署脚本（可选）

如果你经常部署，可以创建自动化脚本：

```bash
#!/bin/bash
# deploy_aitest.sh - 一键部署脚本

set -e  # 遇到错误立即退出

echo "🚀 开始部署 AItest 分支..."

# 1. 备份数据库
echo "📦 备份数据库..."
mysqldump -u root -p --single-transaction pscg_db > ~/backups/pscg_db_$(date +%Y%m%d_%H%M%S).sql

# 2. 停止服务
echo "⏸️  停止服务..."
pm2 stop PSCG

# 3. 拉取代码
echo "📥 拉取 AItest 分支代码..."
git checkout AItest
git pull origin AItest

# 4. 安装依赖
echo "📦 安装依赖..."
npm install --production

# 5. 构建前端
echo "🔨 构建前端..."
npm run build

# 6. 启动服务
echo "▶️  启动服务..."
pm2 start PSCG

# 7. 健康检查
echo "🏥 健康检查..."
sleep 5
curl -f http://localhost:3001/api/health

echo "✅ 部署完成！"
pm2 list
```

**使用方法**：

```bash
chmod +x deploy_aitest.sh
./deploy_aitest.sh
```

---

**最后更新**: 2026-04-01
**文档版本**: v1.0