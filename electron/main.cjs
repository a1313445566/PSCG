const { app, BrowserWindow } = require('electron')
const path = require('path')
const isDev = require('electron-is-dev')

function createWindow() {
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    },
    title: '小学刷题闯关系统'
  })

  // 加载应用
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:5174'  // 开发模式
      : `file://${path.join(__dirname, '../dist/index.html')}`  // 生产模式
  )

  // 开发模式下打开开发者工具
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }
}

// 应用准备就绪后创建窗口
app.whenReady().then(() => {
  createWindow()

  //  macOS 特殊处理
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 关闭所有窗口时退出应用
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
