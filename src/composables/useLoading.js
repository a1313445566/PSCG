import { ref } from 'vue'

export function useLoading() {
  const loading = ref(false)

  function startLoading() {
    loading.value = true
  }

  function stopLoading() {
    loading.value = false
  }

  function cleanup() {
    loading.value = false
  }

  async function withLoading(callback) {
    try {
      startLoading()
      return await callback()
    } finally {
      stopLoading()
    }
  }

  return {
    loading,
    startLoading,
    stopLoading,
    cleanup,
    withLoading
  }
}
