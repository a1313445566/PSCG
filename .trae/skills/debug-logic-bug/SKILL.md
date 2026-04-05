---
name: "debug-logic-bug"
description: "专门用于排查全栈项目的逻辑 BUG，特别是数据显示不一致问题。Invoke when encountering data inconsistency bugs between backend and frontend, or when stuck debugging the same layer multiple times."
---

# 逻辑 BUG 排查专家

> 版本：v2.1 | 最后更新：2026-04-06  
> 规则来源：`.trae/rules/debug_rules.md`

---

## 一、核心方法：数据流追踪法

### 排查顺序（强制执行）
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

## 二、使用场景

### 触发条件（立即启用本技能）
1. 用户报告数据显示错误
2. 后端日志正确但前端显示错误
3. 在某一层的调试超过 2 次没有进展
4. 涉及数据类型转换、映射、过滤的 BUG
5. 题型相关功能（判断、单选、多选、阅读等）

### 典型问题
- 选项顺序被打乱
- 数据格式不一致
- 字段映射错误
- 类型判断遗漏
- 条件分支缺失

---

## 三、排查流程

### 第 1 步：确认问题现象
```javascript
// 询问用户或确认：
- 期望的数据是什么？
- 实际显示的数据是什么？
- 问题出现的频率？
- 是否所有场景都出现？
```

### 第 2 步：数据库层验证
```sql
-- 查询原始数据
SELECT id, options, type, correct_answer 
FROM questions 
WHERE type = 'judgment' 
LIMIT 5;
```

### 第 3 步：后端验证
```javascript
// 在 API 返回前添加日志
console.log('API 返回数据:', JSON.stringify({
  id: item.id,
  options: item.options,
  type: item.type
}, null, 2))
```

### 第 4 步：网络传输验证
```
使用浏览器开发者工具：
1. Network 标签页
2. 找到对应 API 请求
3. 查看 Response 标签页
4. 对比后端日志和响应数据
```

### 第 5 步：前端处理验证（最关键！）
```javascript
// 在数据接收后立即打印
console.log('前端接收数据:', response.questions[0])

// 在数据处理后打印
console.log('处理后数据:', processedQuestions[0])

// 重点检查：
// - map/forEach/filter 等转换函数
// - 条件判断是否遗漏某些类型
// - 数据映射逻辑是否正确
```

### 第 6 步：渲染层验证
```vue
<!-- 在组件中直接打印 -->
<template>
  <div>{{ JSON.stringify(question.options) }}</div>
</template>
```

---

## 四、题型处理特殊规范

### 判断题（强制）
- 选项固定为 `["对", "错"]`
- **前后端都不进行打乱**
- 答案为 `A`（对）或 `B`（错）
- 使用 `shuffleOptions` 前必须检查：`if (q.type !== 'judgment')`

### 其他题型
| 题型 | 选项处理 |
|------|----------|
| 单选题 | 正常打乱选项 |
| 多选题 | 正常打乱选项 |
| 阅读理解 | 每个小题单独打乱 |

---

## 五、常见陷阱与解决方案

### 陷阱 1：题型判断遗漏
**问题**：处理选项时没有检查题型，导致所有题型使用相同逻辑

**错误示例**：
```javascript
// ❌ 错误：所有题型都打乱选项
questions.forEach(q => {
  const { shuffledOptions } = shuffleOptions(q.options)
  return { ...q, options: shuffledOptions }
})
```

**正确做法**：
```javascript
// ✅ 正确：先检查题型
questions.forEach(q => {
  if (q.type === 'judgment') {
    // 判断题：固定选项，不打乱
    return { ...q, options: ['对', '错'], shuffleMapping: null }
  }
  // 其他题型：正常打乱
  const { shuffledOptions } = shuffleOptions(q.options)
  return { ...q, options: shuffledOptions }
})
```

### 陷阱 2：后端修改遗漏前端
**问题**：修改了后端逻辑，但前端没有同步更新

**检查清单**：
- [ ] 后端添加了新字段 → 前端是否使用？
- [ ] 后端修改了数据结构 → 前端是否适配？
- [ ] 后端添加了新类型 → 前端是否处理？
- [ ] 后端修改了验证逻辑 → 前端是否同步？

### 陷阱 3：数组顺序假设
**问题**：假设数组元素顺序固定，但实际可能被排序或打乱

**防御性编程**：
```javascript
// ❌ 错误：假设第一个元素是对
const correctOption = options[0]

// ✅ 正确：通过标识符查找
const correctOption = options.find(opt => opt.label === 'A')
```

---

## 六、调试日志模板

### 后端日志
```javascript
function debugData(label, data) {
  console.log(`\n=== ${label} ===`)
  console.log('时间:', new Date().toLocaleString())
  console.log('数据:', JSON.stringify(data, null, 2))
  console.log('===================\n')
}

// 使用示例
debugData('数据库查询结果', dbResult)
debugData('API 返回数据', responseData)
```

### 前端日志
```javascript
// 在关键节点打印
const debugLog = (stage, data) => {
  console.group(`🔍 前端调试 - ${stage}`)
  console.log('时间:', new Date().toLocaleString())
  console.log('数据:', data)
  console.log('数据结构:', JSON.stringify(data, null, 2))
  console.groupEnd()
}

// 使用示例
debugLog('接收 API 数据', response.questions)
debugLog('处理后数据', processedQuestions)
debugLog('渲染前数据', displayQuestions)
```

---

## 七、验证检查清单

### 修复后必须验证
- [ ] 数据库数据正确
- [ ] 后端返回正确
- [ ] 网络传输正确
- [ ] 前端处理正确
- [ ] 页面显示正确
- [ ] 其他题型不受影响
- [ ] 边界情况正常
- [ ] 刷新后依然正常

---

## 八、典型案例库

### 案例 1：判断题选项被打乱
**现象**：前端显示 `["错", "对"]`，数据库存储 `["对", "错"]`

**排查过程**：
1. ✅ 数据库：`SELECT options FROM questions WHERE type='judgment'` → `["对", "错"]`
2. ✅ 后端：日志显示返回 `["对", "错"]`
3. ✅ 网络：Response 显示 `["对", "错"]`
4. ❌ 前端：`QuizView.vue:780` 对所有题型调用 `shuffleOptions()`

**修复代码**：
```javascript
// 添加题型判断
if (q.type === 'judgment') {
  return {
    ...q,
    options: options,
    shuffleMapping: null,
    type: 'judgment'
  }
}
```

### 案例 2：多选题答案格式不一致
**现象**：后端期望 `["A", "B"]`，前端发送 `"AB"`

**排查**：前端序列化时使用了 `join('')` 而不是保持数组

**修复**：
```javascript
// ❌ 错误
const answer = selectedOptions.join('') // "AB"

// ✅ 正确
const answer = selectedOptions // ["A", "B"]
```

---

## 推荐MCP工具配置

### 必须使用（标准版 - 33个工具）

#### Chrome DevTools MCP（28个工具）
```
数据流追踪核心：
- mcp_Chrome_DevTools_MCP_list_network_requests: 网络层验证（第3步）
- mcp_Chrome_DevTools_MCP_get_network_request: 请求/响应详情分析
- mcp_Chrome_DevTools_MCP_take_snapshot: DOM状态快照（第5步渲染层）
- mcp_Chrome_DevTools_MCP_list_console_messages: 前端日志检查
- mcp_Chrome_DevTools_MCP_evaluate_script: 执行JS查看运行时数据

页面交互测试：
- mcp_Chrome_DevTools_MCP_navigate_page: 导航到问题页面
- mcp_Chrome_DevTools_MCP_click: 触发操作复现BUG
- mcp_Chrome_DevTools_MCP_fill: 填写表单数据
- mcp_Chrome_DevTools_MCP_take_screenshot: 截图记录BUG现象

其他调试工具：
- mcp_Chrome_DevTools_MCP_hover, type_text, press_key, drag, upload_file, wait_for, new_page, list_pages, resize_page, emulate, performance_start_trace, performance_stop_trace, lighthouse_audit, take_memory_snapshot
```

#### Filesystem MCP（3个工具）
```
代码审查（第1、2步）：
- mcp_Filesystem_read_text_file: 读取源码文件验证逻辑
- mcp_Filesystem_read_multiple_files: 批量对比前后端代码
- mcp_Filesystem_read_media_file: 验证资源文件
```

#### 内置工具（2个）
```
- 阅读: 对文件进行检索和查看
- 编辑: 对文件进行增删和编辑
```

**记住**：80% 的逻辑 BUG 都是因为"想当然"，永远用数据说话！
