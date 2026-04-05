import { ref } from 'vue'

/**
 * 音频播放器 Composable
 *
 * 封装音频播放器的所有状态和方法，支持：
 * - 播放/暂停控制
 * - 进度条拖动
 * - 快进/快退（5秒）
 * - 倍速播放（0.5x - 2.0x）
 *
 * @example
 * ```vue
 * <script setup>
 * import { useAudioPlayer } from '@/composables/useAudioPlayer'
 *
 * const {
 *   audioPlayerRef,
 *   audioPlaying,
 *   audioProgress,
 *   audioSpeed,
 *   toggleAudioPlay,
 *   setAudioSpeed,
 *   formatAudioTime
 * } = useAudioPlayer()
 * </script>
 * ```
 */
export function useAudioPlayer() {
  const audioPlayerRef = ref(null)
  const audioPlaying = ref(false)
  const audioCurrentTime = ref(0)
  const audioDuration = ref(0)
  const audioProgress = ref(0)
  const audioSpeed = ref(1)

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

  return {
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
  }
}
