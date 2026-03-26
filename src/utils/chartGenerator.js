import VChart from '@visactor/vchart'

/**
 * 从 AI 分析结果中提取图表配置
 * @param {string} analysisResult - AI 分析结果
 * @returns {object|null} VChart 配置对象 或 null
 */
export function extractChartConfig(analysisResult) {
  // 提取 AI 返回的完整 VChart 配置
  const vchartBlockMatch = analysisResult.match(/```vchart\s*([\s\S]*?)```/)
  if (vchartBlockMatch) {
    try {
      let configStr = vchartBlockMatch[1].trim()
      
      // 方案1：尝试标准JSON解析
      try {
        const config = JSON.parse(configStr)
        if (config.type && config.data) {
          console.log('[图表] 使用 AI 生成的 VChart 配置（JSON）')
          return config
        }
      } catch (jsonError) {
        // JSON解析失败，尝试清理函数
        console.warn('[图表] JSON解析失败，尝试清理函数表达式')
        
        // 移除所有函数表达式（简单粗暴但有效）
        // 匹配类似 "key": (args) => expression 或 "key": function(args) { body }
        configStr = configStr.replace(/"(\w+)":\s*\([^)]*\)\s*=>[^,}\]]*/g, '"$1": null')
        configStr = configStr.replace(/"(\w+)":\s*function\s*\([^)]*\)\s*\{[^}]*\}/g, '"$1": null')
        
        try {
          const config = JSON.parse(configStr)
          if (config.type && config.data) {
            console.log('[图表] 使用清理后的 VChart 配置')
            return config
          }
        } catch (e) {
          console.error('[图表] 清理后仍无法解析:', e)
        }
      }
    } catch (e) {
      console.error('[图表] 解析 VChart 配置失败:', e)
    }
  }
  
  // 旧格式兼容（简单数据）- 最小化配置，让 VChart 使用默认样式
  const chartBlockMatch = analysisResult.match(/```chart\s*([\s\S]*?)```/)
  if (chartBlockMatch) {
    const chartData = chartBlockMatch[1].trim()
    const lines = chartData.split('\n')
    const values = []
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine) continue
      
      const pairMatch = trimmedLine.match(/^(.+?)[:：]\s*(\d+(?:\.\d+)?)/)
      if (pairMatch) {
        const label = pairMatch[1].trim()
        const value = parseFloat(pairMatch[2])
        if (label.length > 0 && label.length <= 30) {
          values.push({ label, value })
        }
      }
    }
    
    if (values.length >= 2) {
      // 最小配置，让 VChart 自己决定样式
      return {
        type: 'bar',
        data: [{ id: 'data', values }],
        xField: 'label',
        yField: 'value'
      }
    }
  }
  
  return null
}

export { VChart }
