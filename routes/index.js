/**
 * 统一路由注册模块
 * 集中管理所有 API 路由
 */

const express = require('express')
const router = express.Router()

const dataRoutes = require('./data')
const settingsRoutes = require('./settings')
const subjectsRoutes = require('./subjects')
const questionsRoutes = require('./questions')
const gradesClassesRoutes = require('./grades-classes')
const usersRoutes = require('./users')
const leaderboardRoutes = require('./leaderboard')
const answerRecordsRoutes = require('./answer-records')
const quizRoutes = require('./quiz')
const analysisRoutes = require('./analysis')
const difficultyRoutes = require('./difficulty')
const backupRoutes = require('./backup')
const errorCollectionRoutes = require('./error-collection')
const adminRoutes = require('./admin')
const uploadRoutes = require('./upload')
const dashboardRoutes = require('./dashboard')
const answerBehaviorRoutes = require('./answer-behavior')
const learningProgressRoutes = require('./learning-progress')
const userStatsRoutes = require('./user-stats')
const chatRoutes = require('./chat')
const healthRoutes = require('./health')
const toolsRoutes = require('./tools')

const routes = [
  { path: '/data', handler: dataRoutes },
  { path: '/settings', handler: settingsRoutes },
  { path: '/subjects', handler: subjectsRoutes },
  { path: '/questions', handler: questionsRoutes },
  { path: '', handler: gradesClassesRoutes, comment: '内部路由: /grades, /classes' },
  { path: '/users', handler: usersRoutes },
  { path: '/leaderboard', handler: leaderboardRoutes },
  { path: '/answer-records', handler: answerRecordsRoutes },
  { path: '/quiz', handler: quizRoutes },
  { path: '/analysis', handler: analysisRoutes },
  { path: '/difficulty', handler: difficultyRoutes },
  { path: '', handler: backupRoutes, comment: '内部路由: /backup, /restore' },
  { path: '/error-collection', handler: errorCollectionRoutes },
  { path: '/admin', handler: adminRoutes },
  { path: '/upload', handler: uploadRoutes },
  { path: '/dashboard', handler: dashboardRoutes },
  { path: '/answer-behavior', handler: answerBehaviorRoutes },
  { path: '/learning-progress', handler: learningProgressRoutes },
  { path: '/user-stats', handler: userStatsRoutes },
  { path: '/chat', handler: chatRoutes },
  { path: '/health', handler: healthRoutes },
  { path: '/tools', handler: toolsRoutes }
]

routes.forEach(({ path, handler }) => {
  router.use(path, handler)
})

module.exports = router
