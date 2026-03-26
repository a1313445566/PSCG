# 豆包 AI 自然语言分析集成需求

## 📋 文档说明

- **文档类型**: 需求文档
- **适用对象**: AI 开发助手
- **优先级**: P1（中优先级）
- **预计时间**: 8 小时
- **创建日期**: 2026-03-26
- **版本**: v1.0

---

## 🔍 项目现状检查（AI 必须先完成）

### 数据库类型
- [x] **检查数据库依赖**: `package.json` 中使用 `mysql2` ^3.20.0
- [x] **检查数据库实例**: `services/database.js` 使用 MySQL 连接池
- [x] **确认语法规范**: 必须使用 MySQL 语法 (`AUTO_INCREMENT`, `VARCHAR`, `INT`)

### 现有工具和封装
- [x] **API 封装**: `src/utils/api.js` - 必须使用
- [x] **消息封装**: `src/utils/message.js` - 必须使用
- [x] **格式化工具**: `src/utils/format.js` - 按需使用
- [x] **安全工具**: `src/utils/xss-filter.js` - XSS 防护

### 现有 Composables
- [x] **useLoading**: `src/composables/useLoading.js` - 加载状态管理
- [x] **usePagination**: `src/composables/usePagination.js` - 分页管理
- [x] **useUserFilters**: `src/composables/useUserFilters.js` - 筛选管理

### 现有中间件
- [x] **adminAuth**: `middleware/adminAuth.js` - 管理员权限验证
- [x] **rateLimit**: `middleware/rateLimit.js` - 限流防护
- [x] **csrf**: `middleware/csrf.js` - CSRF 防护

### 现有 API
- [x] **分析接口**: `routes/analysis.js` - 数据分析 API
- [x] **用户接口**: `routes/users.js` - 用户管理
- [x] **题目接口**: `routes/questions.js` - 题目管理

### 现有组件
- [x] **数据分析组件**: `src/components/admin/analysis/DataAnalysis.vue`
- [x] **分析图表组件**: `src/components/admin/analysis/AnalysisCharts.vue`
- [x] **错误分析组件**: `src/components/admin/analysis/ErrorAnalysis.vue`

### 项目环境配置
- [x] **环境变量文件**: `.env` - 需添加豆包 AI 配置
- [x] **配置说明文档**: `DOCS/环境配置说明.md`

---

## 🎯 需求概述

### 背景
PSCG 智能题库系统目前具备完善的数据分析功能,但分析结果需要教师人工解读。为提升用户体验,需要集成豆包 AI 自然语言分析能力,帮助教师通过自然语言查询获得智能分析报告和教学建议。

### 目标
1. **自然语言查询**: 教师可用自然语言提问,如"三年级数学错误率最高的知识点是什么?"
2. **智能分析报告**: AI 自动分析数据,生成结构化的分析报告
3. **教学建议**: 基于数据给出针对性的教学改进建议
4. **题目解析生成**: 自动生成题目的详细解析
5. **错误原因分析**: 分析学生易错题目的共性原因

### 应用场景
- 数据分析页面:自然语言查询分析
- 错题分析页面:智能错误原因分析
- 题目管理:自动生成题目解析
- 学生详情:个性化学习建议

---

## 🔧 技术约束（AI 必须遵守）

### 1. 数据库规范

#### 必须使用 MySQL 语法
```sql
-- ✅ 正确：MySQL 语法
CREATE TABLE IF NOT EXISTS ai_analysis_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  query_hash VARCHAR(64) NOT NULL COMMENT '查询哈希',
  query_text TEXT NOT NULL COMMENT '查询原文',
  result_text TEXT NOT NULL COMMENT 'AI分析结果',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  expires_at DATETIME DEFAULT (DATE_ADD(NOW(), INTERVAL 1 HOUR)) COMMENT '过期时间',
  INDEX idx_hash (query_hash),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI分析结果缓存';

-- ❌ 禁止：SQLite 语法
-- CREATE TABLE ai_analysis_cache (
--   id INTEGER PRIMARY KEY AUTOINCREMENT
-- );
```

#### 使用项目的 Database 实例
```javascript
const db = require('./services/database');

// 查询单条
const row = await db.get('SELECT * FROM ai_analysis_cache WHERE query_hash = ?', [hash]);

// 查询多条
const rows = await db.query('SELECT * FROM ai_analysis_cache LIMIT ?', [limit]);

// 执行更新/插入
await db.run('INSERT INTO ai_analysis_cache SET ?', data);
```

---

### 2. API 调用规范

#### 必须使用现有 API 封装
```javascript
// ❌ 禁止使用原生 fetch
const response = await fetch('/api/ai/analyze', {...})

// ✅ 必须使用项目的 api 封装
import { api } from '@/utils/api'

// POST 请求
const result = await api.post('/api/ai/analyze', {
  question: '三年级数学错误率最高的知识点是什么?',
  filters: { grade: '三年级', subjectId: 1 }
})

// 带配置的请求
const result = await api.post('/api/ai/analyze', data, {
  retries: 3,        // 重试次数
  timeout: 60000     // 超时时间 60 秒
})
```

**文件位置**: `src/utils/api.js`  
**功能**: 自动重试、防抖、超时、CSRF、统一错误处理

---

### 3. 消息提示规范

#### 必须使用现有消息封装
```javascript
// ❌ 禁止直接使用 Element Plus
ElMessage.success('分析完成')

// ✅ 必须使用项目的消息封装
import message from '@/utils/message'

// 成功提示
message.success('AI 分析完成')

// 错误提示
message.error('AI 分析失败,请稍后重试')

// 加载提示
message.info('正在分析中,请稍候...')

// 确认对话框
const confirmed = await message.confirm(
  'AI 分析可能需要较长时间,是否继续?',
  '分析确认'
)
```

**文件位置**: `src/utils/message.js`

---

### 4. HOOK 使用规范

#### useLoading 正确使用
```javascript
import { useLoading } from '@/composables/useLoading'
import { onUnmounted } from 'vue'

const { withLoading, cleanup } = useLoading()

// ✅ 方式2：自动包装（推荐）
await withLoading(async () => {
  await analyzeData()
}, 'AI 分析中...')

// 组件卸载时清理
onUnmounted(cleanup)
```

**文件位置**: `src/composables/useLoading.js`

---

### 5. 错误处理规范

#### 前端错误处理
```javascript
try {
  const result = await api.post('/api/ai/analyze', {
    question: question.value
  })
  
  analysisResult.value = result.analysis
  message.success('AI 分析完成')
} catch (error) {
  // api 已自动显示错误,无需额外处理
  console.error('[AI分析] 失败:', error)
  
  // 可选:显示更详细的错误信息
  // message.error(`分析失败: ${error.message}`)
}
```

#### 后端错误处理
```javascript
router.post('/analyze', adminAuth, async (req, res) => {
  try {
    const { question, filters } = req.body
    
    // 输入验证
    if (!question || question.trim() === '') {
      return res.status(400).json({ error: '请输入分析问题' })
    }
    
    // 业务逻辑
    const analysis = await aiService.analyzeData(data, question)
    
    res.json({ 
      success: true, 
      analysis,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[AI分析] 分析失败:', error)
    res.status(500).json({ 
      error: 'AI 分析失败,请稍后重试',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})
```

---

### 6. 安全规范

#### 必须实施的安全措施
```javascript
// 1. 权限验证（后端）
router.post('/analyze', adminAuth, async (req, res) => {
  // adminAuth 中间件已验证 JWT Token
  // req.admin 包含当前管理员信息
  const operator = req.admin.username
})

// 2. 输入验证（后端）
if (!question || question.trim() === '') {
  return res.status(400).json({ error: '请输入分析问题' })
}

// 限制输入长度
if (question.length > 500) {
  return res.status(400).json({ error: '问题长度不能超过500字' })
}

// 3. XSS 防护（前端）
import { escapeHtml } from '@/utils/xss-filter'
const safeQuestion = escapeHtml(question.value.trim())

// 4. CSRF 防护（自动）
// api 封装已自动添加 CSRF Token

// 5. 限流防护（已集成）
// middleware/rateLimit.js 已配置
```

---

### 7. 图标导入规范

#### 必须导入 Element Plus 图标
```vue
<script setup>
// ✅ 正确的图标导入
import { ChatDotRound, QuestionFilled, Loading } from '@element-plus/icons-vue'
</script>

<template>
  <el-icon><ChatDotRound /></el-icon>
  <el-icon><QuestionFilled /></el-icon>
</template>
```

---

### 8. 环境变量配置规范

#### 必须在 .env 文件中配置
```bash
# 豆包 AI 配置
DOUBAO_API_KEY=your-doubao-api-key-here
DOUBAO_API_URL=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_MODEL=ep-xxxx-xxxx  # 你的模型 endpoint ID
```

#### 后端访问方式
```javascript
const apiKey = process.env.DOUBAO_API_KEY
const apiUrl = process.env.DOUBAO_API_URL || 'https://ark.cn-beijing.volces.com/api/v3'
const model = process.env.DOUBAO_MODEL
```

---

### 9. CSS 管理规范

#### 必须使用 scoped 样式
```vue
<style scoped>
/* ✅ 正确：使用 scoped 样式 */
.ai-analysis-container {
  padding: 20px;
}

.ai-result-card {
  margin-top: 20px;
  border-radius: 8px;
}

/* ❌ 禁止：全局样式污染 */
/* .global-class { ... } */
</style>
```

#### 必须使用项目公共样式
```vue
<style scoped>
/* ✅ 复用项目公共样式类 */
.page-header {
  /* 使用 global.css 中定义的样式 */
}
</style>
```

**公共样式文件**: `src/styles/global.css`

---

## 📦 需求详情

### 需求 1: 豆包 AI 服务封装

#### 功能描述
创建豆包 AI 服务封装,提供统一的 AI 调用接口,支持错误处理、超时控制、结果缓存等功能。

#### 技术实现

##### 步骤 1: 环境配置

**文件位置**: `.env`

```bash
# 豆包 AI 配置
DOUBAO_API_KEY=your-doubao-api-key-here
DOUBAO_API_URL=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_MODEL=ep-xxxx-xxxx
```

**说明**:
- 在 `.env` 文件末尾添加豆包 AI 配置
- 不要将 API Key 提交到 Git

---

##### 步骤 2: 创建 AI 服务

**文件位置**: `services/aiService.js`（新建）

```javascript
/**
 * 豆包 AI 服务
 * 提供自然语言分析、智能推荐等功能
 */

const fetch = require('node-fetch');

class AIService {
  constructor() {
    this.apiKey = process.env.DOUBAO_API_KEY;
    this.apiUrl = process.env.DOUBAO_API_URL || 'https://ark.cn-beijing.volces.com/api/v3';
    this.model = process.env.DOUBAO_MODEL;
    this.timeout = 60000; // 默认超时 60 秒
  }

  /**
   * 调用豆包 AI API
   * @param {string} prompt - 提示词
   * @param {object} context - 上下文数据
   * @returns {Promise<string>} AI 响应
   */
  async callDoubaoAI(prompt, context = {}) {
    if (!this.apiKey) {
      throw new Error('豆包 API Key 未配置,请检查环境变量 DOUBAO_API_KEY');
    }

    // 构建系统提示词
    const systemPrompt = `你是一个智能题库分析助手,帮助教师分析学生答题数据、生成教学建议。
当前上下文数据:
${JSON.stringify(context, null, 2)}

请基于以上数据进行分析,用简洁专业的语言回答。`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`豆包 API 调用失败: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('AI 分析超时,请稍后重试');
      }
      console.error('[AI服务] 调用失败:', error);
      throw error;
    }
  }

  /**
   * 分析答题数据
   * @param {object} analysisData - 分析数据
   * @param {string} question - 用户问题
   * @returns {Promise<string>} 分析结果
   */
  async analyzeData(analysisData, question) {
    const prompt = `用户问题: ${question}

请基于提供的答题数据进行分析,重点关注:
1. 整体正确率趋势
2. 薄弱知识点识别
3. 学生学习建议
4. 教学改进方向`;

    return await this.callDoubaoAI(prompt, analysisData);
  }

  /**
   * 生成错题分析报告
   * @param {array} errorProneQuestions - 易错题目
   * @returns {Promise<string>} 分析报告
   */
  async generateErrorAnalysis(errorProneQuestions) {
    const prompt = `请分析以下易错题目,找出共性问题和教学建议:

题目列表:
${errorProneQuestions.map((q, i) => `
${i + 1}. ${q.content}
   - 学科: ${q.subject_name}
   - 错误率: ${((q.total_attempts - q.correct_count) / q.total_attempts * 100).toFixed(1)}%
   - 错误次数: ${q.total_attempts - q.correct_count}/${q.total_attempts}
`).join('\n')}

请从以下维度分析:
1. 知识点分布规律
2. 错误类型归类
3. 难度系数评估
4. 教学改进建议`;

    return await this.callDoubaoAI(prompt, { errorProneQuestions });
  }

  /**
   * 生成题目解析
   * @param {object} question - 题目对象
   * @returns {Promise<string>} 题目解析
   */
  async generateQuestionExplanation(question) {
    const prompt = `请为以下题目生成详细的解析:

题目: ${question.content}
选项: ${JSON.stringify(question.options)}
正确答案: ${question.correctAnswer}
题目类型: ${question.type}

要求:
1. 解释正确答案的原因
2. 分析错误选项的陷阱
3. 提供解题思路和技巧
4. 用简洁易懂的语言表达`;

    return await this.callDoubaoAI(prompt, { question });
  }
}

// 导出单例
module.exports = new AIService();
```

---

### 需求 2: AI 分析缓存机制

#### 功能描述
创建 AI 分析结果缓存机制,避免重复调用 AI API,节省成本和响应时间。

#### 技术实现

##### 步骤 1: 创建缓存表

**文件位置**: `server.cjs`（在启动时执行）

```javascript
/**
 * 创建 AI 分析缓存表
 */
const createAICacheTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ai_analysis_cache (
      id INT AUTO_INCREMENT PRIMARY KEY,
      query_hash VARCHAR(64) NOT NULL COMMENT '查询哈希',
      query_text TEXT NOT NULL COMMENT '查询原文',
      result_text TEXT NOT NULL COMMENT 'AI分析结果',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      expires_at DATETIME DEFAULT (DATE_ADD(NOW(), INTERVAL 1 HOUR)) COMMENT '过期时间',
      INDEX idx_hash (query_hash),
      INDEX idx_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI分析结果缓存'
  `;
  
  try {
    await db.run(createTableSQL);
    console.log('✅ AI分析缓存表已准备就绪');
  } catch (error) {
    console.error('❌ 创建AI分析缓存表失败:', error);
  }
};

// 在 startServer 函数中调用
async function startServer() {
  try {
    await db.connect();
    
    // 创建 AI 分析缓存表
    await createAICacheTable();
    
    // ... 其他初始化代码
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}
```

---

##### 步骤 2: 扩展 AI 服务 - 添加缓存功能

**文件位置**: `services/aiService.js`（修改现有文件）

```javascript
const crypto = require('crypto');
const db = require('./database');

class AIService {
  constructor() {
    // ... 现有代码
    this.cacheEnabled = true; // 启用缓存
    this.cacheExpiry = 3600; // 缓存过期时间（秒）
  }

  /**
   * 生成查询哈希
   * @param {string} prompt - 提示词
   * @param {object} context - 上下文
   * @returns {string} 哈希值
   */
  generateQueryHash(prompt, context) {
    const content = prompt + JSON.stringify(context);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * 从缓存获取结果
   * @param {string} hash - 查询哈希
   * @returns {Promise<string|null>} 缓存结果
   */
  async getFromCache(hash) {
    if (!this.cacheEnabled) return null;

    try {
      const row = await db.get(
        'SELECT result_text FROM ai_analysis_cache WHERE query_hash = ? AND expires_at > NOW()',
        [hash]
      );
      
      return row ? row.result_text : null;
    } catch (error) {
      console.error('[AI缓存] 读取失败:', error);
      return null;
    }
  }

  /**
   * 保存到缓存
   * @param {string} hash - 查询哈希
   * @param {string} query - 查询原文
   * @param {string} result - AI结果
   */
  async saveToCache(hash, query, result) {
    if (!this.cacheEnabled) return;

    try {
      await db.run(
        `INSERT INTO ai_analysis_cache (query_hash, query_text, result_text, expires_at)
         VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND))`,
        [hash, query, result, this.cacheExpiry]
      );
    } catch (error) {
      console.error('[AI缓存] 保存失败:', error);
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanExpiredCache() {
    try {
      const result = await db.run(
        'DELETE FROM ai_analysis_cache WHERE expires_at < NOW()'
      );
      console.log(`[AI缓存] 已清理 ${result.affectedRows} 条过期记录`);
    } catch (error) {
      console.error('[AI缓存] 清理失败:', error);
    }
  }

  /**
   * 调用豆包 AI API（带缓存）
   * @param {string} prompt - 提示词
   * @param {object} context - 上下文数据
   * @returns {Promise<string>} AI 响应
   */
  async callDoubaoAI(prompt, context = {}) {
    // 生成查询哈希
    const hash = this.generateQueryHash(prompt, context);

    // 尝试从缓存获取
    const cachedResult = await this.getFromCache(hash);
    if (cachedResult) {
      console.log('[AI服务] 使用缓存结果');
      return cachedResult;
    }

    // 调用 AI API
    const result = await this._callDoubaoAI(prompt, context);

    // 保存到缓存
    await this.saveToCache(hash, prompt, result);

    return result;
  }

  /**
   * 实际调用豆包 AI API
   * @private
   */
  async _callDoubaoAI(prompt, context) {
    // ... 原有的 callDoubaoAI 实现
    // 将原来的 callDoubaoAI 改名为 _callDoubaoAI
  }
}

module.exports = new AIService();
```

---

### 需求 3: AI 分析 API 接口

#### 功能描述
创建 AI 分析 API 接口,支持自然语言查询、错误分析、题目解析等功能。

#### 技术实现

##### 步骤 1: 创建 AI 路由

**文件位置**: `routes/ai.js`（新建）

```javascript
/**
 * AI 分析 API 路由
 * 提供自然语言分析、智能推荐等接口
 */

const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const db = require('../services/database');
const adminAuth = require('../middleware/adminAuth');

/**
 * POST /api/ai/analyze
 * 自然语言数据分析
 */
router.post('/analyze', adminAuth, async (req, res) => {
  try {
    const { question, filters } = req.body;
    
    // 输入验证
    if (!question || question.trim() === '') {
      return res.status(400).json({ error: '请输入分析问题' });
    }
    
    // 限制问题长度
    if (question.length > 500) {
      return res.status(400).json({ error: '问题长度不能超过500字' });
    }

    // 获取分析数据（复用现有分析逻辑）
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (filters?.grade) {
      whereClause += ' AND u.grade = ?';
      params.push(filters.grade);
    }
    if (filters?.class) {
      whereClause += ' AND u.class = ?';
      params.push(filters.class);
    }
    if (filters?.subjectId) {
      whereClause += ' AND ar.subject_id = ?';
      params.push(filters.subjectId);
    }

    // 查询基础数据
    const basicStats = await db.get(`
      SELECT 
        COUNT(DISTINCT u.id) as totalUsers,
        COUNT(DISTINCT ar.id) as totalSessions,
        SUM(ar.total_questions) as totalQuestions,
        SUM(ar.correct_count) as totalCorrect,
        CASE WHEN SUM(ar.total_questions) > 0 
          THEN (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) 
          ELSE 0 END as overallAccuracy
      FROM answer_records ar
      INNER JOIN users u ON ar.user_id = u.id
      ${whereClause}
    `, params);

    // 查询学科分析
    const subjectAnalysis = await db.all(`
      SELECT 
        s.name as subject,
        COUNT(DISTINCT ar.id) as sessions,
        SUM(ar.total_questions) as questions,
        SUM(ar.correct_count) as correct,
        CASE WHEN SUM(ar.total_questions) > 0 
          THEN (SUM(ar.correct_count) * 100.0) / SUM(ar.total_questions) 
          ELSE 0 END as accuracy
      FROM answer_records ar
      INNER JOIN users u ON ar.user_id = u.id
      INNER JOIN subjects s ON ar.subject_id = s.id
      ${whereClause}
      GROUP BY ar.subject_id, s.name
      ORDER BY accuracy ASC
    `, params);

    // 构建上下文数据
    const analysisData = {
      basicStats,
      subjectAnalysis,
      filters,
      timestamp: new Date().toISOString()
    };

    // 调用 AI 分析
    const analysis = await aiService.analyzeData(analysisData, question);

    res.json({ 
      success: true, 
      analysis,
      question,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI分析] 分析失败:', error);
    res.status(500).json({ 
      error: 'AI 分析失败,请稍后重试',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/ai/error-analysis
 * 错题智能分析
 */
router.post('/error-analysis', adminAuth, async (req, res) => {
  try {
    const { questionIds } = req.body;
    
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: '请提供题目ID列表' });
    }

    // 限制题目数量
    if (questionIds.length > 20) {
      return res.status(400).json({ error: '单次最多分析20道题目' });
    }

    // 查询题目数据
    const questions = await db.all(`
      SELECT 
        q.content,
        s.name as subject_name,
        COUNT(qa.id) as total_attempts,
        SUM(qa.is_correct) as correct_count,
        q.options,
        q.correct_answer
      FROM questions q
      LEFT JOIN question_attempts qa ON q.id = qa.question_id
      LEFT JOIN subjects s ON q.subject_id = s.id
      WHERE q.id IN (${questionIds.map(() => '?').join(',')})
      GROUP BY q.id
      HAVING total_attempts >= 3
    `, questionIds);

    if (questions.length === 0) {
      return res.status(404).json({ error: '未找到符合条件的题目数据' });
    }

    // 调用 AI 分析
    const analysis = await aiService.generateErrorAnalysis(questions);

    res.json({ 
      success: true, 
      analysis,
      questionCount: questions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI错题分析] 分析失败:', error);
    res.status(500).json({ error: '错题分析失败,请稍后重试' });
  }
});

/**
 * POST /api/ai/explanation
 * 生成题目解析
 */
router.post('/explanation', adminAuth, async (req, res) => {
  try {
    const { questionId } = req.body;
    
    if (!questionId) {
      return res.status(400).json({ error: '请提供题目ID' });
    }

    // 查询题目数据
    const question = await db.get(`
      SELECT 
        q.content,
        q.type,
        q.options,
        q.correct_answer as correctAnswer,
        s.name as subject_name
      FROM questions q
      LEFT JOIN subjects s ON q.subject_id = s.id
      WHERE q.id = ?
    `, [questionId]);

    if (!question) {
      return res.status(404).json({ error: '题目不存在' });
    }

    // 解析选项和答案
    try {
      question.options = JSON.parse(question.options);
    } catch (e) {
      question.options = [];
    }

    // 调用 AI 生成解析
    const explanation = await aiService.generateQuestionExplanation(question);

    res.json({ 
      success: true, 
      explanation,
      questionId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI解析生成] 生成失败:', error);
    res.status(500).json({ error: '解析生成失败,请稍后重试' });
  }
});

/**
 * DELETE /api/ai/cache
 * 清理 AI 缓存（管理员）
 */
router.delete('/cache', adminAuth, async (req, res) => {
  try {
    await aiService.cleanExpiredCache();
    
    res.json({ 
      success: true, 
      message: 'AI缓存清理完成',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI缓存] 清理失败:', error);
    res.status(500).json({ error: '缓存清理失败' });
  }
});

module.exports = router;
```

---

##### 步骤 2: 注册路由

**文件位置**: `server.cjs`（修改现有文件）

```javascript
// 导入 AI 路由（在其他路由导入后面添加）
const aiRoutes = require('./routes/ai');

// ... 现有代码

// 注册 AI 路由（在其他路由注册后面添加）
app.use('/api/ai', aiRoutes);

// ... 其他代码
```

---

### 需求 4: AI 配置管理界面

#### 功能描述
在后台基础设置页面添加 AI 配置管理界面,让管理员可以在后台配置豆包 AI 的 API Key、模型等参数,无需手动修改 .env 文件。

#### 技术实现

##### 步骤 1: 创建 AI 配置组件

**文件位置**: `src/components/admin/basic-settings/AIConfigSetting.vue`（新建）

```vue
<template>
  <el-card class="ai-config-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>
          <el-icon><Setting /></el-icon>
          AI 智能分析配置
        </span>
        <el-tag type="info" size="small">豆包 AI</el-tag>
      </div>
    </template>

    <el-form 
      ref="formRef" 
      :model="formData" 
      :rules="rules" 
      label-width="140px"
      v-loading="loading"
    >
      <!-- API Key -->
      <el-form-item label="API Key" prop="apiKey">
        <el-input 
          v-model="formData.apiKey" 
          type="password"
          placeholder="请输入豆包 API Key"
          show-password
          clearable
        >
          <template #prefix>
            <el-icon><Key /></el-icon>
          </template>
        </el-input>
        <div class="form-tip">
          <el-icon><InfoFilled /></el-icon>
          从豆包控制台获取 API Key
        </div>
      </el-form-item>

      <!-- API URL -->
      <el-form-item label="API 地址" prop="apiUrl">
        <el-input 
          v-model="formData.apiUrl" 
          placeholder="API 接口地址"
          clearable
        >
          <template #prefix>
            <el-icon><Link /></el-icon>
          </template>
        </el-input>
        <div class="form-tip">
          <el-icon><InfoFilled /></el-icon>
          默认: https://ark.cn-beijing.volces.com/api/v3
        </div>
      </el-form-item>

      <!-- Model -->
      <el-form-item label="模型 ID" prop="model">
        <el-input 
          v-model="formData.model" 
          placeholder="请输入模型 Endpoint ID"
          clearable
        >
          <template #prefix>
            <el-icon><Cpu /></el-icon>
          </template>
        </el-input>
        <div class="form-tip">
          <el-icon><InfoFilled /></el-icon>
          从豆包控制台创建推理接入点获取
        </div>
      </el-form-item>

      <!-- 功能开关 -->
      <el-form-item label="启用 AI 分析">
        <el-switch 
          v-model="formData.enabled"
          active-text="启用"
          inactive-text="禁用"
        />
      </el-form-item>

      <!-- 缓存设置 -->
      <el-form-item label="启用缓存">
        <el-switch 
          v-model="formData.cacheEnabled"
          active-text="启用"
          inactive-text="禁用"
        />
        <div class="form-tip">
          <el-icon><InfoFilled /></el-icon>
          启用缓存可减少 API 调用次数,节省成本
        </div>
      </el-form-item>

      <!-- 超时设置 -->
      <el-form-item label="超时时间">
        <el-input-number 
          v-model="formData.timeout"
          :min="10"
          :max="120"
          :step="10"
        />
        <span class="unit-label">秒</span>
      </el-form-item>

      <!-- 操作按钮 -->
      <el-form-item>
        <el-button type="primary" @click="handleSave" :loading="saving">
          <el-icon><Check /></el-icon>
          保存配置
        </el-button>
        <el-button @click="handleReset">
          <el-icon><RefreshRight /></el-icon>
          重置
        </el-button>
        <el-button type="success" @click="handleTest" :loading="testing" :disabled="!canTest">
          <el-icon><Connection /></el-icon>
          测试连接
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 测试结果 -->
    <el-alert
      v-if="testResult"
      :title="testResult.success ? '连接成功' : '连接失败'"
      :type="testResult.success ? 'success' : 'error'"
      :description="testResult.message"
      show-icon
      closable
      @close="testResult = null"
      class="test-result"
    />
  </el-card>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/utils/api'
import message from '@/utils/message'
import { 
  Setting, Key, Link, Cpu, InfoFilled, 
  Check, RefreshRight, Connection 
} from '@element-plus/icons-vue'

// 响应式数据
const formRef = ref(null)
const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const testResult = ref(null)

const formData = reactive({
  apiKey: '',
  apiUrl: 'https://ark.cn-beijing.volces.com/api/v3',
  model: '',
  enabled: true,
  cacheEnabled: true,
  timeout: 60
})

// 表单验证规则
const rules = {
  apiKey: [
    { required: true, message: '请输入 API Key', trigger: 'blur' }
  ],
  apiUrl: [
    { required: true, message: '请输入 API 地址', trigger: 'blur' }
  ],
  model: [
    { required: true, message: '请输入模型 ID', trigger: 'blur' }
  ]
}

// 是否可以测试
const canTest = computed(() => {
  return formData.apiKey && formData.apiUrl && formData.model
})

// 加载配置
const loadConfig = async () => {
  loading.value = true
  try {
    const result = await api.get('/api/settings')
    
    if (result.aiApiKey) formData.apiKey = result.aiApiKey
    if (result.aiApiUrl) formData.apiUrl = result.aiApiUrl
    if (result.aiModel) formData.model = result.aiModel
    if (result.aiEnabled !== undefined) formData.enabled = result.aiEnabled === 'true'
    if (result.aiCacheEnabled !== undefined) formData.cacheEnabled = result.aiCacheEnabled === 'true'
    if (result.aiTimeout) formData.timeout = parseInt(result.aiTimeout)
  } catch (error) {
    console.error('[AI配置] 加载失败:', error)
  } finally {
    loading.value = false
  }
}

// 保存配置
const handleSave = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    saving.value = true
    
    await api.post('/api/settings', {
      aiApiKey: formData.apiKey,
      aiApiUrl: formData.apiUrl,
      aiModel: formData.model,
      aiEnabled: formData.enabled.toString(),
      aiCacheEnabled: formData.cacheEnabled.toString(),
      aiTimeout: formData.timeout.toString()
    })
    
    message.actionSuccess('保存')
  } catch (error) {
    console.error('[AI配置] 保存失败:', error)
    // api 已自动显示错误
  } finally {
    saving.value = false
  }
}

// 重置
const handleReset = () => {
  loadConfig()
  testResult.value = null
}

// 测试连接
const handleTest = async () => {
  testing.value = true
  testResult.value = null
  
  try {
    const result = await api.post('/api/ai/test-connection', {
      apiKey: formData.apiKey,
      apiUrl: formData.apiUrl,
      model: formData.model
    }, {
      timeout: 30000,
      showError: false
    })
    
    testResult.value = {
      success: true,
      message: `AI 服务连接正常，模型: ${result.model || formData.model}`
    }
  } catch (error) {
    testResult.value = {
      success: false,
      message: error.response?.data?.error || error.message || '连接失败'
    }
  } finally {
    testing.value = false
  }
}

// 生命周期
onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.ai-config-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
}

.form-tip {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.unit-label {
  margin-left: 10px;
  color: #606266;
}

.test-result {
  margin-top: 20px;
}
</style>
```

---

##### 步骤 2: 集成到基础设置页面

**文件位置**: `src/views/AdminView.vue`（修改现有文件）

```vue
<!-- 基础设置 -->
<div v-else-if="activeMenu === 'basic-settings'" class="basic-settings">
  <InterfaceNameSetting 
    :interface-name="interfaceName"
    @update-interface-name="updateInterfaceName"
  />
  
  <AnswerSetting 
    :randomize-answers="randomizeAnswers"
    :randomize-error-collection-answers="randomizeErrorCollectionAnswers"
    :fixed-question-count="fixedQuestionCount"
    :min-question-count="minQuestionCount"
    :max-question-count="maxQuestionCount"
    :fixed-question-count-value="fixedQuestionCountValue"
    :subjects="subjects"
    :subject-question-counts="subjectQuestionCounts"
    @update-settings="updateAnswerSettings"
  />
  
  <!-- 新增 AI 配置 -->
  <AIConfigSetting />
</div>

<script setup>
// ... 现有导入
import AIConfigSetting from '@/components/admin/basic-settings/AIConfigSetting.vue' // 新增

// ... 其他代码
</script>
```

---

##### 步骤 3: 添加测试连接 API

**文件位置**: `routes/ai.js`（在现有文件中添加）

```javascript
/**
 * POST /api/ai/test-connection
 * 测试 AI 连接
 */
router.post('/test-connection', adminAuth, async (req, res) => {
  try {
    const { apiKey, apiUrl, model } = req.body;
    
    if (!apiKey || !apiUrl || !model) {
      return res.status(400).json({ error: '请提供完整的配置信息' });
    }

    // 测试调用
    const fetch = require('node-fetch');
    
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'user', content: '测试连接' }
        ],
        max_tokens: 10
      }),
      timeout: 10000
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 调用失败: ${response.status}`);
    }

    const data = await response.json();

    res.json({ 
      success: true, 
      message: '连接成功',
      model: data.model
    });
  } catch (error) {
    console.error('[AI测试] 测试失败:', error);
    res.status(400).json({ 
      error: error.message || '连接测试失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
```

---

##### 步骤 4: 修改 AI 服务读取配置

**文件位置**: `services/aiService.js`（修改现有文件）

```javascript
const db = require('./database');

class AIService {
  constructor() {
    this.config = {
      apiKey: null,
      apiUrl: 'https://ark.cn-beijing.volces.com/api/v3',
      model: null,
      enabled: true,
      cacheEnabled: true,
      timeout: 60000
    };
    
    // 加载配置
    this.loadConfig();
  }

  /**
   * 从数据库加载配置
   */
  async loadConfig() {
    try {
      const settings = await db.all('SELECT setting_key, value FROM settings WHERE setting_key LIKE "ai%"');
      
      settings.forEach(setting => {
        switch (setting.setting_key) {
          case 'aiApiKey':
            this.config.apiKey = setting.value;
            break;
          case 'aiApiUrl':
            this.config.apiUrl = setting.value;
            break;
          case 'aiModel':
            this.config.model = setting.value;
            break;
          case 'aiEnabled':
            this.config.enabled = setting.value === 'true';
            break;
          case 'aiCacheEnabled':
            this.config.cacheEnabled = setting.value === 'true';
            break;
          case 'aiTimeout':
            this.config.timeout = parseInt(setting.value) * 1000;
            break;
        }
      });
      
      console.log('[AI服务] 配置已加载');
    } catch (error) {
      console.error('[AI服务] 加载配置失败:', error);
      // 使用环境变量作为备用
      this.config.apiKey = process.env.DOUBAO_API_KEY;
      this.config.apiUrl = process.env.DOUBAO_API_URL || this.config.apiUrl;
      this.config.model = process.env.DOUBAO_MODEL;
    }
  }

  /**
   * 调用豆包 AI API
   */
  async callDoubaoAI(prompt, context = {}) {
    // 检查是否启用
    if (!this.config.enabled) {
      throw new Error('AI 服务未启用,请在系统设置中启用');
    }
    
    if (!this.config.apiKey) {
      throw new Error('AI 服务未配置,请在系统设置中配置 API Key');
    }

    // 优先使用数据库配置,环境变量作为备用
    const apiKey = this.config.apiKey || process.env.DOUBAO_API_KEY;
    const apiUrl = this.config.apiUrl || process.env.DOUBAO_API_URL || 'https://ark.cn-beijing.volces.com/api/v3';
    const model = this.config.model || process.env.DOUBAO_MODEL;
    const timeout = this.config.timeout || 60000;

    // ... 其余代码保持不变
  }
}

module.exports = new AIService();
```

---

### 需求 5: 前端 AI 分析组件

#### 功能描述
创建前端 AI 分析组件,提供自然语言输入框、分析结果展示、加载状态等功能。

#### 技术实现

##### 步骤 1: 创建 AI 分析组件

**文件位置**: `src/components/admin/ai/AIAnalysisPanel.vue`（新建）

```vue
<template>
  <div class="ai-analysis-panel">
    <!-- 标题 -->
    <div class="panel-header">
      <h3>
        <el-icon><ChatDotRound /></el-icon>
        AI 智能分析
      </h3>
      <el-tag type="info" size="small">Powered by 豆包</el-tag>
    </div>

    <!-- 输入区域 -->
    <div class="input-section">
      <el-input
        v-model="questionInput"
        type="textarea"
        :rows="3"
        placeholder="请输入自然语言问题，例如：三年级数学错误率最高的知识点是什么？"
        :maxlength="500"
        show-word-limit
        @keydown.ctrl.enter="handleAnalyze"
      />
      
      <div class="input-actions">
        <el-button 
          type="primary" 
          :loading="analyzing"
          :disabled="!questionInput.trim()"
          @click="handleAnalyze"
        >
          <el-icon v-if="!analyzing"><QuestionFilled /></el-icon>
          {{ analyzing ? '分析中...' : '开始分析' }}
        </el-button>
        
        <el-button @click="handleClear">
          <el-icon><Close /></el-icon>
          清空
        </el-button>
      </div>
    </div>

    <!-- 示例问题 -->
    <div class="example-section" v-if="!analysisResult">
      <div class="example-title">💡 试试这些问题：</div>
      <div class="example-list">
        <el-tag 
          v-for="example in exampleQuestions" 
          :key="example"
          class="example-tag"
          @click="questionInput = example"
        >
          {{ example }}
        </el-tag>
      </div>
    </div>

    <!-- 分析结果 -->
    <div class="result-section" v-if="analysisResult">
      <div class="result-header">
        <h4>
          <el-icon><DocumentChecked /></el-icon>
          分析结果
        </h4>
        <div class="result-actions">
          <el-button size="small" @click="handleCopy">
            <el-icon><CopyDocument /></el-icon>
            复制
          </el-button>
          <el-button size="small" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </div>
      </div>
      
      <el-card class="result-card" shadow="hover">
        <div class="result-content" v-html="formattedResult"></div>
        
        <div class="result-meta">
          <el-tag size="small" type="info">
            {{ analysisTime }}
          </el-tag>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { api } from '@/utils/api'
import message from '@/utils/message'
import { useLoading } from '@/composables/useLoading'
import { 
  ChatDotRound, 
  QuestionFilled, 
  DocumentChecked, 
  CopyDocument, 
  Download,
  Close
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  filters: {
    type: Object,
    default: () => ({})
  }
})

// Hook
const { withLoading, cleanup } = useLoading()

// 响应式数据
const questionInput = ref('')
const analysisResult = ref('')
const analyzing = ref(false)
const analysisTime = ref('')

// 示例问题
const exampleQuestions = ref([
  '三年级数学错误率最高的知识点是什么？',
  '最近一周学生答题正确率趋势如何？',
  '哪些班级需要重点关注？',
  '语文学科的主要薄弱点在哪里？'
])

// 格式化结果（支持换行和列表）
const formattedResult = computed(() => {
  if (!analysisResult.value) return ''
  
  return analysisResult.value
    .replace(/\n/g, '<br>')
    .replace(/(\d+)\./g, '<strong>$1.</strong>')
    .replace(/【(.+?)】/g, '<strong>【$1】</strong>')
})

// 分析处理
const handleAnalyze = async () => {
  if (!questionInput.value.trim()) {
    message.warning('请输入分析问题')
    return
  }

  try {
    analyzing.value = true
    
    const result = await api.post('/api/ai/analyze', {
      question: questionInput.value,
      filters: props.filters
    }, {
      timeout: 90000 // AI分析超时90秒
    })

    analysisResult.value = result.analysis
    analysisTime.value = new Date().toLocaleString('zh-CN')
    
    message.success('AI 分析完成')
  } catch (error) {
    console.error('[AI分析] 失败:', error)
    // api 已自动显示错误
  } finally {
    analyzing.value = false
  }
}

// 清空
const handleClear = () => {
  questionInput.value = ''
  analysisResult.value = ''
  analysisTime.value = ''
}

// 复制结果
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(analysisResult.value)
    message.success('已复制到剪贴板')
  } catch (error) {
    message.error('复制失败')
  }
}

// 导出结果
const handleExport = () => {
  const content = `PSCG AI 分析报告\n\n问题: ${questionInput.value}\n\n分析结果:\n${analysisResult.value}\n\n生成时间: ${analysisTime.value}`
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `AI分析报告_${new Date().toISOString().slice(0, 10)}.txt`
  link.click()
  URL.revokeObjectURL(url)
  
  message.success('报告导出成功')
}

// 生命周期
onUnmounted(cleanup)
</script>

<style scoped>
.ai-analysis-panel {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e6e6e6;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-section {
  margin-bottom: 20px;
}

.input-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  justify-content: flex-end;
}

.example-section {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.example-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #606266;
}

.example-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.example-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.example-tag:hover {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.result-section {
  margin-top: 20px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.result-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-actions {
  display: flex;
  gap: 10px;
}

.result-card {
  border: 1px solid #e6e6e6;
}

.result-content {
  line-height: 1.8;
  color: #303133;
  font-size: 14px;
}

.result-meta {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e6e6e6;
  text-align: right;
}
</style>
```

---

##### 步骤 2: 集成到数据分析页面

**文件位置**: `src/components/admin/analysis/DataAnalysis.vue`（修改现有文件）

```vue
<template>
  <div class="data-analysis">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>数据分析</h2>
      <div class="header-actions">
        <el-button type="primary" @click="loadData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button type="success" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出报告
        </el-button>
      </div>
    </div>

    <!-- 筛选组件 -->
    <AdminFilter
      :filter-items="filterItems"
      v-model="filters"
      :show-tags="true"
      @search="applyFilters"
      @reset="resetFilters"
    />

    <!-- AI 分析面板（新增） -->
    <AIAnalysisPanel :filters="filters" class="ai-section" />

    <!-- 数据概览 -->
    <AnalysisOverview :analysis-data="analysisData" />

    <!-- 图表分析 -->
    <AnalysisCharts :analysis-data="analysisData" />

    <!-- 错题分析 -->
    <ErrorAnalysis :analysis-data="analysisData" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { Refresh, Download } from '@element-plus/icons-vue'
import AdminFilter from '../common/AdminFilter.vue'
import AIAnalysisPanel from '../ai/AIAnalysisPanel.vue' // 新增
import AnalysisOverview from './AnalysisOverview.vue'
import AnalysisCharts from './AnalysisCharts.vue'
import ErrorAnalysis from './ErrorAnalysis.vue'
import api from '../../../utils/api'
import message from '../../../utils/message'
import { useLoading } from '../../../composables/useLoading'

// ... 现有代码保持不变
</script>

<style scoped>
.data-analysis {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 10px;
}

/* 新增样式 */
.ai-section {
  margin-bottom: 30px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    margin-top: 10px;
  }
}
</style>
```

---

## ✅ 验收标准

### 功能验收
- [ ] 后台有 AI 配置界面,可以配置 API Key、模型等参数
- [ ] AI 配置支持测试连接功能
- [ ] 教师可以通过自然语言输入框提问
- [ ] AI 能够正确分析数据并返回结构化结果
- [ ] 分析结果支持复制和导出
- [ ] 错题分析功能正常工作
- [ ] 题目解析生成功能正常工作
- [ ] 缓存机制正常工作,避免重复调用
- [ ] 示例问题可以快速填入输入框

### 技术验收
- [ ] **数据库规范**: 使用 MySQL 语法（AUTO_INCREMENT）
- [ ] **API 规范**: 使用 `api.get/post/delete` 封装
- [ ] **消息规范**: 使用 `message.success/error` 封装
- [ ] **HOOK 规范**: 正确使用 useLoading
- [ ] **图标导入**: 所有图标已正确导入
- [ ] **安全措施**: XSS 防护、CSRF 防护、权限验证
- [ ] **错误处理**: 所有异步操作包含 try-catch
- [ ] **环境变量**: 豆包 AI 配置已添加到 .env

### 性能验收
- [ ] AI 分析响应时间 < 60 秒
- [ ] 缓存命中率 > 30%（相似查询）
- [ ] 数据库索引已创建
- [ ] 无内存泄漏（组件卸载时清理资源）

### 安全验收
- [ ] API Key 未暴露在前端代码中
- [ ] 所有 AI 接口都有权限验证
- [ ] 输入长度已限制（500字）
- [ ] 用户输入已进行 XSS 转义

---

## 🚀 实施步骤

### 第一步：环境配置（5 分钟）
1. ~~在 `.env` 文件中添加豆包 AI 配置~~（改为数据库配置）
2. 重启后端服务器: `pm2 restart 0`

### 第二步：数据库准备（10 分钟）
1. 在 `server.cjs` 中添加缓存表创建代码
2. 重启服务器,验证表创建成功

### 第三步：后端 AI 服务（60 分钟）
1. 创建 `services/aiService.js`
2. 实现豆包 AI 调用逻辑
3. 添加从数据库读取配置的功能
4. 添加缓存功能
5. 添加错误处理和超时控制

### 第四步：后端 API 接口（50 分钟）
1. 创建 `routes/ai.js`
2. 实现分析、错题、解析、测试连接接口
3. 在 `server.cjs` 中注册路由
4. 测试接口功能

### 第五步：AI 配置管理界面（40 分钟）
1. 创建 `AIConfigSetting.vue` 组件
2. 集成到基础设置页面
3. 实现配置保存和加载
4. 实现连接测试功能
5. 测试配置功能

### 第六步：前端分析组件开发（90 分钟）
1. 创建 `AIAnalysisPanel.vue` 组件
2. 集成到数据分析页面
3. 添加示例问题、复制、导出功能
4. 测试前端功能

### 第七步：测试验证（30 分钟）
1. 测试后台 AI 配置功能
2. 测试自然语言查询功能
3. 测试缓存机制
4. 测试错误处理
5. 性能测试和优化

**总计:约 5 小时**

---

## 📝 注意事项

### 必须遵守的规矩

1. **数据库**: 禁止使用 SQLite 语法,必须使用 MySQL 语法
2. **API**: 禁止使用原生 fetch,必须使用 `api` 封装
3. **消息**: 禁止直接使用 Element Plus,必须使用 `message` 封装
4. **Composables**: 正确使用 `useLoading`
5. **图标**: 必须从 `@element-plus/icons-vue` 导入
6. **权限**: 所有 AI 接口必须使用 `adminAuth`
7. **错误**: 所有异步操作必须 try-catch
8. **安全**: API Key 必须放在环境变量中,禁止硬编码
9. **缓存**: 必须实现缓存机制,避免重复调用 AI API

### 增量开发原则

1. **不破坏现有功能** - 所有修改向后兼容
2. **逐步验证** - 每个功能完成后立即测试
3. **保留旧代码** - 新增文件,不删除现有文件
4. **可回滚** - 每个步骤独立提交,方便回滚

### AI 调用限制

1. **超时控制**: AI 调用超时时间 60 秒
2. **输入长度**: 限制问题长度 500 字以内
3. **调用频率**: 利用限流中间件控制调用频率
4. **缓存策略**: 相同查询 1 小时内使用缓存结果

### 成本控制

1. **缓存优先**: 优先使用缓存结果
2. **批量处理**: 支持批量分析,减少 API 调用
3. **监控用量**: 记录 API 调用次数和成本

---

## 📚 参考资料

### 项目文档
- **技术栈清单**: `DOCS/技术栈清单.md`
- **常见错误**: `DOCS/常见错误示例.md`
- **API 文档**: `DOCS/API文档/`
- **环境配置**: `DOCS/环境配置说明.md`
- **项目规则**: 根目录 `/rules`

### 外部文档
- 豆包 AI API 文档: https://www.volcengine.com/docs/82379
- Vue 3 文档: https://cn.vuejs.org/
- Element Plus 文档: https://element-plus.org/zh-CN/

---

## 版本记录

| 版本 | 日期 | 修改内容 | 修改原因 |
|------|------|---------|---------|
| v1.0 | 2026-03-26 | 初始版本 | 需求文档创建 |

---

**文档状态**: 待实施  
**最后更新**: 2026-03-26
