<template>
  <div class="question-management scroll-self-managed">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索题目内容..."
          style="width: 280px"
          clearable
          :prefix-icon="Search"
        />
        <el-select
          v-model="filterType"
          placeholder="题目类型"
          style="width: 120px; margin-left: 10px"
          clearable
        >
          <el-option label="全部类型" value="" />
          <el-option label="单选题" value="single" />
          <el-option label="多选题" value="multiple" />
          <el-option label="判断题" value="judgment" />
          <el-option label="听力题" value="listening" />
          <el-option label="阅读题" value="reading" />
          <el-option label="看图题" value="image" />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="openAddPanel">
          <el-icon><Plus /></el-icon>
          添加题目
        </el-button>
        <el-button type="success" @click="showBatchAddQuestionDialog">
          <el-icon><Upload /></el-icon>
          批量添加
        </el-button>
        <el-dropdown
          trigger="click"
          :disabled="selectedQuestions.length === 0"
          @command="handleBatchCommand"
        >
          <el-button type="warning">
            批量操作
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="delete" :disabled="selectedQuestions.length === 0">
                <el-icon><Delete /></el-icon>
                批量删除
              </el-dropdown-item>
              <el-dropdown-item
                command="updateDifficulty"
                :disabled="selectedQuestions.length === 0"
              >
                <el-icon><Star /></el-icon>
                修改难度
              </el-dropdown-item>
              <el-dropdown-item command="updateType" :disabled="selectedQuestions.length === 0">
                <el-icon><Document /></el-icon>
                修改类型
              </el-dropdown-item>
              <el-dropdown-item command="move" :disabled="selectedQuestions.length === 0">
                <el-icon><FolderOpened /></el-icon>
                移动到
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="info" :loading="loading" @click="refreshQuestions">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 内容区 -->
      <div class="content-wrapper" :class="{ 'has-edit-panel': splitEditMode }">
        <!-- 编辑面板（移到顶部） -->
        <div v-if="splitEditMode" class="edit-panel" :style="{ height: editPanelHeight + 'px' }">
          <div class="edit-panel-header">
            <div class="edit-panel-title">
              <el-icon><Edit /></el-icon>
              <span>
                {{ editMode === 'add' ? '添加新题目' : `编辑题目 #${editingQuestionId}` }}
              </span>
            </div>
            <div class="edit-panel-actions">
              <el-button
                type="primary"
                size="small"
                :loading="splitEditSaving"
                @click="saveSplitEdit"
              >
                <el-icon><Check /></el-icon>
                {{ editMode === 'add' ? '添加' : '保存' }}
              </el-button>
              <el-button
                v-if="editMode === 'edit'"
                type="success"
                size="small"
                :loading="splitEditSaving"
                @click="saveAndNext"
              >
                <el-icon><Right /></el-icon>
                保存并下一个
              </el-button>
              <el-button size="small" @click="closeSplitEdit">
                <el-icon><Close /></el-icon>
                关闭
              </el-button>
            </div>
          </div>
          <div v-if="splitEditData" class="edit-panel-body">
            <div class="split-edit-form">
              <!-- 基本信息 -->
              <div class="quick-edit-row">
                <el-select
                  v-model="splitEditData.subjectId"
                  placeholder="学科"
                  size="small"
                  style="width: 120px"
                  @change="onSplitEditSubjectChange"
                >
                  <el-option
                    v-for="subject in props.subjects"
                    :key="subject.id"
                    :label="subject.name"
                    :value="subject.id"
                  />
                </el-select>
                <el-select
                  v-model="splitEditData.subcategoryId"
                  placeholder="题库"
                  size="small"
                  style="width: 140px"
                >
                  <el-option
                    v-for="sub in splitEditSubcategories"
                    :key="sub.id"
                    :label="sub.name"
                    :value="sub.id"
                  />
                </el-select>
                <el-select
                  v-model="splitEditData.type"
                  placeholder="类型"
                  size="small"
                  style="width: 100px"
                >
                  <el-option label="单选" value="single" />
                  <el-option label="多选" value="multiple" />
                  <el-option label="判断" value="judgment" />
                  <el-option label="听力" value="listening" />
                  <el-option label="阅读" value="reading" />
                  <el-option label="看图" value="image" />
                </el-select>
                <el-select
                  v-model="splitEditData.difficulty"
                  placeholder="难度"
                  size="small"
                  style="width: 100px"
                >
                  <el-option label="简单" :value="1" />
                  <el-option label="较简单" :value="2" />
                  <el-option label="中等" :value="3" />
                  <el-option label="较难" :value="4" />
                  <el-option label="困难" :value="5" />
                </el-select>
              </div>

              <!-- 题目内容 -->
              <div class="quick-edit-section">
                <label class="section-label">题目内容</label>
                <div class="content-editor-wrapper">
                  <QuillEditor
                    v-if="splitEditData.content !== undefined"
                    :key="'content-' + editingQuestionId"
                    v-model="splitEditData.content"
                    toolbar-mode="full"
                    :options="{
                      placeholder: '输入题目内容'
                    }"
                  />
                </div>
              </div>

              <!-- 普通题目选项 -->
              <div v-if="splitEditData.type !== 'reading'" class="quick-edit-section">
                <label class="section-label">
                  答案选项
                  <el-button type="primary" size="small" text @click="addSplitEditOption">
                    <el-icon><Plus /></el-icon>
                    添加
                  </el-button>
                </label>
                <div class="options-grid">
                  <div
                    v-for="(_option, index) in splitEditData.options"
                    :key="index"
                    class="quick-option-item"
                  >
                    <el-checkbox
                      v-model="splitEditData.selectedAnswers"
                      :label="String.fromCharCode(65 + index)"
                      :disabled="
                        splitEditData.type === 'single' &&
                        splitEditData.selectedAnswers.length > 0 &&
                        !splitEditData.selectedAnswers.includes(String.fromCharCode(65 + index))
                      "
                    >
                      <span class="option-letter">{{ String.fromCharCode(65 + index) }}</span>
                    </el-checkbox>
                    <EditableContent
                      v-model="splitEditData.options[index]"
                      placeholder="输入选项内容"
                      class="quick-option-input"
                    />
                    <el-button
                      type="danger"
                      size="small"
                      text
                      @click="removeSplitEditOption(index)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>

              <!-- 阅读理解题小题列表（折叠面板） -->
              <div v-else class="quick-edit-section">
                <label class="section-label">
                  小题列表
                  <el-button type="primary" size="small" text @click="addReadingSubQuestion">
                    <el-icon><Plus /></el-icon>
                    添加小题（{{ splitEditData.readingSubQuestions?.length || 0 }}/20）
                  </el-button>
                </label>
                <!-- 阅读理解题提示 -->
                <div class="reading-tip">
                  <el-icon><Reading /></el-icon>
                  <span>上方"题目内容"为阅读材料，下方为小题列表。每道小题支持富文本编辑。</span>
                </div>
                <!-- 折叠面板 -->
                <el-collapse
                  v-model="activeReadingSubQuestion"
                  accordion
                  class="reading-sub-collapse"
                >
                  <el-collapse-item
                    v-for="(sq, sqIndex) in splitEditData.readingSubQuestions"
                    :key="sqIndex"
                    :name="sqIndex"
                  >
                    <template #title>
                      <div class="sub-collapse-title">
                        <span class="sub-collapse-order">第 {{ sqIndex + 1 }} 题</span>
                        <el-tag v-if="sq.answer" type="success" size="small" class="sub-answer-tag">
                          答案: {{ sq.answer }}
                        </el-tag>
                        <el-tag v-else type="info" size="small">未设答案</el-tag>
                      </div>
                    </template>
                    <div class="sub-collapse-content">
                      <!-- 小题题目（富文本） -->
                      <div class="sub-field sub-field-content">
                        <label class="sub-label">小题题目</label>
                        <QuillEditor
                          v-model="sq.content"
                          toolbar-mode="simple"
                          :options="{ placeholder: '输入小题题目...' }"
                          style="height: 150px"
                        />
                      </div>
                      <!-- 小题选项 -->
                      <div class="sub-field sub-field-options">
                        <label class="sub-label">
                          选项
                          <el-button
                            type="primary"
                            size="small"
                            text
                            @click.stop="addReadingSubOption(sqIndex)"
                          >
                            添加选项
                          </el-button>
                        </label>
                        <div class="sub-options-grid">
                          <div
                            v-for="(_opt, optIdx) in sq.options"
                            :key="optIdx"
                            class="sub-option-row"
                            :class="{
                              'is-selected': sq.answer === String.fromCharCode(65 + optIdx)
                            }"
                          >
                            <el-radio v-model="sq.answer" :label="String.fromCharCode(65 + optIdx)">
                              {{ String.fromCharCode(65 + optIdx) }}
                            </el-radio>
                            <EditableContent
                              v-model="sq.options[optIdx]"
                              :placeholder="`选项 ${String.fromCharCode(65 + optIdx)}`"
                              class="sub-option-editor"
                            />
                            <el-button
                              v-if="sq.options.length > 2"
                              type="danger"
                              size="small"
                              text
                              @click.stop="removeReadingSubOption(sqIndex, optIdx)"
                            >
                              <el-icon><Delete /></el-icon>
                            </el-button>
                          </div>
                        </div>
                      </div>
                      <!-- 小题解析 -->
                      <div class="sub-field sub-field-explanation">
                        <label class="sub-label">解析（可选）</label>
                        <QuillEditor
                          v-model="sq.explanation"
                          toolbar-mode="simple"
                          :options="{ placeholder: '输入小题解析...' }"
                          style="height: 100px"
                        />
                      </div>
                      <!-- 小题操作按钮 -->
                      <div class="sub-actions">
                        <el-button
                          size="small"
                          :disabled="sqIndex === 0"
                          @click="moveReadingSubQuestion(sqIndex, -1)"
                        >
                          上移
                        </el-button>
                        <el-button
                          size="small"
                          :disabled="sqIndex === splitEditData.readingSubQuestions.length - 1"
                          @click="moveReadingSubQuestion(sqIndex, 1)"
                        >
                          下移
                        </el-button>
                        <el-button
                          type="danger"
                          size="small"
                          :disabled="splitEditData.readingSubQuestions.length <= 1"
                          @click="removeReadingSubQuestion(sqIndex)"
                        >
                          删除小题
                        </el-button>
                      </div>
                    </div>
                  </el-collapse-item>
                </el-collapse>
              </div>

              <!-- 解析 -->
              <div class="quick-edit-section">
                <label class="section-label">解析（可选）</label>
                <el-input
                  v-model="splitEditData.explanation"
                  type="textarea"
                  :rows="2"
                  placeholder="输入答案解析..."
                />
              </div>

              <!-- 音频上传 -->
              <div class="quick-edit-section">
                <label class="section-label">音频（听力题用）</label>
                <div class="audio-upload-area">
                  <!-- 上传区域 -->
                  <div v-if="!splitEditData.audio && !audioUploading">
                    <el-upload
                      class="audio-uploader"
                      action=""
                      :auto-upload="false"
                      :show-file-list="false"
                      accept="audio/*"
                      :drag="true"
                      :on-change="handleSplitEditAudioChange"
                    >
                      <div class="audio-upload-dragger">
                        <el-icon class="upload-icon"><Upload /></el-icon>
                        <div class="upload-text">
                          拖拽音频文件到此处，或
                          <em>点击上传</em>
                        </div>
                        <div class="upload-tip">支持 MP3、WAV、OGG、M4A 格式，最大 10MB</div>
                      </div>
                    </el-upload>
                  </div>
                  <!-- 上传进度 -->
                  <div v-if="audioUploading" class="audio-uploading">
                    <el-progress type="circle" :percentage="audioUploadProgress" :width="60" />
                    <span>{{ audioUploadProgress >= 100 ? '处理中...' : '上传中...' }}</span>
                  </div>
                  <!-- 音频预览 -->
                  <div v-if="splitEditData.audio && !audioUploading" class="audio-preview">
                    <!-- 增强的音频播放器 -->
                    <div class="audio-player">
                      <audio
                        ref="audioPlayerRef"
                        :src="splitEditData.audio"
                        @loadedmetadata="onAudioLoaded"
                        @timeupdate="onAudioTimeUpdate"
                        @ended="onAudioEnded"
                      ></audio>
                      <div class="player-controls">
                        <el-button-group class="play-buttons">
                          <el-button size="small" @click="audioSeekBackward">
                            <el-icon><DArrowLeft /></el-icon>
                          </el-button>
                          <el-button size="small" type="primary" @click="toggleAudioPlay">
                            <el-icon v-if="audioPlaying"><VideoPause /></el-icon>
                            <el-icon v-else><VideoPlay /></el-icon>
                          </el-button>
                          <el-button size="small" @click="audioSeekForward">
                            <el-icon><DArrowRight /></el-icon>
                          </el-button>
                        </el-button-group>
                        <div class="progress-wrapper">
                          <span class="time-display">{{ formatAudioTime(audioCurrentTime) }}</span>
                          <el-slider
                            v-model="audioProgress"
                            :show-tooltip="false"
                            class="progress-slider"
                            @change="onAudioProgressChange"
                          />
                          <span class="time-display">{{ formatAudioTime(audioDuration) }}</span>
                        </div>
                        <div class="speed-control">
                          <el-dropdown trigger="click" @command="setAudioSpeed">
                            <el-button size="small">
                              {{ audioSpeed }}x
                              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                            </el-button>
                            <template #dropdown>
                              <el-dropdown-menu>
                                <el-dropdown-item :command="0.5">0.5x</el-dropdown-item>
                                <el-dropdown-item :command="0.75">0.75x</el-dropdown-item>
                                <el-dropdown-item :command="1">1.0x</el-dropdown-item>
                                <el-dropdown-item :command="1.25">1.25x</el-dropdown-item>
                                <el-dropdown-item :command="1.5">1.5x</el-dropdown-item>
                                <el-dropdown-item :command="2">2.0x</el-dropdown-item>
                              </el-dropdown-menu>
                            </template>
                          </el-dropdown>
                        </div>
                        <el-button type="danger" size="small" @click="deleteSplitEditAudio">
                          <el-icon><Delete /></el-icon>
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="edit-panel-body edit-panel-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中...</span>
          </div>
        </div>

        <!-- 右侧表格区 -->
        <div class="content-area">
          <!-- 当前路径面包屑 -->
          <div class="breadcrumb-bar">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item>全部题目</el-breadcrumb-item>
              <el-breadcrumb-item v-if="currentSubjectName">
                {{ currentSubjectName }}
              </el-breadcrumb-item>
              <el-breadcrumb-item v-if="currentSubcategoryName">
                {{ currentSubcategoryName }}
              </el-breadcrumb-item>
            </el-breadcrumb>
            <span class="total-count">共 {{ pagination.total }} 题</span>
          </div>

          <!-- 筛选标签 -->
          <div v-if="hasActiveFilters" class="filter-tags">
            <span class="filter-label">当前筛选：</span>
            <el-tag v-if="filterSubjectId" closable type="primary" @close="clearFilter('subject')">
              学科: {{ currentSubjectName }}
            </el-tag>
            <el-tag
              v-if="filterSubcategoryId"
              closable
              type="success"
              @close="clearFilter('subcategory')"
            >
              题库: {{ currentSubcategoryName }}
            </el-tag>
            <el-tag v-if="filterType" closable type="warning" @close="clearFilter('type')">
              类型: {{ getTypeName(filterType) }}
            </el-tag>
            <el-tag v-if="searchKeyword" closable type="info" @close="clearFilter('keyword')">
              关键词: {{ searchKeyword }}
            </el-tag>
            <el-button text type="primary" @click="clearAllFilters">清除全部</el-button>
          </div>

          <!-- 题目表格 -->
          <div class="table-wrapper">
            <el-table
              ref="tableRef"
              v-loading="loading"
              :data="displayQuestions"
              stripe
              border
              :row-class-name="getRowClassName"
              element-loading-text="加载中..."
              height="100%"
              @selection-change="handleSelectionChange"
            >
              <el-table-column type="selection" width="40" />
              <el-table-column prop="id" label="ID" width="50" align="center" />
              <el-table-column prop="subjectName" label="学科" width="70" align="center">
                <template #default="{ row }">
                  <el-tag size="small" type="primary" effect="light">{{ row.subjectName }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column
                prop="subcategoryName"
                label="题库"
                width="80"
                align="center"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <span class="subcategory-text">{{ row.subcategoryName || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="typeName" label="类型" width="70" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="getTypeTagType(row.type)">{{ row.typeName }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="content" label="题目内容" min-width="200" align="left">
                <template #default="{ row }">
                  <div class="question-content-wrapper">
                    <!-- 行内编辑模式 -->
                    <template v-if="editingId === row.id">
                      <el-input
                        ref="inlineEditInput"
                        v-model="editingContent"
                        type="textarea"
                        :rows="3"
                        @blur="saveInlineEdit(row)"
                        @keyup.enter.ctrl="saveInlineEdit(row)"
                        @keyup.escape="cancelInlineEdit"
                      />
                      <div class="edit-hint">按 Ctrl+Enter 保存，Esc 取消</div>
                    </template>
                    <!-- 正常显示模式 -->
                    <template v-else>
                      <div
                        class="question-content-preview"
                        :class="{ editable: canInlineEdit(row) }"
                        :title="canInlineEdit(row) ? '双击快速编辑' : '富文本内容，请使用编辑按钮'"
                        @dblclick="startInlineEdit(row)"
                      >
                        <div v-if="hasValidImage(row)" class="content-with-image">
                          <div class="image-preview" @click.stop="showImagePreview(row)">
                            <img
                              :src="extractImageUrl(row)"
                              alt="题目图片"
                              class="question-image"
                            />
                          </div>
                          <div
                            class="content-text"
                            v-html="truncate(stripImages(row.content), 150)"
                          ></div>
                          <el-tag
                            v-if="isRichText(row.content)"
                            size="small"
                            type="info"
                            class="rich-text-tag"
                          >
                            富文本
                          </el-tag>
                        </div>
                        <div v-else-if="row.audio" class="content-with-audio">
                          <el-icon class="audio-icon"><Microphone /></el-icon>
                          <div class="content-text" v-html="truncate(row.content, 150)"></div>
                          <el-tag
                            v-if="isRichText(row.content)"
                            size="small"
                            type="info"
                            class="rich-text-tag"
                          >
                            富文本
                          </el-tag>
                        </div>
                        <div v-else class="content-text-wrapper">
                          <div class="content-text" v-html="truncate(row.content, 150)"></div>
                          <el-tag
                            v-if="isRichText(row.content)"
                            size="small"
                            type="info"
                            class="rich-text-tag"
                          >
                            富文本
                          </el-tag>
                        </div>
                      </div>
                    </template>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="answer" label="答案" width="50" align="center">
                <template #default="{ row }">
                  <el-tag size="small" type="danger" effect="dark">{{ row.answer || '-' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column
                prop="createdAt"
                label="创建时间"
                width="90"
                align="center"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <span class="time-text">{{ row.createdAt || '未知' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="160" fixed="right" align="center">
                <template #default="{ row }">
                  <div class="row-operations">
                    <el-button type="primary" size="small" link @click.stop="previewQuestion(row)">
                      <el-icon><View /></el-icon>
                      预览
                    </el-button>
                    <el-button type="warning" size="small" link @click.stop="editQuestion(row)">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-button>
                    <el-button
                      type="danger"
                      size="small"
                      link
                      @click.stop="deleteQuestionWithUndo(row)"
                    >
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              :current-page="paginationPage"
              :page-size="paginationLimit"
              :page-sizes="[20, 50, 100]"
              :total="paginationTotal"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="onSizeChange"
              @current-change="onPageChange"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 预览弹窗 -->
    <el-dialog v-model="previewVisible" title="题目预览" width="700px" destroy-on-close>
      <div v-if="previewData" v-loading="previewLoading" class="preview-content">
        <div class="preview-item">
          <label>题目ID：</label>
          <span>{{ previewData.id }}</span>
        </div>
        <div class="preview-item">
          <label>所属学科：</label>
          <span>{{ previewData.subjectName }}</span>
        </div>
        <div class="preview-item">
          <label>所属题库：</label>
          <span>{{ previewData.subcategoryName || '-' }}</span>
        </div>
        <div class="preview-item">
          <label>题目类型：</label>
          <el-tag :type="getTypeTagType(previewData.type)">{{ previewData.typeName }}</el-tag>
        </div>
        <div class="preview-item">
          <label>题目内容：</label>
          <div class="preview-content-box" v-html="previewData.content"></div>
        </div>
        <div v-if="previewData.image" class="preview-item">
          <label>题目图片：</label>
          <el-image
            :src="previewData.image"
            fit="contain"
            style="max-width: 400px; max-height: 300px"
          />
        </div>
        <div v-if="previewData.audio" class="preview-item">
          <label>音频：</label>
          <audio controls :src="previewData.audio" style="max-width: 100%"></audio>
        </div>
        <div v-if="previewData.options && previewData.options.length > 0" class="preview-item">
          <label>选项：</label>
          <!-- 阅读理解题显示小题列表 -->
          <template v-if="previewData.type === 'reading' && isReadingOptions(previewData.options)">
            <div class="preview-reading-options">
              <div
                v-for="(sq, sqIndex) in previewData.options"
                :key="sqIndex"
                class="preview-sub-question"
              >
                <div class="sub-question-header">
                  <span class="sub-question-order">第 {{ sq.order || sqIndex + 1 }} 题</span>
                  <el-tag type="success" size="small">答案: {{ sq.answer }}</el-tag>
                </div>
                <div class="sub-question-content" v-html="sq.content"></div>
                <div class="sub-question-options">
                  <div
                    v-for="(opt, optIndex) in sq.options"
                    :key="optIndex"
                    class="preview-option"
                    :class="{ 'is-correct': sq.answer === String.fromCharCode(65 + optIndex) }"
                  >
                    <span class="option-label">{{ String.fromCharCode(65 + optIndex) }}.</span>
                    <span class="option-content" v-html="opt"></span>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <!-- 普通题目显示选项列表 -->
          <template v-else>
            <div class="preview-options">
              <div
                v-for="(option, index) in previewData.options"
                :key="index"
                class="preview-option"
              >
                <span class="option-label">{{ String.fromCharCode(65 + index) }}.</span>
                <span class="option-content" v-html="option"></span>
              </div>
            </div>
          </template>
        </div>
        <div class="preview-item">
          <label>正确答案：</label>
          <el-tag type="danger" effect="dark">{{ previewData.answer }}</el-tag>
        </div>
        <div v-if="previewData.explanation" class="preview-item">
          <label>解析：</label>
          <div class="preview-content-box" v-html="previewData.explanation"></div>
        </div>
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEditFromPreview">编辑</el-button>
      </template>
    </el-dialog>

    <!-- 批量修改难度弹窗 -->
    <el-dialog v-model="batchDifficultyVisible" title="批量修改难度" width="400px">
      <el-form label-width="80px">
        <el-form-item label="目标难度">
          <el-rate v-model="batchDifficulty" :max="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchDifficultyVisible = false">取消</el-button>
        <el-button type="primary" @click="executeBatchDifficulty">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量修改类型弹窗 -->
    <el-dialog v-model="batchTypeVisible" title="批量修改类型" width="400px">
      <el-form label-width="80px">
        <el-form-item label="目标类型">
          <el-select v-model="batchType" placeholder="选择类型">
            <el-option label="单选题" value="single" />
            <el-option label="多选题" value="multiple" />
            <el-option label="判断题" value="judgment" />
            <el-option label="听力题" value="listening" />
            <el-option label="阅读题" value="reading" />
            <el-option label="看图题" value="image" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchTypeVisible = false">取消</el-button>
        <el-button type="primary" @click="executeBatchType">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量移动弹窗 -->
    <el-dialog v-model="batchMoveVisible" title="批量移动到" width="450px">
      <el-form label-width="80px">
        <el-form-item label="目标学科">
          <el-select
            v-model="batchMoveSubjectId"
            placeholder="选择学科"
            @change="handleBatchMoveSubjectChange"
          >
            <el-option
              v-for="subject in subjects"
              :key="subject.id"
              :label="subject.name"
              :value="subject.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标题库">
          <el-select
            v-model="batchMoveSubcategoryId"
            placeholder="选择题库"
            :disabled="!batchMoveSubjectId"
          >
            <el-option
              v-for="sub in batchMoveSubcategories"
              :key="sub.id"
              :label="sub.name"
              :value="sub.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchMoveVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!batchMoveSubjectId" @click="executeBatchMove">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Plus,
  Upload,
  ArrowDown,
  Delete,
  Star,
  Document,
  FolderOpened,
  Refresh,
  View,
  Edit,
  Microphone,
  Check,
  Right,
  Close,
  Loading,
  VideoPlay,
  VideoPause,
  DArrowLeft,
  DArrowRight,
  Reading
} from '@element-plus/icons-vue'
import { useQuestionStore } from '../../../stores/questionStore'
import { useAdminLayout } from '../../../composables/useAdminLayout'
import { usePagination } from '../../../composables/usePagination'
import { formatDate } from '../../../utils/dateUtils'
import { getApiBaseUrl } from '../../../utils/database'
import { api } from '../../../utils/api'
import EditableContent from '../../common/EditableContent.vue'
import QuillEditor from '../../common/QuillEditor.vue'

// Props
const props = defineProps({
  subjects: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['delete-question', 'show-batch-add-dialog'])

// Store
const questionStore = useQuestionStore()

// 使用全局布局状态
const { filterSubjectId, filterSubcategoryId, clearFilter: clearGlobalFilter } = useAdminLayout()

// 筛选条件
const searchKeyword = ref('')
const filterType = ref('')

// 加载状态
const loading = ref(false)

// 选中的题目
const selectedQuestions = ref([])

// 使用分页 Hook（服务端分页）
const paginationTotal = ref(0)
const {
  currentPage: paginationPage,
  pageSize: paginationLimit,
  handleSizeChange,
  handleCurrentChange,
  reset: resetPagination
} = usePagination(50, paginationTotal)

// 分页对象（为了兼容现有代码，使用计算属性）
const pagination = computed(() => ({
  page: paginationPage.value,
  limit: paginationLimit.value,
  total: paginationTotal.value
}))

// 服务端数据
const serverQuestions = ref([])

// 行内编辑
const editingId = ref(null)
const editingContent = ref('')
const inlineEditInput = ref(null)

// 预览
const previewVisible = ref(false)
const previewData = ref(null)
const previewLoading = ref(false)
const previewCache = new Map() // 预览缓存

// 批量操作
const batchDifficultyVisible = ref(false)
const batchDifficulty = ref(1)
const batchTypeVisible = ref(false)
const batchType = ref('')
const batchMoveVisible = ref(false)
const batchMoveSubjectId = ref('')
const batchMoveSubcategoryId = ref('')

// Tree ref
// Refs（预留用于未来的功能扩展）
const _treeRef = ref(null) // 预留：题目分类树
const _tableRef = ref(null) // 预留：题目表格引用

// 删除撤销相关
const pendingDeletes = ref(new Map()) // 存储待删除的题目

// 分屏编辑相关
const splitEditMode = ref(false)
const editMode = ref('edit') // 'add' 或 'edit'
const editingQuestionId = ref(null)
const splitEditData = ref(null)
const splitEditSaving = ref(false)
const editPanelHeight = ref(800)
const splitEditQuill = ref(null)
const activeReadingSubQuestion = ref(0) // 当前展开的阅读理解小题

// 音频播放器相关
const audioPlayerRef = ref(null)
const audioPlaying = ref(false)
const audioCurrentTime = ref(0)
const audioDuration = ref(0)
const audioProgress = ref(0)
const audioSpeed = ref(1)
const audioUploading = ref(false)
const audioUploadProgress = ref(0)

// 防抖定时器
let searchTimer = null

// 当前学科名称
const currentSubjectName = computed(() => {
  if (!filterSubjectId.value) return ''
  const subject = props.subjects.find(s => s.id == filterSubjectId.value)
  return subject ? subject.name : ''
})

// 当前题库名称
const currentSubcategoryName = computed(() => {
  if (!filterSubcategoryId.value) return ''
  const subject = props.subjects.find(s => s.id == filterSubjectId.value)
  if (!subject || !subject.subcategories) return ''
  const subcategory = subject.subcategories.find(sc => sc.id == filterSubcategoryId.value)
  return subcategory ? subcategory.name : ''
})

// 批量移动的子分类列表
const batchMoveSubcategories = computed(() => {
  if (!batchMoveSubjectId.value) return []
  const subject = props.subjects.find(s => s.id == batchMoveSubjectId.value)
  return subject ? subject.subcategories || [] : []
})

// 分屏编辑的子分类列表
const splitEditSubcategories = computed(() => {
  if (!splitEditData.value?.subjectId) return []
  const subject = props.subjects.find(s => s.id == splitEditData.value.subjectId)
  return subject ? subject.subcategories || [] : []
})

// 是否有激活的筛选条件
const hasActiveFilters = computed(() => {
  return (
    filterSubjectId.value || filterSubcategoryId.value || filterType.value || searchKeyword.value
  )
})

// 显示的题目
const displayQuestions = computed(() => serverQuestions.value)

// 加载题目
const loadQuestions = async (resetPage = false) => {
  try {
    loading.value = true
    if (resetPage) {
      resetPagination()
    }

    const result = await questionStore.loadQuestions({
      subjectId: filterSubjectId.value || null,
      subcategoryId: filterSubcategoryId.value || null,
      type: filterType.value || null,
      keyword: searchKeyword.value || null,
      page: paginationPage.value,
      limit: paginationLimit.value,
      excludeContent: true
    })

    serverQuestions.value = formatQuestions(result?.data || [])
    paginationTotal.value = result?.total || 0
  } catch (error) {
    console.error('加载题目失败:', error)
    ElMessage.error('加载题目失败')
  } finally {
    loading.value = false
  }
}

// 格式化题目数据
const formatQuestions = questions => {
  return questions.map(question => {
    const subjectId = question.subjectId || question.subject_id
    const subject = props.subjects.find(s => String(s.id) === String(subjectId))
    const subjectName = subject ? subject.name : ''

    let subcategoryName = ''
    const subcategoryId = question.subcategoryId || question.subcategory_id
    if (subject && subcategoryId) {
      const subcategory = subject.subcategories?.find(sc => String(sc.id) === String(subcategoryId))
      subcategoryName = subcategory ? subcategory.name : ''
    }

    const typeName = getTypeName(question.type)
    const createdAt = question.createdAt || question.created_at || '未知'
    const formattedCreatedAt =
      typeof createdAt === 'string' && createdAt !== '未知' ? formatDate(createdAt) : createdAt

    let content = question.content
    if (typeof content === 'object' && content?.ops) {
      const tempElement = document.createElement('div')
      content.ops.forEach(op => {
        if (typeof op.insert === 'string') {
          tempElement.innerHTML += op.insert
        } else if (op.insert?.image) {
          tempElement.innerHTML += `<img src="${op.insert.image}" alt="图片" style="max-width: 100%;">`
        }
      })
      content = tempElement.innerHTML
    } else if (typeof content !== 'string') {
      content = String(content || '')
    }

    return {
      ...question,
      content,
      subjectName,
      subcategoryName,
      typeName,
      createdAt: formattedCreatedAt,
      image: question.image || question.image_url || ''
    }
  })
}

// 防抖搜索
const debouncedSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    loadQuestions(true)
  }, 300)
}

// 监听筛选条件变化
watch([filterSubjectId, filterSubcategoryId, filterType], () => {
  loadQuestions(true)
})

watch(searchKeyword, () => {
  debouncedSearch()
})

// 监听分页变化
watch([paginationPage, paginationLimit], () => {
  loadQuestions()
})

// 分页变化处理
const onSizeChange = size => {
  handleSizeChange(size)
}

const onPageChange = page => {
  handleCurrentChange(page)
}

// 清除筛选
const clearFilter = type => {
  switch (type) {
    case 'subject':
    case 'subcategory':
      clearGlobalFilter()
      break
    case 'type':
      filterType.value = ''
      break
    case 'keyword':
      searchKeyword.value = ''
      break
  }
}

const clearAllFilters = () => {
  filterSubjectId.value = ''
  filterSubcategoryId.value = ''
  filterType.value = ''
  searchKeyword.value = ''
}

// 选择变化
const handleSelectionChange = selection => {
  selectedQuestions.value = selection
}

// 行内编辑
const startInlineEdit = row => {
  // 检查是否为富文本内容
  if (isRichText(row.content)) {
    ElMessage.warning('该题目包含富文本格式，请使用"编辑"按钮进行完整编辑')
    return
  }

  editingId.value = row.id
  editingContent.value = row.content
  nextTick(() => {
    inlineEditInput.value?.focus()
  })
}

const saveInlineEdit = async row => {
  if (editingContent.value === row.content) {
    editingId.value = null
    return
  }

  try {
    // 获取完整题目数据
    const fullQuestion = await api.get(`/questions/${row.id}`)

    await api.put(`/questions/${row.id}`, {
      ...fullQuestion,
      content: editingContent.value
    })

    ElMessage.success('修改成功')
    // 更新本地数据
    const index = serverQuestions.value.findIndex(q => q.id === row.id)
    if (index !== -1) {
      serverQuestions.value[index].content = editingContent.value
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    editingId.value = null
  }
}

const cancelInlineEdit = () => {
  editingId.value = null
}

// 删除撤销功能
const deleteQuestionWithUndo = row => {
  // 先临时从列表移除
  const index = serverQuestions.value.findIndex(q => q.id === row.id)
  const removed = { ...serverQuestions.value[index] }
  serverQuestions.value.splice(index, 1)
  paginationTotal.value -= 1

  // 存储待删除项
  pendingDeletes.value.set(row.id, {
    data: removed,
    index,
    timer: null
  })

  // 显示撤销提示
  ElMessage({
    message: `已删除题目 #${row.id}`,
    type: 'warning',
    duration: 3000,
    showClose: true,
    action: {
      text: '撤销',
      handler: () => {
        undoDelete(row.id)
      }
    },
    onClose: () => {
      // 消息关闭后执行真正删除
      executeRealDelete(row.id)
    }
  })
}

const undoDelete = questionId => {
  const pending = pendingDeletes.value.get(questionId)
  if (pending) {
    // 恢复数据
    serverQuestions.value.splice(pending.index, 0, pending.data)
    paginationTotal.value += 1
    pendingDeletes.value.delete(questionId)
    ElMessage.success('已撤销删除')
  }
}

const executeRealDelete = async questionId => {
  const pending = pendingDeletes.value.get(questionId)
  if (!pending) return // 已被撤销

  try {
    await api.delete(`/questions/${questionId}`)
    pendingDeletes.value.delete(questionId)
    emit('delete-question', questionId)
  } catch (error) {
    console.error('删除失败:', error)
  }
}

// 批量操作
const handleBatchCommand = command => {
  if (selectedQuestions.value.length === 0) {
    ElMessage.warning('请先选择题目')
    return
  }

  switch (command) {
    case 'delete':
      batchDeleteQuestions()
      break
    case 'updateDifficulty':
      batchDifficulty.value = 1
      batchDifficultyVisible.value = true
      break
    case 'updateType':
      batchType.value = ''
      batchTypeVisible.value = true
      break
    case 'move':
      batchMoveSubjectId.value = ''
      batchMoveSubcategoryId.value = ''
      batchMoveVisible.value = true
      break
  }
}

// 批量删除
const batchDeleteQuestions = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedQuestions.value.length} 道题目吗？`,
      '批量删除确认',
      { type: 'warning' }
    )

    const ids = selectedQuestions.value.map(q => q.id)
    await api.post('/questions/batch', { action: 'delete', ids })
    ElMessage.success(`成功删除 ${ids.length} 道题目`)
    selectedQuestions.value = []
    loadQuestions()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 批量修改难度
const executeBatchDifficulty = async () => {
  const ids = selectedQuestions.value.map(q => q.id)
  try {
    await api.post('/questions/batch', {
      action: 'updateDifficulty',
      ids,
      data: { difficulty: batchDifficulty.value }
    })
    ElMessage.success(`成功修改 ${ids.length} 道题目的难度`)
    batchDifficultyVisible.value = false
    selectedQuestions.value = []
    loadQuestions()
  } catch (error) {
    ElMessage.error('修改失败')
  }
}

// 批量修改类型
const executeBatchType = async () => {
  if (!batchType.value) {
    ElMessage.warning('请选择目标类型')
    return
  }

  const ids = selectedQuestions.value.map(q => q.id)
  try {
    await api.post('/questions/batch', {
      action: 'updateType',
      ids,
      data: { type: batchType.value }
    })
    ElMessage.success(`成功修改 ${ids.length} 道题目的类型`)
    batchTypeVisible.value = false
    selectedQuestions.value = []
    loadQuestions()
  } catch (error) {
    ElMessage.error('修改失败')
  }
}

// 批量移动
const handleBatchMoveSubjectChange = () => {
  batchMoveSubcategoryId.value = ''
}

const executeBatchMove = async () => {
  const ids = selectedQuestions.value.map(q => q.id)
  try {
    await api.post('/questions/batch', {
      action: 'move',
      ids,
      data: {
        subjectId: batchMoveSubjectId.value,
        subcategoryId: batchMoveSubcategoryId.value || null
      }
    })
    ElMessage.success(`成功移动 ${ids.length} 道题目`)
    batchMoveVisible.value = false
    selectedQuestions.value = []
    loadQuestions()
  } catch (error) {
    ElMessage.error('移动失败')
  }
}

// 预览题目
const previewQuestion = async row => {
  // 检查缓存
  if (previewCache.has(row.id)) {
    previewData.value = previewCache.get(row.id)
    previewVisible.value = true
    return
  }

  previewLoading.value = true
  previewVisible.value = true
  previewData.value = null

  try {
    const data = await api.get(`/questions/${row.id}`)

    const previewInfo = {
      ...data,
      subjectName:
        currentSubjectName.value || props.subjects.find(s => s.id == data.subjectId)?.name || '',
      subcategoryName:
        currentSubcategoryName.value ||
        props.subjects
          .find(s => s.id == data.subjectId)
          ?.subcategories?.find(sc => sc.id == data.subcategoryId)?.name ||
        '',
      typeName: getTypeName(data.type)
    }

    // 缓存预览数据（最多缓存50条）
    if (previewCache.size >= 50) {
      const firstKey = previewCache.keys().next().value
      previewCache.delete(firstKey)
    }
    previewCache.set(row.id, previewInfo)

    previewData.value = previewInfo
  } catch (error) {
    previewVisible.value = false
    ElMessage.error('获取题目详情失败')
  } finally {
    previewLoading.value = false
  }
}

// 显示图片预览
const showImagePreview = row => {
  const url = extractImageUrl(row)
  if (url) {
    window.open(url, '_blank')
  }
}

// 编辑题目
const editQuestion = row => {
  // 开启分屏编辑模式
  openSplitEdit(row)
}

// 从预览编辑
const handleEditFromPreview = () => {
  editQuestion(previewData.value)
  previewVisible.value = false
}

// 打开添加面板
const openAddPanel = () => {
  editMode.value = 'add'
  editingQuestionId.value = null
  splitEditMode.value = true

  // 初始化空表单
  const defaultSubjectId = props.subjects.length > 0 ? props.subjects[0].id : null
  const defaultSubcategoryId =
    defaultSubjectId && props.subjects[0]?.subcategories?.length > 0
      ? props.subjects[0].subcategories[0].id
      : null

  splitEditData.value = {
    subjectId: defaultSubjectId,
    subcategoryId: defaultSubcategoryId,
    type: 'single',
    difficulty: 1,
    content: '',
    options: ['', '', '', ''],
    selectedAnswers: [],
    explanation: '',
    audio: null,
    // 阅读理解题专用字段
    readingSubQuestions: [
      {
        content: '',
        options: ['', '', '', ''],
        answer: 'A',
        explanation: ''
      }
    ]
  }
}

// 开启分屏编辑
const openSplitEdit = async row => {
  editMode.value = 'edit'
  // 先显示面板和加载状态
  splitEditMode.value = true
  splitEditData.value = null
  editingQuestionId.value = row.id

  try {
    // 获取完整题目数据
    const data = await api.get(`/questions/${row.id}`)

    let options = data.options || []
    if (typeof options === 'string') {
      try {
        options = JSON.parse(options)
      } catch (e) {
        options = []
      }
    }

    // 解析答案
    let selectedAnswers = []
    const answer = data.answer || data.correct_answer
    if (answer) {
      if (data.type === 'multiple') {
        selectedAnswers = String(answer).split('')
      } else {
        selectedAnswers = [String(answer)]
      }
    }

    // 阅读理解题：解析小题数据
    let readingSubQuestions = []
    if (data.type === 'reading') {
      // options 是小题数组
      if (Array.isArray(options) && options.length > 0) {
        readingSubQuestions = options.map((sq, idx) => ({
          content: sq.content || '',
          options: Array.isArray(sq.options) ? sq.options : ['', '', '', ''],
          answer: sq.answer || 'A',
          explanation: sq.explanation || ''
        }))
      }
      // 解析答案对象 { "1": "A", "2": "B" }
      if (typeof answer === 'string') {
        try {
          const answerObj = JSON.parse(answer)
          if (typeof answerObj === 'object') {
            readingSubQuestions.forEach((sq, idx) => {
              sq.answer = answerObj[String(idx + 1)] || 'A'
            })
          }
        } catch (e) {
          // 答案不是 JSON，忽略
        }
      }
    }

    // 设置数据
    splitEditData.value = {
      subjectId: data.subjectId || data.subject_id,
      subcategoryId: data.subcategoryId || data.subcategory_id,
      type: data.type,
      difficulty: data.difficulty || 1,
      content: data.content || '',
      options: data.type === 'reading' ? [] : options,
      selectedAnswers: selectedAnswers,
      explanation: data.explanation || '',
      audio: data.audio_url || data.audio || null,
      // 阅读理解题专用字段
      readingSubQuestions:
        readingSubQuestions.length > 0
          ? readingSubQuestions
          : [
              {
                content: '',
                options: ['', '', '', ''],
                answer: 'A',
                explanation: ''
              }
            ]
    }
  } catch (error) {
    console.error('获取题目详情失败:', error)
    ElMessage.error('获取题目详情失败')
    closeSplitEdit()
  }
}

// 关闭分屏编辑
const closeSplitEdit = () => {
  splitEditMode.value = false
  editMode.value = 'edit'
  editingQuestionId.value = null
  splitEditData.value = null
  splitEditQuill.value = null
}

// 保存分屏编辑
const saveSplitEdit = async () => {
  if (!splitEditData.value) return

  // 验证
  if (!splitEditData.value.subjectId) {
    ElMessage.warning('请选择学科')
    return
  }
  if (!splitEditData.value.subcategoryId) {
    ElMessage.warning('请选择题库')
    return
  }
  if (!splitEditData.value.content) {
    ElMessage.warning('请输入题目内容')
    return
  }

  // 阅读理解题验证
  if (splitEditData.value.type === 'reading') {
    if (
      !splitEditData.value.readingSubQuestions ||
      splitEditData.value.readingSubQuestions.length === 0
    ) {
      ElMessage.warning('请添加至少一个小题')
      return
    }
    // 验证每个小题
    for (let i = 0; i < splitEditData.value.readingSubQuestions.length; i++) {
      const sq = splitEditData.value.readingSubQuestions[i]
      if (!sq.content || !sq.content.trim()) {
        ElMessage.warning(`请输入第 ${i + 1} 小题内容`)
        return
      }
      if (sq.options.some(opt => !opt || (typeof opt === 'string' && !opt.trim()))) {
        ElMessage.warning(`请填写第 ${i + 1} 小题的所有选项`)
        return
      }
    }
  } else {
    // 普通题目验证
    if (splitEditData.value.selectedAnswers.length === 0) {
      ElMessage.warning('请选择正确答案')
      return
    }
    // 验证选项内容
    if (splitEditData.value.options.some(opt => !opt || (typeof opt === 'string' && !opt.trim()))) {
      ElMessage.warning('请填写所有选项内容')
      return
    }
  }

  splitEditSaving.value = true

  try {
    let answer, options

    if (splitEditData.value.type === 'reading') {
      // 阅读理解题：构造小题数据和答案对象
      options = splitEditData.value.readingSubQuestions.map((sq, idx) => ({
        order: idx + 1,
        content: sq.content,
        options: sq.options,
        answer: sq.answer,
        explanation: sq.explanation || ''
      }))
      // 答案格式: { "1": "A", "2": "B" }
      const answerObj = {}
      splitEditData.value.readingSubQuestions.forEach((sq, idx) => {
        answerObj[String(idx + 1)] = sq.answer
      })
      answer = JSON.stringify(answerObj)
    } else {
      // 普通题目
      answer =
        splitEditData.value.type === 'multiple'
          ? splitEditData.value.selectedAnswers.join('')
          : splitEditData.value.selectedAnswers[0]
      options = splitEditData.value.options
    }

    const requestBody = {
      subjectId: splitEditData.value.subjectId,
      subcategoryId: splitEditData.value.subcategoryId || null,
      type: splitEditData.value.type,
      difficulty: splitEditData.value.difficulty,
      content: splitEditData.value.content,
      options: options,
      answer: answer,
      explanation: splitEditData.value.explanation,
      audio: splitEditData.value.audio || null
    }

    if (editMode.value === 'add') {
      // 添加新题目
      await api.post('/questions', requestBody)
    } else {
      // 编辑现有题目
      await api.put(`/questions/${editingQuestionId.value}`, requestBody)
    }

    ElMessage.success(editMode.value === 'add' ? '添加成功' : '保存成功')
    // 刷新列表
    loadQuestions()
    // 添加成功后关闭面板
    if (editMode.value === 'add') {
      closeSplitEdit()
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error(error.message || '保存失败')
  } finally {
    splitEditSaving.value = false
  }
}

// 保存并下一个
const saveAndNext = async () => {
  await saveSplitEdit()

  if (!splitEditMode.value) return // 保存失败则不继续

  // 找到当前题目的索引
  const currentIndex = serverQuestions.value.findIndex(q => q.id === editingQuestionId.value)

  if (currentIndex < serverQuestions.value.length - 1) {
    // 打开下一个题目
    const nextQuestion = serverQuestions.value[currentIndex + 1]
    openSplitEdit(nextQuestion)
  } else {
    ElMessage.info('已是最后一题')
    closeSplitEdit()
  }
}

// 分屏编辑学科变化
const onSplitEditSubjectChange = () => {
  splitEditData.value.subcategoryId = null
}

// 分屏编辑 Quill 准备（预留用于未来的富文本编辑器增强功能）
const _onSplitQuillReady = quill => {
  splitEditQuill.value = quill
}

// 添加选项
const addSplitEditOption = () => {
  if (!splitEditData.value) return
  if (splitEditData.value.options.length >= 6) {
    ElMessage.warning('最多添加6个选项')
    return
  }
  splitEditData.value.options.push('')
}

// 删除选项
const removeSplitEditOption = index => {
  if (!splitEditData.value) return
  const letter = String.fromCharCode(65 + index)
  // 移除选项
  splitEditData.value.options.splice(index, 1)
  // 移除答案中的该选项
  splitEditData.value.selectedAnswers = splitEditData.value.selectedAnswers.filter(
    a => a !== letter
  )
}

// ========== 阅读理解题辅助函数 ==========
// 添加阅读理解小题
const addReadingSubQuestion = () => {
  if (!splitEditData.value) return
  if (splitEditData.value.readingSubQuestions.length >= 10) {
    ElMessage.warning('最多添加10个小题')
    return
  }
  splitEditData.value.readingSubQuestions.push({
    content: '',
    options: ['', '', '', ''],
    answer: 'A',
    explanation: ''
  })
}

// 删除阅读理解小题
const removeReadingSubQuestion = index => {
  if (!splitEditData.value) return
  if (splitEditData.value.readingSubQuestions.length <= 1) {
    ElMessage.warning('至少保留一个小题')
    return
  }
  splitEditData.value.readingSubQuestions.splice(index, 1)
}

// 添加阅读理解小题选项
const addReadingSubOption = sqIndex => {
  if (!splitEditData.value) return
  const subQ = splitEditData.value.readingSubQuestions[sqIndex]
  if (!subQ) return
  if (subQ.options.length >= 6) {
    ElMessage.warning('每个小题最多6个选项')
    return
  }
  subQ.options.push('')
}

// 删除阅读理解小题选项
const removeReadingSubOption = (sqIndex, optIndex) => {
  if (!splitEditData.value) return
  const subQ = splitEditData.value.readingSubQuestions[sqIndex]
  if (!subQ) return
  if (subQ.options.length <= 2) {
    ElMessage.warning('每个小题至少2个选项')
    return
  }
  subQ.options.splice(optIndex, 1)
  // 如果删除的选项是当前答案，重置答案为第一个选项
  const removedLetter = String.fromCharCode(65 + optIndex)
  if (subQ.answer === removedLetter) {
    subQ.answer = 'A'
  }
}

// 移动阅读理解小题
const moveReadingSubQuestion = (index, direction) => {
  if (!splitEditData.value) return
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= splitEditData.value.readingSubQuestions.length) return

  // 交换位置
  const temp = splitEditData.value.readingSubQuestions[index]
  splitEditData.value.readingSubQuestions[index] = splitEditData.value.readingSubQuestions[newIndex]
  splitEditData.value.readingSubQuestions[newIndex] = temp

  // 更新展开的小题索引
  activeReadingSubQuestion.value = newIndex
}

// 处理音频文件上传
const handleSplitEditAudioChange = async file => {
  console.log('[音频上传] 文件信息:', {
    name: file?.name,
    size: file?.raw?.size,
    type: file?.raw?.type,
    sizeMB: file?.raw?.size ? (file.raw.size / 1024 / 1024).toFixed(2) + ' MB' : 'unknown'
  })

  if (!file || !file.raw) return

  // 检查文件大小
  const maxSize = 10 * 1024 * 1024 // 10MB
  const fileSizeMB = (file.raw.size / 1024 / 1024).toFixed(2)

  console.log(`[音频上传] 文件大小: ${fileSizeMB} MB, 限制: 10 MB`)

  if (file.raw.size > maxSize) {
    ElMessage.error(`音频文件大小 ${fileSizeMB} MB 超过限制（最大 10MB）`)
    return
  }

  // 检查文件类型
  const allowedTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/wave',
    'audio/ogg',
    'audio/mp4',
    'audio/x-m4a',
    'audio/m4a'
  ]
  const ext = file.name.split('.').pop().toLowerCase()
  const allowedExts = ['mp3', 'wav', 'ogg', 'm4a']

  if (!allowedTypes.includes(file.raw.type) && !allowedExts.includes(ext)) {
    ElMessage.error('不支持的音频格式，仅支持 MP3、WAV、OGG、M4A')
    return
  }

  audioUploading.value = true
  audioUploadProgress.value = 0

  const formData = new FormData()
  formData.append('audio', file.raw)

  // 使用 XMLHttpRequest 获取真实上传进度
  const xhr = new XMLHttpRequest()
  xhr.timeout = 60000 // 60秒超时

  // 添加 readystatechange 监听
  xhr.addEventListener('readystatechange', () => {
    console.log('[音频上传] readyState:', xhr.readyState, 'status:', xhr.status)
  })

  xhr.upload.addEventListener('progress', e => {
    if (e.lengthComputable) {
      audioUploadProgress.value = Math.round((e.loaded / e.total) * 100)
    }
  })

  xhr.addEventListener('load', () => {
    console.log('[音频上传] 状态:', xhr.status, '响应:', xhr.responseText)
    try {
      const result = JSON.parse(xhr.responseText)
      if (xhr.status === 200 && result.success) {
        // 确保 splitEditData 存在
        if (!splitEditData.value) {
          splitEditData.value = {
            subjectId: null,
            subcategoryId: null,
            type: 'single',
            difficulty: 1,
            content: '',
            options: ['', '', '', ''],
            selectedAnswers: [],
            explanation: '',
            audio: result.url
          }
        } else {
          splitEditData.value.audio = result.url
        }
        console.log('[音频上传] 设置 audio URL:', result.url)
        ElMessage.success('音频上传成功')
      } else {
        // 显示服务器返回的具体错误信息
        const errorMsg = result.error || result.message || `上传失败 (${xhr.status})`
        console.error('[音频上传] 服务器错误:', errorMsg)
        ElMessage.error(errorMsg)
      }
    } catch (e) {
      console.error('[音频上传] 解析错误:', e)
      ElMessage.error(xhr.status === 200 ? '解析响应失败' : `上传失败: ${xhr.status}`)
    }
  })

  xhr.addEventListener('loadend', () => {
    console.log('[音频上传] 请求结束')
    audioUploading.value = false
    audioUploadProgress.value = 0
  })

  xhr.addEventListener('error', () => {
    console.error('[音频上传] 网络错误')
    ElMessage.error('网络错误，上传失败')
  })

  xhr.addEventListener('timeout', () => {
    console.error('[音频上传] 超时')
    ElMessage.error('上传超时')
  })

  xhr.addEventListener('abort', () => {
    console.log('[音频上传] 被中止')
    ElMessage.warning('上传已取消')
  })

  console.log('[音频上传] 开始上传:', file.name, '大小:', file.raw.size)
  console.log('[音频上传] API URL:', `${getApiBaseUrl()}/upload/audio`)

  xhr.open('POST', `${getApiBaseUrl()}/upload/audio`)
  xhr.send(formData)

  console.log('[音频上传] 请求已发送')
}

// 删除音频
const deleteSplitEditAudio = () => {
  if (splitEditData.value) {
    splitEditData.value.audio = null
    audioPlaying.value = false
    audioCurrentTime.value = 0
    audioDuration.value = 0
    audioProgress.value = 0
  }
}

// 音频播放器控制
const toggleAudioPlay = () => {
  if (!audioPlayerRef.value) return

  if (audioPlaying.value) {
    audioPlayerRef.value.pause()
  } else {
    audioPlayerRef.value.play()
  }
  audioPlaying.value = !audioPlaying.value
}

const onAudioLoaded = () => {
  if (audioPlayerRef.value) {
    audioDuration.value = audioPlayerRef.value.duration
  }
}

const onAudioTimeUpdate = () => {
  if (!audioPlayerRef.value) return
  audioCurrentTime.value = audioPlayerRef.value.currentTime
  if (audioDuration.value > 0) {
    audioProgress.value = (audioCurrentTime.value / audioDuration.value) * 100
  }
}

const onAudioEnded = () => {
  audioPlaying.value = false
  audioProgress.value = 0
}

const onAudioProgressChange = val => {
  if (!audioPlayerRef.value || !audioDuration.value) return
  audioPlayerRef.value.currentTime = (val / 100) * audioDuration.value
}

const audioSeekBackward = () => {
  if (!audioPlayerRef.value) return
  audioPlayerRef.value.currentTime = Math.max(0, audioPlayerRef.value.currentTime - 5)
}

const audioSeekForward = () => {
  if (!audioPlayerRef.value) return
  audioPlayerRef.value.currentTime = Math.min(
    audioDuration.value,
    audioPlayerRef.value.currentTime + 5
  )
}

const setAudioSpeed = speed => {
  if (!audioPlayerRef.value) return
  audioPlayerRef.value.playbackRate = speed
  audioSpeed.value = speed
}

const formatAudioTime = seconds => {
  if (!seconds || isNaN(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 编辑面板拖拽调整高度
let isPanelResizing = false
let startPanelY = 0
let startPanelHeight = 0

// 面板调整大小功能（预留用于未来的 UI 交互增强）
const _startPanelResize = e => {
  isPanelResizing = true
  startPanelY = e.clientY
  startPanelHeight = editPanelHeight.value
  document.addEventListener('mousemove', handlePanelResize)
  document.addEventListener('mouseup', stopPanelResize)
}

const handlePanelResize = e => {
  if (!isPanelResizing) return
  const diff = startPanelY - e.clientY
  const newHeight = Math.max(200, Math.min(500, startPanelHeight + diff))
  editPanelHeight.value = newHeight
}

const stopPanelResize = () => {
  isPanelResizing = false
  document.removeEventListener('mousemove', handlePanelResize)
  document.removeEventListener('mouseup', stopPanelResize)
}

// 显示批量添加对话框
const showBatchAddQuestionDialog = () => {
  emit('show-batch-add-dialog')
}

// 刷新题目
const refreshQuestions = () => {
  loadQuestions()
}

// 侧边栏拖拽调整宽度
let isResizing = false
let startX = 0
let startWidth = 0

// 侧边栏调整大小功能（预留用于未来的 UI 交互增强）
const _startResize = e => {
  isResizing = true
  startX = e.clientX
  startWidth = sidebarWidth.value
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

const handleResize = e => {
  if (!isResizing) return
  const diff = e.clientX - startX
  const newWidth = Math.max(180, Math.min(350, startWidth + diff))
  sidebarWidth.value = newWidth
}

const stopResize = () => {
  isResizing = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

// 辅助方法
const hasValidImage = row => {
  if (row.image) return true
  if (row.image_url) return true
  return typeof row.content === 'string' && row.content.includes('<img')
}

// 检测内容是否包含富文本（HTML标签）
const isRichText = content => {
  if (!content || typeof content !== 'string') return false
  // 检测常见的 HTML 标签（排除简单的换行）
  const richTextPattern = /<(?!br\s*\/?>)[a-zA-Z][^>]*>/i
  return richTextPattern.test(content)
}

// 检测内容是否可以安全进行行内编辑
const canInlineEdit = row => {
  // 富文本内容不适合行内编辑
  return !isRichText(row.content)
}

const extractImageUrl = row => {
  if (row.image) return row.image
  if (row.image_url) return row.image_url
  if (typeof row.content !== 'string') return ''
  const match = row.content.match(/<img[^>]+src="([^"]+)"/)
  return match ? match[1] : ''
}

const stripImages = content => {
  if (typeof content !== 'string') return ''
  return content.replace(/<img[^>]+>/g, '')
}

const truncate = (html, length) => {
  if (!html) return ''
  const text = html.replace(/<[^>]+>/g, '')
  return text.length > length ? text.substring(0, length) + '...' : html
}

const getTypeName = type => {
  const typeMap = {
    single: '单选题',
    multiple: '多选题',
    judgment: '判断题',
    listening: '听力题',
    reading: '阅读题',
    image: '看图题'
  }
  return typeMap[type] || (typeof type === 'string' ? type : '未知')
}

const getTypeTagType = type => {
  const typeMap = {
    single: 'primary',
    multiple: 'success',
    judgment: 'warning'
  }
  return typeMap[type] || 'info'
}

// 判断是否为阅读理解题格式的小题数组
const isReadingOptions = options => {
  if (!Array.isArray(options) || options.length === 0) return false
  const first = options[0]
  return typeof first === 'object' && first !== null && 'order' in first
}

const getRowClassName = ({ row }) => {
  return hasValidImage(row) || row.audio ? 'has-media' : ''
}

// 初始加载
onMounted(() => {
  loadQuestions()
})

// 组件卸载时清理
onUnmounted(() => {
  // 清理搜索定时器
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
  // 清理预览缓存
  previewCache.clear()
  // 清理待删除队列
  pendingDeletes.value.clear()
})

// 暴露方法给父组件
defineExpose({
  refresh: loadQuestions
})
</script>

<style scoped>
.question-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: transparent;
  overflow: hidden;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
  margin-bottom: 12px;
  border-radius: 8px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-right .el-button {
  padding: 8px 12px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  background: transparent;
  min-height: 0;
}

.content-wrapper.has-edit-panel .content-area {
  flex: 1;
  min-height: 0;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

/* 分屏编辑面板（顶部） */
.edit-panel {
  background: #fff;
  border-bottom: 3px solid #409eff;
  display: flex;
  flex-direction: column;
  position: relative;
  flex-shrink: 0;
  min-height: 280px;
  max-height: 80vh;
  z-index: 100;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.edit-panel-header {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  position: relative;
}

.edit-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.edit-panel-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.panel-resize-handle {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  cursor: row-resize;
  background: transparent;
  transition: background 0.2s;
}

.panel-resize-handle:hover {
  background: #409eff;
}

.edit-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.edit-panel-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-panel-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #409eff;
  font-size: 16px;
}

.edit-panel-loading .is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.split-edit-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quick-edit-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.quick-edit-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.content-editor-wrapper {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.content-editor-wrapper :deep(.ql-container) {
  min-height: 100px;
  max-height: 180px;
  overflow-y: auto;
}

.content-editor-wrapper :deep(.ql-editor) {
  font-size: 14px;
  line-height: 1.6;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.audio-upload-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.audio-upload-dragger {
  padding: 20px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}

.audio-upload-dragger:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

.audio-upload-dragger .upload-icon {
  font-size: 48px;
  color: #909399;
  margin-bottom: 8px;
}

.audio-upload-dragger .upload-text {
  font-size: 14px;
  color: #606266;
}

.audio-upload-dragger .upload-text em {
  color: #409eff;
  font-style: normal;
}

.audio-upload-dragger .upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.audio-uploading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
}

.audio-preview {
  width: 100%;
}

.audio-player {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
}

.audio-player audio {
  display: none;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.play-buttons {
  flex-shrink: 0;
}

.progress-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
}

.progress-slider {
  flex: 1;
}

.time-display {
  font-size: 12px;
  color: #606266;
  min-width: 45px;
  text-align: center;
}

.speed-control {
  flex-shrink: 0;
}

.quick-option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.quick-option-item:hover {
  border-color: #409eff;
}

.option-letter {
  font-weight: 600;
  color: #409eff;
  min-width: 20px;
}

.quick-option-input {
  flex: 1;
}

.quick-option-input :deep(.ql-container) {
  min-height: 40px;
}

.quick-option-input :deep(.ql-editor) {
  font-size: 13px;
  padding: 8px;
  min-height: 24px;
}

.quick-option-input :deep(.ql-editor p) {
  margin: 0;
  line-height: 1.5;
}

/* 阅读理解题编辑样式 */
.reading-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #2e7d32;
}

.reading-tip .el-icon {
  font-size: 18px;
}

.reading-sub-collapse {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: visible;
}

.reading-sub-collapse :deep(.el-collapse-item) {
  position: relative;
  z-index: 1;
}

.reading-sub-collapse :deep(.el-collapse-item.is-active) {
  z-index: 10;
}

.reading-sub-collapse :deep(.el-collapse-item__header) {
  background-color: #f8fafc;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 16px;
  height: 48px;
  line-height: 48px;
  position: relative;
  z-index: 2;
}

.reading-sub-collapse :deep(.el-collapse-item__wrap) {
  border-bottom: none;
  position: relative;
  z-index: 1;
}

.reading-sub-collapse :deep(.el-collapse-item__content) {
  padding: 16px;
  background-color: white;
  position: relative;
  z-index: 1;
}

.sub-collapse-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sub-collapse-order {
  font-weight: 600;
  color: #1e293b;
}

.sub-answer-tag {
  margin-left: 8px;
}

.sub-collapse-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.sub-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.sub-field-content {
  margin-bottom: 8px;
  overflow: visible;
}

.sub-field-content :deep(.quill-editor) {
  overflow: visible;
}

.sub-field-content :deep(.ql-toolbar) {
  position: relative;
  z-index: 20;
}

.sub-field-content :deep(.ql-container) {
  min-height: 100px;
}

.sub-field-options {
  overflow: visible;
}

.sub-field-explanation {
  overflow: visible;
}

.sub-field-explanation :deep(.ql-container) {
  min-height: 60px;
}

/* 富文本编辑器容器 */
.sub-field :deep(.quill-editor) {
  position: relative;
}

.sub-field :deep(.ql-toolbar) {
  position: relative;
  z-index: 10;
}

.sub-field :deep(.ql-container) {
  position: relative;
  z-index: 5;
}

.sub-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: #475569;
}

.sub-options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.sub-option-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #f8fafc;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  transition: all 0.2s;
}

.sub-option-row:hover {
  border-color: #409eff;
}

.sub-option-row.is-selected {
  background-color: #f0f9eb;
  border-color: #67c23a;
}

.sub-option-row .el-radio {
  flex-shrink: 0;
}

.sub-option-editor {
  flex: 1;
  min-height: 32px;
}

.sub-option-editor :deep(.ql-container) {
  min-height: 32px;
  border: none;
}

.sub-option-editor :deep(.ql-editor) {
  padding: 4px 8px;
  font-size: 13px;
  min-height: 24px;
}

.sub-option-editor :deep(.ql-editor p) {
  margin: 0;
  line-height: 1.5;
}

/* 选项编辑器工具栏样式 - 聚焦时显示 */
.sub-option-editor :deep(.ql-toolbar) {
  display: none;
  position: absolute;
  top: -40px;
  left: 0;
  z-index: 100;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.sub-option-editor:focus-within :deep(.ql-toolbar) {
  display: block;
}

.sub-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid #e4e7ed;
}

.breadcrumb-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 10px 14px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
}

.total-count {
  color: #606266;
  font-size: 14px;
}

.filter-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 14px;
  background: #fff;
  border-radius: 8px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.total-count {
  color: #606266;
  font-size: 14px;
}

.filter-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 14px;
  background: #fff;
  border-radius: 8px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.filter-label {
  color: #606266;
  font-size: 13px;
}

.question-content-wrapper {
  width: 100%;
}

.question-content-preview {
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  width: 100%;
}

.question-content-preview.editable {
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.question-content-preview.editable:hover {
  background: #f5f7fa;
}

.edit-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.content-with-image {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.image-preview {
  flex-shrink: 0;
  width: 60px;
  height: 45px;
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  cursor: pointer;
  transition: transform 0.2s;
}

.image-preview:hover {
  transform: scale(1.05);
}

.question-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content-with-audio {
  display: flex;
  align-items: center;
  gap: 8px;
}

.audio-icon {
  font-size: 18px;
  color: #409eff;
}

.content-text-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.rich-text-tag {
  flex-shrink: 0;
  font-size: 11px;
  opacity: 0.7;
}

.content-text {
  flex: 1;
  min-width: 0;
  word-break: break-word;
  line-height: 1.5;
  font-size: 14px;
  color: #303133;
}

.subcategory-text {
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #606266;
}

.time-text {
  font-size: 13px;
  color: #909399;
}

.row-operations {
  display: flex;
  justify-content: center;
  gap: 4px;
  flex-wrap: nowrap;
}

.row-operations .el-button {
  padding: 4px 6px;
  font-size: 12px;
}

.has-media {
  background-color: #fafafa;
}

.pagination-container {
  margin-top: 12px;
  display: flex;
  justify-content: center;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  flex-shrink: 0;
}

/* 预览弹窗样式 */
.preview-content {
  padding: 10px;
}

.preview-item {
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
}

.preview-item label {
  width: 80px;
  flex-shrink: 0;
  color: #606266;
  font-weight: 500;
}

.preview-content-box {
  flex: 1;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  line-height: 1.6;
  word-break: break-word;
}

.preview-content-box img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
  margin: 8px 0;
}

.preview-options {
  flex: 1;
}

.preview-option {
  padding: 10px 12px;
  margin-bottom: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.option-label {
  flex-shrink: 0;
  font-weight: 600;
  color: #409eff;
}

.option-content {
  flex: 1;
  line-height: 1.6;
  word-break: break-word;
}

.option-content img {
  max-width: 200px;
  max-height: 100px;
  border-radius: 4px;
  margin: 4px 0;
}

/* 阅读理解题预览样式 */
.preview-reading-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-sub-question {
  padding: 12px;
  background-color: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.preview-sub-question .sub-question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.preview-sub-question .sub-question-order {
  font-weight: 600;
  color: #303133;
}

.preview-sub-question .sub-question-content {
  padding: 8px;
  background-color: white;
  border-radius: 4px;
  margin-bottom: 8px;
}

.preview-sub-question .sub-question-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-sub-question .preview-option.is-correct {
  background-color: #f0f9ff;
  border-color: #67c23a;
}

/* Element Plus 样式覆盖 */
:deep(.el-tree-node__content) {
  height: 36px;
  border-radius: 4px;
  margin-bottom: 2px;
}

:deep(.el-tree-node__content:hover) {
  background-color: #ecf5ff;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #ecf5ff;
  color: #409eff;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background: #f5f7fa !important;
}
</style>
