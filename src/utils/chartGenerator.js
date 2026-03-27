import VChart from '@visactor/vchart'

/**
 * 解析单个图表配置
 */
function parseChartConfig(configStr) {
  try {
    // 尝试标准 JSON 解析
    try {
      const config = JSON.parse(configStr)
      if (config.type && config.data) {
        return config
      }
    } catch (jsonError) {
      // JSON 解析失败，尝试清理函数表达式
      let cleanedStr = configStr
        .replace(/"(\w+)":\s*\([^)]*\)\s*=>[^,}\]]*/g, '"$1": null')
        .replace(/"(\w+)":\s*function\s*\([^)]*\)\s*\{[^}]*\}/g, '"$1": null')
      
      const config = JSON.parse(cleanedStr)
      if (config.type && config.data) {
        return config
      }
    }
  } catch (e) {
    console.error('[图表] 解析配置失败:', e)
  }
  return null
}

/**
 * 从 AI 分析结果中提取所有图表配置
 * @param {string} analysisResult - AI 分析结果
 * @returns {Array} VChart 配置对象数组
 */
export function extractAllChartConfigs(analysisResult) {
  const configs = []
  const regex = /```vchart\s*([\s\S]*?)```/g
  let match
  let index = 0
  
  while ((match = regex.exec(analysisResult)) !== null) {
    const configStr = match[1].trim()
    const config = parseChartConfig(configStr)
    if (config) {
      configs.push({ id: `chart-${index}`, config, fullMatch: match[0] })
      index++
    }
  }
  
  return configs
}

/**
 * 从 AI 分析结果中提取第一个图表配置（兼容旧代码）
 * @param {string} analysisResult - AI 分析结果
 * @returns {object|null} VChart 配置对象 或 null
 */
export function extractChartConfig(analysisResult) {
  const configs = extractAllChartConfigs(analysisResult)
  return configs.length > 0 ? configs[0].config : null
}

export { VChart }
