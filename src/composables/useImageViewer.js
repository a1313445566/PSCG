import { ref } from 'vue'

/**
 * 图片预览器 Composable
 *
 * 封装图片预览的所有状态和方法，支持：
 * - 点击图片打开预览
 * - 收集题目中的所有图片
 * - 支持左右切换浏览
 *
 * @example
 * ```vue
 * <script setup>
 * import { useImageViewer } from '@/composables/useImageViewer'
 *
 * const {
 *   showImageViewer,
 *   previewImages,
 *   previewIndex,
 *   handleImageClick,
 *   closeImageViewer
 * } = useImageViewer()
 * </script>
 * ```
 */
export function useImageViewer() {
  const showImageViewer = ref(false)
  const previewImages = ref([])
  const previewIndex = ref(0)

  const handleImageClick = (e, containerSelector) => {
    const target = e.target
    if (target.tagName !== 'IMG') return

    e.preventDefault()
    e.stopPropagation()

    const questionCard = target.closest(containerSelector || '.question-card')
    if (!questionCard) return

    const images = questionCard.querySelectorAll('.question-text img, .option-text img')

    const imageList = Array.from(images)
      .map(img => {
        let src = img.getAttribute('src') || img.src
        if (src.startsWith('/')) {
          src = window.location.origin + src
        }
        return src
      })
      .filter(src => src && !src.startsWith('data:'))

    if (imageList.length === 0) {
      imageList.push(target.src)
    }

    const clickedSrc = target.getAttribute('src') || target.src
    const clickedIndex = imageList.findIndex(src => {
      const normalizedSrc = src.replace(window.location.origin, '')
      const normalizedClicked = clickedSrc.replace(window.location.origin, '')
      return normalizedSrc === normalizedClicked || src === clickedSrc
    })

    previewImages.value = imageList
    previewIndex.value = clickedIndex >= 0 ? clickedIndex : 0
    showImageViewer.value = true
  }

  const closeImageViewer = () => {
    showImageViewer.value = false
    previewImages.value = []
    previewIndex.value = 0
  }

  return {
    showImageViewer,
    previewImages,
    previewIndex,
    handleImageClick,
    closeImageViewer
  }
}
