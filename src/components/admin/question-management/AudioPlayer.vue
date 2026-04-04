<template>
  <div class="audio-upload-area">
    <!-- 上传区域 -->
    <div v-if="!modelValue && !uploading">
      <el-upload
        class="audio-uploader"
        action=""
        :auto-upload="false"
        :show-file-list="false"
        accept="audio/*"
        :drag="true"
        :on-change="handleFileChange"
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
    <div v-if="uploading" class="audio-uploading">
      <el-progress type="circle" :percentage="uploadProgress" :width="60" />
      <span>{{ uploadProgress >= 100 ? '处理中...' : '上传中...' }}</span>
    </div>

    <!-- 音频播放器 -->
    <div v-if="modelValue && !uploading" class="audio-preview">
      <div class="audio-player">
        <audio
          ref="audioEl"
          :src="modelValue"
          @loadedmetadata="onLoaded"
          @timeupdate="onTimeUpdate"
          @ended="onEnded"
        ></audio>
        <div class="player-controls">
          <el-button-group class="play-buttons">
            <el-button size="small" @click="seekBackward">
              <el-icon><DArrowLeft /></el-icon>
            </el-button>
            <el-button size="small" type="primary" @click="togglePlay">
              <el-icon v-if="isPlaying"><VideoPause /></el-icon>
              <el-icon v-else><VideoPlay /></el-icon>
            </el-button>
            <el-button size="small" @click="seekForward">
              <el-icon><DArrowRight /></el-icon>
            </el-button>
          </el-button-group>
          <div class="progress-wrapper">
            <span class="time-display">{{ formatTime(currentTime) }}</span>
            <el-slider
              v-model="progress"
              :show-tooltip="false"
              class="progress-slider"
              @change="onProgressChange"
            />
            <span class="time-display">{{ formatTime(duration) }}</span>
          </div>
          <div class="speed-control">
            <el-dropdown trigger="click" @command="onSpeedChange">
              <el-button size="small">
                {{ speed }}x
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
          <el-button type="danger" size="small" @click="handleDelete">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  Upload,
  Delete,
  DArrowLeft,
  DArrowRight,
  VideoPlay,
  VideoPause,
  ArrowDown
} from '@element-plus/icons-vue'
import { useAudioPlayer } from '../../../composables/useAudioPlayer'

const props = defineProps({
  modelValue: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'delete'])

const audioEl = ref(null)
const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2]

const {
  audioPlaying: isPlaying,
  audioCurrentTime: currentTime,
  audioDuration: duration,
  audioProgress: progress,
  audioSpeed: speed,
  audioUploading: uploading,
  audioUploadProgress: uploadProgress,
  toggleAudioPlay: togglePlay,
  onAudioLoaded: onLoaded,
  onAudioTimeUpdate: onTimeUpdate,
  onAudioEnded: onEnded,
  onAudioProgressChange: onProgressChange,
  audioSeekBackward: seekBackward,
  audioSeekForward: seekForward,
  setAudioSpeed: onSpeedChange,
  formatAudioTime: formatTime,
  handleSplitEditAudioChange: handleFileChange
} = useAudioPlayer()

const handleDelete = () => {
  emit('update:modelValue', '')
  emit('delete')
}
</script>

<style scoped lang="scss">
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
</style>
