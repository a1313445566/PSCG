/**
 * 工具定义工具函数
 * 文件: services/chat/tools/toolUtils.js
 * 功能: 简化工具定义，移除 LangChain 依赖
 */

const z = require('zod')

/**
 * 定义工具（替代 LangChain 的 tool()）
 */
function defineTool(config) {
  return {
    name: config.name,
    description: config.description,
    schema: config.schema,
    func: config.handler
  }
}

/**
 * Zod Schema → JSON Schema（OpenAI 格式）
 * 优化版本：减少冗余字段，降低 Token 消耗
 */
function zodToJsonSchema(zodSchema) {
  const schema = zodSchema._def

  const result = {
    type: 'object',
    properties: {},
    required: []
  }

  if (schema.shape) {
    Object.entries(schema.shape).forEach(([key, value]) => {
      const def = value._def
      const prop = { type: getJsonType(def.typeName) }

      // 只在有值时添加描述（减少 Token）
      if (def.description && def.description.length <= 50) {
        prop.description = def.description
      }

      // 枚举值（减少描述长度）
      if (def.typeName === 'ZodString' && def.checks) {
        const enumCheck = def.checks.find(c => c.kind === 'enum')
        if (enumCheck) {
          prop.enum = enumCheck.value
        }
      }

      result.properties[key] = prop

      // 必填字段
      if (!def.isOptional && !def.defaultValue !== undefined) {
        result.required.push(key)
      }
    })
  }

  return result
}

/**
 * 获取 JSON Schema 类型
 */
function getJsonType(typeName) {
  const typeMap = {
    ZodString: 'string',
    ZodNumber: 'number',
    ZodBoolean: 'boolean',
    ZodArray: 'array',
    ZodObject: 'object',
    ZodNull: 'null',
    ZodOptional: 'string'
  }
  return typeMap[typeName] || 'string'
}

/**
 * 批量将工具转换为 OpenAI 格式
 */
function toOpenAITools(tools) {
  return tools.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      // 截断过长描述（节省 Token）
      description:
        t.description.length > 200 ? t.description.substring(0, 200) + '...' : t.description,
      parameters: t.schema ? zodToJsonSchema(t.schema) : { type: 'object', properties: {} }
    }
  }))
}

/**
 * 创建工具执行器映射
 */
function createExecutors(tools) {
  const executors = {}
  tools.forEach(t => {
    executors[t.name] = t.func
  })
  return executors
}

module.exports = {
  defineTool,
  zodToJsonSchema,
  toOpenAITools,
  createExecutors
}
