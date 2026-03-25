# 浏览器手动测试指南

## 修复验证结果 ✅

### 自动化测试结果
- ✅ 源代码修改正确（isComponentMounted: 3 处）
- ✅ PasswordDialog 已改用 v-show
- ✅ 构建文件最新（2026-03-25 21:09）
- ✅ 服务器运行正常（PM2 online）
- ✅ API 端点正常响应
- ✅ 日志中无错误

---

## 浏览器测试步骤

### 1. 准备工作
```bash
# 在浏览器中：
1. 按 F12 打开开发者工具
2. 切换到 Console（控制台）标签
3. 切换到 Network（网络）标签（可选）
```

### 2. 清除缓存
```
Chrome/Edge:
- 按 Ctrl + Shift + Delete
- 选择"缓存的图片和文件"
- 时间范围选择"所有时间"
- 点击"清除数据"

或者：
- 按 Ctrl + F5 强制刷新
```

### 3. 测试登录功能
```
1. 访问: http://your-domain/admin
2. 等待登录对话框自动弹出
3. 输入用户名: admin
4. 输入密码: [你的密码]
5. 点击"登录"按钮
```

### 4. 检查结果

#### ✅ 成功标志
```
- 登录对话框平滑关闭
- 控制台显示: "登录成功" 消息
- 页面跳转到后台管理界面
- 显示"题库管理系统"标题
- 控制台无 "emitsOptions" 错误
- 控制台无 "Cannot read properties of null" 错误
```

#### ❌ 失败标志
```
- 控制台出现错误:
  × TypeError: Cannot read properties of null (reading 'emitsOptions')
  × TypeError: Cannot read properties of null (reading '...')

如果出现以上错误，请：
1. 确认已清除浏览器缓存
2. 按 Ctrl + F5 强制刷新页面
3. 检查是否加载了新的构建文件（Network 标签查看 AdminView-*.js）
```

---

## 验证构建文件版本

### 方法 1: 查看 Network 标签
```
1. 打开 Network 标签
2. 刷新页面
3. 搜索 "AdminView"
4. 查看文件名: AdminView-B_Ggzh9s.js（应该是这个）
5. 确认文件大小约 61KB
```

### 方法 2: 查看控制台
```javascript
// 在浏览器控制台执行：
fetch('/assets/AdminView-B_Ggzh9s.js')
  .then(r => r.text())
  .then(t => console.log('文件包含 isComponentMounted:', t.includes('isComponentMounted')))
```

---

## 常见问题排查

### Q1: 仍然看到错误
```
解决方案：
1. 完全关闭浏览器，重新打开
2. 使用无痕/隐私模式访问
3. 确认服务器已重启: pm2 restart 0
4. 确认构建文件最新: npm run build
```

### Q2: 登录对话框未弹出
```
可能原因：
- JavaScript 错误阻止了组件加载
- 检查控制台是否有其他错误

解决方案：
- 刷新页面
- 检查 sessionStorage 是否有残留数据
```

### Q3: 登录成功但页面空白
```
可能原因：
- 数据加载失败
- 路由配置问题

检查：
- Network 标签查看 API 请求状态
- 控制台查看是否有数据加载错误
```

---

## 自动化测试脚本（可选）

如果需要持续监控，可以运行：
```bash
# 监控 PM2 日志
pm2 logs pscg-app --lines 100

# 持续检查错误
watch -n 5 'pm2 logs pscg-app --lines 10 --nostream | grep -i error || echo "✓ 无错误"'
```

---

## 测试完成确认

测试完成后，请确认以下项目：

- [ ] 浏览器缓存已清除
- [ ] 登录对话框正常显示
- [ ] 输入用户名密码后可以登录
- [ ] 登录成功后对话框正常关闭
- [ ] 控制台无 "emitsOptions" 错误
- [ ] 控制台无其他 TypeError 错误
- [ ] 后台管理界面正常显示
- [ ] 数据正常加载

---

**测试日期**: 2026-03-25  
**修复版本**: AdminView-B_Ggzh9s.js  
**修复内容**: PasswordDialog 组件挂载状态检查 + v-show 替代 v-if
