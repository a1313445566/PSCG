# 阅读理解题功能需求文档（合并方案）

> 版本：v4.1 | 日期：2026-04-02
> 修订说明：v4.0 补充评估报告中 4 个未覆盖问题；v4.1 修复后端 XSS 递归深度 BUG、明确错题巩固累计规则、补充验收标准
> 设计原则：**零数据库改动，最小后端改动，复用现有富文本基础设施**

***

## 一、概述

### 1.1 目标

为 PSCG 题库系统新增**阅读理解题**题型支持。采用**复合题目**方案——将一篇阅读材料 + N 道小题作为**一条** `questions` 记录存储，不新增数据库表。

### 1.2 设计核心思路

```
阅读理解题 = 1 条 questions 记录
├── type = 'reading'           // 题型标识（已存在）
├── content = 阅读材料全文       // 富文本 HTML（QuillEditor）
├── options = JSON（小题数组）   // 所有小题的结构化数据（含富文本）
├── answer = JSON（正确答案）    // 各小题正确答案映射
└── explanation = JSON（解析）   // 各小题解析（富文本 HTML）
```

### 1.3 为什么选择这个方案

现有系统中 `reading` 类型已在 `QuestionForm.vue` 中定义（第53行），但无实际差异化实现。教学场景中，阅读理解题的特征是"共享材料 + 多小题"，如果将小题拆成独立 questions 记录，会波及：

- 答题记录（answer\_records / quiz\_attempts）：需要关联 passage\_id
- 错题本（error\_collection）：单题进错题本时缺少材料上下文
- 答题接口（quiz.js）：需要查询篇章信息，改变数据流
- 数据分析：需要按篇章聚合统计
- 难度计算（difficultyService）：需要按篇章聚合
- 个人中心：答题历史和错题回顾需要展示阅读材料

**本方案将影响控制在仅前端层面**，后端数据和接口几乎不变。

### 1.4 富文本支持（已确认）

现有系统**天然支持富文本**，阅读理解题直接复用：

| 字段                             | 数据库类型     | 后台编辑控件          | 学生端渲染                    | 富文本支持 |
| ------------------------------ | --------- | --------------- | ------------------------ | ----- |
| `content`（阅读材料）                | TEXT      | QuillEditor     | `v-html` + rich-text CSS | ✅ 含图片 |
| 小题题目 `subQuestion.content`     | JSON 中字符串 | QuillEditor     | `v-html`                 | ✅ 含图片 |
| 小题选项 `subQuestion.options[i]`  | JSON 中字符串 | EditableContent | `v-html`                 | ✅ 含图片 |
| 小题解析 `subQuestion.explanation` | JSON 中字符串 | QuillEditor     | `v-html`                 | ✅ 含图片 |

> 现有 `routes/questions.js` 第320-335行已对 options 做递归 XSS 过滤（`deepSanitize`），可直接处理嵌套 JSON 中的富文本。

### 1.5 影响范围

| 层级   | 影响                                                                             |
| ---- | ------------------------------------------------------------------------------ |
| 数据库  | **无改动**                                                                        |
| 后端路由 | **需适配** quiz.js：答案判定 reading 分支 + shuffleMappings 嵌套映射（\~25 行） |
| 后端服务 | **无改动** |
| 后台前端 | 修改 `QuestionForm.vue`（\~80 行） |
| 学生前端 | 新增 `ReadingPassageCard.vue` + 修改 `QuizView.vue`（\~30 行）+ 修改 `ResultView.vue`（\~30 行） |

***

## 二、数据存储设计

### 2.1 字段语义重定义

阅读理解题复用现有 `questions` 表字段，语义重新定义：

| 字段                                             | 普通题目                                       | 阅读理解题                      |
| ---------------------------------------------- | ------------------------------------------ | -------------------------- |
| `type`                                         | `'single'` / `'multiple'` / `'judgment'` 等 | `'reading'`                |
| `content`                                      | 题目内容（富文本）                                  | **阅读材料全文**（富文本 HTML）       |
| `options`                                      | `["选项A","选项B","选项C","选项D"]`                | **JSON 字符串**（小题数组，见 2.2）   |
| `answer` / `correct_answer`                    | `"C"` 或 `"AB"`                             | **JSON 字符串**（小题答案映射，见 2.3） |
| `explanation`                                  | 答案解析文本（富文本）                                | **JSON 字符串**（各小题解析，见 2.4）  |
| `image_url`                                    | 题目配图                                       | 阅读材料配图（可选，也可内嵌在 content 中） |
| `audio_url`                                    | 题目音频                                       | 阅读材料音频（可选，如朗读）             |
| `subject_id` / `subcategory_id` / `difficulty` | 不变                                         | 不变                         |

### 2.2 options 字段 JSON 结构

存储所有小题的完整数据，**小题题目和选项均支持富文本 HTML**：

```json
[
  {
    "order": 1,
    "content": "<p>下列关于黏菌的说法，<strong>正确</strong>的一项是</p>",
    "options": [
      "<p>黏菌有大脑和神经，所以非常聪明。</p>",
      "<p>黏菌在任何时候都呈现出"黏糊糊"的状态。</p>",
      "<p>黏菌是一种非常古老的生命，能在各种恶劣环境中生存。</p>",
      "<p>黏菌的子实体在条件恶劣时才会产生。</p>"
    ],
    "answer": "C",
    "explanation": "<p>根据原文最后一段"这些生活在地球上数亿年的古老生命...能够在各种恶劣的环境中生存"，故<strong>C正确</strong>。</p>"
  },
  {
    "order": 2,
    "content": "<p>文中提到黏菌"暗藏着超高'智商'"，这里的"智商"主要指的是</p>",
    "options": [
      "<p>黏菌会像人类一样思考和学习。</p>",
      "<p>黏菌拥有复杂的神经系统。</p>",
      "<p>黏菌有很强的捕食能力和高效的觅食网络。<img src=\"https://example.com/slime.png\" /></p>",
      "<p>黏菌能像人类一样使用工具。</p>"
    ],
    "answer": "C",
    "explanation": "<p>原文第二段描述了黏菌的觅食网络和捕食能力，这里的"智商"是拟人化的说法。</p>"
  }
]
```

> **说明**：
>
> - `order`：小题序号，从 1 开始
> - `content`：小题题目（**富文本 HTML**，支持加粗、图片等）
> - `options`：小题的 4 个选项（**富文本 HTML** 字符串数组，支持图片、公式等）
> - `answer`：小题正确答案（单个字母 `"C"`）
> - `explanation`：小题解析（**富文本 HTML**）

### 2.3 answer / correct\_answer 字段

用于后端快速判定整体正确性（纯 JSON，不含富文本）：

```json
{"1": "C", "2": "C", "3": "A", "4": "B"}
```

### 2.4 explanation 字段

各小题解析的映射（富文本 HTML）：

```json
{
  "1": "<p>根据原文最后一段...故<strong>C正确</strong>。</p>",
  "2": "<p>原文第二段描述了...实际指其高效的觅食能力。</p>"
}
```

### 2.5 后端兼容性分析

现有 `routes/questions.js` 的选项处理逻辑（第319-335行）已对 options 做递归 XSS 过滤：

```javascript
// 已有代码：递归处理对象属性（第326-333行）
if (typeof opt === 'object') {
  return Object.keys(opt).reduce((acc, key) => {
    acc[key] = typeof opt[key] === 'string' ? xssFilter.deepSanitize(opt[key]) : opt[key]
    return acc
  }, {})
}
```

阅读理解题的 options 是对象数组，每个对象中的 `content`、`options`（字符串数组）、`explanation` 都是字符串，会被 `deepSanitize` 正确过滤。**后端不需要改动**。

***

## 三、后台管理功能需求

### 3.1 修改 QuestionForm.vue

**文件**：`src/components/admin/question-management/QuestionForm.vue`

在现有表单中增加阅读理解题的编辑模式。当用户选择 `type === 'reading'` 时，切换为阅读理解专用布局。

#### 3.1.1 阅读理解模式触发

当 `form.type === 'reading'` 时，隐藏普通题目的"答案选项"区域，显示阅读理解专用的"阅读材料 + 小题列表"区域。

```vue
<!-- 普通题目的答案选项区域 -->
<div v-if="form.type !== 'reading'" class="form-section">
  <!-- 现有选项编辑逻辑 -->
</div>

<!-- 阅读理解题专用区域 -->
<div v-else class="form-section">
  <!-- 阅读材料 + 小题列表 -->
</div>
```

#### 3.1.2 阅读材料区域

| 字段   | 控件                 | 必填 | 说明                  |
| ---- | ------------------ | -- | ------------------- |
| 阅读材料 | QuillEditor 富文本编辑器 | 是  | 复用现有 QuillEditor 组件 |

- 编辑器高度 400px（比普通题目的 240px 大），材料通常较长
- 支持粘贴图片（复用现有图片上传机制）
- 可选：附件音频（复用现有 `audio_url` 字段和上传逻辑）

#### 3.1.3 小题列表区域

每个小题为**可折叠卡片**（`el-collapse-item`），标题栏显示 `第 N 题` + 已答标记。

**每个卡片包含**：

| 字段     | 控件                  | 必填 | 富文本 | 说明                |
| ------ | ------------------- | -- | --- | ----------------- |
| 小题题目   | QuillEditor（简化工具栏）  | 是  | ✅   | 支持加粗、图片等          |
| 选项 A-D | EditableContent × 4 | 是  | ✅   | 复用现有行内富文本编辑器      |
| 正确答案   | 单选按钮组（A/B/C/D）      | 是  | -   | 与现有 checkbox 方式一致 |
| 解析     | QuillEditor（简化工具栏）  | 否  | ✅   | 该小题的解析            |

**动态操作**：

- 「添加小题」按钮：末尾追加（最多 20 题）
- 「删除」按钮：每题可删除（至少保留 1 题）
- 「上移 / 下移」按钮：拖拽排序或按钮调整顺序

#### 3.1.4 保存逻辑

保存时将表单数据**组装**为 questions 记录格式，调用现有的 `POST /api/questions` 或 `PUT /api/questions/:id` 接口：

```javascript
// 组装阅读理解题数据
const assembleReadingQuestion = () => {
  const subQuestions = subQuestionList.value.map((sq, index) => ({
    order: index + 1,
    content: sq.content,           // 富文本 HTML
    options: sq.options,           // 富文本 HTML 数组
    answer: sq.answer,             // "C"
    explanation: sq.explanation    // 富文本 HTML
  }))

  return {
    subjectId: form.value.subjectId,
    subcategoryId: form.value.subcategoryId,
    type: 'reading',
    difficulty: form.value.difficulty,
    content: form.value.content,    // 阅读材料富文本
    options: JSON.stringify(subQuestions),
    answer: JSON.stringify(Object.fromEntries(
      subQuestions.map(sq => [String(sq.order), sq.answer])
    )),
    explanation: JSON.stringify(Object.fromEntries(
      subQuestions.map(sq => [String(sq.order), sq.explanation])
    )),
    audio: form.value.audio,
    image: form.value.image
  }
}
```

> **关键**：完全复用现有接口，不需要新的后端 API。

#### 3.1.5 编辑回填

编辑阅读理解题时，从 questions 记录中解析 `options` JSON，还原为小题列表：

```javascript
const fillReadingForm = (question) => {
  let subQuestions = []
  try {
    subQuestions = JSON.parse(question.options)
  } catch (e) {
    subQuestions = []
  }
  // 填充到 subQuestionList
  subQuestionList.value = subQuestions.map(sq => ({
    content: sq.content,
    options: sq.options,
    answer: sq.answer,
    explanation: sq.explanation
  }))
}
```

### 3.2 修改 QuestionManagement.vue

在题目管理页面，现有的"添加题目"按钮已经可以触发 `QuestionForm.vue`，用户选择"阅读题"类型即可进入阅读理解编辑模式。**无需额外添加入口按钮**。

### 3.3 题目列表展示

在 `QuestionList.vue` 中，阅读理解题的显示方式：

| 展示项    | 内容                      |
| ------ | ----------------------- |
| 题目类型标签 | `阅读理解`（已有此标签）           |
| 题目内容预览 | 材料标题或前 50 字 + `（共 N 题）` |
| 其余列    | 与普通题目一致                 |

不需要特殊分组，阅读理解题就是列表中的一条记录。

### 3.4 批量导入（后续扩展）

> 作为后续优化项，本期不实现。

可支持 Excel / JSON 格式批量导入阅读理解题，通过上传文件解析后批量调用现有 `POST /api/questions` 接口。

***

## 四、答题流程适配

### 4.1 前端选项随机打乱适配（重要修复）

**问题**：现有 `QuizView.vue` 第680-703行的选项打乱逻辑，会直接对 `options` 数组执行 `shuffleOptions()`。

- **普通题目** options = `["选项A", "选项B", ...]` → 打乱字符串数组，没问题
- **阅读理解题** options = `[{order:1, options:["A","B","C","D"], answer:"C"}, ...]` → **会错误打乱小题顺序！**

**修复方案**：在 `QuizView.vue` 的选项打乱逻辑中，对 `type === 'reading'` 的题目做特殊处理——跳过整体打乱，改为**逐小题打乱选项**：

```javascript
// QuizView.vue 第680行附近
const questionsWithShuffled = data.questions.map(q => {
  const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options

  if (q.type === 'reading') {
    // 阅读理解题：逐小题打乱选项，不打乱小题顺序
    const subQuestionShuffleMappings = {}
    const shuffledSubQuestions = options.map((sq, sqIndex) => {
      const { shuffledOptions, reverseMapping } = shuffleOptions(sq.options)
      subQuestionShuffleMappings[String(sq.order || sqIndex + 1)] = reverseMapping
      return {
        ...sq,
        options: shuffledOptions
      }
    })

    return {
      ...q,
      options: shuffledSubQuestions,  // 小题内选项已打乱
      shuffleMapping: subQuestionShuffleMappings,  // 每道小题的映射
      type: 'reading'
    }
  }

  if (shouldRandomize.value) {
    // 普通题目的现有打乱逻辑...
  }
})
```

**提交答案时**：shuffleMappings 需要包含小题的映射信息，后端也需要相应适配（见 4.1.1）。

#### 4.1.1 后端 shuffleMappings 适配

当 `type === 'reading'` 时，`shuffleMappings[question.id]` 的结构从 `{0:2, 1:0, ...}` 变为 `{"1":{0:2,1:0,...}, "2":{0:1,1:3,...}}`（嵌套对象：小题序号 → 该小题的选项映射）。

后端 `quiz.js` 在处理 reading 类型的 `reverseMapping` 时需要：

1. 遍历每个小题的映射
2. 将用户选择的小题答案映射回原始位置

```javascript
// quiz.js 中，reading 类型的答案映射
if (question.type === 'reading' && reverseMapping && typeof mappedUserAnswer === 'object') {
  const mappedReadingAnswer = {}
  Object.keys(mappedUserAnswer).forEach(subOrder => {
    const subReverseMapping = reverseMapping[subOrder]
    if (subReverseMapping) {
      mappedReadingAnswer[subOrder] = mapAnswerToOriginal(mappedUserAnswer[subOrder], subReverseMapping)
    } else {
      mappedReadingAnswer[subOrder] = mappedUserAnswer[subOrder]
    }
  })
  mappedUserAnswer = mappedReadingAnswer
}
```

### 4.2 quiz.js 后端答案判定适配（重要修复）

**问题**：现有 `quiz.js` 第489-494行的单选题判定逻辑：

```javascript
} else {
  // 所有非 multiple 类型（single, judgment, reading...）
  isCorrect = mappedUserAnswer === correctAnswer
}
```

对于阅读理解题：

- `correctAnswer` 可能是 JSON 字符串 `'{"1":"C","2":"C"}'` 或已解析的对象 `{"1":"C","2":"C"}`
- `mappedUserAnswer` 是对象 `{"1":"C","2":"B"}`
- `对象 === 字符串` → `false`；`对象 === 对象` → 比较引用，永远 `false`

**修复方案**：在答案判定逻辑中增加 reading 类型分支：

```javascript
} else if (question.type === 'reading') {
  // 阅读理解题：按比例给分
  let correctObj = correctAnswer
  if (typeof correctObj === 'string') {
    try { correctObj = JSON.parse(correctObj) } catch (e) { /* 保持原值 */ }
  }
  const userObj = typeof mappedUserAnswer === 'string'
    ? JSON.parse(mappedUserAnswer)
    : mappedUserAnswer

  // 逐小题对比，计算正确率
  let correctCount = 0
  const totalCount = Object.keys(correctObj).length
  Object.keys(correctObj).forEach(key => {
    if (userObj[key] === correctObj[key]) correctCount++
  })
  // 全对才算正确（isCorrect 用于答题记录），同时记录正确率用于积分
  isCorrect = correctCount === totalCount
  // 将正确率附加到结果中，用于积分计算
  readingScore = totalCount > 0 ? correctCount / totalCount : 0
} else {
  // 现有单选/判断题逻辑不变
  isCorrect = mappedUserAnswer === correctAnswer
}
```

> **说明**：`isCorrect` 仍为布尔值，用于答题记录的 `is_correct` 字段。`readingScore`（0~1）用于积分计算和难度更新。当全对时 `isCorrect = true`，否则 `isCorrect = false`，同时通过 `readingScore` 传递比例信息。

#### 4.2.1 积分计算适配

现有积分逻辑（`quiz.js` 第580-595行）：

```javascript
points = correctCount - (totalQuestions - correctCount)  // 答对+1，答错-1
if (correctCount === totalQuestions) points *= 2           // 全对翻倍
```

阅读理解题按比例给分时，需要在 `correctCount` 统计中体现部分正确。方案：

- **答题记录**：`is_correct = 0/1`（全对才为1），与现有逻辑一致
- **积分计算**：将阅读理解题的正确小题数计入 `correctCount`，不影响现有积分公式
- **实际效果**：一篇 5 小题的阅读理解题答对 3 题，`correctCount` 增加 1（整题算对 1 道的贡献）

> 即：阅读理解题在积分计算中等价于"1 道题"，全对 +1 分，部分正确 0 分，全错 -1 分。但**前端展示**时会在结果中显示"正确 N/M"的详细信息。

#### 4.2.2 错题本适配

阅读理解题进入错题本的规则：

| 情况 | 处理 |
|------|------|
| 全部正确（如 5/5） | 不进错题本 |
| 部分正确（如 3/5） | **整篇进入错题本**（进错题本后学生可看到完整材料和所有小题） |
| 全部错误（如 0/5） | 整篇进入错题本 |

#### 4.2.3 错题巩固累计规则

现有错题巩固逻辑（`quiz.js` 第674-723行）：
- 错题答对一次 `correct_count += 1`
- 错题答错一次 `correct_count` 重置为 `0`
- `correct_count >= 3` 时从错题本删除，积分 +1

阅读理解题进入错题本后，**巩固规则与普通题目一致，以"整篇"为单位**：

| 场景 | `isCorrect` | `correct_count` 变化 | 说明 |
|------|-------------|---------------------|------|
| 巩固时全部小题正确 | `true` | `+1`（例如 0→1→2→3） | 和普通题答对一致 |
| 巩固时部分/全部小题错误 | `false` | 重置为 `0` | 和普通题答错一致 |
| `correct_count >= 3` | - | 从错题本删除，积分 +1 | 和普通题一致 |

> **关键点**：阅读理解题的 `isCorrect` 只有全对才为 `true`，因此部分正确在巩固时等同于答错，`correct_count` 重置为 0。这意味着阅读理解题的巩固难度高于普通题目，符合预期。

#### 4.2.4 错题巩固进度展示适配

现有错题巩固进度展示（`ResultView.vue` 第80-100行、`QuestionCard.vue` 的 `error-collection-progress`）：

```javascript
// ResultView.vue
const errorCollectionProgress = computed(() => {
  return currentQuestions.value.map(question => {
    const correctCount = questionStore.getErrorQuestionCorrectCount(question.id)
    let status = '进行中'
    if (correctCount >= 3) status = '已完成'
    return { questionId: question.id, correctCount, status }
  })
})
```

阅读理解题的进度展示**无需改动**，因为：

1. 进度统计以 `question.id` 为维度，阅读理解题整篇作为一个 `question.id`
2. `correct_count` 是后端在 `error_collection` 表中维护的，与题目类型无关
3. 前端只需确认 `QuestionCard` / `ReadingPassageCard` 都能正确接收和展示 `error-collection-progress` 属性

**唯一需注意**：`ReadingPassageCard.vue` 需要在 props 中接收 `errorCollectionProgress`，并在组件中展示巩固进度标签（如"巩固 1/3"）。

### 4.3 questionStore.js 适配

`submitAnswer` 方法需要处理阅读理解题的特殊答案格式：

```javascript
submitAnswer(questionId, answer, questionType = 'single') {
  if (questionType === 'reading') {
    // 阅读理解题：answer = { order: selectedOption }
    // 合并到现有答案对象中
    if (!this.userAnswers[questionId]) {
      this.userAnswers[questionId] = {}
    }
    this.userAnswers[questionId][answer.order] = answer.option
  } else if (questionType === 'multiple') {
    // 现有多选逻辑...
  } else {
    // 现有单选逻辑...
  }
}
```

### 4.3 学生端答题组件

#### 4.3.1 新增 ReadingPassageCard.vue

**文件**：`src/components/quiz/ReadingPassageCard.vue`

**功能**：替代 `QuestionCard.vue` 来展示阅读理解题。

**UI 布局**：

```
┌────────────────────────────────────────────────┐
│  问题 N                    [阅读理解]           │
├────────────────────────────────────────────────┤
│  阅读材料                           [收起 ▲]   │
│  ┌──────────────────────────────────────────┐  │
│  │ 自然界有一种特别奇特的生物——黏菌...       │  │
│  │ ...（富文本渲染，可滚动，最大高度 300px）  │  │
│  │ [图片、加粗等富文本内容正常渲染]           │  │
│  └──────────────────────────────────────────┘  │
├────────────────────────────────────────────────┤
│  小题导航：[1✓] [2✓] [3●] [4] [5]             │
├────────────────────────────────────────────────┤
│  第 3 题 / 共 5 题                             │
│  下列对文中画线句子的判断，正确的一项是          │
│                                                │
│  ○ A. 运用了作比较的说明方法...                 │
│  ○ B. 运用了举例子的说明方法...                 │
│  ● C. 运用了打比方的说明方法...                 │
│  ○ D. 运用了分类别的说明方法...                 │
│       [选项中的图片/公式正常渲染 v-html]        │
└────────────────────────────────────────────────┘
```

**Props**：与 `QuestionCard.vue` 保持一致（`question`, `questionNumber`, `userAnswer`, `showResult`）

**关键交互**：

1. 阅读材料区默认展开，可点击"收起"折叠（固定在顶部）
2. 小题导航条显示所有小题编号，点击切换，已答标记 ✓
3. 当前小题的选项可点击选择（富文本渲染）
4. `showResult` 时，每道小题显示对错标记 + 正确答案 + 富文本解析
5. 音频播放器（如有 audio\_url）：复用现有 `QuestionCard.vue` 的音频逻辑

**富文本渲染**：

- 材料区：`v-html="question.content"` + `class="rich-text-content"`
- 小题题目：`v-html="currentSubQuestion.content"`
- 小题选项：`v-html="option"`（与 QuestionCard 一致）
- 小题解析：`v-html="subQuestion.explanation"`

#### 4.3.2 修改 QuizView\.vue

在答题页面中，根据题目类型选择渲染组件：

```vue
<!-- 现有组件 -->
<QuestionCard
  v-if="question.type !== 'reading'"
  :question="question"
  ...
/>

<!-- 阅读理解题 -->
<ReadingPassageCard
  v-else
  :question="question"
  :questionNumber="index + 1"
  :userAnswer="quizStore.userAnswers[question.id]"
  :showResult="showResults"
  @select-option="(data) => selectOption(question.id, data, 'reading')"
/>
```

`selectOption` 需要支持 reading 类型：

```javascript
const selectOption = (questionId, data, questionType) => {
  quizStore.submitAnswer(questionId, data, questionType)
}
```

#### 4.3.3 修改 ResultView\.vue

在结果展示页面中，阅读理解题需要特殊展示：

- 显示阅读材料（可折叠，富文本渲染）
- 逐题显示对错、正确答案、富文本解析
- 整体显示正确率（如"正确 4/5"）

### 4.4 hasAnsweredAll 逻辑适配（重要修复）

**问题**：现有 `QuizView.vue` 的 `hasAnsweredAll` 计算属性只检查答案是否 `!== undefined`，阅读理解题的答案是对象 `{"1":"C", "2":"B"}`，只要有一个小题作答就会通过检查，导致学生未答完所有小题就能提交。

**修复方案**：

```javascript
const hasAnsweredAll = computed(() => {
  return currentQuestions.value.every(question => {
    const answer = userAnswers.value[question.id]

    // 阅读理解题：检查所有小题是否都已作答
    if (question.type === 'reading') {
      if (!answer || typeof answer !== 'object') return false
      const options = typeof question.options === 'string'
        ? JSON.parse(question.options)
        : question.options
      // 遍历每个小题，确认都有答案
      return options.every(sq =>
        answer[String(sq.order || options.indexOf(sq) + 1)] !== undefined
      )
    }

    if (question.type === 'multiple') {
      return Array.isArray(answer) && answer.length > 0
    }

    return answer !== undefined
  })
})
```

### 4.5 QuestionDetailDialog 适配

**问题**：后台题目详情对话框（`QuestionDetailDialog.vue`）的选项渲染假设 options 是字符串数组，阅读理解题的 options 是对象数组，会显示 `[object Object]`。

**修复方案**：增加阅读理解题的预览分支：

```vue
<!-- 阅读理解题详情 -->
<template v-if="detailData.type === 'reading'">
  <div class="detail-section">
    <label>阅读材料：</label>
    <div class="rich-text-content" v-html="detailData.content"></div>
  </div>
  <div class="detail-section">
    <label>小题列表（共 {{ parseReadingOptions(detailData.options).length }} 题）：</label>
    <div v-for="sq in parseReadingOptions(detailData.options)" :key="sq.order" class="sub-question-item">
      <div class="sub-header">
        <span>第 {{ sq.order }} 题</span>
        <el-tag size="small" type="success">答案: {{ sq.answer }}</el-tag>
      </div>
      <div class="sub-content" v-html="sq.content"></div>
      <div class="sub-options">
        <div v-for="(opt, i) in sq.options" :key="i">
          {{ String.fromCharCode(65 + i) }}. <span v-html="opt"></span>
        </div>
      </div>
      <div v-if="sq.explanation" class="sub-explanation" v-html="sq.explanation"></div>
    </div>
  </div>
</template>

<!-- 普通题目详情 -->
<template v-else>
  <!-- 原有逻辑不变 -->
</template>
```

### 4.6 XSS 递归过滤修复（重要修复）

**问题**：阅读理解题的 options 结构为 `[{order, content, options, explanation}]`，嵌套层级达 2 层（小题对象 → options 数组 → 富文本字符串）。

**后端 BUG 确认**（`utils/xss-filter.js` + `routes/questions.js` 第327-331行）：

现有后端 XSS 过滤逻辑：
```javascript
// routes/questions.js 第327-331行
if (typeof opt === 'object') {
  return Object.keys(opt).reduce((acc, key) => {
    acc[key] = typeof opt[key] === 'string' ? xssFilter.deepSanitize(opt[key]) : opt[key]
    //                                                            ^^^^^^^^^^^^
    // 只处理字符串值，如果 opt[key] 是数组则直接跳过！
    return acc
  }, {})
}
```

阅读理解题结构：`{order:1, content:"<p>题干</p>", options:["<p>A</p>","<p>B</p>"], explanation:"..."}`

| 字段 | 类型 | 是否被过滤 |
|------|------|-----------|
| `content` | string | ✅ 被 `deepSanitize` 处理 |
| `options` | **array** | ❌ **直接跳过，未被过滤！** |
| `explanation` | string | ✅ 被 `deepSanitize` 处理 |

#### 修复方案：在 xss-filter.js 增加真正递归过滤函数

```javascript
// utils/xss-filter.js 新增方法
/**
 * 递归清理对象/数组中的所有字符串字段
 * 用于阅读理解题等嵌套 JSON 结构的 XSS 过滤
 * @param {*} data - 任意数据（字符串、数组、对象）
 * @returns {*} - 清理后的数据
 */
recursiveSanitize(data) {
  if (data === null || data === undefined) return data
  if (typeof data === 'string') return this.deepSanitize(data)
  if (Array.isArray(data)) return data.map(item => this.recursiveSanitize(item))
  if (typeof data === 'object') {
    return Object.keys(data).reduce((acc, key) => {
      acc[key] = this.recursiveSanitize(data[key])
      return acc
    }, {})
  }
  return data
}
```

同时更新 `routes/questions.js` 中的 XSS 过滤调用（add + edit 两处），将第320-335行替换为：

```javascript
// 过滤选项中的富文本内容（递归处理嵌套结构）
const sanitizedOptions = options.map(opt => xssFilter.recursiveSanitize(opt))
```

#### 前端渲染防护

`ReadingPassageCard.vue` 也需要对解析后的 JSON 做一次递归过滤（双重防护）：

```javascript
// ReadingPassageCard.vue
import xssFilter from '@/utils/xss-filter'

const subQuestions = computed(() => {
  let options = props.question.options
  if (typeof options === 'string') {
    try { options = JSON.parse(options) } catch (e) { return [] }
  }
  if (!Array.isArray(options)) return []

  // 递归过滤所有嵌套的富文本字符串
  return options.map(sq => ({
    ...sq,
    content: xssFilter.deepSanitize(sq.content),
    options: (sq.options || []).map(opt => xssFilter.deepSanitize(opt)),
    explanation: sq.explanation ? xssFilter.deepSanitize(sq.explanation) : ''
  }))
})
```

> **安全策略**：后端 `recursiveSanitize` 作为主防线（存储时过滤），前端 `deepSanitize` 作为辅助防线（渲染时二次过滤）。

### 4.7 AnswerHistoryView 统计适配

**问题**：答题历史页面显示 `correct_count/total_questions`，阅读理解题部分正确时如何展示未定义。

**方案**：答题历史中的阅读理解题遵循现有格式，不需要额外改动：

| 展示项 | 说明 |
|--------|------|
| 正确题数 | 阅读理解题全对时 `is_correct = 1`，计入 `correct_count` |
| 总题数 | 阅读理解题作为 1 题计入 `total_questions` |
| 正确率 | `correct_count / total_questions`，与现有计算一致 |

> 例如：10 道题中有 2 道阅读理解题（各 5 小题），全部答对 2 道阅读理解 + 3 道普通题 = `correct_count = 5`，`total_questions = 10`，正确率 = 50%。
>
> 部分正确的阅读理解题 `is_correct = 0`，不影响统计逻辑。

***

## 五、文件清单

### 5.1 新增文件

| 文件路径                                         | 说明          |
| -------------------------------------------- | ----------- |
| `src/components/quiz/ReadingPassageCard.vue` | 学生端阅读理解答题卡片 |

### 5.2 修改文件

| 文件路径                                                             | 修改内容                                              | 预计改动量  |
| ---------------------------------------------------------------- | ------------------------------------------------- | ------ |
| `utils/xss-filter.js`                                             | 新增 `recursiveSanitize` 方法，递归过滤嵌套数组/对象中的字符串        | \~15 行 |
| `routes/questions.js`                                             | XSS 过滤调用替换为 `recursiveSanitize`（add + edit 两处）      | \~5 行  |
| `src/components/admin/question-management/QuestionForm.vue`      | 新增 reading 模式：材料编辑器 + 小题列表 + 数据组装/回填        | \~80 行 |
| `src/components/admin/common/QuestionDetailDialog.vue`            | 新增阅读理解题详情预览分支（材料 + 小题列表）                     | \~40 行 |
| `src/components/admin/question-management/QuestionList.vue`       | 预览增加阅读理解题分支                                     | \~30 行 |
| `src/stores/questionStore.js`                                     | `submitAnswer` 增加 reading 类型处理                    | \~10 行 |
| `src/views/QuizView.vue`                                          | 条件渲染 ReadingPassageCard + 选项打乱适配 + hasAnsweredAll 适配 | \~50 行 |
| `src/views/ResultView.vue`                                        | 阅读理解题结果展示（可折叠材料 + 小题结果）                       | \~30 行 |
| `routes/quiz.js`                                                 | 答案判定增加 reading 分支 + shuffleMappings 嵌套映射处理 | \~25 行 |

### 5.3 不需要修改的文件

| 文件                       | 原因                                |
| ------------------------ | --------------------------------- |
| `server.cjs`             | 不新增路由                             |
| `routes/questions.js`    | 不新增接口，已有 XSS 过滤兼容                 |
| `services/`              | 不新增服务                             |
| `migrations/`            | 不需要数据库迁移                          |
| `QuestionManagement.vue` | 复用现有"添加题目"按钮                      |
| `QuestionCard.vue`       | reading 类型由 ReadingPassageCard 处理 |
| `QuestionList.vue`       | 预览增加阅读理解分支（已列入修改清单）        |
| `QuestionDetailDialog.vue` | 详情增加阅读理解分支（已列入修改清单）   |
| `AnswerHistoryView.vue`  | 统计逻辑不受影响，无需修改                |
| `answer_records` 相关      | 不影响                               |
| `error_collection` 相关    | 不影响                               |
| `difficultyService.js`   | 不影响                               |
| `DataAnalysis.vue`       | 不影响                               |
| 个人中心                     | 不影响                               |

***

## 六、风险评估与应对

### 6.1 内容长度风险

| 风险              | 说明                    | 应对方案                                               |
| --------------- | --------------------- | -------------------------------------------------- |
| 阅读材料过长          | 影响页面加载和答题体验           | 材料区设最大高度 300px，滚动浏览；可收起折叠                          |
| options JSON 过大 | 小题多时 JSON 可能超过数据库字段限制 | MySQL TEXT 类型最大 65KB，约可存 50 道含图片的富文本小题；前端限制最多 20 题 |
| 富文本图片过多         | 影响加载速度                | 复用现有图片上传（2MB 限制）和懒加载机制                             |

### 6.2 答案判定风险

| 风险          | 说明                                              | 应对方案                          |
| ----------- | ----------------------------------------------- | ----------------------------- |
| JSON 对比顺序敏感 | `{"1":"C","2":"B"}` vs `{"2":"B","1":"C"}` 可能不等 | 使用 deep compare 或统一 key 排序后对比 |
| 部分正确判定      | 全对才算对 vs 按比例给分                                  | 采用**按比例给分**：答对 N/M 道小题，得分 = 1 × (N/M) |

### 6.3 兼容性风险

| 风险                         | 说明                   | 应对方案                              |
| -------------------------- | -------------------- | --------------------------------- |
| 现有数据中已有 type='reading' 的题目 | options 字段可能是空数组或旧格式 | 前端做兼容判断：若 options 非对象数组则降级为普通展示   |
| 错题本中阅读理解题展示                | 整篇进错题本，材料可能较长        | 复用 ReadingPassageCard 组件展示，材料默认收起 |

### 6.4 多媒体风险

| 风险        | 说明         | 应对方案                               |
| --------- | ---------- | ---------------------------------- |
| 音频文件较大    | 影响加载速度     | 复用现有 10MB 限制；可选音频不强制               |
| 富文本中的图片引用 | 删除题目时需清理文件 | 复用现有 `fileReferenceService` 引用计数机制 |

***

## 七、约束与规范

### 7.1 技术约束（与项目规范一致）

| 约束项    | 说明                                       |
| ------ | ---------------------------------------- |
| API 调用 | 必须使用 `src/utils/api.js`，禁止原生 fetch/axios |
| 消息提示   | 必须使用 `@/utils/message`，禁止直接使用 ElMessage  |
| 前端规范   | `<script setup>` + Composition API       |
| 样式     | 必须 `<style scoped>`                      |
| 组件     | PascalCase 命名                            |
| XSS 防护 | 富文本使用 `xssFilter.deepSanitize()` 过滤      |

### 7.2 数据约束

| 约束项  | 说明                                      |
| ---- | --------------------------------------- |
| 小题数量 | 每篇 1-20 道                               |
| 选项数量 | 每道小题固定 4 个选项（A/B/C/D）                   |
| 小题类型 | 目前仅支持单选                                 |
| 材料内容 | 富文本 HTML，支持图片（复用 QuillEditor）           |
| 小题题目 | 富文本 HTML，支持加粗、图片（使用简化工具栏 QuillEditor）   |
| 小题选项 | 富文本 HTML，支持图片、公式（复用 EditableContent 组件） |
| 小题解析 | 富文本 HTML（使用简化工具栏 QuillEditor）           |

### 7.3 向后兼容

- **零数据库改动**，不影响现有数据
- **零后端接口改动**（quiz.js 可能需 5 行适配）
- 现有答题流程、答题记录、错题本、排行榜、数据分析**全部不受影响**
- 阅读理解题的答题记录与普通题目格式一致（一条记录 = 一道大题）
- 难度计算按小题正确率判定（正确 N/M，影响该题难度分）

***

## 八、实施阶段

### 阶段一：后台管理（预计 70 分钟）

1. 修改 `QuestionForm.vue`
   - 新增 reading 模式的阅读材料编辑器
   - 新增小题列表（动态增删、排序、折叠）
   - 小题内使用 QuillEditor（题目/解析）+ EditableContent（选项）
   - 数据组装/回填逻辑
2. 修改 `QuestionDetailDialog.vue` 增加阅读理解题详情预览
3. 修改 `QuestionList.vue` 预览增加阅读理解分支
4. 测试后台添加/编辑/删除阅读理解题

### 阶段二：学生端答题（预计 50 分钟）

1. 开发 `ReadingPassageCard.vue`
   - 材料展示区（可折叠，富文本渲染）
   - 小题导航条
   - 小题选项交互（富文本渲染）
   - XSS 递归过滤
   - 结果展示
2. 修改 `QuizView.vue`
   - 条件渲染 ReadingPassageCard
   - `hasAnsweredAll` 适配
3. 修改 `questionStore.js` 适配答案提交

### 阶段三：选项随机 + 后端适配（预计 30 分钟）

1. 修改 `QuizView.vue` 选项打乱逻辑：reading 类型逐小题打乱选项
2. 修改 `quiz.js`
   - 答案判定增加 reading 分支
   - shuffleMappings 嵌套映射处理
3. 修改 `ResultView.vue` 阅读理解结果视图

### 阶段四：测试验证（预计 15 分钟）

1. 后台添加/编辑/删除阅读理解题
2. 学生端答题流程
3. 答题结果展示
4. `npm run build` 编译无错误
5. 普通题目功能不受影响回归测试

***

## 九、验收标准

### 9.1 后台管理

- [ ] 后台选择"阅读题"类型后，显示阅读材料编辑器 + 小题列表
- [ ] 小题支持富文本题目和富文本选项（含图片）
- [ ] 小题支持动态增删、排序
- [ ] 保存成功，数据库中 options 字段为正确的 JSON 结构
- [ ] 编辑阅读理解题时，数据正确回填到小题列表
- [ ] 后台题目详情对话框正确展示阅读理解题（材料 + 小题列表）
- [ ] 后台题目列表预览正确展示阅读理解题（不显示 [object Object]）

### 9.2 学生端答题

- [ ] 学生答题时，阅读材料固定在顶部（可收起），小题可切换
- [ ] 小题选项中的富文本（图片、加粗等）正确渲染
- [ ] **所有小题都作答后才能提交**（hasAnsweredAll 适配）
- [ ] 选项随机打乱时，打乱的是每道小题内部的选项顺序，不打乱小题顺序

### 9.3 答案判定与结果

- [ ] 答题提交后正确判定对错（逐小题对比，按比例给分）
- [ ] 结果展示中每道小题显示正确答案和富文本解析
- [ ] 结果展示中阅读理解题显示整体正确率（如"正确 4/5"）

### 9.4 错题本

- [ ] 部分正确（如 3/5）的阅读理解题**整篇**进入错题本
- [ ] 全部正确的阅读理解题**不进入**错题本
- [ ] 错题巩固时，全部小题正确 `correct_count +1`，部分/全部错误 `correct_count` 重置为 0
- [ ] `correct_count >= 3` 时从错题本删除，积分 +1
- [ ] 错题巩固结果页展示阅读理解题的巩固进度（如"巩固 1/3"）

### 9.5 数据兼容与安全

- [ ] 前端渲染时对解析后的 JSON 数据做 XSS 递归过滤
- [ ] 后端存储时 `recursiveSanitize` 覆盖嵌套数组中的所有字符串
- [ ] 已有的单选/多选/判断题数据不受影响（`npm run build` 无错误）
- [ ] 答题记录、排行榜、学习进度、学习报告正常工作
- [ ] 导入旧数据（不含 reading 类型）后系统正常无报错

