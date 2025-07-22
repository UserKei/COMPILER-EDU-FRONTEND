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
      <div class="space-y-6">
        <!-- NFA 参考图 -->
        <div class="nfa-reference">
          <div class="bg-white border border-gray-200 rounded-lg">
            <div class="border-b border-gray-200 p-4">
              <h3 class="font-semibold text-gray-900 flex items-center gap-2">
                <Icon icon="lucide:share-2" class="w-5 h-5 text-blue-600" />
                NFA 图（参考）
              </h3>
              <p class="text-sm text-gray-600 mt-1">根据此 NFA 图填写下方的转换表和状态转换矩阵</p>
            </div>
            <div class="p-6">
              <div v-if="faStore.nfaDotString" class="nfa-svg-container bg-gray-50 rounded-lg p-4 overflow-auto">
                <div v-html="nfaSvg" class="flex justify-center"></div>
              </div>
              <div v-else class="text-center py-8 text-gray-500">
                <Icon icon="lucide:image-off" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>暂无 NFA 图数据</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 转换表区域 -->
        <div class="conversion-table-section">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 左侧：用户填写转换表 -->
            <div class="user-table-section">
              <div class="bg-white border border-gray-200 rounded-lg">
                <div class="border-b border-gray-200 p-4">
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold text-gray-900">NFA → DFA 转换表（用户填写）</h3>
                    <div class="flex items-center gap-2">
                      <button
                        @click="addTableRow"
                        class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        <Icon icon="lucide:plus" class="w-4 h-4 inline mr-1" />
                        添加行
                      </button>
                      <button
                        @click="clearUserTable"
                        class="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                      >
                        <Icon icon="lucide:eraser" class="w-4 h-4 inline mr-1" />
                        清空
                      </button>
                    </div>
                  </div>
                </div>

                <div class="p-4">
                  <div v-if="!userConversionTable.length" class="text-center py-8 text-gray-500">
                    <Icon icon="lucide:edit" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>点击"添加行"开始填写转换表</p>
                  </div>

                  <div v-else class="overflow-x-auto">
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
                          <th class="border border-gray-300 px-3 py-2 text-center font-semibold">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(row, index) in userConversionTable"
                          :key="index"
                          :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
                        >
                          <td class="border border-gray-300 px-3 py-2">
                            <input
                              v-model="row.state"
                              type="text"
                              placeholder="状态名"
                              class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td
                            v-for="symbol in alphabetSymbols"
                            :key="symbol"
                            class="border border-gray-300 px-3 py-2"
                          >
                            <input
                              v-model="row.transitions[symbol]"
                              type="text"
                              placeholder="-"
                              class="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td class="border border-gray-300 px-3 py-2 text-center">
                            <button
                              @click="removeTableRow(index)"
                              class="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Icon icon="lucide:trash-2" class="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <!-- 右侧：答案区域 -->
            <div class="answer-table-section">
              <div class="bg-white border border-gray-200 rounded-lg">
                <div class="border-b border-gray-200 p-4">
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold text-gray-900">标准答案</h3>
                    <button
                      @click="toggleTableAnswer"
                      :class="[
                        'px-4 py-2 rounded-lg transition-colors',
                        showTableAnswer
                          ? 'bg-gray-600 text-white hover:bg-gray-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      ]"
                    >
                      <Icon
                        :icon="showTableAnswer ? 'lucide:eye-off' : 'lucide:eye'"
                        class="w-4 h-4 inline mr-2"
                      />
                      {{ showTableAnswer ? '隐藏答案' : '查看答案' }}
                    </button>
                  </div>
                </div>

                <div class="p-4">
                  <div v-if="!showTableAnswer" class="text-center py-8 text-gray-500">
                    <Icon icon="lucide:lock" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p class="text-lg font-medium">答案已隐藏</p>
                    <p class="text-sm mt-1">完成填写后点击"查看答案"按钮</p>
                  </div>

                  <div v-else-if="answerConversionTable.length" class="overflow-x-auto">
                    <table class="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr class="bg-green-50">
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
                          v-for="(row, index) in answerConversionTable"
                          :key="index"
                          :class="index % 2 === 0 ? 'bg-white' : 'bg-green-50'"
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

                  <div v-else class="text-center py-8 text-gray-500">
                    <Icon icon="lucide:alert-circle" class="w-8 h-8 mx-auto mb-2" />
                    <p>暂无答案数据</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 状态转换矩阵区域 -->
        <div class="transition-matrix-section">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 左侧：用户填写状态转换矩阵 -->
            <div class="user-matrix-section">
              <div class="bg-white border border-gray-200 rounded-lg">
                <div class="border-b border-gray-200 p-4">
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold text-gray-900">状态转换矩阵（用户填写）</h3>
                    <div class="flex items-center gap-2">
                      <button
                        @click="addMatrixRow"
                        class="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                      >
                        <Icon icon="lucide:plus" class="w-4 h-4 inline mr-1" />
                        添加行
                      </button>
                      <button
                        @click="clearUserMatrix"
                        class="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                      >
                        <Icon icon="lucide:eraser" class="w-4 h-4 inline mr-1" />
                        清空
                      </button>
                    </div>
                  </div>
                </div>

                <div class="p-4">
                  <div v-if="!userTransitionMatrix.length" class="text-center py-8 text-gray-500">
                    <Icon icon="lucide:grid-3x3" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>点击"添加行"开始填写状态转换矩阵</p>
                  </div>

                  <div v-else class="overflow-x-auto">
                    <table class="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr class="bg-purple-50">
                          <th class="border border-gray-300 px-3 py-2 text-left font-semibold">状态</th>
                          <th
                            v-for="symbol in alphabetSymbols"
                            :key="symbol"
                            class="border border-gray-300 px-3 py-2 text-center font-semibold"
                          >
                            {{ symbol }}
                          </th>
                          <th class="border border-gray-300 px-3 py-2 text-center font-semibold">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(row, index) in userTransitionMatrix"
                          :key="index"
                          :class="index % 2 === 0 ? 'bg-white' : 'bg-purple-50'"
                        >
                          <td class="border border-gray-300 px-3 py-2">
                            <input
                              v-model="row.state"
                              type="text"
                              placeholder="状态编号"
                              class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </td>
                          <td
                            v-for="symbol in alphabetSymbols"
                            :key="symbol"
                            class="border border-gray-300 px-3 py-2"
                          >
                            <input
                              v-model="row.transitions[symbol]"
                              type="text"
                              placeholder="-"
                              class="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </td>
                          <td class="border border-gray-300 px-3 py-2 text-center">
                            <button
                              @click="removeMatrixRow(index)"
                              class="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Icon icon="lucide:trash-2" class="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <!-- 右侧：答案区域 -->
            <div class="answer-matrix-section">
              <div class="bg-white border border-gray-200 rounded-lg">
                <div class="border-b border-gray-200 p-4">
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold text-gray-900">标准答案</h3>
                    <button
                      @click="toggleMatrixAnswer"
                      :class="[
                        'px-4 py-2 rounded-lg transition-colors',
                        showMatrixAnswer
                          ? 'bg-gray-600 text-white hover:bg-gray-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      ]"
                    >
                      <Icon
                        :icon="showMatrixAnswer ? 'lucide:eye-off' : 'lucide:eye'"
                        class="w-4 h-4 inline mr-2"
                      />
                      {{ showMatrixAnswer ? '隐藏答案' : '查看答案' }}
                    </button>
                  </div>
                </div>

                <div class="p-4">
                  <div v-if="!showMatrixAnswer" class="text-center py-8 text-gray-500">
                    <Icon icon="lucide:lock" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p class="text-lg font-medium">答案已隐藏</p>
                    <p class="text-sm mt-1">完成填写后点击"查看答案"按钮</p>
                  </div>

                  <div v-else-if="answerTransitionMatrix.length" class="overflow-x-auto">
                    <table class="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr class="bg-green-50">
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
                          v-for="(row, index) in answerTransitionMatrix"
                          :key="index"
                          :class="index % 2 === 0 ? 'bg-white' : 'bg-green-50'"
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

                  <div v-else class="text-center py-8 text-gray-500">
                    <Icon icon="lucide:alert-circle" class="w-8 h-8 mx-auto mb-2" />
                    <p>暂无答案数据</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 填写提示 -->
        <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <Icon icon="lucide:lightbulb" class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 class="font-medium text-blue-800">填写提示</h4>
              <ul class="text-sm text-blue-700 mt-2 space-y-1">
                <li>• 转换表：记录从NFA状态集合到新DFA状态的映射关系</li>
                <li>• 状态转换矩阵：用数字编号表示状态间的转换关系</li>
                <li>• 无转换的格子可以填写"-"或留空</li>
                <li>• 完成填写后可以查看标准答案进行对比</li>
              </ul>
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
import { useFAStore } from '@/stores'
import { instance } from '@viz-js/viz'

defineEmits<{
  'next-step': []
  'prev-step': []
  'complete': [data: any]
}>()

// 使用 FA Store
const faStore = useFAStore()

// NFA SVG 渲染
const nfaSvg = ref('')

// 渲染 NFA SVG
const renderNFASvg = async () => {
  if (faStore.nfaDotString) {
    try {
      const viz = await instance()
      const svg = viz.renderSVGElement(faStore.nfaDotString)
      nfaSvg.value = svg.outerHTML
    } catch (error) {
      console.error('渲染 NFA SVG 失败：', error)
      nfaSvg.value = ''
    }
  }
}

// 用户填写的表格
const userConversionTable = ref<Array<{
  state: string
  transitions: Record<string, string>
}>>([])

const userTransitionMatrix = ref<Array<{
  state: string
  transitions: Record<string, string>
}>>([])

// 答案数据
const answerConversionTable = ref<Array<{
  state: string
  transitions: Record<string, string>
}>>([])

const answerTransitionMatrix = ref<Array<{
  state: string
  transitions: Record<string, string>
}>>([])

// 答案显示控制
const showTableAnswer = ref(false)
const showMatrixAnswer = ref(false)

// 状态管理（保留原有的）
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
  return userConversionTable.value.length > 0 && userTransitionMatrix.value.length > 0
})

const totalTransitions = computed(() => {
  return conversionTable.value.reduce((total, row) => {
    return total + Object.values(row.transitions).filter(t => t && t !== '-').length
  }, 0)
})

// 从localStorage获取上一步的数据
onMounted(() => {
  if (!faStore.hasResult()) {
    console.warn('No FA data found, please complete step 1 first')
    return
  }

  try {
    // 直接使用 store 中的数据
    const faResult = faStore.originalData
    if (faResult) {
      // 从后端数据中提取字母表符号
      extractAlphabetFromFAData(faResult)
      // 生成答案数据
      generateAnswerData(faResult)
      // 渲染 NFA SVG
      renderNFASvg()
    }
  } catch (error) {
    console.error('处理FA数据失败：', error)
  }
})

// 从FA数据中提取字母表符号
const extractAlphabetFromFAData = (data: any) => {
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

// 生成答案数据
const generateAnswerData = (data: any) => {
  // 直接使用后端返回的数据结构来显示答案

  // 生成转换表答案 - 直接使用后端的table数据
  if (data.table) {
    const table = data.table
    const newTable: Array<{ state: string; transitions: Record<string, string> }> = []

    // 后端数据结构：table 是一个对象
    // 键是输入符号（如 'a', 'b' 等）
    // 值是数组，包含每个状态对应的转换结果

    // 获取所有符号（过滤掉特殊符号）
    const symbols = Object.keys(table).filter(symbol =>
      symbol !== 'I' && symbol !== 'ε' && symbol !== 'epsilon'
    ).sort()

    // 获取状态数量（假设所有符号的转换数组长度相同）
    const stateCount = table[symbols[0]]?.length || 0

    // 为每个状态创建行
    for (let i = 0; i < stateCount; i++) {
      const row = {
        state: `S${i}`,
        transitions: {} as Record<string, string>
      }

      // 为每个符号填入转换信息
      symbols.forEach(symbol => {
        const transition = table[symbol][i]
        if (Array.isArray(transition)) {
          // 如果是数组，用空字符串连接（按旧前端的方式）
          row.transitions[symbol] = transition.join('') || '-'
        } else {
          row.transitions[symbol] = transition || '-'
        }
      })

      newTable.push(row)
    }

    answerConversionTable.value = newTable
  }

  // 生成状态转换矩阵答案 - 直接使用后端的table_to_num数据
  if (data.table_to_num) {
    const tableToNum = data.table_to_num
    const matrix: Array<{ state: string; transitions: Record<string, string> }> = []

    // 后端数据结构：table_to_num 是一个对象
    // 键是状态名（如 'S', 'S0', 'S1' 等）
    // 值是数组，包含每个输入符号对应的转换结果

    // 获取所有状态名，按照旧前端的逻辑排序：先取'S'状态，然后其他状态排序
    const allStates = Object.keys(tableToNum)
    const sKeys = allStates.filter(x => x === 'S')
    const nonSKeys = allStates.filter(x => x !== 'S').sort()
    const stateKeys = [...sKeys, ...nonSKeys]

    // 对每个状态（行），构建其对应的转换
    stateKeys.forEach((state) => {
      const row = {
        state: state,
        transitions: {} as Record<string, string>
      }

      // 获取该状态的转换数组
      const stateTransitions = tableToNum[state] || []

      // 对每个字母表符号，获取对应的转换
      alphabetSymbols.value.forEach((symbol, symbolIndex) => {
        row.transitions[symbol] = stateTransitions[symbolIndex] || '-'
      })

      matrix.push(row)
    })

    answerTransitionMatrix.value = matrix
  }
}

// 用户表格操作方法
const addTableRow = () => {
  const newRow: { state: string; transitions: Record<string, string> } = {
    state: '',
    transitions: {}
  }

  // 为每个字母表符号初始化空的转换
  alphabetSymbols.value.forEach(symbol => {
    newRow.transitions[symbol] = ''
  })

  userConversionTable.value.push(newRow)
}

const removeTableRow = (index: number) => {
  userConversionTable.value.splice(index, 1)
}

const clearUserTable = () => {
  userConversionTable.value = []
}

// 用户矩阵操作方法
const addMatrixRow = () => {
  const newRow: { state: string; transitions: Record<string, string> } = {
    state: '',
    transitions: {}
  }

  // 为每个字母表符号初始化空的转换
  alphabetSymbols.value.forEach(symbol => {
    newRow.transitions[symbol] = ''
  })

  userTransitionMatrix.value.push(newRow)
}

const removeMatrixRow = (index: number) => {
  userTransitionMatrix.value.splice(index, 1)
}

const clearUserMatrix = () => {
  userTransitionMatrix.value = []
}

// 答案显示控制
const toggleTableAnswer = () => {
  showTableAnswer.value = !showTableAnswer.value
}

const toggleMatrixAnswer = () => {
  showMatrixAnswer.value = !showMatrixAnswer.value
}

// 生成转换表
const generateTable = async () => {
  if (!faStore.hasResult() || isGenerating.value) return

  isGenerating.value = true

  try {
    // 模拟生成过程
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 使用后端返回的table数据
    const table = faStore.originalData?.table
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
  if (!faStore.hasResult() || isGeneratingMatrix.value) return

  isGeneratingMatrix.value = true

  try {
    // 模拟生成过程
    await new Promise(resolve => setTimeout(resolve, 800))

    // 使用后端返回的table_to_num数据
    const tableToNum = faStore.originalData?.table_to_num
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
      // 保存答案数据供下一步参考
      conversionTable: answerConversionTable.value,
      transitionMatrix: answerTransitionMatrix.value,
      dfaStates: dfaStates.value,
      alphabetSymbols: alphabetSymbols.value,
      totalTransitions: totalTransitions.value,
      // 同时保存用户填写的数据
      userConversionTable: userConversionTable.value,
      userTransitionMatrix: userTransitionMatrix.value,
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
