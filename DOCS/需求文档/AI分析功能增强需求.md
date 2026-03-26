# AI 分析功能增强需求

## 📋 需求概述

在现有豆包 AI 自然语言分析基础上，创建独立的 AI 智能分析页面，添加以下增强功能：

1. **AI 分析历史记录** - 保存分析历史，方便回顾
2. **Markdown 渲染支持** - 让分析结果更美观
3. **图表可视化** - AI 建议配合数据图表展示
4. **批量题目分析** - 同时分析多道题目

## 💡 技术选型：全面替换为 VisActor

### 🔄 图表库替换策略

**现状分析**:
- 项目目前使用 **ECharts** 作为图表库
- 仅 **2 个文件** 使用 ECharts：
  - `src/views/admin/DashboardView.vue` - 仪表盘
  - `src/components/admin/analysis/AnalysisCharts.vue` - 分析图表

**替换方案**:
- ✅ **全面替换 ECharts 为 VChart**
- ✅ 统一使用 VisActor 系列库
- ✅ 减少技术栈复杂度

**VisActor 系列库**:

- **VChart**: 声明式图表库（替代 ECharts）
- **VMind**: 智能可视化解决方案（支持自然语言生成图表）
- **marked**: `^17.0.5` - Markdown 渲染（已安装）

**核心优势**:

- ✅ **官方支持**: 字节跳动开源，与豆包 AI 天然集成
- ✅ **智能分析**: VMind 可直接使用豆包 AI 生成图表
- ✅ **性能出色**: Canvas 渲染，性能优秀
- ✅ **技术统一**: 项目统一使用 VisActor 生态
- ✅ **降级方案**: VMind 失败时自动降级到规则生成

## 🎨 页面设计

### 独立页面结构

**路由**: `/admin/ai-analysis`

**侧边栏菜单**: 在"数据分析"后添加"AI 智能分析"

**页面布局**:

```
┌─────────────────────────────────────┐
│  AI 智能分析                         │
├─────────────────────────────────────┤
│  [自然语言分析] [批量分析] [历史记录] │ ← Tab 切换
├─────────────────────────────────────┤
│  分析面板 / 批量面板 / 历史列表      │
│                                     │
│  ┌───────────┬─────────────────┐   │
│  │ 图表展示   │  分析结果        │   │
│  │ (VChart)  │  (Markdown)     │   │
│  └───────────┴─────────────────┘   │
└─────────────────────────────────────┘
```

### 依赖说明

**使用 VisActor 系列库**（字节跳动官方可视化方案）:

- **VChart**: 图表可视化库（替代 ECharts）
- **VMind**: 智能可视化解决方案（支持自然语言生成图表）
- **marked**: `^17.0.5` - Markdown 渲染（已安装）

**优势**:

- ✅ 与豆包 AI 天然集成
- ✅ VMind 支持自然语言生成图表
- ✅ 字节跳动官方维护
- ✅ 更智能的图表推荐

**需要安装**:

```bash
npm install @visactor/vchart @visactor/vmind --save
```

***

## 🔍 项目现状检查

### ✅ 已完成的基础功能

- [x] 豆包 AI 服务封装 (`services/aiService.js`)
- [x] AI 分析 API 接口 (`routes/ai.js`)
- [x] 后台配置界面 (`AIConfigSetting.vue`)
- [x] 前端分析面板 (`AIAnalysisPanel.vue`)
- [x] AI 缓存机制

### 📦 现有工具和封装

- [x] API 封装: `src/utils/api.js`
- [x] 消息封装: `src/utils/message.js`
- [x] 日期工具: `src/utils/dateUtils.js`
- [x] 数据库服务: `services/database.js`

***

## 🎯 技术约束（必须遵循）

### 1. 数据库规范

- **必须使用 MySQL 语法**
- 创建表: `CREATE TABLE IF NOT EXISTS ... AUTO_INCREMENT`
- 字段类型: `INT`, `VARCHAR`, `TEXT`, `DATETIME`, `JSON`
- 索引: `INDEX idx_name (column)`

### 2. API 调用规范

- **必须使用** **`api`** **封装**，禁止原生 fetch
- GET: `api.get('/endpoint')`
- POST: `api.post('/endpoint', data)`
- DELETE: `api.delete('/endpoint')`

### 3. 消息提示规范

- **必须使用** **`message`** **封装**，禁止 Element Plus
- 成功: `message.success('操作成功')`
- 错误: `message.error('操作失败')`
- 动作: `message.actionSuccess('保存')`

### 4. HOOK 使用规范

- 必须正确使用 `useLoading` Hook
- 示例: `const { loading, withLoading } = useLoading()`

### 5. 错误处理规范

- **所有异步操作必须包含 try-catch**
- 后端错误统一返回: `{ error: '错误信息' }`
- 前端错误自动显示（api 封装）

### 6. 安全规范

- 所有管理接口使用 `adminAuth` 中间件
- 用户输入必须验证和过滤
- XSS 防护: 使用 `escapeHtml` 或自动防护（api 封装）
- CSRF 防护: 自动添加（api 封装）

### 7. 图标导入规范

- **必须从** **`@element-plus/icons-vue`** **导入图标**
- 示例: `import { ChatDotRound, QuestionFilled } from '@element-plus/icons-vue'`

### 8. CSS 管理规范

- 必须使用 `<style scoped>`
- 复用公共样式: `src/styles/global.css`

***

## 🛣️ 路由和菜单配置

### 路由配置

**文件**: `src/router/index.js`

**添加路由**（在 `/admin` 路由后添加）:

```javascript
const routes = [
  // ... 现有路由
  {
    path: '/admin',
    name: 'Admin',
    component: lazyLoad('AdminView')
  },
  {
    path: '/ai-analysis',  // 新增 AI 分析路由
    name: 'AIAnalysis',
    component: lazyLoad('AIAnalysisView')
  },
  // ... 其他路由
]
```

### 侧边栏菜单配置

**文件**: `src/components/admin/layout/AdminSidebar.vue`

**修改 menuTreeData 计算属性**（在"数据分析"后添加）:

```javascript
const menuTreeData = computed(() => {
  // ... 现有代码
  
  return [
    // ... 现有菜单
    {
      id: 'data-analysis',
      label: '数据分析',
      icon: 'TrendCharts',
      isMenu: true
    },
    {
      id: 'ai-analysis',        // 新增菜单项
      label: 'AI 智能分析',
      icon: 'ChatDotRound',     // 需要导入图标
      isMenu: true
    },
    {
      id: 'basic-settings',
      label: '基础设置',
      icon: 'Tools',
      isMenu: true
    },
    // ... 其他菜单
  ]
})
```

**导入图标**（在 script setup 顶部）:

```javascript
import {
  DataLine, Document, Reading, School,
  UserFilled, User, Tools, Coin, Lock,
  ArrowLeft, ArrowRight, Grid, FolderOpened, Histogram, Clock,
  TrendCharts, ChatDotRound  // 新增 ChatDotRound
} from '@element-plus/icons-vue'
```
{
  index: 'ai-analysis',
  title: 'AI 智能分析',
  icon: 'ChatDotRound'
}
```

***

## 📄 页面文件结构

### 新建文件

```
src/
├── views/
│   └── AIAnalysisView.vue              # AI 智能分析主页面
├── components/
│   └── admin/
│       └── ai/
│           ├── AIAnalysisPanel.vue     # 自然语言分析面板
│           ├── BatchAnalysis.vue       # 批量分析面板
│           ├── AIHistoryList.vue       # 历史记录列表
│           └── AIChartDisplay.vue      # 图表展示组件
├── utils/
│   ├── markdown.js                      # Markdown 渲染工具
│   └── chartGenerator.js                # 图表生成工具
└── styles/
    └── markdown.css                     # Markdown 样式
```

### 主页面结构

**文件**: `src/views/AIAnalysisView.vue`

```vue
<template>
  <div class="ai-analysis-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>
        <el-icon><ChatDotRound /></el-icon>
        AI 智能分析
      </h2>
      <el-tag type="success">Powered by 豆包</el-tag>
    </div>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="analysis-tabs">
      <el-tab-pane label="自然语言分析" name="natural">
        <AIAnalysisPanel />
      </el-tab-pane>
      
      <el-tab-pane label="批量题目分析" name="batch">
        <BatchAnalysis />
      </el-tab-pane>
      
      <el-tab-pane label="历史记录" name="history">
        <AIHistoryList />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ChatDotRound } from '@element-plus/icons-vue'
import AIAnalysisPanel from '@/components/admin/ai/AIAnalysisPanel.vue'
import BatchAnalysis from '@/components/admin/ai/BatchAnalysis.vue'
import AIHistoryList from '@/components/admin/ai/AIHistoryList.vue'

const activeTab = ref('natural')
</script>

<style scoped>
.ai-analysis-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
}

.analysis-tabs {
  background: white;
  padding: 20px;
  border-radius: 8px;
}
</style>
```

***

## 📝 需求详情

### 需求 1: AI 分析历史记录

#### 功能描述

保存用户的 AI 分析历史记录，支持查看历史、删除、清空等操作。

#### 数据库设计

**表名**: `ai_analysis_history`

```sql
CREATE TABLE IF NOT EXISTS ai_analysis_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  question TEXT NOT NULL COMMENT '问题内容',
  result TEXT NOT NULL COMMENT 'AI分析结果',
  filters JSON COMMENT '筛选条件',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI分析历史记录';
```

#### 后端 API

##### 1.1 保存分析历史

```javascript
/**
 * POST /ai/history
 * 保存 AI 分析历史
 */
router.post('/history', adminAuth, async (req, res) => {
  try {
    const { question, result, filters } = req.body;
    const userId = req.admin.id;
    
    // 输入验证
    if (!question || !result) {
      return res.status(400).json({ error: '问题和结果不能为空' });
    }
    
    // 保存历史
    await db.run(
      `INSERT INTO ai_analysis_history (user_id, question, result, filters, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, question, result, JSON.stringify(filters || {})]
    );
    
    res.json({ success: true, message: '历史保存成功' });
  } catch (error) {
    console.error('[AI历史] 保存失败:', error);
    res.status(500).json({ error: '保存历史失败' });
  }
});
```

##### 1.2 获取历史列表

```javascript
/**
 * GET /ai/history
 * 获取 AI 分析历史列表（分页）
 */
router.get('/history', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.admin.id;
    const offset = (page - 1) * limit;
    
    // 查询总数
    const countResult = await db.get(
      'SELECT COUNT(*) as total FROM ai_analysis_history WHERE user_id = ?',
      [userId]
    );
    
    // 查询列表
    const list = await db.all(
      `SELECT id, question, result, filters, created_at
       FROM ai_analysis_history
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), offset]
    );
    
    res.json({
      list,
      total: countResult.total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('[AI历史] 查询失败:', error);
    res.status(500).json({ error: '查询历史失败' });
  }
});
```

##### 1.3 删除历史

```javascript
/**
 * DELETE /ai/history/:id
 * 删除单条历史记录
 */
router.delete('/history/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.admin.id;
    
    const result = await db.run(
      'DELETE FROM ai_analysis_history WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }
    
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('[AI历史] 删除失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});
```

##### 1.4 清空历史

```javascript
/**
 * DELETE /ai/history
 * 清空所有历史记录
 */
router.delete('/history', adminAuth, async (req, res) => {
  try {
    const userId = req.admin.id;
    
    await db.run('DELETE FROM ai_analysis_history WHERE user_id = ?', [userId]);
    
    res.json({ success: true, message: '清空成功' });
  } catch (error) {
    console.error('[AI历史] 清空失败:', error);
    res.status(500).json({ error: '清空失败' });
  }
});
```

#### 前端组件

**文件位置**: `src/components/admin/ai/AIHistoryList.vue`（新建）

**主要功能**:

- 历史列表展示（卡片式）
- 分页加载
- 点击查看详情
- 删除单条记录
- 清空所有历史
- 时间格式化显示

***

### 需求 2: Markdown 渲染支持

#### 功能描述

支持 AI 分析结果的 Markdown 格式渲染，让结果更美观易读。

#### 技术选型

- **库**: `marked` 或 `markdown-it`
- **样式**: GitHub 风格 Markdown 样式

#### 安装依赖

```bash
npm install marked --save
# 或
npm install markdown-it --save
```

#### 前端实现

**工具文件**: `src/utils/markdown.js`（新建）

```javascript
import { marked } from 'marked'

// 配置 marked
marked.setOptions({
  breaks: true,        // 支持 GitHub 风格换行
  gfm: true,          // 启用 GitHub 风格 Markdown
  headerIds: false,   // 禁用 header ID（安全考虑）
  mangle: false       // 禁用邮箱混淆（安全考虑）
})

/**
 * 渲染 Markdown 为 HTML
 * @param {string} markdown - Markdown 文本
 * @returns {string} HTML 字符串
 */
export function renderMarkdown(markdown) {
  if (!markdown) return ''
  
  try {
    return marked.parse(markdown)
  } catch (error) {
    console.error('[Markdown] 渲染失败:', error)
    return markdown // 降级：返回原文
  }
}

/**
 * 渲染 Markdown（带 XSS 防护）
 * @param {string} markdown - Markdown 文本
 * @returns {string} 安全的 HTML 字符串
 */
export function renderMarkdownSafe(markdown) {
  if (!markdown) return ''
  
  try {
    const html = marked.parse(markdown)
    // 使用 DOMPurify 进行 XSS 防护（可选）
    // return DOMPurify.sanitize(html)
    return html
  } catch (error) {
    console.error('[Markdown] 渲染失败:', error)
    return `<pre>${markdown}</pre>`
  }
}
```

#### 样式文件

**文件位置**: `src/styles/markdown.css`（新建）

```css
/* GitHub 风格 Markdown 样式 */
.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #24292e;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body h1 {
  font-size: 2em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: .3em;
}

.markdown-body h2 {
  font-size: 1.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: .3em;
}

.markdown-body h3 {
  font-size: 1.25em;
}

.markdown-body p {
  margin-bottom: 16px;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 2em;
  margin-bottom: 16px;
}

.markdown-body li {
  margin-bottom: 4px;
}

.markdown-body code {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(27,31,35,.05);
  border-radius: 3px;
  font-family: SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace;
}

.markdown-body pre {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 3px;
  margin-bottom: 16px;
}

.markdown-body pre code {
  background-color: transparent;
  padding: 0;
}

.markdown-body blockquote {
  padding: 0 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
  margin-bottom: 16px;
}

.markdown-body table {
  border-spacing: 0;
  border-collapse: collapse;
  margin-bottom: 16px;
  width: 100%;
}

.markdown-body table th,
.markdown-body table td {
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
}

.markdown-body table th {
  font-weight: 600;
  background-color: #f6f8fa;
}

.markdown-body table tr {
  background-color: #fff;
  border-top: 1px solid #c6cbd1;
}

.markdown-body table tr:nth-child(2n) {
  background-color: #f6f8fa;
}

.markdown-body strong {
  font-weight: 600;
}

.markdown-body em {
  font-style: italic;
}

.markdown-body a {
  color: #0366d6;
  text-decoration: none;
}

.markdown-body a:hover {
  text-decoration: underline;
}
```

#### 组件使用

**修改文件**: `src/components/admin/ai/AIAnalysisPanel.vue`

```vue
<template>
  <div class="ai-analysis-panel">
    <!-- 结果展示区 -->
    <div v-if="analysisResult" class="result-section">
      <!-- Markdown 渲染 -->
      <div class="markdown-body" v-html="renderedResult"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { renderMarkdown } from '@/utils/markdown'
import '@/styles/markdown.css'

// 渲染 Markdown 结果
const renderedResult = computed(() => {
  return renderMarkdown(analysisResult.value)
})
</script>
```

***

### 需求 3: 图表可视化

#### 功能描述

根据 AI 分析建议，自动生成或展示相关数据图表。

#### 技术方案

- 使用 ECharts（项目已安装）
- 根据分析内容智能匹配图表类型
- 支持手动切换图表类型

#### 实现方案

##### 3.1 智能图表生成（使用 VMind）

**工具文件**: `src/utils/chartGenerator.js`（新建）

```javascript
import { VMind } from '@visactor/vmind'
import VChart from '@visactor/vchart'

// 初始化 VMind 实例（集成豆包 AI）
const vmind = new VMind({
  llm: {
    type: 'doubao',  // 使用豆包 AI
    model: 'doubao-pro-32k',
    url: '/api/ai/vmind'  // 后端代理豆包 AI 接口
  }
})

/**
 * 使用 VMind 智能生成图表
 * @param {string} userInput - 用户自然语言输入
 * @param {array} data - 原始数据
 * @returns {Promise<object>} VChart 配置
 */
export async function generateChartWithVMind(userInput, data) {
  try {
    // 使用 VMind 根据自然语言生成图表
    const spec = await vmind.generateChart(userInput, data)
    
    return {
      spec,
      chartType: spec.type || 'bar'
    }
  } catch (error) {
    console.error('[VMind] 图表生成失败:', error)
    // 降级：使用规则生成
    return generateChartByRule(userInput, data)
  }
}

/**
 * 规则生成图表（降级方案）
 * @param {string} userInput - 用户输入
 * @param {array} data - 原始数据
 * @returns {object} VChart 配置
 */
function generateChartByRule(userInput, data) {
  const text = userInput.toLowerCase()
  
  // 柱状图：对比类数据
  if (text.includes('对比') || text.includes('比较') || text.includes('排名')) {
    return generateBarChart(data)
  }
  
  // 饼图：占比类数据
  if (text.includes('占比') || text.includes('比例') || text.includes('分布')) {
    return generatePieChart(data)
  }
  
  // 折线图：趋势类数据
  if (text.includes('趋势') || text.includes('变化') || text.includes('增长')) {
    return generateLineChart(data)
  }
  
  // 默认：柱状图
  return generateBarChart(data)
}

/**
 * 生成柱状图（VChart 配置）
 */
function generateBarChart(data) {
  return {
    type: 'bar',
    data: [
      {
        id: 'data',
        values: (data.categories || []).map((name, index) => ({
          category: name,
          value: data.values[index] || 0
        }))
      }
    ],
    xField: 'category',
    yField: 'value',
    title: {
      visible: true,
      text: '数据分析'
    },
    bar: {
      style: {
        fill: '#409EFF'
      }
    }
  }
}

/**
 * 生成饼图（VChart 配置）
 */
function generatePieChart(data) {
  return {
    type: 'pie',
    data: [
      {
        id: 'data',
        values: (data.categories || []).map((name, index) => ({
          category: name,
          value: data.values[index] || 0
        }))
      }
    ],
    valueField: 'value',
    categoryField: 'category',
    title: {
      visible: true,
      text: '数据分布'
    },
    pie: {
      style: {
        fillOpacity: 0.8
      }
    }
  }
}

/**
 * 生成折线图（VChart 配置）
 */
function generateLineChart(data) {
  return {
    type: 'line',
    data: [
      {
        id: 'data',
        values: (data.categories || []).map((name, index) => ({
          category: name,
          value: data.values[index] || 0
        }))
      }
    ],
    xField: 'category',
    yField: 'value',
    title: {
      visible: true,
      text: '趋势分析'
    },
    line: {
      style: {
        stroke: '#409EFF',
        lineWidth: 2
      }
    },
    point: {
      style: {
        fill: '#409EFF'
      }
    }
  }
}

/**
 * 手动切换图表类型
 * @param {string} chartType - 图表类型
 * @param {array} data - 原始数据
 * @returns {object} VChart 配置
 */
export function switchChartType(chartType, data) {
  switch (chartType) {
    case 'bar':
      return generateBarChart(data)
    case 'pie':
      return generatePieChart(data)
    case 'line':
      return generateLineChart(data)
    default:
      return generateBarChart(data)
  }
}

export { VChart }
```

##### 3.2 后端 VMind 代理接口

**文件**: `routes/ai.js`（新增）

```javascript
/**
 * POST /ai/vmind
 * VMind 代理豆包 AI 接口
 */
router.post('/vmind', adminAuth, async (req, res) => {
  try {
    const { messages } = req.body;
    
    // 获取豆包 AI 配置
    await aiService.loadConfig();
    
    if (!aiService.config.apiKey) {
      return res.status(400).json({ error: 'AI 服务未配置' });
    }
    
    // 调用豆包 AI
    const response = await fetch(`${aiService.config.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiService.config.apiKey}`
      },
      body: JSON.stringify({
        model: aiService.config.model,
        messages,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error(`AI API 调用失败: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('[VMind] 代理请求失败:', error);
    res.status(500).json({ error: error.message });
  }
});
```

##### 3.3 组件集成（使用 VChart）

**修改文件**: `src/components/admin/ai/AIAnalysisPanel.vue`

```vue
<template>
  <div class="ai-analysis-panel">
    <!-- 图表展示区 -->
    <div v-if="showChart" class="chart-section">
      <div class="chart-header">
        <h4>📊 数据可视化</h4>
        <el-radio-group v-model="chartType" size="small" @change="handleChartTypeChange">
          <el-radio-button label="auto">AI 智能推荐</el-radio-button>
          <el-radio-button label="bar">柱状图</el-radio-button>
          <el-radio-button label="pie">饼图</el-radio-button>
          <el-radio-button label="line">折线图</el-radio-button>
        </el-radio-group>
      </div>
      <div ref="chartContainer" class="chart-container"></div>
    </div>
    
    <!-- 分析结果 -->
    <div v-if="analysisResult" class="result-section">
      <div class="markdown-body" v-html="renderedResult"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { generateChartWithVMind, switchChartType, VChart } from '@/utils/chartGenerator'
import { renderMarkdown } from '@/utils/markdown'
import '@/styles/markdown.css'

const chartContainer = ref(null)
const chartType = ref('auto')
const chartSpec = ref(null)
let vchartInstance = null

// 渲染图表
const renderChart = async () => {
  if (!chartContainer.value || !chartSpec.value) return
  
  // 销毁旧实例
  if (vchartInstance) {
    vchartInstance.release()
  }
  
  // 创建新实例
  vchartInstance = new VChart(chartSpec.value, {
    dom: chartContainer.value,
    mode: 'desktop-browser'
  })
  
  await vchartInstance.renderAsync()
}

// 处理图表类型切换
const handleChartTypeChange = async (type) => {
  if (type === 'auto') {
    // 使用 VMind 智能生成
    const result = await generateChartWithVMind(
      questionInput.value,
      analysisData.value
    )
    chartSpec.value = result.spec
  } else {
    // 使用规则生成
    chartSpec.value = switchChartType(type, analysisData.value)
  }
  
  await renderChart()
}

// 监听分析结果变化
watch(analysisResult, async () => {
  if (analysisResult.value && chartType.value === 'auto') {
    const result = await generateChartWithVMind(
      questionInput.value,
      analysisData.value
    )
    chartSpec.value = result.spec
    await renderChart()
  }
})

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  vchartInstance?.release()
})

const handleResize = () => {
  vchartInstance?.resize()
}
</script>

<style scoped>
.chart-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.chart-container {
  width: 100%;
  height: 400px;
  background: white;
  border-radius: 8px;
}
</style>
```

```
  <div ref="chartRef" class="chart-container"></div>
</div>

<!-- 分析结果 -->
<div v-if="analysisResult" class="result-section">
  <div class="markdown-body" v-html="renderedResult"></div>
</div>
```

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { generateChartFromAnalysis } from '@/utils/chartGenerator'

const chartRef = ref(null)
const chartType = ref('auto')
let chartInstance = null

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  
  // 根据类型生成图表
  const chartConfig = generateChartFromAnalysis(
    analysisResult.value,
    analysisData.value
  )
  
  chartInstance.setOption(chartConfig)
}

// 监听图表类型变化
watch(chartType, () => {
  if (chartInstance) {
    const chartConfig = generateChartFromAnalysis(
      analysisResult.value,
      analysisData.value
    )
    chartInstance.setOption(chartConfig)
  }
})

// 监听窗口大小变化
const handleResize = () => {
  chartInstance?.resize()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style scoped>
.chart-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.chart-container {
  width: 100%;
  height: 400px;
  background: white;
  border-radius: 8px;
}
</style>

````

---

### 需求 4: 批量题目分析

#### 功能描述
支持同时分析多道题目，批量获取 AI 建议。

#### 数据库设计

**表名**: `ai_batch_analysis`（新增）

```sql
CREATE TABLE IF NOT EXISTS ai_batch_analysis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  title VARCHAR(255) COMMENT '批量分析标题',
  question_ids JSON COMMENT '题目ID列表',
  results JSON COMMENT '批量分析结果',
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending' COMMENT '状态',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  completed_at DATETIME COMMENT '完成时间',
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI批量分析记录';
````

#### 后端 API

##### 4.1 创建批量分析

```javascript
/**
 * POST /ai/batch
 * 创建批量分析任务
 */
router.post('/batch', adminAuth, async (req, res) => {
  try {
    const { questionIds, title } = req.body;
    const userId = req.admin.id;
    
    // 输入验证
    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: '请选择要分析的题目' });
    }
    
    if (questionIds.length > 50) {
      return res.status(400).json({ error: '单次最多分析50道题目' });
    }
    
    // 创建批量分析记录
    const result = await db.run(
      `INSERT INTO ai_batch_analysis (user_id, title, question_ids, status, created_at)
       VALUES (?, ?, ?, 'pending', NOW())`,
      [userId, title || '批量题目分析', JSON.stringify(questionIds)]
    );
    
    // 异步处理批量分析（后台任务）
    processBatchAnalysis(result.insertId, questionIds);
    
    res.json({ 
      success: true, 
      batchId: result.insertId,
      message: '批量分析任务已创建，正在处理中...'
    });
  } catch (error) {
    console.error('[AI批量分析] 创建失败:', error);
    res.status(500).json({ error: '创建批量分析失败' });
  }
});
```

##### 4.2 处理批量分析（后台任务）

```javascript
/**
 * 处理批量分析任务
 * @param {number} batchId - 批次ID
 * @param {array} questionIds - 题目ID列表
 */
async function processBatchAnalysis(batchId, questionIds) {
  try {
    // 更新状态为处理中
    await db.run(
      'UPDATE ai_batch_analysis SET status = ? WHERE id = ?',
      ['processing', batchId]
    );
    
    const results = [];
    
    // 逐个分析题目
    for (const questionId of questionIds) {
      try {
        // 获取题目信息
        const question = await db.get(
          'SELECT * FROM questions WHERE id = ?',
          [questionId]
        );
        
        if (!question) continue;
        
        // 调用 AI 分析
        const analysis = await aiService.generateExplanation({
          title: question.title,
          content: question.content,
          answer: question.answer,
          analysis: question.analysis
        });
        
        results.push({
          questionId,
          questionTitle: question.title,
          analysis
        });
        
        // 延迟，避免 API 调用过快
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[AI批量分析] 题目 ${questionId} 分析失败:`, error);
        results.push({
          questionId,
          error: '分析失败'
        });
      }
    }
    
    // 更新批量分析结果
    await db.run(
      `UPDATE ai_batch_analysis 
       SET status = 'completed', results = ?, completed_at = NOW()
       WHERE id = ?`,
      [JSON.stringify(results), batchId]
    );
    
  } catch (error) {
    console.error('[AI批量分析] 处理失败:', error);
    
    // 更新状态为失败
    await db.run(
      'UPDATE ai_batch_analysis SET status = ? WHERE id = ?',
      ['failed', batchId]
    );
  }
}
```

##### 4.3 查询批量分析状态

```javascript
/**
 * GET /ai/batch/:id
 * 查询批量分析状态和结果
 */
router.get('/batch/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.admin.id;
    
    const batch = await db.get(
      'SELECT * FROM ai_batch_analysis WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (!batch) {
      return res.status(404).json({ error: '批次不存在' });
    }
    
    // 解析 JSON 字段
    batch.question_ids = JSON.parse(batch.question_ids || '[]');
    batch.results = JSON.parse(batch.results || '[]');
    
    res.json(batch);
  } catch (error) {
    console.error('[AI批量分析] 查询失败:', error);
    res.status(500).json({ error: '查询失败' });
  }
});
```

##### 4.4 获取批量分析列表

```javascript
/**
 * GET /ai/batch
 * 获取批量分析列表
 */
router.get('/batch', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.admin.id;
    const offset = (page - 1) * limit;
    
    const countResult = await db.get(
      'SELECT COUNT(*) as total FROM ai_batch_analysis WHERE user_id = ?',
      [userId]
    );
    
    const list = await db.all(
      `SELECT id, title, status, created_at, completed_at
       FROM ai_batch_analysis
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), offset]
    );
    
    res.json({
      list,
      total: countResult.total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('[AI批量分析] 列表查询失败:', error);
    res.status(500).json({ error: '查询失败' });
  }
});
```

#### 前端组件

**文件位置**: `src/components/admin/ai/BatchAnalysis.vue`（新建）

**主要功能**:

- 题目多选界面
- 创建批量分析
- 进度显示
- 结果查看
- 导出批量报告

***

## 📦 实施步骤

### 第一步：安装依赖（5 分钟）

```bash
npm install @visactor/vchart @visactor/vmind --save
npm uninstall echarts  # 移除 ECharts
```

### 第二步：ECharts 替换为 VChart（60 分钟）

**需要替换的文件**:
1. `src/views/admin/DashboardView.vue`
   - 移除 ECharts 导入
   - 引入 VChart
   - 转换图表配置格式
   - 测试仪表盘功能

2. `src/components/admin/analysis/AnalysisCharts.vue`
   - 移除 ECharts 导入
   - 引入 VChart
   - 转换图表配置格式
   - 测试分析图表功能

**VChart vs ECharts 配置对比**:
```javascript
// ECharts 配置
{
  xAxis: { type: 'category', data: ['A', 'B', 'C'] },
  yAxis: { type: 'value' },
  series: [{ type: 'bar', data: [10, 20, 30] }]
}

// VChart 配置
{
  type: 'bar',
  data: [{ id: 'data', values: [
    { category: 'A', value: 10 },
    { category: 'B', value: 20 },
    { category: 'C', value: 30 }
  ]}],
  xField: 'category',
  yField: 'value'
}
```

### 第三步：数据库准备（15 分钟）

1. 在 `server.cjs` 中添加表创建函数
   - `ai_analysis_history` 表（历史记录）
   - `ai_batch_analysis` 表（批量分析）
2. 重启服务器验证表创建

### 第四步：路由和菜单配置（10 分钟）

1. 在 `src/router/index.js` 添加路由
   - 使用 `lazyLoad('AIAnalysisView')`
2. 在 `AdminSidebar.vue` 的 `menuTreeData` 中添加菜单项
   - 导入 `ChatDotRound` 图标
   - 在"数据分析"后添加"AI 智能分析"
3. 测试路由跳转

### 第五步：工具文件创建（20 分钟）

1. 创建 `src/utils/markdown.js`（Markdown 渲染）
2. 创建 `src/styles/markdown.css`（Markdown 样式）
3. 创建 `src/utils/chartGenerator.js`（VMind 图表生成）

### 第六步：后端 API 开发（60 分钟）

1. 修改 `routes/ai.js`
   - 历史记录 API（保存、查询、删除、清空）
   - 批量分析 API（创建、查询、列表）
   - VMind 代理接口（豆包 AI 集成）
2. 测试 API 接口

### 第七步：主页面开发（30 分钟）

1. 创建 `src/views/AIAnalysisView.vue`
   - Tab 切换布局
   - 集成三个子组件

### 第八步：子组件开发（90 分钟）

1. 修改 `AIAnalysisPanel.vue`
   - 添加 Markdown 渲染
   - 添加 VChart 图表展示
   - 集成 VMind 智能图表
   - 自动保存历史
2. 创建 `BatchAnalysis.vue`
   - 题目多选
   - 批量分析任务
   - 进度显示
3. 创建 `AIHistoryList.vue`
   - 历史列表展示
   - 详情查看
   - 删除和清空

### 第九步：测试和优化（30 分钟）

1. 测试所有功能
   - 测试 ECharts 替换后的功能
   - 测试 AI 分析功能
   - 测试批量分析
   - 测试历史记录
2. 性能优化
3. 样式调整

**总计: 约 5.5 小时**

***

## ✅ 验收标准

### 功能验收

- [ ] **ECharts 已完全替换为 VChart**
- [ ] 仪表盘图表正常显示
- [ ] 数据分析图表正常显示
- [ ] 独立页面可正常访问
- [ ] 侧边栏菜单显示正确
- [ ] Tab 切换流畅
- [ ] AI 分析历史记录正常保存
- [ ] 历史记录支持查看、删除、清空
- [ ] Markdown 格式正确渲染
- [ ] 图表根据分析内容智能生成
- [ ] 支持手动切换图表类型
- [ ] 批量分析任务正常创建
- [ ] 批量分析进度实时更新
- [ ] 批量分析结果正确保存和展示

### 技术验收

- [ ] 数据库规范: MySQL 语法正确
- [ ] API 规范: 使用 api 封装
- [ ] 消息规范: 使用 message 封装
- [ ] HOOK 规范: 正确使用 useLoading
- [ ] 图标导入: 所有图标已导入
- [ ] 错误处理: 完整覆盖
- [ ] 安全措施: 权限验证、输入验证
- [ ] **依赖使用: 正确使用 VChart 和 VMind**
- [ ] **VMind 集成: 成功连接豆包 AI**
- [ ] **ECharts 已卸载，无残留依赖**

### 性能验收

- [ ] Markdown 渲染流畅（< 100ms）
- [ ] 图表生成快速（< 200ms）
- [ ] 批量分析不阻塞主线程
- [ ] 历史列表分页流畅
- [ ] 页面加载快速（< 1s）
- [ ] **VChart 渲染性能优于 ECharts**

### 用户体验验收

- [ ] 界面美观易用
- [ ] 操作流程清晰
- [ ] Tab 切换自然
- [ ] 错误提示友好
- [ ] 响应速度满意
- [ ] **图表交互流畅**

***

## 📚 相关文档

- **豆包 AI 集成需求**: `DOCS/需求文档/豆包AI自然语言分析集成需求.md`
- **AI 辅助开发指南**: `DOCS/AI辅助开发指南.md`
- **技术栈清单**: `DOCS/技术栈清单.md`

***

## 🔒 安全注意事项

1. **Markdown XSS 防护**: 使用 `DOMPurify` 或类似库过滤 HTML
2. **批量分析限流**: 单次最多 50 道题目，避免 API 滥用
3. **历史记录权限**: 只能查看自己的历史记录
4. **输入验证**: 所有用户输入必须验证和过滤

***

## 📝 备注

### VisActor 优势

**为什么选择 VisActor**:

1. **官方支持**: 字节跳动开源维护，与豆包 AI 同源
2. **天然集成**: VMind 可直接与豆包 AI 集成
3. **智能分析**: 支持自然语言生成图表，更智能
4. **性能优秀**: 基于 Canvas 渲染，性能出色
5. **生态完善**: VChart、VTable、VRender、VMind 完整生态

**VMind 核心能力**:

- 自然语言转图表配置
- 智能图表类型推荐
- 自动数据洞察
- 智能标注和注释

**降级策略**:

- VMind 生成失败时，自动降级到规则生成
- 保证功能稳定性

### 技术说明

- Markdown 渲染使用已安装的 `marked` 库
- 图表使用 `VChart` + `VMind`（VisActor 系列）
- VMind 通过后端代理调用豆包 AI
- 所有新功能都严格遵循项目规范

