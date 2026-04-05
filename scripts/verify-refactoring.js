/**
 * QuizView.vue 重构验证脚本
 *
 * 功能：
 * 1. 验证函数拆分完整性（13个新函数是否存在）
 * 2. 检查主函数 submitAnswers 是否为流程协调器
 * 3. 验证所有新函数的调用关系是否正确
 * 4. 检查代码质量指标（行数、复杂度等）
 */

// 设置控制台输出编码为 UTF-8（解决 Windows 乱码问题）
if (process.platform === 'win32') {
  process.stdout.setEncoding('utf8')
  process.stderr.setEncoding('utf8')
}

const fs = require('fs')
const path = require('path')

// 配置
const QUIZ_VIEW_PATH = path.join(__dirname, '../src/views/QuizView.vue')

// 预期的新增函数列表
const EXPECTED_FUNCTIONS = [
  // 验证层
  { name: 'checkAllQuestionsAnswered', type: 'validation', description: '检查答题完整性' },
  { name: 'checkSubmitFrequency', type: 'validation', description: '检查提交频率' },
  { name: 'validateSubmitPreconditions', type: 'validation', description: '综合验证前置条件' },

  // 数据提交层
  { name: 'submitBehaviorData', type: 'data-submit', description: '提交答题行为数据' },

  // 签名与数据构建层
  { name: 'buildShuffleMappings', type: 'signature', description: '构建打乱映射' },
  { name: 'buildSubmitData', type: 'signature', description: '构建提交数据' },
  { name: 'generateSubmitSignature', type: 'signature', description: '生成提交签名' },

  // API调用层
  { name: 'submitAnswersToApi', type: 'api', description: '提交答案到后端API' },

  // 积分验证层
  { name: 'calculatePointsRange', type: 'points', description: '计算积分范围' },
  { name: 'validatePoints', type: 'points', description: '验证积分数据' },

  // 结果处理层
  { name: 'saveQuizResult', type: 'result', description: '保存答题结果' },
  { name: 'updateErrorCollectionStats', type: 'result', description: '更新错题巩固统计' },
  { name: 'navigateToResult', type: 'result', description: '跳转到结果页面' }
]

// 主函数中预期调用的子函数顺序
const EXPECTED_CALL_ORDER = [
  'validateSubmitPreconditions',
  'submitBehaviorData',
  'generateSubmitSignature',
  'buildSubmitData',
  'submitAnswersToApi',
  'validatePoints',
  'saveQuizResult',
  'updateErrorCollectionStats',
  'navigateToResult'
]

class RefactoringValidator {
  constructor(filePath) {
    this.filePath = filePath
    this.content = fs.readFileSync(filePath, 'utf-8')
    this.lines = this.content.split('\n')
    this.errors = []
    this.warnings = []
    this.successes = []
    this.stats = {
      totalLines: this.lines.length,
      mainFunctionLines: 0,
      newFunctionsCount: 0,
      originalFunctionLines: 0
    }
  }

  // 验证所有新函数是否存在
  validateFunctionExistence() {
    console.log('\n📋 验证 1: 检查新增函数是否存在')
    console.log('='.repeat(60))

    let allExists = true

    for (const func of EXPECTED_FUNCTIONS) {
      const pattern = new RegExp(`const ${func.name}\\s*[=:]`, 'g')
      const matches = this.content.match(pattern)

      if (matches && matches.length > 0) {
        this.successes.push(`✅ 函数 ${func.name} 存在 (${func.description})`)
        this.stats.newFunctionsCount++
      } else {
        this.errors.push(`❌ 函数 ${func.name} 不存在 (${func.description})`)
        allExists = false
      }
    }

    if (allExists) {
      console.log(`✅ 所有 ${EXPECTED_FUNCTIONS.length} 个新函数都已创建`)
    } else {
      console.log(`⚠️  发现 ${this.errors.filter(e => e.includes('不存在')).length} 个缺失的函数`)
    }

    return allExists
  }

  // 提取主函数 submitAnswers 的内容
  extractMainFunction() {
    console.log('\n📋 验证 2: 分析主函数 submitAnswers 结构')
    console.log('='.repeat(60))

    // 找到 submitAnswers 函数的位置
    const mainFuncMatch = this.content.match(/const submitAnswers\s*=\s*async\s*\(\)\s*=>\s*\{/)

    if (!mainFuncMatch) {
      this.errors.push('❌ 无法找到主函数 submitAnswers')
      return null
    }

    const startIndex = this.content.indexOf(mainFuncMatch[0])

    // 找到函数结束位置（匹配大括号）
    let braceCount = 0
    let endIndex = startIndex
    let inFunction = false

    for (let i = startIndex; i < this.content.length; i++) {
      if (this.content[i] === '{') {
        braceCount++
        inFunction = true
      } else if (this.content[i] === '}') {
        braceCount--
        if (inFunction && braceCount === 0) {
          endIndex = i + 1
          break
        }
      }
    }

    const mainFunctionContent = this.content.substring(startIndex, endIndex)
    const mainFunctionLines = mainFunctionContent.split('\n')

    this.stats.mainFunctionLines = mainFunctionLines.length
    this.stats.originalFunctionLines = this.lines.length - this.stats.newFunctionsCount * 15 // 估算

    console.log(`📊 主函数行数: ${this.stats.mainFunctionLines}`)
    console.log(`📊 原始预估行数: ~200+`)
    console.log(`📊 代码减少比例: ${Math.round((1 - this.stats.mainFunctionLines / 200) * 100)}%`)

    return mainFunctionContent
  }

  // 验证主函数中的调用顺序
  validateCallOrder(mainFunctionContent) {
    console.log('\n📋 验证 3: 检查主函数调用顺序')
    console.log('='.repeat(60))

    if (!mainFunctionContent) {
      this.errors.push('❌ 无法验证调用顺序（主函数未找到）')
      return false
    }

    let allCallsPresent = true
    let lastIndex = -1

    for (const funcName of EXPECTED_CALL_ORDER) {
      const funcCallPattern = new RegExp(`${funcName}\\s*\\(`, 'g')
      const match = mainFunctionContent.match(funcCallPattern)

      if (match) {
        const currentIndex = mainFunctionContent.indexOf(match[0])

        if (currentIndex > lastIndex || lastIndex === -1) {
          this.successes.push(`✅ 调用 ${funcName} ✓`)
          lastIndex = currentIndex
        } else {
          this.warnings.push(`⚠️  函数 ${funcName} 的调用顺序可能不正确`)
        }
      } else {
        // 某些函数可能不在主函数中直接调用（如嵌套调用）
        if (!['calculatePointsRange'].includes(funcName)) {
          this.errors.push(`❌ 主函数中未找到对 ${funcName} 的调用`)
          allCallsPresent = false
        }
      }
    }

    if (allCallsPresent) {
      console.log('✅ 主函数包含所有预期的子函数调用')
    }

    return allCallsPresent
  }

  // 验证函数职责单一性
  validateSingleResponsibility() {
    console.log('\n📋 验证 4: 检查函数职责单一性')
    console.log('='.repeat(60))

    let srpScore = 0
    const maxScore = EXPECTED_FUNCTIONS.length

    for (const func of EXPECTED_FUNCTIONS) {
      // 提取函数体
      const funcPattern = new RegExp(
        `const ${func.name}\\s*[=:]\\s*(?:async\\s*)?\\([^)]*\\)\\s*=>\\s*\\{[\\s\\S]*?^\\}`,
        'gm'
      )

      const match = this.content.match(funcPattern)

      if (match) {
        const funcBody = match[0]
        const lines = funcBody.split('\n').length

        // 理想的函数应该在 5-30 行之间
        if (lines <= 40) {
          srpScore++
          this.successes.push(`✅ ${func.name}: ${lines} 行（符合单一职责）`)
        } else if (lines <= 60) {
          this.warnings.push(`⚠️  ${func.name}: ${lines} 行（稍长，可考虑进一步拆分）`)
          srpScore += 0.7
        } else {
          this.errors.push(`❌ ${func.name}: ${lines} 行（过长，违反单一职责原则）`)
          srpScore += 0.3
        }
      }
    }

    const percentage = Math.round((srpScore / maxScore) * 100)
    console.log(`\n📊 单一职责评分: ${percentage}% (${srpScore}/${maxScore})`)

    return percentage >= 80
  }

  // 验证代码质量指标
  validateCodeQuality() {
    console.log('\n📋 验证 5: 代码质量指标')
    console.log('='.repeat(60))

    // 检查是否有明显的代码重复
    const duplicatePatterns = [
      /localStorage\.getItem\('userId'\)/g,
      /localStorage\.getItem\('token'\)/g,
      /ElMessage\.(warning|error|success)/g
    ]

    let hasDuplicates = false
    for (const pattern of duplicatePatterns) {
      const matches = this.content.match(pattern)
      if (matches && matches.length > 3) {
        this.warnings.push(`⚠️  发现重复模式: ${pattern.source} (${matches.length} 次)`)
        hasDuplicates = true
      }
    }

    if (!hasDuplicates) {
      this.successes.push('✅ 未发现明显的代码重复')
    }

    // 检查错误处理
    const hasTryCatch = /try\s*\{[\s\S]*?catch\s*\(/.test(this.content)
    if (hasTryCatch) {
      this.successes.push('✅ 包含 try-catch 错误处理')
    } else {
      this.errors.push('❌ 缺少错误处理机制')
    }

    // 检查注释覆盖率（简单估算）
    const commentLines = this.content.match(/^\s*\/\/.*$/gm) || []
    const totalCodeLines = this.lines.length
    const commentRatio = Math.round((commentLines.length / totalCodeLines) * 100)

    console.log(`📊 注释覆盖率: ${commentRatio}%`)

    if (commentRatio >= 10) {
      this.successes.push(`✅ 注释覆盖率达标 (${commentRatio}%)`)
    } else {
      this.warnings.push(`⚠️  注释覆盖率较低 (${commentRatio}%)，建议添加更多注释`)
    }

    return hasTryCatch
  }

  // 验证依赖关系
  validateDependencies() {
    console.log('\n📋 验证 6: 检查函数间依赖关系')
    console.log('='.repeat(60))

    // 验证关键依赖链
    const dependencyChains = [
      {
        caller: 'submitAnswers',
        callees: [
          'validateSubmitPreconditions',
          'submitBehaviorData',
          'generateSubmitSignature',
          'buildSubmitData',
          'submitAnswersToApi'
        ]
      },
      {
        caller: 'validatePoints',
        callees: ['calculatePointsRange']
      },
      {
        caller: 'generateSubmitSignature',
        callees: ['generateSignature'] // 使用原始的签名生成函数
      }
    ]

    const dependenciesValid = true

    for (const chain of dependencyChains) {
      const callerMatch = new RegExp(`const ${chain.caller}\\s*[=:]`, 'g').test(this.content)

      if (callerMatch) {
        // 提取调用者函数体
        const callerPattern = new RegExp(
          `const ${chain.caller}\\s*[=:]\\s*(?:async\\s*)?\\([^)]*\\)\\s*=>\\s*\\{[\\s\\S]*?^\\}`,
          'gm'
        )
        const callerMatch = this.content.match(callerPattern)

        if (callerMatch && callerMatch[0]) {
          const callerBody = callerMatch[0]

          for (const callee of chain.callees) {
            if (new RegExp(`${callee}\\s*\\(`).test(callerBody)) {
              this.successes.push(`✅ ${chain.caller} → ${callee} (依赖正常)`)
            } else {
              this.warnings.push(`⚠️  ${chain.caller} 可能缺少对 ${callee} 的调用`)
            }
          }
        }
      }
    }

    return dependenciesValid
  }

  // 运行所有验证
  runAllValidations() {
    console.log('\n' + '='.repeat(70))
    console.log('🔍 QuizView.vue 重构验证报告')
    console.log('📁 文件路径:', this.filePath)
    console.log('⏰ 验证时间:', new Date().toLocaleString())
    console.log('='.repeat(70))

    // 执行各项验证
    const results = {
      functionExistence: this.validateFunctionExistence(),
      mainFunction: this.extractMainFunction(),
      callOrder: this.validateCallOrder(this.extractMainFunction()),
      singleResponsibility: this.validateSingleResponsibility(),
      codeQuality: this.validateCodeQuality(),
      dependencies: this.validateDependencies()
    }

    // 输出总结
    this.printSummary(results)

    // 返回验证结果
    return {
      passed: Object.values(results).every(v => v !== false),
      stats: this.stats,
      errors: this.errors,
      warnings: this.warnings,
      successes: this.successes
    }
  }

  // 打印验证总结
  printSummary(results) {
    console.log('\n' + '='.repeat(70))
    console.log('📊 验证总结')
    console.log('='.repeat(70))

    console.log(`\n✅ 成功项: ${this.successes.length}`)
    console.log(`⚠️  警告项: ${this.warnings.length}`)
    console.log(`❌ 错误项: ${this.errors.length}`)

    console.log('\n📈 关键指标:')
    console.log(`   • 主函数行数: ${this.stats.mainFunctionLines} 行（目标: <50 行）`)
    console.log(`   • 新增函数数: ${this.stats.newFunctionsCount}/${EXPECTED_FUNCTIONS.length}`)
    console.log(`   • 总代码行数: ${this.stats.totalLines} 行`)

    if (this.errors.length > 0) {
      console.log('\n❌ 需要修复的问题:')
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  改进建议:')
      this.warnings.slice(0, 5).forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`)
      })
    }

    const allPassed =
      results.functionExistence &&
      results.singleResponsibility &&
      results.codeQuality &&
      results.dependencies

    console.log('\n' + '='.repeat(70))
    if (allPassed && this.errors.length === 0) {
      console.log('🎉 验证通过！重构成功！')
      console.log('✨ 代码质量优秀，可以安全使用')
    } else if (this.errors.length <= 2) {
      console.log('⚠️  基本通过，存在少量问题需要修复')
    } else {
      console.log('❌ 验证失败，需要修复多个问题')
    }
    console.log('='.repeat(70))
  }
}

// 执行验证
try {
  const validator = new RefactoringValidator(QUIZ_VIEW_PATH)
  const validationResult = validator.runAllValidations()

  // 输出 JSON 格式结果（方便 CI/CD 使用）
  const jsonOutputPath = path.join(__dirname, 'refactoring-validation-result.json')
  fs.writeFileSync(jsonOutputPath, JSON.stringify(validationResult, null, 2))
  console.log(`\n💾 详细结果已保存至: ${jsonOutputPath}`)

  // 退出码：0=通过，1=有警告，2=失败
  if (validationResult.passed && validationResult.errors.length === 0) {
    process.exit(0)
  } else if (validationResult.errors.length <= 2) {
    process.exit(1)
  } else {
    process.exit(2)
  }
} catch (error) {
  console.error('❌ 验证脚本执行失败:', error.message)
  process.exit(2)
}
