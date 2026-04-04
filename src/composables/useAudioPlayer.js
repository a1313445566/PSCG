import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getApiBaseUrl } from '../utils/database'

export function useAudioPlayer() {
  const audioPlayerRef = ref(null)
  const audioPlaying = ref(false)
  const audioCurrentTime = ref(0)
  const audioDuration = ref(0)
  const audioProgress = ref(0)
  const audioSpeed = ref(1)
  const audioUploading = ref(false)
  const audioUploadProgress = ref(0)

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

  const handleSplitEditAudioChange = async (file, splitEditDataRef) => {
    console.log('[音频上传] 文件信息:', {
      name: file?.name,
      size: file?.raw?.size,
      type: file?.raw?.type,
      sizeMB: file?.raw?.size ? (file.raw.size / 1024 / 1024).toFixed(2) + ' MB' : 'unknown'
    })

    if (!file || !file.raw) return

    const maxSize = 10 * 1024 * 1024
    const fileSizeMB = (file.raw.size / 1024 / 1024).toFixed(2)

    console.log(`[音频上传] 文件大小: ${fileSizeMB} MB, 限制: 10 MB`)

    if (file.raw.size > maxSize) {
      ElMessage.error(`音频文件大小 ${fileSizeMB} MB 超过限制（最大 10MB）`)
      return
    }

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

    const xhr = new XMLHttpRequest()
    xhr.timeout = 60000

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
          if (!splitEditDataRef.value) {
            splitEditDataRef.value = {
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
            splitEditDataRef.value.audio = result.url
          }
          console.log('[音频上传] 设置 audio URL:', result.url)
          ElMessage.success('音频上传成功')
        } else {
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

  const deleteSplitEditAudio = splitEditDataRef => {
    if (splitEditDataRef.value) {
      splitEditDataRef.value.audio = null
      audioPlaying.value = false
      audioCurrentTime.value = 0
      audioDuration.value = 0
      audioProgress.value = 0
    }
  }

  const resetAudioPlayer = () => {
    audioPlaying.value = false
    audioCurrentTime.value = 0
    audioDuration.value = 0
    audioProgress.value = 0
    audioSpeed.value = 1
    audioUploading.value = false
    audioUploadProgress.value = 0
  }

  return {
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
    handleSplitEditAudioChange,
    deleteSplitEditAudio,
    resetAudioPlayer
  }
}
