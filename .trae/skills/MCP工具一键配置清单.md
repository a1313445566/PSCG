# 🛠️ 智能体 MCP 工具一键配置清单

> **生成时间**：2026-04-06  
> **适用版本**：Trae IDE 智能体配置  
> **工具上限**：每个智能体最多 40 个工具  
> **总智能体数**：22 个

---

## 📋 使用说明

### 操作步骤：
1. 打开 Trae IDE → 智能体设置
2. 选择要配置的智能体
3. **先取消所有勾选**（点击"工具 - MCP"旁的复选框取消全选）
4. 按照**下方的"✅ 保留"列表**逐个勾选
5. 确保底部显示的工具总数 ≤ 40

### 工具来源说明：
- **Playwright (34)** = Playwright MCP 的 34 个工具（替代 Puppeteer）
- **Chrome DevTools (28)** = Chrome DevTools MCP 的 28 个工具  
- **Filesystem (15)** = Filesystem MCP 的 15 个工具（含读写操作）
- **Memory (6)** = Memory MCP 的 6 个工具
- **Sequential Thinking (1)** = Sequential Thinking 的 1 个工具
- **context7 (2)** = context7 的 2 个工具
- **内置 (2)** = 阅读工具 + 编辑工具

### 🆕 Playwright MCP vs Puppeteer MCP 优势：
| 特性 | Puppeteer | Playwright |
|------|-----------|------------|
| HTTP 请求方法 | ❌ | ✅ GET/POST/PUT/PATCH/DELETE |
| iframe 支持 | ❌ | ✅ iframe_click/iframe_fill |
| 响应断言 | ❌ | ✅ expect_response/assert_response |
| 代码生成 | ❌ | ✅ start/end/get/clear_codegen_session |
| PDF 保存 | ❌ | ✅ save_as_pdf |
| 控制台日志 | ❌ | ✅ console_logs |
| 可见文本/HTML | ❌ | ✅ get_visible_text/html |

---

## 📊 配置速查表

| # | 智能体 | 中文名 | 推荐工具数 | 核心MCP | 复杂度 |
|---|--------|-------|-----------|---------|--------|
| 1 | ui-designer | UI设计师 | **39** | Playwright + DevTools + Filesystem(3) | ⭐⭐⭐ |
| 2 | frontend-architect | 前端架构师 | **39** | Playwright + DevTools + Filesystem(3) | ⭐⭐⭐ |
| 3 | pscg-frontend-expert | 前端开发专家 | **39** | Playwright + DevTools + Filesystem(3) | ⭐⭐⭐ |
| 4 | performance-expert | 性能优化师 | **39** | Playwright + DevTools + Filesystem(3) | ⭐⭐⭐ |
| 5 | pscg-quality-testing | 质量测试专家 | **39** | Playwright + DevTools + Filesystem(3) | ⭐⭐⭐ |
| 6 | api-test-pro | API测试工程师 | **39** | Playwright + DevTools + Filesystem(3) | ⭐⭐⭐ |
| 7 | compliance-checker | 合规审查员 | **33** | DevTools + Filesystem(3) | ⭐⭐ |
| 8 | debug-logic-bug | BUG排查专家 | **33** | DevTools + Filesystem(3) | ⭐⭐ |
| 9 | api-dev-fullstack | 全栈接口开发 | **33** | DevTools + Filesystem(3) | ⭐⭐ |
| 10 | anti-hallucination-validator | 防幻觉验证器 | **33** | DevTools + Filesystem(3) | ⭐⭐ |
| 11 | pscg-ai-integration | AI集成专家 | **33** | DevTools + Filesystem(3) | ⭐⭐ |
| 12 | pscg-edu-system | 教育AI业务 | **33** | DevTools + Filesystem(3) | ⭐⭐ |
| 13 | ai-integration-engineer | AI集成工程师 | **33** | DevTools + Filesystem(3) | ⭐⭐ |
| 14 | pscg-db-optimizer | 数据库优化师 | **18** | DevTools(12) + Filesystem(3) + 内置(2)+Memory(1) | ⭐ |
| 15 | pscg-backend-expert | 后端开发专家 | **18** | DevTools(12) + Filesystem(3) + 内置(2)+Memory(1) | ⭐ |
| 16 | backend-architect | 后端架构师 | **18** | DevTools(12) + Filesystem(3) + 内置(2)+Memory(1) | ⭐ |
| 17 | devops-architect | DevOps工程师 | **18** | DevTools(7) + Filesystem(3) + 内置(2)+Memory(1)+Sequential(1)+context7(2)+Playwright(2) | ⭐ |
| 18 | doc-auto-generate | 文档自动生成 | **7** | Filesystem(3) + 内置(2) + Memory(1) + Sequential(1) | 🔵极简 |
| 19 | pscg-fullstack-architect | 全栈架构师 | **7** | Filesystem(3) + 内置(2) + Memory(1) + Sequential(1) | 🔵极简 |
| 20 | dev-env-manager | 环境管理器 | **10** | DevTools(5) + 内置(2) + Memory(1) + Sequential(1) + context7(1) | 🔵极简 |
| 21 | pscg-expert-router | 专家路由 | **5** | 内置(2) + Memory(1) + Sequential(1) + context7(1) | 🔵极简 |

---

## 🔴 完整版配置（39个工具）- 6个智能体

> 适用场景：需要完整浏览器控制和API测试能力的前端/测试/UI类智能体

### 1️⃣ ui-designer（UI设计师）

#### ✅ 保留的工具：

**Playwright MCP（34个）- 全部保留**
```
✅ playwright_navigate           Navigate to a URL
✅ playwright_screenshot         Take a screenshot of the current page or a specific element
✅ playwright_click              Click an element on the page
✅ playwright_fill               Fill out an input field
✅ playwright_select             Select an element on the page with Select tag
✅ playwright_hover              Hover an element on the page
✅ playwright_evaluate           Execute JavaScript in the browser console
✅ playwright_resize             Resize the browser viewport
✅ playwright_close              Close the browser and release all resources
✅ playwright_press_key          Press a keyboard key
✅ playwright_drag               Drag an element to a target location
✅ playwright_upload_file        Upload a file to an input[type='file'] element
✅ playwright_go_back            Navigate back in browser history
✅ playwright_go_forward         Navigate forward in browser history
✅ playwright_click_and_switch_tab Click a link and switch to the newly opened tab
✅ playwright_iframe_click       Click an element in an iframe on the page
✅ playwright_iframe_fill        Fill an element in an iframe on the page
✅ playwright_get                Perform an HTTP GET request
✅ playwright_post               Perform an HTTP POST request
✅ playwright_put                Perform an HTTP PUT request
✅ playwright_patch              Perform an HTTP PATCH request
✅ playwright_delete             Perform an HTTP DELETE request
✅ playwright_expect_response    Start waiting for a HTTP response
✅ playwright_assert_response    Wait for and validate a previously initiated HTTP response
✅ playwright_custom_user_agent  Set a custom User Agent for the browser
✅ playwright_get_visible_text   Get the visible text content of the current page
✅ playwright_get_visible_html   Get the HTML content of the current page
✅ playwright_console_logs       Retrieve console logs from the browser
✅ playwright_save_as_pdf        Save the current page as a PDF file
✅ playwright_start_codegen_session Start a new code generation session
✅ playwright_end_codegen_session End a code generation session and generate the test file
✅ playwright_get_codegen_session Get information about a code generation session
✅ playwright_clear_codegen_session Clear a code generation session without generating a test
```

**Filesystem MCP（3个）- 只保留读取类**
```
✅ mcp_Filesystem_read_media_file    Read an image or audio file
✅ mcp_Filesystem_read_text_file     Read the contents of a file from the file system as text
✅ mcp_Filesystem_read_multiple_files Read the contents of multiple files simultaneously
```

**内置工具（2个）**
```
✅ 阅读   对文件进行检索和查看
✅ 编辑   对文件进行增删和编辑
```

**❌ 取消的服务器（节省工具）：**
```
❌ Chrome DevTools（28个工具）- Playwright 已覆盖大部分功能
❌ Memory（6个工具）- UI设计不需要记忆功能
❌ Sequential Thinking（1个工具）- 不需要思维链
❌ context7（2个工具）- 不需要文档查询
❌ Filesystem 其他12个写入类工具 - 不需要创建/编辑文件
```

**📊 总计：34 + 3 + 2 = 39个工具 ✅**

---

### 2️⃣ frontend-architect（前端架构师）

#### ✅ 保留的工具：
**完全相同于 ui-designer（39个工具）**

**核心用途差异：**
- `get_visible_html` → 分析组件 DOM 结构
- `console_logs` → 检查前端错误日志
- `resize` → 响应式架构验证
- `start_codegen_session` → 自动生成测试代码

---

### 3️⃣ pscg-frontend-expert（前端开发专家）

#### ✅ 保留的工具：
**完全相同于 ui-designer（39个工具）**

**核心用途差异：**
- `evaluate` → 执行 Vue 组件调试脚本
- `console_logs` → 监控控制台输出
- `get_visible_text/html` → 提取页面内容验证

---

### 4️⃣ performance-expert（性能优化师）

#### ✅ 保留的工具：
**完全相同于 ui-designer（39个工具）**

**核心用途差异：**
- `get`/`post` 等 HTTP 方法 → API 性能测试
- `expect_response`/`assert_response` → 响应时间验证
- `save_as_pdf` → 性能报告生成

---

### 5️⃣ pscg-quality-testing（质量测试专家）

#### ✅ 保留的工具：
**完全相同于 ui-designer（39个工具）**

**核心用途差异：**
- `start_codegen_session` → **最核心工具** - 自动生成测试脚本
- `screenshot` → 视觉回归测试截图
- `console_logs` → 控制台错误检测
- `iframe_click`/`iframe_fill` → 复杂页面测试

---

### 6️⃣ api-test-pro（API测试工程师）

#### ✅ 保留的工具：
**完全相同于 ui-designer（39个工具）**

**核心用途差异：**
- `get`/`post`/`put`/`patch`/`delete` → **最核心工具** - API 请求测试
- `expect_response`/`assert_response` → 响应断言验证
- `evaluate` → 执行 API 测试断言脚本
- `custom_user_agent` → 模拟不同客户端

---

## 🟠 标准版配置（33个工具）- 7个智能体

> 适用场景：需要调试和验证能力的开发/审查类智能体

### 7️⃣ compliance-checker（合规审查员）

#### ✅ 保留的工具：

**❌ Playwright MCP - 全部取消（节省34个）**

**Chrome DevTools MCP（28个）- 全部保留**
```
✅ mcp_Chrome_DevTools_MCP_take_snapshot          Take a text snapshot of the currently selected page
✅ mcp_Chrome_DevTools_MCP_take_screenshot        Take a screenshot of the page or element
✅ mcp_Chrome_DevTools_MCP_click                 Clicks on the provided element
✅ mcp_Chrome_DevTools_MCP_hover                 Hover over the provided element
✅ mcp_Chrome_DevTools_MCP_fill                  Type text into a input, text area or select an option from a <select> element
✅ mcp_Chrome_DevTools_MCP_fill_form             Fill out multiple form elements at once
✅ mcp_Chrome_DevTools_MCP_type_text             Type text using keyboard into a previously focused input
✅ mcp_Chrome_DevTools_MCP_press_key             Press a key or key combination
✅ mcp_Chrome_DevTools_MCP_drag                 Drag an element onto another element
✅ mcp_Chrome_DevTools_MCP_upload_file           Upload a file through a provided element
✅ mcp_Chrome_DevTools_MCP_navigate_page         Go to a URL, or back, forward, or reload
✅ mcp_Chrome_DevTools_MCP_new_page             Open a new tab and load a URL
✅ mcp_Chrome_DevTools_MCP_list_pages           Get a list of pages open in the browser
✅ mcp_Chrome_DevTools_MCP_select_page          Select a page as a context for future tool calls
✅ mcp_Chrome_DevTools_MCP_close_page           Closes the page by its index
✅ mcp_Chrome_DevTools_MCP_emulate              Emulates various features on the selected page
✅ mcp_Chrome_DevTools_MCP_resize_page          Resizes the selected page's window
✅ mcp_Chrome_DevTools_MCP_wait_for             Wait for the specified text to appear on the selected page
✅ mcp_Chrome_DevTools_MCP_evaluate_script      Evaluate a JavaScript function inside the currently selected page
✅ mcp_Chrome_DevTools_MCP_list_console_messages List all console messages for the currently selected page
✅ mcp_Chrome_DevTools_MCP_list_network_requests List all requests for the currently selected page
✅ mcp_Chrome_DevTools_MCP_get_network_request  Gets a network request by an optional reqid
✅ mcp_Chrome_DevTools_MCP_lighthouse_audit     Get Lighthouse score and reports
✅ mcp_Chrome_DevTools_MCP_performance_start_trace Start a performance trace on the selected webpage
✅ mcp_Chrome_DevTools_MCP_performance_stop_trace Stop the active performance trace recording
✅ mcp_Chrome_DevTools_MCP_take_memory_snapshot  Capture a heap snapshot of the currently selected page
```

**Filesystem MCP（3个）- 只保留读取类**
```
✅ mcp_Filesystem_read_text_file
✅ mcp_Filesystem_read_multiple_files
✅ mcp_Filesystem_read_media_file
```

**内置工具（2个）**
```
✅ 阅读
✅ 编辑
```

**❌ 取消的服务器：**
```
❌ Playwright（34个）
❌ Memory（6个）
❌ Sequential Thinking（1个）
❌ context7（2个）
❌ Filesystem 写入类（12个）
```

**📊 总计：0 + 28 + 3 + 2 = 33个工具 ✅**

---

### 8️⃣ ~ 13️⃣ 其他6个标准版智能体

以下智能体使用**完全相同的配置（33个工具）**：

| 智能体 | 特殊说明 |
|--------|---------|
| **debug-logic-bug** | 重点用 `list_network_requests` + `evaluate_script` 做数据流追踪 |
| **api-dev-fullstack** | 重点用 `get_network_request` 做API联调验证 |
| **anti-hallucination-validator** | 重点用 `read_text_file` 验证代码真实性 |
| **pscg-ai-integration** | 重点用 `list_network_requests` 监控AI API调用 |
| **pscg-edu-system** | 重点用 `take_snapshot` 验证教育功能渲染 |
| **ai-integration-engineer** | 重点用 `get_network_request` 分析AI响应数据 |

**配置：全部相同 → Chrome DevTools(28) + Filesystem读取(3) + 内置(2) = 33个**

---

## 🟡 轻量版配置（18个工具）- 3个智能体

> 适用场景：专注特定领域的后端/数据库/架构类智能体

### 14️⃣ pscg-db-optimizer（数据库优化师）

#### ✅ 保留的工具：

**❌ Playwright MCP - 全部取消（节省34个）**

**Chrome DevTools MCP（12个）- 只保留性能和网络相关**
```
✅ mcp_Chrome_DevTools_MCP_performance_start_trace
✅ mcp_Chrome_DevTools_MCP_performance_stop_trace
✅ mcp_Chrome_DevTools_MCP_list_network_requests
✅ mcp_Chrome_DevTools_MCP_get_network_request
✅ mcp_Chrome_DevTools_MCP_lighthouse_audit
✅ mcp_Chrome_DevTools_MCP_take_memory_snapshot
✅ mcp_Chrome_DevTools_MCP_navigate_page
✅ mcp_Chrome_DevTools_MCP_take_snapshot
✅ mcp_Chrome_DevTools_MCP_evaluate_script
✅ mcp_Chrome_DevTools_MCP_list_console_messages
✅ mcp_Chrome_DevTools_MCP_new_page
✅ mcp_Chrome_DevTools_MCP_list_pages
```

**Filesystem MCP（3个）**
```
✅ mcp_Filesystem_read_text_file
✅ mcp_Filesystem_read_multiple_files
✅ mcp_Filesystem_read_media_file
```

**Memory MCP（1个）- 保留用于存储优化方案**
```
✅ mcp_Memory_read_graph
```

**内置工具（2个）**
```
✅ 阅读
✅ 编辑
```

**❌ 取消的DevTools工具（16个）：**
```
❌ click, hover, fill, fill_form, type_text, press_key, drag, upload_file
❌ wait_for, select_page, close_page, resize_page, emulate
❌ take_screenshot, get_console_message, handle_dialog
```

**❌ 取消的其他服务器：**
```
❌ Playwright（34个）
❌ Sequential Thinking（1个）
❌ context7（2个）
❌ Filesystem 写入类（12个）
❌ Memory 其他5个（add_observations等）
```

**📊 总计：0 + 12 + 3 + 1 + 2 = 18个工具 ✅**

---

### 15️⃣ pscg-backend-expert（后端开发专家）

#### ✅ 保留的工具：
**完全相同于 pscg-db-optimizer（18个工具）**

**核心用途差异：**
- `list_network_requests` → 验证API响应格式
- `get_network_request` → 检查接口返回数据
- `evaluate_script` → 执行API测试脚本

---

### 16️⃣ backend-architect（后端架构师）

#### ✅ 保留的工具：
**完全相同于 pscg-db-optimizer（18个工具）**

**核心用途差异：**
- `performance_start_trace` → 服务间通信性能分析
- `read_multiple_files` → 分析模块依赖关系

---

## 🟢 极简版配置（5-10个工具）- 4个智能体

> 适用场景：纯逻辑/文档/协调类智能体

### 17️⃣ dev-env-manager（环境管理器）- 10个工具

#### ✅ 保留的工具：

**Playwright MCP（2个）**
```
✅ playwright_navigate
✅ playwright_screenshot
```

**Chrome DevTools MCP（5个）**
```
✅ mcp_Chrome_DevTools_MCP_navigate_page
✅ mcp_Chrome_DevTools_MCP_list_network_requests
✅ mcp_Chrome_DevTools_MCP_take_snapshot
✅ mcp_Chrome_DevTools_MCP_new_page
✅ mcp_Chrome_DevTools_MCP_list_pages
```

**其他（3个）**
```
✅ mcp_Memory_read_graph                    （Memory 1个）
✅ mcp_SequentialThinking_sequentialthinking （Sequential 1个）
✅ mcp_context7_query-docs                  （context7 1个）
```

**内置工具（2个）**
```
✅ 阅读
✅ 编辑
```

**📊 总计：2 + 5 + 3 + 2 = 12个工具（可进一步精简到10个）**

---

### 18️⃣ doc-auto-generate（文档自动生成）- 7个工具

#### ✅ 保留的工具：

**Filesystem MCP（3个）**
```
✅ mcp_Filesystem_read_text_file
✅ mcp_Filesystem_read_multiple_files
✅ mcp_Filesystem_read_media_file
```

**Memory MCP（1个）**
```
✅ mcp_Memory_read_graph
```

**Sequential Thinking（1个）**
```
✅ mcp_SequentialThinking_sequentialthinking
```

**内置工具（2个）**
```
✅ 阅读
✅ 编辑
```

**❌ 取消所有浏览器工具（Playwright + DevTools = 62个）**

**📊 总计：0 + 0 + 3 + 1 + 1 + 2 = 7个工具 ✅**

---

### 19️⃣ pscg-fullstack-architect（全栈架构师）- 7个工具

#### ✅ 保留的工具：
**完全相同于 doc-auto-generate（7个工具）**

---

### 20️⃣ pscg-expert-router（专家路由）- 5个工具

#### ✅ 保留的工具：

**只保留最基础工具：**
```
✅ 内存/Memory（1个）- read_graph
✅ 思维链/Sequential Thinking（1个）- sequentialthinking
✅ 文档查询/context7（1个）- query-docs
✅ 内置-阅读（1个）
✅ 内置-编辑（1个）
```

**❌ 取消所有MCP工具（Playwright + DevTools + Filesystem = 76个）**

**📊 总计：5个工具 ✅（最精简配置）**

---

## 🎯 快速配置检查清单

### 配置前必做：
- [ ] 打开 Trae IDE → 智能体设置
- [ ] 选择要配置的智能体
- [ ] 点击"工具 - MCP"主复选框 **取消全选**
- [ ] 确认当前工具数显示为 **0**

### 按照上述清单逐个勾选后：
- [ ] 查看底部工具总数是否 ≤ 40
- [ ] 如果超限，优先取消 **Memory（6个）** 或 **context7（2个）**
- [ ] 保存配置

### 验证配置成功：
- [ ] 重启 Trae IDE
- [ ] 测试智能体是否能正常调用保留的工具
- [ ] 检查是否有功能缺失（按需调整）

---

## 💡 高级技巧

### 1. 批量配置方法：
如果觉得一个个勾选太慢，可以：
1. 先配置一个"模板智能体"（如 ui-designer 的39个工具）
2. 对于类似智能体，直接复制配置再微调

### 2. 动态调整原则：
- **发现缺少工具？** → 回到这个清单添加
- **工具太多导致混乱？** → 取消不常用的
- **新需求出现？** → 按需增加相关MCP服务器

### 3. 性能优化建议：
- **轻量任务**（文档生成、路由分配）→ 用极简版（5-10个）
- **标准开发**（BUG排查、代码审查）→ 用标准版（33个）
- **重型任务**（前端开发、UI设计、API测试）→ 用完整版（39个）

### 4. Playwright MCP 特殊用法：
- **API 测试**：使用 `get`/`post`/`put`/`patch`/`delete` + `expect_response`
- **自动化测试生成**：使用 `start_codegen_session` → 操作页面 → `end_codegen_session`
- **iframe 测试**：使用 `iframe_click`/`iframe_fill` 处理嵌入页面
- **PDF 报告**：使用 `save_as_pdf` 生成测试报告

---

## 📞 故障排查

### 问题1：配置后智能体无法调用工具
**解决方案**：检查是否误取消了"阅读"或"编辑"内置工具

### 问题2：工具数量仍然超限
**解决方案**：按优先级取消：
1. ❌ 先取消 Memory（-6个）
2. ❌ 再取消 context7（-2个）
3. ❌ 最后取消 Sequential Thinking（-1个）

### 问题3：某些功能不可用
**解决方案**：查看对应智能体的 SKILL.md 文件中的"推荐MCP工具配置"章节，确认是否遗漏了关键工具

### 问题4：Playwright 工具调用失败
**解决方案**：
1. 确认 playwright-mcp-server 已正确安装和启动
2. 检查 MCP 配置文件中的路径是否正确
3. 重启 Trae IDE 后重试

---

## 📝 版本历史

| 版本 | 日期 | 更新内容 |
|-----|------|---------|
| v2.0 | 2026-04-06 | 替换 Puppeteer MCP 为 Playwright MCP，新增 HTTP 请求、iframe、代码生成等功能 |
| v1.0 | 2026-04-05 | 初始版本，覆盖22个智能体的完整配置 |

---

**🎉 配置完成后，你的智能体团队将拥有最优化的工具组合，Playwright MCP 提供了更强大的浏览器自动化和 API 测试能力！**
