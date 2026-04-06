/**
 * 目录遍历防护中间件
 * 防止通过 ../ 等方式访问非授权目录
 */

const path = require('path')

const createPathTraversalGuard = baseDir => {
  return (req, res, next) => {
    let decodedPath
    try {
      decodedPath = decodeURIComponent(req.path)
    } catch (e) {
      return res.status(400).send('Invalid path encoding')
    }

    const relativePath = decodedPath.replace(/^\/+/, '')
    const normalizedPath = path.normalize(relativePath)
    const resolvedPath = path.resolve(baseDir, normalizedPath)

    if (!resolvedPath.startsWith(baseDir)) {
      console.warn(`[Security] Path traversal attempt blocked: ${req.path} -> ${resolvedPath}`)
      return res.status(403).send('Forbidden')
    }

    next()
  }
}

module.exports = {
  createPathTraversalGuard
}
