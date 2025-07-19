// API使用示例组件
// 这个文件展示了如何在Vue组件中使用我们创建的API模块

// 1. 基础使用方式
import { useLL1API } from '@/composables/api'

// 在组件中使用
export function useLL1Example() {
  const ll1API = useLL1API()

  const testLL1Analysis = async () => {
    const productions = [
      'E -> E + T | T',
      'T -> T * F | F',
      'F -> ( E ) | id'
    ]

    try {
      await ll1API.analyseGrammar(productions)
      console.log('LL1分析结果:', ll1API.analysisResult.value)
    } catch {
      console.error('LL1分析失败:', ll1API.error.value)
    }
  }

  return {
    ll1API,
    testLL1Analysis
  }
}

// 2. 直接调用API方式
import { getLL1AnalyseAPI } from '@/api'

export async function directLL1Call() {
  try {
    const response = await getLL1AnalyseAPI(['E -> T', 'T -> id'])
    return response.data
  } catch (error) {
    console.error('API调用失败:', error)
    throw error
  }
}

// 3. 在页面组件中的完整示例
/*
<template>
  <div>
    <button @click="runAnalysis" :disabled="loading">
      {{ loading ? '分析中...' : '开始LL1分析' }}
    </button>

    <div v-if="error" class="error">
      错误: {{ error }}
    </div>

    <div v-if="result" class="result">
      <h3>分析结果</h3>
      <p>是否为LL1文法: {{ result.isLL1 ? '是' : '否' }}</p>
      <p>终结符: {{ result.Vt.join(', ') }}</p>
      <p>非终结符: {{ result.Vn.join(', ') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLL1API } from '@/composables/api'

const { loading, error, analysisResult, analyseGrammar } = useLL1API()

const runAnalysis = async () => {
  const productions = [
    'E -> E + T | T',
    'T -> T * F | F',
    'F -> ( E ) | id'
  ]

  await analyseGrammar(productions)
}

// 响应式结果
const result = computed(() => analysisResult.value)
</script>
*/

// 4. LR0/SLR1 API使用示例
import { useLR0API, useSLR1API } from '@/composables/api'

export function useLRExample() {
  const lr0API = useLR0API()
  const slr1API = useSLR1API()

  const testLR0Analysis = async () => {
    const productions = [
      'S -> A A',
      'A -> a A | b'
    ]

    try {
      await lr0API.analyseGrammar(productions)
      console.log('LR0分析结果:', lr0API.analysisResult.value)
      console.log('是否为LR0:', lr0API.analysisResult.value?.isLR0)
    } catch {
      console.error('LR0分析失败:', lr0API.error.value)
    }
  }

  const testSLR1Analysis = async () => {
    const productions = [
      'S -> A A',
      'A -> a A | b'
    ]

    try {
      await slr1API.analyseGrammar(productions)
      console.log('SLR1分析结果:', slr1API.analysisResult.value)
      console.log('是否为SLR1:', slr1API.analysisResult.value?.isSLR1)
    } catch {
      console.error('SLR1分析失败:', slr1API.error.value)
    }
  }

  return {
    lr0API,
    slr1API,
    testLR0Analysis,
    testSLR1Analysis
  }
}

// 5. 有限自动机API使用示例
import { useFAAPI } from '@/composables/api'

export function useFAExample() {
  const faAPI = useFAAPI()

  const testRegexAnalysis = async () => {
    const regex = '(a|b)*abb'

    try {
      await faAPI.analyseRegex(regex)
      console.log('正则表达式分析结果:', faAPI.result.value)
      console.log('NFA dot字符串:', faAPI.result.value?.NFA_dot_str)
      console.log('DFA dot字符串:', faAPI.result.value?.DFA_dot_str)
      console.log('最小化DFA dot字符串:', faAPI.result.value?.Min_DFA_dot_str)
    } catch {
      console.error('正则表达式分析失败:', faAPI.error.value)
    }
  }

  return {
    faAPI,
    testRegexAnalysis
  }
}

// 6. 输入串分析示例
export function useInputStringAnalysis() {
  const ll1API = useLL1API()
  const lr0API = useLR0API()

  const analyseLL1InputString = async () => {
    const productions = ['E -> T', 'T -> id']
    const inputString = 'id'

    try {
      await ll1API.analyseInputString(productions, inputString)
      console.log('LL1输入串分析步骤:', ll1API.stepInfo.value)
    } catch {
      console.error('LL1输入串分析失败:', ll1API.error.value)
    }
  }

  const analyseLR0InputString = async () => {
    const productions = ['S -> A', 'A -> a']
    const inputString = 'a'

    try {
      await lr0API.analyseInputString(productions, inputString)
      console.log('LR0输入串分析步骤:', lr0API.stepInfo.value)
    } catch {
      console.error('LR0输入串分析失败:', lr0API.error.value)
    }
  }

  return {
    analyseLL1InputString,
    analyseLR0InputString
  }
}

// 7. 连接测试示例
import { useCommonAPI } from '@/composables/api'

export function useConnectionTest() {
  const commonAPI = useCommonAPI()

  const testConnection = async () => {
    try {
      const result = await commonAPI.test()
      console.log('连接测试成功:', result)
      return true
    } catch {
      console.error('连接测试失败:', commonAPI.error.value)
      return false
    }
  }

  return {
    commonAPI,
    testConnection
  }
}
