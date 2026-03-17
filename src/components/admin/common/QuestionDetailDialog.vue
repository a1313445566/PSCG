<template>
  <el-dialog
    :model-value="dialogVisible"
    @update:model-value="(value) => emit('update:dialogVisible', value)"
    title="题目详情"
    width="800px"
  >
    <div v-if="selectedQuestionDetail" class="question-detail">
      <QuestionCard 
        :question="selectedQuestionDetail"
        :question-number="1"
        :user-answer="selectedQuestionDetail.user_answer"
        :show-result="true"
      />
    </div>
    <div v-else class="loading">
      <el-icon class="loading-icon"><i class="el-icon-loading"></i></el-icon>
      <p>加载中...</p>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="emit('update:dialogVisible', false)">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue';
import QuestionCard from '../../quiz/QuestionCard.vue';

// 定义属性和事件
const props = defineProps({
  dialogVisible: {
    type: Boolean,
    default: false
  },
  selectedQuestionDetail: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:dialogVisible']);
</script>

<style scoped>
.question-detail {
  padding: 20px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.loading-icon {
  font-size: 48px;
  margin-bottom: 20px;
  color: #409eff;
}

.dialog-footer {
  text-align: center;
}
</style>