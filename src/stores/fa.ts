import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getDFAM } from '@/api'
import type { FAResult } from '@/types'
import { useCommonStore } from './common'

export const useFAStore = defineStore('fa', () => {
  const commonStore = useCommonStore()

  // 状态
  const inputRegex = ref('')
  const analysisResult = ref<FAResult | null>(null)

  // 分析过程中的数据
  const nfaTable = ref<any>(null)
  const dfaTable = ref<any>(null)
  const minDfaTable = ref<any>(null)
  const nfaDotString = ref('')
  const dfaDotString = ref('')
  const minDfaDotString = ref('')
  const partitions = ref<any>(null)
  const partitionChanges = ref<any>(null)

  // Actions
  const setInputRegex = (regex: string) => {
    inputRegex.value = regex
    // 清除之前的分析结果
    analysisResult.value = null
  }

  // 执行正则表达式转DFAM分析
  const performFAAnalysis = async () => {
    if (!inputRegex.value.trim()) {
      commonStore.setError('请输入正则表达式')
      return false
    }

    try {
      commonStore.setLoading(true)
      commonStore.clearError()

      const response = await getDFAM(inputRegex.value.trim())

      if (response.data.code === 200 && response.data.data) {
        const result = response.data.data
        analysisResult.value = result

        // 更新相关状态
        nfaTable.value = result.table || null
        dfaTable.value = result.table_to_num || null
        minDfaTable.value = result.table_to_num_min || null
        nfaDotString.value = result.NFA_dot_str || ''
        dfaDotString.value = result.DFA_dot_str || ''
        minDfaDotString.value = result.Min_DFA_dot_str || ''
        partitions.value = result.P || null
        partitionChanges.value = result.P_change || null

        return true
      } else {
        commonStore.setError(response.data.message || response.data.msg || '正则表达式分析失败')
        return false
      }
    } catch (err) {
      commonStore.setError(err instanceof Error ? err.message : '正则表达式分析请求失败')
      return false
    } finally {
      commonStore.setLoading(false)
    }
  }

  // 清除当前分析
  const clearAnalysis = () => {
    analysisResult.value = null
    nfaTable.value = null
    dfaTable.value = null
    minDfaTable.value = null
    nfaDotString.value = ''
    dfaDotString.value = ''
    minDfaDotString.value = ''
    partitions.value = null
    partitionChanges.value = null
  }

  // 重置所有状态
  const resetAll = () => {
    inputRegex.value = ''
    clearAnalysis()
    commonStore.clearError()
  }

  // 检查是否有分析结果
  const hasResult = () => {
    return analysisResult.value !== null
  }

  // 获取指定类型的dot字符串
  const getDotString = (type: 'nfa' | 'dfa' | 'min-dfa') => {
    switch (type) {
      case 'nfa':
        return nfaDotString.value
      case 'dfa':
        return dfaDotString.value
      case 'min-dfa':
        return minDfaDotString.value
      default:
        return ''
    }
  }

  // 获取指定类型的状态转换表
  const getTable = (type: 'nfa' | 'dfa' | 'min-dfa') => {
    switch (type) {
      case 'nfa':
        return nfaTable.value
      case 'dfa':
        return dfaTable.value
      case 'min-dfa':
        return minDfaTable.value
      default:
        return null
    }
  }

  return {
    // 状态
    inputRegex,
    analysisResult,
    nfaTable,
    dfaTable,
    minDfaTable,
    nfaDotString,
    dfaDotString,
    minDfaDotString,
    partitions,
    partitionChanges,

    // Actions
    setInputRegex,
    performFAAnalysis,
    clearAnalysis,
    resetAll,

    // 辅助方法
    hasResult,
    getDotString,
    getTable
  }
})
