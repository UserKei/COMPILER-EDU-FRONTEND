<template>
  <div class="subset-construction-step">
    <!-- 步骤头部 -->
    <div class="step-header">
      <div class="flex items-center gap-4">
        <div class="step-icon">
          <Icon icon="lucide:table" class="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">子集构造法</h2>
          <p class="text-gray-600 mt-1">第三步：使用子集构造法生成转换表和状态转换矩阵</p>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="step-content">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 左侧：转换表 -->
        <div class="conversion-table-section">
          <div class="bg-white border border-gray-200 rounded-lg">
            <div class="border-b border-gray-200 p-4">
              <div class="flex items-center justify-between">
                <h3 class="font-semibold text-gray-900">NFA → DFA 转换表</h3>
                <button
                  @click="generateTable"
                  :disabled="isGenerating"
                  :class="[
                    'px-3 py-1 rounded-lg text-sm transition-colors',
                    isGenerating
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  ]"
                >
                  <Icon
                    :icon="isGenerating ? 'lucide:loader-2' : 'lucide:play'"
                    :class="['w-4 h-4 inline mr-1', isGenerating ? 'animate-spin' : '']"
                  />
                  {{ isGenerating ? '生成中...' : '生成转换表' }}
                </button>
              </div>
            </div>

            <div class="p-4">
              <div v-if="!conversionTable.length && !isGenerating" class="text-center py-8 text-gray-500">
                <Icon icon="lucide:table" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>点击"生成转换表"开始子集构造</p>
              </div>

              <div v-else-if="conversionTable.length" class="overflow-x-auto">
                <table class="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr class="bg-gray-50">
                      <th class="border border-gray-300 px-3 py-2 text-left font-semibold">新状态</th>
                      <th
                        v-for="symbol in alphabetSymbols"
                        :key="symbol"
                        class="border border-gray-300 px-3 py-2 text-center font-semibold"
                      >
                        {{ symbol }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, index) in conversionTable"
                      :key="index"
                      :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
                    >
                      <td class="border border-gray-300 px-3 py-2 font-medium">
                        {{ row.state }}
                      </td>
                      <td
                        v-for="symbol in alphabetSymbols"
                        :key="symbol"
                        class="border border-gray-300 px-3 py-2 text-center"
                      >
                        {{ row.transitions[symbol] || '-' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：状态转换矩阵 -->
        <div class="transition-matrix-section">
          <div class="bg-white border border-gray-200 rounded-lg">
            <div class="border-b border-gray-200 p-4">
              <div class="flex items-center justify-between">
                <h3 class="font-semibold text-gray-900">状态转换矩阵</h3>
                <button
                  @click="generateMatrix"
                  :disabled="!conversionTable.length || isGeneratingMatrix"
                  :class="[
                    'px-3 py-1 rounded-lg text-sm transition-colors',
                    (!conversionTable.length || isGeneratingMatrix)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  ]"
                >
                  <Icon
                    :icon="isGeneratingMatrix ? 'lucide:loader-2' : 'lucide:grid-3x3'"
                    :class="['w-4 h-4 inline mr-1', isGeneratingMatrix ? 'animate-spin' : '']"
                  />
                  {{ isGeneratingMatrix ? '生成中...' : '生成矩阵' }}
                </button>
              </div>
            </div>

            <div class="p-4">
              <div v-if="!transitionMatrix.length && !isGeneratingMatrix" class="text-center py-8 text-gray-500">
                <Icon icon="lucide:grid-3x3" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>先生成转换表后再生成转换矩阵</p>
              </div>

              <div v-else-if="transitionMatrix.length" class="overflow-x-auto">
                <table class="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr class="bg-blue-50">
                      <th class="border border-gray-300 px-3 py-2 text-left font-semibold">状态</th>
                      <th
                        v-for="symbol in alphabetSymbols"
                        :key="symbol"
                        class="border border-gray-300 px-3 py-2 text-center font-semibold"
                      >
                        {{ symbol }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, index) in transitionMatrix"
                      :key="index"
                      :class="index % 2 === 0 ? 'bg-white' : 'bg-blue-50'"
                    >
                      <td class="border border-gray-300 px-3 py-2 font-medium">
                        {{ row.state }}
                      </td>
                      <td
                        v-for="symbol in alphabetSymbols"
                        :key="symbol"
                        class="border border-gray-300 px-3 py-2 text-center"
                      >
                        {{ row.transitions[symbol] || '-' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 构造信息面板 -->
      <div v-if="constructionComplete" class="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <Icon icon="lucide:check-circle" class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 class="font-medium text-green-800">子集构造完成</h4>
            <div class="text-sm text-green-700 mt-2 space-y-1">
              <p>• DFA 状态数量: {{ dfaStates.length }}</p>
              <p>• 字母表符号: {{ alphabetSymbols.join(', ') }}</p>
              <p>• 转换数量: {{ totalTransitions }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 步骤操作栏 -->
    <div class="step-actions">
      <div class="flex justify-between items-center">
        <button
          @click="$emit('prev-step')"
          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Icon icon="lucide:chevron-left" class="w-4 h-4 inline mr-2" />
          上一步
        </button>

        <div class="text-sm text-gray-500">
          步骤 3 / 6
        </div>

        <button
          @click="proceedToNext"
          :disabled="!constructionComplete"
          :class="[
            'px-6 py-2 rounded-lg transition-colors',
            constructionComplete
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          ]"
        >
          下一步
          <Icon icon="lucide:chevron-right" class="w-4 h-4 inline ml-2" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import type { FAResult } from '@/types'

defineEmits<{
  'next-step': []
  'prev-step': []
  'complete': [data: any]
}>()

// 从上一步获取数据
const faData = ref<FAResult | null>(null)
const regexPattern = ref('')

// 状态管理
const isGenerating = ref(false)
const isGeneratingMatrix = ref(false)
const conversionTable = ref<Array<{
  state: string
  transitions: Record<string, string>
}>>([])
const transitionMatrix = ref<Array<{
  state: string
  transitions: Record<string, string>
}>>([])

// 字母表符号
const alphabetSymbols = ref<string[]>([])
const dfaStates = ref<string[]>([])

// 计算属性
const constructionComplete = computed(() => {
  return conversionTable.value.length > 0 && transitionMatrix.value.length > 0
})

const totalTransitions = computed(() => {
  return conversionTable.value.reduce((total, row) => {
    return total + Object.values(row.transitions).filter(t => t && t !== '-').length
  }, 0)
})

// 从localStorage获取上一步的数据
onMounted(() => {
  try {
    const savedData = localStorage.getItem('fa-step1-data')
    if (savedData) {
      const stepData = JSON.parse(savedData)
      regexPattern.value = stepData.regex || ''
      faData.value = stepData.faResult || null

      if (stepData.faResult) {
        // 从后端数据中提取字母表符号
        extractAlphabetFromFAData(stepData.faResult)
      }
    }
  } catch (error) {
    console.error('读取上一步数据失败：', error)
  }
})

// 从FA数据中提取字母表符号
const extractAlphabetFromFAData = (data: FAResult) => {
  const symbols = new Set<string>()

  // 从转换表中提取符号
  if (data.table) {
    Object.keys(data.table).forEach(symbol => {
      if (symbol !== 'I' && symbol !== 'ε' && symbol !== 'epsilon') {
        symbols.add(symbol)
      }
    })
  }

  alphabetSymbols.value = Array.from(symbols).sort()
}

// 生成转换表
const generateTable = async () => {
  if (!faData.value || isGenerating.value) return

  isGenerating.value = true

  try {
    // 模拟生成过程
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 使用后端返回的table数据
    const table = faData.value.table
    if (table) {
      const newTable: Array<{ state: string; transitions: Record<string, string> }> = []

      // 处理转换表数据
      Object.keys(table).forEach(symbol => {
        const transitions = table[symbol]
        transitions.forEach((transitionSet: string[], index: number) => {
          const stateName = `S${index}`

          // 找到或创建对应的行
          let row = newTable.find(r => r.state === stateName)
          if (!row) {
            row = { state: stateName, transitions: {} }
            newTable.push(row)
          }

          // 设置转换
          row.transitions[symbol] = transitionSet.join(',') || '-'
        })
      })

      conversionTable.value = newTable
      dfaStates.value = newTable.map(row => row.state)
    }
  } catch (error) {
    console.error('生成转换表失败：', error)
  } finally {
    isGenerating.value = false
  }
}

// 生成状态转换矩阵
const generateMatrix = async () => {
  if (!faData.value || isGeneratingMatrix.value) return

  isGeneratingMatrix.value = true

  try {
    // 模拟生成过程
    await new Promise(resolve => setTimeout(resolve, 800))

    // 使用后端返回的table_to_num数据
    const tableToNum = faData.value.table_to_num
    if (tableToNum) {
      const matrix: Array<{ state: string; transitions: Record<string, string> }> = []

      // 处理状态转换矩阵数据
      Object.keys(tableToNum).forEach(symbol => {
        const transitions = tableToNum[symbol]
        transitions.forEach((targetState: string, index: number) => {
          const stateName = `S${index}`

          // 找到或创建对应的行
          let row = matrix.find(r => r.state === stateName)
          if (!row) {
            row = { state: stateName, transitions: {} }
            matrix.push(row)
          }

          // 设置转换
          row.transitions[symbol] = targetState || '-'
        })
      })

      transitionMatrix.value = matrix
    }
  } catch (error) {
    console.error('生成状态转换矩阵失败：', error)
  } finally {
    isGeneratingMatrix.value = false
  }
}

// 进入下一步
const proceedToNext = () => {
  if (constructionComplete.value) {
    const stepData = {
      conversionTable: conversionTable.value,
      transitionMatrix: transitionMatrix.value,
      dfaStates: dfaStates.value,
      alphabetSymbols: alphabetSymbols.value,
      totalTransitions: totalTransitions.value,
      timestamp: new Date().toISOString()
    }

    // 保存数据
    localStorage.setItem('fa-step3-data', JSON.stringify(stepData))

    // 触发下一步事件
    document.dispatchEvent(new CustomEvent('next-step'))
  }
}
</script>

<style scoped>
.step-header {
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.step-icon {
  width: 3rem;
  height: 3rem;
  background: #dcfce7;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-content {
  padding: 2rem;
}

.step-actions {
  padding: 1rem 2rem 2rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}
</style>
