# 逻辑 BUG 排查规范（强制）

> 适用于所有全栈开发场景 | 创建日期：2026-04-04

---

## 一、数据流追踪法（核心方法）

### 排查顺序（强制）
```
1. 数据库存储 
   → 2. 后端返回 
   → 3. 网络传输 
   → 4. 前端处理 
   → 5. 页面渲染
```

### 关键原则
- ✅ **每层都要验证**：使用日志、网络工具等确认数据状态
- ❌ **禁止在同一层反复调试**：超过 2 次无果立即检查下一层
- ⚡ **快速定位**：后端正确但前端错误 → 问题一定在前端处理环节

---

## 二、前后端分工验证规范

### 后端验证
1. 添加日志打印**序列化前**的数据
2. 确认返回的 JSON 格式正确
3. 验证数据库查询逻辑

### 前端验证
1. 检查网络请求的**响应数据**（Response）
2. 审查数据接收后的**处理逻辑**（特别是 map、filter、转换函数）
3. 检查组件渲染逻辑

### 常见陷阱
| 场景 | 错误做法 | 正确做法 |
|------|----------|----------|
| 后端返回正确，前端显示错误 | 继续调试后端 | 立即检查前端代码 |
| 修改后端题型逻辑 | 只修改后端 | 同步检查前端是否有对应处理 |
| 选项打乱功能 | 假设所有题型都一样 | 先检查题型再处理 |

---

## 三、题型处理特殊规范

### 判断题（强制）
- 选项固定为 `["对", "错"]`
- **前后端都不进行打乱**
- 答案为 `A`（对）或 `B`（错）
- 使用 `shuffleOptions` 前必须检查：`if (q.type !== 'judgment')`

### 其他题型
- 单选题：正常打乱选项
- 多选题：正常打乱选项
- 阅读理解：每个小题单独打乱

---

## 四、调试日志规范

### 后端日志
```javascript
// 关键数据打印
console.log('API 返回数据:', JSON.stringify({
  id: item.id,
  options: item.options,
  type: item.type
}))
```

### 前端日志
```javascript
// 接收数据后
console.log('前端接收数据:', response.questions[0].options)

// 数据处理后
console.log('处理后数据:', processedQuestions[0].options)
```

---

## 五、代码审查检查清单

### 修改题型相关代码时必查
- [ ] 后端是否添加了题型验证
- [ ] 前端是否有对应的题型处理
- [ ] 是否需要特殊处理（如判断题不打乱）
- [ ] 是否有遗漏的题型分支
- [ ] 测试用例是否覆盖所有题型

---

## 六、典型案例

### 案例 1：判断题选项被打乱
**现象**：前端显示 `["错", "对"]`，数据库存储 `["对", "错"]`

**排查路径**：
1. ✅ 数据库查询 → 正确
2. ✅ 后端返回 → 正确
3. ✅ 网络响应 → 正确
4. ❌ 前端处理 → **发现 Bug**：`QuizView.vue:780` 漏掉判断题检查

**修复**：
```javascript
// 添加题型检查
if (q.type === 'judgment') {
  return { ...q, options: options, shuffleMapping: null }
}
```

---

### 案例 2：管理员权限 API 返回 401（2026-04-08）
**现象**：管理员登录成功后，访问 `/api/admin/permissions/*` 返回 401 Unauthorized

**排查路径（数据流追踪法）**：
1. ✅ **数据库层** - 管理员数据正确（role_id=1, status=active）
2. ✅ **前端层** - Token 存储/传递正常（adminToken 存在，长度183）
3. ✅ **网络传输** - Bearer Token 正确传递
4. ❌ **后端中间件层** - **发现多个 Bug**

**发现的 Bug（共 4 类）**：

| Bug 类型 | 影响文件 | 错误代码 | 正确代码 |
|----------|----------|----------|----------|
| ① 错误的数据库模块引用 | `middleware/adminAuth.js:7`, `services/permissionService.js:2` | `require('../config/database')` | `require('../services/database')` |
| ② 错误的调用方法 | adminAuth.js:65, permissionService.js (13处) | `db.execute()` | `db.pool.execute()` |
| ③ MySQL LIMIT/OFFSET 参数化限制 | permissionService.js:19,105 | `'LIMIT ? OFFSET ?'` | `` `LIMIT ${limit} OFFSET ${offset}` `` |
| ④ response 函数签名错误 | routes/admin-permissions.js | `response.success(result, msg)` | `response.success(res, result, msg)` |

**根因分析**：
- 新开发的权限系统沿用了错误的数据库模块引用方式
- MySQL 的 prepared statement 不支持在 `LIMIT/OFFSET` 中使用参数占位符
- 使用工具函数前未查看其函数签名

**修复验证**：
```bash
$ node test-admin-api.js
✅ 登录成功 (200)
✅ 角色列表 API 成功 (200) - 返回 2 个角色
✅ 管理员用户列表 API 成功 (200) - 返回 1 个管理员
```

**经验教训**：
1. 数据库模块必须使用 `services/database` 而非 `config/database`
2. MySQL2 Pool 对象使用 `pool.execute()` 方法
3. LIMIT/OFFSET 不能用参数化，需用字符串拼接 + parseInt()
4. 使用工具函数前必须先查看函数签名和参数顺序

**详细记录**：[管理员权限系统_401错误排查记录.md](../DOCS/技术文档/管理员权限系统_401错误排查记录.md)

---

## 七、执行要求

1. **所有开发人员必须遵守**
2. **遇到逻辑 BUG 首先使用数据流追踪法**
3. **修复后更新本规范**
