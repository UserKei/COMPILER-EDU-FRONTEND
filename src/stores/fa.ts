import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getDFAM } from '@/api'
import type { FAResult } from '@/types'
import { useCommonStore } from './common'

// 校验数据项的通用接口
interface ValidationItem {
  id: string
  category: 'blank' | 'onlyRead' | 'writed'
  state: 'normal' | 'waitWriteIn' | 'isCorrect' | 'isError'
  check: 'normal' | 'isCorrect' | 'isError'
  text: string
  coords?: string[]
}

// FA校验数据结构（前端处理后的格式）
interface DataFAType {
  table: ValidationItem[] // NFA->DFA转换表
  table_to_num: ValidationItem[] // DFA状态转换表
  table_to_num_min: ValidationItem[] // 最小化DFA状态转换表
  p_list: ValidationItem[] // 最小化结果集合
}

export const useFAStore = defineStore('fa', () => {
  const commonStore = useCommonStore()

  // 状态
  const inputRegex = ref('')
  const originalData = ref<FAResult | null>(null) // 后端原始数据
  const validationData = ref<DataFAType | null>(null) // 前端校验数据

  // 计算属性 - 从原始数据提取
  const nfaTable = computed(() => originalData.value?.table || null)
  const dfaTable = computed(() => originalData.value?.table_to_num || null)
  const minDfaTable = computed(() => originalData.value?.table_to_num_min || null)
  const nfaDotString = computed(() => originalData.value?.NFA_dot_str || '')
  const dfaDotString = computed(() => originalData.value?.DFA_dot_str || '')
  const minDfaDotString = computed(() => originalData.value?.Min_DFA_dot_str || '')
  const partitions = computed(() => originalData.value?.P || null)
  const partitionChanges = computed(() => originalData.value?.P_change || null)

  // 数据转换方法 - 将后端原始数据转换为校验数据
  const transformToValidationData = (rawData: FAResult): DataFAType => {
    const data: DataFAType = {
      table: [],
      table_to_num: [],
      table_to_num_min: [],
      p_list: []
    }

    // 转换NFA->DFA转换表数据
    if (rawData.table) {
      for (const [key, transitions] of Object.entries(rawData.table)) {
        if (Array.isArray(transitions)) {
          transitions.forEach((transition: any, index: number) => {
            data.table.push({
              id: 'table' + index + key,
              category: 'blank' as const,
              state: 'normal' as const,
              check: 'normal' as const,
              coords: [index.toString(), key],
              text: Array.isArray(transition) ? transition.join('') : String(transition)
            })
          })
        }
      }
    }

    // 转换DFA状态转换表数据
    if (rawData.table_to_num) {
      for (const [key, transitions] of Object.entries(rawData.table_to_num)) {
        if (Array.isArray(transitions)) {
          transitions.forEach((transition: any, index: number) => {
            data.table_to_num.push({
              id: 'table_to_num' + index + key,
              category: 'blank' as const,
              state: 'normal' as const,
              check: 'normal' as const,
              coords: [index.toString(), key],
              text: String(transition)
            })
          })
        }
      }
    }

    // 转换最小化DFA状态转换表数据
    if (rawData.table_to_num_min) {
      for (const [key, transitions] of Object.entries(rawData.table_to_num_min)) {
        if (Array.isArray(transitions)) {
          transitions.forEach((transition: any, index: number) => {
            data.table_to_num_min.push({
              id: 'table_to_num_min' + index + key,
              category: 'blank' as const,
              state: 'normal' as const,
              check: 'normal' as const,
              coords: [index.toString(), key],
              text: String(transition)
            })
          })
        }
      }
    }

    // 转换最小化结果集合数据
    if (rawData.P) {
      rawData.P.forEach((partition: string[], index: number) => {
        data.p_list.push({
          id: 'p_list' + index,
          category: 'onlyRead' as const,
          state: 'normal' as const,
          check: 'normal' as const,
          text: '{' + partition.join(', ') + '}'
        })
      })
    }

    return data
  }

  // Actions
  const setInputRegex = (regex: string) => {
    inputRegex.value = regex
    // 清除之前的分析结果
    originalData.value = null
    validationData.value = null
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

      if (response.data.code === 0 && response.data.data) {
        const rawData = response.data.data
        originalData.value = rawData

        // 转换为校验数据
        validationData.value = transformToValidationData(rawData)

        return true
      } else {
        commonStore.setError(response.data.msg || '正则表达式分析失败')
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
    originalData.value = null
    validationData.value = null
  }

  // 重置所有状态
  const resetAll = () => {
    inputRegex.value = ''
    clearAnalysis()
    commonStore.clearError()
  }

  // 检查是否有分析结果
  const hasResult = () => {
    return originalData.value !== null
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

  // 获取指定类型的校验数据
  const getValidationTable = (type: 'table' | 'table_to_num' | 'table_to_num_min' | 'p_list') => {
    if (!validationData.value) return []
    return validationData.value[type]
  }

  return {
    // 状态
    inputRegex,
    originalData,
    validationData,

    // 计算属性
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
    getTable,
    getValidationTable,
    transformToValidationData
  }
})
