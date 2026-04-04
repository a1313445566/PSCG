<template>
  <div class="universal-audio-player" :class="[modeClass, { 'is-uploading': uploading }]">
    <!-- 模式1：管理模式（带上传和删除） -->
    <template v-if="mode === 'admin'">
      <div v-if="!audioUrl && !uploading" class="upload-area">
        <el-upload
          class="audio-uploader"
          action=""
          :auto-upload="false"
          :show-file-list="false"
          accept="audio/*"
          :drag="true"
          :on-change="handleFileChange"
        >
          <div class="upload-dragger">
            <el-icon class="upload-icon"><Upload /></el-icon>
            <div class="upload-text">
              拖拽音频文件到此处，或
              <em>点击上传</em>
            </div>
            <div class="upload-tip">支持 MP3、WAV、OGG、M4A 格式，最大 10MB</div>
          </div>
        </el-upload>
      </div>

      <div v-if="uploading" class="uploading-area">
        <el-progress type="circle" :percentage="uploadProgress" :width="60" />
        <span>{{ uploadProgress >= 100 ? '处理中...' : '上传中...' }}</span>
      </div>

      <div v-if="audioUrl && !uploading" class="player-wrapper admin-style">
        <audio
          ref="audioPlayerRef"
          :src="audioUrl"
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
                  <el-dropdown-item v-for="s in speedOptions" :key="s" :command="s">
                    {{ s }}x
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <el-button type="danger" size="small" @click="$emit('delete')">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
    </template>

    <!-- 模式2：播放模式（纯播放，炫酷 UI） -->
    <template v-else-if="mode === 'quiz'">
      <div v-if="audioUrl && !uploading" class="audio-section">
        <div class="player-wrapper quiz-style">
          <audio
            ref="audioPlayerRef"
            :src="audioUrl"
            @loadedmetadata="onAudioLoaded"
            @timeupdate="onAudioTimeUpdate"
            @ended="onAudioEnded"
          ></audio>
          <div class="player-controls">
            <button class="seek-btn" title="后退5秒" @click="audioSeekBackward">
              <span class="seek-icon">⟲</span>
              <span class="seek-label">-5s</span>
            </button>

            <button
              class="play-main-btn"
              :class="{ playing: audioPlaying }"
              @click="toggleAudioPlay"
            >
              <span v-if="audioPlaying" class="play-icon">❚❚</span>
              <span v-else class="play-icon">▶</span>
            </button>

            <button class="seek-btn" title="前进5秒" @click="audioSeekForward">
              <span class="seek-icon">⟳</span>
              <span class="seek-label">+5s</span>
            </button>

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
                <span class="speed-btn">{{ audioSpeed }}x 倍速</span>
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
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Upload,
  Delete,
  DArrowLeft,
  DArrowRight,
  VideoPlay,
  VideoPause,
  ArrowDown
} from '@element-plus/icons-vue'
import { useAudioPlayer } from '@/composables/useAudioPlayer'

const props = defineProps({
  mode: {
    type: String,
    default: 'quiz',
    validator: value => ['admin', 'quiz'].includes(value)
  },
  modelValue: {
    type: String,
    default: ''
  },
  uploading: {
    type: Boolean,
    default: false
  },
  uploadProgress: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:modelValue', 'delete', 'file-change'])

const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2]

const audioUrl = computed(() => props.modelValue)

const modeClass = computed(() => `mode-${props.mode}`)

const {
  audioPlayerRef,
  audioPlaying,
  audioCurrentTime,
  audioDuration,
  audioProgress,
  audioSpeed,
  toggleAudioPlay,
  onAudioLoaded,
  onAudioTimeUpdate,
  onAudioEnded,
  onAudioProgressChange,
  audioSeekBackward,
  audioSeekForward,
  setAudioSpeed,
  formatAudioTime
} = useAudioPlayer()

const handleFileChange = file => {
  emit('file-change', file)
}
</script>

<style scoped lang="scss">
.universal-audio-player {
  width: 100%;
}

/* ========== 管理模式样式 (Admin) ========== */
.mode-admin {
  .upload-area {
    .audio-uploader {
      width: 100%;
    }

    .upload-dragger {
      padding: 20px;
      border: 2px dashed #dcdfe6;
      border-radius: 8px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
      background: #fafafa;

      &:hover {
        border-color: #409eff;
        background: #ecf5ff;
      }

      .upload-icon {
        font-size: 48px;
        color: #909399;
        margin-bottom: 8px;
      }

      .upload-text {
        font-size: 14px;
        color: #606266;

        em {
          color: #409eff;
          font-style: normal;
        }
      }

      .upload-tip {
        font-size: 12px;
        color: #909399;
        margin-top: 8px;
      }
    }
  }

  .uploading-area {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 20px;
    background: #fafafa;
    border-radius: 8px;
  }

  .player-wrapper.admin-style {
    background: #f5f7fa;
    border-radius: 8px;
    padding: 12px;

    audio {
      display: none;
    }
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
}

/* ========== 播放模式样式 (Quiz) ========== */
.mode-quiz {
  .audio-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 16px;
    margin: 15px 0;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .player-wrapper.quiz-style {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 8px;
    padding: 16px;

    audio {
      display: none;
    }
  }

  .player-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .seek-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border: none;
    background: #f0f2f5;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #606266;

    &:hover {
      background: #e4e7ed;
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  .seek-icon {
    font-size: 16px;
    line-height: 1;
  }

  .seek-label {
    font-size: 10px;
    font-weight: 600;
    margin-top: 2px;
  }

  .play-main-btn {
    width: 64px;
    height: 64px;
    border: none;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    transition: all 0.2s ease;
    flex-shrink: 0;

    &:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
    }

    &:active {
      transform: scale(0.95);
    }

    &.playing {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
  }

  .play-icon {
    font-size: 22px;
    line-height: 1;
  }

  .progress-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 200px;
  }

  .progress-slider {
    flex: 1;
  }

  .time-display {
    font-size: 13px;
    color: #606266;
    min-width: 48px;
    text-align: center;
    font-family: monospace;
    font-weight: 500;
  }

  .speed-control {
    flex-shrink: 0;
  }

  .speed-btn {
    font-size: 13px;
    color: #606266;
    cursor: pointer;
    padding: 6px 12px;
    background: #f0f2f5;
    border-radius: 16px;
    transition: all 0.2s ease;
    white-space: nowrap;

    &:hover {
      background: #e4e7ed;
      color: #667eea;
    }
  }
}
</style>
