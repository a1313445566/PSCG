<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // 应用初始化
})
</script>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  background-color: #f5f5f5;
  color: #333;
}

.app-container {
  min-height: 100vh;
  padding: 20px;
}

/* 通用样式 */
h1, h2, h3 {
  color: #333;
  margin-bottom: 20px;
}

/* 按钮样式 */
.el-button {
  margin-right: 10px;
}

/* 表格样式 */
.el-table {
  margin-top: 20px;
}

/* 表单样式 */
.el-form {
  margin-top: 20px;
}

.el-form-item {
  margin-bottom: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-container {
    padding: 10px;
  }
  
  h1 {
    font-size: 24px;
  }
  
  h2 {
    font-size: 20px;
  }
}
</style>