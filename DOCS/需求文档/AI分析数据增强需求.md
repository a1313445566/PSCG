# AI 分析数据增强需求

## 📋 文档说明

- **文档类型**: 需求文档
- **适用对象**: AI 开发助手
- **优先级**: P0（高优先级）
- **预计时间**: 48 小时
- **创建日期**: 2026-03-27
- **版本**: v1.0

---

## 🔍 项目现状检查（AI 必须先完成）

### 数据库类型
- [x] **检查数据库依赖**: MySQL 8.0+ (`mysql2` ^3.20.0)
- [x] **检查数据库实例**: `services/database.js` 已实现
- [x] **确认语法规范**: 使用 MySQL 语法 (`AUTO_INCREMENT`)

### 现有工具和封装
- [x] **API 封装**: `src/utils/api.js` - 必须使用
- [x] **消息封装**: `src/utils/message.js` - 必须使用
- [x] **格式化工具**: `src/utils/format.js` - 按需使用
- [x] **安全工具**: `src/utils/xss-filter.js` - XSS 防护

### 现有 Composables
- [x] **useLoading**: `src/composables/useLoading.js`
- [x] **usePagination**: `src/composables/usePagination.js` - 注意：`total` 是参数，不是返回值
- [x] **useUserFilters**: `src/composables/useUserFilters.js`

### 现有中间件
- [x] **adminAuth**: `middleware/adminAuth.js` - 管理员权限验证
- [x] **rateLimit**: `middleware/rateLimit.js` - 限流
- [x] **csrf**: `middleware/csrf.js` - CSRF 防护

### 现有 API
- [x] **列出相关 API**: `routes/ai.js`, `routes/quiz.js`, `routes/error-collection.js` 等
- [x] **确认是否需要新增**: 需要新增 API 以支持数据增强

### 现有组件
- [x] **列出相关组件**: `src/components/admin/ai/` 下的 AI 分析组件
- [x] **确认是否需要修改**: 需要修改现有组件以支持新功能

---

## 🎯 需求概述

为提升 PSCG 刷题项目的 AI 分析能力，需要增强数据采集和分析维度，重点关注题目难度动态调整、答题行为分析、学习进度跟踪、个性化推荐、内容质量评估、学习效果分析和智能错题管理等核心功能。通过这些数据增强，AI 将能够提供更精准的分析和个性化学习建议，提升用户刷题体验和学习效果。

---

## 🔧 技术约束（AI 必须遵守）

### 1. 数据库规范

#### 必须使用 MySQL 语法
```sql
-- ✅ 正确：MySQL 语法
CREATE TABLE IF NOT EXISTS table_name (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='表注释';

-- ❌ 禁止：SQLite 语法
-- CREATE TABLE table_name (
--   id INTEGER PRIMARY KEY AUTOINCREMENT
-- );
```

#### 使用项目的 Database 实例
```javascript
const db = require('./services/database');

// 查询单条
const row = await db.get('SELECT * FROM table WHERE id = ?', [id]);

// 查询多条
const rows = await db.query('SELECT * FROM table LIMIT ?', [limit]);

// 执行更新/插入
await db.run('INSERT INTO table SET ?', data);
```

---

### 2. API 调用规范

#### 必须使用现有 API 封装
```javascript
// ❌ 禁止使用原生 fetch
const response = await fetch('/api/resource', {...})

// ✅ 必须使用项目的 api 封装
import { api } from '@/utils/api'

// GET 请求
const result = await api.get('/api/resource', { page: 1, limit: 20 })

// POST 请求
const result = await api.post('/api/resource', { name: '张三' })

// DELETE 请求
const result = await api.delete('/api/resource/1')
```

**文件位置**: `src/utils/api.js`  
**功能**: 自动重试、防抖、超时、CSRF、统一错误处理

---

### 3. 消息提示规范

#### 必须使用现有消息封装
```javascript
// ❌ 禁止直接使用 Element Plus
ElMessage.success('操作成功')

// ✅ 必须使用项目的消息封装
import message from '@/utils/message'

// 成功提示
message.success('操作成功')

// 错误提示
message.error('操作失败')

// 警告提示
message.warning('警告信息')

// 确认对话框
const confirmed = await message.confirm('确定要删除吗？', '删除确认')

// 删除确认
const confirmed = await message.confirmDelete('此项目')

// 批量操作确认
const confirmed = await message.confirmBatch(10, '删除')

// 操作成功/失败提示
message.actionSuccess('保存')
message.actionFailed('保存', '网络错误')
```

**文件位置**: `src/utils/message.js`

---

### 4. HOOK 使用规范

#### usePagination 正确使用
```javascript
import { usePagination } from '@/composables/usePagination'
import { ref } from 'vue'

// ✅ 正确的使用方式
const total = ref(0)  // 先创建 total ref
const pagination = usePagination(20, total)  // 传入 total ref

// 使用分页参数
const params = pagination.getServerParams()  // { page: 1, limit: 20 }

// 更新总数
total.value = result.total  // 直接修改 total ref

// 事件处理
const handleSizeChange = (size) => {
  pagination.handleSizeChange(size)
  loadData()
}

const handleCurrentChange = (page) => {
  pagination.handleCurrentChange(page)
  loadData()
}

// 重置分页
pagination.reset()
```

**⚠️ 重要**: `total` 作为参数传入，不是返回值！

#### useLoading 正确使用
```javascript
import { useLoading } from '@/composables/useLoading'
import { onUnmounted } from 'vue'

const { showLoading, hideLoading, withLoading, cleanup } = useLoading()

// 方式1：手动控制
showLoading('加载中...')
await fetchData()
hideLoading()

// 方式2：自动包装（推荐）
await withLoading(async () => {
  await fetchData()
}, '加载中...')

// 组件卸载时清理
onUnmounted(cleanup)
```

**文件位置**: `src/composables/useLoading.js`

---

### 5. 错误处理规范

#### 前端错误处理
```javascript
try {
  const result = await api.post('/api/resource', data)
  message.actionSuccess('操作')
  await loadData()
} catch (error) {
  // api 已自动显示错误，无需额外处理
  // 如需自定义错误处理：
  // message.error(`操作失败: ${error.message}`)
}
```

#### 后端错误处理
```javascript
router.post('/resource', adminAuth, async (req, res) => {
  try {
    const { name } = req.body
    
    // 输入验证
    if (!name) {
      return res.status(400).json({ error: '名称不能为空' })
    }
    
    // 业务逻辑
    res.json({ success: true, message: '操作成功' })
  } catch (error) {
    console.error('[模块名] 操作失败:', error)
    res.status(500).json({ error: '操作失败，请稍后重试' })
  }
})
```

---

### 6. 安全规范

#### 必须实施的安全措施
```javascript
// 1. 权限验证（后端）
router.post('/resource', adminAuth, async (req, res) => {
  // adminAuth 中间件已验证 JWT Token
  // req.admin 包含当前管理员信息
})

// 2. 输入验证（后端）
if (!name || name.trim() === '') {
  return res.status(400).json({ error: '名称不能为空' })
}

// 3. XSS 防护（前端）
import { escapeHtml } from '@/utils/xss-filter'
const safeName = escapeHtml(userInput)

// 4. CSRF 防护（自动）
// api 封装已自动添加 CSRF Token
```

---

### 7. 图标导入规范

#### 必须导入 Element Plus 图标
```vue
<script setup>
// ✅ 正确的图标导入
import { Delete, Edit, View, Download } from '@element-plus/icons-vue'
</script>

<template>
  <el-icon><Delete /></el-icon>
  <el-icon><Edit /></el-icon>
  <el-icon><View /></el-icon>
  <el-icon><Download /></el-icon>
</template>
```

---

## 📦 需求详情

### 需求 1: 题目难度动态调整

#### 功能描述
实现基于用户答题表现的题目难度自动调整机制，包括难度历史记录、用户难度偏好分析和动态调整规则。

#### 技术实现

##### 步骤 1: 数据库准备

```sql
-- 创建题目难度历史表
CREATE TABLE IF NOT EXISTS question_difficulty_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL COMMENT '题目ID',
  old_difficulty INT NOT NULL COMMENT '旧难度',
  new_difficulty INT NOT NULL COMMENT '新难度',
  reason VARCHAR(255) COMMENT '调整原因',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '调整时间',
  INDEX idx_question_id (question_id),
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目难度调整历史';

-- 扩展题目表
ALTER TABLE questions ADD COLUMN quality_score FLOAT DEFAULT 0 COMMENT '题目质量评分';
ALTER TABLE questions ADD COLUMN usage_count INT DEFAULT 0 COMMENT '使用次数';
ALTER TABLE questions ADD COLUMN last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间';
```

**执行方式**:
1. 在 `server.cjs` 启动时自动执行
2. 使用 `db.run()` 执行 SQL

---

##### 步骤 2: 后端 API 实现

**文件位置**: `routes/difficulty.js`（修改现有文件）

```javascript
const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const db = require('../services/database');

/**
 * GET /api/difficulty/history
 * 获取题目难度调整历史
 */
router.get('/history', adminAuth, async (req, res) => {
  try {
    const { questionId, page = 1, limit = 20 } = req.query;
    
    let whereClause = '';
    const params = [];
    
    if (questionId) {
      whereClause = 'WHERE question_id = ?';
      params.push(questionId);
    }
    
    const countResult = await db.get(`SELECT COUNT(*) as total FROM question_difficulty_history ${whereClause}`, params);
    const offset = (page - 1) * limit;
    
    const rows = await db.query(`
      SELECT h.*, q.content
      FROM question_difficulty_history h
      LEFT JOIN questions q ON h.question_id = q.id
      ${whereClause}
      ORDER BY h.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    res.json({
      data: rows,
      total: countResult.total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('[难度管理] 获取历史失败:', error);
    res.status(500).json({ error: '获取历史失败，请稍后重试' });
  }
});

/**
 * POST /api/difficulty/adjust
 * 手动调整题目难度
 */
router.post('/adjust', adminAuth, async (req, res) => {
  try {
    const { questionId, newDifficulty, reason } = req.body;
    
    // 输入验证
    if (!questionId || !newDifficulty) {
      return res.status(400).json({ error: '题目ID和新难度不能为空' });
    }
    
    if (newDifficulty < 1 || newDifficulty > 5) {
      return res.status(400).json({ error: '难度必须在1-5之间' });
    }
    
    // 获取旧难度
    const question = await db.get('SELECT difficulty FROM questions WHERE id = ?', [questionId]);
    if (!question) {
      return res.status(404).json({ error: '题目不存在' });
    }
    
    const oldDifficulty = question.difficulty;
    
    // 更新难度
    await db.run('UPDATE questions SET difficulty = ? WHERE id = ?', [newDifficulty, questionId]);
    
    // 记录历史
    await db.run(
      'INSERT INTO question_difficulty_history (question_id, old_difficulty, new_difficulty, reason) VALUES (?, ?, ?, ?)',
      [questionId, oldDifficulty, newDifficulty, reason || '手动调整']
    );
    
    res.json({ success: true, message: '难度调整成功' });
  } catch (error) {
    console.error('[难度管理] 调整失败:', error);
    res.status(500).json({ error: '调整失败，请稍后重试' });
  }
});

module.exports = router;
```

---

##### 步骤 3: 前端实现

**文件位置**: `src/components/admin/difficulty/DifficultyAdjust.vue`

```vue
<template>
  <div class="difficulty-adjust">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>题目难度调整</span>
        </div>
      </template>
      
      <el-form :model="form" label-width="100px">
        <el-form-item label="题目ID">
          <el-input v-model="form.questionId" placeholder="请输入题目ID" />
        </el-form-item>
        <el-form-item label="新难度">
          <el-slider v-model="form.newDifficulty" :min="1" :max="5" :marks="{ 1: '1', 3: '3', 5: '5' }" />
        </el-form-item>
        <el-form-item label="调整原因">
          <el-input v-model="form.reason" type="textarea" :rows="2" placeholder="请输入调整原因" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleAdjust" :loading="loading">调整难度</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card shadow="hover" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>难度调整历史</span>
        </div>
      </template>
      
      <el-table :data="historyData" v-loading="loadingHistory">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="question_id" label="题目ID" width="100" />
        <el-table-column prop="content" label="题目内容" show-overflow-tooltip />
        <el-table-column prop="old_difficulty" label="旧难度" width="80" />
        <el-table-column prop="new_difficulty" label="新难度" width="80" />
        <el-table-column prop="reason" label="调整原因" show-overflow-tooltip />
        <el-table-column prop="created_at" label="调整时间" width="180" />
      </el-table>
      
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px;"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { api } from '@/utils/api'
import message from '@/utils/message'
import { useLoading } from '@/composables/useLoading'

const { withLoading, cleanup } = useLoading()

// 表单数据
const form = reactive({
  questionId: '',
  newDifficulty: 3,
  reason: ''
})

// 历史数据
const historyData = ref([])
const loading = ref(false)
const loadingHistory = ref(false)

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 加载历史数据
const loadHistory = async () => {
  try {
    loadingHistory.value = true
    
    const result = await api.get('/api/difficulty/history', {
      page: pagination.page,
      limit: pagination.limit
    })
    
    historyData.value = result.data
    pagination.total = result.total
  } catch (error) {
    // api 已自动显示错误
  } finally {
    loadingHistory.value = false
  }
}

// 调整难度
const handleAdjust = async () => {
  if (!form.questionId) {
    message.warning('请输入题目ID')
    return
  }
  
  try {
    loading.value = true
    
    await api.post('/api/difficulty/adjust', {
      questionId: form.questionId,
      newDifficulty: form.newDifficulty,
      reason: form.reason
    })
    
    message.success('难度调整成功')
    form.questionId = ''
    form.reason = ''
    await loadHistory()
  } catch (error) {
    // api 已自动显示错误
  } finally {
    loading.value = false
  }
}

// 分页事件
const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  loadHistory()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadHistory()
}

// 生命周期
onMounted(() => {
  loadHistory()
})

onUnmounted(cleanup)
</script>

<style scoped>
.difficulty-adjust {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
```

---

### 需求 2: 答题行为分析

#### 功能描述
记录和分析用户的答题行为细节，包括答题时间、答案修改记录、犹豫行为等，为AI分析提供更详细的数据支持。

#### 技术实现

##### 步骤 1: 数据库准备

```sql
-- 创建答题行为详情表
CREATE TABLE IF NOT EXISTS answer_behavior (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  question_id INT NOT NULL COMMENT '题目ID',
  answer_time INT NOT NULL COMMENT '答题时间（秒）',
  answer_modifications INT DEFAULT 0 COMMENT '答案修改次数',
  is_first_answer_correct TINYINT(1) DEFAULT 0 COMMENT '首次答案是否正确',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_user_question (user_id, question_id),
  INDEX idx_question_id (question_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='答题行为详情';

-- 扩展答题记录表
ALTER TABLE answer_records ADD COLUMN avg_answer_time FLOAT DEFAULT 0 COMMENT '平均答题时间（秒）';
ALTER TABLE answer_records ADD COLUMN difficulty_level INT DEFAULT 0 COMMENT '难度级别';
```

---

##### 步骤 2: 后端 API 实现

**文件位置**: `routes/answer-behavior.js`（新建文件）

```javascript
const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const db = require('../services/database');

/**
 * POST /api/answer-behavior
 * 记录答题行为
 */
router.post('/', async (req, res) => {
  try {
    const { userId, questionId, answerTime, answerModifications, isFirstAnswerCorrect } = req.body;
    
    // 输入验证
    if (!userId || !questionId || answerTime === undefined) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 记录行为
    await db.run(
      'INSERT INTO answer_behavior (user_id, question_id, answer_time, answer_modifications, is_first_answer_correct) VALUES (?, ?, ?, ?, ?)',
      [userId, questionId, answerTime, answerModifications || 0, isFirstAnswerCorrect ? 1 : 0]
    );
    
    res.json({ success: true, message: '行为记录成功' });
  } catch (error) {
    console.error('[答题行为] 记录失败:', error);
    res.status(500).json({ error: '记录失败，请稍后重试' });
  }
});

/**
 * GET /api/answer-behavior/stats
 * 获取答题行为统计
 */
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const { userId, questionId, subjectId, limit = 20 } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (userId) {
      whereClause += ' AND ab.user_id = ?';
      params.push(userId);
    }
    if (questionId) {
      whereClause += ' AND ab.question_id = ?';
      params.push(questionId);
    }
    if (subjectId) {
      whereClause += ' AND q.subject_id = ?';
      params.push(subjectId);
    }
    
    const stats = await db.query(`
      SELECT 
        ab.*, 
        q.content, 
        q.difficulty, 
        s.name as subject,
        u.name as user_name,
        u.grade,
        u.class
      FROM answer_behavior ab
      LEFT JOIN questions q ON ab.question_id = q.id
      LEFT JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN users u ON ab.user_id = u.id
      ${whereClause}
      ORDER BY ab.created_at DESC
      LIMIT ?
    `, [...params, parseInt(limit)]);
    
    res.json({ data: stats });
  } catch (error) {
    console.error('[答题行为] 统计失败:', error);
    res.status(500).json({ error: '统计失败，请稍后重试' });
  }
});

module.exports = router;
```

---

##### 步骤 3: 前端实现

**文件位置**: `src/components/quiz/AnswerBehaviorTracker.vue`

```vue
<template>
  <!-- 答题行为跟踪组件（内嵌到答题页面） -->
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { api } from '@/utils/api'

// 答题开始时间
const startTime = ref(0)
// 答案修改次数
const modificationCount = ref(0)
// 首次答案
const firstAnswer = ref(null)

// 开始答题
const startTracking = () => {
  startTime.value = Date.now()
  modificationCount.value = 0
  firstAnswer.value = null
}

// 记录答案修改
const trackModification = () => {
  modificationCount.value++
}

// 记录首次答案
const trackFirstAnswer = (answer) => {
  if (!firstAnswer.value) {
    firstAnswer.value = answer
  }
}

// 提交答题行为
const submitBehavior = async (userId, questionId, isCorrect) => {
  const answerTime = Math.round((Date.now() - startTime.value) / 1000)
  const isFirstAnswerCorrect = firstAnswer.value === isCorrect
  
  try {
    await api.post('/api/answer-behavior', {
      userId,
      questionId,
      answerTime,
      answerModifications: modificationCount.value,
      isFirstAnswerCorrect
    })
  } catch (error) {
    console.error('提交答题行为失败:', error)
  }
}

// 导出方法
defineExpose({
  startTracking,
  trackModification,
  trackFirstAnswer,
  submitBehavior
})
</script>
```

---

### 需求 3: 学习进度管理

#### 功能描述
实现学习进度跟踪和管理，包括知识点掌握程度、学习目标完成情况等，为个性化学习建议提供数据支持。

#### 技术实现

##### 步骤 1: 数据库准备

```sql
-- 创建学习进度表
CREATE TABLE IF NOT EXISTS learning_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  subject_id INT NOT NULL COMMENT '学科ID',
  subcategory_id INT NOT NULL COMMENT '知识点ID',
  mastery_level INT DEFAULT 0 COMMENT '掌握程度（0-100）',
  last_practiced DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '最后练习时间',
  target_goal INT DEFAULT 80 COMMENT '目标掌握程度',
  progress_percentage INT DEFAULT 0 COMMENT '进度百分比',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY unique_user_subject_subcategory (user_id, subject_id, subcategory_id),
  INDEX idx_user_subject (user_id, subject_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习进度';
```

---

##### 步骤 2: 后端 API 实现

**文件位置**: `routes/learning-progress.js`（新建文件）

```javascript
const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const db = require('../services/database');

/**
 * GET /api/learning-progress/user
 * 获取用户学习进度
 */
router.get('/user', async (req, res) => {
  try {
    const { userId, subjectId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: '用户ID不能为空' });
    }
    
    let whereClause = 'WHERE lp.user_id = ?';
    const params = [userId];
    
    if (subjectId) {
      whereClause += ' AND lp.subject_id = ?';
      params.push(subjectId);
    }
    
    const progress = await db.query(`
      SELECT 
        lp.*, 
        s.name as subject,
        sub.name as subcategory
      FROM learning_progress lp
      LEFT JOIN subjects s ON lp.subject_id = s.id
      LEFT JOIN subcategories sub ON lp.subcategory_id = sub.id
      ${whereClause}
      ORDER BY lp.mastery_level ASC
    `, params);
    
    res.json({ data: progress });
  } catch (error) {
    console.error('[学习进度] 获取失败:', error);
    res.status(500).json({ error: '获取失败，请稍后重试' });
  }
});

/**
 * POST /api/learning-progress/update
 * 更新学习进度
 */
router.post('/update', async (req, res) => {
  try {
    const { userId, subjectId, subcategoryId, masteryLevel } = req.body;
    
    // 输入验证
    if (!userId || !subjectId || !subcategoryId || masteryLevel === undefined) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    if (masteryLevel < 0 || masteryLevel > 100) {
      return res.status(400).json({ error: '掌握程度必须在0-100之间' });
    }
    
    // 计算进度百分比
    const targetGoal = 80; // 默认目标
    const progressPercentage = Math.min(Math.round((masteryLevel / targetGoal) * 100), 100);
    
    //  upsert 操作
    await db.run(`
      INSERT INTO learning_progress (user_id, subject_id, subcategory_id, mastery_level, last_practiced, target_goal, progress_percentage)
      VALUES (?, ?, ?, ?, NOW(), ?, ?)
      ON DUPLICATE KEY UPDATE 
        mastery_level = VALUES(mastery_level),
        last_practiced = NOW(),
        progress_percentage = VALUES(progress_percentage)
    `, [userId, subjectId, subcategoryId, masteryLevel, targetGoal, progressPercentage]);
    
    res.json({ success: true, message: '进度更新成功' });
  } catch (error) {
    console.error('[学习进度] 更新失败:', error);
    res.status(500).json({ error: '更新失败，请稍后重试' });
  }
});

module.exports = router;
```

---

##### 步骤 3: 前端实现

**文件位置**: `src/components/admin/learning/LearningProgress.vue`

```vue
<template>
  <div class="learning-progress">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>学习进度管理</span>
        </div>
      </template>
      
      <el-form :model="searchForm" label-width="100px" inline>
        <el-form-item label="用户ID">
          <el-input v-model="searchForm.userId" placeholder="请输入用户ID" />
        </el-form-item>
        <el-form-item label="学科">
          <el-select v-model="searchForm.subjectId" placeholder="请选择学科">
            <el-option v-for="subject in subjects" :key="subject.id" :label="subject.name" :value="subject.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadProgress">查询</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="progressData" v-loading="loading">
        <el-table-column prop="subject" label="学科" />
        <el-table-column prop="subcategory" label="知识点" />
        <el-table-column prop="mastery_level" label="掌握程度">
          <template #default="scope">
            <div class="mastery-container">
              <el-progress :percentage="scope.row.mastery_level" :color="getMasteryColor(scope.row.mastery_level)" />
              <span class="mastery-text">{{ scope.row.mastery_level }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="progress_percentage" label="进度">
          <template #default="scope">
            <el-progress :percentage="scope.row.progress_percentage" />
          </template>
        </el-table-column>
        <el-table-column prop="last_practiced" label="最后练习" width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { api } from '@/utils/api'
import message from '@/utils/message'
import { useLoading } from '@/composables/useLoading'

const { withLoading, cleanup } = useLoading()

// 搜索表单
const searchForm = reactive({
  userId: '',
  subjectId: ''
})

// 数据
const progressData = ref([])
const subjects = ref([])
const loading = ref(false)

// 加载学科列表
const loadSubjects = async () => {
  try {
    const result = await api.get('/api/subjects')
    subjects.value = result.data
  } catch (error) {
    console.error('加载学科失败:', error)
  }
}

// 加载学习进度
const loadProgress = async () => {
  if (!searchForm.userId) {
    message.warning('请输入用户ID')
    return
  }
  
  try {
    loading.value = true
    
    const result = await api.get('/api/learning-progress/user', {
      userId: searchForm.userId,
      subjectId: searchForm.subjectId
    })
    
    progressData.value = result.data
  } catch (error) {
    // api 已自动显示错误
  } finally {
    loading.value = false
  }
}

// 获取掌握程度颜色
const getMasteryColor = (level) => {
  if (level < 40) return '#F56C6C'
  if (level < 70) return '#E6A23C'
  return '#67C23A'
}

// 生命周期
onMounted(() => {
  loadSubjects()
})

onUnmounted(cleanup)
</script>

<style scoped>
.learning-progress {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mastery-container {
  position: relative;
}

.mastery-text {
  position: absolute;
  right: 10px;
  top: 0;
  font-size: 12px;
  color: #606266;
}
</style>
```

---

## ✅ 验收标准

### 功能验收
- [ ] 题目难度动态调整功能正常，能够记录难度调整历史
- [ ] 答题行为分析功能正常，能够记录答题时间、修改次数等细节
- [ ] 学习进度管理功能正常，能够跟踪知识点掌握程度
- [ ] 个性化推荐功能正常，能够基于用户特征推荐题目
- [ ] 竞争激励系统正常，能够显示排行榜和成就
- [ ] 内容质量评估功能正常，能够评估题目质量
- [ ] 学习效果分析功能正常，能够评估学习效果
- [ ] 智能错题管理功能正常，能够分析错题原因

### 技术验收
- [ ] **数据库规范**: 使用 MySQL 语法（AUTO_INCREMENT）
- [ ] **API 规范**: 使用 `api.get/post/delete` 封装
- [ ] **消息规范**: 使用 `message.success/error` 封装
- [ ] **HOOK 规范**: 正确使用 useLoading、usePagination
- [ ] **图标导入**: 所有图标已正确导入
- [ ] **安全措施**: XSS 防护、CSRF 防护、权限验证
- [ ] **错误处理**: 所有异步操作包含 try-catch

### 性能验收
- [ ] 列表查询响应时间 < 1 秒
- [ ] 数据库索引已创建
- [ ] 无内存泄漏（组件卸载时清理资源）

---

## 🚀 实施步骤

### 第一步：数据库准备（60 分钟）
1. 创建题目难度历史表
2. 创建答题行为详情表
3. 创建学习进度表
4. 创建用户特征表
5. 创建排行榜表
6. 创建题目质量评估表
7. 创建学习效果分析表
8. 创建智能错题管理表
9. 扩展现有表结构

### 第二步：后端 API 开发（120 分钟）
1. 实现难度管理 API
2. 实现答题行为 API
3. 实现学习进度 API
4. 实现个性化推荐 API
5. 实现排行榜 API
6. 实现题目质量评估 API
7. 实现学习效果分析 API
8. 实现智能错题管理 API

### 第三步：前端实现（120 分钟）
1. 实现难度调整组件
2. 实现答题行为跟踪组件
3. 实现学习进度管理组件
4. 实现个性化推荐组件
5. 实现题目质量评估组件
6. 实现学习效果分析组件
7. 实现智能错题管理组件

### 第四步：测试验证（60 分钟）
1. 功能测试
2. 性能测试
3. 安全测试
4. 兼容性测试

---

## 📝 注意事项

### 必须遵守的规矩

1. **数据库**: 禁止使用 SQLite 语法，必须使用 MySQL 语法
2. **API**: 禁止使用原生 fetch，必须使用 `api` 封装
3. **消息**: 禁止直接使用 Element Plus，必须使用 `message` 封装
4. **Composables**: 正确使用 `usePagination`（`total` 是参数，不是返回值）
5. **图标**: 必须从 `@element-plus/icons-vue` 导入
6. **权限**: 所有管理后台 API 必须使用 `adminAuth`
7. **错误**: 所有异步操作必须 try-catch
8. **日志**: 生产环境禁止输出调试日志

### 增量开发原则

1. **不破坏现有功能** - 所有修改向后兼容
2. **逐步验证** - 每个功能完成后立即测试
3. **保留旧代码** - 新增文件，不删除现有文件
4. **可回滚** - 每个步骤独立提交，方便回滚

---

## 📚 参考资料

- **技术栈清单**: `DOCS/技术栈清单.md`
- **AI辅助开发指南**: `DOCS/AI辅助开发指南.md`
- **环境配置说明**: `DOCS/环境配置说明.md`
- **项目规则**: 根目录 `/rules`

---

## 版本记录

| 版本 | 日期 | 修改内容 | 修改原因 |
|------|------|---------|---------|
| v1.0 | 2026-03-27 | 初始版本 | - |

---

**文档状态**: 待实施  
**最后更新**: 2026-03-27