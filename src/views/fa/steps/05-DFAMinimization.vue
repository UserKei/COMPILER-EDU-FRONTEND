<template>
  <div class="dfa-minimization-step">
    <div class="step-header">
      <div class="flex items-center gap-4">
        <div class="step-icon">
          <Icon icon="lucide:minimize-2" class="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">DFA 最小化</h2>
          <p class="text-gray-600 mt-1">第五步：最小化 DFA</p>
        </div>
      </div>
    </div>

    <div class="step-content">
      <div class="instruction">
        <div class="info space-y-2 text-sm text-gray-600">
          <p>根据上述绘制的DFA，将其状态子集最小化，并重新命名状态子集序号，填写状态转换矩阵，可使用"空格"作为输入的间隔符（也可以不输入间隔符）</p>
          <p>化简DFA状态子集---参考输入：123、3 1（可乱序，可接受空格分隔符）</p>
          <p>状态转换矩阵---参考输入：1、2、3</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        <!-- 左侧：化简DFA状态子集 -->
        <div class="minimization-process">
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">化简DFA状态子集</h3>

            <p v-if="originalStateCount > 0" class="text-sm text-gray-600 mb-4">
              请将状态集 {{ Array.from({length: originalStateCount}, (_, i) => i).join(', ') }} 最小化
            </p>
            <span class="text-xs text-gray-500">(每一行输入一个化简后的状态子集)</span>

            <!-- P集合输入 -->
            <div class="space-y-3 mt-4">
              <div
                v-for="(pItem, index) in localPSets"
                :key="pItem.id"
                class="flex items-center gap-2"
              >
                <input
                  v-model="pItem.text"
                  :class="[
                    'flex-1 px-3 py-2 border rounded text-sm',
                    pItem.check === 'isCorrect' ? 'bg-green-50 border-green-300' :
                    pItem.check === 'isError' ? 'bg-red-50 border-red-300' :
                    'bg-white border-gray-300'
                  ]"
                  :disabled="pItem.category === 'onlyRead' || step6Open"
                  @focus="handlePSetFocus(pItem)"
                  placeholder="输入状态子集，如：123"
                />
                <button
                  v-if="!step6Open && localPSets.length > 1"
                  @click="removePSet(index)"
                  class="px-2 py-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Icon icon="lucide:x" class="w-4 h-4" />
                </button>
                <button
                  v-if="!step6Open"
                  @click="addPSet(index)"
                  class="px-2 py-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Icon icon="lucide:plus" class="w-4 h-4" />
                </button>
                <div v-if="step6Open" class="text-sm text-gray-500">
                  => {{ index }}
                </div>
              </div>
            </div>

            <div class="mt-6">
              <button
                @click="validatePSets"
                :disabled="step6Open"
                :class="[
                  'px-4 py-2 rounded-lg transition-colors',
                  step6Open
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                ]"
              >
                校验
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧：状态转换矩阵 -->
        <div class="minimization-info">
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">状态转换矩阵</h3>

            <div v-if="step6Open && minimizedMatrix.length">
              <!-- 转换矩阵表格 -->
              <div class="overflow-x-auto">
                <table class="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr class="bg-red-50">
                      <th class="border border-gray-300 px-3 py-2 font-semibold">状态</th>
                      <th
                        v-for="symbol in alphabetSymbols"
                        :key="symbol"
                        class="border border-gray-300 px-3 py-2 font-semibold"
                      >
                        {{ symbol }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="row in Math.max(...Object.values(faStore.originalData?.table_to_num_min || {}).map((arr: any) => Array.isArray(arr) ? arr.length : 0))"
                      :key="row - 1"
                      :class="(row - 1) % 2 === 0 ? 'bg-white' : 'bg-red-50'"
                    >
                      <td class="border border-gray-300 px-3 py-2 font-medium bg-gray-50">
                        {{ row - 1 }}
                      </td>
                      <td
                        v-for="(symbol, colIndex) in alphabetSymbols"
                        :key="symbol"
                        :class="[
                          'border border-gray-300 px-3 py-2 text-center',
                          getMatrixCell(row - 1, colIndex)?.check === 'isCorrect' ? 'bg-green-50' :
                          getMatrixCell(row - 1, colIndex)?.check === 'isError' ? 'bg-red-50' : ''
                        ]"
                      >
                        <input
                          v-if="getMatrixCell(row - 1, colIndex)?.category !== 'onlyRead'"
                          v-model="getMatrixCell(row - 1, colIndex)!.value"
                          :class="[
                            'w-full text-center border-none bg-transparent text-sm',
                            'focus:outline-none focus:ring-1 focus:ring-blue-500 rounded'
                          ]"
                          :disabled="step7Open"
                          @focus="handleMatrixCellFocus(getMatrixCell(row - 1, colIndex)!)"
                          placeholder="-"
                        />
                        <span v-else class="text-gray-600">{{ getMatrixCell(row - 1, colIndex)?.value }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="mt-4">
                <button
                  @click="validateMatrix"
                  :disabled="step7Open"
                  :class="[
                    'px-4 py-2 rounded-lg transition-colors',
                    step7Open
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  ]"
                >
                  校验
                </button>
              </div>
            </div>

            <div v-else class="text-center text-gray-500 py-8">
              <p>请先完成左侧化简DFA状态子集的填写</p>
            </div>
          </div>

          <!-- 最小化完成信息 -->
          <div v-if="isComplete" class="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <Icon icon="lucide:check-circle" class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 class="font-medium text-green-800">DFA 最小化完成</h4>
                <div class="text-sm text-green-700 mt-2 space-y-1">
                  <p>• 原始状态数: {{ originalStateCount }}</p>
                  <p>• 最小化状态数: {{ localPSets.length }}</p>
                  <p>• 减少了 {{ reductionPercentage }}% 的状态</p>
                </div>
              </div>
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
        <div class="text-sm text-gray-500">步骤 5 / 6</div>
        <button
          @click="proceedToNext"
          :disabled="!isComplete"
          :class="[
            'px-6 py-2 rounded-lg transition-colors',
            isComplete
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

defineEmits<{
  'next-step': []
  'prev-step': []
  'complete': [data: any]
}>()

// 数据类型定义
interface PSetItem {
  id: string
  category: string
  state: string
  check: string
  text: string
}

interface MatrixCell {
  id: string
  category: string
  check: string
  value: string
  rowIndex: number
  colIndex: number
  isRowHeader?: boolean
}

// 使用 FA Store
const faStore = useFAStore()

// 本地状态
const alphabetSymbols = ref<string[]>([])
const originalStateCount = ref(0)

// 状态管理
const step6Open = ref(false) // P集合校验完成
const step7Open = ref(false) // 矩阵校验完成

// P集合相关
const localPSets = ref<PSetItem[]>([{
  id: "localp_list0",
  category: "blank",
  state: "normal",
  check: "normal",
  text: ""
}])
let localPSetsCnt = 1

// 矩阵相关
const minimizedMatrix = ref<MatrixCell[]>([])
const tableView = {
  cellWidth: 80,
  cellHeight: 40,
  gap: 10
}

// 计算属性
const isComplete = computed(() => {
  return step6Open.value && step7Open.value
})

const reductionPercentage = computed(() => {
  if (originalStateCount.value === 0) return 0
  return ((originalStateCount.value - localPSets.value.length) / originalStateCount.value * 100).toFixed(1)
})

// 从localStorage获取数据
onMounted(() => {
  if (!faStore.hasResult()) {
    console.warn('No FA data found, please complete step 1 first')
    return
  }

  try {
    // 直接使用 store 中的数据
    const faResult = faStore.originalData
    if (faResult) {
      console.log('Step 5 loaded data from store')

      // 从后端数据中提取状态数量
      if (faResult.table_to_num) {
        const allStates = Object.keys(faResult.table_to_num)
        originalStateCount.value = allStates.length
      }

      // 从后端数据中提取字母表符号
      if (faResult.table) {
        const symbols = new Set<string>()
        Object.keys(faResult.table).forEach(symbol => {
          if (symbol !== 'I' && symbol !== 'ε' && symbol !== 'epsilon') {
            symbols.add(symbol)
          }
        })
        alphabetSymbols.value = Array.from(symbols).sort()
      }
    }
  } catch (error) {
    console.error('处理FA数据失败：', error)
  }
})

// P集合相关方法
const handlePSetFocus = (pItem: PSetItem) => {
  if (pItem.check === 'isCorrect') return
  pItem.check = 'normal'
}

const removePSet = (index: number) => {
  if (step6Open.value || localPSets.value.length <= 1) return
  localPSets.value.splice(index, 1)
}

const addPSet = (index: number) => {
  if (step6Open.value) return
  localPSets.value.splice(index + 1, 0, {
    id: "localp_list" + (++localPSetsCnt),
    category: "blank",
    state: "normal",
    check: "normal",
    text: ""
  })
}

// 字符集比较函数
const areCharacterSetsEqual = (str1: string, str2: string): boolean => {
  const set1 = new Set(str1)
  const set2 = new Set(str2)

  if (set1.size !== set2.size) {
    return false
  }

  for (const char of set1) {
    if (!set2.has(char)) {
      return false
    }
  }
  return true
}

// P集合匹配验证
const matchPSetsValue = (answerList: string[], inputList: PSetItem[]) => {
  const answerSet = new Set(answerList)

  for (const item of inputList) {
    const itemText = item.text.replace(/\s+/g, '')
    const answerItem = answerList.find(answer => areCharacterSetsEqual(answer, itemText))

    if (answerItem) {
      item.check = 'isCorrect'
      answerSet.delete(answerItem)
    } else {
      item.check = 'isError'
    }
  }

  return answerSet.size === 0 && inputList.every(item => item.check === 'isCorrect')
}

// 校验P集合
const validatePSets = () => {
  if (step6Open.value || !faStore.originalData?.P) return

  const answerList = faStore.originalData.P.map((pSet: string[]) => pSet.join(''))

  if (matchPSetsValue(answerList, localPSets.value)) {
    step6Open.value = true
    initMinimizedMatrix()
    // success message
  } else {
    // 显示错误或自动展示答案的逻辑
    // 这里可以添加重试次数限制
    localPSets.value = []
    answerList.forEach((answer: string, index: number) => {
      localPSets.value.push({
        id: "localp_list" + (++localPSetsCnt),
        category: "blank",
        state: "normal",
        check: "isCorrect",
        text: answer
      })
    })
    step6Open.value = true
    initMinimizedMatrix()
  }
}

// 初始化最小化矩阵
const initMinimizedMatrix = () => {
  if (!faStore.originalData?.table_to_num_min) return

  const tableToNumMin = faStore.originalData.table_to_num_min
  const symbols = alphabetSymbols.value
  const rowCount = Math.max(...Object.values(tableToNumMin).map((arr: any) => Array.isArray(arr) ? arr.length : 0))

  minimizedMatrix.value = []

  // 创建矩阵单元格
  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < symbols.length; col++) {
      const symbol = symbols[col]
      const cellId = `${row} ${symbol}`

      // 获取第一列（S列）的正确答案
      const sColumnAnswer = tableToNumMin['S']?.[row] || ''

      minimizedMatrix.value.push({
        id: cellId,
        category: col === 0 ? "onlyRead" : "blank",
        check: col === 0 ? "isCorrect" : "normal",
        value: col === 0 ? sColumnAnswer : "",
        rowIndex: row,
        colIndex: col,
        isRowHeader: false
      })
    }
  }
}

// 矩阵单元格焦点处理
const handleMatrixCellFocus = (cell: MatrixCell) => {
  if (cell.check === 'isCorrect') return
  cell.check = 'normal'
}

// 获取矩阵单元格
const getMatrixCell = (row: number, col: number): MatrixCell | undefined => {
  return minimizedMatrix.value.find(cell => cell.rowIndex === row && cell.colIndex === col)
}

// 校验矩阵
const validateMatrix = () => {
  if (step7Open.value || !faStore.originalData?.table_to_num_min) return

  let isAllCorrect = true
  const tableToNumMin = faStore.originalData.table_to_num_min

  for (const cell of minimizedMatrix.value) {
    if (cell.category === 'onlyRead' || cell.check === 'isCorrect') continue

    const symbol = alphabetSymbols.value[cell.colIndex]
    const correctAnswer = tableToNumMin[symbol]?.[cell.rowIndex] || ''

    if (cell.value.replace(/\s+/g, '') === correctAnswer) {
      cell.check = 'isCorrect'
    } else {
      cell.check = 'isError'
      isAllCorrect = false
    }
  }

  if (isAllCorrect) {
    step7Open.value = true
    // success message
  } else {
    // 显示错误或自动展示答案
    for (const cell of minimizedMatrix.value) {
      if (cell.category === "onlyRead" || cell.check === 'isCorrect') continue

      const symbol = alphabetSymbols.value[cell.colIndex]
      const correctAnswer = tableToNumMin[symbol]?.[cell.rowIndex] || ''

      cell.value = correctAnswer
      cell.check = 'isCorrect'
    }
    step7Open.value = true
  }
}

// 进入下一步
const proceedToNext = () => {
  if (isComplete.value) {
    const stepData = {
      localPSets: localPSets.value,
      minimizedMatrix: minimizedMatrix.value,
      step6Open: step6Open.value,
      step7Open: step7Open.value,
      timestamp: new Date().toISOString()
    }

    // 保存数据
    localStorage.setItem('fa-step5-data', JSON.stringify(stepData))

    // 触发下一步事件
    document.dispatchEvent(new CustomEvent('next-step'))
  }
}
</script>

<style scoped>
.step-header { padding: 2rem 2rem 1rem; border-bottom: 1px solid #e5e7eb; }
.step-icon { width: 3rem; height: 3rem; background: #fecaca; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; }
.step-content { padding: 2rem; }
.step-actions { padding: 1rem 2rem 2rem; border-top: 1px solid #e5e7eb; background: #f9fafb; }
</style>
