# TRAE 个人规则（User Rules）

> 适用范围：所有项目 | 全局生效  
> 版本：v2.0 | 最后更新：2026-04-05  
> 优先级：**低于项目规则**  
> 参考标准：飞书 TRAE Rules 最佳实践 + 行业提示词工程规范

---

## 一、交互与输出规范

### 1.1 语言规范
- 所有回答必须使用**中文**
- 技术问题附带**原理说明** + **可直接运行的代码示例**
- 代码注释使用中文，保持一致性

### 1.2 代码输出规范
| 要求 | 说明 |
|------|------|
| 格式化 | 语法高亮，缩进统一 |
| 注释 | 关键逻辑加中文注释 |
| 颗粒度 | 单函数 ≤ 20 行，超过则拆分 |
| 可运行 | 无语法错误，无缺失依赖 |

### 1.3 交互原则
- 遇到模糊需求时，**先确认细节，不自行假设**
- 提供 **Windows 终端命令**，适配本地开发环境
- 复杂任务提供**分步骤执行方案**

---

## 二、开发流程规范

### 2.1 标准开发流程
```
1. 需求确认 → 2. 接口设计 → 3. 数据库设计 → 4. 前端页面 → 5. 测试验证 → 6. 文档更新
```

### 2.2 提交前检查（强制）
```bash
# 必须执行
npm run lint
npm run format
```

### 2.3 代码质量底线
| 要求 | 标准 |
|------|------|
| 可运行 | 无语法错误，无崩溃风险 |
| 安全性 | 无明显安全漏洞 |
| 兼容性 | 响应式设计，兼容主流浏览器 |
| 性能 | 大数据场景无卡顿、无内存泄漏 |

---

## 三、代码质量规范

### 3.1 前端代码规范
```javascript
// ✅ 正确示例
const props = defineProps({
  modelValue: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})

// 空值安全使用
const displayName = user?.name ?? '未知用户'
const items = list?.filter(item => item.active) ?? []
```

### 3.2 后端代码规范
```javascript
// ✅ 正确示例：统一响应格式
const handleRequest = async (req, res) => {
  try {
    const result = await service.getData(req.query)
    res.json({
      code: 200,
      msg: '操作成功',
      data: result
    })
  } catch (error) {
    console.error('请求处理失败:', error)
    res.status(500).json({
      code: 500,
      msg: error.message,
      data: null
    })
  }
}
```

### 3.3 配置管理
- ❌ **禁止硬编码**：所有配置使用环境变量或配置文件
- ✅ 敏感配置存储在数据库或环境变量中
- ✅ 配置文件统一放在 `config/` 目录

---

## 四、性能与交付规范

### 4.1 数据库性能
| 场景 | 要求 |
|------|------|
| 索引 | 高频查询字段必须加索引 |
| 分页 | 所有列表查询必须加 `LIMIT` |
| 连接 | 使用连接池，避免频繁创建连接 |

### 4.2 前端性能
| 场景 | 要求 |
|------|------|
| 组件 | 按需加载，路由懒加载 |
| 列表 | 超过 100 条使用虚拟滚动 |
| 图片 | 懒加载 + 压缩 + WebP 格式 |

### 4.3 后端性能
| 场景 | 要求 |
|------|------|
| 批量操作 | 分批执行，每批 ≤ 1000 条 |
| 缓存 | 高频数据使用缓存 |
| 响应时间 | 普通接口 < 500ms |

### 4.4 交付标准
- 代码可直接部署生产环境
- 无已知 BUG
- 无冗余代码
- 适配大数据场景

---

## 五、错误处理规范

### 5.1 前端错误处理
```javascript
// ✅ 正确示例
const fetchData = async () => {
  try {
    const res = await api.get('/api/data')
    return res.data
  } catch (error) {
    console.error('获取数据失败:', error)
    showMessage('获取数据失败，请稍后重试', 'error')
    return null
  } finally {
    loading.value = false
  }
}
```

### 5.2 后端错误处理
```javascript
// ✅ 正确示例
const handleAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(500).json({
    code: 500,
    msg: process.env.NODE_ENV === 'production' ? '服务器错误' : err.message,
    data: null
  })
})
```

---

## 六、文档与注释规范

### 6.1 代码注释
```javascript
// ✅ 关键逻辑必须加注释
/**
 * 计算用户得分
 * @param {Array} answers - 用户答案列表
 * @param {Array} questions - 题目列表
 * @returns {number} 得分
 */
const calculateScore = (answers, questions) => {
  // 匹配答案并计算得分
  let score = 0
  answers.forEach((answer, index) => {
    if (answer === questions[index].correctAnswer) {
      score += questions[index].points || 1
    }
  })
  return score
}
```

### 6.2 功能开发后
- 同步更新相关文档
- 更新 API 文档（如有接口变更）
- 更新 README（如有重大变更）

---

## 七、安全意识规范

### 7.1 敏感信息保护
- ❌ 禁止在代码中硬编码密码、密钥
- ❌ 禁止提交 `.env` 文件到 Git
- ✅ 使用环境变量存储敏感信息

### 7.2 输入验证
- 所有用户输入必须验证
- 防止 SQL 注入：使用参数化查询
- 防止 XSS：对输出进行转义

### 7.3 权限控制
- 敏感操作需要权限验证
- 管理员操作需要二次确认
- 接口返回数据需要权限过滤

---

## 八、学习与改进规范

### 8.1 代码审查
- 关注代码可读性
- 关注性能优化点
- 关注安全隐患

### 8.2 持续改进
- 记录遇到的问题和解决方案
- 定期重构优化代码
- 关注新技术和最佳实践

---

## 九、版本历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| v2.0 | 2026-04-05 | 重构规则结构，增加表格、示例、错误处理规范 |
| v1.0 | 2026-03-29 | 初始版本 |
