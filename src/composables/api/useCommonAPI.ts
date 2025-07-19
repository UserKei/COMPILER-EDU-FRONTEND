import { ref } from 'vue'
import { testAPI } from '@/api'

export function useCommonAPI() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const test = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await testAPI()
      return response.data
    } catch (err: any) {
      error.value = err.message || '测试连接失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    test
  }
}
