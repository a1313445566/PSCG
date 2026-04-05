---
name: "dev-env-manager"
description: "管理开发环境的启动和重启。当用户需要开启或重启前端开发服务器和后端服务器时调用。"
---

# 开发环境管理技能

## 功能介绍

此技能用于管理项目的开发环境，包括：
- 启动前端开发服务器（Vite）
- 启动后端服务器（Express）
- 重启开发环境（停止并重新启动所有服务器）

## 使用场景

当用户需要：
- 首次启动开发环境
- 开发过程中重启服务器以应用更改
- 检查开发环境状态

## 操作步骤

### 1. 启动开发环境

1. 启动前端开发服务器（Vite）：
   ```bash
   npm run dev
   ```

2. 启动后端服务器（Express）：
   ```bash
   npm run server
   ```

### 2. 重启开发环境

1. 停止当前运行的服务器进程
2. 重新启动前端和后端服务器

### 3. 检查开发环境状态

检查当前是否有服务器在运行，以及它们的状态。

## 注意事项

- 确保项目依赖已正确安装（可通过 `npm install` 命令安装）
- 前端服务器默认运行在 http://localhost:5173
- 后端服务器默认运行在 http://localhost:3000
- 重启前请确保已保存所有代码更改

## 示例使用

- "启动开发环境"
- "重启开发服务器"
- "开启前后端服务"
- "重启前端和后端"

## 推荐MCP工具配置

### 最小化或不需要（0-5个工具）

#### 可选：Chrome DevTools MCP - 基础验证子集（约5个）
```
仅在验证服务启动状态时使用：
- mcp_Chrome_DevTools_MCP_navigate_page: 访问 localhost:5173/3000 验证服务
- mcp_Chrome_DevTools_MCP_list_network_requests: 检查是否有请求响应
- mcp_Chrome_DevTools_MCP_take_snapshot: 验证页面加载成功

理由：
- 核心工作是终端命令操作（npm run dev/server）
- 主要使用 RunCommand 工具，不依赖MCP
- 仅在需要验证服务是否正常启动时才用浏览器检查
```

### 主要依赖工具
```
**核心工具（非MCP）**：
- RunCommand: 执行 npm run dev / npm run server
- CheckCommandStatus: 检查命令执行状态
- StopCommand: 停止运行中的服务
```
