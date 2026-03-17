<template>
  <el-dialog
    v-model="dialogVisible"
    title="测试对话框"
    width="300px"
  >
    <span>这是一个测试对话框</span>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="dialogVisible = false">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue';

const dialogVisible = ref(true);
</script>

<style scoped>
.dialog-footer {
  text-align: center;
}
</style>