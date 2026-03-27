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
      // JSON 解析失败，尝试清理各种可能的问题
      let cleanedStr = configStr
        // 清理函数表达式
        .replace(/"(\w+)":\s*\([^)]*\)\s*=>[^,}\]]*/g, '"$1": null')
        .replace(/"(\w+)":\s*function\s*\([^)]*\)\s*\{[^}]*\}/g, '"$1": null')
        // 清理数组中的多余逗号
        .replace(/,\s*([}\]])/g, '$1')
        // 清理字符串中的无效字符
        .replace(/[^\x00-\x7F]/g, '')
        // 确保属性名用双引号包围
        .replace(/([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1 "$2":')
      
      // 再次尝试解析
      try {
        const config = JSON.parse(cleanedStr)
        if (config.type && config.data) {
          return config
        }
      } catch (secondError) {
        // 尝试更激进的清理 - 移除所有非 JSON 字符
        let superCleaned = cleanedStr
          .replace(/[^\{\}\[\]\",:0-9a-zA-Z\s]/g, '')
        
        try {
          const config = JSON.parse(superCleaned)
          if (config.type && config.data) {
            return config
          }
        } catch (thirdError) {
          // 最终失败，记录详细错误
          console.error('[图表] 解析配置失败，原始配置:', configStr)
        }
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
