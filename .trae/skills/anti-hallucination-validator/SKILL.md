---
name: "anti-hallucination-validator"
description: "强制验证流程，防止AI幻觉。Invoke when 修改文档、重构代码、开发新功能前，必须先验证实际实现。"
---

# 防幻觉验证器（Anti-Hallucination Validator）

## 核心原则

**禁止基于假设行动，必须基于验证实施。**

---

## 强制验证流程

### 任何任务必须按此顺序执行：

```
步骤1: 读取目标文件
  ↓
步骤2: 搜索相关代码
  ↓
步骤3: 验证后端API
  ↓
步骤4: 检查数据库结构
  ↓
步骤5: 基于实际实施
  ↓
步骤6: 对比验证结果
```

---

## 验证检查清单

### 文档重构任务

- [ ] 读取原文件内容
- [ ] 搜索前端相关代码
- [ ] 检查后端API实现
- [ ] 验证数据库字段
- [ ] 确认功能是否存在
- [ ] 对比新旧内容
- [ ] 确认无幻觉内容

### 代码修改任务

- [ ] 读取目标文件
- [ ] 搜索相关依赖
- [ ] 检查API接口
- [ ] 验证数据结构
- [ ] 确认逻辑正确
- [ ] 运行测试验证

### 功能开发任务

- [ ] 确认需求细节
- [ ] 检查现有实现
- [ ] 验证技术可行性
- [ ] 设计数据结构
- [ ] 实现核心功能
- [ ] 测试验证结果

---

## 常见AI幻觉陷阱

### 陷阱1: 先入为主

```
❌ 错误：基于常见模式假设
   例如：注册 = 账号 + 密码

✅ 正确：验证实际实现
   例如：登录 = 学号 + 年级 + 班级（无密码）
```

### 陷阱2: 过度推断

```
❌ 错误：没有读取文件就重构
   例如：直接写不存在的功能

✅ 正确：先读取，再重构
   例如：读取原文件 → 验证代码 → 基于实际修改
```

### 陷阱3: 缺乏验证

```
❌ 错误：假设后端有某个API
   例如：假设有 /register 接口

✅ 正确：搜索验证API是否存在
   例如：grep "router.post('/register'" → 确认不存在
```

---

## 验证工具使用

### 1. 读取文件

```
Read tool: 读取目标文件
mcp_Filesystem_read_text_file: 读取完整内容
```

### 2. 搜索代码

```
Grep: 搜索关键词
Glob: 查找文件
SearchCodebase: 搜索代码库
```

### 3. 验证API

```
Read routes/*.js: 检查路由定义
Grep "router.post": 查找POST接口
Grep "router.get": 查找GET接口
```

### 4. 检查数据库

```
Read database/schema.sql: 查看表结构
Grep "CREATE TABLE": 查找表定义
```

---

## 典型案例

### 案例1: 文档重构幻觉

**错误做法**：
```
用户: 重构登录文档
AI: 直接写"填写账号、密码、注册流程" ❌
```

**正确做法**：
```
用户: 重构登录文档
AI: 
1. 读取原文件 → 确认内容
2. 搜索前端代码 → 验证表单字段
3. 检查后端API → 确认登录逻辑
4. 验证注册API → 确认不存在
5. 基于实际重构 → 写真实内容 ✅
```

### 案例2: 功能开发幻觉

**错误做法**：
```
用户: 添加用户头像功能
AI: 直接写上传代码 ❌
```

**正确做法**：
```
用户: 添加用户头像功能
AI:
1. 检查用户表是否有avatar字段
2. 搜索现有上传功能
3. 验证存储方案
4. 基于现有实现开发 ✅
```

---

## 强制执行规则

### 规则1: 禁止假设

```
任何功能、API、字段，必须验证存在后才能使用。
```

### 规则2: 数据驱动

```
不要基于"常见模式"行动，要基于"实际代码"验证。
```

### 规则3: 打印验证

```
关键步骤必须打印日志或运行命令验证。
```

### 规则4: 对比检查

```
修改前后必须对比，确认无幻觉内容。
```

## 推荐MCP工具配置

### 必须使用（标准版 - 28个工具）

#### Chrome DevTools MCP（25个工具）
```
验证核心：
- mcp_Chrome_DevTools_MCP_list_network_requests: 验证API端点真实性
- mcp_Chrome_DevTools_MCP_get_network_request: 验证接口响应数据
- mcp_Chrome_DevTools_MCP_navigate_page: 访问页面验证功能存在
- mcp_Chrome_DevTools_MCP_take_snapshot: 验证页面元素真实性
- mcp_Chrome_DevTools_MCP_evaluate_script: 执行代码验证功能可用性

调试与测试：
- mcp_Chrome_DevTools_MCP_click, fill, hover, type_text, take_screenshot, list_console_messages, wait_for, new_page, list_pages, resize_page, emulate
- mcp_Chrome_DevTools_MCP_performance_start_trace, performance_stop_trace, lighthouse_audit, take_memory_snapshot, press_key, drag, upload_file
```

#### Filesystem MCP（3个工具）
```
**核心验证工具**：
- mcp_Filesystem_read_text_file: 读取文件验证代码/文档是否真实存在
- mcp_Filesystem_read_multiple_files: 批量对比验证多个文件
- mcp_Filesystem_read_media_file: 验证图片/资源文件存在性
```

---

## 使用方法

### 在任何任务开始前，必须：

```
1. 调用此 Skill
2. 按照验证流程执行
3. 完成检查清单
4. 确认无幻觉后继续
```

### 用户可以要求：

```
"使用 anti-hallucination-validator 验证"
"先验证，再实施"
"按防幻觉流程执行"
```

---

## 质量保证

### 验证标准

- ✅ 所有字段都有代码依据
- ✅ 所有功能都有API支持
- ✅ 所有逻辑都有数据验证
- ✅ 所有内容都有实际来源

### 禁止行为

- ❌ 基于假设写内容
- ❌ 没有验证就行动
- ❌ 使用不存在的功能
- ❌ 臆造不存在的API

---

## 持续改进

### 发现幻觉时

1. 立即停止当前任务
2. 分析幻觉原因
3. 更新此 Skill
4. 添加新的验证规则

### 用户反馈

- 记录幻觉案例
- 分析根本原因
- 完善验证流程
- 更新检查清单

---

**记住：验证是防止幻觉的唯一方法！**
