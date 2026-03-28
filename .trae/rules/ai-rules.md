---
description: PSCG 智能题库系统 AI 功能开发规范
alwaysApply: false
enabled: true
updatedAt: 2026-03-28T00:00:00.000Z
provider:
---

# AI 功能开发规范

## 1. 概述

PSCG 项目集成了 AI 功能，包括自然语言分析、数据增强、学习风格分析等。本规范旨在确保 AI 功能的开发、部署和维护遵循统一标准，保证系统的可靠性、安全性和性能。

## 2. AI 服务调用规范

### 2.1 服务配置

**配置文件**：`services/aiService.js`

**配置项**：

- API 密钥管理（使用环境变量）
- 超时设置（默认 30 秒）
- 重试策略（最多 3 次，指数退避）
- 并发限制（默认 5 个并发请求）

### 2.2 调用模式

**推荐使用方式**：

```javascript
import aiService from '@/services/aiService'

// 自然语言分析
const analysis = await aiService.analyzeText(text, options)

// 学习风格分析
const learningStyle = await aiService.analyzeLearningStyle(userData)

// 数据增强
const enhancedData = await aiService.enhanceData(rawData)
```

### 2.3 错误处理

**统一错误处理**：

```javascript
try {
  const result = await aiService.analyzeText(text)
  // 处理结果
} catch (error) {
  console.error('AI 分析失败:', error)
  // 降级处理
  return fallbackAnalysis(text)
}
```

### 2.4 超时和重试

**配置示例**：

```javascript
const AI_CONFIG = {
  timeout: 30000, // 30秒
  maxRetries: 3,
  retryDelay: 1000, // 1秒
  concurrency: 5
}
```

## 3. AI 模型参数管理

### 3.1 参数配置

**参数分类**：

- 模型选择参数
- 分析深度参数
- 响应格式参数
- 安全过滤参数

### 3.2 参数验证

**输入验证**：

- 使用 `aiInputValidation` 中间件
- 限制输入长度（最大 5000 字符）
- 过滤敏感内容

## 4. AI 数据处理规范

### 4.1 数据存储

**存储位置**：

- 分析结果：`ai_analysis` 表
- 分析历史：`ai_analysis_history` 表
- 学习风格：`user_learning_style` 表

### 4.2 数据安全

**安全措施**：

- 敏感数据脱敏
- 数据访问权限控制
- 定期数据清理

## 5. AI 分析结果缓存

### 5.1 缓存策略

**缓存配置**：

- 分析结果缓存（1小时）
- 学习风格缓存（24小时）
- 数据增强缓存（30分钟）

**缓存实现**：

```javascript
// 使用 memory-cache
const cache = require('memory-cache')

const CACHE_TTL = {
  ANALYSIS: 60 * 60 * 1000, // 1小时
  LEARNING_STYLE: 24 * 60 * 60 * 1000, // 24小时
  DATA_ENHANCEMENT: 30 * 60 * 1000 // 30分钟
}
```

### 5.2 缓存失效

**失效场景**：

- 数据更新时
- 模型版本变更时
- 缓存达到最大容量时

## 6. AI 功能模块

### 6.1 自然语言分析

**功能**：

- 文本情感分析
- 语义理解
- 关键词提取
- 内容分类

**API**：`/api/ai/analyze`

### 6.2 学习风格分析

**功能**：

- 基于答题行为的学习风格识别
- 个性化学习建议生成
- 学习路径推荐

**API**：`/api/ai/learning-style`

### 6.3 数据增强

**功能**：

- 题目自动生成
- 题目难度调整
- 解析自动生成

**API**：`/api/ai/data-enhancement`

## 7. 性能优化

### 7.1 异步处理

**使用队列**：

- `aiQueueService.js` 处理耗时任务
- 优先级队列管理
- 任务状态跟踪

### 7.2 批处理

**批量分析**：

- 合并多个分析请求
- 减少 API 调用次数
- 提高处理效率

## 8. 安全规范

### 8.1 输入验证

**验证规则**：

- 长度限制
- 内容过滤
- 格式检查

### 8.2 输出安全

**安全措施**：

- 结果脱敏
- 内容过滤
- 错误信息处理

## 9. 监控和日志

### 9.1 监控指标

**关键指标**：

- API 响应时间
- 成功率
- 错误率
- 并发数

### 9.2 日志记录

**日志级别**：

- INFO：正常操作
- WARN：警告信息
- ERROR：错误信息
- DEBUG：调试信息

## 10. 最佳实践

### 10.1 代码示例

**自然语言分析**：

```javascript
// 正确：使用服务封装
import aiService from '@/services/aiService'

const analyzeText = async text => {
  try {
    const result = await aiService.analyzeText(text, {
      depth: 'medium',
      format: 'detailed'
    })
    return result
  } catch (error) {
    console.error('分析失败:', error)
    // 降级处理
    return { score: 0, sentiment: 'neutral' }
  }
}
```

**学习风格分析**：

```javascript
const analyzeLearningStyle = async userId => {
  // 先检查缓存
  const cached = cache.get(`learning_style_${userId}`)
  if (cached) return cached

  try {
    const result = await aiService.analyzeLearningStyle(userId)
    // 缓存结果
    cache.put(`learning_style_${userId}`, result, CACHE_TTL.LEARNING_STYLE)
    return result
  } catch (error) {
    console.error('学习风格分析失败:', error)
    return { style: 'visual', score: 0.5 }
  }
}
```

### 10.2 注意事项

- 避免直接调用外部 AI API，使用服务封装
- 实现合理的超时和重试机制
- 对分析结果进行缓存
- 监控 API 使用情况，避免滥用
- 确保数据安全和隐私保护

## 11. 故障处理

### 11.1 常见问题

| 问题       | 原因               | 解决方案                   |
| ---------- | ------------------ | -------------------------- |
| API 超时   | 网络问题或服务繁忙 | 增加超时时间，实现重试     |
| 分析失败   | 输入格式错误       | 加强输入验证               |
| 结果不准确 | 模型限制           | 调整模型参数或使用多个模型 |
| 性能问题   | 并发过高           | 限制并发数，使用队列       |

### 11.2 降级策略

**降级方案**：

- 本地规则替代 AI 分析
- 缓存结果使用
- 简化分析深度

## 12. 版本管理

### 12.1 模型版本

**版本控制**：

- 记录模型版本
- 支持模型切换
- 版本回滚机制

### 12.2 API 版本

**版本规范**：

- API 路径包含版本号
- 向后兼容性保证
- 版本迁移策略

## 13. 文档参考

- AI 服务配置：`services/aiService.js`
- AI 队列服务：`services/aiQueueService.js`
- AI 输入验证：`middleware/aiInputValidation.js`
- AI API 文档：`DOCS/API文档/AI数据增强API.md`
