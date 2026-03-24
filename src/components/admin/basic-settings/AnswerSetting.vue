<template>
  <div class="setting-card">
    <h3 class="setting-title">答题设置</h3>
    <div class="answer-setting" style="display: flex; align-items: center; justify-content: flex-start; gap: 15px; padding: 20px;">
      <span style="font-weight: bold; width: 150px;">普通题库选项随机排序</span>
      <div style="display: flex; gap: 10px;">
          <el-button :class="localRandomizeAnswers ? 'is-primary' : ''" @click="localRandomizeAnswers = true">开启</el-button>
          <el-button :class="!localRandomizeAnswers ? 'is-primary' : ''" @click="localRandomizeAnswers = false">关闭</el-button>
        </div>
      <span style="color: #67c23a; font-weight: bold; margin-right: 15px;">
        {{ localRandomizeAnswers ? '当前状态：开启' : '当前状态：关闭' }}
      </span>
    </div>
    <div class="answer-setting" style="display: flex; align-items: center; justify-content: flex-start; gap: 15px; padding: 20px; border-top: 1px solid #e0e0e0;">
      <span style="font-weight: bold; width: 150px;">错题巩固选项随机排序</span>
      <div style="display: flex; gap: 10px;">
          <el-button :class="localRandomizeErrorCollectionAnswers ? 'is-primary' : ''" @click="localRandomizeErrorCollectionAnswers = true">开启</el-button>
          <el-button :class="!localRandomizeErrorCollectionAnswers ? 'is-primary' : ''" @click="localRandomizeErrorCollectionAnswers = false">关闭</el-button>
        </div>
      <span style="color: #67c23a; font-weight: bold; margin-right: 15px;">
        {{ localRandomizeErrorCollectionAnswers ? '当前状态：开启' : '当前状态：关闭' }}
      </span>
    </div>
    
    <!-- 全局默认题目数量 -->
    <div class="question-count-setting" style="padding: 20px; border-top: 1px solid #e0e0e0;">
      <h4 class="sub-setting-title">全局默认题目数量</h4>
      <div style="display: flex; align-items: center; justify-content: flex-start; gap: 15px; margin-top: 15px;">
        <span style="font-weight: bold; width: 80px;">模式</span>
        <div style="display: flex; align-items: center; gap: 10px;">
          <el-button :class="!localFixedQuestionCount ? 'is-primary' : ''" @click="localFixedQuestionCount = false">随机</el-button>
          <el-button :class="localFixedQuestionCount ? 'is-primary' : ''" @click="localFixedQuestionCount = true">固定</el-button>
        </div>
        <div v-if="!localFixedQuestionCount" style="display: flex; align-items: center; gap: 10px;">
          <el-input-number v-model="localMinQuestionCount" :min="1" :max="50" style="width: 100px;"></el-input-number>
          <span style="margin: 0;">至</span>
          <el-input-number v-model="localMaxQuestionCount" :min="1" :max="50" style="width: 100px;"></el-input-number>
          <span style="color: #67c23a; font-weight: bold; margin-right: 15px;">
            当前范围：{{ localMinQuestionCount }}-{{ localMaxQuestionCount }}题
          </span>
        </div>
        <div v-else style="display: flex; align-items: center; gap: 10px;">
          <el-input-number v-model="localFixedQuestionCountValue" :min="1" :max="50" style="width: 100px;"></el-input-number>
          <span style="color: #67c23a; font-weight: bold; margin-right: 15px;">
            当前数量：{{ localFixedQuestionCountValue }}题
          </span>
        </div>
      </div>
      <p style="color: #909399; margin: 10px 0 0 0; font-size: 13px;">说明：未单独配置的学科将使用此默认值</p>
    </div>
    
    <!-- 学科独立配置 -->
    <div class="subject-question-count-setting" style="padding: 20px; border-top: 1px solid #e0e0e0;">
      <h4 class="sub-setting-title">学科独立配置</h4>
      <p style="color: #909399; margin: 0 0 15px 0; font-size: 13px;">说明：勾选后可为该学科设置独立的题目数量</p>
      
      <div class="subject-config-list" v-if="subjects.length > 0">
        <div 
          v-for="subject in subjects" 
          :key="subject.id" 
          class="subject-config-item"
        >
          <el-checkbox 
            v-model="getSubjectConfig(subject.id).enabled"
            :label="subject.name"
            @change="handleSubjectEnableChange(subject.id)"
          />
          
          <template v-if="getSubjectConfig(subject.id).enabled">
            <div class="subject-config-controls">
              <el-radio-group 
                v-model="getSubjectConfig(subject.id).fixed" 
                size="small"
              >
                <el-radio-button :value="false">随机</el-radio-button>
                <el-radio-button :value="true">固定</el-radio-button>
              </el-radio-group>
              
              <template v-if="!getSubjectConfig(subject.id).fixed">
                <el-input-number 
                  v-model="getSubjectConfig(subject.id).min" 
                  :min="1" 
                  :max="50" 
                  size="small"
                  style="width: 90px;"
                />
                <span>至</span>
                <el-input-number 
                  v-model="getSubjectConfig(subject.id).max" 
                  :min="1" 
                  :max="50" 
                  size="small"
                  style="width: 90px;"
                />
                <span class="config-summary">随机 {{ getSubjectConfig(subject.id).min }}-{{ getSubjectConfig(subject.id).max }} 题</span>
              </template>
              
              <template v-else>
                <el-input-number 
                  v-model="getSubjectConfig(subject.id).value" 
                  :min="1" 
                  :max="50" 
                  size="small"
                  style="width: 90px;"
                />
                <span class="config-summary">固定 {{ getSubjectConfig(subject.id).value }} 题</span>
              </template>
            </div>
          </template>
          
          <template v-else>
            <span class="use-default">使用全局默认</span>
          </template>
        </div>
      </div>
      <div v-else class="no-subjects">
        <span>暂无学科数据，请先添加学科</span>
      </div>
    </div>
    
    <div style="padding: 20px; border-top: 1px solid #e0e0e0; display: flex; justify-content: flex-end;">
      <el-button type="primary" @click="updateAnswerSettings">保存设置</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, reactive } from 'vue';
import { ElMessage } from 'element-plus';

// 定义属性
const props = defineProps({
  randomizeAnswers: {
    type: Boolean,
    default: false
  },
  randomizeErrorCollectionAnswers: {
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
  },
  subjects: {
    type: Array,
    default: () => []
  },
  subjectQuestionCounts: {
    type: Object,
    default: () => ({})
  }
});

// 定义事件
const emit = defineEmits(['update-settings']);

// 本地答题设置
const localRandomizeAnswers = ref(props.randomizeAnswers);
const localRandomizeErrorCollectionAnswers = ref(props.randomizeErrorCollectionAnswers);
const localFixedQuestionCount = ref(props.fixedQuestionCount);
const localMinQuestionCount = ref(props.minQuestionCount);
const localMaxQuestionCount = ref(props.maxQuestionCount);
const localFixedQuestionCountValue = ref(props.fixedQuestionCountValue);

// 学科配置 - 使用 reactive 对象
const subjectConfigs = reactive({});

// 获取学科配置（如果不存在则创建默认配置）
const getSubjectConfig = (subjectId) => {
  if (!subjectConfigs[subjectId]) {
    // 检查是否有已保存的配置
    const savedConfig = props.subjectQuestionCounts[subjectId];
    if (savedConfig) {
      subjectConfigs[subjectId] = { ...savedConfig };
    } else {
      // 创建默认配置
      subjectConfigs[subjectId] = {
        enabled: false,
        fixed: false,
        min: props.minQuestionCount,
        max: props.maxQuestionCount,
        value: props.fixedQuestionCountValue
      };
    }
  }
  return subjectConfigs[subjectId];
};

// 处理学科启用状态变化
const handleSubjectEnableChange = (subjectId) => {
  const config = getSubjectConfig(subjectId);
  if (config.enabled) {
    // 启用时，使用全局默认值初始化
    config.min = props.minQuestionCount;
    config.max = props.maxQuestionCount;
    config.value = props.fixedQuestionCountValue;
    config.fixed = props.fixedQuestionCount;
  }
};

// 监听 props 的变化
watch(() => props.randomizeAnswers, (newValue) => {
  localRandomizeAnswers.value = newValue;
});

watch(() => props.randomizeErrorCollectionAnswers, (newValue) => {
  localRandomizeErrorCollectionAnswers.value = newValue;
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

// 监听 subjectQuestionCounts 变化，更新已有配置
watch(() => props.subjectQuestionCounts, (newCounts) => {
  // 只更新已存在的配置，不覆盖用户正在编辑的内容
  Object.keys(newCounts).forEach(subjectId => {
    if (subjectConfigs[subjectId]) {
      // 如果用户没有修改过，则更新
      subjectConfigs[subjectId] = { ...newCounts[subjectId] };
    }
  });
}, { deep: true });

// 监听最大值和最小值，确保最大值不小于最小值（全局）
watch([localMinQuestionCount, localMaxQuestionCount], ([newMin, newMax]) => {
  if (newMax < newMin) {
    localMaxQuestionCount.value = newMin;
  }
});

// 监听每个学科配置的 min/max，确保 max >= min
watch(subjectConfigs, (configs) => {
  Object.keys(configs).forEach(subjectId => {
    const config = configs[subjectId];
    if (config && config.max < config.min) {
      config.max = config.min;
    }
  });
}, { deep: true });

// 更新答题设置
const updateAnswerSettings = () => {
  // 构建学科配置对象（只包含已启用的学科）
  const subjectQuestionCountsData = {};
  Object.keys(subjectConfigs).forEach(subjectId => {
    const config = subjectConfigs[subjectId];
    if (config && config.enabled) {
      subjectQuestionCountsData[subjectId] = {
        enabled: true,
        fixed: config.fixed,
        min: config.min,
        max: config.max,
        value: config.value
      };
    }
  });
  
  const settings = {
    randomizeAnswers: localRandomizeAnswers.value,
    randomizeErrorCollectionAnswers: localRandomizeErrorCollectionAnswers.value,
    fixedQuestionCount: localFixedQuestionCount.value,
    minQuestionCount: localMinQuestionCount.value,
    maxQuestionCount: localMaxQuestionCount.value,
    fixedQuestionCountValue: localFixedQuestionCountValue.value,
    subjectQuestionCounts: JSON.stringify(subjectQuestionCountsData)
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

.sub-setting-title {
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
  margin: 0 0 10px 0;
}

.is-primary {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
}

.subject-config-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.subject-config-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #ebeef5;
  gap: 15px;
}

.subject-config-item:last-child {
  border-bottom: none;
}

.subject-config-item:hover {
  background-color: #f5f7fa;
}

.subject-config-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.config-summary {
  color: #67c23a;
  font-weight: 500;
  font-size: 13px;
  min-width: 100px;
}

.use-default {
  color: #909399;
  font-size: 13px;
  margin-left: auto;
}

.no-subjects {
  padding: 20px;
  text-align: center;
  color: #909399;
}
</style>
