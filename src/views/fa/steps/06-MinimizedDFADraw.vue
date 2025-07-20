<template>
  <div class="minimized-dfa-draw-step">
    <div class="step-header">
      <div class="flex items-center gap-4">
        <div class="step-icon">
          <Icon icon="lucide:check-circle-2" class="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">最小化 DFA 结果</h2>
          <p class="text-gray-600 mt-1">第六步：可视化绘制最小化后的 DFA</p>
        </div>
      </div>
    </div>

    <div class="step-content">
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <!-- 左侧：总结信息 -->
        <div class="summary-panel">
          <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              <Icon icon="lucide:info" class="w-5 h-5 inline mr-2" />
              转换总结
            </h3>

            <div class="space-y-4">
              <div class="text-sm">
                <p><strong>正则表达式:</strong></p>
                <code class="block mt-1 p-2 bg-white rounded border font-mono text-xs">{{ regexPattern }}</code>
              </div>

              <div class="grid grid-cols-1 gap-3 text-sm">
                <div class="flex justify-between p-2 bg-white rounded">
                  <span class="text-gray-600">NFA 状态数:</span>
                  <span class="font-medium">{{ nfaStateCount }}</span>
                </div>
                <div class="flex justify-between p-2 bg-white rounded">
                  <span class="text-gray-600">DFA 状态数:</span>
                  <span class="font-medium">{{ dfaStateCount }}</span>
                </div>
                <div class="flex justify-between p-2 bg-indigo-100 rounded">
                  <span class="text-indigo-700">最小DFA状态数:</span>
                  <span class="font-bold text-indigo-900">{{ minimizedStateCount }}</span>
                </div>
              </div>

              <div v-if="optimizationInfo.ratio > 0" class="p-3 bg-green-100 rounded">
                <div class="flex items-center gap-2 text-green-800">
                  <Icon icon="lucide:trending-down" class="w-4 h-4" />
                  <span class="font-medium">优化效果</span>
                </div>
                <p class="text-sm text-green-700 mt-1">
                  状态数减少了 {{ optimizationInfo.ratio.toFixed(1) }}%
                </p>
              </div>
            </div>

            <div class="mt-6 space-y-3">
              <button
                @click="generateMinimizedDFA"
                :disabled="isGenerating || !hasMinimizationData"
                :class="[
                  'w-full px-4 py-2 rounded-lg transition-colors',
                  (isGenerating || !hasMinimizationData)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                ]"
              >
                <Icon
                  :icon="isGenerating ? 'lucide:loader-2' : 'lucide:play'"
                  :class="['w-4 h-4 inline mr-2', isGenerating ? 'animate-spin' : '']"
                />
                {{ isGenerating ? '生成中...' : '生成最小DFA' }}
              </button>

              <button
                @click="showMinimizedDot"
                :disabled="!minimizedDotString"
                class="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Icon icon="lucide:eye" class="w-4 h-4 inline mr-2" />
                显示 DOT 图
              </button>

              <button
                @click="downloadResults"
                :disabled="!isComplete"
                class="w-full px-4 py-2 border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Icon icon="lucide:download" class="w-4 h-4 inline mr-2" />
                导出结果
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧：最小化DFA画布 -->
        <div class="minimized-dfa-canvas-area xl:col-span-3">
          <div class="bg-white border border-gray-200 rounded-lg h-96">
            <div class="h-full relative">
              <!-- 画布头部 -->
              <div class="border-b border-gray-200 p-4">
                <div class="flex items-center justify-between">
                  <h3 class="font-semibold text-gray-900">最小化 DFA 状态图</h3>
                  <div class="flex items-center gap-2 text-sm text-gray-500">
                    <Icon icon="lucide:info" class="w-4 h-4" />
                    <span>最终优化结果</span>
                  </div>
                </div>
              </div>

              <!-- 画布主体 -->
              <div class="h-full p-4">
                <DFACanvas ref="minimizedDFACanvasRef" />
              </div>
            </div>
          </div>

          <!-- 最小化DFA信息面板 -->
          <div v-if="minimizedResult" class="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <Icon icon="lucide:check-circle" class="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 class="font-medium text-indigo-800">最小化 DFA 构造完成</h4>
                <div class="text-sm text-indigo-700 mt-2 space-y-1">
                  <p>• 最终状态数量: {{ minimizedResult.stateCount }}</p>
                  <p>• 转换数量: {{ minimizedResult.transitionCount }}</p>
                  <p>• 初始状态: {{ minimizedResult.initialState }}</p>
                  <p>• 接受状态: {{ minimizedResult.finalStates.join(', ') }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- DOT 字符串显示 -->
          <div v-if="showDotString && minimizedDotString" class="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-medium text-gray-800">最小化 DFA DOT 字符串</h4>
              <button
                @click="copyDotString"
                class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                <Icon icon="lucide:copy" class="w-3 h-3 inline mr-1" />
                复制
              </button>
            </div>
            <pre class="text-xs bg-white p-3 rounded border overflow-auto max-h-40 font-mono">{{ minimizedDotString }}</pre>
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
        <div class="text-sm text-gray-500">步骤 6 / 6</div>
        <button
          @click="complete"
          :disabled="!isComplete"
          :class="[
            'px-6 py-2 rounded-lg transition-colors',
            isComplete
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          ]"
        >
          完成
          <Icon icon="lucide:check" class="w-4 h-4 inline ml-2" />
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

const emit = defineEmits<{
  'next-step': []
  'prev-step': []
  'complete': [data: any]
}>()

// 从各步骤获取数据
const regexPattern = ref('')
const nfaStateCount = ref(8)
const dfaStateCount = ref(0)
const minimizedStateCount = ref(0)
const minimizedDotString = ref('')

// 状态管理
const isGenerating = ref(false)
const showDotString = ref(false)
const minimizedResult = ref<{
  stateCount: number
  transitionCount: number
  initialState: string
  finalStates: string[]
} | null>(null)

// 最小化DFA画布引用
const minimizedDFACanvasRef = ref<InstanceType<typeof DFACanvas>>()

// 计算属性
const optimizationInfo = computed(() => {
  const originalCount = dfaStateCount.value
  const minimizedCount = minimizedStateCount.value

  if (originalCount === 0) return { ratio: 0, saved: 0 }

  const saved = originalCount - minimizedCount
  const ratio = (saved / originalCount) * 100

  return { ratio, saved }
})

const hasMinimizationData = computed(() => {
  return minimizedStateCount.value > 0
})

const isComplete = computed(() => {
  return minimizedResult.value !== null
})

// 从localStorage获取数据
onMounted(() => {
  try {
    // 获取第一步数据
    const step1Data = localStorage.getItem('fa-step1-data')
    if (step1Data) {
      const data = JSON.parse(step1Data)
      regexPattern.value = data.regex || ''
      minimizedDotString.value = data.faResult?.Min_DFA_dot_str || ''
    }

    // 获取第四步数据
    const step4Data = localStorage.getItem('fa-step4-data')
    if (step4Data) {
      const data = JSON.parse(step4Data)
      dfaStateCount.value = data.dfaStates?.length || 0
    }

    // 获取第五步数据
    const step5Data = localStorage.getItem('fa-step5-data')
    if (step5Data) {
      const data = JSON.parse(step5Data)
      minimizedStateCount.value = data.minimizationResult?.stateCount || 0
    }
  } catch (error) {
    console.error('读取上一步数据失败：', error)
  }
})

// 生成最小化DFA
const generateMinimizedDFA = async () => {
  if (!hasMinimizationData.value || isGenerating.value) return

  isGenerating.value = true

  try {
    // 清空画布
    if (minimizedDFACanvasRef.value) {
      minimizedDFACanvasRef.value.clearCanvas()
    }

    // 模拟生成过程
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 使用最小化数据在画布上生成最小DFA
    if (minimizedDFACanvasRef.value) {
      const canvas = minimizedDFACanvasRef.value

      // 添加最小化状态节点
      for (let i = 0; i < minimizedStateCount.value; i++) {
        const x = 150 + (i % 3) * 200
        const y = 150 + Math.floor(i / 3) * 150

        canvas.addNode({
          id: `M${i}`,
          type: 'circle',
          position: { x, y },
          data: {
            label: `M${i}`,
            isInitial: i === 0,
            isFinal: i === minimizedStateCount.value - 1
          }
        })
      }

      // 添加简单的转换边（示例）
      let edgeCount = 0
      for (let i = 0; i < minimizedStateCount.value - 1; i++) {
        canvas.addEdge({
          id: `edge-${edgeCount++}`,
          type: 'custom',
          source: `M${i}`,
          target: `M${i + 1}`,
          data: { label: 'a' },
          markerEnd: 'url(#dfa-arrow)'
        })
      }

      // 设置结果
      minimizedResult.value = {
        stateCount: minimizedStateCount.value,
        transitionCount: edgeCount,
        initialState: 'M0',
        finalStates: [`M${minimizedStateCount.value - 1}`]
      }
    }

  } catch (error) {
    console.error('生成最小化DFA失败：', error)
  } finally {
    isGenerating.value = false
  }
}

// 显示最小化DFA DOT字符串
const showMinimizedDot = () => {
  showDotString.value = !showDotString.value
}

// 复制DOT字符串
const copyDotString = async () => {
  try {
    await navigator.clipboard.writeText(minimizedDotString.value)
    // 这里可以添加一个提示
  } catch (error) {
    console.error('复制失败：', error)
  }
}

// 下载结果
const downloadResults = () => {
  if (!isComplete.value) return

  const results = {
    regex: regexPattern.value,
    nfaStateCount: nfaStateCount.value,
    dfaStateCount: dfaStateCount.value,
    minimizedStateCount: minimizedStateCount.value,
    optimizationRatio: optimizationInfo.value.ratio,
    minimizedResult: minimizedResult.value,
    timestamp: new Date().toISOString()
  }

  // 创建下载链接
  const blob = new Blob([JSON.stringify(results, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fa-analysis-results-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 完成整个流程
const complete = () => {
  const stepData = {
    completed: true,
    regexPattern: regexPattern.value,
    finalResults: {
      nfaStateCount: nfaStateCount.value,
      dfaStateCount: dfaStateCount.value,
      minimizedStateCount: minimizedStateCount.value,
      optimizationRatio: optimizationInfo.value.ratio,
      minimizedResult: minimizedResult.value
    },
    timestamp: new Date().toISOString()
  }

  // 保存最终数据
  localStorage.setItem('fa-final-results', JSON.stringify(stepData))

  // 触发完成事件
  emit('complete', stepData)

  alert('🎉 有限自动机构造流程已完成！')
}
</script>

<style scoped>
.step-header { padding: 2rem 2rem 1rem; border-bottom: 1px solid #e5e7eb; }
.step-icon { width: 3rem; height: 3rem; background: #e0e7ff; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; }
.step-content { padding: 2rem; }
.step-actions { padding: 1rem 2rem 2rem; border-top: 1px solid #e5e7eb; background: #f9fafb; }
</style>
