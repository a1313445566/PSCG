# QuestionList Composable 重构 - 实施计划

## [x] Task 1: 提取 useQuestionTable.js
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 将数据加载、格式化、行内编辑、删除撤销逻辑提取到 `src/composables/useQuestionTable.js`
  - 保持现有逻辑 100% 不变
  - 接收 props 作为参数，返回需要的状态和方法
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4
- **Test Requirements**:
  - `programmatic` TR-1.1: 文件存在于 `src/composables/useQuestionTable.js`
  - `programmatic` TR-1.2: 导出 `useQuestionTable` 函数
  - `programmatic` TR-1.3: 包含 loadQuestions、formatQuestions、startInlineEdit、saveInlineEdit、deleteQuestionWithUndo 等方法
  - `human-judgement` TR-1.4: 代码逻辑与原代码完全一致
- **Notes**: 此文件是核心逻辑，约 600 行

## [x] Task 2: 提取 useSplitEdit.js
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 将分屏编辑模式、题目编辑、阅读理解题辅助逻辑提取到 `src/composables/useSplitEdit.js`
  - 保持现有逻辑 100% 不变
  - 接收 props 和上下文作为参数
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4
- **Test Requirements**:
  - `programmatic` TR-2.1: 文件存在于 `src/composables/useSplitEdit.js`
  - `programmatic` TR-2.2: 导出 `useSplitEdit` 函数
  - `programmatic` TR-2.3: 包含 openAddPanel、openSplitEdit、closeSplitEdit、saveSplitEdit、阅读理解辅助方法等
  - `human-judgement` TR-2.4: 代码逻辑与原代码完全一致
- **Notes**: 此文件是最大的逻辑文件，约 700 行

## [x] Task 3: 提取 useBatchOperations.js
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 将所有批量操作逻辑（批量删除、修改难度、修改类型、移动）提取到 `src/composables/useBatchOperations.js`
  - 保持现有逻辑 100% 不变
  - 接收 selectedQuestionsRef 和 loadQuestionsRef 作为参数
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4
- **Test Requirements**:
  - `programmatic` TR-3.1: 文件存在于 `src/composables/useBatchOperations.js`
  - `programmatic` TR-3.2: 导出 `useBatchOperations` 函数
  - `programmatic` TR-3.3: 包含所有批量操作相关方法和状态
  - `human-judgement` TR-3.4: 代码逻辑与原代码完全一致
- **Notes**: 约 300 行

## [x] Task 4: 提取 useAudioPlayer.js
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 将音频上传、播放控制、进度管理逻辑提取到 `src/composables/useAudioPlayer.js`
  - 保持现有逻辑 100% 不变
  - 此 composable 可被其他组件（如 QuestionCard.vue）复用
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4
- **Test Requirements**:
  - `programmatic` TR-4.1: 文件存在于 `src/composables/useAudioPlayer.js`
  - `programmatic` TR-4.2: 导出 `useAudioPlayer` 函数
  - `programmatic` TR-4.3: 包含所有音频相关状态和方法
  - `human-judgement` TR-4.4: 代码逻辑与原代码完全一致
  - `human-judgement` TR-4.5: API 设计考虑了复用性
- **Notes**: 约 200 行，可跨组件复用

## [x] Task 5: 提取 useQuestionPreview.js
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 将题目预览、数据缓存逻辑提取到 `src/composables/useQuestionPreview.js`
  - 保持现有逻辑 100% 不变
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4
- **Test Requirements**:
  - `programmatic` TR-5.1: 文件存在于 `src/composables/useQuestionPreview.js`
  - `programmatic` TR-5.2: 导出 `useQuestionPreview` 函数
  - `programmatic` TR-5.3: 包含预览相关状态和方法
  - `human-judgement` TR-5.4: 代码逻辑与原代码完全一致
- **Notes**: 约 150 行

## [x] Task 6: 精简 QuestionList.vue 的 script 部分
- **Priority**: P0
- **Depends On**: Task 1, Task 2, Task 3, Task 4, Task 5
- **Description**: 
  - 移除所有已提取到 composable 的代码
  - 只保留组合调用逻辑
  - 确保所有暴露给 template 的变量和函数都正确返回
  - Template 和 Style 完全保持不变
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4, AC-5
- **Test Requirements**:
  - `programmatic` TR-6.1: script 部分从 ~2200 行 精简到 ~320 行 ✅
  - `programmatic` TR-6.2: 正确导入所有 5 个 composable ✅
  - `programmatic` TR-6.3: 所有暴露给 template 的变量和函数都正确返回 ✅
  - `human-judgement` TR-6.4: Template 和 Style 完全未修改 ✅
  - `human-judgement` TR-6.5: 主文件逻辑清晰，只负责组合 ✅
- **Notes**: 最终验证前的关键步骤

## [ ] Task 7: 完整功能测试
- **Priority**: P0
- **Depends On**: Task 6
- **Description**: 
  - 测试所有现有功能是否正常工作
  - 包括：题目列表加载、筛选、行内编辑、删除撤销、分屏编辑、批量操作、音频上传播放、预览等
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `human-judgement` TR-7.1: 题目列表能正常加载和筛选
  - `human-judgement` TR-7.2: 行内编辑功能正常
  - `human-judgement` TR-7.3: 删除撤销功能正常
  - `human-judgement` TR-7.4: 分屏编辑（添加、编辑题目）功能正常
  - `human-judgement` TR-7.5: 所有批量操作功能正常
  - `human-judgement` TR-7.6: 音频上传和播放功能正常
  - `human-judgement` TR-7.7: 题目预览功能正常
  - `human-judgement` TR-7.8: 阅读理解题编辑功能正常
- **Notes**: 完整的端到端验证

## [ ] Task 8: 代码质量检查
- **Priority**: P1
- **Depends On**: Task 7
- **Description**: 
  - 运行 ESLint 和 Prettier 检查
  - 确保无语法错误和代码规范问题
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `programmatic` TR-8.1: `npm run lint` 无错误
  - `programmatic` TR-8.2: `npm run format` 运行成功
- **Notes**: 代码质量验证

## Task Dependencies
- Task 6 depends on Task 1, Task 2, Task 3, Task 4, Task 5
- Task 7 depends on Task 6
- Task 8 depends on Task 7