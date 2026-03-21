<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="(value) => emit('update:visible', value)"
    :title="user ? '编辑用户' : '添加用户'"
    width="500px"
  >
    <el-form :model="form" label-width="100px" @submit.prevent="handleSubmit">
      <el-form-item label="学号" prop="student_id" :rules="[{ required: true, message: '请输入学号', trigger: 'blur' }]">
        <el-input v-model="form.student_id" placeholder="请输入学号" maxlength="20"></el-input>
      </el-form-item>
      
      <el-form-item label="姓名" prop="name" :rules="[{ required: false, message: '请输入姓名', trigger: 'blur' }]">
        <el-input v-model="form.name" placeholder="请输入姓名（选填）" maxlength="20"></el-input>
      </el-form-item>
      
      <el-form-item label="年级" prop="grade" :rules="[{ required: true, message: '请选择年级', trigger: 'change' }]">
        <el-select v-model="form.grade" placeholder="请选择年级">
          <el-option v-for="grade in grades" :key="grade.id || grade" :label="grade.name || grade" :value="grade.id || grade"></el-option>
        </el-select>
      </el-form-item>
      
      <el-form-item label="班级" prop="class" :rules="[{ required: true, message: '请选择班级', trigger: 'change' }]">
        <el-select v-model="form.class" placeholder="请选择班级">
          <el-option v-for="classNum in classes" :key="classNum.id || classNum" :label="classNum.name || classNum" :value="classNum.id || classNum"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="emit('update:visible', false)">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';

// 定义属性和事件
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  user: {
    type: Object,
    default: null
  },
  grades: {
    type: Array,
    default: () => []
  },
  classes: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:visible', 'save-user']);

// 表单数据
const form = ref({
  student_id: '',
  name: '',
  grade: '',
  class: ''
});

// 监听用户数据变化，当用户对象改变时更新表单
watch(() => props.user, (newUser) => {
  if (newUser) {
    form.value = {
      id: newUser.id,
      student_id: newUser.student_id || newUser.user_id || '',
      name: newUser.name || '',
      grade: newUser.grade || '',
      class: newUser.class || ''
    };
  } else {
    // 重置表单
    form.value = {
      id: null,
      student_id: '',
      name: '',
      grade: '',
      class: ''
    };
  }
}, { immediate: true });

// 处理表单提交
const handleSubmit = () => {
  // 验证表单
  if (!form.value.student_id) {
    return;
  }
  if (!form.value.grade) {
    return;
  }
  if (!form.value.class) {
    return;
  }
  
  // 发送保存事件
  emit('save-user', form.value);
};
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>