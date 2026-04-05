# 贡献指南 (Contributing Guide)

感谢您考虑为 PSCG 项目做出贡献！本指南将帮助您了解如何参与项目开发。

## 📋 贡献方式

### 1. 报告问题 (Issues)
- 使用 [GitHub Issues](https://github.com/a1313445566/PSCG/issues) 报告 Bug
- 提交 Issue 时请包含：
  - 问题描述和复现步骤
  - 预期行为 vs 实际行为
  - 环境信息（操作系统、Node.js 版本、浏览器等）
  - 相关截图或日志（如有）

### 2. 提交代码 (Pull Requests)
我们欢迎任何形式的代码贡献！

## 🔧 开发环境搭建

### 前置要求
- Node.js 16+
- MySQL 8.0+
- Git

### 步骤
```bash
# 1. Fork 本仓库到您的 GitHub 账号
# 2. 克隆您的 Fork
git clone https://github.com/YOUR_USERNAME/PSCG.git
cd PSCG

# 3. 添加上游仓库（用于同步更新）
git remote add upstream https://github.com/a1313445566/PSCG.git

# 4. 安装依赖
npm install

# 5. 配置数据库（参考 README.md）
# 6. 创建功能分支
git checkout -b feature/your-feature-name

# 7. 启动开发服务器
npm run dev      # 前端
npm run server   # 后端
```

## 📝 代码规范

### 前端规范 (Vue 3)
- 使用 `<script setup>` 语法和 Composition API
- 组件命名：PascalCase（如 `QuizView.vue`）
- Props 必须定义类型 + 默认值
- 样式必须使用 `scoped`
- 缩进：2 空格
- 关键逻辑添加中文注释

### 后端规范 (Express)
- 所有异步方法使用 `try/catch` 错误处理
- 接口返回统一格式：`{ code, msg, data }`
- 数据库查询禁止 `SELECT *`，必须指定字段
- 敏感配置使用环境变量

### 提交前检查
```bash
# 运行代码检查
npm run lint

# 格式化代码
npm run format
```

## 🔄 Pull Request 流程

### 1. 同步最新代码
```bash
git fetch upstream
git merge upstream/main
```

### 2. 提交更改
```bash
git add .
git commit -m "feat: 添加新功能描述"
```

### Commit Message 规范
| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加批量导入题目功能` |
| `fix` | Bug 修复 | `fix: 修复答题计时器溢出问题` |
| `docs` | 文档更新 | `docs: 更新 API 文档` |
| `style` | 代码格式调整 | `style: 统一组件样式格式` |
| `refactor` | 重构 | `refactor: 优化数据库查询逻辑` |
| `test` | 测试相关 | `test: 添加单元测试用例` |

### 3. 推送并创建 PR
```bash
git push origin feature/your-feature-name
```
然后在 GitHub 上创建 Pull Request。

### PR 模板
请确保 PR 描述包含：
- **变更类型**：新功能 / Bug 修复 / 重构 / 文档
- **变更内容**：详细说明做了什么改动
- **测试情况**：如何验证这些改动
- **关联 Issue**：（如有）Fixes #xxx

## ⚖️ 许可证与版权

### 重要声明
通过向本项目提交代码（Pull Request），您**同意以下条款**：

1. **许可证授权**
   - 您提交的所有代码将自动采用 **CC BY-NC 4.0** (署名-非商业性使用 4.0 国际) 许可证
   - 您拥有所提交代码的版权，或有权以 CC BY-NC 4.0 授权
   - 本许可证由知识共享组织（Creative Commons）发布

2. **非商业性使用条款 (NonCommercial)**
   - 您的代码**仅可用于非商业目的**
   - 禁止任何形式的商业使用，包括但不限于：
     - 直接销售包含您代码的软件
     - 用于商业 SaaS 服务
     - 作为付费产品的一部分
     - 在商业环境中用于盈利活动
   - ✅ 允许的使用场景：
     - 个人学习、教育、学术研究
     - 开源项目集成（保持非商业性）
     - 非营利组织的公益用途

3. **署名要求 (Attribution)**
   - 使用您的代码时必须标注：
     - 您作为贡献者的信息（姓名/用户名）
     - 原始来源链接
     - CC BY-NC 4.0 许可证链接
   - 如果他人修改了您的代码，也需标明修改内容

4. **原创性保证**
   - 您保证提交的代码为原创作品
   - 不侵犯第三方的知识产权
   - 如有使用第三方代码，需明确标注来源和许可证
   - 第三方代码的许可证必须与 CC BY-NC 4.0 兼容

5. **权利保留**
   - 您保留对您提交代码的所有权利（除本许可证授予的权利外）
   - 商标权、专利权等不在本许可证授权范围内
   - 人格权（如署名权）受法律保护

### 如果您不同意上述条款
很遗憾，我们无法接受您的 PR。但您仍然可以：
- 通过 Issues 提供改进建议
- 报告 Bug 并协助测试
- 在社区中帮助其他用户
- 使用本项目进行个人学习和研究（符合 CC BY-NC 4.0 条件）

### 关于 CC BY-NC 4.0 的特别说明

**⚠️ 重要提醒：**

1. **适用范围争议**
   - CC 许可证主要针对"作品"（文学、艺术、学术作品）
   - 对于纯软件代码的适用性存在一定法律争议
   - 但在开源社区中被广泛接受和使用
   - 如需绝对法律保障，建议咨询专业律师

2. **与 GPL 的区别**
   - ❌ **无 Copyleft 效应**：不强制衍生作品采用相同许可证
   - ✅ **更简单直接**：明确禁止商业使用，无需理解复杂的 Copyleft 机制
   - ✅ **更灵活**：允许闭源修改（只要不商用）
   - ⚠️ **保护方式不同**：通过"非商业"条款而非"开源传染"来保护

3. **兼容性**
   - 可与其他 CC BY-NC 系列许可证兼容
   - 与 GPL 不兼容（如项目中同时有 GPL 代码需注意）
   - 建议确保所有依赖库的许可证兼容

4. **国际效力**
   - CC BY-NC 4.0 是国际版本，在全球大部分地区有效
   - 中国已加入相关国际公约，具有法律效力
   - 建议进行软件著作权登记以增强保护

## 🚫 行为准则

- 尊重所有贡献者
- 保持专业、建设性的沟通
- 不接受歧视、骚扰或不当言论
- 关注代码质量和技术讨论

## 📞 联系方式

如有问题或建议，欢迎联系：

- 📧 Email: a1313445566@example.com
- 💬 GitHub Issues: [提交 Issue](https://github.com/a1313445566/PSCG/issues)

---

再次感谢您对 PSCG 项目的支持！🎉
