import { ref } from 'vue'
import { getSLR1AnalyseAPI, SLR1AnalyseInpStrAPI } from '@/api'
import type { LRAnalysisResult, AnalysisStepInfo } from '@/types'

export function useSLR1API() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const analysisResult = ref<LRAnalysisResult | null>(null)
  const stepInfo = ref<AnalysisStepInfo | null>(null)

  const analyseGrammar = async (productions: string[]) => {
    loading.value = true
    error.value = null

    try {
      const response = await getSLR1AnalyseAPI(productions)
      analysisResult.value = response.data.data!
      return response.data
    } catch (err: any) {
      error.value = err.message || 'SLR1语法分析失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const analyseInputString = async (productions: string[], inputStr: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await SLR1AnalyseInpStrAPI(productions, inputStr)
      stepInfo.value = response.data.data!
      return response.data
    } catch (err: any) {
      error.value = err.message || 'SLR1输入串分析失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    analysisResult,
    stepInfo,
    analyseGrammar,
    analyseInputString
  }
}
