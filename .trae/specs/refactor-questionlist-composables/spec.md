# QuestionList Composable 重构规格说明

## Why
QuestionList.vue 文件超过 3100 行，script 部分约 2200 行，代码臃肿难以维护。需要将逻辑按职责拆分为多个可独立测试的 composable 函数，保持单文件组件结构的同时大幅降低代码复杂度。

## What Changes
- ✅ 创建 5 个 composable 文件，按职责分离逻辑
- ✅ QuestionList.vue 的 script 部分从 ~2200 行 精简到 ~200 行
- ✅ Template 和 Style 完全保持不变
- ✅ 所有响应式数据在同一组件作用域内，无跨组件通信
- ✅ 每个 composable 可独立单元测试
- ✅ composables 放在项目级 `src/composables/` 目录，与现有项目结构保持一致

## Impact
- **受影响文件**: 
  - `src/components/admin/question-management/QuestionList.vue` (精简)
  - 新增 `src/composables/useQuestionTable.js`
  - 新增 `src/composables/useSplitEdit.js`
  - 新增 `src/composables/useBatchOperations.js`
  - 新增 `src/composables/useAudioPlayer.js`
  - 新增 `src/composables/useQuestionPreview.js`
- **影响范围**: 仅限题目管理组件内部重构，无外部 API 变更
- **向后兼容**: ✅ 完全兼容，无破坏性变更

## ADDED Requirements

### Requirement: Composable 架构
系统 SHALL 提供以下 5 个独立的 composable 模块：

#### 1. useQuestionTable - 表格核心逻辑
**职责**: 数据加载、格式化、行内编辑、删除撤销
- **WHEN** 组件加载时
- **THEN** 自动加载题目列表并格式化显示
- **WHEN** 用户双击题目内容
- **THEN** 开启行内编辑模式
- **WHEN** 用户删除题目
- **THEN** 提供 3 秒撤销功能

#### 2. useSplitEdit - 分屏编辑核心
**职责**: 分屏编辑模式、题目编辑、阅读理解题辅助
- **WHEN** 用户点击"添加题目"或"编辑"按钮
- **THEN** 开启顶部编辑面板
- **WHEN** 用户保存题目
- **THEN** 验证数据并调用 API 保存
- **WHEN** 题目类型为阅读理解
- **THEN** 支持小题列表的增删改查

#### 3. useBatchOperations - 批量操作
**职责**: 所有批量操作逻辑（批量删除、修改难度、修改类型、移动）
- **WHEN** 用户选择多道题目并点击批量操作
- **THEN** 显示对应的批量操作对话框
- **WHEN** 用户确认批量操作
- **THEN** 调用批量 API 并刷新列表

#### 4. useAudioPlayer - 音频功能
**职责**: 音频上传、播放控制、进度管理
- **WHEN** 用户上传音频文件
- **THEN** 显示上传进度并验证文件格式和大小
- **WHEN** 用户点击播放/暂停
- **THEN** 控制音频播放状态
- **WHEN** 用户拖动进度条
- **THEN** 跳转到指定时间点

#### 5. useQuestionPreview - 预览功能
**职责**: 题目预览、数据缓存
- **WHEN** 用户点击"预览"按钮
- **THEN** 显示题目详情对话框
- **WHEN** 预览过的题目
- **THEN** 缓存数据避免重复请求

## MODIFIED Requirements

### Requirement: QuestionList.vue 主文件
**修改前**: script 部分约 2200 行，包含所有业务逻辑
**修改后**: script 部分约 200 行，仅负责组合调用 composable

```javascript
// 主文件只负责组合
import { useQuestionTable } from './composables/useQuestionTable'
import { useSplitEdit } from './composables/useSplitEdit'
import { useBatchOperations } from './composables/useBatchOperations'
import { useAudioPlayer } from './composables/useAudioPlayer'
import { useQuestionPreview } from './composables/useQuestionPreview'

const { ...table } = useQuestionTable(props)
const { ...edit } = useSplitEdit(props)
const { ...batch } = useBatchOperations(selectedQuestions, loadQuestions)
const { ...audio } = useAudioPlayer()
const { ...preview } = useQuestionPreview()

// 暴露给 template 的所有变量和函数直接来自 composable 的解构
```

## REMOVED Requirements

### Requirement: 单体大文件结构
**原因**: 代码臃肿难以维护和测试
**迁移**: 所有逻辑迁移到独立的 composable 文件，保持功能 100% 不变

## 技术约束

### 约束 1: 保持单文件组件
- QuestionList.vue 必须保持为单文件组件（SFC）
- Template 和 Style 部分禁止任何修改
- 只允许重构 script 部分

### 约束 2: 响应式兼容性
- 所有 composable 共享同一组件作用域
- 禁止创建新的 Vue 组件文件
- 响应式数据通过返回值暴露给主文件

### 约束 3: 零功能变更
- 所有现有功能必须 100% 保留
- 用户界面和交互禁止任何改变
- API 调用和数据格式保持不变

## 验收标准

### 成功标准
1. ✅ QuestionList.vue 总行数从 3137 行降至约 900 行（template 700 + script 200）
2. ✅ 所有 5 个 composable 文件创建完成
3. ✅ 组件功能测试 100% 通过
4. ✅ 无 TypeScript/ESLint 错误
5. ✅ 代码格式化符合项目规范

### 失败标准
1. ❌ Template 或 Style 被修改
2. ❌ 任何现有功能失效
3. ❌ 引入新的 Bug
4. ❌ 主文件 script 行数超过 300 行
