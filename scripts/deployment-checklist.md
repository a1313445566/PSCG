# PSCG 生产环境部署检查清单

**部署日期**: 2026-04-01  
**目标分支**: AItest  
**部署方式**: PM2 + Nginx

---

## 📋 部署前检查清单

### ✅ 本地准备（在开发机器上）

- [ ] **代码已提交并推送**
  ```bash
  git status
  git log -1 --oneline
  git push origin AItest
  ```

- [ ] **本地测试通过**
  ```bash
  npm run lint
  npm run build
  # 手动测试核心功能
  ```

- [ ] **确认要部署的版本**
  ```bash
  # AItest 分支已删除 AI 功能，包含以下新功能：
  # ✅ 图表响应式修复（VChart resize）
  # ✅ 富文本编辑器优化
  # ✅ 用户中心功能
  # ✅ 文件引用自动管理
  # ❌ AI 相关功能已移除
  ```

### ✅ 线上服务器准备

- [ ] **SSH 登录服务器**
  ```bash
  ssh user@your-server-ip
  ```

- [ ] **进入项目目录**
  ```bash
  cd /var/www/pscg
  ```

- [ ] **检查当前版本**
  ```bash
  git branch --show-current  # 应该显示 master
  git log -1 --oneline
  pm2 status
  ```

- [ ] **确认备份空间充足**
  ```bash
  df -h /var/www
  df -h /var/backups
  ```

---

## 🚀 部署步骤（在服务器上执行）

### 方式 1: 使用自动部署脚本（推荐）

```bash
# 1. 拉取最新代码（包含部署脚本）
git pull origin AItest

# 2. 执行部署脚本
chmod +x scripts/deploy-to-production.sh
./scripts/deploy-to-production.sh
```

### 方式 2: 手动部署

```bash
# ================== 步骤 1: 备份 ==================
# 创建备份目录
BACKUP_DIR="backups/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 备份 dist
cp -r dist "$BACKUP_DIR/"

# 备份 .env
cp .env "$BACKUP_DIR/"

# 备份数据库
mysqldump -u pscg_user -p pscg_db > "$BACKUP_DIR/database_backup.sql"

echo "备份完成: $BACKUP_DIR"

# ================== 步骤 2: 拉取代码 ==================
git fetch origin
git checkout AItest
git pull origin AItest

# ================== 步骤 3: 安装依赖 ==================
npm install

# ================== 步骤 4: 构建前端 ==================
npm run build

# ================== 步骤 5: 重启服务 ==================
pm2 reload pscg-server

# ================== 步骤 6: 验证 ==================
pm2 status
pm2 logs pscg-server --lines 20
curl -I http://localhost:3001/api/health
```

---

## ✅ 部署后验证清单

### 服务状态检查

- [ ] **PM2 服务在线**
  ```bash
  pm2 status
  # 应显示 online
  ```

- [ ] **端口监听正常**
  ```bash
  sudo netstat -tlnp | grep 3001
  # 应显示 LISTEN
  ```

- [ ] **Nginx 运行正常**
  ```bash
  sudo systemctl status nginx
  # 应显示 active (running)
  ```

### 功能测试（浏览器）

- [ ] **首页访问正常**
  - 打开 https://your-domain.com
  - 无控制台错误

- [ ] **后台管理可登录**
  - https://your-domain.com/admin
  - 登录功能正常

- [ ] **图表响应式正常**
  - 打开数据概览页面
  - 改变浏览器窗口大小
  - 图表应自适应，不会变空白

- [ ] **富文本编辑器正常**
  - 编辑题目
  - 粘贴图片测试
  - 工具栏正常

- [ ] **数据库操作正常**
  - 查看题目列表
  - 添加/编辑题目
  - 学生答题功能

### 性能检查

- [ ] **API 响应时间**
  ```bash
  curl -o /dev/null -s -w "%{time_total}\n" http://localhost:3001/api/health
  # 应 < 500ms
  ```

- [ ] **内存使用正常**
  ```bash
  pm2 describe pscg-server | grep memory
  # 应 < 500MB
  ```

- [ ] **无错误日志**
  ```bash
  pm2 logs pscg-server --lines 50
  # 检查是否有 ERROR 或 WARN
  ```

---

## 🔄 回滚方案（如果部署失败）

### 方式 1: 恢复备份

```bash
# 1. 停止服务
pm2 stop pscg-server

# 2. 恢复 dist
sudo rm -rf dist
sudo cp -r backups/backup_YYYYMMDD_HHMMSS/dist ./

# 3. 恢复 .env
cp backups/backup_YYYYMMDD_HHMMSS/.env ./

# 4. 恢复数据库（如果需要）
mysql -u pscg_user -p pscg_db < backups/backup_YYYYMMDD_HHMMSS/database_backup.sql

# 5. 重启服务
pm2 start pscg-server

# 6. 切回 master 分支
git checkout master
```

### 方式 2: 快速回退到 master

```bash
# 1. 停止服务
pm2 stop pscg-server

# 2. 切换回 master
git checkout master
git pull origin master

# 3. 重新构建
npm install
npm run build

# 4. 重启服务
pm2 start pscg-server
```

---

## 📊 新版本功能清单

### ✅ 新增功能
- [x] 图表响应式修复（改变窗口大小不再空白）
- [x] 富文本编辑器优化（工具栏统一、粘贴图片修复）
- [x] 用户中心功能完成
- [x] 文件引用自动管理（孤儿文件清理）
- [x] Git Hooks 配置（ESLint + Prettier）
- [x] 代码规范配置完善

### ❌ 移除功能
- [x] AI 数据分析功能（已在 AItest 分支移除）
- [x] AI 批量分析
- [x] AI 学习风格分析
- [x] AI 配置页面

### 🔧 修复问题
- [x] VChart 图表 resize 空白问题
- [x] 富文本粘贴网页图片 base64 问题
- [x] Prettier 格式化导致的 Vue 模板语法错误
- [x] 代码警告修复

---

## ⚠️ 注意事项

1. **数据库兼容性**
   - 本次部署不涉及数据库结构变更
   - 如有数据库变更，需提前执行迁移脚本

2. **环境变量**
   - 确保 `.env` 文件配置正确
   - 不需要新增环境变量

3. **Nginx 配置**
   - 无需修改 Nginx 配置
   - 部署后如遇静态资源 404，检查 Nginx root 路径

4. **PM2 配置**
   - 使用零停机重载（pm2 reload）
   - 保持服务连续性

---

## 📞 故障排除

| 问题 | 解决方案 |
|------|---------|
| 502 Bad Gateway | `pm2 restart pscg-server && sudo systemctl restart nginx` |
| 数据库连接失败 | 检查 `.env` 中 DB_* 配置，确认 MySQL 运行 |
| 图表仍然空白 | 清除浏览器缓存，强制刷新（Ctrl+F5） |
| 富文本编辑器报错 | 检查控制台错误，确认 Quill 资源加载 |
| PM2 启动失败 | `pm2 logs pscg-server` 查看详细错误 |

---

**部署完成签名**: ________________  
**部署时间**: ________________  
**验证通过**: ________________