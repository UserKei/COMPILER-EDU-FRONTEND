import { computed } from 'vue'
import {
  useAppStore,
  useCommonStore,
  useLL1Store,
  useLR0Store,
  useSLR1Store,
  useFAStore,
  type AnalysisType
} from '@/stores'

/**
 * 获取当前激活的分析store的composable
 */
export const useCurrentAnalysisStore = () => {
  const appStore = useAppStore()
  const ll1Store = useLL1Store()
  const lr0Store = useLR0Store()
  const slr1Store = useSLR1Store()
  const faStore = useFAStore()

  // 根据当前分析类型返回对应的store
  const currentStore = computed(() => {
    switch (appStore.currentAnalysisType) {
      case 'll1':
        return ll1Store
      case 'lr0':
        return lr0Store
      case 'slr1':
        return slr1Store
      case 'fa':
        return faStore
      default:
        return ll1Store
    }
  })

  return {
    currentStore,
    analysisType: computed(() => appStore.currentAnalysisType),
    setAnalysisType: appStore.setCurrentAnalysisType
  }
}

/**
 * 获取所有stores的composable
 */
export const useStores = () => {
  return {
    app: useAppStore(),
    common: useCommonStore(),
    ll1: useLL1Store(),
    lr0: useLR0Store(),
    slr1: useSLR1Store(),
    fa: useFAStore()
  }
}

/**
 * 根据分析类型获取对应store的工具函数
 */
export const getStoreByType = (type: AnalysisType) => {
  switch (type) {
    case 'll1':
      return useLL1Store()
    case 'lr0':
      return useLR0Store()
    case 'slr1':
      return useSLR1Store()
    case 'fa':
      return useFAStore()
    default:
      return useLL1Store()
  }
}
