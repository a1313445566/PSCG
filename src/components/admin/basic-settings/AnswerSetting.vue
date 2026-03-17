<template>
  <div class="setting-card">
    <h3 class="setting-title">答题设置</h3>
    <div class="answer-setting" style="display: flex; align-items: center; justify-content: flex-start; gap: 15px; padding: 20px;">
      <span style="font-weight: bold; width: 120px;">答案随机排序</span>
      <div style="display: flex; gap: 10px;">
          <el-button :class="localRandomizeAnswers ? 'is-primary' : ''" @click="localRandomizeAnswers = true">开启</el-button>
          <el-button :class="!localRandomizeAnswers ? 'is-primary' : ''" @click="localRandomizeAnswers = false">关闭</el-button>
        </div>
      <span style="color: #67c23a; font-weight: bold; margin-right: 15px;">
        {{ localRandomizeAnswers ? '当前状态：开启' : '当前状态：关闭' }}
      </span>
    </div>
    <div class="question-count-setting" style="display: flex; align-items: center; justify-content: flex-start; gap: 15px; padding: 20px; border-top: 1px solid #e0e0e0;">
      <span style="font-weight: bold; width: 120px;">题目数量</span>
      <div style="display: flex; align-items: center; gap: 10px;">
          <el-button :class="!localFixedQuestionCount ? 'is-primary' : ''" @click="localFixedQuestionCount = false">随机</el-button>
          <el-button :class="localFixedQuestionCount ? 'is-primary' : ''" @click="localFixedQuestionCount = true">固定</el-button>
        </div>
      <div v-if="!localFixedQuestionCount" style="display: flex; align-items: center; gap: 10px;">
        <el-input-number v-model="localMinQuestionCount" :min="1" :max="20" style="width: 100px;"></el-input-number>
        <span style="margin: 0;">至</span>
        <el-input-number v-model="localMaxQuestionCount" :min="1" :max="20" style="width: 100px;"></el-input-number>
        <span style="color: #67c23a; font-weight: bold; margin-right: 15px;">
          当前范围：{{ localMinQuestionCount }}-{{ localMaxQuestionCount }}题
        </span>
      </div>
      <div v-else style="display: flex; align-items: center; gap: 10px;">
        <el-input-number v-model="localFixedQuestionCountValue" :min="1" :max="20" style="width: 100px;"></el-input-number>
        <span style="color: #67c23a; font-weight: bold; margin-right: 15px;">
          当前数量：{{ localFixedQuestionCountValue }}题
        </span>
      </div>
      <el-button type="primary" @click="updateAnswerSettings">保存设置</el-button>
      <p style="color: #666; margin: 0;">{{ localFixedQuestionCount ? '每次答题将生成固定数量的题目' : '每次答题将随机生成该范围内的题目数量' }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';

// 定义属性
const props = defineProps({
  randomizeAnswers: {
    type: Boolean,
    default: false
  },
  fixedQuestionCount: {
    type: Boolean,
    default: false
  },
  minQuestionCount: {
    type: Number,
    default: 5
  },
  maxQuestionCount: {
    type: Number,
    default: 10
  },
  fixedQuestionCountValue: {
    type: Number,
    default: 10
  }
});

// 定义事件
const emit = defineEmits(['update-settings']);

// 本地答题设置
const localRandomizeAnswers = ref(props.randomizeAnswers);
const localFixedQuestionCount = ref(props.fixedQuestionCount);
const localMinQuestionCount = ref(props.minQuestionCount);
const localMaxQuestionCount = ref(props.maxQuestionCount);
const localFixedQuestionCountValue = ref(props.fixedQuestionCountValue);

// 监听 props 的变化
watch(() => props.randomizeAnswers, (newValue) => {
  localRandomizeAnswers.value = newValue;
});

watch(() => props.fixedQuestionCount, (newValue) => {
  localFixedQuestionCount.value = newValue;
});

watch(() => props.minQuestionCount, (newValue) => {
  localMinQuestionCount.value = newValue;
});

watch(() => props.maxQuestionCount, (newValue) => {
  localMaxQuestionCount.value = newValue;
});

watch(() => props.fixedQuestionCountValue, (newValue) => {
  localFixedQuestionCountValue.value = newValue;
});

// 监听最大值和最小值，确保最大值不小于最小值
watch([localMinQuestionCount, localMaxQuestionCount], ([newMin, newMax]) => {
  if (newMax < newMin) {
    localMaxQuestionCount.value = newMin;
  }
});

// 更新答题设置
const updateAnswerSettings = () => {
  const settings = {
    randomizeAnswers: localRandomizeAnswers.value,
    fixedQuestionCount: localFixedQuestionCount.value,
    minQuestionCount: localMinQuestionCount.value,
    maxQuestionCount: localMaxQuestionCount.value,
    fixedQuestionCountValue: localFixedQuestionCountValue.value
  };
  
  emit('update-settings', settings);
};
</script>

<style scoped>
.setting-card {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.setting-title {
  background-color: #f5f7fa;
  padding: 15px 20px;
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
}

.is-primary {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
}
</style>