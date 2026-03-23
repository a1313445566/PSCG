const responseTime = (req, res, next) => {
  const start = Date.now();
  
  // 保存原始的end方法
  const originalEnd = res.end;
  
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    // 记录响应时间和状态码
    const logData = {
      timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || ''
    };
    
    // 记录慢查询（超过500ms）
    if (duration > 500) {
      console.warn(`⚠️ SLOW API: ${logData.method} ${logData.url} - ${logData.duration} (${logData.statusCode})`);
    }
    
    // 记录所有请求（仅在开发环境或需要时）
    if (process.env.NODE_ENV === 'development') {
      console.log(`API: ${logData.method} ${logData.url} - ${logData.duration} (${logData.statusCode})`);
    }
    
    // 调用原始的end方法
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

module.exports = responseTime;