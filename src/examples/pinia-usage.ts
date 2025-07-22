/**
 * Pinia Stores使用示例
 *
 * 这个文件展示了如何在组件中使用我们创建的Pinia stores
 */

import {
  useAppStore,
  useCommonStore,
  useLL1Store,
  useLR0Store,
  useSLR1Store
} from '@/stores'
import { useStores, useCurrentAnalysisStore } from '@/composables/stores'

/**
 * 示例1: 基本用法 - 在组件中使用单个store
 */
export const basicUsageExample = () => {
  // 获取store实例
  const ll1Store = useLL1Store()

  // 使用状态
  console.log('当前产生式:', ll1Store.productions)
  console.log('分析结果:', ll1Store.originalData)

  // 调用actions
  ll1Store.setProductions(['S -> AB', 'A -> a', 'B -> b'])
  ll1Store.performLL1Analysis()
}

/**
 * 示例2: LR0分析示例
 */
export const lr0AnalysisExample = async () => {
  const lr0Store = useLR0Store()
  const appStore = useAppStore()

  try {
    // 设置产生式
    lr0Store.setProductions([
      'E -> E+T',
      'E -> T',
      'T -> T*F',
      'T -> F',
      'F -> (E)',
      'F -> id'
    ])

    // 执行LR0分析
    const success = await lr0Store.performLR0Analysis()

    if (success) {
      console.log('LR0分析成功!')
      console.log('Action表:', lr0Store.actionTable)
      console.log('Goto表:', lr0Store.gotoTable)
      console.log('DFA状态:', lr0Store.dfaStates)
      console.log('是否为LR0文法:', lr0Store.isLR0Grammar)
      console.log('校验数据:', lr0Store.validationData)

      // 获取特定类别的校验数据
      const actionItems = lr0Store.getValidationDataByCategory('action')
      console.log('Action项校验数据:', actionItems)

      // 添加到历史记录
      appStore.addToHistory('lr0', 'E -> E+T | T...', true)
    }
  } catch (error) {
    console.error('LR0分析出错:', error)
  }
}

/**
 * 示例3: SLR1分析示例
 */
export const slr1AnalysisExample = async () => {
  const slr1Store = useSLR1Store()
  const appStore = useAppStore()

  try {
    // 设置产生式
    slr1Store.setProductions([
      'S -> L=R',
      'S -> R',
      'L -> *R',
      'L -> id',
      'R -> L'
    ])

    // 执行SLR1分析
    const success = await slr1Store.performSLR1Analysis()

    if (success) {
      console.log('SLR1分析成功!')
      console.log('Action表:', slr1Store.actionTable)
      console.log('Goto表:', slr1Store.gotoTable)
      console.log('是否为SLR1文法:', slr1Store.isSLR1Grammar)
      console.log('DOT字符串:', slr1Store.dotString)

      // 分析输入串
      slr1Store.setInputString('id=*id')
      const inputSuccess = await slr1Store.analyzeInputString()

      if (inputSuccess) {
        console.log('输入串分析成功!')
        console.log('分析步骤:', slr1Store.inputAnalysisResult)

        // 添加到历史记录
        appStore.addToHistory('slr1', 'id=*id', true)
      }
    }
  } catch (error) {
    console.error('SLR1分析出错:', error)
  }
}

/**
 * 示例4: 使用composables简化store操作
 */
export const composableExample = () => {
  // 获取所有stores
  const stores = useStores()

  // 使用当前激活的分析store
  const { currentStore, analysisType, setAnalysisType } = useCurrentAnalysisStore()

  console.log('当前分析类型:', analysisType.value)

  // 切换到SLR1分析
  setAnalysisType('slr1')

  // 现在currentStore.value会自动指向SLR1 store
  console.log('当前store:', currentStore.value)
  console.log('所有stores:', stores)
}

/**
 * 示例5: 校验数据操作示例
 */
export const validationDataExample = () => {
  const lr0Store = useLR0Store()

  // 设置一些产生式并分析
  lr0Store.setProductions(['S -> AB', 'A -> a', 'B -> b'])
  lr0Store.performLR0Analysis().then((success) => {
    if (success) {
      // 获取所有校验数据
      console.log('所有校验数据:', lr0Store.validationData)

      // 按类别获取校验数据
      const actionData = lr0Store.getValidationDataByCategory('action')
      const gotoData = lr0Store.getValidationDataByCategory('goto')
      const dfaData = lr0Store.getValidationDataByCategory('dfa')

      console.log('Action数据:', actionData)
      console.log('Goto数据:', gotoData)
      console.log('DFA数据:', dfaData)

      // 更新校验项状态
      if (actionData.length > 0) {
        lr0Store.updateValidationItem(actionData[0].id, false)
        console.log('更新后的校验数据:', lr0Store.validationData)
      }
    }
  })
}

/**
 * 示例6: 响应式数据监听
 */
export const reactiveExample = () => {
  const ll1Store = useLL1Store()
  const commonStore = useCommonStore()

  // 在Vue组件中，这些响应式数据会自动更新UI
  return {
    // 基本状态
    productions: ll1Store.productions,
    analysisResult: ll1Store.originalData,

    // 加载和错误状态
    loading: commonStore.loading,
    error: commonStore.error,

    // 计算属性
    hasProductions: ll1Store.productions.length > 0,
    hasAnalysisResult: ll1Store.originalData !== null,
    canAnalyzeInput: ll1Store.originalData !== null && ll1Store.inputString.trim().length > 0
  }
}
