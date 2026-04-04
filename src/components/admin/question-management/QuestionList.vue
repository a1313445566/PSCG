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

              <!-- 判断题选项 -->
              <div v-if="splitEditData.type === 'judgment'" class="quick-edit-section">
                <label class="section-label">答案选项（判断题固定为"对/错"）</label>
                <div class="judgment-options">
                  <div class="judgment-option">
                    <el-radio v-model="judgmentAnswer" label="A" class="judgment-radio">
                      <span class="option-letter">A</span>
                      <span class="option-text">对</span>
                    </el-radio>
                  </div>
                  <div class="judgment-option">
                    <el-radio v-model="judgmentAnswer" label="B" class="judgment-radio">
                      <span class="option-letter">B</span>
                      <span class="option-text">错</span>
                    </el-radio>
                  </div>
                </div>
              </div>

              <!-- 普通题目选项 -->
              <div
                v-else-if="splitEditData && splitEditData.type !== 'reading'"
                class="quick-edit-section"
              >
                <label class="section-label">
                  答案选项
                  <el-button type="primary" size="small" text @click="addSplitEditOption">
                    <el-icon><Plus /></el-icon>
                    添加
                  </el-button>
                </label>
                <el-checkbox-group v-model="splitEditData.selectedAnswers">
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
                </el-checkbox-group>
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
                          toolbar-mode="basic"
                          :options="{ placeholder: '输入小题题目...' }"
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
                        <el-input
                          v-model="sq.explanation"
                          type="textarea"
                          :rows="2"
                          placeholder="输入小题解析..."
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
              <el-table-column prop="answer" label="答案" width="100" align="center">
                <template #default="{ row }">
                  <template v-if="row.type === 'judgment'">
                    <!-- 判断题显示"对"或"错" -->
                    <el-tag size="small" type="danger" effect="dark">
                      {{
                        row.answer === 'A' || row.answer === '对'
                          ? '对'
                          : row.answer === 'B' || row.answer === '错'
                            ? '错'
                            : row.answer || '-'
                      }}
                    </el-tag>
                  </template>
                  <template v-else-if="row.type === 'reading'">
                    <!-- 阅读题显示小题答案数量 -->
                    <template v-if="typeof row.answer === 'string' && row.answer.startsWith('{')">
                      <el-tag
                        size="small"
                        type="success"
                        effect="light"
                        :title="'答案：' + row.answer"
                      >
                        {{ Object.keys(JSON.parse(row.answer)).length }} 题
                      </el-tag>
                    </template>
                    <template v-else-if="typeof row.answer === 'object' && row.answer !== null">
                      <el-tag
                        size="small"
                        type="success"
                        effect="light"
                        :title="'答案：' + JSON.stringify(row.answer)"
                      >
                        {{ Object.keys(row.answer).length }} 题
                      </el-tag>
                    </template>
                    <el-tag v-else size="small" type="danger" effect="dark">
                      {{ row.answer || '-' }}
                    </el-tag>
                  </template>
                  <template v-else>
                    <!-- 其他题型正常显示 -->
                    <el-tag size="small" type="danger" effect="dark">
                      {{ row.answer || '-' }}
                    </el-tag>
                  </template>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
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
import { useAdminLayout } from '../../../composables/useAdminLayout'
import { useQuestionTable } from '../../../composables/useQuestionTable'
import { useSplitEdit } from '../../../composables/useSplitEdit'
import { useBatchOperations } from '../../../composables/useBatchOperations'
import { useAudioPlayer } from '../../../composables/useAudioPlayer'
import { useQuestionPreview } from '../../../composables/useQuestionPreview'
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

// 使用全局布局状态
const { filterSubjectId, filterSubcategoryId, clearFilter: clearGlobalFilter } = useAdminLayout()

// 筛选条件
const searchKeyword = ref('')
const filterType = ref('')

// 选中的题目
const selectedQuestions = ref([])

// 使用题目表格 composable
const {
  loading,
  serverQuestions,
  paginationTotal,
  loadQuestions,
  editingId,
  editingContent,
  inlineEditInput,
  startInlineEdit,
  saveInlineEdit,
  cancelInlineEdit,
  pendingDeletes,
  deleteQuestionWithUndo,
  undoDelete,
  executeRealDelete: originalExecuteRealDelete,
  hasValidImage,
  isRichText,
  canInlineEdit,
  extractImageUrl,
  stripImages,
  truncate,
  getTypeName,
  getTypeTagType,
  isReadingOptions,
  getRowClassName,
  paginationPage,
  paginationLimit,
  handleSizeChange,
  handleCurrentChange
} = useQuestionTable(props)

// 使用分屏编辑 composable
const {
  splitEditMode,
  editMode,
  editingQuestionId,
  splitEditData,
  splitEditSaving,
  editPanelHeight,
  activeReadingSubQuestion,
  splitEditSubcategories,
  openAddPanel,
  openSplitEdit,
  closeSplitEdit,
  saveSplitEdit,
  saveAndNext,
  onSplitEditSubjectChange,
  addSplitEditOption,
  removeSplitEditOption,
  addReadingSubQuestion,
  removeReadingSubQuestion,
  addReadingSubOption,
  removeReadingSubOption,
  moveReadingSubQuestion
} = useSplitEdit(props, { loadQuestions, serverQuestions })

// 使用批量操作 composable
const {
  batchDifficultyVisible,
  batchDifficulty,
  batchTypeVisible,
  batchType,
  batchMoveVisible,
  batchMoveSubjectId,
  batchMoveSubcategoryId,
  batchMoveSubcategories,
  handleBatchCommand,
  executeBatchDifficulty,
  executeBatchType,
  handleBatchMoveSubjectChange,
  executeBatchMove
} = useBatchOperations(selectedQuestions, loadQuestions, props.subjects)

// 使用音频播放器 composable
const {
  audioPlayerRef,
  audioPlaying,
  audioCurrentTime,
  audioDuration,
  audioProgress,
  audioSpeed,
  audioUploading,
  audioUploadProgress,
  toggleAudioPlay,
  onAudioLoaded,
  onAudioTimeUpdate,
  onAudioEnded,
  onAudioProgressChange,
  audioSeekBackward,
  audioSeekForward,
  setAudioSpeed,
  formatAudioTime,
  handleSplitEditAudioChange: originalHandleSplitEditAudioChange,
  deleteSplitEditAudio: originalDeleteSplitEditAudio
} = useAudioPlayer()

const handleSplitEditAudioChange = file => originalHandleSplitEditAudioChange(file, splitEditData)
const deleteSplitEditAudio = () => originalDeleteSplitEditAudio(splitEditData)

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
  const subject = props.subjects.find(s => s.id == filterSubcategoryId.value)
  if (!subject || !subject.subcategories) return ''
  const subcategory = subject.subcategories.find(sc => sc.id == filterSubcategoryId.value)
  return subcategory ? subcategory.name : ''
})

// 使用题目预览 composable
const {
  previewVisible,
  previewData,
  previewLoading,
  previewCache,
  previewQuestion,
  handleEditFromPreview,
  showImagePreview,
  clearPreviewCache
} = useQuestionPreview(props, {
  editQuestion: openSplitEdit,
  currentSubjectName,
  currentSubcategoryName,
  getTypeName
})

// 是否有激活的筛选条件
const hasActiveFilters = computed(() => {
  return (
    filterSubjectId.value || filterSubcategoryId.value || filterType.value || searchKeyword.value
  )
})

// 显示的题目
const displayQuestions = computed(() => serverQuestions.value)

// 判断题答案（将数组转为字符串供 el-radio 使用）
const judgmentAnswer = computed({
  get: () => splitEditData.value?.selectedAnswers?.[0] || 'A',
  set: val => {
    if (splitEditData.value) {
      splitEditData.value.selectedAnswers = [val]
    }
  }
})

// 分页对象
const pagination = computed(() => ({
  page: paginationPage.value,
  limit: paginationLimit.value,
  total: paginationTotal.value
}))

// 包装 loadQuestions，添加筛选参数
const wrappedLoadQuestions = (resetPage = false) => {
  loadQuestions(resetPage, {
    filterSubjectId: filterSubjectId.value,
    filterSubcategoryId: filterSubcategoryId.value,
    filterType: filterType.value,
    searchKeyword: searchKeyword.value
  })
}

// 防抖搜索
const debouncedSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    wrappedLoadQuestions(true)
  }, 300)
}

// 监听筛选条件变化
watch([filterSubjectId, filterSubcategoryId, filterType], () => {
  wrappedLoadQuestions(true)
})

watch(searchKeyword, () => {
  debouncedSearch()
})

// 监听分页变化
watch([paginationPage, paginationLimit], () => {
  wrappedLoadQuestions()
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

// 编辑题目
const editQuestion = row => {
  openSplitEdit(row)
}

// 显示批量添加对话框
const showBatchAddQuestionDialog = () => {
  emit('show-batch-add-dialog')
}

// 刷新题目
const refreshQuestions = () => {
  wrappedLoadQuestions()
}

// 覆盖 executeRealDelete 以添加 emit
const executeRealDelete = async questionId => {
  await originalExecuteRealDelete(questionId)
  emit('delete-question', questionId)
}

// 初始加载
onMounted(() => {
  wrappedLoadQuestions()
})

// 组件卸载时清理
onUnmounted(() => {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
  clearPreviewCache()
  pendingDeletes.value.clear()
})

// 暴露方法给父组件
defineExpose({
  refresh: wrappedLoadQuestions
})
</script>

<style scoped lang="scss">
@use '../../../styles/scss/components/question-management' as *;

// ============================================
// QuestionList 布局骨架（仅保留与组件结构强耦合的样式）
// 子模块样式见 _question-management.scss
// ============================================
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
  z-index: 1 00;
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

// [已提取到 _question-management.scss: split-edit-form / audio-player / quick-option]

// [已提取到 _question-management.scss: reading-sub / sub-collapse / sub-option]

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

// [已提取到 _question-management.scss: preview / preview-reading]

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

// [已提取到 _question-management.scss: judgment-options]
</style>
