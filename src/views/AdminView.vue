<template>
  <div class="admin-container">
    <!-- 密码验证对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="🔐 后台管理登录"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      @open="focusPasswordInput"
    >
      <el-form :model="passwordForm" label-width="80px" @submit.prevent="verifyPassword">
        <el-form-item label="密码">
          <el-input ref="passwordInputRef" v-model="passwordForm.password" type="password" placeholder="请输入管理密码" show-password @keyup="handleKeyUp"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="verifyPassword">登录</el-button>
        </span>
      </template>
    </el-dialog>

    <div class="admin-header" v-if="isAuthenticated">
      <h1 class="title">题库管理系统</h1>
      <div class="header-buttons">
        <el-button type="primary" @click="backToHome" class="action-btn">🏠 返回首页</el-button>
        <el-button type="danger" @click="logout">退出登录</el-button>
      </div>
    </div>
    
    <el-tabs v-model="activeTab" v-if="isAuthenticated">

      
      <!-- 基础设置 -->
      <el-tab-pane label="基础设置" name="basic-settings">
        <div class="basic-settings">
          <!-- 界面名称设置 -->
          <div class="setting-card">
            <h3 class="setting-title">界面名称设置</h3>
            <div class="interface-name-setting" style="display: flex; align-items: center; justify-content: flex-start; gap: 15px; padding: 20px;">
              <el-input v-model="interfaceName" placeholder="输入界面名称" style="width: 300px;"></el-input>
              <el-button type="primary" @click="updateInterfaceName">更新界面名称</el-button>
              <p style="color: #666; margin: 0;">修改后需要刷新页面才能看到效果</p>
            </div>
          </div>
          
          <!-- 答题设置 -->
          <div class="setting-card">
            <h3 class="setting-title">答题设置</h3>
            <div class="answer-setting" style="display: flex; align-items: center; justify-content: flex-start; gap: 15px; padding: 20px;">
              <span style="font-weight: bold; width: 120px;">答案随机排序</span>
              <div style="display: flex; gap: 10px;">
                <el-button :type="randomizeAnswers ? 'primary' : 'default'" @click="randomizeAnswers = true">开启</el-button>
                <el-button :type="!randomizeAnswers ? 'primary' : 'default'" @click="randomizeAnswers = false">关闭</el-button>
              </div>
              <span style="color: #67c23a; font-weight: bold; margin-right: 15px;">
                {{ randomizeAnswers ? '当前状态：开启' : '当前状态：关闭' }}
              </span>
            </div>
            <div class="question-count-setting" style="display: flex; align-items: center; justify-content: flex-start; gap: 15px; padding: 20px; border-top: 1px solid #e0e0e0;">
              <span style="font-weight: bold; width: 120px;">题目数量</span>
              <div style="display: flex; align-items: center; gap: 10px;">
                <el-button :type="!fixedQuestionCount ? 'primary' : 'default'" @click="fixedQuestionCount = false">随机</el-button>
                <el-button :type="fixedQuestionCount ? 'primary' : 'default'" @click="fixedQuestionCount = true">固定</el-button>
              </div>
              <div v-if="!fixedQuestionCount" style="display: flex; align-items: center; gap: 10px;">
                <el-input-number v-model="minQuestionCount" :min="1" :max="20" style="width: 100px;"></el-input-number>
                <span style="margin: 0;">至</span>
                <el-input-number v-model="maxQuestionCount" :min="1" :max="20" style="width: 100px;"></el-input-number>
                <span style="color: #67c23a; font-weight: bold; margin-right: 15px;">
                  当前范围：{{ minQuestionCount }}-{{ maxQuestionCount }}题
                </span>
              </div>
              <div v-else style="display: flex; align-items: center; gap: 10px;">
                <el-input-number v-model="fixedQuestionCountValue" :min="1" :max="20" style="width: 100px;"></el-input-number>
                <span style="color: #67c23a; font-weight: bold; margin-right: 15px;">
                  当前数量：{{ fixedQuestionCountValue }}题
                </span>
              </div>
              <el-button type="primary" @click="updateAnswerSettings">保存设置</el-button>
              <p style="color: #666; margin: 0;">{{ fixedQuestionCount ? '每次答题将生成固定数量的题目' : '每次答题将随机生成该范围内的题目数量' }}</p>
            </div>
          </div>
          
          <!-- 学科管理 -->
          <div class="setting-card">
            <h3 class="setting-title">学科管理</h3>
            <div class="subject-management" style="padding: 20px;">
              <div class="add-subject" style="margin-bottom: 20px; padding: 20px; background-color: #f5f7fa; border-radius: 8px;">
                <h4 style="margin: 0 0 15px; font-size: 16px; font-weight: 500; color: #303133;">添加新学科</h4>
                <div style="display: flex; align-items: flex-end; gap: 15px; flex-wrap: wrap;">
                  <div class="form-item" style="display: flex; flex-direction: column; gap: 6px;">
                    <label style="font-size: 14px; color: #606266; font-weight: 500;">学科名称</label>
                    <el-input v-model="newSubjectName" placeholder="请输入学科名称" style="width: 220px;"></el-input>
                  </div>
                  <div class="form-item" style="display: flex; flex-direction: column; gap: 6px;">
                    <label style="font-size: 14px; color: #606266; font-weight: 500;">选择图标</label>
                    <el-select v-model="newSubjectIcon" placeholder="请选择图标" style="width: 180px;">
                      <el-option v-for="(icon, index) in subjectIcons" :key="index" :label="icon + ' ' + subjectIconNames[index]" :value="index"></el-option>
                    </el-select>
                  </div>
                  <el-button type="primary" @click="addSubject" style="margin-bottom: 0;">
                    <el-icon><i class="el-icon-plus"></i></el-icon> 添加学科
                  </el-button>
                </div>
              </div>
              
              <div class="subjects-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
                <div v-for="subject in subjects" :key="subject.id" class="subject-card" style="background: #fff; border: 1px solid #e4e7ed; border-radius: 12px; padding: 20px; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                  <div class="subject-header" style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px;">
                    <div class="subject-info-header" style="display: flex; align-items: center; gap: 12px;">
                      <span class="subject-icon-large" style="font-size: 40px;">{{ subjectIcons[subject.iconIndex || 0] }}</span>
                      <div class="subject-name-section">
                        <div v-if="editingSubjectId === subject.id" class="subject-edit-inline" style="display: flex; flex-direction: column; gap: 8px;">
                          <el-input v-model="editingSubjectName" placeholder="输入学科名称" style="width: 180px;"></el-input>
                          <el-select v-model="editingSubjectIcon" placeholder="选择图标" style="width: 180px;">
                            <el-option v-for="(icon, index) in subjectIcons" :key="index" :label="icon + ' ' + subjectIconNames[index]" :value="index"></el-option>
                          </el-select>
                          <div class="edit-buttons" style="display: flex; gap: 8px;">
                            <el-button type="primary" size="small" @click="saveSubjectEdit(subject.id)">保存</el-button>
                            <el-button size="small" @click="cancelSubjectEdit">取消</el-button>
                          </div>
                        </div>
                        <div v-else class="subject-name-display">
                          <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #303133;">{{ subject.name }}</h3>
                          <p style="margin: 4px 0 0; font-size: 13px; color: #909399;">学科题库: {{ subject.subcategories ? subject.subcategories.length : 0 }} 个</p>
                        </div>
                      </div>
                    </div>
                    <div v-if="editingSubjectId !== subject.id" class="subject-actions" style="display: flex; gap: 6px;">
                      <el-button type="primary" size="small" @click="editSubject(subject)">
                        <el-icon><i class="el-icon-edit"></i></el-icon> 编辑
                      </el-button>
                      <el-button type="danger" size="small" @click="deleteSubject(subject.id)">
                        <el-icon><i class="el-icon-delete"></i></el-icon> 删除
                      </el-button>
                    </div>
                  </div>
                  
                  <div class="subcategories-section" style="border-top: 1px solid #f0f0f0; padding-top: 16px;">
                    <div class="subcategories-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                      <span style="font-size: 14px; font-weight: 500; color: #606266;">学科题库</span>
                      <el-button type="primary" size="small" @click="manageSubcategories(subject)">
                        <el-icon><i class="el-icon-plus"></i></el-icon> 管理
                      </el-button>
                    </div>
                    
                    <div v-if="subject.subcategories && subject.subcategories.length > 0" class="subcategories-list">
                      <div v-for="subcategory in subject.subcategories" :key="subcategory.id" class="subcategory-tag">
                        <span>{{ subjectIcons[subcategory.iconIndex || 0] }}</span>
                        <span>{{ subcategory.name }}</span>
                      </div>
                    </div>
                    <div v-else class="no-subcategories" style="text-align: center; padding: 16px; color: #909399; font-size: 13px;">
                      暂无学科题库
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 年级班级管理 -->
          <div class="setting-card">
            <h3 class="setting-title">年级班级管理</h3>
            <div style="padding: 20px;">
              <el-row :gutter="20">
                <!-- 年级管理 -->
                <el-col :span="12">
                  <div class="grade-management">
                    <h4 class="sub-setting-title">年级管理</h4>
                    <div class="add-grade" style="margin-bottom: 20px;">
                      <el-input v-model="newGradeName" placeholder="输入年级名称" style="width: 200px; margin-right: 10px;"></el-input>
                      <el-button type="primary" @click="addGrade">添加年级</el-button>
                    </div>
                    <el-table :data="grades" style="width: 100%;">
                      <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
                      <el-table-column label="年级名称" align="center">
                        <template #default="{ row }">
                          <div v-if="editingGradeId === row.id" class="grade-edit">
                            <el-input v-model="editingGradeName" placeholder="输入年级名称" style="width: 200px; margin-right: 10px;"></el-input>
                            <el-button type="primary" size="small" @click="saveGradeEdit(row.id)">保存</el-button>
                            <el-button size="small" @click="cancelGradeEdit">取消</el-button>
                          </div>
                          <div v-else class="grade-info">
                            <span>{{ row.name }}</span>
                            <el-button type="text" size="small" @click="editGrade(row)">编辑</el-button>
                          </div>
                        </template>
                      </el-table-column>
                      <el-table-column label="操作" width="120" align="center">
                        <template #default="{ row }">
                          <el-button type="danger" size="small" @click="deleteGrade(row.id)">删除</el-button>
                        </template>
                      </el-table-column>
                    </el-table>
                    <p style="color: #666; margin-top: 10px;">年级数据会自动从用户注册信息中提取，也可以手动添加和管理年级数据</p>
                  </div>
                </el-col>
                
                <!-- 班级管理 -->
                <el-col :span="12">
                  <div class="class-management">
                    <h4 class="sub-setting-title">班级管理</h4>
                    <div class="add-class" style="margin-bottom: 20px;">
                      <el-input v-model="newClassName" placeholder="输入班级名称" style="width: 200px; margin-right: 10px;"></el-input>
                      <el-button type="primary" @click="addClass">添加班级</el-button>
                    </div>
                    <el-table :data="classes" style="width: 100%;">
                      <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
                      <el-table-column label="班级名称" align="center">
                        <template #default="{ row }">
                          <div v-if="editingClassId === row.id" class="class-edit">
                            <el-input v-model="editingClassName" placeholder="输入班级名称" style="width: 200px; margin-right: 10px;"></el-input>
                            <el-button type="primary" size="small" @click="saveClassEdit(row.id)">保存</el-button>
                            <el-button size="small" @click="cancelClassEdit">取消</el-button>
                          </div>
                          <div v-else class="class-info">
                            <span>{{ row.name }}</span>
                            <el-button type="text" size="small" @click="editClass(row)">编辑</el-button>
                          </div>
                        </template>
                      </el-table-column>
                      <el-table-column label="操作" width="120" align="center">
                        <template #default="{ row }">
                          <el-button type="danger" size="small" @click="deleteClass(row.id)">删除</el-button>
                        </template>
                      </el-table-column>
                    </el-table>
                    <p style="color: #666; margin-top: 10px;">班级数据会自动从用户注册信息中提取，也可以手动添加和管理班级数据</p>
                  </div>
                </el-col>
              </el-row>
            </div>
          </div>
        </div>
      </el-tab-pane>
      
      <!-- 题目管理 -->
      <el-tab-pane label="题目管理" name="questions">
        <div class="question-management">
          <div class="filter-section">
            <div class="filter-row">
              <el-input v-model="searchKeyword" placeholder="搜索题目内容" style="width: 300px; margin-right: 10px;"></el-input>
              <el-select v-model="filterSubjectId" placeholder="选择学科" style="width: 120px; margin-right: 10px;" @change="handleSubjectChange">
                <el-option label="全部学科" value=""></el-option>
                <el-option v-for="subject in subjects" :key="subject.id" :label="subject.name" :value="subject.id"></el-option>
              </el-select>
              <el-select v-model="filterSubcategoryId" placeholder="选择学科题库" style="width: 150px; margin-right: 10px;">
                <el-option label="全部题库" value=""></el-option>
                <el-option v-for="subcategory in filterSubcategories" :key="subcategory.id" :label="subcategory.name" :value="subcategory.id"></el-option>
              </el-select>
              <el-select v-model="filterType" placeholder="选择类型" style="width: 120px; margin-right: 10px;">
                <el-option label="全部类型" value=""></el-option>
                <el-option label="单选题" value="single"></el-option>
                <el-option label="多选题" value="multiple"></el-option>
                <el-option label="判断题" value="judgment"></el-option>
                <el-option label="听力题" value="listening"></el-option>
                <el-option label="阅读题" value="reading"></el-option>
                <el-option label="看图题" value="image"></el-option>
              </el-select>
              <el-button type="primary" @click="applyQuestionFilters">应用筛选</el-button>
            </div>
            <div class="action-buttons">
              <el-button type="primary" @click="showAddQuestionDialog">添加题目</el-button>
              <el-button type="success" @click="batchAddDialogVisible = true">批量添加题目</el-button>
              <el-button type="danger" @click="batchDeleteQuestions" :disabled="selectedQuestions.length === 0">批量删除</el-button>
              <el-button type="info" @click="toggleViewMode">
                {{ isCategoryView ? '切换到列表视图' : '切换到分类视图' }}
              </el-button>
            </div>
          </div>
          
          <!-- 列表视图 -->
          <div class="table-container" v-if="!isCategoryView">
            <el-table 
              :data="filteredQuestions" 
              style="margin-top: 20px; width: 100%"
              @selection-change="handleSelectionChange"
              stripe
              border
              :default-sort="{prop: 'createdAt', order: 'descending'}"
              :row-class-name="row => hasValidImage(row.content) || row.audio ? 'has-media' : ''"
            >
              <el-table-column type="selection" width="40"></el-table-column>
              <el-table-column prop="id" label="ID" width="60" align="center"></el-table-column>
              <el-table-column prop="subjectName" label="学科" width="120" align="center">
                <template #default="{ row }">
                  <el-tag size="small" type="primary" effect="light" style="width: auto; max-width: 100%;">
                    {{ row.subjectName }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="subcategoryName" label="学科题库" width="150" align="center">
                <template #default="{ row }">
                  <span class="subcategory-text">{{ row.subcategoryName || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="typeName" label="类型" width="90" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="{
                    'single': 'primary',
                    'multiple': 'success',
                    'judgment': 'warning'
                  }[row.type] || 'info'" style="width: auto; max-width: 100%;">
                    {{ row.typeName }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="content" label="题目内容" min-width="300" align="left">
                <template #default="{ row }">
                  <div class="question-content-wrapper">
                    <div class="question-content-preview">
                      <div v-if="hasValidImage(row.content)" class="content-with-image">
                        <div class="image-preview">
                          <img :src="extractImageUrl(row.content)" alt="题目图片" class="question-image" />
                        </div>
                        <div class="content-text" v-html="stripImages(row.content)"></div>
                      </div>
                      <div v-else-if="row.audio" class="content-with-audio">
                        <el-icon class="audio-icon"><i class="el-icon-microphone"></i></el-icon>
                        <div class="content-text">{{ row.content }}</div>
                      </div>
                      <div v-else class="content-text">
                        {{ row.content }}
                      </div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="answer" label="答案" width="80" align="center">
                <template #default="{ row }">
                  <el-tag size="small" type="danger" effect="dark">{{ row.answer || '-' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createdAt" label="创建时间" width="140" align="center">
                <template #default="{ row }">
                  <span class="time-text">{{ row.createdAt || '未知' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="160" fixed="right" align="center">
                <template #default="{ row }">
                  <div class="row-operations">
                    <el-button type="primary" size="small" @click="editQuestion(row)" style="margin-right: 5px;">
                      <el-icon><i class="el-icon-edit"></i></el-icon> 编辑
                    </el-button>
                    <el-button type="danger" size="small" @click="deleteQuestion(row.id)">
                      <el-icon><i class="el-icon-delete"></i></el-icon> 删除
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <!-- 分类视图 -->
          <div class="category-view" v-else>
            <div v-for="subject in subjects" :key="subject.id" class="subject-category">
              <div class="subject-header">
                <h3>{{ subject.name }}</h3>
                <span class="question-count">{{ getSubjectQuestionCount(subject.id) }} 道题目</span>
              </div>
              <div class="subcategory-list">
                <div v-for="subcategory in subject.subcategories" :key="subcategory.id" class="subcategory-card">
                  <div class="subcategory-header">
                    <h4>{{ subcategory.name }}</h4>
                    <span class="question-count">{{ getSubcategoryQuestionCount(subject.id, subcategory.id) }} 道题目</span>
                  </div>
                  <div class="subcategory-questions">
                    <div v-for="question in getQuestionsBySubcategory(subject.id, subcategory.id)" :key="question.id" class="question-card">
                      <div class="question-content">
                        <div class="question-type">
                          <el-tag size="small" :type="{
                            'single': 'primary',
                            'multiple': 'success',
                            'judgment': 'warning'
                          }[question.type] || 'info'">
                            {{ getTypeName(question.type) }}
                          </el-tag>
                        </div>
                        <div class="question-text" v-html="stripImages(question.content)"></div>
                      </div>
                      <div class="question-actions">
                        <el-button type="primary" size="small" @click="editQuestion(question)">
                          <el-icon><i class="el-icon-edit"></i></el-icon> 编辑
                        </el-button>
                        <el-button type="danger" size="small" @click="deleteQuestion(question.id)">
                          <el-icon><i class="el-icon-delete"></i></el-icon> 删除
                        </el-button>
                      </div>
                    </div>
                    <div v-if="getQuestionsBySubcategory(subject.id, subcategory.id).length === 0" class="empty-questions">
                      暂无题目
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 分页组件 -->
          <div class="pagination" style="margin-top: 20px; text-align: right;">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </el-tab-pane>
      
      <!-- 排行榜管理 -->
      <el-tab-pane label="排行榜管理" name="leaderboard">
        <div class="leaderboard-management" style="position: relative; min-height: 400px;">
          <!-- 筛选区域 -->
          <div class="filter-section" style="position: sticky; top: 0; z-index: 10; padding: 15px; background-color: #f5f7fa; border-radius: 8px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 15px; overflow-x: auto; padding-bottom: 5px;">
              <div style="display: flex; align-items: center; gap: 5px;">
                <label style="font-weight: 500; width: 60px;">学号</label>
                <el-input v-model="filterStudentId" placeholder="输入学号" style="width: 180px;"></el-input>
              </div>
              <div style="display: flex; align-items: center; gap: 5px;">
                <label style="font-weight: 500; width: 60px;">年级</label>
                <el-select v-model="filterGrade" placeholder="选择年级" style="width: 120px;" @change="handleGradeChange">
                  <el-option label="全部" value=""></el-option>
                  <el-option v-for="grade in gradesList" :key="grade" :label="grade + '年级'" :value="grade"></el-option>
                </el-select>
              </div>
              <div style="display: flex; align-items: center; gap: 5px;">
                <label style="font-weight: 500; width: 60px;">班级</label>
                <el-select v-model="filterClass" placeholder="选择班级" style="width: 120px;">
                  <el-option label="全部" value=""></el-option>
                  <el-option v-for="classNum in classesList" :key="classNum" :label="classNum + '班'" :value="classNum"></el-option>
                </el-select>
              </div>
              <div style="display: flex; align-items: center; gap: 5px;">
                <label style="font-weight: 500; width: 60px;">学科</label>
                <el-select v-model="filterSubject" placeholder="选择学科" style="width: 150px;">
                  <el-option label="全部" value=""></el-option>
                  <el-option v-for="subject in subjects" :key="subject.id" :label="subject.name" :value="subject.id"></el-option>
                </el-select>
              </div>
              <div style="display: flex; align-items: center; gap: 5px; white-space: nowrap;">
                <label style="font-weight: 500; width: 70px;">时间范围</label>
                <el-select v-model="filterTimeRange" placeholder="选择时间" style="width: 140px;">
                  <el-option label="全部" value=""></el-option>
                  <el-option label="今日" value="today"></el-option>
                  <el-option label="近一周" value="week"></el-option>
                  <el-option label="近一月" value="month"></el-option>
                </el-select>
              </div>
            </div>
            <div style="margin-top: 15px; display: flex; gap: 10px;">
              <el-button type="primary" @click="applyFilters">应用筛选</el-button>
              <el-button @click="resetFilters">重置</el-button>
            </div>
          </div>
          

          
          <h3>用户答题统计</h3>
          <el-table :data="paginatedUserStats" stripe style="width: 100%">
            <el-table-column label="学号" width="80" align="center">
              <template #default="{ row }">
                {{ row.student_id || row.user_id || '未设置' }}
              </template>
            </el-table-column>
            <el-table-column prop="name" label="姓名" width="80" align="center">
              <template #default="{ row }">
                {{ row.name || '未设置' }}
              </template>
            </el-table-column>
            <el-table-column prop="grade" label="年级" width="80" align="center">
              <template #default="{ row }">
                {{ row.grade || '未设置' }}
              </template>
            </el-table-column>
            <el-table-column prop="class" label="班级" width="80" align="center">
              <template #default="{ row }">
                {{ row.class || '未设置' }}
              </template>
            </el-table-column>
            <el-table-column label="答题次数" width="80" align="center">
              <template #default="{ row }">
                {{ row.total_sessions || 0 }}
              </template>
            </el-table-column>
            <el-table-column label="答题总数" width="80" align="center">
              <template #default="{ row }">
                {{ row.total_questions || 0 }}
              </template>
            </el-table-column>
            <el-table-column label="正确数" width="80" align="center">
              <template #default="{ row }">
                {{ row.correct_count || 0 }}
              </template>
            </el-table-column>
            <el-table-column label="正确率" width="120" align="center">
              <template #default="{ row }">
                <el-progress 
                  :percentage="Math.round(row.avg_accuracy || 0)" 
                  :color="getProgressColor(row.avg_accuracy)"
                ></el-progress>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="openUserDetailDialog(row)">查看记录</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 排行榜管理分页 -->
          <div class="pagination" style="margin-top: 20px; text-align: right;">
            <el-pagination
              v-model:current-page="leaderboardCurrentPage"
              v-model:page-size="leaderboardPageSize"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="leaderboardTotal"
              @size-change="handleLeaderboardSizeChange"
              @current-change="handleLeaderboardCurrentChange"
            />
          </div>
          
          <h3 style="margin-top: 30px;">最近答题记录</h3>
          <el-table :data="paginatedRecentRecords" stripe style="width: 100%">
            <el-table-column prop="id" label="ID" width="60" align="center"></el-table-column>
            <el-table-column label="学号" width="80" align="center">
              <template #default="{ row }">
                {{ row.student_id || row.user_id || '未设置' }}
              </template>
            </el-table-column>
            <el-table-column prop="user_name" label="姓名" width="80" align="center">
              <template #default="{ row }">
                {{ row.user_name || '未设置' }}
              </template>
            </el-table-column>
            <el-table-column prop="subject_name" label="学科" width="100" align="center"></el-table-column>
            <el-table-column prop="subcategory_name" label="学科题库" width="180" align="center">
              <template #default="{ row }">
                {{ row.subcategory_name || '全部' }}
              </template>
            </el-table-column>
            <el-table-column label="成绩" width="80" align="center">
              <template #default="{ row }">
                {{ row.correct_count }} / {{ row.total_questions }}
              </template>
            </el-table-column>
            <el-table-column label="正确率" width="80" align="center">
              <template #default="{ row }">
                {{ Math.round(row.correct_count / row.total_questions * 100) }}%
              </template>
            </el-table-column>
            <el-table-column label="用时(秒)" width="80" align="center">
              <template #default="{ row }">
                {{ row.time_spent || 0 }}
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="时间" width="140" align="center">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="openUserDetailDialog(row)">查看记录</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 数据分析分页 -->
          <div class="pagination" style="margin-top: 20px; text-align: right;">
            <el-pagination
              v-model:current-page="analysisCurrentPage"
              v-model:page-size="analysisPageSize"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="analysisTotal"
              @size-change="handleAnalysisSizeChange"
              @current-change="handleAnalysisCurrentChange"
            />
          </div>
          

        </div>
      </el-tab-pane>
      



      
      <!-- 数据分析 -->
      <el-tab-pane label="数据分析" name="analysis">
        <AnalysisView />
      </el-tab-pane>
      
      <!-- 数据库管理 -->
      <el-tab-pane label="数据库管理" name="data-management" @click="handleDataManagementClick">
        <div v-if="isDataManagementAuthenticated" class="data-management" style="padding: 20px;">
          <!-- 数据备份与恢复 -->
          <div class="setting-card" style="margin-bottom: 30px;">
            <h3 class="setting-title">数据备份与恢复</h3>
            <div style="padding: 20px;">
              <div style="display: flex; gap: 20px; margin-bottom: 30px;">
                <el-button type="primary" @click="backupData">备份数据</el-button>
                <el-button type="success" @click="restoreData">恢复数据</el-button>
                <el-button type="warning" @click="exportData">导出数据</el-button>
                <el-upload
                  class="upload-restore"
                  action="#"
                  :auto-upload="false"
                  :on-change="handleFileChange"
                  accept=".json,.backup"
                  :limit="1"
                >
                  <el-button type="info">上传备份文件</el-button>
                </el-upload>
              </div>
              <p style="color: #666;">备份数据将保存当前系统的所有数据，包括题目、用户、答题记录等。恢复数据将覆盖当前系统的数据，请谨慎操作。</p>
            </div>
          </div>
          
          <!-- 数据清理 -->
          <div class="setting-card" style="margin-bottom: 30px;">
            <h3 class="setting-title">数据清理</h3>
            <div style="padding: 20px;">
              <div style="display: flex; gap: 20px; margin-bottom: 30px;">
                <el-button type="danger" @click="confirmClearAllData">清空所有数据</el-button>
                <el-button type="warning" @click="confirmClearUserRecords">清空用户答题记录</el-button>
                <el-button type="info" @click="confirmClearLeaderboard">清空排行榜数据</el-button>
                <el-button type="danger" @click="clearGrades">清空年级数据</el-button>
                <el-button type="danger" @click="clearClasses">清空班级数据</el-button>
              </div>
              <p style="color: #666;">数据清理操作将永久删除相应的数据，请谨慎操作。建议在清理前先备份数据。</p>
            </div>
          </div>
          

        </div>
        <div v-else class="data-management-locked" style="padding: 60px; text-align: center;">
          <el-icon class="lock-icon" style="font-size: 48px; color: #909399; margin-bottom: 20px;"><i class="el-icon-lock"></i></el-icon>
          <h3 style="margin-bottom: 10px; color: #606266;">数据库管理功能已锁定</h3>
          <p style="color: #909399; margin-bottom: 30px;">请输入管理员密码解锁数据库管理功能</p>
          <el-button type="primary" @click="showDataManagementPasswordDialog">解锁数据库管理</el-button>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <!-- 数据库管理密码验证对话框 -->
    <el-dialog
      v-model="dataManagementPasswordDialogVisible"
      title="🔐 数据库管理验证"
      width="480px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @open="focusDataManagementPasswordInput"
      custom-class="database-management-dialog"
    >
      <div class="dialog-content">
        <div class="dialog-icon">
          <el-icon class="lock-icon"><i class="el-icon-lock"></i></el-icon>
        </div>
        <h3 class="dialog-title">数据库管理验证</h3>
        <p class="dialog-description">为了保护系统安全，请输入管理员密码解锁数据库管理功能</p>
        <el-form :model="dataManagementPasswordForm" label-width="100px" @submit.prevent="verifyDataManagementPassword" class="password-form">
          <el-form-item label="管理员密码" class="password-input-item">
            <el-input 
              ref="dataManagementPasswordInputRef" 
              v-model="dataManagementPasswordForm.password" 
              type="password" 
              placeholder="请输入管理员密码" 
              show-password 
              @keyup="handleDataManagementKeyUp"
              class="password-input"
            ></el-input>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button class="cancel-button" @click="dataManagementPasswordDialogVisible = false">取消</el-button>
          <el-button type="primary" class="verify-button" @click="verifyDataManagementPassword">验证</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 学科题库管理对话框 -->
    <el-dialog
      v-model="subcategoryDialogVisible"
      :title="`管理 ${currentSubjectForSubcategory?.name} 的学科题库`"
      width="700px"
    >
      <div class="subcategory-management">
        <div class="add-subcategory" style="padding: 16px; background-color: #f5f7fa; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 15px; font-size: 16px; font-weight: 500; color: #303133;">添加新学科题库</h4>
          <div style="display: flex; align-items: flex-end; gap: 15px; flex-wrap: wrap;">
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 14px; color: #606266; font-weight: 500;">学科题库名称</label>
              <el-input v-model="newSubcategoryName" placeholder="请输入学科题库名称" style="width: 200px;"></el-input>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 14px; color: #606266; font-weight: 500;">选择图标</label>
              <el-select v-model="newSubcategoryIcon" placeholder="请选择图标" style="width: 150px;">
                <el-option v-for="(icon, index) in subjectIcons" :key="index" :label="icon + ' ' + subjectIconNames[index]" :value="index"></el-option>
              </el-select>
            </div>
            <el-button type="primary" @click="addSubcategory" style="margin-bottom: 0;">
              <el-icon><i class="el-icon-plus"></i></el-icon> 添加学科题库
            </el-button>
          </div>
        </div>
        
        <el-table :data="currentSubjectForSubcategory?.subcategories" style="margin-top: 20px;">
          <el-table-column prop="id" label="ID" width="80"></el-table-column>
          <el-table-column label="图标" width="80">
            <template #default="{ row }">
              <span class="subcategory-icon">{{ subjectIcons[row.iconIndex || 0] }}</span>
            </template>
          </el-table-column>
          <el-table-column label="学科题库名称">
            <template #default="{ row }">
              <div v-if="editingSubcategoryId === row.id" class="subcategory-edit">
                <el-input v-model="editingSubcategoryName" placeholder="输入学科题库名称" style="width: 200px; margin-right: 10px;"></el-input>
                <el-select v-model="editingSubcategoryIcon" placeholder="选择图标" style="width: 150px; margin-right: 10px;">
                  <el-option v-for="(icon, index) in subjectIcons" :key="index" :label="icon + ' ' + subjectIconNames[index]" :value="index"></el-option>
                </el-select>
                <el-button type="primary" size="small" @click="saveSubcategoryEdit(row.id)">保存</el-button>
                <el-button size="small" @click="cancelSubcategoryEdit">取消</el-button>
              </div>
              <div v-else class="subcategory-info">
                <span>{{ row.name }}</span>
                <el-button type="text" size="small" @click="editSubcategory(row)">编辑</el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="danger" size="small" @click="deleteSubcategory(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="subcategoryDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 批量添加题目对话框 -->
    <el-dialog
      v-model="batchAddDialogVisible"
      title="批量添加题目"
      width="1000px"
    >
      <div class="batch-add-management">
        <div class="batch-add-layout">
          <!-- 左侧输入区域 -->
          <div class="input-section">
            <el-form label-width="100px">
              <el-form-item label="学科">
                <el-select v-model="batchSubjectId" placeholder="选择学科" style="width: 100%;" @change="updateBatchSubcategories">
                  <el-option v-for="subject in subjects" :key="subject.id" :label="subject.name" :value="subject.id"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="学科题库">
                <el-select v-model="batchSubcategoryId" placeholder="选择学科题库" style="width: 100%;">
                  <el-option v-for="subcategory in batchSubcategories" :key="subcategory.id" :label="subcategory.name" :value="subcategory.id"></el-option>
                </el-select>
              </el-form-item>

              <el-form-item label="题目文本">
                <el-input
                  v-model="batchQuestionText"
                  type="textarea"
                  :rows="15"
                  placeholder="请粘贴题目文本，格式如下：\n下面语句中加点的词语运用不恰当的一项是(B)\nA. 选项1\nB. 选项2\nC. 选项3\nD. 选项4"
                  style="width: 100%;"
                ></el-input>
              </el-form-item>
            </el-form>
          </div>
          
          <!-- 右侧预览区域 -->
          <div class="preview-section">
            <h3>题目预览</h3>
            <div v-if="parsedQuestions.length > 0" class="preview-content">
              <div v-for="(question, index) in parsedQuestions" :key="index" class="preview-question">
                <div class="preview-question-content">
                  <span class="question-number">{{ index + 1 }}. </span>
                  <span v-html="question.content"></span>
                </div>
                <div class="preview-options">
                  <div v-for="(option, optIndex) in question.options" :key="optIndex" class="preview-option">
                    <span class="option-label">{{ String.fromCharCode(65 + optIndex) }}. </span>
                    {{ option }}
                    <span v-if="question.answer.includes(String.fromCharCode(65 + optIndex))" class="correct-answer-tag">(正确答案)</span>
                  </div>
                </div>
                <div v-if="question.explanation" class="preview-explanation">
                  <span class="explanation-label">解析：</span>
                  <span>{{ question.explanation }}</span>
                </div>
              </div>
            </div>
            <div v-else class="preview-empty">
              <p>请输入题目文本并点击"解析题目"按钮</p>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchAddDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="parseBatchQuestions">解析题目</el-button>
          <el-button type="success" @click="saveBatchQuestions" :disabled="parsedQuestions.length === 0">批量添加</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 添加/编辑题目对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑题目' : '添加题目'"
      width="800px"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="学科">
          <el-select v-model="form.subjectId" placeholder="选择学科" style="width: 100%;">
            <el-option v-for="subject in subjects" :key="subject.id" :label="subject.name" :value="subject.id"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="学科题库">
          <el-select v-model="form.subcategoryId" placeholder="选择学科题库" style="width: 100%;">
            <el-option v-for="subcategory in currentSubcategories" :key="subcategory.id" :label="subcategory.name" :value="subcategory.id"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="题目类型">
          <el-select v-model="form.type" placeholder="选择类型" style="width: 100%;">
            <el-option label="单选题" value="single"></el-option>
            <el-option label="多选题" value="multiple"></el-option>
            <el-option label="判断题" value="judgment"></el-option>
            <el-option label="听力题" value="listening"></el-option>
            <el-option label="阅读题" value="reading"></el-option>
            <el-option label="看图题" value="image"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="题目内容">
          <div style="height: 200px; margin-bottom: 50px; clear: both; position: relative; z-index: 100;">
            <QuillEditor
                  :key="editorKey"
                  v-model:content="form.content"
                  @ready="onQuillReady"
                  :options="{
                    theme: 'snow',
                    modules: {
                      toolbar: [
                        ['bold', 'italic', 'underline', 'strike'],
                        ['blockquote', 'code-block'],
                        [{ 'header': 1 }, { 'header': 2 }],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        [{ 'indent': '-1' }, { 'indent': '+1' }],
                        [{ 'direction': 'rtl' }],
                        [{ 'size': ['small', false, 'large', 'huge'] }],
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'font': [] }],
                        [{ 'align': [] }],
                        ['clean'],
                        ['image']
                      ]
                    },
                    placeholder: '输入题目内容'
                  }"
                  style="width: 100%; height: 100%; position: relative; z-index: 101;"
                />
          </div>
        </el-form-item>
        
        <el-form-item label="添加答案">
          <div class="options-container" style="margin-top: 50px;">
            <div class="correct-answer-tip" style="margin-bottom: 10px; padding: 10px; background-color: #f0f9ff; border-radius: 4px; border-left: 4px solid #409eff;">
              <span style="font-weight: bold; color: #409eff;">提示：</span> 勾选框用于标记<strong>正确答案</strong>，请选择一个或多个正确的选项。<br>
              <span style="font-weight: bold; color: #409eff;">图片上传：</span> 您可以直接复制图片，然后粘贴到答案编辑器中，或使用编辑器工具栏中的图片按钮上传图片。
            </div>
            <div v-for="(_, index) in form.options" :key="index" class="option-item">
              <el-checkbox 
                :label="String.fromCharCode(65 + index)" 
                v-model="form.selectedAnswers"
                :disabled="form.type === 'single' && form.selectedAnswers.length > 0 && !form.selectedAnswers.includes(String.fromCharCode(65 + index))"
              >
                {{ String.fromCharCode(65 + index) }}. 
              </el-checkbox>
              <div style="flex: 1; margin-left: 10px; margin-right: 10px;">
                <div 
                  contenteditable="true"
                  :innerHTML="form.options[index]"
                  placeholder="输入答案内容"
                  style="width: calc(100% - 80px); min-height: 60px; padding: 8px; border: 1px solid #dcdfe6; border-radius: 4px; outline: none;"
                  @paste="handlePaste"
                  @blur="handleContentChange($event, index)"
                ></div>
              </div>
              <el-button type="danger" size="small" @click="removeOption(index)">删除</el-button>
            </div>
            <el-button type="primary" size="small" @click="addOption" style="margin-top: 10px;">添加答案</el-button>
          </div>
        </el-form-item>
        
        <el-form-item label="答案" v-if="false">
          <el-input v-model="form.answer" placeholder="输入答案，如：A或AB"></el-input>
        </el-form-item>
        
        <el-form-item label="解析">
          <el-input v-model="form.explanation" type="textarea" :rows="2" placeholder="输入答案解析"></el-input>
        </el-form-item>
        
        <el-form-item label="音频文件">
          <el-upload
            class="upload-audio"
            action="#"
            :auto-upload="false"
            :on-change="handleAudioChange"
            accept=".mp3,.wav"
            :limit="1"
          >
            <el-button size="small" type="primary">上传音频</el-button>
            <template #tip>
              <div class="el-upload__tip">
                请上传MP3或WAV格式的音频文件
              </div>
            </template>
          </el-upload>
          <div style="margin-top: 10px; display: flex; align-items: center;">
            <el-input v-model="form.audio" placeholder="输入音频文件路径，如：audio/elephant.mp3" style="flex: 1;"></el-input>
            <el-button 
              v-if="form.audio" 
              type="danger" 
              size="small" 
              @click="deleteAudio"
              style="margin-left: 10px;"
            >
              删除音频
            </el-button>
          </div>
        </el-form-item>
        
        <el-form-item label="图片文件">
          <el-upload
            class="upload-image"
            action="#"
            :auto-upload="false"
            :on-change="handleImageChange"
            accept=".jpg,.jpeg,.png,.gif"
            :limit="1"
          >
            <el-button size="small" type="primary">上传图片</el-button>
            <template #tip>
              <div class="el-upload__tip">
                请上传JPG、JPEG、PNG或GIF格式的图片文件
              </div>
            </template>
          </el-upload>
          <el-input v-model="form.image" placeholder="输入图片文件路径，如：images/cat.jpg" style="margin-top: 10px;"></el-input>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveQuestion">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
  
  <!-- 用户详情对话框 -->
  <el-dialog
    v-model="userDetailDialogVisible"
    :title="selectedUser?.name ? `${selectedUser.name}的记录 (ID: ${currentAnswerRecordId || '未知'})` : `${selectedUser?.grade || '-'}年级${selectedUser?.class || '-'}班的${selectedUser?.student_id || selectedUser?.user_id || '未知'}的记录 (ID: ${currentAnswerRecordId || '未知'})`"
    width="1000px"
  >
    <div v-if="selectedUser" class="user-detail-info" style="margin-bottom: 20px; padding: 15px; background-color: #f5f7fa; border-radius: 8px;">
      <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <div><strong>学号:</strong> {{ selectedUser.student_id || selectedUser.user_id || '未知' }}</div>
        <div><strong>姓名:</strong> {{ selectedUser.name || '未知' }}</div>
        <div><strong>年级:</strong> {{ selectedUser.grade || '-' }}年级</div>
        <div><strong>班级:</strong> {{ selectedUser.class || '-' }}班</div>
        <div><strong>正确率:</strong> {{ Math.round(selectedUser.avg_accuracy || 0) }}%</div>
        <div><strong>答题数:</strong> {{ selectedUser.total_questions || 0 }}</div>
        <div><strong>答题次数:</strong> {{ selectedUser.total_sessions || 0 }}</div>
      </div>
    </div>
    
    <el-tabs v-model="activeUserDetailTab" style="margin-top: 20px;">
      <!-- 只在从用户答题统计点击时显示答题记录标签 -->
      <el-tab-pane v-if="dialogSource === 'userStats'" label="答题记录" name="records">
        <div class="user-answer-records" v-if="selectedUserRecords.length > 0">
          <div style="overflow-x: auto;">
            <el-table :data="selectedUserRecords" stripe style="width: 100%">
              <el-table-column prop="subject_name" label="学科" width="120" align="center"></el-table-column>
              <el-table-column prop="subcategory_name" label="学科题库" width="150" align="center">
                <template #default="{ row }">
                  {{ row.subcategory_name || '全部' }}
                </template>
              </el-table-column>
              <el-table-column label="成绩" width="100" align="center">
                <template #default="{ row }">
                  {{ row.correct_count }} / {{ row.total_questions }}
                </template>
              </el-table-column>
              <el-table-column label="正确率" width="100" align="center">
                <template #default="{ row }">
                  {{ Math.round(row.correct_count / row.total_questions * 100) }}%
                </template>
              </el-table-column>
              <el-table-column label="用时(秒)" width="100" align="center">
                <template #default="{ row }">
                  {{ row.time_spent || 0 }}
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="时间" width="180" align="center">
                <template #default="{ row }">
                  {{ formatDate(row.created_at) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
        <div v-else class="leaderboard-empty" style="text-align: center; padding: 40px;">
          <p>暂无答题记录</p>
        </div>
      </el-tab-pane>
      
      <!-- 只在从最近答题记录点击时显示做题记录标签 -->
      <el-tab-pane v-if="dialogSource === 'recentRecords'" label="做题记录" name="attempts">
        <div class="user-question-attempts" v-if="selectedUserQuestionAttempts.length > 0">
          <div style="overflow-x: auto;">
            <el-table :data="selectedUserQuestionAttempts" stripe style="width: 100%">
              <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
              <el-table-column prop="subject_name" label="学科" width="120" align="center"></el-table-column>
              <el-table-column prop="subcategory_name" label="学科题库" width="150" align="center">
                <template #default="{ row }">
                  {{ row.subcategory_name || '全部' }}
                </template>
              </el-table-column>
              <el-table-column prop="content" label="题目内容" min-width="200" align="center">
                <template #default="{ row }">
                  <el-tooltip :content="row.content" placement="top" effect="dark">
                    <div class="question-content-preview">{{ row.content.replace(/<[^>]*>/g, '').substring(0, 50) }}{{ row.content.length > 50 ? '...' : '' }}</div>
                  </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column label="用户答案" width="100" align="center">
              <template #default="{ row }">
                <span :class="{ 'correct-answer': row.is_correct || row.isCorrect, 'incorrect-answer': !row.is_correct && !row.isCorrect }">
                  {{ row.userAnswer || (Array.isArray(row.user_answer) ? row.user_answer.join('') : row.user_answer) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="正确答案" width="100" align="center">
              <template #default="{ row }">
                <span class="correct-answer">
                  {{ row.correctAnswer || (Array.isArray(row.correct_answer) ? row.correct_answer.join('') : row.correct_answer) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="结果" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="(row.isCorrect || row.is_correct) ? 'success' : 'danger'">
                  {{ (row.isCorrect || row.is_correct) ? '正确' : '错误' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="时间" width="180" align="center">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
            </el-table>
          </div>
        </div>
        <div v-else class="leaderboard-empty" style="text-align: center; padding: 40px;">
          <p>暂无做题记录</p>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<style scoped>
/* 基础样式 */
.correct-answer {
  color: #67c23a;
  font-weight: bold;
}

.incorrect-answer {
  color: #f56c6c;
  font-weight: bold;
}

/* 基础设置样式 */
.basic-settings {
  padding: 20px;
}

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

/* 表格样式 */
.table-container {
  margin-top: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 24px;
  overflow: hidden;
}

.el-table {
  border-radius: 8px !important;
  overflow: hidden !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
}

.el-table__row {
  transition: all 0.3s ease !important;
  height: auto !important;
  min-height: 60px;
}

.el-table__row:hover {
  background-color: #f8f9fa !important;
}

.el-table__cell {
  padding: 16px 12px !important;
  vertical-align: middle !important;
  text-align: center !important;
  border-bottom: 1px solid #f0f2f5 !important;
  display: table-cell !important;
}

.el-table th {
  background-color: #f8f9fa !important;
  color: #303133 !important;
  font-weight: 600 !important;
  text-align: center !important;
  padding: 12px !important;
  border-bottom: 2px solid #e4e7ed !important;
}

.el-table th .cell {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  font-size: 14px !important;
  text-align: center !important;
}

.el-table__cell .cell {
  text-align: center !important;
}

/* 只对特定的内容元素应用居中样式，不影响按钮 */
.el-table__cell .cell .subcategory-text,
.el-table__cell .cell .time-text,
.el-table__cell .cell .question-content-preview {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  margin: 0 auto !important;
}

/* 让按钮保持Element Plus的默认样式 */
.el-table__cell .el-button {
  display: inline-flex !important;
  margin: 0 4px !important;
}

.el-table__cell .el-progress {
  margin: 0 auto !important;
  display: block !important;
}

/* 标签样式 - 保持 Element Plus 默认样式，只做最小调整 */
.el-table__cell .el-tag {
  margin: 0 auto !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: auto !important;
  max-width: 100% !important;
  white-space: nowrap !important;
  overflow: visible !important;
  text-overflow: clip !important;
}

/* 表格内容居中辅助类 */
.subject-info,
.grade-info,
.class-info,
.subcategory-info {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  gap: 10px !important;
  width: 100% !important;
}

/* 题目内容列 */
.el-table__cell:nth-child(6) {
  text-align: left !important;
}

.el-table__cell:nth-child(6) .cell {
  justify-content: flex-start !important;
  align-items: flex-start !important;
}

/* 题目内容预览 */
.question-content-preview {
  line-height: 1.5 !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  display: -webkit-box !important;
  -webkit-line-clamp: 3 !important;
  line-clamp: 3 !important;
  -webkit-box-orient: vertical !important;
  width: 100% !important;
}

/* 题目内容样式 */
.question-content-wrapper {
  width: 100%;
}

.content-with-image {
  display: flex !important;
  align-items: flex-start !important;
  gap: 12px !important;
  flex-wrap: wrap !important;
}

.image-preview {
  flex-shrink: 0 !important;
  width: 80px !important;
  height: 60px !important;
  overflow: hidden !important;
  border-radius: 6px !important;
  border: 1px solid #e4e7ed !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05) !important;
  transition: all 0.3s ease !important;
}

.image-preview:hover {
  transform: scale(1.05) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.question-image {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}

.content-with-audio {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.audio-icon {
  font-size: 18px;
  color: #409eff;
}

.content-text {
  flex: 1 !important;
  min-width: 0 !important;
  word-break: break-word !important;
  line-height: 1.5 !important;
  font-size: 14px !important;
  color: #303133 !important;
}

/* 文本样式 */
.subcategory-text {
  text-align: center !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 0 auto !important;
  font-size: 13px !important;
  color: #606266 !important;
  line-height: 1.4 !important;
  width: 100% !important;
  height: 100% !important;
  min-height: 24px !important;
}

.time-text {
  text-align: center !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 0 auto !important;
  font-size: 12px !important;
  color: #909399 !important;
  line-height: 1.4 !important;
  width: 100% !important;
  height: 100% !important;
  min-height: 24px !important;
}

/* 操作按钮 */
.row-operations {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  gap: 8px !important;
  width: 100% !important;
  padding: 4px 0 !important;
}

.row-operations .el-button {
  padding: 6px 12px !important;
  font-size: 13px !important;
  border-radius: 6px !important;
  transition: all 0.3s ease !important;
  min-width: auto !important;
  width: auto !important;
  white-space: nowrap !important;
}

.row-operations .el-button:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

.row-operations .el-button--primary {
  background-color: #409eff !important;
  border-color: #409eff !important;
}

.row-operations .el-button--primary:hover {
  background-color: #66b1ff !important;
  border-color: #66b1ff !important;
}

.row-operations .el-button--danger {
  background-color: #f56c6c !important;
  border-color: #f56c6c !important;
}

.row-operations .el-button--danger:hover {
  background-color: #f78989 !important;
  border-color: #f78989 !important;
}

/* 有媒体的行 */
.has-media {
  background-color: #f9f9f9 !important;
}

/* 表格底部 */
.pagination {
  margin-top: 24px !important;
  text-align: right !important;
}

/* 筛选区域 */
.filter-section {
  margin-bottom: 20px !important;
  padding: 16px !important;
  background-color: #f8f9fa !important;
  border-radius: 8px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
}

/* 按钮样式 - 只设置边框圆角和过渡，不影响内部布局 */
.el-button {
  border-radius: 6px !important;
  transition: all 0.3s ease !important;
}

/* 确保按钮内部元素完全不受影响，保持Element Plus默认样式 */
.el-button span,
.el-button .el-icon,
.el-button .el-button__text,
.el-button .el-button__content,
.el-button .el-icon--left,
.el-button .el-icon--right {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: auto !important;
  height: auto !important;
  min-height: auto !important;
  line-height: normal !important;
  white-space: nowrap !important;
  overflow: visible !important;
}

/* 确保按钮文字可见 */
.el-button .el-button__text {
  display: inline !important;
}

.el-button:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

/* 输入框和选择器 */
.el-input,
.el-select {
  border-radius: 6px !important;
  transition: all 0.3s ease !important;
}

.el-input:focus-within,
.el-select:focus-within {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2) !important;
}

/* 内容提示框 */
.content-tooltip {
  max-width: 400px !important;
  white-space: pre-wrap !important;
  line-height: 1.4 !important;
}

/* 响应式设计 */
@media screen and (max-width: 1200px) {
  .table-container {
    padding: 16px !important;
  }
  
  .el-table__cell {
    padding: 12px 8px !important;
  }
  
  .image-preview {
    width: 60px !important;
    height: 45px !important;
  }
  
  .content-with-image {
    flex-direction: column !important;
    align-items: flex-start !important;
  }
  
  .row-operations {
    flex-direction: column !important;
    gap: 4px !important;
  }
  
  .row-operations .el-button {
    width: 100% !important;
    padding: 4px 8px !important;
    font-size: 12px !important;
  }
}

@media screen and (max-width: 768px) {
  .table-container {
    padding: 12px !important;
  }
  
  .el-table__cell {
    padding: 8px 4px !important;
  }
  
  .el-table th {
    padding: 8px !important;
  }
  
  .el-table th .cell {
    font-size: 12px !important;
  }
  
  .el-table__cell .el-tag {
    padding: 2px 8px !important;
    font-size: 12px !important;
    min-width: 50px !important;
  }
  
  .content-text {
    font-size: 13px !important;
  }
  
  .row-operations .el-button {
    padding: 2px 4px !important;
    font-size: 11px !important;
  }
}

/* 学科管理卡片式布局样式 */
.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.subject-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.subject-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #409eff;
}

.subject-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.subject-info-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.subject-icon-large {
  font-size: 40px;
}

.subject-edit-inline {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-buttons {
  display: flex;
  gap: 8px;
}

.subject-name-display h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.subject-name-display p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #909399;
}

.subject-actions {
  display: flex;
  gap: 6px;
}

/* 按钮样式 - 只设置图标间距，完全不覆盖Element Plus默认按钮样式 */
.subject-actions .el-button .el-icon,
.edit-buttons .el-button .el-icon,
.subcategories-header .el-button .el-icon,
.add-subject .el-button .el-icon {
  margin-right: 4px;
}

.subcategories-section {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}

.subcategories-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.subcategories-header span {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.subcategories-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.subcategory-tag {
  background: #f5f7fa;
  padding: 8px 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #e4e7ed;
  transition: all 0.2s ease;
}

.subcategory-tag:hover {
  background: #ecf5ff;
  border-color: #409eff;
}

.subcategory-tag span:first-child {
  font-size: 16px;
}

.subcategory-tag span:last-child {
  font-size: 13px;
  color: #303133;
}

.no-subcategories {
  text-align: center;
  padding: 16px;
  color: #909399;
  font-size: 13px;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .subjects-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuestionStore } from '../stores/questionStore'
import { getApiBaseUrl } from '../utils/database'
import { ElTabs, ElTabPane, ElInput, ElButton, ElTable, ElTableColumn, ElSelect, ElOption, ElDialog, ElForm, ElFormItem, ElPagination, ElCheckbox, ElUpload, ElMessage, ElMessageBox, ElTooltip, ElRow, ElCol, ElCard, ElProgress, ElTag, ElInputNumber, ElIcon } from 'element-plus'
import { QuillEditor } from '@vueup/vue-quill'
import AnalysisView from './AnalysisView.vue'

import 'element-plus/dist/index.css'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const store = useQuestionStore()
const router = useRouter()

const activeTab = ref('basic-settings')
const newSubjectName = ref('')
const newSubjectIcon = ref(0)
const subjects = computed(() => store.subjects)
const questions = computed(() => store.questions)
const filterSubjectId = ref('')
const dialogVisible = ref(false)
const isEditing = ref(false)

// 界面名称设置 - 使用 ref，点击更新按钮时才保存到 store
const interfaceName = ref(store.interfaceName)

// 答题设置 - 使用 store 中的设置
const randomizeAnswers = computed({
  get: () => store.settings.randomizeAnswers,
  set: (value) => { store.settings.randomizeAnswers = value }
})
const fixedQuestionCount = computed({
  get: () => store.settings.fixedQuestionCount,
  set: (value) => { store.settings.fixedQuestionCount = value }
})
const minQuestionCount = computed({
  get: () => store.settings.minQuestionCount,
  set: (value) => { store.settings.minQuestionCount = value }
})
const maxQuestionCount = computed({
  get: () => store.settings.maxQuestionCount,
  set: (value) => { store.settings.maxQuestionCount = value }
})
const fixedQuestionCountValue = computed({
  get: () => store.settings.fixedQuestionCountValue,
  set: (value) => { store.settings.fixedQuestionCountValue = value }
})

// 加载设置
const loadSettings = async () => {
  await store.loadSettings()
  // 同步更新界面名称的本地状态
  interfaceName.value = store.interfaceName
}

// 更新界面名称
const updateInterfaceName = async () => {
  if (interfaceName.value) {
    await store.updateInterfaceName(interfaceName.value)
    ElMessage.success('界面名称更新成功！')
  } else {
    ElMessage.error('请输入界面名称')
  }
}

// 更新答题设置
const updateAnswerSettings = async () => {
  const success = await store.updateSettings({
    randomizeAnswers: randomizeAnswers.value.toString(),
    fixedQuestionCount: fixedQuestionCount.value.toString(),
    minQuestionCount: minQuestionCount.value.toString(),
    maxQuestionCount: maxQuestionCount.value.toString(),
    fixedQuestionCountValue: fixedQuestionCountValue.value.toString()
  })
  if (success) {
    ElMessage.success('答题设置更新成功！')
  } else {
    ElMessage.error('答题设置更新失败')
  }
}

// 学科编辑相关
const editingSubjectId = ref(null)
const editingSubjectName = ref('')
const editingSubjectIcon = ref(0)

// 学科图标
const subjectIcons = ['📚', '🔢', '🌍', '🔬', '🎨', '🎵', '⚽', '⚖️']
// 学科图标对应的学科名称
const subjectIconNames = ['语文', '数学', '英语', '科学', '美术', '音乐', '体育', '道德与法治']

// 子分类管理相关
const subcategoryDialogVisible = ref(false)
const currentSubjectForSubcategory = ref(null)
const newSubcategoryName = ref('')
const newSubcategoryIcon = ref(0)

// 展开行管理
const expandedRows = ref([])

// 年级管理相关
const grades = ref([])
const newGradeName = ref('')
const editingGradeId = ref(null)
const editingGradeName = ref('')

// 班级管理相关
const classes = ref([])
const newClassName = ref('')
const editingClassId = ref(null)
const editingClassName = ref('')

// 子分类编辑相关
const editingSubcategoryId = ref(null)
const editingSubcategoryName = ref('')
const editingSubcategoryIcon = ref(0)

// 批量添加题目相关
const batchAddDialogVisible = ref(false)
const batchSubjectId = ref('')
const batchSubcategoryId = ref('')
const batchQuestionType = ref('single')
const batchQuestionText = ref('')
const parsedQuestions = ref([])

// 批量添加时的子分类列表
const batchSubcategories = computed(() => {
  if (!batchSubjectId.value) return []
  const subject = subjects.value.find(s => s.id === batchSubjectId.value)
  return subject ? subject.subcategories : []
})

// 题目管理相关
const searchKeyword = ref('')
const filterType = ref('')
const selectedQuestions = ref([])
const isCategoryView = ref(false)
const filterSubcategoryId = ref('')

// 切换视图模式
const toggleViewMode = () => {
  isCategoryView.value = !isCategoryView.value
}

// 应用题目筛选
const applyQuestionFilters = () => {
  // 重置分页到第一页
  currentPage.value = 1
}

// 处理学科变化
const handleSubjectChange = () => {
  // 当学科变化时，重置子分类选择
  filterSubcategoryId.value = ''
}

// 获取学科的题目数量
const getSubjectQuestionCount = (subjectId) => {
  return questions.value.filter(q => {
    const qSubjectId = q.subjectId || q.subject_id
    return qSubjectId === subjectId
  }).length
}

// 获取子分类的题目数量
const getSubcategoryQuestionCount = (subjectId, subcategoryId) => {
  return questions.value.filter(q => {
    const qSubjectId = q.subjectId || q.subject_id
    const qSubcategoryId = q.subcategoryId || q.subcategory_id
    return qSubjectId === subjectId && qSubcategoryId === subcategoryId
  }).length
}

// 获取子分类的题目
const getQuestionsBySubcategory = (subjectId, subcategoryId) => {
  return questions.value.filter(q => {
    const qSubjectId = q.subjectId || q.subject_id
    const qSubcategoryId = q.subcategoryId || q.subcategory_id
    return qSubjectId === subjectId && qSubcategoryId === subcategoryId
  })
}

// 获取题目类型名称
const getTypeName = (type) => {
  const typeNames = {
    'single': '单选题',
    'multiple': '多选题',
    'judgment': '判断题',
    'listening': '听力题',
    'reading': '阅读题',
    'image': '看图题'
  }
  return typeNames[type] || '未知'
}

// 筛选后的子分类列表
const filterSubcategories = computed(() => {
  if (!filterSubjectId.value) return []
  const subject = subjects.value.find(s => s.id === parseInt(filterSubjectId.value))
  return subject ? subject.subcategories : []
})

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 排行榜管理分页相关
const leaderboardCurrentPage = ref(1)
const leaderboardPageSize = ref(10)
const leaderboardTotal = ref(0)



// 密码验证相关
const isAuthenticated = ref(false)
const passwordDialogVisible = ref(true)
const passwordForm = ref({
  password: ''
})
const passwordInputRef = ref(null)

// 数据库管理验证相关
const isDataManagementAuthenticated = ref(false)
const dataManagementPasswordDialogVisible = ref(false)
const dataManagementPasswordForm = ref({
  password: ''
})
const dataManagementPasswordInputRef = ref(null)

// 验证密码
const verifyPassword = () => {
  // 正确密码
  const correctPassword = 'xgsy8188'
  
  if (passwordForm.value.password === correctPassword) {
    isAuthenticated.value = true
    passwordDialogVisible.value = false
    // 使用sessionStorage代替localStorage，更安全
    sessionStorage.setItem('adminAuthenticated', 'true')
  } else {
    ElMessage.error('密码错误，请重新输入！')
    passwordForm.value.password = ''
  }
}

// 退出登录
const logout = () => {
  isAuthenticated.value = false
  isDataManagementAuthenticated.value = false
  passwordDialogVisible.value = true
  sessionStorage.removeItem('adminAuthenticated')
  sessionStorage.removeItem('dataManagementAuthenticated')
}

// 显示数据库管理密码对话框
const showDataManagementPasswordDialog = () => {
  dataManagementPasswordDialogVisible.value = true
}

// 验证数据库管理密码
const verifyDataManagementPassword = () => {
  // 正确密码
  const correctPassword = 'xgsy8188'
  
  if (dataManagementPasswordForm.value.password === correctPassword) {
    isDataManagementAuthenticated.value = true
    dataManagementPasswordDialogVisible.value = false
    // 使用sessionStorage存储状态
    sessionStorage.setItem('dataManagementAuthenticated', 'true')
    ElMessage.success('数据库管理功能已解锁！')
  } else {
    ElMessage.error('密码错误，请重新输入！')
    dataManagementPasswordForm.value.password = ''
  }
}

// 处理数据库管理标签点击
const handleDataManagementClick = () => {
  // 检查sessionStorage中的数据库管理认证状态
  if (sessionStorage.getItem('dataManagementAuthenticated') === 'true') {
    isDataManagementAuthenticated.value = true
  } else {
    showDataManagementPasswordDialog()
  }
}

// 聚焦密码输入框
const focusPasswordInput = () => {
  setTimeout(() => {
    if (passwordInputRef.value && passwordInputRef.value.$el) {
      const inputElement = passwordInputRef.value.$el.querySelector('input')
      if (inputElement) {
        inputElement.focus()
      }
    }
  }, 100)
}

// 聚焦数据库管理密码输入框
const focusDataManagementPasswordInput = () => {
  setTimeout(() => {
    if (dataManagementPasswordInputRef.value && dataManagementPasswordInputRef.value.$el) {
      const inputElement = dataManagementPasswordInputRef.value.$el.querySelector('input')
      if (inputElement) {
        inputElement.focus()
      }
    }
  }, 100)
}

// 处理键盘事件
const handleKeyUp = (event) => {
  if (event.key === 'Enter' || event.keyCode === 13) {
    verifyPassword()
  }
}

// 处理数据库管理验证键盘事件
const handleDataManagementKeyUp = (event) => {
  if (event.key === 'Enter' || event.keyCode === 13) {
    verifyDataManagementPassword()
  }
}

const backToHome = () => {
  router.push('/')
}

// 初始化时检查登录状态
onMounted(async () => {
  // 检查sessionStorage中的登录状态
  if (sessionStorage.getItem('adminAuthenticated') === 'true') {
    isAuthenticated.value = true
    passwordDialogVisible.value = false
    // 检查数据库管理认证状态
    if (sessionStorage.getItem('dataManagementAuthenticated') === 'true') {
      isDataManagementAuthenticated.value = true
    }
    // 加载年级和班级数据
    await loadGrades()
    await loadClasses()
    await loadGradesAndClasses()
    // 加载设置
    await loadSettings()
  }
})

const form = ref({
  id: null,
  subjectId: '',
  subcategoryId: '',
  type: 'single',
  content: '<p>请输入题目内容</p>',
  options: ['', '', '', ''],
  answer: '',
  selectedAnswers: [],
  explanation: ''
})

const editorKey = ref(0)

// 子分类相关
const currentSubcategories = computed(() => {
  if (!form.value.subjectId) return []
  const subject = subjects.value.find(s => s.id === form.value.subjectId)
  return subject ? subject.subcategories : []
})

const filteredQuestions = computed(() => {
  let filtered = questions.value
  
  // 按学科过滤
  if (filterSubjectId.value) {
    const subjectId = parseInt(filterSubjectId.value)
    filtered = filtered.filter(q => {
      const qSubjectId = q.subjectId || q.subject_id
      return qSubjectId === subjectId
    })
  }
  
  // 按子分类过滤
  if (filterSubcategoryId.value) {
    const subcategoryId = parseInt(filterSubcategoryId.value)
    filtered = filtered.filter(q => {
      const qSubcategoryId = q.subcategoryId || q.subcategory_id
      return qSubcategoryId === subcategoryId
    })
  }
  
  // 按类型过滤
  if (filterType.value) {
    filtered = filtered.filter(q => q.type === filterType.value)
  }
  
  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(q => {
      // 搜索题目内容
      if (q.content && q.content.toLowerCase().includes(keyword)) return true
      // 搜索选项
      if (q.options && Array.isArray(q.options)) {
        for (const option of q.options) {
          if (option && option.toLowerCase().includes(keyword)) return true
        }
      }
      // 搜索答案
      if (q.answer && q.answer.toLowerCase().includes(keyword)) return true
      // 搜索学科名称
      if (q.subjectName && q.subjectName.toLowerCase().includes(keyword)) return true
      // 搜索子分类名称
      if (q.subcategoryName && q.subcategoryName.toLowerCase().includes(keyword)) return true
      return false
    })
  }
  
  // 添加学科和子分类名称
  filtered = filtered.map(q => {
    // 获取学科名称，支持两种命名格式
    const subjectId = q.subjectId || q.subject_id
    const subject = subjects.value.find(s => s.id === subjectId)
    const subjectName = subject ? subject.name : ''
    
    // 获取子分类名称，支持两种命名格式
    const subcategoryId = q.subcategoryId || q.subcategory_id
    let subcategoryName = ''
    if (subject && subcategoryId) {
      const subcategory = subject.subcategories.find(s => s.id === subcategoryId)
      subcategoryName = subcategory ? subcategory.name : ''
    }
    
    // 获取正确答案，支持多种命名格式
    const answer = q.answer || q.correct_answer || q.correctAnswer || ''
    
    // 获取题目类型名称
    const typeName = {
      'single': '单选题',
      'multiple': '多选题',
      'judgment': '判断题'
    }[q.type] || '未知'
    
    return {
      ...q,
      subjectId: subjectId,
      subcategoryId: subcategoryId,
      answer: answer,
      subjectName,
      subcategoryName,
      typeName
    }
  })
  
  // 更新总数
  total.value = filtered.length
  
  // 计算分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filtered.slice(start, end)
})

const addSubject = () => {
  if (newSubjectName.value.trim()) {
    store.addSubject(newSubjectName.value.trim(), newSubjectIcon.value)
    newSubjectName.value = ''
    newSubjectIcon.value = 0
  }
}

// 编辑学科
const editSubject = (subject) => {
  editingSubjectId.value = subject.id
  editingSubjectName.value = subject.name
  editingSubjectIcon.value = subject.iconIndex || 0
}

// 保存学科编辑
const saveSubjectEdit = async (subjectId) => {
  if (editingSubjectName.value.trim()) {
    await store.updateSubject(subjectId, editingSubjectName.value.trim(), editingSubjectIcon.value)
    cancelSubjectEdit()
  }
}

// 取消学科编辑
const cancelSubjectEdit = () => {
  editingSubjectId.value = null
  editingSubjectName.value = ''
  editingSubjectIcon.value = 0
}

const deleteSubject = (subjectId) => {
  ElMessageBox.confirm('确定要删除该学科吗？删除后相关题目也会被删除。', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
  .then(() => {
    store.deleteSubject(subjectId)
  })
  .catch(() => {
    // 取消删除
  })
}

// 子分类管理方法
const manageSubcategories = (subject) => {
  currentSubjectForSubcategory.value = subject
  subcategoryDialogVisible.value = true
}

const addSubcategory = () => {
  if (newSubcategoryName.value.trim() && currentSubjectForSubcategory.value) {
    store.addSubcategory(currentSubjectForSubcategory.value.id, newSubcategoryName.value.trim(), newSubcategoryIcon.value)
    newSubcategoryName.value = ''
    newSubcategoryIcon.value = 0
  }
}

// 编辑子分类
const editSubcategory = (subcategory, subjectId = null) => {
  editingSubcategoryId.value = subcategory.id
  editingSubcategoryName.value = subcategory.name
  editingSubcategoryIcon.value = subcategory.iconIndex || 0
  // 如果提供了学科ID，更新currentSubjectForSubcategory
  if (subjectId) {
    const subject = subjects.value.find(s => s.id === subjectId)
    if (subject) {
      currentSubjectForSubcategory.value = subject
    }
  }
}

// 保存子分类编辑
const saveSubcategoryEdit = async (subcategoryId, subjectId = null) => {
  // 确定使用哪个学科ID
  const targetSubjectId = subjectId || (currentSubjectForSubcategory.value ? currentSubjectForSubcategory.value.id : null)
  
  if (editingSubcategoryName.value.trim() && targetSubjectId) {
    await store.updateSubcategory(targetSubjectId, subcategoryId, editingSubcategoryName.value.trim(), editingSubcategoryIcon.value)
    cancelSubcategoryEdit()
  }
}

// 取消子分类编辑
const cancelSubcategoryEdit = () => {
  editingSubcategoryId.value = null
  editingSubcategoryName.value = ''
  editingSubcategoryIcon.value = 0
}

// 更新批量添加时的子分类列表
const updateBatchSubcategories = () => {
  batchSubcategoryId.value = ''
}

// 解析批量添加的题目
const parseBatchQuestions = () => {
  const text = batchQuestionText.value
  if (!text) {
    ElMessage.error('请输入题目文本')
    return
  }
  
  const questions = []
  
  // 按题目分割文本，支持多种格式
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  let currentQuestion = null
  let inOptions = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // 检查是否是新题目
    // 模式1: 数字+标点+题目内容+答案括号 (如: 1. 题目内容(A))
    // 模式2: 题目内容+答案括号 (如: 题目内容(A))
    // 支持答案括号后有句号等标点的情况
    // 只匹配答案括号，不匹配选项中的拼音括号
    const numberedQuestionMatch = line.match(/^(\d+[.、]\s*)(.+?)([\(（]\s*[A-Da-d]+\s*[\)）])(.*)$/)
    const unnumberedQuestionMatch = line.match(/^(.+?)([\(（]\s*[A-Da-d]+\s*[\)）])(.*)$/)
    
    if (numberedQuestionMatch) {
      // 保存当前题目（如果存在）
      if (currentQuestion) {
        questions.push(currentQuestion)
      }
      
      // 创建新题目
      const questionText = numberedQuestionMatch[2].trim()
      const answerMatch = numberedQuestionMatch[3].match(/[A-Da-d]+/)
      const answer = answerMatch ? answerMatch[0].toUpperCase() : ''
      const postfix = numberedQuestionMatch[4] || ''
      
      // 自动识别题目类型
      let questionType = 'single'
      // 检查是否有【多选】标记
      if (questionText.includes('【多选】') || answer.length > 1) {
        questionType = 'multiple'
      }
      
      currentQuestion = {
            content: questionText + numberedQuestionMatch[3] + postfix,
            answer: answer,
            type: questionType,
            options: [],
            explanation: ''
          }
      inOptions = true
    } else if (unnumberedQuestionMatch) {
      // 保存当前题目（如果存在）
      if (currentQuestion) {
        questions.push(currentQuestion)
      }
      
      // 创建新题目（无编号）
      const questionText = unnumberedQuestionMatch[1].trim()
      const answerMatch = unnumberedQuestionMatch[2].match(/[A-Da-d]+/)
      const answer = answerMatch ? answerMatch[0].toUpperCase() : ''
      const postfix = unnumberedQuestionMatch[3] || ''
      
      // 自动识别题目类型
      let questionType = 'single'
      // 检查是否有【多选】标记
      if (questionText.includes('【多选】') || answer.length > 1) {
        questionType = 'multiple'
      }
      
      currentQuestion = {
            content: questionText + unnumberedQuestionMatch[2] + postfix,
            answer: answer,
            type: questionType,
            options: [],
            explanation: ''
          }
      inOptions = true
    } else if (inOptions && currentQuestion) {
      // 检查是否是选项（以字母+标点开头，允许行首有空格）
        const optionMatch = line.match(/^\s*([A-Za-z][\.\、．]?\s*)(.*)$/)
        if (optionMatch) {
          // 移除选项标签（A.、B.等），只保留实际内容
          const optionContent = optionMatch[2].trim()
          currentQuestion.options.push(optionContent)
        } else {
          // 检查是否是解析（允许行首有空格）
          const explanationMatch = line.match(/^\s*解析[:：]\s*(.*)$/)
          if (explanationMatch) {
            // 提取解析内容
            currentQuestion.explanation = explanationMatch[1].trim()
          } else {
            // 如果不是选项和解析，可能是题目内容的延续（多行题目）
            currentQuestion.content += ' ' + line
          }
        }
    }
  }
  
  // 保存最后一个题目
  if (currentQuestion) {
    questions.push(currentQuestion)
  }
  
  parsedQuestions.value = questions
  
  if (questions.length > 0) {
    ElMessage.success(`成功解析 ${questions.length} 道题目`)
  } else {
    ElMessage.error('未解析到题目，请检查格式')
  }
}

// 保存批量添加的题目
const saveBatchQuestions = async () => {
  if (parsedQuestions.value.length === 0) {
    ElMessage.error('请先解析题目')
    return
  }
  
  if (!batchSubjectId.value || !batchSubcategoryId.value) {
    ElMessage.error('请选择学科和学科题库')
    return
  }
  
  let successCount = 0
  
  for (const question of parsedQuestions.value) {
    // 从题目内容中移除答案部分，然后添加带两个空格的括号
    let contentWithoutAnswer = question.content
    // 匹配并移除答案括号部分，如：(A)、( A )、(     )、（A）、（ A ）、（     ）、(a)、( a )等
    contentWithoutAnswer = contentWithoutAnswer.replace(/\s*[\(（]\s*[A-Za-z]*\s*[\)）]/, ' (  )')
    
    const questionData = {
          subjectId: batchSubjectId.value,
          subcategoryId: batchSubcategoryId.value,
          type: question.type || 'single',
          content: contentWithoutAnswer,
          options: question.options,
          correctAnswer: question.answer,
          explanation: question.explanation || ''
        }
    
    try {
      // 直接调用API添加题目，不重新加载数据
      const response = await fetch(`${getApiBaseUrl()}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionData)
      })
      if (response.ok) {
        successCount++
      }
    } catch (error) {
      console.error('添加题目失败:', error)
    }
  }
  
  // 所有题目添加完成后，重新加载数据
  await store.loadData()
  
  ElMessage.success(`成功添加 ${successCount} 道题目`)
  batchAddDialogVisible.value = false
  // 重置表单
  batchSubjectId.value = ''
  batchSubcategoryId.value = ''
  batchQuestionType.value = 'single'
  batchQuestionText.value = ''
  parsedQuestions.value = []
}

const deleteSubcategory = (subcategoryId, subjectId = null) => {
  ElMessageBox.confirm('确定要删除该学科题库吗？删除后相关题目也会被删除。', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
  .then(() => {
    // 确定使用哪个学科ID
    const targetSubjectId = subjectId || (currentSubjectForSubcategory.value ? currentSubjectForSubcategory.value.id : null)
    if (targetSubjectId) {
      store.deleteSubcategory(targetSubjectId, subcategoryId)
    }
  })
  .catch(() => {
    // 取消删除
  })
}

// 题目管理方法
const handleSelectionChange = (selection) => {
  selectedQuestions.value = selection
}

const batchDeleteQuestions = () => {
  if (selectedQuestions.value.length === 0) return
  
  ElMessageBox.confirm(`确定要删除选中的 ${selectedQuestions.value.length} 道题目吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
  .then(() => {
    selectedQuestions.value.forEach(question => {
      store.deleteQuestion(question.id)
    })
    selectedQuestions.value = []
  })
  .catch(() => {
    // 取消删除
  })
}

const showAddQuestionDialog = () => {
  isEditing.value = false
  // 重置编辑器key
  editorKey.value++
  form.value = {
    id: null,
    subjectId: subjects.value.length > 0 ? subjects.value[0].id : '',
    subcategoryId: '',
    type: 'single',
    content: '<p>请输入题目内容</p>',
    options: ['', '', '', ''],
    answer: '',
    selectedAnswers: [],
    explanation: ''
  }
  dialogVisible.value = true
}

const editQuestion = (question) => {
  isEditing.value = true

  
  // 处理富文本内容
  let contentValue = ''
  if (typeof question.content === 'string' && question.content) {
    contentValue = question.content
  } else {
    contentValue = ''
  }
  
  // 构建表单数据
  const answer = question.answer || question.correct_answer || ''
  const audio = question.audio || question.audio_url || ''
  const image = question.image || question.image_url || ''
  form.value = {
    ...question,
    subjectId: question.subjectId || question.subject_id,
    subcategoryId: question.subcategoryId || question.subcategory_id,
    selectedAnswers: answer.split(''),
    content: contentValue,
    audio: audio,
    image: image
  }
  

  
  // 增加一个key来强制重新渲染编辑器
  editorKey.value++
  
  // 打开对话框
  dialogVisible.value = true

}

const saveQuestion = async () => {
  // 验证子分类
  if (!form.value.subcategoryId) {
    ElMessage.error('请选择学科题库！')
    return
  }
  
  // 验证正确答案
  if (form.value.selectedAnswers.length === 0) {
    ElMessage.error('请选择正确答案！')
    return
  }
  
  // 检查题目内容是否为空
  // 处理Delta对象
  let content = ''
  if (typeof form.value.content === 'object' && form.value.content.ops) {
    // 处理Delta对象，保留HTML内容
    content = form.value.content.ops.map(op => {
      if (typeof op.insert === 'string') {
        return op.insert
      } else if (op.insert && op.insert.image) {
        return `<img src="${op.insert.image}" alt="图片" style="max-width: 100%;">`
      }
      return ''
    }).join('')
  } else if (typeof form.value.content === 'string') {
    content = form.value.content
  }
  
  // 移除HTML标签并 trim 后检查是否为空
  const plainText = content.replace(/<[^>]*>/g, '').trim()
  if (!plainText || plainText === '请输入题目内容') {
    ElMessage.error('请输入题目内容！')
    return
  }
  
  // 清理答案中的HTML标签和Word格式，但保留图片标签
  form.value.options = await Promise.all(form.value.options.map(async (option) => {
    if (typeof option === 'string') {
      // 处理DataURL格式的图片
      let processedOption = option
      // 查找DataURL格式的图片
      const dataUrlRegex = /<img[^>]*src="data:image\/[^;]+;base64,[^"]+"[^>]*>/g
      const dataUrlMatches = processedOption.match(dataUrlRegex)
      if (dataUrlMatches) {
        for (const match of dataUrlMatches) {
          // 提取DataURL
          const srcMatch = match.match(/src="(data:image\/[^;]+;base64,[^"]+)"/)
          if (srcMatch && srcMatch[1]) {
            const dataUrl = srcMatch[1]
            // 上传DataURL到服务器
            try {
              const response = await fetch(`${getApiBaseUrl()}/upload-data-url`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ dataUrl })
              })
              if (response.ok) {
                const result = await response.json()
                // 替换DataURL为服务器路径
                processedOption = processedOption.replace(dataUrl, `${getApiBaseUrl().replace('/api', '')}/${result.filePath}`)
              }
            } catch (error) {
              console.error('上传DataURL失败:', error)
            }
          }
        }
      }
      // 保留图片标签，移除其他HTML标签
      let cleaned = processedOption
        // 保留图片标签
        .replace(/<img[^>]*>/g, match => match)
        // 移除其他HTML标签
        .replace(/<(?!img)[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim()
      return cleaned
    }
    return option
  }))
  
  // 将selectedAnswers转换为answer字符串
  form.value.answer = form.value.selectedAnswers.sort().join('')

  
  // 上传音频文件
  if (selectedAudioFile.value) {
    ElMessage.success(`正在上传音频文件 ${selectedAudioFile.value.name}...`)
    try {
      const formData = new FormData()
      formData.append('audio', selectedAudioFile.value)
      
      const response = await fetch(`${getApiBaseUrl()}/upload-audio`, {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        form.value.audio = result.filePath
        ElMessage.success(`音频文件 ${selectedAudioFile.value.name} 上传成功`)
      } else {
        ElMessage.error('音频文件上传失败')
      }
    } catch (error) {
      console.error('音频文件上传失败:', error)
      ElMessage.error('音频文件上传失败')
    }
  }
  
  // 上传图片文件
  if (selectedImageFile.value) {
    ElMessage.success(`正在上传图片文件 ${selectedImageFile.value.name}...`)
    try {
      const formData = new FormData()
      formData.append('image', selectedImageFile.value)
      
      const response = await fetch(`${getApiBaseUrl()}/upload-image`, {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        form.value.image = result.filePath
        ElMessage.success(`图片文件 ${selectedImageFile.value.name} 上传成功`)
      } else {
        ElMessage.error('图片文件上传失败')
      }
    } catch (error) {
      console.error('图片文件上传失败:', error)
      ElMessage.error('图片文件上传失败')
    }
  }
  
  try {

    // 确保form.value.content是字符串
    if (typeof form.value.content === 'object' && form.value.content.ops) {
      // 处理Delta对象，保留HTML内容
      form.value.content = form.value.content.ops.map(op => {
        if (typeof op.insert === 'string') {
          return op.insert
        } else if (op.insert && op.insert.image) {
          return `<img src="${op.insert.image}" alt="图片" style="max-width: 100%;">`
        }
        return ''
      }).join('')
    } else if (typeof form.value.content !== 'string') {
      form.value.content = ''
    }
    
    // 确保form.value.audio是字符串
    if (typeof form.value.audio !== 'string') {
      form.value.audio = form.value.audio || ''
    }
    
    // 确保form.value.image是字符串
    if (typeof form.value.image !== 'string') {
      form.value.image = form.value.image || ''
    }
    
    // 转换 subjectId 和 subcategoryId 为数字类型
    form.value.subjectId = parseInt(form.value.subjectId) || 0
    form.value.subcategoryId = parseInt(form.value.subcategoryId) || 0
    
    // 确保correctAnswer字段存在
    form.value.correctAnswer = form.value.answer
    

    // 保存题目
    if (isEditing.value) {
      await store.updateQuestion(form.value)
      ElMessage.success('题目更新成功！')
    } else {
      await store.addQuestion(form.value)
      ElMessage.success('题目添加成功！')
    }
    
    // 清空选中的文件
    selectedAudioFile.value = null
    selectedImageFile.value = null
    
    dialogVisible.value = false
  } catch (error) {
    console.error('保存题目失败:', error)
    ElMessage.error('保存题目失败，请稍后重试！')
  }
}

const deleteQuestion = (questionId) => {
  ElMessageBox.confirm('确定要删除该题目吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
  .then(() => {
    store.deleteQuestion(questionId)
  })
  .catch(() => {
  })
}

const addOption = () => {
  form.value.options.push('')
}

const removeOption = (index) => {
  // 移除对应的答案选项
  const optionLabel = String.fromCharCode(65 + index)
  const answerIndex = form.value.selectedAnswers.indexOf(optionLabel)
  if (answerIndex !== -1) {
    form.value.selectedAnswers.splice(answerIndex, 1)
  }
  // 移除选项
  form.value.options.splice(index, 1)
  // 重新计算剩余选项的标签
  // 这里不需要重新计算标签，因为选项标签是根据索引动态生成的
}

// 保存选中的文件
const selectedAudioFile = ref(null)
const selectedImageFile = ref(null)

// 文件选择处理函数
const handleAudioChange = (file) => {
  selectedAudioFile.value = file.raw
  ElMessage.success(`音频文件 ${file.name} 已选择`)
  // 暂时不上传，只保存文件对象，在保存时上传
  form.value.audio = `audio/${file.name}`
}

const handleImageChange = (file) => {
  selectedImageFile.value = file.raw
  ElMessage.success(`图片文件 ${file.name} 已选择`)
  // 暂时不上传，只保存文件对象，在保存时上传
  form.value.image = `images/${file.name}`
}

// 处理粘贴事件
const handlePaste = (event) => {
  const clipboardData = event.clipboardData || event.originalEvent.clipboardData;
  if (!clipboardData) return;
  
  const items = clipboardData.items;
  let hasImage = false;
  
  for (const item of items) {
    if (item.type.indexOf('image') === 0) {
      hasImage = true;
      event.preventDefault();
      const blob = item.getAsFile();
      if (!blob) return;
      
      const reader = new FileReader();
      reader.onload = function(e) {
        // 确保目标元素存在
        if (!event.target) return;
        
        // 清空现有内容
        event.target.innerHTML = '';
        
        // 创建并添加图片元素
        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '200px';
        
        // 确保元素已经准备好
        if (event.target.isConnected) {
          event.target.appendChild(img);
          // 触发内容变化
          event.target.blur();
        }
      };
      reader.onerror = function() {
        console.error('读取图片失败');
      };
      reader.readAsDataURL(blob);
    }
  }
  
  // 只有在粘贴图片时才阻止默认行为，文本粘贴让默认行为继续执行
  if (!hasImage) {
    // 对于文本粘贴，不阻止默认行为
    // 但需要在粘贴后触发内容变化
    setTimeout(() => {
      if (event.target && event.target.isConnected) {
        event.target.blur();
      }
    }, 100);
  }
}

// 处理contenteditable div的内容变化
const handleContentChange = (event, index) => {
  form.value.options[index] = event.target.innerHTML;
}

// 删除音频文件
const deleteAudio = () => {
  if (form.value.audio) {
    // 显示确认对话框
    ElMessageBox.confirm('确定要删除该音频文件吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    .then(() => {
      // 清空音频路径
      form.value.audio = '';
      // 清空选中的音频文件
      selectedAudioFile.value = null;
      ElMessage.success('音频文件已删除！');
    })
    .catch(() => {
      // 取消删除
    });
  }
}

// 检查内容中是否包含有效的图片
const hasValidImage = (content) => {
  if (typeof content !== 'string') return false;
  // 检查是否包含带有src属性的img标签
  const imgRegex = /<img[^>]*src="[^"]+"[^>]*>/i;
  return imgRegex.test(content);
}

const extractImageUrl = (content) => {
  if (!content || typeof content !== 'string') return '';
  // 提取img标签中的src属性
  const imgMatch = content.match(/<img[^>]*src="([^"]*)"[^>]*>/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }
  // 提取DataURL（只匹配第一个）
  const dataUrlMatch = content.match(/data:image\/[^;]+;base64,[^"\s<>]+/i);
  if (dataUrlMatch) {
    return dataUrlMatch[0];
  }
  return '';
}

const stripImages = (content) => {
  if (!content || typeof content !== 'string') return '';
  // 移除所有img标签
  return content.replace(/<img[^>]*>/gi, '');
}



// 分页事件处理
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1 // 重置到第一页
}

const handleCurrentChange = (current) => {
  currentPage.value = current
}

// 排行榜管理分页事件处理
const handleLeaderboardSizeChange = (size) => {
  leaderboardPageSize.value = size
  leaderboardCurrentPage.value = 1 // 重置到第一页
}

const handleLeaderboardCurrentChange = (current) => {
  leaderboardCurrentPage.value = current
}



// 加载年级数据
const loadGrades = async () => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/grades`)
    if (response.ok) {
      const data = await response.json()
      // 确保数据格式正确，每个对象都有id属性
      if (Array.isArray(data)) {
        grades.value = data.map((grade, index) => ({
          id: grade.id || index + 1,
          name: grade.name || grade
        }))
      } else {
        // 如果返回的数据不是数组，显示空数组
        grades.value = []
      }
    } else {
      // 如果API请求失败，显示空数组
      grades.value = []
    }
  } catch (error) {
    console.error('加载年级数据失败:', error)
    // 如果发生错误，显示空数组
    grades.value = []
  }
}

// 加载班级数据
const loadClasses = async () => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/classes`)
    if (response.ok) {
      const data = await response.json()
      // 确保数据格式正确，每个对象都有id属性
      if (Array.isArray(data)) {
        classes.value = data.map((classItem, index) => ({
          id: classItem.id || index + 1,
          name: classItem.name || classItem
        }))
      } else {
        // 如果返回的数据不是数组，显示空数组
        classes.value = []
      }
    } else {
      // 如果API请求失败，显示空数组
      classes.value = []
    }
  } catch (error) {
    console.error('加载班级数据失败:', error)
    // 如果发生错误，显示空数组
    classes.value = []
  }
}

// 添加年级
const addGrade = async () => {
  if (!newGradeName.value) {
    ElMessage.error('请输入年级名称')
    return
  }
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/grades`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: newGradeName.value })
    })
    
    if (response.ok) {
      ElMessage.success('年级添加成功！')
      newGradeName.value = ''
      await loadGrades()
      await loadGradesAndClasses()
    } else {
      ElMessage.error('年级添加失败')
    }
  } catch (error) {
    console.error('添加年级失败:', error)
    ElMessage.error('年级添加失败')
  }
}

// 编辑年级
const editGrade = (grade) => {
  editingGradeId.value = grade.id
  editingGradeName.value = grade.name
}

// 保存年级编辑
const saveGradeEdit = async (gradeId) => {
  if (!gradeId) {
    ElMessage.error('年级ID无效')
    return
  }
  if (!editingGradeName.value) {
    ElMessage.error('请输入年级名称')
    return
  }
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/grades/${gradeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: editingGradeName.value })
    })
    
    if (response.ok) {
      ElMessage.success('年级更新成功！')
      cancelGradeEdit()
      await loadGrades()
      await loadGradesAndClasses()
    } else {
      ElMessage.error('年级更新失败')
    }
  } catch (error) {
    console.error('更新年级失败:', error)
    ElMessage.error('年级更新失败')
  }
}

// 取消年级编辑
const cancelGradeEdit = () => {
  editingGradeId.value = null
  editingGradeName.value = ''
}

// 删除年级
const deleteGrade = async (gradeId) => {
  if (!gradeId) {
    ElMessage.error('年级ID无效')
    return
  }
  if (confirm('确定要删除这个年级吗？')) {
    try {
      const response = await fetch(`${getApiBaseUrl()}/grades/${gradeId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        ElMessage.success('年级删除成功！')
        await loadGrades()
        await loadGradesAndClasses()
      } else {
        ElMessage.error('年级删除失败')
      }
    } catch (error) {
      console.error('删除年级失败:', error)
      ElMessage.error('年级删除失败')
    }
  }
}

// 添加班级
const addClass = async () => {
  if (!newClassName.value) {
    ElMessage.error('请输入班级名称')
    return
  }
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: newClassName.value })
    })
    
    if (response.ok) {
      ElMessage.success('班级添加成功！')
      newClassName.value = ''
      await loadClasses()
      await loadGradesAndClasses()
    } else {
      ElMessage.error('班级添加失败')
    }
  } catch (error) {
    console.error('添加班级失败:', error)
    ElMessage.error('班级添加失败')
  }
}

// 编辑班级
const editClass = (classItem) => {
  editingClassId.value = classItem.id
  editingClassName.value = classItem.name
}

// 保存班级编辑
const saveClassEdit = async (classId) => {
  if (!classId) {
    ElMessage.error('班级ID无效')
    return
  }
  if (!editingClassName.value) {
    ElMessage.error('请输入班级名称')
    return
  }
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/classes/${classId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: editingClassName.value })
    })
    
    if (response.ok) {
      ElMessage.success('班级更新成功！')
      cancelClassEdit()
      await loadClasses()
      await loadGradesAndClasses()
    } else {
      ElMessage.error('班级更新失败')
    }
  } catch (error) {
    console.error('更新班级失败:', error)
    ElMessage.error('班级更新失败')
  }
}

// 取消班级编辑
const cancelClassEdit = () => {
  editingClassId.value = null
  editingClassName.value = ''
}

// 删除班级
const deleteClass = async (classId) => {
  if (!classId) {
    ElMessage.error('班级ID无效')
    return
  }
  if (confirm('确定要删除这个班级吗？')) {
    try {
      const response = await fetch(`${getApiBaseUrl()}/classes/${classId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        ElMessage.success('班级删除成功！')
        await loadClasses()
        await loadGradesAndClasses()
      } else {
        ElMessage.error('班级删除失败')
      }
    } catch (error) {
      console.error('删除班级失败:', error)
      ElMessage.error('班级删除失败')
    }
  }
}

// 清空年级数据
const clearGrades = async () => {
  if (confirm('确定要清空年级数据吗？这将会删除所有年级数据。')) {
    try {
      const response = await fetch(`${getApiBaseUrl()}/grades/clear`, {
        method: 'POST'
      })
      if (response.ok) {
        ElMessage.success('年级数据清空成功！')
        await loadGrades()
        await loadGradesAndClasses()
      } else {
        ElMessage.error('年级数据清空失败')
      }
    } catch (error) {
      console.error('清空年级数据失败:', error)
      ElMessage.error('年级数据清空失败')
    }
  }
}

// 清空班级数据
const clearClasses = async () => {
  if (confirm('确定要清空班级数据吗？这将会删除所有班级数据。')) {
    try {
      const response = await fetch(`${getApiBaseUrl()}/classes/clear`, {
        method: 'POST'
      })
      if (response.ok) {
        ElMessage.success('班级数据清空成功！')
        await loadClasses()
        await loadGradesAndClasses()
      } else {
        ElMessage.error('班级数据清空失败')
      }
    } catch (error) {
      console.error('清空班级数据失败:', error)
      ElMessage.error('班级数据清空失败')
    }
  }
}

// Quill编辑器准备就绪事件
const onQuillReady = (editor) => {
  if (isEditing.value && form.value.content) {
    // 手动设置编辑器内容
    editor.root.innerHTML = form.value.content
    // 确保编辑器知道内容已更改
    editor.updateContents({})
  }
}

// 监听form.content的变化，确保编辑器内容同步
watch(() => form.value.content, (newValue) => {
}, { deep: true })

// 监听对话框打开事件，确保富文本内容正确显示
watch(dialogVisible, (newValue) => {
  if (newValue && isEditing.value) {
    // 确保内容是字符串格式
    if (typeof form.value.content !== 'string') {
      form.value.content = ''
    }
  }
})

// 监听批量添加题目文本变化，实现实时预览
watch(batchQuestionText, (newValue) => {
  if (batchAddDialogVisible && newValue) {
    parseBatchQuestions()
  }
})

// 监听批量添加对话框关闭事件，清空输入字段
watch(batchAddDialogVisible, (newValue) => {
  if (!newValue) {
    // 对话框关闭时清空所有字段
    batchSubjectId.value = ''
    batchSubcategoryId.value = ''
    batchQuestionType.value = 'single'
    batchQuestionText.value = ''
    parsedQuestions.value = []
  }
})

// 排行榜相关
const userStats = ref([])
const recentRecords = ref([])

// 筛选条件
const filterStudentId = ref('')
const filterGrade = ref('')
const filterClass = ref('')
const filterSubject = ref('')
const filterTimeRange = ref('')

// 年级和班级数据（与首页排行榜保持一致）
const gradesList = ref([])
const classesList = ref([])

// 加载年级和班级数据
const loadGradesAndClasses = async () => {
  try {
    // 获取年级列表
    const gradesResponse = await fetch(`${getApiBaseUrl()}/grades`)
    if (gradesResponse.ok) {
      const serverGrades = await gradesResponse.json()
      grades.value = serverGrades
      // 更新gradesList，提取年级数值
      if (Array.isArray(serverGrades)) {
        if (serverGrades.length > 0) {
          gradesList.value = serverGrades.map(grade => {
            if (typeof grade === 'object' && grade.name) {
              // 从年级名称中提取数字，如"1年级" -> 1
              const gradeNum = parseInt(grade.name.match(/\d+/)?.[0] || '')
              return isNaN(gradeNum) ? parseInt(grade.id) || 1 : gradeNum
            } else if (typeof grade === 'number') {
              return grade
            } else {
              return 1
            }
          }).filter((value, index, self) => self.indexOf(value) === index).sort((a, b) => a - b)
        } else {
          // 如果返回的数组为空，显示空数组
          gradesList.value = []
        }
      } else {
        // 如果返回的数据不是数组，显示空数组
        gradesList.value = []
      }
    } else {
      // 失败时显示空数组
      grades.value = []
      gradesList.value = []
    }
    
    // 获取班级列表
    const classesResponse = await fetch(`${getApiBaseUrl()}/classes`)
    if (classesResponse.ok) {
      const serverClasses = await classesResponse.json()
      classes.value = serverClasses
      // 更新classesList，提取班级数值
      if (Array.isArray(serverClasses)) {
        if (serverClasses.length > 0) {
          classesList.value = serverClasses.map(classItem => {
            if (typeof classItem === 'object' && classItem.name) {
              // 从班级名称中提取数字，如"1班" -> 1
              const classNum = parseInt(classItem.name.match(/\d+/)?.[0] || '')
              return isNaN(classNum) ? parseInt(classItem.id) || 1 : classNum
            } else if (typeof classItem === 'number') {
              return classItem
            } else {
              return 1
            }
          }).filter((value, index, self) => self.indexOf(value) === index).sort((a, b) => a - b)
        } else {
          // 如果返回的数组为空，显示空数组
          classesList.value = []
        }
      } else {
        // 如果返回的数据不是数组，显示空数组
        classesList.value = []
      }
    } else {
      // 失败时显示空数组
      classes.value = []
      classesList.value = []
    }
  } catch (error) {
    console.error('加载年级和班级数据失败:', error)
    // 失败时显示空数组
    grades.value = []
    classes.value = []
    gradesList.value = []
    classesList.value = []
  }
}

// 当年级变化时，重新加载班级列表
const handleGradeChange = async () => {
  try {
    // 从API获取班级数据
    const classesResponse = await fetch(`${getApiBaseUrl()}/classes`)
    if (classesResponse.ok) {
      const serverClasses = await classesResponse.json()
      // 更新classesList，提取班级数值
      if (Array.isArray(serverClasses)) {
        classesList.value = serverClasses.map(classItem => {
          if (typeof classItem === 'object' && classItem.name) {
            // 从班级名称中提取数字，如"1班" -> 1
            const classNum = parseInt(classItem.name)
            return isNaN(classNum) ? 1 : classNum
          } else if (typeof classItem === 'number') {
            return classItem
          } else {
            return 1
          }
        }).filter((value, index, self) => self.indexOf(value) === index).sort((a, b) => a - b)
      }
    } else {
      // 失败时使用默认数据
      classesList.value = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    }
    // 重置班级选择
    filterClass.value = ''
  } catch (error) {
    console.error('加载班级数据失败:', error)
    // 失败时使用默认数据
    classesList.value = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    // 重置班级选择
    filterClass.value = ''
  }
}



// 用户详情和答题记录对话框
const userDetailDialogVisible = ref(false)
const selectedUser = ref(null)
const selectedUserRecords = ref([])
const selectedUserQuestionAttempts = ref([])
const activeUserDetailTab = ref('records')
const dialogSource = ref('') // 记录对话框的来源：'userStats' 或 'recentRecords'
const currentAnswerRecordId = ref(null) // 当前答题记录的ID



// 获取用户统计数据
const fetchUserStats = async (grade = '', className = '') => {
  try {
    let url = `${getApiBaseUrl()}/leaderboard/global?limit=100`
    if (grade) url += `&grade=${grade}`
    if (className) url += `&class=${className}`
    
    const response = await fetch(url)
    if (response.ok) {
      const data = await response.json()
      userStats.value = data
    } else {
      console.error('获取用户统计数据失败，响应状态:', response.status)
      userStats.value = []
    }
  } catch (error) {
    console.error('获取用户统计数据失败:', error)
    userStats.value = []
  }
}

// 获取最近答题记录
const fetchRecentRecords = async () => {
  try {
    let url = `${getApiBaseUrl()}/answer-records/all?limit=50`
    
    // 添加筛选条件
    const params = new URLSearchParams()
    if (filterGrade.value) params.append('grade', filterGrade.value)
    if (filterClass.value) params.append('class', filterClass.value)
    if (filterSubject.value) params.append('subjectId', filterSubject.value)
    
    // 处理时间范围
    if (filterTimeRange.value) {
      const now = new Date()
      let startDate = new Date()
      
      switch (filterTimeRange.value) {
        case 'today':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          startDate.setDate(now.getDate() - 7)
          startDate.setHours(0, 0, 0, 0)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          startDate.setHours(0, 0, 0, 0)
          break
      }
      
      params.append('startDate', startDate.toISOString())
      params.append('endDate', now.toISOString())
    }
    
    if (params.toString()) {
      url += '&' + params.toString()
    }
    
    const response = await fetch(url)
    if (response.ok) {
      const data = await response.json()
      recentRecords.value = data
    } else {
      console.error('获取最近答题记录失败，响应状态:', response.status)
      recentRecords.value = []
    }
  } catch (error) {
    console.error('获取最近答题记录失败:', error)
    recentRecords.value = []
  }
}

// 应用筛选
const applyFilters = () => {
  // 重置分页到第一页
  leaderboardCurrentPage.value = 1
  fetchUserStats(filterGrade.value, filterClass.value, filterSubject.value)
  fetchRecentRecords()
}

// 重置筛选
const resetFilters = () => {
  filterStudentId.value = ''
  filterGrade.value = ''
  filterClass.value = ''
  filterSubject.value = ''
  filterTimeRange.value = ''
  applyFilters()
}

// 筛选后的用户统计数据
const filteredUserStats = computed(() => {
  let filtered = userStats.value
  // 应用筛选逻辑
  if (filterStudentId.value) {
    filtered = filtered.filter(user => {
      const studentId = user.student_id || user.user_id
      return studentId && studentId.toString().includes(filterStudentId.value)
    })
  }
  if (filterGrade.value) {
    filtered = filtered.filter(user => user.grade == filterGrade.value)
  }
  if (filterClass.value) {
    filtered = filtered.filter(user => user.class == filterClass.value)
  }
  return filtered
})

// 分页后的用户统计数据
const paginatedUserStats = computed(() => {
  const filtered = filteredUserStats.value
  leaderboardTotal.value = filtered.length
  const start = (leaderboardCurrentPage.value - 1) * leaderboardPageSize.value
  const end = start + leaderboardPageSize.value
  return filtered.slice(start, end)
})

// 筛选后的最近答题记录
const filteredRecentRecords = computed(() => {
  let filtered = recentRecords.value
  if (filterStudentId.value) {
    filtered = filtered.filter(record => {
      const studentId = record.student_id || record.user_id
      return studentId && studentId.toString().includes(filterStudentId.value)
    })
  }
  if (filterSubject.value) {
    filtered = filtered.filter(record => record.subject_id == filterSubject.value)
  }
  if (filterGrade.value) {
    filtered = filtered.filter(record => record.grade == filterGrade.value)
  }
  if (filterClass.value) {
    filtered = filtered.filter(record => record.class == filterClass.value)
  }
  if (filterTimeRange.value) {
    const now = new Date()
    let startTime
    switch (filterTimeRange.value) {
      case 'today':
        startTime = new Date(now.setHours(0, 0, 0, 0))
        break
      case 'week':
        startTime = new Date(now.setDate(now.getDate() - 7))
        break
      case 'month':
        startTime = new Date(now.setMonth(now.getMonth() - 1))
        break
      default:
        startTime = new Date(0)
    }
    filtered = filtered.filter(record => new Date(record.created_at) >= startTime)
  }
  return filtered
})

// 分页后的最近答题记录
const paginatedRecentRecords = computed(() => {
  const filtered = filteredRecentRecords.value
  leaderboardTotal.value = filtered.length
  const start = (leaderboardCurrentPage.value - 1) * leaderboardPageSize.value
  const end = start + leaderboardPageSize.value
  return filtered.slice(start, end)
})





// 加载用户的答题记录
const loadUserRecords = async (userId) => {
  try {
    const url = `${getApiBaseUrl()}/answer-records/${userId}`
    const response = await fetch(url)
    
    if (response.ok) {
      const data = await response.json()
      selectedUserRecords.value = data
    } else {
      console.error('加载用户答题记录失败，响应状态:', response.status)
      selectedUserRecords.value = []
    }
  } catch (error) {
    console.error('加载用户答题记录失败:', error)
    selectedUserRecords.value = []
  }
}

// 加载用户的题目尝试记录
const loadUserQuestionAttempts = async (userId, answerRecordId = null) => {
  try {
    // 尝试使用不同的API端点格式
    let url = `${getApiBaseUrl()}/question-attempts`
    
    // 先尝试使用userId作为路径参数，answerRecordId作为查询参数
    if (userId) {
      url = `${getApiBaseUrl()}/question-attempts/${userId}`
      if (answerRecordId) {
        url += `?answerRecordId=${answerRecordId}`
      }
    } else if (answerRecordId) {
      // 如果没有userId，只使用answerRecordId作为查询参数
      url = `${getApiBaseUrl()}/question-attempts?answerRecordId=${answerRecordId}`
    }
    
    
    const response = await fetch(url)
    
    
    if (response.ok) {
        let data = await response.json()
        
        // 检查数据结构，确保包含我们需要的字段
        if (Array.isArray(data)) {

        } else {
          console.error('响应数据不是数组:', data)
        }
        
        selectedUserQuestionAttempts.value = data || []
      } else {
        console.error('加载用户题目尝试记录失败，响应状态:', response.status)
        // 尝试获取错误信息
        try {
          const errorData = await response.json()
          console.error('错误信息:', errorData)
        } catch (e) {
          console.error('无法解析错误信息:', e)
        }
        selectedUserQuestionAttempts.value = []
      }
  } catch (error) {
    console.error('加载用户题目尝试记录失败:', error)
    selectedUserQuestionAttempts.value = []
  }
}

// 打开用户详情对话框
const openUserDetailDialog = async (row) => {
  // 处理不同数据结构的row
  let userId = row.user_id || row.student_id // 兼容不同数据结构的用户ID字段
  let answerRecordId = row.id // 最近答题记录的ID
  currentAnswerRecordId.value = answerRecordId // 存储当前答题记录ID
  
  let userData = {
    student_id: row.student_id || row.user_id,
    name: row.name || row.user_name || '',
    grade: row.grade || null,
    class: row.class || null,
    avg_accuracy: 0,
    total_questions: 0,
    total_sessions: 0
  }
  
  // 根据来源设置用户数据和对话框来源
  if (row.correct_count !== undefined && row.total_questions !== undefined && row.id) {
    // 从最近答题记录点击，使用该条目的数据
    userData.avg_accuracy = (row.correct_count / row.total_questions) * 100
    userData.total_questions = row.total_questions
    userData.total_sessions = 1 // 这是一次答题记录
    dialogSource.value = 'recentRecords' // 设置来源为最近答题记录
  } else if (row.avg_accuracy !== undefined && row.total_sessions !== undefined) {
    // 从用户答题统计点击，使用用户的累计数据
    userData.avg_accuracy = row.avg_accuracy
    userData.total_questions = row.total_questions || 0
    userData.total_sessions = row.total_sessions || 0
    dialogSource.value = 'userStats' // 设置来源为用户答题统计
  } else {
    // 默认来源
    dialogSource.value = 'userStats'
  }
  
  selectedUser.value = userData
  await loadUserRecords(userId)
  
  // 根据来源设置默认标签页
  if (row.avg_accuracy !== undefined && row.total_sessions !== undefined) {
    // 从用户答题统计点击，默认显示答题记录
    activeUserDetailTab.value = 'records'
    // 加载用户的所有题目尝试记录
    await loadUserQuestionAttempts(userId)
  } else if (row.correct_count !== undefined && row.total_questions !== undefined && row.id) {
    // 从最近答题记录点击，默认显示做题记录
    activeUserDetailTab.value = 'attempts'
    // 加载该答题记录的题目尝试记录
    // 确保传递正确的answerRecordId
    if (answerRecordId) {
      await loadUserQuestionAttempts(userId, answerRecordId)
    } else {
      await loadUserQuestionAttempts(userId)
    }
  } else {
    // 默认显示答题记录
    activeUserDetailTab.value = 'records'
    // 加载用户的所有题目尝试记录
    await loadUserQuestionAttempts(userId)
  }
  
  userDetailDialogVisible.value = true
}



// 确认清空排行榜数据
const confirmClearLeaderboard = () => {
  ElMessageBox.confirm(
    '确定要清空所有排行榜数据吗？此操作不可恢复，包括答题记录和题目尝试记录。',
    '清空排行榜数据',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      danger: true
    }
  )
  .then(() => {
    clearLeaderboard()
  })
  .catch(() => {
    // 取消操作
  })
}

// 清空排行榜数据
const clearLeaderboard = async () => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/leaderboard/clear`, {
      method: 'POST'
    })
    
    if (response.ok) {
      ElMessage.success('排行榜数据清空成功')
      // 重新加载数据
      await fetchUserStats()
      await fetchRecentRecords()
    } else {
      ElMessage.error('清空排行榜数据失败')
    }
  } catch (error) {
    console.error('清空排行榜数据失败:', error)
    ElMessage.error('清空排行榜数据失败')
  }
}












    







    













// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取进度条颜色
const getProgressColor = (accuracy) => {
  if (!accuracy) return '#e4e7ed'
  if (accuracy >= 90) return '#67c23a'
  if (accuracy >= 70) return '#e6a23c'
  return '#f56c6c'
}

// 数据库管理相关功能

// 备份数据
const backupData = async () => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/data/backup`, {
      method: 'POST'
    })
    
    if (response.ok) {
      const result = await response.json()
      // 下载备份文件
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      ElMessage.success('数据备份成功')
    } else {
      ElMessage.error('数据备份失败')
    }
  } catch (error) {
    console.error('数据备份失败:', error)
    ElMessage.error('数据备份失败')
  }
}

// 恢复数据
const restoreData = () => {
  ElMessageBox.confirm(
    '确定要恢复数据吗？此操作将覆盖当前系统的所有数据，请谨慎操作。',
    '恢复数据',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      danger: true
    }
  )
  .then(() => {
    // 触发文件选择
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.backup'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = async (event) => {
          try {
            const data = JSON.parse(event.target.result)
            const response = await fetch(`${getApiBaseUrl()}/data/restore`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ data: data })
            })
            
            if (response.ok) {
              ElMessage.success('数据恢复成功')
              // 重新加载数据
              await store.loadData()
              await loadGradesAndClasses()
              fetchUserStats()
              fetchRecentRecords()
            } else {
              ElMessage.error('数据恢复失败')
            }
          } catch (error) {
            console.error('数据恢复失败:', error)
            ElMessage.error('数据恢复失败，请检查文件格式')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  })
  .catch(() => {
    // 取消操作
  })
}

// 导出数据
const exportData = async () => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/data/export`, {
      method: 'GET'
    })
    
    if (response.ok) {
      const result = await response.json()
      // 下载导出文件
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      ElMessage.success('数据导出成功')
    } else {
      ElMessage.error('数据导出失败')
    }
  } catch (error) {
    console.error('数据导出失败:', error)
    ElMessage.error('数据导出失败')
  }
}

// 处理文件上传
const handleFileChange = (file) => {
  ElMessage.success(`备份文件 ${file.name} 已选择，请点击恢复数据按钮进行恢复`)
}

// 确认清空所有数据
const confirmClearAllData = () => {
  ElMessageBox.confirm(
    '确定要清空所有数据吗？此操作不可恢复，包括题目、用户、答题记录等所有数据。',
    '清空所有数据',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      danger: true
    }
  )
  .then(() => {
    clearAllData()
  })
  .catch(() => {
    // 取消操作
  })
}

// 清空所有数据
const clearAllData = async () => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/data/clear-all`, {
      method: 'POST'
    })
    
    if (response.ok) {
      ElMessage.success('所有数据清空成功')
      // 重新加载数据
      await store.loadData()
      await loadGradesAndClasses()
      fetchUserStats()
      fetchRecentRecords()
    } else {
      ElMessage.error('清空数据失败')
    }
  } catch (error) {
    console.error('清空数据失败:', error)
    ElMessage.error('清空数据失败')
  }
}

// 确认清空用户答题记录
const confirmClearUserRecords = () => {
  ElMessageBox.confirm(
    '确定要清空用户答题记录吗？此操作不可恢复，包括所有用户的答题记录和题目尝试记录。',
    '清空用户答题记录',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      danger: true
    }
  )
  .then(() => {
    clearUserRecords()
  })
  .catch(() => {
    // 取消操作
  })
}

// 清空用户答题记录
const clearUserRecords = async () => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/data/clear-records`, {
      method: 'POST'
    })
    
    if (response.ok) {
      ElMessage.success('用户答题记录清空成功')
      // 重新加载数据
      fetchUserStats()
      fetchRecentRecords()
    } else {
      ElMessage.error('清空用户答题记录失败')
    }
  } catch (error) {
    console.error('清空用户答题记录失败:', error)
    ElMessage.error('清空用户答题记录失败')
  }
}

onMounted(async () => {
  // 初始化数据
  await store.initialize()
  // 加载年级和班级数据
  await loadGradesAndClasses()
  // 初始化数据
  fetchUserStats()
  fetchRecentRecords()
})
</script>

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

/* 数据库管理验证对话框样式 */
.database-management-dialog {
  border-radius: 12px !important;
  overflow: hidden !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15) !important;
  animation: dialogFadeIn 0.3s ease-out;
}

@keyframes dialogFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.database-management-dialog .el-dialog__header {
  background: linear-gradient(135deg, #3a8ee6 0%, #66b1ff 100%);
  color: white;
  border-radius: 12px 12px 0 0;
  padding: 28px 32px;
  text-align: center;
}

.database-management-dialog .el-dialog__title {
  color: white;
  font-size: 22px;
  font-weight: 700;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.database-management-dialog .el-dialog__body {
  padding: 40px 32px;
  text-align: center;
  background-color: #f9fafb;
}

.dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 400px;
  margin: 0 auto;
}

.dialog-icon {
  margin-bottom: 24px;
  animation: iconPulse 2s infinite;
}

@keyframes iconPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.dialog-icon .lock-icon {
  font-size: 60px;
  color: #3a8ee6;
  background: linear-gradient(135deg, #e6f0ff 0%, #f0f7ff 100%);
  padding: 20px;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(58, 142, 230, 0.2);
}

.dialog-title {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
}

.dialog-description {
  margin: 0 0 32px 0;
  font-size: 15px;
  color: #6b7280;
  line-height: 1.6;
  max-width: 350px;
}

.password-form {
  width: 100%;
  max-width: 350px;
  margin: 0 auto;
}

.password-input-item {
  margin-bottom: 0;
  width: 100%;
}

.password-input-item .el-form-item__label {
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 8px;
  display: block;
  text-align: left;
}

.password-input {
  height: 52px;
  font-size: 16px;
  border-radius: 10px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
  background-color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.password-input:focus {
  border-color: #3a8ee6;
  box-shadow: 0 0 0 3px rgba(58, 142, 230, 0.2);
  outline: none;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 24px 32px;
  background-color: white;
  border-radius: 0 0 12px 12px;
  border-top: 1px solid #e5e7eb;
}

.cancel-button {
  width: 130px;
  height: 44px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 10px;
  border: 2px solid #e5e7eb;
  background-color: white;
  color: #4b5563;
  transition: all 0.3s ease;
}

.cancel-button:hover {
  border-color: #d1d5db;
  background-color: #f9fafb;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.verify-button {
  width: 130px;
  height: 44px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  background: linear-gradient(135deg, #3a8ee6 0%, #66b1ff 100%);
  border: none;
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(58, 142, 230, 0.3);
}

.verify-button:hover {
  background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(58, 142, 230, 0.4);
}

.verify-button:active {
  transform: translateY(0);
  box-shadow: 0 4px 12px rgba(58, 142, 230, 0.3);
}

/* 登录对话框样式 */
.el-dialog[data-v-7ba5bd90]:not(.database-management-dialog) .el-dialog__header {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  color: white;
  border-radius: 8px 8px 0 0;
  padding: 24px;
}

.el-dialog[data-v-7ba5bd90]:not(.database-management-dialog) .el-dialog__title {
  color: white;
  font-size: 20px;
  font-weight: 600;
}

.el-dialog[data-v-7ba5bd90]:not(.database-management-dialog) .el-dialog__body {
  padding: 30px 24px;
  text-align: center;
}

.el-dialog[data-v-7ba5bd90]:not(.database-management-dialog) .el-dialog__footer {
  display: flex;
  justify-content: center;
  padding: 20px 24px;
  background-color: #f5f7fa;
  border-radius: 0 0 8px 8px;
}

.el-dialog[data-v-7ba5bd90]:not(.database-management-dialog) .el-button--primary {
  width: 150px;
  height: 40px;
  font-size: 14px;
  border-radius: 8px;
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  border: none;
  transition: all 0.3s ease;
}

.el-dialog[data-v-7ba5bd90]:not(.database-management-dialog) .el-button--primary:hover {
  background: linear-gradient(135deg, #85ce61 0%, #95d475 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}

.el-dialog[data-v-7ba5bd90]:not(.database-management-dialog) .el-input {
  height: 48px;
  font-size: 16px;
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  transition: all 0.3s ease;
}

.el-dialog[data-v-7ba5bd90]:not(.database-management-dialog) .el-input:focus {
  border-color: #67c23a;
  box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2);
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .database-management-dialog {
    width: 90% !important;
    max-width: 400px;
  }
  
  .dialog-title {
    font-size: 16px;
  }
  
  .dialog-description {
    font-size: 13px;
  }
  
  .password-input {
    height: 44px;
    font-size: 14px;
  }
  
  .cancel-button,
  .verify-button {
    width: 100px;
    height: 36px;
    font-size: 13px;
  }
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.title {
  text-align: center;
  color: #333;
  margin: 0;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.back-home-btn {
  text-decoration: none;
}

.subject-management {
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.add-subject {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.subject-edit {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px;
  background-color: #f0f9ff;
  border-radius: 4px;
}

.subject-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.subject-icon {
  font-size: 24px;
  margin-right: 5px;
}

.subcategory-icon {
  font-size: 24px;
  margin-right: 5px;
}

.add-subcategory {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.subcategory-edit {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px;
  background-color: #f0f9ff;
  border-radius: 4px;
}

.subcategory-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.batch-add-management {
  padding: 20px;
}

.batch-add-layout {
  display: flex;
  gap: 20px;
  height: 500px;
}

.input-section {
  flex: 1;
  overflow-y: auto;
}

.preview-section {
  flex: 1;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.preview-section h3 {
  margin-bottom: 15px;
  color: #6a11cb;
  flex-shrink: 0;
}

.preview-content {
  flex: 1;
  overflow-y: auto;
}

.preview-question {
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.preview-question-content {
  margin-bottom: 10px;
  line-height: 1.5;
}

.question-number {
  font-weight: bold;
  color: #6a11cb;
}

.question-answer {
  font-weight: bold;
  color: #4caf50;
  margin-left: 10px;
}

.preview-options {
  margin-left: 20px;
}

.preview-option {
  margin-bottom: 5px;
  line-height: 1.4;
}

.answer-highlight {
  background-color: #ffeb3b;
  color: #333;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: bold;
  border: 2px solid #fbc02d;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: inline-block;
  margin: 0 2px;
}

.correct-answer-tag {
  background-color: #4caf50;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  margin-left: 10px;
  display: inline-block;
}

.option-label {
  font-weight: bold;
  color: #409eff;
  margin-right: 5px;
}

.preview-explanation {
  margin-top: 15px;
  padding: 12px;
  background-color: #f0f9ff;
  border-left: 4px solid #409eff;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
}

.explanation-label {
  font-weight: bold;
  color: #409eff;
  margin-right: 5px;
}

.preview-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  text-align: center;
}

.batch-add-management .el-form-item {
  margin-bottom: 20px;
}

.batch-add-management .el-textarea {
  resize: vertical;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .batch-add-layout {
    flex-direction: column;
    height: auto;
  }
  
  .input-section,
  .preview-section {
    flex: none;
    height: 400px;
  }
}

.question-management {
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.filter-section {
  margin-bottom: 20px;
}

.options-container {
  width: 100%;
}

.option-item {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 题目内容预览 */
.question-content-preview {
  white-space: normal;
  max-width: 100%;
  color: #666;
  line-height: 1.4;
  min-height: 40px;
  display: -webkit-box;
  display: -moz-box;
  display: box;
  -webkit-line-clamp: 3;
  -moz-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  -moz-box-orient: vertical;
  box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.content-with-image {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  white-space: normal;
  overflow: hidden;
}

.content-with-media {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  white-space: normal;
  overflow: hidden;
}

.content-with-image .content-text,
.content-with-media .content-text {
  display: -webkit-box;
  display: -moz-box;
  display: box;
  -webkit-line-clamp: 3;
  -moz-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  -moz-box-orient: vertical;
  box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.content-text img {
  max-width: 100%;
  max-height: 100px;
  object-fit: contain;
  margin: 5px 0;
}

.image-indicator {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
  margin-top: 2px;
  margin-right: 5px;
}

.audio-indicator {
  background-color: #f3e5f5;
  color: #7b1fa2;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
  margin-top: 2px;
  margin-right: 5px;
}

.content-text {
  flex: 1;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 过滤器部分 */
.filter-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f0f9ff;
  border-radius: 8px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.action-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* 表格样式 */
.el-table {
  border-radius: 8px;
  overflow: hidden;
  width: 100% !important;
  table-layout: auto;
  font-size: 14px;
}

.el-table th {
  background-color: #f8f9fa;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 40px;
  padding: 8px 12px;
  vertical-align: middle;
}

.el-table td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 40px;
  padding: 12px;
  vertical-align: middle;
}

/* 题目内容列的单元格样式 */
.el-table-column:nth-child(7) .cell {
  white-space: normal;
  line-height: 1.4;
  min-height: 60px;
  display: flex;
  align-items: center;
}

/* 按钮样式 */
.el-button {
  border-radius: 4px;
  white-space: nowrap;
}

/* 分页样式 */
.pagination {
  margin-top: 20px;
  text-align: right;
  white-space: nowrap;
}

/* 操作列样式 */
.el-table .cell {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 题目内容列的单元格样式 */
.el-table-column:nth-child(7) .cell {
  white-space: normal;
  line-height: 1.4;
  min-height: 40px;
}

/* 容器样式 */
.question-management {
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* 表格容器 */
.table-container {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  max-width: 100%;
  width: 100%;
  margin: 0 auto;
  overflow-x: auto;
  box-sizing: border-box;
  padding: 0 10px;
}

.el-table {
  width: 100% !important;
  table-layout: auto;
}

/* 操作按钮容器 */
.el-table-column--selection {
  width: 55px !important;
  min-width: 55px;
  max-width: 55px;
}

/* 学科标签 */
.subject-tag {
  display: inline-block;
  padding: 2px 8px;
  background-color: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

/* 类型标签 */
.type-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.type-single {
  background-color: #e8f5e8;
  color: #388e3c;
}

.type-multiple {
  background-color: #e3f2fd;
  color: #1976d2;
}

.type-judgment {
  background-color: #fff3e0;
  color: #f57c00;
}

.type-listening {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.type-reading {
  background-color: #e0f7fa;
  color: #00838f;
}

.type-image {
  background-color: #fffde7;
  color: #fbc02d;
}

/* 答案标签 */
.answer-tag {
  display: inline-block;
  padding: 2px 8px;
  background-color: #e1bee7;
  color: #6a11cb;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

/* 题目行容器 */
.question-row {
  position: relative;
  width: 100%;
  transition: all 0.3s ease;
}

/* 行操作按钮 */
.row-operations {
  display: flex;
  gap: 5px;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.el-table__row:hover .row-operations {
  opacity: 1;
  max-height: 40px;
  margin-top: 10px;
}

.el-table__row:hover .question-content-preview {
  margin-bottom: 5px;
}

/* 提示框样式 */
.content-tooltip {
  max-width: 400px !important;
  white-space: normal !important;
  word-break: break-all !important;
}

/* 自定义列宽 */
.el-table-column:nth-child(3) {
  width: 40px !important; /* ID列 */
  min-width: 40px;
  max-width: 40px;
}

.el-table-column:nth-child(4) {
  width: 80px !important; /* 学科列 */
  min-width: 80px;
  max-width: 100px;
}

.el-table-column:nth-child(5) {
  width: 100px !important; /* 学科题库列 */
  min-width: 100px;
  max-width: 120px;
}

.el-table-column:nth-child(6) {
  width: 60px !important; /* 类型列 */
  min-width: 60px;
  max-width: 60px;
}

/* 题目内容列特殊处理 */
.el-table-column:nth-child(7) {
  flex: 1 !important;
  min-width: 200px;
  max-width: 400px;
}

.el-table-column:nth-child(8) {
  width: 60px !important; /* 答案列 */
  min-width: 60px;
  max-width: 80px;
}

.el-table-column:nth-child(9) {
  width: 120px !important; /* 创建时间列 */
  min-width: 120px;
  max-width: 120px;
}

.el-table-column:nth-child(10) {
  width: 100px !important; /* 操作列 */
  min-width: 100px;
  max-width: 100px;
}

/* 分类视图样式 */
.category-view {
  margin-top: 20px;
}

.subject-category {
  margin-bottom: 30px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-bottom: 1px solid #ebeef5;
}

.subject-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.question-count {
  background: #409eff;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.subcategory-list {
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.subcategory-card {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
}

.subcategory-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.subcategory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.subcategory-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #606266;
}

.subcategory-questions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-card {
  background: white;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.question-content {
  flex: 1;
  min-width: 0;
}

.question-type {
  margin-bottom: 8px;
}

.question-text {
  font-size: 14px;
  line-height: 1.4;
  color: #303133;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.question-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.empty-questions {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 14px;
  background: white;
  border-radius: 6px;
  border: 1px dashed #dcdfe6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-section {
    padding: 10px;
  }
  
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-row .el-input,
  .filter-row .el-select {
    width: 100% !important;
    margin-right: 0 !important;
    margin-bottom: 10px;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-buttons .el-button {
    width: 100%;
    margin-bottom: 10px;
  }
  
  .el-table {
    font-size: 14px;
  }
  
  .el-table-column {
    min-width: 100px;
  }
  
  /* 小屏幕下的表格列宽调整 */
  .el-table-column--selection {
    width: 40px !important;
  }
  
  /* 小屏幕下的自定义列宽 */
  .el-table-column:nth-child(3) {
    width: 50px !important; /* ID列 */
  }
  
  .el-table-column:nth-child(4) {
    width: 80px !important; /* 学科列 */
  }
  
  .el-table-column:nth-child(5) {
    width: 90px !important; /* 学科题库列 */
  }
  
  .el-table-column:nth-child(6) {
    width: 70px !important; /* 类型列 */
  }
  
  .el-table-column:nth-child(8) {
    width: 70px !important; /* 答案列 */
  }
  
  .el-table-column:nth-child(9) {
    width: 140px !important; /* 创建时间列 */
  }
  
  .el-table-column:nth-child(10) {
    width: 120px !important; /* 操作列 */
  }
  
  /* 小屏幕下的标签样式 */
  .subject-tag,
  .type-tag,
  .answer-tag {
    font-size: 10px;
    padding: 1px 6px;
  }
  
  /* 小屏幕下的操作按钮 */
  .operation-buttons {
    flex-direction: column;
    gap: 3px;
  }
  
  .edit-btn,
  .delete-btn {
    width: 100%;
    font-size: 11px;
    padding: 2px 4px;
  }
  
  /* 小屏幕下的表格容器 */
  .table-container {
    box-shadow: 0 1px 6px 0 rgba(0, 0, 0, 0.1);
  }
  
  /* 小屏幕下的按钮样式 */
  .el-table .el-button {
    font-size: 12px;
    padding: 4px 8px;
  }
  
  /* 小屏幕下的分页样式 */
  .pagination {
    text-align: center;
  }
  
  /* 小屏幕下的题目管理容器 */
  .question-management {
    padding: 10px;
  }
  
  /* 小屏幕下的分类视图 */
  .subcategory-list {
    grid-template-columns: 1fr;
  }
  
  .question-card {
    flex-direction: column;
    align-items: stretch;
  }
  
  .question-actions {
    justify-content: flex-end;
  }
}
</style>