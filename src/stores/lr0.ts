import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getLR0AnalyseAPI, LR0AnalyseInpStrAPI } from '@/api'
import type { LRAnalysisResult, AnalysisStepInfo } from '@/types'
import { useCommonStore } from './common'

export const useLR0Store = defineStore('lr0', () => {
  const commonStore = useCommonStore()

  // 状态
  const productions = ref<string[]>([])
  const analysisResult = ref<LRAnalysisResult | null>(null)
  const inputString = ref('')
  const inputAnalysisResult = ref<AnalysisStepInfo | null>(null)

  // 分析过程中的数据
  const actionTable = ref<Record<string, string>>({})
  const gotoTable = ref<Record<string, string>>({})
  const dfaStates = ref<any[]>([])
  const dotItems = ref<string[]>([])
  const isLR0Grammar = ref<boolean | null>(null)

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

  // 执行LR0语法分析
  const performLR0Analysis = async () => {
    if (productions.value.length === 0) {
      commonStore.setError('请至少输入一个产生式')
      return false
    }

    try {
      commonStore.setLoading(true)
      commonStore.clearError()

      const response = await getLR0AnalyseAPI(productions.value)

      if (response.data.code === 200 && response.data.data) {
        const result = response.data.data
        analysisResult.value = result

        // 更新相关状态
        actionTable.value = result.actions || {}
        gotoTable.value = result.gotos || {}
        dfaStates.value = result.all_dfa || []
        dotItems.value = result.dot_items || []
        isLR0Grammar.value = result.isLR0 ?? null

        return true
      } else {
        commonStore.setError(response.data.message || response.data.msg || 'LR0分析失败')
        return false
      }
    } catch (err) {
      commonStore.setError(err instanceof Error ? err.message : 'LR0分析请求失败')
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

      const response = await LR0AnalyseInpStrAPI(productions.value, inputString.value.trim())

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
    actionTable.value = {}
    gotoTable.value = {}
    dfaStates.value = []
    dotItems.value = []
    isLR0Grammar.value = null
    commonStore.clearError()
  }

  return {
    // 状态
    productions,
    analysisResult,
    inputString,
    inputAnalysisResult,
    actionTable,
    gotoTable,
    dfaStates,
    dotItems,
    isLR0Grammar,

    // Actions
    setProductions,
    addProduction,
    removeProduction,
    clearProductions,
    setInputString,
    performLR0Analysis,
    analyzeInputString,
    resetAll
  }
})
