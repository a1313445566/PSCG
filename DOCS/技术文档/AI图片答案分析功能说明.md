# AI 图片答案分析功能说明

## 功能概述

系统现已支持 **AI 多模态图片分析**，可以自动识别和分析题目选项中的图片答案，提供更智能的题目解析、错题分析和质量评估。

## 技术实现

### 1. 图片提取机制

系统会自动从以下位置提取图片URL：
- HTML `<img>` 标签：`<img src="http://...">`
- Markdown 格式：`![alt](http://...)`

提取的图片会通过豆包AI的多模态API进行分析。

### 2. 多模态API调用

调用豆包AI时支持以下格式：

```javascript
// 文本+图片混合内容
{
  role: 'user',
  content: [
    { type: 'text', text: '分析这道题目...' },
    { type: 'image_url', image_url: { url: 'http://example.com/image.jpg' } },
    { type: 'image_url', image_url: { url: 'http://example.com/image2.jpg' } }
  ]
}
```

**限制**：单次最多分析3张图片，避免超出token限制。

## 功能场景

### 场景一：题目解析（支持图片）

**API**: `POST /api/ai/explanation`

**功能**：AI生成题目答案解析时，会自动识别选项中的图片内容并进行分析。

**示例**：
```json
{
  "questionId": 123
}
```

**响应**：
```json
{
  "success": true,
  "explanation": "这道题考查的是几何图形的识别。\n\n选项A中的图片展示的是一个等边三角形...\n选项B是一个直角三角形...\n\n正确答案是A，因为..."
}
```

---

### 场景二：错题深度分析（支持图片）

**API**: `POST /api/ai/error-analysis-user`

**功能**：分析学生的错题收藏，结合图片答案提供针对性的学习建议。

**示例**：
```json
{
  "userId": 5
}
```

**响应**：
```json
{
  "success": true,
  "analysis": "该学生共收藏了12道错题，分析如下：\n\n1. **图形题薄弱**：有5道题涉及几何图形识别（选项包含图片）...\n\n2. **常见错误**：\n   - 将等腰三角形误判为等边三角形\n   - 未注意图片中的直角标记\n\n3. **建议**：\n   - 加强几何图形的特征识别训练\n   - 注意观察图片中的标注细节",
  "errorCount": 12
}
```

---

### 场景三：题目质量评估（支持图片）

**API**: `POST /api/ai/question-quality`

**功能**：评估题目质量，包括图片的清晰度、相关性和对答题的影响。

**示例**：
```json
{
  "questionId": 456,
  "includeStats": true
}
```

**响应**：
```json
{
  "success": true,
  "evaluation": "题目质量评估报告：\n\n**1. 题目描述**：清晰明确，表述准确\n\n**2. 图片质量**：\n   - 选项A图片：清晰度高，标注明确\n   - 选项B图片：分辨率较低，建议优化\n   - 图片相关性：所有图片都与题目内容紧密相关\n\n**3. 难度设置**：适中（正确率68%）\n\n**4. 区分度**：良好，能有效区分不同水平学生\n\n**5. 改进建议**：\n   - 优化选项B的图片分辨率\n   - 考虑增加图片标注说明",
  "hasImages": true
}
```

---

### 场景四：答题数据分析（支持图片）

**API**: `POST /api/ai/batch`

**功能**：批量分析题目答题情况，AI会结合图片内容分析学生答题规律。

**示例**：
```json
{
  "questionIds": [1, 2, 3, 4, 5],
  "title": "几何题专项分析",
  "analysisType": "deep"
}
```

**AI分析内容**：
- 哪些图片题学生容易出错
- 图片的复杂度是否影响答题正确率
- 学生是否正确理解图片中的信息

---

## 数据库字段说明

### `questions` 表

| 字段 | 类型 | 说明 | 是否支持图片 |
|------|------|------|--------------|
| `content` | TEXT | 题目内容 | ✅ 支持HTML/Markdown图片 |
| `options` | TEXT | 选项内容（JSON数组） | ✅ 支持HTML/Markdown图片 |
| `correct_answer` | TEXT | 正确答案（字母） | ❌ 仅存储答案字母 |
| `image_url` | VARCHAR(255) | 题目配图 | ✅ 独立图片字段 |

**示例**：
```json
{
  "content": "下列哪个图形是等边三角形？",
  "options": [
    "<img src='http://example.com/triangle1.jpg'>",
    "<img src='http://example.com/triangle2.jpg'>",
    "<img src='http://example.com/triangle3.jpg'>",
    "<img src='http://example.com/triangle4.jpg'>"
  ],
  "correct_answer": "A",
  "image_url": "http://example.com/question.png"
}
```

---

## 图片存储建议

### 1. 图片格式

- **推荐**：JPG、PNG、WebP
- **尺寸**：宽度建议 800px 以下，确保加载速度
- **大小**：单张图片不超过 500KB

### 2. 图片URL要求

- 必须是 **公网可访问** 的完整URL
- 支持HTTP和HTTPS协议
- 建议使用CDN加速

### 3. 上传方式

在题目编辑器中：
- **方法一**：直接粘贴图片（自动上传到服务器）
- **方法二**：使用编辑器工具栏的图片按钮上传
- **方法三**：手动输入图片URL

---

## 注意事项

### 1. API调用限制

- 单次分析最多 **3张图片**
- 图片分析会消耗更多token，建议控制图片数量
- 多模态API响应时间可能较长（建议设置超时时间60秒）

### 2. 图片质量影响

- 低分辨率图片可能影响AI识别准确性
- 复杂图片（如包含多个元素）需要更长的分析时间
- 建议使用清晰、标注明确的图片

### 3. 缓存机制

- AI分析结果会缓存1小时（默认配置）
- 图片URL变化会生成新的缓存
- 可通过 `DELETE /api/ai/cache` 手动清理缓存

---

## 前端集成示例

### Vue组件示例

```vue
<template>
  <div class="ai-analysis">
    <el-button @click="analyzeQuestion" :loading="loading">
      AI分析（支持图片）
    </el-button>
    
    <div v-if="analysis" class="analysis-result">
      <h3>AI分析结果</h3>
      <div v-html="renderedAnalysis"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { marked } from 'marked'
import api from '@/utils/api'

const analysis = ref('')
const loading = ref(false)

const renderedAnalysis = computed(() => {
  return marked.parse(analysis.value || '')
})

async function analyzeQuestion() {
  loading.value = true
  try {
    const res = await api.post('/api/ai/question-quality', {
      questionId: props.questionId,
      includeStats: true
    })
    
    if (res.data.success) {
      analysis.value = res.data.evaluation
      ElMessage.success(`分析完成，包含${res.data.hasImages ? '图片' : '文本'}分析`)
    }
  } catch (error) {
    ElMessage.error('分析失败：' + error.message)
  } finally {
    loading.value = false
  }
}
</script>
```

---

## 豆包AI模型配置

### 1. 检查模型支持

确保使用的豆包模型支持多模态（图片理解）：

```javascript
// 查看当前模型配置
const config = await db.get('SELECT * FROM settings WHERE setting_key = "aiModel"')
console.log('当前模型:', config.value)
```

**推荐模型**：
- `doubao-vision-pro-32k`（推荐，支持图片+长文本）
- `doubao-vision-lite-32k`（轻量版）

### 2. 配置方法

在系统设置中配置：
1. 进入后台管理 → 系统设置 → AI配置
2. 填写API Key、API URL、模型名称
3. 点击"测试连接"验证

---

## 测试建议

### 1. 创建测试题目

准备包含图片答案的测试题目：
- 题目1：单选，1个选项有图片
- 题目2：单选，所有选项都有图片
- 题目3：多选，部分选项有图片

### 2. 测试API

使用Postman或curl测试：

```bash
# 测试题目解析
curl -X POST http://localhost:3001/api/ai/explanation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"questionId": 1}'

# 测试错题分析
curl -X POST http://localhost:3001/api/ai/error-analysis-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"userId": 5}'

# 测试题目质量评估
curl -X POST http://localhost:3001/api/ai/question-quality \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"questionId": 1, "includeStats": true}'
```

### 3. 验证图片提取

检查日志确认图片提取成功：

```
[AI服务] 提取到图片URL: http://example.com/image1.jpg
[AI服务] 提取到图片URL: http://example.com/image2.jpg
[AI服务] 构建多模态内容: 1个文本 + 2张图片
```

---

## 故障排除

### 问题1：图片未被识别

**原因**：图片URL不是公网可访问，或格式不正确

**解决**：
- 检查图片URL是否可以浏览器直接打开
- 确认URL格式正确（http:// 或 https:// 开头）

### 问题2：AI分析结果未提及图片内容

**原因**：使用的模型不支持多模态

**解决**：
- 检查模型配置，切换到支持视觉的模型
- 联系豆包AI确认模型能力

### 问题3：分析超时

**原因**：图片过大或数量过多

**解决**：
- 压缩图片尺寸
- 减少单次分析的图片数量
- 增加超时时间配置（`aiTimeout`）

---

## 更新日志

**v1.0.0** (2026-03-26)
- ✅ 新增多模态图片分析能力
- ✅ 支持4个分析场景（题目解析、错题分析、质量评估、数据分析）
- ✅ 自动提取HTML和Markdown格式图片
- ✅ 新增 `/api/ai/error-analysis-user` API
- ✅ 新增 `/api/ai/question-quality` API
- ✅ 优化现有API支持图片分析
