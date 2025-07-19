import { ref } from 'vue'
import { getDFAM } from '@/api'
import type { FAResult } from '@/types'

export function useFAAPI() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const result = ref<FAResult | null>(null)

  const analyseRegex = async (regex: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await getDFAM(regex)
      result.value = response.data.data!
      return response.data
    } catch (err: any) {
      error.value = err.message || '正则表达式分析失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    result,
    analyseRegex
  }
}
