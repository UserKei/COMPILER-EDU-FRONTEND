// LL1Store 使用示例
import { useLL1Store } from '@/stores/ll1'

// 使用新的输入验证和格式化功能
export function useLL1Analysis() {
  const ll1Store = useLL1Store()

  // 方法1: 从原始文本直接分析（推荐用于用户输入）
  const analyzeFromText = async (inputText: string) => {
    try {
      const success = await ll1Store.performLL1AnalysisFromText(inputText)
      if (success) {
        console.log('LL1分析成功!')
        console.log('产生式:', ll1Store.productions)
        console.log('First集:', ll1Store.firstSets)
        console.log('Follow集:', ll1Store.followSets)
        console.log('分析表:', ll1Store.parseTable)
        console.log('是否为LL1文法:', ll1Store.isLL1Grammar)
      }
      return success
    } catch (error) {
      console.error('分析失败:', error)
      return false
    }
  }

  // 方法2: 单独验证输入（用于预检查）
  const validateInput = (inputText: string) => {
    try {
      const formattedProductions = ll1Store.validateAndFormatInput(inputText)
      console.log('输入验证通过，格式化结果:', formattedProductions)
      return { success: true, productions: formattedProductions }
    } catch (error) {
      console.error('输入验证失败:', (error as Error).message)
      return { success: false, error: (error as Error).message }
    }
  }

  // 方法3: 从已验证的产生式列表分析
  const analyzeFromProductionList = async (productions: string[]) => {
    ll1Store.setProductions(productions)
    return await ll1Store.performLL1Analysis()
  }

  // 分析输入串
  const analyzeInputString = async (inputStr: string) => {
    ll1Store.setInputString(inputStr)
    return await ll1Store.analyzeInputString()
  }

  return {
    analyzeFromText,
    validateInput,
    analyzeFromProductionList,
    analyzeInputString,
    store: ll1Store,
  }
}

// 使用示例
export const exampleUsage = async () => {
  const { analyzeFromText, validateInput, analyzeInputString } = useLL1Analysis()

  // 示例1: 完整的LL1分析流程
  const grammarInput = `
S -> A B
A -> a | ε
B -> b
`

  console.log('=== 示例1: 完整LL1分析 ===')
  const success = await analyzeFromText(grammarInput)

  if (success) {
    console.log('文法分析成功，现在分析输入串...')

    // 分析输入串
    const inputStringResult = await analyzeInputString('ab')
    if (inputStringResult) {
      console.log('输入串分析成功!')
    }
  }

  // 示例2: 只验证输入格式
  console.log('\n=== 示例2: 输入验证 ===')
  const validation1 = validateInput('S->Ab\nA->a') // 有效
  const validation2 = validateInput('S->中文') // 无效：包含中文
  const validation3 = validateInput('S->A\nS->A') // 无效：重复

  console.log('验证结果1:', validation1)
  console.log('验证结果2:', validation2)
  console.log('验证结果3:', validation3)

  // 示例3: 错误处理
  console.log('\n=== 示例3: 错误处理 ===')
  const invalidGrammar = `
S -> Sa | b  // 左递归
`
  await analyzeFromText(invalidGrammar) // 会显示错误信息
}
