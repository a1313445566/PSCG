<template>
  <div class="download-section">
    <el-button type="success" @click="downloadReport('excel')" class="btn-download">
      <i class="el-icon-s-grid"></i> 电子表格
    </el-button>
  </div>
</template>

<script setup>
import { useAnalysisStore } from '../../../stores/analysisStore';

const analysisStore = useAnalysisStore();

// 下载报告
const downloadReport = (type) => {
  if (type === 'excel') {
    analysisStore.downloadReport(type);
  }
};
</script>

<style scoped>
.download-section {
  display: flex;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.btn-download {
  padding: 10px 20px !important;
  font-size: 14px !important;
}
</style>
