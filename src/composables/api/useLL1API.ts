import { ref } from 'vue'
import { getLL1AnalyseAPI, LL1AnalyseInpStrAPI } from '@/api'
import type { LL1AnalysisResult, AnalysisStepInfo } from '@/types'

export function useLL1API() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const analysisResult = ref<LL1AnalysisResult | null>(null)
  const stepInfo = ref<AnalysisStepInfo | null>(null)

  const analyseGrammar = async (productions: string[]) => {
    loading.value = true
    error.value = null

    try {
      const response = await getLL1AnalyseAPI(productions)
      analysisResult.value = response.data.data!
      return response.data
    } catch (err: any) {
      error.value = err.message || 'LL1语法分析失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const analyseInputString = async (productions: string[], inputStr: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await LL1AnalyseInpStrAPI(productions, inputStr)
      stepInfo.value = response.data.data!
      return response.data
    } catch (err: any) {
      error.value = err.message || 'LL1输入串分析失败'
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
