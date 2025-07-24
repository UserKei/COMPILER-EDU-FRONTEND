import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { usePersistence } from '@/composables/persistence'

export type AnalysisType = 'll1' | 'lr0' | 'slr1' | 'fa'

export const useAppStore = defineStore('app', () => {
  // 当前激活的分析类型
  const currentAnalysisType = ref<AnalysisType>('ll1')

  // 应用配置
  const config = ref({
    showDebugInfo: false,
    autoSave: true,
    theme: 'light',
  })

  // 历史记录（可选功能）
  const analysisHistory = ref<
    Array<{
      type: AnalysisType
      timestamp: number
      input: string
      success: boolean
    }>
  >([])

  // Actions
  const setCurrentAnalysisType = (type: AnalysisType) => {
    currentAnalysisType.value = type
  }

  const updateConfig = <K extends keyof typeof config.value>(
    key: K,
    value: (typeof config.value)[K],
  ) => {
    config.value[key] = value
  }

  const addToHistory = (type: AnalysisType, input: string, success: boolean) => {
    analysisHistory.value.unshift({
      type,
      timestamp: Date.now(),
      input,
      success,
    })

    // 限制历史记录数量
    if (analysisHistory.value.length > 100) {
      analysisHistory.value = analysisHistory.value.slice(0, 100)
    }
  }

  const clearHistory = () => {
    analysisHistory.value = []
  }

  // 配置持久化
  const persistenceConfig = {
    key: 'app_store',
    version: '1.0.0',
    include: ['currentAnalysisType', 'config', 'analysisHistory'],
    autoSave: true,
    ttl: 30 * 24 * 60 * 60 * 1000, // 30天
    saveDelay: 300,
  }

  // 应用持久化功能
  const persistence = usePersistence({
    store: {
      currentAnalysisType,
      config,
      analysisHistory,
    },
    ...persistenceConfig,
  })

  // Getters
  const getCurrentAnalysisLabel = computed(() => {
    const labels = {
      ll1: 'LL(1)语法分析',
      lr0: 'LR(0)语法分析',
      slr1: 'SLR(1)语法分析',
      fa: '有限自动机',
    }
    return labels[currentAnalysisType.value]
  })

  const getRecentHistory = computed(() => {
    return analysisHistory.value.slice(0, 10)
  })

  return {
    // 状态
    currentAnalysisType,
    config,
    analysisHistory,

    // Actions
    setCurrentAnalysisType,
    updateConfig,
    addToHistory,
    clearHistory,

    // Getters
    getCurrentAnalysisLabel,
    getRecentHistory,

    // 持久化功能
    persistence: {
      save: persistence.save,
      load: persistence.load,
      clear: persistence.clear,
      storageKey: persistence.storageKey,
    },
  }
})
