<template>
  <div class="dfa-draw-step">
    <div class="step-header">
      <div class="flex items-center gap-4">
        <div class="step-icon">
          <Icon icon="lucide:share-2" class="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">绘制 DFA</h2>
          <p class="text-gray-600 mt-1">第四步：根据转换表绘制确定有限自动机</p>
        </div>
      </div>
    </div>

    <div class="step-content">
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <!-- 左侧：控制面板 -->
        <div class="control-panel">
          <div class="bg-gray-50 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">DFA 构造</h3>

            <div class="space-y-4">
              <div class="text-sm text-gray-600">
                <p><strong>正则表达式:</strong></p>
                <code class="block mt-1 p-2 bg-white rounded border font-mono text-xs">{{ regexPattern }}</code>
              </div>

              <div class="text-sm text-gray-600">
                <p><strong>DFA 状态数:</strong> {{ dfaStates.length }}</p>
                <p><strong>转换数:</strong> {{ totalTransitions }}</p>
                <p><strong>字母表:</strong> {{ alphabetSymbols.join(', ') }}</p>
              </div>
            </div>

            <div class="mt-6 space-y-3">
              <button
                @click="generateDFA"
                :disabled="isGenerating || !hasTransitionData"
                :class="[
                  'w-full px-4 py-2 rounded-lg transition-colors',
                  (isGenerating || !hasTransitionData)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                ]"
              >
                <Icon
                  :icon="isGenerating ? 'lucide:loader-2' : 'lucide:play'"
                  :class="['w-4 h-4 inline mr-2', isGenerating ? 'animate-spin' : '']"
                />
                {{ isGenerating ? '生成中...' : '生成 DFA' }}
              </button>

              <button
                @click="showDFADot"
                :disabled="!dfaDotString"
                class="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Icon icon="lucide:eye" class="w-4 h-4 inline mr-2" />
                显示 DOT 图
              </button>

              <button
                @click="resetDFA"
                class="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Icon icon="lucide:rotate-ccw" class="w-4 h-4 inline mr-2" />
                重置
              </button>
            </div>
          </div>
        </div>

        <!-- 中间：DFA 画布 -->
        <div class="dfa-canvas-area xl:col-span-3">
          <div class="bg-white border border-gray-200 rounded-lg h-96">
            <div class="h-full relative">
              <!-- 画布头部 -->
              <div class="border-b border-gray-200 p-4">
                <div class="flex items-center justify-between">
                  <h3 class="font-semibold text-gray-900">DFA 状态图</h3>
                  <div class="flex items-center gap-2 text-sm text-gray-500">
                    <Icon icon="lucide:info" class="w-4 h-4" />
                    <span>子集构造结果</span>
                  </div>
                </div>
              </div>

              <!-- 画布主体 -->
              <div class="h-full p-4">
                <DFACanvas ref="dfaCanvasRef" />
              </div>
            </div>
          </div>

          <!-- DFA 信息面板 -->
          <div v-if="dfaResult" class="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <Icon icon="lucide:check-circle" class="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 class="font-medium text-orange-800">DFA 构造完成</h4>
                <div class="text-sm text-orange-700 mt-2 space-y-1">
                  <p>• 状态数量: {{ dfaResult.stateCount }}</p>
                  <p>• 转换数量: {{ dfaResult.transitionCount }}</p>
                  <p>• 初始状态: {{ dfaResult.initialState }}</p>
                  <p>• 接受状态: {{ dfaResult.finalStates.join(', ') }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- DOT 字符串显示 -->
          <div v-if="showDotString && dfaDotString" class="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-medium text-gray-800">DFA DOT 字符串</h4>
              <button
                @click="copyDotString"
                class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                <Icon icon="lucide:copy" class="w-3 h-3 inline mr-1" />
                复制
              </button>
            </div>
            <pre class="text-xs bg-white p-3 rounded border overflow-auto max-h-40 font-mono">{{ dfaDotString }}</pre>
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
        <div class="text-sm text-gray-500">步骤 4 / 6</div>
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
import DFACanvas from '@/components/flow/canvas/DFACanvas.vue'
import type { FAResult } from '@/types'

defineEmits<{
  'next-step': []
  'prev-step': []
  'complete': [data: any]
}>()

// 从上一步获取数据
const regexPattern = ref('')
const faData = ref<FAResult | null>(null)
const dfaDotString = ref('')

// 从第三步获取数据
const dfaStates = ref<string[]>([])
const alphabetSymbols = ref<string[]>([])
const totalTransitions = ref(0)
const conversionTable = ref<any[]>([])

// 状态管理
const isGenerating = ref(false)
const showDotString = ref(false)
const dfaResult = ref<{
  stateCount: number
  transitionCount: number
  initialState: string
  finalStates: string[]
} | null>(null)

// DFA 画布引用
const dfaCanvasRef = ref<InstanceType<typeof DFACanvas>>()

// 计算属性
const hasTransitionData = computed(() => {
  return conversionTable.value.length > 0 && alphabetSymbols.value.length > 0
})

const isComplete = computed(() => {
  return dfaResult.value !== null
})

// 从localStorage获取数据
onMounted(() => {
  try {
    // 获取第一步数据
    const step1Data = localStorage.getItem('fa-step1-data')
    if (step1Data) {
      const data = JSON.parse(step1Data)
      regexPattern.value = data.regex || ''
      faData.value = data.faResult || null
      dfaDotString.value = data.faResult?.DFA_dot_str || ''
    }

    // 获取第三步数据
    const step3Data = localStorage.getItem('fa-step3-data')
    if (step3Data) {
      const data = JSON.parse(step3Data)
      dfaStates.value = data.dfaStates || []
      alphabetSymbols.value = data.alphabetSymbols || []
      totalTransitions.value = data.totalTransitions || 0
      conversionTable.value = data.conversionTable || []
    }
  } catch (error) {
    console.error('读取上一步数据失败：', error)
  }
})

// 生成DFA
const generateDFA = async () => {
  if (!hasTransitionData.value || isGenerating.value) return

  isGenerating.value = true

  try {
    // 清空画布
    if (dfaCanvasRef.value) {
      dfaCanvasRef.value.clearCanvas()
    }

    // 模拟生成过程
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 使用转换表数据在画布上生成DFA
    if (dfaCanvasRef.value && conversionTable.value.length > 0) {
      const canvas = dfaCanvasRef.value

      // 添加状态节点
      dfaStates.value.forEach((state, index) => {
        const x = 150 + (index % 4) * 200
        const y = 150 + Math.floor(index / 4) * 150

        canvas.addNode({
          id: state,
          type: 'circle',
          position: { x, y },
          data: {
            label: state,
            isInitial: index === 0, // 第一个状态为初始状态
            isFinal: state.includes('F') || index === dfaStates.value.length - 1 // 简单的终态判断
          }
        })
      })

      // 添加转换边
      let edgeCount = 0
      conversionTable.value.forEach(row => {
        alphabetSymbols.value.forEach(symbol => {
          const target = row.transitions[symbol]
          if (target && target !== '-') {
            canvas.addEdge({
              id: `edge-${edgeCount++}`,
              type: 'custom',
              source: row.state,
              target: target,
              data: { label: symbol },
              markerEnd: 'url(#dfa-arrow)'
            })
          }
        })
      })

      // 设置结果
      dfaResult.value = {
        stateCount: dfaStates.value.length,
        transitionCount: edgeCount,
        initialState: dfaStates.value[0] || 'S0',
        finalStates: dfaStates.value.filter(state => state.includes('F')) || [dfaStates.value[dfaStates.value.length - 1]]
      }
    }

  } catch (error) {
    console.error('生成DFA失败：', error)
  } finally {
    isGenerating.value = false
  }
}

// 显示DFA DOT字符串
const showDFADot = () => {
  showDotString.value = !showDotString.value
}

// 复制DOT字符串
const copyDotString = async () => {
  try {
    await navigator.clipboard.writeText(dfaDotString.value)
    // 这里可以添加一个提示
  } catch (error) {
    console.error('复制失败：', error)
  }
}

// 重置DFA
const resetDFA = () => {
  dfaResult.value = null
  showDotString.value = false

  if (dfaCanvasRef.value) {
    dfaCanvasRef.value.clearCanvas()
  }
}

// 进入下一步
const proceedToNext = () => {
  if (isComplete.value) {
    const stepData = {
      dfaResult: dfaResult.value,
      dfaStates: dfaStates.value,
      dfaDotString: dfaDotString.value,
      timestamp: new Date().toISOString()
    }

    // 保存数据
    localStorage.setItem('fa-step4-data', JSON.stringify(stepData))

    // 触发下一步事件
    document.dispatchEvent(new CustomEvent('next-step'))
  }
}
</script>

<style scoped>
.step-header { padding: 2rem 2rem 1rem; border-bottom: 1px solid #e5e7eb; }
.step-icon { width: 3rem; height: 3rem; background: #fed7aa; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; }
.step-content { padding: 2rem; }
.step-actions { padding: 1rem 2rem 2rem; border-top: 1px solid #e5e7eb; background: #f9fafb; }
</style>
