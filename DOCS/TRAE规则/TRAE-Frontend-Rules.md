# TRAE 前端开发规则
## 1. 代码规范
- 必须使用 <script setup> 语法
- 组件/页面：PascalCase | 变量：camelCase | 常量：全大写
- 样式必须 scoped，缩进2空格，支持SCSS

## 2. 工具使用强制规则
- API请求：只能用 src/utils/api.js，禁止原生fetch
- 消息提示：只能用 @/utils/message，禁止ElMessage
- 加载状态：必须用 useLoading，组件卸载执行cleanup
- 分页：必须用 usePagination，传入total ref
- 图标：必须显式导入 @element-plus/icons-vue

## 3. 性能&大数据规则
- 长列表使用虚拟滚动/懒加载
- 接口防抖默认开启，超时30秒
- 表单/富文本加草稿自动保存
- 响应式适配全局断点，禁止硬编码像素