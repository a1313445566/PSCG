---
description: PSCG 智能题库系统测试规范
alwaysApply: false
enabled: true
updatedAt: 2026-03-28T00:00:00.000Z
provider:
---

# 测试规范

## 1. 概述

测试是确保 PSCG 系统质量和稳定性的重要环节。本规范旨在定义系统的测试策略、测试类型、测试流程以及测试工具的使用，以保证系统在开发和部署过程中的质量。

## 2. 测试策略

### 2.1 测试层次

**测试层次**：

- **单元测试**：测试单个函数或组件
- **集成测试**：测试模块间的交互
- **端到端测试**：测试完整的用户流程
- **性能测试**：测试系统性能
- **安全测试**：测试系统安全性

### 2.2 测试覆盖率

**覆盖率目标**：

- 单元测试：≥ 80%
- 集成测试：≥ 60%
- 端到端测试：关键路径全覆盖

### 2.3 测试环境

**环境配置**：

- **开发环境**：本地开发机器
- **测试环境**：专门的测试服务器
- **预生产环境**：模拟生产环境
- **生产环境**：实际部署环境

## 3. 前端测试

### 3.1 单元测试

**测试工具**：

- Vitest
- Jest
- Vue Test Utils

**测试内容**：

- 组件渲染
- Props 传递
- 事件触发
- 计算属性
- 响应式数据

**代码示例**：

```javascript
import { mount } from '@vue/test-utils'
import QuestionCard from '@/components/quiz/QuestionCard.vue'

describe('QuestionCard', () => {
  test('renders correctly', () => {
    const wrapper = mount(QuestionCard, {
      props: {
        question: {
          id: 1,
          title: '测试题目',
          options: ['选项1', '选项2', '选项3', '选项4'],
          correctAnswer: 0
        }
      }
    })
    expect(wrapper.text()).toContain('测试题目')
  })

  test('emits select event when option is clicked', async () => {
    const wrapper = mount(QuestionCard, {
      props: {
        question: {
          id: 1,
          title: '测试题目',
          options: ['选项1', '选项2'],
          correctAnswer: 0
        }
      }
    })
    await wrapper.find('.option').trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
  })
})
```

### 3.2 端到端测试

**测试工具**：

- Cypress
- Playwright

**测试场景**：

- 用户登录
- 答题流程
- 后台管理操作
- 数据导入导出

**代码示例**：

```javascript
// Cypress 测试
describe('答题流程', () => {
  it('用户可以完成答题并查看结果', () => {
    cy.visit('/quiz')
    cy.get('.start-quiz-btn').click()

    // 回答第一题
    cy.get('.option').first().click()
    cy.get('.next-btn').click()

    // 回答第二题
    cy.get('.option').eq(1).click()
    cy.get('.submit-btn').click()

    // 查看结果
    cy.get('.result-score').should('be.visible')
  })
})
```

### 3.3 组件测试

**测试内容**：

- 组件生命周期
- 组件间通信
- 条件渲染
- 表单验证

**代码示例**：

```javascript
import { mount } from '@vue/test-utils'
import LoginForm from '@/components/common/LoginForm.vue'

describe('LoginForm', () => {
  test('表单验证失败时显示错误信息', async () => {
    const wrapper = mount(LoginForm)
    await wrapper.find('button[type="submit"]').trigger('click')
    expect(wrapper.text()).toContain('请输入用户名')
    expect(wrapper.text()).toContain('请输入密码')
  })

  test('表单验证成功时提交数据', async () => {
    const wrapper = mount(LoginForm)
    await wrapper.find('input[name="username"]').setValue('admin')
    await wrapper.find('input[name="password"]').setValue('123456')
    await wrapper.find('button[type="submit"]').trigger('click')
    expect(wrapper.emitted('submit')).toBeTruthy()
  })
})
```

## 4. 后端测试

### 4.1 单元测试

**测试工具**：

- Jest
- Mocha
- Chai

**测试内容**：

- API 路由
- 服务层函数
- 中间件
- 工具函数

**代码示例**：

```javascript
const request = require('supertest')
const app = require('../../server.cjs')

describe('API 测试', () => {
  test('GET /api/subjects 返回学科列表', async () => {
    const response = await request(app).get('/api/subjects')
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
  })

  test('POST /api/questions 创建题目', async () => {
    const response = await request(app)
      .post('/api/questions')
      .send({
        title: '测试题目',
        subjectId: 1,
        options: ['选项1', '选项2'],
        correctAnswer: 0
      })
    expect(response.statusCode).toBe(201)
    expect(response.body.id).toBeDefined()
  })
})
```

### 4.2 数据库测试

**测试内容**：

- 数据库连接
- 查询操作
- 事务处理
- 数据验证

**代码示例**：

```javascript
const db = require('../../services/database')

describe('数据库测试', () => {
  test('查询用户数据', async () => {
    const users = await db.query('SELECT * FROM users LIMIT 10')
    expect(Array.isArray(users)).toBe(true)
  })

  test('插入和删除数据', async () => {
    // 插入测试数据
    const insertResult = await db.query('INSERT INTO users (name, email) VALUES (?, ?)', [
      '测试用户',
      'test@example.com'
    ])
    const userId = insertResult.insertId

    // 验证数据存在
    const user = await db.query('SELECT * FROM users WHERE id = ?', [userId])
    expect(user.length).toBe(1)

    // 删除测试数据
    await db.query('DELETE FROM users WHERE id = ?', [userId])
    const deletedUser = await db.query('SELECT * FROM users WHERE id = ?', [userId])
    expect(deletedUser.length).toBe(0)
  })
})
```

### 4.3 中间件测试

**测试内容**：

- 认证中间件
- 限流中间件
- CSRF 中间件
- 错误处理中间件

**代码示例**：

```javascript
const request = require('supertest')
const app = require('../../server.cjs')

describe('中间件测试', () => {
  test('未授权访问需要认证的路由', async () => {
    const response = await request(app).get('/api/admin/users')
    expect(response.statusCode).toBe(401)
    expect(response.body.error).toBe('未授权')
  })

  test('限流测试', async () => {
    // 发送多个请求以触发限流
    for (let i = 0; i < 10; i++) {
      await request(app).get('/api/subjects')
    }
    const response = await request(app).get('/api/subjects')
    expect(response.statusCode).toBe(429) // Too Many Requests
  })
})
```

## 5. 性能测试

### 5.1 负载测试

**测试工具**：

- Apache JMeter
- LoadRunner
- k6

**测试场景**：

- 并发用户测试
- 长时间运行测试
- 峰值负载测试

**测试指标**：

- 响应时间
- 吞吐量
- 错误率
- 资源使用率

**代码示例**：

```javascript
// k6 测试脚本
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // 逐渐增加到 50 个用户
    { duration: '1m', target: 50 }, // 保持 50 个用户
    { duration: '30s', target: 100 }, // 增加到 100 个用户
    { duration: '1m', target: 100 }, // 保持 100 个用户
    { duration: '30s', target: 0 } // 逐渐减少到 0 个用户
  ]
}

export default function () {
  const response = http.get('https://pscg.example.com/api/subjects')
  check(response, {
    'status is 200': r => r.status === 200,
    'response time < 500ms': r => r.timings.duration < 500
  })
  sleep(1)
}
```

### 5.2 前端性能测试

**测试工具**：

- Lighthouse
- WebPageTest
- Chrome DevTools

**测试指标**：

- 首屏加载时间
- 首次内容绘制 (FCP)
- 最大内容绘制 (LCP)
- 累积布局偏移 (CLS)
- 首次输入延迟 (FID)

**代码示例**：

```javascript
// Lighthouse CI 配置
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: ['http://localhost:5173'],
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'first-contentful-paint': ['warn', { maxNumericValue: 1000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }]
      }
    }
  }
}
```

## 6. 安全测试

### 6.1 漏洞扫描

**测试工具**：

- OWASP ZAP
- Nmap
- Burp Suite

**测试内容**：

- SQL 注入
- XSS 攻击
- CSRF 攻击
- 认证绕过
- 权限提升

**代码示例**：

```bash
# 使用 OWASP ZAP 进行扫描
zap-cli quick-scan --self-contained --start-options "-config api.disablekey=true" https://pscg.example.com
```

### 6.2 代码安全扫描

**测试工具**：

- SonarQube
- Snyk
- npm audit

**测试内容**：

- 代码漏洞
- 依赖包漏洞
- 安全最佳实践

**代码示例**：

```bash
# 使用 npm audit 检查依赖包漏洞
npm audit

# 使用 Snyk 检查代码安全
npx snyk test
```

## 7. 测试流程

### 7.1 开发阶段测试

**流程**：

1. 编写单元测试
2. 运行测试确认功能正常
3. 提交代码前运行完整测试套件
4. 代码审查

**工具**：

- Git hooks (pre-commit, pre-push)
- CI/CD pipeline

**代码示例**：

```bash
# pre-commit 钩子
#!/bin/bash

# 运行单元测试
npm test

if [ $? -ne 0 ]; then
  echo "测试失败，请修复后再提交"
  exit 1
fi

echo "测试通过，可以提交"
exit 0
```

### 7.2 集成测试

**流程**：

1. 合并代码到开发分支
2. 运行集成测试
3. 部署到测试环境
4. 进行端到端测试

**工具**：

- Jenkins
- GitHub Actions
- GitLab CI

**代码示例**：

```yaml
# GitHub Actions 配置
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 16
      - run: npm install
      - run: npm test
      - run: npm run build
```

### 7.3 回归测试

**流程**：

1. 检测代码变更
2. 运行相关测试
3. 确保现有功能正常
4. 验证修复效果

**工具**：

- 测试覆盖率工具
- 变更检测工具

## 8. 测试数据管理

### 8.1 测试数据准备

**数据类型**：

- 单元测试数据
- 集成测试数据
- 端到端测试数据
- 性能测试数据

**管理策略**：

- 使用测试数据生成工具
- 数据库种子文件
- 测试数据隔离

**代码示例**：

```javascript
// 测试数据生成
const generateTestData = () => {
  return {
    users: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `用户${i + 1}`,
      email: `user${i + 1}@example.com`
    })),
    questions: Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      title: `测试题目${i + 1}`,
      subjectId: (i % 5) + 1,
      options: ['选项1', '选项2', '选项3', '选项4'],
      correctAnswer: i % 4
    }))
  }
}
```

### 8.2 数据清理

**清理策略**：

- 测试后自动清理
- 事务回滚
- 独立测试数据库

**代码示例**：

```javascript
// 测试数据清理
afterEach(async () => {
  await db.query('DELETE FROM users WHERE email LIKE ?', ['test%'])
  await db.query('DELETE FROM questions WHERE title LIKE ?', ['测试%'])
})
```

## 9. 测试报告

### 9.1 报告生成

**报告类型**：

- 单元测试报告
- 覆盖率报告
- 性能测试报告
- 安全测试报告

**工具**：

- Jest 报告
- Istanbul 覆盖率报告
- JMeter 报告
- OWASP ZAP 报告

**代码示例**：

```bash
# 生成测试覆盖率报告
npm test -- --coverage

# 生成性能测试报告
jmeter -n -t performance-test.jmx -l results.jtl -e -o reports
```

### 9.2 报告分析

**分析内容**：

- 测试通过率
- 覆盖率分析
- 性能瓶颈
- 安全漏洞

**改进措施**：

- 修复失败的测试
- 增加测试覆盖率
- 优化性能问题
- 修复安全漏洞

## 10. 测试最佳实践

### 10.1 代码示例

**单元测试最佳实践**：

```javascript
// 正确：测试单个函数的行为
const { calculateScore } = require('../utils/quiz')

describe('calculateScore', () => {
  test('计算正确答案的分数', () => {
    const answers = [0, 1, 2, 3]
    const correctAnswers = [0, 1, 2, 3]
    const score = calculateScore(answers, correctAnswers)
    expect(score).toBe(100) // 100%
  })

  test('计算部分正确的分数', () => {
    const answers = [0, 1, 2, 3]
    const correctAnswers = [0, 1, 3, 2]
    const score = calculateScore(answers, correctAnswers)
    expect(score).toBe(50) // 50%
  })

  test('计算全错的分数', () => {
    const answers = [0, 1, 2, 3]
    const correctAnswers = [1, 2, 3, 0]
    const score = calculateScore(answers, correctAnswers)
    expect(score).toBe(0) // 0%
  })
})
```

**集成测试最佳实践**：

```javascript
const request = require('supertest')
const app = require('../../server.cjs')

describe('答题流程集成测试', () => {
  let userId
  let quizId

  beforeAll(async () => {
    // 创建测试用户
    const userResponse = await request(app)
      .post('/api/users')
      .send({ name: '测试用户', email: 'test@example.com', password: '123456' })
    userId = userResponse.body.id

    // 创建测试题目
    await request(app)
      .post('/api/questions')
      .send({
        title: '测试题目1',
        subjectId: 1,
        options: ['选项1', '选项2', '选项3', '选项4'],
        correctAnswer: 0
      })
  })

  test('用户可以创建答题会话并提交答案', async () => {
    // 创建答题会话
    const quizResponse = await request(app)
      .post('/api/quiz')
      .send({ userId, subjectId: 1, questionCount: 1 })
    quizId = quizResponse.body.id

    // 提交答案
    const submitResponse = await request(app)
      .post(`/api/quiz/${quizId}/submit`)
      .send({ answers: [0] })

    expect(submitResponse.statusCode).toBe(200)
    expect(submitResponse.body.score).toBe(100)
  })

  afterAll(async () => {
    // 清理测试数据
    await request(app).delete(`/api/users/${userId}`)
    await request(app).delete(`/api/quiz/${quizId}`)
  })
})
```

### 10.2 注意事项

- 测试应该是独立的，不依赖于其他测试的结果
- 测试应该覆盖正常场景和异常场景
- 测试代码应该清晰、简洁、易于理解
- 测试应该运行快速，以便频繁执行
- 测试应该模拟真实的使用场景
- 测试应该随着代码的变更而更新
- 测试应该与 CI/CD 流程集成

## 11. 测试工具配置

### 11.1 前端测试配置

**Vitest 配置**：

```javascript
// vitest.config.js
export default {
  test: {
    environment: 'jsdom',
    coverage: {
      reporter: ['text', 'json', 'html'],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    }
  }
}
```

**Cypress 配置**：

```javascript
// cypress.config.js
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on, config) {
      // 自定义事件
    }
  }
})
```

### 11.2 后端测试配置

**Jest 配置**：

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: './coverage',
  collectCoverageFrom: ['routes/**/*.js', 'services/**/*.js', 'middleware/**/*.js']
}
```

## 12. 文档参考

- 前端测试代码：`src/tests/`
- 后端测试代码：`tests/`
- 测试数据：`tests/data/`
- 测试报告：`DOCS/测试报告/`
- 性能测试脚本：`tests/performance/`
- 安全测试脚本：`tests/security/`
