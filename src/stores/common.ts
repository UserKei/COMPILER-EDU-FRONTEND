import { ref } from 'vue'
import { defineStore } from 'pinia'
import { testAPI } from '@/api'

export const useCommonStore = defineStore('common', () => {
  // 状态
  const loading = ref(false)
  const error = ref<string | null>(null)
  const apiConnected = ref<boolean | null>(null)

  // Actions
  const setLoading = (state: boolean) => {
    loading.value = state
  }

  const setError = (message: string | null) => {
    error.value = message
  }

  const clearError = () => {
    error.value = null
  }

  // API测试连接
  const testConnection = async () => {
    try {
      setLoading(true)
      clearError()

      const response = await testAPI()

      if (response.data.code === 200) {
        apiConnected.value = true
        return true
      } else {
        apiConnected.value = false
        setError(response.data.message || '连接测试失败')
        return false
      }
    } catch (err) {
      apiConnected.value = false
      setError(err instanceof Error ? err.message : '网络连接失败')
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    // 状态
    loading,
    error,
    apiConnected,

    // Actions
    setLoading,
    setError,
    clearError,
    testConnection
  }
})
