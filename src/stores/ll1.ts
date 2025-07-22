import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getLL1AnalyseAPI, LL1AnalyseInpStrAPI } from '@/api'
import type { LL1AnalysisResult, AnalysisStepInfo } from '@/types'
import { useCommonStore } from './common'

export const useLL1Store = defineStore('ll1', () => {
  const commonStore = useCommonStore()

  // 状态
  const productions = ref<string[]>([])
  const analysisResult = ref<LL1AnalysisResult | null>(null)
  const inputString = ref('')
  const inputAnalysisResult = ref<AnalysisStepInfo | null>(null)

  // 分析过程中的数据
  const parseTable = ref<Record<string, string>>({})
  const firstSets = ref<Record<string, string[]>>({})
  const followSets = ref<Record<string, string[]>>({})
  const isLL1Grammar = ref<boolean | null>(null)

  // Actions
  const setProductions = (newProductions: string[]) => {
    productions.value = [...newProductions]
  }

  const addProduction = (production: string) => {
    if (production.trim() && !productions.value.includes(production.trim())) {
      productions.value.push(production.trim())
    }
  }

  const removeProduction = (index: number) => {
    if (index >= 0 && index < productions.value.length) {
      productions.value.splice(index, 1)
    }
  }

  const clearProductions = () => {
    productions.value = []
    analysisResult.value = null
    inputAnalysisResult.value = null
  }

  const setInputString = (str: string) => {
    inputString.value = str
    inputAnalysisResult.value = null
  }

  // 执行LL1语法分析
  const performLL1Analysis = async () => {
    if (productions.value.length === 0) {
      commonStore.setError('请至少输入一个产生式')
      return false
    }

    try {
      commonStore.setLoading(true)
      commonStore.clearError()

      const response = await getLL1AnalyseAPI(productions.value)

      if (response.data.code === 200 && response.data.data) {
        const result = response.data.data
        analysisResult.value = result

        // 更新相关状态
        parseTable.value = result.table || {}
        firstSets.value = result.first || {}
        followSets.value = result.follow || {}
        isLL1Grammar.value = result.isLL1

        return true
      } else {
        commonStore.setError(response.data.message || response.data.msg || 'LL1分析失败')
        return false
      }
    } catch (err) {
      commonStore.setError(err instanceof Error ? err.message : 'LL1分析请求失败')
      return false
    } finally {
      commonStore.setLoading(false)
    }
  }

  // 分析输入串
  const analyzeInputString = async () => {
    if (!inputString.value.trim()) {
      commonStore.setError('请输入要分析的字符串')
      return false
    }

    if (productions.value.length === 0) {
      commonStore.setError('请先设置产生式')
      return false
    }

    try {
      commonStore.setLoading(true)
      commonStore.clearError()

      const response = await LL1AnalyseInpStrAPI(productions.value, inputString.value.trim())

      if (response.data.code === 200 && response.data.data) {
        inputAnalysisResult.value = response.data.data
        return true
      } else {
        commonStore.setError(response.data.message || response.data.msg || '输入串分析失败')
        return false
      }
    } catch (err) {
      commonStore.setError(err instanceof Error ? err.message : '输入串分析请求失败')
      return false
    } finally {
      commonStore.setLoading(false)
    }
  }

  // 重置所有状态
  const resetAll = () => {
    productions.value = []
    analysisResult.value = null
    inputString.value = ''
    inputAnalysisResult.value = null
    parseTable.value = {}
    firstSets.value = {}
    followSets.value = {}
    isLL1Grammar.value = null
    commonStore.clearError()
  }

  return {
    // 状态
    productions,
    analysisResult,
    inputString,
    inputAnalysisResult,
    parseTable,
    firstSets,
    followSets,
    isLL1Grammar,

    // Actions
    setProductions,
    addProduction,
    removeProduction,
    clearProductions,
    setInputString,
    performLL1Analysis,
    analyzeInputString,
    resetAll
  }
})
