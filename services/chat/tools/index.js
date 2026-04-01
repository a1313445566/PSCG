/**
 * 工具注册中心（重构版）
 * 文件: services/chat/tools/index.js
 * 功能: 注册所有工具，移除 LangChain 依赖
 */

const { toOpenAITools, createExecutors } = require('./toolUtils')

// 导入所有工具（已重构为纯对象）
const studentStatsTool = require('./studentStatsTool')
const classFullAnalysisTool = require('./classFullAnalysisTool')
const classAnalysisTool = require('./classAnalysisTool')
const errorAnalysisTool = require('./errorAnalysisTool')
const subjectProgressTool = require('./subjectProgressTool')
const questionInfoTool = require('./questionInfoTool')
const systemOverviewTool = require('./systemOverviewTool')
const timeTrendTool = require('./timeTrendTool')
const weakPointsTool = require('./weakPointsTool')
const wrongQuestionsTool = require('./wrongQuestionsTool')
const { questionAnalysisTool, wrongAnswerPatternTool } = require('./questionAnalysisTool')

// ✅ 小学教育核心工具
const studentAlertTool = require('./studentAlertTool')
const knowledgePointMasteryTool = require('./knowledgePointMasteryTool')
const personalizedRecommendationTool = require('./personalizedRecommendationTool')
const classComparisonTool = require('./classComparisonTool')
const learningPathTool = require('./learningPathTool')

// ✅ 题库深度分析工具
const getSubjectListTool = require('./getSubjectListTool')
const getSubjectDetailTool = require('./getSubjectDetailTool')
const getSubjectQuestionsTool = require('./getSubjectQuestionsTool')
const getQuestionAnswerAnalysisTool = require('./getQuestionAnswerAnalysisTool')
const getStudentAnswerDetailTool = require('./getStudentAnswerDetailTool')

// 注册所有工具
const allTools = [
  studentStatsTool,
  classFullAnalysisTool,
  classAnalysisTool,
  errorAnalysisTool,
  subjectProgressTool,
  questionInfoTool,
  systemOverviewTool,
  timeTrendTool,
  weakPointsTool,
  wrongQuestionsTool,
  questionAnalysisTool,
  wrongAnswerPatternTool,
  // 小学教育核心工具
  studentAlertTool,
  knowledgePointMasteryTool,
  personalizedRecommendationTool,
  classComparisonTool,
  learningPathTool,
  // 题库深度分析工具
  getSubjectListTool,
  getSubjectDetailTool,
  getSubjectQuestionsTool,
  getQuestionAnswerAnalysisTool,
  getStudentAnswerDetailTool
]

// 导出 OpenAI 格式工具定义（已优化 Token）
const openaiTools = toOpenAITools(allTools)

// 导出工具执行器
const toolExecutors = createExecutors(allTools)

module.exports = {
  tools: allTools,
  openaiTools,
  toolExecutors
}
