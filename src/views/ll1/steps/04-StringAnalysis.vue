<template>
  <div class="string-analysis-step">
    <div class="step-header">
      <div class="flex items-center gap-4">
        <div class="step-icon">
          <Icon icon="lucide:play-circle" class="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">字符串分析</h2>
          <p class="text-gray-600 mt-1">第四步：使用LL1分析表分析输入字符串</p>
        </div>
      </div>
    </div>

    <div class="step-content">
      <div class="max-w-6xl mx-auto">
        <!-- 输入字符串区域 -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">输入待分析字符串</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                字符串输入
              </label>
              <div class="flex gap-4">
                <input
                  v-model="inputString"
                  type="text"
                  placeholder="例如: id+id*id"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  @keyup.enter="analyzeString"
                />
                <button
                  @click="analyzeString"
                  :disabled="!inputString.trim() || analyzing"
                  class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <Icon v-if="analyzing" icon="lucide:loader-2" class="w-4 h-4 animate-spin mr-2" />
                  {{ analyzing ? '分析中...' : '开始分析' }}
                </button>
              </div>
            </div>

            <!-- 示例字符串 -->
            <div class="flex flex-wrap gap-2">
              <span class="text-sm text-gray-600">示例:</span>
              <button
                v-for="example in exampleStrings"
                :key="example"
                @click="inputString = example"
                class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                {{ example }}
              </button>
            </div>
          </div>
        </div>

        <!-- 分析过程 -->
        <div v-if="analysisSteps.length > 0" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">分析过程</h3>

          <!-- 分析表格 -->
          <div class="overflow-x-auto">
            <table class="min-w-full border border-gray-300 text-sm">
              <thead class="bg-green-50">
                <tr>
                  <th class="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700">步骤</th>
                  <th class="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700">栈</th>
                  <th class="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700">输入</th>
                  <th class="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700">动作</th>
                </tr>
              </thead>
              <tbody class="bg-white">
                <tr v-for="(step, index) in analysisSteps" :key="index" :class="{'bg-red-50': step.error}">
                  <td class="border border-gray-300 px-3 py-2 text-center">{{ index + 1 }}</td>
                  <td class="border border-gray-300 px-3 py-2 font-mono text-center">{{ step.stack }}</td>
                  <td class="border border-gray-300 px-3 py-2 font-mono text-center">{{ step.input }}</td>
                  <td class="border border-gray-300 px-3 py-2 text-center" :class="{'text-red-600': step.error}">
                    {{ step.action }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 分析结果 -->
        <div v-if="analysisResult" class="rounded-lg p-6 mb-6" :class="analysisResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
          <div class="flex items-center mb-4">
            <Icon
              :icon="analysisResult.success ? 'lucide:check-circle' : 'lucide:x-circle'"
              :class="analysisResult.success ? 'text-green-500' : 'text-red-500'"
              class="w-6 h-6 mr-2"
            />
            <h3 class="text-lg font-semibold" :class="analysisResult.success ? 'text-green-800' : 'text-red-800'">
              {{ analysisResult.success ? '分析成功' : '分析失败' }}
            </h3>
          </div>

          <div :class="analysisResult.success ? 'text-green-700' : 'text-red-700'">
            <p class="font-medium">{{ analysisResult.message }}</p>
            <div v-if="analysisResult.details" class="mt-2 text-sm">
              <p>详细信息:</p>
              <ul class="list-disc list-inside space-y-1">
                <li v-for="detail in analysisResult.details" :key="detail">{{ detail }}</li>
              </ul>
            </div>
          </div>
        </div>


      </div>
    </div>

    <div class="step-actions">
      <div class="flex justify-between items-center">
        <button @click="$emit('prev-step')" class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <Icon icon="lucide:chevron-left" class="w-4 h-4 inline mr-2" />
          上一步
        </button>
        <div class="text-sm text-gray-500">步骤 4 / 4</div>
        <button @click="complete" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          完成
          <Icon icon="lucide:check" class="w-4 h-4 inline ml-2" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'

interface AnalysisStep {
  stack: string
  input: string
  action: string
  error?: boolean
}

interface AnalysisResult {
  success: boolean
  message: string
  details?: string[]
}

defineEmits<{ 'next-step': [], 'prev-step': [], 'complete': [data: any] }>()

const inputString = ref('')
const analyzing = ref(false)
const analysisSteps = ref<AnalysisStep[]>([])
const analysisResult = ref<AnalysisResult | null>(null)

const exampleStrings = ['id+id*id', 'id*id+id', '(id+id)*id', 'id', '(id)']

// 模拟LL1分析表
const parsingTable = ref({
  'E': { 'id': 'E → TE1', '(': 'E → TE1' },
  'E1': { '+': 'E1 → +TE1', '$': 'E1 → ε', ')': 'E1 → ε' },
  'T': { 'id': 'T → FT1', '(': 'T → FT1' },
  'T1': { '*': 'T1 → *FT1', '+': 'T1 → ε', '$': 'T1 → ε', ')': 'T1 → ε' },
  'F': { 'id': 'F → id', '(': 'F → (E)' }
})

const analyzeString = async () => {
  if (!inputString.value.trim()) return

  analyzing.value = true
  analysisSteps.value = []
  analysisResult.value = null

  try {
    await performLL1Analysis(inputString.value.trim())
  } catch (error) {
    analysisResult.value = {
      success: false,
      message: '分析过程中发生错误',
      details: [String(error)]
    }
  } finally {
    analyzing.value = false
  }
}

const performLL1Analysis = async (input: string) => {
  const stack = ['$', 'E'] // 栈底为$，初始符号为E
  const inputBuffer = input.split('').concat(['$']) // 输入缓冲区
  let inputIndex = 0

  analysisSteps.value.push({
    stack: stack.join(''),
    input: inputBuffer.slice(inputIndex).join(''),
    action: '初始化'
  })

  await new Promise(resolve => setTimeout(resolve, 500))

  while (stack.length > 1) { // 栈中还有符号且不只是$
    const top = stack[stack.length - 1]
    const currentInput = inputBuffer[inputIndex]

    if (top === currentInput) {
      // 匹配终结符
      stack.pop()
      inputIndex++
      analysisSteps.value.push({
        stack: stack.join(''),
        input: inputBuffer.slice(inputIndex).join(''),
        action: `匹配 '${top}'`
      })
    } else if (isNonTerminal(top)) {
      // 查找产生式
      const production = getProduction(top, currentInput)
      if (production) {
        stack.pop() // 移除非终结符

        // 从产生式右部推入栈（逆序）
        const rightSide = production.split(' → ')[1]
        if (rightSide !== 'ε') {
          const symbols = rightSide.split('').reverse()
          symbols.forEach(symbol => {
            if (symbol.trim()) stack.push(symbol)
          })
        }

        analysisSteps.value.push({
          stack: stack.join(''),
          input: inputBuffer.slice(inputIndex).join(''),
          action: `应用产生式: ${production}`
        })
      } else {
        // 错误：找不到产生式
        analysisSteps.value.push({
          stack: stack.join(''),
          input: inputBuffer.slice(inputIndex).join(''),
          action: `错误：M[${top}, ${currentInput}] 为空`,
          error: true
        })

        analysisResult.value = {
          success: false,
          message: `语法错误：在位置 ${inputIndex + 1} 处，符号 '${currentInput}' 不符合预期`,
          details: [`栈顶符号: ${top}`, `当前输入: ${currentInput}`, `无法找到对应的产生式`]
        }
        return
      }
    } else {
      // 错误：栈顶不是预期的终结符
      analysisSteps.value.push({
        stack: stack.join(''),
        input: inputBuffer.slice(inputIndex).join(''),
        action: `错误：期望 '${top}'，得到 '${currentInput}'`,
        error: true
      })

      analysisResult.value = {
        success: false,
        message: `语法错误：期望 '${top}'，但得到 '${currentInput}'`,
        details: [`位置: ${inputIndex + 1}`, `栈顶: ${top}`, `输入: ${currentInput}`]
      }
      return
    }

    await new Promise(resolve => setTimeout(resolve, 300))
  }

  // 检查是否成功完成
  if (stack.length === 1 && stack[0] === '$' && inputIndex === inputBuffer.length - 1) {
    analysisSteps.value.push({
      stack: '$',
      input: '$',
      action: '接受'
    })

    analysisResult.value = {
      success: true,
      message: '字符串被成功接受！',
      details: [`总步骤数: ${analysisSteps.value.length}`, '语法正确', '分析完成']
    }
  } else {
    analysisResult.value = {
      success: false,
      message: '分析未能正常完成',
      details: [`栈状态: ${stack.join('')}`, `输入位置: ${inputIndex}/${inputBuffer.length - 1}`]
    }
  }
}

const isNonTerminal = (symbol: string): boolean => {
  return ['E', 'E1', 'T', 'T1', 'F'].includes(symbol)
}

const getProduction = (nonTerminal: string, terminal: string): string | null => {
  const table = parsingTable.value as any
  return table[nonTerminal]?.[terminal] || null
}

const complete = () => {
  // 完成分析，可以传递结果数据
}
</script>

<style scoped>
.step-header { padding: 2rem 2rem 1rem; border-bottom: 1px solid #e5e7eb; }
.step-icon { width: 3rem; height: 3rem; background: #dcfce7; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; }
.step-content { padding: 2rem; }
.step-actions { padding: 1rem 2rem 2rem; border-top: 1px solid #e5e7eb; background: #f9fafb; }
</style>
