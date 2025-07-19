import { ref } from 'vue'
import { getLR0AnalyseAPI, LR0AnalyseInpStrAPI } from '@/api'
import type { LRAnalysisResult, AnalysisStepInfo } from '@/types'

export function useLR0API() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const analysisResult = ref<LRAnalysisResult | null>(null)
  const stepInfo = ref<AnalysisStepInfo | null>(null)

  const analyseGrammar = async (productions: string[]) => {
    loading.value = true
    error.value = null

    try {
      const response = await getLR0AnalyseAPI(productions)
      analysisResult.value = response.data.data!
      return response.data
    } catch (err: any) {
      error.value = err.message || 'LR0语法分析失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const analyseInputString = async (productions: string[], inputStr: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await LR0AnalyseInpStrAPI(productions, inputStr)
      stepInfo.value = response.data.data!
      return response.data
    } catch (err: any) {
      error.value = err.message || 'LR0输入串分析失败'
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
