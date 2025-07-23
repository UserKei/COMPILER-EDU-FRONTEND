import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getSLR1AnalyseAPI, SLR1AnalyseInpStrAPI } from '@/api'
import type { LRAnalysisResult, AnalysisStepInfo } from '@/types'
import { useCommonStore } from './common'

// SLR1校验数据项接口 (与LR0共享类似结构但独立管理)
interface SLR1ValidationItem {
  id: string
  category: 'action' | 'goto' | 'dfa' | 'item'
  state: string
  check: boolean
  coords?: { x: number; y: number }
  data: any
}

export const useSLR1Store = defineStore('slr1', () => {
  const commonStore = useCommonStore()

  // 基本状态
  const productions = ref<string[]>([])
  const analysisResult = ref<LRAnalysisResult | null>(null)
  const inputString = ref('')
  const inputAnalysisResult = ref<AnalysisStepInfo | null>(null)

  // 校验数据 - 用于前端显示和交互
  const validationData = ref<SLR1ValidationItem[]>([])
  const actionTable = ref<Record<string, string>>({})
  const gotoTable = ref<Record<string, string>>({})
  const dfaStates = ref<any[]>([])
  const dotItems = ref<string[]>([])
  const isSLR1Grammar = ref<boolean | null>(null)

  // DOT字符串用于图形显示
  const dotString = ref('')

  // Actions
  const setProductions = (newProductions: string[]) => {
    productions.value = [...newProductions]
    // 清除之前的分析结果
    clearAnalysisResults()
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
    clearAnalysisResults()
  }

  const setInputString = (str: string) => {
    inputString.value = str
    inputAnalysisResult.value = null
  }

  const clearAnalysisResults = () => {
    analysisResult.value = null
    inputAnalysisResult.value = null
    validationData.value = []
    actionTable.value = {}
    gotoTable.value = {}
    dfaStates.value = []
    dotItems.value = []
    isSLR1Grammar.value = null
    dotString.value = ''
  }

  // 将后端数据转换为校验数据
  const transformToValidationData = (result: LRAnalysisResult): SLR1ValidationItem[] => {
    const items: SLR1ValidationItem[] = []
    let itemId = 0

    // 转换Action表项
    Object.entries(result.actions || {}).forEach(([key, value]) => {
      items.push({
        id: `action_${itemId++}`,
        category: 'action',
        state: key,
        check: !value.includes('conflict') && !value.includes('error'),
        data: { key, value, type: 'action' }
      })
    })

    // 转换Goto表项
    Object.entries(result.gotos || {}).forEach(([key, value]) => {
      items.push({
        id: `goto_${itemId++}`,
        category: 'goto',
        state: key,
        check: !!value,
        data: { key, value, type: 'goto' }
      })
    })

    // 转换DFA状态
    result.all_dfa?.forEach((dfa, index) => {
      items.push({
        id: `dfa_${index}`,
        category: 'dfa',
        state: `I${index}`,
        check: true,
        coords: { x: index * 100, y: index * 80 },
        data: dfa
      })
    })

    // 转换项目集
    result.dot_items?.forEach((item, index) => {
      items.push({
        id: `item_${index}`,
        category: 'item',
        state: item,
        check: true,
        data: { item, index }
      })
    })

    return items
  }

  // 执行SLR1语法分析
  const performSLR1Analysis = async () => {
    if (productions.value.length === 0) {
      commonStore.setError('请至少输入一个产生式')
      return false
    }

    try {
      commonStore.setLoading(true)
      commonStore.clearError()

      const response = await getSLR1AnalyseAPI(productions.value)

      if (response.data.code === 200 && response.data.data) {
        const result = response.data.data
        analysisResult.value = result

        // 更新相关状态
        actionTable.value = result.actions || {}
        gotoTable.value = result.gotos || {}
        dfaStates.value = result.all_dfa || []
        dotItems.value = result.dot_items || []
        isSLR1Grammar.value = result.isSLR1 ?? null
        dotString.value = result.SLR1_dot_str || ''

        // 转换为校验数据
        validationData.value = transformToValidationData(result)

        return true
      } else {
        commonStore.setError(response.data.message || response.data.msg || 'SLR1分析失败')
        return false
      }
    } catch (err) {
      commonStore.setError(err instanceof Error ? err.message : 'SLR1分析请求失败')
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

      const response = await SLR1AnalyseInpStrAPI(productions.value, inputString.value.trim())

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

  // 更新校验项状态
  const updateValidationItem = (id: string, check: boolean) => {
    const item = validationData.value.find(item => item.id === id)
    if (item) {
      item.check = check
    }
  }

  // 获取指定类别的校验数据
  const getValidationDataByCategory = (category: SLR1ValidationItem['category']) => {
    return validationData.value.filter(item => item.category === category)
  }

  // 重置所有状态
  const resetAll = () => {
    productions.value = []
    inputString.value = ''
    clearAnalysisResults()
    commonStore.clearError()
  }

  return {
    // 状态
    productions,
    analysisResult,
    inputString,
    inputAnalysisResult,
    validationData,
    actionTable,
    gotoTable,
    dfaStates,
    dotItems,
    isSLR1Grammar,
    dotString,

    // Actions
    setProductions,
    addProduction,
    removeProduction,
    clearProductions,
    setInputString,
    performSLR1Analysis,
    analyzeInputString,
    updateValidationItem,
    getValidationDataByCategory,
    resetAll
  }
})
