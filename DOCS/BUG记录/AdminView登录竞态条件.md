# AdminView 登录竞态条件 BUG 记录

## 状态
🔴 **未解决**

## 问题描述
在 `/admin` 页面直接访问时，清理浏览器数据后登录，Element Plus 组件渲染时报错：

```
Cannot destructure property 'node' of 'undefined'
Cannot destructure property 'row' of 'undefined'
```

## 复现步骤
1. 直接访问 `/admin` 页面（不是从 HOME 页面跳转）
2. 清理浏览器数据（或打开隐身模式）
3. 输入密码登录
4. 控制台报错，页面卡在登录对话框或加载中状态
5. 刷新页面后正常

## 影响范围
- 仅影响直接访问 `/admin` 页面的首次登录
- 从 HOME 页面点击后台入口跳转正常
- 刷新页面后正常

## 错误信息
```
TypeError: Cannot destructure property 'node' of 'undefined'
    at useNode (element-plus.esm.js:...)
    at TreeNode.render (element-plus.esm.js:...)

TypeError: Cannot destructure property 'row' of 'undefined'
    at useTree (element-plus.esm.js:...)
    at ElTable.render (element-plus.esm.js:...)
```

## 已尝试的解决方案

### 1. 增加延迟时间
- **尝试**: 将 PasswordDialog 关闭后的延迟从 50ms 增加到 300ms、500ms
- **结果**: 无效

### 2. 串行数据加载
- **尝试**: 将并行数据加载改为串行，每个 API 调用之间加延迟
- **结果**: 无效，仍然报错

### 3. v-if 替代 v-show
- **尝试**: 将 PasswordDialog 从 `v-show` 改为 `v-if`
- **结果**: 对话框关闭了，但 el-tabs 渲染时仍报错

### 4. 组件级错误捕获
- **尝试**: 添加 `onErrorCaptured` 钩子
- **结果**: 能捕获错误但无法阻止组件崩溃

### 5. 全局错误处理
- **尝试**: 在 `main.js` 添加 `app.config.errorHandler`
- **结果**: 能捕获错误但页面仍然异常

### 6. 异步 watch 改为同步
- **尝试**: 将 `watch(isAuthenticated)` 从 async 改为同步，用 setTimeout 包裹数据加载
- **结果**: 无效

### 7. 移除 PasswordDialog 外层包装
- **尝试**: 移除 `<div v-show="visible">` 包装
- **结果**: 无效

### 8. 添加数据加载锁
- **尝试**: 添加 `isLoadingData` 变量防止重复加载
- **结果**: 无效

## 相关代码位置

### AdminView.vue
- `handlePasswordVerify` - 密码验证成功回调
- `watch(isAuthenticated)` - 认证状态监听
- `loadPageData` - 页面数据加载

### PasswordDialog.vue
- 登录对话框组件

## 可能的原因分析

1. **Vue 响应式系统竞态**: Dialog 关闭动画期间，数据状态变化触发了组件渲染，但组件所需的 props/data 还未准备好

2. **Element Plus 组件内部状态**: el-tree/el-table 在父组件状态快速变化时，内部状态管理出现问题

3. **Pinia Store 异步更新**: Store 中的数据更新与组件渲染存在时序问题

4. **Vue Devtools 干扰**: 开发环境下 Devtools 可能影响组件生命周期（需验证生产环境是否存在同样问题）

## 建议的后续排查方向

1. **生产环境测试**: 确认是否是开发环境特有的问题
2. **简化数据流**: 尝试在登录成功后完全不依赖 watch，改用事件驱动
3. **组件懒加载**: 使用 `defineAsyncComponent` 延迟加载 el-tabs 内容
4. **Element Plus 版本**: 检查是否有已知问题或更新版本
5. **Dialog destroy-on-close**: 尝试在 PasswordDialog 添加 `destroy-on-close` 属性
6. **Provide/Inject**: 使用 provide/inject 替代 props 传递关键状态

## 临时解决方案
暂无有效的临时解决方案。用户需要刷新页面才能正常使用。

## 相关文件
- `src/views/AdminView.vue`
- `src/components/admin/auth/PasswordDialog.vue`
- `src/main.js`
- `src/stores/questionStore.js`

## 记录时间
2026-03-25

---

> 此 BUG 需要进一步深入排查 Vue 3 响应式系统与 Element Plus 组件的交互机制。
