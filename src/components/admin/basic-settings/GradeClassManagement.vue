<template>
  <div class="setting-card">
    <h3 class="setting-title">年级班级管理</h3>
    <div style="padding: 20px">
      <el-row :gutter="20">
        <!-- 年级管理 -->
        <el-col :span="12">
          <div class="grade-management">
            <h4 class="sub-setting-title">年级管理</h4>
            <div class="add-grade" style="margin-bottom: 20px">
              <el-input
                v-model="newGradeName"
                placeholder="输入年级名称"
                style="width: 200px; margin-right: 10px"
              ></el-input>
              <el-button type="primary" @click="addGrade">添加年级</el-button>
            </div>
            <el-table :data="grades" style="width: 100%">
              <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
              <el-table-column label="年级名称" align="center">
                <template #default="{ row }">
                  <div v-if="row && editingGradeId === row.id" class="grade-edit">
                    <el-input
                      v-model="editingGradeName"
                      placeholder="输入年级名称"
                      style="width: 200px; margin-right: 10px"
                    ></el-input>
                    <el-button type="primary" size="small" @click="saveGradeEdit(row.id)">
                      保存
                    </el-button>
                    <el-button size="small" @click="cancelGradeEdit">取消</el-button>
                  </div>
                  <div v-else-if="row" class="grade-info">
                    <span>{{ row.name }}</span>
                    <el-button link size="small" @click="editGrade(row)">编辑</el-button>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" align="center">
                <template #default="{ row }">
                  <el-button v-if="row" type="danger" size="small" @click="deleteGrade(row.id)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <p style="color: #666; margin-top: 10px">
              年级数据会自动从用户注册信息中提取，也可以手动添加和管理年级数据
            </p>
          </div>
        </el-col>

        <!-- 班级管理 -->
        <el-col :span="12">
          <div class="class-management">
            <h4 class="sub-setting-title">班级管理</h4>
            <div class="add-class" style="margin-bottom: 20px">
              <el-input
                v-model="newClassName"
                placeholder="输入班级名称"
                style="width: 200px; margin-right: 10px"
              ></el-input>
              <el-button type="primary" @click="addClass">添加班级</el-button>
            </div>
            <el-table :data="classes" style="width: 100%">
              <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
              <el-table-column label="班级名称" align="center">
                <template #default="{ row }">
                  <div v-if="row && editingClassId === row.id" class="class-edit">
                    <el-input
                      v-model="editingClassName"
                      placeholder="输入班级名称"
                      style="width: 200px; margin-right: 10px"
                    ></el-input>
                    <el-button type="primary" size="small" @click="saveClassEdit(row.id)">
                      保存
                    </el-button>
                    <el-button size="small" @click="cancelClassEdit">取消</el-button>
                  </div>
                  <div v-else-if="row" class="class-info">
                    <span>{{ row.name }}</span>
                    <el-button link size="small" @click="editClass(row)">编辑</el-button>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" align="center">
                <template #default="{ row }">
                  <el-button v-if="row" type="danger" size="small" @click="deleteClass(row.id)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <p style="color: #666; margin-top: 10px">
              班级数据会自动从用户注册信息中提取，也可以手动添加和管理班级数据
            </p>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useQuestionStore } from '../../../stores/questionStore'

// 定义属性
defineProps({})

const questionStore = useQuestionStore()

// 使用计算属性获取最新的年级和班级数据
const grades = computed(() => questionStore.grades)
const classes = computed(() => questionStore.classes)

// 新年级和班级名称
const newGradeName = ref('')
const newClassName = ref('')

// 编辑状态
const editingGradeId = ref(null)
const editingGradeName = ref('')
const editingClassId = ref(null)
const editingClassName = ref('')

// 添加年级
const addGrade = async () => {
  if (!newGradeName.value.trim()) {
    ElMessage.warning('请输入年级名称')
    return
  }

  try {
    await questionStore.addGrade(newGradeName.value.trim())
    newGradeName.value = ''
    ElMessage.success('年级添加成功')
  } catch (error) {
    ElMessage.error('年级添加失败，请稍后重试')
  }
}

// 编辑年级
const editGrade = grade => {
  editingGradeId.value = grade.id
  editingGradeName.value = grade.name
}

// 保存年级编辑
const saveGradeEdit = async gradeId => {
  if (!editingGradeName.value.trim()) {
    ElMessage.warning('请输入年级名称')
    return
  }

  try {
    await questionStore.updateGrade(gradeId, editingGradeName.value.trim())
    cancelGradeEdit()
    ElMessage.success('年级更新成功')
  } catch (error) {
    ElMessage.error('年级更新失败，请稍后重试')
  }
}

// 取消年级编辑
const cancelGradeEdit = () => {
  editingGradeId.value = null
  editingGradeName.value = ''
}

// 删除年级
const deleteGrade = async gradeId => {
  ElMessageBox.confirm('确定要删除这个年级吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        await questionStore.deleteGrade(gradeId)
        ElMessage.success('年级删除成功')
      } catch (error) {
        ElMessage.error('年级删除失败，请稍后重试')
      }
    })
    .catch(() => {
      // 取消删除
    })
}

// 添加班级
const addClass = async () => {
  if (!newClassName.value.trim()) {
    ElMessage.warning('请输入班级名称')
    return
  }

  try {
    await questionStore.addClass(newClassName.value.trim())
    newClassName.value = ''
    ElMessage.success('班级添加成功')
  } catch (error) {
    ElMessage.error('班级添加失败，请稍后重试')
  }
}

// 编辑班级
const editClass = classItem => {
  editingClassId.value = classItem.id
  editingClassName.value = classItem.name
}

// 保存班级编辑
const saveClassEdit = async classId => {
  if (!editingClassName.value.trim()) {
    ElMessage.warning('请输入班级名称')
    return
  }

  try {
    await questionStore.updateClass(classId, editingClassName.value.trim())
    cancelClassEdit()
    ElMessage.success('班级更新成功')
  } catch (error) {
    ElMessage.error('班级更新失败，请稍后重试')
  }
}

// 取消班级编辑
const cancelClassEdit = () => {
  editingClassId.value = null
  editingClassName.value = ''
}

// 删除班级
const deleteClass = async classId => {
  ElMessageBox.confirm('确定要删除这个班级吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        await questionStore.deleteClass(classId)
        ElMessage.success('班级删除成功')
      } catch (error) {
        ElMessage.error('班级删除失败，请稍后重试')
      }
    })
    .catch(() => {
      // 取消删除
    })
}
</script>

<style scoped lang="scss">
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
  margin-bottom: 15px;
  margin-top: 0;
}

.grade-info,
.class-info {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  gap: 10px !important;
  width: 100% !important;
}
</style>
