import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getLL1AnalyseAPI, LL1AnalyseInpStrAPI } from '@/api'
import type { LL1AnalysisResult, AnalysisStepInfo } from '@/types'
import { useCommonStore } from './common'

// 校验数据项的通用接口
interface ValidationItem {
  id: string
  category: 'blank' | 'onlyRead' | 'writed'
  state: 'normal' | 'waitWriteIn' | 'isCorrect' | 'isError'
  check: 'normal' | 'isCorrect' | 'isError'
  text: string
  coords?: string[]
  symbol?: string
}

// LL1校验数据结构（前端处理后的格式）
interface DataLL1Type {
  S: string
  Vn: ValidationItem[]
  Vt: ValidationItem[]
  first: ValidationItem[]
  follow: ValidationItem[]
  formulas_dict: ValidationItem[]
  table: ValidationItem[]
}

export const useLL1Store = defineStore('ll1', () => {
  const commonStore = useCommonStore()

  // 状态
  const productions = ref<string[]>([])
  const originalData = ref<LL1AnalysisResult | null>(null) // 后端原始数据
  const validationData = ref<DataLL1Type | null>(null) // 前端校验数据
  const inputString = ref('')
  const inputAnalysisResult = ref<AnalysisStepInfo | null>(null)

  // 计算属性 - 从原始数据提取
  const parseTable = computed(() => originalData.value?.table || {})
  const firstSets = computed(() => originalData.value?.first || {})
  const followSets = computed(() => originalData.value?.follow || {})
  const isLL1Grammar = computed(() => originalData.value?.isLL1 ?? null)

  // 数据转换方法 - 将后端原始数据转换为校验数据
  const transformToValidationData = (rawData: LL1AnalysisResult): DataLL1Type => {
    const data: DataLL1Type = {
      S: rawData.S,
      Vn: [],
      Vt: [],
      first: [],
      follow: [],
      formulas_dict: [],
      table: []
    }

    // 转换Vn数据
    data.Vn = rawData.Vn.map((item: string, index: number) => ({
      id: 'Vn' + index,
      category: 'onlyRead' as const,
      state: 'normal' as const,
      check: 'normal' as const,
      text: item
    }))

    // 转换Vt数据
    data.Vt = rawData.Vt.map((item: string, index: number) => ({
      id: 'Vt' + index,
      category: 'onlyRead' as const,
      state: 'normal' as const,
      check: 'normal' as const,
      text: item
    }))

    // 转换First集合数据
    for (const [symbol, firstSet] of Object.entries(rawData.first)) {
      firstSet.forEach((item: string, index: number) => {
        data.first.push({
          id: 'first' + index + symbol,
          category: 'onlyRead' as const,
          state: 'normal' as const,
          check: 'normal' as const,
          symbol: symbol,
          text: item
        })
      })
    }

    // 转换Follow集合数据
    for (const [symbol, followSet] of Object.entries(rawData.follow)) {
      followSet.forEach((item: string, index: number) => {
        data.follow.push({
          id: 'follow' + index + symbol,
          category: 'onlyRead' as const,
          state: 'normal' as const,
          check: 'normal' as const,
          symbol: symbol,
          text: item
        })
      })
    }

    // 转换产生式数据
    for (const [left, rights] of Object.entries(rawData.formulas_dict)) {
      rights.forEach((right: string, index: number) => {
        data.formulas_dict.push({
          id: 'formula' + index + left,
          category: 'onlyRead' as const,
          state: 'normal' as const,
          check: 'normal' as const,
          symbol: left,
          text: `${left} -> ${right}`
        })
      })
    }

    // 转换LL1分析表数据
    for (const [key, value] of Object.entries(rawData.table)) {
      data.table.push({
        id: 'table' + key,
        category: 'onlyRead' as const,
        state: 'normal' as const,
        check: 'normal' as const,
        coords: key.split('|'), // "A|a" -> ["A", "a"]
        text: value
      })
    }

    return data
  }

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
    originalData.value = null
    validationData.value = null
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
        const rawData = response.data.data
        originalData.value = rawData

        // 转换为校验数据
        validationData.value = transformToValidationData(rawData)

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
    originalData.value = null
    validationData.value = null
    inputString.value = ''
    inputAnalysisResult.value = null
    commonStore.clearError()
  }

  return {
    // 状态
    productions,
    originalData,
    validationData,
    inputString,
    inputAnalysisResult,

    // 计算属性
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
    resetAll,

    // 工具方法
    transformToValidationData
  }
})
