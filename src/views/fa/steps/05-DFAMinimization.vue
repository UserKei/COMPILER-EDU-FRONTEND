<template>
  <div class="dfa-minimization-step">
    <div class="step-header">
      <div class="flex items-center gap-4">
        <div class="step-icon">
          <Icon icon="lucide:minimize-2" class="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">DFA 最小化</h2>
          <p class="text-gray-600 mt-1">第五步：使用 Hopcroft 算法最小化 DFA</p>
        </div>
      </div>
    </div>

    <div class="step-content">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 左侧：最小化过程 -->
        <div class="minimization-process">
          <div class="bg-gray-50 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">最小化过程</h3>

            <div class="space-y-4">
              <!-- 等价类划分 -->
              <div class="equivalence-classes">
                <h4 class="font-medium text-gray-800 mb-3">等价类划分</h4>
                <div class="space-y-2">
                  <div
                    v-for="(partition, index) in partitions"
                    :key="index"
                    :class="[
                      'p-3 rounded border transition-all',
                      index <= currentPartitionStep
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200'
                    ]"
                  >
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-sm">P{{ index }}:</span>
                      <div class="flex flex-wrap gap-1">
                        <span
                          v-for="state in partition.states"
                          :key="state"
                          class="px-2 py-1 text-xs bg-gray-100 rounded"
                        >
                          {{ state }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 最小化转换矩阵 -->
              <div v-if="minimizedMatrix.length" class="minimized-matrix">
                <h4 class="font-medium text-gray-800 mb-3">最小化转换矩阵</h4>
                <div class="overflow-x-auto">
                  <table class="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr class="bg-red-50">
                        <th class="border border-gray-300 px-2 py-1 font-semibold">状态</th>
                        <th
                          v-for="symbol in alphabetSymbols"
                          :key="symbol"
                          class="border border-gray-300 px-2 py-1 font-semibold"
                        >
                          {{ symbol }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(row, index) in minimizedMatrix"
                        :key="index"
                        :class="index % 2 === 0 ? 'bg-white' : 'bg-red-50'"
                      >
                        <td class="border border-gray-300 px-2 py-1 font-medium">
                          {{ row.state }}
                        </td>
                        <td
                          v-for="symbol in alphabetSymbols"
                          :key="symbol"
                          class="border border-gray-300 px-2 py-1 text-center"
                        >
                          {{ row.transitions[symbol] || '-' }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div class="mt-6 flex gap-2">
              <button
                @click="startMinimization"
                :disabled="isMinimizing || !hasDFAData"
                :class="[
                  'flex-1 px-4 py-2 rounded-lg transition-colors',
                  (isMinimizing || !hasDFAData)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                ]"
              >
                <Icon
                  :icon="isMinimizing ? 'lucide:loader-2' : 'lucide:play'"
                  :class="['w-4 h-4 inline mr-2', isMinimizing ? 'animate-spin' : '']"
                />
                {{ isMinimizing ? '最小化中...' : '开始最小化' }}
              </button>

              <button
                @click="resetMinimization"
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Icon icon="lucide:rotate-ccw" class="w-4 h-4 inline mr-2" />
                重置
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧：最小化信息 -->
        <div class="minimization-info">
          <div class="bg-white border border-gray-200 rounded-lg">
            <div class="border-b border-gray-200 p-4">
              <h3 class="font-semibold text-gray-900">最小化信息</h3>
            </div>

            <div class="p-4 space-y-4">
              <!-- DFA信息对比 -->
              <div class="comparison-info">
                <h4 class="font-medium text-gray-800 mb-3">优化对比</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div class="text-center p-3 bg-gray-50 rounded">
                    <p class="text-gray-600">原始DFA</p>
                    <p class="text-2xl font-bold text-gray-900">{{ originalStateCount }}</p>
                    <p class="text-xs text-gray-500">状态数</p>
                  </div>
                  <div class="text-center p-3 bg-red-50 rounded">
                    <p class="text-gray-600">最小化DFA</p>
                    <p class="text-2xl font-bold text-red-600">{{ minimizedStateCount }}</p>
                    <p class="text-xs text-gray-500">状态数</p>
                  </div>
                </div>

                <div v-if="optimizationRatio > 0" class="mt-3 text-center">
                  <p class="text-sm text-green-600">
                    <Icon icon="lucide:trending-down" class="w-4 h-4 inline mr-1" />
                    减少了 {{ optimizationRatio.toFixed(1) }}% 的状态
                  </p>
                </div>
              </div>

              <!-- P集合显示 -->
              <div v-if="pSets.length" class="p-sets-display">
                <h4 class="font-medium text-gray-800 mb-3">P 集合</h4>
                <div class="space-y-2">
                  <div
                    v-for="(pSet, index) in pSets"
                    :key="index"
                    class="p-2 bg-gray-50 rounded text-sm"
                  >
                    <span class="font-medium">P{{ index }}:</span>
                    <span class="ml-2">{{ pSet.join(', ') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 最小化完成信息 -->
          <div v-if="minimizationResult" class="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <Icon icon="lucide:check-circle" class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 class="font-medium text-red-800">DFA 最小化完成</h4>
                <div class="text-sm text-red-700 mt-2 space-y-1">
                  <p>• 最小化状态数: {{ minimizationResult.stateCount }}</p>
                  <p>• 转换数量: {{ minimizationResult.transitionCount }}</p>
                  <p>• 初始状态: {{ minimizationResult.initialState }}</p>
                  <p>• 接受状态: {{ minimizationResult.finalStates.join(', ') }}</p>
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
import type { FAResult } from '@/types'

defineEmits<{
  'next-step': []
  'prev-step': []
  'complete': [data: any]
}>()

// 从上一步获取数据
const faData = ref<FAResult | null>(null)
const dfaStates = ref<string[]>([])
const alphabetSymbols = ref<string[]>([])
const originalStateCount = ref(0)

// 最小化状态管理
const isMinimizing = ref(false)
const currentPartitionStep = ref(-1)
const minimizedStateCount = ref(0)
const minimizationResult = ref<{
  stateCount: number
  transitionCount: number
  initialState: string
  finalStates: string[]
} | null>(null)

// 最小化数据
const partitions = ref<Array<{ states: string[] }>>([])
const minimizedMatrix = ref<Array<{
  state: string
  transitions: Record<string, string>
}>>([])
const pSets = ref<string[][]>([])

// 计算属性
const hasDFAData = computed(() => {
  return dfaStates.value.length > 0 && alphabetSymbols.value.length > 0
})

const optimizationRatio = computed(() => {
  if (originalStateCount.value === 0) return 0
  return ((originalStateCount.value - minimizedStateCount.value) / originalStateCount.value) * 100
})

const isComplete = computed(() => {
  return minimizationResult.value !== null
})

// 从localStorage获取数据
onMounted(() => {
  try {
    // 获取第一步数据
    const step1Data = localStorage.getItem('fa-step1-data')
    if (step1Data) {
      const data = JSON.parse(step1Data)
      faData.value = data.faResult || null

      // 从后端数据中提取P集合
      if (data.faResult?.P) {
        pSets.value = data.faResult.P
      }
    }

    // 获取第四步数据
    const step4Data = localStorage.getItem('fa-step4-data')
    if (step4Data) {
      const data = JSON.parse(step4Data)
      dfaStates.value = data.dfaStates || []
      originalStateCount.value = data.dfaStates?.length || 0
    }

    // 获取第三步数据（字母表）
    const step3Data = localStorage.getItem('fa-step3-data')
    if (step3Data) {
      const data = JSON.parse(step3Data)
      alphabetSymbols.value = data.alphabetSymbols || []
    }
  } catch (error) {
    console.error('读取上一步数据失败：', error)
  }
})

// 开始最小化
const startMinimization = async () => {
  if (!hasDFAData.value || isMinimizing.value) return

  isMinimizing.value = true
  currentPartitionStep.value = -1
  minimizationResult.value = null

  try {
    // 使用后端返回的table_to_num_min数据
    if (faData.value?.table_to_num_min) {
      const tableToNumMin = faData.value.table_to_num_min

      // 模拟分割过程
      await simulatePartitioning()

      // 生成最小化矩阵
      const matrix: Array<{ state: string; transitions: Record<string, string> }> = []
      Object.keys(tableToNumMin).forEach(symbol => {
        const transitions = tableToNumMin[symbol]
        transitions.forEach((targetState: string, index: number) => {
          const stateName = `M${index}`

          let row = matrix.find(r => r.state === stateName)
          if (!row) {
            row = { state: stateName, transitions: {} }
            matrix.push(row)
          }

          row.transitions[symbol] = targetState || '-'
        })
      })

      minimizedMatrix.value = matrix
      minimizedStateCount.value = matrix.length

      // 设置最小化结果
      minimizationResult.value = {
        stateCount: minimizedStateCount.value,
        transitionCount: Object.values(matrix).reduce((total, row) => {
          return total + Object.values(row.transitions).filter(t => t && t !== '-').length
        }, 0),
        initialState: 'M0',
        finalStates: matrix.filter(row => row.state.includes('F')).map(row => row.state) || ['M' + (matrix.length - 1)]
      }
    }

  } catch (error) {
    console.error('最小化失败：', error)
  } finally {
    isMinimizing.value = false
  }
}

// 模拟分割过程
const simulatePartitioning = async () => {
  // 初始分割：接受状态和非接受状态
  const initialPartitions = [
    { states: dfaStates.value.filter(state => !state.includes('F')) },
    { states: dfaStates.value.filter(state => state.includes('F')) }
  ]

  partitions.value = initialPartitions.filter(p => p.states.length > 0)
  currentPartitionStep.value = 0

  // 模拟进一步细分过程
  for (let i = 1; i < 3; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 这里可以添加更复杂的分割逻辑
    currentPartitionStep.value = i
  }
}

// 重置最小化
const resetMinimization = () => {
  currentPartitionStep.value = -1
  minimizationResult.value = null
  partitions.value = []
  minimizedMatrix.value = []
  minimizedStateCount.value = 0
}

// 进入下一步
const proceedToNext = () => {
  if (isComplete.value) {
    const stepData = {
      minimizationResult: minimizationResult.value,
      minimizedMatrix: minimizedMatrix.value,
      pSets: pSets.value,
      optimizationRatio: optimizationRatio.value,
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
