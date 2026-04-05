/**
 * 全局错误处理模块
 * 处理未捕获异常和未处理的 Promise 拒绝
 */

const setupErrorHandlers = () => {
  process.on('uncaughtException', err => {
    console.error(`【严重】未捕获异常:`, err.message)
    console.error('堆栈信息:', err.stack)

    if (err.message.includes('SQLITE_CANTOPEN') || err.message.includes('database is locked')) {
      console.error('数据库连接失败，5秒后尝试重启...')
      setTimeout(() => {
        process.exit(1)
      }, 5000)
    } else if (
      err.message.includes('EADDRINUSE') ||
      err.message.includes('listen EADDRINUSE') ||
      err.message.includes('ENOENT') ||
      err.message.includes('MODULE_NOT_FOUND')
    ) {
      console.error('严重错误，进程即将退出...')
      process.exit(1)
    } else {
      console.error('未知错误，进程即将退出...')
      setTimeout(() => {
        process.exit(1)
      }, 1000)
    }
  })

  process.on('unhandledRejection', (reason, _promise) => {
    const reasonStr = reason instanceof Error ? reason.message : String(reason)

    console.error(`未处理 Promise 拒绝:`, reasonStr)

    if (reason instanceof Error) {
      console.error('堆栈信息:', reason.stack)
    }

    if (
      reasonStr.includes('ECONNREFUSED') ||
      reasonStr.includes('database') ||
      reasonStr.includes('SQLITE_CANTOPEN') ||
      reasonStr.includes('database is locked')
    ) {
      console.error('致命错误，进程即将退出...')
      process.exit(1)
    } else {
      console.warn('警告: 存在未处理的 Promise 拒绝，请检查代码')
    }
  })
}

module.exports = {
  setupErrorHandlers
}
